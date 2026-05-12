# 73、MySQL CURDATE() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/73.html
- 分类：缓存数据库
- 分组：教程目录
MySQL CURDATE() 函数返回当前的日期

```sql
CURDATE()
```

## 范例

我们可以直观的比较下 NOW() 、 CURDATE() 和 CURTIME() 的区别

```sql
SELECT NOW(),CURDATE(),CURTIME();
```

运行结果如下

```sql
mysql> SELECT NOW(),CURDATE(),CURTIME();
+---------------------+------------+-----------+
| NOW()               | CURDATE()  | CURTIME() |
+---------------------+------------+-----------+
| 2017-05-18 09:43:13 | 2017-05-18 | 09:43:13  |
+---------------------+------------+-----------+
```
