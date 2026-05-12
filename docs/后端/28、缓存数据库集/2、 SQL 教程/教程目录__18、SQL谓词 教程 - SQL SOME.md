# 18、SQL谓词 教程 - SQL SOME
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/18.html
- 分类：缓存数据库
- 分组：教程目录
将值与子查询中的至少一个匹配值匹配。

## 大纲

```java
scalar-expression comparison-operator SOME (subquery)
```

## 参数

- scalar-expression - 将其值与子查询生成的结果集进行比较的标量表达式(最常见的是数据列)。
- comparison-operator - 以下比较操作符之一:=(等于)，`<>`或!=(不等于)，``=(大于或等于)，[(包含)，或](跟随)。
- subquery - 一个用括号括起来的子查询，它返回一个用于与标量表达式比较的结果集。

## 描述

`SOME`关键字与比较操作符一起创建谓词(量化比较条件)，如果标量表达式的值与子查询检索到的一个或多个对应值匹配，则该谓词为真。

`SOME`谓词将单个标量表达式项与单个子查询`SELECT`项进行比较。

具有多个选择项的子查询将生成`SQLCODE -10`错误。

注意:`SOME`和`ANY`关键字是同义词。

## 示例

下面的例子选择了居住在密西西比河以西任何一个州的工资超过`75,000`美元的员工:

```java
SELECT Name,Salary,Home_State FROM Sample.Employee
WHERE Salary > 75000
AND Home_State = SOME
 (SELECT State FROM Sample.USZipCode
  WHERE Longitude < -93)
ORDER BY Home_State
```
