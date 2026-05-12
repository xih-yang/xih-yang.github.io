# 11、Oracle 教程 PL/SQL 基础 - 原生动态SQL（NDS语句）
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/11.html
- 分类：缓存数据库
- 分组：教程目录
原生动态SQL（NDS语句）：通过一个新的语句无缝地集成到PL/SQL语言中，这个语句就是**EXECUTE IMMEDIATE**，这个语句会立即执行一个SQL语句，然后增强已有的OPEN FOR语句功能，这样就可以执行多行的动态查询了。

**EXECUTE IMMEDIATE**用来执行指定的SQL语句：

```java
EXECUTE IMMEDIATE sql_string
[INTO {define_variable[, define_variable]... | record}]
[USING [IN | OUT | IN OUT] bind_argument [, [IN | OUT | IN OUT] bind_argument] ... ]；
```

- **sql_string**：包含了SQL语句或者PL/SQL代码块的字符串表达式；如果后面带了分号，这个语句就会按照一个PL/SQL块来处理，否则按照DML或DDL语句来处理；这个字符串可以带有绑定参数的占位符，但是对象名字，比如表的名字或者列的名字，不能通过绑定变量传进去；（NDS是根据位置而不是名字把USING子句中的绑定参数关联到占位符的）（占位符详见例子）
- **define_variable**：用于接收查询中的某一列值的变量；
- **record**：用户自定义类型或者基于%ROWTYPE的记录，可以接收查询返回的一整行值；
- **bind_argument**：这是一个表达式，表达式的值将传给SQL语句或者PL/SQL块，也可以是一个标识符，这个标识符可以用作PL/SQL块中调用的函数或者过程的输入/或输出变量。
- **INTO子句**：用户单行查询，对于查询结果的每一列的值，必须提供一个单独的变量或者是一个兼容的记录类型中的一个字段；（相当于是在查询的时候，把查询出来的值进行赋值操作，赋值给INTO中的变量）
- **USING子句**：给SQL字符串提供绑定参数，同时可以用于动态SQL和动态PL/SQL。缺省模式为IN。注：IN是SQL语言唯一可以用的参数模式。

当一个语句执行时，运行引擎会把SQL语句中的每一个占位符（一个带有冒号前缀的标识符）用USING子句中对应的绑定参数替换。

例子：

```java
FUNCTION updNval(col IN varchar2, val IN number, start_in IN date, end_in IN date)
return PLS_INTEGER
IS
BEGIN
    EXECUTE IMMEDIATE 'update test set' || col || ' = :the_value where hire_date between :lo and :hi'
    USING val, start_in, end_in;
    RETURN SQL%ROWCOUNT;
END;
```

**OPEN FOR**

```java
OPEN {cursor_variable | :host_cursor_variable} FOR sql_string
[USING bind_argument [, bind_argument] ... ]；
```

- **cursor_variable**：弱类型的游标变量；
- **:host_cursor_variable**：一个PL/SQL宿主环境中声明的游标变量；
- **sql_string**：包含了要动态执行的select语句；
- **USING子句**：和EXECUTE IMMEDIATE中遵循相同的规则；

例如：声明一个弱类型的REF CURSOR，以及基于这个类型的游标变量，以及使用OPEN FOR语句打开一个动态查询：

```java
PROCEDURE show_parts_inventory(parts_table IN VARCHARS , where_in IN VARCHAR2)
IS
TYPE query_curtype IS REF CURSOR;
dyncur query_curtype;
BEGIN
    OPEN dyncur FOR 'select * from ' || parts_table || 'where ' || where_in;
    ...
```

一旦OPEN FOR语句打开了这个查询，接下来获取数据、关闭游标变量、检查游标属性的语法规则和静态游标变量已经硬编码的显示游标都是一样的。

执行PL/SQL时，一般会做以下事情：

**1、** 用一个游标变量关联查询字符串中的查询语句；

**2、** 对绑定的参数求值，然后用这些值替换查询字符串中的占位符；

**3、** 执行查询；

**4、** 识别出结果集；

**5、** 把游标位置置于结果集的第一行；

**6、** 把已处理行计数器归0，这个计数器也就是%ROWCOUNT返回的值；

注意：查询语句中的任何绑定参数都是在游标变量被打开时刻求值的。这也就意味着，如果要把不同的绑定参数值用于同一个动态查询，就必须用这些参数再执行一个新的OPEN FOR语句。

**重复占位符规则**：

- 当执行一个动态SQL字符串（该字符串没有用分号结尾），就必须为每一个占位符都提供一个参数，即便这些占位符是重复的；
- 当执行一个动态PL/SQL块（字符串使用分号结尾），必须为每一个唯一占位符提供一个参数；

**NULL值的传递**：

如果动态sql字符串中有‘... where name is :name’ using null;则会报错，解决的方法是：

- 使用一个未初始化的变量来代替null；
- 通过转换函数把null值显示的转换成一个有类型的值：USING TO_NUMBER(null)
