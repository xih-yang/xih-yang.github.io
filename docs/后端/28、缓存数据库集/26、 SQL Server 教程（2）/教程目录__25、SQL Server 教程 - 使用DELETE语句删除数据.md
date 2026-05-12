# 25、SQL Server 教程 - 使用DELETE语句删除数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/25.html
- 分类：缓存数据库
- 分组：教程目录
1使用DELETE语句删除指定记录

```java
从stu_info_copy表，删除名叫“安娜”的学生。
DELETE FROM stu_info_copy
WHERE    姓名='安娜'
从stu_info_copy表，删除所有外语系的学生。
  DELETE FROM stu_info_copy
  WHERE    所属院系='外语系'
```

2在DELETE语句中使用多表连接

```java
从score_copy表中，删除“张三”的所有相关记录。
DELETE score_copy
FROM   score_copy AS s, 
       stu_info AS st
WHERE  st.sname='张三'
AND    st.sno=s.sno
```

3使用DELETE语句删除所有记录

```java
删除stu_info_copy表内的所有记录。
DELETE FROM stu_info_copy
```
