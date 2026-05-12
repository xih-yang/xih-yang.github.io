# 05、MyCat 实战 - 垂直拆分 分库
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/3/5.html
- 分类：分库分表
- 分组：教程目录
## 垂直拆分——分库

一个数据库由很多表的构成，每个表对应着不同的业务，垂直切分是指按照业务将表进行分类，

分布到不同的数据库上面，这样也就将数据或者说压力分担到不同的库上面

如图：

系统被切分成了，用户，订单交易，支付3个模块。

## 1、如何划分表

注意：**在两台主机上的两个数据库中的表，不可以关联查询。**

分库的原则： **有紧密关联关系的表应该在一个库里，相互没有关联关系的表可以分到不同的库里。**

```java
#客户表 rows:20万
CREATE TABLE customer(
 id INT AUTO_INCREMENT,
 NAME VARCHAR(200),
 PRIMARY KEY(id)
);
```

```java
#订单表 rows:600万
CREATE TABLE orders(
 id INT AUTO_INCREMENT,
 order_type INT,
 customer_id INT,
 amount DECIMAL(10,2),
 PRIMARY KEY(id)
);
```

```java
#订单详细表 rows:600万
CREATE TABLE orders_detail(
 id INT AUTO_INCREMENT,
 detail VARCHAR(2000),
 order_id INT,
 PRIMARY KEY(id)
);
```

```java
#订单状态字典表 rows:20
CREATE TABLE dict_order_type(
 id INT AUTO_INCREMENT,
 order_type VARCHAR(200),
 PRIMARY KEY(id)
);
```

客户表分在一个数据库，另外三张都需要关联查询，分在另外一个数据库。

## 2 、实现分库

**1、修改schema配置文件**

**：指定当前表所在的指定的节点位置（即所在的数据库）**

**2、新增两个数据库**

分库操作不是在原来的老数据库上进行操作，需要准备两台机器分别安装新的数据库

#在数据节点 dn1、dn2 上分别创建数据库 orders

CREATE DATABASE orders;

**3、 启动 Mycat**

./mycat console

**4、 访问 Mycat 进行分库**

**在mycat上进行创建表**

mysql> use TESTDB;

Reading table information for completion of table and column names

Youcan turn off this feature to get a quicker startup with -A

Database changed

mysql>

mysql>

mysql>

mysql> CREATE TABLE customer(

->id INT AUTO_INCREMENT,

->NAME VARCHAR(200),

->PRIMARY KEY(id)

->);

Query OK, 0 rows affected (0.14 sec)

mysql> CREATETABLE orders(

*-> id INT AUTO_INCREMENT,

->order_type INT,

->customer_id INT,

->amount DECIMAL(10,2),

->PRIMARY KEY(id)

->);

Query OK, 0 rows affected (0.11 sec)*

mysql> CREATE TABLE orders_detail(

->id INT AUTO_INCREMENT,

->detail VARCHAR(2000),

->order_id INT,

->PRIMARY KEY(id)

->);

Query OK, 0 rows affected (0.06 sec)

mysql> CREATE TABLE dict_order_type(

->id INT AUTO_INCREMENT,

->order_type VARCHAR(200),

->PRIMARY KEY(id)

->);

Query OK, 0 rows affected (0.04 sec)

master1上进行查询（192.168.199.231）

```java
mysql> use orders;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
mysql> show tables;
+------------------+
| Tables_in_orders |
+------------------+
| dict_order_type  |
| orders           |
| orders_detail    |
+------------------+
3 rows in set (0.00 sec)
```

master2上进行查询（192.168.199.120）

```java
mysql> use orders;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
mysql> show tables;
+------------------+
| Tables_in_orders |
+------------------+
| customer         |
+------------------+
1 row in set (0.00 sec)
```

**此时垂直拆分成功**
