# 01、MySQL 提升 - 数据库管理(用户、用户权限、schemas库操作)
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/1.html
- 分类：缓存数据库
- 分组：教程目录
**目录**

一，启动mysql镜像

1,使用mysql:5.7.30镜像启动一个容器

2，修改容器的字符集

二，用户管理

1，创建用户

2，删除用户

三、用户的权限管理

1，给用户增加权限：

**1、** 1设置权限；

**1、** 2添加权限；

2撤销用户的某些权限

3控制具体到某个列的权限

4，刷新权限

5，权限说明：

四、库schemas管理

1，创建schemas（库）

2，设置库的默认字符集

3，删除schemas（库）

五、数据表管理

1，创建表：

2，删除表

基于mysql5.7.30 docker版本

## 一，启动mysql镜像

### 1,使用mysql:5.7.30镜像启动一个容器

```java
docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=我的密码 -d mysql:5.7.30
```

把容器的3306端口映射到宿主机的3306端口上

给root用户设置一个密码

此时就可以使用远程工具使用root用户连接该数据库了，当然也可以进入容器使用mysql客户端使用命令行模式来操作数据库。

### 2，修改容器的字符集

如果要在该容器中使用中文，需要改一下:

查看容器支持的字符集：

```java
root@mysql:/# locale -a
C
C.UTF-8
POSIX
```

更新字符集：

```java
echo "export LANG=C.UTF-8" >>/etc/profile && source /etc/profile
```

## 二，用户管理

### 1，创建用户

语法：CREATE USER '用户名'@'可登录ip' IDENTIFIED BY '密码';

创建用户名为:testuser1

可登录ip：%标示所有IP都可以访问

密码：123456

```java
CREATE USER 'testuser1'@'%' IDENTIFIED BY '123456';
```

可以看到此时user表中，select、insert、update、delete、create等所有权限都是没有的(可以登录，但是什么都干不了)

### 2，删除用户

语法：drop user '用户名'@'可登录ip';

## 三、用户的权限管理

### 1，给用户增加权限：

#### 1.1 设置权限

语法：GRANT 权限 ON 数据库名.表名称 TO 'username'@'ip';

下面来给testuser1用户设置一个select和update权限：

GRANT SELECT,UPDATE ON *.* TO 'testuser1'@'%';

执行结果后查看mysql.user表：

可以看到user表中testuser1这个用户现在有了select和update权限；

使用查看权限的语句再次查看一下：

```java
mysql> SHOW GRANTS FOR testuser1;
+------------------------------------------------+
| Grants for testuser1@%                         |
+------------------------------------------------+
| GRANT SELECT, UPDATE ON *.* TO 'testuser1'@'%' |
+------------------------------------------------+
1 row in set (0.00 sec)
```

#### 1.2 添加权限

现在要给testuser1这个用户在增加一个delete的权限：

```java
mysql> GRANT DELETE ON *.* TO 'testuser1'@'%';
Query OK, 0 rows affected (0.00 sec)
mysql> SHOW GRANTS FOR testuser1;
+--------------------------------------------------------+
| Grants for testuser1@%                                 |
+--------------------------------------------------------+
| GRANT SELECT, UPDATE, DELETE ON *.* TO 'testuser1'@'%' |
+--------------------------------------------------------+
1 row in set (0.00 sec)
```

小结：可以看到给用户设置权限的语句和添加权限的语句是同一个语句，是一个追加的方式，不是覆盖。

### 2 撤销用户的某些权限

现在把testuser1这个用户的update和delete权限取消

使用REVOKE关键字给用户取消权限

```java
mysql> REVOKE UPDATE,DELETE ON *.* FROM 'testuser1'@'%';
Query OK, 0 rows affected (0.00 sec)
mysql> SHOW GRANTS FOR testuser1;
+----------------------------------------+
| Grants for testuser1@%                 |
+----------------------------------------+
| GRANT SELECT ON *.* TO 'testuser1'@'%' |
+----------------------------------------+
1 row in set (0.00 sec)
```

### 3 控制具体到某个列的权限

在权限名称后加上小括号，小括号中些列名，例如：SELECT(列名1,列名2,列名3)

GRANT SELECT(列名1,列名2,列名3) ON databasename.tablename TO 'username'@'localhost'

下面来创建一个testuser2的用户，密码为123456，权限只给user表的id，name这两个字断的查询权限：

user表数据：

CREATE USER 'testuser2'@'%' IDENTIFIED BY '123456';

GRANT SELECT(id,name) ON mybatis.user TO 'testuser2'@'%';

```java
mysql> CREATE USER 'testuser2'@'%'IDENTIFIED BY '123456';
Query OK, 0 rows affected (0.00 sec)
mysql> 
mysql> GRANT SELECT(id,name) ON mybatis.user TO 'testuser2'@'%';
Query OK, 0 rows affected (0.00 sec)
```

设置成功，此时使用testuser2 这个用户来查询一下mybatis的user表：

```java
# 查看数据库，能看到mybatis这个库：
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mybatis            |
+--------------------+
2 rows in set (0.00 sec)
# 使用mybatis这个库：
mysql> use mybatis;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
# 查看数据表，发现有user表：
mysql> show tables;
+-------------------+
| Tables_in_mybatis |
+-------------------+
| user              |
+-------------------+
1 row in set (0.00 sec)
# 查询这个表的所有字断，发现报错了
mysql> select * from;
ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 1
# 只查询user表的id和name字断，可以查询出结果
mysql> select id,name from user;
+----+---------+
| id | name    |
+----+---------+
|  1 | ??      |
|  2 | ??      |
|  4 | xiaoyu  |
|  5 | xiaobai |
|  6 | xiaoqin |
|  7 |         |
+----+---------+
6 rows in set (0.00 sec)
```

### 4，刷新权限

```java
FLUSH PRIVILEGES;
```

每次修改了用户的权限之后，都需要执行一下刷新权限的命令。

### 5，权限说明：

常用的权限：

权限名
说明

INSERT
表中插入

DELETE
表中删除

UPDATE
表中修改更新

SELECT
表中查询

ALTER
修改表和索引

CREATE
创建数据库和表

DROP
删除数据库和表

INDEX
创建或删除索引

REFERENCE
外键权限

FILE
读或写服务器上的文件

PROCESS
查看服务器中的线程或杀死线程

RELOAD
重载授权表或清空日志、缓存

SHUTDOWN
关闭服务器

ALL
所有权限

USAGE
无权限的权限

## 四、库schemas管理

### 1，创建schemas（库）

语法：CREATE DATABASE 数据库名;

或者：CREATE DATABASE IF NOT EXISTS 数据库名;

### 2，设置库的默认字符集

设置为utf-8：

ALTER DATABASE 数据库名 DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

或者在创建库的时候就指定字符集：CREATE DATABASE IF NOT EXISTS 数据库名 DEFAULT CHARSET utf8 COLLATE utf8_general_ci;

### 3，删除schemas（库）

语法：DROP DATABASE 数据库名;

## 五、数据表管理

### 1，创建表：

语法：CREATE TABLE table_name (column_name column_type);

或者：CREATE TABLE IF NOT EXISTS table_name (column_name column_type);

例如：在order_lib库中创建一个product_info表

```java
CREATE TABLE product_info (
    key_id int,
    p_code varchar(32),
    p_name varchar(32),
    p_number int(8),
    p_alter int(1),
    p_create_user varchar(32),
    op_time date
);
```

### 2，删除表

语法：drop table 表名称。

例如：drop table product_info;
