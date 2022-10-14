import { defineStore } from "pinia"
export const useWalletStore = defineStore("wallet", {
  state: () => {
    return {
      password: "",
      encryptedPassword: ""
    }
  },
  getters:{},
  actions:{}
})

