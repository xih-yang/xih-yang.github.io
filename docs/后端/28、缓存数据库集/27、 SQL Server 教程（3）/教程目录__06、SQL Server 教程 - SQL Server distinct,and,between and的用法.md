# 06、SQL Server 教程 - SQL Server distinct,and,between and的用法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/6.html
- 分类：缓存数据库
- 分组：教程目录
以tb_Teachers_info教师信息表为例 :

Distinct意思为不同的 ， 语句格式**SELECT DISTINCT "栏位名"

FROM "表格名"**

**1、** 从教师信息表中选择不同姓名的教师姓名；

SQL语句:select distinct TeachersNamefromtb_Teachers_info;

输出结果:

从上述例子中不难看出distinct是排除 相同的教师姓名

‘and’ 是表示一个并列条件，即匹配and前后的两个条件才行

**2、** 从教师信息表中选出姓名为’Joe’并且来自美国的教师信息；

SQL语句:select*fromtb_Teachers_info where TeachersName='Joe'and City='American';

输出结果:

**3、** 从教师信息表中选出年龄在23-24之间的老师信息；

SQL语句: select *from tb_Teachers_infowhereTeachersAgebetween 23and24;

输出结果:

下一节Sql server alias(别名)的用法
