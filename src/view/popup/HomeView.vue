<template>
  <div class="home">
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
    <AccountView v-if="current && current[0] === 'user'" />
    <SettingView v-if="current && current[0] === 'setting'" />
    <div v-if="current && current[0] === 'home'">
      <p>name</p>
      <p>address</p>
      <p>token</p>
      <a-button>Send</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { MenuOutlined, UserOutlined, BankOutlined} from '@ant-design/icons-vue';
import AccountView from "./components/AccountView.vue"
import SettingView from "./components/SettingView.vue"
import CryptoJS from "crypto-js";
// import { client } from "../../helper/sdkHelper"
import * as iris from "chrome-v3-irishub"
console.log('======iris', iris)


console.log('======CryptoJS', CryptoJS)
// 当前在的导航页
const current = ref<string[]>(['user']);

const show = ref<boolean>(false)
const name = ref<string>('name')
const password = ref<string>('password')
const mnemonic = ref<string>()
const address = ref<string>()


// onMounted(() => {
// });


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
  .home-menu {
    display: flex;
    justify-content: space-around;
  }
}
</style>
