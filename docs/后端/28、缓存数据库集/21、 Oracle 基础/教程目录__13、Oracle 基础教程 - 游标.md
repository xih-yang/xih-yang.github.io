# 13、Oracle 基础教程 - 游标
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/13.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 游标的定义

Oracle游标（cursor）是一种数据结构，用于在PL/SQL代码中处理结果集，如用于暂时存储SELECT语句返回的结果集。游标允许程序员对结果集进行逐行处理，并在需要时检索或修改数据。当表的数据量很大的时候，不适合使用游标。

使用游标的5个步骤：

- 声明变量，用于保存SELECT语句返回的值。
- 声明游标，并指定SELECT语句。
- 使用OPEN语句打开游标。
- 通过FETCH语句从游标中获取记录。
- 通过CLOSE语句关闭游标。

**e.g.**

```java
DECLARE
MYRECORD employees%ROWTYPE;  /*声明变量*/
CURSOR MYCUR IS
SELECT * FROM employees;  /*声明游标*/
BEGIN
OPEN MYCUR;                    /*打开游标*/
LOOP
FETCH MYCUR INTO MYRECORD;  /*从游标中获取记录*/
DBMS_OUTPUT.PUT_LINE (MYRECORD.NAME||'，'||MYRECORD.BIRTH);
EXIT WHEN MYCUR%NOTFOUND;
END LOOP;
CLOSE MYCUR;                   /*关闭游标*/
END;
```

### 2. 游标的类型

Oracle支持两种类型的游标：显式游标和隐式游标。显式游标是由程序员明确声明和定义的游标，而隐式游标则由Oracle自动创建并使用。

**（1）显式游标**

显式游标由程序员明确声明和定义，可以更好地控制游标的行为。它们可以在PL/SQL代码中使用，允许程序员检索结果集、逐行处理数据并在需要时修改数据。

**e.g.**

```java
DECLARE
  CURSOR c1 IS SELECT * FROM employees WHERE department_id = 10;
  v_emp employees%ROWTYPE;
BEGIN
  OPEN c1;
  LOOP
    FETCH c1 INTO v_emp;
    EXIT WHEN c1%NOTFOUND;
    -- 处理v_emp这一行数据
  END LOOP;
  CLOSE c1;
END;
```

上述示例中，游标c1选择了名为employees的表中部门ID为10的所有记录。`FETCH`语句将每行数据逐个存储在v_emp变量中进行逐行处理。如果没有更多的行，则`EXIT`语句退出循环并关闭游标。

**（2）隐式游标**

隐式游标是由Oracle自动创建和维护的游标。它们用于在SQL语句中处理结果集而不需要显式声明和定义。

**e.g.**

```java
BEGIN
  FOR v_emp IN (SELECT * FROM employees WHERE department_id = 10) LOOP
    -- 处理v_emp这一行数据
  END LOOP;
END;
```

上述示例中，`FOR`循环使用`SELECT`语句选择名为employees的表中部门ID为10的所有记录。在循环期间，每个行都存储在v_emp变量中进行逐行处理。

虽然隐式游标不需要显式声明和定义，但它们可以更容易地引起错误,例如可能会影响其他同时执行的操作或导致内存泄漏等问题。因此，编写复杂业务逻辑的PL/SQL代码时，应该优先考虑使用显式游标。

### 3. 游标的应用

**（1）基本用法**

游标最基本的用法就是遍历查询结果集，游标也可以带参数，参数只声明类型，不声明精度。

**e.g.**

```java
DECLARE
T_NAME employees%TYPE;
CURSOR CUR_PARA(MCC VARCHAR2) IS
SELECT MC FROM employees WHERE AREA=MCC;
BEGIN
OPEN CUR_PARA('北京市');
LOOP
FETCH CUR_PARA INTO T_NAME;
EXIT WHEN CUR_PARA%NOTFOUND;
DBMS_OUTPUT.PUT_LINE(T_NAME);
END LOOP;
CLOSE CUR_PARA;
END;
```

**（2）数据处理**

游标可通过循环实现复杂的数据处理业务逻辑。

**e.g.**

```java
DECLARE
CURSOR c_emp IS SELECT * FROM emp;
v_sum NUMBER := 0;
v_sal emp.sal%TYPE;
BEGIN
OPEN c_emp;
LOOP
FETCH c_emp INTO v_emp;
EXIT WHEN c_emp%NOTFOUND;
v_sal := v_emp.sal;
v_sum := v_sum + v_sal;
END LOOP;
CLOSE c_emp;
DBMS_OUTPUT.put_line('The total salary is ' || v_sum);
END;
```

上述代码通过定义游标c_emp查询emp表中的所有记录，并通过循环遍历每条记录，对员工薪资进行累加求和，并最后输出结果。

**（3）更新数据**

除了查询和读取外，游标还可以对查询结果进行更新和删除。

**e.g.**

```java
DECLARE
CURSOR c_emp IS SELECT * FROM emp WHERE job = 'MANAGER' AND deptno = 10 FOR UPDATE;
BEGIN
OPEN c_emp;
LOOP
FETCH c_emp INTO v_emp;
EXIT WHEN c_emp%NOTFOUND;
UPDATE emp SET sal = sal * 1.1 WHERE CURRENT OF c_emp;
END LOOP;
CLOSE c_emp;
END;
```

上述代码通过定义游标c_emp查询emp表中部门编号为10且职位为经理的员工记录，并使用`FOR UPDATE`语句锁定这些记录，以免其他用户对其进行修改。接着，通过循环遍历每条记录，并对每条记录的薪资进行10%的涨幅更新。最后，通过`CLOSE`语句关闭游标。

**（4）注意事项**

使用游标时需注意以下问题：

**游标的性能问题**：由于游标需要逐条读取查询结果集中的数据，因此在处理大量数据时可能会引起性能问题。为了优化游标的性能，可以通过增加WHERE子句、使用索引和减少JOIN等方式来缩小查询结果集。

**游标的内存占用**：游标需要占用一定的内存空间，因此在处理大量数据时需要格外注意内存的占用情况。为避免内存溢出，可以通过设置游标缓存大小、使用LIMIT关键字和增加WHERE子句等方式来限制查询结果集的大小。

**游标的并发控制**：由于游标在处理数据时需要锁定查询结果集中的记录，因此在并发环境下需要格外注意对游标的并发控制。为避免死锁等问题，可以通过合理的锁机制和事务管理来保证游标的并发稳定性。
