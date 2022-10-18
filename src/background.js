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
            }).then(async (res) => {
                const tabId = res.tabs[0].id;
                // complete 会触发两次
                chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
                    if (tabId === _tabId && changeInfo.status === "complete") {
                        chrome.tabs.sendMessage(tabId, { type: "service worker sign", data: msg.data })
                    }
                });
                this.signMap.set(tabId, {
                    onApprove: resolve,
                    onReject: reject,
                });
                console.log('------signMap', this.signMap)
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
    reject(id) {
        if (this.signMap.has(id)) {
            this.signMap.get(id).onReject(new Error("Request rejected"));
            this.signMap.delete(id);
        }
    }
}
const signService = new SignService();

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    // if (msg.type === 'offline sign request') {
    //     offlineSignRequest(msg).then(res => {
    //         console.log('======approve', res)
    //         sendResponse(res)
    //     })
    //     return true;
    // }
    if (msg.type === 'offline sign request') {
        (async () => {
            var key = await signService.wait(msg)
            console.log('======approve', res)
            sendResponse(key);
        })();
        return true;
    }
    if (msg.type === 'sign approved') {
        signService.approve(sender.tab?.id, msg.data)
    }
    return true;
});

const offlineSignRequest = async (msg) => {
    return await signService.wait(msg)
}