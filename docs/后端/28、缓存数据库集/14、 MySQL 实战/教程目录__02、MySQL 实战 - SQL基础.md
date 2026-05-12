# 02、MySQL 实战 - SQL基础
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/2.html
- 分类：缓存数据库
- 分组：教程目录
## 一、SQL简介

SQL(Structure Query Language) 是结构化查询语言，是关系型数据库的应用语言，大多数关系型数据库都支持SQL作为底层会话语言。

## 二、SQL使用入门

在介绍标准SQL语言的同时，我们会根据MySQL自身的特点进行扩展，这样我们不仅掌握了标准SQL语言，也对MySQL的扩展有所了解。

### 2.1 SQL分类

SQL语句主要分为三类：

- DDL（数据定义语言）：这些语句定义了不同的数据段、数据库、表、列、索引等数据库对象。常用关键字有create、drop、alter等。
- DML（数据操纵语言）：用于添加、删除、更新和查询数据库记录，并检查数据完整性。常用关键字有insert、delete、update和select等。
- DCL（数据控制语言）：用于控制不同数据段直接的许可和访问级别的语句。它定义了数据库、表、字段、用户的访问权限和安全级别。主要关键字有grant、revoke等。

### 2.2 DDL语句

DDL语句一般用于定义数据库的框架结构，比如表的创建定义及框架修改，与DML最大区别就在于DML一般只涉及表内数据的增删改查，不涉及表结构的变动，因此，一般DDL语言有数据库管理员使用较多，DML语言右开发人员使用较多。

下面将通过具体的例子来介绍MySQL中DDL语句的使用方法。

#### 1. 创建数据库

**创建数据库：**

```java
mysql> create database test1;
Query OK, 1 row affected (0.00 sec)
```

解释一下创建语句下面系统反馈回来的提示信息：“Query ok”表示上面的语句执行成功；“ 1 row affected ”表示操作只影响了数据库中一行的记录；“ 0.00sec ”则记录了操作执行的时间，这里由于太快，时间近乎为0 。

如果再次执行该语句就会报错，表示同名数据库存在，不能创建：

```java
mysql> create database test1;
ERROR 1007 (HY000): Can't create database 'test1'; database exists
```

**显示当前系统中都有哪些数据库：**

```java
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| campus             |
| china              |
| magna              |
| mydb               |
| mysql              |
| performance_schema |
| student_score      |
| sys                |
| test1              |
| userinfo           |
| whatsmodel         |
+--------------------+
12 rows in set (0.00 sec)
```

解释一下，除了information_schema , mysql , performance_schema , sys四个是系统自带的数据库外（根据版本不同，名字可能有差别，这里是是5.7版本），其余的都是自己创建的数据库。

- information_schema提供了访问数据库元数据的方式。(元数据是关于数据的数据，如数据库名或表名，列的数据类型，或访问权限等。有时用于表述该信息的其他术语包括“数据词典”和“系统目录”。) 换句换说，information_schema是一个信息数据库，它保存着关于MySQL服务器所维护的所有其他数据库的信息。(如数据库名，数据库的表，表栏的数据类型与访问权 限等。)
- mysql，核心数据库，类似于sql server中的master表，主要负责存储数据库的用户、权限设置、关键字等mysql自己需要使用的控制和管理信息。(常用的，在mysql.user表中修改root用户的密码)。
- performance_schema主要用于收集数据库服务器性能参数。并且库里表的存储引擎均为PERFORMANCE_SCHEMA，而用户是不能创建存储引擎为PERFORMANCE_SCHEMA的表。MySQL5.7默认是开启的。
- Sys库所有的数据源来自：performance_schema。目标是把performance_schema的把复杂度降低，让DBA能更好的阅读这个库里的内容。让DBA更快的了解DB的运行情况。

**选择数据库：use dbname**

例如选择数据库test1：

```java
mysql> use test1;
Database changed
```

查看当前数据库里面的表：

```java
mysql> show tables;
Empty set (0.00 sec)
由于test1是一个刚创建的数据库，里面还没有表，因此展示的结果是一个空集合
```

#### 2. 删除数据库

命令为drop database dbname; 如删掉刚才创建的test1：

```java
mysql> drop database test1;
Query OK, 0 rows affected (0.01 sec)
执行成功，但是这个0行受影响可能有点费解，但是不用管，因为mysql里面drop操作都是这个结果。
```

**注意：** 删除库要非常慎重，一旦删除里面的内容全部丢失且不可恢复，常听的程序员“删库跑路”就是这么回事。

#### 3. 创建表

基本语法： CREATE TABLE 表名(列1的名字 数据类型 约束条件，列2的名字 数据类型 约束条件，....)，比如这里在数据库test1里面创建一张名为emp的表：

**查看表结构：desc tablename；**

用desc命令查看的信息不全面，用如下命令可以查看到创建时的SQL语句及更多详细信息：

```java
mysql> show create table emp \G;    \G使记录按照字段竖向排列，易于阅读
*************************** 1. row ***************************
       Table: emp
Create Table: CREATE TABLE emp (
  ename varchar(10) DEFAULT NULL,
  hiredate date DEFAULT NULL,
  sal decimal(10,2) DEFAULT NULL,
  deptno int(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8           表的存储引擎和字符集等信息
1 row in set (0.00 sec)
ERROR:
No query specified
mysql>
```

#### 4. 删除表

语句命令为：drop table tablename；

```java
mysql> drop table emp;
Query OK, 0 rows affected (0.00sec)
```

#### 5. 修改表

对于一开始创建的表可能不够完整，后面有新的需求需要将表进行扩充，这时候就需要用到表结构修改语言，但如果你选择删除原来的表按要求建一个新表的话也可以，但是相应的数据需要重新加载，如果表正在使用对服务器也会有影响。

（1）修改表类型

alter table tablename modify [column] column_definition [first | after col_name]

例如将emp表中的ename类型修改为20个字节宽度：

```java
mysql> alter table emp modify ename varchar(20);
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc emp;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| ename    | varchar(20)   | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
4 rows in set (0.00 sec)
mysql>
```

（2）增加表字段

alter table tablename add [column] column_definition [first | after col_name]

例如再表中新增字段age，类型为int(3):

```java
mysql> alter table emp add column age int(3);
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc emp;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| ename    | varchar(20)   | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
| age      | int(3)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
5 rows in set (0.00 sec)
```

（3）删除表字段

alter table tablename drop [column] col_name

例如将age字段删掉：

```java
mysql> alter table emp drop column age;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc emp;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| ename    | varchar(20)   | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
4 rows in set (0.00 sec)
```

（4）字段改名

alter table tablename change [column] old_col_name column_definition

例如将age改名为age1，同时修改字段类型为int(4)：

```java
mysql> alter table emp add column age int(3);
Query OK, 0 rows affected (0.05 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> alter table emp change column age age1 int(4);
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc emp;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| ename    | varchar(20)   | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
| age1     | int(4)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
5 rows in set (0.00 sec)
```

**注意：** change和modify都可以修改表的字段类型，不同的是change需要写两次列名，不方便，但change可以修改列名而modify不能。

（5）修改字段的排列顺序

上面介绍的命令中有一个可选项 first | after column_name ，如果不使用的话ADD增加的字段默认在表的最后，CHANGE/MODIFY修改不会改变字段位置，但使用了这个可选项后就可以指定位置了；例如新增字段birth date在ename之后：

```java
mysql> alter table emp add birth date after ename;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc emp;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| ename    | varchar(20)   | YES  |     | NULL    |       |
| birth    | date          | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
| age1     | int(4)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
6 rows in set (0.00 sec)
```

修改age1为age int(3) 并放在最前：

```java
mysql> alter table emp change age1 age int(3) first;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc emp;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| age      | int(3)        | YES  |     | NULL    |       |
| ename    | varchar(20)   | YES  |     | NULL    |       |
| birth    | date          | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
6 rows in set (0.00 sec)
```

**注意：** CHANGE/FIRST|AFTER COLUMN 这些关键字属于MySQL在SQL上的扩展，别的数据库上不一定适用。

（6）更改表名

alter table tablename rename [to] new_tablename

如将表emp改为emp1：

```java
mysql> alter table emp rename emp1;
Query OK, 0 rows affected (0.01 sec)
mysql> desc emp;
ERROR 1146 (42S02): Table 'test1.emp' doesn't exist
mysql> desc emp1;
+----------+---------------+------+-----+---------+-------+
| Field    | Type          | Null | Key | Default | Extra |
+----------+---------------+------+-----+---------+-------+
| age      | int(3)        | YES  |     | NULL    |       |
| ename    | varchar(20)   | YES  |     | NULL    |       |
| birth    | date          | YES  |     | NULL    |       |
| hiredate | date          | YES  |     | NULL    |       |
| sal      | decimal(10,2) | YES  |     | NULL    |       |
| deptno   | int(2)        | YES  |     | NULL    |       |
+----------+---------------+------+-----+---------+-------+
6 rows in set (0.00 sec)
```

### 2.3 DML语句

DML操作是对数据库中表记录的操作，主要包括插入(insert)、更新(update)、删除(delete)、查询(select)。

#### 1. 插入记录

表的结构定义好之后就可往里面插入记录了，基本语法如下：

INSERT INTO tablename ( field1, field2,...) VALUES (value1,value2,....);

例如向表emp中插入记录：

```java
mysql> insert into emp1 (age,ename,birth, hiredate, sal, deptno) values('22','zzx1','1992-10-11','2018-01-01','5000',1);
Query OK, 1 row affected (0.00 sec)
```

也可以不用指定字段名称，但此时后面的values应该与表的字段顺序保持一致：

```java
mysql> insert into emp1 values('25','lisa','1990-05-11','2018-03-25','8000',2);
Query OK, 1 row affected (0.00 sec)
```

对于某些字段允许空值、非空但是有指定的默认值、自增长等，这些字段在insert时如果没有指定value，那么将会右系统自动配置，如：

```java
mysql> insert into emp1 (ename,sal) values('dony',1000);
Query OK, 1 row affected (0.00 sec)
mysql> select * from emp1;
+------+-------+------------+------------+---------+--------+
| age  | ename | birth      | hiredate   | sal     | deptno |
+------+-------+------------+------------+---------+--------+
|   22 | zzx1  | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa  | 1990-05-11 | 2018-03-25 | 8000.00 |      2 |
| NULL | dony  | NULL       | NULL       | 1000.00 |   NULL |
+------+-------+------------+------------+---------+--------+
3 rows in set (0.00 sec)
```

insert还有一个较好的性能就是可以一次性插入多条记录，语法如下：

INSERT INTO tablename ( field1, field2,...) VALUES (value1,value2,....)，(value1,value2,....), ..... ;

这个性能使得MySQL在插入大量记录时，节省很多网络开销，大大提高插入效率。

#### 2. 更新记录

UPDATE tablename SET field1=value1，field2=value2，... [ WHERE CONDITION ]

例如将emp表中lisa的薪水改为4000：

```java
mysql> update emp1 set sal=4000 where ename='lisa';
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0
```

MySQL里update命令允许对多个表同时进行更新：

UPDATE t1, t2, ..tn SET t1.field1=expr1，... , tn.fieldn=exprn [ WHERE CONDITION ]

比如下面这条语句：

```java
update emp a, dept b set a.sal=a.sal*b.deptno, b.deptname=a.ename where a.deptno=b.deptno;
```

**注意：** 多表更新的语法更多的用在根据一个表的字段来动态更新另一个表的字段。

#### 3. 删除记录

DELETE FROM tablename [WHERE CONDITION ]

例如删除emp中dony的那条记录：

```java
mysql> delete from emp1 where ename='dony';
Query OK, 1 row affected (0.00 sec)
```

MySQL中也可以一次删除多个表的数据：

DELETE t1, t2,...., tn FROM t1, t2,...., tn [WHERE CONDITION ]

例如：

```java
delete a,b from emp a, dept b where a.deptno=b.deptno and a.deptno=3;
```

**注意：** 不管是删单表还是多表，如果不加条件语句就会将整张表删除，因此使用时要非常小心。

#### 4. 查询记录

查询语句SELECT是用得最多同时也是最复杂的语句，它的多种条件组合可以使我们查到想要的信息。

最简单的查找语句：查表内的所有内容 SELECT * FROM tablename [ WHERE CONDITION ]

```java
mysql> select * from emp1;        * 表示将表内的所有行和列都查找出来
+------+-------+------------+------------+---------+--------+
| age  | ename | birth      | hiredate   | sal     | deptno |
+------+-------+------------+------------+---------+--------+
|   22 | zzx1  | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa  | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
+------+-------+------------+------------+---------+--------+
2 rows in set (0.00 sec)
mysql> select age,ename,birth,hiredate,sal, deptno from emp1;  将*替换为表内的所有字段效果一样
+------+-------+------------+------------+---------+--------+
| age  | ename | birth      | hiredate   | sal     | deptno |
+------+-------+------------+------------+---------+--------+
|   22 | zzx1  | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa  | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
+------+-------+------------+------------+---------+--------+
2 rows in set (0.00 sec)
```

**注意：** *号有好处有坏处，好处在于写法简单不用将所有字段都列出来，坏处在于一次性查所有内容使得查询速度较慢。

#### (1) 查询不重复的记录

使用distinct关键字标记要查询的内容，这样就会将查询的结果去掉重复值后显示出来

例如下面的语句：

```java
mysql> insert into emp1 values('28','bjguan','1987-07-12','2014-06-08','8000',1); 加一条记录使deptno有重复值
Query OK, 1 row affected (0.00 sec)
mysql> select * from emp1;
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
+------+--------+------------+------------+---------+--------+
3 rows in set (0.00 sec)
mysql> select distinct deptno from emp1;       加distinct关键字使得查出的结果中去掉了重复记录
+--------+
| deptno |
+--------+
|      1 |
|      2 |
+--------+
2 rows in set (0.00 sec)
```

#### (2) 条件查询

关键字WHERE实现根据不同的条件来查询所需结果

例如查询deptno=1的所有记录：

```java
mysql> select * from emp1 where deptno=1;
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
+------+--------+------------+------------+---------+--------+
2 rows in set (0.00 sec)
```

判断条件可以使用=、>、=、<=、!=等等，同时多个条件还可以使用and、or等进行连接，例如下面的例子：

```java
mysql> select * from emp1 where deptno=1 and sal<6000;
+------+-------+------------+------------+---------+--------+
| age  | ename | birth      | hiredate   | sal     | deptno |
+------+-------+------------+------------+---------+--------+
|   22 | zzx1  | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
+------+-------+------------+------------+---------+--------+
1 row in set (0.00 sec)
```

#### (3) 排序和限制

使用关键字ORDER BY来实现对查找出来的结果按某一字段进行排序，语法如下：

SELECT * FROM tablename [ WHERE CONDITION ] [ ORDER BY field1 [ DESC\ASC ], field2 [ DESC\ASC], ..]

DESC表示降序，ASC表示升序，如果都没有指定的话默认为升序。

```java
mysql> select * from emp1 order by sal;         默认按薪水升序排列
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
+------+--------+------------+------------+---------+--------+
3 rows in set (0.00 sec)
```

排序的字段可以是一个，也可以是多个；当排序字段只有一个且记录中有相同值时，此时这两个相同值的排序位置不确定，但当排序字段有多个时遇到这种情况就会根据第二字段来排序，如果第二字段中也有这种问题存在就会根据第三字段排，以此类推。

```java
mysql> select * from emp1 order by deptno,sal desc;   按deptno升序排列，如遇到相同值则按对应的sal降序排列
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
+------+--------+------------+------------+---------+--------+
3 rows in set (0.00 sec)
```

LIMIT关键字设置查询出来的记录从第几条开始显示，一共显示多少条；基本语法如下：

SELECT ... [ LIMIT offset_start, row_count ]

例如：

```java
mysql> insert into emp1 values('30','bzshen','1990-04-06','2016-06-07','7000',3); 增加一条记录
Query OK, 1 row affected (0.00 sec)
mysql> select * from emp1 order by sal limit 1,3;     按薪水排序后，从第二条开始一共取三条记录显示，这里的1由于是从0开始数，因此表示第二条记录
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
+------+--------+------------+------------+---------+--------+
3 rows in set (0.00 sec)
```

limit经常和order by一起配合使用来进行记录的分页显示；

**注意：** limit属于MySQL对SQL语句的扩展，在其它数据库上并不适用。

#### (4) 聚合

该操作主要是对数据进行统计汇总，主要语法如下：

SELECT [ field1, field2,...,fieldn] fun_name FROM tablename [ WHERE CONDITION ]

[GROUP BY field1, field2,..., fieldn [ WITH ROLLUP ] ] [ HAVING condition ]

参数说明：fun_name 聚合函数，表示要做的聚合操作，常用的有sum（求和）、count(*)（计数）、max、min等。

GROUP BY 表示对后面的字段进行分类聚合（也常叫分组）；

WITH ROLLUP 可选语法，在ORDER BY 语句内出现，表示是否对分类聚合后的结果进行再汇总；

HAVING 表示对分类后的结果再进行条件过滤；

注意：同样是条件过滤，having合where的区别在于，having是对聚合后的结果进行条件过滤，而where是在聚合前就对记录进行过滤。因此，为了提高聚合效率，一般先用where过滤不相干的记录后，在进行聚合，最后再用having进行二次过滤。

下面看具体的例子：

```java
mysql> select count(*) from emp1;       统计公司总人数（因为一条记录代表一个人）
+----------+
| count(*) |
+----------+
|        4 |
+----------+
1 row in set (0.00 sec)
mysql> select deptno,count(*) from emp1 group by deptno;    统计各部门的人数
+--------+----------+
| deptno | count(*) |
+--------+----------+
|      1 |        2 |
|      2 |        1 |
|      3 |        1 |
+--------+----------+
3 rows in set (0.00 sec)
mysql> select deptno,count(*) from emp1 group by deptno with rollup;   统计各部门的人数并且要汇总得到总人数
+--------+----------+
| deptno | count(*) |
+--------+----------+
|      1 |        2 |
|      2 |        1 |
|      3 |        1 |
|   NULL |        4 |
+--------+----------+
4 rows in set (0.00 sec)
mysql> select deptno,count(*) from emp1 group by deptno having count(*) > 1;  统计人数大于1的部门
+--------+----------+
| deptno | count(*) |
+--------+----------+
|      1 |        2 |
+--------+----------+
1 row in set (0.00 sec)
mysql> select sum(sal),max(sal),min(sal) from emp1;  统计公司的薪水总额及最高、最低薪水
+----------+----------+----------+
| sum(sal) | max(sal) | min(sal) |
+----------+----------+----------+
| 24000.00 |  8000.00 |  4000.00 |
+----------+----------+----------+
1 row in set (0.00 sec)
```

#### (5) 表连接

当需要同时显示多个表中的字段时，就可以用表连接来实现这样的功能。

表连接主要有内连接和外连接，**内连接**仅选出两张表中相互匹配的部分，而外连接又分为左连接和右连接，**左连接**包含所有的左表中的记录哪怕右表中没有和它匹配的记录；**右连接**包含所有的右表中的记录哪怕左表中没有和它匹配的记录；

```java
mysql> create table dept(deptno int(2),deptname varchar(10));   创建一个新的部门表
Query OK, 0 rows affected (0.03 sec)
mysql> insert into dept values(1,'tech'),(2,'scale'),(3,'hr');   为部门表中插入3条记录
Query OK, 3 rows affected (0.01 sec)
Records: 3  Duplicates: 0  Warnings: 0
mysql> select * from dept;
+--------+----------+
| deptno | deptname |
+--------+----------+
|      1 | tech     |
|      2 | scale    |
|      3 | hr       |
+--------+----------+
3 rows in set (0.00 sec)
mysql> select * from emp1;
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |
|   24 | dony   | 1989-11-14 | 2014-06-26 | 6000.00 |      4 |
+------+--------+------------+------------+---------+--------+
5 rows in set (0.00 sec)
```

现在表连接的方法来查出所有雇员的名字和所在部门：

```java
使用两个表中的相同字段deptno作为条件连接两个表
mysql> select ename,deptname from emp1,dept where emp1.deptno=dept.deptno;
+--------+----------+
| ename  | deptname |
+--------+----------+
| zzx1   | tech     |
| lisa   | scale    |
| bjguan | tech     |
| bzshen | hr       |
+--------+----------+
4 rows in set (0.00 sec)
使用内连接关键字inner join 
mysql> select ename,deptname from emp1 inner join dept on emp1.deptno=dept.deptno;
+--------+----------+
| ename  | deptname |
+--------+----------+
| zzx1   | tech     |
| lisa   | scale    |
| bjguan | tech     |
| bzshen | hr       |
+--------+----------+
4 rows in set (0.00 sec)
mysql> select * from emp1 inner join dept on emp1.deptno=dept.deptno;
+------+--------+------------+------------+---------+--------+--------+----------+
| age  | ename  | birth      | hiredate   | sal     | deptno | deptno | deptname |
+------+--------+------------+------------+---------+--------+--------+----------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |      1 | tech     |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |      2 | scale    |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |      1 | tech     |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |      3 | hr       |
+------+--------+------------+------------+---------+--------+--------+----------+
4 rows in set (0.00 sec)
```

从上面的两条inner join语句我们可以看出，内连接是将两张表中的共同字段作为条件进行合并得到一张两表交集的大表，然后就可以选择这张大表中的具体字段来进行显示，比如*号选择全部字段。

**使用左连接：** 可以看出左表的内容全部保留，右表中不存在的置为NULL，若有超过的则不显示。

```java
mysql> select ename,deptname from emp1 left join dept on emp1.deptno=dept.deptno;
+--------+----------+
| ename  | deptname |
+--------+----------+
| zzx1   | tech     |
| bjguan | tech     |
| lisa   | scale    |
| bzshen | hr       |
| dony   | NULL     |
+--------+----------+
5 rows in set (0.00 sec)
mysql> select * from emp1 left join dept on emp1.deptno=dept.deptno;
+------+--------+------------+------------+---------+--------+--------+----------+
| age  | ename  | birth      | hiredate   | sal     | deptno | deptno | deptname |
+------+--------+------------+------------+---------+--------+--------+----------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |      1 | tech     |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |      1 | tech     |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |      2 | scale    |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |      3 | hr       |
|   24 | dony   | 1989-11-14 | 2014-06-26 | 6000.00 |      4 |   NULL | NULL     |
+------+--------+------------+------------+---------+--------+--------+----------+
5 rows in set (0.00 sec)
```

使用右连接：与左连接相似，只需要更改两个表的位置，左连接就可以作为右连接；

```java
mysql> select ename,deptname from dept right join emp1 on dept.deptno=emp1.deptno;
+--------+----------+
| ename  | deptname |
+--------+----------+
| zzx1   | tech     |
| bjguan | tech     |
| lisa   | scale    |
| bzshen | hr       |
| dony   | NULL     |
+--------+----------+
5 rows in set (0.00 sec)
```

#### (6) 子查询

在某些情况下，在进行查询的时候需要的条件是另外一个select语句的结果时，往往用到子查询，它的关键字主要有in、not in、=、!=、exists、not exists等。

例如在emp表中查出在dept表中有记录的所有信息：

```java
mysql> select * from emp1 where deptno in (select deptno from dept);
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |
+------+--------+------------+------------+---------+--------+
4 rows in set (0.00 sec)
当子查询中查出的记录只有一条时，in可以用 = 代替
mysql> select * from emp1 where deptno=(select deptno from dept);
ERROR 1242 (21000): Subquery returns more than 1 row
mysql> select * from emp1 where deptno=(select deptno from dept limit 1);
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
+------+--------+------------+------------+---------+--------+
2 rows in set (0.00 sec)
```

在某些特殊的情况下，子查询可以转化为表连接：

```java
mysql> select * from emp1 where deptno in (select deptno from dept);
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |
+------+--------+------------+------------+---------+--------+
4 rows in set (0.00 sec)
mysql> select emp1.* from emp1,dept where emp1.deptno=dept.deptno;
+------+--------+------------+------------+---------+--------+
| age  | ename  | birth      | hiredate   | sal     | deptno |
+------+--------+------------+------------+---------+--------+
|   22 | zzx1   | 1992-10-11 | 2018-01-01 | 5000.00 |      1 |
|   25 | lisa   | 1990-05-11 | 2018-03-25 | 4000.00 |      2 |
|   28 | bjguan | 1987-07-12 | 2014-06-08 | 8000.00 |      1 |
|   30 | bzshen | 1990-04-06 | 2016-06-07 | 7000.00 |      3 |
+------+--------+------------+------------+---------+--------+
```

**注意：** 在以下两种情况下会用到子查询和表连接之间的转化。

- MySQL4.1 之前的版本不支持子查询，因此在使用老版数据库时需要用表连接；
- 表连接查询性能优于子查询，因此往往用来优化子查询语句。

#### (7) 记录联合

有时候我们需要将两个表的数据按照一定的查询条件查询出来后，将结果合并到一起显示出来（这里的合并是竖向合并而不是表连接那样的横向合并）；使用关键字union、union all来实现。语法如下：

SELECT * FROM t1 UNION | UNION ALL SELECT * FROM t2 ......（一直写一直连）

例如下面的例子，将emp1表和dept表中部门标号的集合显示出来：

```java
mysql> select deptno from emp1 union all select deptno from dept;
+--------+
| deptno |
+--------+
|      1 |
|      2 |
|      1 |
|      3 |
|      4 |
|      1 |
|      2 |
|      3 |
+--------+
8 rows in set (0.01 sec)
mysql> select deptno from emp1 union select deptno from dept;
+--------+
| deptno |
+--------+
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
4 rows in set (0.00 sec)
```

可以看到union all 是将结果集直接合并在一起，而union 则是进行了去重。

### 2.4 DCL语句

DCL语句主要是DBA用来管理系统中的对象权限时使用，一般开发人员用的较少。下面通过一个例子简单说明一下：

```java
创建z1用户，密码为123，对数据库test1里的所有表具有查询和插入权限
mysql> grant select,insert on test1.* to 'z1'@'localhost' identified by '123';
Query OK, 0 rows affected, 1 warning (0.01 sec)
mysql> exit
Bye
用户z1登陆，这里提示密码最好不要直接写在在命令行，会有风险
C:\Users\15330>mysql -u z1 -p123
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 18
Server version: 5.7.17-log MySQL Community Server (GPL)
Copyright (c) 2000, 2016, Oracle and/or its affiliates. All rights reserved.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql> use test1;      登陆后该用户对test1库内的表插入操作都是成功的
Database changed
mysql> insert into emp1 values('24','hwtong','1989-07-24','2017-08-16','10000',5);
Query OK, 1 row affected (0.01 sec)
```

当用户权限有变更时，比如需要收回用户z1的插入权限：

```java
首先我们需要登陆最高权限账户来进行修改
mysql> revoke insert on test1.* from 'z1'@'localhost';   该命令就收回了用户z1的插入权限
Query OK, 0 rows affected (0.00 sec)
mysql> exit
Bye
此时z1用户登陆再执行插入命令就会出错：
C:\Users\15330>mysql -u z1 -p123
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 21
Server version: 5.7.17-log MySQL Community Server (GPL)
Copyright (c) 2000, 2016, Oracle and/or its affiliates. All rights reserved.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql> use test1;
Database changed
mysql> insert into emp1 values('24','hwtong','1989-07-24','2017-08-16','10000',5);
ERROR 1142 (42000): INSERT command denied to user 'z1'@'localhost' for table 'emp1'
mysql>
```

这里只是简单的介绍一下，后面会更详细的介绍相关内容。

## 三、帮助命令的使用

再实际使用MySQL时，经常会遇到以下问题：

- 某个操作语法忘记了，如何快速查找？
- 如何快速知道当前版本上某个字段类型的取值范围？
- 当前版本都支持哪些函数？有没有例子?
- 当前版本是否支持某个功能？

对于这些疑问MySQL的官方文档都有详细说明，但是每次都去查文档太费时间，MySQL有一些快捷的方法来帮你快速的查到相关内容。

#### 3.1 按照层次看帮助

如果不太确定具体查什么可以用 “ ？contents ”命令来显示所有可供查询的分类：

```java
mysql> ? contents
You asked for help about help category: "Contents"
For more information, type 'help <item>', where <item> is one of the following
categories:
   Account Management
   Administration
   Compound Statements
   Data Definition
   Data Manipulation
   Data Types
   Functions
   Functions and Modifiers for Use with GROUP BY
   Geographic Features
   Help Metadata
   Language Structure
   Plugins
   Procedures
   Storage Engines
   Table Maintenance
   Transactions
   User-Defined Functions
   Utility
```

根据分类列出的类别名称我们可以使用“ ？ 类别名 ” 来做进一步查看：

```java
mysql> ? data types           查看当前版本数据库支持的所有数据类型
You asked for help about help category: "Data Types"
For more information, type 'help <item>', where <item> is one of the following
topics:
   AUTO_INCREMENT
   BIGINT
   BINARY
   BIT
   BLOB
   BLOB DATA TYPE
   BOOLEAN
   CHAR
   CHAR BYTE
   DATE
   DATETIME
   DEC
   DECIMAL
   DOUBLE
   DOUBLE PRECISION
   ENUM
   FLOAT
   INT
   INTEGER
   LONGBLOB
   LONGTEXT
   MEDIUMBLOB
   MEDIUMINT
   MEDIUMTEXT
   SET DATA TYPE
   SMALLINT
   TEXT
   TIME
   TIMESTAMP
   TINYBLOB
   TINYINT
   TINYTEXT
   VARBINARY
   VARCHAR
   YEAR DATA TYPE
```

也可以继续查看某一数据类型的详细信息：

```java
mysql> ? int
Name: 'INT'
Description:
INT[(M)] [UNSIGNED] [ZEROFILL]
A normal-size integer. The signed range is -2147483648 to 2147483647.
The unsigned range is 0 to 4294967295.
URL: http://dev.mysql.com/doc/refman/5.7/en/numeric-type-overview.html
```

这就是层次化的查找方式。

#### 3.2 快速查阅帮助

使用关键子快速查阅：

```java
mysql> ? show        可以查到show的所有用法
Name: 'SHOW'
Description:
SHOW has many forms that provide information about databases, tables,
columns, or status information about the server. This section describes
those following:
SHOW {BINARY | MASTER} LOGS
SHOW BINLOG EVENTS [IN 'log_name'] [FROM pos] [LIMIT [offset,] row_count]
SHOW CHARACTER SET [like_or_where]
SHOW COLLATION [like_or_where]
SHOW [FULL] COLUMNS FROM tbl_name [FROM db_name] [like_or_where]
SHOW CREATE DATABASE db_name
SHOW CREATE EVENT event_name
SHOW CREATE FUNCTION func_name
。。。。。
```

```java
mysql> ? create table        可以查到该语法的相关命令
Name: 'CREATE TABLE'
Description:
Syntax:
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name
    (create_definition,...)
    [table_options]
    [partition_options]
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name
    [(create_definition,...)]
    [table_options]
    [partition_options]
    [IGNORE | REPLACE]
    [AS] query_expression
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name
    { LIKE old_tbl_name | (LIKE old_tbl_name) }
...........
```

#### 3.3 MySQL的相关资源

http://dev.mysql.com/downloads 官方网站，可下载MySQL数据库

http://dev.mysql.com/doc 官方文档

http://bugs.mysql.com 已发布的bug列表，也可以报告你发现的bug

http://www.mysql.com/news-and-events/newsletter MySQL的最新消息都在这里面

## 四、查询元数据信息

元数据指的是数据的数据，比如表名，列名，列类型，索引名等表的各种属性名称；MySQL5.0之后有一个数据库information_schema，用来记录元数据信息。

有了这些信息我们可以实现很多操作，比如删除数据库里有某个指定前缀的表，修改表的存储引擎等等；作用很多，后面遇到再慢慢记录吧。
