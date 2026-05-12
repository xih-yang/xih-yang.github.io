# 05、Oracle 入门教程 - Oracle 之 SQL*Plus 命令
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/5.html
- 分类：缓存数据库
- 分组：教程目录
## 一、SQL*Plus 概述

### 1.1 SQL*Plus 与数据库的交互

**1.1.1 SQL*Plus 工具介绍**

`SQL*Plus`是一个被系统管理员(DBA) 和开发人员广泛使用的功能强大而且很直观的Oracle工具，也是一个可以通用在各种平台上且操作几乎完全一致的工具。`SQL*Plus`可以执行输入的SQL语句、包含SQL语句的文件和`PL/SQL`语句， 通过`SQL*Plus`可以与数据库进行对话。

Oracle的SQL*Plus是与Oracle进行交互的客户端工具，在`SQL*Plus`中，可以运行`SQL*Plus`命令与`SQL*Plus`语句。

`SQL*Plus`是一个基于C/S两层结构的客户端操作工具， 包括客户层(即命令行窗口)和服务器层(即数据库实例)，这两层既可以在一台主机上，也可以在不同主机上。

除了Oracle自身提供的`SQL*Plus`工具以外，还有许多第三方的Oracle开发工具，如TOAD和PL/SQL Developer等，它们均具有与`SQL*Plus`同样的功能，甚至还具备了`SQL*Plus`不具备的许多新功能。`SQL*Plus`工具主要用来进行数据查询和数据处理，利用`SQL*Plus`可将SQL和Oracle专有的PL/SQL结合起来进行数据查询和处理。

**1.1.2 SQL*Plus 功能**

`SQL*Plus` 工具具备以下功能：

- 定义变量，编写SQL语询。
- 插入、修改、删除、查询，以及执行命令和PL/SQL语询。比如，执行show parameter命令。
- 格式化查询结构、运算处理、保存、打印机输出等。
- 显任何一个表的字段定义，并实现与用户进行交互。
- 完成数据库的几乎所有管理工作。比如，维护表空间和数据表。
- 运行存储在数据库中的子程序或包。
- 以sysdba身份登录数据库实例，可以实现启动/停止数据库实例。

### 1.2 SQL*Plus 运行环境的设置

**1.2.1 SQL*Plus 运行环境介绍**

`SQL*Plus`的运行环境是用来输入、执行`SQL*Plus`命令 和显示返回结果的场所，设置合适的`SQL*Plus`运行环境，可以使`SQL*Plus`能够 按照用户的要求运行和执行各种操作。SET命令也称SET变量或维护系统变量，利用它可为`SQL*Plus`交互建立一个特殊的环境。例如，设置屏幕上每一行能够最多显字符数、设置每页打印的行数、设置某个列的宽度等。

**1.2.2 SET 命令介绍**

在Oracle 11g数据库中，户可以使用SET命令来设置SQL*Plus的运行环境。

SET命令的语法格式为:

```java
SET system_variable value
```

- system_variable：效名。
- value：变量值。

SET命令的常用变量名、可选值吸其说明如下

比如，用户可以设置在`SQL*Plus`命令提示符"SQL>”前面显示当前的系统时间。但需要注意的是，通过SET命令设置的环境变量是临时的，不永久的。用户退出`SQL*Plus`环境后，户设置的环境参数会全部丢失。

```java
SQL> set time on
14:46:01 SQL> set time off
SQL> set time on
14:46:16 SQL> set time off
SQL>
```

**1.2.3 使用SET命令设置运行环境**

（1）PAGESIZE 变量

该变用来设置从顶部标题至颈结束之间的行数，其语法格式如下:

```java
SET PAGESIZE value
```

value变量的默认值为14，根据实际情况的需要，户可以修改value的值，该值是一个整数。如：

当`SQL*Plus`返回查询结果时，它首先会显示用户所选择数据的列标题，然后在相应列标题下显示数据行，上下两个列标题所在行之间的空间就是`SQL*Plus`的一页。一页中所显示的数据行的数量就是PAGESIZE变量的值。若要查看当前`SQL*Plus`环境中的一页有多少行，可以使用show pagesize命令。

（2）NEWPAGE 变量

该变量用来设置一页中空行的数量，其语法格式如下:

```java
SET NEWPAGE value
```

value的默认值为1，根据实际情况的需要，用户可以修改value的值，该值是个整数。

（3）LINESIZE 变量

该变量用来设置在`SQL*Plus`环境中一行所显示的最多字符总数，其语法格式如下:

```java
SET LINESIZE value
```

value的默认值为80，根据实际情况的需要，户可以修改value的值，该值是一个整数。

如果数据行的宽度大于LINESIZE变量的值，当在`SQL*Plus`环境中按照LINESIZE指定的数量输出字符时，数据就会发生折行显示的情况。如果适当调整LINESIZE的值，使其值等于或稍大于数据行的宽度，则输出的数据就不会折行。所以在实际操作Oracle数据库的过程中，要根据具体情况来适当调整LINESIZE的值。

（4）PAUSE 变量

该变用来设置`SQL*Plus`输出结果是否滚动显示，其语法格式如下：

```java
SET PAUSE value
```

value的三种情况：

- OFF：这是默认值，返回结果一次性输出完毕，中间的每一顶不会暂
- ON：示输出结果的每一页都暂停， 户按Enter键后继续显示。
- TEXT：在设置PAUSE的值为ON之后，若再设置TEXT的值，则每次暂停都将显示该字符串。当PAUSE的值为OFF时，设置TEXT值没有任何意义。
-

当在`SQL*Plus`环境中显示多行数据，并且一页无法容纳下这么多数据行时。如果PAUSE变量值为OFF，则`SQL*Plus`窗口输出的数据行会快速滚动，非常不利于用户查看。这就需要数据行在滚动时最好能够按页暂停，以便于用户页地查看输出结果。当把PAUSE变量的值设置为ON时，就可以实现控制`SQL*Plus`在显示完一页后暂停滚动，直到按Enter键后才继续显示下一页。

另外，在设置PAUSE量值为ON之后，还可以通过PAUSE变量设置暂停后显示的字符串，以便于提示用户操作。

（5）NUMFORMAT 变量

该变用来设置显示数值的默认格式，该格式是数值格式，其语法格式如下:

```java
SET NUMFORMAT format
```

format为数值的掩码，数值的常用掩码及其说明如表3.2图所示。

当用户查询数据库中的数值时，`SQL*Plus`环境将使用默认的格式显示数值，即以10个字符的宽度和常规格式来显尿数字。

## 二、常用 SQL*Plus 命令

在`SQL*Plus`环境中操作Oracle数据库，除了使用SQL语句外，用户接触比较多的就是`SQL*Plus`命令，它执行完成后，不会保存在SQl缓冲区中。

### 2.1 HELP 命令

`SQL *plus`工具提供了许多操作Oracle数据库的命令，并且每个命令都有很多选项，把所有命令的选项都记住，这对于用户来说非常困难。所以，`SQL*Plus`提供了HELP命令来帮助用户查询指定命令的选项。HELP可以向用户提供被查询命令的标题、功能描述、缩写形式和参数选项(包括必选参数和可选参数)等信息。

HELP命令的语法：

```java
HELP|? [topic]
```

`?`：表示一个命令的部分字符，这样就可以通过提供命令的部分字符以模糊查询的方式来查询命令格式，topic参数表示将要查询的命令的完整名称。若省略`?`和topic参数，直接执行HELP命令，则会输出HELP命令本身的语法格式及其功能描述信息。

如果用户无法记清所要使用的`SQL*Plus`命令，则可以使用help index命令来查看`SQL*Plus`命令清单。

### 2.2 DESCRIBE 命令

在`SQL*Plus`的众多命令中，DESCRIBE命令 可能是被使用得最频繁的一个， 它用来查询指定数据对象的组成结构。比如，通过DESCRIBE命令查询表和视图的结构，查询结果就可以列出相应对象各个列的名称、是否为空及类型等属性。

DESCRIBE命令的语法如下:

```java
desc[ribe] object_ ame;
```

DESCRIBE可以缩写为desc, object_name表示将要查询的对象名称。

DESCRIBE命令不仅可以查询表、视图的结构，而且还可以查询过程、函数和

程序包等PL/SQL对象的规范。

### 2.3 SPOOL 命令

SPOOL命令可以把查询结果输出到指定文件中，这样可以保存查询结果并方便打印。

SPOOL 命令的语法如下:

```java
SPO[OL] [file_name[.ext] [CRE[ATE] | REP[LACE] | APP[END]] | OFF | OUT]
```

参数file_ name用于指定脱机文件的名称，默认的文件扩展名为LST。在该参数后面可以跟一个关键字，该关键字有以下几种情况:

- CRE[ATE]：示创建一个新的脱机文件， 这也是SPOOL命令的默认状态。
- REP[LACE]：表示替代已经存在的脱机文件。
- APP[END]：表示把脱机内容附加到一个已经存在的脱机文件中。
- OFF | OUT：表示关闭spool输出。

从spool命令开始(但不包括该命令行)，一直到spool off命令行(包括该命令行)之间的所有内容都被写入指定的文件中。

### 2.4 DEFINE 命令

该命令用来定义一个用户变并且可以分配给它一个CHAR值，其语法格式如下:

```java
DEF[INE] [variable] | [variable=text] 
```

- variable：示定义的变量名。
- text：变量的CHAR值。

### 2.5 SHOW 命令

该命令用来显示`SQL*Plus`系统变量的值或`SQL*Plus`环境变量的值，其语法格式如下:

```java
SHO[W] option
```

option表示要显示的系统选项，常用的选项有

- ALL
- PARAMETERS [parameter_ name]
- SGA
- SPOOL
- USER

### 2.6 EDIT 命令

SQL语句或PL/SQL块在执行完毕之后，可以被存储在一个被称为SQL缓冲区的内存区域中，用户可以从SQL缓冲区中重新调用、编辑或运行最近输入的SQL语句。

若要编辑SQL缓冲区中的最近一条SQL 语句或PL/SQL块，既可以在`SQL*Plus`环境中直接编辑，也可以使用EDIT命令实现在记事本中编辑。EDIT命令用来编辑SQL缓冲区或指定磁盘文件中的SQL语句或PL/SQL块。

EDIT语法格式如下:

```java
EDIT [file_name[.ext]]
```

file_ name表示要编辑的磁盘文件名。

若在`SQL*Plus`中只输入"EDIT" 或者它的简写形式"ED”，而不指定file_ name参数的值，则表示编辑SQL缓冲区中的最近一条SQL语句或PL/SQL块。

执行EDIT命令后，`SQL*Plus`工具将打开一个包含SQL语句或PL/SQL块的记事本，用户就可以在记事本环境下编辑SQL语句或PL/SQL块。

### 2.7 SAVE 命令

该命令实现将SQL缓冲区中的最近一条SQL 语句或PL/SQL块保存到一个文件中。

SAVE 语法格式如下:

```java
SAVE file_name
```

file_ name表示要保存到的文件名，如果不为保存的文件指定路径，则该文件会保存在Oracle系统安装的主目录中(但不建议这样做)。如果不为保存的文件指定扩展名，则默认扩展名为SQL，即保存的文件为-个SQL脚本文件。

### 2.8 GET 命令

该命令实现把一个SQL脚本文件的内容放进SQL缓冲区，GET 语法格式如下:

```java
GET [FILE] file_name[.ext] [LIST| NOLIST]
```

- file_name：要检索的文件名，如果省略了文件的扩展名，则默认文件

的扩展名为SQL。
- LIST：指定文件的内容加载到缓冲区时显示文件的内容。
- NOLIST：指定文件的内容加载到缓冲区时不显示文件的内容。

执行GET命令时，如果file_name参数不包括被检索文件的路径，则`SQL*Plus`工具会在Oracle系统安装的主目录下检索指定文件。在`SQL*Plus`找到指定文件后，会把文件中的内容加载到`SQL*Plus`缓冲区，并显示该文件的内容。

### 2.9 start和@命令

这两个命令都可以用来执行-个SQL脚本文件，它们的语法格式如下:

```java
STA[RT] {
     ur1|file_name[.ext]} [arg ...]
@ {
     url|file_name[.ext]} [arg ...]
```

- url：表示要执行的SQL脚本文件的路径。
- file_name：表示包含SQL脚本的文件名。
- arg：其他参数。

## 三、格式化查询结果

为了在`SQL*Plus`环境中生成符合用户需要规范的报表，`SQL*Plus`工 具提供了多个用于格式化查询结果的命令，使用这些命令可以实现设置列的标题、定义输出值的显示格式和显示宽度、为报表增加头标题和底标题、在报表中显示当前日期和页号等功能。下面就对常用的格式化命令进行讲解。

### 3.1 COLUMN命令

该命令可以实现格式化查询结果、设置列宽度、重新设置列标题等功能。

COLUMN命令语法格式如下:

```java
COL[UMN] [column_name | alias | option]
```

- column_name：于指定要设置的列的名称。
- alias：用于指定列的别名，通过它可以把英文列标题设置为汉字。
- option：于指定某个列的显示格式，option选项的值及其说明如下
-

*

- 如果在关键字colum后面未指定任何参数，则column命令将显示`SQL*Plus`环境中所有列的当前定义属性，如果在column后面指定某个列名，则显示指定列的当前定义属性。

**3.1.1 FORMAT选项**

该选项用于格式化指定的列，需要在FORMAT关键字的后面跟一个掩码格式。

**3.1.2 HEADING选项**

该选项用于定义列标题，比如许多数据表或视图的列名都为英文形式，可以使用此选项将英文形式的列标题显示为中文形式。

**3.1.3 NULL选项**

在该选项的后面指定一个字符串， 如果列的值为null，则用该字符串代替空值。

**3.1.4 ON|OFF选项**

该选项用于控制定义的显示属性的状态，OFF表示定义的所有显示属性都不起作用，默认为ON。

**3.1.5 WRAPPED/WORD WRAPPED选项**

这两个选项都用于实现折行的功能，WRAPPED选项按照指定长度折行，WORD_ WRAPPED选项按照完整字符串折行。

### 3.2 TTITLE 和 BTITLE 命令

在`SQL*Plus`环境中，执行SQL语句后的显示结果在默认情况下包括列标题、页分割线、查询结果和行数合计等内容，用这些默认的输出信息打印报表，并不十分美观。如果能为整个输出结果设置报表头(即头标题)、为每页都设 置页标题和页码、为整个输出结果设置报表尾(如打印时间或打印人员)，那么使用这样的输出结果打印报表一定非常美观。

为了实现这些功能，`SQL*Plus`工具提供了TTITLE和BTITLE命令，这两个命令分别用来设置打印时每页的顶部和底部标题。

TTITLE命令的语法格式如下:

```java
TTI[TLE] [printspec [text|variable] ...] | [0FF|ON]
```

- text：用于设置输出结果的头标题(即报表头文字)。
- variable：于在头标题中输出相应的变量值。
- OFF:表示禁止打印头标题。
- ON:表示允许打印头标题。
- printspec：来作为头标题的修饰性选项，printspec选项的值如下：
-

BTITLE的语法格式与TTITLE的语法格式相同。如果在TTITLE或BTITLE命令后没有任何参数，则显示当前的TTITLE或BTITLE的定义。

上面代码中所设置的头标题和底标题的有效期直到本次会话结束后才终止。若要手动清除这些设置，可以分别使用ttitle off命令和btitle off命令取消头标题和底标题的设置信息。
