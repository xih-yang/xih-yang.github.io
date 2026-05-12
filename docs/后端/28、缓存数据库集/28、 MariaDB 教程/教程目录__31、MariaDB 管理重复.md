# 31、MariaDB 管理重复
- 来源：https://ddkk.com/zhuanlan/db/mariadb/31.html
- 分类：缓存数据库
- 分组：教程目录
如前面的课程所讨论的，MariaDB在某些情况下允许重复记录和表。 由于不同的数据或对象类型，或作为操作对象的唯一寿命或存储的结果，这些重复中的一些事实上不是重复的。 这些副本通常也没有问题。

在某些情况下，重复确实会导致问题，并且它们常常由于隐式动作或MariaDB命令的宽松策略而出现。 有多种方法可以控制此问题，查找重复项，删除重复项，并防止重复创建。

## 策略和工具

有四个关键方法来管理重复 –

- 使用JOIN关联，并用临时表删除他们。
- 使用INSERT … ON DUPLICATE KEY UPDATE在发现重复时更新。
- 使用DISTINCT修剪SELECT语句的结果并删除重复的。
- 使用INSERT IGNORE停止插入重复项。

### 使用连接临时表

只需像内部联接那样执行半连接，然后删除使用临时表找到的重复。

## 使用INSERT

当INSERT … ON DUPLICATE KEY UPDATE发现重复的唯一或主键时，它执行更新。 发现多个唯一键时，它只更新第一个。 因此，不要在具有多个唯一索引的表上使用它。

查看以下示例，该示例显示在插入到填充字段时在包含索引值的表中发生的情况 –

```sql
INSERT INTO add_dupl VALUES (1,'Apple');
ERROR 1062 (23000): Duplicate entry '1' for key 'PRIMARY'
```

**注意** - 如果没有找到任何键，INSERT … ON DUPLICATE KEY UPDATE语句的执行方式与正常的insert语句相似。

## 使用DISTINCT

DISTINCT子句从结果中删除重复项。 DISTINCT子句的一般语法如下 –

```sql
SELECT DISTINCT fields
FROM table
[WHERE conditions];
```

注–带有DISTINCT子句的语句的结果 –

- 当使用一个表达式时，它为它返回唯一的值。
- 当使用多个表达式时，它返回唯一的组合。
- 它不会忽略NULL值; 因此，结果还包含NULL作为唯一值。

使用单个表达式的DISTINCT子句查看以下语句 –

```sql
SELECT DISTINCT product_id
FROM products
WHERE product_name = 'DustBlaster 5000';
```

使用多个表达式查看以下示例 –

```sql
SELECT DISTINCT product_name, product_id
FROM products
WHERE product_id < 30
```

## 使用INSERT IGNORE

INSERT IGNORE语句指示MariaDB在发现重复记录时取消插入。 查看下面给出的使用示例 –

```sql
mysql> INSERT IGNORE INTO customer_tbl (LN, FN)
   VALUES( 'Lex', 'Luther');
```

另外，注意重复的逻辑。 某些表基于表数据的性质需要重复。 满足您在管理重复记录的策略中的需要。
