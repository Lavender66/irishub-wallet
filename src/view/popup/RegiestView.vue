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
        <p v-if="isFirst" style="margin-top: 20px;">Password:</p>
        <a-input v-if="isFirst" v-model:value="account.password" />
        <a-button type="primary" @click="newWallet" style="margin-top: 20px;">Regiest</a-button>
      </div>
      <div v-if="flag === 'existing'">
        <p style="margin-top: 20px;">Mnemonic Seed</p>
        <a-input style="margin-top:20px" v-model:value="impAccount.mnemonic" />
        <p style="margin-top: 20px;">Account Name</p>
        <a-input style="margin-top:20px" v-model:value="impAccount.name" />
        <p v-if="isFirst" style="margin-top: 20px;">Password</p>
        <a-input v-if="isFirst" v-model:value="impAccount.password" style="margin-top:20px" />
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
import { keyAddFunc, keyRecoverFunc, keyMnemonicEncrypt } from "../../helper/sdkHelper"
import { aesEncrypt, aesDecrypt } from "../../helper/aes"
import { saveValue, getValue } from "../../helper/storageService"
// 判断是第一步还是第二步
const step = ref<string>("first");
const flag = ref<string>("new");
const storageKeysStore = ref<string>("")
// 判断是否是第一次注册账号，第一次注册账号有密码
const isFirst = ref<boolean>(false)
const account = reactive<{
  mnemonic: string;
  name: string;
  password: string;
}>({
  mnemonic: "",
  name: "add account",
  password: ""
});
const impAccount = reactive<{
  mnemonic: string;
  name: string;
  password: string;
}>({
  mnemonic: "decrease unfair barely brick brief tennis concert prison next armor steel regular ill van proud present defense visual random pond unlock struggle naive stick",
  name: "imported account",
  password: ''
});

onMounted(() => {
  //读取chrome.storage中的当前账户信息
  accountFunc()
});

const accountFunc = async () => {
  // 判断当前有没有账号，没有账号的话，需要输入密码，有账号的话，不用
  const { keysStore } = await getValue('keysStore') as any
  if (!keysStore) {
    isFirst.value = true
  } else {
    storageKeysStore.value = keysStore
  }
}
// 生成新账号
const newAccount = async () => {
  step.value = "second";
  flag.value = "new"
};

// 导入账号
const importAccount = () => {
  step.value = "second";
  flag.value = "existing"
}

// 生成钱包
const newWallet = async () => {
  if (account.name) {
    // 如果是第一次注册，需要输入密码
    if (isFirst.value) {
      if (account.password) {
        // 将密码传给background,存在内存
        chrome.runtime.sendMessage({
          type: 'add password',
          data: account.password
        })
        // 1、先加密
        const pasEncrypt = aesEncrypt(account.password);
        const result = keyAddFunc(account.name, account.password)
        account.mnemonic = result.decryptMnemonic
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
    } else {
      // 如果不是第一次注册，密码从background得到
      chrome.runtime.sendMessage({
        type: 'get password'
      }, res => {
        const password = res
        const result = keyAddFunc(account.name, password)
        const temp = JSON.parse(storageKeysStore.value)
        account.mnemonic = result.wallet.mnemonic
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
      })
    }
  }
  step.value = "third-new";
}

// 导入钱包
const importWallet = async () => {
  if (impAccount.mnemonic && impAccount.name) {
    // 如果是第一次注册，需要输入密码
    if (isFirst.value) {
      if (impAccount.password) {
        // 将密码传给background,存在内存
        chrome.runtime.sendMessage({
          type: 'add password',
          data: impAccount.password
        })
        const pasEncrypt = aesEncrypt(impAccount.password);
        const result = keyMnemonicEncrypt(impAccount.mnemonic, impAccount.password)
        const local = {
          curKey: {
            type: 'mnemonic',
            mnemonic: result,
            name: impAccount.name,
          },
          keysStore: JSON.stringify([{
            type: 'mnemonic',
            mnemonic: result,
            name: impAccount.name,
          }]),
          // mac是加密的密码
          status: 'unlock',
          mac: pasEncrypt,
        }
        saveValue(local);
      }
    } else {
      // 如果不是第一次注册，密码从background得到
      chrome.runtime.sendMessage({
        type: 'get password'
      }, res => {
        const password = res
        const result = keyMnemonicEncrypt(impAccount.mnemonic, password)
        const temp = JSON.parse(storageKeysStore.value)
        temp.push({
          type: 'mnemonic',
          mnemonic: result,
          name: impAccount.name,
        })
        const local = {
          curKey: {
            type: 'mnemonic',
            mnemonic: result,
            name: impAccount.name,
          },
          keysStore: JSON.stringify(temp),
        }
        saveValue(local);
      })
    }
    step.value = 'third-existing'
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
