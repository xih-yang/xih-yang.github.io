# 04、SQL Server 教程 - 使用sql语句创建 、修改、删除数据库
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/4.html
- 分类：缓存数据库
- 分组：教程目录
#### 用CREATE DATABASE语句创建数据库

CREATE DATABASE

创建一个名为 "testSQL" 的数据库，使用下面的 CREATE DATABASE 语句：

CREATE DATABASE testSQL

CREATE DATABASE语句的完整语法格式非常复杂，带有很多可选参数。

#### 用ALTER DATABASE语句修改数据库

ALTER DATABASE databasename 一一要修改的数据库名

{
 一一添加或修改数据库文件

 一一添加或修改数据库文件组

 一一设置数据库选项

MODIFY NAME = new_ database_name 一一重命名

COLLATE collation_name 一一修改捧序规则

}

- 将名为“testSQL"的数据库改名为“SQLTest":

ALTER DATABASE testSQL

MODIFY NAME= SQLTest

- 为“SQLTest"数据库增加一个名为“SQL增加的数据文件”的数据文件，并将其保存到D盘下的SQLtest文件夹中：

ALTERnativeDATABASE SQLtest

ADDFILE (NAME=SQL增加的数据文件，

FILENAME=‘D: \SQLtest\ SQLTest数据库增加的数据文件．ndf’)
