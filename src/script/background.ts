
import {
    RESTORE_KEYRING,
    NEW_MNEMONIC_PASSWORD,
    NEW_MNEMONIC,
    UNLOCK_KEYRING,
    LOCK_KEYRING,
    IMPORT_MNEMONIC_PASSWORD,
    IMPORT_MNEMONIC,
    CHANGE_ACCOUNT,
    VIEW_MNEMONIC,
    DELETE_ACCOUNT,
    GET_KEYRING_STATUS,
    GET_KEYRING_STATUS_ONLY,
    NEW_MNEMONIC_KEY,
} from "@/constant/message"
import { KeyRing, KeyRingServive } from "@/helper/keyring"
import { VaultService } from "@/helper/vault";
// 初始化密钥函数，将解码之后的密码保存在内存
const keyring = new KeyRing();
const vaultService = new VaultService();
vaultService.init().then(() => {
    // TODO 可优化为消息管理器
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        const keyringService = new KeyRingServive(vaultService);
        switch (msg.type) {
            case GET_KEYRING_STATUS_ONLY: {
                sendResponse({
                    status: keyringService.keyRingStatus,
                })
                return true
            }
            case GET_KEYRING_STATUS: {
                sendResponse({
                    status: keyringService.keyRingStatus,
                    keyInfos: keyringService.getKeyInfos(),
                })
                return true
            }
            case NEW_MNEMONIC_KEY: {
                keyringService.createMnemonicKeyRing(msg.data.mnemonic, msg.data.name, msg.data.password).then(res => {
                    console.log('ssssssssssid', res)
                    sendResponse({
                        vaultId: res,
                        status: keyringService.keyRingStatus,
                        keyInfos: keyringService.getKeyInfos(), 
                    })
                })
                return true
            }
            // ===========================================================
            case NEW_MNEMONIC_PASSWORD: {
                keyring.createMnemonicKey(msg.data.name, msg.data.password).then(res => {
                    sendResponse(res)
                })
                return true
            }
            case NEW_MNEMONIC: {
                keyring.addMnemonicKey(msg.data.name).then(res => {
                    sendResponse(res)
                })
                return true
            }
            case IMPORT_MNEMONIC_PASSWORD: {
                keyring.importMnemonicKeyAndPassword(msg.data.name, msg.data.password, msg.data.mnemonic).then(res => {
                    sendResponse(res)
                })
                return true
            }
            case IMPORT_MNEMONIC: {
                keyring.importMnemonicKey(msg.data.name, msg.data.mnemonic).then(res => {
                    sendResponse(res)
                })
                return true
            }
            case UNLOCK_KEYRING: {
                const res = keyring.unlock(msg.data)
                sendResponse(res)
                return true
            }
            case CHANGE_ACCOUNT: {
                const res = keyring.changeAccount(msg.data)
                sendResponse(res)
                return true
            }
            case LOCK_KEYRING: {
                keyring.lock()
                break
            }
            case VIEW_MNEMONIC: {
                const res = keyring.viewMnemnic(msg.data.password, msg.data.id)
                sendResponse(res)
                return true
            }
            case DELETE_ACCOUNT: {
                keyring.deleteKeyRing(msg.data.password, msg.data.index).then(res => {
                    console.log('=====delAccount', res)
                    sendResponse(res)
                })
                return true
            }
            default:
                break
        }
    });
})
