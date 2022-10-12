<template>
  <div class="account">
    <div v-if="step === 'first'" class="first-step">
      <a-button @click="newAccount">Create new account </a-button>
      <a-button style="margin-top: 20px">Import existing account </a-button>
    </div>
    <div v-if="step === 'second'">
      <!-- 创建新账号 -->
      <div v-if="flag === 'new'">
        <p>Account name:</p>
        <a-input v-model:value="account.name" />
        <p style="margin-top: 20px;">Account password:</p>
        <a-input v-model:value="account.password" />
        <a-button type="primary" @click="newWallet" style="margin-top: 20px;">Regiest</a-button>
      </div>
      <a-button type="link" @click="() => { step = 'first'}">Back</a-button>
    </div>
    <div v-if="step === 'third'">
      <p style="margin-top: 20px;">Mnemonic Seed</p>
      <p>{{ account.mnemonic }}</p>
      <a-button type="primary">Success</a-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import { keyAddFunc } from "../../helper/sdkHelper"
import { aesEncrypt } from "../../helper/aes"
import { saveValue } from "../../helper/storageService"
// 判断是第一步还是第二步
const step = ref<string>("first");
const flag = ref<string>("new");
const account = reactive<{
  mnemonic: string;
  name: string;
  password: string;
}>({
  mnemonic: "",
  name: "name",
  password: "password",
});


// onMounted(() => {
// });
// 生成新账号
const newAccount = () => {
  step.value = "second";
};

// 生成钱包
const newWallet = () => {
  // 用户名和密码存到chrome.storage.local
  if (account.name && account.password) {
    const result = keyAddFunc(account.name, account.password)
    account.mnemonic = result.decryptMnemonic
    // 先把wallet信息存到本地, keplr是通过Crypto加密的，demo简单点，通过aes加上密码加密在本地
    // 1、先加密
    const pasEncrypt = aesEncrypt(account.password);
    console.log('=====', pasEncrypt)
    // 2、本地存储name type 密码的加密结果
    const local = {
      'cur-key': {
        type: 'mnemonic',
        mnemonic: result.wallet.mnemonic,
        // mac是加密的密码
        mac: pasEncrypt,
        name: account.name
      }
    }
    saveValue(local);
    step.value = "third";
  }

}
</script>

<style lang="scss">
.account {
  .first-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>
