<template>
  <div class="tx-detail">
    <div v-if="!$route.query.other" style="display:flex;justify-content:space-between;margin-top: 10px;">
      <left-outlined style="font-size: 20px;" @click="()=> {$router.push({path: '/'})}" />
    </div>
    <p>Data</p>
    <p>80000</p>
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
import { keyRecoverFunc, keyMnemonicFunc, queryBankBalance } from "../../helper/sdkHelper"
import { getValue, saveValue } from "../../helper/storageService"
import { useRoute } from 'vue-router'
const route = useRoute()
const hash = ref<string>('')
const description = ref<string>('')
const signRequest = reactive<{
  unsigntx: object,
  basetx: object
}>({
  unsigntx: {},
  basetx: {}
})
const sendTxReject = () => {
  console.log('======reject')
}

onMounted(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == "service worker sign") {
      signRequest.unsigntx = request.data.unsigntx
      signRequest.basetx = request.data.basetx
    }
  });
})

// 钱包内的交易
const sendTxApprove = async () => {
  // 如果是第三方来请求签名
  if (route.query.other === 'true') {
    client.keys.recover('name', 'p', 'decrease unfair barely brick brief tennis concert prison next armor steel regular ill van proud present defense visual random pond unlock struggle naive stick')
    let recover_unsigned_std_tx = client.tx.newStdTxFromTxData(signRequest.unsigntx);
    const signed_std_tx = await client.tx.sign(recover_unsigned_std_tx, signRequest.basetx);
    let recover_signed_std_tx = Buffer.from(signed_std_tx.getData()).toString('base64');
    chrome.runtime.sendMessage({
      type: 'sign approved',
      data: recover_signed_std_tx,
    }, () => chrome.runtime.lastError);
  }
  // 如果是windows窗口
  // if (route.query.detached === 'true') {
  //   const { curKey } = await getValue('curKey') as any
  //   const { mac } = await getValue('mac') as any
  //   keyRecoverFunc(curKey.name, 'p', keyMnemonicFunc(curKey.mnemonic, 'p'))
  // }
  // const baseTx = {
  //   from: 'name',
  //   password: 'p',
  //   mode: 2,
  //   chainId: client.config.chainId
  // }
  // const amount: any[] = [
  //   {
  //     denom: 'unyan',
  //     amount: route.query.amount,
  //   },
  // ];
  // const msgs: any[] = [
  //   {
  //     type: "cosmos.bank.v1beta1.MsgSend",
  //     value: {
  //       from_address: 'iaa1g2tq9kacgj2tljrgku8mampz7c3l9xy6pxv6cc',
  //       to_address: route.query.toAddress,
  //       amount
  //     }
  //   }
  // ];
  // // watch wallet
  // const unsignedStdTx = client.tx.buildTx(msgs, baseTx);
  // const signed_std_tx = await client.tx.sign(unsignedStdTx, baseTx);
  // await client.tx.broadcast(signed_std_tx, baseTx.mode).then((res: any) => {
  //   hash.value = res.hash
  //   console.log('=======tsres', res)
  // }).catch((error: any) => {
  //   console.log('====error', error)
  // })
}

// 窗口内的交易

// 在别的页面需要签名交易，只是签名作用
//offline tx
// const sendTxApprove = async () => {
//   const baseTx = {
//     from: 'name',
//     password: 'p',
//     mode: 2,
//     account_number: 1397,
//     sequence: 3,
//     chainId: client.config.chainId
//   }
//   const amount: any[] = [
//     {
//       denom: 'unyan',
//       amount: route.query.amount,
//     },
//   ];
//   const msgs: any[] = [
//     {
//       type: "cosmos.bank.v1beta1.MsgSend",
//       value: {
//         from_address: 'iaa1g2tq9kacgj2tljrgku8mampz7c3l9xy6pxv6cc',
//         to_address: route.query.toAddress,
//         amount
//       }
//     }
//   ];
//   // watch wallet
//   const unsignedStdTx = client.tx.buildTx(msgs, baseTx);
//   const unsignedTxStr = Buffer.from(unsignedStdTx.getData()).toString('base64');
//   // cold wallet
//   const recover_unsigned_std_tx = client.tx.newStdTxFromTxData(unsignedTxStr);
//   const recover_signed_std_tx = await client.tx.sign(recover_unsigned_std_tx, baseTx, true);
//   const recover_signed_std_tx_str = Buffer.from(recover_signed_std_tx.getData()).toString('base64');
//   // watch wallet
//   const signed_std_tx = client.tx.newStdTxFromTxData(recover_signed_std_tx_str);
//   await client.tx.broadcast(signed_std_tx, baseTx.mode).then((res: any) => {
//     hash.value = res.hash
//     console.log('=======tsres', res)
//   }).catch((error: any) => {
//     console.log('====error', error)
//   })
// }
</script>
<style lang="scss">
.tx-detail {
  margin: 20px 20px 20px 20px;
}
</style>
