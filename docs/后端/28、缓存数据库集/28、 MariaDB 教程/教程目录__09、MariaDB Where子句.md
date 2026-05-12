# 09、MariaDB Where子句
- 来源：https://ddkk.com/zhuanlan/db/mariadb/9.html
- 分类：缓存数据库
- 分组：教程目录
**WHERE**子句过滤各种语句，如SELECT，UPDATE，DELETE和INSERT。 他们提出了用于指定行动的标准。 它们通常出现在语句中的表名后面，其条件如下。 WHERE子句本质上像一个if语句。

查看下面给出的WHERE子句的一般语法 –

```sql
[COMMAND] field,field2,... FROM table_name,table_name2,... WHERE [CONDITION]
```

请注意WHERE子句的以下特性：

- 它是可选的。
- 它允许指定任何条件。
- 它允许通过使用AND或OR运算符来指定多个条件。
- 区分大小写仅适用于使用LIKE比较的语句。

WHERE子句允许使用以下运算符 –

操作者

= !=

> =
