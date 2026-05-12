# 11、MySQL 教程 - MySQL 用户管理
- 来源：https://ddkk.com/zhuanlan/db/mysql/8/11.html
- 分类：缓存数据库
- 分组：教程目录
## 配置用户

列出服务器：`SHOW STATUS；`

列出服务器报错信息：`SHOW ERRORS；`

列出服务器警告信息：`SHOW WARINGS；`

### 用户管理

MySQL所有用户相关信息默认存储在mysql的数据库中

如：查看系统中已有的用户

//user表中的user字段含有所有的用户名

创建用户格式：`CREATE USER 用户名 IDENTIFIED BY ‘明文密码’；`

1）IDENTIFIED BY为给用户配置密码（可省略），且自动加密

2）也可直接插入数据至user表以添加用户（不建议使用，损害服务器本身）

重命名用户格式：`RENAME USER 原用户名 TO 新用户名；`

删除用户格式：`DROP USER 用户名；`

1）删除用户时，会同时删除该用户的权限

修改用户密码格式：`set password for 用户名@主机名 = password(‘明文密码’)`

1）用户名和主机名用于指定主机下的用户（不指定，则为当前用户）；

2）`password（）`函数代表对明文密码进行加密

### 权限管理

列出指定用户权限格式：`SHOW GRANTS FOR 用户名@主机名；`

1）新创建的用户默认仅有访问权限（仅能登录），不能查看/操作任何数据

添加指定用户权限格式：`GRANT 权限1，权限N ON 范围 TO 用户名；`

移除指定用户权限格式：`REVOKE 权限1，权限N ON 范围 FROM 用户名；`

1）添加/移除用户权限时，该用户必须是已存在的用户；

2）针对数据库/表所添加的权限，在数据库/表被删除，又建立同名数据库/表时其所添加的权限对新表依然存在，并起作用

指定的范围如下：

范围
说明

数据库.表
指定数据库中的指定表

数据库.*
指定数据库中所有的表

*.*
所有数据库中所有的表

ALL
整个服务器

指定权限如下：

权限
说明

ALL
除GRANT OPTION以外的所有权限

ALL PRIVILEGES
所有权限

USAGE
无任何权限（仅登录）

用户相关权限
说明

CREATE USER
可使用CREATE USER、 DROP USER、RENAME USER 和REVOKE ALL PRIVILEGES

GRANT OPTION
可使用GRAN和REVOKE

数据相关权限
说明

SELECT
可使用SELECT

UPDATE
可使用UPDATE

DELETE
可使用DELETE

表相关权限
说明

CREATE
可使用CREATE TABLE

ALTER
可使用ALTER TABLE

DROP
可使用DROP TABLE

LOCK TABLES
可使用LOCK TABLES

视图相关权限
说明

CREATE VIEW
可使用CREATE VIEW

SHOW VIEW
可使用SHOS VIEW

存储过程相关权限
说明

CREATE ROUTINE
可使用CREATE PROCEDURE

ALTER ROUTINE
可使用ALTER PROCEDURE 和DROP PROCEDURE

EXECUTE
可使用CALL和存储过程

其他相关权限
说明

SHOW DATABASES
可使用SHOW DATABASES

CREATE TERMPORARY TABLES
可使用CREATE TERMPORARY TABLES

INDEX
可使用CREATE INDEX 和DROP INDEX

FILE
可使用SELECT INTO OUTFILE 和LOAD DATA INFILE

PROCESS
可使用SHOW FULL PROCESSLIST

RELOAD
可使用FLUSH

系统相关权限
说明

REPLICATION CLIENT
服务器位置的访问

REPLICATION SLAVE
用于主从复制

SHUTDOWN
可使用MYSQLADMIN SHUTDOWN（关闭MySQL）

SUPER
可使用CHANGE MASTER、KILL、LOGS、PURGE、MASTER和SET GLOBAL

如：添加mwl用户对mysql数据库的user表具有增、删、改和查权限（并验证）

如：移除mwl用户对mysql数据库的user表具有增、删、改和查权限（并验证）
