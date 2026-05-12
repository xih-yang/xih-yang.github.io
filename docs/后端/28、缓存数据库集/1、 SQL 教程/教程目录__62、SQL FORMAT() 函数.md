# 62、SQL FORMAT() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/62.html
- 分类：缓存数据库
- 分组：教程目录
SQLFORMAT() 函数用于对字段进行格式化显示

```sql
SELECT FORMAT(column_name,format) FROM table_name;
```

参数
描述

column_name
必需。要格式化的字段或数值

format
必需。格式

FORMAT() 函数在不同的数据库系统中有不同的实现，在 MySQL 中就只有 DATE_FORMAT() 函数了
