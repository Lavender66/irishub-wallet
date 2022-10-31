import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/view/popup/HomeView.vue";
import SendView from "@/view/popup/SendView.vue";
import SignView from "@/view/popup/SignView.vue";
import RegiestView from "@/view/popup/RegiestView.vue";
import LockView from "@/view/popup/LockedView.vue";
import AccountView from "@/view/popup/AccountView.vue";
// 判断pinia中存储的状态，看跳转哪个路由
const routes: Array<RouteRecordRaw> = [
  // 默认导航地址
  {
    path: "/",
    redirect: '/home'
  },
  {
    path: "/home",
    name: "home",
    component: HomeView,
  },
  {
    path: "/regiest",
    name: "regiest",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: () =>
    //   import(/* webpackChunkName: "account" */ "../view/popup/RegiestView.vue"),
    component: RegiestView,
  },
  {
    path: "/send",
    name: "send",
    component: SendView,
  },
  {
    path: "/sign",
    name: "sign",
    component: SignView,
  },
  {
    path: "/lock",
    name: "lock",
    component: LockView
  },
  {
    path: "/accountList",
    name: "accountList",
    component: AccountView
  }
];


const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

export default router;
