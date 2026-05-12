# 29、Linux 实战：Linux-Apache
- 来源：https://ddkk.com/zhuanlan/server/linux/2/29.html
- 分类：服务器框架
- 分组：教程目录
## Apache

Apache：一款Web服务程序，通过HTTP和HTTPS提供对应服务

1）具有跨平台、高安全性、快速、可靠和通过简单API扩展等优点

2）默认占用80端口

## 配置

Apache安装指令：yum install -y httpd

如：在系统中安装Apache程序

如：启动httpd服务（systemctl start httpd）后，访问本机IP

//httpd服务没有配置时，Apache程序的默认界面

httpd服务的主要配置文档如下：

文档路径
说明

/etc/httpd
服务目录

/etc/httpd/conf/httpd.conf
主配置文件

/var/www/html
存储网站数据的目录

/var/log/httpd/access_log
存储访问日志文件

/var/log/httpd/error_log
存储错误日志文件

/etc/httpd/conf/httpd.conf：主配置文件中有全局配置、区域配置和注释行三类信息

1）常用的配置参数如下：

参数
说明

ServerRoot
指定服务目录 （默认为/etc/httpd）

ServerAdmin
指定管理员邮箱 （默认为root@ddkk.com）

User
指定运行该服务的用户 （默认为apache）

Group
指定运行该服务的用户组 （默认为apache）

ServerName
指定网站服务器的域名

DocumentRoot
指定存储网站数据的目录 （默认为/var/www/html）

Directory
指定存储网站数据目录的权限

Listen
指定监听的IP地址和端口号 （默认为80）

DirectoryIndex
指定默认索引页面 （默认为index.html）

CustomLog
指定访问日志文件 （默认为/var/log/httpd/access_log）

ErrorLog
指定错误日志文件 （默认为/var/log/httpd/error_log）

Timeout
指定网页超时时间 （默认为300s）

如：查看/etc/httpd/conf/httpd.conf文件

//全局配置：全局性配置参数，作用于所有的子站点

//区域配置：局域性配置参数，作用于针对的独立子站点

//注释行：解释全局配置参数和区域配置参数

如：配置/var/www/html/index.html文件，再访问服务器IP

1）配置文件；

2）访问IP

//指定访问其他目录下文件时，需配置SELinux

如：指定存储网站数据的目录为/home/wwwroot，并访问服务器IP

1）建立目录，并配置索引文件

2）配置httpd服务的主配置文件/etc/httpd/conf/httpd.conf

3）访问服务器IP

//出现Apache程序的默认界面，且SELinux报错

4）配置SELinux安全上下文

5）访问服务器IP

## 个人用户主页

个人用户主页：实现每位用户拥有独立的网站

1）Apache程序自带个人用户主页功能（默认关闭）

//通常是基于虚拟网站主机功能部署多个网站实现

如：配置拥有个人用户主页的Apache服务器

1）配置httpd服务的个人用户主页配置文件/etc/httpd/conf.d/userdir.conf

2）建立存储个人用户主页的网站数据目录，并配置对应权限（一般为755）

3）配置SELinux策略（SELinux策略默认不允许httpd服务的个人用户主页）

4）访问mwl用户的个人主页

//访问个人用户主页格式：IP/~用户名

## 身份验证主页

身份验证主页：网页不直接将内容显示，而需要对应的身份验证才可查看

**htpasswd命令**：Apache内置的创建、更新和存储用户名、密码和域的文件

指令格式：htpasswd 选项

选项
含义

-c 文件路径
创建一个数据库加密文件

-s
采用SHA算法对密码进行加密（默认为MD5）

-p
取消密码加密（明文密码）

-D 用户名
从数据库中删除指定用户

//添加用户为：htpasswd 数据库文件路径 用户名（再输入两次密码）

如：配置拥有身份验证主页的Apache服务器

1）建立用户的密码验证数据库；

2）配置httpd服务的个人用户主页配置文件/etc/httpd/conf.d/userdir.conf

3）访问mwl个人用户主页

## 虚拟主机

**虚拟主机**：实现单个服务器上运行多个网站

1）虚拟主机无法实现类似云主机技术的硬件资源隔离

2）Apache的虚拟主机功能是基于用户请求不同IP地址、主机域名或端口号

### 基于IP

**基于IP**：服务器有多个IP地址，每个IP地址与服务器上部署的网站相对应

1）当用户请求不同的IP地址时，就访问到不同网站的页面资源

如：配置基于IP地址的虚拟主机

1）配置eno16777736，使其拥有3个IP地址；

2）重启网络，并验证3个IP地址的连通性

3）创建各个IP地址的网站数据存储目录和索引页面

4）配置httpd服务的主配置文件/etc/httpd/conf/httpd.conf

5）配置SELinux安全上下文

6）访问192.168.121.28、192.168.121.29和192.168.121.30

### 基于域名

**基于域名**：根据不同的域名请求，进而传输不同的内容

1）服务器上有且仅有一个可用的IP地址

2）可通过配置DNS解析服务或者/etc/hosts文件实现

//httpd服务会自动识别域名

如：配置基于主机域名的虚拟主机

1）配置/etc/hosts文件实现类似域名解析功能；

2）创建各个IP地址的网站数据存储目录和索引页面；

3）配置httpd服务的主配置文件/etc/httpd/conf/httpd.conf

4）配置SELinux安全上下文；

5）访问www.mwl128.com、www.mwl129.com、www.mwl130.com

### 基于端口

**基于端口**：根据不同的端口请求，进而传输不同的内容

1）默认端口号为：80、81、443、488、8008、8009、8443、9000

//httpd服务会自动识别端口

如：配置基于主机端口的虚拟主机

1）创建各个IP地址的网站数据存储目录和索引页面；

2）配置httpd服务的主配置文件/etc/httpd/conf/httpd.conf（先指定端口）；

3）配置SELinux安全上下文；

4）配置SELinux开发6111和6222端口给httpd服务；

5）访问192.168.121.128：6111和192.168.121.128：6222

## 访问控制

**访问控制**：Apache程序基于源主机名、源IP或源主机上的浏览器等特征信息对网站上的资源进行访问限制；

指令
说明

Allow
允许指定主机访问服务器上的网站资源

Deny
拒绝指定主机访问服务器上的网站资源

Order
定义Allo和Deny指令的作用顺序

1）匹配按照作用顺序进行匹配

2）Order Allow，Deny或Order Deny，Allow三者组成参数

//常用于.conf配置文件控制文档的访问权限

“Order Allow，Deny”先将源主机与允许规则进行匹配

1）匹配成功则允许访问，反之则拒绝访问请求（实现全部都不允许）

2）“Order Deny，Allow”实现全部都允许访问

如：案例1

//httpd服务在执行时，会根据Order指定的顺序执行，如图中右下角，虽然Allow指定允许全部（但作用顺序不是最后一个），因此httpd服务执行到Deny时，就会拒绝IP1和IP2的访问

如：案例2
