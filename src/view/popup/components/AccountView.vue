<template>
  <div class="account">
    <div class="user-button">
      <a-button type="primary" @click="addAccount">
        + Add Account
      </a-button>
    </div>
    <div class="user-item">
      <p>test</p>
      <a-dropdown @click="handleButtonClick">
        <a class="ant-dropdown-link" @click.prevent>
          <ellipsis-outlined />
        </a>
        <template #overlay>
          <a-menu @click="handleMenuClick">
            <a-menu-item key="1" @click="viewMnemonic">
              View Mnemonic Seed
            </a-menu-item>
            <a-menu-item key="2">
              Change Account Name
            </a-menu-item>
            <a-menu-item key="3">
              Delete Account
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from "vue";
import { EllipsisOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { getValue } from "../../../helper/storageService"

const account = reactive<{
  name: string;
  password: string;
}>({
  name: "",
  password: "",
});
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

const viewMnemonic = async () => {
  const user = await getValue('cur-key')
  // aes解码出密码,
  console.log('user', user)
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
    align-items: center;
  }
}
</style>
