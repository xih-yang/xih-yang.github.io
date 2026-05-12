# 17、Hadoop 入门：Hive-HQL
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/17.html
- 分类：大数据框架
- 分组：教程目录
## Hive —— HQL

Hive的操作语言HQL和SQL大同小异

### 数据库操作

```java
-- 创建
CREATE DATABASE mydb;
-- 使用
USE mydb;
-- 删除
DROP DATABASE mydb;
-- 强制删除
DROP DATABASE mydb CASCADE;
```

### 创建表

```java
-- 与SQL语句唯一的不同就是多了一个分割符
CREATE TABLE [IF NOT EXISTS] [db_name.]table_name (
	col_name data_type [COMMENT col_comment],
	...)
[COMMENT table_comment]
[ROW FORMAT DELIMITED 
 	FIELDS TERMINATED BY ","
 	...];
-- 查看元数据信息
desc formatted mytable;
-- 删除表
DROP table mytable;
```

Hive数据类型
对应Java数据类型

TINYINT
byte

SMALINT
short

INT
int

BIGINT
long

BOOLEAN
boolean

FLOAT
float

DOUBLE
double

STRING
string

TIMESTAMP
（时间类型）

BINARY
（字节数组）

MAP
Map

ARRAY
Array

STRUCT
类似c中的struct，用 . 访问

### 注释中文乱码

在远端的mysql中执行

```java
-- 在mysql中执行
use hive;
-- 修改表字段注解和表注解
alter table COLUMNS_V2 modify column COMMENT varchar(256) character set utf8;
alter table TABLE_PARAMS modify column PARAM_VALUE varchar(4000) character set utf8;
-- 修改分区字段注解
alter table PARTITION_PARAMS modify column PARAM_VALUE varchar(4000) character set utf8;
alter table PARTITION_KEYS modify column PKEY_COMMENT varchar(4000) character set utf8;
-- 修改索引注解
alter table INDEX_PARAMS modify column PARAM_VALUE varchar(4000) character set utf8;
```

### 添加数据

```java
-- 加载数据
LOAD DATA [LOCAL] INPATH '文件路径' [OVERWRITE] INTO TABLE mytable;
-- 插入数据使用insert int用当作一个mapreduce去执行非常缓慢
-- 可以使用insert+select将一张表的数据部分插入到新表中，类似视图的创建
INSERT [OVERWRITE] TABLE mytable partition(dt='xxxxxx')select c1,c2 from src_table where......
```

### 查询数据

```java
-- 单表查询
SELECT [ALL|DISTINCT] select_expr,select_expr,...
FROM table_reference
[WHERE where_condition]
[GROUP BY col_list]
[HAVING having_condition]
[ORDER BY col_list]
[LIMIT [offset,]rows];
-- 连接查询
table_reference [INNER] JOIN table_factor [join_condition] -- 内连接
table_interface {left} [OUTER] JOIN table_reference join_condition	-- 左【外】连接 
```

### 常用函数

```java
-- 查看所有可用函数
show functions;
-- 查看函数的使用方式
describe function extended func_name;
-- 字符串函数
select length("str");	-- 查询字符串长度
select reverse("str"); 	--反转字符串
select concat("str1","str2")	-- 字符串拼接
select concat_ws(separator,[string | array(string)]+) -- 以separator拼接
select substr("str",-2) 	-- 字符串截取，从1开始，负数从尾部开始
select substr("str",2,2) 	-- 从2开始，截取两个
select split("str1 str2",' ') -- 分割字符串
-- 日期函数
select current_data()	-- 获取当前日期
select unix_timestamp() -- 当前获取unix时间戳
select unix_timestamp("2222-02-02 02:02:02","yyyy-MM-dd HH:mm:ss") -- 日期转unix时间戳
select from_unixtime(0,"yyyy-MM-dd HH:mm:ss") -- 日期转时间戳
select datadiff("data1","data2") -- 日期比较函数，格式yyyy-MM-dd或yyyy-MM-dd HH:mm:ss
select data_add("data",2)	-- 日期增加函数
select data_sub("data",2)	-- 日期减少函数
-- 数学函数
select round(1.2345,3) 	-- 精度
select rand(int seed)	-- 取随机数
-- limit限制函数
select * from mytable limit 3;
-- if条件函数
select if(condition, TrueValue, FalseValue) from mytable;
-- 条件转换函数
select case col
when cond1 then xxx1
when cond2 then xxx2
else xxx3 end
from mytable;
-- 空值转换函数
select nvl(v1,v2) -- 若v1为空，用v2替换
```
