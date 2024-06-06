<template>
  <div class="tx-detail">
    <div v-if="!$route.query.other" style="display:flex;justify-content:space-between;margin-top: 10px;">
      <left-outlined style="font-size: 20px;" @click="()=> {$router.push({path: '/'})}" />
    </div>
    <!-- <p>Data</p>
    <p>{{info}}</p> -->
    <a-button style="width: 46%; margin-top: 10px;" @click="sendTxReject">Reject</a-button>
    <a-button style="width: 46%; margin-top: 10px;margin-left: 20px;" type="primary" @click="sendTxApprove">Approve
    </a-button>
    <a-alert v-if="hash" style="margin-top:10px" :message="hash" type="warning" closable />
    <a-alert v-if="description" message="Error Text" :description="description" type="error" closable />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from "vue";
import { LeftOutlined } from '@ant-design/icons-vue';
import { client } from "../../helper/sdkHelper"
import { keyRecoverFunc, keyMnemonicFunc } from "../../helper/sdkHelper"
import { getValue } from "../../helper/storage"
import { useRoute } from 'vue-router'
import { useKeyRingStore } from "@/store/keyRing";
import { storeToRefs } from "pinia";
const keyRingStoreFunction = useKeyRingStore();
const { selectKeyInfo } = storeToRefs(keyRingStoreFunction);
import router from "@/routers/popup";
const route = useRoute()
const hash = ref<string>('')
const description = ref<string>('')
const signRequest = reactive<{
  unsigntx: any,
  basetx: object
}>({
  unsigntx: {},
  basetx: {}
})
const sendTxReject = () => {
  if (route.query.other === "true") {
    chrome.runtime.sendMessage({
      type: 'sign reject',
      data: {
          type: 'rejected'
      },
    });
  } else {
    router.push({
      path: '/'
    })
  }
}

onMounted(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == "service worker sign") {
      signRequest.unsigntx = request.data.unsigntx
      signRequest.basetx = request.data.basetx
      console.log('========signRequest.basetx', request.data.unsigntx)
      sendResponse()
      return true
    }
  });
  if (route.query.unsignedStdTx) {
    signRequest.unsigntx = route.query.unsignedStdTx
  }
})

// 钱包内的交易 // TODO 此函数没有调试
const sendTxApprove = async () => {
  // 如果是第三方来请求签名
  // chrome.runtime.sendMessage({
  //   type: 'get password'
  // }, async res => {
    const password = 'p'
    const baseTx = {
        from: selectKeyInfo.value?.name,
        password,
        mode: 'cosmos.bank.v1beta1.MsgSend',
        chainId: client.config.chainId
      }
    let recover_unsigned_std_tx = client.tx.newStdTxFromTxData(signRequest.unsigntx);
    // 如果修改了请求的签名序列
    if (route.query.other === 'true') {
      const signed_std_tx = await client.tx.sign(recover_unsigned_std_tx, baseTx);
      let recover_signed_std_tx = Buffer.from(signed_std_tx.getData()).toString('base64');
      chrome.runtime.sendMessage({
        type: 'sign approved',
        data: {
          type: 'approved',
          msg: recover_signed_std_tx
        }
      });
    } else {
      console.log('=ssssssignRequest.unsigntx', signRequest.unsigntx)
      const signed_std_tx = await client.tx.sign(recover_unsigned_std_tx, baseTx);
      await client.tx.broadcast(signed_std_tx, baseTx.mode).then((res: any) => {
        hash.value = res.hash
        chrome.notifications.create("", {
          type: "basic",
          iconUrl: "assets/icons/48.ico",
          title: "IRIS TX",
          message: res.hash,
        })
        // window.close()
      }).catch((error: any) => {
        console.log('====error', error)
      })
    }
  // })
}

</script>
<style lang="scss">
.tx-detail {
  margin: 20px 20px 20px 20px;
}
</style>
../../helper/storage