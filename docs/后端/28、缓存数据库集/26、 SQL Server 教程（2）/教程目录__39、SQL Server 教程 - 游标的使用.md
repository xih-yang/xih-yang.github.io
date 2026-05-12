# 39、SQL Server 教程 - 游标的使用
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/39.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 什么是游标；

游标是指针的一种结构，它包含结果集和结果集中指向记录的游标位置两部分，游标作为指针来遍历结果集（每次指向一行），游标是一个数据缓冲区，它存放了查询结果，而用户则可以利用SQL语句从这个缓冲区中提取数据。

游标可以完成以下的功能操作：

- 允许从当前行检索一行或多行数据。
- 允许操作当前行的数据，这也是最常用的游标使用方式。
- 可以定位在特定的行。

游标的主要作用是遍历查询的结果集，在遍历结果集的同时可以对游标所指向的记录进行数据操作，它的使用方式由固定的几个**步骤**来完成：

- 创建游标，游标在使用前必须创建，创建游标时允许定义相关的特性。
- 执行游标，利用查询语句来完成对游标的填充。
- 遍历结果集，当游标被数据填充后，可以利用命令来对游标中的数据进行遍历操作，也就是检索游标中的数据。
- 对检索当前行的数据进行操作，例如修改数据等。
- 关闭游标，对游标的操作完成后需要关闭游标，以释放相关资源。

**2、** 游标的创建；

## DECLARE CURSOR (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/declare-cursor-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/declare-cursor-transact-sql?view=sql-server-ver15)

```java
DECLARE cursor_name [ INSENSITIVE ] [ SCROLL ] CURSOR   
     FOR select_statement   
     [ FOR { READ ONLY | UPDATE [ OF column_name [ ,...n ] ] } ]  
[;]  
Transact-SQL Extended Syntax  
DECLARE cursor_name CURSOR [ LOCAL | GLOBAL ]   
     [ FORWARD_ONLY | SCROLL ]   
     [ STATIC | KEYSET | DYNAMIC | FAST_FORWARD ]   
     [ READ_ONLY | SCROLL_LOCKS | OPTIMISTIC ]   
     [ TYPE_WARNING ]   
     FOR select_statement   
     [ FOR UPDATE [ OF column_name [ ,...n ] ] ]  
[;]
```

- DECLARE:关键词，声明游标。
- cursor- name:创建的游标的名称。
- INSENSITIVE:表示创建的游标中的数据是基础表中的数据副本，该游标不允许修改，如果省略该关键词，那么从游标中提取的数据被修改后将作用在基础表中。
- SCROLL:表示游标的所有相关操作方式被允许，包括FIRST、LAST、NEXI'、RELATIVE等，如果省略该项，那么游标的操作将只有NEXT被允许，如果指定了
- FAST_FORWARD项，则SCROLL将不能被使用。
- select- statement:查询语句，用来提供游标结果集，该查询语句有一定的限制，不允许使用INTO、COMPUTE、COMPUTE BY等关键词。
- FOR:关键词。
- READ ONLY:表示游标只读，不允许通过游标来修改数据．
- UPDATE:表示指定游标可以修改的列，【OF colunuLname【，．．-n】】将指定具体允许被修改的列名，如果只有UPDATE关键词，则表示所有列都允许被更新。

```java
例    创建游标。
    要求查询表ATriTest中的数据，并允许修改查询结果中的每一条记录，利用游标来完成这
项操作，相关的脚本如下；
    USE AdventureWorks
    Go
    DECLARE ATriTest_Cusor SCROLL CURSOR    --创建游标
    FOR
    SELECT id,name
    FROM   dbo .ATriTest
```

**3、** 打开游标；

## OPEN (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/open-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/open-transact-sql?view=sql-server-ver15)

```java
OPEN { { [ GLOBAL ] cursor_name } | cursor_variable_name }
```

- OPEN:打开游标的关键词。
- GLOBAL:指定该游标是全局的游标，游标。
- cursor- name:指定打开游标的名称，GLOBAL来指定打开的对象。如果没有该项，则表示要打开的游标是局部的如果全局游标和局部游标名称相同，则需要GLOBAL来指定打开的对象。
- cursor_variable_name:表示一个游标变量的名称，这一项表示允许打开一个游标变量。

当游标被打开后，可以利用变量@ @CURSOR_ROWS来获得游标中记录数，该变量有4个返回值:

- -m:表示当前行数，游标被异步填充。
- -l:表示游标为动态游标，动态游标反映当前数据的更改情况，由于数据不断更改，因此此时游标不可能得到所有符合要求的数据。
- 0：此时表示没有符合要求的数据，游标没有打开或已经关闭释放资源。
- n：游标正常查询数据，月表示游标中的记录数。

**4、** 得到游标中的数据；

## FETCH (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/fetch-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/fetch-transact-sql?view=sql-server-ver15)

```java
FETCH   
          [ [ NEXT | PRIOR | FIRST | LAST   
                    | ABSOLUTE { n | @nvar }   
                    | RELATIVE { n | @nvar }   
               ]   
               FROM   
          ]   
{ { [ GLOBAL ] cursor_name } | @cursor_variable_name }   
[ INTO @variable_name [ ,...n ] ]
```

- FETCH：检索数据的关键词。
- NEXT;用来返回结果集当前行的下一行，是默认的提取项。
- PRIOR:返回结果集中当前行的前一行，需要说明的是，当从结果集中读取数据时，第一次使用该选项，将无记录返回。
- FIRST:指针返回游标中的第一行并将其作为当前行、．
- LAST:指针返回游标中的最后一行并将其作为当前行t
- ABSOLUTE { n I@nvar }：假如n或者@nvar参数为正，则表示返回从游标开始位置的第n行，并将第n行作为当前行。如果n或@nvar为负数，则返回从游标末尾开始的第n行，并将返回的这一行作为当前行。
- RELATIVE{（n |@nvar}．假如，n或@nvar为正数，则返回从当前行开始的第n行，并将返回行变成做为当前行。如果以或@nvar为负数，则返回当前行之前的第一行，并将返回行作为当前行。
- FROM:关键词。
- GLOBAL:指定游标为全局游标。
- cursor_ name；游标名称。
- @cursor_ variable_name:指游标变量名称。
- INTO：关键词，表示存入。
- @variable_name：变量，它们将接收提取的列数据，要求列表中的各个变量从左到右与游标结果集中的相应列相对应，要求变量的数据类型与相应的结果集列的数据类型匹配，或支持隐式的数据类型转换，除此之外，还要求变量的数量与游标选择列表中的列数相同。

**5、** 游标的关闭和遍历；

## CLOSE (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/close-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/close-transact-sql?view=sql-server-ver15)

```java
CLOSE { { [ GLOBAL ] cursor_name } | cursor_variable_name }
```

- CLOSE:关键词，表示关闭游标操作。
- GLOBAL:指明游标为全局游标，而不是局部游标。
- cursor_name：游标名称。
- cursor_variable_name：游标变量名称。

当利用FETCH NEXT遍历游标中的数据时，需要使用@@FETCH_STATUS全局变量检测FETCH操作的状态，这样就可以力便地得知数据是否已经到最后一行，是否操作成功。该变量具有以下几个返回值。

- 0：表示FETCH成功执行。
- -1：表示FETCH执行失败。
- 2：表示读取的数据已经不存在。

例遍历游标中的数据集。要求查询表ATriTest中的数据，并输出表中的所有记录。

```java
USE AdventureWorks
GO
DECLARE ATriTest_Cusor CURSOR       --声明创建游标
FOR
SELECT   id, name  FROM ATriTest    --游标绑定查询语句
ORDER BY id
OPEN ATriTest_Chsor                 --打开游标
DECLARE @Id INT, @Name VARCHAR(1O)  --声明变量
PRINT '游标结果集中的记录总数为:'+CAST(@@CURSOR_ROWS  AS  varchar (2))
FETCH  NEXT  FROM ATriTest_Cusor  INTO  @ID,@Name
--检查Check @@FETCH．STATUS变量，查看FETCH命令是否成功执行
WHILE @@FETCH_STATUS=0
BEGIN
  --输出当前行的记录
  PRINT 'ID: '+CAST(@ID AS char(4))+'姓名:'+@Name
  --定位到下—行的记录
  FETCH NEXT FROM ATriTest_Cusor INTO @ID,@Name
END --结束
CLOSE APriTest_Cusor       --关闭游标
DEALIDCATE ATriTest_Cusor  --释放
GO
```

**6、** 利用游标修改数据；

例修改游标中的数据。要求修改表ATriStudent中的数据，把name列中的数据后面都加上“_”

```java
USE AdventureWorks
GO
DECLARE ATriScudent_Cusor SCROLL CURSOR --声明创建游标
FOR
SELECT * FROM ATriStudent  --游标绑定查询语句
FOR UPDATE OF name         --允许更新的列
--ATriStudent中的原始记录
SELECT * FROM ATriStudent  
ORDER BY stunum
OPEN   ATriS tudent_Cusor       - -打开游标                                                                     
FETCH NEXT FROM ATriStudent_Cusor
--检查Check @@FETCFLSTATUS变量，查看FETCH命令是否成功执行
WHILE @@FETCFLSTATUS=O
BEGIN
UPDATE ATriStudent
SET  name=name+‘_’
WHERE CURRENT OF ATriStudent_Cusor
--定位到下—行的记录
FETCH NEXT FROM ATriStudent_Cusor
END  --结束
CLOSE ATriStudent_Cusor      --关闭游标
DEALLOCATE ATriStudent_Cusor --释放
--ATriTest表修改后的记录
SELECT * FROM ATriStudent
ORDER BY stunum
GO
```
