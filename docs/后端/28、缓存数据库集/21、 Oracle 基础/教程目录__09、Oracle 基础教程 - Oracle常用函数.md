# 09、Oracle 基础教程 - Oracle常用函数
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/9.html
- 分类：缓存数据库
- 分组：教程目录
Oracle是一种关系型数据库管理系统，它提供了许多内置函数，以便用户可以更轻松地处理数据。

## 1. 字符串函数

**（1）lengthb/length**

计算字符串长度

- lengthb求得是**字节（Byte，1Byte=8bit）长度**
- length求得是**字符长度**

```java
select lengthb('中') from dual;
select length('中') from dual;
```

ZHS16GBK下，lengthb(‘中’)为2字节，length(‘中’)为1（个字符），即一个字符占两个字节

数据库中存储的CHAR(19) 表示占19个字节。

**（2）SUBSTR**

`SUBSTR`用于截取字符串的子串，需要注意的是Oracle 数据库中字符串的下标是从 1 开始而不是从 0 开始的。该函数的语法如下：

```java
SUBSTR( string, start [, length] )
```

- string是要截取的字符串
- start是要开始截取的位置
- length是要截取的子串长度（可选）

**e.g.**

```java
select substr('abcdefg',0,3) from dual;  
```

输出

> abc

```java
select substr('abcdefg',1,3) from dual;  
```

输出

> abc

```java
select substr('abcdefg',2,3) from dual;   
```

输出

> bcd

```java
select substr('abcdefg',-3,3) from dual;    
```

输出

> efg

**（3）INSTR**

`INSTR` 在字符串中搜索指定字符，返回发现指定字符的位置。该函数的语法如下：

```java
INSTR( string, substring [, start_position [, occurrence ]] )
```

- string是要搜索的字符串
- substring是要查找的子
- start_position是要开始搜索的位置（可选）
- occurrence是要查找的子串出现的次数（可选）

**e.g.**

```java
Select instr('oracle training','ai') From dual;  
```

输出

> 10

**（4）CONCAT**

`CONCAT`连接两个字符串

**e.g.**

```java
SELECT CONCAT('Hello ', 'World', '!') FROM dual;
```

输出

> Hello World!

按要求更新指定列：

```java
Update t_skzy Set website=concat('http://'，website) Where website Not Like 'http%' And website Like '%.%'
```

**（5）REPLACE**

`REPLACE`用于替换字符串的指定子串。该函数的语法如下：

```java
REPLACE( string, substring1 [, substring2] )
```

- string是要替换子串的字符串
- substring1是要被替换的子串
- substring2是用来替换substring1的字符串（可选）

**e.g.**

```java
SELECT REPLACE('Hello World!', 'Hello', 'Goodbye') FROM dual;
```

输出：

> “Goodbye World！”

**（6）TRIM, LTRIM, RTRIM**

**TRIM**：去除字符串的空格或指定字符

语法如下：

```java
TRIM([leading|trailing|both] [trim_character] FROM string)
```

- leading|trailing|both：可选参数，用于指定去除字符串的空格或指定字符是在字符串的前面、后面还是两边，默认为 both。
- trim_character：可选参数，用于指定要去除的字符，默认为字符串中的空格。
- string：必需参数，要去除空格或指定字符的字符串。

**LTRIM** ：去除字符串左侧的空格或指定字符。

语法如下：

```java
LTRIM([trim_character] FROM string)
```

- trim_character：可选参数，用于指定要去除的字符，默认为字符串中的空格。
- string：必需参数，要去除空格或指定字符的字符串。

**e.g.**

```java
Select ltrim('trimtest ltrim ','trim') From dual  
```

输出

> test ltrim

**RTRIM** ：去除字符串右侧的空格或指定字符。

语法如下：

```java
RTRIM([trim_character] FROM string)
```

- trim_character：可选参数，用于指定要去除的字符，默认为字符串中的空格。
- string：必需参数，要去除空格或指定字符的字符串。

**（7）ASCII**

`ASCII`返回给定字符串中第一个字符的ASCII代码值。

**e.g.**

```java
SELECT ASCII('A') FROM dual;
```

输出

> 65

**（8）NVL**

```java
NVL( string1， replace_with)
```

如果string1为NULL，则`NVL`函数返回replace_with的值，否则返回string1的值。

例如，以下查询将返回一个包含员工的职务和部门名称的结果，如果员工所在的部门为空，则返回“Unknown Department”：

```java
SELECT job_id, NVL(department_name, 'Unknown Department') 
FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id;
```

**（9）INITCAP,LOWER,UPPER**

- INITCAP 将字符串第一个字母变为大写
- LOWER 将字符串所有字母小写
- UPPER 将字符串所有字母大写

## 2. 数学函数

**（1） ROUND**

`ROUND`函数用于将数字四舍五入到指定的小数位数。例如将数字3.1415926四舍五入到两个小数位：

```java
SELECT ROUND(3.1415926, 2) AS RoundedNumber FROM dual;
```

输出

> 3.14

**（2）TRUNC**

`TRUNC`函数用于将数字截断为指定的小数位数。例如将数字3.1415926截断为两个小数位：

```java
SELECT TRUNC(3.1415926, 2) AS TruncatedNumber FROM dual;
```

输出

> 3.14

**（3）ABS**

`ABS`函数用于计算数字的绝对值。例如计算数字-10的绝对值：

```java
SELECT ABS(-10) AS AbsoluteValue FROM dual;
```

输出

> 10

**（4）POWER**

`POWER`函数用于计算数字的幂。例如计算2的3次方：

```java
SELECT POWER(2, 3) AS PowerValue FROM dual;
```

输出

> 8

**（5）MOD**

`MOD`取模运算，返回两个数相除的余数。

**e.g.**

```java
SELECT MOD(5, 2) FROM dual;
```

输出

> 1

**（6）其他**

- CEIL: 返回比输入值大的最小整数。
- FLOOR: 返回比输入值小的最大整数。
- MOD: 返回两个数值相除的余数。

## 3. 日期函数

**（1）CURRENT_DATE**

CURRENT_DATE是一个SQL标准函数，返回当前日期（不带时间），可以在SELECT语句中使用。例如：

```java
SELECT CURRENT_DATE FROM DUAL; 
```

返回当前日期，格式为YYYY-MM-DD。

**（2）SYSDATE**

`SYSDATE`是Oracle的系统函数，返回当前日期和时间（数据库服务器所在时区的日期和时间，而不是客户端的时区），包括日期和精确到秒的时间。例如，获取当前日期和时间：

```java
SELECT SYSDATE AS CurrentDateTime FROM dual;
```

返回当前日期和时间，格式为YYYY-MM-DD HH:MI:SS。

**（2）ADD_MONTHS函数**

`ADD_MONTHS`函数用于在日期上添加指定的月数。例如，在当前日期上添加3个月：

```java
SELECT ADD_MONTHS(SYSDATE, 3) AS FutureDate FROM dual;
```

**（3）MONTHS_BETWEEN函数**

`MONTHS_BETWEEN`函数用于计算两个日期之间的月数。例如，计算两个日期之间的月数：

```java
SELECT MONTHS_BETWEEN('01-JAN-2022', '01-JAN-2021') AS MonthDifference FROM dual;
```

输出

> 12

**（4）TO_CHAR/TO_DATE**

- TO_CHAR函数可以将日期型数据转换为字符串
- TO_DATE函数则可以将字符串型数据转换为日期型数据

**e.g.**

```java
select to_char(current_date,'yyyy-mm-dd hh24:mi:ss') from dual;
select to_date('1999/01/01','yyyy/mm/dd') from dual;
```

## 4. 聚合函数

聚合函数用于对数据进行聚合计算，如求和、平均数、最大值、最小值等，聚焦函数不能作为条件用在`where`子句中，需要与`having`，`group`一起使用

**（1）COUNT**

`COUNT`函数用来计算某个表或某个查询语句返回的结果集中的行数。如果指定了`DISTINCT`关键字，则将去除重复的行计入计数。

例如，查询含员工总数：

```java
SELECT COUNT(*) FROM employees;
```

**（2）SUM**

`SUM`函数用来计算某个表或某个查询语句返回的结果集中某个列的数值之和。

例如，查询员工月薪总和：

```java
SELECT SUM(salary) FROM employees;
```

**（3）AVG**

`AVG`函数用来计算某个表或某个查询语句返回的结果集中某个列的数值平均值，其语法如下：

例如，查询员工平均月薪：

```java
SELECT AVG(salary) FROM employees;
```

**（4）MAX/MIN**

`MAX/MIN`分别用来计算某个表或某个查询语句返回的结果集中某个列的数值最大值或最小值。

例如，查询含员工最高月薪：

```java
SELECT MAX(salary) FROM employees;
```

## 5. 其他

**（1）DECODE**

`DECODE`：函数用来根据不同的条件返回不同的值，其语法如下：

```java
DECODE(value， if1， then1， if2，then2， if3，then3， . . . else )
```

当每个value值被测试，如果value的值为if1，Decode 函数的结果是then1；如果value等于if2，Decode函数结果是then2；等等。如果value结果不等于给出的任何配对时，Decode 结果就返回else 。可以给出多个if/then 配对。

例如，员工信息表中有出生年份和州名，需要统计不同年份、不同大洲的人数。

即形成如下形式的统计表：

```java
Select csrq 年份,
sum(decode(zm,'大洋洲',cou)) 大洋洲,
sum(decode(zm,'欧洲',cou)) 欧洲,
sum(decode(zm,'亚洲',cou)) 亚洲,
sum(decode(zm,'非洲',cou)) 非洲,
sum(decode(zm,'美洲',cou)) 美洲 From (
select t.zm,substr(csrq,1,4) csrq,Count(*) cou from employee t Group By t.zm,substr(csrq,1,4)) Group By csrq Order By csrq
```

**（2）CASE**

`CASE`根据指定的条件返回不同的值。该函数与`DECODE`功能类似，但它更加灵活，可以嵌套使用，其语法如下：

```java
CASE expression
  WHEN value1 THEN result1
  [WHEN value2 THEN result2 ...]
  [ELSE default]
END
```

- expression是要比较的值
- value1、value2等是要比较的条件
- result1、result2等是对应的返回值（如果expression与某个value相等，则返回相对应的result）
- default是一个可选项，表示当expression与所有value都不相等时要返回的默认值。

例如实现前述功能的SQL语句如下：

```java
Select substr(csrq,1,4) 出生年份, 
Sum(Case When zm='大洋洲' Then 1 else 0 End) 大洋洲,
Sum(Case When zm='欧洲' Then 1 Else 0 End) 欧洲,
Sum(Case When zm='亚洲' Then 1 Else 0 End) 亚洲,
Sum(Case When zm='非洲' Then 1 Else 0 End) 非洲,
Sum(Case When zm='美洲' Then 1 Else 0 End) 美洲
From employee Group By substr(csrq,1,4) Order By 出生年份
```

**（3）ROLLUP/CUBE**

- ROLLUP是GROUP BY子句的一种扩展，可以为每个分组返回小计记录以及为所有分组返回总计记录。
- CUBE也是GROUP BY子句的一种扩展，可以返回每一个列组合的小计记录，同时在末尾加上总计记录。

例如形成如下形式的统计表：

```java
Select 年份,Sum(大洋洲) 大洋洲,Sum(欧洲) 欧洲,Sum(亚洲) 亚洲,Sum(非洲) 非洲,Sum(美洲) 美洲 From(
Select csrq 年份,
sum(decode(zm,'大洋洲',cou)) 大洋洲,
sum(decode(zm,'欧洲',cou)) 欧洲,
sum(decode(zm,'亚洲',cou)) 亚洲,
sum(decode(zm,'非洲',cou)) 非洲,
sum(decode(zm,'美洲',cou)) 美洲 From (
select t.zm,substr(csrq,1,4) csrq,Count(*) cou from employee t Group By t.zm,substr(csrq,1,4)) Group By csrq)
Group By Rollup(年份) Order By 年份
```

**（4）MD5**

`DBMS_OBFUSCATION_TOOLKIT.MD5`是MD5编码的数据包函数，该函数只能直接在程序包中调用，不能直接应用于SELECT语句。

`DBMS_OBFUSCATION_TOOLKIT.MD5`返回的字串，是RAW类型，要正确显示，需要经过`Utl_Raw.Cast_To_Raw`转换：

```java
CREATE OR REPLACE Function MD5(passwd Varchar2)
Return Varchar
Is
md5_output Varchar2(32);
Begin
md5_output:=utl_raw.cast_to_raw(DBMS_OBFUSCATION_TOOLKIT.MD5(INPUT_STRING=>passwd));
Return md5_output;
End;
```

**（5）CAST**

`CAST`函数用于将一个数据类型转换为另一种数据类型。

- 将一个字符串转换为数值型数据：

```java
SELECT CAST('123' AS NUMBER) FROM dual;
```

- 将一个日期字符串转换为日期类型：

```java
SELECT CAST('2022-04-21' AS DATE) FROM dual;
```

**（6）查询Blob/Clob类型字段**

DBMS_LOB是Oracle数据库提供的一个用于操作大型对象（LOB）数据的包。其中，LOB包括四种类型：CLOB、NCLOB、BLOB和BFILE。

DBMS_LOB包提供了一系列子程序，可以用于读取、写入、截断、复制、比较等LOB对象的操作：

- DBMS_LOB.READ：用于从LOB对象中读取数据；
- DBMS_LOB.WRITE：用于向LOB对象中写入数据；
- DBMS_LOB.TRIM：用于截断LOB对象中的数据；
- DBMS_LOB.COPY：用于将LOB对象中的数据复制到另一个LOB对象中；
- DBMS_LOB.COMPARE：用于比较两个LOB对象中的数据是否相同。

DBMS_LOB包有多个内置函数：

- dbms_lob.append：追加LOB值
- dbms_lob.substr：截取LOB值
- dbms_lob.instr：查找LOB值中的字符串位置
- dbms_lob.getlength：查询Blob/Clob类型字段的长度

**e.g.**

```java
Select * From table_name Where dbms_lob.instr(Column,utl_raw.cast_to_raw('内容',1,1))>0;
```
