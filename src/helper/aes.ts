import CryptoJS from "crypto-js";


export const aesEncrypt = (password: string) => {
    // 调用crypto-js中的aes加密
    return CryptoJS.AES.encrypt(password, password).toString()
}

export const aesDecrypt = (password: string) => {
    // 调用crypto-js中的aes解密
    return CryptoJS.AES.decrypt(password, password).toString()
}