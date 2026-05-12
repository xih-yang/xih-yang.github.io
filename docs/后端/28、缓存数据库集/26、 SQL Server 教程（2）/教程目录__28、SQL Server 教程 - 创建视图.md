# 28、SQL Server 教程 - 创建视图
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/28.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 使用CREATEVIEW语句创建视图；

```java
创建视图vw_boy．它用于将表stu_info中全部男生的信息显示出来。并使用视图vw_boy查询国际交流学院的男生。
    CREATE VIEW vw_boy
    AS
    SELECT  *
    FROM  Stu_info
    WHEREE sex='男'
```

**2、** 用别名命名视图字段；

```java
创建视图vw_boyl，用于将表stu_info中全部男生的信息显示出来，并给相应字段设置中文别名。
    CREATE VIEW  vw_boyl（学号，姓名，性别，出生日期，电子信箱，手机号码，所属院系)
    AS
    SELECT  *
    FROM  stu_info
    WHERE   sex= '男'
```

**3、** 创建视图时的注意事项；

在用CREATE VIEW创建视图时，SELECT子句里不能包括以下内容；

- COMPUTE、COMPUTE BY子句
- ORDER BY子句，除非在SELECT予句里有TOP关键字
- OPTION子句
- INTO关键字
- 临时表或表变量

**4、** 创建加密视图；

```java
创建加密视图vw_girl，用于将表stu_info中全部女生的信息显示出来，之后查看系统视图INFORMATION二SCHEMA．VIEWS的内容。
    CREATE VIEW vw_girl
    WITH ENCRYPTION
    AS
    SELECT  *
    FROM  stu_Linfo
    WHERE sex='女'
    GO
    SELECT *
    FROM   INFORMATION_SCHEMA.VIEWS
    GO
```
