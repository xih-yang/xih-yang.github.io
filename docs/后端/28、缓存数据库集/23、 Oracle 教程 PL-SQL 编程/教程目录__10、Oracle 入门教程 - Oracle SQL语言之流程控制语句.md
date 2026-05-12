# 10、Oracle 入门教程 - Oracle SQL语言之流程控制语句
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/10.html
- 分类：缓存数据库
- 分组：教程目录
## 一、流程控制语句

### 1.1 流程控制语句介绍

结构控制语句是所有过程性程序设计语言的关键，因为只有能够进行结构控制才能灵活地实现各种操作和功能，PL/SQL也不例外。

主要控制语句如图所示。

若要在PL/SQL中实现控制程序的执行流程和实现复杂的业务逻辑计算，就必须使用流程控制语句，因为只有能够进行结构控制才能灵活地实现各种复杂操作和功能，PL/SQL中的流程控制语句主要包括选择语句、循环语句两大类。

### 1.2 选择语句

选择语句也称之为条件语句，它的主要作用是根据条件的变化选择执行不同的代码，主要分为以下4种语句。

**1.2.1 IF…THEN语句**

IF…THEN语句是选择语句中最简单的一种形式，它只做一种情况或条件的判断，其语法格式如下：

```java
if <condition_expression> then
	plsql_sentence
end if;
```

- condition_expression：表示一个条件表达式

当其值为true时，程序会执行IF下面的PL/SQL语句（即plsql_sentence语句）

当其值为false，则程序会跳过IF下面的语句而直接执行end if后面的语句。
- plsql_sentence：当condition_expression表达式的值为true时，要执行的PL/SQL语句。

如果要判断IF后面的条件表达式的值是否为空值，则需要在条件表达式中使用“is”和“null”关键字，比如下面的代码：

```java
 if last_name is null then
    …;
end if;
```

**1.2.2 IF…THEN…ELSE语句**

在编写程序的过程中，IF…THEN…ELSE语句是最常用到的一种选择语句，它可以实现判断两种情况，只要if后面的条件表达式为false，程序就会执行else语句下面的PL/SQL语句。其语法格式如下：

```java
 if < condition_expression> then
    plsql_sentence1;
else
    plsql_sentence2;
end if;
```

- condition_expression：表示一个条件表达式

若该条件表达式的值为true，则程序执行if下面的PL/SQL语句，即plsql_sentence1语句；

否则，程序将执行else下面的PL/SQL语句，即plsql_sentence2语句。
- plsql_sentence1：IF语句的表达式值为true时，要执行的PL/SQL语句。
- plsql_sentence2：IF语句的表达式值为false时，要执行的PL/SQL语句。

**1.2.3 IF…THEN…ELSIF语句**

IF…THEN…ELSIF语句实现了多分支判断选择，它使程序的判断选择条件更加丰富，更加多样化。该语句中的哪个判断分支的表达式为true，那么程序就会执行其下面对应的PL/SQL语句，其语法格式如下：

```java
if < condition_expression1 > then
   plsql_sentence_1;
elsif < condition_expression2 > then
    plsql_sentence_2;
…
else
    plsql_sentence_n;
end if;
```

- condition_expression1：第一个条件表达式，若其值为false，则程序继续判断condition_expression2表达式。
- condition_expression2：第二个条件表达式

若其值false，则程序继续判断下面的elsif语句后面的表达式；

若再没有“elsif”语句，则程序将执行else语句下面的PL/SQL语句。
- plsql_sentence_1：第一个条件表达式的值为true时，要执行的PL/SQL语句。
- plsql_sentence_2：第二个条件表达式的值为true时，要执行的PL/SQL语句。
- plsql_sentence_n：当其上面所有的条件表达式的值都为false时，要执行的PL/SQL语句。

1.2.4 case语句

从Oracle 9i以后，PL/SQL也可以像其他编程语言一样使用CASE语句，CASE语句的执行方式与IF…THEN…ELSIF语句十分相似。

在CASE关键字的后面有一个选择器，它通常是一个变量，程序就从这个选择器开始执行，接下来是WHEN子句，并且在WHEN关键字的后面是一个表达式，程序将根据选择器的值去匹配每个WHEN子句中的表达式的值，从而实现执行不同的PL/SQL语句的功能.

CASE语法格式如下：

```java
case < selector>
    when <expression_1> then plsql_sentence_1;
    when <expression_2> then plsql_sentence_2;
…
    when <expression_n> then plsql_sentence_n;
    [else plsql_sentence;]
end case;
```

- selector：一个变量，用来存储要检测的值，通常称之为选择器。该选择器的值需要与WHEN子句中的表达式的值进行匹配。
- expression_1：第一个WHEN子句中的表达式，这种表达式通常是一个常量，当选择器的值等于该表达式的值时，程序将执行plsql_sentence_1语句。
- expression_2：第二个WHEN子句中的表达式，它通常也是一个常量，当选择器的值等于该表达式的值时，程序将执行plsql_sentence_2语句。
- expression_n：第n个WHEN子句中的表达式，它通常也是一个常量，当选择器的值等于该表达式的值时，程序将执行plsql_sentence_n语句。
- plsql_sentence：一个PL/SQL语句，当没有与选择器匹配的WHEN常量时，程序将执行该 PL/SQL语句，其所在的ELSE语句是一个可选项。

### 1.3 循环语句

当程序需要反复执行某一操作时，就必须使用循环结构。PL/SQL中的循环语句主要包括LOOP语句、WHILE语句和FOR语句3种，

**1、** 3.1LOOP语句；

LOOP语句会先执行一次循环体，然后再判断“EXIT WHEN”关键字后面的条件表达式的值是true还是false，如果是true，则程序会退出循环体，否则程序将再次执行循环体，这样就使得程序至少能够执行一次循环体。

LOOP语法格式如下：

```java
loop
    plsql_sentence;
    exit when end_condition_ exp
end loop;
```

- plsql_sentence：循环体中的PL/SQL语句，可能是一条语句，也可能是多条，这是循环体的核心部分，这些PL/SQL语句至少会被执行一遍。
- end_condition_ exp：循环结束条件表达式，当该表达式的值为true时，程序会退出循环体，否则程序将再次执行循环体。

**1、** 3.2WHILE语句；

WHILE语句根据它的条件表达式的值执行零次或多次循环体，在每次执行循环体之前，首先要判断条件表达式的值是否为true，若为true，则程序执行循环体；否则退出WHILE循环，然后继续执行WHILE语句后面的其他代码。

WHILE语法格式如下。

```java
while condition_expression loop
    plsql_sentence;
end loop;
```

- condition_expression：表示一个条件表达式，当其值为true时，程序执行循环体，否则程序退出循环体，程序每次在执行循环体之前，都要首先判断该表达式的值是否为true。
- plsql_sentence：循环体内的PL/SQL语句。

1.3.3 FOR语句

FOR语句是一个可预置循环次数的循环控制语句，它有一个循环计数器，通常是一个整型变量，通过这个循环计数器来控制循环执行的次数。该计数器可以从小到大进行记录，也可以相反，从大到小进行记录。

另外，该计数器值的合法性由上限值和下限值控制，若计数器值在上限值和下限值的范围内，则程序执行循环；否则，终止循环。

FOR语法格式如下。

```java
for variable_ counter_name in [reverse] lower_limit..upper_limit loop
    plsql_sentence;
end loop;
```

- variable_ counter_name：表示一个变量，通常为整数类型，用来作为计数器。默认情况下计数器的值会循环递增，当在循环中使用REVERSE关键字时，计数器的值会随循环递减。
- lower_limit：计数器的下限值，当计数器的值小于下限值时，程序终止FOR循环。
- upper_limit：计数器的上限值，当计数器的值大于上限值时，程序终止FOR循环。
- plsql_sentence：表示PL/SQL语句，作为for语句的循环体。

**1、** 4GOTO语句；

GOTO语句的语法是：

```java
GOTO label;
```

这是个无条件转向语句。当执行GOTO语句时，控制程序会立即转到由标签标识的语句。其中，label是在PL/SQL中定义的符号。标签使用双箭头括号（>）括起来的。

```java
…  --程序其他部分
--定义了一个转向标签 goto_target
<<goto_target>> 		                      
…  --程序其他部分
IF no > 100 THEN
	--如果条件成立则转向 goto_target 继续执行
	GOTO goto_mark;                
…  --程序其他部分
```

在使用GOTO语句时需要十分谨慎。不必要的GOTO语句会使程序代码复杂化，容易出错，而且难以理解和维护。事实上，几乎所有使用GOTO的语句都可以使用其他的PL/SQL控制结构（如循环或条件结构）来重新进行编写。
