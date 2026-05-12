# 05、SQL CREATE DATABASE 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/5.html
- 分类：缓存数据库
- 分组：教程目录
SQLCREATE DATABASE 语句用于创建数据库

```sql
CREATE DATABASE dbname [IF NOT EXISTS] [default character set] [collate];
```

参数
说明

IF NOT EXISTS
如果数据库存在则不做任何改变，否则创建数据库

default character set
用户设置数据库存储数据时默认使用的字符编码方式

collate
用于设置排序规则或者比较时使用的字符编码格式

MySQL 中推荐使用以下语句创建数据库

```sql
CREATE DATABASE IF NOT EXISTS dbname default character set utf8mb4 collate utf8mb4_unicode_ci;
```

这样就可以存储 emjoi 表情符号了

## SQL CREATE DATABASE 范例

下面的SQL 语句创建一个名为 **ddkk** 的数据库

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
```

运行SQL 语句，输出结果如下

```sql
mysql> CREATE DATABASE ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
Query OK, 1 row affected (0.01 sec)
```

我们可以使用 SHOW DATABASES; SQL 语句来查看刚刚创建的数据库

```sql
mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| test               |
| ddkk               |
+--------------------+
```

数据库表可以通过 CREATE TABLE 语句来添加
