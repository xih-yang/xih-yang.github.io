# 17、SQL Server 基础 - CASE表达式和T-SQL的NULL
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/17.html
- 分类：缓存数据库
- 分组：教程目录
## CASE表达式

CASE是一个标量表达式(注意不是语句，语句可以做某些处理，表达式只返回值)，基于条件逻辑来返回一个值。因为是标量表达式所以可以支持任何标量表达式，如SELECT、WHERE、HAVING、ORDER BY、CHECK约束。

### 简单表达式

将一个值与一组可能的值进行比较：

```java
USE MyDB;
SELECT myid,firstname,lastname,Pid,
    CASE Pid
        WHEN 1012 THEN '上海大学'
        WHEN 1000 THEN '宝山'
        WHEN 1033 THEN '益新'
        WHEN 1027 THEN '教育超市'
    END AS newcase --新的列名
FROM dbo.ok;
```

### 搜索表达式

在WHEN子句中指定谓词或逻辑表达式，而不限于只进行相等性比较：

```java
USE MyDB;
SELECT myid,firstname,lastname,Pid,
    CASE
        WHEN Pid=1012 THEN '上海大学'
        WHEN Pid=1000 THEN '宝山'
        WHEN Pid=1033 THEN '益新'
        WHEN Pid=1027 THEN '教育超市'
    END AS newcase --新的列名
FROM dbo.ok;
```

可以看到每个CASE简单表达式都可以转换成CASE搜索表达式。

## T-SQL对NULL值的处理

前面学了SQL支持的三值谓词有TRUE、FALSE和UNKNOWN。前两者很好理解，在不同的语境下，SQL对UNKNOWN的处理不同。SQL对查询过滤器的条件的处理是”接受TRUE”(也就是拒绝FALSE和UNKNOWN)，对CHECK约束的条件的处理是”拒绝FALSE”(也就是接受TRUE和UNKNOWN)。

对UNKNOWN取反的结果仍然是UNKNOWN。对NULL值进行比较的表达式结果是UNKNOWN，这是最普遍的，此外NULL和NULL进行比较结果也是UNKNOWN，为此SQL用IS NULL和IS NOT NULL来取代=NULL和<>NULL以作正确的NULL判断。

先修改表的内容，让它有几个NULL值用来实验：

用查询过滤器做过滤：

```java
USE MyDB;
SELECT myid,firstname,lastname,Pid
FROM dbo.ok
WHERE Pid=1012;
```

```java
USE MyDB;
SELECT myid,firstname,lastname,Pid
FROM dbo.ok
WHERE Pid<>1012;
```

可以看到无论是=还是<>都过滤掉了NULL，因为和NULL做比较时返回的是UNKNOWN，而查询过滤器的条件是”接受TRUE”。

同样地，下面这种方式得到的永远是UNKNWON，所以返回了一个空表。

```java
USE MyDB;
SELECT myid,firstname,lastname,Pid
FROM dbo.ok
WHERE Pid=NULL;
```

想要匹配NULL需要用IS NULL的方式：

```java
USE MyDB;
SELECT myid,firstname,lastname,Pid
FROM dbo.ok
WHERE Pid IS NULL;
```

此外应注意，SQL Server在处理唯一约束、分组、排序时将多个NULL值视为相等的。其它SQL可能不这样做。
