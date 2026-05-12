# 14、SQL Server 教程 - 使用SELECT语句获取满足查询条件的数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/14.html
- 分类：缓存数据库
- 分组：教程目录
**1、** WHERE子句用法；

```java
SELECT *
FROM stu_info
WHERE depart='中文系'
```

**2、** 根据条件查询数值数据；

```java
SELECT *
FROM course
WHERE credit=4
SELECT cname,cno,credit
FROM  course
WHERE creciit>2
SELECT sname,DATEDIFF(year,birthr GETDATE()) AS 年龄
FROM stu_info
WHERE DATEDIFF(year,birth,GETDATE())>30
```

**3、** 根据条件查询字符数据；

```java
SELECT *
FROM stu_info
WHERE sname='张三'
SELECT *
FROM stu_info
WHERE depart<>'计算机系'
```

**4、** 根据条件查询日期数据；

```java
SELECT *
FROM stu_info
WHERE  birth>'01/20/1977'
```

**5、** 按范围查询数据；

```java
SELECT *
FROM course
WHERE credit BETWEEN 2 AND 4
```

**6、** 查询NULL值；

```java
SELECT *
FROM str_info
WHERE telephone is NULL
```
