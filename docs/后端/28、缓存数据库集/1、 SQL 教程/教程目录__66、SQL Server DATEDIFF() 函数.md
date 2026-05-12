# 66、SQL Server DATEDIFF() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/66.html
- 分类：缓存数据库
- 分组：教程目录
SQLServer DATEDIFF() 函数返回两个日期之间的天数

```sql
DATEDIFF(datepart,startdate,enddate)
```

如果endate 小于 startdate 那么返回一个负数，否则返回正数或者 0

需要注意的是，返回的天数不包含 **startdate** 但包含 **enddate**

### 参数说明

参数
说明

datepart
返回结果中指定格式出现的次数

startdate
要比较的开始时间，必须是合法的日期表达式

enddate
要比较的结束时间，必须是合法的日期表达式

### datepart 参数可以是下列的值

值
说明

yy, yyyy
年

qq, q
季度

mm, m
月

dy, y
年中的日

dd, d
日

wk, ww
周

dw, w
星期

hh
小时

mi, n
分钟

ss, s
秒

ms
毫秒

mcs
微妙

ns
纳秒

### datepart 要怎么理解？

**1、** 当datepart=day时，DATEDIFF返回两个指定的时间之间（包括第二个日期但不包括第一个日期）的午夜数；

**2、** 当datepart=month时，DATEDIFF返回两个日期之间（包括第二个日期但不包括第一个日期）出现的月的第一天的数目；

**3、** 当datepart=week时，DATEDIFF返回两个日期（包括第二个日期但不包括第一个日期）之间星期日的数目；

## 范例

假设我们要返回 2017-06-05 到 2017-08-05 之间的天数，可以使用下面的 SQL 语句

```sql
SELECT DATEDIFF(day, '2007-06-05','2007-08-05') AS days;
```

运行结果如下

days

61

如果我们把开始时间和结束时间交换一下，那么返回的将会是负值

```sql
SELECT DATEDIFF(day, '2007-08-05','2007-06-05') AS days;
```

运行结果如下

days

-61
