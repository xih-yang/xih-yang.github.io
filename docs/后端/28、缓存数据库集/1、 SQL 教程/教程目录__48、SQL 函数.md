# 48、SQL 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/48.html
- 分类：缓存数据库
- 分组：教程目录
任何一个数据库系统都内置了数量相当可观的又非常实用的小函数

这些函数可以根据实现功能的不同划分为不同的类，当然，除了很明显的日期时间和字符串函数两大类外

我们还可以把这些函数归纳为两大类： Aggregate 函数 和 Scalar 函数

这两个英文单词，字面理解它的意思即可

### SQL Aggregate 函数

SQL**Aggregate** 函数用于计算从列中取得的值，并返回一个单一的值

常用的Aggregate 函数有：

函数
说明

AVG()
返回平均值

COUNT()
返回行数

FIRST()
返回第一个记录的值

LAST()
返回最后一个记录的值

MAX()
返回最大值

MIN()
返回最小值

SUM()
返回总和

## SQL Scalar 函数

SQLScalar 函数基于输入值，返回一个单一的值

常用的Scalar 函数有：

函数
说明

UCASE()
将某个字段转换为大写

LCASE()
将某个字段转换为小写

MID()
从某个文本字段提取字符，MySQL 中使用

SubString(fieldname，1，end)
从某个文本字段提取字符

LEN()
返回某个文本字段的长度

ROUND()
对某个数值字段进行指定小数位数的四舍五入

NOW()
返回当前的系统日期和时间

FORMAT()
格式化某个字段的显示方式
