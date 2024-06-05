import types from "chrome-v3-irishub/dist/src/types"
import { getValue, saveValue } from "@/helper/storage"
import { keyAddFunc, keyRecoverFunc, keyMnemonicEncrypt } from "@/helper/sdkHelper"
import { Crypto } from "chrome-v3-irishub"
import { pasDecrypt, encryptFromMnemonic, decryptFromMnemonic, getAddressFromMnemonic } from "@/util/crypto"
import { makeObservable } from "mobx";
import { Vault, PlainObject, VaultService } from "./vault"
import { Buffer } from "buffer/";
import { Mnemonic } from "@/util/mnemonic";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bip39 = require("bip39");
// 钱包的状态
export enum KeyRingStatus {
  EMPTY,
  LOCKED,
  UNLOCKED,
}

export type KeystoreItem = types.Keystore & {
  name: string
}

export type MultiKeyStoreInfo = KeystoreItem[];
export type MultiKeyStoreInfoWithSelectedElem = KeystoreItem & {
  selected: boolean;
};
export type MultiKeyStoreInfoWithSelected = MultiKeyStoreInfoWithSelectedElem[];


export interface KeyInfo {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly isSelected: boolean;
  readonly insensitive: PlainObject;
}

export class KeyRing {
  /**
   * 当前钱包状态
   */
  public status: KeyRingStatus;
  /**
   * 当前账户的keyStore文件
   */
  private keyStore: KeystoreItem | null;
  /**
   * 全部账户的keyStore文件
   */
  private multiKeyStore: KeystoreItem[];
  /**
   * 钱包的密码
   */
  private password: string;
  constructor() {
    this.keyStore = null;
    this.multiKeyStore = [];
    this.status = KeyRingStatus.EMPTY;
    this.password = ""
  }

  /**
   * 往localstorage里存储账户的keystore文件
   */
  public async save() {
    await saveValue({ "keyStore": this.keyStore });
    await saveValue({ "keyMultiStore": this.multiKeyStore });
  }
  /**
   * 初始化
   */
  public async restore(): Promise<{
    status: KeyRingStatus;
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
    keystore: KeystoreItem | null;
  }> {
    // 只要没有多账户信息，那么便没有添加过账户
    const keyMultiStore= await getValue("keyMultiStore");
    const keyStore = await getValue("keyStore");
    if (!keyMultiStore) {
      this.multiKeyStore = [];
      this.keyStore = null;
      await this.save()
    } else {
      this.multiKeyStore = keyMultiStore;
      this.keyStore = keyStore;
    }
    this.status = this.getStatus()
    return {
      status: this.getStatus(),
      multiKeyStoreInfo: this.getMultiKeyStoreInfo(),
      keystore: this.keyStore
    }
  }

  private static getKeyStoreId(keyStore: KeystoreItem): string {
    const id = keyStore.id;
    if (!id) {
      throw new Error("Key store's id is empty");
    }
    return id;
  }

  private getKeyStore(id: string): KeystoreItem | undefined {
    return this.multiKeyStore.find(item => { return item.id === id })
  }

  public getStatus(): KeyRingStatus {
    if (!this.keyStore) {
      return KeyRingStatus.EMPTY
    } else if (!this.password) {
      return KeyRingStatus.LOCKED
    } else {
      return KeyRingStatus.UNLOCKED
    }
  }

  public getMultiKeyStoreInfo(): MultiKeyStoreInfoWithSelected {
    const result: MultiKeyStoreInfoWithSelected = [];
    for (const keyStore of this.multiKeyStore) {
      result.push({
        version: keyStore.version,
        name: keyStore.name,
        id: keyStore.id,
        crypto: keyStore.crypto,
        address: keyStore.address,
        selected: this.keyStore
          ? KeyRing.getKeyStoreId(keyStore) ===
          KeyRing.getKeyStoreId(this.keyStore)
          : false,
      });
    }

    return result;
  }
  // 添加助记词与密码
  public async createMnemonicKey(
    name: string,
    password: string,
  ): Promise<{
    status: KeyRingStatus;
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
    keystore: KeystoreItem;
    decryptMnemonic: string;
  }> {
    if (this.status !== KeyRingStatus.EMPTY) {
      throw new Error(
        "Key ring is not empty"
      );
    }
    this.password = password;
    // 生成助记词
    const mnemonic = Crypto.generateMnemonic()
    // 生成keystore文件，加密助记词
    const keystore = encryptFromMnemonic(name, password, mnemonic)
    this.keyStore = keystore
    this.multiKeyStore.push(keystore);
    await this.save();
    this.status = this.getStatus()

    return {
      status: this.getStatus(),
      multiKeyStoreInfo: await this.getMultiKeyStoreInfo(),
      keystore: this.keyStore,
      decryptMnemonic: mnemonic
    };
  }
  // 添加助记词
  public async addMnemonicKey(
    name: string
  ): Promise<{
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
    decryptMnemonic: string;
  }> {
    if (this.status !== KeyRingStatus.UNLOCKED) {
      throw new Error(
        "Key ring is not unlocked"
      );
    }
    // 生成助记词
    const mnemonic = Crypto.generateMnemonic()
    const keystore = encryptFromMnemonic(name, this.password, mnemonic)
    this.multiKeyStore.push(keystore);
    await this.save();

    return {
      multiKeyStoreInfo: await this.getMultiKeyStoreInfo(),
      decryptMnemonic: mnemonic
    };
  }
  // 导入助记词与密码
  public async importMnemonicKeyAndPassword(
    name: string,
    password: string,
    mnemonic: string,
  ): Promise<{
    status: KeyRingStatus;
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
    keystore: KeystoreItem;
  }> {
    if (this.status !== KeyRingStatus.EMPTY) {
      throw new Error(
        "Key ring is not empty"
      );
    }
    this.password = password;
    const keystore = encryptFromMnemonic(name, this.password, mnemonic)
    this.keyStore = keystore
    this.multiKeyStore.push(keystore);
    await this.save();
    this.status = this.getStatus()

    return {
      status: this.getStatus(),
      multiKeyStoreInfo: await this.getMultiKeyStoreInfo(),
      keystore: this.keyStore,
    };
  }
  // 添加助记词
  public async importMnemonicKey(
    name: string,
    mnemonic: string,
  ): Promise<{
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
  }> {
    if (this.status !== KeyRingStatus.UNLOCKED) {
      throw new Error(
        "Key ring is not unlocked"
      );
    }
    const keystore = encryptFromMnemonic(name, this.password, mnemonic)
    this.multiKeyStore.push(keystore);
    await this.save();

    return {
      multiKeyStoreInfo: await this.getMultiKeyStoreInfo(),
    };
  }
  public lock() {
    if (this.status !== KeyRingStatus.UNLOCKED) {
      throw new Error("Key ring is not unlocked");
    }
    this.password = "";
    this.status = KeyRingStatus.LOCKED
  }

  public unlock(password: string): boolean {
    if (!this.keyStore) {
      throw new Error("Key ring not initialized");
    }
    const res = pasDecrypt(password, this.keyStore)
    if (res) {
      this.password = password;
      this.status = KeyRingStatus.UNLOCKED
    }
    return res
  }

  public async changeAccount(
    id: string,
  ): Promise<{
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
    keystore: KeystoreItem;
  }> {
    if (this.status !== KeyRingStatus.UNLOCKED) {
      throw new Error(
        "Key ring is not unlocked"
      );
    }
    this.keyStore = this.getKeyStore(id) as KeystoreItem
    await this.save();
    return {
      multiKeyStoreInfo: this.getMultiKeyStoreInfo(),
      keystore: this.keyStore,
    };
  }

  public viewMnemnic(password: string, id: string): string {
    if (this.status !== KeyRingStatus.UNLOCKED) {
      throw new Error(
        "Key ring is not unlocked"
      );
    }
    const keyStore = this.getKeyStore(id) as KeystoreItem
    if (password !== this.password) {
      return "false"
    } else {
      const res = decryptFromMnemonic(keyStore, password)
      return res
    }
  }

  public async deleteKeyRing(
    password: string,
    index: number,
  ): Promise<{
    multiKeyStoreInfo: MultiKeyStoreInfoWithSelected;
    result: string;
    keystore: KeystoreItem | null;
  }> {
    let result = ""
    if (this.status !== KeyRingStatus.UNLOCKED) {
      result = "Key ring is not unlocked"
      return {
        multiKeyStoreInfo: this.getMultiKeyStoreInfo(),
        keystore: this.keyStore,
        result,
      }
    }

    if (this.password !== password) {
      result = "password is not correct"
      return {
        multiKeyStoreInfo: this.getMultiKeyStoreInfo(),
        keystore: this.keyStore,
        result,
      }
    }

    const keyStore = this.multiKeyStore[index];

    const multiKeyStore = this.multiKeyStore
      .slice(0, index)
      .concat(this.multiKeyStore.slice(index + 1));

    this.multiKeyStore = multiKeyStore;
    if (this.multiKeyStore.length > 0) {
      // 删除的是选中的账号，便顺移，将下一位的keystore置为选中
      if (KeyRing.getKeyStoreId(keyStore) === KeyRing.getKeyStoreId(this.keyStore as KeystoreItem)) {
        this.keyStore = this.multiKeyStore[0]
      }
    } else {
      // 如果删除掉没有账号了，删除成功之后便跳到新增账号页面
      this.keyStore = null
    }

    await this.save();
    return {
      multiKeyStoreInfo: this.getMultiKeyStoreInfo(),
      keystore: this.keyStore,
      result,
    };
  }
}

export class KeyRingServive {
  protected _selectedVaultId: string | undefined = undefined;
  constructor(
    protected readonly vaultService: VaultService,
  ) {
    makeObservable(this);
  }

  get keyRingStatus(): KeyRingStatus {

    if (
      !this.vaultService.isSignedUp ||
      this.vaultService.getVaults("keyRing").length === 0
    ) {
      return KeyRingStatus.EMPTY;
    }

    return this.vaultService.isLocked ? KeyRingStatus.LOCKED : KeyRingStatus.UNLOCKED;
  }

  getKeyRingVaults(): Vault[] {
    return this.vaultService.getVaults("keyRing");
  }

  getKeyInfos(): KeyInfo[] {
    return this.getKeyRingVaults().map((vault) => {
      return {
        id: vault.id,
        name: vault.insensitive["keyRingName"] as string,
        address: vault.insensitive["keyRingAddress"] as string,
        type: vault.insensitive["keyRingType"] as string,
        isSelected: this._selectedVaultId === vault.id,
        insensitive: vault.insensitive,
      };
    });
  }

  async createMnemonicKeyRing(mnemonic: string, name: string, password?: string): Promise<string> {

    // 如果没有密码，则说明没有注册过
    if (!this.vaultService.isSignedUp) {
      if (!password) {
        throw new Error("Must provide password to sign in to vault");
      }

      await this.vaultService.signUp(password);
    }

    const vaultData = await this.createKeyRingVaultByMnemonic(mnemonic);

    const id = this.vaultService.addVault(
      "keyRing",
      {
        ...vaultData.insensitive,
        keyRingName: name,
        keyRingType: "mnemonic",
        keyRingAddress: getAddressFromMnemonic(mnemonic),
      },
      vaultData.sensitive
    );

    this._selectedVaultId = id;
    return id;
  }

  createKeyRingVaultByMnemonic(
    mnemonic: string,
    bip44Path?: {
      account: number;
      change: number;
      addressIndex: number;
    }
  ): Promise<{
    insensitive: PlainObject;
    sensitive: PlainObject;
  }> {
    if (!mnemonic || typeof mnemonic !== "string") {
      throw new Error("Invalid arguments");
    }

    // Validate mnemonic.
    // Checksome shouldn't be validated in this method.
    // try {
    //   bip39.mnemonicToEntropy(mnemonic);
    // } catch (e) {
    //   if (e?.message !== "Invalid mnemonic checksum") {
    //     throw e;
    //   }
    // }

    const masterSeed = Mnemonic.generateMasterSeedFromMnemonic(mnemonic);
    const masterSeedText = Buffer.from(masterSeed).toString("hex");

    return Promise.resolve({
      insensitive: {
        bip44Path,
      },
      sensitive: {
        masterSeedText,
        mnemonic,
      },
    });
  }
}