# 15、Linux 实战 - 软件包管理
- 来源：https://ddkk.com/zhuanlan/server/linux/5/15.html
- 分类：服务器框架
- 分组：教程目录
## 软件包管理

### 软件包分类

Linux中现在使用的软件安装包有两种，一种是源码包，另一种是二进制包。

#### 源码包

**优点**：

- 开源：如果有足够的能力，可以修改源代码。
- 可以自由选择所需的功能。
- 软件是编译安装，所以更加适合自己的系统，更加稳定效率也更高。
- 卸载方便。

**缺点**：
- 安装步骤很多，尤其是安装大的软件集合时，容易拼写错误。
- 编译过程时间较长，安装比二进制包要长很多。
- 因为是编译安装，安装过程中一旦报错新手很难解决。

#### 二进制包

现在Linux主要分为三种系列，Redhat系、Debian系、Arch系，这些Linux区分的主要因素就是他们的包管理系统，Redhat系列使用RPM管理器，Debian系使用DPKG管理，Arch使用pacman管理器，实际使用大同小异，下面皆以CentOS8的RPM管理器为例学习。

**优点**：

- 包管理系统简单，只通过几个命令就可以实现包的安装、升级、查询和卸载。
- 安装速度比源码包安装快的多。

**缺点**：

- 经过编译，看不到源代码。
- 功能选择不如源码包灵活。
- 依赖性，有些安装包有依赖环境，没有依赖环境就无法运行，所以要安装所需包必须先安装依赖包。

#### 选择

- 源码包：如果是为大量的客户端提供访问的，建议使用源码包，源码包效率更高。
- RPM包：如果程序是给少量用户访问，建议RPM包，因为RPM管理方便。

### 依赖性

- 树形依赖：a——>b——>c

先装安装c，再装b，再装a。
- 环形依赖：a——>b——>c——>a

a、b、c一起安装。
- 模块依赖(函数库依赖)：

有些软件安装时会报错，显示需要某些文件，而不是报错需要哪些软件，就像Windows中有时装软件会报错缺少什么.dll文件，这是要想知道装什么软件，可以在rpmfind.net搜索，根据文件搜索所需的软件。

### rpm包安装

#### rpm包命名规则

```java
2.4.37-43.module_el8.5.0+1022+b541f3b1
#2.4.37   软件版本
#43       软件发布的次数
#e18      EL8是适合Red Hat 8.x，CentOS 8.x下使用的包 
```

在Linux中，未安装的软件操作时要使用包全名，且要注意使用绝对路径，已安装的软件操作时可以用软件名，因为安装时会把软件记录到系统数据库中。

#### rpm包安装和卸载

- 安装命令

```java
rpm -ivh 包全名
# -i 安装
# -v 显示更详细的信息(verbose)
# -h 显示安装进度(hash)
```

选项
含义

- -prefix
指定rpm包安装路径，如果指定了安装路径，系统会找不到这些安装的软件，需要手工配置才能被系统识别，一般不建议修改安装路径。

- -nodeps
不检测依赖性安装，安装时不会使用。

- -replacefiles
替换文件安装，如果安装时有部分文件已经存在，会报错，这个选项会忽略此错误，覆盖安装。

- -replacepkgs
强制安装，如果软件包已经安装，会覆盖安装。

- -force
强制安装，不管有没有安装都会重新再安装一遍，相当于–replacefiles和replacepkgs的集合。

- -test
测试安装，可以用来检测一下依赖性。

- 升级命令

```java
rpm -Uvh 包全名
#-U 升级安装，如果没有安装过，系统直接安装，如果已安装版本比软件包版本旧，升级安装。
rpm -Fvh 包全名
#-F 升级安装，如果没有安装过，不安装，有旧版本，升级安装。
```

- 卸载命令

```java
rpm -e 软件名
```

注：yum安装时会先安装依赖的软件包，卸载时会先卸载依赖要卸载软件的软件包，初学者建议不要用yum卸载，以防卸载掉一些系统必须的软件包。

#### 服务命令

- 服务启动

```java
service 服务名 start | stop | restart | status
#参数
#start 启动服务
#stop 停止服务
#restart 重启服务
#status 查看服务状态
```

注：**绝大部分rpm包**安装的软件可以用这种方式启动服务

**例：rpm包安装的Apache**

- 启动：

```java
#1   redhat系专用命令
service httpd restart
#2
/etc/rc.d/init.d/httpd start|restart|stop
```

- 网页位置

```java
#rpm包安装的apache默认位置：/var/www/html   
#默认网页文件名index.html
vim index.html
```

- 配置文件

```java
/etc/httpd/conf/httpd.conf
```

### rpm查询命令

- 查询某个软件包是否安装

```java
[root@ddkk.com ~]# rpm -q httpd
httpd-2.4.37-43.module_el8.5.0+1022+b541f3b1.x86_64
```

- 查询已安装的软件包

```java
[root@ddkk.com ~]# rpm -qa
```

- 查询相关的软件包

```java
[root@ddkk.com ~]# rpm -qa | grep ssh  查询已安装的名字中带有ssh的软件包
openssh-server-8.0p1-9.el8.x86_64
libssh-config-0.9.4-3.el8.noarch
openssh-clients-8.0p1-9.el8.x86_64
libssh-0.9.4-3.el8.x86_64
openssh-8.0p1-9.el8.x86_64
```

- 查询已安装的软件包的详细信息

```java
[root@ddkk.com ~]# rpm -qi 软件名
```

- 查询未安装的软件包的详细信息

```java
[root@ddkk.com ~]# rpm -qip 包全名
```

- 查询软件包中的文件列表

```java
[root@ddkk.com ~]# rpm -ql 软件名
```

- 查询未安装的软件包打算安装的位置

```java
[root@ddkk.com ~]# rpm -qlp 包全名
```

- 查询系统文件属于哪个软件包

```java
[root@ddkk.com ~]# rpm -qf 文件名
```

- 查询软件包依赖的文件

```java
[root@ddkk.com ~]# rpm -qR 软件名
```

### 验证

- 校验已安装的软件包

```java
[root@ddkk.com ~]# rpm -V 已安装的包名
# -V	校验指定rpm包中的文件
[root@ddkk.com ~]# rpm -Va 
#校验系统中已经安装的软件包
# -a 系统中所有安装的软件包
```

- 校验某个系统文件是否被修改

```java
[root@ddkk.com ~]# rpm -Vf 系统文件名
```

例：

```java
[root@ddkk.com etc]# rpm -Vf man_db.conf
S.5....T.  c /etc/man_db.conf
```

如果文件被修改，会给出提示，下面列出一些提示符的含义：

提示符
含义

S
文件大小改变。

M
文件的类型或者文件的权限改变。

5
文件MD5校验码改变。

D
设备的主从代码改变。

U
文件的所有者改变。

L
文件的路径改变。

G
文件的所属组改变。

T
文件的修改时间改变。

最后一位代表文件的类型：

提示符
含义

c
配置文件。

d
普通文档。

g
"鬼"文件，不应该被这个rpm 包所含。

l
授权文件。

r
描述文件。

### 数字证书

未安装的软件包可以通过数字证书检验软件包是否经过修改。

“CentOS 计划发布的每个稳定 RPM 软件包都使用 GPG 签名进行签名。默认情况下，yum 和图形更新工具将验证这些签名，并拒绝安装任何未签名或签名不正确的软件包。”

CentOS8中自带数字证书，7及之前的版本可以在光盘镜像文件中找到，并安装。

```java
rpm --import RPM-GPG-KEY-CentOS-7
```

### rpm中文件提取

#### cpio命令

cpio是一个备份和还原的命令，还可以用来提取rpm包中的文件。

```java
rpm2cpio 包全名 | cpio -idv .文件绝对路径
```

### rpm包在线安装(yum安装)

#### yum源文件解析

yum源配置文件都保存在/etc/yum/repos.d目录中，文件的拓展名一定是".repo"，也就是说，yum源配置文件只要拓展名是".repo"就会生效。

以baseos为例：

```java
[baseos]
name=CentOS Stream $releasever - BaseOS
mirrorlist=http://mirrorlist.centos.org/?release=$stream&arch=$basearch&repo=BaseOS&infra=$infra
#baseurl=http://mirror.centos.org/$contentdir/$stream/BaseOS/$basearch/os/
gpgcheck=1
enabled=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-centosofficial
```

- [baseos]：容器名称，一定要放在"[]"中。
- name：镜像说明，可以自己随便写。
- mirrorlist：镜像站点。
- baseurl：yum源服务器的地址，默认是CentOS官方的yum源服务器，是可以使用的，如果觉得慢，可以改成国内的yum源地址，清华、网易的镜像源，baseurl和mirror必须保留一个。
- gpgcheck：数字证书，如果是1就生效，0就表示数字证书不生效。
- enabled：此容器是否生效，1生效，0不生效。
- gpgkey：数字证书的公匙文件保存位置。

#### 搭建本地yum源

- 放入光盘，并把光盘挂载到指定位置。
- 修改其他几个yum源的拓展名，让它们失效，因为yum源的生效是靠拓展名".repo"，所以改个拓展名就会失效了。
- 修改yum源配置文件CentOS-Media.repo。

```java
[media-baseos]  容器名，也可以改成相应的名字
name=CentOS Stream $releasever - Media - BaseOS
baseurl=file:///media/CentOS/BaseOS  yum本地源目录，改成相应的目录，不存在的目录删除或注释掉
        file:///media/cdrom/BaseOS
        file:///media/cdrecorder/BaseOS
gpgcheck=1
enabled=0  启用时将0改为1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-centosofficial=
```

#### yum命令

- 查询

```java
yum list  
#列出yum源服务器上所有可安装的软件包列表
yum list 软件名
#查询某个具体的软件包
yum search 关键字
#根据关键字进行搜索yum源中的软件包
yum info 软件名
#查询某个软件的具体信息
```

- 安装

```java
yum install 软件名
```

- 升级

```java
yum update 软件名
#升级某个具体的软件
yum update
#升级系统内所有课升级的软件包，包括系统内核,生产环境中是以稳定为先的，所以一般不这样直接升级。
```

- 卸载

```java
yum remove 软件名
```

由于yum卸载命令会卸载掉依赖此软件的软件包，可能会误卸载掉重要的系统文件，所以不推荐用yum命令进行卸载。

#### yum组管理命令

按照软件包组管理软件。

-查询可以安装的软件组。

```java
yum grouplist
```

- 查询组中包含的软件包

```java
yum groupinfo 软件包组名
```

- 安装软件组

```java
yum groupinstall 软件包组名
```

- 卸载软件组

```java
yum groupremove 软件包组名
```
