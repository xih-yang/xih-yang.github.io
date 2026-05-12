# 25、MariaDB 实用功能
- 来源：https://ddkk.com/zhuanlan/db/mariadb/25.html
- 分类：缓存数据库
- 分组：教程目录
本章包含最常用功能的列表，提供定义，说明和示例。

## MariaDB 聚合函数

最常用的聚合函数如下 –

S.No
名称与描述

1
COUNT

它对记录总数进行统计。

**示例** – SELECT COUNT（*）FROM customer_table;

2
MIN

它揭示了一组记录的最小值。

**示例** – SELECT组织，MIN（帐户）FROM合同GROUP BY组织;

3

**MAX**

它揭示了一组记录的最大值。

**示例** – SELECT组织，MAX（account_size）FROM合同GROUP BY组织;

4

**AVG**

它计算一组的记录的平均值。

**示例** -选择AVG（account_size）FROM合同;

5

**SUM**

它计算一组记录的总和。

**示例** – SELECT SUM（account_size）FROM合同;

## MariaDB年龄计算

**TIMESTAMPDIFF**函数提供了一种计算年龄 –

```sql
SELECT CURDATE() AS today;
SELECT ID, DOB, TIMESTAMPDIFF(YEAR,DOB,'2015-07-01') AS age FROM officer_info;
```

## MariaDB字符串连接

CONCAT函数在连接操作后返回结果字符串。 您可以使用一个或多个参数。 检查其语法如下 –

```sql
SELECT CONCAT(item, item,...);
```

查看以下示例 –

```sql
SELECT CONCAT('Ram', 'bu', 'tan');
Output:Rambutan
```

## MariaDB日期/时间函数

以下是重要的日期函数 –

S.No
名称与描述

1
CURDATE()

它以yyyy-mm-dd或yyyymmdd格式返回日期。

****示例 – SELECT CURDATE();

2

**DATE()**

它以多种格式返回日期。

****示例-CREATE TABLE product_release_tbl(x DATE);

3

**CURTIME()**

它以HH：MM：SS或HHMMSS.uuuuuu格式返回时间。

****示例 – SELECT CURTIME();

4

**DATE_SUB()**

它从指定的日期增加或减少天数。

****示例 – SELECT DATE_SUB(‘2016-02-08’,INTERVAL 60 DAY);

5

**DATEDIFF()**

它确定两个日期之间的天数。

****示例 – SELECT DATEDIFF(‘2016-01-01 23:59:59′,’2016-01-03’);

6

**DATE ADD()**

它增加或减去日期和时间的任何时间单位。

****示例 – SELECT DATE_ADD(‘2016-01-04 23:59:59’,INTERVAL 22 SECOND);

7

**EXTRACT()**

它从日期中提取单位。

****示例 – SELECT EXTRACT(YPAR FROM’2016-01-08′);

8

**NOW()**

它以yyyy-mm-dd hh：mm：ss或yyyymmddhhmmss.uuuuuu格式返回当前日期和时间。

****示例 – SELECT NOW();

9

**DATE FORMAT()**

它根据指定的格式字符串格式化日期。

****示例 – SELECT DATE_FORMAT(‘2016-01-09 20:20:00′,’%W%M%Y’);

以下是一些重要的时间函数 –

它返回日期的秒数。

S.No
名称与描述

1
HOUR()

它返回时间的小时或已过去的小时数。

****示例 – SELECT HOUR(’19:17:09′);

2

**LOCALTIME()**

它的作用就像NOW()。

3

**MICROSECOND()**

它返回时间的微秒。

****示例 – SELECT MICROSECOND(’16:30:00.543876′);

4

**MINUTE()**

它返回时间的分钟。

****示例 – SELECT MINUTE(‘2016-05-22 17:22:01’);

5

**SECOND()**

它返回日期的秒数。

示例 – SELECT SECOND(‘2016-03-12 16:30:04.000001’);

6

**TIME_FORMAT()**

它根据指定的格式字符串格式化时间。

****示例 – SELECT TIME_FORMAT(’22:02:20′,’%H%k%h%I%l’);

7

**TIMESTAMP()**

它为活动提供了格式为yyyy-mm-dd hh：mm：dd的时间戳。

****示例 – CREATE TABLE orders_(ID INT,tmst TIMESTAMP);

## MariaDB数字函数

下面给出了一些重要的数字函数在MariaDB –

S.No
名称与描述

1
TRUNCATE()

它返回一个截断的数字到小数位数指定。

****示例 – SELECT TRUNCATE(101.222,1);

2

**COS()**

它返回x弧度的余弦。

****示例 – SELECT COS(PI());

3

**CEILING()**

它返回不小于x的最小整数。

****示例 – SELECT CEILING(2.11);

4

**DEGREES()**

它将弧度转换为度。

****示例 – SELECT DEGREES(PI());

5

**DIV()**

它执行整数除法。

****示例 – SELECT 100 DIV 4;

6

**EXP()**

它返回e的x的幂。

****示例 – SELECT EXP(2);

7

**FLOOR()**

它返回不超过x的最大整数。

****示例 – SELECT FLOOR(2.01);

8

**LN()**

它返回x的自然对数。

****示例 – SELECT LN(3);

9

**LOG()**

它返回给定基数的自然对数或对数。

****示例 – SELECT LOG(3);

10

**SQRT()**

它返回平方根。

****示例 – SELECT SQRT(16);

## MariaDB字符串函数

下面给出了重要的字符串函数 –

S.No
名称与描述

1
INSTR()

它返回一个子串的第一个实例的位置。

****示例 – SELECT INSTR(‘rambutan’,’tan’);

2

**RIGHT()**

它返回最右边的字符串字符。

****示例 – SELECT RIGHT(‘rambutan’,3);

3

**LENGTH()**

它返回字符串的字节长度。

****示例 – SELECT LENGTH(‘rambutan’);

4

**LOCATE()**

它返回一个子串的第一个实例的位置。

****示例 – SELECT LOCATE(‘tan’,’rambutan’);

5

**INSERT()**

它返回一个字符串，在某个位置有一个指定的子字符串，被修改。

****示例 – SELECT INSERT(‘ramputan’,4,1,’b’);

6

**LEFT()**

它返回最左边的字符。

****示例 – SELECT LEFT(‘rambutan’,3);

7

**UPPER()**

它将字符更改为大写。

****示例 – SELECT UPPER(lastname);

8

**LOWER()**

它将字符更改为小写。

****示例 – SELECT LOWER(lastname);

9

**STRCMP（）**

它比较字符串，当他们相等，则返回0。

**示例** -选择STRCMP（’蛋’，’奶酪’）;

10

**REPLACE()**

它在替换字符后返回一个字符串。

****示例 – SELECT REPLACE(‘sully’,’l’,’n’);

11

**REVERSE()**

它反转字符串中的字符。

****示例 – SELECT REVERSE(‘racecar’);

12

**REPEAT()**

它返回一个字符串，重复给定字符x次。

****示例 – SELECT REPEAT(‘ha’,10);

13

**SUBSTRING()**

它从字符串返回一个子串，从位置x开始。

****示例 – SELECT SUBSTRING(‘rambutan’,3);

14

**TRIM()**

它从字符串中删除尾随/前导字符。

****示例 – SELECT TRIM(LEADING’_’FROM’_rambutan’);
