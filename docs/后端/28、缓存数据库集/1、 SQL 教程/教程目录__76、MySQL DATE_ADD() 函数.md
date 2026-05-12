# 76、MySQL DATE_ADD() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/76.html
- 分类：缓存数据库
- 分组：教程目录
MySQL DATE_ADD() 函数用于向日期添加指定的时间间隔

```sql
DATE_ADD(date,INTERVAL expr type)
```

参数
说明

date
合法的日期表达式

expr
希望添加的时间间隔

type
时间间隔的类型

### type 参数可选值如下

值
说明

MICROSECOND
毫秒数

SECOND
秒数

MINUTE
分钟数

HOUR
小时数

DAY
天数

WEEK
周数

MONTH
月数

QUARTER
季度数

YEAR
年数

SECOND_MICROSECOND
秒.豪秒

MINUTE_MICROSECOND
分.豪秒

MINUTE_SECOND
分.秒

HOUR_MICROSECOND
小时.豪秒

HOUR_SECOND
小时.秒

HOUR_MINUTE
小时.分

DAY_MICROSECOND
天.豪秒

DAY_SECOND
天.秒

DAY_MINUTE
天.分钟

DAY_HOUR
天.小时

YEAR_MONTH
年.月

## 范例

我们先使用 NOW() 函数获取当前的时间

```sql
SELECT NOW();
```

输出结果如下

```sql
mysql> SELECT NOW();
+---------------------+
| NOW()               |
+---------------------+
| 2017-05-18 09:01:25 |
+---------------------+
```

然后使用 DATE_ADD() 来获得 30 天后的时间

```sql
SELECT DATE_ADD(NOW(),INTERVAL 30 DAY );
```

输出结果如下

```sql
mysql> SELECT DATE_ADD(NOW(),INTERVAL 30 DAY );
+----------------------------------+
| DATE_ADD(NOW(),INTERVAL 30 DAY ) |
+----------------------------------+
| 2017-06-17 09:03:49              |
+----------------------------------+
```

如果我们想给当前时间加上 1天又1小时，那么可以使用下面的 SQL 语句

```sql
SELECT NOW(), DATE_ADD(NOW(),INTERVAL 1.1 DAY_HOUR );
```

输出结果如下

```sql
mysql> SELECT NOW(), DATE_ADD(NOW(),INTERVAL 1.1 DAY_HOUR );
+---------------------+----------------------------------------+
| NOW()               | DATE_ADD(NOW(),INTERVAL 1.1 DAY_HOUR ) |
+---------------------+----------------------------------------+
| 2017-05-18 09:08:47 | 2017-05-19 10:08:47                    |
+---------------------+----------------------------------------+
```
