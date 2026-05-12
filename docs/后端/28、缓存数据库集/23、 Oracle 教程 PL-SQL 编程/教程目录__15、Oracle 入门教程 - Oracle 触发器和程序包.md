# 15、Oracle 入门教程 - Oracle 触发器和程序包
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/15.html
- 分类：缓存数据库
- 分组：教程目录
## 一、Oracle 触发器

> 触发器可以看做是一种“特殊”的存储过程，它定义了一些在数据库相关事件（如INSERT、UPDATE、CREATE等事件）发生时应执行的“功能代码块”，通常用于管理复杂的完整性约束，或监控对表的修改，或通知其他程序，甚至可以实现对数据的审计功能。

### 1.1 触发器简介

**1.1.1 触发器介绍**

在触发器中有一个不得不提的概念——触发事件，触发器正是通过这个“触发事件”来执行的（而存储过程的调用或执行是由用户或应用程序进行的）。

能够引起触发器运行的操作就被称为“触发事件”，如执行DML语句（使用INSERT、UPDATE、DELETE语句对表或视图执行数据处理操作），执行DDL语句（使用CREATE、ALTER、DROP语句在数据库中创建、修改、删除模式对象），引发数据库系统事件（如系统启动或退出、产生异常错误等），引发用户事件（如登录或退出数据库操作），以上这些操作都可以引起触发器的运行。

**1.1.2 触发器语法**

```java
create [or replace] trigger tri_name
    [before | after | instead of] tri_event
    on table_name | view_name | user_name | db_name
      [for each row [when tri_condition]
begin
    plsql_sentences;
end tri_name;
```

- trigger：表示创建触发器的关键字，就如同创建存储过程的关键字procedure一样。
- tri_name：触发器的名称，如果数据库中已经存在了此名称，则可以指定“or replace”关键字，这样新的触发器将覆盖掉原来的触发器。
- before | after | instead of：表示“触发时机”的关键字。
- Before表示在执行DML等操作之前触发，这种方式能够防止某些错误操作发生而便于回滚或实现某些业务规则；
- after表示在DML等操作之后发生，这种方式便于记录该操作或某些事后处理信息；
- instead of表示触发器为替代触发器。
- tri_event：触发事件，比如常用的有INSERT、UPDATE、DELETE、CREATE、ALTER、DROP等。
- on：表示操作的数据表、视图、用户模式和数据库等，对它们执行某种数据操作（比如对表执行INSERT、ALTER、DROP等操作），将引起触发器的运行。
- table_name | view_name | user_name | db_name：分别表示操作的数据表、视图、用户模式和数据库，对它们的某些操作将引起触发器的运行。
- when tri_condition：这是一个触发条件子句，其中when是关键字，tri_condition表示触发条件表达式，只有当该表达式的值为true时，遇到触发事件才会自动执行触发器，使其执行触发操作，否则即便是遇到触发事件也不会执行触发器。
- for each row：指定触发器为行级触发器，当DML语句对每一行数据进行操作时都会引起该触发器的运行。如果未指定该条件，则表示创建语句级触发器，这时无论数据操作影响多少行，触发器都只会执行一次。
- plsql_sentences：PL/SQL语句，它是触发器功能实现的主体。

**1.1.3 Oracle 触发器分类**

Oracle的触发事件相对于其他数据库而言比较复杂，比如上面提到过的DML操作、DDL操作，甚至是一些数据库系统的自身事件等都会引起触发器的运行。为此，这里根据触发器的触发事件和触发器的执行情况，将Oracle所支持的触发器分为以下5种类型：

- 行级触发器：当DML语句对每一行数据进行操作时都会引起该触发器的运行。
- 语句级触发器：无论DML语句影响多少行数据，其所引起的触发器仅执行一次。
- 替换触发器：该触发器是定义在视图上的，而不是定义在表上，它是用来替换所使用实际语句的触发器。
- 用户事件触发器：是指与DDL操作或用户登录、退出数据库等事件相关的触发器。如用户登录到数据库或使用ALTER语句修改表结构等事件的触发器。
- 系统事件触发器：是指在Oracle数据库系统的事件中进行触发的触发器，如Oracle实例的启动与关闭。

### 1.2 语句级触发器

**1.2.1 语句级触发器介绍**

语句级触发器，顾名思义就是针对一条DML语句而引起的触发器执行。在语句级触发器中，不使用for each row子句，也就是说无论数据操作影响多少行，触发器都只会执行一次。

**1.2.2 语句级触发器示例**

（1）本实例要实现的主要功能是使用触发器在SCOTT模式下针对dept表的各种操作进行监控，为此首先需要创建一个日志表dept_log，它用于存储对dept表的各种数据操作信息，比如操作种类（如插入、修改、删除操作），操作时间等。

```java
create table dept_log
(
    operate_tag varchar2(10),         --定义字段，存储操作种类信息
    operate_time date                 --定义字段，存储操作日期
);
```

创建结果

（2）然后创建一个关于emp表的语句级触发器，将用户对dept表的操作信息保存到dept_log表中。

```java
create or replace trigger tri_dept
	--创建触发器，当 dept 表发生插入，修改，删除操作时引起该触发器执行
	before insert or update or delete
	on dept                   
declare
	--声明一个变量，存储对 dept 表执行的操作类型
	var_tag varchar2(10);     
begin
	if inserting then         --当触发事件是 INSERT 时
		var_tag := '插入';    --标识插入操作
	elsif updating then       --当触发事件是 UPDATE 时
		var_tag := '修改';    --标识修改操作
	elsif deleting then       --当触发事件是 DELETE 时
		var_tag := '删除';    --标识删除操作
	end if;
	insert into dept_log
	values(var_tag,sysdate);  --向日志表中插入对 dept 表的操作信息
end tri_dept;
/
```

创建结果

在上面的代码中，使用BEFORE关键字来指定触发器的“触发时机”，它指定当前的触发器在DML语句执行之前被触发，这使得它非常适合于强化安全性、启用业务逻辑和进行日志信息记录。当然也可以使用AFTER关键字，它通常用于记录该操作或者做某些事后处理工作。具体使用哪一种关键字，要根据实际需要而定。

另外，为了具体判断对dept表执行了何种操作—即具体引发了哪种“触发事件”，代码中还使用了条件谓词，它由条件关键字（IF或ELSIF）和谓词（inserting、updating、deleting）组成，如果条件谓词的值为true，那么就是相应类型的DML语句（insert、update、delete）引起了触发器的运行。条件谓词通用的语法格式如下：

```java
if inserting then              --如果执行了插入操作，即触发了 insert 事件
    do somting about insert
elsif updating then            --如果执行了修改操作，即触发了 update 事件
    do somting about update
elsif deleting then            --如果执行了删除操作，即触发了 delete 事件
    do somting about delete
end if;
```

另外，对于条件谓词，用户甚至还可以在其中判断特定列是否被更新，例如要判断用户是否对dept表中dname列进行了修改，可以使用下面的语句：

```java
if updating(dname) then       --若修改了 dept 表中的 dname 列
    ...
end if;
```

在上面的条件谓词中，即使用户修改了dept表中的数据，但却没有对dname列的值进行修改，那么该条件谓词的值仍然为false，这样相关的执行语句就不会得到执行。

（3）在创建完毕触发器之后，接下来就是执行触发器，但它的触发执行与存储过程截然不同，存储过程的执行是由用户或应用程序进行的，而它必须由一定的“触发事件”来诱发执行。比如，对dept表执行插入（insert事件）、修改（update事件）、删除（delete事件）等操作，都会引起tri_dept触发器的运行。

```java
insert into dept values(66,'业务咨询部','长春');
update dept set loc='沈阳' where deptno=66;
delete from dept where deptno=66;
```

操作结果

上面的代码对dept表执行了3次DML操作，这样根据tri_dept触发器自身的设计情况，其会被触发3次，并且会向dept_log表中插入3条操作记录。

（4）通过上面的3条DML语句，让触发器执行了3次，接下来就可以到dept_log表中查看日志信息了。

```java
select * from dept_log;
```

执行查看结果

### 1.3 行级别触发器

**1.3.1 行级触发器介绍**

行级触发器会针对DML操作所影响的每一行数据都执行一次触发器。创建这种触发器时，必须在语法中使用for each for这个选项。使用行级触发器的一个典型应用就是给数据表生成主键值，下面就来讲解这个典型应用的实现过程。

**1.3.2 行级触发器示例**

（1）为了使用行级触发器生成数据表中的主键值，首先需要创建一个带有主键列的数据表，来看下面的例子。

```java
create table goods
(
id int primary key,
good_name varchar2(50)
);
```

创建结果

在上面的代码中，id列就是goods表的主键，因为在创建该列时指定了“primary key”关键字，主键列的值要求不能重复，这一点很重要。

（2）为了给goods表的id列生成不能重复的有序值，这里需要创建一个序列

```java
create sequence seq_id;
```

创建结果

上面的代码创建了序列seq_id，用户可以在SQL/PL程序中调用它的nextval属性来获取一系列有序的数值，这些数值就可以作为goods表的主键值。

（3）在创建了数据表goods和序列seq_id之后，至此准备工作已经完成，下面来创建一个触发器，用于为goods表的id列赋值。

```java
create or replace trigger tri_insert_good
	before insert
	on goods                --关于 goods 数据表，在向其插入新纪录之前，引起该触发器的运行
	for each row            --创建行级触发器
begin
	select seq_id.nextval
	into :new.id
	from dual;              --从序列中生成一个新的数值，赋值给当前插入行的 id 列
end;
/
```

创建结果

在上面的代码中，为了创建行级的触发器，使用了for each row选项；为了给goods表的当前插入行的id列赋值，这里使用了“:new.id”关键字——也称为“列标识符”，这个列标识符用来指向新行的id列，给它赋值，就相当于给当前行的id列赋值，下面对这个“列标识符”相关的知识进行讲解。

在行级触发器中，可以访问当前正在受到影响（添加、删除、修改等操作）的数据行，这就可以通过“列标识符”来实现。列标识符可以分为“原值标识符”和“新值标识符”，原值标识符用于标识当前行某个列的原始值，记作“:old.column_name”（如:old.id），通常在UPDATE语句中和DELETE语句使用，因为在INSERT语句中新插入的行没有原始值；新值标识符用于标识当前行某个列的新值，记作“:new.column_name”（如:new.id），通常在INSERT语句和UPDATE语句中被使用，因为DELETE语句中被删除的行无法产生新值。

（4）在触发器创建完毕之后，用户可以通过向goods表中插入数据来验证触发器是否被执行，同时也能够验证该行级触发器是否能够使用序列为表的主键赋值。

```java
insert into goods(good_name) values('苹果');
insert into goods(id,good_name) values(9,'葡萄');
```

操作结果

（5）最后使用SELECT语句来检索goods表中的数据行，从而验证设计本实例的初衷。

```java
select * from goods;
```

查看结果

从运行结果中可以看到两条完整的数据记录，而且还可以看到主键id的值是连续的自然数。虽然在第二次插入数据行时指定了id的值（即9），但这并没有起任何作用，这是因为在触发器中将序列seq_id的nextval属性值赋给了“:new.id”列标识符，这个列标识符的值就是当前插入行的id列的值，并且nextval属性值是连续不间断的。

### 1.4 替换触发器

**1.4.1 替换触发器介绍**

替换触发器—即instead of触发器，它的“触发时机”关键字是INSTEAD OF，而不是BEFORE或AFTER。与其他类型触发器不同的是，替换触发器是定义在视图（一种数据库对象，在后面章节中会讲解到）上的，而不是定义在表上。

由于视图是由多个基表连接组成的逻辑结构，所以一般不允许用户进行DML操作（如insert、update、delete等操作），这样当用户为视图编写“替换触发器”后，用户对视图的DML操作实际上就变成了执行触发器中的PL/SQL语句块，这样就可以通过在“替换触发器”中编写适当的代码对构成视图的各个基表进行操作。

**1.4.2 替换触发器示例**

（1）为了创建并使用替换触发器，首先需要创建一个视图。

```java
connect system/manager
--授权
grant create view to scott;
connect scott/tiger
create view view_emp_dept
as select empno,ename,dept.deptno,dname,job,hiredate
	 from emp,dept
	where emp.deptno= dept.deptno;
```

执行结果

（2）接下来编写一个关于view_emp_dept视图在insert事件中的触发器

```java
create or replace trigger tri_insert_view
	--创建一个关于 view_emp_dept 视图的替换触发器
	instead of insert
	on view_emp_dept                           
	--行级视图
	for each row                               
declare
	row_dept dept%rowtype;
begin
	--检索指定部门编号的记录行
	select * into row_dept from dept where deptno = :new.deptno;
	--未检索到该部门编号的记录
	if sql%notfound then                       
		--向 dept 表中插入数据
		insert into dept(deptno, dname)
		values(:new.deptno, :new.dname);      
	end if;
	--向 emp 表中插入数据
	insert into emp(empno, ename, deptno, job, hiredate)
	values(:new.empno, :new.ename, :new.deptno, :new.job, :new.hiredate);				
end tri_insert_view;
/
```

执行结果

在上面触发器的主体代码中，如果新插入行的部门编号（deptno）不在dept表中，则首先向dept表中插入关于新部门编号的数据行，然后再向emp表中插入记录行，这是因为emp表的外键值（emp.deptno）是dept表的主键值（dept.deptno）。

（3）当触发器tri_insert_view成功创建之后，再向view_emp_dept视图中插入数据时，Oracle就不会产生错误信息，而是引起触发器“tri_insert_view”的运行，从而实现向emp表和dept表中插入两行数据。

```java
insert into view_emp_dept(empno,ename,deptno,dname,job,hiredate)
values(8888,'东方',10,'ACCOUNTING','CASHIER',sysdate);
select * from view_emp_dept where empno= 8888;
```

执行结果

在上面代码的INSERT语句中，由于在dept表中已经存在部门编码（deptno）为10的记录，所以触发器中的程序只向emp表中插入一条记录；若指定的部门编码不存在，则首先要向dept表中插入一条记录，然后再向emp表中插入一条记录。

### 1.5 用户事件触发器

**1.5.1 用户事件触发器介绍**

用户事件触发器是因进行DDL操作或用户登录、退出等操作而引起运行的一种触发器，引起该类型触发器运行的常见用户事件包括：CREATE、ALTER、DROP、ANALYZE、COMMENT、GRANT、REVOKE、RENAME、TRUNCATE、SUSPEND、LOGON和LOGOFF等。

**1.5.2 用户事件触发器示例**

（1）首先创建一个日志信息表，用于保存DDL操作的信息，实例如下：

```java
create table ddl_oper_log
(
	db_obj_name varchar2(20),      --数据对象名称
	db_obj_type varchar2(20),      --对象类型
	oper_action varchar2(20),      --具体 ddl 行为
	oper_user varchar2(20),        --操作用户
	oper_date date                 --操作日期
);
```

执行结果

（2）创建一个用户触发器，用于将当前模式下的DDL操作信息保存到上面所创建的ddl_oper_log日志信息表中。

```java
create or replace trigger tri_ddl_oper
	--在 scott 模式下，在创建、修改、删除数据对象之前将引发该触发器运行
	before create or alter or drop
	on scott.schema               
begin
	insert into ddl_oper_log values(
		ora_dict_obj_name,        --操作的数据对象名称
		ora_dict_obj_type,        --对象类型
		ora_sysevent,             --系统事件名称
		ora_login_user,           --登录用户
		sysdate);
end;
/
```

执行结果

上面代码中，当向日志表ddl_oper_log插入数据时，使用了若干个事件属性，它们各自的含义如下：

- ora_dict_obj_name：获取DDL操作所对应的数据库对象。
- ora_dict_obj_type：获取DDL操作所对应的数据库对象的类型。
- ora_sysevent：获取触发器的系统事件名。
- ora_login_user：获取登录用户名。

通过上面的4个事件属性值和sysdate系统属性就可以将scott用户的DDL操作信息获取出来，最后再把这些信息保存到ddl_oper_log日志表中，以备随时查看。

（3）在创建完触发器之后，为了引起触发器的执行，就要在SCOTT模式下进行DDL操作。

```java
create table tb_test(id number);
create view view_test as select empno,ename from emp;
alter table tb_test add(name varchar2(10));
drop view view_test;
select * from ddl_oper_log;
```

执行结果

从上面的运行结果可以看出，用户scott的DDL操作信息都被存储到ddl_oper_log日志表中，这些信息就是由DDL操作引起触发器运行而保存到日志表中的。

### 1.6 删除触发器

当一个触发器不再使用时，要从内存中删除它，例如：

```java
DROP TRIGGER my_trigger;
```

当一个触发器已经过时，想重新定义时，不必先删除再创建，同样只需在CREATE语句后面加上OR REPLACE关键字即可。如：

```java
CREATE OR REPLACE TRIGGER my_trigger;
```

## 二、Oracle 程序包

> 程序包由PL/SQL程序元素（如变量、类型）和匿名PL/SQL块（如游标）、命名PL/SQL块（如存储过程和函数）组成。程序包可以被整体加载到内存中，这样就可以大大加快程序包中任何一个组成部分的访问速度。

### 2.1 程序包的规范

**2.1.1 程序包介绍**

程序包由PL/SQL程序元素（如变量、类型）和匿名PL/SQL块（如游标）、命名PL/SQL块（如存储过程和函数）组成。程序包可以被整体加载到内存中，这样就可以大大加快程序包中任何一个组成部分的访问速度。

实际上程序包对于用户来说并不陌生，在PL/SQL程序中使用`DBMS_OUTPUT.PUT_LINE`语句就是程序包的一个具体应用，其中，`DBMS_OUTPUT`是程序包，而`PUT_LINE`就是其中的一个存储过程，程序包通常由规范和包主体组成。

**2.1.2 程序包语法格式**

该“规范”用于规定在程序包中可以使用哪些变量、类型、游标和子程序（指各种命名的PL/SQL块），需要注意的是程序包一定要在“包主体”之前被创建，其语法格式如下：

```java
create [or replace] package pack_name is
	[declare_variable];
	[declare_type];
    [declare_cursor];
    [declare_function];
    [declare_ procedure];
end [pack_name];
```

- pack_name：程序包的名称，如果数据库中已经存在了此名称，则可以指定“or replace”关键字，这样新的程序包将覆盖掉原来的程序包。
- declare _variable：规范内声明的变量。
- declare _type：规范内声明的类型。
- declare _cursor：规范内定义的游标。
- declare _function：规范内声明的函数，但仅定义参数和返回值类型，不包括函数体。
- declare _procedure：规范内声明的存储过程，但仅定义参数，不包括存储过程主体。

**2.1.3 创建程序包的“规范”示例**

```java
create or replace package pack_emp is
	--获取指定部门的平均工资
	function fun_avg_sal(num_deptno number) return number;    
	 --按照指定比例上调指定职务的工资           
	procedure pro_regulate_sal(var_job varchar2,num_proportion number); 
end pack_emp;
/
```

执行结果

从上面的代码中可以看到，在“规范”中声明的函数和存储过程只有头部的声明，而没有函数体和存储过程主体，这正是规范的特点。

注意只定义了“规范”的程序包还不可以使用，此时如果试图在PL/SQL块中通过程序包的名称来调用其中的函数或存储过程，Oracle将会产生错误提示。

### 2.2 程序包的主体

**2.2.1 程序包的主体介绍**

程序包的主体包含了在规范中声明的游标、过程和函数的实现代码，另外，也可以在程序包的主体中声明一些内部变量。程序包主体的名称必须与规范的名称相同，这样通过这个相同的名称Oracle就可以将“规范”和“主体”结合在一起组成程序包，并实现一起进行编译代码。

在实现函数或存储过程主体时，可以将每一个函数或存储过程作为一个独立的PL/SQL块来处理。

**2.2.2 程序包的主体语法**

与创建“规范”不同的是，创建程序包主体使用CREATE PACKAGE BODY语句，而不是CREATE PACKAGE语句，这一点需要读者注意，创建程序包主体的代码如下：

```java
create [or replace] package body pack_name is
        [inner_variable]
        [cursor_body]
        [function_title]
        {
    begin
            fun_plsql;
        [exception]
            [dowith _ sentences;]
        end [fun_name]}
        [procedure_title]
        {
    begin
            pro_plsql;
        [exception]
            [dowith _ sentences;]
        end [pro_name]}
    …
    end [pack_name];
```

- pack_name：程序包的名称，要求与“规范”对应的程序包名称相同。
- inner_variable：程序包主体的内部变量。
- cursor_body：游标主体。
- function_title：从“规范”中引入的函数头部声明。
- fun_plsql：PL/SQL语句，这里是函数主要功能的实现部分。从begin到end部分就是函数的body。
- dowith _ sentences：异常处理语句。
- fun_name：函数的名称。
- procedure_title：从“规范”中引入的存储过程头部声明。
- pro_plsql：PL/SQL语句，这里是存储过程主要功能的实现部分。从begin到end部分就是存储过程的body。
- pro_name：存储过程的名称。

**2.2.3 程序包的主体示例**

```java
create or replace package body pack_emp is
	--引入“规范”中的函数
	function fun_avg_sal(num_deptno number) return number is
	--定义内部变量
	num_avg_sal number; 
begin
	select avg(sal)
	into num_avg_sal
	from emp
	where deptno= num_deptno; 
	--计算某个部门的平均工资并返回平均工资
	return(num_avg_sal);                                      
exception
	when no_data_found then 
		dbms_output.put_line('该部门编号不存在雇员记录');
		return 0; 
	end fun_avg_sal;
	--引入“规范”中的存储过程
	procedure pro_regulate_sal(var_job varchar2,num_proportion number) is
	begin
		update emp
		set sal = sal*(1+num_proportion)
		--为指定的职务调整工资
		where job = var_job; 
		end pro_regulate_sal;
end pack_emp;
/
```

执行结果

在创建了程序包的“规范”和“主体”之后，就可以像普通的存储过程和函数一样实施调用了。

```java
set serveroutput on
declare
	num_deptno emp.deptno%type;                         --定义部门编号变量
	var_job emp.job%type;                               --定义职务变量
	num_avg_sal emp.sal%type;                           --定义工资变量
	num_proportion number;                              --定义工资调整比例变量
begin
	num_deptno:=10;                                     --设置部门编号为 10
	num_avg_sal:=pack_emp.fun_avg_sal(num_deptno);      --计算部门编号为 10 的平均工资
	dbms_output.put_line(num_deptno||'号部门的平均工资是：'||num_avg_sal);--输出平均工资
	var_job:='SALESMAN';                                --设置职务名称
	num_proportion:=0.1;                                --设置调整比例
	pack_emp.pro_regulate_sal(var_job,num_proportion);  --调整指定部门的工资
end;
/
```

执行结果

总结一下使用一个程序包的过程就是：首先创建程序包的“规范”，然后再创建程序包的“主体”，最后在PL/SQL块或SQL*Plus中调用程序包中的子程序——即函数或存储过程。

### 2.3 删除程序包

与函数和过程一样，当一个包不再使用时，要从内存中删除它，语法：

```java
DROP PACKAGE my_package
```

示例

```java
drop package pack_emp;
```

执行结果

当一个包已经过时，想重新定义时，不必先删除再创建，同样只需在CREATE语句后面加上OR REPLACE关键字即可，如：

```java
CREATE OR REPLACE PACKAGE my_package
```
