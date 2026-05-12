# 10、Oracle 基础教程 - Oracle正则表达式
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/10.html
- 分类：缓存数据库
- 分组：教程目录
正则表达式 (Regular expression) 是一种强大的文本处理工具，Oracle数据库自9i版本开始引入了正则表达式支持，可帮助开发者快速而准确地匹配、查找和替换字符串，广泛应用于数据查询、数据分析、数据清洗等领域。

## 1. 基本语法

Oracle正则表达式的语法基于Perl语言的正则表达式语法，区分大小写（case sensitive）。

**（1）字符匹配**

- .：匹配除了换行外的任意一个字符；
- \d：匹配任何数字，相当于 [0-9]；
- \D：匹配任何非数字字符，相当于 [^0-9]；
- \w：匹配任何字母数字字符或下划线，相当于 [a-zA-Z0-9_]；
- \W：表示匹配任何非字母数字字符或下划线，相当于 [^a-zA-Z0-9_]。

**（2）限定符**

- *：匹配前一个字符出现0次或多次；
- +：匹配前一个字符出现1次或多次；
- ?：匹配前一个字符出现0次或1次；
- {n}：匹配前一个字符出现n次；
- {n,}：匹配前一个字符出现n次或更多；
- {n,m}：匹配前一个字符出现n~m次。

`'|'` ：指两项之间的一个选择。

**e.g.**

`^([a-z]+|[0-9]+)$`：表示所有小写字母或数字组合成的字符串。

**（3）边界匹配**

- ^：匹配开始位置；
- `$`：匹配结束位置；
- \b：匹配单词边界，即单词的开头或结尾位置；
- \B：匹配非单词边界，即不是单词的开头或结尾位置。

**（4）分组和引用**

- ()：分组，标记一个子表达式的开始和结束位置；
- \num：引用第num个子表达式，num从1开始。

**（5）字符集合**

- []：表示一组字符中的任意一个。

**（6）转义符**

- \：表示转义一个字符。

oracle正则表达式还支持一些高级语法，例如贪婪匹配、非贪婪匹配、零宽断言(zero-width assertion)、后向引用(backreference)、捕获组等。

## 2. POSIX字符类

Oracle数据库中的POSIX字符类是一组特殊的字符类，用于在正则表达式中匹配特定的字符。

POSIX字符类以 `[:` 开头，以 `:]` 结尾，中间包含一个或多个字符，代表特定的字符集合。POSIX字符类中的字符集合可以是预定义的，也可以是自定义的。

- [[:alpha:]] 任何字母，等同于字符集合 [a-zA-Z]；
- [[:digit:]] 任何数字，等同于字符集合 [0-9]；
- [[:alnum:]] 任何字母和数字，等同于字符集合 [a-zA-Z0-9]；
- [[:space:]] 任何白字符；
- [[:upper:]] 任何大写字母；
- [[:lower:]] 任何小写字母；
- [[:punct:]] 任何标点符号；
- [[:xdigit:]] 任何16进制的数字，相当于[0-9a-fA-F]。

Oracle数据库中，POSIX字符类可以用于各种正则表达式相关的操作，如模式匹配、替换、分割等。由于Oracle数据库中的POSIX字符类与其他数据库或编程语言中的POSIX字符类可能略有不同，具体使用时需要查看相关文档。

## 3. 正则表达式函数

Oracle数据库提供了多种正则表达式函数，可以对文本数据进行匹配、替换等操作。

- REGEXP_LIKE: 判断字符串是否匹配指定的正则表达式。

**e.g.** 查询员工名字以"S"开头，以"n"结尾的记录：

```java
SELECT * FROM emp WHERE REGEXP_LIKE(emp_name, '^S.*n$');
```

- REGEXP_REPLACE: 替换字符串中的子串。

**e.g.** 将字符串"12345"中连续的三个数字替换成星号"*"，输出

“*45”：

```java
SELECT REGEXP_REPLACE('12345', '\d{3}', '*') FROM dual;
```

- REGEXP_SUBSTR: 提取字符串中匹配指定正则表达式的子串。

**e.g.** 从字符串"abc 123 def"中提取出连续的数字"123"：

```java
SELECT REGEXP_SUBSTR('abc 123 def', '\d+') FROM dual;
```

- REGEXP_INSTR: 返回字符串中匹配指定正则表达式的子串的位置。

**e.g.** 返回字符串"1ab2cd3ef"中第一个连续数字的起始位置，即1

```java
SELECT REGEXP_INSTR('1ab2cd3ef', '\d+') FROM dual;
```

## 4. 常用正则表达式

```java
-- 查询value中不是纯数字的记录
select * from employee where not regexp_like(value,'^[[:digit:]]+$');
```

```java
-- 查询value中不包含任何数字的记录。
select * from employee where regexp_like(value,'^[^[:digit:]]+$');
```

```java
--查询所有包含小写字母或者数字的记录。
select * from employee where regexp_like(value,'^([a-z]+|[0-9]+)$');
```

```java
-- 提取字符串中的数字
create or replace function EXTRACT_NUMBER(STR in varchar2) return varchar2 is
  POSITION number;
  STR_EXT varchar2(800);
  STR_TMP varchar2(800);
  result  varchar2(800);
begin
  STR_EXT:=STR;
  POSITION:=1;
  LOOP
    STR_TMP:=REGEXP_SUBSTR(STR_EXT,'([0-9]+)',POSITION);
    result:=result||STR_TMP;
    STR_EXT:= SUBSTR(STR_EXT,POSITION+LENGTH(STR_TMP),LENGTH(STR));
    POSITION:=regexp_instr(STR_EXT,'([0-9]+)',1);
  exit when POSITION is null or POSITION=0;
  end loop;
  return(result);
end EXTRACT_NUMBER;
```
