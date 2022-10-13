<template>
  <div class="account" v-if="step === 'first'">
    <div class="user-button">
      <a-button type="primary" @click="addAccount">
        + Add Account
      </a-button>
    </div>
    <div class="user-item" v-for="(item, index) in accountsList" :key="index">
      <p>{{ item.name }}</p><span v-if="item.name === account.name">Slected</span>
      <a-dropdown @click="handleButtonClick">
        <a class="ant-dropdown-link" @click.prevent>
          <ellipsis-outlined />
        </a>
        <template #overlay>
          <a-menu @click="handleMenuClick">
            <a-menu-item key="1" @click="viewMnemonic(item)">
              View Mnemonic Seed
            </a-menu-item>
            <!-- <a-menu-item key="2">
              Change Account Name
            </a-menu-item>
            <a-menu-item key="3">
              Delete Account
            </a-menu-item> -->
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
  <div class="view" v-if="step === 'second'">
    <p class="view-back">
      <left-outlined @click="()=> {step = 'first'}" />
    </p>
    <key-outlined :style="{fontSize: '125px'}" />
    <p> Please input your password to proceed</p>
    <a-input v-model:value="unLockPas" />
    <a-button type="primary" @click="confirmPasFunc" class="view-button">Confirm</a-button>
  </div>
  <div v-if="step === 'third'">
    <left-outlined @click="()=> {step = 'second'}" />
    <p>{{ curViewMnemonic.mnemonic}}</p>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, onMounted } from "vue";
import { EllipsisOutlined, KeyOutlined, LeftOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { getValue } from "../../../helper/storageService"
import { aesEncrypt, aesDecrypt } from "../../../helper/aes"
import { keyMnemonic } from "../../../helper/sdkHelper"

const step = ref<string>("first");
const unLockPas = ref<string>('')
// 账户列表
const accountsList = ref<any>([]);
// 当前选择查看的账户
const curViewMnemonic = reactive<{
  name: string;
  mnemonic: string;
  enMnemonic: string;
}>({
  name: "",
  mnemonic: "",
  enMnemonic: ""
})
const account = reactive<{
  name: string;
  password: string;
  mnemonic: string;
}>({
  name: "",
  password: "",
  mnemonic: ""
});

onMounted(() => {
  //读取chrome.storage中的当前账户信息
  curAccountFunc()
});

const curAccountFunc = async () => {

  const { curKey } = await getValue('curKey') as any
  account.name = curKey.name
  const { keysStore } = await getValue('keysStore') as any
  accountsList.value = JSON.parse(keysStore)
  // account.mnemonic = curKey.mnemonic
  // account.address = sdk.client.keys.show(account.name)
  // console.log('=====homeuser', curKey, account.name, account.address)
}
// 添加一个账户
const addAccount = () => {
  chrome.tabs.create({
    url: 'popup.html#/regiest',
  })
}
const handleButtonClick = (e: Event) => {
  // console.log('click left button', e);
};
const handleMenuClick: MenuProps['onClick'] = e => {
  // console.log('click', e);
};

const viewMnemonic = async (item: any) => {
  step.value = 'second'
  curViewMnemonic.enMnemonic = item.mnemonic
}

const confirmPasFunc = async () => {
  const { curKey } = await getValue('curKey') as any
  const { mac } = await getValue('mac') as any
  // aes解码出密码,
  console.log('user', curKey)
  if (unLockPas.value) {
    const res = aesDecrypt(mac, unLockPas.value)
    if (res === unLockPas.value) {
      step.value = 'third'
      curViewMnemonic.mnemonic = keyMnemonic(curViewMnemonic.enMnemonic, unLockPas.value)
    }
  }
}
</script>

<style lang="scss">
.account {
  .user-button {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .user-item {
    display: flex;
    margin: 30px 20px 0px 20px;
    justify-content: space-between;
  }
}

.view {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 100px 10px 10px 10px;
  flex-direction: column;

  .view-back {
    position: absolute;
    top: 60px;
    left: 20px;
  }

  .view-button {
    margin-top: 20px;
    width: 100%;
  }
}
</style>
