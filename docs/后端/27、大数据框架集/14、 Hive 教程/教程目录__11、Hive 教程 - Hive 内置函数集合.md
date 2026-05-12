# 11、Hive 教程 - Hive 内置函数集合
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/11.html
- 分类：大数据框架
- 分组：教程目录
### 1、内置函数

### 2、数学函数

round（四舍五入）：

```java
hive> select round(45.3456,2),round(6.56787,-1);
+------------------+-------------------+
| round(45.3456,2) | round(6.56787,-1) |
+------------------+-------------------+
|            45.35 |                10 |
+------------------+-------------------+
1 row in set (0.00 sec)
```

ceil（向上取整）:

```java
hive> select ceil(56.9);
+------------+
| ceil(56.9) |
+------------+
|         57 |
+------------+
1 row in set (0.00 sec)
```

floor（向下取整）:

```java
hive> select ceil(56.9);
+------------+
| ceil(56.9) |
+------------+
|         56 |
+------------+
1 row in set (0.00 sec)
```

### 3、字符函数

**lower（转小写）：**

```java
hive> select lower('HAHA');
+---------------+
| lower('HAHA') |
+---------------+
| haha          |
+---------------+
1 row in set (0.00 sec)
```

**upper（转大写）：**

```java
hive> select upper('haha');
+---------------+
| upper('haha') |
+---------------+
| HAHA          |
+---------------+
1 row in set (0.00 sec)
```

**length（字符串长度，字符数）:**

```java
hive> select length('Are you OK?');
+-----------------------+
| length('Are you OK?') |
+-----------------------+
|                    11 |
+-----------------------+
1 row in set (0.00 sec)
```

**concat（字符串拼接）:**

```java
hive> select concat('Are','you OK');
+------------------------+
| concat('Are','you OK') |
+------------------------+
| Areyou OK              |
+------------------------+
1 row in set (0.00 sec)
```

**substr（求子串）:**

substr(a,b)：从字符串a中，第b位开始取，取右边所有的字符

substr(a,b,c)：从字符串a中，第b为开始取，取c个字符

注意：空格算占用一个字符的空间

```java
hive> select substr('Are you OK?',3);
+-------------------------+
| substr('Are you OK?',3) |
+-------------------------+
| e you OK?               |
+-------------------------+
1 row in set (0.00 sec)
hive> select substr('Are you OK?',3,5);
+---------------------------+
| substr('Are you OK?',3,5) |
+---------------------------+
| e you                     |
+---------------------------+
1 row in set (0.00 sec)
```

**trim（去前后空格）:**

```java
hive> select trim(' Are you OK ');
+----------------------+
| trim(' Are you OK ') |
+----------------------+
| Are you OK           |
+----------------------+
1 row in set (0.00 sec)
mysql> 
```

**lpad（左填充）rpad（右填充）**

```java
**hive> select lpad('abc',10,'*');
+--------------------+
| lpad('abc',10,'*') |
+--------------------+
| *******abc         |
+--------------------+
1 row in set (0.00 sec)
hive> select rpad('abc',10,'*');
+--------------------+
| rpad('abc',10,'*') |
+--------------------+
| abc*******         |
+--------------------+
1 row in set (0.00 sec)
**
```

### 4、集合函数

size：返回map集合的个数

格式：size（map（,））

```java
hive> select str_to_map('a:1,b:2,c:3');
OK
{
    "a":"1","b":"2","c":"3"}
Time taken: 0.457 seconds, Fetched: 1 row(s)
hive> select size(str_to_map('a:1,b:2,c:3'));
OK
3
```

map_keys:返回map集合数

```java
hive> select map_keys(str_to_map('a:1,b:2'));
OK
["a","b"]
Time taken: 0.034 seconds, Fetched: 1 row(s)
```

array_contains:判断键是否存在

```java
hive> select array_contains(map_keys(str_to_map('a:1,b:2')),'a');
```

sort_array:数组排序

```java
hive> select sort_array(split('45,23,78,43,12',','));
```

### 5、转换函数

cast：转换数据类型

```java
hive> select cast('2018-06-28' as date);
+----------------------------+
| cast('2018-06-28' as date) |
+----------------------------+
| 2018-06-28                 |
+----------------------------+
1 row in set (0.00 sec)
```

### 6、日期函数

- to_date:从一个字符串中取出为日期的部分
- year、month、day:从一个日期中取出相应的年、月、日

```java
hive> select year(from_unixtime(unix_timestamp(),'yyyy-MM-dd'));
```

- weekofyear:返回输入日期在该年中是第几个星期
- datediff:两个日期相减，返回相差天数
- date_add:在一个日期基础上增加天数
- date_sub:在一个日期基础上减去天数

### 7、条件函数

if：如果testCondition为 true 就返回 valueTrue，否则返回 valueFalseOrNull

```java
hive> select if
    > (1>2,'hehe','xixi');
OK
xixi
Time taken: 0.061 seconds, Fetched: 1 row(s)
```

nvl： value为null 返回default_value 否则返回value

```java
hive> select nvl(null,1);
OK
1
Time taken: 0.036 seconds, Fetched: 1 row(s)
hive> select nvl(1,3);
OK
1
Time taken: 0.039 seconds, Fetched: 1 row(s)
hive> select nvl(null,null);
OK
NULL
Time taken: 0.034 seconds, Fetched: 1 row(s)
```

coalesce：从左到右返回第一个不为null的值

```java
hive> select coalesce(null,null,null);
OK
NULL
Time taken: 0.042 seconds, Fetched: 1 row(s)
hive> select coalesce(null,null,null,123,34,456);
OK
123
Time taken: 0.041 seconds, Fetched: 1 row(s)
```

case…when…：条件表达式

```java
hive> select name,orderdate,cost,case cost when 29 then 'hehe' else 'xixi' end from order;
```

**语法格式**：case A when B then C [when D then E]* [else F] end

解释：对于A来说，如果判断为B则返回C，如果判断为D则返回E（此处判断条件可为多个），如果以上都不是则返回F。注意，最后还有还有一个end结束符。

png)

**运行结果**：

### 8、聚合函数

count：返回行数

sum：组内某列求和

min：组内某列最小值

max：组内某列最大值

avg：组内某列平均值

以工资sal为例：

```java
select count(*),sum(sal),max(sal),min(sal),avg(sal) from emp;
```

### 9、表生成函数

explode：把map集合中每个键值对或数组中的每个元素都单独生成一行的形式

## 二、Hive 全部函数集合

函数名
含义及实例

ABS
abs（x） - 返回x的绝对值
 示例：
 > SELECT abs（0）FROM src LIMIT 1;
 0
 > SELECT abs（-5）FROM src LIMIT 1;
 五

ACOS
acos（x） - 如果-1  SELECT acos（1）FROM src LIMIT 1;
 0
 > SELECT acos（2）FROM src LIMIT 1;

ADD_MONTHS
add_months（start_date，num_months） - 返回start_date之后的num_months日期。
 start_date是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。num_months是一个数字。start_date的时间部分被忽略。
 示例：
 > SELECT add_months（'2009-08-31'，1）FROM src LIMIT 1;
 '2009-09-30'

AES_DECRYPT
aes_decrypt（输入二进制，密钥字符串/二进制） - 使用AES解密输入。
 AES（高级加密标准）算法。可以使用128,192或256位的密钥长度。如果安装了Java Cryptography Extension（JCE）Unlimited Strength Jurisdiction Policy Files，则可以使用192和256位密钥。如果任一参数为NULL或密钥长度不是允许值之一，则返回值为NULL。
 示例：> SELECT aes_decrypt（unbase64（'y6Ss + zCYObpCbgfWfyNWTw =='），'1234567890123456'）;
 'ABC'

AES_ENCRYPT
aes_encrypt（输入字符串/二进制，密钥字符串/二进制） - 使用AES加密输入。
 AES（高级加密标准）算法。可以使用128,192或256位的密钥长度。如果安装了Java Cryptography Extension（JCE）Unlimited Strength Jurisdiction Policy Files，则可以使用192和256位密钥。如果任一参数为NULL或密钥长度不是允许值之一，则返回值为NULL。
 示例：> SELECT base64（aes_encrypt（'ABC'，'1234567890123456'））;
 'y6Ss + zCYObpCbgfWfyNWTw =='

and
a1和a2和......以及 - 逻辑和

array
array（n0，n1 ...） - 使用给定元素创建数组

array_contains
array_contains（array，value） - 如果数组包含值，则返回TRUE。
 示例：
 > SELECT array_contains（array（1,2,3），2）FROM src LIMIT 1;
 真正

ASCII
ascii（str） - 返回str的第一个字符的数值
 如果str为空则返回0;如果str为NULL，则返回NULL
 示例：
 > SELECT ascii（'222'）FROM src LIMIT 1; 50
 > SELECT ascii（2）FROM src LIMIT 1;
 50

asin
asin（x） - 如果-1  SELECT asin（0）FROM src LIMIT 1;
 0
 > SELECT asin（2）FROM src LIMIT 1;
 空值

ASSERT_TRUE
assert_true（condition） - 如果'condition'不为真，则抛出异常。
 示例：
 > SELECT assert_true（x> = 0）FROM src LIMIT 1;
 空值

atan
atan（x） - 返回x的atan（arctan）（x是弧度）
 示例：
 > SELECT atan（0）FROM src LIMIT 1;
 0

avg
avg（x） - 返回一组数字的平均值

BASE64
base64（bin） - 将参数从二进制转换为base 64字符串

between
在[NOT] BETWEEN b和c之间 - 评估a是否在b和c之间

bin
bin（n） - 返回二进制
 n中的n是BIGINT。如果n为NULL，则返回NULL。
 示例：
 > SELECT bin（13）FROM src LIMIT
 1'1101'

bloom_filter
函数'bloom_filter'没有文档

bround
bround（x [，d]） - 使用HALF_EVEN舍入模式将x舍入到d小数位。
 银行家的四舍五入。该值四舍五入到最接近的偶数。也称为高斯舍入。
 示例：
 > SELECT bround（12.25,1）;
 12.2

cardinality_violation
cardinality_violation（n0，n1 ...） - 引发基数违规

case
CASE a WHEN b THEN c [WHEN d THEN e]* [ELSE f] END - When a = b, returns c; when a = d, return e; else return f
 Example:
 SELECT
 CASE deptno
 WHEN 1 THEN Engineering
 WHEN 2 THEN Finance
 ELSE admin
 END,
 CASE zone
 WHEN 7 THEN Americas
 ELSE Asia-Pac
 END
 FROM emp_details

CBRT
cbrt（double） - 返回double值的立方根。
 示例：
 > SELECT cbrt（27.0）;
 3.0

ceil
ceil（x） - 求小于x的最小整数
 同义词：ceiling
 示例：
 > SELECT ceil（-0.1）FROM src LIMIT 1;
 0
 > SELECT ceil（5）FROM src LIMIT 1;
 五

ceiling
ceiling（x） - 找到不小于x的最小整数
 同义词：ceil
 例：
 > SELECT ceiling（-0.1）FROM src LIMIT 1;
 0
 > SELECT ceiling（5）FROM src LIMIT 1;
 五

CHAR_LENGTH
char_length（str | binary） - 返回str或二进制数据中的字符数
 别名：character_length
 示例：
 > SELECT char_length（'HUX81'）FROM src LIMIT 1;
 五

CHARACTER_LENGTH
character_length（str | binary） - 返回str或二进制数据中的字符数
 别名：char_length
 示例：
 > SELECT character_length（'HUX81'）FROM src LIMIT 1;
 五

CHR
chr（str） - 将n中的n：[0,256]转换为ascii等价物作为varchar。如果n小于0则返回空字符串。如果n> 256，则返回chr（n％256）。
 示例：
 > SELECT chr（'48'）FROM src LIMIT 1;
 '0'
 > SELECT chr（'65'）FROM src LIMIT 1;
 '一个'

coalesce
coalesce（a1，a2，...） - 返回第一个非空参数
 示例：
 > SELECT coalesce（NULL，1，NULL）FROM src LIMIT 1;
 1

collect_list
collect_list（x） - 返回具有重复项的对象列表

collect_set
collect_set（x） - 返回一组消除了重复元素的对象

compute_stats
compute_stats（x） - 返回一组基本类型值的统计摘要。

CONCAT
concat（str1，str2，... strN） - 返回str1，str2，... strN或concat（bin1，bin2，... binN）的串联 - 返回二进制数据bin1，bin2，...中的字节串联。 .. binN
 如果任何参数为NULL，则返回NULL。
 示例：
 > SELECT concat（'abc'，'def'）FROM src LIMIT 1;
 'ABCDEF'

CONCAT_WS
concat_ws（separator，[string | array（string）] +） - 返回由分隔符分隔的字符串的串联。
 示例：
 > SELECT concat_ws（'。'，'www'，array（'facebook'，'com'））FROM src LIMIT 1;
 'www.facebook.com'

context_ngrams
context_ngrams（expr，array ，k，pf）估计适合指定上下文的top-k最频繁的n-gram。第二个参数指定一个字符串，用于指定n-gram元素的位置，其中空值表示必须由n-gram元素填充的“空白”。
 主表达式必须是字符串数组或字符串数​​组数组，例如句子（）UDF的返回类型。第二个参数指定上下文 - 例如，数组（“i”，“love”，null） - 它将估计主表达式中“i love”短语后面的顶部“k”字。可选的第四个参数'pf'控制启发式使用的内存。值越大，精度越高，但要使用更多内存。用法示例：
 SELECT context_ngrams（句子（lower（review）），array（“i”，“love”，null，null），10）FROM电影
 会尝试确定“我爱”之后的10个最常见的双字短语自由形式自然语言电影评论数据库。

CONV
conv（num，from_base，to_base） - 将num从from_base转换为to_base
 如果to_base为负数，则将num视为有符号整数，否则将其视为无符号整数。
 示例：
 > SELECT conv（'100'，2,10）FROM src LIMIT 1;
 '4'
 > SELECT conv（-10,16，-10）FROM src LIMIT 1;
 '16'

corr
corr（y，x） - 返回
 一组数字对之间的Pearson相关系数
 该函数将任意一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 如果N * SUM（x * x）= SUM（x）* SUM（x）：返回NULL。
 如果N * SUM（y * y）= SUM（y）* SUM（y）：返回NULL。
 否则，它计算以下内容：
 COVAR_POP（x，y）/（STDDEV_POP（x）* STDDEV_POP（y））
 其中x和y都不为空，
 COVAR_POP是总体协方差，
 STDDEV_POP是总体标准差。

COS
cos（x） - 返回x的余弦值（x是弧度）
 示例：
 > SELECT cos（0）FROM src LIMIT 1;
 1

count
count（*） - 返回检索到的行的总数，包括包含NULL值的行。
 count（expr） - 返回提供的表达式为非NULL的行数。
 count（DISTINCT expr [，expr ...]） - 返回提供的表达式唯一且非NULL的行数。

Covr_pop
covar_pop（x，y） - 返回一组数字对的总体协方差
 该函数将任意一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。如果该函数应用于空集，
 则返回NULL 。否则，它计算以下内容：
 （SUM（x * y）-SUM（x）* SUM（y）/ COUNT（x，y））/ COUNT（x，y）
 其中x和y都不为空。

Covr_samp
covar_samp（x，y） - 返回一组数字对的样本协方差
 该函数将任意一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 如果应用于具有单个元素的集合：将返回NULL。
 否则，它计算以下内容：
 （SUM（x * y）-SUM（x）* SUM（y）/ COUNT（x，y））/（COUNT（x，y）-1）
 其中x和y都不为null 。
 1

CRC32
crc32（str或bin） - 计算字符串或二进制参数的循环冗余校验值并返回bigint值。
 示例：
 > SELECT crc32（'ABC'）;
 2743272264
 > SELECT crc32（binary（'ABC'））;
 2743272264

create_union
create_union（tag，obj1，obj2，obj3，...） - 使用给定标记的对象创建一个联合
 示例：
 > SELECT create_union（1,1，“one”）FROM src LIMIT 1;
 一

CUME_DIST
函数'cume_dist'没有文档

current_database
current_database（） - 当前使用数据库名称返回

current_database
current_date（） - 返回查询评估开始时的当前日期。同一查询中current_date的所有调用都返回相同的值。

CURRENT_TIMESTAMP
current_timestamp（） - 返回查询评估开始时的当前时间戳。同一查询中的current_timestamp的所有调用都返回相同的值

current_user
current_user（） - 返回当前用户名

DATE_ADD
date_add（start_date，num_days） - 返回start_date之后的num_days日期。
 start_date是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。num_days是一个数字。start_date的时间部分被忽略。
 示例：
 > SELECT date_add（'2009-07-30'，1）FROM src LIMIT 1;
 '2009-07-31'

date_format
date_format（date / timestamp / string，fmt） - 以日期格式fmt指定的格式将日期/时间戳/字符串转换为字符串值。
 支持的格式是SimpleDateFormat格式 - https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html。第二个参数fmt应该是常量。
 示例：> SELECT date_format（'2015-04-08'，'y'）;
 '2015'

DATE_SUB
date_sub（start_date，num_days） - 返回start_date之前的num_days日期。
 start_date是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。num_days是一个数字。start_date的时间部分被忽略。
 示例：
 > SELECT date_sub（'2009-07-30'，1）FROM src LIMIT 1;
 '2009-07-29'

DATEDIFF
datediff（date1，date2） - 返回date1和date2之间的天数
 date1和date2是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。时间部分被忽略。如果date1早于date2，则结果为负。
 示例：
 > SELECT datediff（'2009-07-30'，'2009-07-31'）FROM src LIMIT 1;
 1

day
day（param） - 返回日期/时间戳的月份日期或间隔的日期组件
 同义词：dayofmonth
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'的字符串或'yyyy-MM-dd'。
 2.日期值
 3.时间戳值
 4.日间隔时间值示例：
 > SELECT day（'2009-07-30'）FROM src LIMIT 1;
 三十

DAYOFMONTH
dayofmonth（param） - 返回日期/时间戳的月份日期或间隔的日期组成部分
 别名：day
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'的字符串或'yyyy-MM-dd'。
 2.日期值
 3.时间戳值
 4.日间隔时间值示例：
 > SELECT dayofmonth（'2009-07-30'）FROM src LIMIT 1;
 三十

dayofweek
dayofweek（param） - 返回日期/时间戳的星期几（1 =星期日，2 =星期一，...，7 =星期六）
 param可以是以下之一：
 1。格式为'yyyy-MM的字符串-dd HH：mm：ss'或'yyyy-MM-dd'。
 2.日期值
 3.时间戳值示例：
 > SELECT dayofweek （'2009-07-30'）FROM src LIMIT 1;
 五

decode
decode（bin，str） - 使用第二个参数字符集解码第一个参数字符集的
 可能选项是'US-ASCII'，'ISO-8859-1'，
 'UTF-8'，'UTF-16BE'， 'UTF-16LE'和'UTF-16'。如果任一参数
 为null，则结果也将为null

degrees
degrees（x） - 将弧度转换为度数
 示例：
 > SELECT degrees（30）FROM src LIMIT 1;
 -1

DENSE_RANK
函数'dense_rank'没有文档

DIV
a div b - 将a除以b舍入为长整数
 示例：
 > SELECT 3 div 2 FROM src LIMIT 1;
 1

e
e（） - 返回E
 示例：
 > SELECT e（）FROM src LIMIT 1;
 2.718281828459045

elt
elt（n，str1，str2，...） - 返回第n个字符串
 例如：
 > SELECT elt（1，'face'，'book'）FROM src LIMIT 1;
 '面对'

encode
encode（str，str） - 使用第二个参数字符集对第一个参数进行编码字符集的
 可能选项是“US-ASCII”，“ISO-8859-1”，
 “UTF-8”，“UTF-16BE”， 'UTF-16LE'和'UTF-16'。如果任一参数
 为null，则结果也将为null

ewah_bitmap
ewah_bitmap（expr） - 返回列的EWAH压缩位图表示。

ewah_bitmap_and
ewah_bitmap_and（b1，b2） - 返回EWAH压缩的位图，该位图是两个位图的按位AND。

ewah_bitmap_empty
ewah_bitmap_empty（bitmap） - 测试EWAH压缩位图是否全为零的谓词

ewah_bitmap_or
ewah_bitmap_or（b1，b2） - 返回EWAH压缩位图，该位图是两个位图的按位OR。

EXP
exp（x） - 返回e到x的幂的
 例子：
 > SELECT exp（0）FROM src LIMIT 1;
 1

explode
explode（a） - 将数组a的元素分成多行，或将map的元素分成多个行和列

extract_union
extract_union（union [，tag]） - 递归地将联合分解为结构或简单地提取给定的标记。
 > SELECT extract_union（{0：“foo”}）。tag_0 FROM src;
 foo
 > SELECT extract_union（{0：“foo”}）。tag_1 FROM src;
 null
 > SELECT extract_union（{0：“foo”}，0）FROM src;
 foo
 > SELECT extract_union（{0：“foo”}，1）FROM src;
 空值

factorial
factorial（int） - 返回n阶乘。有效n为[0..20]。
 如果n超出[0..20]范围，则​​返回null。
 示例：
 > SELECT factorial（5）;
 120

field
field（str，str1，str2，...） - 返回str1，str2，...列表中str的索引或0如果未找到
 则支持所有基元类型，使用str.equals（x）比较参数。如果str为NULL，则返回值为0。

FIND_IN_SET
find_in_set（str，str_array） - 返回str_array中str的第一个匹配项，其中str_array是逗号分隔的字符串。如果任一参数为null，则返回null。如果第一个参数有逗号，则返回0。
 示例：
 > SELECT find_in_set（'ab'，'abc，b，ab，c，def'）FROM src LIMIT 1;
 3
 > SELECT * FROM src1 WHERE NOT find_in_set（key，'311,128,345,956'）= 0;
 311 val_311
 128

FIRST_VALUE
函数'first_value'没有文档

floor
floor（x） - 查找不大于x的最大整数
 示例：
 > SELECT floor（-0.1）FROM src LIMIT 1;
 -1
 > SELECT floor（5）FROM src LIMIT 1;
 五

floor_day
floor_day（param） - 返回一天的时间戳粒度
 param需要是一个时间戳值
 示例：
 > SELECT floor_day（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-MM-dd 00:00:00

floor_hour
floor_hour（param） - 返回一小时的时间戳粒度
 param需要是一个时间戳值
 示例：
 > SELECT floor_hour（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-MM-dd HH：00：00

floor_minute
floor_minute（param） - 返回一分钟时间戳，粒度
 param需要是一个时间戳值
 示例：
 > SELECT floor_minute（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-MM-dd HH：mm：00

floor_month
floor_month（param） - 返回一个月的时间戳粒度
 param需要是一个时间戳值
 示例：
 > SELECT floor_month（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-MM-01 00:00:00

floor_quarter
floor_quarter（param） - 返回四分之一粒度
 param的时间戳需要是一个时间戳值
 示例：
 > SELECT floor_quarter（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-xx-01 00:00:00
 5

floor_second
floor_second（param） - 返回第二个粒度
 参数的时间戳需要是时间戳值
 示例：
 > SELECT floor_second（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-MM-dd HH：mm：ss

floor_week
floor_week（param） - 返回一周的时间戳粒度
 param需要是一个时间戳值
 示例：
 > SELECT floor_week（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-MM-xx 00:00:00

floor_year
floor_year（param） - 返回一年中的时间戳粒度
 param需要是一个时间戳值
 示例：
 > SELECT floor_year（CAST（'yyyy-MM-dd HH：mm：ss'AS TIMESTAMP））FROM src;
 yyyy-01-01 00:00:00

format_number
format_number（X，D或F） - 将数字X格式化为'＃，##，##。##'等格式，舍入到D小数位，或者使用指定格式F格式化，并返回结果作为字符串。如果D为0，则结果没有小数点或小数部分。这应该像MySQL的FORMAT
 示例：
 > SELECT format_number（12332.123456,4）FROM src LIMIT 1;
 '12,332.1235'
 > SELECT format_number（12332.123456，'############。##'）FROM src LIMIT 1;
 '12332.123'

FROM_UNIXTIME
from_unixtime（unix_time，format） - 以指定的格式返回unix_time
 示例：
 > SELECT from_unixtime（0，'yyyy-MM-dd HH：mm：ss'）FROM src LIMIT 1;
 '1970-01-01 00:00:00'

from_utc_timestamp
from_utc_timestamp（timestamp，string timezone） - 假设给定的时间戳是UTC并转换为给定的时区（从Hive 0.8.0开始）

get_json_object
get_json_object（json_txt，path） - 从路径中
 提取json对象从基于指定的json路径的json字符串中提取json对象，并返回提取的json对象的json字符串。如果输入json字符串无效，它将返回null。
 支持的JSONPath限制版本：
 $：Root对象
 。：子运算符
 []：数组
 *的下标运算符：[]
 不支持的通配符值得注意：
 ''：作为键的零长度字符串
 ..：递归下降
 ＆amp;＃064; ：当前对象/元素
 （）：脚本表达式
 ？（）：过滤器（脚本）表达式。
 [，]：联盟运营商
 [start：end：step]：数组切片运算符

get_splits
get_splits（string，int） - 返回引用的表字符串的长度为int serialized的数组。

maximum
maximum（v1，v2，...） - 返回值列表中的最大值
 示例：
 > SELECT maximum（2,3,1）FROM src LIMIT 1;
 3

grouping
grouping（a，b） - 指示是否聚合指定的列表达式。返回1表示聚合，0表示未聚合。
 a是分组ID，b是我们要提取的索引

hash
hash（a1，a2，...） - 返回参数的哈希值

hex
hex（n，bin或str） - 将参数转换为十六进制
 如果参数是字符串，则为字符串中的每个字符返回两个十六进制数字。
 如果参数是数字或二进制，则返回十六进制表示。
 示例：
 > SELECT hex（17）FROM src LIMIT 1;
 'H1'
 > SELECT hex（'Facebook'）FROM src LIMIT 1;
 '46616365626F6F6B'

histogram_numeric
histogram_numeric（expr，nb） - 使用nb bin计算数字'expr'的直方图。
 示例：
 > SELECT histogram_numeric（val，3）FROM src;
 [{ “×”：100， “Y”：14.0}，{ “×”：200， “Y”：22.0}，{ “×”：290.5， “Y”：11.0}]
 返回值是表示直方图区间中心的（x，y）对数组。随着'nb'的值增加，直方图近似得到更细粒度，但可能会产生异常值周围的伪影。在实践中，20-40个直方图箱似乎运行良好，倾斜或较小的数据集需要更多的箱。请注意，此函数会创建一个具有非均匀bin宽度的直方图。它不能保证直方图的均方误差，但实际上与R / S-Plus统计计算包产生的直方图相当。

hour
hour（param） - 返回字符串/ timestamp / interval的小时组件
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'或'HH：mm：ss'的字符串。
 2.时间戳值
 3.日间隔值示例：
 > SELECT hour（'2009-07-30 12:58:59'）FROM src LIMIT 1;
 12
 > SELECT hour（'12：58：59'） from src LIMIT 1;
 12

if
IF（expr1，expr2，expr3） - 如果expr1为TRUE（expr1 <> 0且expr1 <> NULL）则IF（）返回expr2; 否则返回expr3。IF（）返回数值或字符串值，具体取决于使用它的上下文。

test in
test in（val1，val2 ...） - 如果test等于任何valN，则返回true

in_bloom_filter

in_file中
in_file（str，filename） - 如果str出现在文件中，则返回true

index
index（a，n） - 返回a的第n个元素

INITCAP
initcap（str） - 返回str，每个单词的第一个字母用大写字母表示，所有其他字母用小写字母表示。单词由空格分隔。
 示例：
 > SELECT initcap（'tHe soap'）FROM src LIMIT 1;
 '肥皂'

inline
inline（ARRAY（STRUCT（）[，STRUCT（）] - 将数据和结构分解为表

INSTR
instr（str，substr） - 返回str中第一次出现substr的索引
 例如：
 > SELECT instr（'Facebook'，'boo'）FROM src LIMIT 1;
 五

internal_interval
internal_interval（intervalType，intervalArg）
 此方法不是设计用于直接调用它 - 它为'INTERVAL（intervalArg）intervalType'构造提供内部支持

isnotnull
isnotnull a - 如果a不为NULL则返回true，否则返回false

isnull a
isnull a - 如果a为NULL则返回true，否则返回false

java_method
java_method（class，method [，arg1 [，arg2 ..]]）使用反射调用方法
 同义词：reflect
 使用此UDF通过匹配参数签名来调用Java方法

json_tuple
json_tuple（jsonStr，p1，p2，...，pn） - 与get_json_object类似，但它需要多个名称并返回一个元组。所有输入参数和输出列类型都是字符串。
 函数类：org.apache.hadoop.hive.ql.udf.generic.GenericUDTFJSONTuple

LAG
LAG（scalar_expression [，offset] [，default]）OVER（[query_partition_clause] order_by_clause）; LAG函数用于访问前一行的数据。
 示例：
 选择p1.p_mfgr，p1.p_name，p1.p_size，
 p1.p_size - lag（p1.p_size，1，p1.p_size）over（由p1.p_mfgr按p1.p_name排序）作为deltaSz
 从part p1 join p1.p_partkey = p2.p_partkey上的p2部分

last_day
last_day（date） - 返回日期所属月份的最后一天。
 date是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。日期的时间部分被忽略。
 示例：
 > SELECT last_day（'2009-01-12'）FROM src LIMIT 1;
 '2009-01-31'

LAST_VALUE

LCASE
lcase（str） - 返回str，所有字符都改为小写
 同义词：lower
 示例：
 > SELECT lcase（'Facebook'）FROM src LIMIT 1;
 “Facebook的

lead
LEAD（scalar_expression [，offset] [，default]）OVER（[query_partition_clause] order_by_clause）; LEAD函数用于从下一行返回数据。
 示例：
 选择p_name，p_retailprice，lead（p_retailprice）over（）为l1，
 lag（p_retailprice）over（）为l2
 ，
 其中p_retailprice = 1173.15

least
least（v1，v2，...） - 返回值列表中的最小值
 示例：
 > SELECT least（2,3,1）FROM src LIMIT 1;
 1

length
length（str | binary） - 返回str的长度或二进制数据中的字节数
 示例：
 > SELECT length（'Facebook'）FROM src LIMIT 1;
 8

levenshtein
levenshtein（str1，str2） - 该函数计算两个弦之间的Levenshtein距离。
 Levenshtein距离是用于测量两个序列之间差异的字符串度量。非正式地，两个单词之间的Levenshtein距离是将一个单词改为另一个单词所需的单字符编辑（即插入，删除或替换）的最小数量。它以弗拉基米尔·莱文
 斯坦（Vladimir Levenshtein）的名字命名，他在1965年考虑过这个距离。例如：>选择levenshtein（'小猫'，'坐着'）;
 3

like
like（str，pattern） - 检查str是否匹配模式
 示例：
 > SELECT a.* FROM srcpart a WHERE a.hr like'％2'LIMIT 1;
 27 val_27 2008-04-08 12

LN
ln（x） - 返回x的自然对数
 示例：
 > SELECT ln（1）FROM src LIMIT 1;
 0

locate
locate（substr，str [，pos]） - 返回位置pos后str中第一次出现substr的位置
 示例：
 > SELECT locate（'bar'，'foobarbar'，5）FROM src LIMIT 1;
 7

log
log（[b]，x） - 返回x与base b的对数
 示例：
 > SELECT log（13,13）FROM src LIMIT 1;
 1

LOG10
log10（x） - 返回x的基数为10的对数
 示例：
 > SELECT log10（10）FROM src LIMIT 1;
 1

LOG2
log2（x） - 返回x的基数为2的对数
 示例：
 > SELECT log2（2）FROM src LIMIT 1;
 1

LOGGED_IN_USER
logged_in_user（） - 返回登录的用户名
 SessionState GetUserName - 会话初始化时提供的用户名

lower
lower（str） - 返回str，所有字符都改为小写
 同义词：lcase
 示例：
 > SELECT lower（'Facebook'）FROM src LIMIT 1;
 “Facebook的

LPAD
lpad（str，len，pad） - 返回str，左边用pad填充长度为len
 如果str长于len，则返回值缩短为len个字符。
 如果是空填充字符串，则返回值为null。
 示例：
 > SELECT lpad（'hi'，5，'??'）FROM src LIMIT 1;
 '??? hi'
 > SELECT lpad（'hi'，1，'??'）FROM src LIMIT 1;
 'h'
 > SELECT lpad（'hi'，5，''）FROM src LIMIT 1;
 空值

LTRIM
ltrim（str） - 从str中删除前导空格字符
 例如：
 > SELECT ltrim（'facebook'）FROM src LIMIT 1;
 “Facebook的

lower
lower（key0，value0，key1，value1 ...） - 创建具有给定键/值对的映射

map_keys
map_keys（map） - 返回包含输入映射键的无序数组

map_values
map_values（map） - 返回包含输入映射值的无序数组。

mask
掩盖给定值
 示例：
 mask（ccn）
 mask（ccn，'X'，'x'，'0'）
 mask（ccn，'x'，'x'，'x'）
 参数：
 mask（value，upperChar， lowerChar，digitChar，otherChar，numberChar，dayValue，monthValue，yearValue）
 value - 要屏蔽的值。支持的类型：TINYINT，SMALLINT，INT，BIGINT，STRING，VARCHAR，CHAR，DATE
 upperChar - 用大写字符替换大写字符的字符。指定-1以保留原始字符。默认值：'
 X'lowerChar - 用小写替换小写字符的字符。指定-1以保留原始字符。默认值：'x'
 digitChar - 用数字字符替换的字符。指定-1以保留原始字符。默认值：'
 n'otherChar - 用其替换所有其他字符的字符。指定-1以保留原始字符。默认值：-1
 numberChar - 用数字替换数字的字符。有效值：0-9。默认值：'
 1'dayValue - 用日期替换日期字段的值。指定-1以保留原始值。有效值：1-31。默认值：1
 monthValue - 用日期替换日期中的月份字段的值。指定-1以保留原始值。有效值：0-11。默认值：0
 yearValue - 用日期替换年份字段的值。指定-1以保留原始值。默认值：0

mask_first_n
掩盖值的前n个字符
 示例：
 mask_first_n（ccn，8）
 mask_first_n（ccn，8，'x'，'x'，'x'）
 参数：
 mask（value，charCount，upperChar，lowerChar，digitChar，otherChar， numberChar）
 value - 要屏蔽的值。支持的类型：TINYINT，SMALLINT，INT，BIGINT，STRING，VARCHAR，CHAR
 charCount - 字符数。默认值：4
 upperChar - 用大写字符替换大写字符的字符。指定-1以保留原始字符。默认值：'
 X'lowerChar - 用小写替换小写字符的字符。指定-1以保留原始字符。默认值：'x'
 digitChar - 用数字字符替换的字符。指定-1以保留原始字符。默认值：'
 n'otherChar - 用其替换所有其他字符的字符。指定-1以保留原始字符。默认值：-1
 numberChar - 用数字替换数字的字符。有效值：0-9。默认值：'1'

mask_hash
返回给定值的哈希值
 示例：
 mask_hash（value）
 参数：
 value - 要掩码的值。支持的类型：STRING，VARCHAR，CHAR

mask_last_n
屏蔽值的最后n个字符
 示例：
 mask_last_n（ccn，8）
 mask_last_n（ccn，8，'x'，'x'，'x'）
 参数：
 mask_last_n（value，charCount，upperChar，lowerChar，digitChar，otherChar， numberChar）
 value - 要屏蔽的值。支持的类型：TINYINT，SMALLINT，INT，BIGINT，STRING，VARCHAR，CHAR
 charCount - 字符数。默认值：4
 upperChar - 用大写字符替换大写字符的字符。指定-1以保留原始字符。默认值：'
 X'lowerChar - 用小写替换小写字符的字符。指定-1以保留原始字符。默认值：'x'
 digitChar - 用数字字符替换的字符。指定-1以保留原始字符。默认值：'
 n'otherChar - 用其替换所有其他字符的字符。指定-1以保留原始字符。默认值：-1
 numberChar - 用数字替换数字的字符。有效值：0-9。默认值：'1'

mask_show_first_n
掩码除了值的前n个字符以外的所有字符
 示例：
 mask_show_first_n（ccn，8）
 mask_show_first_n（ccn，8，'x'，'x'，'x'）
 参数：
 mask_show_first_n（value，charCount，upperChar，lowerChar，digitChar，otherChar ，numberChar）
 value - 要屏蔽的值。支持的类型：TINYINT，SMALLINT，INT，BIGINT，STRING，VARCHAR，CHAR
 charCount - 字符数。默认值：4
 upperChar - 用大写字符替换大写字符的字符。指定-1以保留原始字符。默认值：'
 X'lowerChar - 用小写替换小写字符的字符。指定-1以保留原始字符。默认值：'x'
 digitChar - 用数字字符替换的字符。指定-1以保留原始字符。默认值：'
 n'otherChar - 用其替换所有其他字符的字符。指定-1以保留原始字符。默认值：-1
 numberChar - 用数字替换数字的字符。有效值：0-9。默认值：'1'

mask_show_last_n
掩码除了值的最后n个字符之外的所有
 例子：
 mask_show_last_n（ccn，8）
 mask_show_last_n（ccn，8，'x'，'x'，'x'）
 参数：
 mask_show_last_n（value，charCount，upperChar，lowerChar，digitChar，otherChar ，numberChar）
 value - 要屏蔽的值。支持的类型：TINYINT，SMALLINT，INT，BIGINT，STRING，VARCHAR，CHAR
 charCount - 字符数。默认值：4
 upperChar - 用大写字符替换大写字符的字符。指定-1以保留原始字符。默认值：'
 X'lowerChar - 用小写替换小写字符的字符。指定-1以保留原始字符。默认值：'x'
 digitChar - 用数字字符替换的字符。指定-1以保留原始字符。默认值：'
 n'otherChar - 用其替换所有其他字符的字符。指定-1以保留原始字符。默认值：-1
 numberChar - 用数字替换数字的字符。有效值：0-9。默认值：'1'

matchpath

max
max（expr） - 返回expr的最大值

MD5
md5（str或bin） - 为字符串或二进制文件计算MD5 128位校验和。
 该值以32个十六进制数字的字符串形式返回，如果参数为NULL，则返回NULL。
 示例：
 > SELECT md5（'ABC'）;
 '902fbdd2b1df0c4f70b4a5d23525e932'
 > SELECT md5（二进制（'ABC'））;
 '902fbdd2b1df0c4f70b4a5d23525e932'

min
min（expr） - 返回expr的最小值

minute
minute（param） - 返回字符串/ timestamp / interval的分钟组件
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'或'HH：mm：ss'的字符串。
 2.时间戳值
 3.日间隔值示例：
 > SELECT分钟（'2009-07-30 12:58:59'）FROM src LIMIT 1;
 58
 > SELECT分钟（'12：58：59'）from src LIMIT 1;
 58

mod
a mod b - 当除以b时返回余数
 同义词：％

month
month（param） - 返回日期/时间戳/间隔的月份组件
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。
 2.日期值
 3.时间戳值
 4.年 - 月间隔值示例：
 > SELECT月（'2009-07-30'）FROM src LIMIT 1;
 7

MONTHS_BETWEEN
months_between（date1，date2，roundOff） - 返回date1和date2之间的月数。
 如果date1晚于date2，则结果为正。如果date1早于date2，则结果为负数。如果date1和date2是该月的同一天或两个月的最后几天，则结果始终为整数。否则，UDF将根据31天的月份计算结果的小数部分，并考虑时间组件date1和date2的差异。
 date1和date2类型可以是日期，时间戳或字符串，格式为'yyyy-MM-dd'或'yyyy-MM-dd HH：mm：ss'。结果默认舍入为8位小数。否则设置roundOff = false。
 示例：
 > SELECT months_between（'1997-02-28 10:30:00'，'
 3.94959677

named_struct
named_struct（name1，val1，name2，val2，...） - 使用给定的字段名称和值创建结构

negative
negative a - 返回-a

next_day
next_day（start_date，day_of_week） - 返回晚于start_date并按指示命名的第一个日期。
 start_date是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。day_of_week是星期几（例如，Mo，星期五，星期五）。例如：
 > SELECT next_day（'2015-01-14'，'TU'）FROM src LIMIT 1;
 “2015年1月20日”

ngrams
ngrams（expr，n，k，pf） - 估计由字符串序列组成的行中的前k个n-gram，表示为字符串数组或字符串数​​组数组。'pf'是一个可选的精度因子，用于控制内存使用量。
 参数'n'指定估计什么类型的n-gram。Unigrams是n = 1，并且bigrams是n = 2.通常，n不会大于约5.'k'参数指定UDAF将返回多少个最高频率的n-gram。可选的精度因子'pf'指定用于估计的内存量; 更多的内存将提供更准确的频率计数，但可能会使JVM崩溃。默认值为20，内部保持20 * k n-gram，但仅返回k个最高频率的值。输出是一组具有前n个n-gram的结构。爆炸（）这个UDAF的输出可能很方便。

noop

noopstreaming

noopwithmap

noopwithmapstreaming

not
not a - 逻辑而不是同义词：！

ntile

NULLIF
SELECT nullif（1,1），nullif（1,2）

NVL
nvl（value，default_value） - 如果value为null则返回默认值，否则返回value
 示例：
 > SELECT nvl（null，'bla'）FROM src LIMIT 1;
 BLA

OCTET_LENGTH
octet_length（str | binary） - 返回str或二进制数据中的字节数
 示例：
 > SELECT octet_length（'HUX8 '）FROM src LIMIT 1;
 15

or
a1或a2或......或 - 逻辑或

parse_url
parse_url（url，partToExtract [，key]） - 从URL中提取
 部件：HOST，PATH，QUERY，REF，PROTOCOL，AUTHORITY，FILE，USERINFO
 键指定要提取的查询
 示例：
 > SELECT parse_url（'http：/ /facebook.com/path/p1.php?query=1'，'HOST'）FROM src LIMIT 1;
 'facebook.com'
 > SELECT parse_url（'http://facebook.com/path/p1.php?query=1'，'QUERY'）from src LIMIT 1;
 'query = 1'
 > SELECT parse_url（'http://facebook.com/path/p1.php?query=1'，'QUERY'，'query'）FROM src LIMIT 1;
 '1'

parse_url_tuple
parse_url_tuple（url，partname1，partname2，...，partnameN） - 从URL中提取N（N> = 1）个部分。
 它需要一个URL和一个或多个部件名，并返回一个元组。所有输入参数和输出列类型都是字符串。
 部件名称：HOST，PATH，QUERY，REF，PROTOCOL，AUTHORITY，FILE，USERINFO，QUERY：
 注意：部件名区分大小写，不应包含不必要的空格。
 示例：
 > SELECT b。* FROM src LATERAL VIEW parse_url_tuple（fullurl，'HOST'，'PATH'，'QUERY'，'QUERY：id'）b as host，path，query，query_id LIMIT 1;
 > SELECT parse_url_tuple（a.fullurl，'HOST'，'PATH'，'QUERY'，'REF'，'PROTOCOL'，'FILE'，'AUTHORITY'，'

PERCENT_RANK

percentile
percentile（expr，pc） - 返回pc上expr的百分位数（范围：[0,1]）。pc可以是double或double数组

percentile_approx
percentile_approx（expr，pc，[nb]） - 对于非常大的数据，使用可选参数[nb]作为要使用的直方图区间数，从直方图计算近似百分位数值。较高的nb值导致更准确的近似，代价是更高的内存使用量。
 'expr'可以是任何数字列，包括双精度和浮点数，'pc'可以是具有请求百分位数的单个double / float，也可以是具有多个百分位数的double / float数组。如果未指定'nb'，则默认近似值使用10,000个直方图区间，这意味着如果'expr'中有10,000个或更少的唯一值，则可以获得精确的结果。百分位数（）函数总是计算精确百分位数，如果列中有太多唯一值，则可能会耗尽内存，这就需要此功能。
 示例（使用更精细的直方图近似请求三个百分位数）：
 > SELECT percentile_approx（val，array（0.5,0.95,0.98），100000）FROM somedata;
 [0.05,1.64,2.26]

pi
pi（） - 返回pi
 示例：
 > SELECT pi（）FROM src LIMIT 1;
 3.14159 ...

PMOD
a pmod b - 计算正模数

posexplode
posexplode（a） - 表现得像数组爆炸，但包括原始数组中项目的位置

positive
positive a - 返回a

POW
pow（x1，x2） - 将x1提升到x2的幂。
 同义词：power
 例如：
 > SELECT pow（2,3）FROM src LIMIT 1;
 8

power
power（x1，x2） - 将x1提升到x2的幂。
 同义词：pow
 示例：
 > SELECT power（2,3）FROM src LIMIT 1;
 8

printf
printf（String format，Obj ... args） - 可以根据printf样式格式字符串格式化字符串的 函数
 示例：
 > SELECT printf（“Hello World％d％s”，100，“days”）FROM src LIMIT 1;
 “Hello World 100天”

quarter
quarter（date / timestamp / string） - 返回日期的季度，范围为1到4.
 示例：> SELECT quarter（'2015-04-08'）;
 2

radians
radians（x） - 将度数转换为弧度
 例如：
 > SELECT radians（90）FROM src LIMIT 1;
 1.5707963267949mo

rand
rand（[seed]） - 返回0到1之间的伪随机数

rank

reflect
reflect（class，method [，arg1 [，arg2 ..]]）使用反射调用方法
 同义词：java_method
 使用此UDF通过匹配参数签名来调用Java方法

reflect2
reflect2（arg0，method [，arg1 [，arg2 ..]]）使用反射调用arg0的方法
 使用此UDF通过匹配参数签名来调用Java方法

regexp
str regexp regexp - 如果str匹配regexp则返回true，否则返回false
 同义词：rlike
 示例：
 > SELECT'fb'reexx ''*'FROM src LIMIT 1;
 真正

REGEXP_EXTRACT
regexp_extract（str，regexp [，idx]） - 提取与regexp匹配的组
 示例：
 > SELECT regexp_extract（'100-200'，'（\ d +） - （\ d +）'，1）FROM src LIMIT 1;
 '100'

REGEXP_REPLACE
regexp_replace（str，regexp，rep） - 将与regexp匹配的str的所有子串替换为rep
 示例：
 > SELECT regexp_replace（'100-200'，'（\ d +）'，'num'）FROM src LIMIT 1;
 'NUM-NUM'

REGR_AVGX
egr_avgx（y，x） - 计算自变量的平均值。
 该函数将任意一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 否则，它计算以下内容：
 AVG（X）

REGR_AVGY
regr_avgy（y，x） - 计算因变量的平均值。
 该函数将任何一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 否则，它会计算以下内容：
 AVG（Y）

REGR_COUNT
regr_count（y，x） - 返回非空对的数量
 该函数将任何一对数字类型作为参数，并返回long。
 任何具有NULL的对都将被忽略。

REGR_INTERCEPT
regr_intercept（y，x） - 返回回归线的y轴截距。
 该函数将任何一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 如果N * SUM（x * x）= SUM（x）* SUM（x）：返回NULL。
 否则，它计算以下内容：
 （SUM（y）* SUM（x * x）-SUM（X）* SUM（x * y））/（N * SUM（x * x）-SUM（x）* SUM（ X） ）

REGR_R2
regr_r2（y，x） - 返回回归线的确定系数（也称为R平方或拟合度）。
 该函数将任何一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 如果N * SUM（x * x）= SUM（x）* SUM（x）：返回NULL。
 如果N * SUM（y * y）= SUM（y）* SUM（y）：返回1。
 否则，它计算以下内容：
 POWER（N * SUM（x * y）-SUM（x）* SUM（y），2）/（（N * SUM（x * x）-SUM（x）* SUM（x ））*（N * SUM（y * y）-SUM（y）* SUM（y）））

REGR_SLOPE
regr_slope（y，x） - 返回线性回归线的斜率
 该函数将任意一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 如果N * SUM（x * x）= SUM（x）* SUM（x）：返回NULL（拟合将是垂直的）。
 否则，它计算如下：
 （N * SUM（x * y）-SUM（x）* SUM（y））/（N * SUM（x * x）-SUM（x）* SUM（x））

REGR_SXX
regr_sxx（y，x） - 辅助分析函数
 该函数将任何一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 否则，它计算以下内容：
 SUM（x * x）-SUM（x）* SUM（x）/ N.

REGR_SXY
regr_sxy（y，x） - 返回一个值，该值可用于评估回归模型的统计有效性。
 该函数将任何一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 如果N * SUM（x * x）= SUM（x）* SUM（x）：返回NULL。
 否则，它计算以下内容：
 SUM（x * y）-SUM（x）* SUM（y）/ N.

REGR_SYY
regr_syy（y，x） - 辅助分析函数
 该函数将任何一对数字类型作为参数，并返回一个double。
 任何具有NULL的对都将被忽略。
 如果应用于空集：返回NULL。
 否则，它计算以下内容：
 SUM（y * y）-SUM（y）* SUM（y）/ N.

repeat
repeat（str，n） - 重复str n次
 示例：
 > SELECT repeat（'123'，2）FROM src LIMIT 1;
 '123123'

replace
replace（str，search，rep） - 将'search'与'rep'匹配的所有子串替换为'rep'
 示例：
 > SELECT replace（'Hack and Hue'，'H'，'BL'）FROM src LIMIT 1;
 'BLACK和BLUE'

replicate_rows
replicate_rows（n，cols ...） - 将1行变为n行

reverse
reverse（str） - reverse str
 示例：
 > SELECT reverse（'Facebook'）FROM src LIMIT 1;
 'koobecaF'

RLIKE
str rlike regexp - 如果str匹配regexp则返回true，否则返回false
 别名：regexp
 示例：
 > SELECT'fb'rlike'。*'FROM src LIMIT 1;
 真正

round
round（x [，d]） - 舍入x到d小数位
 示例：
 > SELECT round（12.3456,1）FROM src LIMIT 1;
 12.3'

ROW_NUMBER

RPAD
rpad（str，len，pad） - 返回str，右边填充pad，长度为len
 如果str长于len，则返回值缩短为len个字符。
 如果是空填充字符串，则返回值为null。
 示例：
 > SELECT rpad（'hi'，5，'??'）FROM src LIMIT 1;
 “喜???”
 > SELECT rpad（'hi'，1，'??'）FROM src LIMIT 1;
 'h'
 > SELECT rpad（'hi'，5，''）FROM src LIMIT 1;
 空值

RTRIM
rtrim（str） - 从str中删除尾随空格字符
 例如：
 > SELECT rtrim（'facebook'）FROM src LIMIT 1;
 “Facebook的

second
second（date） - 返回字符串/ timestamp / interval的第二个组成部分
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'或'HH：mm：ss'的字符串。
 2.时间戳值
 3.日间隔值示例：
 > SELECT second（'2009-07-30 12:58:59'）FROM src LIMIT 1;
 59
 > SELECT second（'12：58：59'）FROM src LIMIT 1;
 59

sentences
sentences（str，lang，country） - 将str拆分成句子数组，其中每个句子都是一个单词数组。'lang'和'country'参数是可选的，如果省略，则使用默认语言环境。
 例如：
 > SELECT句子（'你好！我是UDF。'）FROM src LIMIT 1;
 [[“Hello”，“there”]，[“I”，“am”，“a”，“UDF”]]
 > SELECT句子（评论，语言）FROM movies;
 不必要的标点符号（例如英语中的句点和逗号）会自动删除。如果指定，'lang'应该是两个字母的ISO-639语言代码（例如'en'），'country'应该是两个字母的ISO-3166代码（例如'us'）。并非所有国家/地区和语言代码都受到完全支持，如果指定了不受支持的代码，则使用默认语言环境来处理该字符串。

sha
sha（str或bin） - 计算字符串或二进制的SHA-1摘要，并将值作为十六进制字符串返回。
 别名：sha1
 例如：
 > SELECT sha（'ABC'）;
 '3c01bdbb26f358bab27f267924aa2c9a03fcfdb8'
 > SELECT sha（binary（'ABC'））;
 '3c01bdbb26f358bab27f267924aa2c9a03fcfdb8'

sha1
sha1（str或bin） - 计算字符串或二进制的SHA-1摘要，并将值作为十六进制字符串返回。
 别名：sha
 示例：
 > SELECT sha1（'ABC'）;
 '3c01bdbb26f358bab27f267924aa2c9a03fcfdb8'
 > SELECT sha1（二进制（'ABC'））;
 '3c01bdbb26f358bab27f267924aa2c9a03fcfdb8'

SHA2
sha2（string / binary，len） - 计算SHA-2系列散列函数（SHA-224，SHA-256，SHA-384和SHA-512）。
 第一个参数是要进行哈希处理的字符串或二进制文件。第二个参数表示结果的所需位长度，其值必须为224,256,384,512或0（相当于256）。从Java 8开始支持SHA-224。如果任一参数为NULL或散列长度不是允许值之一，则返回值为NULL。
 示例：> SELECT sha2（'ABC'，256）;
 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78'

shiftleft
shiftleft（a，b） - 按位左移
 为tinyint，smallint和int a返回int。返回bigint的bigint a。
 示例：
 > SELECT shiftleft（2,1）;
 4

shiftright
shiftright（a，b） - 按位右移
 为tinyint，smallint和int a返回int。返回bigint的bigint a。
 示例：
 > SELECT shiftright（4,1）;
 2

shiftrightunsigned
shiftrightunsigned（a，b） - 按位无符号右移
 为tinyint，smallint和int a返回int。返回bigint的bigint a。
 示例：
 > SELECT shiftrightunsigned（4,1）;
 2

sign
sign（x） - 返回x的符号
 示例：
 > SELECT sign（40）FROM src LIMIT 1;
 1

sin
sin（x） - 返回x的正弦值（x以弧度表示）
 例如：
 > SELECT sin（0）FROM src LIMIT 1;
 0

size
size（a） - 返回a的大小

sort_array
sort_array（array（obj1，obj2，...）） - 根据数组元素的自然顺序按升序对输入数组进行排序。
 示例：
 > SELECT sort_array（array（'b'，'d'，'c'，'a'））FROM src LIMIT 1;
 'A B C D'

sort_array_by
sort_array_by（array（obj1，obj2，...），'f1'，'f2'，...，['ASC'，'DESC']） - 按用户指定的顺序（ASC，DESC）对输入元组数组进行排序by desired field [s] name如果用户未提及排序顺序，则dafault排序顺序为升序
 示例：
 > SELECT sort_array_by（array（struct（'g'，100），struct（'b'，200）），'col1 '，'ASC'） from src LIMIT 1;
 阵列（结构（ 'B'，200），结构（ 'G'，100））

soundex
soundex（string） - 返回字符串的soundex代码。
 soundex代码由名称的第一个字母后跟三个数字组成。
 示例：
 > SELECT soundex（'Miller'）;
 M460

space
space（n） - 返回n个空格
 示例：
 > SELECT space（2）FROM src LIMIT 1;
 ''

split
split（str，regex） - Splits str匹配正则表达式的匹配
 示例：
 > SELECT split（'oneAtwoBthreeC'，'[ABC]'）FROM src LIMIT 1;
 [“一二三”]

sq_count_check
sq_count_check（x） - 对标量子查询表达式进行内部检查，以确保返回最多一行
 仅供内部使用

sqrt
sqrt（x） - 返回x的平方根
 示例：
 > SELECT sqrt（4）FROM src LIMIT 1;
 2

stack
stack（n，cols ...） - 将k列转换为n行，每行大小为k / n

STD
std（x） - 返回一组数字的标准偏差
 别名：stddev，stddev_pop

STDDEV
stddev（x） - 返回一组数字的标准偏差
 别名：std，stddev_pop

STDDEV_POP
stddev_pop（x） - 返回一组数字的标准偏差
 别名：std，stddev

STDDEV_SAMP
stddev_samp（x） - 返回一组数字的样本标准差

str_to_map
str_to_map（text，delimiter1，delimiter2） - 通过解析文本
 使用两个分隔符将文本拆分为键值对来创建映射。第一个分隔符分隔对，第二个分隔符分配键和值。如果只给出一个参数，则使用默认分隔符：'，'作为delimiter1，'：'作为delimiter2。

struct
struct（col1，col2，col3，...） - 使用给定的字段值创建结构

SUBSTR
substr（str，pos [，len]） - 返回str的子字符串，该字符串以pos开头并且长度为len orsubstr（bin，pos [，len]） - 返回以pos开头且长度为的字节数组的片段len
 同义词：substring
 pos是一个基于1的索引。如果pos  SELECT substr（'Facebook'，5）FROM src LIMIT 1;
 'book'
 > SELECT substr（'Facebook'， - 5）FROM src LIMIT 1;
 'ebook'
 > SELECT substr（'Facebook'，5,1）FROM src LIMIT 1;
 'B'

substring
substring（str，pos [，len]） - 返回str的子字符串，该字符串以pos开头，长度为len orsubstring（bin，pos [，len]） - 返回以pos开头且长度为的字节数组的片段len
 同义词：substr
 pos是一个基于1的索引。如果pos  SELECT substring（'Facebook'，5）FROM src LIMIT 1;
 'book'
 > SELECT substring（'Facebook'， - 5）FROM src LIMIT 1;
 'ebook'
 > SELECT substring（'Facebook'，5,1）FROM src LIMIT 1;
 'B'

SUBSTRING_INDEX
substring_index（str，delim，count） - 在分隔符delim的计数出现之前，从字符串str返回子字符串。
 如果count为正数，则返回最终分隔符左侧的所有内容（从左侧开始计算）。如果count为负数，则返回最终分隔符右侧的所有内容（从右侧开始计算）。在搜索delim时，Substring_index执行区分大小写的匹配。
 示例：
 > SELECT substring_index（'www.apache.org'，'。'，2）;
 'www.apache'

sum
sum（x） - 返回一组数字的总和

tan
tan（x） - 返回x的正切（x是弧度）
 示例：
 > SELECT tan（0）FROM src LIMIT 1;
 1

to_date
to_date（expr） - 提取日期或日期时间表达式expr的日期部分
 示例：
 > SELECT to_date（'2009-07-30 04:17:52'）FROM src LIMIT 1;
 '2009-07-30'

to_unix_timestamp
to_unix_timestamp（date [，pattern]） - 返回UNIX时间戳
 将指定时间转换为自1970-01-01以来的秒数。

to_utc_timestamp
to_utc_timestamp（timestamp，string timezone） - 假设给定时间戳在给定时区内并转换为UTC（从Hive 0.8.0开始）

translate
translate（input，from，to） - 通过将from字符串中的字符替换为to字符串中的相应字符来转换输入字符串
 translate（字符串输入，字符串from，string to）是在PostGreSQL中翻译的等效函数。它在输入字符串（第一个参数）上逐个字符地工作。检查输入中的字符是否存在于from字符串中（第二个参数）。如果匹配发生，则获得字符串到字符串（第三个参数），该字符出现在与字符串中的字符相同的索引处。此字符在输出字符串中发出，而不是从输入字符串中的原始字符发出。如果to字符串比from字符串短，则to字符串中的相同索引处可能不存在字符。在这种情况下，原始字符不会发出任何内容，而是从输出字符串中删除它。
 例如，

 translate（'abcdef'，'adc'，'19'）返回'1b9ef'将'a'替换为'1'，'d'替换为'9'并从输入字符串中删除'c'

 （'abc d'， ''，''）返回'abcd'从输入字符串中删除所有空格

 如果输入字符串中多次出现相同的字符，则第一个出现的字符是考虑匹配的字符。但是，不建议在from字符串中多次使用相同的字符，因为它不是必需的，这增加了混乱。

 例如，

 translate（'abcdef'，'ada'，'192'）返回'1bc9ef'将'a'替换为'1'，将'd'替换为'9'

trim
trim（str） - 从str中删除前导和尾随空格字符
 示例：
 > SELECT trim（'facebook'）FROM src LIMIT 1;
 “Facebook的"

TRUNC
trunc（date，fmt）/ trunc（N，D） - 返回如果输入是日期，则返回日期，其中当天的时间部分被截断为格式模型fmt指定的单位。如果省略fmt，则日期将截断为最近的一天。它目前仅支持'MONTH'/'MON'/'MM'，'QUARTER'/'Q'和'YEAR'/'YYYY'/'YY'作为格式。如果输入是数字组，则返回N截断为D十进制地方。如果省略D，则N被截断为0位.D可以是负截断（使零）小数点左边的D位。
 date是格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。日期的时间部分被忽略。
 示例：
 > SELECT trunc('2009-02-12', 'MM');
 OK
 '2009-02-01'
 > SELECT trunc('2017-03-15', 'Q');
 OK
 '2017-01-01'
 > SELECT trunc('2015-10-27', 'YEAR');
 OK
 '2015-01-01' > SELECT trunc(1234567891.1234567891,4);
 OK
 1234567891.1234
 > SELECT trunc(1234567891.1234567891,-4);
 OK
 1234560000 > SELECT trunc(1234567891.1234567891,0);
 OK
 1234567891
 > SELECT trunc(1234567891.1234567891);
 OK
 1234567891

UCASE
ucase（str） - 返回str，所有字符都更改为大写
 同义词：upper
 示例：
 > SELECT ucase（'Facebook'）FROM src LIMIT 1;
 'FACEBOOK'

unbase64
unbase64（str） - 将参数从base 64字符串转换为binary

UNHEX
unhex（str） - 将十六进制参数转换为二进制
 执行HEX（str）的反向操作。也就是说，它将
 参数中的每对十六进制数字解释为数字，
 并将其转换为数字的字节表示形式。该
 结果字符返回一个二进制字符串。

 示例：
 > SELECT DECODE(UNHEX('4D7953514C'), 'UTF-8') from src limit 1;
 'MySQL'

 参数字符串中的字符必须是合法的十六进制
 数字：'0'..'9'，'A'..'F'，'a'..'f'。如果UNHEX（）
 在参数中遇到任何非十六进制数字，则返回NULL。也，

UNIX_TIMESTAMP
unix_timestamp（date [，pattern]） - 将时间
 转换为数字将指定时间转换为自1970-01-01以来的秒数。不推荐使用unix_timestamp（void）重载，使用current_timestamp。

upper
upper（str） - 返回str，所有字符都更改为大写
 同义词：ucase
 示例：
 > SELECT upper（'Facebook'）FROM src LIMIT 1;
 'FACEBOOK'

UUID
uuid（） - 返回通用唯一标识符（UUID）字符串。
 该值作为规范的UUID 36字符字符串返回。
 示例：
 > SELECT uuid（）;
 '0baf1f52-53df-487f-8292-99a03716b688'
 > SELECT uuid（）;
 '36718a53-84f5-45d6-8796-4f79983ad49d'

VAR_POP
var_pop（x） - 返回一组数字的
 方差同义词：方差

VAR_SAMP
var_samp（x） - 返回一组数字的样本方差

variance
variance（x） - 返回一组数字的方差
 同义词：var_pop

version
version（） - 返回Hive构建版本字符串 - 包括基本版本和修订版本。

WEEKOFYEAR
weekofyear（date） - 返回给定日期的一年中的一周。一周被认为是在星期一开始，第一周是第一周，> 3天。
 示例：
 > SELECT weekofofar（'2008-02-20'）FROM src LIMIT 1;
 8
 > SELECT weekofyear（'1980-12-31 12:59:59'）FROM src LIMIT 1;
 1

when
CASE WHEN a THEN b [WHEN c THEN d]* [ELSE e] END - When a = true, returns b; when c = true, return d; else return e
 Example:
 SELECT
 CASE
 WHEN deptno=1 THEN Engineering
 WHEN deptno=2 THEN Finance
 ELSE admin
 END,
 CASE
 WHEN zone=7 THEN Americas
 ELSE Asia-Pac
 END
 FROM emp_details

windowingtablefunction

XPath
xpath（xml，xpath） - 返回xml节点中与xpath表达式匹配的值的字符串数组
 示例：
 > SELECT xpath（'  b1   b2   b3   c1   c2  '，'a / text（）'）FROM src LIMIT 1
 []
 > SELECT xpath（'  b1   b2   b3   c1   c2  '，'a / b / text（）'）FROM src LIMIT 1
 [“b1”，“b2”，“b3”]
 > SELECT xpath（'  b1   b2   b3   c1   c2  '，'a / c / text（）'）FROM src LIMIT 1
 [“c1”，“c2”]

xpath_boolean
xpath_boolean（xml，xpath） - 计算布尔xpath表达式
 示例：
 > SELECT xpath_boolean（'  1  '，'a / b'）FROM src LIMIT 1;
 true
 > SELECT xpath_boolean（'  1  '，'a / b = 2'）FROM src LIMIT 1;
 假

xpath_double
xpath_double（xml，xpath） - 返回与xpath表达式匹配的double值
 别名：xpath_number
 示例：
 > SELECT xpath_double（'  1   2  ' ，'sum（a / b）'） from src LIMIT 1;
 3.0

xpath_float
xpath_float（xml，xpath） - 返回与xpath表达式匹配的浮点值
 示例：
 > SELECT xpath_float（'  1   2  '，'sum （a / b）'）FROM src LIMIT 1;
 3.0

xpath_int
xpath_int（xml，xpath） - 返回与xpath表达式匹配的整数值
 示例：
 > SELECT xpath_int（'  1   2  '，'sum （a / b）'）FROM src LIMIT 1;
 3

xpath_long
xpath_long（xml，xpath） - 返回与xpath表达式匹配的long值
 示例：
 > SELECT xpath_long（'  1   2  '，'sum （a / b）'）FROM src LIMIT 1;
 3

xpath_number
xpath_number（xml，xpath） - 返回与xpath表达式匹配的double值
 别名：xpath_double
 示例：
 > SELECT xpath_number（'  1   2  ' ，'sum（a / b）'）from src LIMIT 1;
 3.0

xpath_short
xpath_short（xml，xpath） - 返回与xpath表达式匹配的short值
 示例：
 > SELECT xpath_short（'  1   2  '，'sum （a / b）'）FROM src LIMIT 1;
 3

xpath_string
xpath_string（xml，xpath） - 返回与xpath表达式匹配的第一个xml节点的文本内容
 示例：
 > SELECT xpath_string（'  b   cc  '，'a / c'）FROM src LIMIT 1;
 'cc'
 > SELECT xpath_string（'  b1   b2  '，'a / b'）FROM src LIMIT 1;
 'b1'
 > SELECT xpath_string（'  b1   b2  '，'a / b [2]'）FROM src LIMIT 1;
 'b2'
 > SELECT xpath_string（'  b1   b2  '，'a'）FROM src LIMIT 1;
 'B1B2'

year
year（param） - 返回日期/时间戳/间隔的年份组件
 param可以是以下之一：
 1。格式为'yyyy-MM-dd HH：mm：ss'或'yyyy-MM-dd'的字符串。
 2.日期值
 3.时间戳值
 4.年 - 月间隔值示例：
 > SELECT year（'2009-07-30'）FROM src LIMIT 1;
 2009年
