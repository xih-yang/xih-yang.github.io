# 24、SQL Server 教程 - 使用UPDATE语句更新数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/24.html
- 分类：缓存数据库
- 分组：教程目录
## 1 更新单个字段的数据

```java
在stu_info表中,将名叫"张三”的学生的email更改为“zhangsan@163.com",
UPDATE stu_info
SET email='zhangsan@163.com'
WHERE  sname='张三'
```

## 2 更新多个字段的数据

```java
在stu.info表中，将没有院系的学生全部归为“国际交流学院”所属，并将email统一更改为“gjjl@imnu.edu.cn"。
    UPDATE stu．info
    SET  depart='国际交流学院',
         email=‘gjj l@imnu. edu. cn-
    WHERE  depart IS NULL
```

## 3 使用表连接更新数据

```java
score表中，在每个学生“大学英语”的平时成绩上加5分。
UPDATE score
SET   usually= usually +5
FROM  score AS s,
      course AS c
WHERE c.name= '大学英语'
AND    s.cno=c.cno
```

## 4 使用UPDATE语句删除指定字段的数据

```java
在stu_info表中，将所有外语系学生的“telephone"字段的值删除。
UPDATE stu_info
SET    telephone =NULL
WHERE   depart='外语系'
```
