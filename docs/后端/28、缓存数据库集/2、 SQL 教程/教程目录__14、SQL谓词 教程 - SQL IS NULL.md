# 14、SQL谓词 教程 - SQL IS NULL
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/14.html
- 分类：缓存数据库
- 分组：教程目录
确定一个数据值是否为`NULL`。

## 大纲

```java
scalar-expression IS [NOT] NULL
```

## 描述

`ISNULL`谓词检测未定义的值。

可以检测到所有空值，或所有非空值:

```java
SELECT Name, FavoriteColors FROM Sample.Person
WHERE FavoriteColors IS NULL 
```

```java
SELECT Name, FavoriteColors FROM Sample.Person
WHERE FavoriteColors IS NOT NULL
```

`ISNULL` / `IS NOT NULL`谓词是少数几个可以在`WHERE`子句中用于流字段的谓词之一。

如下面的例子所示:

```java
SELECT Title,%OBJECT(Picture) AS PhotoOref FROM Sample.Employee
WHERE Picture IS NOT NULL
```

不应将`IS NULL`谓词与`SQL ISNULL`函数混淆。
