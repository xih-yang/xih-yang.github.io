# 01、Oracle 基础教程 - Oracle数据类型
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/1.html
- 分类：缓存数据库
- 分组：教程目录
ORACLE基本数据类型，又叫内置数据类型（ built-in datatypes)可以按类型分为：字符串类型、数字类型、大对象类型（LOB类型）、日期类型、LONG RAW& RAW类型、ROWID & UROWID类型。

## 1. 字符类型

数据类型
长度
说明

CHAR(n BYTE/CHAR)
默认1字节，n值最大为2000
末尾填充空格以达到指定长度，超过最大长度报错。默认指定长度为字节数，字符长度可以从1字节到四字节。

NCHAR(n)
默认1字符，最大存储内容2000字节
末尾填充空格以达到指定长度，n为Unicode字符数。默认为1字节。

NVARCHAR2(n)
最大长度必须指定，最大存储内容4000字节
变长类型。n为Unicode字符数

VARCHAR2(n BYTE/CHAR)
最大长度必须指定，至少为1字节或者1字符，n值最大为4000
变长类型。超过最大长度报错。默认存储的是长度为0的字符串。

VARCHAR
同VARCHAR2
不建议使用

## 2. 数字类型

数据类型
长度
说明

NUMBER(p[,s])
1-22字节。 P取值范围1到38 S取值范围-84到127
存储定点数，值的绝对值范围为1.0 x 10 -130至1.0 x 10 126。值大于等于1.0 x 10 126时报错。p为有意义的10进制位数，正值s为小数位数，负值s表示四舍五入到小数点左部多少位。

BINARY_FLOAT
5字节，其中有一长度字节。
32位单精度浮点数类型。符号位1位，指数位8位，尾数位23位。

BINARY_DOUBLE
9字节，其中有一长度字节。
64位双精度浮点数类型。

## 3. 大对象类型

数据类型
长度
说明

BLOB
最大为(4GB-1)*数据库块大小
存储非结构化二进制文件。支持事务处理。

CLOB
最大为(4GB-1)*数据库块大小
存储单字节或者多字节字符数据。支持事务处理。

NCLOB
最大为(4GB-1)*数据库块大小
存储Unicode数据。支持事务处理。

BFILE
最大为2 32-1字节
LOB地址指向文件系统上的一个二进制文件，维护目录和文件名。不参与事务处理。只支持只读操作。

## 4. 时间及时间间隔类型

时间字段
时间类型有效值
时间间隔类型有效值

YEAR
-4712至9999，包括0
任何整数

MONTH
01至12
0至11

DAY
01至31
任何整数

HOUR
00 至 23
0 至 23

MINUTE
00 至 59
0至 59

SECOND
00 to 59.9(n)，9(n)不适用与DATE类型
0 to 59.9(n)

TIMEZONE_HOUR
-1至14，不适用与DATE和TIMESTAMP类型
不可用

TIMEZONE_MINUTE
00至59，不适用与DATE和TIMESTAMP类型 不可用

TIMEZONE_REGION

不可用

TIMEZONE_ABBR

不可用

数据类型
长度
说明

DATE
7字节
默认值为SYSDATE的年、月，日为01。包含一个时间字段，若插入值没有时间字段，则默认值为：00:00:00 or 12:00:00 for 24-hour and 12-hour clock time。没有分秒和时间区。

TIMESTAMP [(fractional_seconds_precision)]
7至11字节
fractional_seconds_precision为Oracle存储秒值小数部分位数，默认为6，可选值为0到9。没有时间区。

TIMESTAMP [(fractional_seconds_precision)] WITH TIME ZONE
13字节
使用UTC，包含字段YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, TIMEZONE_HOUR, TIMEZONE_MINUTE

TIMESTAMP [(fractional_seconds_precision)] WITH LOCAL TIME ZONE
7至11字节
存时使用数据库时区，取时使用回话的时区。

INTERVAL YEAR [(year_precision)] TO MONTH
5字节
包含年、月的时间间隔类型。year_precision是年字段的数字位数，默认为2，可取0至9。

INTERVAL DAY [(day_precision)][(fractional_seconds_precision)]
11字节
day_precision是月份字段的数字位数，默认为2，可取0至9。TO SECOND

## 5. 其他类型

数据类型
长度
说明

LONG
最大为2GB
变长类型，存储字符串。创建表时不要使用该类型。

RAW(n)
最大2000字节，n为字节数，必须指定n
变长类型，字符集发生变化时不会改变值。

LONG RAW
最大为2GB
变长类型，不建议使用，建议转化为BLOB类型，字符集发生变化时不会改变值。

ROWID
10字节
代表记录的地址。显示为18位的字符串。用于定位数据库中一条记录的一个相对唯一地址值。通常情况下，该值在该行数据插入到数据库表时即被确定且唯一。

UROWID(n)
｜
