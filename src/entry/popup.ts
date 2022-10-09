import { createApp } from "vue";
import App from "../view/popup/index.vue";
// 添加antd组件库
import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
// 添加路由
import router from "../routers/popup";


const app = createApp(App)

// app.config.globalProperties.$iris = iris
app.use(router).use(Antd).mount("#app");
