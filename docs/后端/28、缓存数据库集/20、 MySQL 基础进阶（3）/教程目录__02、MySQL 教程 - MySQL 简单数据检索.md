# 02、MySQL 教程 - MySQL 简单数据检索
- 来源：https://ddkk.com/zhuanlan/db/mysql/8/2.html
- 分类：缓存数据库
- 分组：教程目录
## 数据检索

DQL实现数据检索：通过SELECT语句从一个或多个表中检索数据

```java
SELECT语句的数据检索格式：
SELECT  [ALL|DISTINCT]  字段名 
FROM  表名
[WHERE 条件表达式]
[GROUP BY 字段名|位置 [ASC|DESC] [HAVING 条件表达式]]
[ORDER BY 字段名|表达式|位置[ASC|DESC]]
[LIMIT  M[，N]]；
```

1）FROM：指定查询对象（基本表或视图）

2）WHERE：指定条件表达式以过滤数据

3）GROUP BY：对查询结果按指定字段值分组（属性列值相等的元组为一组）

4）ORDER BY：对查询结果按指定字段值的升序或降序排序

5）LIMIT：限制检索结果显示行数

//HAVING：与GROUP BY语句组合使用，筛选出满足指定条件的组

//以上语句顺序不可调换，否则会产生错误信息

SELECT检索执行顺序：

1）先从FROM子句开始（从那张表查）；

2）根据SELECT子句确定返回那些列（确定列名）；

3）根据WHERE子句进行筛选（查询符合条件数据）；

4）依次进行GROUP BY、ORDER BY、LIMIT；

### 简单检索

如：检索products表中prod_name的所有信息

1）SELECT后跟多个字段时，代表检索多个字段的数据（逗号分隔）；

如：检索products表中prod_id、prod_name和prod_price的所有信息

2）SELECT后跟“*”，代表检索该表中的所有字段；

如：检索products表中所有字段的所有信息；

3）SELECT指定的字段后跟“AS 别名“代表给字段设置别名；

//其中“AS”可省略，直接跟别名也代表设置别名

如：将检索prod_name和prod_price字段分别设置为别名name和price

4）SELECT后跟“DISTINCT”代表去除重复行显示；

//默认为“ALL”显示全部（可省略）

//若指定DISTINCT/ALL，代表所有字段都需去除重复行

//且指定多个字段时，多个字段的笛卡尔积需不重复才可去除

如：检索products表中的vend_id字段，且去除重复行

如：检索products表中的vend_id和prod_price字段，且去除重复行

#### WHERE

WHERE：指定条件表达式以过滤数据

条件表达式
运算符

比较条件检索
=、>、=、

范围检索
BETWEEN AND、NOT BETWEEN AND

集合检索
IN、NOT IN

模糊检索
LIKE、NOT LIKE

空值检索
IS NULL、IS NOT NULL

多重条件检索
AND（&&）、OR（||）、XOR

逻辑操作符（Logical Operator）：联结WHERE子句中的条件

逻辑操作符
说明

AND
逻辑与运算

OR
逻辑或运算

1）若有多个条件与/或运算，则每个条件都需使用AND联结

2）AND优先级高于OR（同时调用两者时需用“（）”进行优先级处理）

//`（）`的优先级最高

##### 比较条件检索

如：检索products表中prod_price字段值为2.50的行

如：检索products表中prod_name字段值为fuses的行；

//进行字符串的比较时需用单引号括起来（数值不需要）

如：检索products表中vend_id字段值不等于1003的行；

##### 多重条件检索

如：检索products表中vend_id为1003，prod_price小于10的行

如：检索products表中vend_id字段值为1002或1003的行

如：检索products表中vend_id为1002或1003且prod_price大于等于10的行

##### 范围检索

如：检索products表中prod_price字段值在5到10之间的行；

//BETWEEN M AND N代表值在M~N之间（包括M和N）的都匹配

//NOT BETWEEN AND不包含边界值

##### 空值检索

NULL：代表一个字段中的某行不含数据类型的值

1）NULL不同于0、空字符串和空格

2）不能使用“`= NULL`”（NULL是一个不确定的值）

如：检索customers表中cust_email字段值是否为NULL；

##### 集合检索

IN：判断字段的值是否在集合中

1）集合一般使用“`（）`”表示

2）当字段值表中存在任一满足匹配的值时就返回该行

3）IN可用OR转换，NOT IN可用AND转换

//IN相较于OR优势：执行更快、可包含其他SELECT语句（子查询）

如：检索products表中vend_id是1002和1005的prod_name；

如：检索products表中vend_id不是1002和1003的prod_name；

##### 模糊检索

LIKE：利用通配符和部分已知信息进行模糊匹配

通配符：匹配值的一部分的特殊字符

通配符
说明

%（百分号）
代表0、1或多个字符串的长度

_（下划线）
代表1个字符串的长度

1）通配符可在字符串中任意位置使用，且没有数量限制（不能匹配NULL）

2）查询包含通配符的字符串时，需使用转义字符（`\\`）对通配符进行转义

//转义字符位于要转义的通配符前

如：检索products表中prod_name字段值以jet开头的行

如：检索products表中prod_name字段值中包含anvil的行

如：检索products表中prod_name字段值中包含ton且前有单个字符的行

#### GROUP BY

GROUP BY：对查询结果按指定字段值分组（便于调用聚合函数运算）

1）分组：数据按照1个或多个字段分组（字段值相同的分为一组）

2）GROUP BY在选择字段时应选利于聚合函数使用的字段

//分组会细化聚合函数（查询且分组后函数会应用于每个组，并每组返回一个值）

使用GROUP BY分组的规定：

1）GROUP BY可包含任意数目的字段，能对分组进行嵌套；

2）GROUP BY若嵌套了分组，数据将在最后规定的分组上进行汇总；

3）GROUP BY包含的字段都必须是SELECT检索的字段/表达式；

4）分组中若含有NULL，则NULL将单独作为一个分组；

//GROUP BY中的表达式不能使用别名

如：检索products表中每个vend_id所拥有数据的行

如：检索products表每个vend_id所拥有数据的行，并进行汇总

//WITH ROLLUP选项：对所有分组进行汇总运算

//汇总所在行的标题默认为NULL

如：检索orders表中cust_id字段中具有相同值个数大于2的cust_id行

//HAVING 条件表达式：以条件表达式过滤分组后的数据

//HAVING类似于WHERE并且HAVING支持WHERE中的所有操作符和语法

区别
WHERE子句
HAVING子句

主要用处
过滤数据行
过滤分组

聚合函数
不可以包含
可以包含

使用时间
在数据分组前进行过滤
在数据分组后进行过滤

如：检索products表中含有2个prod_price大于10的vend_id

如：检索orderitems表中quantity和item_price字段的积大于50的order_num和其quantity和item_price字段的积，并按积进行降序排序

//GROUP BY中的ASC/DESC排序是按照分组后的数据进行排序

GROUP_CONCAT()函数可与GROUP BY子句联用实现：检索结果分组后的字段值（NULL值除外）使用逗号连接起来在同一行下

如：检索products表中每个vend_id字段所对应的prod_name字段

#### ORDER BY

ORDER BY：对检索结果按指定字段值的升序/降序排序显示

1）检索数据结果默认以在底层表中保存的顺序进行显示（不唯一）

2）使用多个字段指定排序时，字段名之间使用“，”分割；

3）可在每个字段后添加ASC/DESC指定升序/降序排序；

如：检索products表中的prod_name字段，且按照prod_price排序显示；

//ORDER BY指定的字段是SELECT指定的字段，也可是该表中的其他字段

如：检索prod_id、prod_price和prod_name，调用prod_price和prod_name排序

//排序顺序从左往右

//若第一个字段支持排序的完成（无相同值），则不会调用其他字段进行排序

如：检索vend_id和prod_price，调用vend_id降序和prod_price升序排序

//默认以ASC（升序）排序，且排序方向是从上至下

//若每个字段都需单独指定ASC/DESC（ASC可省略）

#### LIMIT

LIMIT：限制显示查询出来的行数

1）若指定显示的行数超过检索结果行数，则默认显示所有行数

2）LIMIT语句中不进行运算（若需变量运算，在LIMIT语句前执行）

(1）`LIMIT M`：代表仅显示检索结果的前M行；

1)从检索结果的第一行开始显示（包括第一行）

如：检索products表中prod_name字段，且仅显示前5行

(2）`LIMIT M，N`；代表检索结果从第M行开始显示前N行；

1)检索结果不包含第M行

2)LIMIT M，N等效于`LIMIT N OFFSET M`

如：检索products表中的prod_name字段，仅显示2到5行（显示4行内容）

#### 正则表达式

**REGEXP**：代表利用正则表达式检索表中数据

//正则表达式：匹配文本中特殊的字符串（不区分大小写）

1）“.”正则表达式中代表通配符可匹配任意多个字符（不包含0个）；

如：检索products表中prod_name字段值中含有000的行

2）“|”在正则表达式中代表或运算（OR）；

如：检索products表中prod_name字段值包含1000或2000的行

3）“[ ]”在正则表达式中可定义“或集合”；

//可理解为“[ ]”是“|”的另一种形式

如：检索products表中prod_name字段值包含1 Ton或2 Ton或3 Ton的行

//不等效“1|2|3 Ton”，其代表1或2或3 Ton的行

4）“^”在正则表达式中代表NOT；

//在正则表达式中“^”所处的位置不同，其含义也不同

如：检索products表中prod_name字段值不包含1 Ton或2 Ton或3 Ton的行

5）“-”在正则表达式中代表范围的指定；

如：检索products表中prod_name字段值包含1 Ton或2 Ton或3 Ton的行

6）检索包含特殊字符的字符串时，需在特殊字符前加转义字符“\\”；

//转义字符匹配反斜杠则是“\\\”

如：检索products表中prod_name字段值包含“.”的行

7）利用字符类实现和元字符实现指定位置的字符串或重复字符串的检索；

字符类：预定义的字符集

字符类
说明

[:alnum:]
任意字符和数字（同[a-zA-Z0-9]）

[:alpha:]
任意字符（同[a-zA-Z]）

[:blank:]
空格和制表（同[\\t]）

[:cntrl:]
ASCII控制字符（ASCII的0到31和127）

[:digit:]
任意数字（同[0-9]）

[:graph:]
同[:printL]但不包含空格

[:lower:]
任意小写字符（[a-z]）

[:print:]
任意可打印字符

[:punct:]
不属于[:alnum:]和[:cntrl:]中的字符

[:space:]
空格和任意空白字符（同[\\f\\n\\r\\t\\v]）

[:upper:]
任意大写字母（同[A-Z]）

[:xdigit:]
任意十六进制数字（同[a-fA-F0-9]

元字符：在字符前后，代表字符可能出现的次数和位置

元字符
说明

*
0个或多个

+
1个或多个（同{1，}）

？
0个或1个（同{0，1}）

{n}
n个

{n，}
不少于n个

{n，m}
在n到m之间（包含边界，m不能超过255）

^
字符串的开头

$
字符串的结尾

[[::]]
词的结尾

如：检索products表中prod_name字段中包含stick或sticks的行

如：检索products表中prod_name字段中包含4为数字的行

如：检索products表中prod_name字段包含“.”或数字开头的行

#### 拼接字段

**拼接字段**：将检索出的多个字段的值联结到一起构成单个字段值

1）拼接字段是SELET语句中使用CONCAT（）函数实现

如：检索vendor表中的vend_name和vend_country字段，并拼接成单个字段

#### 字段运算

**字段运算**：将检索出的字段值进行算数计算

1）必须为其设置别名

操作符
说明

+
加

-
减

*
乘

/
除

//为确保运算顺序，可调用圆括号（优先级最高）处理计算顺序

如：检索orederitmes表中的quantity和item_price字段的积

#### 聚合函数

**聚合函数**：对数据进行计算并返回单个值的函数

1）聚合函数常用在SELECT之后，不能出现在WHERE子句中；

2）没有分组时，聚合函数作用于整张表中满足WHERE条件的所有记录；

聚合函数
说明

COUNT（*）
返回指定表中所具有行的个数 （不论该行是否为NULL）

COUNT（[distinct|all] 列名）
返回指定列中非NULL的行的个数

AVG（[distinct|all] 列名）
返回指定列中非NULL值的平均值

SUM（[distinct|all] 列名）
返回指定列中非NULL值之和

MAX（列名）
返回指定列中非NULL值的最大值

MIN（列名）
返回指定列中非NULL值的最小值

//ALL（显示全部结果）、DISTINCT（去重后显示），且默认为ALL

//ALL/DISTINCT也可用于MAX（）和MIN函数，但无实际意义

如：检索customers表中所具有行的个数

如：检索customers表中所具有非NULL的行的个数

如：检索products表中的prod_price字段，计算其平均值

如：检索orderitems表中quantity字段的总和

如：检索products表中prod_price字段中最大值的行

如：检索products表中prod_price字段中最小值的行
