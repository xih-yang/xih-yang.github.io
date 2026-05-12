# 20、MariaDB 空值
- 来源：https://ddkk.com/zhuanlan/db/mariadb/20.html
- 分类：缓存数据库
- 分组：教程目录
使用NULL值时，请记住它们是未知值。 它们不是空字符串或零，它们是有效值。 在表创建中，列规范允许将它们设置为接受空值，或拒绝它们。 只需使用NULL或NOT NULL子句。 这在缺少记录信息（如ID号）的情况下具有应用。

用户定义的变量的值为NULL，直到显式赋值。 存储的例程参数和局部变量允许将值设置为NULL。 当局部变量没有默认值时，它的值为NULL。

NULL不区分大小写，并具有以下别名 –

- UNKNOWN（布尔值）
- \ N

## NULL运算符

标准比较运算符不能与NULL（例如，=，>`，>` =，``”（NULL-SAFE）运算符。

其他可用的运营商有 –

- IS NULL – 它测试NULL值。
- IS NOT NULL – 它确认不存在NULL值。
- ISNULL – 在发现NULL值时返回值1，在不存在时返回0。
- COALESCE – 返回列表的第一个非NULL值，或者在没有一个值的情况下返回NULL值。

## 对NULL值排序

在排序操作中，NULL值具有最低值，因此DESC次序在底部产生NULL值。 MariaDB允许为NULL值设置更高的值。

有两种方法可以做到这一点，如下所示 –

```sql
SELECT column1 FROM product_tbl ORDER BY ISNULL(column1), column1;
```

另一种方式 –

```sql
SELECT column1 FROM product_tbl ORDER BY IF(column1 IS NULL, 0, 1), column1 DESC;
```

## NULL函数

当任何参数为NULL时，函数通常输出NULL。 但是，还有专门用于管理NULL值的函数。 他们是 –

- **IFNULL()** - 如果第一个表达式不为NULL，它返回它。 当它求值为NULL时，它返回第二个表达式。
- **NULLIF()** - 当比较的表达式相等时，它返回NULL，否则返回第一个表达式。

像SUM和AVG的函数忽略NULL值。

## 插入NULL值

在声明为NOT NULL的列中插入NULL值时，会发生错误。 在默认SQL模式下，NOT NULL列将根据数据类型插入一个默认值。

当字段是TIMESTAMP，AUTO_INCREMENT或虚拟列时，MariaDB会以不同方式管理NULL值。 插入在AUTO_INCREMENT列中会导致序列中的下一个数字插入到其位置。 在TIMESTAMP字段中，MariaDB分配当前时间戳。 在虚拟列中，本教程后面讨论的主题将分配默认值。

UNIQUE索引可以包含许多NULL值，但是，主键不能为NULL。

### NULL值和Alter命令

当您使用ALTER命令修改列时，如果没有NULL规范，MariaDB会自动分配值。
