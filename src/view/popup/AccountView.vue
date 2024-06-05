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
            <a-menu-item key="3" @click="deleteAccount(item, index)">
              Delete Account
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
  <!-- 查看助记词密码确认框 -->
  <div class="view" v-if="step === 'second'">
    <a-spin :spinning="showLoading">
      <p class="view-back">
        <left-outlined @click="() => { step = 'first' }" :style="{ fontSize: '25px' }" />
      </p>
      <key-outlined :style="{ fontSize: '125px' }" />
      <p>Please input your password to proceed</p>
      <a-input v-model:value="unLockPas" />
      <a-button type="primary" @click="confirmPasFunc" class="view-button">Confirm</a-button>
    </a-spin>
  </div>
  <!-- 删除账号密码确认框 -->
  <div class="view" v-if="step === 'delete'">
    <a-spin :spinning="showLoading">
      <p class="view-back">
        <left-outlined @click="() => { step = 'first' }" :style="{ fontSize: '25px' }" />
      </p>
      <key-outlined :style="{ fontSize: '125px' }" />
      <p>Please input your password to proceed</p>
      <a-input v-model:value="unLockPas" />
      <a-button type="primary" @click="confirmDelPasFunc" class="view-button">Confirm</a-button>
    </a-spin>
  </div>
  <div v-if="step === 'third'">
    <p style="margin: 10px">
      <left-outlined @click="() => { step = 'first' }" :style="{ fontSize: '25px' }" />
    </p>
    <p style="margin:46% 10px 0 10px;">{{ curViewMnemonic.mnemonic }}</p>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import {
  EllipsisOutlined,
  KeyOutlined,
  LeftOutlined,
} from "@ant-design/icons-vue";
import { getValue, saveValue } from "../../helper/storage";
import { aesEncrypt, aesDecrypt } from "../../util/crypto";
import { useRouter } from "vue-router";
import { useKeyRingStore } from "@/store/keyRing";
import { storeToRefs } from "pinia";
import { message } from "ant-design-vue";
const keyRingStoreFunction = useKeyRingStore();
const { multiKeyStoreInfo } = storeToRefs(keyRingStoreFunction);
const router = useRouter();
const step = ref<string>("first");
const unLockPas = ref<string>("");
const showLoading = ref<boolean>(false);
// 账户列表
const accountsList = ref<any>([]);
// 当前选择查看的账户
const curViewMnemonic = reactive<{
  id: string;
  mnemonic: string;
  index: number;
}>({
  id: "",
  mnemonic: "",
  index: 0
});

// 添加一个账户
const addAccount = () => {
  chrome.tabs.create({
    url: "popup.html#/regiest",
  });
};

const goBack = () => {
  router.push("/home");
};

const changeAccount = (item: any) => {
  // 更改当前账户
  keyRingStoreFunction.changeAccount(item.id).then(() => {
    router.push("/home");
  });
};

const viewMnemonic = (item: any) => {
  step.value = "second";
  curViewMnemonic.id = item.id;
};

const deleteAccount = (item: any, index: number) => {
  step.value = "delete"
  curViewMnemonic.id = item.id;
  curViewMnemonic.index = index
};

// 查看助记词密码确认
const confirmPasFunc = async () => {
  if (unLockPas.value) {
    showLoading.value = true
    keyRingStoreFunction
      .viewMnemonic(unLockPas.value, curViewMnemonic.id)
      .then((res) => {
        curViewMnemonic.mnemonic = res as string;
        showLoading.value = false
        step.value = "third";
      }).catch(() => {
        message.error("password is not correct")
        showLoading.value = false
      });
  }
};

// 删除账号密码确认
const confirmDelPasFunc = async () => {
  if (unLockPas.value) {
    showLoading.value = true
    keyRingStoreFunction
      .delAccount(unLockPas.value, curViewMnemonic.index)
      .then(() => {
        // 删除成功后跳到home页面
        console.log('======multiKeyStoreInfo', multiKeyStoreInfo.value)
        if (multiKeyStoreInfo.value.length === 0) {
          addAccount()
        } else {
          goBack()
        }
        showLoading.value = false
      }).catch((res) => {
        message.error(res)
        showLoading.value = false
      });
  }
};
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
  margin: 100px 10px 10px 10px;
  text-align: center;

  .view-back {
    position: absolute;
    top: -90px;
  }

  .view-button {
    margin-top: 20px;
    width: 100%;
  }
}
</style>
../../helper/storage