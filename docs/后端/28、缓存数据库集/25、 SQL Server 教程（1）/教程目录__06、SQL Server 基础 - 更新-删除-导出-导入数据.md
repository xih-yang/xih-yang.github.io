# 06、SQL Server 基础 - 更新/删除/导出/导入数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/6.html
- 分类：缓存数据库
- 分组：教程目录
## UPDATE语句更新数据行

```java
UPDATE 表名 SET 列名=更新值,列名=更新值,...... [WHERE 更新条件]
```

当不加WHERE条件时表示操作所有列：

```java
update newTab set SEmail='sb@sb.com'
```

加入WHERE条件时：

```java
update newTab set SEmail='666@666.com' where SName='刘知'
```

不加WHERE条件的UPDATE语句修改所有行，很危险，有些环境下会对此做检查，禁止不加WHERE的UPDATE语句被使用。

## DELETE语句删除数据行

```java
DELETE [FROM] 表名 [WHERE 删除条件]
```

例如：

```java
delete from newTab where SName='刘知'
```

如果不加WHERE条件，表示将表中的数据无条件删除，这也是非常危险的。

另外注意使用了外键约束时，若要删除主键表中某一行，应先删除引用了它的外键表中的对应行。

## TRUNCATE语句删除所有数据行

```java
TRUNCATE TABLE 表名
```

如执行：

```java
truncate table newTab
```

实际上它就相当于不加WHERE语句的DELETE语句。所不同的是，DELETE语句属于DML，可以回退；TRUNCATE语句属于DDL，无法回退，但效率更高。

## 导出数据

导出数据可以将数据库中的表导出并转换成某些可用的格式，如txt、Excel格式等。

这里选择为文本文件，并指定路径在桌面上。

选择要导出的那张表，并指定行分割和列分割符。

最后看一下桌面上导出来的文件：

## 导入数据
