# 07、Oracle 入门教程 - Oracle SQL语言之多表联查、子查询和数据库增删改操作
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/7.html
- 分类：缓存数据库
- 分组：教程目录
## 一、SQL 查询语言

### 1.1 多表关联查询

**1.1.1 多表关联查询介绍**

在实际的应用系统开发中会设计多个数据表，每个表的信息不是独立存在的，而是若干个表之间的信息存在一定的关系，当用户查询某一个表的信息时，很可能需要查询关联数据表的信息，这就是多表关联查询。

SELECT语句自身是支持多表关联查询的，多表关联查询要比单表查询复杂得多。多表关联查询有内连接、外连接、自然连接和交叉连接等。

**1.1.2 表的别名**

在多表关联查询时，如果多个表之间存在同名的列，则必须使用表名来限定列的引用。但是，随着查询变得越来越复杂，语句就会因为每次限定列必须输入表名而变得冗长。

对于这种情况，SQL语言提供了设定表别名的机制，使用简短的表别名就可以替代原有较长的表名称，这样就可以大大缩减语句的长度。

```java
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a, users as b
 where a.id = b.id
```

另外，还需要注意一点，一旦在FROM子句中为表指定了别名，则必须在剩余的子句中都使用表的别名，而不允许再使用原来的表名称

- 表的别名在FROM子句中定义，别名放在表名之后，它们之间用空格隔开。
- 别名一经定义，在整个查询语句中就只能使用表的别名而不能再使用表名。
- 表的别名只在所定义的查询语句中有效。
- 应该选择有意义的别名，表的别名最长为30个字符，但越短越好。

**1.1.3 内连接**

内连接是一种常用的多表关联查询方式，一般使用关键字INNER JOIN来实现。其中，INNER关键字可以省略，当只使用JOIN关键字时，语句只表示内连接操作。

在使用内连接查询多个表时，必须在FROM子句之后定义一个ON子句，ON子句指定内连接操作列出与连接条件匹配的数据行，使用比较运算符比较被连接列的值。

简单地说，内连接就是使用JOIN指定用于连接的两个表，使用ON指定连接表的连接条件。若进一步限制查询范围，则可以直接在后面添加WHERE子句。

内连接的语法格式如下：

```java
SELECT columns_list
  FROM table_name1 [INNER] JOIN table_name2
    ON join_condition;
```

- columns_list：字段列表。
- table_name1和table_name2：两个要实现内连接的表。
- join_condition：实现内连接的条件表达式。

```java
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a inner join users as b
    on a.id = b.id
```

**1.1.4 外连接**

使用内连接进行多表查询时，返回的查询结果中只包含符合查询条件和连接条件的行。内连接消除了与另一个表中的任何行不匹配的行，而外连接扩展了内连接的结果集，除了返回所有匹配的行外，还会返回一部分或全部不匹配的行，这主要取决于外连接的种类。

外连接通常有以下3种。

- 左外连接：关键字为LEFT OUTER JOIN或LEFT JOIN。
- 右外连接：关键字为RIGHT OUTER JOIN或RIGHT JOIN。
- 完全外连接：关键字为FULL OUTER JOIN或FULL JOIN。

与内连接不同的是，外连接不只列出与连接条件匹配的行，还能够列出左表（左外连接时）、右表（右外连接时）或两个表（全部外连接时）中所有符合搜索条件的数据行。

（1）左外连接

左外连接的查询结果中不仅包含了满足连接条件的数据行，而且还包含左表中不满足连接条件的数据行。

```java
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a left join users as b
    on a.id = b.id
```

（2）右外连接

右外连接的查询结果中不仅包含了满足连接条件的数据行，而且还包含右表中不满足连接条件的数据行。

```java
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a right join users as b
    on a.id = b.id
```

在外连接中也可以使用外连接的连接运算符，外连接的连接运算符为“(+)”，该连接运算符可以放在等号的左边，也可以放在等号的右边，但一定要放在缺少相应信息的那一边。

```java
//左外连接
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a, users as b
 where a.id = b.id(+)
//右外连接
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a, users as b
 where a.id(+) = b.id
```

使用“(+)”操作符时应注意：

- 当使用“(+)”操作符执行外连接时，如果在WHERE子句中包含多个条件，则必须在所有条件中都包含“(+)”操作符。
- “(+)”操作符只适用于列，而不能用在表达式上。
- “(+)”操作符不能与ON和IN操作符一起使用。

（3）完全外连接

在执行完全外连接时，Oracle会执行一个完整的左外连接和右外连接查询，然后将查询结果合并，并消除重复的记录行。

```java
select a.id ida, a.name namea, a.sal, b.id idb, b.name nameb, b.age 
  from emp as a full join users as b
    on a.id = b.id
```

**1.1.5 自然连接**

自然连接和内连接的功能相似，自然连接是指在检索多个表时，Oracle会将第一个表中的列与第二个表中具有相同名称的列进行自动连接。

在自然连接中，用户不需要明确指定进行连接的列，这个任务由Oracle系统自动完成，自然连接使用NATURAL JOIN关键字。

```java
select id, name, sal, age 
  from emp natural join users
```

由于自然连接强制要求表之间必须具有相同的列名称，这样容易在设计表时出现不可预知的错误，所以在实际应用系统开发中很少用到自然连接。

需要注意的是，在使用自然连接时，不能为列指定限定词（即表名或表的别名），否则Oracle系统会弹出“ORA-25155: NATURAL连接中使用的列不能有限定词”的错误提示。

**1.1.6 自连接**

在应用系统开发中，用户可能会拥有“自引用式”的外键，“自引用式”外键是指表中的一个列可以是该表主键的一个外键。

自连接主要用在自参考表上显示上下级关系或者层次关系，自参照表是指在同一张表的不同列之间具有参照关系或主从关系的表。

```java
select id1, id2, name, sal, age 
  from emp a left join emp b
    on a.id1 = b.id2
```

因为自连接是在同一张表之间的连接查询，所以必须定义表别名。

**1.1.7 交叉连接**

交叉连接实际上就是不需要任何连接条件的连接，它使用CROSS JOIN关键字来实现，其语法格式如下：

```java
select colums_list
  From table_name1 cross join table_name2
```

- colums_list：字段列表。
- table_name1和table_name2：两个实现交叉连接的表名。

交叉连接的执行结果是一个笛卡尔积，这种查询结果是非常冗余的，但可以通过WHERE子句来过滤出有用的记录信息

### 1.2 子查询

**1.2.1 子查询介绍**

在执行数据操作（包括查询、添加、修改和删除等）的过程中，如果某个操作需要依赖于另外一个SELECT语句的查询结果，那么就可以把SELECT语句嵌入到该操作语句中，这样就形成了一个子查询。实际上，在关系型数据库中，各表之间的数据关系非常密切，它们相互关联，相互依存，这样就可以根据数据之间的关系使用相应的子查询，从而实现复杂的查询。

子查询是在SQL语句内的另外一条SELECT语句，也被称为内查询或是内SELECT语句。在SELECT、INSERT、UPDATE或DELETE命令中允许是一个表达式的地方都可以包含子查询，子查询甚至可以包含在另外一个子查询中。

```java
select id, uname, age from users where uname in (select ename from emp where ename = 'jack')
//等价于
select id, uname, age from users a, emp b where a.uname = b.ename and b.ename = 'jack';
```

相比多表关联查询，子查询的使用更加灵活、功能更强大，而且更容易理解。但是多表关联查询也有它自身的优点，比如，它的查询效率要高于子查询。

在执行子查询操作的语句中，子查询也称为内查询，包含子查询的查询语句也被称为外查询或主查询。

在一般情况下，外查询语句检索一行，子查询语句需要检索一遍数据，然后判断外查询语句的条件是否满足。如果条件满足，则外查询语句将检索到的数据行添加到结果集中，如果条件不满足，则外查询语句继续检索下一行数据，所以子查询相对多表关联查询要慢一些。

另外，在使用子查询时，还应注意以下规则：

- 子查询必须用括号“()”括起来。
- 子查询中不能包括ORDER BY子句。
- 子查询允许嵌套多层，但不能超过255层。

在Oracle 11g中，通常把子查询再细化为单行子查询、多行子查询和关联子查询3种

**1.2.2 单行子查询**

单行子查询是指返回一行数据的子查询语句。当在WHERE子句中引用单行子查询时，可以使用单行比较运算符（`=、>、=、`）。

```java
select id, uname, age from users where age = (select max(age) from emp)
```

在上面的语句中，如果内层子查询语句的执行结果为空值，那么外层的WHERE子句就始终不会满足条件，这样该查询的结果就必然为空值，因为空值无法参与比较运算。

在执行单行子查询时，要注意子查询的返回结果必须是一行数据，否则Oracle系统会提示无法执行。另外，子查询中也不能包含ORDER BY子句，如果非要对数据进行排序的话，那么只能在外查询语句中使用ORDER BY子句。

**1.2.3 多行子查询**

多行子查询是指返回多行数据的子查询语句。当在WHERE子句中使用多行子查询时，必须使用多行比较符（IN、ANY、ALL）。

（1）使用IN运算符

当在多行子查询中使用IN运算符时，外查询会尝试与子查询结果中的任何一个结果进行匹配，只要有一个匹配成功，则外查询返回当前检索的记录。

（2）使用ANY运算符

ANY运算符必须与单行操作符结合使用，并且返回行只要匹配子查询的任何一个结果即可。

（3）使用ALL运算符

ALL运算符必须与单行运算符结合使用，并且返回行必须匹配所有子查询结果。

```java
select id, uname, age from users where age in (select age from emp);
select id, uname, age from users where age > any(select age from emp);
select id, uname, age from users where age > all(select age from emp);
```

**1.2.4 关联子查询**

在单行子查询和多行子查询中，内查询和外查询是分开执行的，也就是说，内查询的执行与外查询的执行是没有关系的，外查询仅仅是使用内查询的最终结果。

在一些特殊需求的子查询中，内查询的执行需要借助于外查询，而外查询的执行又离不开内查询的执行，这时，内查询和外查询是相互关联的，这种子查询就被称为关联子查询。

```java
select id, uname, age from users a where age > (
	select avg(age) from emp b where a.uname = b.ename)
```

在执行关联子查询的过程中，必须遍历数据表中的每条记录，因此如果被遍历的数据表中有大量数据记录，则关联子查询的执行速度会比较缓慢。

需要补充一点的是，关联子查询不但可以作为SELECT语句的子查询，也可以作为INSERT、UPDATE或DELETE语句的关联子查询。

## 二、数据库操作

### 2.1 数据库操作介绍

使用SQL语句操作数据库，除了查询操作之外，还包括完成插入、更新和删除等数据操作。后3种数据操作使用的SQL语言也称为数据操纵语言（Data Manipulation Language，DML），它们分别对应INSERT、DELETE和UPDATE三条语句。

在Oracle 11G中，DML除了包括上面提到的3种语句之外，还包括TRUNCATE、CALL、LOCKTABLE和MERGE等语句。

### 2.2 插入数据（INSERT语句）

**2.2.1 插入数据介绍**

插入数据就是将数据记录添加到已经存在的数据表中，Oracle数据库通过INSERT语句来实现插入数据记录。该语句既可以实现向数据表中一次插入一条记录，也可以使用SELECT子句将查询结果集批量插入数据表。

使用INSERT语句有以下注意事项：

- 当为数字列增加数据时，可以直接提供数字值，或者用单引号引住。
- 当为字符列或日期列增加数据时，必须用单引号引住。
- 当增加数据时，数据必须要满足约束规则，并且必须为主键列和NOT NULL列提供数据。
- 当增加数据时，数据必须与列的个数和顺序保持一致。

**2.2.2 单条插入数据**

单条插入数据是INSERT语句最基本的用法，其用法格式如下：

```java
INSERT INTO table_name [(column_name1[,column_name2]…)]
    VALUES(express1[,express2]…)
```

- table_name：表示要插入的表名。
- column_name1和column_name2：指定表的完全或部分列名称。如果指定多个列，那么列之间用逗号分开。
- express1和express2：表示要插入的值列表。

当使用INSERT语句插入数据时，既可以指定列列表，也可以不指定列列表。如果不指定列列表，那么在VALUES子句中必须为每个列提供数据，并且数据顺序必须与表列顺序完全一致。如果指定列列表，则只需要为相应列提供数据。

（1）使用列列表增加数据

在INSERT语句的几种使用方式中，最常用的形式是在INSERT INTO子句中指定添加数据的列，并在VALUES子句中为各个列提供一个值。

```java
insert into users(id, name, age) values(1, 'Jack', 18);
```

INSERT INTO子句中指定添加数据的列，既可以是数据表的全部列，也可以是部分列。在指定部分列时，需要注意不许为空（NOT NULL）的列必须被指定出来，并且在VALUES子句中的对应赋值也不许为NULL，否则系统显示“无法将NULL插入”的错误信息提示。

在使用INSERT INTO子句指定为表的部分列添加数据时，为了避免产生不许为空值的错误，可以使用DESC命令查看数据表中的哪些列不许为空。对于可以为空的列，用户可以不指定其值。

（2）不使用列列表增加数据

在向表的所有列添加数据时，也可以省略INSERT INTO子句后面的列表清单，使用这种方法时，必须根据表中定义的列的顺序，为所有的列提供数据。用户可以使用DESC命令来查看表中定义列的顺序。

```java
insert into users values(1, 'JACK', 18, '男');
```

（3）使用特定格式插入日期值

当增加日期数据时，默认情况下日期值必须匹配于日期格式和日期语言；否则在插入数据时会增加错误信息。如果希望使用习惯方式插入日期数据，那么必须使用TO_DATE函数进行转换。

```java
insert into users(id, name, age, birth) values(1, 'JACK', 18, to_date('2019-12-01','yyyy-mm-dd'));
```

（4）使用DEFAULT提供数据

从Oracle Database 9i开始，当增加数据时，可以使用DEFAULT提供数值。当指定DEFAULT时，如果列存在默认值，则会使用其默认值，如果列不存在默认值，则自动使用NULL。

```java
insert into users(id, name, age, birth) values(1, 'JACK', 18, default);
```

（5）使用替代变量插入数据

如果经常需要给某表插入数据，那么为了避免输入错误，可以将INSERT语句放到SQL脚本，并使用替代变量为表插入数据。如果经常需要为emp表插入数据，那么为了避免输入错误，可以使用SQL脚本插入数据。

**2.2.3 批量插入数据**

INSERT语句还有一种强大的用法，就是可以一次向表中添加一组数据，也就是批量插入数据。用户可以使用SELECT语句替换掉原来的VALUES子句，这样由SELECT语句提供添加的数值。

其语法格式如下：

```java
INSERT INTO table_name [(column_name1[,column_name2]…)] selectSubquery
```

- table_name：表示要插入的表名称。
- column_name1和column_name2：表示指定的列名。
- selectSubquery：任何合法的SELECT语句，其所选列的个数和类型要与语句中的column对应。

```java
insert into users1 
	select * from user2
 	where users2.age > 19;
```

需要注意的是，在使用这种组合语句实现批量插入数据时，INSERT INTO子句指定的列名可以与SELECT子句指定的列名不同，但它们之间的数据类型必须是兼容的，即SELECT语句返回的数据必须满足INSERT INTO表中列的约束。

### 2.3 更新数据（UPDATE语句）

**2.3.1 更新数据介绍**

如果表中的数据不正确或不符合需求，那么就需要对其进行修改。Oracle数据库通过UPDATE语句来实现修改现有的数据记录。 在更新数据时，更新的列数可以由用户自己指定，列与列之间用逗号（,）分隔；更新的条数可以通过WHERE子句来加以限制，使用WHERE子句时，系统只更新符合WHERE条件的记录信息。

UPDATE语句的语法格式如下：

```java
UPDATE table_name
   SET {
    (column_name1 = express1),(column_name2 = express2...)} 
 [WHERE condition]
或者
UPDATE table_name
   SET (column_name1, column_name2…) = (selectSubquery)
 [WHERE condition]
```

- table_name：表示要修改的表名。
- column_name1和column_name2：表示指定要更新的列名。
- selectSubquery：任何合法的SELECT语句，其所选列的个数和类型要与语句中的column对应。
- condition：筛选条件表达式，只有符合筛选条件的记录才被更新。

使用UPDATE语句有以下注意事项：

- 当更新数字列时，可以直接提供数字值，或者用单引号引住。
- 当更新字符列或日期列时，必须用单引号引住。
- 当更新数据时，数据必须要满足约束规则。
- 当更新数据时，数据必须与列的数据类型匹配。

**2.3.2 更新单列数据**

当更新单列数据时，set子句后只需要提供一个列。

```java
update users set age = 18 where name = 'jack';
```

**2.3.3 更新多列数据**

当使用update语句修改表行数据时，既可以修改一列，也可以修改多列。当修改多列时，列之间用逗号分开。

```java
update users set age = 18 where age = '20';
```

**2.3.4 更新日期列数据**

当更新日期列数据时，数据格式要与日期格式和日期语言匹配；否则会显示错误信息。如果希望使用习惯方式指定日期值，那么可以使用TO_DATE函数进行转换。

```java
update users set birth = to_date('2019-12-01','yyyy/mm/dd') where age = '20';
```

**2.3.5 使用DEFAULT选项更新数据**

当更新数据时，可以使用DEFAULT选项提供数据。使用此方式时，如果列存在默认值，则会使用默认值更新数据；如果列不存在默认值，则使用NULL。

```java
update users set birth = default where age = '20';
```

**2.3.6 使用子查询更新数据**

另外，同INSERT语句一样，UPDATE语句也可以与SELECT语句组合使用来达到更新数据的目的。

```java
update users set age = (select avg(age) from user2) where age = '20';
```

需要注意的是，在将UPDATE语句与SELECT语句组合使用时，必须保证SELECT语句返回单一的值，否则会出现错误提示，导致更新数据失败。

### 2.4 删除数据（DELETE语句和TRUNCATE语句）

**2.4.1 删除数据介绍**

Oracle系统提供了向数据库添加记录的功能，同时也提供了从数据库删除记录的功能。从数据库中删除记录可以使用DELETE语句和TRUNCATE语句，但这两种语句还是有很大区别的

**2.4.2 DELETE语句**

DELETE语句用来删除数据库中的所有记录和指定范围的记录，若要删除指定范围的记录，同UPDATE语句一样，要通过WHERE子句进行限制.

其语法格式如下：

```java
DELETE FROM table_name [WHERE condition]
```

- table_name：表示要删除记录的表名。
- condition：筛选条件表达式，是个可选项，当该筛选条件存在时，只有符合筛选条件的记录才被删除掉。

删除满足条件的数据：当使用DELETE语句删除数据时，通过指定WHERE子句可以删除满足条件的数据。

删除表的所有数据：当使用DELETE删除表的数据时，如果不指定WHERE子句，那么会删除表的所有数据。

```java
delete from users where age > 18
```

**2.4.3 TRUNCATE语句**

如果用户确定要删除表中的所有记录，那么除了可以使用DELETE语句之外，还可以使用TRUNCATE语句，而且Oracle本身也建议使用TRUNCATE语句。

使用TRUNCATE语句删除表中的所有记录要比DELETE语句快得多。这是因为使用TRUNCATE语句删除数据时，它不会产生回滚记录。当然，执行了TRUNCATE语句的操作也就无法使用ROLLBACK语句撤销。

```java
truncate table users;
```

在TRUNCATE语句中还可以使用REUSE STORAGE关键字或DROP STORAGE关键字，前者表示删除记录后仍然保存记录所占用的空间，后者表示删除记录后立即回收记录占用的空间。默认情况下TRUNCATE语句使用DROP STORAGE关键字。

参考文献：

**1、** Oracle11g从入门到精通第二版，明日科技著，清华大学出版社有限公司；
