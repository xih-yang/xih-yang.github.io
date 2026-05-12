# 20、MySQL 调优 - MySQL 之Server SQL Modes
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/20.html
- 分类：缓存数据库
- 分组：教程目录
## MySQL SQL modes概述

MySQL服务器可以以不同的SQL Modes运行，并且可以根据sql_mode系统变量的值对不同的客户端应用不同的SQL Modes。dba可以设置全局SQL Modes以匹配站点服务器操作需求，每个应用程序可以根据自己的需求设置会话SQL Modes。

模式影响MySQL支持的SQL语法和它执行的数据验证检查。这使得在不同的环境中使用MySQL以及与其他数据库服务器一起使用MySQL变得更加容易。

**1、** 设置SQL模式；

**2、** 最重要的SQL模式；

**3、** 完整的SQL模式列表；

**4、** 结合SQL模式；

**5、** 严格的SQL模式；

**6、** “忽略关键字”和“严格SQL模式”的比较；

当使用InnoDB表时，还要考虑innodb_strict_mode系统变量。它支持对InnoDB表进行额外的错误检查。

## 一. 设置SQL模式

MySQL 8.0中默认的SQL模式包括:ONLY_FULL_GROUP_BY、STRICT_TRANS_TABLES、NO_ZERO_IN_DATE、NO_ZERO_DATE、ERROR_FOR_DIVISION_BY_ZERO和NO_ENGINE_SUBSTITUTION。

要在服务器启动时设置SQL模式，可以在命令行中使用–sql-mode=“modes” 选项，或者在my.cnf (Unix操作系统)或my.ini (Windows)等选项文件中使用 sql-mode=“modes” 选项。Modes是一个用逗号分隔的不同模式列表。要显式清除SQL模式，请在命令行使用–sql-mode="" 将其设置为空字符串，或在选项文件中使用–sql-mode="" 。

要在运行时更改SQL模式，请使用set语句设置全局或会话sql_mode系统变量:

```java
SET GLOBAL sql_mode = 'modes';
SET SESSION sql_mode = 'modes';
```

设置GLOBAL变量需要SYSTEM_VARIABLES_ADMIN特权(或已弃用的SUPER特权)，并影响从那时起连接的所有客户机的操作。设置SESSION变量只影响当前客户端。每个客户端都可以随时更改其会话sql_mode值。

要确定当前的全局或会话sql_mode设置，请选择其值:

```java
SELECT @@GLOBAL.sql_mode;
SELECT @@SESSION.sql_mode;
```

**重点**

SQL模式和用户定义分区。在创建数据并将数据插入分区表之后更改服务器SQL模式，可能会导致此类表的行为发生重大变化，并可能导致数据丢失或损坏。强烈建议您在使用用户定义分区创建表之后不要更改SQL模式。

在复制分区表时，源和副本上不同的SQL模式也会导致问题。为了获得最佳结果，您应该始终在源和副本上使用相同的服务器SQL模式。

## 二. 最重要的SQL模式

最重要的sql_mode值可能是:

**1、** ANSI；

这种模式改变语法和行为，以更接近标准SQL。

**2、** STRICT_TRANS_TABLES；

如果一个值不能按给定的方式插入到事务表中，则中止该语句。对于非事务性表，如果值出现在单行语句或多行语句的第一行，则中止语句。

**3、** TRADITIONAL；

让MySQL表现得像一个“传统的”SQL数据库系统。这种模式的简单描述是，当向列中插入不正确的值时，“给出错误而不是警告”。它是本节末尾列出的一种特殊的组合方式。

当提到“严格模式”时，它指的是启用了STRICT_TRANS_TABLES或STRICT_ALL_TABLES中的一个或两个模式。

## 三. 完整的SQL模式列表

下面的列表描述了所有支持的SQL模式:

### 3.1 ALLOW_INVALID_DATES

不要完全检查日期。只检查月的取值范围是1 ~ 12，日的取值范围是1 ~ 31。这对于Web应用程序可能很有用，因为Web应用程序在三个不同的字段中获取年、月和日，并准确存储用户插入的内容，而不需要进行日期验证。此模式适用于DATE和DATETIME列。它不应用TIMESTAMP列，因为它总是需要一个有效的日期。

禁用ALLOW_INVALID_DATES后，服务器要求月和日的值是合法的，而不仅仅是分别在1到12和1到31之间。禁用严格模式后，无效日期(如“2004-04-31”)将被转换为“0000-00-00”，并生成一个警告。启用严格模式时，无效日期将产生错误。要允许这样的日期，启用ALLOW_INVALID_DATES。

### 3.2 ANSI_QUOTES

将"作为标识符引号字符(像’引号字符)，而不是作为字符串引号字符。在启用此模式时，您仍然可以使用’引用标识符。启用ANSI_QUOTES后，不能使用双引号来引用文字字符串，因为它们被解释为标识符。

### 3.3 ERROR_FOR_DIVISION_BY_ZERO

ERROR_FOR_DIVISION_BY_ZERO模式影响对除零的处理，包括MOD(N,0)。对于数据更改操作(INSERT、UPDATE)，其效果还取决于是否启用了严格SQL模式。

如果未启用此模式，则按零除法将插入NULL并不会产生警告。

如果启用此模式，则按零除法将插入NULL并产生警告。

如果启用了该模式和strict模式，除零将产生错误，除非同时给出IGNORE。对于INSERT IGNORE和UPDATE IGNORE，除0将插入NULL并产生警告。

对于SELECT，除零返回NULL。无论是否启用了严格模式，启用ERROR_FOR_DIVISION_BY_ZERO都会导致产生一个警告。

ERROR_FOR_DIVISION_BY_ZERO弃用。ERROR_FOR_DIVISION_BY_ZERO不是严格模式的一部分，但应该与严格模式一起使用，并在默认情况下启用。如果启用ERROR_FOR_DIVISION_BY_ZERO而没有启用严格模式，则会出现警告，反之亦然。

由于ERROR_FOR_DIVISION_BY_ZERO已弃用，您应该期望它在未来的MySQL版本中作为一个单独的模式名被删除，其效果包括在strict SQL模式的效果中。

### 3.4 HIGH_NOT_PRECEDENCE

NOT操作符的优先级是这样表情,如不是一个b和c之间的解析(b和c)之间。在一些老版本的MySQL,解析表达式是(不是)b和c之间。旧的优先级高的行为可以通过启用HIGH_NOT_PRECEDENCE SQL模式。

```java
mysql> SET sql_mode = '';
mysql> SELECT NOT 1 BETWEEN -5 AND 5;
        -> 0
mysql> SET sql_mode = 'HIGH_NOT_PRECEDENCE';
mysql> SELECT NOT 1 BETWEEN -5 AND 5;
        -> 1
```

### 3.5 IGNORE_SPACE

允许在函数名和字符之间有空格。这将导致内置函数名被视为保留字。。例如，因为有一个COUNT()函数，在下面的语句中使用COUNT作为表名会导致错误:

```java
mysql> CREATE TABLE count (i INT);
ERROR 1064 (42000): You have an error in your SQL syntax
```

表名应加引号:

```java
mysql>` CREATE TABLE count (i INT);
Query OK, 0 rows affected (0.00 sec)
```

IGNORE_SPACE SQL模式适用于内置函数，而不适用于可加载函数或存储函数。无论是否启用了IGNORE_SPACE，总是允许在可加载函数或存储函数名之后有空格。

### 3.6 NO_AUTO_VALUE_ON_ZERO

NO_AUTO_VALUE_ON_ZERO影响对AUTO_INCREMENT列的处理。通常，通过向列插入NULL或0来生成列的下一个序列号。NO_AUTO_VALUE_ON_ZERO抑制了0的这种行为，因此只有NULL才生成下一个序列号。

如果0存储在表的AUTO_INCREMENT列中，则此模式非常有用。(顺便说一下，存储0不是推荐的做法。)例如，如果您使用mysqldump转储表，然后重新加载它，MySQL通常在遇到0值时生成新的序号，导致表的内容与转储的内容不同。在重新加载转储文件之前启用NO_AUTO_VALUE_ON_ZERO可以解决这个问题。由于这个原因，mysqldump会自动在输出中包含一条启用NO_AUTO_VALUE_ON_ZERO的语句。

### 3.7 NO_BACKSLASH_ESCAPES

启用此模式将禁用在字符串和标识符中使用反斜杠字符()作为转义字符。启用此模式后，反斜杠就变成了与其他字符一样的普通字符，并且like表达式的默认转义序列将被更改，因此不会使用转义字符。

### 3.8 NO_DIR_IN_CREATE

创建表时，请忽略所有INDEX DIRECTORY和DATA DIRECTORY指令。这个选项在副本服务器上很有用。

### 3.9 NO_ENGINE_SUBSTITUTION

当CREATE TABLE或ALTER TABLE等语句指定禁用或未在其中编译的存储引擎时，控制默认存储引擎的自动替换。

默认情况下，NO_ENGINE_SUBSTITUTION是启用的。

因为存储引擎可以在运行时插入，不可用引擎的处理方式是一样的:

禁用NO_ENGINE_SUBSTITUTION后，对于CREATE TABLE将使用默认引擎，如果所需引擎不可用，将出现警告。对于ALTER TABLE，会出现警告，但不会更改表。

在启用NO_ENGINE_SUBSTITUTION时，如果所需的引擎不可用，就会发生错误，不会创建或更改表。

### 3.10 NO_UNSIGNED_SUBTRACTION

整数值之间的减法，其中一个是UNSIGNED类型，默认情况下会产生一个UNSIGNED结果。如果结果是负数，则会出现一个错误:

```java
mysql> SET sql_mode = '';
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT CAST(0 AS UNSIGNED) - 1;
ERROR 1690 (22003): BIGINT UNSIGNED value is out of range in '(cast(0 as unsigned) - 1)'
```

如果启用NO_UNSIGNED_SUBTRACTION SQL模式，结果是负数:

```java
mysql> SET sql_mode = 'NO_UNSIGNED_SUBTRACTION';
mysql> SELECT CAST(0 AS UNSIGNED) - 1;
+-------------------------+
| CAST(0 AS UNSIGNED) - 1 |
+-------------------------+
|                      -1 |
+-------------------------+
```

如果这样一个操作的结果被用于更新一个UNSIGNED整数列，结果将被裁剪为该列类型的最大值，如果启用no_unsigned_subtract，结果将被裁剪为0。如果启用了严格的SQL模式，则会发生错误，列保持不变。

当启用NO_UNSIGNED_SUBTRACTION时，减法结果是有符号的，即使任何操作数是无符号的。例如，比较表t1中列c2的类型和表t2中列c2的类型:

```java
mysql> SET sql_mode='';
mysql> CREATE TABLE test (c1 BIGINT UNSIGNED NOT NULL);
mysql> CREATE TABLE t1 SELECT c1 - 1 AS c2 FROM test;
mysql> DESCRIBE t1;
+-------+---------------------+------+-----+---------+-------+
| Field | Type                | Null | Key | Default | Extra |
+-------+---------------------+------+-----+---------+-------+
| c2    | bigint(21) unsigned | NO   |     | 0       |       |
+-------+---------------------+------+-----+---------+-------+
mysql> SET sql_mode='NO_UNSIGNED_SUBTRACTION';
mysql> CREATE TABLE t2 SELECT c1 - 1 AS c2 FROM test;
mysql> DESCRIBE t2;
+-------+------------+------+-----+---------+-------+
| Field | Type       | Null | Key | Default | Extra |
+-------+------------+------+-----+---------+-------+
| c2    | bigint(21) | NO   |     | 0       |       |
+-------+------------+------+-----+---------+-------+
```

这意味着BIGINT UNSIGNED在所有上下文中并非100%可用。

### 3.11 NO_ZERO_DATE

NO_ZERO_DATE模式影响服务器是否允许’0000-00-00’作为有效日期。它的效果还取决于是否启用了strict SQL模式。

如果这个模式没有启用，'0000-00-00’是允许的，插入不会产生警告。

如果启用此模式，则允许使用’0000-00-00’，并且插入会产生警告。

如果启用了这个模式和strict模式，'0000-00-00’将不被允许，插入将产生错误，除非同时给出IGNORE。对于INSERT IGNORE和UPDATE IGNORE， '0000-00-00’是允许的，插入会产生警告。

NO_ZERO_DATE弃用。NO_ZERO_DATE不是严格模式的一部分，但应该与严格模式一起使用，并在默认情况下启用。如果启用了NO_ZERO_DATE而没有启用严格模式，则会出现警告，反之亦然。

由于NO_ZERO_DATE已弃用，您应该期望在未来的MySQL发行版中将它作为一个单独的模式名删除，其效果包括在strict SQL模式的效果中。

### 3.12 NO_ZERO_IN_DATE

NO_ZERO_IN_DATE模式影响服务器是否允许年部分为非零但月或日部分为0的日期。(该模式影响日期，如“2010-00-01”或“2010-01-00”，但不影响“0000-00-00”。要控制服务器是否允许’0000-00-00’，请使用NO_ZERO_DATE模式。)NO_ZERO_IN_DATE的效果还取决于是否启用了严格的SQL模式。

**1、** 如果不启用此模式，零位零件的日期是允许的，插入不会产生警告；

**2、** 如果启用此模式，零位日期将被插入为“0000-00-00”并产生警告；

**3、** 如果启用了此模式和strict模式，则不允许包含零部分的日期，并且插入将产生错误，除非同时给出IGNORE对于INSERTIGNORE和UPDATEIGNORE，没有部分的日期被插入为“0000-00-00”并产生警告；

NO_ZERO_IN_DATE弃用。NO_ZERO_IN_DATE不是严格模式的一部分，但应该与严格模式一起使用，并在默认情况下启用。如果启用了NO_ZERO_IN_DATE而没有启用严格模式，则会出现警告，反之亦然。

由于NO_ZERO_IN_DATE已弃用，您应该期望在未来的MySQL发行版中将它作为一个单独的模式名删除，其效果包括在strict SQL模式的效果中。

### 3.13 ONLY_FULL_GROUP_BY

拒绝选择列表、HAVING条件或ORDER BY列表引用的非聚合列的查询，这些列既不在GROUP BY子句中命名，在功能上也不依赖于GROUP BY列(由GROUP BY唯一确定)。

标准SQL的MySQL扩展允许在HAVING子句中引用选择列表中的别名表达式。不管是否启用了ONLY_FULL_GROUP_BY, HAVING子句都可以引用别名。

### 3.14 PAD_CHAR_TO_FULL_LENGTH

默认情况下，在检索时从CHAR列值中删除尾随空格。如果PAD_CHAR_TO_FULL_LENGTH被启用，则不会发生裁剪，并将检索到的CHAR值填充到其完整长度。这种模式不适用于VARCHAR列，因为在检索时将保留尾随空格。

从MySQL 8.0.13开始，PAD_CHAR_TO_FULL_LENGTH已弃用。希望在未来的MySQL版本中删除它。

```java
mysql> CREATE TABLE t1 (c1 CHAR(10));
Query OK, 0 rows affected (0.37 sec)
mysql> INSERT INTO t1 (c1) VALUES('xy');
Query OK, 1 row affected (0.01 sec)
mysql> SET sql_mode = '';
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT c1, CHAR_LENGTH(c1) FROM t1;
+------+-----------------+
| c1   | CHAR_LENGTH(c1) |
+------+-----------------+
| xy   |               2 |
+------+-----------------+
1 row in set (0.00 sec)
mysql> SET sql_mode = 'PAD_CHAR_TO_FULL_LENGTH';
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT c1, CHAR_LENGTH(c1) FROM t1;
+------------+-----------------+
| c1         | CHAR_LENGTH(c1) |
+------------+-----------------+
| xy         |              10 |
+------------+-----------------+
1 row in set (0.00 sec)
```

### 3.15 PIPES_AS_CONCAT

将||视为字符串连接操作符(与CONCAT()相同)，而不是OR的同义词。

### 3.16 REAL_AS_FLOAT

将REAL视为FLOAT的同义词。默认情况下，MySQL将REAL作为DOUBLE的同义词。

### 3.17 STRICT_ALL_TABLES

对所有存储引擎启用严格的SQL模式。无效的数据值将被拒绝。详细信息请参见严格SQL模式。

### 3.18 STRICT_TRANS_TABLES

为事务性存储引擎启用严格的SQL模式，如果可能的话也为非事务性存储引擎启用严格的SQL模式。

### 3.19 TIME_TRUNCATE_FRACTIONAL

控制在具有相同类型但小数位数较少的列中插入带有小数秒的TIME、DATE或TIMESTAMP值时是否发生舍入或截断。默认行为是使用舍入。如果启用此模式，则会发生截断。下面的语句序列说明了两者的区别:

```java
CREATE TABLE t (id INT, tval TIME(1));
SET sql_mode='';
INSERT INTO t (id, tval) VALUES(1, 1.55);
SET sql_mode='TIME_TRUNCATE_FRACTIONAL';
INSERT INTO t (id, tval) VALUES(2, 1.55);
```

生成的表内容如下所示，其中第一个值被舍入，第二个值被截断:

```java
mysql> SELECT id, tval FROM t ORDER BY id;
+------+------------+
| id   | tval       |
+------+------------+
|    1 | 00:00:01.6 |
|    2 | 00:00:01.5 |
+------+------------+
```

## 四. 结合SQL模式

下面提供了一些特殊模式，作为前面列表中的模式值组合的简写。

### 4.1 ASNI

相当于REAL_AS_FLOAT、PIPES_AS_CONCAT、ANSI_QUOTES、IGNORE_SPACE和ONLY_FULL_GROUP_BY。

ANSI模式还会导致服务器返回一个查询错误，其中带有外部引用S(outer_ref)的集合函数S不能在已解析外部引用的外部查询中聚合。这是这样一个问题:

```java
SELECT * FROM t1 WHERE t1.a IN (SELECT MAX(t1.b) FROM t2 WHERE ...);
```

这里，MAX(t1.b)不能在外部查询中聚合，因为它出现在该查询的WHERE子句中。在这种情况下，标准SQL需要一个错误。如果没有启用ANSI模式，服务器在此类查询中处理S(outer_ref)的方式与解释S(const)的方式相同。

### 4.2 TRADITIONAL

TRADITIONAL 等同于 STRICT_TRANS_TABLES, STRICT_ALL_TABLES, NO_ZERO_IN_DATE, NO_ZERO_DATE, ERROR_FOR_DIVISION_BY_ZERO, and NO_ENGINE_SUBSTITUTION.

## 五. 严格的SQL模式

严格模式控制MySQL如何处理数据更改语句(如INSERT或UPDATE)中无效或丢失的值。一个值可能由于以下几个原因无效。例如，它可能有错误的列数据类型，或者它可能超出范围。当要插入的新行不包含定义中没有显式DEFAULT子句的非null列的值时，该值将丢失。(对于NULL列，如果缺少值，则插入NULL。)严格模式也影响DDL语句，如CREATE TABLE。

如果strict模式不起作用，MySQL将插入无效或缺失的值，并产生警告。在严格模式下，您可以使用INSERT IGNORE或UPDATE IGNORE来产生此行为。

对于像SELECT这样不更改数据的语句，无效值将在严格模式下生成警告，而不是错误。

当试图创建超过最大键长的键时，严格模式将产生错误。如果没有启用严格模式，则会出现警告并将密钥截断为最大密钥长度。

严格模式不会影响是否检查外键约束。Foreign_key_checks可以用于此。

如果启用STRICT_ALL_TABLES或STRICT_TRANS_TABLES，则严格SQL模式有效，尽管这两种模式的效果略有不同:

**1、** 对于事务性表，当启用STRICT_ALL_TABLES或STRICT_TRANS_TABLES时，数据更改语句中的无效值或缺失值会发生错误语句被中止并回滚；

**2、** 对于非事务性表，如果在要插入或更新的第一行中出现坏值，两种模式的行为都是相同的:语句被终止，表保持不变如果语句插入或修改多行，并且坏值出现在第二行或之后的行，结果取决于启用了哪种strict模式:；

1)对于STRICT_ALL_TABLES, MySQL返回一个错误并忽略其余的行。但是，由于前面的行已经插入或更新，所以结果是部分更新。为了避免这种情况，可以使用单行语句，这可以在不改变表的情况下终止。

2)对于STRICT_TRANS_TABLES, MySQL将一个无效值转换为与列最近的有效值，并插入调整后的值。如果缺少一个值，MySQL将为列数据类型插入隐式默认值。在这两种情况下，MySQL都会生成一个警告而不是错误，并继续处理语句。

严格模式影响按零、零日期和日期中零的处理，如下所示:

**1、** 严格模式影响对除零的处理，包括MOD(N,0):；

对于数据更改操作(INSERT, UPDATE):

1)如果没有启用严格模式，则按零除法将插入NULL并不会产生警告。

2)如果启用了严格模式，除零将产生一个错误，除非也给出了IGNORE。对于INSERT IGNORE和UPDATE IGNORE，除0将插入NULL并产生警告。

对于SELECT，除零返回NULL。启用严格模式也会产生一个警告。

**1、** 严格模式影响服务器是否允许’0000-00-00’作为有效日期:；

1)如果没有启用严格模式，则允许’0000-00-00’，插入不会产生警告。

2)如果启用了严格模式，'0000-00-00’是不允许的，插入会产生错误，除非同时给出了IGNORE。对于INSERT IGNORE和UPDATE IGNORE， '0000-00-00’是允许的，插入会产生警告。

**2、** 严格模式影响服务器是否允许年部分为非零但月或日部分为0的日期(日期如“2010-00-01”或“2010-01-00”):；

1)如果没有启用严格模式，零位零件的日期是允许的，插入件不会产生警告。

2)如果启用了strict模式，则不允许包含零部分的日期，并且插入会产生错误，除非同时给出IGNORE。对于INSERT IGNORE和UPDATE IGNORE，包含零部分的日期被插入为’0000-00-00’(对于IGNORE，这被认为是有效的)并产生一个警告。

与ERROR_FOR_DIVISION_BY_ZERO、NO_ZERO_DATE和NO_ZERO_IN_DATE模式一起，严格模式影响对零除法、零日期和日期中的零的处理。

## 六. “忽略关键字”和“严格SQL模式”的比较

本节比较IGNORE关键字(将错误降级为警告)和strict SQL模式(将警告升级为错误)对语句执行的影响。它描述了它们影响哪些语句，以及它们应用于哪些错误。

下表给出了默认生成错误和警告时语句行为的摘要比较。一个默认生成错误的例子是将NULL插入到NOT NULL列中。在默认情况下生成警告的一个例子是将错误数据类型的值插入到列中(例如将字符串’abc’插入到整数列中)。

从表中得出的一个结论是，当IGNORE关键字和strict SQL模式同时生效时，IGNORE优先。这意味着，尽管可以认为IGNORE和strict SQL模式对错误处理有相反的影响，但它们在一起使用时不会取消。

### 6.1 IGNORE对语句执行的影响

MySQL中有几个语句支持可选的IGNORE关键字。该关键字导致服务器降级某些类型的错误并生成警告。对于多行语句，将错误降级为警告可以处理一行。否则，IGNORE会导致语句跳到下一行而不是终止。(对于不可忽略的错误，不管是否使用IGNORE关键字，都会发生错误。)

示例:如果表t有一个主键列i，列i包含唯一的值，尝试将相同的i值插入到多行中，通常会产生重复键错误:

```java
mysql> CREATE TABLE t (i INT NOT NULL PRIMARY KEY);
mysql> INSERT INTO t (i) VALUES(1),(1);
ERROR 1062 (23000): Duplicate entry '1' for key 't.PRIMARY'
```

使用IGNORE，包含重复键的行仍然没有插入，但是会出现警告而不是错误:

```java
mysql> INSERT IGNORE INTO t (i) VALUES(1),(1);
Query OK, 1 row affected, 1 warning (0.01 sec)
Records: 2  Duplicates: 1  Warnings: 1
mysql> SHOW WARNINGS;
+---------+------+-----------------------------------------+
| Level   | Code | Message                                 |
+---------+------+-----------------------------------------+
| Warning | 1062 | Duplicate entry '1' for key 't.PRIMARY' |
+---------+------+-----------------------------------------+
1 row in set (0.00 sec)
```

示例:如果表t2有一个NOT NULL的列id，尝试插入NULL会在严格的SQL模式下产生一个错误:

```java
mysql> CREATE TABLE t2 (id INT NOT NULL);
mysql> INSERT INTO t2 (id) VALUES(1),(NULL),(3);
ERROR 1048 (23000): Column 'id' cannot be null
mysql> SELECT * FROM t2;
Empty set (0.00 sec)
```

如果SQL模式不是严格的，则IGNORE将导致插入NULL作为隐式默认值(在本例中为0)，这将允许在不跳过该行的情况下处理该行:

```java
mysql> INSERT INTO t2 (id) VALUES(1),(NULL),(3);
mysql> SELECT * FROM t2;
+----+
| id |
+----+
|  1 |
|  0 |
|  3 |
+----+
```

这些语句支持IGNORE关键字:

**1、** CREATETABLE……SELECT:IGNORE并不应用于CREATETABLE或SELECT语句的部分，而是用于将SELECT生成的行插入到表中在唯一键值上重复现有行的行将被丢弃；

**2、** DELETE:IGNORE导致MySQL在删除行过程中忽略错误；

**3、** INSERT:使用IGNORE，在唯一键值上重复现有行的行将被丢弃将会导致数据转换错误的值设置为最近的有效值；

**4、** 对于没有找到与给定值匹配的分区的表，忽略将导致包含不匹配值的行的插入操作静默失败；

**5、** LOADDATA,LOADXML:使用IGNORE，在唯一键值上重复现有行的行将被丢弃；

**6、** UPDATE:使用IGNORE，不会更新在唯一键值上发生重复键冲突的行将更新为可能导致数据转换错误的值的行更新为最近的有效值；

IGNORE关键字适用于以下可忽略的错误:

```java
ER_BAD_NULL_ERROR
ER_DUP_ENTRY
ER_DUP_ENTRY_WITH_KEY_NAME
ER_DUP_KEY
ER_NO_PARTITION_FOR_GIVEN_VALUE
ER_NO_PARTITION_FOR_GIVEN_VALUE_SILENT
ER_NO_REFERENCED_ROW_2
ER_ROW_DOES_NOT_MATCH_GIVEN_PARTITION_SET
ER_ROW_IS_REFERENCED_2
ER_SUBQUERY_NO_1_ROW
ER_VIEW_CHECK_FAILED
```

### 6.2 严格SQL模式对语句执行的影响

MySQL服务器可以以不同的SQL模式运行，并且可以根据sql_mode系统变量的值对不同的客户端应用不同的SQL模式。在“strict”SQL模式下，服务器将某些警告升级为错误。

例如，在非严格SQL模式中，将字符串’abc’插入一个整数列将导致值转换为0和一个警告:

```java
mysql> SET sql_mode = '';
Query OK, 0 rows affected (0.00 sec)
mysql> INSERT INTO t (i) VALUES('abc');
Query OK, 1 row affected, 1 warning (0.01 sec)
mysql> SHOW WARNINGS;
+---------+------+--------------------------------------------------------+
| Level   | Code | Message                                                |
+---------+------+--------------------------------------------------------+
| Warning | 1366 | Incorrect integer value: 'abc' for column 'i' at row 1 |
+---------+------+--------------------------------------------------------+
1 row in set (0.00 sec)
```

在严格的SQL模式下，无效的值将被拒绝并返回错误:

```java
mysql> SET sql_mode = 'STRICT_ALL_TABLES';
Query OK, 0 rows affected (0.00 sec)
mysql> INSERT INTO t (i) VALUES('abc');
ERROR 1366 (HY000): Incorrect integer value: 'abc' for column 'i' at row 1
```

严格SQL模式适用于以下语句，当某些值超出范围或插入或删除了无效行时:

**1、** ALTERTABLE；

**2、** CREATETABLE；

**3、** CREATETABLE…SELECT；

**4、** DELETE(bothsingletableandmultipletable)；

**5、** INSERT；

**6、** LOADDATA；

**7、** LOADXML；

**8、** SELECTSLEEP()；

**9、** UPDATE(bothsingletableandmultipletable)；

在存储的程序中，如果程序是在严格模式生效时定义的，那么刚才列出的类型的各个语句将以严格SQL模式执行。

严格SQL模式适用于以下错误，它们表示输入值无效或丢失的一类错误。如果列的数据类型错误或超出范围，则值无效。如果要插入的新行不包含定义中没有显式DEFAULT子句的not NULL列的值，则该值丢失。

```java
ER_BAD_NULL_ERROR
ER_CUT_VALUE_GROUP_CONCAT
ER_DATA_TOO_LONG
ER_DATETIME_FUNCTION_OVERFLOW
ER_DIVISION_BY_ZERO
ER_INVALID_ARGUMENT_FOR_LOGARITHM
ER_NO_DEFAULT_FOR_FIELD
ER_NO_DEFAULT_FOR_VIEW_FIELD
ER_TOO_LONG_KEY
ER_TRUNCATED_WRONG_VALUE
ER_TRUNCATED_WRONG_VALUE_FOR_FIELD
ER_WARN_DATA_OUT_OF_RANGE
ER_WARN_NULL_TO_NOTNULL
ER_WARN_TOO_FEW_RECORDS
ER_WRONG_ARGUMENTS
ER_WRONG_VALUE_FOR_TYPE
WARN_DATA_TRUNCATED
```
