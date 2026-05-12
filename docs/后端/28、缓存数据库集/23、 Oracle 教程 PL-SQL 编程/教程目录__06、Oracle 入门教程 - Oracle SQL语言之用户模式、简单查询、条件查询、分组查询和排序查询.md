# 06、Oracle 入门教程 - Oracle SQL语言之用户模式、简单查询、条件查询、分组查询和排序查询
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/6.html
- 分类：缓存数据库
- 分组：教程目录
## 一、SQL 语言概述

### 1.1 SQL 语言简介

**1.1.1 SQL 语言简介**

SQL全称是结构化查询语言，英文译作Structured Query Language,它是一种在关系型数据库中定义和操纵数据的标准语言。最早是由IBM的圣约瑟研究实验室为其关系数据库管理系统SYSTEM R开发的一种查询语言，当时称为SEQUEL2，也就是目前的SQL语言。

1979年Oracle公司首先提供了商用的SQL语言，同年，IBM公司在DB2和SQL/DS数据库系统中也采用了SQL语言。1986年10月，美国国家标准化组织(ANSI)采用SQL作为关系数据库管理系统的标准语言(ANSI X3.135-1986)，后来SQL语言被国际标准化组织(ISO) 采纳为国际标准。

随着数据库技术的发展，SQL 标准也在不断地进行扩展和修正，数据库标准委员会先后又推出了SQL-89、SQL-92及SQL-99标准。Oracle在后期的版本中将SQL-99标准集成到了Oracle 9i以后的数据库中。目前，所有主要关系型数据库管理系统都支持某个标准的SQL语言，其中大部分数据库都遵守ANSI SQL 89标准。

**1.1.2 SQL 语言特点**

SQL是一种非过程化语言，能让用户不用考虑诸如数据的存储格式和数据的存储路径等复杂问题就能按照自己的要求在高层数据结构上操作。

SQL语句通常用于完成一些数据库的操作任务，具有增加、删除、修改、数据定义与控制等完整的数据库操作功能。在数据应用程序开发过程中，巧妙地使用SQL语句，可以简化编程，起到事半功倍的效果。

通过SQL语句，程序员或数据库管理员可以进行如下的主要工作：

- 建立数据库的表格，包括设置表格可以使用的空间。
- 改变数据库系统环境设置。
- 针对某个数据库或表格，授予用户存取权限。
- 对数据库表格建立索引|值。
- 修改数据库表格结构(新建、删除或修改表格字段)。
- 对数据库进行数据的新建。
- 对数据库进行数据的删除。
- 对数据库进行数据的修改。
- 对数据库进行数据的查询。

SQL语言结构简洁，功能强大，简单易学，自从被国际标准化组织(ISO) 采纳为国际标准以后，SQL语言得到了广泛的应用，它主要有以下特点。

**1、** 综合统一；

数据库的主要功能是通过数据库支持的数据语言来实现的。
**2、** 集合性；

SQL 运行用户在高层的数据结构上工作，而不对单个记录进行操作，可操作记录集。所有SQL语句接受集合作为输入，返回集合作为输出。

SQL的集合特性允许将一条SQL 语句的结果作为另一条SQL 语句的输入。

SQL不要求用户指定对数据的存放方法。这种特性使用户更易集中用户于要得到的结果。不仅查找可以是集合，插入、删除、更新也可以元组。
**3、** 统一性；

SQL为许多任务提供了统一的命令，这样方便用户学习和使用，基本的SQL命令只需很少时间就能学会，甚至最高级的命令也可以在几天内掌握。
**4、** 高度非过程化；

SQl 是一个非过程化的语言，不像其他的语言，如C、Pascal等，SQL 没有循环结构(比如if-then-else、 do-while) 以及函数定义等的功能。只提"做什么”，不必指明”怎么做”，用户无须了解存取路径及物理地址，这样减轻用户负担，提高效率。因为它一次处理一个记录， 对数据提供自动导航。而且SQL只有一一个数据类型的固定设置，换句话说，你不能在使用编程语言的时候创建你自己的数据类型。

存取路径的选择由DBMS的优化机制来完成，用户不必使用循环结构就可以完成数据操作。
**5、** 语言简单，易学易用；

整个SQL语句只用9个命令动词即可以实现对数据库及数据的查询和管理。SQL的命令动词及其功能如图所示。

**6、** 以同一种语法结构提供两种使用方式；

第一种方式是交互式应答使用，即用户在终端命令提示符下输入SQL命令时数据库服务器可以立即执行。

第二种方式是通过预编译SQL进行执行，即把SQL命令嵌入到应用程序中执行。

**7、** 是所有关系数据库的公共语言；

于所有主要的关系数据库管理系统都支持SQL，用户可将使用SQL的部分从一个RDBMS转到另-个，所有用SQL编写的程序都是可移植的。

**1.1.3 数据库的操作任务**

数据库的操作任务通常包括以下几方面。

- 查询数据。
- 在表中插入、修改和删除记录。
- 建立、修改和删除数据对象。
- 控制对数据和数据对象的读写。
- 保证数据库一致性和完整性。

### 1.2 SQL 语言分类

SQL是关系型数据库的基本操作语言，是数据库管理系统与数据库进行交互的接口。它将数据查询、数据操纵、事务控制、数据定义和数据控制功能集于一身，而这些功能又分别对应着各自的SQL语言，具体如下。

**1.2.1数据查询语言(DQL)**

用于检索数据库中的数据，主要是SELECT语句，它在操作数据库的过程中使用最为频繁。

**1.2.2.数据操纵语言(DML)**

用于改变数据库中的数据，主要包括INSERT、UPDATE和DELETE3条语句。

- SELECT：从一个或多个表和视图中查询数据（SELECT），获取（fetch）操作是可滚动的（scrollable）（见“可滚动游标”）
- INSERT：向表或视图中加入新数据行
- DELETE：从表或视图中删除数据行
- UPDATE：修改表或视图中已有数据行的列值
- MERGE:根据判断条件为表及视图插入或更新数据行
- EXPLANIN PLAN：查询SQL语句的执行计划
- LOCK TABLE：对表或视图加锁（lock），临时的限制其他用户访问此对象

**1.2.3.事务控制语言(TCL)**

用于维护数据的一致性，包括COMMIT、 ROLLBACK和SAVEPOINT3条语句。

- COMMIT：将事物对数据的修改永久的保存到数据库
- ROLLBACK：取消并还原事物对数据的修改，可还原到事物的开始或任意保存点（savepoint）
- SAVEPOINT：设置保存点以标识回滚位置（保存点）
- SET TRANSACTION：设置事物的属性

**1.2.4.数据定义语言(DDL)**

用于建立、修改和删除数据库对象。比如，可以使用CREATE TABLE语句创建表，使用ALTER TABLE语句修改表结构;使用DROP TABLE语句删除表。

- CREATE/ALTER/DROP：创建/修改/移除方案对象及其他数据结构，包括数据库自身及数据库用户
- RENAME：修改方案对象名称
- TRUNCATE：修改方案对象的所有数据，但不移除对象的结构
- GRANT/REVOKE：授予或收回权限及角色
- AUDIT/NOAUDIT：打开或关闭审计选项
- COMMENT：向数据字典中添加注释

**1.2.5.数据控制语言(DCL)**

用于执行权限授予和权限收回操作，主要包括GRANT和REVOKE两条命令

- GRANT：用于给用户或角色授予权限
- REVOKE：用于收回用户或角色所具有的权限

### 1.3 SQL 语言编写规则

**1.3.1 SQL 关键字**

SQL关键字不区分大小写，既可以使用大写格式，也可以使用小写格式，或者大小写格式混用。

示例

```java
select id, name, age from users;
SELECT id, name, age FROM users;
SelecT id, name, age FroM users;
```

上述三种SQL语言方式得到的结果是一致的。

**1.3.2 SQL 对象名和列名**

SQL对象名和列名不区分大小写，既可以使用大写格式，也可以使用小写格式，或者大小写格式混用。

```java
SELECT id, name, age FROM users;
SELECT ID, NAME, AGE FROM USERS;
SELECT Id, Name, Age FROM Users;
```

上述三种SQL语言方式得到的结果也是一致的。

**1.3.3 SQL 字符值**

SQL对象名和列名区分大小写，当在SQL中使用要字符值的时候，必须要给出正确的大小写数据，否则无法得到正确的结果。

```java
SELECT ID, NAME, AGE FROM USERS WHERE NAME = 'JACK';
SELECT ID, NAME, AGE FROM USERS WHERE NAME = 'jack';
```

上述两种SQL执行的结果是不一样的，两者的筛选条件是不同的。

**1.3.4 SQL 语句格式化**

当我们在编写SQL语句的时候，如果语句比较短，则可以直接显示到一行上。但很多时候我们编写的SQL是很长的，这时就需要将SQL分行显示，并且以`;`作为整个SQL语句的结束

```java
SELECT id, name, age, sex
  FROM users 
 WHERE nameLIKE 'sys%'
ORDER BY id;
```

## 二、用户模式

在Oracle数据库中，为了便于管理用户所创建的数据库对象（如数据表、索引、视图等），引入了模式的概念，这样某个用户所创建的数据库对象就都属于该用户模式。下面将对用户模式的概念及其实例应用进行讲解。

### 2.1 模式与模式对象

**2.1.1 模式介绍**

模式是一个数据库对象的集合。模式为一个数据库用户所有，并且具有与该用户相同的名称，如SYSTEM模式、SCOTT模式等。

在一个模式内部不可以直接访问其他模式的数据库对象，即使在具有访问权限的情况下，也需要指定模式名称才可以访问其他模式的数据库对象。

**2.1.2 模式对象介绍**

模式对象是由用户创建的逻辑结构，用以存储或引用数据。例如，前面章节中所讲过的段（如表、索引等），以及用户所拥有的其他非段的数据库对象。这些非段的数据库对象通常包括约束、视图、同义词、过程以及程序包等。

简而言之，模式与模式对象之间的关系就是拥有与被拥有的关系，即模式拥有模式对象，而模式对象被模式所拥有。 一个不为某个用户所拥有的数据库对象就不能称之为模式对象，比如角色、表空间及目录等数据库对象。

### 2.2 示例模式SCOTT

**2.2.1 介绍**

Oracle提供的SCOTT模式的目的，就是给用户提供一些示例表和数据来展示Oracle数据库的一些特性。

SCOTT模式拥有的模式对象（都是数据表）如图所示。

该模式演示了一个很简单的公司人力资源管理的数据结构，它也是Oracle的各个版本中一直在沿用的示例模式（当然Oracle 11g还有很多其他示例模式），该用户模式的连接密码为tiger。

**2.2.2 示例**

通过连接到SCOTT用户模式，查询数据字典视图USER_TABLES可以获得该模式所包含的数据表，共计4个。

```java
请输入用户名:  SCOTT
输入口令:
连接到:
Oracle Database 11g Enterprise Edition Release 11.2.0.1.0 - 64bit Production
With the Partitioning, OLAP, Data Mining and Real Application Testing options
select table_name from user_tables;
```

另外，用户也可以在SYSTEM模式下查询SCOTT模式所拥有的数据表，但要求使用dba_tables数据表。

```java
请输入用户名:  SYSTEM
输入口令:
连接到:
Oracle Database 11g Enterprise Edition Release 11.2.0.1.0 - 64bit Production
With the Partitioning, OLAP, Data Mining and Real Application Testing options
select table_name from dba_tables where owner = 'SCOTT';
```

## 三、基本查询

### 3.1 查询关键字介绍

用户对表或视图最常进行的操作就是检索数据，检索数据可以通过SELECT语句来实现，该语句由多个子句组成，通过这些子句可以完成筛选、投影和连接等各种数据操作，最终得到用户想要的查询结果。该语句的基本语法格式如下：

```java
select {
    [ distinct | all ] columns | *}
[into table_name]
from {
    tables | views | other select}
[where conditions]
[group by columns]
[having conditions]
[order by columns]
```

在上面的语法中，共有7个子句，它们的功能分别如下。

- select子句：用于选择数据表、视图中的列。
- into子句：用于将原表的结构和数据插入新表中。
- from子句：用于指定数据来源，包括表、视图和其他select语句。
- where子句：用于对检索的数据进行筛选。
- group by子句：用于对检索结果进行分组显示。
- having子句：用于从使用group by子句分组后的查询结果中筛选数据行。
- order by子句：用来对结果集进行排序（包括升序和降序）。

### 3.2 简单查询

**3.2.1 简单查询介绍**

只包含SELECT子句和FROM子句的查询就是简单查询，SELECT子句和FROM子句是SELECT语句的必选项，即每个SELECT语句都必须包含这两个子句。

SELECT子句用于选择想要在查询结果中显示的列，对于这些要显示的列，即可以使用列名来表示，也可以使用星号`*`来表示。

在检索数据时，数据将按照SELECT子句后面指定的列名的顺序来显示；如果使用星号`*`，则表示检索所有的列，这时数据将按照表结构的自然顺序来显示。

**3.2.2 检索所有的列**

如果要检索指定数据表的所有列，可以在SELECT子句后面使用星号`*`来实现。

在检索一个数据表时，要注意该表所属的模式。如果在指定表所属的模式内部检索数据，则可以直接使用表名；如果不在指定表所属的模式内部检索数据，则不但要查看当前模式是否具有查询的权限，而且还要在表名前面加上其所属的模式名称。

```java
//SCOTT用户下
select * from dept;
//SYSTEM用户下
select * from scott.dept;
```

在上面的例子中，from子句的后面只有一个数据表，实际上可以在from子句的后面指定多个数据表，每个数据表名之间使用逗号（,）分隔开，其语法格式如下：

```java
FROM table_name1, table_name2, table_name3…table_namen
```

示例

```java
select * from dept, EMP;
```

**3.2.3 检索指定的列**

用户可以指定查询表中的某些列而不是全部列，并且被指定列的顺序不受限制，指定部分列也称作投影操作。这些列名紧跟在SELECT关键字的后面，每个列名之间用逗号隔开。

其语法格式如下：

```java
SELECT column_name1,column_name2,column_name3,column_namen
```

使用指定的列进行查询，可以值指定要显示的列的顺序。

示例

```java
//SCOTT用户下
select deptno, dname, loc from dept;
//SYSTEM用户下
select deptno, dname, loc from scott.dept;
```

**3.3.4 ROWID**

在Oracle数据库中，有一个标识行中唯一特性的行标识符，该行标识符的名称为ROWID。

行标识符ROWID是Oracle数据库内部使用的隐藏列，由于该列实际上并不是定义在表中，所以也称为伪列。伪列ROWID长度为18位字符，包含该行数据在Oracle数据库中的物理地址。

用户使用DESCRIBE命令是无法查到ROWID列的，但是可以在SELECT语句中检索到该列。

```java
//SCOTT用户下
select deptno, dname, loc, rowid from dept;
//SYSTEM用户下
select deptno, dname, loc, rowid from scott.dept;
```

**3.3.5 查询日期列**

日期列是指数据类型为DATE的列。查询日期列与查询其他列没有任何区别，但日期列的默认显示格式为DD-MON-RR。

（1）以简体中文显示日期结果

```java
SQL> alter session set nls_date_language= 'SIMPLIFIED CHINESE';
会话已更改。
SQL> select ename,hiredate from scott.emp;
```

显示结果如下

```java
ENAME      HIREDATE
---------- --------------
SMITH      17-12月-80
ALLEN      20-2月 -81
WARD       22-2月 -81
JONES      02-4月 -81
MARTIN     28-9月 -81
BLAKE      01-5月 -81
CLARK      09-6月 -81
SCOTT      19-4月 -87
KING       17-11月-81
TURNER     08-9月 -81
ADAMS      23-5月 -87
ENAME      HIREDATE
---------- --------------
JAMES      03-12月-81
FORD       03-12月-81
MILLER     23-1月 -82
```

（2）以美国英语显示日期结果

```java
SQL> alter session set nls_date_language= 'AMERICAN';
会话已更改。
SQL> select ename,hiredate from scott.emp;
```

显示结果如下

```java
ENAME      HIREDATE
---------- ------------
SMITH      17-DEC-80
ALLEN      20-FEB-81
WARD       22-FEB-81
JONES      02-APR-81
MARTIN     28-SEP-81
BLAKE      01-MAY-81
CLARK      09-JUN-81
SCOTT      19-APR-87
KING       17-NOV-81
TURNER     08-SEP-81
ADAMS      23-MAY-87
ENAME      HIREDATE
---------- ------------
JAMES      03-DEC-81
FORD       03-DEC-81
MILLER     23-JAN-82
```

（3）以特定格式显示日期结果 不同国家地区、不同民族、不同人员都具有不同的日期使用习惯，如果希望定制日期显示格式，并按照特定方式显示日期格式，那么可以设置会话的NLS_DATE_FORMAT参数。

```java
SQL> alter session set nls_date_format= 'YYYY"年"MM"月"DD"日"';
会话已更改。
SQL> select ename,hiredate from scott.emp;
```

显示结果

```java
ENAME      HIREDATE
---------- --------------
SMITH      1980年12月17日
ALLEN      1981年02月20日
WARD       1981年02月22日
JONES      1981年04月02日
MARTIN     1981年09月28日
BLAKE      1981年05月01日
CLARK      1981年06月09日
SCOTT      1987年04月19日
KING       1981年11月17日
TURNER     1981年09月08日
ADAMS      1987年05月23日
ENAME      HIREDATE
---------- --------------
JAMES      1981年12月03日
FORD       1981年12月03日
MILLER     1982年01月23日
```

（4）使用TO_CHAR函数定制日期显示函数 除了可以使用参数NLS_DATE_FORMAT设置日期显示格式外，也可以使用TO_CHAR函数将日期值转变为特定格式的字符串。

```java
select ename,to_char(hiredate,'yyyy-mm-dd') from scott.emp;
select ename,to_char(hiredate,'yyyy-mm') from scott.emp;
select ename,to_char(hiredate,'mm-dd') from scott.emp;
```

**3.3.6 带有表达式的SELECT子句**

在使用SELECT语句时，对于数字数据和日期数据都可以使用算术表达式。

在SELECT语句中可以使用算术运算符，包括（+）、减（-）、乘（*）、除（/）和括号。另外，在SELECT语句中不仅可以执行单独的数学运算，还可以执行单独的日期运算以及与列名关联的运算。

```java
select sal,(sal + 1000),(sal - 1000),(sal * 1000),(sal / 1000) from scott.emp;
```

显示结果

```java
 	   SAL (SAL+1000) (SAL-1000) (SAL*1000) (SAL/1000)
---------- ---------- ---------- ---------- ----------
       800       1800       -200     800000         .8
      1600       2600        600    1600000        1.6
      1250       2250        250    1250000       1.25
      2975       3975       1975    2975000      2.975
      1250       2250        250    1250000       1.25
      2850       3850       1850    2850000       2.85
      2450       3450       1450    2450000       2.45
      3000       4000       2000    3000000          3
      5000       6000       4000    5000000          5
      1500       2500        500    1500000        1.5
      1100       2100        100    1100000        1.1
       SAL (SAL+1000) (SAL-1000) (SAL*1000) (SAL/1000)
---------- ---------- ---------- ---------- ----------
       950       1950        -50     950000        .95
      3000       4000       2000    3000000          3
      1300       2300        300    1300000        1.3
```

**3.3.7 为列名指定别名值 AS 关键字**

由于许多数据表的列名都是一些英文的缩写，用户为了方便查看检索结果，常常需要为这些列指定别名。在Oracle系统中，为列指定别名既可以使用AS关键字，也可以不使用任何关键字而直接指定。

示例

```java
select empno as "员工编号", ename as "员工姓名", sal as "员工工资" from scott.emp;
```

显示结果

```java
      员工编号 员工姓名     员工工资
---------- ---------- ----------
      7369 SMITH             800
      7499 ALLEN            1600
      7521 WARD             1250
      7566 JONES            2975
      7654 MARTIN           1250
      7698 BLAKE            2850
      7782 CLARK            2450
      7788 SCOTT            3000
      7839 KING             5000
      7844 TURNER           1500
      7876 ADAMS            1100
```

在为列指定别名时，关键字AS是可选项，可以省略，用户也可以在列名后面直接指定列的别名。

```java
select empno "员工编号", ename "员工姓名", sal "员工工资" from scott.emp;
```

**3.3.8 显示不重复记录之 DISTINCT 关键字**

默认情况下，结果集中包含所有符合查询条件的数据行，这样结果集中就有可能出现重复数据。而在实际的应用中，这些重复的数据除了占据较大的显示空间外，可能不会给用户带来太多有价值的东西，这样就需要去除重复记录，保留唯一的记录即可。

在SELECT语句中，可以使用DISTINCT关键字来限制在查询结果显示不重复的数据，该关键字用在SELECT子句的列表前面。

```java
//显示重复记录
select job from scott.emp;
//不显示重复记录
select distinct job from scott.emp;
```

显示结果

```java
//显示重复记录
JOB
---------
CLERK
SALESMAN
SALESMAN
MANAGER
SALESMAN
MANAGER
MANAGER
ANALYST
PRESIDENT
SALESMAN
CLERK
CLERK
ANALYST
CLERK
//不显示重复记录
JOB
---------
CLERK
SALESMAN
PRESIDENT
MANAGER
ANALYST
```

**3.3.9 处理NULL值之 NVL函数 函数**

NULL表示未知值，它既不是空格，也不是0。

当插入数据时，如果没有为特定列提供数据，并且该列没有默认值，那么其结果为NULL。 但是在实际应用程序中，NULL显示结果往往不能符合应用需求，在这种情况下需要使用函数NVL处理NULL，并将其转换为合理的显示结果。

（1）不处理NULL。

当算术表达式包含NULL时，如果不处理NULL，那么显示结果为空。

```java
select ename, sal, comm, sal + comm from scott.emp;
```

显示结果

```java
ENAME             SAL       COMM   SAL+COMM
---------- ---------- ---------- ----------
SMITH             800
ALLEN            1600        300       1900
WARD             1250        500       1750
JONES            2975
MARTIN           1250       1400       2650
BLAKE            2850
CLARK            2450
SCOTT            3000
KING             5000
TURNER           1500          0       1500
ADAMS            1100
JAMES             950
FORD             3000
MILLER           1300
```

通过显示结果可以看出，COMM值为NULL的列，计算SAL+COMM的值也为NULL。

（2）使用NVL函数处理NULL。

如果雇员的实发工资显示为空，那么显然是不符合实际情况的。为了避免出现这种情况，就应该处理NULL。

当使用函数NVL(a, b)时，如果a存在数值，则函数返回其原有数值；如果a列为NULL，则函数返回b。

```java
select ename, sal, comm, sal + nvl(comm,0) as nsal from scott.emp;
```

显示结果

```java
ENAME             SAL       COMM       NSAL
---------- ---------- ---------- ----------
SMITH             800                   800
ALLEN            1600        300       1900
WARD             1250        500       1750
JONES            2975                  2975
MARTIN           1250       1400       2650
BLAKE            2850                  2850
CLARK            2450                  2450
SCOTT            3000                  3000
KING             5000                  5000
TURNER           1500          0       1500
ADAMS            1100                  1100
JAMES             950                   950
FORD             3000                  3000
MILLER           1300                  1300
```

当使用函数NVL(COMM,0)时，如果COMM存在数值，则函数返回其原有数值；如果COMM列为NULL，则函数返回0。

**3.3.10 连接字符串之’||'操作符和CONCAT函数**

当执行查询操作时，为了显示更有意义的结果值，有时需要将多个字符串连接起来。连接字符串可以使用“||”操作符或者CONCAT函数。

当连接字符串时，如果在字符串中加入数字值，那么可以直接指定数字值；而如果在字符串中加入字符值或者日期值，那么必须用单引号引住。

（1）使用“||”操作符连接字符串

```java
select ename || ' 的工作是 ' || job from scott.emp;
```

```java
ENAME||'的工作是'||JOB
-----------------------------
SMITH 的工作是 CLERK
ALLEN 的工作是 SALESMAN
WARD 的工作是 SALESMAN
JONES 的工作是 MANAGER
MARTIN 的工作是 SALESMAN
BLAKE 的工作是 MANAGER
CLARK 的工作是 MANAGER
SCOTT 的工作是 ANALYST
KING 的工作是 PRESIDENT
TURNER 的工作是 SALESMAN
ADAMS 的工作是 CLERK
JAMES 的工作是 CLERK
FORD 的工作是 ANALYST
MILLER 的工作是 CLERK
```

（2）使用函数CONCAT连接字符串

```java
select concat('THIS IS ', ename) AS newname from scott.emp;
```

显示结果

```java
NEWNAME
------------------
THIS IS SMITH
THIS IS ALLEN
THIS IS WARD
THIS IS JONES
THIS IS MARTIN
THIS IS BLAKE
THIS IS CLARK
THIS IS SCOTT
THIS IS KING
THIS IS TURNER
THIS IS ADAMS
THIS IS JAMES
THIS IS FORD
THIS IS MILLER
```

### 3.3 条件查询

**3.3.1 WHERE 关键字**

在SELECT语句中使用WHERE子句可以实现对数据行的筛选操作，只有满足WHERE子句中判断条件的行才会显示在结果集中，而那些不满足WHERE子句判断条件的行则不包括在结果集中。

这种筛选操作是非常有意义的，通过筛选数据，可以从大量的数据中得到用户所需要的数据。

在SELECT语句中，WHERE子句位于FROM子句之后，其语法格式如下：

```java
SELECT columns_list
  FROM table_name
 WHERE conditional_expression
```

- columns_list：字段列表。 　table_name：表名。
- conditional_expression：筛选条件表达式。

**3.3.2 比较筛选条件**

可以在WHERE子句中使用比较运算符来筛选数据，这样只有满足筛选条件的数据行才会被检索出来，不满足比较条件的数据行则不会被检索出来。

基本的“比较筛选”操作主要有以下6种情况：

- A = B：比较A与B是否相等。
- A ! B或A `<>` B：比较A与B是否不相等。
- A > B：比较A是否大于B。
- A = B：比较A是否大于或等于B。
- A =…）操作符。尽管使用它们不会有任何语法错误，但条件总是FALSE。

```java
select ename, mgr from emp where mgr is null;
select ename, mgr from emp where mgr = null;
```

### 3.4 分组查询

**3.4.1 分组查询介绍**

数据分组的目的是用来汇总数据或为整个分组显示单行的汇总信息，通常在查询结果集中使用GROUP BY子句对记录进行分组。

在SELECT语句中，GROUP BY子句位于FROM子句之后，其语法格式如下：

```java
SELECT columns_list
  FROM table_name
[WHERE conditional_expression]
GROUP BY columns_list
```

- columns_list：字段列表，在GROUP BY子句中也可以指定多个列分组。 　table_name：表名。
- conditional_expression：筛选条件表达式。
- GROUP BY子句可以基于指定某一列的值将数据集合划分为多个分组，同一组内所有记录在分组属性上具有相同值，也可以基于指定多列的值将数据集合划分为多个分组。

**3.4.2 使用GROUP BY进行单列分组 **

单列分组是指基于列生成分组统计结果,当进行单列分组时，会基于分组列的每个不同值生成一个统计结果。

```java
select deptno, job from emp group by deptno, job order by deptno;
```

GROUP BY子句经常与聚集函数一起使用。使用GROUP BY子句和聚集函数，可以实现对查询结果中每一组数据进行分类统计。所以，在结果中每组数据都有一个与之对应的统计值。在Oracle系统中，经常使用的统计函数如图所示。

```java
select job, sum(sal) from emp group by job;
```

查询结果

```java
JOB                  SUM(SAL)
------------------ ----------
CLERK                    4150
SALESMAN                 5600
PRESIDENT                5000
MANAGER                  8275
ANALYST                  6000
```

在使用GROUP BY子句时，要注意：

- SELECT子句的后面只可以有两类表达式：统计函数和进行分组的列名。
- 在SELECT子句中的列名必须是进行分组的列，除此之外添加其他的列名都是错误的，但是GROUP BY子句后面的列名可以不出现在SELECT子句中。
- 在默认情况下，将按照GROUP BY子句指定的分组列升序排列，如果需要重新排序，可以使用ORDER BY子句指定新的排列顺序。

GROUP BY子句中的列可以不在SELECT列表中。

```java
select sum(sal) from emp group by job;
```

查询结果

```java
   SUM(SAL)
----------
      4150
      5600
      5000
      8275
      6000
```

**3.4.3 使用GROUP BY进行多列分组**

多列分组是指基于两个或两个以上的列生成分组统计结果。当进行多列分组时，会基于多个列的不同值生成统计结果。

```java
select deptno, job, avg(sal), max(sal) from emp group by deptno, job;
```

**3.4.4 使用ORDER BY改变分组排序结果**

当使用GROUP BY子句执行分组统计时，会自动基于分组列进行升序排列。为了改变分组数据的排序结果，需要使用ORDER BY子句。

```java
select deptno,sum(sal) from emp group by deptno order by sum(sal) desc;
```

**3.4.5 使用HAVING子句限制分组结果**

HAVING子句通常与GROUP BY子句一起使用，在完成对分组结果统计后，可以使用HAVING子句对分组的结果做进一步的筛选。

如果不使用GROUP BY子句，HAVING子句的功能与WHERE子句一样。HAVING子句和WHERE子句的相似之处都是定义搜索条件，唯一不同的是HAVING子句中可以包含聚合函数，如常用的（count）、（avg）、（sum）等，在WHERE子句中则不可以使用聚合函数。

- 如果在SELECT语句中使用了GROUP BY子句，那么HAVING子句将应用于GROUP BY子句创建的那些组。
- 如果指定了WHERE子句，而没有指定GROUP BY子句，那么HAVING子句将应用于WHERE子句的输出，并且整个输出被看作一个组.
- 如果在SELECT语句中既没有指定WHERE子句，也没有指定GROUP BY子句，那么HAVING子句将应用于FROM子句的输出，并且将其看作一个组。

```java
select deptno as  部门编号,
       avg(sal) as  平均工资 
  from emp 
group by deptno 
having avg(sal) > 2000 ;
```

上面的示例无法使用WHERE子句直接过滤出平均工资大于2000的部门信息，因为在WHERE子句中不可以使用聚合函数（这里是AVG）。

通常情况下，HAVING子句与GROUP BY子句一起使用，这样可以汇总相关数据后再进一步筛选汇总的数据。

**3.4.6 在GROUP BY中使用ROLLUP和CUBE操作符**

默认情况下，当使用GROUP BY子句生成数据统计结果时，只会生成相关列的数据统计信息，而不会生成小计和总计统计。

在实际应用程序中，不仅需要获得以上统计结果，而且可能还需要取得横向、纵向小计统计以及总计统计，例如部门的平均工资、岗位的平均工资、所有雇员的平均工资等。为了取得更全面的数据统计，可以使用ROLLUP和CUBE操作符。

（1）使用ROLLUP操作符执行数据统计

当使用ROLLUP操作符时，在保留原有统计结果的基础上，还会生成横向小计和总计。

```java
select deptno as  部门编号, 
	   job as  岗位, 
	   avg(sal) as  平均工资
  from emp 
group by rollup(deptno,job) ;
```

（2）使用CUBE操作符执行数据统计

当使用CUBE操作符时，在保留原有统计结果的基础上，还会生成横向小计、纵向小计岗位平均工资和总计。

```java
select deptno as  部门编号, 
	   job as  岗位, 
	   avg(sal) as  平均工资
  from emp 
group by cube(deptno,job) ;
```

（3）使用GROUPING函数

当使用ROLLUP或者CUBE操作符生成统计结果时，某个统计结果行可能用到一列或者多列，也可能没有使用任何列。为了确定统计结果是否使用了特定列，可以使用GROUPING函数。如果该函数返回0，则表示统计结果使用了该列；如果函数返回1，则表示统计结果没有使用该列。

```java
select deptno,job, sum (sal),grouping(deptno),grouping(job)
  from emp 
group by rollup(deptno,job) ;
```

（4）在ROLLUP操作符中使用复合列

复合列被看作一个逻辑单元的列组合，当引用复合列时，需要用括号括住相关列。通过在ROLLUP操作符中使用复合列，可以略过ROLLUP操作符的某些统计结果。

例如，子句GROUP BY ROLLUP(a,b,c)的统计结果等同于GROUP BY(a,b,c)、GROUP BY(a,b)、GROUP BY a以及GROUP BY ( )的并集；而如果将(b,c)作为复合列，那么子句GROUP BY ROLLUP(a,(b,c))的结果等同于GROUP BY(a,b,c)、GROUP BY a以及GROUP BY ()的并集。

```java
select deptno,job, sum (sal)
  from emp 
group by rollup((deptno,job)) ;
```

6．使用GROUPING SETS操作符

GROUPING SETS操作符是GROUP BY子句的进一步扩展。在Oracle Database 9i之前，使用GROUP BY子句一次只能显示单种分组结果，如果要生成多种分组统计结果，那么需要编写多条SELECT分组语句。从Oracle Database 9i开始，通过使用GROUPING SETS操作符，可以合并多个分组的统计结果，从而简化了多个分组操作。

```java
select deptno, job, avg (sal)  
  from emp 
group by grouping sets(deptno,job);
```

### 3.5 排序查询

**3.5.1 排序查询介绍**

在检索数据时，如果把数据从数据库中直接读取出来，这时查询结果将按照默认顺序排列，但往往这种默认排列顺序并不是用户所需要的。尤其返回数据量较大时，用户查看自己想要的信息非常不方便，因此需要对检索的结果集进行排序。

在SELECT语句中，可以使用ORDER BY子句对检索的结果集进行排序，该子句位于FROM子句之后，其语法格式如下：

```java
SELECT columns_list
  FROM table_name
[WHERE conditional_expression]
[GROUP BY columns_list]
ORDER BY {order_by_expression [ ASC | DESC ]} [ ,...n ]
```

- columns_list：字段列表，在GROUP BY子句中也可以指定多个列分组。
- table_name：表名。
- conditional_expression：筛选条件表达式。
- order_by_expression：表示要排序的列名或表达式。
- 关键字ASC表示按升序排列，这也是默认的排序方式；
- 关键字DESC表示按降序排列。

ORDER BY子句可以根据查询结果中的一个列或多个列对查询结果进行排序，并且第一个排序项是主要的排序依据，其他的是次要的排序依据。

**3.5.2 单列排序**

```java
select deptno, empno, ename 
  from emp 
order by deptno;
```

还可以在ORDER BY子句中使用列号。当执行排序操作时，不仅可以按照列名、列别名进行排序，也可以按照列或表达式在选择列表中的位置进行排序。如果列名或表达式名称很长，那么使用列位号排序可以缩减排序语句长度。

另外，当使用UNION、UNION ALL、INTERSECT、MINUS等集合操作符合并查询结果时，如果选择列表的列名不同，并且希望进行排序，则必须使用列位置进行排序。

但是在SQL语句中应该尽可能地不使用ORDER BY子句的上述用法，因为这种用法的易读性实在太差了。在不少有关Oracle SQL的书中根本就没有介绍ORDER BY子句的这种用法。尽管如此，当使用UNION、UNION ALL、INTERSECT、MINUS等集合操作符合并查询结果时，或者为了减少输入，特别是当放在ORDER BY子句之后的列名或表达式很长时，还是可以使用此种用法。

可以使用非选择列表列排序。当执行排序操作时，多数情况都会选择列表中的列执行排序操作，以便于更直观地显示数据。但是在执行排序操作时，排序列也可以不是选择列表中的列。

**3.5.3 多列排序**

当执行排序操作时，不仅可以基于单列进行排序，也可以基于多列进行排序。当以多列进行排序时，首先按照第一列进行排序，当第一列存在相同数据时，再以第二列进行排序，以此类推。

```java
select ename, deptno, sal
  from emp
order by deptno, sal desc;
```
