# 06、MariaDB 管理
- 来源：https://ddkk.com/zhuanlan/db/mariadb/6.html
- 分类：缓存数据库
- 分组：教程目录
在尝试运行MariaDB之前，首先确定其当前状态，运行或关闭。 有三个选项用于启动和停止MariaDB –

- 运行mysqld（MariaDB脚本）。
- 运行mysqld_safe启动脚本。
- 运行mysql.server启动脚本。

如果您将MariaDB安装在非标准位置，则可能需要在脚本文件中编辑位置信息。 只需在脚本中添加“停止”参数，即可停止MariaDB。

如果您想在Linux下自动启动它，请将启动脚本添加到init系统中。 每个分发具有不同的过程。 请参阅系统文档。

## 创建用户帐户

使用以下代码创建新的用户帐户 –

```sql
'newusername'@'localhost' IDENTIFIED BY 'userpassword';
```

此代码向用户表中添加一行没有任何权限。 您还可以选择使用哈希值作为密码。 使用以下代码授予用户权限 –

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON database1 TO 'newusername'@'localhost';
```

其他权限包括MariaDB中可能的每个命令或操作。 创建用户后，执行“FLUSH PRIVILEGES”命令以刷新授权表。 这允许使用用户帐户。

## 配置文件

在Unix / Linux上构建之后，应该编辑配置文件“/etc/my.conf”以显示如下 –

```sh
# Example mysql config file.
# You can copy this to one of:
# /etc/my.cnf to set global options,
# /mysql-data-dir/my.cnf to get server specific options or
# ~/my.cnf for user specific options.
#
# One can use all long options that the program supports.
# Run the program with --help to get a list of available options
# This will be passed to all mysql clients
[client]
#password = my_password
#port = 3306
#socket = /tmp/mysql.sock
# Here is entries for some specific programs
# The following values assume you have at least 32M ram
# The MySQL server
[mysqld]
#port = 3306
#socket = /tmp/mysql.sock
temp-pool
# The following three entries caused mysqld 10.0.1-MariaDB (and possibly other
   versions) to abort...
# skip-locking
# set-variable = key_buffer = 16M
# set-variable = thread_cache = 4
loose-innodb_data_file_path = ibdata1:1000M
loose-mutex-deadlock-detector
gdb
######### Fix the two following paths
# Where you want to have your database
data = /path/to/data/dir
# Where you have your mysql/MariaDB source + sql/share/english
language = /path/to/src/dir/sql/share/english
[mysqldump]
quick
MariaDB
8
set-variable = max_allowed_packet=16M
[mysql]
no-auto-rehash
[myisamchk]
set-variable = key_buffer = 128M
```

编辑行”data =”和”language =”以匹配您的环境。

文件修改后，导航到源目录并执行以下操作 –

```sql
./scripts/mysql_install_db --srcdir = $PWD --datadir = /path/to/data/dir --
   user = $LOGNAME
```

如果您将datadir添加到配置文件，请忽略“ `$` PWD”变量。 确保运行10.0.1版本的MariaDB时使用“ `$` LOGNAME”。

## 管理命令

查看以下您将在使用MariaDB时经常使用的重要命令列表：

- **USE [database name]** - 设置当前默认数据库。
- **SHOW DATABASES** - 列出服务器上当前的数据库。
- **SHOW TABLES** - 列出所有非临时表。
- **SHOW COLUMNS FROM [table name]** - 提供与指定表有关的列信息。
- **SHOW INDEX FROM TABLENAME [table name]** - 提供与指定表相关的表索引信息。
- **SHOW TABLE STATUS LIKE [table name] \ G** - – 提供有关非临时表的信息的表，以及LIKE子句用于获取表名后显示的模式。
