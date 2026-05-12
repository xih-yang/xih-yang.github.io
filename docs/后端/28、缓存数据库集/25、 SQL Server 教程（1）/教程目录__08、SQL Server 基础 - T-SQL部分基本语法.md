# 08、SQL Server 基础 - T-SQL部分基本语法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/8.html
- 分类：缓存数据库
- 分组：教程目录
找到一个可以快速学习SQL语法的网站[W3school SQL教程](http://www.w3school.com.cn/sql/index.asp)，从这上面学习一些基本语法，再来看考试书。

## WHERE子句

WHERE子句用来指定选择的条件。

```java
...WHERE 表达式
```

表达式内可以使用的操作符
意义

=
等于

<>
不等于

>
大于

=
大于等于

<=
小于等于

BETWEEN
在某个范围内

LIKE
搜索某种模式

可以放在SELECT语句中，如：

```java
select SName,SAddress,SGrade from students where SGrade>2
```

注意写在整个SELECT-FROM的后面。

**补充：**实际上，前面学的UPDATE和DELETE本身是不带WHERE的，应当是：

```java
UPDATE 表名称 SET 列名称=新值,列名称=新值,...
```

```java
DELETE FROM 表名称
```

## AND & OR运算符

表示与和或，用来连接表达式：

```java
表达式 AND/OR 表达式
```

如：

```java
select SName,SAddress,SGrade from students where (SGrade>2 and SAddress='China')
```

可以看到对字符串的匹配不区分大小写。可以用AND，OR和()来组成更复杂的判断条件。

## SQL通配符

通配符
含义

%
匹配任意多个字符

_
匹配一个字符

[字符列]
匹配字符列中的某个字符

[^字符列]或[!字符列]
匹配字符列外的某个字符

如：

```java
select SName,SAddress,SGrade from students where SAddress like '%[cC]%i%'
```

## IN操作符

```java
...IN (值列表)
```

指匹配处于这些值之中的任意一个。

如：

```java
select SName,SAddress,SGrade from students where SAddress in ('China','bCity')
```

## BETWEEN操作符

匹配位于两值之间的值。

```java
...BETWEEN 值1 AND 值2
```

如：

```java
select SName,SAddress,SGrade from students where SGrade between 3 and 6
```

## 别名Alias

别名可以使程序看起来更简洁。可以为表或表中的列指定别名，语法都是

```java
...表名/列名 AS 别名 ...
```

而不影响所在语句的任何结构。

如：

```java
select STU.SName as SN,STU.SAddress as SA,STU.SGrade as SG from students as STU where STU.SGrade between 3 and 6
```

就是为表studets设置了别名STU，并为其中的列SName，SAddress，SGrade设置了别名SN，SA，SG。

可以看到结果的表中的列也被显示了别名而不是原名。

## JOIN根据列间关系访问多表(内连接/左连接/右连接/全连接)

不使用JOIN时，可以用这种方式访问具有外键约束(或者仅仅是用某个列做关联)的两个表：

```java
select S.StudentName,S.StudentNo,R.SubjectID,R.StudentResult,R.ExamDate
from Student as S,Result as R
where S.StudentNo=R.StudentNo
```

这里是因为这两张表用学号StudentNo列确定了谁是谁。

用INNER JOIN(即JOIN)建立内连接：

```java
select S.StudentName,S.StudentNo,R.SubjectID,R.StudentResult,R.ExamDate 
from Student as S
inner join Result as R
on S.StudentNo=R.StudentNo
```

实际上除了INNER JOIN(即JOIN，内连接)之外，还有下面三种JOIN：

测试一下LEFT JOIN：

```java
select S.StudentName,S.StudentNo,R.SubjectID,R.StudentResult,R.ExamDate 
from Student as S
left join Result as R
on S.StudentNo=R.StudentNo
```

s004刘猫在Student表中是有的，但是没有参与任何考试，所以在Result表中没有s004这个学号，即是是这样，因为是LEFT JOIN(LEFT OUTER JOIN)，只要左边的表(Student表)里有这个学号，那么就会被匹配进来。

注意，OUTER JOIN中区分左表和右表是看谁写在FROM后谁写在JOIN后，而和ON后面的表达式中表的顺序没关系。

此外，这个例子中，我对Result表的StudentNo利用Student表的StudentNo实施了外键约束，所以RIGHT JOIN是没办法出现与INNER JOIN不同的情况的(因为这个外键约束保证了不可能出现不在Student表却在Result表中的学号)。

## UNION合并行集合

需要行的每列格式一致才能作合并，对于不一致的表，只要SELECT出的列格式一致就可以作合并：

```java
select SName from students
union
select SEmail from newTab
```

可以看到UNION命令只会选取不同的值，然后合并。

而UNION ALL则会选取所有的值，即便有重复：

```java
select SName from students
union all
select SEmail from newTab
```
