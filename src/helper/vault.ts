import { getValue, saveValue } from "@/helper/storage"
import { VAULT_STORAGE } from "@/constant"
import pbkdf2 from "pbkdf2";
import AES, { Counter } from "aes-js";
import { Hash } from "@/util/hash";
import {
  autorun,
  runInAction,
  toJS,
  observable,
  makeObservable
} from "mobx";
import { JSONUint8Array } from "@/util/uint8-array";
import { computedFn } from "mobx-utils";


type Primitive = string | number | boolean;

export type PlainObject = {
  [key: string]: PlainObject | Primitive | undefined;
};

export interface Vault {
  id: string;
  insensitive: PlainObject;
  sensitive: Uint8Array;
}

type VaultRemovedHandler = (type: string, vaultId: string) => void;

export class VaultService {
  // 变量加了此注解，可以变成响应式变量
  @observable
  protected vaultMap: Map<string, Vault[]> = new Map(); // 全部的钱包信息存在chrome.storage
  protected onVaultRemovedHandlers: VaultRemovedHandler[] = []; // 删除的账户信息存在内存

  protected _isSignedUp = false; // 是否注册

  protected password: Uint8Array = new Uint8Array(); // 密码存在内存
  protected aesCounter: Uint8Array = new Uint8Array(); // aes算法加解密参数chrome.storage

  protected userPasswordSalt: Uint8Array = new Uint8Array(); // 密码盐值存在chrome.storage
  protected aesCounterSalt: Uint8Array = new Uint8Array(); // aes算法盐值存在chrome.storage

  protected decryptedCache: Map<string, PlainObject> = new Map(); // aes解密缓存的一些助记词、私钥的数据

  constructor() {
    // 如果要使用mobx的变量状态管理，必须先调用此函数
    makeObservable(this);
  }
  async init(): Promise<void> {
    // 此处不用getPasswordCryptoState是因为getPasswordCryptoState返回的是对象，会报错
    if (await this.getPasswordCryptoStateStatus()) {
      this._isSignedUp = true;
    }

    const userPasswordSalt = await getValue(VAULT_STORAGE.USER_PASSWORD_SALT);
    if (userPasswordSalt) {
      this.userPasswordSalt = Buffer.from(userPasswordSalt, "hex");
    } else {
      const rand = new Uint8Array(16);
      crypto.getRandomValues(rand);
      this.userPasswordSalt = rand;
      await saveValue({ [VAULT_STORAGE.USER_PASSWORD_SALT]: Buffer.from(this.userPasswordSalt).toString("hex") });
    }

    const aesCounterSalt = await getValue(VAULT_STORAGE.AES_COUNTER_SALT);
    if (aesCounterSalt) {
      this.aesCounterSalt = Buffer.from(aesCounterSalt, "hex");
    } else {
      const rand = new Uint8Array(16);
      crypto.getRandomValues(rand);
      this.aesCounterSalt = rand;
      await saveValue({ [VAULT_STORAGE.AES_COUNTER_SALT]: Buffer.from(this.aesCounterSalt).toString("hex") });
    }

    const vaultMap = await getValue(VAULT_STORAGE.VAULT_MAP)
    if (vaultMap) {
      runInAction(() => {
        for (const [key, value] of JSONUint8Array.unwrap(
          Object.entries(vaultMap)
        )) {
          this.vaultMap.set(key, value);
        }
      });
    }
    // autorun中管理的变量为响应式变量
    autorun(() => {
      const js = toJS(this.vaultMap);
      const obj = Object.fromEntries(js);
      saveValue({ [VAULT_STORAGE.VAULT_MAP]: JSONUint8Array.wrap(obj) });
    });
  }

  // 判断是否注册过钱包
  get isSignedUp(): boolean {
    return this._isSignedUp;
  }

  // 钱包是否是锁定状态
  get isLocked(): boolean {
    return this.password.length === 0;
  }


  // 确认钱包的状态
  protected ensureUnlockAndState(): void {
    if (this.isLocked) {
      throw new Error("Vault is locked");
    }

    if (this.userPasswordSalt.length === 0) {
      throw new Error("User password salt not initialized");
    }

    if (this.aesCounter.length === 0) {
      throw new Error("AES counter is null");
    }
  }

  // 根据类型和id得到钱包信息
  getVault = computedFn(
    (type: string, id: string): Vault | undefined => {
      const vaults = this.vaultMap.get(type);
      if (!vaults || vaults.length === 0) {
        return;
      }
      return vaults.find((v) => v.id === id);
    },
    {
      keepAlive: true,
    }
  );

  // 得到全部的钱包信息
  getVaults(type: string): Vault[] {
    const vaults = this.vaultMap.get(type);
    return vaults ?? [];
  }


  // 向chrome.storage中存储passwordCipher 和 userPasswordMac
  protected async setPasswordCryptoState(
    cipher: Uint8Array,
    mac: Uint8Array
  ): Promise<void> {
    await saveValue({ [VAULT_STORAGE.AES_PASSWORD_CIPHER]: Buffer.from(cipher).toString("hex") });
    await saveValue({ [VAULT_STORAGE.USER_PASSWORD_MAC]: Buffer.from(mac).toString("hex") });
  }

  // 从chrome.storage中得到passwordCipher 和 userPasswordMac 返回的是存储的值
  protected async getPasswordCryptoState(): Promise<
    | {
      cipher: Uint8Array;
      mac: Uint8Array;
    }
    | undefined
  > {
    const cipherText = await getValue(VAULT_STORAGE.AES_PASSWORD_CIPHER);
    const macText = await getValue(VAULT_STORAGE.USER_PASSWORD_MAC);

    if (cipherText && macText) {
      return {
        cipher: Buffer.from(cipherText, "hex"),
        mac: Buffer.from(macText, "hex"),
      };
    }
  }

  // 向chrome.storage中存储passwordCipher 和 userPasswordMac，如果有返回true,如果没有返回false
  protected async getPasswordCryptoStateStatus(): Promise<boolean> {
    const cipherText = await getValue(VAULT_STORAGE.AES_PASSWORD_CIPHER);
    const macText = await getValue(VAULT_STORAGE.USER_PASSWORD_MAC);

    if (cipherText && macText) {
      return true
    }
    return false
  }

  // 添加钱包前， 密码加密、aes算法参数的准备
  async signUp(userPassword: string): Promise<void> {
    if (!this.isLocked) {
      throw new Error("Vault is already unlocked");
    }

    if (this.userPasswordSalt.length === 0) {
      throw new Error("User password salt not initialized");
    }

    if (this.aesCounterSalt.length === 0) {
      throw new Error("AES counter salt not initialized");
    }

    if (
      this.isSignedUp ||
      (await this.getPasswordCryptoState()) ||
      (await getValue(VAULT_STORAGE.AES_COUNTER_CIPHER))
    ) {
      throw new Error("Vault is already signed up");
    }

    const encrypted = await VaultService.generatePassword(
      userPassword,
      this.userPasswordSalt
    );

    await this.setPasswordCryptoState(encrypted.cipher, encrypted.mac);

    const aesCounter = new Uint8Array(16);
    crypto.getRandomValues(aesCounter);
    const aesCounterCipher = VaultService.aesEncrypt(
      encrypted.password,
      this.aesCounterSalt,
      aesCounter
    );

    saveValue({ [VAULT_STORAGE.AES_COUNTER_CIPHER]: Buffer.from(aesCounterCipher).toString("hex") });

    this._isSignedUp = true;

    await this.unlock(userPassword);
  }

  // 锁定钱包，清楚密码和解密的缓存
  lock() {
    this.password = new Uint8Array(0);
    this.decryptedCache = new Map();
  }

  // 解锁钱包，存下密码和aesCounter
  async unlock(userPassword: string): Promise<void> {
    if (!this.isLocked) {
      throw new Error("Vault is already unlocked");
    }

    if (this.userPasswordSalt.length === 0) {
      throw new Error("User password salt not initialized");
    }

    if (this.aesCounterSalt.length === 0) {
      throw new Error("AES counter salt not initialized");
    }

    const aesCounterCipher = await getValue(VAULT_STORAGE.AES_COUNTER_CIPHER);
    if (!aesCounterCipher) {
      throw new Error("AES counter cipher not found");
    }

    const encrypted = await this.getPasswordCryptoState();
    
    if (!encrypted) {
      throw new Error("Vault have not been signed in");
    }

    this.password = await VaultService.decryptPassword(
      userPassword,
      this.userPasswordSalt,
      encrypted.mac,
      encrypted.cipher
    );
    this.aesCounter = VaultService.aesDecrypt(
      this.password,
      this.aesCounterSalt,
      Buffer.from(aesCounterCipher, "hex")
    );
  }

  // 添加钱包
  addVault(
    type: string,
    insensitive: PlainObject,
    sensitive: PlainObject
  ): string {
    if (!this.vaultMap.has(type)) {
      this.vaultMap.set(type, []);
    }

    const prev = this.vaultMap.get(type)!;
    const rand = new Uint8Array(8);
    crypto.getRandomValues(rand);
    const id = Buffer.from(rand).toString("hex");
    prev.push({
      id,
      insensitive,
      sensitive: this.encrypt(sensitive),
    });
    return id;
  }

  // 移除钱包
  removeVault(type: string, id: string): void {
    const vaults = this.vaultMap.get(type);
    if (!vaults || vaults.length === 0) {
      throw new Error(`There is no vault for ${id}`);
    }

    if (!vaults.find((v) => v.id === id)) {
      throw new Error(`There is no vault for ${id}`);
    }

    const newVaults = vaults.filter((v) => v.id !== id);
    this.vaultMap.set(type, newVaults);

    for (const handler of this.onVaultRemovedHandlers) {
      handler(type, id);
    }
  }

  // 如果一个钱包都没有，清除内存、chrome.storage中的存储的数据
  async clearAll(userPassword: string): Promise<void> {
    await this.checkUserPassword(userPassword);

    const prevVaults: {
      type: string;
      id: string;
    }[] = [];
    for (const [type, vaults] of this.vaultMap.entries()) {
      for (const vault of vaults) {
        prevVaults.push({
          type,
          id: vault.id,
        });
      }
    }

    runInAction(() => {
      this.vaultMap = new Map();

      this._isSignedUp = false;

      this.password = new Uint8Array();
      this.decryptedCache = new Map();

      this.aesCounter = new Uint8Array();
    });

    await Promise.all([
      saveValue({ [VAULT_STORAGE.AES_PASSWORD_CIPHER]: null }),
      saveValue({ [VAULT_STORAGE.USER_PASSWORD_MAC]: null }),
      saveValue({ [VAULT_STORAGE.AES_COUNTER_CIPHER]: null })
    ]);

    for (const prev of prevVaults) {
      for (const handler of this.onVaultRemovedHandlers) {
        handler(prev.type, prev.id);
      }
    }
  }

  // 校验密码
  async checkUserPassword(userPassword: string): Promise<void> {
    if (this.isLocked) {
      throw new Error("Vault is not unlocked");
    }

    if (this.userPasswordSalt.length === 0) {
      throw new Error("User password salt not initialized");
    }

    const prevEncrypted = await this.getPasswordCryptoState();
    if (!this.isSignedUp || !prevEncrypted) {
      throw new Error("Vault is not signed up");
    }

    // Make sure to prev user password is valid
    const password = await VaultService.decryptPassword(
      userPassword,
      this.userPasswordSalt,
      prevEncrypted.mac,
      prevEncrypted.cipher
    );

    if (
      Buffer.from(password).toString("hex") !==
      Buffer.from(this.password).toString("hex")
    ) {
      throw new Error("Password unmatched");
    }
  }

  // 根据密码得到ciper和mac
  protected static async generatePassword(
    userPassword: string,
    salt: Uint8Array
  ): Promise<{
    cipher: Uint8Array;
    mac: Uint8Array;

    password: Uint8Array;
  }> {
    const password = new Uint8Array(32);
    crypto.getRandomValues(password);

    return {
      ...(await VaultService.encryptPassword(userPassword, salt, password)),
      password,
    };
  }

  // 根据密码得到ciper和mac
  protected static async encryptPassword(
    userPassword: string,
    salt: Uint8Array,
    password: Uint8Array
  ): Promise<{
    cipher: Uint8Array;
    mac: Uint8Array;
  }> {
    const derivedKey = await VaultService.pbkdf2(
      salt,
      Buffer.from(userPassword)
    );

    const passwordCipher = VaultService.aesEncrypt(derivedKey, salt, password);

    const mac = Hash.sha256(
      Buffer.concat([
        derivedKey.slice(derivedKey.length / 2),
        passwordCipher.slice(passwordCipher.length / 2),
      ])
    );

    return {
      cipher: passwordCipher,
      mac,
    };
  }

  // 密码解密
  protected static async decryptPassword(
    userPassword: string,
    salt: Uint8Array,
    mac: Uint8Array,
    cipher: Uint8Array
  ): Promise<Uint8Array> {
    const derivedKey = await VaultService.pbkdf2(
      salt,
      Buffer.from(userPassword)
    );

    const derivedMac = Hash.sha256(
      Buffer.concat([
        derivedKey.slice(derivedKey.length / 2),
        cipher.slice(cipher.length / 2),
      ])
    );

    if (
      Buffer.from(derivedMac).toString("hex") !==
      Buffer.from(mac).toString("hex")
    ) {
      throw new Error("User password mac unmatched");
    }

    return VaultService.aesDecrypt(derivedKey, salt, cipher);
  }

  protected static pbkdf2(
    salt: Uint8Array,
    data: Uint8Array
  ): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      pbkdf2.pbkdf2(data, salt, 4000, 32, "sha256", (err: any, derivedKey: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Uint8Array(derivedKey));
        }
      });
    });
  }

  protected static aesEncrypt(
    password: Uint8Array,
    counter: Uint8Array,
    data: Uint8Array
  ): Uint8Array {
    const c = new Counter(0);
    c.setBytes(counter);
    const aesCtr = new AES.ModeOfOperation.ctr(password, c);
    return aesCtr.encrypt(data);
  }

  protected static aesDecrypt(
    password: Uint8Array,
    counter: Uint8Array,
    cipher: Uint8Array
  ): Uint8Array {
    const c = new Counter(0);
    c.setBytes(counter);
    const aesCtr = new AES.ModeOfOperation.ctr(password, c);

    return aesCtr.decrypt(cipher);
  }

  // 加密sensitive（助记词、私钥）
  protected encrypt(sensitive: PlainObject): Uint8Array {
    this.ensureUnlockAndState();

    return VaultService.aesEncrypt(
      this.password,
      this.aesCounter,
      Buffer.from(JSON.stringify(sensitive))
    );
  }

  // 解密sensitive（助记词、私钥）
  decrypt(sensitive: Uint8Array): PlainObject {
    this.ensureUnlockAndState();

    const str = Buffer.from(sensitive).toString("hex");
    const cache = this.decryptedCache.get(str);
    if (cache) {
      return cache;
    }

    const decrypted = JSON.parse(
      Buffer.from(
        VaultService.aesDecrypt(this.password, this.aesCounter, sensitive)
      ).toString()
    );
    this.decryptedCache.set(str, decrypted);

    return decrypted;
  }
}