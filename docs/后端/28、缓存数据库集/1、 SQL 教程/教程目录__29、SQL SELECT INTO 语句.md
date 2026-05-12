# 29、SQL SELECT INTO 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/29.html
- 分类：缓存数据库
- 分组：教程目录
SQLSELECT INTO 语句可以从一个表复制信息到一个新的表中，而不是事先创建这个新表

> 注意：MySQL 数据库不支持 SELECT ... INTO 语句，但支持 INSERT INTO ... SELECT

## SQL SELECT INTO 语句

SELECT INTO 语句从一个表复制数据，然后把数据插入到另一个新表中

**1、** 复制表结构和全部数据；

```sql
SELECT * INTO new_table [IN externaldb ] FROM old_table;
```

**2、** 如果只希望复制部分列到新的表中，则；

```sql
SELECT column_name(s) INTO new_table [IN externaldb ] FROM old_table;
```

**3、** 重命名列(字段)；

新表将会使用 SELECT 语句中定义的列名称和类型进行创建

当然了，我们可以使用 AS 子句来重命名字段

```sql
SELECT field AS new_field_name, other_column(s) INTO new_table [IN externaldb ] FROM old_table;
```

当然了，有一个更简单快捷的拷贝表结构及数据的方法

```sql
CREATE TABLE new_table SELECT * FROM old_table;
```

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
INSERT INTO lession(id,name,views,created_at) VALUES
(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
(2, 'Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32'),
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14');
```

使用SELECT * FROM lession; 运行结果如下

```sql
+----+---------------------+-------+--------------------+
| id | name               | views | created_at          |
+----+---------------------+-------+--------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+--------------------+
```

总共有**3** 条记录

## SQL SELECT INTO 范例

**1、** 完全备份lession表到lession2中；

```sql
SELECT * INTO lession2 FROM lession;
```

**2、** 只复制一些列到lession3中；

```sql
SELECT id,name INTO lession3 FROM lession;
```

**3、** 只复制views>`100的数据到lession4中；

```sql
SELECT * INTO lession4 FROM lession WHERE views > 100;
```

**4、** 只创建表结构不复制数据；

```sql
SELECT * INTO lession5 FROM lession WHERE 1=0;
```

### 删除表 lession2 、lession3 、lession4 、lession5

我有强迫症啊，用完即删，可以使用下面的语句删除这些表

```sql
DROP TABLE IF EXISTS lession2;
DROP TABLE IF EXISTS lession3;
DROP TABLE IF EXISTS lession4;
DROP TABLE IF EXISTS lession5;
```
