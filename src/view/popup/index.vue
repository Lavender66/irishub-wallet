<template>
  <router-view />
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useKeyRingStore } from "@/store/keyRing"
import { KeyRingStatus } from "@/helper/keyring"
import { storeToRefs } from "pinia";
const keyRingStoreFunction = useKeyRingStore()
const { status } = storeToRefs(keyRingStoreFunction)
const router = useRouter()
router.beforeEach((to, from, next) => {
  keyRingStoreFunction.getKeyRingStatusOnly().then(() => {
    if (to.fullPath === "/home" && status.value === KeyRingStatus.LOCKED) {
      // 锁定页面，跳转到锁定路由
      next({ path: "lock"})
    } else if (to.fullPath === "/home" && status.value === KeyRingStatus.EMPTY) {
      chrome.tabs.create({
        url: "popup.html#/regiest",
      });
      window.close();
    } else {
      next()
    }
  })
})

</script>
<style>
html,
body {
  display: flex;
  align-items: center;
  justify-content: center;
}

#app {
  width: 360px;
  height: 580px;
}
</style>
