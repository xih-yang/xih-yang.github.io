# 15、SQL Server 教程 - 排序查询数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/15.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 按单列排序；

```java
SELECT sno 学号,sname 姓名,birth 出生日期
FROM stu_info
ORDER BY 出生日期
```

**2、** 设置排序方向；

```java
SELECT    *
FROM      course
ORDER BY credit DESC
```

**3、** 按多列排序；

```java
SELECT    *
FROM      course
ORDER BY  credit  DESC, cno
```

**4、** 按字段位置排序；

```java
SELECT  sno 学号,sname 姓名,DATEDIFF(yeart,birth,GETDATE()) 年龄
FROM    stu_info
ORDER BY  3    DESC
```

**5、** 查询前5行数据；

```java
SELECT Top 5 sname 姓名,birth 生日,telephone 手机号码
FROM stu_info
ORDER BY birth
SELECT TOP 30 PERCENT sname 姓名,birth 生日,telephone 手机号码
FROM    stu_info 
ORDER BY  birth
```

**6、** WHERE与ORDERBY的结合使用；

```java
SELECT  sno 学号,sname 姓名,celephone 手机号码,depart 所属院系
FROM    stu_Linfo
WHERE   telephone IS NOT NULJ
ORDER BY 学号
```
