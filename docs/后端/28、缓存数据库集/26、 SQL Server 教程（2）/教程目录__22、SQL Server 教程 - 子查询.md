# 22、SQL Server 教程 - 子查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/22.html
- 分类：缓存数据库
- 分组：教程目录
嵌入另一个SELECT语句中的SELECT语句被称为子查询。目前，子查询能完成的工作，通过表连接几乎也都可以完成，而在过去，因为内连接的运行效率比较差，外连接又不能使用，所以子查询被运用得非常广。但是，近些年来由于对SQL Server的优化，使得内连接的运行效率明显高于子查询，而外连接也被开发了出来，所以用户开始丢掉那些比较难理解的子查询语句，而改用相对容易理解的表连接查询语句。

虽然多数情况下，使用表连接查询要优于子查询，但是，在特定环境下，子查询运行的效率可能仍旧优于表连接查询，所以为了能够阅读、理解早年编写的SQL语句，对子查询需要做一些了解。

1使用返回单值的子查询

```java
查询所有选修“心理学”并有考试成绩的学生的考试成绩，并按降序排序考试成绩。
SELECT  sno, exam
FROM    score
WHERE   cno=（SELECT cno
                     FROM Course
                     WHERE  cname='心理学'）
ORDER BY exam DESC
通过内连接查询语句完成任务，具体语句如下所示。
SELECT  S.sno,s.exam
FROM  score AS s.course AS c
WHERE    c.cname='心理学'
AND      s.cno=c.cno
ORDER BY s.exam DESC
或
SELECT   s.sno,s.exam
FROM     score AS s
INNER JOIN course AS c
ON       s.cno=c.cno
WHERE    c.cname='心理学'
ORDER BY s.exam DESC
```

2子查询与聚合函数的配合使用

```java
查询出生日期最小的学生的所有信息。
SELECT  *
FROM  stu_info
WHERE birth=（SELECT  MIN（birth)
      FROM stu_info)
```
