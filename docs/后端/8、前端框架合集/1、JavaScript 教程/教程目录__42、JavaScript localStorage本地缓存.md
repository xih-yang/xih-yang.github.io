# 42、JavaScript localStorage本地缓存
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/42.html
- 分类：前端框架
- 分组：教程目录
本地存储技术包含：

##### localStorage（客户端微型数据库）：

**1、** 永久存储；2.最大存储5M3.只能去存储字符串和数字，如果存储内容多的话会消耗内存空间，导致页面变卡4.localStorage不能被爬虫抓取到5.在浏览器的隐私模式下面是不可读取的；

##### cookie

**1、** 可以设置过期时间；

**2、** 最大可以存储4KB；

**3、** 每一个域名下面可以存储50条数据（如果已经4kb，可能不到50条，但是也不可以继续存储）；

##### sessionStorage（结合后台使用）

**1、** 存储容量小2.只能存储一次会话（窗口打开和关闭）；

在HTML5中，新加一个localStorage特性，这个特性主要用来作为本地存储来使用的，解决cookie存储空间不够（cookie中每条cookie的存储空间为4k），localStorage中一般浏览器支持的是5M大小，这个在不同浏览器中localStorage会有所不同。

#### localStorage的优势

**1、** localStorage拓展了cookie的4k限制；

**2、** localStorage会可以将第一次请求的数据直接存储到本地，这个相当于5M大小的针对于前端页面的数据库，相当于cookie可以节约带宽，但是这个却是只有在**高版本的浏览器中（IE8以上）**才支持的；

谷歌查看localStorage方法：控制台->appli
