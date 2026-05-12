# 55、JavaScript 服务器入门以及安装
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/55.html
- 分类：前端框架
- 分组：教程目录
**软件构架：**

C/S(客户端->服务端)

B/S(浏览器端->服务端)

服务器apache这个软件运行在你的电脑上，那么你电脑上某一个磁盘就对外可见，别人可以通过IP或者域名访问

服务器：资源提供方

客户端：资源受益方

服务器和客户端都是 相对概念，服务器可以是客户端，客户端可以是服务器。

**服务器安装**

因为apache的安装比较繁琐，所以一般我们都是安装的集成开发环境：WAMP、PHPnow、LAMP

**哪些技术可以开发网站**

php、jsp、asp、python、nodejs、c/c++

**WAMP架构解读**

window+apache+mysql+php

**LAMP/LNMP架构解读**

Linux+apache+mysql+php

linux+nginx+mysql+php

**PHPnow**

apache（服务器）+mysql（后台数据库）+php（后台技术）

**安装PHPnow步骤**

**1、** 下载压缩包->解压；

**2、** 解压Package.7z->解压之后将里面所有的文件放在上一级目录下；

**3、** 进入终端（以管理员身份运行）->cd文件夹路径；

**4、** 切换到文件夹路径后->输入init回车，等待安装；

**5、** 自动弹出以下页面表示安装成功；

在PHPnow/htdocs 服务器根目录下，所有的页面都是对外可见的

localhost /127.0.0.1 直接访问本地电脑的服务器

IP地址 访问当前电脑的服务器

如果访问时，不写访问路径的话，默认访问index开头的文件

index.php index.html index.jsp

访问其他文件：使用locahost/文件名（文件必须在htdocs根目录下）
