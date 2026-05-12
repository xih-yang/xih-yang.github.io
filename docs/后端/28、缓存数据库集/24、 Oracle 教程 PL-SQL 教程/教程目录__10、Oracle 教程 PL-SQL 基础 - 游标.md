# 10、Oracle 教程 PL/SQL 基础 - 游标
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/10.html
- 分类：缓存数据库
- 分组：教程目录
游标可以简单的理解为一个或多个表查询得到的记录，或者说把游标理解为指针，指向一个或多个表查询得到的记录。所以，游标必须要和一个SQL语句关联起来。

oracle中游标分为**静态游标**和**REF游标**两类。其中静态游标包含：显示游标和隐式游标。

用REF CURSOR声明的变量为游标变量；CURSOR表达式可以把一个SELECT语句转化成REF CURSOR结果集。

**游标属性**：要使用一个游标属性，只需要在游标名字或者游标变量后面加上%将就可以了：curosor_name%attribute_name

名字

说明

%FOUND

如果成功取到记录就返回true，否则false

%NOTFOUND

如果没有成功取到记录就返回true，否则fase

%ROWCOUNT

返回到目前为止，已经从游标中取出的记录数量

%ISOPEN

如果游标是打开的，就返回true，否则false

%BULK_ROWCOUNT

返回FORALL语句修改的记录数量

%BULK_EXCEPTIONS

返回FORALL语句修改记录出现的异常数量

注意：

- 如果还没有执行过隐式游标，所有的隐式游标属性都返回NULL。
- 如果一个游标被打开，再次打开会抛异常：cursor already open。

**隐式游标**：每次执行一个SQL DML语句，PL/SQL都会声明和使用一个隐式游标，隐式游标不受用户控制；对于隐式游标，游标的名字固定就是“**SQL**”；如果使用隐式游标，数据库自动执行打开、提取、关闭操作。

隐式游标通常的结构：

```java
SELECT column_list [ BULK COLLECT ] INTO PL/SQL varibale_list ...剩下的SELECT语句...
```

使用隐式游标可能出现两种情况：

**1、** 查询语句没有找到能够匹配条件的任何一行这种情况下，数据库会抛出NO_DATA_FOUND异常；

**2、** SELECT语句返回的结果集已经超过了一行这种情况下，数据库会抛出TOO_MANY_ROWS异常；

所以在编写隐式游标的查询时，总是要带上NO_DATA_FOUND和TOO_MANY_ROWS的异常处理句柄。

**显示游标**：在代码的声明单元明确定义的SELECT语句，并同时指定了一个名字。INSERT、UPDATE、MERGE和DELERE语句没有显示游标一说。

声明游标：

```java
CURSOR cursor_name [ ( parameter [, parameter ... ] ) ] [RETURN return_specification ]
IS select_statement [ FOR UPDATE [ OF [ column_list ] ] ]；
```

- cursor_name：游标名字；
- parameter：只能是一个IN类型参数，其他的限制和过程、函数很类似。
- return_specification：游标可选的return子句；
- select_statement：任何有效的sql select语句

例如：

```java
CURSOR book (title_name IN book.title%TYPE) RETRUN book%ROWTYPE
IS SELECT * FROM book WHERE title like title_name;
```

**打开游标**

```java
OPEN corsor_name [ ( argument [， argument ... ] ) ]；
```

如果在游标声明中有参数列表，argument就是传递给他的参数；

打开游标会执行这个游标的查询语句，但是不会获得任何数据，获取数据的动作是由FETCH语句完成的。

**注意：在OPEN和FETCH之间，就算执行了增删改，FETCH获得的数据，依然是OPEN时刻的数据。**

**提取数据**

```java
FETCH cursor_name INTO record_or_variable_list；
```

**注意：就算所有的数据都被提取了，继续提取也不报错，并且提取出的值也不会为null。判断这种情况，是通过%FOUND和%NOTFOUND来判断的。**

如果在数据量大的情况下，可以批量提取：

```java
FETCH cursor_name BULK COLLECT INTO record_or_variable_list LIMIT num;
```

意思是将cursor_name游标批量提出数据到record_or_variable_list ，每次提交num条；

**关闭游标**

```java
CLOSE cursor_name;
```

**1、** 如果在程序中声明并打开了一个游标，在程序结束的时候，就一定要关闭这个游标，否则可能会造成内存泄漏（有些游标，会被隐式的关闭，但是这种关闭的开销也是比较大的）；

**2、** 如果打开了一个包级别的游标，那么必须显示的关闭，否则一定会内存泄漏；

**3、** 如果打开的游标过多，就有可能超过数据库设置的值，这个值是OPEN_CURSORS超过之后会报错；

**游标参数**

游标的参数只能是一个IN类型参数，其他的限制和过程、函数很类似。

使用的时候，直接使用就可以了：下面展示了在查询内容和条件中使用参数：

```java
CURSOR joke_cur(category_in VARCHAR2 :='vv1') /*缺省值为vv1*/
IS SELECT name, category_id FROM joke WHERE category=category_in;
```

**SELECT...FOR UPDATE**

对查询出的记录都自动添加一个行级别的锁，然后在执行ROLLBACK或者COMMIT的时候释放锁。也就是说，这些查询出来的记录，只能被你修改，其他人只能查看这些记录。

如果select中连接了多个表，那么可以使用**FOR UPDATE OF 列名**；这里的列名就是连接的多个表中的一个或多个列名。这样只有表中的列在这个列名中，这个表才会被加行级锁。如果依然只用for update，那么是所有的表都加行级锁。

如果执行了COMMIT或者ROLLBACK后，行上的锁就会被释放，也就不能再用FETCH从这些FOR UPDATE游标中提取数据了，也就失去了游标中的位置了。

**WHERE CURRENT OF语句**：这种方式主要是方便修改（删除），不然会重复写游标中的where条件。

这个语句可以很容易的修改（删除）最后提取出来的数据行：

- 修改：UPDATE table_name SET set_clause WHERE CURRENT OF cursor_name;
- 删除：DELETE FROM table_name WHERE CURRENT OF cursor_name;

**注意：**cursor_name是游标名。每次FETCH都会提取数据，这里操作的就是本次FETCH出来的数据。table_name和cursor_name操作的表是一样的。

**游标变量**：（Oracle 9i数据库开始，就有一个预定义类型的REF CURSOR：SYS_REFCURSOR）

游标变量是一个指向或者引用底层游标的变量。和显示游标不一样，后者已经为结果集PL/SQL工作区指定了名字，而游标变量只是指向这个工作区的引用。（当需要把结果集转移到其他环境（比如java）中时，这种方式很有用）

**1、** 可以把一个游标变量在不同时刻关联不同的查询语句，也就是说，一个游标变量可以用于获取不同的记录集；

**2、** 通过游标变量作为参数传给一个过程或者函数，实际上就相当于可以通过传递记录集引用来共享游标的结果集；

**3、** 可以把一个游标的内容（游标的结果集）赋值给另一个游标变量；

创建游标变量的语法：

```java
TYPE cursor_type_name IS REF CURSOR [RETURN return_type]；
```

这里的return_typ是该游标类型返回的数据格式说明，可以是对于一个标准的游标RETURN语句有效的任何数据结构，可以是通过%ROWTYPE属性定义的，或者引用一个之前已经定义好的记录类型；另外，带有RETURN的称为强类型，没有RETURN的称为弱类型；

**声明游标变量**：

```java
cursor_name cursor_type_name;这里cursor_type_name是之前用的TYPE语句定义的游标类型的名字；
```

例如：

```java
//为运动汽车创建一个游标类型
TYPE sports_car_cur_type IS REF CURSOR RETURN car%ROWTYPE；
//为运动汽车创建一个游标变量
sports_car_cur sports_car_cur_type；
```

**打开游标变量**：

```java
OPEN cursor_name FOR select_statement；
```

- select_statement是一个SQL的SELECT语句，如果cursor_name创建的时候有RETURN，那么select语句的结构必须要和RETURN子句中定义的类型结构匹配或者兼容。

获取数据的方式和静态游标是一样的。同理，也要手动关闭游标。

**约束：**

- 游标变量不能在包中声明，因为他们并没有持久状态；
- 不能通过远程调用（RPC）把游标变量从一个服务器传给另一个服务器；
- 如果把一个游标变量以绑定变量或者宿主变量的形式传递给PL/SQL，就不能在服务器端从游标变量中提取数据，除非在同一个服务器调用过程中打开这个游标变量；
- 不能用比较运算符去测试游标变量是否相等、不相等或者为空；
- 不能给一个游标变量赋值NULL；
- 数据库的列不能保存游标变量的值；
- 嵌套表、关联数组或者VARRAY的元素不能保存游标变量值，也不能用REF CURSOR类型定义集合元素；

注意：如果把一个游标变量赋值给另一个游标变量，那么它们将共享同一个游标对象。

游标变量的值是对游标对象的引用，并不代表游标对象的状态，也就是说游标获取数据或者关闭游标，游标变量的值不变。

如果一个游标变量已经指向了一个游标对象，OPEN FOR 不会真的改变这个引用，它只是改变了关联这个查询的语句。

**作为参数传递：**

如果创建的一个独立的过程或者函数，想要引用一个已有的REF CURSOR游标类型的唯一方法，就是把这个游标类型语句放在一个包中。在一个包的规范部分定义所有变量都可以会话的全局变量，因此可以利用句点表示法来使用这个游标类型。

同样有三种模式：IN、OUT、IN OUT；

游标表达式：（用的很少，而且不够清晰简洁，尽量别使用）

用CURSOR操作符表示，返回的是一个嵌套在查询语句中游标。这个嵌套游标结果集中的每一行可以包含一个SQL查询通常所允许的值范围。也可以包含其他子查询创建的游标。

语法：

```java
CURSOR (subquery) --subquery是一个子查询
```

只要父游标或者外层游标要提取数据，数据库就会隐式的打开游标表达式所定义的嵌套游标，嵌套游标在下面这些时刻被关闭：

- 显示关闭游标；
- 外层游标、父游标再次执行，关闭或者取消；
- 从父游标提取数据是抛出了异常，嵌套游标会和父游标一同关闭；

**约束：**

- 不能把游标表达式用于隐式有游标，因为没有机制支持把嵌套游标的数据取到PL/SQL数据结构中；
- 游标表达式只能出现在最外层的SELECT列表中；
- 只能在没有嵌套到任何其他的查询表达式中的select语句中使用游标表达式，除非查询表达式被定义成游标表达式本身的子查询；
- 声明视图时不能使用游标表达式；
- 如果在动态SQL中使用游标表达式，不能对游标表达式指定BIND和EXECUTE操作。
