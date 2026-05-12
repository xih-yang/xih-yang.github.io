# 09、SQL Server 基础 - 有关SELECT子查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/9.html
- 分类：缓存数据库
- 分组：教程目录
SELECT子查询就是嵌套在SELECT、INSERT、UPDATE或DELETE语句中的SELECT语句(并且可以带有其它子句)，也叫内层查询。

## 集合测试

```java
...WHERE 表达式 [NOT] IN (子查询)
```

先进行子查询，然后外层查询在子查询返回的集合上用[NOT] IN运算符做集合测试。

例如：

```java
select StudentNo,StudentName,GradeId from Student where StudentNo in
(select StudentNo from Result where StudentResult>70)
and GradeId<=2
```

表示先用子查询在Result表中找到成绩大于70的学生们学号的集合，然后在Student表中查找属于这个集合的学生信息，并且筛选出年级<=2的那部分。

## 比较测试

先进行子查询，然后外层查询在子查询返回的集合上用比较运算符做集合测试。

```java
...WHERE 表达式 比较运算符 (子查询)
```

例如：

```java
select * from students where SAddress =
(select SAddress from students where SName='三四五')
and SName<>'三四五'
```

表示先用子查询在students表中找到名字为三四五的人的地址，然后在students表中查到地址与该地址相同的所有学生，并去掉三四五本人。

## 存在性测试

先进行外层查询，然后根据外层查询的每条结果，执行子查询，如果子查询不为空，则EXISTS返回True(如果是NOT EXISTS就返回False)，如果返回了True，那么这条结果被保留，否则舍弃。

因为存在性测试的子查询只返回True或者Fasle，因此在这种子查询里指定查询列表是没有意义的，通常只要用*(全部)就可以了。

```java
...WHERE [NOT] EXISTS (子查询)
```

例如：

```java
select StudentNO,StudentName,GradeId from Student where exists
(select * from Result where StudentNo=Student.StudentNo and StudentResult<60)
```

表示先执行外层查询，找到Student表中的所有学生(行)，对每一行进入Result表进行内层查询，如果能找到与这个学生学号相同(表示参与了考试)并且成绩小于60(表示挂科了)的记录，那么就会返回一个True给外层查询，外层查询就保留了这个学生的记录，再继续查看下一条学生，如此循环。

## 替代表达式的子查询

这样的子查询可以用来制作临时列，因为列中要有值，所以这样的子查询需要返回一个值，往往要使用聚合函数。

```java
SELECT 列名表,新列名=
(返回值的子查询)
FROM 外层查询表名
```

例如：

```java
select StudentNo,StudentName,参加考试的次数=
(select COUNT(*) from Result where StudentNo=Student.StudentNo)
from Student
```

子查询新建了一列，这列通过查询Result表中与外层查询表中学号一致的记录数，来了解该学生参加考试的次数。

## 有关派生表

派生表是将子查询作为一个表来处理，类似于临时表，但是这个表可以像普通表一样被操作。派生表也叫内联视图。

```java
SELECT...FROM (子查询) AS 派生表名
```

例如：

```java
select StudentNo from
(select StudentNo,StudentResult from Result) as T1
```

就将Result表中拿出两列来作子查询并声明为派生表T1了。

对派生表的操作如：

```java
select T1.StudentNo,T2.StudentName,T2.GradeId,T1.SubjectID,T1.StudentResult from
(select StudentNo,StudentResult,SubjectID from Result) as T1
join
(select StudentNo,StudentName,GradeId from Student) as T2
ON T1.StudentNo=T2.StudentNo
```
