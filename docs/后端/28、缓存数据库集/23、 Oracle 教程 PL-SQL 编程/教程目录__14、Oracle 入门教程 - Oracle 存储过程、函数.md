# 14、Oracle 入门教程 - Oracle 存储过程、函数
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/14.html
- 分类：缓存数据库
- 分组：教程目录
## 一、Oracle 存储过程

> 存储过程是一种命名的PL/SQL程序块，它既可以没有参数，也可以有若干个输入、输出参数，甚至可以有多个既作输入又作输出的参数，但它通常没有返回值。存储过程被保存在数据库中，它不可以被SQL语句直接执行或调用，只能通过EXECUT命令执行或在PL/SQL程序块内部被调用。由于存储过程是已经编译好的代码，所以在被调用或引用时，其执行效率非常高。

### 1.1 创建存储过程

**1.1.1 创建存储过程介绍**

创建一个存储过程与编写一个普通的PL/SQL程序块有很多相似的地方，比如，两者都包括声明部分、执行部分和异常处理三部分。但这二者之间的实现细节还是有很多差别的，比如创建存储过程需要使用PROCEDURE关键字，在关键字后面就是过程名和参数列表；创建存储过程不需要使用DECLARE关键字，而是使用CREATE或REPLACE关键字

**1.1.2 存储过程语法格式**

```java
create [or replace] procedure pro_name [(parameter1[,parameter2]…)] is|as
begin
    plsql_sentences;
[exception]
    [dowith _ sentences;]
end [pro_name];
```

- pro_name：存储过程的名称，如果数据库中已经存在了此名称，则可以指定“or replace”关键字，这样新的存储过程将覆盖掉原来的存储过程。
- parameter1：存储过程的参数。

若是输入参数，则需要在其后指定in关键字；

若是输出参数，则需要在其后面指定out关键字。

在in或out关键字的后面是参数的数据类型，但不能指定该类型的长度。

- plsql_sentences：PL/SQL语句，它是存储过程功能实现的主体。
- dowith _ sentences：异常处理语句，也是PL/SQL语句，这是一个可选项。

上面语法中的parameter1是存储过程被调用/执行时用到的参数，而不是存储过程内定义的内部变量，内部变量要在`is|as`关键字后面定义，并使用分号`;`结束。

**1.1.3 创建存储过程示例**

示例

```java
create procedure pro_insertDept is
begin
	insert into dept values(77,'市场拓展部','JILIN');     --插入数据记录
	commit;                                               --提交数据
	dbms_output.put_line('插入新记录成功！');             --提示插入记录成功
end pro_insertDept;
/
```

执行结果

在存储过程中，is关键字也可以用as关键字来代替。

如果在当前模式下，数据库中已经存在pro_insertDept这个存储过程，而要运行上述代码，有两种方法：

第一种就是修改现有的存储过程名称，重新创建，这个不必过多解释；

第二种就是使用`or replace`关键字覆盖掉原有的存储过程。

`orreplace`示例

```java
create or replace procedure pro_insertDept is
begin
	insert into dept values(99,'市场拓展部','BEIJING');   --插入数据记录
	commit;                                               --提交数据
	dbms_output.put_line('插入新记录成功！');             --提示插入记录成功
end pro_insertDept;
/
```

执行结果

从运行结果中可以看出，无论在数据库中是否存在名称为pro_insertDept的存储过程，上面的代码都可以成功地创建一个存储过程。如果在创建存储过程中发生了错误，则用户还可以使用“show error”命令来查看错误信息。

**1.1.4 调用存储过程**

上面两个存储过程中的主体代码都可以实现向数据表dept中插入一行记录，但主体代码insert语句仅仅是被编译了，并没有被执行。若要执行这个INSERT语句，则需要在SQL*Plus环境中使用EXECUTE命令来执行该存储过程，或者在PL/SQL程序块中调用该存储过程。 使用EXECUTE命令的执行方式比较简单，只需要在该命令后面输入存储过程名即可。

使用EXECUTE命令调用存储过程

```java
execute pro_insertDept;
```

在一个PL/SQL程序块中调用某个存储过程

```java
set serverout on
begin
	pro_insertDept;
end;
/
```

### 1.2 存储过程参数

**1.2.1 存储过程参数**

Oracle为了增强存储过程的灵活性，提供向存储过程传入参数的功能。参数是一种向程序单元输入和输出数据的机制，存储过程可以接受多个参数，参数模式包括IN、OUT和IN OUT三种。

**1.2.2 IN模式参数**

这是一种输入类型的参数，参数值由调用方传入，并且只能被存储过程读取。这种参数模式是最常用的，也是默认的参数模式，关键字IN位于参数名称之后。

示例

```java
create or replace procedure insert_dept(
	num_deptno in number,                    --定义 in 模式的变量，它存储部门编号
	var_ename in varchar2,                   --定义 in 模式的变量，它存储部门名称
	var_loc in varchar2) is
begin
	insert into dept
	values(num_deptno,var_ename,var_loc);    --向 dept 表中插入记录
	commit;                                  --提交数据库
end insert_dept;
/
```

执行结果

需要注意的是：参数的类型不能指定长度。在调用或执行这种in模式的存储过程时，用户需要向存储过程中传递若干参数值，以保证执行部分（即begin部分）有具体的数值参与数据操作。

向存储过程传入参数可以有如下3种方式。

（1）指定名称传递

指定名称传递是指在向存储过程传递参数时需要指定参数名称，即参数名称在左侧，中间是赋值符号“=>”，右侧是参数值，其语法格式如下：

```java
pro_name(parameter1=>value1[,parameter2=>value2]…)
```

- parameter1：参数名称。在传递参数值时，这个参数名称与存储过程中定义的参数顺序无关。
- value1：参数值。在它的左侧不是常规的赋值符号“=”，而是一种新的赋值符号“=>”，需要注意参数值的类型要与参数的定义类型兼容。

指定名称传递示例

```java
begin
insert_dept(var_ename=>'采购部',var_loc=>'成都',num_deptno=>15);
end;
/
```

执行结果

（2）按位置传递

指定名称传递参数虽然直观易读，但也有缺点，就是参数过多时，会显得代码冗长，反而变得不容易阅读。这样用户就可以采取按位置传递参数，采用这种方式时，用户提供的参数值顺序必须与存储过程中定义的参数顺序相同。

按位置传递示例

```java
begin
	insert_dept(28,'工程部','洛阳');
end;
/
```

执行结果

（3）混合方式传递

混合方式就是将前两种方式结合到一起，这样就可以兼顾二者的优点。

混合方式传递示例

```java
exec insert_dept(38,var_loc=>'济南',var_ename=>'测试部');
```

执行结果

**1.2.3 OUT模式参数**

这是一种输出类型的参数，表示这个参数在存储过程中已经被赋值，并且这个参数值可以传递到当前存储过程以外的环境中，关键字OUT位于参数名称之后。

```java
create or replace procedure select_dept(
	num_deptno in number,                              --定义 in 模式变量，要求输入部门编号
	var_dname out dept.dname%type,                     --定义 out 模式变量，可以存储部门名称并输出
	var_loc out dept.loc%type) is
begin
	select dname,loc
	into var_dname,var_loc
	from dept
	where deptno= num_deptno;                          --检索某个部门编号的部门信息
exception
	when no_data_found then                            --若 select 语句无返回记录
		dbms_output.put_line('该部门编号的不存在');    --输出信息
end select_dept;
/
```

执行结果

在上面的存储过程（即select_dept）中，定义了两个OUT参数，由于存储过程要通过out参数返回值，所以当调用或执行这个存储过程时，都需要定义变量来保存这两个OUT参数值。

（1）在PL/SQL块中调用OUT模式的存储过程。

这种方式需要在PL/SQL块的DECLARE部分定义与存储过程中OUT参数兼容的若干变量。

示例

```java
set serverout on
declare
	var_dname dept.dname%type;                           --声明变量，对应过程中的 out 模式的 var_dname
	var_loc dept.loc%type;                               --声明变量，对应过程中的 out 模式的 var_loc
begin
	select_dept(99,var_dname,var_loc);                   --传入部门编号，然后输出部门名称和位置信息
	dbms_output.put_line(var_dname||'位于：'||var_loc);  --输出部门信息
end;
/
```

执行结果

在上面的代码中，把声明的两个变量传入到存储过程中，当存储过程执行时，其中的out参数会被赋值，当存储过程执行完毕，OUT参数的值会在调用处返回，这样定义的两个变量就可以得到out参数被赋予的值，最后这两个值就可以在存储过程外任意使用了。

（2）使用EXEC命令

使用EXEC命令执行OUT模式的存储过程，需要在SQL*Plus环境中使用variable关键字声明两个变量，用以存储OUT参数的返回值。

```java
variable var_dname varchar2(50);
variable var_loc varchar2(50);
exec select_dept(15,:var_dname,:var_loc);
```

执行结果

但是通过上面代码的执行结果，用户看不到变量var_dname和var_loc的值，这时用户可以通过PRINT命令或SELECT语句来输出变量的值。

（3）使用PRINT命令打印输出绑定的变量值。

```java
print var_dname var_loc;
```

执行结果

（4）使用SELECT语句检索绑定的变量值。

```java
select :var_dname,:var_loc
from dual;
```

执行结果

如果在存储过程中声明了out模式的参数，则在执行存储过程时，必须为out参数提供变量，以便接收out参数的返回值，否则，程序执行后将出现错误。

**1.2.4 IN OUT模式参数**

在执行存储过程时，IN参数不能够被修改，它只能根据被传入的指定值（或是默认值）为存储过程提供数据，而OUT类型的参数只能等待被赋值，而不能像IN参数那样为存储过程本身提供数据。

但INOUT参数可以兼顾其他两种参数的特点，在调用存储过程时，可以从外界向该类型的参数传入值；在执行完存储过程之后，可以将该参数的返回值传给外界。

示例

```java
create or replace procedure pro_square(
	num in out number,              --计算它的平方或平方根，这是一个“in out”参数
	flag in boolean) is             --计算平方或平方根的标识，这是一个“in”参数
	i int := 2;                     --表示计算平方，这是一个内部变量
begin
	if flag then                    --若为 true
		num := power(num,i);        --计算平方
	else
		num := sqrt(num);           --计算平方根
	end if;
end;
/
```

执行结果

在上面的存储过程中，定义一个IN OUT参数，该参数在存储过程被调用时会传入一个数值，然后与另外一个IN参数相结合来判断所进行的运算方式（平方或平方根），最后将计算后的平方或平方根再保存到这个IN OUT参数中。

调用存储过程pro_square

```java
set serverout on
declare
	var_number number;                --存储要进行运算的值和运算后的结果
	var_temp number;                  --存储要进行运算的值
	boo_flag boolean;                 --平方或平方根的逻辑标记
begin
	var_temp := 3;                     --变量赋值
	var_number := var_temp;
	boo_flag := false;                --false 表示计算平方根；true 表示计算平方
	pro_square(var_number,boo_flag);      --调用存储过程
	if boo_flag then
		dbms_output.put_line(var_temp ||'的平方是：'||var_number);--输出计算结果
	else
		dbms_output.put_line(var_temp ||'平方根是：'||var_number);
	end if;
end;
/
```

执行结果

从上面的例子中可以看出，变量var_number在调用存储过程之前是3，而存储过程执行完毕之后，该变量的值变为其平方根，这因为该变量作为存储过程的IN OUT参数被传入和返回。

### 1.3 IN 参数的默认值

**1.3.1 介绍**

前面讲到的IN参数的值都是在调用存储过程时传入的，实际上，Oracle支持在声明IN参数的同时给其初始化默认值，这样在存储过程调用时，如果没有向IN参数传入值，则存储过程可以使用默认值进行操作。

**1.3.2 示例**

```java
create or replace procedure insert_dept(
	num_deptno in number,                                --定义存储部门编号的 IN 参数
	var_dname in varchar2 default '综合部',               --定义存储部门名称的 IN 参数，并初始化默认值
	var_loc in varchar2 default '北京') is
begin
	insert into dept values(num_deptno,var_dname,var_loc);--插入一条记录
end;
/
```

执行结果

在上面的存储过程中，IN参数var_dname和var_loc都有默认值，所以在调用insert_dept存储过程时，可以不向这两个参数传入值，而是使用其默认值（当然也可以传入值）。

当给一些带有默认值的参数传入值，而对另一些带默认值的参数不传值，并且传值的顺序不固定时，建议使用“指定名称传递”的方式传值，这样程序就不会出现混乱，示例如下：

在上面的代码中，存储过程insert_dept有3个IN参数，这里只传入两个参数（num_deptno和var_loc）的值，而var_dname参数的值使用默认值“综合部”。

### 1.4 删除存储过程

当一个过程不再被需要时，要将此过程从内存中删除，以释放相应的内存空间，可以使用下面的语句来完成

```java
DROP PROCEDURE count_num;
```

示例

```java
DROP PROCEDURE insert_dept;
```

当一个存储过程已经过时，想重新定义时，不必先删除再创建，而只需在CREATE语句后面加上OR REPLACE关键字即可。如下所示：

```java
CREATE OR REPLACE PROCEDURE insert_dept
```

## 二、Oracle 函数

> 函数一般用于计算和返回一个值，可以将经常需要使用的计算或功能写成一个函数。函数的调用是表达式的一部分，而过程的调用是一条PL/SQL语句。 函数与过程在创建的形式上有些相似，也是编译后放在内存中供用户使用，只不过调用函数时要用表达式，而不像过程只需要调用过程名。另外，函数必须要有一个返回值，而过程则没有。

### 2.1 创建函数

**2.1.1 创建函数语法格式**

函数的创建语法与存储过程比较类似，它也是一种存储在数据库中的命名程序块，函数可以接受零或多个输入参数，并且函数必须有返回值（这一点存储过程是没有的），其定义语法格式如下：

```java
create [or replace] function fun_name[(parameter1[,parameter2]…) return data_type is
    [inner_variable]
begin
    plsql_ sentence;
    [exception]
    [dowith _ sentences;]
end [fun_name];
```

- fun_name：函数名称，如果数据库中已经存在了此名称，则可以指定“or replace”关键字，这样新的函数将覆盖掉原来的函数。
- parameter1：函数的参数，这是个可选项，因为函数可以没有参数。
- data_type：函数的返回值类型，这是个必选项。在返回值类型的前面要使用RETURN关键字来标明。
- inner_variable：函数的内部变量，它有别于函数的参数，这是个可选项。
- plsql_ sentence：PL/SQL语句，它是函数主要功能的实现部分，也就是函数的主体。
- dowith _ sentences：异常处理代码，也是PL/SQL语句，这是一个可选项。 由于函数有返回值，所以在函数主体部分（即begin部分）必须使用return语句返回函数值，并且要求返回值的类型要与函数声明时的返回值类型（即data_type）相同。

**2.1.2 创建函数示例**

```java
--创建一个函数，该函数实现计算某个部门的平均工资，传入部门编号参数
create or replace function get_avg_pay(num_deptno number) return number is   
    --保存平均工资的内部变量
	num_avg_pay number;                                                  
begin
	--某个部门的平均工资
	select avg(sal) into num_avg_pay from emp where deptno=num_deptno;   
	--返回平均工资
	return(round(num_avg_pay,2));                                        
exception
	--异常处理
	when no_data_found then                                              
		dbms_output.put_line('该部门编号不存在');
    return(0);
end;
/
```

执行结果

### 2.2 调用函数

**2.2.1 介绍**

由于函数有返回值，所以在调用函数时，必须使用一个变量来保存函数的返回值，这样函数和这个变量就组成了一个赋值表达式。

**2.2.2 调用函数示例**

```java
set serveroutput on
declare
	--定义变量，存储函数返回值
	avg_pay number; 
begin
	--调用函数，并获取返回值
	avg_pay:=get_avg_pay(10);
	--输出返回值，即员工平均工资  
	dbms_output.put_line('平均工资是：'||avg_pay);  
end;
/
```

执行结果

### 2.3 调用函数

**2.3.1 删除函数语法**

删除函数的操作比较简单，使用DROP FUNCTION命令，其后面跟着要删除的函数名称，其语法格式如下：

```java
drop function fun_name;
```

参数fucn_name表示要删除的函数名称。

**2.3.2 删除函数示例**

```java
drop function get_avg_pay;
```

执行结果

当一个函数已经过时，想重新定义时，也不必先删除再创建，同样只需要在CREATE语句后面加上OR REPLACE关键字即可，如下所示：

```java
create or replace function fun_name;
```
