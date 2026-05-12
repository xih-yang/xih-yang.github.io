# 11、Oracle 入门教程 - Oracle SQL语言之内置函数
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/11.html
- 分类：缓存数据库
- 分组：教程目录
## 一、Oracle 内置函数

SQL语言是一种脚本语言，它提供了大量内置函数，使用这些内置函数可以大大增强SQL语言的运算和判断功能。本节将对Oracle中的一些常用函数进行介绍，如字符类函数、数字类函数、日期和时间类函数、转换类函数、聚集类函数等。

### 1.1 字符类函数

**1.1.1 字符类函数介绍**

字符类函数是专门用于字符处理的函数，处理的对象可以是字符或字符串常量，也可以是字符类型的列。

常用的字符类函数有如下几种：

- ASCII(c)函数和CHR(i)函数
- CONCAT(s1, s2)函数
- INITCAP(s)函数
- INSTR(s1,s2[,i][,j])函数
- LENGTH(s)函数**
- LOWER(s)函数和UPPER(s)函数**
- LTRIM(s1,s2)函数、RTRIM(s1,s2)函数和TRIM(s1,s2)函数
- REPLACE(s1,s2[,s3])函数
- SUBSTR(s,i,[j])函数

**1.1.2 ASCII(c)函数和CHR(i)函数**

ASCII©函数用于返回一个字符的ASCII码，其中参数c表示一个字符；

CHR(i)函数用于返回给出ASCII码值所对应的字符，i表示一个ASCII码值。

从这两个函数的功能中可以看出，它们二者之间具有互逆的关系。

```java
select ascii('Z') Z, ascii('H') H, ascii('D') D , ascii(' ') space from dual;
```

```java
select chr(90) Z, chr(72) H, chr(68) D , chr(32) space from dual;
```

dual是Oracle系统内部提供的一个用于实现临时数据计算的特殊表，它只有一个列DUMMY，类型为VARCHAR2(1)

**1.1.3 CONCAT(s1,s2)函数**

该函数将字符串s2连接到字符串s1的后面，如果s1为null，则返回s2；如果s2为null，则返回s1；如果s1和s2都为空，则返回null。

```java
select concat('hello ', ' world') a,
       concat('', ' world') b,
       concat('hello ', '') c,
       concat('', '') d
  from dual;
```

**1.1.4 INITCAP(s)函数**

该函数将字符串s的每个单词的第一个字母大写，其他字母小写。单词之间用空格、控制字符、标点符号来区分。

```java
select initcap('this is my book!') information from dual;
```

**1.1.5 INSTR(s1,s2[,i][,j])函数**

该函数用于返回字符s2在字符串s1中第j次出现时的位置，搜索从字符串s1的第i个字符开始。

当没有发现要查找的字符时，该函数返回值为0；如果i为负数，那么搜索将从右到左进行，但函数的返回位置还是按从左到右来计算。其中，s1和s2均为字符串；i和j均为整数，默认值为1。

```java
select instr('this is my book!', 's') a,
       instr('this is my book!', 'b') b,
       instr('this is my book!', 'e') c
  from dual;
```

**1.1.6 LENGTH(s)函数**

该函数用于返回字符串s的长度，如果s为null，则返回值为null。

```java
select length('this') a, 
       length('is') b, 
       length(' ') c, 
       length('') d
  from dual;
```

**1.1.7 LOWER(s)函数和UPPER(s)函数**

LOWER（s）函数和UPPER函数（s）分别用于返回字符串s的小写形式和大写形式，这两个函数经常出现在WHERE子句中。

```java
select lower('MY BOOK!') a, 
       lower('my BOOK!') b, 
       upper('my book!') c, 
       upper('my BOOK!') d
  from dual;
```

**1.1.8 LTRIM(s1,s2)函数、RTRIM(s1,s2)函数和TRIM(s1,s2)函数**

- LTRIM(s1,s2)函数用来删除字符串s1左边的字符串s2
- RTRIM(s1,s2)函数用来删除字符串s1右边的字符串s2
- TRIM(s1,s2)函数**用来删除字符串s1左右两端的字符串s2。

如果在这3个函数中不指定字符串s2，则表示去除相应方位的空格。

```java
select ltrim('book!', 'b') a,
       ltrim(' book!') b,
       RTRIM('book!', '!') c,
       RTRIM('book! ') d,
       TRIM(' boob ') e
  from dual;
```

**1.1.9 REPLACE(s1,s2[,s3])函数**

该函数使用s3字符串替换出现在s1字符串中的所有s2字符串，并返回替换后的新字符串，其中，s3的默认值为空字符串。

```java
select replace('book!', 'b','o') a,
       replace('book!', 'o','') b
  from dual;
```

**1.1.10 SUBSTR(s,i,[j])函数**

该函数表示从字符串s的第i个位置开始截取长度为j的子字符串。如果省略参数j，则直接截取到尾部。其中，i和j为整数。

```java
select SUBSTR('book!', 2) a, 
       SUBSTR('book!', 1, 3) b 
  from dual;
```

### 1.2 数字类函数

**1.2.1 数字类函数介绍**

数字类函数主要用于执行各种数据计算，所有的数字类函数都有数字参数并返回数字值。Oracle系统提供了大量的数字类函数，这些函数大大增强了Oracle系统的科学计算能力。

在上表中列举了若干三角函数，这些三角函数的操作数和返回值都是弧度，而不是角度。

**1.2.2 CEIL(n)函数**

该函数返回大于或等于数值n的最小整数，它适合于一些比较运算。

```java
select ceil(4) a, 
       ceil(4.1) b, 
       ceil(-4.1) c
  from dual;
```

**1.2.3 ROUND(n1,n2)函数**

该函数返回舍入小数点右边n2位的n1的值，n2的默认值为0，这会返回小数点最接近的整数。如果n2为负数，就舍入到小数点左边相应的位上，n2必须是整数。

```java
select round(4, 2) a, 
       round(4.1, 2) b, 
       round(4.111, 2) c, 
       round(-4.1, 2) d
  from dual;
```

**1.2.4 POWER(n1,n2)函数**

该函数返回n1的n2次方。

```java
select power(2, 2) a, 
       power(2.5, 2) b,
       power(-2.5, 3) c,
       power(2, -2) d
  from dual;
```

### 1.3 日期和时间类函数

**1.3.1 日期和时间类函数介绍**

在Oracle 11g中，系统提供了许多用于处理日期和时间的函数，通过这些函数可以实现计算需要的特定日期和时间，常用的日期和时间函数如图所示。

日期类型的默认格式是“DD-MON-YY”，其中DD表示两位数字的“日”，MON表示3位数字的“月份”。YY表示两位数字的“年份”，例如，“01-10月-11”表示2011年10月1日。

**1.3.2 SYSDATE()函数**

该函数返回系统当前的日期。

```java
select sysdate from dual;
```

**1.3.3 ADD_MONTHS(d,i)函数**

该函数返回日期d加上i个月之后的结果。其中，i为任意整数。

```java
select add_months(sysdate, 6) newdate  from dual;
```

### 1.4 转换类函数

**1.4.1 转换类函数介绍**

在操作表中的数据时，经常需要将某个数据从一种类型转换为另外一种数据类型，这时就需要转换类型函数。比如常见的，有把具有“特定格式”字符串转换为日期、把数字转换成字符等。

常用的转换函数如图所示。

**1.4.2 TO_CHAR()函数**

该函数实现将表达式转换为字符串，format表示字符串格式。

```java
select to_char(sysdate, 'yyyy-mm-dd') as today from dual;
```

**1.4.3 TO_NUMBER(s[,format[lan]])函数**

该函数将返回字符串s代表的数字，返回值按照format格式进行显示，format表示字符串格式，lan表示所使用的语言。 【

```java
select to_number('16') as a,
       to_number('16','xxx') as b, 
       to_number('2f','xxx') as c
       from dual;
```

### 1.5 聚集类函数

**1.5.1 聚集类函数介绍**

使用聚合类函数可以针对一组数据进行计算，并得到相应的结果。比如常用的操作有计算平均值、统计记录数、计算最大值等。

Oracle 11g所提供的主要聚合函数如图所示。

```java
select avg(sal) avg, 
       count(ename) count,
       max(sal) max,
       min(sal) min,
       sum(sal) sum,
       variance(sal) variance,
       stddev(sal) stddev
from scott.emp
```
