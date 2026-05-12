# 19、SQL Server 教程 - 连接查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/19.html
- 分类：缓存数据库
- 分组：教程目录
1使用无连接规则连接两表

所谓无连接规则连接，就是指连接两表的SELECT语句中不设置任何连接条件，这样得到的连接结果是第一个表中的每一行都会和第二个表中的所有行进行连接，即得到一个笛卡尔积.

```java
SELECT * 或字段列表
FROM 表名1，表名2
```

2使用有连接规则连接两表

有连接规则连接，其实就是在无连接规则的基础上，加上WHERE子句指定连接规则的连接方法。

```java
SELECT *（或字段列表] 
FROM  表名1,表名2
WHERE 连接规则
查询名叫“张三”的学生的所有课程的平时成绩和考试成绩，并按考试成绩降序排序。
    SELECT  stu_info。sno, su_lnfo。snarne, score.cno,score.usually, scora.exam
    FROM    stuinfo, score
    hlHERE  stu_info.sname='张三'
    AND     stu_info.sno=score. sno
    ORDER BY score.exam DESC
```

3使用多表连接查询数据

```java
查询名叫“张三”的学生的所有课程的平时成绩和考试成绩，并按考试成绩降序排序，当考试成绩相同时，用平时成绩降序排序。
    SELECT  stu_info.sno,stu_info.snanua,course.cname,score.usually, score.exam
    FROM    stu_info,score,course
    WHERE   stu_nfo.sname='张三'
    AND     stu_info.sno=score.sno
    AND     score.cno=course.cno
    ORDER BY  score.exam DESC, score.usually  DESC
```

4使用表别名简化语句

```java
SELECT a.sno,a.name,c.cname. b.usually,b.exam
FROM   stu_info AS a,
score   AS b,
course  AS  c
WHERE   a.sname='张三'
AND     a.sno=b.sno
AND     b.cno=c.cno
ORDER BY b.exam DESC,b.usually DESC
```

5使用INNER JOIN连接查询

在WHERE子句中设置连接规则，有时会使整个条件表达式变得非常臃肿，而且不容易让人理解。因此在ANSI SQL规范中建议使用INNER JOIN进行多表连接。这样一来，WHERE子句中就不用再放置连接规则，而只放置查询条件就可以了。

```java
查询所有考过“心理学”课程的学生的学号、姓名、系别及“心理学”的平时成绩和考试成绩‘．
SELECF st.sno,st.sname,st.depart, s.usually,s.exam
FROM
score AS s
INNER JQIN course AS c
     ON s.cno=c.cno
INNER JOIN stu_info AS st
     ON st.sno=s.sno
WHERE c.cname='心理学'
ORDER BY s.exam DESC
```
