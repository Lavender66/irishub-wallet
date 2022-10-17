<template>
  <div class="tx-detail">
    <div v-if="!$route.query.detached" style="display:flex;justify-content:space-between;">
      <left-outlined style="font-size: 20px;" @click="()=> {$router.push({path: '/'})}" />
      <select-outlined style="font-size: 20px;" @click="newWindowSendTx" />
    </div>
    {{ $route }}
    <p>Recipient Address</p>
    <a-input v-model:value="txMsg.toAddress"></a-input>
    <p>Amount</p>
    <a-input v-model:value="txMsg.amount"></a-input>
    <p>Fee</p>
    <p>80000</p>
    <a-button style="width: 100%; margin-top: 10px;" type="primary" @click="sendTxDetail">Send</a-button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { LeftOutlined, SelectOutlined } from '@ant-design/icons-vue';
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// 交易信息
const txMsg = reactive<{
  toAddress: string,
  amount: number;
}>({
  toAddress: "iaa1weasw2y67p9nss6mhx5hftedp4zyzg72eu3wwn",
  amount: 1000,
});


const sendTxDetail = () => {
  // 通过路由的parmas传递参数
  const queryParam = {
    amount: Number(txMsg.amount * 100000),
    toAddress: txMsg.toAddress,
    detached: 'false',
  }
  if(route.query.detached === 'true'){
    queryParam.detached = 'true'
  }
  router.push({
    path: '/sign', 
    query: queryParam
  })
}

const newWindowSendTx = () => {
  // 窗口打开之后，会丢失掉key的数据，所以在创建窗口的时候需要把数据传递过去
  const temp = chrome.windows.create({
    width: 360,
    height: 580,
    url: chrome.runtime.getURL(`/popup.html#/send?detached=true`),
    type: 'popup',
    top: 80,
  });
  console.log('=======temp', temp)
}

</script>
<style lang="scss" scoped>
.tx-detail {
  margin: 20px 20px 20px 20px;
}
</style>
