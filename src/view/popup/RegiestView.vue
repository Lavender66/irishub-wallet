<template>
  <div class="account">
    <div v-if="step === 'first'" class="first-step">
      <a-button @click="newAccount">创建新钱包 </a-button>
      <a-button style="margin-top: 20px" @click="importAccount">导入已有钱包 </a-button>
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
        <!-- <h1 style="margin-top: 20px;">使用助记词或者私钥</h1> -->
        <p style="margin-top: 20px;">助记词</p>
        <a-input style="margin-top:20px" v-model:value="impAccount.mnemonic" />
        <p style="margin-top: 20px;">钱包名称</p>
        <a-input style="margin-top:20px" v-model:value="impAccount.name" />
        <p v-if="isFirst" style="margin-top: 20px;">钱包密码</p>
        <a-input v-if="isFirst" v-model:value="impAccount.password" style="margin-top:20px" />
        <a-button style="margin-top:20px" type="primary" @click="importWallet">Import</a-button>
      </div>
      <a-button type="link" @click="() => { step = 'first' }">Back
      </a-button>
    </div>
    <div v-if="step === 'third-new'">
      <p style="margin-top: 20px;">Mnemonic Seed</p>
      <p>{{ account.mnemonic }}</p>
      <a-button type="primary" @click="closeCurrentTab">Success</a-button>
    </div>
    <div v-if="step === 'third-existing'">
      <a-button type="primary" @click="closeCurrentTab">Success</a-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { KeyRingStatus } from "@/helper/keyring"
import { useKeyRingStore } from "@/store/keyRing"
import { storeToRefs } from "pinia";
const keyRingStoreFunction = useKeyRingStore()
const { status } = storeToRefs(keyRingStoreFunction)
// 判断是第一步还是第二步
const step = ref<string>("first");
const flag = ref<string>("new");
// 判断是否是第一次注册账号，第一次注册账号有密码
const isFirst = ref<boolean>(false)
const account = reactive<{
  mnemonic: string;
  name: string;
  password: string;
}>({
  mnemonic: "",
  name: "add account",
  password: "p"
});
const impAccount = reactive<{
  mnemonic: string;
  name: string;
  password: string;
}>({
  mnemonic: "decrease unfair barely brick brief tennis concert prison next armor steel regular ill van proud present defense visual random pond unlock struggle naive stick",
  name: "imported account",
  password: 'p'
});

onMounted(() => {
  // 判断当前有没有账号，没有账号的话，需要输入密码，有账号的话，不用
  if (status.value === KeyRingStatus.EMPTY) {
    isFirst.value = true
  }
});

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
        // 将密码和keystore 文件存到background
        keyRingStoreFunction.addAccountPasswprd(account).then(res => {
          step.value = "third-new";
          account.mnemonic = res as string
        })
      }
    } else {
      // 如果不是第一次注册，密码从background得到
      keyRingStoreFunction.addAccount(account).then(res => {
        step.value = "third-new";
        account.mnemonic = res as string
      })
    }
  }
}

// 导入钱包
const importWallet = async () => {
  if (impAccount.mnemonic && impAccount.name) {
    // 如果是第一次注册，需要输入密码
    if (isFirst.value) {
      if (impAccount.password) {
        // 将密码传给background,存在内存
        keyRingStoreFunction.createMnemonicKeyRing(impAccount).then(() => {
          step.value = 'third-existing'
        })
      }
    } else {
      // 如果不是第一次注册，密码从background得到
      keyRingStoreFunction.importAccount(impAccount).then(() => {
        step.value = 'third-existing'
      })
    }
  }
}
// 关闭当前tab
const closeCurrentTab = () => {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    tabs => {
      chrome.tabs.remove(tabs[0].id as number);
    }
  );
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
