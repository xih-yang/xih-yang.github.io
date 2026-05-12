# 22、MariaDB 正则表达式
- 来源：https://ddkk.com/zhuanlan/db/mariadb/22.html
- 分类：缓存数据库
- 分组：教程目录
除了LIKE子句提供的模式匹配之外，MariaDB通过REGEXP运算符提供基于正则表达式的匹配。 运算符基于给定模式对字符串表达式执行模式匹配。

MariaDB 10.0.5引入了PCRE Regular Expressions，这大大增加了匹配范围，如递归模式，前瞻断言等等。

查看下面给出的标准REGEXP运算符语法的使用 –

```sql
SELECT column FROM table_name WHERE column REGEXP '[PATTERN]';
```

REGEXP返回1表示模式匹配，或0表示没有模式匹配。

相反的选项以NOT REGEXP的形式存在。 MariaDB还提供REGEXP和NOT REGEXP，RLIKE和NOT RLIKE的同义词，它们是出于兼容性原因而创建的。

比较的模式可以是文字字符串或其他内容，如表列。 在字符串中，它使用C转义语法，所以加倍任何“\”字符。 REGEXP也是不区分大小写的，二进制字符串除外。

下面给出了可以使用的可能模式的表格 –

S.No
图案和说明

1
^

它匹配字符串的开头。

2
 `$`

它匹配字符串的结尾。

3

**.**

它匹配单个字符。

4

**[…]**

它匹配括号中的任何字符。

5

**[^ …]**

它匹配括号中未列出的任何字符。

6

**P1 | P2 | P3**

它匹配任何模式。

7

*****

它匹配前面元素的0个或多个实例。

8

**+**

它匹配前一个元素的1个或多个实例。

9

**{N}**

它匹配前面元素的n个实例。

10

**{M，N}**

它匹配m到前面元素的n个实例。

查看下面给出的模式匹配示例 –

以“pr”开头的产品 –

```sql
SELECT name FROM product_tbl WHERE name REGEXP '^pr';
```

以“na”结尾的产品 –

```sql
SELECT name FROM product_tbl WHERE name REGEXP 'na$';
```

以元音开头的产品 -

```sql
SELECT name FROM product_tbl WHERE name REGEXP '^[aeiou]';
```
