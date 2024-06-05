import * as AES from 'crypto-js/aes';
import * as ENC from 'crypto-js/enc-utf8';
import * as cryp from 'crypto-browserify';
import * as uuid from 'uuid';
import { KeystoreItem } from "@/helper/keyring"
import { Utils, Crypto } from 'chrome-v3-irishub/dist/src/utils';
import { client } from '@/helper/sdkHelper';

export const aesEncrypt = (password: string) => {
  // 调用crypto-js中的aes加密
  return AES.encrypt(password, password).toString()
}

export const aesDecrypt = (decrypt: string, password: string) => {
  // 调用crypto-js中的aes解密
  return AES.decrypt(decrypt, password).toString(ENC)
}


// keystore加密算法，将助记词加密进keystore文件
export const encryptFromMnemonic = (name: string, password: string, mnemonic: string) => {
  const salt = cryp.randomBytes(32);
  const iv = cryp.randomBytes(16);
  const cipherAlg = 'aes-128-ctr';

  const kdf = 'pbkdf2';
  const kdfparams = {
    dklen: 32,
    salt: salt.toString('hex'),
    c: 262144,
    prf: 'hmac-sha256',
  };

  const derivedKey = cryp.pbkdf2Sync(
    Buffer.from(password),
    salt,
    kdfparams.c,
    kdfparams.dklen,
    'sha256'
  );
  const cipher = cryp.createCipheriv(cipherAlg, derivedKey.slice(0, 16), iv);
  if (!cipher) {
    throw new Error('Unsupported cipher');
  }

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(mnemonic)),
    cipher.final(),
  ]);
  const bufferValue = Buffer.concat([derivedKey.slice(16, 32), ciphertext]);
  const privateKeyHex = Crypto.getPrivateKeyFromMnemonic(mnemonic)
  const prefix = client.config.bech32Prefix.AccAddr
  return {
    version: 1,
    name: name,
    id: uuid.v4({
      random: cryp.randomBytes(16),
    }),
    address: Crypto.getAddressFromPrivateKey(privateKeyHex, prefix),
    crypto: {
      ciphertext: ciphertext.toString('hex'),
      cipherparams: {
        iv: iv.toString('hex'),
      },
      cipher: cipherAlg,
      kdf,
      kdfparams,
      // mac must use sha3 according to web3 secret storage spec
      mac: Utils.sha3(bufferValue.toString('hex')),
    },
  };
}

export const decryptFromMnemonic = (
  json: KeystoreItem,
  password: string
): string => {

  const kdfparams = json.crypto.kdfparams;

  const derivedKey = cryp.pbkdf2Sync(
    Buffer.from(password),
    Buffer.from(kdfparams.salt, 'hex'),
    kdfparams.c,
    kdfparams.dklen,
    'sha256'
  );
  const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex');

  const decipher = cryp.createDecipheriv(
    json.crypto.cipher,
    derivedKey.slice(0, 16),
    Buffer.from(json.crypto.cipherparams.iv, 'hex')
  );

  const mnemonic = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString();
  return mnemonic;
}

export const pasDecrypt = (password: string, keystore: KeystoreItem) => {
  const derivedKey = cryp.pbkdf2Sync(
    Buffer.from(password),
    Buffer.from(keystore.crypto.kdfparams.salt, "hex"),
    keystore.crypto.kdfparams.c,
    keystore.crypto.kdfparams.dklen,
    'sha256'
  );
  const bufferValue = Buffer.concat([derivedKey.slice(16, 32), Buffer.from(keystore.crypto.ciphertext, "hex")]);

  const mac = Utils.sha3(bufferValue.toString('hex'))
  return mac === keystore.crypto.mac
}

// 根据助记词、密码 得到 address
export const getAddressFromMnemonic = (mnemonic: string) => {
  const privateKeyHex = Crypto.getPrivateKeyFromMnemonic(mnemonic)
  const prefix = client.config.bech32Prefix.AccAddr
  return Crypto.getAddressFromPrivateKey(privateKeyHex, prefix)
}
