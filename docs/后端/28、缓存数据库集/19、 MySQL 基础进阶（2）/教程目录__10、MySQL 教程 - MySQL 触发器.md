# 10、MySQL 教程 - MySQL 触发器
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/10.html
- 分类：缓存数据库
- 分组：教程目录
触发器是与表有关的数据库对象，在满足定义的条件时触发，然后执行触发器中定义的语句集合，这种特性可以协助应用在数据库端确保数据的完整性。MySQL在5.02版本后开始支持该功能。

## 一、创建触发器

语法如下：

```java
CREATE TRIGGER trigger_name trigger_time trigger_event ON tbl_name FOR EACH ROW trigger_stmt
```

- trigger_name：触发器的名字；
- trigger_time：触发器的触发时间，有两个取值，BEFORE或AFTER；
- trigger_event：触发的事件，取值为INSERT（向表中插入新行时触发，例如INSERT、LOAD DATA、REPLACE等操作都会插入新行）、UPDATE（更新某一行时触发）、DELETE（删除某一行时触发，如DELETE、REPLACE）；
- trigger_stmt：触发器触发后执行的操作语句，如果语句较多可以使用BEGIN....END语句块包裹起来。

**注意：** 触发器只能创建在永久表上，不能对临时表创建触发器。

对同一个表的相同出发时间相同触发事件只能定义一个触发器，可以使用别名OLD和NEW来引用触发器中发生变化的记录内容。下面举个例子来简单认识以下触发器：

```java
1. 首先创建两张表，里面暂无数据
mysql> create table film(film_id int auto_increment primary key,title char(10),description varchar(20));
Query OK, 0 rows affected (0.02 sec)
mysql> create table film_text(film_id int auto_increment primary key,title char(10),description varchar(20));
Query OK, 0 rows affected (0.01 sec)
2. 对film表创建一个触发器，作用是当film表有新的数据插入时film_text表也会进行相应操作
mysql> delimiter $$
mysql>
mysql> create trigger ins_film after insert on film for each row
    -> begin
    -> insert into film_text values(new.film_id,new.title,new.description);
    -> end $$
Query OK, 0 rows affected (0.01 sec)
mysql> delimiter ;
3. 向film表插入记录同时查看film_text表的变化
mysql> insert into film values(1,'ACADEMY','A E pic drama of...');
Query OK, 1 row affected (0.00 sec)
mysql> select * from film;
+---------+---------+---------------------+
| film_id | title   | description         |
+---------+---------+---------------------+
|       1 | ACADEMY | A E pic drama of... |
+---------+---------+---------------------+
1 row in set (0.00 sec)
mysql> select * from film_text;
+---------+---------+---------------------+
| film_id | title   | description         |
+---------+---------+---------------------+
|       1 | ACADEMY | A E pic drama of... |
+---------+---------+---------------------+
1 row in set (0.00 sec)
可以看到对film表插入数据时触发了触发器，对film_text表同样插入了相应的数据
```

这里有一点值得说明的是，有时候同一个触发器可能被不同的事件触发，比如上面提到的INSERT、LOAD DATA操作都可以触发插入事件；另外，多个触发器对某一事件都会触发时触发的顺序也会让人疑惑，比如这个语句 INSERT INTO ... ON DUPLICATE KEY UPDATE 插入时如果遇到重复值则进行更新操作，这里有可能是插入操作也有可能是更新操作，因此可能触发的触发器会比较多，比如下面的一个例子：

```java
1. 创建四个触发器
mysql> delimiter $$
mysql>
mysql> create trigger ins_film_bef before insert on film for each row
    -> begin
    -> insert into film_text(title) values('before insert');
    -> end $$
Query OK, 0 rows affected (0.01 sec)
mysql> create trigger ins_film_aft after insert on film for each row
    -> begin
    -> insert into film_text(title) values('after insert');
    -> end $$
Query OK, 0 rows affected (0.01 sec)
mysql> create trigger upd_film_bef before update on film for each row
    -> begin
    -> insert into film_text(title) values('before update');
    -> end $$
Query OK, 0 rows affected (0.01 sec)
mysql> create trigger upd_film_aft after update on film for each row
    -> begin
    -> insert into film_text(title) values('after update');
    -> end $$
Query OK, 0 rows affected (0.01 sec)
mysql> delimiter ;
2. 对上面创建的film_text表进行些许修改
mysql> delete from film_text;
Query OK, 1 row affected (0.00 sec)
mysql> alter table film_text drop description;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
3. 插入记录已经存在的情况
mysql> insert into film values(1,'onlytest','test for trigger') on duplicate key update title='update';
Query OK, 2 rows affected (0.01 sec)
mysql> select * from film_text;
+---------+---------------+
| film_id | title         |
+---------+---------------+
|       2 | before insert |
|       3 | before update |
|       4 | after update  |
+---------+---------------+
3 rows in set (0.00 sec)
4. 插入新记录的情况
mysql> delete from film_text;
Query OK, 3 rows affected (0.00 sec)
mysql> insert into film values(2,'test','trigger') on duplicate key update title='update';
Query OK, 1 row affected (0.01 sec)
mysql> select * from film_text;
+---------+---------------+
| film_id | title         |
+---------+---------------+
|      13 | before insert |
|      14 | after insert  |
+---------+---------------+
2 rows in set (0.00 sec)
```

从这个例子可以看出触发器的执行顺序，对于已有数据无法重复插入而执行更新操作时，BEFORE INSERT、BEFORE UPDATE、AFTER UPDATE触发器被触发；而仅仅是执行简单的插入的话BEFORE INSERT、AFTER INSERT触发器被触发；因此，在写此类触发器的时候要注意这种情况，避免错误的触发触发器。

## 二、删除触发器

删除触发器语法：

DROP TRIGGER [schema_name.]trigger_name 如果不指定schema_name则默认为当前数据库

```java
mysql> drop trigger ins_film;
Query OK, 0 rows affected (0.01 sec)
```

## 三、查看触发器

查看触发器一般有两种方法：SHOW TRIGGERS和查询系统表information_schema.trigger；

使用命令show triggers：

```java
使用命令show triggers
mysql> show triggers \G
*************************** 1. row ***************************
             Trigger: ins_film_bef
               Event: INSERT
               Table: film
           Statement: begin
insert into film_text(title) values('before insert');
end
              Timing: BEFORE
             Created: 2018-12-24 11:21:42.42
            sql_mode: STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
             Definer: root@ddkk.com
character_set_client: gbk
collation_connection: gbk_chinese_ci
  Database Collation: utf8_general_ci
*************************** 2. row ***************************
             Trigger: ins_film_aft
               Event: INSERT
               Table: film
           Statement: begin
insert into film_text(title) values('after insert');
end
              Timing: AFTER
             Created: 2018-12-24 11:22:50.75
            sql_mode: STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
             Definer: root@ddkk.com
character_set_client: gbk
collation_connection: gbk_chinese_ci
  Database Collation: utf8_general_ci
。。。。。。
```

这种方法可以查看到触发器的状态、语法等信息，但它会查出所有的触发器，不能指定单独的，所以不是很方便。

使用系统表命令：

```java
mysql> desc information_schema.triggers;
+----------------------------+---------------+------+-----+---------+-------+
| Field                      | Type          | Null | Key | Default | Extra |
+----------------------------+---------------+------+-----+---------+-------+
| TRIGGER_CATALOG            | varchar(512)  | NO   |     |         |       |
| TRIGGER_SCHEMA             | varchar(64)   | NO   |     |         |       |
| TRIGGER_NAME               | varchar(64)   | NO   |     |         |       |
| EVENT_MANIPULATION         | varchar(6)    | NO   |     |         |       |
| EVENT_OBJECT_CATALOG       | varchar(512)  | NO   |     |         |       |
| EVENT_OBJECT_SCHEMA        | varchar(64)   | NO   |     |         |       |
| EVENT_OBJECT_TABLE         | varchar(64)   | NO   |     |         |       |
| ACTION_ORDER               | bigint(4)     | NO   |     | 0       |       |
| ACTION_CONDITION           | longtext      | YES  |     | NULL    |       |
| ACTION_STATEMENT           | longtext      | NO   |     | NULL    |       |
| ACTION_ORIENTATION         | varchar(9)    | NO   |     |         |       |
| ACTION_TIMING              | varchar(6)    | NO   |     |         |       |
| ACTION_REFERENCE_OLD_TABLE | varchar(64)   | YES  |     | NULL    |       |
| ACTION_REFERENCE_NEW_TABLE | varchar(64)   | YES  |     | NULL    |       |
| ACTION_REFERENCE_OLD_ROW   | varchar(3)    | NO   |     |         |       |
| ACTION_REFERENCE_NEW_ROW   | varchar(3)    | NO   |     |         |       |
| CREATED                    | datetime(2)   | YES  |     | NULL    |       |
| SQL_MODE                   | varchar(8192) | NO   |     |         |       |
| DEFINER                    | varchar(93)   | NO   |     |         |       |
| CHARACTER_SET_CLIENT       | varchar(32)   | NO   |     |         |       |
| COLLATION_CONNECTION       | varchar(32)   | NO   |     |         |       |
| DATABASE_COLLATION         | varchar(32)   | NO   |     |         |       |
+----------------------------+---------------+------+-----+---------+-------+
22 rows in set (0.00 sec)
```

```java
mysql> select * from information_schema.triggers where trigger_name = 'ins_film_bef' \G;
*************************** 1. row ***************************
           TRIGGER_CATALOG: def
            TRIGGER_SCHEMA: test1
              TRIGGER_NAME: ins_film_bef
        EVENT_MANIPULATION: INSERT
      EVENT_OBJECT_CATALOG: def
       EVENT_OBJECT_SCHEMA: test1
        EVENT_OBJECT_TABLE: film
              ACTION_ORDER: 1
          ACTION_CONDITION: NULL
          ACTION_STATEMENT: begin
insert into film_text(title) values('before insert');
end
        ACTION_ORIENTATION: ROW
             ACTION_TIMING: BEFORE
ACTION_REFERENCE_OLD_TABLE: NULL
ACTION_REFERENCE_NEW_TABLE: NULL
  ACTION_REFERENCE_OLD_ROW: OLD
  ACTION_REFERENCE_NEW_ROW: NEW
                   CREATED: 2018-12-24 11:21:42.42
                  SQL_MODE: STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
                   DEFINER: root@ddkk.com
      CHARACTER_SET_CLIENT: gbk
      COLLATION_CONNECTION: gbk_chinese_ci
        DATABASE_COLLATION: utf8_general_ci
1 row in set (0.02 sec)
```

## 四、触发器的使用

触发器执行的语句有以下两个限制：

- 触发器不能调用将数据返回客户端的存储程序，也不能使用采用CALL语句的动态SQL语句，但是允许存储过程或函数通过OUT或者INOUT类型的参数将数据返回触发器；
- 不能在触发器中使用以显示或隐式方式开始或结束事务的语句，如START TRANSACTION、COMMIT或ROLLBACK。

MySQL触发器按照before触发器、行操作、after触发器的顺序执行，其中任何一个步骤出错后面的都不会执行，如果是对一个事务表的操作那么一旦出错整个操作会作为一个事务被回滚；但如果是非事务表的操作，那么已经更新的记录将无法回滚，因此这一点需要非常注意！

触发器过多容易出错而且性能也会下降，因此要合理使用，不要将过多的处理逻辑依赖触发器。
