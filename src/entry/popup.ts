import { createApp } from "vue";
// 添加状态管理库
import { createPinia } from "pinia";
import App from "../view/popup/index.vue";
// 添加antd组件库
import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
// 添加路由
import router from "../routers/popup";

import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getValue } from "../helper/storageService"

NProgress.configure({
    easing: 'ease',  // 动画方式    
    speed: 500,  // 递增进度条的速度    
    showSpinner: false, // 是否显示加载ico    
    trickleSpeed: 200, // 自动递增间隔    
    minimum: 0.3 // 初始化时的最小百分比
})

// 路由守卫： 如果当前账户锁定，那么进入锁定页面，解锁完再跳入之前页面
router.beforeEach(async (to: any, from: any, next: any) => {
    NProgress.start();
    // 得到当前账户的状态
    const { status } = await getValue('status') as any
    console.log(status)
    // todo
    if (to.path === '/') {
        next()
    } else {
        if (status === 'lock') {
            next({ path: '/' })
        } else {
            next()
        }
    }
})

router.afterEach(() => {
    // 在即将进入新的页面组件前，关闭掉进度条
    NProgress.done()
})

const app = createApp(App)

app.use(router).use(Antd).use(createPinia()).mount("#app");
