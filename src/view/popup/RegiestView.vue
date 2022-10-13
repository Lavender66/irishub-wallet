<template>
  <div class="account">
    <div v-if="step === 'first'" class="first-step">
      <a-button @click="newAccount">Create new account </a-button>
      <a-button style="margin-top: 20px" @click="importAccount">Import existing account </a-button>
    </div>
    <div v-if="step === 'second'">
      <!-- 创建新账号 -->
      <div v-if="flag === 'new'">
        <p>Account name:</p>
        <a-input v-model:value="account.name" />
        <p style="margin-top: 20px;">Account password:</p>
        <a-input v-model:value="account.password"/>
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
import { onMounted, reactive, ref } from "vue";
import { keyAddFunc } from "../../helper/sdkHelper"
import { aesEncrypt, aesDecrypt } from "../../helper/aes"
import { saveValue, getValue } from "../../helper/storageService"
// 判断是第一步还是第二步
const step = ref<string>("first");
const flag = ref<string>("new");
// 判断是否是第一次注册账号，第一次注册账号有密码
const account = reactive<{
  mnemonic: string;
  name: string;
  password: string;
  isFirst: boolean;
}>({
  mnemonic: "",
  name: "name",
  password: "p",
  isFirst: false,
});

onMounted(() => {
  //读取chrome.storage中的当前账户信息
  // curAccountFunc()
});
// 生成新账号
const newAccount = async () => {
  step.value = "second";
  const { curKey } = await getValue('curKey') as any
  if (!curKey) { 
    account.isFirst = true 
  } else {
    account.isFirst = false
  }
};

// 导入账号
const importAccount = () => {
  console.log('=====')
}

// 生成钱包
const newWallet = async () => {
  // 用户名和密码存到chrome.storage.local
  // 如果是第一次注册，需要输入密码
  if (account.name && account.password) {
    const result = keyAddFunc(account.name, account.password)
    account.mnemonic = result.decryptMnemonic
    // 先把wallet信息存到本地, keplr是通过Crypto加密的，demo简单点，通过aes加上密码加密在本地
    // 1、先加密
    const pasEncrypt = aesEncrypt(account.password);
    // 2、本地存储name type 密码的加密结果, 多账户时，需存下全部的账号信息
    // 这里
    const { keysStore } = await getValue('keysStore') as any
    if (keysStore) {
      const temp = JSON.parse(keysStore)
      temp.push({
        type: 'mnemonic',
        mnemonic: result.wallet.mnemonic,
        name: account.name,
      })
      const local = {
        curKey: {
          type: 'mnemonic',
          mnemonic: result.wallet.mnemonic,
          name: account.name,
        },
        keysStore: JSON.stringify(temp),
      }
      saveValue(local);
    } else {
      const local = {
        curKey: {
          type: 'mnemonic',
          mnemonic: result.wallet.mnemonic,
          name: account.name,
        },
        keysStore: JSON.stringify([{
          type: 'mnemonic',
          mnemonic: result.wallet.mnemonic,
          name: account.name,
        }]),
        // mac是加密的密码
        status: 'unlock',
        mac: pasEncrypt,
      }
      saveValue(local);
    }
  }
  step.value = "third";
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
