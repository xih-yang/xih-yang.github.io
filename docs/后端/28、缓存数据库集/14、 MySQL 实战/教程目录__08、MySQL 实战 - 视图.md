# 08、MySQL 实战 - 视图
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/8.html
- 分类：缓存数据库
- 分组：教程目录
注意，MySQL从5.0.1版本开始提供视图功能，使用时注意版本；另外，如果从不支持视图的旧版本升级到提供视图的新版本后，要想使用视图还需要升级授权表，使之包含与视图有关的权限。

## 一、什么是视图

视图是一种虚拟存在的表，它存储的是查询语句，显示出来的是查询的结果；更直白的说就是当我们需要从表中查询一些信息时需要编写相关SQL语句，将这些SQL语句存储为视图，那么我们调用这些视图的时候就相当于执行了SQL语句，从而可以得到想要的结果。

我先举个例子大家感受一下：

```java
1. 创建表、插入数据并执行查询操作
mysql> create table temp (qty int,price int);
Query OK, 0 rows affected (0.01 sec)
mysql> insert into temp values(3,50),(5,60);
Query OK, 2 rows affected (0.01 sec)
Records: 2  Duplicates: 0  Warnings: 0
mysql> select * from temp;
+------+-------+
| qty  | price |
+------+-------+
|    3 |    50 |
|    5 |    60 |
+------+-------+
2 rows in set (0.00 sec)
2. 创建视图并执行查询操作
mysql> create view v as select qty,price,qty*price as value from temp;
Query OK, 0 rows affected (0.01 sec)
mysql> select * from v;
+------+-------+-------+
| qty  | price | value |
+------+-------+-------+
|    3 |    50 |   150 |
|    5 |    60 |   300 |
+------+-------+-------+
2 rows in set (0.00 sec)
```

## 二、视图有什么作用

基于上面的例子我们可以大概感受到视图大概是什么，但是具体的作用可能还是不太了解，甚至觉得有没有视图用不用它都无所谓，不要急，介绍完它的作用后你就会觉得它很有必要了。

**作用一：** 简单；视图就像是一个封装了很多功能的函数，我们把一系列复杂的查询语句存储为一个视图，这样在需要频繁使用这些语句时不必反复编写，直接使用视图代替即可。例如：

```java
如果要频繁获取表user的name和表goods的name。就应该使用以下sql语句：
select a.name as username, b.name as goodsname from user as a, goods as b, ug as c where a.id=c.userid and c.goodsid=b.id;
但有了视图就不一样了，创建视图other。示例
create view other as select a.name as username, b.name as goodsname from user as a, goods as b, ug as c where a.id=c.userid and c.goodsid=b.id;
创建好视图后，就可以这样获取user的name和goods的name：
 select * from other;
```

**作用二：** 对数据库进行重构但仍不会影响程序运行；例如：

```java
假如因为某种需求，需要将user表拆成表usera和表userb，该两张表的结构如下：
        测试表:usera有id，name，age字段
        测试表:userb有id，name，sex字段
这时如果程序端一直使用的sql语句是：select * from user;那就会报错提示该表不存在，这时要么去更改程序的查询语句要么就创建视图。显然，创建视图更简单，成本更低。
以下sql语句创建视图：
create view user as select a.name,a.age,b.sex from usera as a, userb as b where a.name=b.name;
以上假设name都是唯一的。
这时程序端端使用的sql语句：select * from user;就不会报错。这就实现了更改数据库结构，而不用更改脚本程序的功能。
```

**作用三：** 安全；创建好的视图已经规定好了你能访问到的信息，这样可以对用户信息查询的权限进行分离，另外，虽然对数据表有权限管理，但它并不能限制到具体的行和列，而视图可以。

**作用四：** 数据独立且清晰；视图的结构一旦确立就可以屏蔽原表的结构、数据等的变化对用户造成的影响，想要什么样的数据就创建什么样的视图，非常清晰直观。

这些弄清楚后，下面就要介绍视图的增删改查具体操作。

## 三、视图操作

#### 3.1 创建或修改视图

创建视图需要有CREATE VIEW权限，并且对于查询涉及到的列要有SELECT权限；如果用CREATE OR REPLACE或ALTER修改则需要视图的DROP权限。创建视图的语法为：

CREATE [ OR REPLACE ] [ ALGORITHM = { UNDEFINED | MERGE | TEMPTABLE } ] VIEW view_name [ (column_list) ] AS select_statement [ WITH [ CASCADED | LOCAL ] CHECK OPTION ]

- 使用了OR REPLACE可以修改视图，或者直接就CREATE OR REPLACE 替换为ALTER 即变成修改语法；
- UNDEFINED：未定义指定算法；MERGE：更新视图表数据的同时会更新真实表的数据（默认）；TEMPTABLE：只能查询不能更新；
- CASCADED(默认)：必须满足所有针对该视图的所有视图的条件才可以更新；LOCAL：只需满足本视图的条件就可以更新；
- WITH CHECK OPTION：需要满足相关的检查条件才能进行更新；

```java
这样创建的视图不能修改：
create view v as select qty,price,qty*price as value from temp;
这样创建的可以被修改：
create or replace view v as select qty,price,qty*price as value from temp;
```

注意：视图创建时FORM关键字后面不能包含子查询，如果必须要的话可以先将子查询的内容创建为一个视图，再对该视图创建视图即可。

视图是否可更新主要需满足以下四大条件：

**1、** 使用ORREPLACE创建；

**2、** ALGORITHM参数不是使用的TEMPTABLE；

**3、** 检查条件关键字CASCADE或LOCAL需满足相关规定；

**4、** 创建视图时查询语句数据的SQL语句不能是以下类型：；

- 包含关键字：聚合函数（SUM,MIN,MAX,COUNT等）、DISTINCT、GROUP BY、HAVING、UNION、UNION ALL；
- 常量视图；
- SELECT中包含子查询；
- JOIN；
- FROM一个不能跟新的视图；
- WHERE字句的子查询引用了FORM字句中的表；

举个例子：

```java
--常量视图
create or replace view pi as select 3.1415926 as pi;
--select中包含子查询
create or replace view city_view as select (select city from city where city_id=1);
```

对上面的第三点条件再做一点解释：比如我创建一个视图view1，它里面定义了查询条件num  5；如果此时对view2进行更新设置num = 10，那么他能满足view2的条件不能满足view1的条件，因此更新失败；但view2如果使用的是关键字LOCAL，那么此时更新会成功，因为它只需要满足view2本身的条件即可。

#### 3.2 删除视图

用户可以一次删除一个或多个视图，前提是必须要有该视图的DROP权限。相关语法如下：

DROP VIEW [ IF EXISTS ] view_name [, view_name] .... [ RESTRICT | CASCAD ]

#### 3.3 查看视图

查看当前库下所有视图：

```java
mysql> show full tables where table_type like 'view';
+-----------------+------------+
| Tables_in_test1 | Table_type |
+-----------------+------------+
| v               | VIEW       |
+-----------------+------------+
1 row in set (0.01 sec)
```

show tables命令不仅会显示所有表的名字，也会显示所有视图的名字：

```java
mysql> show tables;
+-----------------+
| Tables_in_test1 |
+-----------------+
| ai              |
| autoincre_demo  |
| autoincre_demo2 |
| city            |
| country         |
| dept            |
| emp1            |
| myisam_char     |
| payment_2006    |
| payment_2007    |
| payment_all     |
| salary          |
| t               |
| tab_memory      |
| te              |
| temp            |
| v               |
| vc              |
+-----------------+
18 rows in set (0.00 sec)
```

show table status [from db_name ] [like 'pattern' ]命令不仅可以显示表的信息也可显示视图的信息：

```java
mysql> show table status like 'v' \G;
*************************** 1. row ***************************
           Name: v
         Engine: NULL
        Version: NULL
     Row_format: NULL
           Rows: NULL
 Avg_row_length: NULL
    Data_length: NULL
Max_data_length: NULL
   Index_length: NULL
      Data_free: NULL
 Auto_increment: NULL
    Create_time: NULL
    Update_time: NULL
     Check_time: NULL
      Collation: NULL
       Checksum: NULL
 Create_options: NULL
        Comment: VIEW
1 row in set (0.00 sec)
```

如果要看某个视图的定义可以使用SHOW CREATE VIEW命令：

```java
mysql> show create view v \G
*************************** 1. row ***************************
                View: v
         Create View: CREATE ALGORITHM=UNDEFINED DEFINER=root@ddkk.com SQL SECURITY DEFINER VIEW v AS select temp.qty AS qty,temp.price AS price,(temp.qty * temp.price) AS value from temp
character_set_client: gbk
collation_connection: gbk_chinese_ci
1 row in set (0.00 sec)
```

也可以通过查看系统表information_schema.views来查看视图相关信息：

```java
mysql> select * from views where table_name  = 'v' \G
*************************** 1. row ***************************
       TABLE_CATALOG: def
        TABLE_SCHEMA: test1
          TABLE_NAME: v
     VIEW_DEFINITION: select test1.temp.qty AS qty,test1.temp.price AS price,(test1.temp.qty * test1.temp.price) AS value from test1.temp
        CHECK_OPTION: NONE
        IS_UPDATABLE: YES
             DEFINER: root@ddkk.com
       SECURITY_TYPE: DEFINER
CHARACTER_SET_CLIENT: gbk
COLLATION_CONNECTION: gbk_chinese_ci
1 row in set (0.01 sec)
```
