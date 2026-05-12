# 72、JavaScript Jquery 的 ajax和 cookie
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/72.html
- 分类：前端框架
- 分组：教程目录
JQ的cookie使用

下载jquery.cookie.js文件 下载地址：https://plugins.jquery.com/cookie/

$.cookie（） （与我们之前封装的cookie函数类似，可以看我之前的博客，有讲cookie使用）

$.cookie(name) 取值

$.cookie(name,value) 设置cookie 键名和键值

$.cookie(name,value,option) 设置cookie 键名和键值以及cookie可选项，option必须是对象

$.removeCookie(key) 删除name=key的cookie项

JQajax使用 (ajax使用 博客：[https://editor.csdn.net/md/?articleId=117867985](https://editor.csdn.net/md/?articleId=117867985))

以下最好在服务器上加载，要么就去使用hbuild-x编程。

$.ajax()

参数：对象 type:‘请求方式’ ，url:‘请求地址’ data:‘提交的数据’ success：成功回调函数，error ：失败回调函数 等等…大家可以去看一下w3school里的相应参数。

成功回调函数设置形参

success:function(data,status,xhr) {} data:请求成功的数据 statusText：请求的状态（success/fail） xhr：ajax对象

整合JSONP跨域请求问题。（Jsonp使用）

参数：dataType:‘jsonp’

返回的数据返回自动json对象格式

.load方法

第一个参数：请求数据的地址

第二个参数：回调函数（data,statusTxt,xhr）{} 与$.ajax()成功回调函数用法一样

将ajax请求回来的数据，显示在页面当中。并且自动的解决跨域使用JSONP跨域请求数据。底层实现的方法还是$.ajax。

两者都是等价的

$().load()在输入请求路径的时候，可以添加选择器（选择器和地址之间用空格隔开），将符合选择器的数据插到指定的元素上。

$.get()

第一个参数：请求数据的地址

第二个参数：回调函数（data,statusTxt,xhr）{} 与$.ajax()成功回调函数用法一样

请求数据：

提交数据：

$.post()

第一个参数：请求数据的地址

第二个参数：回调函数（data,statusTxt,xhr）{} 与$.ajax()成功回调函数用法一样

提交数据
