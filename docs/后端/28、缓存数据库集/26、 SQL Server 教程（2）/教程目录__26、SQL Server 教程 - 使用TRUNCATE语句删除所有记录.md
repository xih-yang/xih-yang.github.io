# 26、SQL Server 教程 - 使用TRUNCATE语句删除所有记录
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/26.html
- 分类：缓存数据库
- 分组：教程目录
TRUNCATE是删除表中所有记录的另一种语句，与DELETE语句相比，TRUNCATE运行效率非常高，因为使用TRUNCATE语句时，SQL Server不会写入任何内容，换个角度说，TRUNCATE语句所做的修改是不能回滚的。这里需要强调一点，TRUNCATE语句只是删除了表中的所有数据，而并没有删除表本身。

```java
    删除stu_info_copy表内的所有记录。
    如果已经将stu_info_copy表中的数据全部删除，则使用以下语句向stu_info_copy表插入
内容。
    INSERT  INTO stu_info_copy
    SELECT  *
    FROM  stu_info
    然后，执行下面的语句。
    TRUNCATE TABLE stu_info_copy
```
