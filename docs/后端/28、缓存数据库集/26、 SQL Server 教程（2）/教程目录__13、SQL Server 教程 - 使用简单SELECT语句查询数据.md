# 13、SQL Server 教程 - 使用简单SELECT语句查询数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/13.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 查询表中所有数据；

```java
SELECT *
FROM tabla_source
```

**2、** 查询表中指定字段的数据；

```java
SELECT 字段名
FROM table_source
SELECT snarne，sex，telephone
FROM strLinfo
```

**3、** 查询结果中去除重复信息；

```java
SELECT DISTINCT depart
FROM  stu_info
```

**4、** 根据现有列值计算新列值；

```java
SELECT sname，DATEDIFF(year,birth,GETDATE())
FROM  stu_info
```

**5、** 命名新列；

```java
SELECT sname,DATEDIFF(year,birth,GETDATE() AS 年龄
FROM stu_info
```

**6、** 将查询结果保存为新表；

```java
SELECT *(或字段列表)
INTO 新表名
FROM table_source
SELECT sname,DATEDIFF (year,birth, GETDATE()) AS 年龄
INTO age
FROM  stu_info
```

**7、** 连接字段；

```java
SELECT sname+depart
FROM stu_info
SELECT sname+depart AS 姓名及来源地
FROM Stu_info
SELECT RTRIM(sname)+'('+RTRIM(depart)+')' As姓名及来源地
FROM stu_info
```

**8、** ；
