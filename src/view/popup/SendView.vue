<template>
  <div class="tx-detail">
    <div v-if="!$route.query.detached" style="display:flex;justify-content:space-between;">
      <left-outlined style="font-size: 20px;" @click="()=> {$router.push({path: '/'})}" />
      <select-outlined style="font-size: 20px;" @click="newWindowSendTx" />
    </div>
    <p>Recipient Address</p>
    <a-input v-model:value="txMsg.toAddress"></a-input>
    <p>Amount</p>
    <a-input v-model:value="txMsg.amount"></a-input>
    <!-- <p>Fee</p>
    <p>80000</p> -->
    <a-button style="width: 100%; margin-top: 10px;" type="primary" @click="sendTxDetail">Send</a-button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { LeftOutlined, SelectOutlined } from '@ant-design/icons-vue';
import { useRouter, useRoute } from 'vue-router'
import { getValue, saveValue } from "../../helper/storage"
import { keyRecoverFunc, keyMnemonicFunc, queryBankBalance } from "../../helper/sdkHelper"
import { client } from "../../helper/sdkHelper"
import * as sdktypes from "chrome-v3-irishub/dist/src/types"
import { useKeyRingStore } from "@/store/keyRing";
import { storeToRefs } from "pinia";
const keyRingStoreFunction = useKeyRingStore();
const { selectKeyInfo } = storeToRefs(keyRingStoreFunction);

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


// TODO 此函数没有调试
const sendTxDetail = () => {
  // chrome.runtime.sendMessage({
  //   type: 'get password'
  // }, async res => {
    const name = selectKeyInfo.value?.name
    const password = 'p'
    const mnemonic = 'decrease unfair barely brick brief tennis concert prison next armor steel regular ill van proud present defense visual random pond unlock struggle naive stick'
    keyRecoverFunc(name, password, mnemonic)

    const baseTx = {
      from: name,
      password
    }
    const amount: any[] = [
      {
        denom: 'unyan',
        amount: Number(txMsg.amount * 100000),
      },
    ];
    const msgs: any[] = [
      {
        type: sdktypes.TxType.MsgSend,
        value: {
          from_address: selectKeyInfo.value?.address,
          to_address: txMsg.toAddress,
          amount
        }
      }
    ];
    const unsignedStdTx = client.tx.buildTx(msgs, baseTx);
    const unsignedTxStr = Buffer.from(unsignedStdTx.getData()).toString('base64');
    console.log('=======unsignedStdTx', unsignedStdTx)
    // 通过路由的parmas传递参数
    const queryParam = {
      unsignedStdTx: unsignedTxStr,
      detached: 'false',
    }
    if (route.query.detached === 'true') {
      queryParam.detached = 'true'
    }
    router.push({
      path: '/sign',
      query: queryParam
    })

  // })
}

const newWindowSendTx = () => {
  // 窗口打开之后，会丢失掉key的数据，所以在创建窗口的时候需要把数据传递过去
  chrome.windows.create({
    width: 360,
    height: 580,
    url: chrome.runtime.getURL(`/popup.html#/send?detached=true`),
    type: 'popup',
    top: 80,
  });
}

</script>
<style lang="scss" scoped>
.tx-detail {
  margin: 20px 20px 20px 20px;
}
</style>
