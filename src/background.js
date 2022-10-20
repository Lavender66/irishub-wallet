class KeyRing {
    constructor(password) {
        this.password = password;
    }
    updatePassword(password) {
        this.password = password;
    }
    getPassword() {
        return this.password
    }
}
const keyRing = new KeyRing();
// complete 会执行两次 
let completeFirst = false

// 窗口更新complete触发两次
class SignService {
    constructor() {
        this.signMap = new Map();
    }
    wait(msg) {
        return new Promise((resolve, reject) => {
            chrome.windows.create({
                width: 360,
                height: 580,
                url: chrome.runtime.getURL(`/popup.html#/sign?other=true`),
                type: 'popup',
                top: 80,
            }).then(res => {
                const tabId = res.tabs[0].id;
                // 将listener写在外面
                const myListener = (_tabId, changeInfo, tab) => {
                    if (tabId === _tabId && changeInfo.status === "complete") {
                        // if (!completeFirst) {
                        // completeFirst = true
                        chrome.tabs.sendMessage(_tabId, { type: "service worker sign", data: msg.data }, () => {
                            console.log('=======send', msg.data, tab.status)
                            chrome.tabs.onUpdated.removeListener(myListener)
                        })
                        // }
                    }
                    return
                };
                chrome.tabs.onUpdated.addListener(myListener);
                this.signMap.set(tabId, {
                    onApprove: resolve,
                    onReject: reject,
                });
            }).catch(err => {
                console.log('======windowId', err)
            })
        });
    }
    approve(id, result) {
        if (this.signMap.has(id)) {
            this.signMap.get(id).onApprove(result);
            this.signMap.delete(id);
        }
    }
    reject(id, result) {
        if (this.signMap.has(id)) {
            this.signMap.get(id).onReject(result);
            this.signMap.delete(id);
        }
    }
}
const signService = new SignService();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'offline sign request') {
        offlineSignRequest(msg).then(res => {
            sendResponse(res)
        }).catch(err => {
            console.log('======err', err)
            sendResponse(err)
        })
        return true;
    }
    if (msg.type === 'sign approved') {
        signService.approve(sender.tab?.id, msg.data)
        chrome.windows.remove(sender.tab?.windowId)
    }
    if (msg.type === 'sign reject') {
        signService.reject(sender.tab?.id, msg.data)
        chrome.windows.remove(sender.tab?.windowId)
    }
    if (msg.type === 'add password') {
        keyRing.updatePassword(msg.data)
    }
    if (msg.type === 'get password') {
        sendResponse(keyRing.getPassword())
        return true
    }
});
const offlineSignRequest = async (msg) => {
    return await signService.wait(msg)
}