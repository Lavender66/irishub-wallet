import { createApp } from "vue";
// 添加状态管理库
import { createPinia } from "pinia";
import App from "../view/popup/index.vue";
// 添加antd组件库
import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
// 添加路由
import router from "../routers/popup";

const app = createApp(App)

app.use(router).use(Antd).use(createPinia()).mount("#app");
