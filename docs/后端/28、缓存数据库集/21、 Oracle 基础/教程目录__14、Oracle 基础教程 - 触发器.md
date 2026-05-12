# 14、Oracle 基础教程 - 触发器
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/14.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 基本概念

触发器（trigger）是一种数据库对象，可以看作由事件来触发的特殊存储过程。当一个特定的事件发生时，会自动执行在数据库表上的某些操作，比如当对一个表进行操作（insert，delete， update）时就会激活它执行，使得数据库其他数据发生变化。

触发器常用于加强数据的完整性约束和业务规则等。

**数据验证**：确保插入、更新或删除操作符合业务规则和完整性约束条件。

**数据转换**：将插入、更新或删除操作中的数据转换为其他格式或单位。

**数据记录**：记录插入、更新或删除操作的详细信息，例如时间戳、用户ID等。

Oracle触发器的语法如下：

```java
CREATE OR REPLACE TRIGGER trigger_name
{BEFORE | AFTER} {
    INSERT | UPDATE | DELETE}
[OF column_name]
[ON table_name]
[REFERENCING OLD AS old NEW AS new]
[FOR EACH ROW]
WHEN (condition)
DECLARE
    -- 声明局部变量和游标
BEGIN
    -- 执行触发器操作
END;
/
```

各关键字含义如下：

- CREATE OR REPLACE TRIGGER：创建或替换一个触发器。
- BEFORE | AFTER：指定触发器在插入、更新或删除操作之前（BEFORE）还是之后（AFTER）触发。
- INSERT | UPDATE | DELETE：指定触发器在哪种操作上触发。
- [OF column_name]：指定只对某一列进行操作。
- [ON table_name]：指定触发器所属的表名。
- [REFERENCING OLD AS old NEW AS new]：指定使用OLD和NEW伪记录引用旧值和新值。
- [FOR EACH ROW]：指定为每一行执行触发器操作。
- [WHEN (condition)]：指定触发器执行的条件。
- DECLARE：声明局部变量和游标。
- BEGIN：开始执行触发器操作。
- END;：结束触发器代码块。
- /：表示触发器定义结束。

Oracle 触发器主要有三种类型：

**行级触发器** (Row-level triggers)：在每次插入、更新或删除单个记录时触发。

**语句级触发器** (Statement-level triggers)：在 SQL 语句执行完毕后触发。

**系统级触发器** (System-level triggers)：在数据库整体运行时触发。

### 2. 行级触发器

行级触发器是一种基于行的触发器，它会在每次插入、更新或删除单个记录时触发。该触发器通常用于检查记录的值是否符合特定条件，并防止非法操作。

**e.g.**

```java
-- delete时触发
Create Or Replace Trigger del_deptid
After Delete On dept
For Each Row
Begin
Delete From emp Where deptno=:Old.deptno;
End;
```

```java
-- insert时触发
Create Or Replace Trigger insert_dept 
After Insert On dept
For Each Row 
Begin
Insert Into emp(empno，ename，deptno) Values('8999'，'bob'，:New.deptno);
End;
```

```java
-- update时触发
Create Or Replace Trigger update_dept 
After Update On dept
For Each Row 
Begin
Update emp Set deptno=:New.deptno Where deptno=:Old.deptno;
End;
```

注意：`update`的触发器种使用了 `:Old` 和 `:New` 句柄来引用被操作的记录的旧值和新值。`:Old.deptno` 引用了被更新记录的 id 值，而 `:New.deptno` 则引用了该记录被更新后的 id 值。通过这种方式可在触发器中获取并记录被修改的记录的详细信息。

```java
-- 利用行级触发器与SEQUENCE生成自增ID
create or replace trigger trg_emp
before insert on 
T_EMP
for each row 
begin 
select seq_EMP_ID.nextval into :new.id from dual; 
End;
```

### 3. 语句级触发器

语句级触发器是一种基于 SQL 语句的触发器，它会在 SQL 语句执行完毕后触发。通常用于记录日志，或在多个表之间同步数据。

```java
Create Or Replace Trigger dnl_emp
After Insert Or Delete Or Update On emp
Begin
If Inserting Then
Insert Into mylog Values(User，Sysdate，'I');
Elsif Deleting Then
Insert Into mylog Values(User，Sysdate，'D');
Else
Insert Into mylog Values(User，Sysdate，'U');
End If;
End;
```

### 4. 系统级触发器

系统级触发器是一种可以在整个数据库级别上触发的触发器，常用于监控数据库对象，处理用户登录、注销、DDL语句以及其他重要事件，可以让管理员或者DBA更好地掌握和管理数据库。

**e.g.** 将所有`SELECT`查询操作进行记录到日志表（audit_log）中。

```java
CREATE OR REPLACE TRIGGER audit_select
AFTER SELECT ON SCOTT.EMP
FOR EACH STATEMENT
BEGIN
  INSERT INTO audit_log
  (username, query_date, table_name, sql_text)
  VALUES
  (USER, SYSDATE, 'EMP', ora_sql_txt);
END;
/
```

### 5. 替代触发器

由于ORACLE里，不能直接对由两个以上的表建立的视图进行操作，因此**替代触发器用于解决当组成视图的表是两个及两个以上时，无法更新的问题**。

**e.g.**

```java
Create Or Replace Trigger tr_v_e_d
Instead Of Insert On v_emp_dept
For Each Row
Begin
Insert Into dept(deptno，dname) Values(:New.deptno，:New.dname);
Insert Into emp(empno，ename，job，deptno) Values(:New.empno，:New.ename，:New.job，:New.deptno);
End;
```
