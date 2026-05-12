# 32、SQL NOT NULL 约束
- 来源：https://ddkk.com/zhuanlan/db/sql/32.html
- 分类：缓存数据库
- 分组：教程目录
SQLNOT NULL 约束用于指定某一列不接受 NULL 值

默认的情况下，表的列接受 NULL 值

NOTNULL 约束强制字段始终包含值。这意味着，如果不向字段添加值，就无法插入新记录或者更新记录

## CREATE TABLE 时的 SQL NOT NULL 约束

在创建表结构时，可以给字段添加 NOT NULL 关键字来添加 NOT NULL 约束

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

## ALTER TABLE 时的 SQL UNIQUE 约束

如果表已经被创建，而又想添加 NOT NULL 约束，可以使用 ALTER TABLE 命令

**SQL Server / MS Access**

```sql
ALTER TABLE lession ALTER COLUMN views int(11) NOT NULL default '0';
```

**MySQL / Oracle**

```sql
ALTER TABLE lession MODIFY COLUMN views int(11) NOT NULL default '0'; 
```

**Oracle 10G 之后版本**

```sql
ALTER TABLE lession MODIFY views int(11) NOT NULL default '0'; 
```

## 删除 NOT NULL 约束

如果想要删除 NOT NULL 约束，可以使用 ALTER TABLE 命令，也就是不指定 NOT NULL 关键字即可

**SQL Server / MS Access**

```sql
ALTER TABLE lession ALTER COLUMN views int(11) default '0';
```

**MySQL / Oracle**

```sql
ALTER TABLE lession MODIFY COLUMN views int(11) default '0'; 
```

**Oracle 10G 之后版本**

```sql
ALTER TABLE lession MODIFY views int(11) default '0'; 
```
