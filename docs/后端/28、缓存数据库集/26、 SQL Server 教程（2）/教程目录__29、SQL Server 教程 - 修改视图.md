# 29、SQL Server 教程 - 修改视图
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/29.html
- 分类：缓存数据库
- 分组：教程目录
使用SQL语句的ALTER VIEW可以修改视图:

ALTER VIEW 视图名称[字段1,字段2,…]

AS
SELECT查询语句

[WITH CHECK OPTION]

```java
修改视图vwA．使其能够查询"邓小平理论"考试成绩大于等于95的学生的学号、姓名、所属院系和考试成绩。
ALTER VIEW vwA
AS
SELECT  st.sno,
        st.sname,
        st. depart,
        s.exam
FROM    stu_into AS st
        course   AS c,
        score    AS s
WHERE   c.cname='邓小平理论'
AND     s.exam>=95
AND     st.sno=s.sno
AND     c.cno = s.eno
GO
SELECT *
FROM   vwA
GO
```
