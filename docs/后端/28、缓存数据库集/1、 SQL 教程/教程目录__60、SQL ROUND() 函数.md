# 60、SQL ROUND() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/60.html
- 分类：缓存数据库
- 分组：教程目录
SQLROUND() 函数用于把数值四舍五入为指定的小数位数

```sql
SELECT ROUND( column_name ,decimals) FROM table_name;
```

参数
描述

column_name
必需。要舍入的数值或字段

decimals
可选。设置要返回的小数位数。默认为 0

> 注意：ROUND() 返回值会被转换为 BIGINT 类型

## SQL ROUND() 示例

**1、****ROUND(X)**；

ROUND(X) 返回参数X的四舍五入的一个整数

```sql
mysql> SELECT ROUND(-1.23);
+--------------+
| ROUND(-1.23) |
+--------------+
|           -1 |
+--------------+
1 row in set (0.00 sec)
mysql> SELECT ROUND(-1.58);
+--------------+
| ROUND(-1.58) |
+--------------+
|           -2 |
+--------------+
1 row in set (0.00 sec)
mysql> SELECT ROUND(1.58);
+-------------+
| ROUND(1.58) |
+-------------+
|           2 |
+-------------+
1 row in set (0.00 sec)
```

**2、****ROUND(X,D)**；

ROUND(X,D) 返回参数 X的四舍五入为 D 位小数的一个数字

如果 D 为0，结果将没有小数点或小数部分

```sql
mysql> SELECT ROUND(1.298, 1);
+-----------------+
| ROUND(1.298, 1) |
+-----------------+
|             1.3 |
+-----------------+
1 row in set (0.00 sec)
```

mysql> SELECT ROUND(1.298, 0);
+-----------------+
|ROUND(1.298, 0) |
+-----------------+
| 1 |
+-----------------+
1row in set (0.00 sec)

> 注意：ROUND() 返回值会被转换为 BIGINT 类型
