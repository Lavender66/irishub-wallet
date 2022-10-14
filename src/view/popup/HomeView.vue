<template>
  <div class="lock" v-if="account.status === 'lock'">
    <!-- lock -->
    <p>Password</p>
    <lock-outlined :style="{fontSize: '125px'}" />
    <a-input v-model:value="unLockPas" style="margin-top: 20px;" />
    <a-button type="primary" @click="unlockWallet" class="lock-button">UnLock</a-button>
  </div>
  <div class="unlock" v-if="account.status === 'unlock'">
    <!-- unlock -->
    <!-- header -->
    <a-menu v-model:selectedKeys="current" mode="horizontal" class="home-menu">
      <a-menu-item key="setting">
        <template #icon>
          <menu-outlined />
        </template>
      </a-menu-item>
      <a-menu-item key="home">
        <template #icon>
          <bank-outlined />
        </template>
      </a-menu-item>
      <a-menu-item key="user">
        <template #icon>
          <user-outlined />
        </template>
      </a-menu-item>
    </a-menu>
    <AccountView v-if="current && current[0] === 'user'" />
    <SettingView v-if="current && current[0] === 'setting'" @lockWallet="lockWallet" />
    <div v-if="current && current[0] === 'home'">
      <div class="empty-account" v-if="accountEmpty === 'empty'">
        <a-button type="primary" @click="addAccount">
          + Add Account
        </a-button>
      </div>
      <div v-if="accountEmpty === 'noEmpty'">
        <!-- <p style="margin-top: 20px">Account Name</p> -->
        <div class="noEmpty-account" v-if="tokenShow === 'first'">
          <p style="margin-top: 20px">{{ account.name }}</p>
          <p>{{ account.address }}</p>
          <p style="margin-top: 40px">Total Banlance</p>
          <p style="font-weight: 800;">{{ account.amount }} NYAN</p>
          <a-button style="width: 120px; margin-top: 10px;" type="primary" @click="sendTx">Send</a-button>
        </div>
        <div class="tx-detail" v-if="tokenShow === 'second'">
          <left-outlined @click="()=> {tokenShow = 'first'}" />
          <p>Recipient Address</p>
          <a-input v-model:value="txMsg.toAddress"></a-input>
          <p>Amount</p>
          <a-input v-model:value="txMsg.amount"></a-input>
          <p>Fee</p>
          <p>80000</p>
          <a-button style="width: 100%; margin-top: 10px;" type="primary" @click="sendTxDetail">Send</a-button>
        </div>
        <div class="noEmpty-account" v-if="tokenShow === 'third'">
          <left-outlined @click="()=> {tokenShow = 'second'}" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { MenuOutlined, UserOutlined, BankOutlined, LockOutlined, LeftOutlined } from '@ant-design/icons-vue';
import AccountView from "./components/AccountView.vue"
import SettingView from "./components/SettingView.vue"
import { sdk, keyRecoverFunc, keyMnemonicFunc, sendTxOnline, queryBankBalance, sdkType, client } from "../../helper/sdkHelper"
import { getValue, saveValue } from "../../helper/storageService"
import { aesDecrypt } from "../../helper/aes"
import { CHAIN_CONFIG } from "@/constant";
console.log('======iris', sdk)
// 当前在的导航页
const current = ref<string[]>(['home']);
const accountEmpty = ref<string>('empty')
const tokenShow = ref<string>('first')

// 交易信息
const txMsg = reactive<{
  toAddress: string,
  amount: string;
}>({
  toAddress: "iaa1weasw2y67p9nss6mhx5hftedp4zyzg72eu3wwn",
  amount: "100000000",
});
// 当前账户信息
const account = reactive<{
  mnemonic: string,
  name: string;
  mac: string;
  type: string;
  address: string;
  status: string;
  amount: number,
}>({
  name: "",
  mac: "",
  type: "",
  address: "",
  mnemonic: "",
  status: "unlock",
  amount: 0
});

//锁定页面的密码输入框
const unLockPas = ref<string>('')


onMounted(() => {
  //读取chrome.storage中的当前账户信息
  curAccountFunc()
});

const addAccount = () => {
  chrome.tabs.create({
    url: 'popup.html#/regiest',
  })
}

const curAccountFunc = async () => {

  const { curKey } = await getValue('curKey') as any
  const { mac } = await getValue('mac') as any
  const { status } = await getValue('status') as any
  if (curKey) {
    accountEmpty.value = 'noEmpty'
    account.name = curKey.name
    account.type = curKey.type
    account.mnemonic = curKey.mnemonic
    account.mac = mac
    account.status = status
    const tempWallet = keyRecoverFunc(account.name, 'p', keyMnemonicFunc(curKey.mnemonic, 'p'))
    account.address = tempWallet.address
    queryBankBalance(account.address, 'unyan').then(res => {
      account.amount = Number((Number(res.balance.amount) / 1000000).toFixed(2))
    })
    // console.log('=======queryBankBalance', queryBankBalance(account.address, 'unyan'))
    // console.log('=======queryMainToken', queryMainToken())
  }
}

const lockWallet = (val: string) => {
  // 锁定钱包
  account.status = val
  saveValue({
    status: account.status
  });
}

const unlockWallet = () => {
  if (unLockPas.value) {
    const res = aesDecrypt(account.mac, unLockPas.value)
    if (res === unLockPas.value) {
      // 解锁成功
      account.status = "unlock"
      saveValue({
        status: account.status
      });
    }
  }
}

const sendTx = () => {
  // 发送一笔交易
  tokenShow.value = 'second'
}

const sendTxDetail = async () => {
  const baseTx = {
    from: 'name',
    password: 'p',
    mode: 2,
    account_number: 1397,
    sequence: 0,
    chainId: client.config.chainId
  }
  const amount: any[] = [
    {
      denom: 'unyan',
      amount: '1000',
    },
  ];
  const msgs: any[] = [
    {
      type: "cosmos.bank.v1beta1.MsgSend",
      value: {
        from_address: 'iaa1g2tq9kacgj2tljrgku8mampz7c3l9xy6pxv6cc',
        to_address: 'iaa1weasw2y67p9nss6mhx5hftedp4zyzg72eu3wwn',
        amount
      }
    }
  ];
  // watch wallet
  const unsignedStdTx = client.tx.buildTx(msgs, baseTx);
  const unsignedTxStr = Buffer.from(unsignedStdTx.getData()).toString('base64');
  // cold wallet
  const recover_unsigned_std_tx = client.tx.newStdTxFromTxData(unsignedTxStr);
  const recover_signed_std_tx = await client.tx.sign(recover_unsigned_std_tx, baseTx, true);
  const recover_signed_std_tx_str = Buffer.from(recover_signed_std_tx.getData()).toString('base64');
  // watch wallet
  const signed_std_tx = client.tx.newStdTxFromTxData(recover_signed_std_tx_str);
  await client.tx.broadcast(signed_std_tx, baseTx.mode).then((res: any) => {
    console.log('=======tsres', res)
  })
}

</script>
<style lang="scss">
.lock {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  height: 100%;
  margin: 0 10px 0 10px;

  .lock-button {
    width: 100%;
    margin: 20px 0 0 0;
  }
}

.unlock {
  .home-menu {
    display: flex;
    justify-content: space-around;
  }

  .empty-account {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin-top: 200px;
  }

  .noEmpty-account {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .tx-detail {
    margin: 0px 20px 20px 20px;
  }
}
</style>
