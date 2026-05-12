# 37、SQL DEFAULT 约束
- 来源：https://ddkk.com/zhuanlan/db/sql/37.html
- 分类：缓存数据库
- 分组：教程目录
SQLDEFAULT 约束用于向列中插入默认值，如果插入数据的时候没有为它指定值的话

## 创建表时指定 DEFAULT 约束

DEFAULT 约束一般在创建表结构时指定，比如下面的创建表 lession 的 SQL 语句

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

我们为name 、 views 两个字段指定了默认值为 '' 和 '0'

## ALTER TABLE 时的 SQL DEFAULT 约束

如果表已经被创建，仍然可以给表添加 DEFAULT 约束

**MySQL**

```sql
ALTER TABLE lession ALTER views SET DEFAULT '1';
```

**SQL Server / MS Access**

```sql
ALTER TABLE lession ALTER COLUMN views SET DEFAULT '1';
```

**Oracle**

```sql
ALTER TABLE lession MODIFY views DEFAULT '1';
```

## 删除 DEFAULT 约束

如果想要删除 DEFAULT 约束，则可以使用下面的 SQL 语句

**MySQL**

```sql
ALTER TABLE lession ALTER views DROP DEFAULT;
```

**SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession ALTER COLUMN views DROP DEFAULT;
```
