# 43、SQL Date 日期时间函数
- 来源：https://ddkk.com/zhuanlan/db/sql/43.html
- 分类：缓存数据库
- 分组：教程目录
当我们处理日期时，最难的任务恐怕是确保所插入的日期的格式，与数据库中日期列的格式相匹配

只要您的数据包含的只是日期部分，运行查询就不会出问题。但是，如果涉及时间部分，情况就有点复杂了

在讨论日期查询的复杂性之前，我们先来看看最重要的内建日期处理函数

## MySQL Date 函数

下表列出了 MySQL 中最重要的日期函数

函数
描述

NOW()
返回当前的日期和时间

CURDATE()
返回当前的日期

CURTIME()
返回当前的时间

DATE()
提取日期或日期/时间表达式的日期部分

EXTRACT()
返回日期/时间的单独部分

DATE_ADD()
向日期添加指定的时间间隔

DATE_SUB()
从日期减去指定的时间间隔

DATEDIFF()
返回两个日期之间的天数

DATE_FORMAT()
用不同的格式显示日期/时间

## SQL Server Date 函数

下面的表格列出了 SQL Server 中最重要的内建日期函数：

函数
描述

GETDATE()
返回当前的日期和时间

DATEPART()
返回日期/时间的单独部分

DATEADD()
在日期中添加或减去指定的时间间隔

DATEDIFF()
返回两个日期之间的时间

CONVERT()
用不同的格式显示日期/时间

## SQL Date 数据类型

**MySQL** 使用下列数据类型在数据库中存储日期或日期/时间值：

类型
格式

DATE
格式：YYYY-MM-DD

DATETIME
格式：YYYY-MM-DD HH:MM:SS

TIMESTAMP
格式：YYYY-MM-DD HH:MM:SS

YEAR
格式：YYYY 或 YY

**SQL Server** 使用下列数据类型在数据库中存储日期或日期/时间值

类型
格式

DATE
格式：YYYY-MM-DD

DATETIME
格式：YYYY-MM-DD HH:MM:SS

SMALLDATETIME
格式：YYYY-MM-DD HH:MM:SS

TIMESTAMP
格式：唯一的数字

如果想要了解所有可用的数据类型，可以访问我们的 数据类型参考手册

## SQL 日期处理

SQL中的日期比较，采用的是类型格式的比较，什么意思呢？

假设我们有一张表 tokens

id
name
created_at

1
penglei
2017-04-28

2
ziyu
2017-05-01

3
hero
2017-05-15

4
feixian
2017-05-15

可以看到这张表中只有日期没有时间，那么

如果我们要选取 created_at 为 2017-05-15 的记录，可以使用下面的 SQL 语句

```sql
SELECT * FROM tokens WHERE created_at='2017-05-15';
```

运行结果会显示如下

id
name
created_at

3
hero
2017-05-15

4
feixian
2017-05-15

但如果我们的 tokens 中的数据是这样的

id
name
created_at

1
penglei
2017-04-28 10:20:56

2
ziyu
2017-05-01 13:33:12

3
hero
2017-05-15 08:20:14

4
feixian
2017-05-15 16:32:58

然后使用和上面一样的 SELECT 语句

```sql
SELECT * FROM tokens WHERE created_at='2017-05-15'
```

或

```sql
SELECT * FROM tokens WHERE created_at='2017-05-15 00：00：00'
```

那么将得不到结果

因为表中没有 2017-05-15 00:00:00 日期

如果没有时间部分，默认时间为 00:00:00

所以，如果你的表中使用了日期时间，那么，我们建议，除非必要不可，不要在日期中使用时间部分
