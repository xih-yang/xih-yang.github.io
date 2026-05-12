# 36、SQL CHECK 约束
- 来源：https://ddkk.com/zhuanlan/db/sql/36.html
- 分类：缓存数据库
- 分组：教程目录
SQLCHECK 约束用于限制列中的值的范围

CHECK 约束既可以用于某一列也可以用于某张表：

**1、** 如果对单个列定义CHECK约束，那么该列只允许特定的值；

**2、** 如果对一个表定义CHECK约束，那么此约束会基于行中其他列的值在特定的列中对值进行限制；

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
```

## CREATE TABLE 添加 CHECK 约束

创建表结构时可以使用 CHECK 关键字给表或者字段添加 CHECK 约束

例如我们在创建 lession 表时可以给 id 字段加上一个大于 0 的 约束

**MySQL**

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    CHECK ( id>0 )
);
```

**SQL Server / Oracle / MS Access**

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT CHECK ( id>0 ),
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

## 多个字段添加约束

如果想给一个表中多个字段添加约束，直接在 CHECK 关键字后的括号内添加，每个约束使用 AND 连接

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    CHECK ( id>0 AND views >= 0 );
);
```

## 给 CHECK 约束命名

其实我们还可以给一个 CHECK 约束取一个名字

例如，我们给 lession 的 id 约束取一个名字 chk_lession_id 可以使用下面的 SQL 语句

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    CONSTRAINT chk_lession_id CHECK ( id>0 )
);
```

## ALTER TABLE 时的 SQL CHECK 约束

如果表已经被创建，我们可以使用 ALTER TABLE ADD CHECK 添加约束

例如，我们想给已经创建的表 lession 添加 id 大于 0 的约束，可以使用下面的 SQL 语句

```sql
ALTER TABLE lession ADD CHECK (id>0);
```

如果还想要命名 CHECK 约束，并定义多个列的 CHECK 约束，可以像下面这样定义 SQL 语句

```sql
ALTER TABLE lession ADD CONSTRAINT chk_lession CHECK (id>0 AND views >= 0);
```

## 删除 CHECK 约束

如果想要删除 CHECK 约束，可以使用 ALTER TABLE ... DROP 关键字

**SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession DROP CONSTRAINT chk_lession_id;
```

**MySQL**

```sql
ALTER TABLE lession DROP CHECK chk_lession_id
```

## 最佳实战

虽然各个数据库系统都可以添加 CHECK 约束，但我们不推荐你这么做，因为这会影响数据插入和更新的速度
