# irishub-wallet
支持密码锁定/解锁功能;
支持基本的 web-site => Chrome 插件 交互，如：唤起、关闭、相互通信等；
支持助记词&私钥的创建/导入/导出功能;
支持查询并展示当前地址 token 的基本信息（denom、amount）功能；
支持 send token 到指定 address 功能；
暂不支持 tx 离线签名功能

## chrome-v3-irishub
此依赖的git：https://github.com/Lavender66/test-irishub-js-sdk/tree/feat-3.0.0
yarn add 本地包
（1）在需要被链接的包中执行，yarn link
（2）然后在需要使用的包中执行， yarn link chrome-v3-irishub
## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### 热更新，无需每次build再导入
yarn build-watch

### Lints and fixes files
```
yarn lint
```
### util 跨项目 helper 本项目

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### nyancat账号
iaa1weasw2y67p9nss6mhx5hftedp4zyzg72eu3wwn:
deer discover nose merry exhibit soda win cook taxi fix nothing useless drink harvest hunt road inner arrow zoo elegant call guilt forum measure

iaa1g2tq9kacgj2tljrgku8mampz7c3l9xy6pxv6cc:
decrease unfair barely brick brief tennis concert prison next armor steel regular ill van proud present defense visual random pond unlock struggle naive stick

### 查看全部的local.storage信息
chrome.storage.local.get(function(result){console.log(result)})

### 清除chrome.storage信息
chrome.storage.local.clear()

### todo
1、密码存储的安全问题（看keplr的实现）
2、离线签名（看keplr的实现以及太山发的demo）
3、看keplr支持的一些API，比如判断用户有没有安装软件
