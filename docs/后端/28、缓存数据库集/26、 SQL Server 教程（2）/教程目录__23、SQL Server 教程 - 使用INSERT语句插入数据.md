# 23、SQL Server 教程 - 使用INSERT语句插入数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/23.html
- 分类：缓存数据库
- 分组：教程目录
## 1 插入完整的行

向数据表course添加如表所示的课程内容。

课号

课  名

类  型

学  分

009

法律錾础

必修

3

010

素描

选修

2

```java
INSERT INTO course
VALUES('009','法律基础','必修',3) 
```

## 2 向日期时间型字段插入数据

向数据表stu_info添加如表所示的学生信息。

学号

姓名

性别

出生日期

电子信箱

手机号码

所属院系

10016

玛丽

女

1989-02-07

marry@163.com

13716161616

物理系

```java
INSERT INTO stu_info
VALUES（'00161','玛丽','女','1989-02-07','marry@163．com','113716161616','物理系'）
```

## 3 将数据插入到指定字段

向数据表stu_info添加如表12.3所示的学生信息。

学号

姓名

性别

出生日期

电子信箱

手机号码

所属院系

0017

周伦杰

男

1987-05-07

中文系

由于要插入的学生信息并不完整，如电子信箱和手机号码都是空的，因此必须在表名后加上指定的字段列表。

```java
INSERT  INTO  stu_info
   (
    sno,
    sname,
    sex,
    birth,
    depart
    ）
VALUES
   (
    '0017',
    '周伦杰',
    '男',
    '1987-05-07',
    '中文系'）
```

## 4 将查询结果插入表

stu_info_copy表和stu_info表的表结构是一模一样的。将stu_info表中所有数据，通过INSERT SELECT插入到stu_info_sopy表。

```java
INSERT INTO str_info_copy
SELECT *
FROM   Stu_info
```
