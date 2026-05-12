# 30、SQL Server 教程 - 使用视图操作表数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/30.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 使用INSERT语句插入数据；

通过vw_boy视图向stu info表插入学生信息。

```java
INSERT INTO vw_boy
VALUES（'0018','蒋十九','男','1988-05-29','NULL，NULL,'计算机系'）
GO
SELECT *
FROM vw_boy
GO
```

**2、** 使用UPDATE语句更新数据；

在视图上使用UPDATE语句也可以更新基表的数据。但有一点必须提醒读者，并不是所有视图都能够更新数据，以下几种视图不能用于更新。

- 表值函数返回的结果只有在某些情况下才能更新。
- 如果查询或视图所包括的列来自多个表或视图，则不能更新这些查询或视图。
- 不能更新使用GROUP BY或DISTINCT子句的查询或视图。
- 不能更新存储过程返回的结果。

通过视图vw_boy将学生“周伦杰”的院系更新为“外语系”。

```java
UPDATE vw_boy
SET depart='外语系'
WHERE  sname='周伦杰'
GO
SELECT *
FROM   vw_boy
GO
```

**3、** 使用DELETE语句删除数据；

通过视图删除数据的SQL语句和删除表数据的SQL语句完全相同，只是将DELETE语句中的表名改为视图名即可。要通过视图vw_boy删除学生“张三”的语句如下所示。

DELETE FROM vw_boy

WHERE sname='张三'
