"use strict";
console.log('========inject irishub')
// const irisWallet = {
//     signRequest(unsigntx, basetx) {
//         const signMessage = {
//             type: "sign-request",
//             data: {
//                 unsigntx,
//                 basetx
//             },
//         };
//         return new Promise((resolve, reject) => {
//             const receiveResponse = (e) => {
//                 const response = e.data;
//                 if (!response || response.type !== "sign-request-response") {
//                     return;
//                 }
//                 window.removeEventListener("message", receiveResponse);
//                 if (!response) {
//                     reject(new Error("Result is null"));
//                     return;
//                 }
//                 resolve(response);
//             };
//             window.addEventListener("message", receiveResponse);
//             window.postMessage(signMessage, window.location.origin);
//         });
//     }
// };
// window.irisWallet = irisWallet;