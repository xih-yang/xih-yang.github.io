# 35、SQL FOREIGN KEY 约束
- 来源：https://ddkk.com/zhuanlan/db/sql/35.html
- 分类：缓存数据库
- 分组：教程目录
什么是FOREIGN KEY ? 就是在一个表中存储另一个表的主键 ( PRIMARY KEY )

就比如之前我们创建的两个表

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) default '',
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0'
);
```

lession_views 中的 lession_id 就是 lession 表中的主键 id

很多人都会有疑问，那我们一般不都是这么建表的？ 难道添加的就是 lession_id 就是 FOREIGN KEY

不是的。我们这么添加，是因为我们开发团队有共识，但是，这种共识数据库系统不认识啊

如果不给 lession_id 添加 FOREIGN KEY 约束，数据库系统会以为 lession_id 只不过是一个普通的 int(11) 字段

## FOREIGN KEY 有什么作用？

**1、** FOREIGNKEY约束用于预防破坏表之间连接的行为；

**2、** FOREIGNKEY约束也能防止非法数据插入外键列，因为它必须是它指向的那个表中的值之一；

两个作用简单明了

**1、** 当删除一个FOREIGNKEY指向的主表(lession)记录时，如果FOREIGNKEY所在的表(lession_views)存在记录，那么会删除失败；

**2、** 当在FOREIGNKEY表(lession_views)插入或更新一条记录，如果FOREIGNKEY指向的主表(lession)不存在该记录，那么插入或者更新失败；

## CREATE TABLE 时的 SQL FOREIGN KEY 约束

给一个表添加 FOREIGN KEY 约束可以使用 FOREIGN KEY 关键字

例如我们给 lession_views 的 lession_id 添加外键约束，可以使用下面的 SQL 语句

**MySQL**

```sql
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) default '',
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0',
    FOREIGN KEY (lession_id) REFERENCES lession(id)
);
```

**SQL Server / Oracle / MS Access**

```sql
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) default '',
    lession_id int(11) FOREIGN KEY REFERENCES lession(id),
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0'
);
```

## 给 FOREIGN KEY 命名

如果想要给 FOREIGN KEY 约束命名，可以使用 CONSTRAINT 关键字，就像下面的 SQL 语句

```sql
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) default '',
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0',
    CONSTRAINT fk_lession_id FOREIGN KEY (lession_id) REFERENCES lession(id)
);
```

## ALTER TABLE 时的 SQL FOREIGN KEY 约束

如果一个表已经被创建，我们仍然可以使用 ALTER TABLE FOREIGN KEY 来添加外键约束

例如下面的 SQL 语句，给 lession_views 表的 lession_id 字段添加外键约束

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession_views ADD FOREIGN KEY (lession_id) REFERENCES lession(id);
```

如果还想给 FOREIGN KEY 约束命名，则可以像下面这样使用

**MySQL / SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession_views ADD CONSTRAINT fk_lession_id FOREIGN KEY (lession_id) REFERENCES lession(id);
```

## 删除 FOREIGN KEY 约束

如果想要删除一个已经命名的 FOREIGN KEY 约束，可以使用 DROP 关键字

**MySQL**

```sql
ALTER TABLE lession_views DROP FOREIGN KEY fk_lession_id;
```

**SQL Server / Oracle / MS Access**

```sql
ALTER TABLE lession_views DROP CONSTRAINT fk_lession_id;
```
