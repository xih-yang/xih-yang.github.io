# 08、MySQL 调优 - MySQL的执行计划介绍
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/8.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.使用EXPLAIN优化查询

### 1.1 Explain语法及概述

语法:

```java
{
    EXPLAIN | DESCRIBE | DESC}
    tbl_name [col_name | wild]
{
    EXPLAIN | DESCRIBE | DESC}
    [explain_type]
    {explainable_stmt | FOR CONNECTION connection_id}
{
    EXPLAIN | DESCRIBE | DESC} ANALYZE [FORMAT = TREE] select_statement
explain_type: {
    FORMAT = format_name
}
format_name: {
    TRADITIONAL
  | JSON
  | TREE
}
explainable_stmt: {
    SELECT statement
  | TABLE statement
  | DELETE statement
  | INSERT statement
  | REPLACE statement
  | UPDATE statement
}
```

DESCRIBE和EXPLAIN语句是同义词。在实践中，DESCRIBE关键字通常用于获取关于表结构的信息，而EXPLAIN用于获取查询执行计划(即解释MySQL如何执行查询)。

下面的讨论将根据这些用法使用DESCRIBE和EXPLAIN关键字，但是MySQL解析器将它们视为完全同义的。

#### 1.1.1 获取表结构信息

DESCRIBE提供关于表中列的信息:

```java
mysql> DESCRIBE City;
+------------+----------+------+-----+---------+----------------+
| Field      | Type     | Null | Key | Default | Extra          |
+------------+----------+------+-----+---------+----------------+
| Id         | int(11)  | NO   | PRI | NULL    | auto_increment |
| Name       | char(35) | NO   |     |         |                |
| Country    | char(3)  | NO   | UNI |         |                |
| District   | char(20) | YES  | MUL |         |                |
| Population | int(11)  | NO   |     | 0       |                |
+------------+----------+------+-----+---------+----------------+
```

描述是显示列的快捷方式。这些语句还显示视图的信息。SHOW COLUMNS的描述提供了有关输出列的更多信息。

默认情况下，DESCRIBE显示表中所有列的信息。如果给出Col_name，则是表中列的名称。在这种情况下，语句只显示指定列的信息。野，如果给定，是一个模式字符串。它可以包含SQL %和_通配符。在这种情况下，该语句只显示名称与字符串匹配的列的输出。字符串不需要用引号括起来，除非它包含空格或其他特殊字符。

提供DESCRIBE语句是为了与Oracle兼容。

SHOW CREATE TABLE、SHOW TABLE STATUS和SHOW INDEX语句也提供了关于表的信息。

#### 1.1.2 获取执行计划信息

EXPLAIN语句提供了MySQL如何执行语句的信息:

**1、** EXPLAIN适用于SELECT、DELETE、INSERT、REPLACE和UPDATE语句在MySQL8.0.19及以后版本中，它也可以处理TABLE语句；

**2、** 当EXPLAIN与可解释性语句一起使用时，MySQL将显示来自优化器的关于语句执行计划的信息也就是说，MySQL解释了它将如何处理这条语句，包括关于表如何连接以及以何种顺序连接的信息；

**3、** 当EXPLAIN与FORCONNECTIONconnection_id一起使用时，而不是一个可解释的语句，它将显示在命名连接中执行的语句的执行计划；

**4、** 对于可解释性语句，EXPLAIN生成可以使用SHOWWARNINGS显示的附加执行计划信息；

**5、** EXPLAIN对于检查涉及分区表的查询非常有用；

**6、** FORMAT选项可用于选择输出格式TRADITIONAL以表格格式显示输出如果没有FORMAT选项，这是默认值JSON格式以JSON格式显示信息在MySQL8.0.16及以后版本中，TREE提供了类似树的输出，比传统格式提供了更精确的查询处理描述;它是唯一显示散列连接使用的格式，并且总是用于EXPLAINANALYZE；

EXPLAIN需要执行被解释语句所需的相同特权。此外，EXPLAIN还要求对任何已解释的视图具有SHOW VIEW特权。解释……如果指定的连接属于不同的用户，那么FOR CONNECTION也需要PROCESS特权。

在EXPLAIN的帮助下，您可以看到应该在表的哪些地方添加索引，以便通过使用索引查找行来加快语句的执行速度。您还可以使用EXPLAIN来检查优化器是否以最佳顺序连接表。要提示优化器使用与SELECT语句中表的命名顺序对应的连接顺序，请使用SELECT直线连接(而不是SELECT)开始该语句。

优化器跟踪有时可能提供与EXPLAIN补充的信息。但是，优化器跟踪格式和内容可能会在不同版本之间发生变化。详细信息，请参见MySQL内部:跟踪优化器。

如果您认为索引应该被使用，但却没有使用，那么运行ANALYZE TABLE来更新表的统计信息，例如键的基数，这些信息可能会影响优化器做出的选择。

#### 1.1.3 使用EXPLAIN ANALYZE获取信息

MySQL 8.0.18引入了EXPLAIN ANALYZE，它运行一条语句并产生EXPLAIN输出，以及计时和额外的、基于迭代器的信息，这些信息是关于优化器的期望如何与实际执行相匹配的。对于每个迭代器，提供以下信息:

**1、** 估计执行成本；

(有些迭代器没有计入成本模型，因此不包括在估算中。)
**2、** 估计返回的行数；

**3、** 该返回第一行了；

**4、** 返回所有行的时间(实际成本)，以毫秒为单位；

(当有多个循环时，该图显示了每个循环的平均时间。)
**5、** 迭代器返回的行数；

**6、** 数量的循环；

查询执行信息使用TREE输出格式显示，其中节点表示迭代器。EXPLAIN ANALYZE总是使用TREE输出格式。在MySQL 8.0.21及以后版本中，可以使用FORMAT=TREE显式指定。TREE以外的其他格式仍然不受支持。

EXPLAIN ANALYZE可以与SELECT语句一起使用，也可以与多表UPDATE和DELETE语句一起使用。从MySQL 8.0.19开始，它也可以与TABLE语句一起使用。

从MySQL 8.0.20开始，您可以使用KILL QUERY或CTRL-C终止此语句。

解释分析不能与FOR连接一起使用。

```java
mysql> EXPLAIN ANALYZE SELECT * FROM t1 JOIN t2 ON (t1.c1 = t2.c2)\G
*************************** 1. row ***************************
EXPLAIN: -> Inner hash join (t2.c2 = t1.c1)  (cost=4.70 rows=6)
(actual time=0.032..0.035 rows=6 loops=1)
    -> Table scan on t2  (cost=0.06 rows=6)
(actual time=0.003..0.005 rows=6 loops=1)
    -> Hash
        -> Table scan on t1  (cost=0.85 rows=6)
(actual time=0.018..0.022 rows=6 loops=1)
mysql> EXPLAIN ANALYZE SELECT * FROM t3 WHERE i > 8\G
*************************** 1. row ***************************
EXPLAIN: -> Filter: (t3.i > 8)  (cost=1.75 rows=5)
(actual time=0.019..0.021 rows=6 loops=1)
    -> Table scan on t3  (cost=1.75 rows=15)
(actual time=0.017..0.019 rows=15 loops=1)
mysql> EXPLAIN ANALYZE SELECT * FROM t3 WHERE pk > 17\G
*************************** 1. row ***************************
EXPLAIN: -> Filter: (t3.pk > 17)  (cost=1.26 rows=5)
(actual time=0.013..0.016 rows=5 loops=1)
    -> Index range scan on t3 using PRIMARY  (cost=1.26 rows=5)
(actual time=0.012..0.014 rows=5 loops=1)
```

示例输出中使用的表是由下面所示的语句创建的:

```java
CREATE TABLE t1 (
    c1 INTEGER DEFAULT NULL,
    c2 INTEGER DEFAULT NULL
);
CREATE TABLE t2 (
    c1 INTEGER DEFAULT NULL,
    c2 INTEGER DEFAULT NULL
);
CREATE TABLE t3 (
    pk INTEGER NOT NULL PRIMARY KEY,
    i INTEGER DEFAULT NULL
);
```

## 二.Explain输出格式

EXPLAIN语句提供了关于MySQL如何执行语句的信息。EXPLAIN适用于SELECT、DELETE、INSERT、REPLACE和UPDATE语句。

EXPLAIN为SELECT语句中使用的每个表返回一行信息。它按照MySQL在处理语句时读取这些表的顺序列出了输出中的表。这意味着MySQL从第一个表中读取一行，然后在第二个表中找到匹配的行，然后在第三个表中找到匹配的行，以此类推。当处理所有表时，MySQL输出所选列并回溯表列表，直到找到一个有更多匹配行的表。从这个表中读取下一行，然后继续读取下一个表。

### 2.1 EXPLAIN 输出列

EXPLAIN的每个输出行提供关于一个表的信息。每一行包含表中总结的值，并在表后面有更详细的描述。列名显示在表的第一列中;第二列提供了当使用FORMAT=JSON时在输出中显示的等价属性名。

EXPLAIN 输出列信息:

列名
json名
含义

id
select_id
select语句的标示符

select_type
None
select的类别

table
table_name
输出行的表

partitions
partitions
匹配的分区

type
access_type
表连接的类型

possible_keys
possible_keys
可选择的索引

key
key
实际选择的索引

key_len
key_length
所选键的长度

ref
ref
与索引比较的列

rows
rows
要检查的行数的估计

filtered
filtered
按表条件过滤的行百分比

Extra
None
额外的信息

#### 2.1.1 id (JSON name: select_id)

SELECT标识符。这是查询中SELECT的顺序编号。如果该行引用其他行的联合结果，则该值可以为NULL。在本例中，表列显示了一个类似于的值，表示该行指的是id值为M和N的行的并集。

#### 2.1.2 select_type (JSON name: none)

SELECT的类型，可以是下表中显示的任何类型。json格式的EXPLAIN将SELECT类型作为query_block的属性公开，除非它是SIMPLE或PRIMARY。表格中还显示了JSON名称(如果适用的话)。

select_type值
json名
含义

SIMPLE
None
简单的SELECT(不使用UNION或子查询)

PRIMARY
None
外层的选择

UNION
None
UNION中的第二个或之后的SELECT语句

DEPENDENT UNION
dependent (true)
UNION中的第二个或之后的SELECT语句，依赖于外部查询

UNION RESULT
union_result
UNION的结果

SUBQUERY
None
子查询中的第一个SELECT

DEPENDENT SUBQUERY
dependent (true)
子查询中的第一个SELECT ，依赖于外部查询

DERIVED
None
派生表

DEPENDENT DERIVED
dependent (true)
依赖于另一个表的派生表

MATERIALIZED
materialized_from_subquery
物化子查询

UNCACHEABLE SUBQUERY
cacheable (false)
不能缓存其结果的子查询，必须为外部查询的每一行重新求值

UNCACHEABLE UNION
cacheable (false)
UNION中属于非缓存子查询的第二个或之后的选择(参见非缓存子查询)

dependency通常表示使用相关子查询。

从属子查询的计算不同于非缓存子查询的计算。对于从属子查询，子查询只会对来自其外部上下文的变量的每一组不同值重新计算一次。对于UNCACHEABLE SUBQUERY，子查询将针对外部上下文的每一行重新计算。

当你用EXPLAIN指定FORMAT=JSON时，输出没有直接等价于select_type的单个属性;query_block属性对应于给定的SELECT。与刚才显示的大多数SELECT子查询类型等价的属性是可用的(例如materialized_from_subquery用于MATERIALIZED)，并在适当的时候显示。对于SIMPLE或PRIMARY，没有对应的JSON。

非select语句的select_type值显示受影响表的语句类型。例如，对于DELETE语句，select_type是DELETE。

#### 2.1.3 table (JSON name: table_name)

输出行所指的表的名称。这也可以是以下值之一:

**1、** 表示id值为M和N的行并集；

**2、** 这一行指的是id值为n的那一行的派生表结果例如，派生表可能来自from子句中的一个子查询；

**3、** 这一行是id值为n的实化子查询的结果；

#### 2.1.4 partitions (JSON name: partitions)

查询将从其中匹配记录的分区。对于非分区表，该值为NULL.

#### 2.1.5 type (JSON name: access_type)

EXPLAIN输出的类型列描述了如何连接表。在json格式的输出中，这些值是access_type属性的值。下面的列表描述了连接类型，按照从最佳类型到最差类型的顺序排列:

**1、** system；

表只有一行(=系统表)。这是const连接类型的特殊情况。

**2、** const；

表最多有一个匹配行，在查询开始时读取。因为只有一行，所以该行中列中的值可以被优化器的其余部分视为常量。Const表非常快，因为它们只被读取一次。

const用于将主键或惟一索引的所有部分与常量值进行比较。在以下查询中，tbl_name可以作为const表使用:

```java
SELECT * FROM tbl_name WHERE primary_key=1;
SELECT * FROM tbl_name
  WHERE primary_key_part1=1 AND primary_key_part2=2;
```

**1、** eq_ref；

对于前一个表中的每一个行组合，都从这个表中读取一行。除了系统类型和const类型，这是最好的连接类型。当连接使用索引的所有部分，且索引是主键或UNIQUE NOT NULL索引时，使用该索引。

Eq_ref可用于使用=操作符进行比较的索引列。比较值可以是一个常量或一个表达式，该表达式使用在该表之前读取的表中的列。在下面的例子中，MySQL可以使用eq_ref连接来处理ref_table:

```java
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column=other_table.column;
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column_part1=other_table.column
  AND ref_table.key_column_part2=1;
```

**1、** ref；

对于前一个表中的每个行组合，将从这个表中读取索引值匹配的所有行。如果连接只使用键的最左边的前缀，或者键不是主键或惟一索引(换句话说，如果连接不能基于键值选择单行)，则使用ref。如果使用的键只匹配几行，这是一个很好的连接类型。

Ref可用于使用=或操作符进行比较的索引列。在下面的例子中，MySQL可以使用ref连接来处理ref_table:

```java
SELECT * FROM ref_table WHERE key_column=expr;
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column=other_table.column;
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column_part1=other_table.column
  AND ref_table.key_column_part2=1;
```

**1、** fulltext；

连接是使用FULLTEXT索引执行的
**2、** ref_or_null；

这种连接类型类似ref，但是MySQL会对包含NULL值的行进行额外的搜索。这种连接类型优化最常用于解析子查询。在下面的例子中，MySQL可以使用ref_or_null连接来处理ref_table:

```java
SELECT * FROM ref_table
  WHERE key_column=expr OR key_column IS NULL;
```

**1、** index_merge；

此连接类型表示使用了索引合并优化。在本例中，输出行中的键列包含所用索引的列表，而key_len包含所用索引的最长键部分的列表.
**2、** unique_subquery；

以下形式的IN子查询用此类型替换eq_ref:

```java
value IN (SELECT primary_key FROM single_table WHERE some_expr)
```

Unique_subquery只是一个索引查询函数，它完全取代了子查询以提高效率

**1、** index_subquery；

这种连接类型类似于unique_subquery。它取代了IN子查询，但它适用于以下形式的子查询中的非唯一索引:

```java
value IN (SELECT key_column FROM single_table WHERE some_expr)
```

**1、** range；

只检索给定范围内的行，使用索引选择行。输出行中的键列表明使用了哪个索引。key_len包含所使用的最长密钥部分。对于这种类型，ref列是NULL。

range可以在键列与常量进行比较时使用=，<>，>，>=，， BETWEEN, LIKE, or IN()操作符:

```java
SELECT * FROM tbl_name
  WHERE key_column = 10;
SELECT * FROM tbl_name
  WHERE key_column BETWEEN 10 and 20;
SELECT * FROM tbl_name
  WHERE key_column IN (10,20,30);
SELECT * FROM tbl_name
  WHERE key_part1 = 10 AND key_part2 IN (10,20,30);
```

**1、** index；

索引连接类型与ALL相同，只是要扫描索引树。这有两种方式:

**11、** 1如果索引是查询的覆盖索引，并且可以用于满足表中所需的所有数据，则只扫描索引树在本例中，Extra列表示Usingindex仅索引扫描通常比ALL更快，因为索引的大小通常小于表数据；

**11、** 2使用从索引中读取以按索引顺序查找数据行来执行全表扫描Usesindex不会出现在Extra列中；

当查询只使用属于单个索引的列时，MySQL可以使用这种连接类型。
**2、** ALL；

对前一个表中的每一个行组合执行一次全表扫描。如果表是第一个未被标记为const的表，这通常是不好的，在所有其他情况下通常是非常糟糕的。通常，可以通过添加索引来避免使用ALL，这些索引支持基于常值从表中进行行检索，或基于以前表中的列值进行行检索。

#### 2.1.6 possible_keys (JSON name: possible_keys)

possible_keys列表示MySQL可以选择从其中查找该表中的行的索引。注意，此列完全独立于EXPLAIN输出中显示的表的顺序。这意味着可能_keys中的一些键在实际生成的表顺序中可能不可用。

如果该列为NULL(或在json格式的输出中未定义)，则没有相关的索引。在这种情况下，您可以通过检查WHERE子句来检查它是否引用了一些或一些适合索引的列，从而提高查询的性能。如果是，创建一个适当的索引并再次使用EXPLAIN检查查询。

要查看表有哪些索引，请使用SHOW INDEX FROM tbl_name。

#### 2.1.7 key (JSON name: key)

键列表示MySQL实际决定使用的键(索引)。如果MySQL决定使用一个可能的_keys索引来查找行，该索引将作为键值列出。

key可能会命名一个不存在于possible_keys值中的索引。如果没有一个possible_keys索引适合查找行，但是查询选择的所有列都是其他一些索引的列，就会发生这种情况。也就是说，已命名的索引涵盖所选的列，因此尽管它不用于确定要检索哪些行，但索引扫描比数据行扫描更有效。

对于InnoDB来说，即使查询也选择了主键，辅助索引也可能涵盖所选列，因为InnoDB会在每个辅助索引中存储主键值。如果key是NULL, MySQL找不到索引来更有效地执行查询。

要强制MySQL使用或忽略列中列出的索引，请在查询中使用force index、use index或ignore index。

对于MyISAM表，运行ANALYZE TABLE可以帮助优化器选择更好的索引。对于MyISAM表，myisamchk -analyze也做同样的工作。

#### 2.1.8 key_len (JSON name: key_length)

key_len列表示MySQL决定使用的密钥的长度。key_len的值使您能够确定MySQL实际使用多部分密钥的多少部分。如果键列说NULL, key_len列也说NULL。

由于键存储格式的原因，可以为NULL的列的键长度比NOT NULL的列大一个。

#### 2.1.9 ref (JSON name: ref)

ref列显示哪些列或常量与键列中指定的索引进行比较，以从表中选择行。

如果值是func，则使用的值是某个函数的结果。要查看哪个函数，请在EXPLAIN后面使用SHOW WARNINGS来查看扩展的EXPLAIN输出。函数实际上可能是一个运算符，比如算术运算符。

#### 2.1.10 rows (JSON name: rows)

rows列表示MySQL认为在执行查询时必须检查的行数。

对于InnoDB表，这个数字是一个估计值，可能并不总是准确的。

#### 2.1.11 filtered (JSON name: filtered)

筛选列指示由表条件筛选的表行的估计百分比。最大值是100，这意味着没有对行进行过滤。从100开始减小的值表示过滤的数量在增加。Rows显示所检查的估计行数，而行×过滤显示与下表连接的行数。例如，如果rows为1000，而filtered为50.00(50%)，则连接到下表的行数为1000 × 50% = 500。

#### 2.1.12 Extra (JSON name: none)

没有一个JSON属性对应Extra列;但是，可以出现在此列中的值将作为JSON属性或消息属性的文本公开。

EXPLAIN输出的Extra列包含关于MySQL如何解析查询的额外信息。下面的列表解释了此列中可能出现的值。每个项还指示json格式的输出，哪个属性显示Extra值。对于其中一些，有一个特定的属性。其他的显示为message属性的文本。

如果您希望尽可能快地进行查询，请注意Using filesort和Using temporary的Extra列值，或者在json格式的EXPLAIN输出中，对于using_filesort和using_temporary_table属性等于true。

**1、** Backwardindexscan(JSON:backward_index_scan)；

优化器可以在InnoDB表上使用降序索引。与Using index一起显示。

**2、** Childof‘table’pushedjoin@1(JSON:messagetext)；

这个表在一个可以下推到NDB内核的连接中作为table的子表被引用。仅适用于NDB集群，当下推连接被启用时。有关更多信息和示例，请参见ndb_join_pushdown服务器系统变量的描述。

**3、** constrownotfound(JSONproperty:const_row_not_found)；

对于诸如SELECT…from tbl_name，表是空的。

**4、** Deletingallrows(JSONproperty:message)；

对于DELETE，一些存储引擎(如MyISAM)支持以一种简单而快速的方式删除所有表行的处理程序方法。如果引擎使用此优化，则显示此Extra值。

**5、** Distinct(JSONproperty:distinct)；

MySQL正在寻找不同的值，所以当它找到第一个匹配的行后，它就停止为当前的行组合搜索更多的行。

**6、** FirstMatch(tbl_name)(JSONproperty:first_match)；

对tbl_name使用semijoin FirstMatch连接捷径策略。

**7、** FullscanonNULLkey(JSONproperty:message)；

当优化器不能使用索引查找访问方法时，将子查询优化作为一种回退策略出现这种情况。

**8、** ImpossibleHAVING(JSONproperty:message)；

HAVING子句总是false，不能选择任何行。

**9、** ImpossibleWHERE(JSONproperty:message)；

WHERE子句总是false，不能选择任何行。

**10、** ImpossibleWHEREnoticedafterreadingconsttables(JSONproperty:message)；

MySQL已经读取了所有的const(和system)表，注意WHERE子句总是为false。

**11、** LooseScan(m…n)(JSONproperty:message)；

采用半join LooseScan策略。M和n是关键零件号。

**12、** Nomatchingmin/maxrow(JSONproperty:message)；

没有一行满足查询的条件，例如SELECT MIN(…)从…条件的地方。

**13、** nomatchingrowinconsttable(JSONproperty:message)；

对于带有连接的查询，存在一个空表或没有行满足惟一索引条件的表。

**14、** Nomatchingrowsafterpartitionpruning(JSONproperty:message)；

对于DELETE或UPDATE，在分区剪枝之后，优化器没有发现需要删除或更新的内容。它的意义类似于SELECT语句的Impossible WHERE。

**15、** Notablesused(JSONproperty:message)；

查询没有FROM子句，或者有FROM DUAL子句。

对于INSERT或REPLACE语句，EXPLAIN在没有SELECT部分时显示此值。例如，它出现在EXPLAIN INSERT INTO t VALUES(10)中，因为它等价于EXPLAIN INSERT INTO t SELECT 10 FROM DUAL。

**16、** Notexists(JSONproperty:message)；

MySQL能够对查询进行LEFT JOIN优化，并且在找到匹配LEFT JOIN条件的行后，不会检查该表中先前的行组合的更多行。下面是一个可以通过这种方式优化的查询类型的示例:

```java
SELECT * FROM t1 LEFT JOIN t2 ON t1.id=t2.id
  WHERE t2.id IS NULL;
```

假设t2.id定义为NOT NULL。在本例中，MySQL扫描t1并使用t1.id的值查找t2中的行。如果MySQL在t2中找到匹配的行，它知道t2.id永远不能为NULL，并且不会扫描t2中具有相同id值的其余行。换句话说，对于t1中的每一行，MySQL只需要在t2中进行一次查找，而不管t2中有多少行匹配。

在MySQL 8.0.17及以后版本中，这也可以表明一个形式为NOT In(子查询)或NOT EXISTS(子查询)的WHERE条件已经被内部转换为反连接。这将删除子查询，并将其表带入最顶层查询的计划中，从而提供改进的成本计划。通过合并半连接和反连接，优化器可以更自由地对执行计划中的表进行重新排序，在某些情况下可以获得更快的计划。

通过检查来自SHOW WARNINGS的Message列，或者在EXPLAIN FORMAT=TREE的输出中，可以看到何时为给定查询执行了反连接转换。

**1、** Planisn’treadyyet(JSONproperty:none)；

当优化器还没有为已命名连接中执行的语句创建执行计划时，EXPLAIN FOR CONNECTION会出现此值。如果执行计划输出包含多行，则其中任何一行或所有一行都可能有这个Extra值，这取决于优化器在确定完整执行计划方面的进度。

**2、** Rangecheckedforeachrecord(indexmap:N)(JSONproperty:message)；

MySQL发现没有好的索引可以使用，但是发现有些索引可能在已知前一个表的列值后使用。对于上表中的每个行组合，MySQL检查是否可以使用range或index_merge访问方法来检索行。这不是非常快，但比执行没有索引的连接要快。

索引从1开始编号，顺序与表的SHOW INDEX相同。索引映射值N是位掩码值，表示哪些索引是候选索引。例如，值0x19(二进制11001)表示考虑索引1、4和5。

**3、** Recursive(JSONproperty:recursive)；

这表明该行适用于递归公共表表达式的递归SELECT部分。

**4、** Rematerialize(JSONproperty:rematerialize)；

Rematerialize (X，…)显示在表T的EXPLAIN行中，其中X是任何横向派生表，它的Rematerialize在读取新行T时被触发。例如:

```java
SELECT
  ...
FROM
  t,
  LATERAL (derived table that refers to t) AS dt
...
```

每次top查询处理新行t时，将重新物化派生表的内容，使其更新。

**1、** ScannedNdatabases(JSONproperty:message)；

这表示服务器在处理对INFORMATION_SCHEMA表的查询时执行多少个目录扫描.

**2、** Selecttablesoptimizedaway(JSONproperty:message)；

优化器确定1)应该最多返回一行，2)为了产生这一行，必须读取一组确定的行。当可以在优化阶段读取要读取的行(例如，通过读取索引行)时，在查询执行期间不需要读取任何表。

当查询被隐式分组(包含一个聚合函数但没有GROUP BY子句)时，第一个条件将被满足。当对使用的每个索引执行一个行查询时，就满足了第二个条件。读取的索引数决定了要读取的行数。

考虑以下隐式分组查询:

```java
SELECT MIN(c1), MIN(c2) FROM t1;
```

假设MIN(c1)可以通过读取一个索引行来检索，MIN(c2)可以通过从不同的索引读取一行来检索。也就是说，对于每个列c1和c2，存在一个索引，其中该列是该索引的第一列。在本例中，将返回一行，这是通过读取两个确定性行产生的。

如果要读取的行不是确定性的，则不会出现此Extra值。考虑一下这个查询:

```java
SELECT MIN(c2) FROM t1 WHERE c1 <= 10;
```

假设(c1, c2)是一个覆盖指标。使用这个索引，必须扫描所有c1 <= 10的行，以找到最小的c2值。相比之下，考虑以下查询:

```java
SELECT MIN(c2) FROM t1 WHERE c1 = 10;
```

在本例中，c1 = 10的第一个索引行包含最小的c2值。必须只读取一行以产生返回的行。

对于每个表维护一个精确的行数的存储引擎(如MyISAM，但不是InnoDB)，这个额外的值可以出现在count(*)查询，其中WHERE子句缺失或总是true，没有GROUP BY子句。(这是隐式分组查询的一个实例，在该查询中存储引擎会影响是否可以确定地读取行数。)

**1、** Skip_open_table,Open_frm_only,Open_full_table(JSONproperty:message)；

这些值表示应用于查询INFORMATION_SCHEMA表的文件打开优化。

**1、** Skip_open_table:不需要打开表文件这些信息已经可以从数据字典中获得；

**2、** Open_frm_only:表信息只需要读取数据字典；

**3、** Open_full_table:未优化的信息查询表信息必须从数据字典中读取，并通过读取表文件；

**1、** Starttemporary,Endtemporary(JSONproperty:message)；

这表示使用半连接Duplicate weed策略的临时表。

**2、** uniquerownotfound(JSONproperty:message)；

查询，如SELECT…从tbl_name，没有行满足唯一索引或表上的主键的条件。

**3、** Usingfilesort(JSONproperty:using_filesort)；

MySQL必须做一个额外的步骤来找出如何检索排序的行。排序是根据连接类型遍历所有行，并存储与WHERE子句匹配的所有行的排序键和指向该行的指针。然后对键进行排序，并按排序顺序检索行。

**4、** Usingindex(JSONproperty:using_index)；

仅使用索引树中的信息从表中检索列信息，而不必执行额外的查找来读取实际的行。当查询只使用属于单个索引的列时，可以使用此策略。

对于具有用户定义的聚集索引的InnoDB表，即使Extra列中没有Using index，也可以使用该索引。如果type是index, key是PRIMARY，就会出现这种情况。

EXPLAIN FORMAT=TRADITIONAL和EXPLAIN FORMAT=JSON中显示了所有覆盖索引的信息。从MySQL 8.0.27开始，也显示了EXPLAIN FORMAT=TREE。

**5、** Usingindexcondition(JSONproperty:using_index_condition)；

通过访问索引元组来读取表，并首先测试它们，以确定是否读取完整的表行。这样，除非必要，索引信息用于延迟(“下推”)读取全表行。

**6、** Usingindexforgroup-by(JSONproperty:using_index_for_group_by)；

与使用索引表访问方法类似，对于GROUP - BY使用索引表示MySQL找到了一个索引，该索引可用于检索GROUP BY或DISTINCT查询的所有列，而无需对实际表进行任何额外的磁盘访问。此外，索引是以最有效的方式使用的，因此对于每个组，只读取少数索引项。

**7、** Usingindexforskipscan(JSONproperty:using_index_for_skip_scan)；

使用“跳过扫描”访问方式。

**8、** Usingjoinbuffer(BlockNestedLoop),Usingjoinbuffer(BatchedKeyAccess),Usingjoinbuffer(hashjoin)(JSONproperty:using_join_buffer)；

早期连接中的表被部分读入连接缓冲区，然后从缓冲区使用它们的行来执行与当前表的连接。(Block Nested Loop)表示使用块嵌套循环算法，(Batched Key Access)表示使用批密钥访问算法，(hash join)表示使用哈希连接。也就是说，在EXPLAIN输出的前面一行上的表中的键被缓冲，匹配的行被从使用join buffer中出现的行所表示的表中批量获取。

在json格式的输出中，using_join_buffer的值总是块嵌套循环、批密钥访问或散列连接中的一个。

哈希连接从MySQL 8.0.18开始可用;Block Nested-Loop算法在MySQL 8.0.20或更高版本中没有使用。

**9、** UsingMRR(JSONproperty:message)；

使用多范围读优化策略读取表。

**10、** Usingsort_union(…),Usingunion(…),Usingintersect(…)(JSONproperty:message)；

它们表明了特定的算法，显示了索引扫描如何为index_merge连接类型合并。

**11、** Usingtemporary(JSONproperty:using_temporary_table)；

为了解析查询，MySQL需要创建一个临时表来保存结果。如果查询包含以不同方式列出列的GROUP BY和ORDER BY子句，通常会发生这种情况。

**12、** Usingwhere(JSONproperty:attached_condition)；

WHERE子句用于限制哪些行与下一个表匹配或发送给客户端。除非你特别想从表中获取或检查所有的行，如果Extra值不是Using where，并且表连接类型是all或index，那么你的查询可能有问题。

在没有直接对应json格式输出的地方使用;attachhed_condition属性包含任何使用的WHERE条件。

**13、** Usingwherewithpushedcondition(JSONproperty:message)；

仅适用于NDB表。这意味着NDB Cluster使用条件下推优化来提高非索引列和常量之间直接比较的效率。在这种情况下，条件被“下推”到集群的数据节点，并同时对所有数据节点进行评估。这样就不需要通过网络发送不匹配的行，并且可以将查询速度提高5到10倍，而不需要使用Condition Pushdown。

**14、** Zerolimit(JSONproperty:message)；

查询有一个LIMIT 0子句，不能选择任何行。

## 三. 获取命名连接的执行计划信息

获取在指定连接中执行的可解释语句的执行计划，使用此语句:

```java
EXPLAIN [options] FOR CONNECTION connection_id;
```

EXPLAIN FOR CONNECTION返回当前用于在给定连接中执行查询的EXPLAIN信息。由于对数据(和支持统计数据)的更改，它可能产生与对等价查询文本运行EXPLAIN不同的结果。这种行为上的差异有助于诊断更多的瞬态性能问题。例如，如果您在一个需要很长时间才能完成的会话中运行一条语句，那么在另一个会话中使用EXPLAIN For CONNECTION可能会产生有关延迟原因的有用信息。

connection_id是连接标识符，可以从INFORMATION_SCHEMA PROCESSLIST表或SHOW PROCESSLIST语句中获取。如果您拥有PROCESS特权，则可以为任何连接指定标识符。否则，您只能为自己的连接指定标识符。在所有情况下，您必须拥有足够的权限来解释指定连接上的查询。

如果指定的连接没有执行语句，则结果为空。否则，只有在命名连接中执行的语句是可解释的时，EXPLAIN FOR CONNECTION才会应用。这包括选择、删除、插入、替换和更新。(但是，EXPLAIN FOR CONNECTION不适用于准备语句，即使是那些类型的准备语句。)

如果指定的连接正在执行一个可解释语句，那么输出就是您在语句本身上使用EXPLAIN所获得的输出。

操作步骤
session1
session2

获取connect_id
SELECT CONNECTION_ID();
也可以通过show processlist查看

查看其它连接正在执行sql的执行计划

EXPLAIN FOR CONNECTION 8;

```java
-- session1
mysql> SELECT CONNECTION_ID();
+-----------------+
| CONNECTION_ID() |
+-----------------+
|               8 |
+-----------------+
1 row in set (0.00 sec)
mysql> select count(*) from fact_sale_new;
-- session2
mysql> EXPLAIN FOR CONNECTION 8;
+----+-------------+---------------+------------+-------+---------------+---------+---------+------+-----------+----------+-------------+
| id | select_type | table         | partitions | type  | possible_keys | key     | key_len | ref  | rows      | filtered | Extra       |
+----+-------------+---------------+------------+-------+---------------+---------+---------+------+-----------+----------+-------------+
|  1 | SIMPLE      | fact_sale_new | NULL       | index | NULL          | PRIMARY | 8       | NULL | 766191222 |   100.00 | Using index |
+----+-------------+---------------+------------+-------+---------------+---------+---------+------+-----------+----------+-------------+
1 row in set (0.00 sec)
```

## 四. 评估查询性能

在大多数情况下，可以通过计算磁盘寻找数来估计查询性能。对于小表，通常可以在一个磁盘查找中找到一行(因为索引可能被缓存了)。对于更大的表，您可以估计，使用B-tree索引，您需要这么多文件来查找一行:log(row_count) / log(index_block_length / 3 * 2 / (index_length + data_pointer_length)) + 1。

在MySQL中，一个索引块通常是1024字节，而数据指针通常是4字节。对于500000行、键值长度为3字节(MEDIUMINT的大小)的表，公式表示log(500,000)/log(1024/3*2/(3+4)) + 1 = 4次查找。

这个索引将需要大约500,000 * 7 * 3/2 = 5.2MB的存储(假设典型的索引缓冲区填充率为2/3)，因此您可能在内存中有很多索引，因此只需要一次或两次调用来读取数据来找到行。

但是，对于写操作，您需要4个查找请求来找到放置新索引值的位置，通常需要两个查找请求来更新索引和写入行。

前面的讨论并不意味着你的应用程序性能在日志n时就会慢慢下降。只要所有的东西都被操作系统或MySQL服务器缓存，当表变大时，事情只会稍微变慢。当数据变得太大而不能被缓存时，事情就会变得非常慢，直到你的应用程序只被磁盘请求绑定(增加了log N)。为了避免这种情况，随着数据的增长增加关键缓存的大小。对于MyISAM表，键缓存大小由key_buffer_size系统变量控制。

## 五.查看执行计划的实例

我们来运行几个简单的查询，来看几个执行计划的例子。

代码:

```java
select e.ename,d.dname from emp e,dept d where e.deptno = d.deptno;  
```

通过三种格式来查看上段sql代码的执行计划:

**常规格式**

```java
mysql> EXPLAIN  select e.ename,d.dname from emp e,dept d where e.deptno = d.deptno;  
+----+-------------+-------+------------+------+---------------+-----------+---------+---------------+------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key       | key_len | ref           | rows | filtered | Extra |
+----+-------------+-------+------------+------+---------------+-----------+---------+---------------+------+----------+-------+
|  1 | SIMPLE      | d     | NULL       | ALL  | PRIMARY       | NULL      | NULL    | NULL          |    4 |   100.00 | NULL  |
|  1 | SIMPLE      | e     | NULL       | ref  | FK_DEPTNO     | FK_DEPTNO | 5       | test.d.deptno |    4 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+-----------+---------+---------------+------+----------+-------+
2 rows in set, 1 warning (0.01 sec)
```

**json格式**

```java
mysql> EXPLAIN FORMAT=JSON select e.ename,d.dname from emp e,dept d where e.deptno = d.deptno\G
*************************** 1. row ***************************
EXPLAIN: {
  "query_block": {
    "select_id": 1,
    "cost_info": {
      "query_cost": "4.52"
    },
    "nested_loop": [
      {
        "table": {
          "table_name": "d",
          "access_type": "ALL",
          "possible_keys": [
            "PRIMARY"
          ],
          "rows_examined_per_scan": 4,
          "rows_produced_per_join": 4,
          "filtered": "100.00",
          "cost_info": {
            "read_cost": "0.25",
            "eval_cost": "0.40",
            "prefix_cost": "0.65",
            "data_read_per_join": "384"
          },
          "used_columns": [
            "deptno",
            "dname"
          ]
        }
      },
      {
        "table": {
          "table_name": "e",
          "access_type": "ref",
          "possible_keys": [
            "FK_DEPTNO"
          ],
          "key": "FK_DEPTNO",
          "used_key_parts": [
            "deptno"
          ],
          "key_length": "5",
          "ref": [
            "test.d.deptno"
          ],
          "rows_examined_per_scan": 4,
          "rows_produced_per_join": 18,
          "filtered": "100.00",
          "cost_info": {
            "read_cost": "2.00",
            "eval_cost": "1.87",
            "prefix_cost": "4.52",
            "data_read_per_join": "1K"
          },
          "used_columns": [
            "ename",
            "deptno"
          ]
        }
      }
    ]
  }
}
1 row in set, 1 warning (0.00 sec)
mysql> 
```

**tree格式**

```java
mysql> EXPLAIN FORMAT=TREE select e.ename,d.dname from emp e,dept d where e.deptno = d.deptno\G
*************************** 1. row ***************************
EXPLAIN: -> Nested loop inner join  (cost=4.52 rows=19)
    -> Table scan on d  (cost=0.65 rows=4)
    -> Index lookup on e using FK_DEPTNO (deptno=d.deptno)  (cost=0.62 rows=5)
1 row in set (0.00 sec)
```
