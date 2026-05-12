# 06、MySQL 提升 - 存储过程和函数2-存储过程
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/6.html
- 分类：缓存数据库
- 分组：教程目录
### 一 介绍

**存储过程是什么：**

一组预先编译好的SQL语句的集合。

**有什么用：**

提高代码的重用性；

简化操作。

减少编译次数并且减少数据库和应用服务之间的连接次数，提高效率。

### 二 语法

**创建：**

```java
CREATE PROCEDURE 存储过程名(参数列表)
BEGIN
	存储过程体（一组SQL语句）
END
```

> 如果存储过程体只有一行，则BEGIN END可以省略；
>
> 存储过程体中的每条sql语句的结尾必须加分号；
>
> 存储过程的结尾可以使用DELIMITER重新设置；
>
> DELIMITER 结束标记

参数列表格式：参数模式 参数名 参数类型

举例：`IN teacher_name VARCHAR(32)`

参数模式：

IN：该参数可以作为输入，需要调用方传入值

OUT：该参数可以作为输出，可以作为返回值

INOUT：该参数既可以作为输入又可以作为输出。

### 三 调用

CALL 存储过程名(实参列表);

**案例：**

#### 1 空参的存储过程：

需求：使用存储过程在user表中插入3条数据

```java
1，查询出原始的数据（只有一条）：
mysql> select * from user;
+----+----------+------+
| id | username | age  |
+----+----------+------+
|  1 | luo      |   27 |
+----+----------+------+
1 row in set (0.00 sec)
2，写存储过程：
mysql> DELIMITER $
mysql> CREATE PROCEDURE addUser()
    -> BEGIN
    ->     INSERT INTO user(username, age) values
    ->     ('zhangsan',14),('lisi',15),('wangwu',16);
    -> END $
Query OK, 0 rows affected (0.00 sec)
3，调用存储过程：
mysql> CALL addUser()$
Query OK, 3 rows affected (0.00 sec)
4，查询调用之后的结果（新增了3条数据）：
mysql> select * from user$
+----+----------+------+
| id | username | age  |
+----+----------+------+
|  1 | luo      |   27 |
|  5 | zhangsan |   14 |
|  6 | lisi     |   15 |
|  7 | wangwu   |   16 |
+----+----------+------+
4 rows in set (0.00 sec)
```

#### 2 IN参数的存储过程：

需求：传入学生姓名，查询出老师的信息：

```java
1, 查看学生表
mysql> select * from student_info;
+--------+-----------+------+-------+
| key_id | s_name    | age  | class |
+--------+-----------+------+-------+
|      1 | 小白菜    |   14 | 001   |
|      2 | 小喵      |   12 | 001   |
|      3 | 张三      |   45 | 002   |
|      4 | 小雨      |   18 | 001   |
|      5 | 小舒      |   18 | 001   |
|      6 | 王武      |   34 | 002   |
|      7 | 周瑜      |   28 | 002   |
+--------+-----------+------+-------+
7 rows in set (0.00 sec)
2， 查看教师表
mysql> select * from teacher_info;
+--------+-----------+-------+
| key_id | t_name    | class |
+--------+-----------+-------+
|      1 | 张老师    | 001   |
|      2 | 刘老师    | 002   |
+--------+-----------+-------+
2 rows in set (0.01 sec)
3，写存储过程
mysql> DELIMITER $
mysql> CREATE PROCEDURE teacherNameBySName(IN studentName varchar(32))
    -> BEGIN
    ->     select t.t_name from teacher_info t where
    ->     t.class = (select s.class from student_info s where s.s_name = studentName);
    -> END $
Query OK, 0 rows affected (0.00 sec)
4，调用存储过程
mysql> CALL teacherNameBySName('小喵')$
+-----------+
| t_name    |
+-----------+
| 张老师    |
+-----------+
1 row in set (0.01 sec)
Query OK, 0 rows affected (0.01 sec)
```

如果需要出入多个参数，可以使用英文的逗号将参数隔开即可：

```java
CREATE PROCEDURE funName(IN param1 varchar(32),IN param2 varchar(16))
```

#### 3 OUT参数的存储过程：

调用的时候out参数直接传入变量。

#### 4 INOUT参数的存储过程：

需求：传入a和b两个值，调用后返回a和b的新值。

```java
1,写存储过程
mysql> DELIMITER $
mysql> CREATE PROCEDURE funAB0(INOUT a INT, INOUT b INT)
    -> BEGIN
    ->     SET a = a+5;
    ->     SET b = b+10;
    -> END $
Query OK, 0 rows affected (0.00 sec)
2，定义变量并调用
mysql> set @a = 1;
    -> set @b = 2;
    -> CALL funAB0(@a,@b)$
Query OK, 0 rows affected (0.00 sec)
Query OK, 0 rows affected (0.00 sec)
Query OK, 0 rows affected (0.00 sec)
3，输出调用结果
mysql> select @a,@b$
+------+------+
| @a   | @b   |
+------+------+
|    6 |   12 |
+------+------+
1 row in set (0.00 sec)
```

- 查询时赋值的存储过程

```java
1,创建存储过程 并且使用select赋值
mysql> DELIMITER $
mysql> CREATE PROCEDURE funAB2(IN birth1 DATETIME, IN birth2 DATETIME,OUT result INT)
    -> BEGIN
    ->     SELECT DATEDIFF(birth1,birth2) INTO result;
    -> END $
Query OK, 0 rows affected (0.00 sec)
2，调用存储过程
mysql> call funAB2('2020-07-07',now(),@result)$
Query OK, 1 row affected (0.00 sec)
3，输出调用结果
mysql> select @result$
+---------+
| @result |
+---------+
|      -3 |
+---------+
1 row in set (0.00 sec)
```

#### 5 补充案例

需求：传入一个日期，格式化为xx年xx月xx日的字符串并返回

```java
mysql> DELIMITER $
mysql> CREATE PROCEDURE funAB3(IN mydate DATETIME,OUT strDate varchar(32))
    -> BEGIN
    ->     SELECT DATE_FORMAT(mydate,'%y年%m月%d日') into strDate;
    -> END $
Query OK, 0 rows affected (0.00 sec)
mysql> 
mysql> call funAB3(now(),@res)$
Query OK, 1 row affected (0.00 sec)
mysql> select @res $
+-----------------+
| @res            |
+-----------------+
| 20年07月10日    |
+-----------------+
1 row in set (0.00 sec)
```

需求：传入学生姓名，查询出老师的信，并同时返回学生和老师的姓名

```java
mysql> CREATE PROCEDURE funAB4(IN studentName varchar(32),OUT stName varchar(64))
    -> BEGIN
    ->     select concat(studentName,' and ',t_name) into stName
    ->     from teacher_info t where class = (select class from student_info where s_name = studentName);
    -> END $
Query OK, 0 rows affected (0.00 sec)
mysql> call funAB4('小喵',@res)$
Query OK, 1 row affected (0.00 sec)
mysql> select @res $;
+----------------------+
| @res                 |
+----------------------+
| 小喵 and 张老师      |
+----------------------+
1 row in set (0.00 sec)
```

### 四 删除存储过程

语法：`DROP PROCEDURE 存储过程名`

每次只可以支持删除一个存储过程。

### 五 查看存储过程的信息

语法：`SHOW CREATE PROCEDURE 存储过程名`

例如：SHOW CREATE PROCEDURE funAB0;
