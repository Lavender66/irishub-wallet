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
        <a-input v-model:value="account.password" />
        <a-button type="primary" @click="newWallet" style="margin-top: 20px;">Regiest</a-button>
      </div>
      <div v-if="flag === 'existing'">
        <p style="margin-top: 20px;">Mnemonic Seed</p>
        <a-input style="margin-top:20px" v-model:value="impAccount.mnemonic" />
        <p style="margin-top: 20px;">Account Name</p>
        <a-input style="margin-top:20px" v-model:value="impAccount.name" />
        <a-button style="margin-top:20px" type="primary" @click="importWallet">Import</a-button>
      </div>
      <a-button type="link" @click="() => { step = 'first'}">Back</a-button>
    </div>
    <div v-if="step === 'third-new'">
      <p style="margin-top: 20px;">Mnemonic Seed</p>
      <p>{{ account.mnemonic }}</p>
      <a-button type="primary">Success</a-button>
    </div>
    <div v-if="step === 'third-existing'">
      <a-button type="primary">Success</a-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { keyAddFunc, keyRecoverFunc } from "../../helper/sdkHelper"
import { aesEncrypt, aesDecrypt } from "../../helper/aes"
import { saveValue, getValue } from "../../helper/storageService"
import { storeToRefs } from 'pinia'
import { useWalletStore } from '../../store'
const store = useWalletStore();
let { password, encryptedPassword }  = storeToRefs(store);
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
const impAccount = reactive<{
  mnemonic: string;
  name: string;
}>({
  mnemonic: "amount win cost image manage series sphere buffalo inject jacket final rug shell profit among physical monitor settle hotel file world wagon law used",
  name: "import account",
});

onMounted(() => {
  //读取chrome.storage中的当前账户信息
  // curAccountFunc()
});
// 生成新账号
const newAccount = async () => {
  step.value = "second";
  flag.value = "new"
  const { curKey } = await getValue('curKey') as any
  if (!curKey) {
    account.isFirst = true
  } else {
    account.isFirst = false
  }
};

// 导入账号
const importAccount = () => {
  step.value = "second";
  flag.value = "existing"
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
        // pina中更新
    password.value = account.password
    encryptedPassword.value = pasEncrypt
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
  step.value = "third-new";
}

// 导入钱包
const importWallet = async () => {
  console.log('=======password', password)
  if (impAccount.mnemonic && impAccount.name) {
    const { keysStore } = await getValue('keysStore') as any
    // 页面刷新之后，pina中的数据不存在
    const m = keyRecoverFunc(impAccount.name, 'p' , impAccount.mnemonic)
    if (keysStore) {
      const temp = JSON.parse(keysStore)
      temp.push({
        type: 'mnemonic',
        mnemonic: m.mnemonic,
        name: impAccount.name,
      })
      const local = {
        // curKey: {
        //   type: 'mnemonic',
        //   mnemonic: m,
        //   name: impAccount.name,
        // },
        keysStore: JSON.stringify(temp),
      }
      saveValue(local);
    }
    step.value = 'third-existing'
    console.log(JSON.parse(keysStore))
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
