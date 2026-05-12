# 09、MySQL 实战 - 存储过程和函数
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/9.html
- 分类：缓存数据库
- 分组：教程目录
如果说前面讲的视图让你对SQL语言开始有了一些新的理解，那么这次讲的存储过程和函数就会让你觉得SQL语言跟其它的编程语言真的很接近，因为它也像别的语言一样去封装函数、定义变量、流程及条件控制、异常捕获等等。MySQL从5.0版本开始支持存储过程和函数。

## 一、什么是存储过程和函数

简单的可以理解成其它语言中封装的函数一样，可以调用这个函数来达到某种功能。但也有一些不同，这里的存储过程和函数是经过编译并存储在数据库中的一段SQL语句的集合，它可以减少开发人员的工作，将数据处理放在数据库服务器上减少了与客户端之间的数据传输，但这样做也会占用服务器的CPU，给数据库服务器造成压力，所以在存储过程和函数里面尽量不要涉及大量运算，尽量将他们分摊到应用服务器上去。

存储过程没有返回值而函数必须有返回值，存储过程的参数可以是IN、OUT、INOUT类型，而函数的参数只能是IN类型。

## 二、存储过程和函数的相关操作

执行相关操作的时候要确认是否有对应权限，比如创建存储过程和函数需要有CREATE ROUTINE权限，修改或删除需要ALTER ROUTINE 权限，执行需要EXECUTE权限。

#### 2.1 创建、修改存储过程和函数

相关语法如下：

```java
创建存储过程的语法：
CREATE PROCEDURE sp_name ([ [IN|OUT|INOUT] param_name type [, ...] ])
      [ LANGUAGE SQL|[NOT] DETERMINISTIC|{CONTAINS SQL|NO SQL|READS SQL DATA|MODIFIES SQL DATA} | SQL SECURITY {DEFINER|INVOKER}|COMMENT 'string' ]
      BEGIN  相应的SQL语句  END
创建函数的语法：
CREATE FUNCTION sp_name ([ [IN|OUT|INOUT] param_name type [, ...] ])
      RETURNS type
      [ LANGUAGE SQL|[NOT] DETERMINISTIC|{CONTAINS SQL|NO SQL|READS SQL DATA|MODIFIES SQL DATA} | SQL SECURITY {DEFINER|INVOKER}|COMMENT 'string' ]
      BEGIN  相应的SQL语句  END
修改存储过程和函数的语法：
ALTER {PROCEDURE|FUNCTION} sp_name [{CONTAINS SQL|NO SQL|READS SQL DATA|MODIFIES SQL DATA} | SQL SECURITY {DEFINER|INVOKER}|COMMENT 'string']
调用过程语法：
CALL sp_name([parameter[,...]])
```

对语法里面的字段解释如下：

- LANGUAGE SQL：说明下面的语句体里面是使用SQL语言写的（默认），虽然MySQL现在只支持SQL，但将来可能会支持别的语言；
- [NOT] DETERMINISTIC：非确定的，每次一样的输入不一定有同样的输出（默认）；
- {CONTAINS SQL|NO SQL|READS SQL DATA|MODIFIES SQL DATA}：CONTAINS SQL（默认）表示子程序不包含读或写数据的语句；NO SQL表示子程序不包含SQL语句；READS SQL DATA表示子程序包含读数据的语句但不包含写；MODIFIES SQL DATA表示子程序包含写数据的语句；
- SQL SECURITY {DEFINER|INVOKER}：指定子程序的执行许可，DEFINER创建子程序者的许可（默认）；INVOKER调用者的许可；
- COMMENT 'string'：存储过程或者函数的注释信息。
- type：MySQL里面支持的数据类型。

**注意：** MySQL存储过程和函数中允许包含DDL语句，也允许在存储过程中执行提交或回滚，但存储过程和函数中不允许执行LOAD DATA INFILE语句；此外，存储过程和函数中还可以调用其它的过程和函数。

请看下面创建一个存储过程的例子：

```java
1. 选择一个数据库创建一张目标表并插入数据：
mysql> create table inventory (inventory_id int,film_id int,store_id int);
Query OK, 0 rows affected (0.02 sec)
mysql> insert into inventory values(1,1,1),(2,2,2),(3,3,3),(4,4,4),(5,5,5);
Query OK, 5 rows affected (0.01 sec)
Records: 5  Duplicates: 0  Warnings: 0
2. 创建一个存储过程
mysql> delimiter $$    这个命令将语句的结束符从‘;‘修改为’$$‘，最后又改回来了
mysql>
mysql> create procedure film_in_stock(IN p_film_id int,IN p_store_id int,OUT p_film_count int)
    -> reads sql data
    -> begin
    -> select inventory_id from inventory where film_id=p_film_id and store_id=p_store_id;
    -> select found_rows() into p_film_count;
    -> end $$
Query OK, 0 rows affected (0.00 sec)
mysql>
mysql> delimiter ;
3. 不使用存储过程时我们这样查找
mysql> select inventory_id from inventory where film_id=2 and store_id = 2 ;
+--------------+
| inventory_id |
+--------------+
|            2 |
+--------------+
1 row in set (0.00 sec)
4. 使用存储过程时：输入两个参数，并得到一个输出结果@a
mysql> call film_in_stock(2,2,@a);
+--------------+
| inventory_id |
+--------------+
|            2 |
+--------------+
1 row in set (0.00 sec)
mysql> select @a;
+------+
| @a   |
+------+
|    1 |
+------+
1 row in set (0.00 sec)
```

可以看到调用存储过程与直接执行SQL语句的效果是一样的，但存储过程的好处在于逻辑都封装在数据库端，调用者只需要了解作用不需要知道逻辑，修改与使用都很方便。

下面再举个例子说明一下SQL SECURITY特征值的不同：

```java
1. 使用root用户创建两个存储过程，一个是definer，一个是invoker
mysql> delimiter $$
mysql> create procedure film_in_stock_definer(IN p_film_id int,IN p_store_id int,OUT p_film_count int)
    -> sql security definer
    -> begin
    -> select inventory_id from inventory where film_id=p_film_id and store_id=p_store_id;
    -> select found_rows() into p_film_count;
    -> end $$
Query OK, 0 rows affected (0.00 sec)
mysql> create procedure film_in_stock_invoker(IN p_film_id int,IN p_store_id int,OUT p_film_count int)
    -> sql security invoker
    -> begin
    -> select inventory_id from inventory where film_id=p_film_id and store_id=p_store_id;
    -> select found_rows() into p_film_count;
    -> end $$
Query OK, 0 rows affected (0.00 sec)
mysql> delimiter ;
2. 创建一个新用户只赋予它可以执行存储过程的权限，没有其它例如查询inventory表的权限
mysql> grant execute on test1.* to 'lisa'@'localhost' identified by '123';
Query OK, 0 rows affected, 1 warning (0.00 sec)
3. 使用新用户登陆MySQL，尝试直接查询inventory表会出错
mysql> select count(*) from inventory;
ERROR 1142 (42000): SELECT command denied to user 'lisa'@'localhost' for table 'inventory'
4. lisa用户来调用两个存储过程
mysql> call film_in_stock_definer(2,2,@a);
+--------------+
| inventory_id |
+--------------+
|            2 |
+--------------+
1 row in set (0.00 sec)
Query OK, 1 row affected (0.01 sec)
mysql> call film_in_stock_invoker(2,2,@a);
ERROR 1142 (42000): SELECT command denied to user 'lisa'@'localhost' for table 'inventory'
```

从上例可以看出，虽然两个存储过程都是root用户创建的，但是一个使用的是创建者本身的权限（也就是root），另一个使用的是调用者的权限（这里是lisa），由于用户lisa的权限不能查看inventory表，因而执行film_in_stock_invoker存储过程会出错。

#### 2.2 删除存储过程或函数

一次只能删除一个存储过程或函数，注意要有对应的权限；相关语法如下：

DROP { PROCEDURE | FUNCTION } [ IF EXISTS ] sp_name

```java
mysql> drop procedure film_in_stock;
Query OK, 0 rows affected (0.00 sec)
```

#### 2.3 查看存储过程或者函数

**1. 查看状态**

SHOW { PROCEDURE | FUNCTION } STATUS [LIKE 'pattern’]

```java
mysql> show procedure status like 'film_in_stock' \G     不需要选择数据库就可以查看
*************************** 1. row ***************************
                  Db: test1
                Name: film_in_stock
                Type: PROCEDURE
             Definer: root@ddkk.com
            Modified: 2018-12-21 11:27:14
             Created: 2018-12-21 11:27:14
       Security_type: DEFINER
             Comment:
character_set_client: gbk
collation_connection: gbk_chinese_ci
  Database Collation: utf8_general_ci
1 row in set (0.01 sec)
```

**2. 查看定义**

SHOW CREATE { PROCEDURE | FUNCTION } sp_name

```java
mysql> show create procedure film_in_stock \G     必须选择对应的数据库下才能查看
*************************** 1. row ***************************
           Procedure: film_in_stock
            sql_mode: STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
    Create Procedure: CREATE DEFINER=root@ddkk.com PROCEDURE film_in_stock(IN p_film_id int,IN p_store_id int,OUT p_film_count int)
    READS SQL DATA
begin
select inventory_id from inventory where film_id=p_film_id and store_id=p_store_id;
select found_rows() into p_film_count;
end
character_set_client: gbk
collation_connection: gbk_chinese_ci
  Database Collation: utf8_general_ci
1 row in set (0.00 sec)
```

**3. 通过information_schema.Routines查看相关信息**

```java
mysql> select * from routines where routine_name = 'film_in_stock' \G
*************************** 1. row ***************************
           SPECIFIC_NAME: film_in_stock
         ROUTINE_CATALOG: def
          ROUTINE_SCHEMA: test1
            ROUTINE_NAME: film_in_stock
            ROUTINE_TYPE: PROCEDURE
               DATA_TYPE:
CHARACTER_MAXIMUM_LENGTH: NULL
  CHARACTER_OCTET_LENGTH: NULL
       NUMERIC_PRECISION: NULL
           NUMERIC_SCALE: NULL
      DATETIME_PRECISION: NULL
      CHARACTER_SET_NAME: NULL
          COLLATION_NAME: NULL
          DTD_IDENTIFIER: NULL
            ROUTINE_BODY: SQL
      ROUTINE_DEFINITION: begin
select inventory_id from inventory where film_id=p_film_id and store_id=p_store_id;
select found_rows() into p_film_count;
end
           EXTERNAL_NAME: NULL
       EXTERNAL_LANGUAGE: NULL
         PARAMETER_STYLE: SQL
        IS_DETERMINISTIC: NO
         SQL_DATA_ACCESS: READS SQL DATA
                SQL_PATH: NULL
           SECURITY_TYPE: DEFINER
                 CREATED: 2018-12-21 11:27:14
            LAST_ALTERED: 2018-12-21 11:27:14
                SQL_MODE: STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
         ROUTINE_COMMENT:
                 DEFINER: root@ddkk.com
    CHARACTER_SET_CLIENT: gbk
    COLLATION_CONNECTION: gbk_chinese_ci
      DATABASE_COLLATION: utf8_general_ci
1 row in set (0.00 sec)
```

#### 2.4 变量的使用

存储过程和函数中可以使用变量，变量名不区分大小写。

**1. 变量的定义**

定义的语法如下：

DECLARE var_name[,...] type [DEFAULT value]

注意用DECLARE定义的是局部变量，该变量的作用范围只能在BEGIN....END块中，需写在其它语句的前面，可以一次声明多个相同类型的变量，也可为它设置默认值。

**2. 变量的赋值**

变量可以用SET直接赋值也可以通过查询语句赋值（要求查询返回的结果只能有一行），可以赋常量也可以赋表达式，语法如下：

SETvar_name = expr [, var_name = expr] ....

SELECT col_name[, ....] INTO var_name [,....] table_expr

#### 2.5 定义条件和处理

这里的条件定义和处理可以理解为其它语言中的错误、异常捕获与处理，我可以把系统处理某个语句发生异常错误时的一些状态信息定义为为某个名字，再提前把出现这种错误的解决方法定义好，这样存储过程和函数在执行的过程中不会因为某一些错误而中断。

```java
条件的定义：
DECLARE condition_name CONDITION FOR SQLSTATE [VALUE] sqlstate_value|mysql_error_code
条件的处理：
DECLARE {CONTINUE|EXIT|UNDO} HANDLER FOR SQLSTATE [VALUE] sqlstate_value|condition_name|SQLWARNING|NOT FOUND|SQLEXCEPTION|mysql_error_code [,...] sp_statement
```

- {CONTINUE|EXIT|UNDO}：处理错误的方式，CONTINUE表示继续执行，EXIT表示终止执行，UNDO暂时还不支持；
- SQLSTATE [VALUE] sqlstate_value|condition_name|SQLWARNING|NOT FOUND|SQLEXCEPTION|mysql_error_code：错误捕获的方式，可以是SQL语句自身定义的状态值，也可以是我们自己定义的condition_name，亦或是mysql定义的错误码，还可以是对sql状态预定义的SQLWARNING(以01开头的SQLSTATE代码速记)、NOT FOUND(以02开头的SQLSTATE代码速记)、SQLEXCEPTION(其它没有被包括的SQLSTATE代码速记)；

下面举个例子说明一下出现异常时的处理：

```java
1. 我先创建一个actor表并定义actor_id为主键，插入四条数据
mysql> create table actor (actor_id int not null primary key,first_name char(10),last_name char(10));
Query OK, 0 rows affected (0.01 sec)
mysql> insert into actor values(1,'a','a'),(2,'b','b'),(3,'c','c'),(4,'d','d');
Query OK, 4 rows affected (0.00 sec)
Records: 4  Duplicates: 0  Warnings: 0
2. 创建存储过程
mysql> delimiter $$
mysql>
mysql> create procedure actor_insert()
    -> begin
    -> set @x = 1;
    -> insert into actor values(5,'e','e');
    -> set @x = 2;
    -> insert into actor values(1,'a','a');
    -> set @x = 3;
    -> end $$
Query OK, 0 rows affected (0.00 sec)
mysql> delimiter ;
3. 调用存储过程
mysql> call actor_insert();     调用报错，错误是主键重复，而且通过@x的值为2可以知道SET @x=3并没有执行，因此一旦出错，存储过程即停止执行
ERROR 1062 (23000): Duplicate entry '1' for key 'PRIMARY'
mysql> select @x;
+------+
| @x   |
+------+
|    2 |
+------+
1 row in set (0.00 sec)
4. 对主键重复这个错误进行异常处理
mysql> delimiter $$
mysql> create procedure actor_insert1()
    -> begin
    -> declare continue handler for sqlstate '23000' set @x2 =1;    sqlstate '23000'是前面出错时提示的错误代码
    -> set @x = 1;
    -> insert into actor values(5,'e','e');     这条数据仍然能插入到表中说明前面的存储过程虽然执行了这条语句但是由于出错并没有提交，所以现在还能重新执行
    -> set @x = 2;
    -> insert into actor values(1,'a','a');
    -> set @x = 3;
    -> end $$
Query OK, 0 rows affected (0.00 sec)
mysql> delimiter ;
mysql> call actor_insert1();
Query OK, 0 rows affected (0.00 sec)
mysql> select @x,@x2;       这里得到@x=3说明上面出错的地方被忽略过了，@x=1说明错误处理语句正常执行了
+------+------+
| @x   | @x2  |
+------+------+
|    3 |    1 |
+------+------+
1 row in set (0.00 sec)
```

这里再提一点，上面用到的错误处理代码sqlstate '23000' 是根据出错时的提示得到的，不然我也不知道，当然还可以有其它的写法，如：

```java
--捕获 mysql-error-code
DECLARE CONTINUE HANDLER FOR 1062 SET @x2=1;
--事先定义 condition_name
DECLARE Duplicatekey CONDITION FOR SQLSTATE '23000';
DECLARE CONTINUE HANDLER FOR Duplicatekey SET @x2=1;
--捕获SQLEXCEPTION
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @x2 = 1;
```

#### 2.6 光标的使用

在存储过程和函数中，可以使用光标对结果集进行循环处理，光标的使用包括四步，其语法分别如下：

```java
1. 声明光标
DECLARE cursor_name CURSOR FOR select_statement
2. 打开光标
OPEN cursor_name
3. 获取光标
FETCH cursor_name INTO var_name [,var_name]...
4. 关闭光标
CLOSE cursor_name
```

下面举个例子：

```java
这个例子可能会有一些错误，但这里主要是让大家了解光标的使用，暂时就不要纠结这个错误问题
mysql> delimiter $$
mysql>
mysql> create procedure actor_stat()
    -> begin
    -> declare i_actor_id int;
    -> declare c_first_name char(10);
    -> declare cur_actor cursor for select actor_id,first_name from actor;
    -> declare exit handler for not found close cur_actor;
    ->
    -> set @x1=0;
    -> set @x2=0;
    ->
    -> open cur_actor;
    -> repeat
    ->  fetch cur_actor into i_actor_id,c_first_name;
    ->    if i_actor_id =2 then
    ->        set @x1 = @x1+c_first_name;
    ->    else
    ->        set @x2 = @x2+c_first_name
    ->    end if;
    ->  until 0 end repeat;
    ->
    -> close cur_actor;
    ->
    -> end $$
mysql> delimiter ;
```

**注意：** 变量、条件、光标、错误处理都是通过DECLARE定义的，他们有先后顺序要求，注意按照当前列出的顺序写。

#### 2.7 流程控制

流程控制一共有7中，下面一一介绍。

**1. IF语句**

```java
IF 语句实现条件判断执行不同的语句列表
IF condition then statement_list
   [ELSEIF condition then statement_list]....
   [ELSE statement_list]
END IF
```

**2. CASE 语句**

```java
CASE语句可以实现更复杂一点的条件选择
CASE case_value
     WHEN when_value THEN statement_list
     [WHEN when_value THEN statement_list]...
     [ELSE statement_list]
END CASE
或者
CASE 
     WHEN search_condition THEN statement_list
     [WHEN search_condition THEN statement_list]...
     [ELSE statement_list]
END CASE
上面例子中的if块可以这么写：
CASE 
     WHEN i_actor_id =2 THEN set @x1 = @x1+c_first_name;
     ELSE set @x2 = @x2+c_first_name；
END CASE
或
CASE i_actor_id
     WHEN 2 THEN set @x1 = @x1+c_first_name;
     ELSE set @x2 = @x2+c_first_name；
END CASE
```

**3. LOOP 语句**

```java
实现简单循环，退出的条件需要额外定义，通常使用LEAVE实现，如果没有退出条件那么就是死循环
[bengin_label:]LOOP
           statement_list
END LOOP [end_label]
```

**4. LEAVE 语句**

```java
从标注的流程构造中退出，通常和begin..end或者循环一起使用
例如：
begin
  set @x=0;
  ins:LOOP
    set @x = @x + 1;
    if @x = 100 then
    leave ins;
    END if;
    insert into ...
  END LOOP ins;
end
```

**5. ITERATE 语句**

```java
ITERATE必须用在循环中，作用是跳过当前循环剩下的语句直接开始下一次循环，跟其它语言中的continue一样
例如：
begin
  set @x=0;
  ins:LOOP
    set @x = @x + 1;
    if @x = 100 then
    leave ins;
    elseif mod(@x,2) = 0 then
    iterate ins;
    END if;
    insert into ...
  END LOOP ins;
end
```

6**. REPEAT 语句**

```java
有条件的循环控制语句，当满足条件时退出循环
[begin_label:]REPEAT
     statement_list
UNTIL search_condition
END REPEAT [end_label]
```

7**. WHILE 语句**

```java
实现有条件的循环控制
[begin_label:] WHILE search_condition DO
      statement_list
END WHILE [end_label]
WHILE循环与REPEAT循环的区别就像别的语言中while 与 do while的区别；
```

#### 2.8 事件调度器

事件调度器可以指定数据库按照一定时间周期触发某种操作，可以理解为时间触发器，类似于Linux系统下的任务调度器，在MySQL5.1版本后才有该功能。

```java
创建一个简单的事件调度器
CREATE EVENT myevent 
    ON SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 1 HOUR 
    DO UPDATE myschema.mytable SET mycol = mycol + 1；
说明：
myevent 事件调度器名称
ON SCHEDULE 字句指定事件在合适执行及执行频次
DO子句指定要具体执行的操作或事件
```

下面通过一个完整的实例来展示事件调度器的使用：

```java
1. 创建表及事件调度器，每5秒向表中插入一条数据
mysql> create table test(id1 varchar(10),create_time datetime);
Query OK, 0 rows affected (0.02 sec)
mysql> create event test_event_1
    -> on schedule every 5 second
    -> do insert into test1.test(id1,create_time) values('test',now());
Query OK, 0 rows affected (0.00 sec)
2. 查看调度器状态
mysql> show events \G
*************************** 1. row ***************************
                  Db: test1
                Name: test_ecent_1
             Definer: root@ddkk.com
           Time zone: SYSTEM
                Type: RECURRING
          Execute at: NULL
      Interval value: 5
      Interval field: SECOND
              Starts: 2018-12-21 17:33:32
                Ends: NULL
              Status: ENABLED
          Originator: 1
character_set_client: gbk
collation_connection: gbk_chinese_ci
  Database Collation: utf8_general_ci
1 row in set (0.00 sec)
3. 隔几秒后查看表test，发现并没有数据插入（一开始我这里是插入语句写错了所以没有数据插进去）
mysql> select * from test;
Empty set (0.00 sec)
4. 查看事件调度器的状态，发现默认是关闭的
mysql> show variables like '%scheduler%';
+-----------------+-------+
| Variable_name   | Value |
+-----------------+-------+
| event_scheduler | OFF   |
+-----------------+-------+
1 row in set, 1 warning (0.00 sec)
5. 通过以下命令打开调度器，同时查看后台进程
mysql> set global event_scheduler =1;
Query OK, 0 rows affected (0.00 sec)
mysql> show variables like '%scheduler%';
+-----------------+-------+
| Variable_name   | Value |
+-----------------+-------+
| event_scheduler | ON    |
+-----------------+-------+
1 row in set, 1 warning (0.00 sec)
mysql> show processlist \G
*************************** 1. row ***************************
     Id: 6
   User: root
   Host: localhost:6650
     db: test1
Command: Query
   Time: 0
  State: starting
   Info: show processlist
*************************** 2. row ***************************
     Id: 7
   User: event_scheduler           一个新的事件调度器进程
   Host: localhost
     db: NULL
Command: Daemon
   Time: 2
  State: Waiting for next activation
   Info: NULL
2 rows in set (0.00 sec)
7. 隔几秒后再次查看test表
mysql> select * from test;
+------+---------------------+
| id1  | create_time         |
+------+---------------------+
| test | 2018-12-21 17:44:02 |
| test | 2018-12-21 17:44:07 |
| test | 2018-12-21 17:44:13 |
| test | 2018-12-21 17:44:17 |
+------+---------------------+
4 rows in set (0.00 sec)
8. 为防止表一直插入变得很大，创建一个新的调度器每个1分钟清空一次test表
mysql> create event trunc_test on schedule every 1 minute
    -> do truncate table test;
Query OK, 0 rows affected (0.00 sec)
mysql> select * from test;      最开始的那些记录已经被清除掉了，这类触发器非常适合定时清空临时表或者日志表
+------+---------------------+
| id1  | create_time         |
+------+---------------------+
| test | 2018-12-21 17:45:57 |
| test | 2018-12-21 17:46:02 |
| test | 2018-12-21 17:46:07 |
| test | 2018-12-21 17:46:12 |
| test | 2018-12-21 17:46:17 |
| test | 2018-12-21 17:46:22 |
| test | 2018-12-21 17:46:27 |
| test | 2018-12-21 17:46:32 |
| test | 2018-12-21 17:46:37 |
| test | 2018-12-21 17:46:42 |
| test | 2018-12-21 17:46:47 |
+------+---------------------+
11 rows in set (0.00 sec)
9. 如果调度器不再使用可以禁用或删除
mysql> alter event test_event_1 disable;
Query OK, 0 rows affected (0.00 sec)
mysql> drop event test_event_1;
Query OK, 0 rows affected (0.00 sec)
```

关于事件调度器还有很多其它的选项，比如开始结束的事件，指定执行次数等等，用到的时候可以查查相应资料。

- 事件调度器的优势：MySQL的事件调度器部署在数据库内部，安全，不会让一般人误操作；数据库迁移时不需要额外迁移定时任务，因为它已经包含了调度事件的迁移。
- 适用场景：适用于定期收集统计信息、定期清理历史数据、定期数据库检查（如自动监控和恢复slave失败进程）；
- 注意事项：在繁忙且性能要求高的数据库上要慎用事件调度器；过于复杂的事件处理尽量用程序实现而不是用事件调度器；开启和关闭事件调度器需要具有超级用户权限。
