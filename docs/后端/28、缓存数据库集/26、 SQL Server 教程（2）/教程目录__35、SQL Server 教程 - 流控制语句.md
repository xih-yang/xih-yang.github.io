# 35、SQL Server 教程 - 流控制语句
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/35.html
- 分类：缓存数据库
- 分组：教程目录
**1、** BEGIN．．．END语句；

**2、** IF...ELSE语句；

```java
IF条件
BEGIN
语句块l
[ ELSE
BEGIN
语句块2
END]
例  求两数之商，如果除数不为0，则求出正确结果，如果为0，则给出提示。
DECLARE @x real,@y real,@z real
SELECT @x=9,@y=5
IF @y<>0
BEGTN
    SELECT @z=@x／@y
    PRINT ’结果为:'+CAST(@z AS char)
END
ELSE
    PRINT '除数不能为零！'
```

**3、** WHILE语句；

```java
例   计算l+2+3+…+100的结果。
DECLARE @x int,@s int
SELECT @x=1,@s=0
WHILE @x<=100
BEGIN
     SELECT @S=@S+@x
     SELECT @x=@x+l
END
PRINT '结果为: '+CAST(@s AS char)
```

**4、** BREAK语句；

```java
例  打印1，2，3，4。
DECLARE @x int
SELECT @x=l
WHILE @x<=10
BEGIN
  IF @x=5  /*判断是否为5．如果是则结束循环．／
    BREAK
  ELSE
    PRINT CAST(@x AS char)
  SELECT @x=@x+l
END
```

**5、** CONTINUE语句；

```java
例   打印1~5之间的所有奇数。
DECLARE @x int
SELECT @x=0
WHILE @x<=5
BEGIN
    SELECT @x=@x+l
    IF @x%2=0  /*判断是否为偶数，如果是则重新开始循环*/
    CONTINUE
    PRINT CAST(@x AS char)
```

**6、** WAITFOR语句；

```java
例   在l小时后，执行一条查询语句：
WAITFOR   DELAY  '01:00:00'
SELECT * FROM Student
```

**7、** CASE语句；

```java
例   根据学生成绩划分等级。
SELECT
学生成绩>=85 THEN '优秀'
学生成绩>=60 AND  学生成绩<=84 THEN '中等'
学生成绩<60 THEN '不及格'
FROM学生信息表
```
