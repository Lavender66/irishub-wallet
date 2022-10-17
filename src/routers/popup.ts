import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../view/popup/HomeView.vue";
import SendView from "../view/popup/SendView.vue";
import SignView from "../view/popup/SignView.vue";
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/regiest",
    name: "regiest",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "account" */ "../view/popup/RegiestView.vue"),
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
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

export default router;
