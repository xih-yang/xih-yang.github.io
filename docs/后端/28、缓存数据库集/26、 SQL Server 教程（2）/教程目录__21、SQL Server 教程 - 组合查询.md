# 21、SQL Server 教程 - 组合查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/21.html
- 分类：缓存数据库
- 分组：教程目录
除连接查询外，SQL中还有一种组合查询，这种查询使用UNION关键字将多个SELECT语句组合起来，将多个SELECT语句的查询结果显示到一个结果集中。组合查询与连接查询不同的是，前者将多个表的查询结果，竖着组合，而后者是将查询结果横着连接。

1使用组合查询

```java
从stu_info表中查询所属院系为“计算机系”，或者年龄大于30岁的学生的信息。
SELECT * 
FROM stu_info
WHERE depart='计算机系'
UNION
SELECT * FROM stu_info
WHERE DATADIFF(year,birth,GETDATE())>30
```

2使用UNION的规则

(1)．每个查询语句应当有相同数量的宇段

(2)．每个查询语句中相应的字段的类型必须相互兼容

3使用UNION得到复杂的统计汇总样式

联合UNION、GROUP BY和聚合函数三者会得到具有很棒的统计汇总样式的查询结果.

```java
SELECT  sno,cno,exam
FROM  score
UNION
SELECT  sno. '总分:',SUM(exam)
FROM  score
GROUP BY sno
UNION
SELECT  sno,'平均分'， AVG(exam)
FROM  score
GROUP BY sno
```

4排序组合查询的结果

```java
从stu_info表中查询所属院系为“计算机系”或者年龄大于30岁的学生的信息，并按照出生日期进行升序排序.
SELECT *
FROM      stu_info
WHERE     depart='计算机系'
UNION
$ELECT *
FROM      stu_info
WHERE     DATEDIFF(year，birth，GETDATE())>30
ORDER BY birth
```
