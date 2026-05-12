# 33、SQL UNIQUE 约束
- 来源：https://ddkk.com/zhuanlan/db/sql/33.html
- 分类：缓存数据库
- 分组：教程目录
SQLUNIQUE 约束用于防止一个表中出现重复记录

UNIQUE 和 PRIMARY KEY 约束均为列或列集合提供了唯一性的保证

PRIMARY KEY 约束会自动定义一个 UNIQUE 约束，或者说 PRIMARY KEY 是一种特殊的 UNIQUE 约束

但二者是有明显区别的：

**每个表可以有多个 UNIQUE 约束，但只能有一个 PRIMARY KEY 约束**

## CREATE TABLE 时的 SQL UNIQUE 约束

在创建表结构时，可以使用 UNIQUE 关键字给表添加 UNIQUE 约束

**MySQL / SQL Server / Oracle / MS Access**

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    UNIQUE(name)
);
```

如果想要多加多列，可以在括号内添加列，并使用逗号 (,) 分隔

**MySQL / SQL Server / Oracle / MS Access**

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    UNIQUE(name,id)
);
```

如果还想给 UNIQUE 约束命名，可以使用 CONSTRAINT 关键字

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME,
    CONSTRAINT uniq_lession_name UNIQUE(name,id)
);
```

## ALTER TABLE 时的 SQL UNIQUE 约束

如果表已经被创建，而又想添加 UNIQUE 约束，可以使用 ALTER TABLE ADD 命令

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ADD UNIQUE (name);
```

当然了，我们的 UNIQUE 可以包含多列，添加方法就和建表时添加多列是同样的

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ADD UNIQUE (id,name);
```

如果还想给 UNIQUE 约束命名，可以使用 CONSTRAINT 关键字

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ADD CONSTRAINT uniq_lession_name UNIQUE (id,name);
```

## 删除 UNIQUE 约束

如果想要删除 UNIQUE 约束，可以使用 ALTER TABLE DROP 命令

**MySQL**

```sql
ALTER TABLE lession DROP INDEX uniq_lession_name;
```

**SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession DROP CONSTRAINT uniq_lession_name;
```
