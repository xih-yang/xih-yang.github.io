# 13、Oracle 入门教程 - Oracle SQL语言之异常处理
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/13.html
- 分类：缓存数据库
- 分组：教程目录
## 一、异常处理

### 1.1 异常处理方法

**1.1.1 异常介绍**

在编写PL/SQL程序时，不可避免地会发生一些错误，可能是程序设计人员自己造成的，也可能是操作系统或硬件环境出错，比如出现除数为零、磁盘I/O错误等情况。对于出现的这些错误，Oracle采用异常机制来处理，异常处理代码通常放在PL/SQL的EXCEPTION代码块中。

**1.1.2 异常分类**

根据异常产生的机制和原理，可将Oracle系统异常分为以下两大类：

（1）预定义异常

Oracle系统自身为用户提供了大量的、可在PL/SQL中使用的预定义异常，以便检查用户代码失败的一般原因。

它们都定义在Oracle的核心PL/SQL库中，用户可以在自己的PL/SQL异常处理部分使用名称对其进行标识。

对这种异常情况的处理，用户无需在程序中定义，它们由Oracle自动引发。

（2）自定义异常

有时候可能会出现操作系统错误或机器硬件故障，这些错误Oracle系统自身无法知晓，也不能控制。例如，操作系统因病毒破坏而产生故障、磁盘损坏、网络突然中断等。

另外，因业务的实际需求，程序设计人员需要自定义一些错误的业务逻辑，而PL/SQL程序在运行过程中就可能会触发到这些错误的业务逻辑。

对于以上这些异常情况的处理，就需要用户在程序中自定义异常，然后由Oracle自动引发。

**1.1.3 预定义异常处理方法**

每当PL/SQL程序违反了Oracle的规则或超出系统的限制时，系统就自动地产生内部异常。每个Oracle异常都有一个号码，但异常必须按名处理。因此，PL/SQL对那些常见的异常预定义了异常名。

**1.1.4 预定义异常和用户自定义异常处理方法**

（1）异常声明

用户定义异常包括预定义异常和用户自定义异常，用户定义的异常只能在PL/SQL块的声明部分进行声明，声明方式与变量声明类似。

异常是一种状态而不是一个对象，因此，异常名不能出现在赋值语句或SQL语句中。

（2）抛出异常

用户定义的异常使用RAISE语句显式地提出。

（3）为内部异常命名

在PL/SQL中，必须使用OTHERS处理程序或用伪命令EXCEPTION_INIT来处理未命名的内部异常。EXCEPTION_INIT的作用是告诉编译程序将一个异常名与一个Oracle错误号码联系起来。因此，用户就可以按名称引用任何内部异常，并为它编写一个特

### 1.2 异常处理语法

**1.2.1 声明异常**

语法：

```java
exception_name EXCEPTION;
```

其中，exception_name为用户定义的异常名。

**1.2.2 为内部异常命名**

语法：

```java
PRAGE EXCEPTION_INIT(exception_name, ORA_errornumber);
```

其中，ORA_errornumber为用户定义的Oracle错误号。

**1.2.3 异常定义**

示例：

```java
DECLARE
	--声明异常
    exceprion_name EXCEPTION;
BEGIN
    IF condition THEN
    	--异常定义
    	RAISE exception_name;
    END IF;
    EXCEPTION
		WHEN exception_name THEN
    	Statement;
END;
```

**1.2.4 异常处理**

示例：

```java
SET SERVEROUTPUT ON    --将输出流开关打开
EXCEPTION
	--异常处理
    WHEN exception1 THEN
    	statement1
    WHEN exception2 THEN
        statement2
    ……
    WHEN OTHERS THEN
        statement3
```

**1.2.5 使用SQLCODE和SQLERRM函数定义提示信息**

示例：

```java
DBMS_OUTPUT.PUT_LINE('错误号：'||SQLCODE);
DBMS_OUTPUT.PUT_LINE('错误号：'||SQLERRM);
```

### 1.3 预定义异常

**1.3.1 预定义异常介绍**

当PL/SQL程序违反了Oracle系统内部规定的设计规范时，就会自动引发一个预定义的异常，例如，当除数为零时，就会引发ZERO_DIVIED异常。

**1.3.2 Oracle 常见预定义异常**

（1）`ACCESS_INTO_NULL`

该异常对应于ORA-06530错误。为了引用对象属性，必须首先初始化对象。当直接引用未初始化的对象属性时，会触发该异常。

（2）`CASE_NOT_FOUND`

该异常应用于ORA-06592错误。当CASE语句的WHEN子句没有包含必须条件分支或者ELSE子句时，会触发该异常。

（3）`COLLECTION_IS_NULL`

该异常应用于ORA-06531错误。在给嵌套表变量或者VARRAY变量赋值之前，必须首先初始化集合变量。如果没有初始化集合变量，会触发该异常。

（4）`CURSOR_ALREADY_OPEN`

该异常应用于ORA-06511错误。当在已打开游标上执行OPEN操作时，会触发该异常。

（5）`INVALID_CURSOR`

该异常应用于ORA-01001错误。当视图从未打开游标提取数据，或者关闭未打开游标时，会触发该异常。

（6）`INVALID_NUMBER`

该异常应用于ORA-01722错误。当内嵌SQL语句不能将字符转变成数字时，会触发该异常。

（7）`LOGIN_DENIED`

该异常应用于ORA-01017错误。当连接到Oracle数据库时，如果提供了不正确的用户名或者口令，会触发该异常。

（8）`NO_DATA_FOUND`

该异常应用于ORA-01403错误。当执行SELECT INTO未返回行，或者引用了未初始化的PL/SQL表元素时，会触发该异常。 　

（9）`NOT_LOGGED_ON`

该异常应用于ORA-01012错误。如果没有连接到Oracle数据库，当执行内嵌SQL语句时，会触发该异常。

（10）`PROGRAM_ERROR`

该异常应用于ORA-06501错误。如果出现该错误，则表示存在PL/SQL内部问题，在这种情况下需要重新安装数据字典视图和PL/SQL包。

（11）`ROWTYPE_MISMATCH`

该异常应用于ORA-016504错误。当执行赋值操作时，如果宿主变量和游标变量具有不兼容的返回类型，会触发该异常。

（12）`SELF_IS_NULL`

该异常应用于ORA-30625错误。当使用对象类型时，如果在NULL实例上调用成员方法，会触发该异常。

（13）`STORAGE_ERROR`

该异常应用于ORA-06500错误。当执行PL/SQL块时，如果超出内存空间或者内存被破坏，会触发该异常。

（14）`SUBSCRIPT_BEYOND_COUNT`

该异常应用于ORA-06533错误。当使用嵌套表或者VARRAY元素时，如果下标超出了嵌套表或者VARRAY元素的范围，会触发该异常。

（15）`SUBSCRIPT_OUTSIDE_LIMIT`

该异常应用于ORA-06532错误。当使用嵌套表或者VARRAY元素时，如果元素下标为负值，会触发该异常。

（16）`SYS_INVALID_ROWID`

该异常应用于ORA-01410错误。当将字符串转变为ROWID时，如果使用了无效字符串，会触发该异常。

（17）`TIMEOUT_ON_RESOURCE`

该异常应用于ORA-00051错误。当等待资源时如果出现超时错误，会触发该异常。

（18）`TOO_MANY_ROWS`

该异常应用于ORA-01422错误。当执行SELECT INTO语句时，如果返回超过一行，会触发该异常。

（19）`VALUE_ERROR`

该异常应用于ORA-06502错误。当执行赋值操作时，如果变量长度不足以容纳实际数据，会触发该异常。

（20）`ZERO_DIVIDE`

该异常应用于ORA-01476错误。如果用数字值除以0，会触发该异常。

**1、** 3.3预定义异常示例；

```java
set serveroutput on
declare
	var_empno number;                  --定义变量，存储雇员编号
	var_ename varchar2(50);            --定义变量，存储雇员名称
begin
	select empno,ename into var_empno,var_ename
	from scott.emp
	where deptno=10;                   --检索部门编号为 10 的雇员信息
	if sql%found then                  --若检索成功，则输出雇员信息
		dbms_output.put_line('雇员编号：'||var_empno||'；雇员名称'||var_ename);
	end if;
exception                              --捕获异常
	when too_many_rows then            --若 SELECT INTO 语句的返回记录超过一行
		dbms_output.put_line('返回记录超过一行');
	when no_data_found then            --若 SELECT INTO 语句的返回记录为 0 行
		dbms_output.put_line('无数据记录');
end;
/
```

输出结果为：

在上面的例子中，由于部门编号为10的员工记录数大于1，所以SELECT INTO语句的返回行数就要超过一行，由于Oracle系统内部规定不允许该语句的返回行数超过一行，所以必然会引发异常，即引发too_many_rows系统预定义异常。

### 1.4 自定义异常

**1.4.1 自定义异常介绍**

Oracle系统内部的预定义异常仅仅20个左右，而实际程序运行过程中可能会产生几千种异常情况，为此Oracle经常使用错误编号和相关描述输出异常信息。另外，程序设计人员可以根据实际的业务需求定义一些特殊异常，这样Oracle的自定义异常就可以分为错误编号异常和业务逻辑异常两种。

**1.4.2 错误编号异常**

错误编号异常是指在Oracle系统发生错误时，系统会显示错误号和相关描述信息的异常。虽然直接使用错误编号也可以完成异常处理，但错误编号较为抽象，不易于用户理解和记忆，对于这种异常，首先在PL/SQL块的声明部分（DECLARE部分）使用EXCEPTION类型定义一个异常变量名，然后使用语句PRAGMA EXCEPTION_INIT为“错误编号”关联“这个异常变量名”，接下来就可以像对待系统预定义异常一样处理了。

下面通过一个具体的实例来演示如何为Oracle系统的“错误编号”做自定义异常处理。首先我们向dept表中插入一条部门编号为10的记录（部门编号10已经存在于dept表中，并且部门编号为dept表的唯一主键），然后执行INSERT语句，得到如图所示的运行结果。

从上图所示的运行结果中可以看到，程序执行中断而崩溃掉了，并显示错误信息为“ORA-00001”—即错误编号为“00001”，那么对于Oracle捕获到的这个异常可以通过如下的示例来解决。

```java
set serveroutput on
declare
	primary_iterant exception;                       --定义一个异常变量
	pragma exception_init(primary_iterant,-00001);   --关联错误号和异常变量名
begin
	/*向 dept 表中插入一条与已有主键值重复的记录，以便引发异常*/
	insert into scott.dept values(10,'软件开发部','深圳');
exception
	when primary_iterant then                        --若 Oracle 捕获到的异常为-0001 异常
		dbms_output.put_line('主键不允许重复！');    	--输出异常描述信息
end;
/
```

输出结果为：

通过运行结果可以看到，使用异常处理机制，可以防止Oracle系统因引发异常而导致程序崩溃，使程序有机会自动纠正错误，而且自定义异常容易理解和记忆，方便用户的使用。

**1.4.3 业务逻辑异常**

在实际的应用中，程序开发人员可以根据具体的业务逻辑规则自定义一个异常。这样，当用户操作违反业务逻辑规则时，就引发一个自定义异常，从而中断程序的正常执行并转到自定义的异常处理部分。

无论是预定义异常，还是错误编号异常，都是由Oracle系统判断的错误，但业务逻辑异常是Oracle系统本身无法知道的，这样就需要有一个引发异常的机制，引发业务逻辑异常通常使用RAISE语句来实现，当引发一个异常时，控制就会转到EXCEPTION异常处理部分执行异常处理语句。

业务逻辑异常首先要在DECLARE部分使用EXCEPTION类型声明一个异常变量，然后在BEGIN部分根据一定的业务逻辑规则执行RAISE语句（在RAISE关键字后面跟着异常变量名），最后在EXCEPTION部分编写异常处理语句。

示例

```java
set serveroutput on
declare
	--声明一个 exception 类型的异常变量
	null_exception exception; 
	--声明 rowtype 类型的变量 dept_row                        
	dept_row scott.dept%rowtype;  
begin
	--给部门编号变量赋值
	dept_row.deptno := 66; 
	--给部门名称变量赋值
	dept_row.dname := '公关部';
	--向 dept 表中插入一条记录
	insert into scott.dept
	values(dept_row.deptno,dept_row.dname,dept_row.loc);
	--如果判断“loc”变量的值为 null
	if dept_row.loc is null then
		--引发 null 异常，程序转入 exception 部分                    
		raise null_exception;
	end if;
exception
	--当 raise 引发的异常是 null_exception 时
	when null_exception then    
		--输出异常提示信息                      
		dbms_output.put_line('loc 字段的值不许为 null');  
		--回滚插入的数据记录
		rollback;                                         
end;
/
```

输出结果为：
