# 02、MariaDB 安装
- 来源：https://ddkk.com/zhuanlan/db/mariadb/2.html
- 分类：缓存数据库
- 分组：教程目录
MariaDB的所有下载都位于官方MariaDB基金会网站的下载部分。 单击所需版本的链接，并显示多个操作系统，体系结构和安装文件类型的下载列表。

## 在LINUX / UNIX上安装

如果你熟悉Linux / Unix系统，只需下载源码来构建你的安装。 我们推荐的安装方式是使用分发包。 MariaDB提供用于以下Linux / Unix发行版的软件包 –

- RedHat / CentOS / Fedora
- Debian / Ubuntu

以下发行版在其存储库中包含MariaDB软件包 –

- openSUSE
- Arch Linux
- Mageia
- Mint
- Slackware

按照以下步骤在Ubuntu环境中安装 –

**步骤1** - 以root用户身份登录。

**步骤2** - 导航到包含MariaDB包的目录。

**步骤3** - 使用以下代码导入GnuPG签名密钥 –

```sql
sudo apt-key adv --recv-keys --keyserver keyserver.ubuntu.com 0xcbcb082a1bb943db
```

**步骤4** - 将MariaDB添加到sources.list文件。 打开文件，并添加以下代码 –

```sql
sudo add-apt-repository 'deb http://ftp.osuosl.org/pub/mariadb/repo/5.5/ubuntuprecise main'
```

**步骤5** - 刷新系统以下 –

```sql
sudo apt-get update
```

**步骤6** - 安装MariaDB与以下 –

```sql
sudo apt-get install mariadb-server
```

## 在Windows上安装

找到并下载自动安装文件（MSI）后，只需双击该文件即可开始安装。 安装向导将指导您完成每个安装步骤和任何必要的设置。

通过从命令提示符启动来测试安装。 导航到安装的位置（通常位于目录中），然后在提示符下键入以下内容：

```sql
mysqld.exe --console
```

如果安装成功，您将看到与启动相关的消息。 如果这没有出现，您可能有权限问题。 确保您的用户帐户可以访问应用程序。 图形客户端可用于在Windows环境中的MariaDB管理。 如果你发现命令行不舒服或麻烦，一定要试试他们。

## 测试安装

执行几个简单的任务，以确认MariaDB的功能和安装。

**使用管理实用程序获取服务器状态**

使用mysqladmin二进制查看服务器版本。

```sql
[root@host]# mysqladmin --version
```

它应显示版本，分发，操作系统和体系结构。 如果您看不到该类型的输出，请检查您的安装是否存在问题。

**使用客户端执行简单命令**

打开MariaDB的命令提示符。 这应该连接到MariaDB并允许执行命令。 输入一个简单的命令如下 –

```sql
mysql> SHOW DATABASES;
```

## 安装后

成功安装MariaDB后，设置root密码。 全新安装将具有空白密码。 输入以下内容设置新密码 –

```sql
mysqladmin -u root password "[enter your password here]";
```

输入以下内容以使用新凭据连接到服务器 –

```sql
mysql -u root -p
Enter password:*******
```

## 在Windows上升级

如果您已经在您的Windows系统上安装了MySQL，并且想要升级到MariaDB; 不卸载MySQL并安装MariaDB。 这将导致与现有数据库的冲突。 您必须改为安装MariaDB，然后在Windows安装文件中使用升级向导。

MySQL my.cnf文件的选项应该与MariaDB配合使用。 但是，MariaDB有许多功能，这在MySQL中找不到。

请考虑您的my.cnf文件中的以下冲突 –

- MariaDB默认为临时文件使用Aria存储引擎。 如果您有很多临时文件，如果不使用MyISAM表，请修改键缓冲区大小。
- 如果应用程序频繁连接/断开连接，请更改线程高速缓存大小。
- 如果使用超过100个连接，请使用线程池。

### 兼容性

MySQL和MariaDB本质上是相同的。 但是，有足够的差异来创建升级问题。 查看[MariaDB知识库](https://mariadb.com/kb/en/mariadb/mariadb-vs-mysql-compatibility/)中的更多关键差异。
