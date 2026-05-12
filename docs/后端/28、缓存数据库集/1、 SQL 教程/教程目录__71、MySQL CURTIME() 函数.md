# 71、MySQL CURTIME() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/71.html
- 分类：缓存数据库
- 分组：教程目录
MySQL CURTIME() 函数返回当前的时间，使用 24 小时格式

```sql
CURTIME()
```

## 范例

我们可以使用 CURTIME() 返回当前的时间

```sql
SELECT CURTIME();
```

输出结果如下

```sql
mysql> SELECT CURTIME();
+-----------+
| CURTIME() |
+-----------+
| 09:53:56  |
+-----------+
```
