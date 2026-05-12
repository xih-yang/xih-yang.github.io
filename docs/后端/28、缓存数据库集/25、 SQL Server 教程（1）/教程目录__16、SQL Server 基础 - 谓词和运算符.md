# 16、SQL Server 基础 - 谓词和运算符
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/16.html
- 分类：缓存数据库
- 分组：教程目录
## 谓词

在前面学的**查询过滤器**(WHERE和HAVING)以及**CHECK约束**中都可以指定逻辑表达式，谓词是取值为TRUE或FALSE或UNKNOWN的表达式，它和运算符一起构成了逻辑表达式。

### IN

用于检查一个值是否存在一个集合中：

```java
USE MyDB;
SELECT myid,Pid,salary
FROM dbo.ok
WHERE myid IN(1011,1022,1033); --使用查询过滤器WHERE中的谓词IN
```

### BETWEEN

检查一个值是否在给定的**闭区间**内：

```java
USE MyDB;
SELECT myid,Pid,salary
FROM dbo.ok
WHERE myid BETWEEN 1011 AND 1033;
```

### LIKE

检查一个字符串值是够与指定的模式匹配：

```java
USE MyDB;
SELECT myid,Pid,salary
FROM dbo.ok
WHERE myid LIKE N'11%'; --匹配以11开头的字符串
```

## 比较运算符

标准的比较运算符只有=、>、=、，其它的如!=都不是标准的。

```java
USE MyDB;
SELECT myid,Pid,salary
FROM dbo.ok
WHERE myid<1033;
```

## 逻辑运算符

可以使用OR、AND、NOT做连接和取反。

```java
USE MyDB;
SELECT myid,Pid,salary,mydate
FROM dbo.ok
WHERE myid<1100
    AND mydate>'2010-01-01';
```

## 算数运算符

+、-、*、/、%，可以配合创建临时列：

```java
USE MyDB;
SELECT myid,Pid,salary,mydate,
    myid+Pid AS sume --加和作为一个临时列sume
FROM dbo.ok;
```

利用CAST可以将一种数据类型的表达式转换为另一种数据类型的表达式，格式是：

```java
CAST(表达式 AS 数据类型)
```

例如将两列转换成12精度2位小数的实数(NUMERIC)然后再相加：

```java
USE MyDB;
SELECT myid,Pid,salary,mydate,
    CAST(myid AS NUMERIC(12,2))+CAST(Pid AS NUMERIC(12,2)) AS sume
FROM dbo.ok;
```

此外，圆括号是优先级最高的，可以强制改变运算的顺序，尽可能使用圆括号和代码缩进，养成好的编写习惯。
