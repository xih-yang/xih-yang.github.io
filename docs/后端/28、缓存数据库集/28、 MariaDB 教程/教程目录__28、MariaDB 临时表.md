# 28、MariaDB 临时表
- 来源：https://ddkk.com/zhuanlan/db/mariadb/28.html
- 分类：缓存数据库
- 分组：教程目录
由于速度或一次性数据，一些操作可能受益于临时表。 临时表的生命期在会话终止时结束，无论是从命令提示符，PHP脚本还是通过客户端程序使用它们。 它也不以典型的方式出现在系统中。 SHOW TABLES命令不会显示包含临时表的列表。

## 创建临时表

CREATE TABLE语句中的TEMPORARY关键字生成临时表。 查看下面给出的示例 –

```sql
mysql>CREATE TEMPORARY TABLE order (
   item_name VARCHAR(50) NOT NULL
      , price DECIMAL(7,2) NOT NULL DEFAULT 0.00
      , quantity INT UNSIGNED NOT NULL DEFAULT 0
);
```

在创建临时表时，可以使用LIKE子句克隆现有表，这意味着其所有常规特征。 用于生成临时表的CREATE TABLE语句不会作为TEMPORARY关键字的结果提交事务。

虽然临时表在会话结束时与非临时表脱离，但它们可能有一定的冲突 –

- 他们有时会与过期会话中的ghost临时表冲突。
- 它们有时与非临时表的影子名称冲突。

注意– 临时表允许与现有非临时表具有相同的名称，因为MariaDB将其视为差异引用。

## 行政

MariaDB需要向用户授予创建临时表的权限。 使用GRANT语句将此权限授予非管理员用户。

```sql
GRANT CREATE TEMPORARY TABLES ON orders TO 'machine122'@'localhost';
```

## 删除临时表

虽然临时表基本上在会话结束时删除，您可以选择删除它们。 删除临时表需要使用TEMPORARY关键字，最佳实践建议在临时表之前删除临时表。

```sql
mysql> DROP TABLE order;
```
