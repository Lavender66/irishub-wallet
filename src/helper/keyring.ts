import { getValue, saveValue } from "@/helper/storage"
import { getAddressFromMnemonic } from "@/util/crypto"
import { makeObservable, autorun, runInAction } from "mobx";
import { Vault, PlainObject, VaultService } from "./vault"
import { Buffer } from "buffer/";
import { Mnemonic } from "@/util/mnemonic";
import { KEYRING_STORAGE } from "@/constant"
import { observable } from "mobx"
import { PrivKeySecp256k1 } from "@/util/key"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bip39 = require("bip39");
// 钱包的状态
export enum KeyRingStatus {
  EMPTY,
  LOCKED,
  UNLOCKED,
}

export interface KeyInfo {
  readonly id: string;
  readonly address: string;
  readonly name: string;
  readonly type: string;
  readonly isSelected: boolean;
  readonly insensitive: PlainObject;
}

export class KeyRingServive {
  @observable
  protected _selectedVaultId: string | undefined = undefined;
  constructor(
    protected readonly vaultService: VaultService,
  ) { makeObservable(this); }

  async init(): Promise<void> {
    await this.vaultService.init();
    const selectedVaultId = await getValue(KEYRING_STORAGE.SELECTED_VAULT_ID);
    if (
      selectedVaultId &&
      this.vaultService.getVault("keyRing", selectedVaultId)
    ) {
      this._selectedVaultId = selectedVaultId;
    }
    autorun(async() => {
      if (this._selectedVaultId) {
        await saveValue({ [KEYRING_STORAGE.SELECTED_VAULT_ID]: this._selectedVaultId });
      } else {
        await saveValue({ [KEYRING_STORAGE.SELECTED_VAULT_ID]: null });
      }
    })
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

  get selectedVaultId(): string {
    if (
      this._selectedVaultId &&
      this.vaultService.getVault("keyRing", this._selectedVaultId)
    ) {
      return this._selectedVaultId;
    }
    const vaults = this.vaultService.getVaults("keyRing");
    if (vaults.length === 0) {
      throw new Error("Key ring is empty");
    }
    return vaults[0].id;
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

  // 根据助记词、钱包名字、密码创建钱包
  async createMnemonicKeyRing(mnemonic: string, name: string, password?: string): Promise<string> {

    // 如果没有密码，则说明没有注册过
    if (!this.vaultService.isSignedUp) {
      if (!password) {
        throw new Error("Must provide password to sign in to vault");
      }

      await this.vaultService.signUp(password);
    }

    console.log('=sssssnewname', mnemonic, name)

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

  // TODO 功能未调试
  // 根据私钥创建钱包
  async createPrivateKeyKeyRing(
    privateKey: Uint8Array,
    name: string,
    password?: string
  ): Promise<string> {
    if (!this.vaultService.isSignedUp) {
      if (!password) {
        throw new Error("Must provide password to sign in to vault");
      }

      await this.vaultService.signUp(password);
    }

    const vaultData = await this.createKeyRingVaultByPrivateKey(privateKey);

    const id = this.vaultService.addVault(
      "keyRing",
      {
        ...vaultData.insensitive,
        keyRingName: name,
        keyRingType: "private-key",
      },
      vaultData.sensitive
    );

    runInAction(() => {
      this._selectedVaultId = id;
    });

    return id;
  }

  // 锁定
  lockKeyRing(): void {
    this.vaultService.lock();
  }

  // 解锁
  async unlockKeyRing(password: string): Promise<void> {
    await this.vaultService.unlock(password);
  }

  // 根据助记词创建钱包
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
    try {
      bip39.mnemonicToEntropy(mnemonic);
    } catch (e: any) {
      if (e?.message !== "Invalid mnemonic checksum") {
        throw e;
      }
    }

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

  // 根据私钥创建钱包
  // TODO 此函数没有调试
  createKeyRingVaultByPrivateKey(privateKey: Uint8Array): Promise<{
    insensitive: PlainObject;
    sensitive: PlainObject;
  }> {
    if (!privateKey || privateKey.length === 0) {
      throw new Error("Invalid arguments");
    }

    const publicKey = Buffer.from(
      new PrivKeySecp256k1(privateKey).getPubKey().toBytes()
    ).toString("hex");

    return Promise.resolve({
      insensitive: {
        publicKey,
      },
      sensitive: {
        privateKey: Buffer.from(privateKey).toString("hex"),
      },
    });
  }

  // 查看助记词
  async showSensitiveKeyRingData(
    vaultId: string,
    password: string
  ): Promise<string> {
    if (this.vaultService.isLocked) {
      throw new Error("KeyRing is locked");
    }

    const vault = this.vaultService.getVault("keyRing", vaultId);
    if (!vault) {
      throw new Error("Vault is null");
    }

    await this.vaultService.checkUserPassword(password);

    switch (vault.insensitive["keyRingType"]) {
      case "mnemonic": {
        const sensitive = this.vaultService.decrypt(vault.sensitive);
        return sensitive["mnemonic"] as string;
      }
      case "private-key": {
        const sensitive = this.vaultService.decrypt(vault.sensitive);
        return sensitive["privateKey"] as string;
      }
      default: {
        throw new Error("Unsupported keyRing type to show sensitive data");
      }
    }
  }

  // 删除钱包
  async deleteKeyRing(vaultId: string, password: string) {
    if (this.vaultService.isLocked) {
      throw new Error("KeyRing is locked");
    }

    const vault = this.vaultService.getVault("keyRing", vaultId);
    if (!vault) {
      throw new Error("Vault is null");
    }

    await this.vaultService.checkUserPassword(password);

    const wasSelected = this.selectedVaultId === vaultId;

    this.vaultService.removeVault("keyRing", vaultId);

    if (wasSelected) {
      runInAction(() => {
        const keyInfos = this.getKeyInfos();
        if (keyInfos.length > 0) {
          this._selectedVaultId = keyInfos[0].id;
        } else {
          this._selectedVaultId = undefined;
        }
      });
    }

    if (this.getKeyRingVaults().length === 0) {
      // After deleting all keyring, sign out from the vault.
      await this.vaultService.clearAll(password);
    }

    return wasSelected;
  }

  // 切换钱包
  selectKeyRing(vaultId: string): void {
    if (this.vaultService.isLocked) {
      throw new Error("KeyRing is locked");
    }

    if (!this.vaultService.getVault("keyRing", vaultId)) {
      throw new Error("Unknown vault");
    }

    this._selectedVaultId = vaultId;

  }
}