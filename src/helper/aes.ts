import * as AES from 'crypto-js/aes';
import * as ENC from 'crypto-js/enc-utf8';


export const aesEncrypt = (password: string) => {
    // 调用crypto-js中的aes加密
    return AES.encrypt(password, password).toString()
}

export const aesDecrypt = (decrypt: string, password: string) => {
    // 调用crypto-js中的aes解密
    return AES.decrypt(decrypt, password).toString(ENC)
}