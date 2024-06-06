<template>
  <div class="lock">
    <a-spin :spinning="showLoading">
      <p>Password</p>
      <lock-outlined :style="{ fontSize: '125px' }" />
      <a-input v-model:value="password" style="margin-top: 20px;" />
      <a-button type="primary" @click="unlockWallet" class="lock-button">UnLock</a-button>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { LockOutlined } from '@ant-design/icons-vue';
import { useKeyRingStore } from "@/store/keyRing";
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { KeyRingStatus } from "@/helper/keyring";
const keyRingStoreFunction = useKeyRingStore()
const router = useRouter()

//锁定页面的密码输入框
const password = ref<string>('')
const showLoading = ref<boolean>(false)

const unlockWallet = () => {
  // 将解锁成功的密码更新到background
  // 如果background里面没有密码，调出解锁页面
  if (password.value) {
    showLoading.value = true
    keyRingStoreFunction.unlock(password.value).then(status => {
      if (status == KeyRingStatus.UNLOCKED) {
        showLoading.value = false
        router.push('/home')
      } else {
        showLoading.value = false
        message.error("password is not correct")
      }
    })
  }
}


</script>
<style lang="scss">
.lock {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
  margin: 0 10px 0 10px;

  .lock-button {
    width: 100%;
    margin: 20px 0 0 0;
  }
}
</style>
