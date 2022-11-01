import { defineStore } from "pinia"
import { KeyRingStatus, MultiKeyStoreInfoWithSelected } from "@/helper/keyring"
import {
  RESTORE_KEYRING,
  NEW_MNEMONIC_PASSWORD,
  NEW_MNEMONIC,
  UNLOCK_KEYRING,
  LOCK_KEYRING,
  IMPORT_MNEMONIC_PASSWORD,
  IMPORT_MNEMONIC,
  CHANGE_ACCOUNT,
  VIEW_MNEMONIC,
  DELETE_ACCOUNT
} from "@/constant/message"
export const useKeyRingStore = defineStore("keyRing", {
  state: () => {
    return {
      status: KeyRingStatus.EMPTY,
      multiKeyStoreInfo: [],
      keystore: null,
    }
  },
  getters: {
    // curStatus(): number {
    //   return this.status
    // }
  },
  actions: {
    // 去得到background里面的钱包状态
    restore() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: RESTORE_KEYRING }, result => {
          this.status = result.status;
          this.multiKeyStoreInfo = result.multiKeyStoreInfo;
          this.keystore = result.keystore
          resolve("success")
        })
      })
    },
    // 添加账号与密码
    addAccountPasswprd(account: object) {
      // 将密码传给background,存在内存
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: NEW_MNEMONIC_PASSWORD,
          data: {
            ...account
          }
        }, result => {
          this.status = result.status;
          this.multiKeyStoreInfo = result.multiKeyStoreInfo;
          this.keystore = result.keystore
          resolve(result.decryptMnemonic)
        })
      })
    },
    // 添加账号
    addAccount(account: object) {
      // 将密码传给background,存在内存
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: NEW_MNEMONIC,
          data: {
            ...account
          }
        }, result => {
          this.multiKeyStoreInfo = result.multiKeyStoreInfo;
          resolve(result.decryptMnemonic)
        })
      })
    },
    // 导入账号与密码
    importAccountPasswprd(account: object) {
      // 将密码传给background,存在内存
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: IMPORT_MNEMONIC_PASSWORD,
          data: {
            ...account
          }
        }, result => {
          this.status = result.status;
          this.multiKeyStoreInfo = result.multiKeyStoreInfo;
          this.keystore = result.keystore
          resolve("success")
        })
      })
    },
    // 导入账号
    importAccount(account: object) {
      // 将密码传给background,存在内存
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: IMPORT_MNEMONIC,
          data: {
            ...account
          }
        }, result => {
          this.multiKeyStoreInfo = result.multiKeyStoreInfo;
          resolve("success")
        })
      })
    },
    // 解锁
    unlock(password: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: UNLOCK_KEYRING,
          data: password
        }, res => {
          resolve(res)
        })
      })
    },
    // 锁定
    lock() {
      chrome.runtime.sendMessage({
        type: LOCK_KEYRING
      })
    },
    // 切换账号
    changeAccount(id: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: CHANGE_ACCOUNT,
          data: id
        }, (result) => {
          this.multiKeyStoreInfo = result.multiKeyStoreInfo;
          this.keystore = result.keystore
          resolve("success")
        })
      })
    },
    // 查看助记词
    viewMnemonic(password: string, id: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: VIEW_MNEMONIC,
          data: {
            password, id
          }
        }, (result) => {
          if(result === "false"){
            reject()
          } else {
            resolve(result)
          }
        })
      })
    },
    // 删除账号
    delAccount(password: string, index: number){
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: DELETE_ACCOUNT,
          data: {
            password, index
          }
        }, (result) => {
          console.log("------delAccount", result)
          if(result.result){
            reject(result.result)
          } else {
            this.multiKeyStoreInfo = result.multiKeyStoreInfo;
            this.keystore = result.keystore
            resolve("")
          }
        })
      })
    }
  }
})
// 存储密码 https://www.jianshu.com/p/c0df0a05d5b9 https://www.jianshu.com/p/ca5c104b6af2

