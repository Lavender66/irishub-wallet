<template>
  <div class="setting">
    <p @click="lockWallet">锁定钱包</p>
  </div>
</template>
<script lang="ts" setup>
// 使用defineEmits创建名称，接受一个数组
import { defineEmits } from 'vue'
const emit = defineEmits(['lockWallet'])
const lockWallet=()=>{
  //传递给父组件
  emit('lockWallet','lock')
}
</script>

<style lang="scss">
.setting{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 540px;
}
</style>
