# 09、MySQL 提升 - 触发器
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/9.html
- 分类：缓存数据库
- 分组：教程目录
### 介绍

触发器是与表相关的数据库对象，在insert/update/delete之前或之后，触发并执行触发器中定义的SQL语句集合。触发器的这种特性可以协助应用在数据库端确保数据的完整性，日志记录，数据校验等操作。

使用别名OLD和NEW来引用触发器中发生变化的记录内容，当前触发器仅支持行即触发，不支持语句级触发。

触发器类型
NEW和OLD的使用

INSERT触发器
NEW表示将要或者已经新增的数据

UPDATE触发器
OLD表示修改之前的数据，NEW表示将要或者已经修改后的数据

DELETE触发器
OLD表示将要或者已经删除的数据

### 创建触发器

#### 语法：

```java
create trigger 触发器名称
before|after insert|update|delete
on 表名
[for each row] 行级触发器
begin
	触发器内容
end
```

#### 使用示例：

需求：在插入学生信息的时候，自动查询出老师的信息，然后插入到学生老师对应关系表中

```java
DELIMITER $
create trigger auto_add_teacher
    after insert
on student_info
    for each row
begin
    declare teacherName varchar(32) default '没有赋值成功';
    根据学生的班级好查询出老师姓名放到teacherName这个变量中
    select t.t_name into teacherName
    from teacher_info t where t.class = new.class;
    插入学生姓名和老师姓名
    insert into student_teacher_info(s_name, t_name) values (new.s_name,teacherName);
end$
```

在mysql客户端执行

```java
创建触发器
mysql> create trigger auto_add_teacher
    ->     after insert
    -> on student_info
    ->     for each row
    -> begin
    ->     declare teacherName varchar(32) default '';
    ->     select t.t_name into teacherName
    ->     from teacher_info t where t.class = new.class;
    ->     insert into student_teacher_info(s_name, t_name) values (new.s_name,teacherName);
    -> end$
Query OK, 0 rows affected (0.01 sec)
插入一条学生信息
mysql> insert into student_info(key_id, s_name, age, class) VALUES (null,'xiaohua',17,'002');$
Query OK, 1 row affected (0.01 sec)
学生信息插入成功
mysql> select * from student_info $
+--------+---------+------+-------+
| key_id | s_name  | age  | class |
+--------+---------+------+-------+
|      1 | xiaohua |   17 | 002   |
+--------+---------+------+-------+
1 row in set (0.00 sec)
学生老师对应关系信息插入成功
mysql> select * from student_teacher_info $
+---------+--------+
| s_name  | t_name |
+---------+--------+
| xiaohua | 张老师    |
+---------+--------+
1 row in set (0.00 sec)
```

### 查看和删除

#### 查看语法

```java
show triggers;
```

使用\G格式化查询结果：

```java
mysql> show triggers \G $
*************************** 1. row ***************************
             Trigger: auto_add_teacher
               Event: INSERT
               Table: student_info
           Statement: begin
    declare teacherName varchar(32) default '';
    select t.t_name into teacherName
    from teacher_info t where t.class = new.class;
    insert into student_teacher_info(s_name, t_name) values (new.s_name,teacherName);
end
              Timing: AFTER
             Created: 2020-07-12 07:42:45.05
            sql_mode: ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
             Definer: root@ddkk.com
character_set_client: latin1
collation_connection: latin1_swedish_ci
  Database Collation: utf8_general_ci
1 row in set (0.00 sec)
```

#### 删除语法：

```java
drop trigger [schema_name].trigger_name
# 如果没有指定schema，则默认为当前数据库
```
