# 04、MySQL 教程 - MySQL 表
- 来源：https://ddkk.com/zhuanlan/db/mysql/8/4.html
- 分类：缓存数据库
- 分组：教程目录
## 表

**表（Table）**：存储特定类型数据的结构化表格

1）列出当前数据库中所有的表：`SHOW TABLES；`

2）列出创建表时的SQL语句：`SHOW CREATE TABLE 表名；`

3）查看表结构：`DESC 表名；`

4）是否开启外键约束检查：`SET FOREIGN_KEY_CHECKS=1/0；`

5）列出表的相关信息：`SHOW TABLES LIKE ‘表名’；`

//`DESCRIBE 表名；`和`SHOW COLUMNS FROM 表名；`也可查看表结构

如：查看mysql库中的user表信息；

字段
含义

Name
表名

Engine
表的存储引擎类型

Row_format
行的格式

Rows
表中的行数

Avg_row_length
平均每行包含的字节数

Data_length
表数据的大小（单位：字节）

Max_data_length
表数据的最大容量

Index_length
索引的大小（单位：字节）

Data_free
已分配但未使用的空间

Auto_increment
下一个AUTO_INCREMENT的值

Create_time
表的创建时间

Update_time
表数据的最后修改时间

Check_time
最后依次检查表的时间

Collation
表的默认字符集和字符列排序规则

Checksum
是否保存整个表的实时校验和

Create_options
创建表时指定的其他选项

Comment
创建时的注释

### 创建表

DDL实现表的创建：通过CREATE语句创建表

CREATE TABLE创建表的格式：

```java
CREATE  TABLE  [IF  NOT  EXISTS]  表名（
字段1  数据类型  列级约束1  列级约束N，
字段2  数据类型  列级约束1  列级约束N，
……
字段N  数据类型  列级约束，
表级约束1，
……
表级约束N
）其他选项 （如：ENGINE=引擎 DEFAULT CHARSET=字符集）；
```

1）`IF NOT EXISTE`：代表如果同名表名不存在，则建立表（反之不建立）；

2）字段：指定该列的字段名，且具有唯一性；

3）数据类型：指定该字段可存储的数据类型；

4）列级约束：限制该字段；

5）表级约束：限制该表；

6）其他选项：指定该表的存储引擎、字符集和字符序等

如：建立user表，其主键为user_id

1）AUTO_INCREMENT约束的表可插入数据，该数据必须是唯一的且为整数，插入的数据会代替自动生成的数据，且后续自动生成的值从该值开始增加；

2）数据库中每张表的存储引擎都可单独指定；

3）使用不同存储引擎的表不能建立外键（主键可以）；

//`LAST_INSERT_ID（）`函数可查询最后一AUTO_INCREMENT生成的值

常用的存储引擎有以下3种：

1）`InnoDB`：可靠的事务处理引擎（不支持全文本搜索）；

2）`MyISAM`：性能极高的引擎，支持全文本搜索（不支持事务处理）

3）`MEMORY`：功能等同于MyISAM，但数据存储在内存中（适合临时表）；

### 管理表

#### ALTER

DDL实现表的管理：通过ALTER语句管理表

ALTER管理格式：`ALTER TABLE 表名 修改类；`

//修改类有：表名、字段、约束和选项

1）管理表名：

修改表名：

格式1：

```java
ALTER TABLE表名
RENAME [TO] 新表名；
```

格式2：

```java
RENAME TABLE 表名 TO 新表名； 
```

2）管理字段

同时修改字段的字段名和数据类型：

```java
ALTER TABLE 表名
CHANGE [COLUMN] 原字段名 新字段名 新数据类型
```

修改字段的数据类型

```java
ALTER TABLE 表名
MODIFY [COLUMN] 字段名 新数据类型	
```

修改字段的排列位置：

```java
ALTER TABLE 表名
MODIFY [COLUMN] 字段名1 数据类型 FIRST\AFTER 字段名2
```

//FIRST表示将字段名1调整到第一列，AFTER字段名2表示调整到字段名2之后

删除字段：

```java
ALTER TABLE 表名
DROP [COLUMN] 字段名；
```

增加字段：

```java
ALTER TABLE 表名
ADD [COLUMN] 字段名 数据类型 [列级约束] [FIRST\AFTER 字段名]	；
```

3）管理约束

查看指定表中约束名：

```java
SELECT CONSTRAINT_NAME，CONSTRAINT_TYPE 
FORM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA=‘数据库名’AND TABLE_NAME=‘表名’；
```

删除主键约束

```java
ALTER TABLE 表名
DROP PRIMARY KEY；
```

增加主键约束

```java
ALTER TABLE 表名
ADD PRIMARY KEY （列名）；
```

删除外键约束：

```java
ALTER TABLE 表名
DROP FOREIGN KEY 外键约束名；
```

增加外键约束：

```java
ALTER TABLE 表名 
ADD [CONSTRAINT 约束名] FOREIGN KEY (字段) REFERENCES 父表 (主码字段)；
```

删除唯一约束：

```java
ALTER TABLE 表名
DROP INDEX 唯一约束名； 
```

添加唯一约束：

```java
ALTER TABLE 表名
ADD [CONSTRAINT 约束名] UNIQUE (列名)； 
```

删除默认值约束（change也可以替换成modify）：

```java
ALTER TABLE 表名 
CHANGE [COLUMN] 原字段名 原字段名 原数据类型 DEFAULT NULL；
```

添加默认值约束（chang也可以替换成modify）：

```java
ALTER TABLE 表名 
CHANGE [COLUMN]原字段名 原字段名 原数据类型 DEFAULT 默认值;
```

删除非空约束（change也可以替换成modify）：

```java
ALTER TABLE 表名
CHANGE [COLUMN] 原字段名 原字段名 原数据类型 NULL;
```

添加非空约束（change也可以替换成modify）：

```java
ALTER TABLE 表名
CHANGE [COLUMN] 原字段名 原字段名 原数据类型 NOT NULL;
```

4）管理选项

修改存储引擎

```java
ALTER TABLE 表名 ENGINE=引擎类型;
```

修改默认字符集

```java
ALTER TABLE 表名 DEFAULT CHARSET=字符集；
```

修改自增字段的初始值

```java
ALTER TABLE 表名 AUTO_INCREMENT=初始值；
```

修改索引关键字的压缩类型

```java
ALTER TABLE 表名 PACK_KEYS=压缩类型；
```

仅复制表结构（不复制表中的数据）：

```java
CREATE  TABLE  新表名  LIKE  源表名；
```

同时复制表的结构和表中数据：

```java
CREATE  TABLE  新表名
SELECT  *
FROM  源表名
WHERE 条件表达式；
```

//仅复制结构时，在where跟不成立的条件（如：1=2）

#### INSERT

DML实现数据插入：通过INSERT语句将数据插入表中

1）插入数据时需注意表的约束，只有满足相关约束才能插入成功

2）对关联表插入数据时，应先向父表插入数据再向子表插入数据

3）向字符串类型和日期时间类型插入数据时，字段值要用单引号括起来

//或先取消外键检查，插入数据后再开启外键检查

**完整数据**：对表中所有的字段都有对应的数据

**非完整数据**：仅对表中部分字符有对应的数据（其他则忽略）

1）忽略的字段应支持NULL、自增或有默认值

2）若字段不支持，且插入的数据不包含该字段，则插入失败

INSERT插入格式1：插入完整数据

```java
INSERT  INTO  表名（字段名1[，···，字段名N]）
VALUES （数据1 [，···，数据N]）；
```

1）插入完整数据时，若数据的顺序和表中字段的顺序一致，则可省略字段名

2）可在非完整数据的基础上构造一个完整数据记录实现插入完整数据（在未有数值的情况下填写NULL或0）

如：插入完整数据至customers表

//该方式过于依赖原表字段结构顺序，很少使用

如：指定字段插入完整数据至customers表

INSERT插入格式2：插入非完整数据

```java
INSERT  INTO  表名（字段名1 [，···，字段名N]）
VALUES （数据1 [，···，数据N]）
```

1）插入非完整数据时，字段名不能省略

2）数据的插入位为数据顺序对应的字段名列表中的顺序位

3）未指定的字段上默认取NULL、自增或默认值（有相关约束）

如：插入非完整数据至customers表

INSERT插入格式3：批量插入数据（插入完整/非完整数据均可）

```java
INSERT  INTO  表名  （字段名1[，···，字段名N]） VALUES
（数据表1），
（数据表2），
······
（数据表N）；
```

//数据表中数据的顺序和表中字段的顺序相对应

如：插入多个非完整数据至customers表

降低INSERT优先级指令：`INSERT LOW_PRIORITY INTO`

1）INSERT语句是比较占用性能和耗时的行为，为保证整体服务器的性能

2）可在调用INSERT插入时，降低其优先级

3）同样适用于UPDATE和DELETE

##### INSERT SELECT

**INSERT SELECT**：将SELECT语句检索的结果导入指定表中

1）通常用于表的复制/备份、移植和表的扩建

2）INSERT SELECT中需注意主键值的重复会导致插入识别

//一般情况下选择忽略掉源表中的主键字段进行导入

INSERT SELECT插入格式：

```java
INSERT  INTO  目标表名  （字段名1[，···，字段名N]）
SELECT  （字段名1[，···，字段名N]）
FROM  源表名
[WHERE 条件表达式];
```

1）目标表名表示要复制进去记录的表名

2）目标表的字段和select的字段个数必须相同，且数据类型一致

//两个字段名不要求相同

如：将custnew表中的数据移至customers表中

##### REPLACE

**replace**： delete和insert的合体，能够简化操作

1）不同在于：若新数据的主键约束或唯一性约束的字段值与已有数据相同，则会先删除已有数据，然后再插入新数据（数据的删除不能违背约束条件）

2）replace的语法格式和INSERT相同（只需将INSERT更换为REPLACE）

REPLACE其他插入格式：

```java
REPLACE  INTO  表名
SET 字段名1=数据1，···，字段名N=数据N；
```

#### UPDATE

DML实现数据插入：通过UPDATE语句更新表中指定的数据

update更新数据格式：

```java
UPDATE  表名
SET  字段名1=值1  [，···，字段名N=值N]
WHERE 条件表达式；
```

1）WHERE指定对表中更新的行（若不指定，则默认全部行）

2）SET指定该行的字段（字段可以是数据、表达式或DEFAULT）

3）同插入数据一样，需要满足各种约束前提下才能修改成功

如：更新customers表中cust_id为10005的cust_name和cust_email

IGNORE参数：使UPDATE忽略报错，强制更新表中数据

1）UPDATE强制更新数据格式：`UPDATE IGNORE 表名`

如：强制删除customres表中cust_id为10005的cust_email字段值

#### DELETE

DML实现数据插入：通过DELETE语句删除表中指定的数据

DELECT删除数据格式：

```java
DELETE  FROM  表名
WHERE 条件表达式；
```

1）WHERE指定表中删除的行（若不指定，则默认删除全部行）

2）若删除子表的外码引用的父表中主码记录时

3）数据的删除是以行单位（不能只删除行的几个字段的值）

//应先在子表中删除外码约束（解除父子关系），否则删除不能成功

如：删除customers表中cust_id为10006的行

##### TRUNCATE

**TRUNCATE**：删除指定表，并重新建立一个与源表相同表结构的表

TRUNCATE删除数据格式

```java
TRUNCATE  [TABLE]  表名;
```

1）TRUNCATE是清空表中所有的记录

2）TRUNCATE不支持事务的回滚（DELETE语句支持恢复）

3）使用TRUNCATE清空父表时会永远执行失败

4）TRUNCATE不能激活触发器程序的运行

#### DROP

DDL实现表的删除：通过DROP语句删除表

DROP删除表格式：

```java
DROP TABLE 表名
```
