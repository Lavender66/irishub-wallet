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
        <p style="margin-top: 20px;">Mnemonic Seed</p>
        <p>{{ account.mnemonic }}</p>
      </div>
      <a-button type="link" @click="() => { step = 'first'}">Back</a-button>
    </div>
  </div>
  <!-- 用iframe 注入irishub js sdk -->
  <iframe :src="iframeSrc" ref="iframeRef" id="iframeRef" style="display: none"></iframe>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { sendMessage } from "../../helper/postMessageToSdk"
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

// iframe 相关
const iframeSrc = ref<string>("sandbox.html");
const iframeRef = ref<any>(null); // 和iframe标签的ref绑定
let iframeWindow: any = null; //iframe的window对象

onMounted(() => {
  // 父项目绑定一个message事件给iframe handleMessage：接收iframe传到父项目的值
  window.addEventListener("message", handleMessage); // 监听iframe的事件
  //vue3使用ref定义的变量需要使用.value获取值， vue2直接iframeRef.contentWindow
  iframeWindow = iframeRef.value.contentWindow;
  // sendMessage(iframeRef.value, iframeWindow, iframeSrc.value, { type: 'generate mnemonic' })
});
// 处理sandbox.html 页面 返回的 js-sdk 的消息 postMessage
const handleMessage = (event: any) => {
  // 接受mnemonic
  if (event.data.type === 'send mnemonic') {
    account.mnemonic = event.data.message
  }
  console.log('======sandbox', event.source === iframeWindow)
  if (event.origin === "null" && event.source !== iframeWindow){
    return
  }

  switch (event.data.type) {
    case 'send wallet': {
      // 得到wallet
      account.mnemonic = event.data?.message?.decryptMnemonic
      break;
    }
    default:
      break
  }
};

// 生成新账号
const newAccount = () => {
  step.value = "second";
};

// 生成钱包
const newWallet = () => {
  // 用户名和密码存到chrome.storage.local
  if (account.name && account.password) {
    // iframeRef.value.onload = function () {
      //todo
      console.log('======', window.location.origin)
      sendMessage(iframeRef.value, iframeWindow, '*', { type: 'add key', message: { name: account.name, password: account.password } })
    // };
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
