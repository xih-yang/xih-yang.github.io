# 01、Oracle 教程 PL/SQL 基础 - 变量声明
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/1.html
- 分类：缓存数据库
- 分组：教程目录
## 变量声明的基本语法

```java
name [CONSTANT] datatype [NOT NULL] [:= | DEFAULT default_assignment]
```

**name**为要声明的变量或常量的名字；

**CONSTANT**声明的是一个常量，如果没有，则声明的是一个变量；

**datayepe**是可以赋值给这个变量的数据类型或者子类型；

**not null**如果没有为这个变量赋值，数据库就会抛出一个异常；

**default_assignment**告诉数据库用这个值来初始化这个变量，该项可以是表达式；

## 锚定声明

告诉PL/SQL按照已经定义好的数据结构来设置变量的数据类型。这些定义好的数据类型可能是：另一个PL/SQL变量、一个预定义的TYPE或者SUBTYP、一个数据库表或者表中的一列。有两种锚定：

**标量锚定**：利用**%TYPE**属性，可以根据某个表中的一列或者其他的PL/SQL标量变量来定义变量类型；

```java
name type_attribute%TYPE [option default value assignment]
```

**name**为变量名称；

**type_attribute**可以是之前声明的一个变量的名字或者以table.column格式指定的某个表中的一列；例如：emp_id emp.id%TYPE;意思是emp_id变量和emp表中的id字段的类型是一样的。

**注意：** 如果锚定一个已经存在的变量，那么如果该变量有not null限定，那么限定也会传递过来。不过，如果是一个not null的数据库列，该约束就不会自动传递了。

**记录锚定**：利用 **%ROWTYPE** 属性，可以根据某个表的结构或者某个预定义的显示PL/SQL游标结构对变量的记录结构进行定义。

```java
name table_name | cursor_name%ROWTYPE [option default value assignment]
```

例如：l_book book%ROWTYPE;就相当于是定义了l_book，他可以保存book表中的一条记录：select * into l_book from book where id = 'aaaa112';其实，游标for循环中就包含了这种记录锚定。

## 自定义子类型

**SUBTYPE**语句允许程序员自定义自己的子类型或者为系统预定义的数据类型起个别名。某个数据类型的子类型实际是和原始护具类型共享同一套规则，但取值只是该类型的子集的一个变体。有两种子类型：

有约束子类型：这种子类型对原数据的取值做了限制或者约束。例如：SUBTYPE positivs IS BINARY_INTEGER RANGE 1 .. 100;一个positivs类型的变量的值只能1到100之间；

没有约束的子类型：没有限制原始数据的取值范围。这种方式类似于取了一个别名：SUBTYPE big_string IS VARCHAR2(200);
