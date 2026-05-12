# 17、SQL Server 教程 - 系统函数
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/17.html
- 分类：缓存数据库
- 分组：教程目录
## 1 聚合函数

```java
1．SUM函数
SELECT  SUM (stuage）
FROM STUINFO
2．AVG函数
SELECT AVG(STUAGE)
FROM STUINFO;
3．MIN函数
SELECT MIN (STUAGE)
FROM STUINFO;
4．MAX函数
SELECT  MAX (STUAGE)
FROM STUINFO;
5．COUNT函数
SELECT COUNT (STUAGE)
FROM STUINFO;
```

## 2 类型转换函数

```java
1．CONVERT()函数
把当前数据库的时间转换成字符类型。
SELECT  CONVERT (CHAR,GETDATE())
查询学生信息表中学生信息，并把学生的出生日期转换成字符类型。
SELECT   STUNAME, COFVERT(CHAR, STUSTUBIRTH,103)
FROM STUINFO
 2．CAST()函数
 从STUINFO表中，查询所有学生的姓名、出生日期，并将日期转换为字符串显示.
    SELECT  STUNAME, CAST(STUSTUBIRTH AS char(10)) AS 生日
    FROMSTUINFO
```

## 3 日期函数

```java
1．GETDATE函数,获取当前系统时间
SELECT   GETDATE()
2．DATEADD函数,用于在指定日期上增加年、月、日或时间等，其返回值为日期型数据。
DATEADD (year,5,GETDATE())
是在当前时间的年增加了5年，并返回5年后的日期。
```

```java
从STUINFO表中查询所有学生的姓名、出生日期、出生后的第8000天和出生后的第500个月。
SELECT    STUNAME，
STUBRITH,
DATEADD (DAY,800,STUBIRTH) AS '出生后第8000天
DATEADD(MONTH,500,STUBIRTH)  AS '出生后第500月．
FROM    STUINFO
 3．DATEDIFF函数,用于获取两个日期间的差，并返回数值数据
从STUINFO表中查询所有学生的姓名、出生日期和年龄.
SELECT STUSTUBIRTH ,
       DATEDIFF(year,STUSTUBIRTH,GETDATE()) AS 年龄
FROM STUINFO
 4．DATENAME函数,用于获取日期的一部份，并以字符串形式返回
从STUINFO表中查询每位l号出生的所有学生。
SELECT  *
FROM  STUINFO
WHERE DATENAME(day, STUSTUBIRTH)='1'
 5．DATEPART函数,用于获取日期的一部份，并以整数值返回
从STUINFO表中查询每位1号出生的所有学生。
SELECT  *
FROM    STUINFO
WHERE  DATEPART(day,STUSTUBIRTH)=l
```

## 4数学函数

## 5 字符函数

## 6.文本和图像函数

## 7.配置函数

## 8.游标函数

## 9.元数据函数

## 10.安全函数

##

11.常用的系统函数
