# 03、JDBC - 教程 - JDBC环境配置
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/3.html
- 分类：缓存数据库
- 分组：教程目录
要开始使用JDBC开发应用程序，应该按照以下步骤设置您的JDBC环境。 我们假设在Windows平台上工作(开发JDBC程序)。

### 安装Java

从Java官方网站安装J2SE Development Kit 5.0(JDK 5.0)或以上版本。

### 安装MySQL数据库

最重要的事情当然是具有可以查询和修改的表的数据库，这里我们以MySQL为例来讲解JDBC的操作实例。

当然，您也可以安装最适合您的数据库。 可以有很多选择，最常见的是 -

- **MySQL数据库**：MySQL是一个开源数据库。 可以从[MySQL官方网站](http://dev.mysql.com/downloads/mysql)下载。 我们建议下载完整的Windows安装。或者可以参考我们的[MySQL安装教程](http://www.ddkk.com)。
- **PostgreSQL数据库**：PostgreSQL是一个开源数据库。可以从PostgreSQL官方网站下载。或者可以参考我们的[PostgreSQL教程](http://www.ddkk.com)。
- **Oracle数据库**：[Oracle](http://www.studyoracle.cn)数据库是由Oracle公司销售的商业数据库，可参考：[http://www.studyoracle.cn/quickstart/sql-tutorial-for-beginners-with-oracle.html](http://www.studyoracle.cn/quickstart/sql-tutorial-for-beginners-with-oracle.html)

### 安装数据库驱动程序

最新的JDK包括一个JDBC-ODBC桥接驱动程序，它使大多数开放数据库连接(ODBC)驱动程序可用于使用JDBC API的程序序。

大多数数据库供应商都在提供适当的JDBC驱动程序以及数据库安装。 所以，不应该担心这部分。

### 创建数据库

要创建`EMP`数据库，请使用以下步骤：

#### 1. 第1步

打开命令提示符，并按如下所示进入安装MySQL目的录：

```java
C:\>
C:\Program Files\MySQL\MySQL Server 5.7>bin
C:\Program Files\MySQL\MySQL Server 5.7\bin>
```

Shell

注意：`mysqld.exe`的路径可能会因系统上的MySQL安装位置而异。可以查看有关如何启动和停止数据库服务器的文档。

#### 2. 第2步

通过执行以下命令(如果它尚未运行)启动数据库服务器。

```java
C:\Program Files\MySQL\MySQL Server 5.7\bin>mysqld.exe
C:\Program Files\MySQL\MySQL Server 5.7\bin>
```

Shell

或者从服务中启动 -

#### 3. 第3步

通过执行以下命令创建`EMP`数据库 -

```java
C:\Program Files\MySQL\MySQL Server 5.7\bin>mysqladmin create EMP -u root -p
Enter password: ******
C:\Program Files\MySQL\MySQL Server 5.7\bin>
```

Shell

### 创建表

要在`EMP`数据库中创建`Employees`表，请参照以下步骤：

#### 1. 第1步

打开命令提示符，并按如下所示进入MySQL安装目录：

```java
C:\>
C:\Program Files\MySQL\MySQL Server 5.7>bin
C:\Program Files\MySQL\MySQL Server 5.7\bin>
```

Shell

#### 2. 第2步

登录到数据库如下 -

```java
C:\Program Files\MySQL\MySQL Server 5.7\bin> mysql -u root -p
Enter password: ********
mysql>
```

Shell

#### 3. 第3步

创建表`Employee`如下 -

```java
mysql> use EMP;
Database changed
mysql> create table Employees (
  id int not null,
  age int not null,
  first varchar (255),
  last varchar (255)
);
Query OK, 0 rows affected (0.08 sec)
mysql>
```

SQL

### 创建数据记录

最后，在`Employee`表中创建(插入)几条数据记录如下：

```java
mysql> INSERT INTO Employees VALUES (100, 28, 'Max', 'Su');
Query OK, 1 row affected (0.05 sec)
mysql> INSERT INTO Employees VALUES (101, 25, 'Wei', 'Wang');
Query OK, 1 row affected (0.00 sec)
mysql> INSERT INTO Employees VALUES (102, 30, 'Xueyou', 'Zhang');
Query OK, 1 row affected (0.00 sec)
mysql> INSERT INTO Employees VALUES (103, 28, 'Jack', 'Ma');
Query OK, 1 row affected (0.00 sec)
mysql>
```

SQL

现在，来看看 `Employees` 表中的数据 -

```java
mysql> select * from employees;
+-----+-----+--------+-------+
| id  | age | first  | last  |
+-----+-----+--------+-------+
| 100 |  28 | Max    | Su    |
| 101 |  25 | Wei    | Wang  |
| 102 |  30 | Xueyou | Zhang |
| 103 |  28 | Jack   | Ma    |
+-----+-----+--------+-------+
4 rows in set (0.00 sec)
mysql>
```

SQL

现在，已经准备好了使用JDBC的前期工作。 下一章学习JDBC编程示例。
