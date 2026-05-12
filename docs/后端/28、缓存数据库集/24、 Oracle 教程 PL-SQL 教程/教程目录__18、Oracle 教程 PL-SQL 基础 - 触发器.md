# 18、Oracle 教程 PL/SQL 基础 - 触发器
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/18.html
- 分类：缓存数据库
- 分组：教程目录
**DML触发器**：当向一个特定的表插入、更新或者删除记录时可以触发DML触发器。可以在一个DML语句的执行之前或者之后触发；或者在语句每一行之前或者之后触发。可以有insert、update、merge或者delete语句触发，或者几种操作的组合。

- **before触发器**：在某个操作发生之前触发；
- **after触发器**：某个操作之后触发；
- **语句级别触发器**：由整个SQL语句触发的；
- **行级别触发器**：针对SQL语句执行过程中操作到的每一条记录；
- **伪记录NEW**：只能在更新和插入操纵的DML触发器中才能使用这个伪记录；这个记录包含的是被操作的行修改后的值；比如要获取操作的记录的name字段的值用:NEW.nema就可以了（注意前面有个冒号，但是在WHEN子句中不能加），OLD使用方法一样，这个只能针对一条记录；
- **伪记录OLD**：只有在更新和删除操作的DML触发器中才能使用这个伪记录；这个记录包含的是被操作的行修改前的值；
- **WHEN子句**：确定是否应该执行触发器代码；

**事务的参与：默认情况下，DML触发器会参与到触发它们的事务中：**

- 如果触发器发生了异常，这部分事务会回滚；
- 如果触发器本身也执行了DML语句，这个DML同时也会成为主事务中的一部分；
- 不能在DML触发器里执行COMMIT或者ROLLBACK语句；（除非定义为自治事务）

**1、** CREATE[ORREPLACE]TRIGGER[schema.]trigger_name；

**2、** {BEFORE|AFTER}；

**3、** {INSERT|DELETE|UPDATE|UPDATEOFcolumn_list}ONtable_name；

**4、** [FOREACHROW]；

**5、** [WHEN(...)]；

**6、** [DECLARE...]；

**7、** BEGIN；

**8、** ...executablestatements...；

**9、** [EXCEPTION...]；

**10、** END[trigger_name];；

行

说明

1

说明要指定一个触发器。

2

指明触发器的触发时机。

3

指明触发器应用的DML类型的组合：插入、更新、或者删除操作。

注意：对于update语句可以指定整个记录，或者指定一个用逗号分隔的列表，这些列可以用任意顺序排序。

这一行也指定了触发器应用的表。

记住：每个DML触发器只能针对一个表；

4

如果指定了FOR EACH ROW，则语句处理的每一条记录都会激活触发器。如果没有这句，缺省的行为是只为整个语句触发一次；

5

可选，这个语句可以指定触发的逻辑，从而避免不必要的执行；通常是配合NEW和OLD伪记录来判断。注意：

1）要把整个逻辑表达式用括号括起来；

2）不要在OLD和NEW之前加上“：”。

3）只能调用SQL的内置函数，不能调用用户自定义函数或者那些定义在内置包中的函数；

6

可选，如果不需要声明局部变量，那就不需要这句；

7

执行单元，必须

8

9

捕获执行单元抛出的异常

**NEW和OLD伪记录：**

每当触发行级触发器时，PL/SQL运行引擎会创建并填充两个数据，这个两个数据结构功能类似于记录。**OLD**保留的是要处理记录的原始值；**NEW**代表的是新的值。这些记录和使用该表的%ROWTYPE属性声明的记录结构完全相同；

规则：

- 如果为insert触发器，则OLD结构没有数据；
- 如果为upate触发器，则OLD代表的是更新之前的值，NEW代表的是更新成功执行后记录将要包含的值；
- 如果为delete触发器，NEW结构没有数据；
- NEW和OLD都包含ROWID位列；任何情况下，这个列在OLD和NEW中的值相同；
- 不能修改OLD结构中的字段，可以修改NEW结构中的字段；
- 如果在触发器中调用了其他函数或者过程，则不能把NEW和OLD两个结构作为记录参数传递。只能传递伪记录中的个别字段；
- 在触发器的匿名块中使用NEW和OLD结构时，必须在两个关键字前面加上冒号；
- 不能对NEW和OLD结构执行行记录级别操作；

**确定DML操作：**

- INSERTING：如果触发器是由对表的插入操作引起的，则返回true，否则返回false；
- UPDATEING：如果触发器是由对表更新操作引起的，则返回true，否则返回false；
- DELETEING：如果触发器是由对表删除操作引起的，则返回true，否则返回false；

这样，就可以在一个触发器中，包含所有的类型，然后判断：

```java
IF INSERTING HTEN...
```

**行级触发器**不应该去读取或者写导致它被触发表的内容（只针对行级触发器）。语句级触发器可以随意读写其触发表的内容。

如果触发器使用的是自治事务，就可以查询触发表的内容，但任然不能修改表的内容。

如果同一个操作有多个触发器，那么这些触发器的顺序可以用**FOLLOWS**来确定；

**复合触发器**，是把多种类型集合到一起，略。

**INSTEAD OF触发器**：控制的是对视图，而不是表的插入、更新、删除、合并操作。利用这种触发器可以让本来不可更新的视图变得可以更新，也可以对可更新视图的缺省行为方式进行重载。

**1、** CREATE[ORREPLACE]TRIGGERtrigger_name；

**2、** INTEADOFoperation；

**3、** ONview_name；

**4、** FOREACHROW；

**5、** BEGIN；

**6、** ...codegoeshere...；

**7、** END;；

行号

说明

1

指出要创建的触发器的名称

2

指定触发器的事件触发，通过在INSTEAD OF后面跟上一个INSERT、UPDATE、MERGE或者DELETE来完成；

3

触发器作用的视图的名字

4~7

标准的PL/SQL代码

**DDL触发器**：对数据库的对象的创建、修改或者删除的时候触发。开发的时候一般不用。

**禁用触发器：**

```java
ALTER TRIGGER trigger_name DISABLE;
```

**激活禁用的触发器：**

```java
ALTER TRIGGER emp_after_insert ENABLE;
```

**删除触发器：**

```java
DROP TRIGGER trigger_name
```

**查看数据库中的触发器：**有相关的视图：DBA_TRIGGERS(数据库中的全部触发器)、ALL_TRIGGERS(当前用户可见的全部触发器)、USER_TRIGGERS(属于当前用户的全部触发器)

**检查触发器的有效性：**

```java
select object_name, object_type, status from user_objects where object_name = 'test'
```

**触发器执行顺序：**

**1、** 首先被触发的将是前语句级触发器（beforestatementtrigger），该触发器会被执行一次；

**2、** 如果有行级的触发器则接下来执行前行级触发器（beforerowtrigger），行级触发器执行次数同SQL修改的记录次数一致；

**3、** 当SQL修改记录完成后会触发行级触发器，这时候行级触发器为后行级触发器（afterrowtrigger），该类型触发的次数同SQL修改修改记录的次数一致；

**4、** 执行一次语句级的触发器，此时的语句级触发器为后语句级触发器（afterstatementtrigger）；
