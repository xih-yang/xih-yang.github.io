# 27、Linux 实战：Linux-BIND
- 来源：https://ddkk.com/zhuanlan/server/linux/2/27.html
- 分类：服务器框架
- 分组：教程目录
## BIND

**BIND（Berkeley Internet Name Domain）** ：伯克利因特网名称域

1）基于DNS开发的域名解析服务程序

2）配置BIND程序时，需同时配置chroot（牢笼机制）扩展包

//BIND程序仅能对本身配置文件操作

## DNS

**DNS**（Domain Name System）域名系统：实现域名和IP的正向/反向解析

1）正向解析是域名解析为IP、反向解析是IP解析为域名

2）反向解析一般用于屏蔽指定IP上绑定的所有域名和判断IP上运行的网站

如：DNS域名解析服务采用的目录树层次结构

1）** 主服务器**：负责特定区域内的域名和IP之间的映射关系和维护（唯一性）

2）** 从服务器**：从主服务器中获得域名和IP的映射关系并进行维护

3）** 缓存服务器**：通过向其他域名解析服务器请求获得域名和IP的映射关系

//将经常查询的域名信息保存至该服务器本地（提高重复查询效率）

用户请求域名查询时，有以下两种方式：

1）** 递归查询**：客户端发送请求到本地DNS服务器，本地DNS服务器负责完成查询并提供完整响应（代替用户查询，并把最终结果返回至用户）

2）** 迭代查询**：客户端发送请求到本地DNS服务器，如果该服务器不能匹配请求，则将提供另一个负责解析该域名的服务器，客户端将查询请求重新发送到新的DNS服务器（以此类推，直接能匹配请求）

如：用户向DNS服务器发起域名查询请求的流程

//用户和DNS服务器之间是递归查询，DNS服务器和DNS服务器之间是迭代查询

## 配置

BIND安装指令：yum install -y bind-chroot

如：在系统中安装BIND程序和chroot扩展包

named-checkconf命令：检验/etc/named.conf配置文件的语法和参数

指令格式：named-checkconf

named-checkzone命令：检验/etc/named.rfc1912.zones配置文件的语法和参数

指令格式：named-checkzone

BIND程序的配置文件有以下三种：

（1）/etc/named.conf文件：主配置文件，定义named服务运行的规则

1）BIND程序在Linux系统中以“named”服务名运行

如：查看/etc/named.conf文件

（2）/etc/namd.rfc1912.zones文件：指定存储域名和IP映射关系的文件

1）服务类型有三种：hint（根区域）、master（主区域）和slave（辅助区域）

如：配置/etc/namd.rfc1912.zones文件中正向/反向解析参数

1）正向解析参数；

2）反向解析参数

（3）/var/named目录：存储域名和IP的映射关系文件

如：查看/var/named/named.localhost模板文件

## 主服务器

**主服务器**：负责解析和维护域名和IP的映射关系

### 正向解析

配置named服务正向解析步骤：

1）配置named服务的主配置文件/etc/named.conf；

2）配置named服务/etc/named.rfc1912.zones配置文件；

3）利用/var/named/named.localhost模板文件配置数据配置文件；

//cp命令使用-a参数以确保保留原始文件属性信息（named服务可调用）

4）验证

nslookup命令：检测能否从DNS服务器中查询域名/IP的解析记录

指令格式：nslookup 域名/IP

### 反向解析

配置named服务正向解析步骤：

1）配置named服务的主配置文件/etc/named.conf；

2）配置named服务/etc/named.rfc1912.zones配置文件；

//反向解析定义zone时必须将IP地址反写

3）利用/var/named/named.localhost模板文件配置数据配置文件；

4）验证

## 从服务器

**从服务器**：对主服务器进行备份解析记录和负责均衡

1）从服务器能够从主服务器中指定的区域获得数据文件

配置从服务器步骤：

1）配置主服务器的named服务的/etc/named.rfc1912.zones配置文件

2）配置从服务器的named服务的/etc/named.rfc1912.zones配置文件

3）验证从服务器

### 加密传输

为主服务器和从服务器配置TSIG加密机制以提供区域信息的安全性

1）TSIG（RFC 2845）：使用密码编码的方式保护区域信息的传输（Zone Transfer）

**dnssec-keygen命令**：生成用于DNS加密传输的密钥对

指令格式：dnssec-keygen 选项

1）默认在执行命令的目录下生成公钥（private）和密钥（key）文件

选项
含义

-a
指定加密算法 （如：RSA、RSASHA1、DSA、NSEC3DSA和HMAC-MD5等）

-b
指定密码长度

-n
指定密钥类型

如：配置主服务器和从服务器的安全加密传输

1）在主服务器中生成密钥；

2）在主服务器中创建密钥验证文件；

密钥验证文件路径：/var/named/chroot/etc/transfer.key

内容格式：密钥名称、加密算法、公钥文件中的Key

3）在主服务器中配置密钥验证文件属性，并生成链接文件到/etc目录下；

4）在主服务器中配置named服务的主配置文件/etc/named.conf

5）在从服务器中创建密钥验证文件和配置属性，并生成链接文件到/etc目录下；

6）在主服务器中配置named服务的主配置文件/etc/named.conf

//指定主服务器IP和密钥名称参数不能写在前面（47行左右最为合适）

防止named配置文件加载到密钥验证时，其他参数尚未加载完成

7）验证从服务器

## 缓存服务器

**缓存服务器（Caching DNS Server）** ：仅负责将常用域名和IP存储到本地服务器

如：配置缓存服务器

1）在缓存服务器中配置named服务主配置文件/etc/named.conf；

## 分离解析

**分离解析**：实现不同网段的用户访问相同网址/IP时，能从不同的DNS服务器获得相同的数据（提升访问效率）

1）DNS服务器不能同时实现分离解析功能和根服务器功能（有冲突）

如：分析解析实现的功能

如：配置具有分离解析的DNS服务器

1）配置named服务主配置文件/etc/named.conf；

2）配置named服务的/etc/named.rfc1912.conf配置文件；

3）利用/var/named/named.localhost模板文件配置数据配置文件；
