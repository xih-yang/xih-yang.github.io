# 12、Oracle 入门教程 - Oracle SQL语言之游标
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/12.html
- 分类：缓存数据库
- 分组：教程目录
## 一、游标

### 1.1 游标介绍

游标提供了一种从表中检索数据并进行操作的灵活手段，游标主要用在服务器上，处理由客户端发送给服务器端的SQL语句，或是批处理、存储过程、触发器中的数据处理请求。

游标的作用就相当于指针，通过游标PL/SQL程序可以一次处理查询结果集中的一行，并可以对该行数据执行特定操作，从而为用户在处理数据的过程中提供了很大方便。

在Oracle中，通过游标操作数据主要使用显式游标和隐式游标。另外，还包括具有引用类型特性的REF游标。

### 1.2 游标基本原理

**1.2.1 游标基本原理介绍**

在PL/SQL块中执行SELECT、INSERT、UPDATE和DELETE语句时，Oracle会在内存中为其分配上下文区（Context Area），即一个缓冲区。游标是指向该区的一个指针，或是命名一个工作区（Work Area），或是一种结构化数据类型。它为应用程序提供了一种对多行数据查询结果集中的每一行数据进行单独处理的方法，是设计嵌入式SQL语句的应用程序的常用编程方法。

游标分为显式游标和隐式游标两种。显式游标是由用户声明和操作的一种游标；隐式游标是Oracle为所有数据操纵语句（包括只返回单行数据的查询语句）自动声明和操作的一种游标。在每个用户会话中，可以同时打开多个游标，其数量由数据库初始化参数文件中的OPEN CURSORS参数定义。

**1.2.2 显式游标**

显示游标是由用户声明和操作的一种游标，通常用于操作查询结果集（即由SELECT语句返回的查询结果），使用它处理数据的步骤包括：声明游标、打开游标、读取游标和关闭游标4个步骤。其中读取游标可能是个反复操作的步骤，因为游标每次只能读取一行数据，所以对于多条记录，需要反复读取，直到游标读取不到数据为止。

游标声明需要在块的声明部分进行，其他的3个步骤都在执行部分或异常处理中进行。

（1）声明游标

声明游标主要包括游标名称和为游标提供结果集的SELECT语句。因此，在声明游标时，必须指定游标名称和游标所使用的SELECT语句。

声明游标的语法格式如下：

```java
cursor cur_name[(input_parameter1[,input_parameter2]…)]
[return ret_type]
is select_ sentence;
```

- cur_name：表示所声明的游标名称。
- ret_type：表示执行游标操作后的返回值类型，这是一个可选项。
- select_ sentence：游标所使用的SELECT语句，它为游标的反复读取提供了结果集。
- input_parameter1：作为游标的“输入参数”，可以有多个，这是一个可选项。它指定用户在打开游标后向游标中传递的值，该参数的定义和初始化格式如下：

```java
para_name [in] datatype [{ := | default} para_value]
```

- para_name表示参数名称，其后面的关键字IN表示输入方向，可以省略；
- datatype表示参数的数据类型，但数据类型不可以指定长度；
- para_value表示该参数的初始值或默认值，它也可以是一个表达式；
- para_name参数的初始值既可以以常规的方式赋值（：=），也可以使用关键字default初始化默认值。

与声明变量一样，定义游标也应该放在PL/SQL块的declare部分。

（2）打开游标

在游标声明完毕之后，必须打开才能使用，打开游标的语法格式如下：

```java
open cur_name[(para_value1[,para_value2]…)];
```

- cur_name：要打开的游标名称。
- para_value1：指定“输入参数”的值，根据声明游标时的实际情况，可以是多个或一个，这是一个可选项。

如果在声明游标时定义了“输入参数”，并初始化其值，而在此处省略“输入参数”的值，则表示游标将使用“输入参数”的初始值；若在此处指定“输入参数”的值，则表示游标将使用这个指定的“参数值”。

打开游标就是执行定义的SELECT语句，执行完毕，查询结果装入内存，游标停在查询结果的首部，注意并不是第一行。

当打开一个游标时，会完成以下几件事。

- 检查联编变量的取值
- 根据联编变量的取值
- 确定活动集。
- 活动集的指针指向第一行

上面这条语句表示打开游标cur_emp，然后给游标的“输入参数”赋值为“MANAGER”。当然这里可以省略“(‘MANAGER’)”，这样表示“输入参数”的值仍然使用其初始值（即SALESMAN）。

（3）读取游标

当打开一个游标之后，就可以读取游标中的数据了，读取游标就是逐行将结果集中的数据保存到变量中。

读取游标使用fetch…into语句，其语法格式如下：

```java
fetch cur_name into {variable};
```

- cur_name：要读取的游标名称。
- variable：一个变量列表或“记录”变量（RECORD类型），Oracle使用“记录”变量来存储游标中的数据，要比使用变量列表方便得多。

在游标中包含一个数据行指针，它用来指向当前数据行。刚刚打开游标时，指针指向结果集中的第一行，当使用FETCH…INTO语句读取数据完毕之后，游标中的指针将自动指向下一行数据。

这样，就可以在循环结构中使用FETCH…INTO语句来读取数据，这样每一次循环都会从结果集中读取一行数据，直到指针指向结果集中最后一条记录之后为止（实际上，最后一条记录之后是不存在的，是空的，这里只是表示遍历完所有的数据行），这时游标的%found属性值为false。

（4）关闭游标

当所有的活动集都被检索以后，游标就应该被关闭。PL/SQL程序将被告知对于游标的处理已经结束，与游标相关联的资源可以被释放了。这些资源包括用来存储活动集的存储空间，以及用来存储活动集的临时空间。

关闭游标的语法格式如下。

```java
close cur_name;
```

参数cur_name表示要关闭的游标名称。一旦关闭了游标，也就关闭了SELECT操作，释放了占用的内存区。

如果再从游标提取数据就是非法的。这样做会产生下面的Oracle错误：

```java
 ORA-1001：Invalid CUSOR       		--非法游标
 或     
 ORA-1002：FETCH out of sequence	--超出界限
```

类似地，关闭一个已经被关闭的游标也是非法的，这也会触发ORA-1001错误。

**1.2.3 隐式游标**

在执行一个SQL语句时，Oracle会自动创建一个隐式游标，这个游标是内存中处理该语句的工作区域。

隐式游标主要是处理数据操纵语句（如UPDATE、DELETE语句）的执行结果，当然特殊情况下，也可以处理SELECT语句的查询结果。由于隐式游标也有属性，当使用隐式游标的属性时，需要在属性前面加上隐式游标的默认名称—SQL。

示例：把emp表中销售员（即SALESMAN）的工资上调20%，然后使用隐式游标sql的%rowcount属性输出上调工资的员工数量。

在上面的代码中，标识符“sql”就是update语句在更新数据过程中所使用的隐式游标，它通常处于隐藏状态，是由Oracle系统自动创建的。当需要使用隐式游标的属性时，标识符“sql”就必须显式地添加到属性名称之前。另外，无论是隐式游标还是显式游标，它们的属性总是反映最近的一条SQL语句的处理结果。因此在一个PL/SQL块中出现多个SQL语句时，游标的属性值只能反映出紧挨着它的上一条SQL语句的处理结果。

**1.2.4 游标的属性**

无论是显式游标还是隐式游标，都具有`%found`、`%notfound`、`%rowcount`和`%isopen`4个属性，通过这4个属性可以获知SQL语句的执行结果以及该游标的状态信息。它们描述与游标操作相关的DML语句的执行情况。游标属性只能用在PL/SQL的流程控制语句内，而不能用在SQL语句内。

- %found：布尔型属性，如果SQL语句至少影响到一行数据，则该属性为true，否则为false。
- %notfound：布尔型属性，与%found属性的功能相反。
- %rowcount：数字型属性，返回受SQL语句影响的行数。
- %isopen：布尔型属性，当游标已经打开时返回true，游标关闭时则为false。

（1）是否找到游标（%FOUND）

该属性表示当前游标是否指向有效一行，若是则值为TRUE，否则值为FALSE。检查此属性可以判断是否结束游标使用。

```java
open cur_emp;                               
fetch cur_emp into var_ename,var_job;    
loop
	--使用了%FOUND 属性
	exit when not cur_em%found;          
end loop;
```

在隐式游标中此属性的引用方法是SQL %FOUND。

```java
delete from emp where empno = emp_id;        
--使用SQL %NOTFOUND
if SQL %FOUND then 
	--如果删除成功则写入 SUCCESS 表中该行员工编号                      
	insert into success values(empno);
else  
	--不成功则写入 FAIL 表中该行员工编号                                   
	insert into fail values(empno);
end if;
```

（2）是否没找到游标（%NOTFOUND）

该属性与%FOUND属性相类似，但其值恰好相反。

```java
open cur_emp;                               
fetch cur_emp into var_ename,var_job;    
loop
	--使用了%NOTFOUND 属性
	exit when cur_em%notfound;           
end loop;
```

在隐式游标中此属性的引用方法是SQL %NOTFOUND。

```java
delete from emp where empno= emp_id;
--使用SQL %NOTFOUND       
if SQL %NOTFOUND then                   
	insert into fail values(empno);
else                                    
	insert into success values(empno);
end if;
```

（3）游标行数（%ROWCOUNT）

该属性记录了游标抽取过的记录行数，也可以理解为当前游标所在的行号。这个属性在循环判断中也很有用，使得不必抽取所有记录行就可以中断游标操作。

```java
loop
	fetch cur_emp into var_empno,var_ename,var_job;
	exit when cur_emp%ROWCOUNT= 10; 
	…
end loop;
```

还可以用FOR语句控制游标的循环，系统隐含地定义了一个数据类型为ROWCOUNT的记录，作为循环计数器，并将隐式地打开和关闭游标。

（4）游标是否打开（%ISOPEN）

该属性表示游标是否处于打开状态。在实际应用中，使用一个游标前第一步往往是检查它的%ISOPEN属性，看其是否已打开，若没有，要打开游标再向下操作。这是防止运行过程中出错的必备一步。

```java
SQL> IF cur_emp%ISOPEN TNEH
2      FETCH cur_emp INTO var_empno,var_ename,var_job;
3    ELSE
4        OPEN cur_emp;
5    END IF;
```

在隐式游标中此属性的引用方法是SQL%ISOPEN。隐式游标中SQL%ISOPEN属性总为TRUE，因此在隐式游标使用中不用打开和关闭游标，也不用检查其打开状态。

（5）参数化游标

在定义游标时，可以带上参数，使得在使用游标时，根据参数不同所选中的数据行也不同，达到动态使用的目的。下面通过一个具体的实例来查看如何使用游标的属性。以%found为例，来判断检索结果集中是否有数据行。

```java
SQL> set serveroutput on
SQL> declare
2        var_ename varchar2(50);                    
3        var_job varchar2(50);                      
4        /*声明游标，检索指定员工编号的雇员信息*/
5        cursor cur_emp                             
6        is select ename,job
7            from emp
8            where empno=7499;
9    begin
10        open cur_emp;                              
11        fetch cur_emp into var_ename,var_job;      
12        if cur_emp%found then                      
13            dbms_output.put_line('编号是 7499 的雇员名称为：'||var_ename||'，职务是：'||var_job);
14        else
15            dbms_output.put_line('无数据记录');    
16        end if;
17    end;
18    /
```

在上面的例子中，若检索到编号为7499的雇员信息，则select语句会返回一行数据，这时游标cur_emp的%found属性值为true；若检索不到编号为7499的雇员信息，则select语句无数据行返回，这时游标cur_emp的%found属性值为false。

使用显式游标时，需注意以下事项：

- 使用前须用%ISOPEN检查其打开状态，只有此值为TRUE的游标才可使用，否则要先将游打开。
- 在使用游标过程中，每次都要用%FOUND或%NOTFOUND属性检查是否返回成功，即是还有要操作的行。
- 将游标中行取至变量组中时，对应变量个数和数据类型必须完全一致。
- 使用完游标必须将其关闭，以释放相应内存资源。

### 1.3 游标变量

**1.3.1 游标变量介绍**

如同常量和变量的区别一样，前面所讲的游标都是与一个SQL语句相关联，并且在编译该块的时候此语句已经是可知的，是静态的，而游标变量可以在运行时与不同的语句关联，是动态的。

游标变量被用于处理多行的查询结果集。在同一个PL/SQL块中，游标变量不同于特定的查询绑定，而是在打开游标时才能确定所对应的查询。因此，游标变量可以一次对应多个查询。

使用游标变量之前，必须先声明，然后在运行时必须为其分配存储空间，因为游标变量是REF类型的变量，类似于高级语句中的指针。

**1.3.2 声明游标变量**

游标变量是一种引用类型。当程序运行时，它们可以指向不同的存储单元。如果要使用引用类型，首先要声明该变量，然后相应的存储单元必须被分配。

PL/SQL中的引用类型通过下述的语法进行声明：

```java
REF type
```

其中，type是已经被定义的类型。REF关键字指明新的类型必须是一个指向经过定义的类型的指针。因此，游标可以使用的类型就是REF CURSOR。

定义一个游标变量类型的完整语句如下：

```java
TYPE <类型名> IS REF CURSOR
RETURN <返回类型>
```

其中，是新的引用类型的名字，而是一个记录类型，它指明了最终由游标变量返回的选择列表的类型。 游标变量的返回类型必须是一个记录类型。它可以被显式声明为一个用户定义的记录，或者隐式使用%ROWTYPE进行声明。在定义了引用类型以后，就可以声明该变量了。

```java
SQL> set serveroutput on
SQL> DECLARE
2        TYPE t_StudentRef IS REF CURSOR                        --定义使用%ROWTYPE
3        RETURN STUDENTS%ROWTYPE;
4        TYPE t_AbstractstudentsRecord IS RECORD(               --定义新的记录类型
5          	sname STUDENTS.sname%TYPE,
6          	sex STUDENTS.sex%type);
7        	v_AbstractStudentsRecord t_AbstractStudentsRecord;
8        TYPE t_AbstractStudentsRef IS REF CURSOR               --使用记录类型的游标变量
9        RETURN t_AbstractStudentsRecord;
10       TYPE t_NameRef2 IS REF CURSOR                          --另一类型定义
11       RETURN v_AbstractStudentsRecord%TYPE;
12        	v_StudentCV t_StudentsRef;                             --声明上述类型的游标变量
13        	v_AbstractStudentCV t_AbstractStudentsRef;
```

上例中极少的游标变量是受限的，它的返回类型只能是特定类型。而在PL/SQL语句中，还有一种非受限游标变量，它在声明的时候没有RETURN子句，一个非受限游标变量可以为任何查询打开。

```java
SQL> DECLARE
2    --定义非受限游标变量
3    TYPE t_FlexibleRefIS REF CURSOR;
4    --游标变量
5    V_CURSORVar t_FlexibleRef;
```

**1.3.3 打开游标变量**

如果要将一个游标变量与一个特定的SELECT语句相关联，需要使用OPEN FOR语句，其语法格式是：

```java
OPEN<游标变量>FOR<SELECT 语句>;
```

如果游标变量是受限的，则SELECT语句的返回类型必须与游标所限的记录类型匹配，如果不匹配，Oracle会返回错误ORA_6504。

```java
SQL> DECLARE
2        TYPE t_StudentRef IS REF CURSOR    --定义使用%ROWTYPE
3        RETURN STUDENTS%ROWTYPE;
4        v_StudentSCV t_StudentRef;         --定义新的记录类型
5    BEGIN
6        OPEN v_StudentSCV FOR
7          SELECT * FROM STUDENTS;;
8    END;
```

**1.3.4 关闭游标变量**

游标变量的关闭和静态游标的关闭类似，都是使用CLOSE语句，这会释放查询所使用的空间。关闭已经关闭的游标变量是非法的。

### 1.4 通过for语句循环游标

在使用隐式游标或显式游标处理具有多行数据的结果集时，用户可以配合使用FOR语句来完成。在使用FOR语句遍历游标中的数据时，可以把它的计时器看做是一个自动的RECORD类型的变量。

（1）在FOR语句中遍历隐式游标中的数据时，通常在关键字in的后面提供由SELECT语句检索的结果集，在检索结果集的过程中，Oracle系统会自动提供一个隐式的游标SQL。

```java
SQL> set serveroutput on
SQL> begin
2        for emp_record in (select empno,ename,sal from emp where job='SALESMAN')  --遍历隐式游标中的记录
3        loop
4            dbms_output.put('雇员编号：'||emp_record.empno);                      --输出雇员编号
5            dbms_output.put('；雇员名称：'||emp_record.ename);                    --输出雇员名称
6            dbms_output.put_line('；雇员工资：'||emp_record.sal);                 --输出雇员工资
7        end loop;
8    end;
9    /
```

（2）在FOR语句中遍历显式游标中的数据时，通常在关键字IN的后面提供游标的名称，其语法格式如下： for

```java
var_auto_record in cur_name loop
    plsqlsentence;
end loop;
```

- var_auto_record：自动的RECORD类型的变量，可以是任意合法的变量名称。
- cur_name：指定的游标名称。
- plsqlsentence：PL/SQL语句。

```java
SQL> set serveroutput on
SQL> declare
2      cursor cur_emp is
3      select * from emp
4      where deptno= 30;                                           --检索部门编号为 30 的雇员信息
5    begin
6        for emp_record in cur_emp                                 --遍历雇员信息
7        loop
8            dbms_output.put('雇员编号：'||emp_record.empno);        --输出雇员编号
9            dbms_output.put('；雇员名称：'||emp_record.ename);       --输出雇员名称
10            dbms_output.put_line('；雇员职务：'||emp_record.job);   --输出雇员职务
11        end loop;
12    end;
13    /
```

在使用游标（包括显式和隐式）的FOR循环中，可以声明游标，但不用进行打开游标、读取游标和关闭游标等操作，这些由Oracle系统自动完成。

参考文献：

**1、** Oracle11g从入门到精通第二版，明日科技著，清华大学出版社有限公司；
