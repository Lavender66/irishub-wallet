console.log("hello world irishub");
const container = document.head || document.documentElement;
const scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('injected.js');
scriptElement.type = 'text/javascript';
container.insertBefore(scriptElement, container.children[0]);
scriptElement.remove();
// window.addEventListener('message', (e) => {
//     const message = e.data;
//     // 监听离线签名的请求
//     if (!message || message.type !== 'sign-request') {
//         return;
//     }
//     // 这里需要得到签名结果
//     chrome.runtime.sendMessage({ type: 'offline sign request', data: message.data }, res => {
//         // 这里的结果要返回去
//         const request = {
//             type: 'sign-request-response',
//             data: res
//         };
//         window.postMessage(request, e.source);
//     });
// });
