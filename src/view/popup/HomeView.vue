<template>
  <div class="home">
    <a-button type="primary" @click="toAccount">
      + Add Account
    </a-button>
    <!-- <router-link to="/account">Home</router-link>
    <button @click="test">dianji</button>
    <div v-show="!show">
      Account name:<a-input v-model:value="name" placeholder="name"></a-input>
      Account password: <a-input v-model:value="password" placeholder="password"></a-input>
      <a-button style="margin-top: 10px;" @click="regiest">regiest</a-button>
    </div>
    <div v-show="show">
      mnemonic: <p>{{mnemonic}}</p>
      <a-textarea rows=8 v-model:value="mnemonic" style="width: 280px"/>
    </div>
    <div v-show="show">
      address: <p>{{address}}</p>
      <a-textarea v-model:value="address" />
    </div> -->
    <iframe :src="iframeSrc" ref="iframeRef" id="iframeRef" style="display: none;"></iframe>
  </div>
</template>

<script lang="ts" setup>
// import lodash from 'lodash'
import { onMounted, ref } from "vue";
// import { client } from "../../helper/sdkHelper"
import * as cosmos from "@cosmostation/cosmosjs";
// console.log('======iris', client)
console.log('======cosmos', cosmos)

const show = ref<boolean>(false)
const name = ref<string>('name')
const password = ref<string>('password')
const mnemonic = ref<string>()
const address = ref<string>()

// 添加一个账户
const toAccount = () => {
  chrome.tabs.create({
    url: 'popup.html#/account',
  })
}

// import * as iris from "@irisnet/irishub-sdk";
// console.log('====', iris)
let iframeSrc = ref<string>("sandbox.html");
let iframeRef = ref<any>(null);   // 和iframe标签的ref绑定
let iframeWindow: any = null;   //iframe的window对象

onMounted(() => {
  // 父项目绑定一个message事件给iframe handleMessage：接收iframe传到父项目的值
  // window.addEventListener("message", handleMessage); // 监听iframe的事件
  //vue3使用ref定义的变量需要使用.value获取值， vue2直接iframeRef.contentWindow
  iframeWindow = iframeRef.value.contentWindow;
  // sendMessage();
});
// const handleMessage = (event: string) => {
//   console.log(event.data);
// };
// 向iframe传参
const sendMessage = () => {
  if (iframeRef.value.attachEvent) {
    // 兼容IE浏览器判断 ie的window.onload 是隐藏的 需要用attachEvent注册
    iframeRef.value.attachEvent("onload", function () {
      //postMessage（message,origin） 向iframe发送参数
      //message：iframe接收的参数，最好字符串   origin：其值可以是字符串"*"（表示无限制）或者一个url
      iframeWindow.postMessage("token", iframeSrc);
    });
  } else {
    iframeRef.value.onload = function () {
      iframeWindow.postMessage("token", iframeSrc);
    };
  }
};

const test = () => {
  sendMessage();
}

// Export keystore of a key
// const keystore = client.keys.export(name.value, password, password);
// const keystoreObj = JSON.parse(keystore.toString());

// Import a keystore
// const importedKey = client.keys.import(name.value, password, keystore);

function regiest() {
  // 注册时，加密存下name、password到本地，name和password会创建一个钱包
  // Create a new key
  // const wallet = client.keys.add(name.value, password.value);

  // // 助记词
  // mnemonic.value = client.config.keyDAO.decrypt!(wallet.mnemonic!, password.value);
  // show.value = true

  // // Show address of a key
  // address.value = client.keys.show(name.value);

}
</script>
<style lang="scss">
.home {
  width: 200px;
  // display: flex;
  // align-items: center;
  // justify-content: center;
}
</style>
