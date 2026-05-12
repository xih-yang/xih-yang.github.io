# 21、SQLite Truncate Table
- 来源：https://ddkk.com/zhuanlan/db/sqlite/21.html
- 分类：缓存数据库
- 分组：教程目录
## SQLite Truncate Table

在SQLite 中，并没有 TRUNCATE TABLE 命令，但可以使用 SQLite 的 **DELETE** 命令从已有的表中删除全部的数据，但建议使用 DROP TABLE 命令删除整个表，然后再重新创建一遍。

## 语法

DELETE 命令的基本语法如下：

```java
sqlite> DELETE FROM table_name;
```

DROP TABLE 的基本语法如下：

```java
sqlite> DROP TABLE table_name;
```

如果您使用 DELETE TABLE 命令删除所有记录，建议使用 **VACUUM** 命令清除未使用的空间。

## 实例

假设COMPANY 表有如下记录：

```java
ID          NAME        AGE         ADDRESS     SALARY
----------  ----------  ----------  ----------  ----------
1           Paul        32          California  20000.0
2           Allen       25          Texas       15000.0
3           Teddy       23          Norway      20000.0
4           Mark        25          Rich-Mond   65000.0
5           David       27          Texas       85000.0
6           Kim         22          South-Hall  45000.0
7           James       24          Houston     10000.0
```

下面为删除上表记录的实例：

```java
SQLite> DELETE FROM COMPANY;
SQLite> VACUUM;
```

现在，COMPANY 表中的记录完全被删除，使用 SELECT 语句将没有任何输出。
