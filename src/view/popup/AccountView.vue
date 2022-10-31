<template>
  <div class="account" v-if="step === 'first'">
    <left-outlined @click="goBack" :style="{ fontSize: '25px' }" />
    <div class="user-button">
      <a-button type="primary" @click="addAccount">
        + Add Account
      </a-button>
    </div>
    <div class="user-item" v-for="(item, index) in multiKeyStoreInfo" :key="index">
      <p @click="changeAccount(item)" style="cursor:pointer">{{ item.name }}</p><span
        v-if="item.selected">Slected</span>
      <a-dropdown>
        <a class="ant-dropdown-link" @click.prevent>
          <ellipsis-outlined />
        </a>
        <template #overlay>
          <a-menu>
            <a-menu-item key="1" @click="viewMnemonic(item)">
              View Mnemonic Seed
            </a-menu-item>
            <!-- <a-menu-item key="2">
              Change Account Name
            </a-menu-item> -->
            <a-menu-item key="3" @click="deleteAccount(item)">
              Delete Account
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
  <div class="view" v-if="step === 'second'">
    <p class="view-back">
      <left-outlined @click="() => { step = 'first' }" :style="{ fontSize: '25px' }" />
    </p>
    <key-outlined :style="{ fontSize: '125px' }" />
    <p> Please input your password to proceed</p>
    <a-input v-model:value="unLockPas" />
    <a-button type="primary" @click="confirmPasFunc" class="view-button">Confirm</a-button>
  </div>
  <div v-if="step === 'third'">
    <left-outlined @click="() => { step = 'second' }" />
    <p>{{ curViewMnemonic.mnemonic }}</p>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import { EllipsisOutlined, KeyOutlined, LeftOutlined } from '@ant-design/icons-vue';
import { getValue, saveValue } from "../../helper/storageService"
import { aesEncrypt, aesDecrypt } from "../../util/crypto"
import { keyMnemonicFunc } from "../../helper/sdkHelper"
import { useRouter } from 'vue-router'
import { useKeyRingStore } from "@/store/keyRing"
import { storeToRefs } from "pinia";
const keyRingStoreFunction = useKeyRingStore()
const { multiKeyStoreInfo } = storeToRefs(keyRingStoreFunction)
const router = useRouter()
const step = ref<string>("first");
const unLockPas = ref<string>('')
// 账户列表
const accountsList = ref<any>([]);
// 当前选择查看的账户
const curViewMnemonic = reactive<{
  id: string;
  mnemonic: string;
}>({
  id: "",
  mnemonic: "",
})

// 添加一个账户
const addAccount = () => {
  chrome.tabs.create({
    url: 'popup.html#/regiest',
  })
}

const goBack = () => {
  router.push("/home")
}

const changeAccount = (item: any) => {
  // 更改当前账户
  keyRingStoreFunction.changeAccount(item.id).then(() => {
    router.push("/home")
  })
}

const viewMnemonic = (item: any) => {
  step.value = 'second'
  curViewMnemonic.id = item.id
}

const deleteAccount = (item: any) => {
  console.log('ssss', accountsList, item.mnemonic)
  const res = accountsList.value.find((cur: any, index: number) => { if (cur.mnemonic === item.mnemonic) { return index } })
  // todo 需增加一个密码确定的过程
  accountsList.value.splice(res, 1)
  if (accountsList.value.length === 0) {
    addAccount()
    saveValue({
      keysStore: JSON.stringify(accountsList.value),
      curKey: {
        name: '',
        mnemonic: '',
        type: 'mnemonic'
      },
      mac: ''
    });
  } else {
    saveValue({
      keysStore: JSON.stringify(accountsList.value)
    });
  }
}

const confirmPasFunc = async () => {
  if (unLockPas.value) {
    keyRingStoreFunction.viewMnemonic(unLockPas.value, curViewMnemonic.id).then(res => {
      curViewMnemonic.mnemonic = res as string
    })
  }
}
</script>

<style lang="scss">
.account {
  margin: 10px;

  .user-button {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .user-item {
    display: flex;
    margin: 30px 10px 0px 10px;
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
