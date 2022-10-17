"use strict";
console.log('========inject irishub')
const irisWallet = {
    signRequest() {
        const signMessage = {
            type: "sign-request"
        };
        return new Promise((resolve, reject) => {
            const receiveResponse = (e) => {
                const response = e.data;
                if (!response || response.type !== "sign-request-response") {
                    return;
                }
                window.removeEventListener("message", receiveResponse);
                if (!response) {
                    reject(new Error("Result is null"));
                    return;
                }
                resolve(response);
                console.log('======inject', response)
            };
            window.addEventListener("message", receiveResponse);
            window.postMessage(signMessage, window.location.origin);
        });
    }
};
window.irisWallet = irisWallet;