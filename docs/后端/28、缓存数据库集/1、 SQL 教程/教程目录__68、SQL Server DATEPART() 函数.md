# 68、SQL Server DATEPART() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/68.html
- 分类：缓存数据库
- 分组：教程目录
SQLServer DATEPART() 函数返回日期/时间的单独部分，比如年、月、日、小时、分钟等等

```sql
DATEPART(datepart,date)
```

参数
说明

date
一个合法的日期表达式

datepart
返回的成分

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

## 范例

我们可以使用下面的 SQL 语句返回当前时间和当前时间中的日期部分

```sql
SELECT GETDATE(), DATEPART(dd,GETDATE());
```

运行结果如下

GETDATE()
DATEPART(dd,GETDATE())

2017-05-18 10:12:14
18
