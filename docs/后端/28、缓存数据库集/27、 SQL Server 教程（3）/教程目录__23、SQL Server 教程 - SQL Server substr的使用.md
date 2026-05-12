# 23、SQL Server 教程 - SQL Server substr的使用
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/23.html
- 分类：缓存数据库
- 分组：教程目录
在SQL中可以使用字符串函数来提取你想要呈现的字符，substring()函数可以截取字符串中的部分字符，它有两种使用方式：

**SUBSTR****(str,i)**:由str中，选出字符串str的第i位置开始的字元。请注意，这个语法不适用于SQL Server上。

**SUBSTRING(str,i,len)**:由str中的第i位置开始，选出接下去的len个长度的字元。(这里我使用的数据库版本是2008R2的，有些老一点的版本是substr(),所以要根据你PC上安装的数据库版本来决定)

假如有tb_Teachers_info表

tb_Teachers_info

想要查找TeachersName为justin中ust字符

**SQL语句：**

select substring(TeachersName,2,3)from tb_Teachers_infowhereTeachersName='Justin';

输出结果：

下一节. Sql server多表查询
