
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
    DELETE_ACCOUNT
} from "@/constant/message"
import { KeyRing } from "@/helper/keyring"
// 初始化密钥函数，将解码之后的密码保存在内存
const keyring = new KeyRing()

// 窗口更新complete触发两次
// class SignService {
//     constructor() {
//         this.signMap = new Map();
//     }
//     wait(msg) {
//         return new Promise((resolve, reject) => {
//             chrome.windows.create({
//                 width: 360,
//                 height: 580,
//                 url: chrome.runtime.getURL(`/popup.html#/sign?other=true`),
//                 type: 'popup',
//                 top: 80,
//             }, res => {
//                 const tabId = res.tabs[0].id;
//                 // 将listener写在外面
//                 const myListener = (_tabId, changeInfo, tab) => {
//                     if (tabId === _tabId && changeInfo.status === "complete") {
//                         console.log('=======send', tab.status, _tabId)
//                         chrome.tabs.sendMessage(_tabId, { type: "service worker sign", data: msg.data }, () => {
//                             chrome.tabs.onUpdated.removeListener(myListener)
//                         })
//                     }
//                 };
//                 chrome.tabs.onUpdated.addListener(myListener);
//                 this.signMap.set(tabId, {
//                     onApprove: resolve,
//                     onReject: reject,
//                 })
//             })
//         });
//     }
//     approve(id, result) {
//         if (this.signMap.has(id)) {
//             this.signMap.get(id).onApprove(result);
//             this.signMap.delete(id);
//         }
//     }
//     reject(id, result) {
//         if (this.signMap.has(id)) {
//             this.signMap.get(id).onReject(result);
//             this.signMap.delete(id);
//         }
//     }
// }
// const signService = new SignService();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // if (msg.type === 'offline sign request') {
    //     offlineSignRequest(msg).then(res => {
    //         sendResponse(res)
    //     }).catch(err => {
    //         console.log('======err', err)
    //         sendResponse(err)
    //     })
    //     return true;
    // }
    // if (msg.type === 'sign approved') {
    //     signService.approve(sender.tab?.id, msg.data)
    //     chrome.windows.remove(sender.tab?.windowId)
    // }
    // if (msg.type === 'sign reject') {
    //     signService.reject(sender.tab?.id, msg.data)
    //     chrome.windows.remove(sender.tab?.windowId)
    // }
    // if (msg.type === 'add password') {
    //     keyRing.updatePassword(msg.data)
    // }
    // if (msg.type === 'get password') {
    //     sendResponse(keyRing.getPassword())
    //     return true
    // }
    switch (msg.type) {
        case RESTORE_KEYRING: {
            keyring.restore().then(res => {
                sendResponse(res)
            })
            return true
        }
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
// const offlineSignRequest = async (msg) => {
//     return await signService.wait(msg)
// }