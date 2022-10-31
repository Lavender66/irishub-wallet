import types from "chrome-v3-irishub/dist/src/types"
import { getValue, saveValue } from "@/helper/storageService"
import { keyAddFunc, keyRecoverFunc, keyMnemonicEncrypt } from "@/helper/sdkHelper"
import { Crypto } from "chrome-v3-irishub"
import { pasDecrypt, encryptFromMnemonic, decryptFromMnemonic } from "@/util/crypto"

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
    const { keyMultiStore } = await getValue("keyMultiStore");
    const { keyStore } = await getValue("keyStore");
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
    console.log('======this.status', this.status)
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
      console.log('=====passkey', password, id, keyStore)
      return res
    }

  }
}