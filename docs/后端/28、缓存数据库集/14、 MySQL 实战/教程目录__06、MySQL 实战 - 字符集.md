# 06、MySQL 实战 - 字符集
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/6.html
- 分类：缓存数据库
- 分组：教程目录
计算机只能识别二进制代码，而人只能看懂文字符号，这两者之间必须要定义一个转换规则来使人和计算机识别的是同一个东西，这个规则就是人们制定的字符集。

## 一、字符集概述

字符集的基础是ASCII码，基本上后来所有的字符集都兼容ASCII字符集，但是，由于各公司、各政府、各机构等创建的字符集编码规则各不相同，这就给软件移植及协同开发带来困难，因此有必要统一字符编码。

Unicode字符集就是后来经过发展得到公认的一个标准，也是现在基本上通行的一个标准，它基本上概括了从古至今人类所使用过的所有文字和符号。

中国结合国际标准及汉字的特性制定了GBK、GB18030等字符集，下表将一些常用字符集的特点进行了归纳：

## 二、怎样选择合适的字符集

对数据库来说，字符集至关重要，存入数据库的内容都需要通过字符集进行转换，它对数据库的存储性能、处理性能，以及日后系统的移植、推广都会有影响。

MySQL支持包括UTF-8、utf8mb4等几十种字符集，如何进行选择呢？一般需要根据需求及各字符集本身的特点进行权衡，主要考虑以下几点：

- 满足应用支持语言的需要，一般Unicode类型就行，对MySQL来说基本上就是UTF-8。
- 如果涉及已有数据的导入，就需要考虑当前字符集是否对导入的有兼容性，否则可能有些会无法正确导入。
- 如果数据库只需支持一般中文，且数据量很大，性能要求也高，那就应该选双字节定长编码中文字符集，如GBK。相反，如果主要处理英文字符那UTF-8更好。
- 如果数据库需要做大量的字符运算，如比较排序等，那么选择定长字符集更好，因为它的处理速度快。
- 如果所有客户端程序都支持相同的字符集，那么应优先选择该字符集作为数据库字符集，这样可以避免字符集转化带来的开销和数据损失。

## 三、MySQL支持的字符集简介

MySQL支持很多字符集，在同一台服务器、同一个数据库甚至同一个表的不同字段都可以指定不同的字符集，这与Oracle等数据库相比灵活性更高，Oracle的同一个数据库只能使用同一种字符集。

使用show character set 命令查看所有可用字符集：

```java
mysql> show character set;
+----------+---------------------------------+---------------------+--------+
| Charset  | Description                     | Default collation   | Maxlen |
+----------+---------------------------------+---------------------+--------+
| big5     | Big5 Traditional Chinese        | big5_chinese_ci     |      2 |
| dec8     | DEC West European               | dec8_swedish_ci     |      1 |
| cp850    | DOS West European               | cp850_general_ci    |      1 |
| hp8      | HP West European                | hp8_english_ci      |      1 |
| koi8r    | KOI8-R Relcom Russian           | koi8r_general_ci    |      1 |
| latin1   | cp1252 West European            | latin1_swedish_ci   |      1 |
| latin2   | ISO 8859-2 Central European     | latin2_general_ci   |      1 |
| swe7     | 7bit Swedish                    | swe7_swedish_ci     |      1 |
| ascii    | US ASCII                        | ascii_general_ci    |      1 |
| ujis     | EUC-JP Japanese                 | ujis_japanese_ci    |      3 |
| sjis     | Shift-JIS Japanese              | sjis_japanese_ci    |      2 |
| hebrew   | ISO 8859-8 Hebrew               | hebrew_general_ci   |      1 |
| tis620   | TIS620 Thai                     | tis620_thai_ci      |      1 |
| euckr    | EUC-KR Korean                   | euckr_korean_ci     |      2 |
| koi8u    | KOI8-U Ukrainian                | koi8u_general_ci    |      1 |
| gb2312   | GB2312 Simplified Chinese       | gb2312_chinese_ci   |      2 |
| greek    | ISO 8859-7 Greek                | greek_general_ci    |      1 |
| cp1250   | Windows Central European        | cp1250_general_ci   |      1 |
| gbk      | GBK Simplified Chinese          | gbk_chinese_ci      |      2 |
| latin5   | ISO 8859-9 Turkish              | latin5_turkish_ci   |      1 |
| armscii8 | ARMSCII-8 Armenian              | armscii8_general_ci |      1 |
| utf8     | UTF-8 Unicode                   | utf8_general_ci     |      3 |
| ucs2     | UCS-2 Unicode                   | ucs2_general_ci     |      2 |
| cp866    | DOS Russian                     | cp866_general_ci    |      1 |
| keybcs2  | DOS Kamenicky Czech-Slovak      | keybcs2_general_ci  |      1 |
| macce    | Mac Central European            | macce_general_ci    |      1 |
| macroman | Mac West European               | macroman_general_ci |      1 |
| cp852    | DOS Central European            | cp852_general_ci    |      1 |
| latin7   | ISO 8859-13 Baltic              | latin7_general_ci   |      1 |
| utf8mb4  | UTF-8 Unicode                   | utf8mb4_general_ci  |      4 |
| cp1251   | Windows Cyrillic                | cp1251_general_ci   |      1 |
| utf16    | UTF-16 Unicode                  | utf16_general_ci    |      4 |
| utf16le  | UTF-16LE Unicode                | utf16le_general_ci  |      4 |
| cp1256   | Windows Arabic                  | cp1256_general_ci   |      1 |
| cp1257   | Windows Baltic                  | cp1257_general_ci   |      1 |
| utf32    | UTF-32 Unicode                  | utf32_general_ci    |      4 |
| binary   | Binary pseudo charset           | binary              |      1 |
| geostd8  | GEOSTD8 Georgian                | geostd8_general_ci  |      1 |
| cp932    | SJIS for Windows Japanese       | cp932_japanese_ci   |      2 |
| eucjpms  | UJIS for Windows Japanese       | eucjpms_japanese_ci |      3 |
| gb18030  | China National Standard GB18030 | gb18030_chinese_ci  |      4 |
+----------+---------------------------------+---------------------+--------+
41 rows in set (0.00 sec)
```

MySQL的字符集包括**字符集**和**校对规则**两个概念。字符集用来定义存储字符串的方式，校对规则用来定义比较字符串的方式，一个字符集可以对于多种校对规则。

使用show collation like ’ *** ‘ 命令来查看相应字符集的校对规则：

```java
mysql> show collation like 'gbk%';
+----------------+---------+----+---------+----------+---------+
| Collation      | Charset | Id | Default | Compiled | Sortlen |
+----------------+---------+----+---------+----------+---------+
| gbk_chinese_ci | gbk     | 28 | Yes     | Yes      |       1 |
| gbk_bin        | gbk     | 87 |         | Yes      |       1 |
+----------------+---------+----+---------+----------+---------+
2 rows in set (0.00 sec)
```

校对规则的命名约定：以字符集名开始，包含语言名，以_ci（大小写不敏感）、_cs（大小写敏感）、_bin（二元，基于字符编码的值而与语言无关）结束。

下面的例子就介绍了字母根据校对规则是否对大小写的敏感：

```java
mysql> select case when 'A' collate gbk_chinese_ci = ('a' collate gbk_chinese_ci) then 1 else 0 end;
+---------------------------------------------------------------------------------------+
| case when 'A' collate gbk_chinese_ci = ('a' collate gbk_chinese_ci) then 1 else 0 end |
+---------------------------------------------------------------------------------------+
|                                                                                     1 |
+---------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
mysql> select case when 'A' collate gbk_bin = ('a' collate gbk_bin) then 1 else 0 end;
+-------------------------------------------------------------------------+
| case when 'A' collate gbk_bin = ('a' collate gbk_bin) then 1 else 0 end |
+-------------------------------------------------------------------------+
|                                                                       0 |
+-------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

## 四、MySQL字符集的设置

MySQL的字符集和校对规则有4个级别的默认设置：服务器级、数据库级、表级和字段级；它们分别在不同的地方设置，作用也不同。

#### 4.1 服务器的字符集和校对规则

首先通过以下命令来查看当前服务器的的字符集和校对规则：

```java
mysql> show variables like 'character_set_server';
+----------------------+-------+
| Variable_name        | Value |
+----------------------+-------+
| character_set_server | utf8  |
+----------------------+-------+
1 row in set, 1 warning (0.00 sec)
mysql> show variables like 'collation_server';
+------------------+-----------------+
| Variable_name    | Value           |
+------------------+-----------------+
| collation_server | utf8_general_ci |
+------------------+-----------------+
1 row in set, 1 warning (0.00 sec)
```

一般通用的编码规则就选utf8，如果有需要要更改，那么在服务器端基本有以下三种方式：

- （Linux环境下）直接修改配置文件my.cnf；具体步骤如下：1.关闭MySQL；2.在配置文件里面的[mysqld]字段下面[mysqld safe]字段前面添加参数“ character-set-server=utf8 " ；3.重启MySQL；4.使用命令’ show variables like " %char%" ‘ 来查看结果。
- （windows环境下）修改的是my.ini配置文件：步骤与上面的基本一样，只不过需要注意的是MySQL版本如果在5.53之前，添加的参数是‘ default-character-set=utf8 ' ，在此之后就是“ character-set-server=utf8 "；另外，如果这样设置后发现没有更改成功，那么可能与windows系统有关，只需要再在上面的参数下添加 " [client] default-character-set=utf8 " （注意分两行写）应该就可以了。
- 在启动选项中指定；例如：mysqld --character-set-server=utf8;
- 在安装MySQL时就指定好字符集（推荐）

如果没有指定都会使用默认值，比如上面都指定了字符集没有指定校对规则，那么就会使用默认的，如果不想使用默认的，那么只需要在指定字符集的同时指定校对规则即可。

#### 4.2 数据库的字符集和校对规则

数据库的字符集和校对规则在创建数据的时候就需要指定，如果对一个已存在的数据修改其字符集可以使用 " alter database " 命令，但是需要注意，这时候并不会改变该数据库原有的数据编码规则，稍后会通过一个例子来解释；

数据库字符集的设置规则如下：

- 如果有指定，那么就使用指定的字符集和校对规则；
- 如果只指定了字符集，那么校对规则使用默认的；
- 如果只指定了校对规则，那么字符集就使用与该校对规则关联的字符集；
- 如果没有指定字符集和校对规则，则使用服务器的；

使用以下命令显示当前数据库的字符集和校对规则：

```java
mysql> show variables like 'character_set_database';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| character_set_database | utf8  |
+------------------------+-------+
1 row in set, 1 warning (0.00 sec)
mysql> show variables like 'collation_database';
+--------------------+-----------------+
| Variable_name      | Value           |
+--------------------+-----------------+
| collation_database | utf8_general_ci |
+--------------------+-----------------+
1 row in set, 1 warning (0.00 sec)
```

#### 4.3 表字符集和校对规则

表的字符集和校对规则在创建表的时候就需要指定，如果对一个已存在的表修改其字符集可以使用 " alter table " 命令，但是需要注意，这时候并不会改变该表原有的数据编码规则；

设置表的字符集和编码规则与上面类似，就最后一点有点差别，如果表的没有指定那么会使用数据库的字符集和校对规则。

可使用如下命令查看表的字符集及校对规则：

```java
mysql> show create table t \G;
*************************** 1. row ***************************
       Table: t
Create Table: CREATE TABLE t (
  f float(8,1) DEFAULT NULL,
  d decimal(8,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8
1 row in set (0.00 sec)
```

#### 4.4 列字符集和校对规则

这种方式MySQL支持但是使用的较少，对同一个表的不同列使用不同的字符集和校对规则在使用起来较麻烦，除非特别必要一般不用，设置方法也跟上面类似，要么在创建表的时候指定，要么在修改表的时候调整。

#### 4.5 连接字符集和校对规则

上面的四种方式针对的都是数据保存的规则，而对于实际情况来说还涉及到客户端与服务器的交互操作，如果两边的编码方式不同则会存在一些问题，因此MySQL提供了3个不同的参数：character_set_client、character_set_connection和character_set_results，分别代表客户端、连接和返回结果的字符集。一般这3个字符集应该是相同的，这样才可以保证写入的内容能够被正确的读出。

一般这三个参数不会单独设置，可使用命令 " set names *** " 来同时修改这3个参数的值，而且它不能写在配置文件里面，需要应用每次连接数据库后都执行一下这个命令，这显然很繁琐，更方便的是在[mysqld] 下面加一行参数：

init_connect = 'SET NAMES utf8' ；

这样每个用户在连接上来的时候都会触发该命令从而定义好连接的字符集相同。

```java
set names utf8; 命令等价于下面的3条命令
SET character_set_client = utf8;
SET character_set_results = utf8;
SET character_set_connection = utf8;
```

另外，还可以使用命令 [_charset] ’string’ [COLLATE collation] 来指定文本字符串的字符集和校对规则，如：

```java
SELECT _utf8 ‘你好’ COLLATE utf8_general_ci;
```

这种文本字符串在请求过程中不经过多余的转码，直接转换为内部字符集处理。

## 五、字符集的修改步骤

前面提到当实际过程中遇到字符集的问题需要更改已有数据库的字符集时，不能简单的通过ALTER命令来修改数据库或表的字符集，而是需要先将原有数据导出，经过适当调整后重新导入新的字符集数据库中。

下面这个例子是模拟将latin1字符集数据库修改成GBK的过程：

#### 1. 导出表结构

```java
mysqldump -uroot -p --default-character-set=gbk -d databasename> createtab.aql
其中 --default-character-set=gbk 表示以什么字符集连接
     -d 表示只导出表结构，不导出数据
```

#### 2. 打开createtab.sql，手动将表结构定义的字符集修改为新的字符集

#### 3. 确保原数据库不再更新时导出所有记录

```java
mysqldump -uroot -p --quick --no-create-info --extended-insert --default-character-set=latin1 databasename> data.sql
--quick：该选项用于转储较大的表，因为它会一次一行的检索表中的行而不是所有行，并在输出前将它缓存到内存中。
--no-create-info：不导出每个转储表的 CREATE TABLE 语句。
--extended-insert：使用包括几个VALUES列表的多行INSERT语法，这样转储文件更小，重载文件时可以加速插入。
--default-character-set=latin1：按照原有字符集导出数据，这样能保证正确导出不会乱码。
```

#### 4. 打开 data.sql，将SET NAMES latin1 修改为 SET NAMES gbk

#### 5. 使用新的字符集创建新的数据库

```java
create database databasename default charset gbk；
```

#### 6. 创建表，执行 createtab.sql

```java
mysql -uroot -p databasename < createtab.sql
```

#### 7. 导入数据，执行 data.sql

```java
mysql -uroot -p databasename < data.sql
```

**注意：** 在更改字符集时，选择的新字符集一定要能兼容原来的字符集，否则会造成乱码，数据丢失。
