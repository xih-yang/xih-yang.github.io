# 07、SQL Server 基础 - SELECT数据查询功能的常见扩展
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/7.html
- 分类：缓存数据库
- 分组：教程目录
## SELECT语句

SELECT语句属于SQL中的DQL，用于从表中选取数据，并生成结果集。

```java
SELECT 列名表 FROM 源表名称
```

①如选取students表中的地址和姓名：

```java
select SAddress,SName from students
```

②又如选取整个students表：

```java
select * from students
```

## 使用DISTINCT关键字返回不同的值

该关键字紧跟SELECT后即可，如：

```java
select distinct SName from students
```

如果查询了表中的多个列，则只要有一个域不同，就被认为值并不相同。

## 使用ORDER BY子句对结果集排序

为了演示这个子句，先修改一下students表：

这个子句后紧跟的列表，使得结果将有主次地根据这个列表中的列之中值的大小对结果行进行排序，默认为按值升序，如果要按值降序，需将那个列后跟上DESC关键字。

```java
... ORDER BY 列1 [DESC],列2 [DESC],...,列m [DESC]
```

如：

```java
select SName,SAddress,SGrade from students order by SName desc,SAddress
```

可以看到结果集中的行首先按SName降序排列，当SName相同时，按SAddress升序排列。

## 使用TOP关键字取结果集前几行

该关键字跟在SELECT [DISTINCT]后，列名表前。往往还需要结合ORDER BY子句使用才有意义。

```java
... TOP n [PERCENT] [WITH TIES] ...
```

①只使用n时表示取前n行：

```java
select top 5 SName,SAddress,SGrade from students 
order by SName desc,SAddress
```

②使用了PERCENT时表示取前n%：

```java
select top 25 percent SName,SAddress,SGrade from students 
order by SName desc,SAddress
```

③使用了WITH TIES表示包括最后一行取值并列的结果：

```java
select top 9 with ties SName from students 
order by SName desc,SAddress
```

可以看到，我明明是要取前9行，但因为最后第10行的结果与之并列，因此也被取了进来。此外，虽然第10行和第9行的其它域并不相同，但在这里仍然被认为是取值并列，因为TOP关键字限制的是结果集，而不是原表，即便我在上面的语句中明确要求了先按SName再按SAddress，但因为结果集中没有Address域，TOP就不会去管这两行的Address相同不相同。

## 使用CASE函数按需分类

CASE函数作为多分支语句，可以利用表达式值不同来分类显示数据，分为测试型CASE和搜索型CASE。注意和SELECT语句一起用时，CASE函数体部分将自己生成一列，可以用自定义列名=CASE函数体的方式为这一列命名。

①测试型CASE

对每行按[测试表达式]的结果进到CASE体里去测试，发现与[简单值或可运算式k]有相同的值时，使用对应的[结果值或表达式k]。

```java
CASE 测试表达式
    WHEN 简单值或可运算式1 THEN 结果值或表达式1
    WHEN 简单值或可运算式2 THEN 结果值或表达式2
    ......
    ELSE 结果值或表达式n
END
```

如：

```java
select SName,SGrade,
新的列名=
case SGrade
    when 1 then '一年级'
    when 2 then '二年级'
    when 3 then '三年级'
    when 4 then '四年级'
    else '留级'
end
from students
```

②搜索型CASE

对每行都从头搜索CASE体，如果[返布尔值式k]返回了True，使用对应的[结果值或表达式k]。

```java
CASE
    WHEN 返布尔值式1 THEN 结果值或表达式1
    WHEN 返布尔值式2 THEN 结果值或表达式2
    ......
    ELSE 结果值或表达式n
END
```

如：

```java
select SName,SGrade,
新的列名=
case
    when SGrade=1 then '一年级'
    when SGrade=2 then '二年级'
    when SGrade=3 then '三年级'
    when SGrade=4 then '四年级'
    else '留级'
end
from students
```

## 使用INTO子句将SELECT结果创建并保存在新表中

上节学习了SELECT-INTO-FROM语句，实质上就是这个的最简单用法，只要将”INTO 新表名”写在SELECT的”FROM 源表名称”前即可了。而这中间可以正常使用前面那些乱七八糟的东西，或者使用后面会学的SELECT的其它高级用法。

```java
SELECT ......
.....
INTO 新表名称
FROM 源表名称
```

如：

```java
select SName,SGrade,
新表的新列=
case
    when SGrade=1 then '一年级'
    when SGrade=2 then '二年级'
    when SGrade=3 then '三年级'
    when SGrade=4 then '四年级'
    else '留级'
end
into MyNewTab
from students
```

可以看到在同一用户数据库下产生了这个新表：
