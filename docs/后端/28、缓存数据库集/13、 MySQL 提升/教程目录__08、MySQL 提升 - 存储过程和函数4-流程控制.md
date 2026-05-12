# 08、MySQL 提升 - 存储过程和函数4-流程控制
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/8.html
- 分类：缓存数据库
- 分组：教程目录
### 一 分支结构

> 程序从多条逻辑分支中选中一个分支去执行

#### 1 if函数

**语法**：`IF(表达式1,表达式2,表达式2)`

如果表达式1成立，则if函数返回表达式2的值，否则返回表达式3的值

#### 2 case结构

##### 2.1 语法1

类似于java中的switch语句，一般用于等值判断

语法：

```java
CASE 变量|表达式|字段
WHEN 要判断的值1 THEN 返回值1[或语句1;]
WHEN 要判断的值2 THEN 返回值2[或语句2;]
....
ELSE 返回值n
END[CASE]
```

##### 2.2 语法2

类似于java中的多重if语句，一般用于实现区间判断

```java
CASE 
WHEN 要判断的条件1 THEN 返回值1[或语句1;]
WHEN 要判断的条件2 THEN 返回值2[或语句1;]
....
ELSE 返回值n
END[CASE]
```

**特点：**

作为表达式可以嵌套在其他语句中使用，可以放在任何地方，begin end中或外面都可以。

作为独立的语句，只能放在begin end中使用

##### 2.3 使用

需求：传入成绩，返回该成绩对应的等级

```java
mysql> CREATE PROCEDURE testCase(IN score INT)
    -> BEGIN
    ->     CASE
    ->     WHEN score>=90 THEN SELECT 'A';
    ->     WHEN score>=80 THEN SELECT 'B';
    ->     WHEN score>=60 THEN SELECT 'C';
    ->     ELSE SELECT 'D';
    ->     END CASE ;
    -> END $
Query OK, 0 rows affected (0.00 sec)
mysql> CALL testCase(85)$
+---+
| B |
+---+
| B |
+---+
1 row in set (0.01 sec)
Query OK, 0 rows affected (0.01 sec)
```

#### 3 if结构

##### 3.1 语法

```java
if 条件1 then 语句1;
elseif 条件2 then 语句2;
....
else 语句n;
end if;
```

只可以在begin end 中使用

##### 3.2 使用

需求：传入成绩，返回该成绩对应的等级

```java
mysql> create function testif(score int) returns char
    -> begin
    ->     if score >= 90 then return 'A';
    ->     elseif score >=80 then return 'B';
    ->     elseif score >=60 then return 'C';
    ->     else return 'D';
    ->     end if;
    -> end $
Query OK, 0 rows affected (0.01 sec)
mysql> select testif(55)$
+------------+
| testif(55) |
+------------+
| D          |
+------------+
1 row in set (0.00 sec)
```

### 二 循环结构

> 程序在满足一定条件后重复的执行某一段代码逻辑

> 分类：while、loop、repeat

> 循环控制：
>
> iterate：类似于continue，结束本次循环，继续下一次
>
> leave：类似于 break，结束当前所在的循环

#### 1 语法

```java
[标签:] while 循环条件 do
	循环体;
end while [标签];
```

```java
[标签:] loop
	循环体;
end loop [标签];
```

```java
[标签:] repeat
	循环体;
until 结束循环的条件
end repeat [标签];
```

#### 2 使用

需求：批量插入数据

```java
mysql> create procedure proWhile(in countFlag int)
    -> begin
    ->     declare i int default 1;
    ->     while i<=countFlag do
    ->         insert into teacher_info(t_name, class) values ('实老师','003');
    ->         set i = i+1;
    ->      end while;
    -> end $
Query OK, 0 rows affected (0.01 sec)
mysql> call proWhile(10)$
Query OK, 1 row affected (0.02 sec)
mysql> select * from teacher_info;
    -> $
+--------+-----------+-------+
| key_id | t_name    | class |
+--------+-----------+-------+
|      1 | 张老师    | 001   |
|      2 | 刘老师    | 002   |
|      3 | 实老师    | 003   |
|      4 | 实老师    | 003   |
|      5 | 实老师    | 003   |
|      6 | 实老师    | 003   |
|      7 | 实老师    | 003   |
|      8 | 实老师    | 003   |
|      9 | 实老师    | 003   |
|     10 | 实老师    | 003   |
|     11 | 实老师    | 003   |
|     12 | 实老师    | 003   |
+--------+-----------+-------+
12 rows in set (0.00 sec)
```

补充：单插入次数超过5次时就不再插入，跳出循环。

```java
create procedure proWhile2(in countFlag int)
begin
    declare i int default 1;
    a:while i<=countFlag do
        insert into teacher_info(t_name, class) values ('实老师','003');
        if i>=5 then leave a;
        end if;
        set i = i+1;
     end while a;
end $
```
