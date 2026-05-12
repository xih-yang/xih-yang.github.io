# 34、SQL PRIMARY KEY 约束
- 来源：https://ddkk.com/zhuanlan/db/sql/34.html
- 分类：缓存数据库
- 分组：教程目录
SQLPRIMARY KEY 又称 **主键** ， 用于约束唯一标识数据库表中的每条记录

**1、** 主键必须包含唯一的值；

**2、** 主键列不能包含NULL值；

**3、** 每个表都应该有一个主键，并且每个表只能有一个主键；

PRIMARY KEY 我们经常都在用，但大部分人都没有意识到这是一个约束

## PRIMARY KEY 是什么？ 为什么需要它?

如果想要唯一标识某一条记录，或者阻止一个表中存在相同的两条记录，或者阻止一个表中的某个字段存在相同的记录，我们要怎么做？

当然是在插入或者更新的时候检查表或者字段是否存在，如果存在可以删除或者修改，不存在则插入

有没有更简单的方法呢？ 有的，就是给表添加一个唯一索引，这样数据库系统会自己主动检查是否存在重复记录

如果这个唯一索引加在唯一标识一条记录的列 (字段) 上，那么它有一个好听的名字，叫做 **主键**

当然了，**主键** 的功能远远不止这些，它还是表存储数据时的物理索引

## CREATE TABLE 时的 SQL PRIMARY KEY 约束

创建表时可以使用 PRIMARY KEY 关键字给表添加 PRIMARY KEY 约束

但要注意，添加的列必须设置为 NOT NULL;

**MySQL / SQL Server / Oracle / MS Access**

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

虽然一个表只能有一个 PRIMARY KEY，但一个 PRIMARY KEY 可以包含多个列

添加多个列可以使用 PRIMARY KEY，关键字，括号内添加多个列，多列之间用逗号分隔

```sql
CREATE TABLE lession (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    PRIMARY KEY (id,name)
);
```

如果需要给 PRIMARY KEY 约束命名，可以使用 CONSTRAINT 关键字

**MySQL / SQL Server / Oracle / MS Access**

```sql
CREATE TABLE lession (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    CONSTRAINT pk_lession_id PRIMARY KEY (id,name)
);
```

## ALTER TABLE 时的 SQL PRIMARY KEY 约束

如果一个表已经创建，而又想给表添加 PRIMARY KEY 约束，可以使用 ALTER TABLE 命令

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ADD PRIMARY KEY (id);
```

### 一个 PRIMARY KEY 包含多列

虽然一个表只能有一个 PRIMARY KEY，但一个 PRIMARY KEY 可以包含多个列

添加多个列的方式和添加一个列的方式一样，只要在括号内添加即可，多列之间用逗号分隔

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ADD CONSTRAINT pk_lession PRIMARY KEY (id,name);
```

> 注意： 使用 ALTER TABLE 语句给表添加主键时必须在创建表时将主键列声明为 NOT NULL 值

### 给 PRIMARY KEY 约束命名

如果想要给 PRIMARY KEY 约束命名，可以使用 ALTER TABLE CONSTRAINT 命令

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ADD CONSTRAINT pk_lession_id PRIMARY KEY (id);
```

> 注意： 使用 ALTER TABLE 语句给表添加主键时必须在创建表时将主键列声明为 NOT NULL 值

## 删除 PRIMARY KEY 约束

如果想要删除 PRIMARY KEY 约束，可以使用下面的 SQL 语句

**MySQL**

```sql
ALTER TABLE lesssion DROP PRIMARY KEY
```

**SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession DROP CONSTRAINT pk_lession_id
```
