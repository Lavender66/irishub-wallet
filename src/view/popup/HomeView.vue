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
      <div class="noEmpty-account" v-if="accountEmpty === 'noEmpty'">
        <p>{{ account.name }}</p>
        <p>{{ account.address }}</p>
        <p>token</p>
        <a-button>Send</a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { MenuOutlined, UserOutlined, BankOutlined, LockOutlined } from '@ant-design/icons-vue';
import AccountView from "./components/AccountView.vue"
import SettingView from "./components/SettingView.vue"
import { sdk } from "../../helper/sdkHelper"
import { getValue, saveValue } from "../../helper/storageService"
import { aesDecrypt } from "../../helper/aes"
console.log('======iris', sdk)
// 当前在的导航页
const current = ref<string[]>(['home']);
const accountEmpty = ref<string>('empty')
// 当前账户信息
const account = reactive<{
  mnemonic: string,
  name: string;
  mac: string;
  type: string;
  address: string;
  status: string;
}>({
  name: "",
  mac: "",
  type: "",
  address: "",
  mnemonic: "",
  status: "unlock",
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

  console.log('=====cur', !curKey, mac, status)
  if (curKey) {
    accountEmpty.value = 'noEmpty'
    account.name = curKey.name
    account.type = curKey.type
    account.mnemonic = curKey.mnemonic
    account.mac = mac
    account.status = status
  }
  // account.address = sdk.client.keys.show(account.name)
  // console.log('=====homeuser', curKey, account.name, account.address)
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

// Export keystore of a key
// const keystore = client.keys.export(name.value, password, password);
// const keystoreObj = JSON.parse(keystore.toString());

// Import a keystore
// const importedKey = client.keys.import(name.value, password, keystore);

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
}
</style>
