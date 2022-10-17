
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'offline sign request') {
        console.log('======background, msg', msg, sender, sendResponse)
        const windowId = chrome.windows.create({
            width: 360,
            height: 580,
            url: chrome.runtime.getURL(`/popup.html`),
            type: 'popup',
            top: 80,
        }).id;
        const window = chrome.windows.get(windowId, {
            populate: true,
        });
        const tabId = window.tabs[0].id;
        // Wait until that tab is loaded
        const tab = chrome.tabs.get(tabId);
        if (tab.status === "complete") {
            return;
        }
        return new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
                if (tabId === _tabId && changeInfo.status === "complete") {
                    console.log('--------backgrone', changeInfo)
                    resolve();
                }
            });
        });
    }
});