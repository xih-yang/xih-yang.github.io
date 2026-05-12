# 75、MySQL DATEDIFF() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/75.html
- 分类：缓存数据库
- 分组：教程目录
MySQL DATEDIFF() 函数返回两个日期之间的天数，准确的说，是返回两个日期时间午夜 ( 00:00:00 ) 的数目

```sql
DATEDIFF(enddate,startdate)
```

如果enddate 大于 startdate ，那么返回的是正数，反之，返回的是负数

### 参数说明

参数
说明

enddate
开始时间，必须是合法的日期或日期/时间表达式

startdate
结束时间，必须是合法的日期或日期/时间表达式

### 范例

假设我们要返回日期 2017-06-19 到 2017-05-18 之间的天数，可以使用下面的 SQL 语句

```sql
SELECT DATEDIFF('2017-06-19','2017-05-18') AS days;
```

运行结果如下

```sql
mysql> SELECT DATEDIFF('2017-06-19','2017-05-18') AS days;
+------+
| days |
+------+
|  32 |
+------+
```

如果我们把两个时间对调一下，那么返回的结果就是负数

```sql
mysql> SELECT DATEDIFF('2017-05-18','2017-06-19') AS days;
+------+
| days |
+------+
|  -32 |
+------+
```
