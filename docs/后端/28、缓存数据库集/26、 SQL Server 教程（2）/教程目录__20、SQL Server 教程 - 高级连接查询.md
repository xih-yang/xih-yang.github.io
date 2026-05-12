# 20、SQL Server 教程 - 高级连接查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/20.html
- 分类：缓存数据库
- 分组：教程目录
一自连接查询

```java
SELECT    stl.*
FROM  stu_info AS stl,stu_info AS st2
WHERE   stl.depart=st2.depart
AND     st2 .snarne= '张三'
```

二内连接查询

内连接最大的特点是只返回两个表中互相匹配的记录，而那些不能匹配的记录就被自动去除了。

1．等值连接

前面几节的内容中，连接规则由等于号(=)组合而成，例如，stl.depart= st2．dcpart，并且列出两个表中所有字段的连接，即SELECT子句中使用星号（誊）通配符的连接就属于等值连接。关于等值连接，由于前面的例子已经足够，因此不再具体举例说明。

2．自然连接

在等值连接的基础上稍加改动即可得到自然连接，等值连接将两个表中的所有字段全部列出，而自然连接则不将相同的字段显示两次，即在SELECT子句中列出需要显示的字段列表。

3．不等值连接

不等值连接的连接规则由等于号以外的运算符组成，例如，由>、>=、<、<=、◇或BETWEEN等。

三左外连接查询

```java
SELECT *
FROM  tl
LEFT OUTER JOIN t2
ON tl．职工号=t2．职工号
```

四右外连接

```java
SELECT *
FROM  tl
RIGHT OUTER JOIN t2
ON tl．职工=t2．职工号
```

五全外连接

```java
FROM  tl
FULL OUTER JOIN t2
ON tl．职工号=t2．职工号
```

六交叉连接查询

```java
SELECT  *
INTO   kcb
FROM  a CROSS JOIN b
```

七连接查询中使用聚合函数

```java
SELECT    st.sno，sL.sname,s. sno,s,cno, s.exam
FRQM      stu_info AS st
LEFT OUTER JOIN score AS s
ON  st.sno=s.sno
ORDELR  BY s.sno
```
