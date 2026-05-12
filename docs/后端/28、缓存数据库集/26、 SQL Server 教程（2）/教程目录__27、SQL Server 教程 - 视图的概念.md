# 27、SQL Server 教程 - 视图的概念
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/27.html
- 分类：缓存数据库
- 分组：教程目录
视图是一个虚拟表，称其为虚拟表的原因是：视图内的数据并不属于视图本身，而属于创建视图时用到的基本表。可以认为，视图是一个表中的数据经过某种筛选后的显示方式；或者是多个表中的数据经过连接筛选后的显示方式。

视图由一个预定义的查询(SELECT语句)组成，可以像基本表一样用于SELECT语句中。如果视图满足一定条件，还可以用在INSERT、UPDATE和DELETE语句中，对视图所调用的基本表进行插入、更新和删除数据操作。

```java
定义一个视图vwA，将上例的SELECT语句存放到该视图内。
CREATE VIEW vwA
AS
SELECT   st.sno,
         st.sname,
         st.depart,
         s.exam
FROM  stu_info AS st,
      course AS c,
      score AS s
WHERE c.cname  = '邓小平理论'
AND   s.exam>=90
AND   st.sno=s.sno
AND   c.cno =s.cno
```

视图被定义后可以像基本表一样使用。例如，下面的示例在SELECT语句中使用了视图 vwA.

```java
SELECT *
FROM vwA
```
