# 16、SQL Server 教程 - 高级条件查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/16.html
- 分类：缓存数据库
- 分组：教程目录
1AND运算符

```java
SELECT  *
FROM    stu_info
WHERE  depart='数学'
AND  sex='女'
ORDER BY sno
SELECT    *
FROM    stu_info
WHERE  出生日期>='01/01/1975'
AND    出生日期<'01/01/1976'
AND email IS NULL
ORDER BY出生日期
```

**2、** OR运算符；

```java
SELECT  *
FROM    stru_info
WHERE    depart='中文系'
OR       depart='外语系'
ORDER BY sno
```

**3、** AND与OR的优先顺序问题；

```java
SELECT  *
FROM    stu_info
WHERE    (depart='中文系' OR depart='外语系'）
AND    sex='女'
ORDER BY sno
```

**4、** NOT运算符；

```java
SELECT *
FROM stu_info
WHERE birth  NOT  BETWEEN '01/01/1978'  AND  '12/31/1980'
```

**5、** IN运算符；

```java
SELECT  *
FROM    course
WHERE   credit  IN (2, 3, 4)
ORDER BY credit DESC,cno
SELECT  *
FROM    stu_info
WHERE  depart NOT IN ('中文系','外语系','计算机系')
ORDER BY depart DESC
```

**6、** LIKE运算符与“%"通配符；

```java
SELECT *
FROM   strLinfo
WHERE  sname  LIKE  '%三% '
```

**7、** “_”通配符的使用；

```java
SELECT *
FROM   stu_info
WHERE  RTRIM(sname) LIKE '刘_'
SELECT *
FROM   strLinfo
WHERE  RTRIM (sname)   LIKE '__'
```

**8、** “[]”通配符的使用；

```java
查询姓张、李或刘的所有学生，并按姓名升序排序.
SELECT  *
FROM    stu_infD
WHERE   sname LIKE '[张李刘]%'
ORDER BY sname
查询除姓张、李或刘以外的所有学生。并按姓名升序排序.
SELECT  *
FROM    stu_info
WHERE  sname LIKE '[^张李刘]%'
ORDER BY sname
```

**9、** 定义转义字符；

前面学习了几种通配符的使用方法，知道了“%5%”代表包含5的所有字符串，但如果想要查询最后两个字符为百分之五的所有字符串呢？即将“%5%组中，．第二个“%"视为是普通字符，而不是通配符，此时，便应该定义和使用转义字符。在SQL Server中，使用ESCAPE关键字定义转义字符。例如，要查询最后两个字符为百分之五（5%）的所有字符串，其LIKE

语句为：

LIKE ’%5#%‘ ESCAPE ’#‘
