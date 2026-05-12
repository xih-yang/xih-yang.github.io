# 07、MySQL 提升 - 存储过程和函数3-函数
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/7.html
- 分类：缓存数据库
- 分组：教程目录
### 函数介绍

函数和存储过程差不多，都可以提高代码的重用性，简化操作。

它们之间的**区别**：

存储过程：可以有任意个返回值，适合做批量的插入和更新。

函数：有且仅有1个返回值，适合数据处理，并返回处理结果。

### 函数语法

#### 创建语法：

```java
CREATE FUNCTION 函数名(参数列表) RETURNS 返回类型
BEGIN
		函数体
		[return 值;]
END
```

函数一般都会有return语句，但如果没有也可以

函数体中如果只有一句代码则可以省略begin end

使用delimiter设置结束标记

#### 调用语法

```java
SELECT 函数名(参数列表)
```

#### 使用演示

##### 返回student_info表的统计个数

```java
mysql> DELIMITER $
mysql> CREATE FUNCTION fun0() RETURNS INT
    -> BEGIN
    ->     DECLARE res INT DEFAULT 0;
    ->     SELECT COUNT(*) INTO res FROM student_info;
    ->     RETURN res;
    -> END $
Query OK, 0 rows affected (0.01 sec)
mysql> SELECT fun0()$
+--------+
| fun0() |
+--------+
|      7 |
+--------+
1 row in set (0.01 sec)
```

##### 根据学生姓名返回学生的班级号

```java
mysql> DELIMITER $
mysql> CREATE FUNCTION fun2(stuName varchar(32)) RETURNS VARCHAR(32)
    -> BEGIN
    ->     SET @classCode = '';
    ->     SELECT class INTO @classCode
    ->     FROM student_info
    ->     where s_name = stuName;
    ->     return @classCode;
    -> END $
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT fun2('小喵')$
+----------------+
| fun2('小喵')   |
+----------------+
| 001            |
+----------------+
1 row in set (0.00 sec)
```

#### 求和

```java
mysql> CREATE FUNCTION fun3(a FLOAT,b FLOAT) RETURNS FLOAT
    -> BEGIN
    ->     DECLARE c FLOAT DEFAULT 0.0;
    ->     SET c = a+b;
    ->     return c;
    -> END $
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT fun3(1.2,0.4)$
+-------------------+
| fun3(1.2,0.4)     |
+-------------------+
| 1.600000023841858 |
+-------------------+
```

### 查看函数

语法：`SHOW CREATE FUNCTION 函数名;`

```java
SHOW CREATE FUNCTION fun1$
```

### 删除函数

语法：`DROP FUNCTION 函数名;`

```java
mysql> DROP FUNCTION fun1$
Query OK, 0 rows affected (0.00 sec)
```
