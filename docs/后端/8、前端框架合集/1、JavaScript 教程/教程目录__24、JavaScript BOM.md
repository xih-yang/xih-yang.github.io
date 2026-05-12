# 24、JavaScript BOM
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/24.html
- 分类：前端框架
- 分组：教程目录
### BOM（browser object model）：浏览器对象模型

#### 窗口树状结构

#### 系统对话框：

##### widow方法：所有window开头的方法都可以省略

**alert()：警告框  window.alert()**

注：所有的属性方法和变量都可以使用window访问

**confirm(): 带确定和取消的提示框**

返回值：1.点击确定 返回值是true

**2、** 点击取消返回值是false；

**prompt() 弹出带输入框的对话框**

参数：

第一个参数：在面板上显示的内容

第二个参数：在对话框中显示的默认值（可忽略）

返回值：1.点击确定 返回的输入框的内容

**2、** 点击取消无返回值（null）；

**open（）**

参数：

第一个参数：跳转的url

第二个参数：字符串，给当前打开的窗口起个名字

第三个参数：一些特殊含义的字符串。可以控制打开窗口的属性。

如果只写第一个参数，不写第二参数：那么在每一次触发open（）的时候会不断打开新的窗口

如果写第二参数，那么在打开窗口时，那么在不断触发open（）的时候只会开启一次新的窗口。因为已经为这个窗口赋予了名字，所以当你触发这个url地址时，它会自动找到你打开过的新窗口是否有同名，有就不打开了

下面是open（）第三个字符串属性列表。这些属性不是所有浏览器兼容的。

#### window属性：

**history对象**:保存用户上网的记录，从**窗口**被打开的那一刻算起（**当前窗口**的历史记录，只要加载的url不一样就会产生历史记录）

**属性：**

history.length history对象中的记录数

默认条数是1；注意是在当前窗口进行不同url跳转的才会被算做一条记录

**方法：**

history.back（） 前往浏览器历史条目**前一个URL**，类似后退

history.forward() 前往浏览器历史条目木**下一个URL，类似前进**

history.go（num）浏览器在history对象中向前或向后

参数：
**1、** 0刷新当前页面；

**2、** 正整数前进n条记录；

**3、** 负整数后退n条记录；

在url添加#号+数字更改地址

**location对象(地址栏url)**

url:统一资源定位符 协议：//IP(域名)/:端口号/路径/?查询字符串#锚点

属性

**location.protocal** 访问url地址里的协议

返回值：

file： 本地磁盘文件

http：不安全

https：证书认证协议

如果加载的是本地文件：那么协议就是本地磁盘文件协议file：（只能在当前电脑访问当前自己电脑的文件）

如果将文件放在服务器加载的话，那么协议就是http：或者https

**location.hostname** 主机名 访问ip（在全球范围内找到你当前**网络的地址**）或者访问域名（IP别称 因为ip会随网络环境的更换而更换，当然每个网站都有一个固定的ip。起别名是为了更好的记住这个网站）

ip访问百度：

域名访问网站：

**location.port** 访问端口号（默认隐藏的，一般访问不到）

端口号：系统给当前电脑正在使用的软件随机分配的编号 0-65535

hostname：port 可以直接定位到当前使用网络的程序。（完成精确投递）

浏览器默认端口号：8080 http默认端口号 80 https默认端口号 443（可以强制更改）

**location.pathname** 访问路径 访问到主机后某数据（比如某文件下的文件）

**loaction.search** 访问查询字符串 **？拼接的部分**(前后端交互)

查询字符串：用？拼接，如果多个键值对，使用&拼接（例 ？name=‘baby’&vaule=123）

**location.hash** 访问锚点（在不刷新的情况下，在当前页面内发生跳转）

**location.href** 访问url地址： 数据类型string

#### location对象： 地址栏

在BOM模型图中，可以看到有两个location一个是window.location，另一个是window.document.location

一般情况下：window.location==window.document.location true

（window可省略）

##### 方法：

**location.assign(url)**

功能：在当前窗口进行跳转到这个url。可以返回到原来的窗口。会产生历史记录。

**location.replace(url)** 不会产生历史记录

功能：在当前窗口直接跳转url（当前窗口的url被replace里的url替换）。无法返回到原来的窗口

location.reload（）

功能：刷新窗口

参数：true 不经过浏览器缓存，强行从服务器重载（go会缓存
