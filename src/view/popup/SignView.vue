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
import types from "chrome-v3-irishub/dist/src/types"
import { keyRecoverFunc, keyMnemonicFunc, queryBankBalance } from "../../helper/sdkHelper"
import { getValue, saveValue } from "../../helper/storageService"
import { useRoute, useRouter } from 'vue-router'
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

// 钱包内的交易
const sendTxApprove = async () => {
  // 如果是第三方来请求签名
  chrome.runtime.sendMessage({
    type: 'get password'
  }, async res => {
    const password = res
    const { curKey } = await getValue('curKey') as any
    const tempWallet = keyRecoverFunc(curKey.name, password, keyMnemonicFunc(curKey.mnemonic, password))
    const baseTx = {
        from: curKey.name,
        password,
        mode: 'cosmos.bank.v1beta1.MsgSend',
        chainId: client.config.chainId
      }
    let recover_unsigned_std_tx = client.tx.newStdTxFromTxData(signRequest.unsigntx);
    console.log('=======curKey', curKey, tempWallet, recover_unsigned_std_tx,signRequest.basetx)
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
  })
}

</script>
<style lang="scss">
.tx-detail {
  margin: 20px 20px 20px 20px;
}
</style>
