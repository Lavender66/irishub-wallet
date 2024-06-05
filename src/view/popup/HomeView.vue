<template>
  <div class="unlock">
    <a-menu v-model:selectedKeys="current" mode="horizontal" class="home-menu" @click="handleClick">
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
    <SettingView v-if="current && current[0] === 'setting'" @lockWallet="lockWallet" />
    <div v-if="current && current[0] === 'home'">
      <div class="noEmpty-account" v-if="tokenShow === 'first'">
        <p style="margin-top: 20px">{{ account.name }}</p>
        <p>{{ account.address }}</p>
        <p style="margin-top: 40px">Total Banlance</p>
        <p style="font-weight: 800;">{{ account.amount }} NYAN</p>
        <a-button style="width: 120px; margin-top: 10px;" type="primary" @click="sendTx">Send</a-button>
      </div>
      <div class="noEmpty-account" v-if="tokenShow === 'third'">
        <left-outlined @click="() => { tokenShow = 'second' }" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { MenuOutlined, UserOutlined, BankOutlined, LeftOutlined } from '@ant-design/icons-vue';
import { Modal, MenuProps } from 'ant-design-vue';
import SettingView from "./components/SettingView.vue"
import { queryBankBalance } from "../../helper/sdkHelper"
import { useRouter } from 'vue-router'
import { useKeyRingStore } from "@/store/keyRing"
import { storeToRefs } from "pinia";
const keyRingStoreFunction = useKeyRingStore()
const { selectKeyInfo } = storeToRefs(keyRingStoreFunction)
console.log('=sssselectKeyInfo', selectKeyInfo, keyRingStoreFunction.selectKeyInfo)
const router = useRouter()
// 当前在的导航页
const current = ref<string[]>(['home']);

const tokenShow = ref<string>('first')

// 当前账户信息
const account = reactive<{
  password: string,
  mnemonic: string,
  name: string;
  address: string;
  amount: number,
}>({
  password: '',
  name: '',
  address: '',
  mnemonic: "",
  amount: 0
});

onMounted(() => {
  // 读取当前钱包的状态，确定跳转什么路由
  getKeyRingStore()
});

const getKeyRingStore = () => {
  queryBankBalance(account.address, 'unyan').then(res => {
    account.amount = Number((Number(res.balance.amount) / 1000000).toFixed(2))
  })

}

const handleClick: MenuProps['onClick'] = menuInfo => {
  if(menuInfo.key === "user"){
    router.push("/accountList")
  }
};


const lockWallet = (val: string) => {
  // 锁定钱包,
  keyRingStoreFunction.lock()
  router.push('/lock')
}

const sendTx = () => {
  // 发送一笔交易
  router.push({ path: '/send' })
}


</script>
<style lang="scss">
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
