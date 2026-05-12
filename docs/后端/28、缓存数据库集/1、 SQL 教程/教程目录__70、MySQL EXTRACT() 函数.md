# 70、MySQL EXTRACT() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/70.html
- 分类：缓存数据库
- 分组：教程目录
MySQL EXTRACT() 函数返回日期/时间的单独部分，比如年、月、日、小时、分钟

```sql
EXTRACT(unit FROM date)
```

参数
说明

date
一个合法的日期表达式

unit
返回值的类型

### unit 参数可以是以下值

值
说明

MICROSECOND
毫秒

SECOND
秒

MINUTE
分

HOUR
时

DAY
天

WEEK
周

MONTH
月

QUARTER
季度

YEAR
年

SECOND_MICROSECOND
秒.毫秒

MINUTE_MICROSECOND
分.秒.毫秒

MINUTE_SECOND
分.秒

HOUR_MICROSECOND
小时.分.秒.毫秒

HOUR_SECOND
小时.分.秒

HOUR_MINUTE
小时.分

DAY_MICROSECOND
小时.分.秒.毫秒

DAY_SECOND
小时.分.秒

DAY_MINUTE
小时.分钟

DAY_HOUR
小时

YEAR_MONTH
年.月

> 忽略说明中的点号 (.)

当unit 为复合类型时，它就是把这些元数据简单的拼接在一起

## 范例

我们可以使用下面的语句返回当前的日期时间，当前日期，当前的日期.秒

```sql
SELECT NOW(), EXTRACT(DAY FROM NOW()) as day, EXTRACT(DAY_MICROSECOND FROM NOW()) as day_sec;
```

运行结果如下

```sql
mysql> SELECT NOW(), EXTRACT(DAY FROM NOW()) as day, EXTRACT(DAY_MICROSECOND FROM NOW()) as day_sec;
+---------------------+------+--------------+
| NOW()               | day  | day_sec      |
+---------------------+------+--------------+
| 2017-05-18 10:01:15 |   18 | 100115000000 |
+---------------------+------+--------------+
```
