console.log("hello world irishub");
const container = document.head || document.documentElement;
const scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('injected.js');
scriptElement.type = 'text/javascript';
container.insertBefore(scriptElement, container.children[0]);
scriptElement.remove();
// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//     if (msg.type == 'emit keplr_keystorechange') {
//         window.dispatchEvent(new Event('keplr_keystorechange'));
//     }
// });
window.addEventListener('message', (e)=> {
    const message = e.data;
    if (!message || message.type !== 'sign-request') {
        return;
    }
    const result = chrome.runtime.sendMessage({ type: 'offline sign request' });
    console.log('======result', result)
    const request = {
        type: 'sign-request-response',
        // data: result
    };
    window.postMessage(request, e.source);
});
