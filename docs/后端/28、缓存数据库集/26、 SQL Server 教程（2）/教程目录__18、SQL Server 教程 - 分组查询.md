# 18、SQL Server 教程 - 分组查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/18.html
- 分类：缓存数据库
- 分组：教程目录
## 1 将表内容按列分组

```java
将STUINFO表中的数据，按所属专业字段分组。
SELECT STUMAJOR
FROM STUINFO
GROUP BY STUMAJOR
```

## 2 聚合函数与分组配合使用

```java
统计STUINFO表中男生的总人数和女生的总人数。
SELECT STUSEX COUNT (*)
FROM STUINFO
GROUP BY STUSEX
统计STUINFO表中每个专业的女生人数。
SELECT   STUMAJOR,COUNTC(*)  AS 女生人数
FROM  STUINFO
WHERE STUSEX='女'
GROUP BY STUMAJOR
```

## 3 查询数据的直方图

```java
从STUINFO表中，查询一个表示每个专业学生人数的直方图。
(1)如果运行环境为SQL Server，
SELECT STUMAJOR,
    REPLICATE('=',COUNT(*}*3) AS 人数对比图
FROM STUINFO
GROUP BY STUMAJOR
```

## 4 排序分组结果

```java
在STUINFO表中统计每个专业的学生人数，并按学生人数降序排序.
SELECT    STUMAJOR, COUNT(*)
FROM STUINFO
GROUP BY STUMAJOR
ORDER BY COUNT(*) DESC
```

## 5 反转查询结果

```java
从STUINFO表中查询每个专业的男生人数和女生人数。
SELECT STUMAJOR,
       COUNT (CASE
                     WHEN STUSEX='男' THEN 1
                     ELSE NULL
              END) AS 男生人数，
       COUNT (CASE
                    WHEN STUSEX='女' THEN 1
                    ELSE NULL
              END) AS 女生人数
FROM STUINFO
GROUP BY STUMAJOR
```

## 6 使用HAVING子句设置分组查询条件

```java
在STUINFO表中统计计算机专业和会计专业的学生人数，并按学生人数降序排序。
SELECT  STUMAJOR, COUNT（*) AS 人数
FROM    STUINFO
GROUP BY STUMAJOR
HAVING  STUMAJOR IN（'计算机','会计'）
ORDER  BY  COUNT(*)
```
