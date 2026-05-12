# 09、SQL Server 教程 - 表的删除与截断与重命名
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/9.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 删除数据表使用DROPTABLE语句使用DROPTABLE语句会将表彻底删除掉，包括表内的数据和表本身；

DROP TABLE table_name

**2、** 只删除表中的数据，而不删除表本身这时可以使用TRUNCATE语句将表截断，即删除其内的所有数据；

TRUNCATE TABLE tablename

**3、** 在SQLServer中重命名表使用SP_RENAME完成；

SP_RENAME oldname, newname;
