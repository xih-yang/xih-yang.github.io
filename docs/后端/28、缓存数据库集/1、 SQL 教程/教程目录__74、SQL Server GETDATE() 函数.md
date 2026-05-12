# 74、SQL Server GETDATE() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/74.html
- 分类：缓存数据库
- 分组：教程目录
SQLServer GETDATE() 函数返回当前的日期时间，精确到毫秒

```sql
GETDATE()
```

## 范例

如果要返回当前的时间，可以使用 GETDATE() 函数

```sql
SELECT GETDATE() as now;
```

输出结果如下

now

2017-05-18 09:35:28.231

我们可以在创建表结构时，指定某个列的默认值为 GETDATE()

例如下面的表结构，我们指定 created_at 列的默认值为 GETDATE()

```sql
CREATE TABLE tokens(id int NOT NULL PRIMARY KEY,name varchar(50) NOT NULL,created_at datetime NOT NULL DEFAULT GETDATE())
```

这时候，如果我们向 tokens 表中插入数据，当不传递 created_at 参数时，默认会自动插入当前时间

```sql
INSERT INTO tokens (name) VALUES ('penglei')
```

结果显示如下

id
name
created_at

1
penglei
2017-05-18 09:40:37.183
