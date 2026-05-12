# 79、SQL Server DATEADD() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/79.html
- 分类：缓存数据库
- 分组：教程目录
SQLServer DATEADD() 函数用于在日期中添加或减去指定的时间间隔

```sql
DATEADD(datepart,number,date)
```

参数
说明

datepart
用于指定 number 参数的类型

number
时间间隔，对于未来的时间，此数是正数，对于过去的时间，此数是负数

date
必须是合法的日期表达式

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

假设我们有一张这样的 token 表

id
name
created_at

1
penglei
2018-02-02 02:02:02.02

现在我们要查看所有 token 的过期时间，假设，假设过期时间是 30 天

那么可以使用下面的 SQL 语句

```sql
SELECT id,name,DATEADD(day,35,created_at) AS expires_at FROM token
```

那么，显示结果就会是下面这样

id
name
expires_at

1
penglei
2018-03-04 02:02:02.020000
