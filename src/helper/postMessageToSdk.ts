// 发送消息给sandbox触发irishub-sdk
export const sendMessage = (iframeRef:any, iframeWindow:any, iframeSrc:string, message:any) => {
    if (iframeRef.attachEvent) {
      // 兼容IE浏览器判断 ie的window.onload 是隐藏的 需要用attachEvent注册
      iframeRef.attachEvent("onload", function () {
        //postMessage（message,origin） 向iframe发送参数
        //message：iframe接收的参数，最好字符串   origin：其值可以是字符串"*"（表示无限制）或者一个url
        iframeWindow.postMessage(message, iframeSrc);
      });
    } else {
      // 加了onload在methods里面调用不成功
      // iframeRef.onload = function () {
        iframeWindow.postMessage(message, iframeSrc);
      // };
    }
  };