import { defineStore } from "pinia"
import { KeyInfo, KeyRingStatus } from "@/helper/keyring"
import {
  UNLOCK_KEYRING,
  LOCK_KEYRING,
  SELECT_KEYRING,
  SHOW_SENSITIVE_KEYRING_DATA,
  GET_KEYRING_STATUS,
  GET_KEYRING_STATUS_ONLY,
  NEW_MNEMONIC_KEY,
  DELETE_KEYRING,
  NEW_PRIVATE_KEY_KEY,
} from "@/constant/message"
export const useKeyRingStore = defineStore("keyRing", {
  state: () => {
    return {
      status: KeyRingStatus.EMPTY,
      multiKeyStoreInfo: [],
      keystore: null,
      keyInfos: [],
      valutId: null,
    }
  },
  getters: {
    selectKeyInfo: (state): KeyInfo | undefined => {
      return state.keyInfos?.find((keyInfo: KeyInfo) => keyInfo.isSelected);
    }
  },
  actions: {
    // 得到钱包当前状态
    getKeyRingStatusOnly() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: GET_KEYRING_STATUS_ONLY }, result => {
          this.status = result.status;
          resolve("success")
        })
      })
    },
    // 得到钱包当前状态与chrome.storage中存的账号信息
    refreshKeyRingStatus() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: GET_KEYRING_STATUS }, result => {
          this.status = result.status;
          this.keyInfos = result.keyInfos;
          resolve("success")
        })
      })
    },
    // 根据助记词\密码创建账号
    createMnemonicKeyRing(account: object) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: NEW_MNEMONIC_KEY,
          data: {
            ...account
          }
        }, result => {
          this.status = result.status;
          this.keyInfos = result.keyInfos;
          this.valutId = result.valutId;
          resolve("success")
        })
      })
    },
    // 根据私钥\密码创建账号
    // TODO 此函数没有调试
    newPrivateKeyKey(account: object) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: NEW_PRIVATE_KEY_KEY,
          data: {
            ...account
          }
        }, result => {
          this.status = result.status;
          this.keyInfos = result.keyInfos;
          this.valutId = result.valutId;
          resolve("success")
        })
      })
    },
    // 锁定
    lock() {
      chrome.runtime.sendMessage({
        type: LOCK_KEYRING
      }, result => {
        this.status = result.status;
      })
    },
    // 解锁
    unlock(password: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: UNLOCK_KEYRING,
          data: password
        }, result => {
          this.status = result.status;
          this.keyInfos = result.keyInfos;
          resolve(result.status)
        })
      })
    },
    // 查看助记词或者私钥
    viewMnemonic(password: string, id: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: SHOW_SENSITIVE_KEYRING_DATA,
          data: {
            password, id
          }
        }, (result) => {
          if (result === "false") {
            reject()
          } else {
            resolve(result)
          }
        })
      })
    },
    // 删除账号
    delAccount(password: string, id: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: DELETE_KEYRING,
          data: {
            id,
            password,
          }
        }, (result) => {
          this.status = result.status;
          this.keyInfos = result.keyInfos;
          resolve("success")
        })
      })
    },
    // 切换账号
    changeAccount(id: string) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: SELECT_KEYRING,
          data: {id}
        }, (result) => {
          this.status = result.status;
          this.keyInfos = result.keyInfos
          resolve("success")
        })
      })
    },

  }
})
// 存储密码 https://www.jianshu.com/p/c0df0a05d5b9 https://www.jianshu.com/p/ca5c104b6af2

