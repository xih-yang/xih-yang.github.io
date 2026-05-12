# 02、MySQL 提升 - 约束管理(配置字段约束、自增长列)
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/2.html
- 分类：缓存数据库
- 分组：教程目录
**目录**

一、查看表的信息

1，查看表结构（约束）

2，查看表的索引

二、约束

1，创建表时设置约束

**1、** 1创建表时添加列级约束；

**1、** 2创建表时添加表级约束；

2，修改约束

**2、** 1添加约束；

**2、** 2删除约束；

3，自增长（标识列）

**3、** 1,创建表时设置：；

**3、** 2,修改表时设置：；

**3、** 3,查看和修改自增长的配置；

**3、** 4字增长列的特点；

4，主键约束和唯一约束的区别

基于mysql5.7.30 docker版本

## 一、查看表的信息

### 1，查看表结构（约束）

语法：desc 表名称;

例如：查看product_info表的信息

```java
desc product_info;
```

### 2，查看表的索引

语法：show index from 表名称;

product_info表没有建索引，没有主键，索引该表的索引为空。

## 二、约束

### 1，创建表时设置约束

#### 1.1 创建表时添加列级约束

```java
CREATE TABLE product_info1 (
    key_id int primary key ,# 主键约束
    p_code varchar(32) unique ,# 唯一约束
    p_name varchar(32) default '8888',# 默认值约束
    p_number int(8),
    p_alter int(1) check ( p_alter=0 or p_alter=1 ),# 检查约束
    p_create_user varchar(32) not null ,# 非空约束
    op_time date
);
```

**查看表的结构（约束）**

desc product_info1;

可以从表的结构中看到:

key_id为主键（并且非空）；

p_code为唯一约束，不允许有重复的值；

p_name为默认值约束，如果插入数据时该值为null则有一个默认值。

p_alter为检查约束，表中没有显示这个约束信息；

op_time为非空约束，值不允许为null；

**查看表的索引**

show index product_info1;

可以看到对于唯一值的字段是会创建索引的。

分别为key_id字段和p_code字段。

这里演示时没有添加外键约束，如果有外键约束，那么外键约束的字段也是会自动创建索引的。

#### 1.2 创建表时添加表级约束

语法：[constraint 自定义的约束名] 约束类型 (字段名)

```java
CREATE TABLE product_info2 (
    key_id int,
    p_code varchar(32),
    p_name varchar(32),
    p_number int(8),
    p_alter int(1),
    p_create_user varchar(32),
    op_time date,
    constraint pk primary key (key_id),
    constraint uq unique (p_code),
    constraint ck check ( p_alter=0 or p_alter=1)
);
```

```java
 mysql> desc product_info2;
+---------------+-------------+------+-----+---------+-------+
| Field         | Type        | Null | Key | Default | Extra |
+---------------+-------------+------+-----+---------+-------+
| key_id        | int(11)     | NO   | PRI | NULL    |       |
| p_code        | varchar(32) | YES  | UNI | NULL    |       |
| p_name        | varchar(32) | YES  |     | NULL    |       |
| p_number      | int(8)      | YES  |     | NULL    |       |
| p_alter       | int(1)      | YES  |     | NULL    |       |
| p_create_user | varchar(32) | YES  |     | NULL    |       |
| op_time       | date        | YES  |     | NULL    |       |
+---------------+-------------+------+-----+---------+-------+
7 rows in set (0.00 sec)
mysql> show index from product_info2;
+---------------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table         | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+---------------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| product_info2 |          0 | PRIMARY  |            1 | key_id      | A         |           0 |     NULL | NULL   |      | BTREE      |         |               |
| product_info2 |          0 | uq       |            1 | p_code      | A         |           0 |     NULL | NULL   | YES  | BTREE      |         |               |
+---------------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
2 rows in set (0.00 sec)
```

### 2，修改约束

语法：

列级约束：alter table 表名 modify column 字段名 字段类型 约束;

表级约束：alter table 表明 add [constraint 自定义约束名] 约束类型(字段名) [外键引用]；

新创建一个没有任何约束的表product_info3

```java
CREATE TABLE product_info3 (
    key_id int,
    p_code varchar(32),
    p_name varchar(32),
    p_number int(8),
    p_alter int(1),
    p_create_user varchar(32),
    op_time date
);
```

#### 2.1 添加约束

- 主键约束：

方式一（列级约束）：alter table product_info3 modify column key_id int primary key;

方式二（表级约束）：alter table product_info3 add primary key(key_id);

- 唯一约束：

方式一（列级约束）：alter table product_info3 modify column p_code varchar(32) unique;

方式二（表级约束）：alter table product_info3 add unique(p_code);

- 非空约束：

alter table product_info3 modify column p_create_user varchar(32) not null;

- 默认约束：

alter table product_info3 modify column p_name varchar(32) default '888';

- 外键约束：

alter table product_info3 add foreign key(外键字段名) references 其他表名(其他表的主键名)

#### 2.2 删除约束

- 主键约束：

方式一(直接删除表的主键)：alter table product_info3 drop primary key;

方式二(修改主键字段为普通字段)：alter table product_info3 modify column key_id int ;

- 唯一约束：

方式一(删除指定的唯一约束)：alter table product_info3 自定义的唯一约束名;

方式二(修改字段为普通字段)：alter table product_info3 modify column p_code varchar(32) ;

- 非空约束：

alter table product_info3 modify column p_create_user varchar(32) [null];

- 默认约束：

alter table product_info3 modify column p_name varchar(32);

- 外键约束：

方式一(删除指定的外键约束)：alter table product_info3 drop foreign key 自定义的外键约束名;

方式二(修改字段为普通字段)：alter table product_info3 modify column 字段名 字段类型;

### 3，自增长（标识列）

设置列的值自增长

#### 3.1,创建表时设置：

```java
CREATE TABLE product_info4 (
    key_id int primary key auto_increment,
    p_code varchar(32),
    p_name varchar(32),
    p_number int(8),
    p_alter int(1),
    p_create_user varchar(32),
    op_time date
);
```

#### 3.2,修改表时设置：

**添加**：alter table product_info4 modify column key_id int primary key auto_increment;

**删除**：alter table product_info4 modify column key_id int;

#### 3.3,查看和修改自增长的配置

查看：show variables like '%auto_increment%';

设置步长：set auto_increment_increment = 5;

设置起始值：set auto_increment_offset =100;

#### 3.4 字增长列的特点

Q1：自增长列必须是主键吗？

A1：不是，可以是主键、外键、唯一约束的列，即自增长列满足列值的唯一性即可。

Q2：一个表可以有多少个标示列(自增长列)？

A2：最多只可以有一个。

Q3：自增长列的数据类型？

A3：只可以是数值型，例如：int、long、float等

### 4，主键约束和唯一约束的区别

保证唯一性
是否允许为NULL
可以设置多少个
是否允许组合

主键约束
是
不允许
1个或者0个
是

唯一约束
是
允许有一个NULL
多个
是
