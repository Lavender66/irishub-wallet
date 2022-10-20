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
    <AccountView v-if="current && current[0] === 'user'" @changeHome="changeToHome" />
    <SettingView v-if="current && current[0] === 'setting'" @lockWallet="lockWallet" />
    <div v-if="current && current[0] === 'home'">
      <!-- <p style="margin-top: 20px">Account Name</p> -->
      <div class="noEmpty-account" v-if="tokenShow === 'first'">
        <p style="margin-top: 20px">{{ account.name }}</p>
        <p>{{ account.address }}</p>
        <p style="margin-top: 40px">Total Banlance</p>
        <p style="font-weight: 800;">{{ account.amount }} NYAN</p>
        <a-button style="width: 120px; margin-top: 10px;" type="primary" @click="sendTx">Send</a-button>
      </div>
      <div class="noEmpty-account" v-if="tokenShow === 'third'">
        <left-outlined @click="()=> {tokenShow = 'second'}" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, h } from "vue";
import { MenuOutlined, UserOutlined, BankOutlined, LockOutlined, LeftOutlined, SelectOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import AccountView from "./components/AccountView.vue"
import SettingView from "./components/SettingView.vue"
import { keyRecoverFunc, keyMnemonicFunc, queryBankBalance } from "../../helper/sdkHelper"
import { getValue, saveValue } from "../../helper/storageService"
import { aesDecrypt } from "../../helper/aes"
import { useRouter } from 'vue-router'
const router = useRouter()
// 当前在的导航页
const current = ref<string[]>(['home']);

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
  password: string,
  mnemonic: string,
  name: string;
  mac: string;
  type: string;
  address: string;
  status: string;
  amount: number,
}>({
  password: '',
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
  // 判断当前钱包内有没有账户
  if (!curKey) {
    addAccount()
  }
  const { mac } = await getValue('mac') as any
  const { status } = await getValue('status') as any
  if (curKey) {
    account.name = curKey.name
    account.type = curKey.type
    account.mnemonic = curKey.mnemonic
    account.mac = mac
    account.status = status
    chrome.runtime.sendMessage({
      type: 'get password'
    }, res => {
      if (!res) {
        account.status = 'lock'
        saveValue({
          status: 'lock'
        });
        return
      }
      account.password = res
      const tempWallet = keyRecoverFunc(account.name, account.password, keyMnemonicFunc(curKey.mnemonic, account.password))
      account.address = tempWallet.address
      queryBankBalance(account.address, 'unyan').then(res => {
        account.amount = Number((Number(res.balance.amount) / 1000000).toFixed(2))
      })
    })
  }
}

const lockWallet = (val: string) => {
  // 锁定钱包,
  // todo 更新background里的密码为空
  account.status = val
  saveValue({
    status: account.status
  });
}

const changeToHome = async (val: string) => {
  current.value = [val]
  // window.location.reload()
  const { curKey } = await getValue('curKey') as any
  account.name = curKey.name
  account.type = curKey.type
  account.mnemonic = curKey.mnemonic
  chrome.runtime.sendMessage({
    type: 'get password'
  }, res => {
    account.password = res
    const tempWallet = keyRecoverFunc(account.name, account.password, keyMnemonicFunc(curKey.mnemonic, account.password))
    account.address = tempWallet.address
    queryBankBalance(account.address, 'unyan').then(res => {
      account.amount = Number((Number(res.balance.amount) / 1000000).toFixed(2))
    })
  })
}

const unlockWallet = () => {
  // 将解锁成功的密码更新到background
  // 如果background里面没有密码，调出解锁页面
  if (unLockPas.value) {
    const res = aesDecrypt(account.mac, unLockPas.value)
    if (res === unLockPas.value) {
      // 解锁成功之后将密码加入到background
      account.status = "unlock"
      // 将密码传给background,存在内存
      chrome.runtime.sendMessage({
        type: 'add password',
        data: unLockPas.value
      })
      window.location.reload()
      saveValue({
        status: account.status
      });
    }
  }
}

const sendTx = () => {
  // 发送一笔交易
  router.push({ path: '/send' })
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
}
</style>
