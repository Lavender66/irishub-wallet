
import {
    UNLOCK_KEYRING,
    LOCK_KEYRING,
    SELECT_KEYRING,
    SHOW_SENSITIVE_KEYRING_DATA,
    DELETE_KEYRING,
    GET_KEYRING_STATUS,
    GET_KEYRING_STATUS_ONLY,
    NEW_MNEMONIC_KEY,
    NEW_PRIVATE_KEY_KEY,
} from "@/constant/message"
import { KeyRingServive } from "@/helper/keyring"
import { VaultService } from "@/helper/vault";
// 初始化密钥函数，将解码之后的密码保存在内存
const vaultService = new VaultService();
const keyringService = new KeyRingServive(vaultService);

// background 里面无法用await, 会报错
keyringService.init().then(() => {
    // TODO 可优化为消息管理器
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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
                    sendResponse({
                        vaultId: res,
                        status: keyringService.keyRingStatus,
                        keyInfos: keyringService.getKeyInfos(),
                    })
                })
                return true
            }
            case NEW_PRIVATE_KEY_KEY: {
                keyringService.createPrivateKeyKeyRing(msg.data.privateKey, msg.data.name, msg.data.password).then(res => {
                    sendResponse({
                        vaultId: res,
                        status: keyringService.keyRingStatus,
                        keyInfos: keyringService.getKeyInfos(),
                    })
                })
                return true
            }
            case LOCK_KEYRING: {
                keyringService.lockKeyRing()
                sendResponse({
                    status: keyringService.keyRingStatus,
                })
                return true
            }
            case UNLOCK_KEYRING: {
                keyringService.unlockKeyRing(msg.data).then(() => {
                    sendResponse({
                        status: keyringService.keyRingStatus,
                        keyInfos: keyringService.getKeyInfos()
                    })
                })
                return true
            }
            case SHOW_SENSITIVE_KEYRING_DATA: {
                keyringService.showSensitiveKeyRingData(msg.data.id, msg.data.password).then((res) => {
                    sendResponse(res)
                })
                return true
            }
            case DELETE_KEYRING: {
                keyringService.deleteKeyRing(msg.data.id, msg.data.password).then(res => {
                    sendResponse({
                        wasSelected: res,
                        status: keyringService.keyRingStatus,
                        keyInfos: keyringService.getKeyInfos()
                    })
                })
                return true
            }
            case SELECT_KEYRING: {
                keyringService.selectKeyRing(msg.data.id);
                sendResponse({
                    status: keyringService.keyRingStatus,
                    keyInfos: keyringService.getKeyInfos()
                })
                return true
            }
            default:
                break
        }
    });
})
