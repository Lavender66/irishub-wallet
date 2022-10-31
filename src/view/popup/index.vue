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
  keyRingStoreFunction.restore().then(() => {
    console.log('=======dexindex', to.path, from.path, status.value)
    if (to.fullPath === "/home" && status.value === KeyRingStatus.LOCKED) {
      // 锁定页面，跳转到锁定路由
      next({ path: "lock"})
    } else if (to.fullPath === "/home" && status.value === KeyRingStatus.EMPTY) {
      chrome.tabs.create({
        url: "popup.html#/regiest",
      });
      window.close();
    // } else if (to.fullPath === "/regiest" && status.value === KeyRingStatus.EMPTY){
    //   next()
    // } else if(to.fullPath === "/home" && status.value === KeyRingStatus.UNLOCKED){
    //   next()
    // }  else if (to.fullPath === "/lock" && status.value === KeyRingStatus.LOCKED) {
      // 锁定页面，跳转到锁定路由
    //   next()
    // } 
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
