# 02、Oracle 入门教程 - Oracle、PLSQL Developer 和 Navicat 的安装
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/2.html
- 分类：缓存数据库
- 分组：教程目录
## 一、oracle 数据库安装

### 1、oracle 数据库下载

（1）oracle 数据库的下载可以到 oracle 官网下载，https://www.oracle.com。

（2）点击 Downloads 按钮，进入下面的下载界面，选择 Database，进入 Database 下载区，然后找到想要下载的版本，这里选择如图所示，直接点击版本名字。

（3）点击版本后进入到下载页面，这里需要接受相关条例，才能进行下载。

（4）同意协议后往下滑动找到相应的下载版本，并找到对应的系统版本，分别点击右边的File1、File2 讲两个文件都下载下来。

（5）注意，在点击文件进行下载时，会要求登录账号，如果有账号就直接登录，没有账号可以注册一个。

### 2、oracle 数据库安装

（1）下载完成，解压分别得到连个文件夹。

两个文件夹的子文件夹都是database，所以可以将两个文件夹的子文件合并。

（2）打开database文件夹，运行 setup.exe 程序进入oracle 的安装。

（3）程序运行前，系统会进行检查。

检查完成，出现以下界面，点击是按钮。

（4）电子邮件可以不输入，下面的选项也可以不勾选，点击下一步，在弹出框中点击是按钮。

（5）选择创建和配置数据库，点击下一步。

（6）选择桌面类，点击下一步

（7）选择安装目录，将字符集改为 UTF8，输入全局数据库名 orcl 对应的管理指令，即密码，并二次输入进行验证，然后点击下一步。

在弹出框中点击是按钮。

（8）点击完成

（9）点击完成后进入安装界面，等待安装完成。

（10）安装完成，在出现的界面点击口令管理

进入下面的界面，找到用户名为 SYS、SYSTEM、SCOTT 的账号，然后分别在口令和确认口令中输入对应的密码。

SYS是超级管理员，密码为 change_on_install；

SYSTEM 是普通管理员，密码为 manager；

SCOTT 是普通用户，密码为 tiger

用户名为 SCOTT 的账户需要先取消勾选是否锁定账户。

密码对应输入完成后，点击确定，在弹出框中点击是按钮。

（11）点击确定

（12）点击关闭，完成 Oracle 数据库的安装。

### 3、测试 Oracle 数据库安装是否成功

（1）win + R 输入 cmd 进入命令行

（2）输入 sqlplus scott/tiger 会得到如下结果，则说明安装成功

## 二、Oracle 11g的管理工具

Oracle 11g提供了多种数据库管理具，常用的有SQL*Plus、Oracle企业管理器(Oracle Enterprise Manager)和数据库配置助手(Database Configuration Assistant)和其他的管理工具如PLSQL Developer和Navicat等。

### 2.1 SQL*Plus 工具

**2.1.1 SQL*Plus 介绍**

在Oracle 1 1g数据库系统中，户对数据库的操作主要是通过SQL*Plus来完成的。SQL*Plus作为Oracle的客户端工具，既可以建立位于数据库服务器上的数据连接，也可以建立位于网络中的数据连接。

**2.1.2 SQL*Plus 使用**

选择“开始”/“所有程序”/Oracle-OraDb11g_ home1/“应用程序开发”/SQL*Plus命令，打开SQL *Plus启动界面。

在命令提示符的位置输入登录用户(如SYSTEM或SYS等系统管理账户)和登录密码(密码是在安装或创建数据库时指定的)，若输入的用户名和密码正确，则SQL*Plus将连接到数据库。

另外，还可以通过在”运行”中输入cmd命令来启动命令行窗口，然后在该窗口中输入SQL *Plus命令来连接数据库，使用SQL *Plus命令连接数据库实例的语法如下:

```java
SQLPLUS username[/password] [@connect_ identifier][AS SYSOPER|SYSDBA]
```

- username：表示用户名。
-
- password：表示用户密码。
-
- @connect_ identifier：表示连接的全局数据库名，若连接本机上的默认数据库则可以省略。

注意

在输入Oracle数据库命令时，其关键字不区分大小写(比如，输入sqlplus或SQLPLUS都可以)，但参数区分大小写。

### 2.2 Oracle企业管理器

Oracle Enterprise Manager (OEM)是基于Web界面的Oracle数据库管理工具。启动Oracle 11g的OEM只需在浏览器中输入其URL地址一通常为`https://localhost:1158/em`，然后连接主页即可;也可以在”开始”菜单的"Oracle程序组”中选择Database Control - orc菜单命令来启动Oracle 11g的OEM工具。

如果是第一次使用OEM,启动Oracle 11g的OEM后，需要安装“信任证书”或者直接选择”继续浏览此网站”即可。然后就会出现OEM的登录页面，用户需要输入登录用户名(如SYSTEM、 SYS、 SCOTT等) 和登录口令。

登录成功后的界面

OEMI以图形的方式提供用户对数据库的操作，虽然操作起来比较方便简单，不需要使用大量的命令，但这对于初学者来说减少了学习操作Oracle数据库命令的机会，而且不利于读者深刻地理解Oracle数据库。

### 2.3 数据库配置助手

在安装Oracle 11g数据库管理系统的过程中，若选中”仅安装数据库软件"单选按钮，则系统安装完毕后，需要手动创建数据库才能够实现对Oracle数据库的各种操作。在Oracle 11g中，可以通过数据库配置助手(Database Configuration Assistant，DBCA) 来实现创建和配置数据库。

选择“开始”/“所有程序”/Oracle - OraDb11g_ home1/“配置和移植工具”/Database Configuration Assistant菜单命令，就会打开如下窗口。

然后，用户只需要按照向导的提示逐步进行设置，就可以实现创建和配置数据库。

### 2.4 PLSQL Developer 工具安装

**2.4.1 PLSQL Developer 下载**

PLSQL 下载官网 `https://www.allroundautomations.com/`，进入官网点击`try it free`进入下载界面

在下载界面选择对应的版本和操作系统以及32位还是64位

如果想下载PLSQ Deverloper的历史版本，可以在这个链接下载`https://www.allroundautomations.com/registered-plsqldev/`

**2.4.2 PLSQL Developer 安装**

PLSQL Developer 的安装非常简单，几乎一路点下一步就行了，下面是具体的安装步骤，以plsql1106版本为例

安装完成，点击运行，出现以下界面，需要填写oracle的账号密码和地址

也可以选择先不填写，直接进入数据库，下面是以system用户连接Oracle数据库

进入PLSQL Developer的界面如下

### 2.5 Navicat 工具安装

下载Navicat并解压，然后点击安装

可以选择快速安装也可以选择自定义安装，然后点击安装即可完成，下面是安装完成后运行的界面。

连接Oracle，点击连接，选择Oracle。

输入连接名，ip地址以及用户名和密码，先点击连接测试，看是否连接成功，再点击确定。

测似连接成功后，点击确定完成连接，连接后的界面如下

创建一个SQL语句，查询dba_users表的数据如下
