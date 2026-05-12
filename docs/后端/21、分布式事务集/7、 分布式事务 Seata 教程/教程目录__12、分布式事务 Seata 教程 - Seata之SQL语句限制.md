# 12、分布式事务 Seata 教程 - Seata之SQL语句限制
- 来源：https://ddkk.com/zhuanlan/transaction/5/12.html
- 分类：分布式事务
- 分组：教程目录
### 前言

以下内容摘自[官网](http://seata.io/zh-cn/docs/user/sqlreference/sql-restrictions.html)

在使用Seata 的时候，对SQL语句还是有很多限制，所以在使用的时候需要格外注意这个问题（较新版本可能已支持）。

### SQL限制

Seata 事务目前支持 INSERT、UPDATE、DELETE 三类 DML 语法的部分功能，这些类型都是已经经过Seata开源社区的验证。SQL 的支持范围还在不断扩大，建议在本文限制的范围内使用。

**使用限制**：

- 不支持 SQL 嵌套
- 不支持多表复杂 SQL
- 不支持存储过程、触发器
- 不支持批量更新 SQL（新版已支持）

#### DML语句

本文介绍 DML 语句类型、SQL 实例以及 Seata 是否支持，帮助您在 Seata 更顺畅的使用 SQL。

#### SQL修饰

Seata 的隔离级别默认为读未提交，该模式下本文表中的 select 语句的 SQL 修饰用法都是支持的；使用 for update 代理可以让 Seata 达到读已提交，该模式下 select 语句的用法只能部分支持。

#### 函数

在本文下面的表列出了 DQL 语句和 DML 语句对函数的支持情况。需要注意的是，在 DML 语句中使用函数，不能将其作为主键。

DML语句支持

类型
是否支持

CONCAT(string2[,…])
是

INSTR(string,substring)
是

LCASE(string2)
是

LEFT(string2,length)
是

LENGTH(string)
是

LOAD_FILE(file_name)
是

LOCATE(substring,string[,start_position])
是

LPAD(string2,length,pad)
是

LTRIM(string2)
是

REPEAT(string2,count)
是

REPLACE(str,search_str,replace_str)
是

RPAD(string2,length,pad)
是

RTRIM(string2)
是

STRCMP(string1,string2)
是

SUBSTRING(str,position[,length])
是

TRIM([[BOTH\LEADING\TRAILING][padding]FROM]string2)
是

UCASE(string2)
是

RIGHT(string2,length)
是

SPACE(count)
是

ABS(number2)
是

BIN(decimal_number)
是

CEILING(number2)
是

CONV(number2,from_base,to_base)
是

FLOOR(number2)
是

FORMAT(number,decimal_places)
是

HEX(DecimalNumber)
是

LEAST(number,number2[,…])
是

MOD(numerator,denominator)
是

POWER(number,power)
是

RAND([seed])
是

ROUND(number[,decimals])
是

SIGN(number2)
是

SQRT(number2)
是

ADDTIME(date2,time_interval)
是

CONVERT_TZ(datetime2,fromTZ,toTZ)
是

CURRENT_DATE()
是

CURRENT_TIME()
是

CURRENT_TIMESTAMP()
是

DATE(datetime)
是

DATE_ADD(date2,INTERVALd_valued_type)
是

DATE_FORMAT(datetime,FormatCodes)
是

DATE_SUB(date2,INTERVALd_valued_type)
是

DATEDIFF(date1,date2)
是

DAY(date)
是

DAYNAME(date)
是

DAYOFWEEK(date)
是

DAYOFYEAR(date)
是

EXTRACT(interval_nameFROMdate)
是

MAKEDATE(year,day)
是

MAKETIME(hour,minute,second)
是

MONTHNAME(date)
是

NOW()
是

SEC_TO_TIME(seconds)
是

STR_TO_DATE(string,format)
是

TIMEDIFF(datetime1,datetime2)
是

TIME_TO_SEC(time)
是

WEEK(date_time[,start_of_week])
是

YEAR(datetime)
是

DAYOFMONTH(datetime
) 是

HOUR(datetime)
是

LAST_DAY(date)
是

MICROSECOND(datetime)
是

MONTH(datetime)
是

MINUTE(datetime)
是

FIRST()
否

LAST()
否

MIN()
否

MAX()
否

AVG()
否

SUM()
否

COUNT()
否

DQL语句支持

类型
读未提交
读已提交

CONCAT(string2[,…])
是
是

INSTR(string,substring)
是
是

LCASE(string2)
是
是

LEFT(string2,length)
是
是

LENGTH(string)
是
是

LOAD_FILE(file_name)
是
是

LOCATE(substring,string[,start_position])
是
是

LPAD(string2,length,pad)
是
是

LTRIM(string2)
是
是

REPEAT(string2,count)
是
是

REPLACE(str,search_str,replace_str)
是
是

RPAD(string2,length,pad)
是
是

RTRIM(string2)
是
是

STRCMP(string1,string2)
是
是

SUBSTRING(str,position[,length])
是
是

TRIM([[BOTH\LEADING\TRAILING][padding]FROM]string2)
是
是

UCASE(string2)
是
是

RIGHT(string2,length)
是
是

SPACE(count)
是
是

ABS(number2)
是
是

BIN(decimal_number)
是
是

CEILING(number2)
是
是

CONV(number2,from_base,to_base)
是
是

FLOOR(number2)
是
是

FORMAT(number,decimal_places)
是
是

HEX(DecimalNumber)
是
是

LEAST(number,number2[,…])
是
是

MOD(numerator,denominator)
是
是

POWER(number,power)
是
是

RAND([seed])
是
是

ROUND(number[,decimals])
是
是

SIGN(number2)
是
是

SQRT(number2)
是
是

ADDTIME(date2,time_interval)
是
是

CONVERT_TZ(datetime2,fromTZ,toTZ)
是
是

CURRENT_DATE()
是
是

CURRENT_TIME()
是
是

CURRENT_TIMESTAMP()
是
是

DATE(datetime)
是
是

DATE_ADD(date2,INTERVALd_valued_type)
是
是

DATE_FORMAT(datetime,FormatCodes)
是
是

DATE_SUB(date2,INTERVALd_valued_type)
是
是

DATEDIFF(date1,date2)
是
是

DAY(date)
是
是

DAYNAME(date)
是
是

DAYOFWEEK(date)
是
是

DAYOFYEAR(date)
是
是

EXTRACT(interval_nameFROMdate)
是
是

MAKEDATE(year,day)
是
是

MAKETIME(hour,minute,second)
是
是

MONTHNAME(date)
是
是

NOW()
是
是

SEC_TO_TIME(seconds)
是
是

STR_TO_DATE(string,format)
是
是

TIMEDIFF(datetime1,datetime2)
是
是

TIME_TO_SEC(time)
是
是

WEEK(date_time[,start_of_week])
是
是

YEAR(datetime)
是
是

DAYOFMONTH(datetime)
是
是

HOUR(datetime)
是
是

LAST_DAY(date)
是
是

MICROSECOND(datetime)
是
是

MONTH(datetime)
是
是

MINUTE(datetime)
是
是

FIRST()
是
否

LAST()
是
否

MIN()
是
否

MAX()
是
否

AVG()
是
否

SUM()
是
否

COUNT()
是
否
