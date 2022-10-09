<template>
  <div class="main_app">
    <h1>Hello sandbox</h1>
  </div>
</template>
  
<script lang="ts" setup>
import { onMounted } from "vue";
import { sdk, client } from "../../helper/sdkHelper"
onMounted(() => {
  //绑定事件接收父项目传来的值
  window.addEventListener("message", handleMessage);
});

const handleMessage = (event: any) => {
  // if (event.data.type === "generate mnemonic") {
  //   const mnemonic = sdk.Crypto.generateMnemonic();
  //   window.parent.postMessage({ type: 'send mnemonic', message: mnemonic }, "*");
  // }

  console.log('======popup发来', event)
  // 如果不是相同的origin发来，拒绝通信
  if(event.origin !== window.location.origin){
    return
  }

  if (event.data.type === "add key") {
    const m = event.data.message
    const wallet = client.keys.add(m.name, m.password)
    const decryptMnemonic = client.config.keyDAO.decrypt!(wallet.mnemonic, m.password);
    let walletInfo = {
      wallet,
      decryptMnemonic
    }
    // window.parent.postMessage({ type: 'send wallet', message: walletInfo }, '*');
    event.source.postMessage({ type: 'send wallet', message: walletInfo }, '*');
  }
};
</script>
  
<style>
.main_app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
  