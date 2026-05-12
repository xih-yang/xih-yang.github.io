# 19、Oracle 教程 - Oracle undo 表空间的应用：闪回技术
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/19.html
- 分类：缓存数据库
- 分组：教程目录
为了使Oracle 数据库能够从任何逻辑操作中迅速恢复，Oracle 提供了闪回技术。在数据库发生逻辑错误的时候，闪回技术能提供快速且最小损失的恢复。大部分闪回技术都需要依赖回退段（rollback segment）中的原始数据。事务启动时，Oracle 会为其分配一个回退段。回退数据是反转 DML 语句结果所需的信息，只要某个事务修改了数据，那么更新前的原有数据就会被写入一个回退段。闪回技术包括以下几种：

（1）闪回数据库（Flashback Database）：使数据库迅速地回滚到以前的某个时间点或某个 SCN 值的状态；

（2）闪回删除（Flashback Drop）：类似于操作系统的回收站功能，可以恢复被 drop 的表或索引。该功能基于 undo 数据；

（3）闪回查询（Flashback Query）：查询过去某个时间点或某个 SCN 值时表中的数据；

（4）闪回版本查询（Flashback Version Query）：查询过去某个时间段或某个 SCN 段内表中数据的变化情况；

（5）闪回事务查询（Flashback Transaction Query）：查询某个事务或所有事务在过去一段时间对数据进行的修改；

（6）闪回表（Flashback Table）：将表恢复到过去的某个时间点或某个 SCN 值时的状态。

闪回技术的最大特点是实现自动备份与恢复，当 Oracle 数据库发生认为故障时，不需要实现备份数据库，就可以利用闪回技术快速进行恢复。为了使用数据库的闪回技术，必须启用 undo 表空间自动回退信息。如果要使用闪回删除技术和闪回数据库技术，还需要启用回收站和闪回恢复区。

## 一、闪回版本查询（Flashback Version Query）

闪回版本查询用于查询某段时间内对表的操作记录。闪回版本查询的语法格式如下：

```java
select colunm_name[,...]
from table_name
versions {
    between scn | timestamp exp | minvalue AND exp | timestamp
};
```

举例：

### 1、创建一张表，并进行数据修改

```java
SQL> create table emp_bak as select empno,ename,sal from emp where deptno=10;
Table created.
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	    2695
      7839 KING 	    5500
      7934 MILLER	    1430
SQL> update emp_bak set sal=sal*1.15;
3 rows updated.
SQL> commit;
Commit complete.
SQL> update emp_bak set sal=sal+200;
3 rows updated.
SQL> commit;
Commit complete.
SQL> update emp_bak set sal=sal*1.2;
3 rows updated.
SQL> commit;
Commit complete.
```

### 2、查询 empno 为 7782 的员工的 sal 的历史版本

```java
--说明：
-- versions_xid：事务号
-- versions_startscn：对该行数据进行改动时的起始 SCN
-- versions_endscn：下一次数据改动时的 SCN
-- versions_operation：表示对改行数据执行的操作，其值为 I、U、D，分别对应 insert、update 和 delete
SQL> select versions_startscn, versions_endscn,
     versions_operation, versions_xid,
     sal
     from emp_bak
     versions between scn minvalue and maxvalue
     where empno=7782;
VERSIONS_STARTSCN VERSIONS_ENDSCN V VERSIONS_XID	    SAL
----------------- --------------- - ---------------- ----------
	  2510519		      U 14000B00AE000000	3959.1
	  2510510	  2510519 U 0E001800B1000000	3299.25
	  2510500	  2510510 U 13000F00B4000000	3099.25
			     2510500			           2695
```

## 二、闪回查询（Flashback Query）

查询过去某个时间点或某个 SCN 值时表中的数据。闪回查询的语法格式如下：

```java
select column_name[,...] from table_name
as of scn | timestamp <ext>;
```

闪回查询是利用 UNDO 表空间的撤销数据，所以能把表闪回到多久之前受 undo_retention，UNDO 表空间的数据文件是否启动自动增长功能，是否设置 guarantee 等因素的影响：

```java
-- undo_retention 参数设置回退数据保存的时间
SQL> show parameter undo_retention;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_retention			     integer	 1800
--undo 表空间对应的数据文件是否能够自动扩展
SQL> select tablespace_name,autoextensible 
     from dba_data_files 
     where tablespace_name in (
         select tablespace_name 
         from dba_tablespaces 
         where contents = 'UNDO');
TABLESPACE_NAME 	       AUT
------------------------------ ---
UNDOTBS1		       YES
UNDOTBS2		       YES
UNDOTBS11		       YES
--undo 表空间的数据能否被提前覆盖
SQL> select tablespace_name,retention from dba_tablespaces where contents = 'UNDO';
TABLESPACE_NAME 	       RETENTION
------------------------------ -----------
UNDOTBS1		       NOGUARANTEE
UNDOTBS2		       NOGUARANTEE
UNDOTBS11		       NOGUARANTEE
```

举例：

### 1、查看数据库的当前 scn

```java
SQL> select current_scn from v$database;
CURRENT_SCN
-----------
    2589896
```

### 2、对表 e01 进行以下操作

```java
--查看 e01 表中的数据
SQL> select * from e01 where deptno=20;
     EMPNO ENAME	     SAL     DEPTNO
---------- ---------- ---------- ----------
      7369 SMITH	     800	 20
      7566 JONES	    2975	 20
      7788 SCOTT	    3000	 20
      7876 ADAMS	    1100	 20
      7902 FORD 	    3000	 20
--修改 e01，并提交
SQL> update e01 set sal=sal*1.2 where deptno=20;
5 rows updated.
SQL> commit;
Commit complete.
SQL> update e01 set sal=sal+500 where deptno=20;
5 rows updated.
SQL> commit;
Commit complete.
--查看 e01 表中的数据
SQL> select * from e01 where deptno=20;
     EMPNO ENAME	     SAL     DEPTNO
---------- ---------- ---------- ----------
      7369 SMITH	    1460	 20
      7566 JONES	    4070	 20
      7788 SCOTT	    4100	 20
      7876 ADAMS	    1820	 20
      7902 FORD 	    4100	 20
```

### 3、查询 e01 表的初始数据

```java
SQL> select * from e01 as of scn 2589896 where deptno=20;
     EMPNO ENAME	     SAL     DEPTNO
---------- ---------- ---------- ----------
      7369 SMITH	     800	 20
      7566 JONES	    2975	 20
      7788 SCOTT	    3000	 20
      7876 ADAMS	    1100	 20
      7902 FORD 	    3000	 20
```

### 4、使用闪回版本查询得到每次数据修改的 scn

```java
SQL> select versions_xid, versions_startscn, versions_endscn, versions_operation,
     ename,sal
     from e01
     versions between scn minvalue and maxvalue
     where deptno=20;
VERSIONS_XID	 VERSIONS_STARTSCN VERSIONS_ENDSCN V ENAME	       SAL
---------------- ----------------- --------------- - ---------- ----------
0B000400CC000000	   2590095		   U SMITH	      1460
0B000400CC000000	   2590095		   U JONES	      4070
0B000400CC000000	   2590095		   U SCOTT	      4100
0B000400CC000000	   2590095		   U ADAMS	      1820
0B000400CC000000	   2590095		   U FORD	      4100
0D001100D1000000	   2590089	   2590095 U FORD	      3600
0D001100D1000000	   2590089	   2590095 U ADAMS	      1320
0D001100D1000000	   2590089	   2590095 U JONES	      3570
0D001100D1000000	   2590089	   2590095 U SCOTT	      3600
0D001100D1000000	   2590089	   2590095 U SMITH	       960
					   2590089   SMITH	       800
					   2590089   JONES	      2975
					   2590089   SCOTT	      3000
					   2590089   ADAMS	      1100
					   2590089   FORD	      3000
15 rows selected.
```

### 5、查询 scn 为 2590089 时的数据

```java
SQL> select * from e01 as of scn 2590089 where deptno=20;
     EMPNO ENAME	     SAL     DEPTNO
---------- ---------- ---------- ----------
      7369 SMITH	     960	 20
      7566 JONES	    3570	 20
      7788 SCOTT	    3600	 20
      7876 ADAMS	    1320	 20
      7902 FORD 	    3600	 20
```

## 三、闪回事务查询（Flashback Transaction Query）

闪回事务查询会查询 FLASHBACK_TRANSACTION_QUERY 视图。FLASHBACK_TRANSACTION_QUERY 视图中的UNDO_SQL 列显示与事务中执行的 DML 语句在逻辑上相反的 SQL 语句。可以使用这些 SQL 语句来回退在事务中执行的逻辑步骤。

Flashback_transaction_query 视图的结构如下：

```java
SQL> desc Flashback_transaction_query;
 Name					   Null?    Type
 ----------------------------------------- -------- ----------------------------
 XID						    RAW(8)   --某个 DML 操作对应的事务号
 START_SCN					    NUMBER
 START_TIMESTAMP				DATE
 COMMIT_SCN					    NUMBER
 COMMIT_TIMESTAMP				DATE
 LOGON_USER					    VARCHAR2(30)
 UNDO_CHANGE#					NUMBER
 OPERATION					    VARCHAR2(32)
 TABLE_NAME					    VARCHAR2(256)
 TABLE_OWNER					VARCHAR2(32)
 ROW_ID 					    VARCHAR2(19)
 UNDO_SQL					    VARCHAR2(4000)  --某个 DML 操作对应的反向 SQL 语句
```

onnsys/password@

使用闪回事务查询之前，必须先启用重做日志流的其他日志记录。否则在使用视图 flashback_transaction_query 执行闪回事务查询时，operation 列的值为 unknown，并且 undo_sql 为空。

命令如下：

```java
--追加日志数据模式
SQL> alter database add supplemental log data;
Database altered.
```

只有sys 用户才能执行闪回事务查询，闪回事务查询的步骤如下：

### 1、修改表中数据

```java
--查询 emp_bak 表中的数据
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	  3959.1
      7839 KING 	    7830
      7934 MILLER	  2213.4
--修改工资并提交
SQL> update emp_bak set sal = sal+500;
3 rows updated.
SQL> commit;
Commit complete.
--插入新行并提交
SQL> insert into emp_bak values(1001,'TOM',4000);
1 row created.
SQL> commit;
Commit complete.
--删除行并提交
SQL> delete from emp_bak where sal<4000;
1 row deleted.
SQL> commit;
Commit complete.
--查询表中的数据
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	  4459.1
      7839 KING 	    8330
      1001 TOM		    4000
```

### 2、执行闪回版本查询确定要恢复的数据以及事务号（xid）

```java
SQL> select versions_startscn, versions_endscn, versions_operation, versions_xid,
     empno, ename, sal
     from emp_bak
     versions between scn minvalue and maxvalue;
VERSIONS_STARTSCN VERSIONS_ENDSCN V VERSIONS_XID	  EMPNO ENAME		  SAL
----------------- --------------- - ---------------- ---------- ---------- ----------
	  2629357		      D 0C000F00CD000000	   7934 MILLER	      2713.4
	  2629282	  2629357  U 0E001C00CC000000	   7934 MILLER	       2713.4
	  2629282		      U 0E001C00CC000000	   7839 KING		  8330
	  2629282		      U 0E001C00CC000000	   7782 CLARK	      4459.1
			     2629282			              7782 CLARK	     3959.1
			     2629282			              7839 KING		     7830
			     2629282			              7934 MILLER	     2213.4
	  2629321		      I 10001500CD000000	   1001 TOM		      4000
8 rows selected.
```

### 3、查询某个事务对应的 SQL 语句

```java
--查询事务号 0E001C00CC000000 对应的 SQL 语句
SQL> select table_owner, operation, undo_sql from flashback_transaction_query
     where xid='0E001C00CC000000';
TABLE_OWNER	     OPERATION		  UNDO_SQL
-------------------- -------------------- --------------------------------------------
SCOTT	 UPDATE	 update "SCOTT"."EMP_BAK" set "SAL" = '2213.4' where ROWID = 'AAAVbCAAEAAAADjAAC';
SCOTT	 UPDATE	 update "SCOTT"."EMP_BAK" set "SAL" = '7830' where ROWID = 'AAAVbCAAEAAAADjAAB';
SCOTT	 UPDATE	 update "SCOTT"."EMP_BAK" set "SAL" = '3959.1' where ROWID = 'AAAVbCAAEAAAADjAAA';
		     BEGIN
--查询事务号 10001500CD000000 对应的 SQL 语句
SQL> select table_owner, operation, undo_sql from flashback_transaction_query
     where xid='10001500CD000000';
TABLE_OWNER	     OPERATION		  UNDO_SQL
-----------------------------------------------------------------------------------------
SCOTT	 INSERT	  delete from "SCOTT"."EMP_BAK" where ROWID = 'AAAVbCAAEAAAADkAAA';
		     BEGIN
--查询事务号 0C000F00CD000000 对应的 SQL 语句
SQL> select table_owner, operation, undo_sql from flashback_transaction_query
     where xid='0C000F00CD000000';
TABLE_OWNER	     OPERATION		  UNDO_SQL
------------------------------------------------------------------------------------------
SCOTT	DELETE	insert into "SCOTT"."EMP_BAK"("EMPNO","ENAME","SAL") values ('7934','MILLER','2713.4');
		     BEGIN
```

### 4、执行某个事务对应的 SQL 语句恢复数据

例如：执行事务号 0C000F00CD000000 对应的 SQL 语句可以恢复被删除的记录。

```java
--查询表中的数据
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	  4459.1
      7839 KING 	    8330
      1001 TOM		    4000
--执行事务号 0C000F00CD000000 对应的 SQL 语句
SQL> insert into "SCOTT"."EMP_BAK"("EMPNO","ENAME","SAL") values ('7934','MILLER','2713.4');
1 row created.
--查询表中的数据
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	  4459.1
      7839 KING 	    8330
      1001 TOM		    4000
      7934 MILLER	  2713.4
```

## 四、闪回删除

闪回删除技术用于恢复已经被用户删除（Drop）的数据库对象，需要使用到 Oracle 中的回收站机制。如果在执行 drop table 命令时加上 purge，则永久删除表，无法恢复。

每个用户都有一个回收站，回收站是一个逻辑结构，它不是一块独立的存储空间，存在于当前表空间内。所以，如果有别的操作需要空间，比如需要创建一张表，没有足够空间可用，回收站中的数据就会被清理，这也是导致闪回删除失败的原因。

### 1、禁用和启用回收站

Oracle 中的回收站默认是启用的。如果回收站处于禁用（off）状态，则被删除的数据库对象无法保存到回收站中，只能时彻底删除。可以通过设置初始化参数 recyclebin 的值修改回收站的状态，语法如下：

```java
alter system set recyclebin = on | off;
```

查看回收站的状态：

```java
SQL> show parameter recyclebin
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
recyclebin			     string	 on
```

### 2、查看回收站中的信息

### （1）普通用户

```java
SQL> show user;
USER is "SCOTT"
SQL> drop table t1;
Table dropped.
SQL> drop table e02;
Table dropped.
--使用 show recyclebin 命令
SQL> show recyclebin;
ORIGINAL NAME	 RECYCLEBIN NAME		OBJECT TYPE  DROP TIME
---------------- ------------------------------ ------------ -------------------
E02		 BIN$yhknc+Z2GGzgUwwBqMAQFg==$0 TABLE	     2021-08-22:05:06:29
T1		 BIN$yhknc+Z1GGzgUwwBqMAQFg==$0 TABLE	     2021-08-22:05:06:16
--使用数据字典：user_recyclebin
SQL> select object_name, ORIGINAL_NAME,type from user_recyclebin;
OBJECT_NAME		       ORIGINAL_NAME           TYPE
---------------------------------------------------------------------------
BIN$yhknc+Z1GGzgUwwBqMAQFg==$0 T1              TABLE
BIN$yhknc+Z2GGzgUwwBqMAQFg==$0 E02             TABLE
BIN$yhknc+Z0GGzgUwwBqMAQFg==$0 SYS_C0011089    INDEX
--直接查询当前用户所拥有的表也能看到被删除的表
SQL> select * from tab;
TNAME			       TABTYPE	CLUSTERID
------------------------------ ------- ----------
BIN$yhknc+Z1GGzgUwwBqMAQFg==$0 TABLE
BIN$yhknc+Z2GGzgUwwBqMAQFg==$0 TABLE
BONUS			       TABLE
DEPT			       TABLE
E01			           TABLE
EMP			           TABLE
EMP_BAK 		       TABLE
SALGRADE		       TABLE
TS_001			       TABLE
9 rows selected.
```

### （2）管理员

```java
SQL> select owner,object_name,original_name from dba_recyclebin;
OWNER		OBJECT_NAME                             ORIGINAL_NAME            TYPE
-------------------------------------------------------------- ------------------------------
SCOTT		BIN$yhknc+Z1GGzgUwwBqMAQFg==$0            T1                     TABLE
SCOTT		BIN$yhknc+Z2GGzgUwwBqMAQFg==$0            E02                    TABLE
SCOTT		BIN$yhknc+Z0GGzgUwwBqMAQFg==$0            SYS_C0011089           INDEX
```

### 3、使用闪回删除恢复被删除（Drop）的表

闪回删除的语法如下：

```java
Flashback table table_name 
to before drop [rename to new_table_name];
/*说明：
table_name：可以使用表的原名，也可以使用在再回收站中的名称。如果表的原名相同，则在使用原名进行闪回删除操作时，默认还原最近一次删除的表。表被还原后，默认情况下使用原名，如果该名称已经存在，则需要在还原该表时对其重命名，此时，需要使用 rename to 子句。
*/
```

举例：

```java
--创建表 t0001
SQL> create table t0001(id int);
Table created.
SQL> insert into t0001 values (1);
1 row created.
SQL> commit;
Commit complete.
SQL> select * from t0001;
	ID
----------
	 1
--删除表 t0001
SQL> drop table t0001;
Table dropped.
--闪回删除
SQL> flashback table t0001 to before drop rename to ts_001;
Flashback complete.
SQL> select * from ts_001;
	ID
----------
	 1
```

### 4、清除回收站中的对象

使用purge 命令，语法如下：

```java
purge {
[table table_name | index index_name] |
[recyclebin | dba_recyclebin]
};
/*说明：
purge table table_name：彻底删除某个表
purge recyclebin：清空回收站
*/
```

举例：

### （1）查看回收站信息

```java
SQL> show recyclebin;
ORIGINAL NAME	 RECYCLEBIN NAME		OBJECT TYPE  DROP TIME
---------------- ------------------------------ ------------ -------------------
E02		 BIN$yhknc+Z2GGzgUwwBqMAQFg==$0 TABLE	     2021-08-22:05:06:29
T1		 BIN$yhknc+Z1GGzgUwwBqMAQFg==$0 TABLE	     2021-08-22:05:06:16
```

### （2）彻底删除表 t1

```java
SQL> purge table t1;
Table purged.
SQL> show recyclebin;
ORIGINAL NAME	 RECYCLEBIN NAME		OBJECT TYPE  DROP TIME
---------------- ------------------------------ ------------ -------------------
E02		 BIN$yhknc+Z2GGzgUwwBqMAQFg==$0 TABLE	     2021-08-22:05:06:29
```

### （3）清空回收站

```java
SQL> purge recyclebin;
Recyclebin purged.
SQL> show recyclebin;
```

## 五、闪回表

实质上是将表中的数据恢复的指定的时间点（timestamp）或 scn，并将自动恢复索引、触发器和约束等属性，同时数据库保持联机。闪回表操作使用 Flashback table 语句，语法如下：

```java
Flashback table [schema.]table_name to { {scn | timestamp} <exp>
    [{
    enable | disable} triggers]
};
/*说明：
schema：模式名
table_name：表名
scn <exp>：指定要恢复的 scn 号
timestamp <exp>：指定要恢复的时间
enable trigger：与表相关的触发器恢复后，默认为启用状态
disable trigger（默认选项）：与表相关的触发器恢复后，默认为禁用状态
*/
```

执行闪回表操作之前需要启用表的行移动功能，语法如下：

```java
alter table 表名 enable row movement;
```

闪回表可能会失败，原因有可能有以下几种情况：

（1）违反了数据库约束：比如用户不小心删除了子表中的数据，现在想利用闪回表技术进行回退，但父表中与该数据对应的记录也被删除了，由于违反了外键约束，导致闪回表操作失败；

（2）撤销数据失效：比如用于闪回操作的撤销数据被覆盖了，这种情况闪回表操作会失败；

（3）闪回不能跨越DDL：即在闪回点和当前点之间，表结构有过变更，这种情况闪回操作也会失败。

注意：闪回表功能都是基于撤销数据的，而撤销数据是会被重写的。因此，在使用闪回功能去恢复数据的时候，最短时间发现错误，第一时间执行闪回操作，才能最大程度地保证闪回功能的成功。

闪回表操作步骤如下：

### 1、修改 emp_bak 表中的数据

```java
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	 5850.92
      7839 KING 	   10496
      1001 TOM		    5300
SQL> update emp_bak set sal=sal*1.2;
3 rows updated.
SQL> commit;
Commit complete.
SQL> update emp_bak set sal=sal+500;
3 rows updated.
SQL> commit;
Commit complete.
SQL> insert into emp_bak values(3003,'Wang',3800);
1 row created.
SQL> commit;
Commit complete.
SQL> delete from emp_bak where sal>10000;
1 row deleted.
SQL> commit;
Commit complete.
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	  7521.1
      1001 TOM		    6860
      3003 Wang 	    3800
```

### 2、启用表 emp_bak 的行移动功能

```java
SQL> alter table emp_bak enable row movement;
Table altered.
```

### 3、使用闪回版本查询查看员工号 1001 的员工工资数据的修改历史

```java
SQL> select versions_startscn, versions_endscn, versions_operation, sal
     from emp_bak
     versions between scn minvalue and maxvalue
     where empno=1001;
VERSIONS_STARTSCN VERSIONS_ENDSCN V	   SAL
----------------- --------------- - ----------
	  2637179		  U	  6860
	  2637138	  2637179 U	  6360
	  2636727	  2637138 U	  5300
			      2636727	  4000
```

### 4、把表中数据恢复到 1001 号员工工资为 5300 的状态

当员工工资为 5300 时，scn 号为 2636727–2637137，使用以下命令：

```java
SQL> Flashback table emp_bak to scn 2636727;
Flashback complete.
```

### 5、查看表中的数据

```java
SQL> select * from emp_bak;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7782 CLARK	 5850.92
      7839 KING 	   10496
      1001 TOM		    5300
```

## 六、闪回数据归档（Flashback Data Archive ）

闪回查询对撤销数据及参数 undo_retention 的依赖注定了它们在大事务量的情况下闪回时间窗口会很小，想要查询数月之前的数据绝对不可能。闪回数据归档可使数据具有回退到过去任何时间点的能力。

闪回数据归档的工作原理是将原本只能保存在 UNDO 表空间的撤销数据保存在指定的普通表空间（permanent 类型的表空间）中。闪回数据归档可以只为特定的表服务，这样就可以长时间地保存一些重要的数据。

闪回数据归档可以和日志归档类比，日志归档记录的是 Redo 的历史状态，用于保证恢复的连续性。而闪回归档记录的是 UNDO 的历史状态，可用于对数据进行闪回追溯查询。后台进程 LGWR 用于将 Redo 信息写出到日志文件，ARCH 进程负责进行日志归档；在 Oracle11g，新增的后台进程 FBDA（Flashback Data Archiver Process）则用于对闪回数据进行归档写出。

创建闪回数据归档的步骤如下：

### 1、创建保存闪回数据归档的表空间，也可以使用已经存在的表空间

```java
SQL> create tablespace undo_archive 
     datafile '+DATA/orcl/datafile/undo_archive.dbf' size 50m autoextend on next 50m;
Tablespace created.
```

### 2、创建一个保留时间为 2 年的闪回归档

```java
SQL> create flashback archive undo_data_archive tablespace undo_archive retention 2 year;
Flashback archive created.
```

### 3、为某个用户（比如：scott）用户下的 emp 表启用闪回归档

### （1）赋予用户归档（flashback archive）的权限

```java
SQL> grant flashback archive on undo_data_archive to scott;
Grant succeeded.
```

### （2）使用 scott 用户登录数据库，为 emp 表启用闪回归档

```java
SQL> conn scott/tiger
Connected.
SQL> alter table emp flashback archive undo_data_archive;
Table altered.
```

## 七、闪回数据库

闪回数据库能够使数据库迅速回滚到以前的某个时间点或者某个 SCN 上。闪回数据库之后，闪回点之后的所有操作会丢失，相当于数据库的不完整恢复。因此，只能以 resetlogs 模式打开数据库。

闪回数据库的工作原理：闪回数据库不使用撤销数据，使用另外一种机制来保留回退所需要的恢复数据。当启用闪回数据库，发生变化的数据块会不断从数据库缓冲区缓存中复制到闪回缓冲区。然后，恢复写入器（Recovery Writer）后台进程会将这些数据刷新到磁盘中的闪回日志（Flashback_logs）文件中。

闪回数据库的结构由 RVWR 后台进程和闪回数据库日志（Flashback_logs）组成。如果要启动闪回数据库功能，RVWR 进程要先启动。闪回数据库日志是一种新的日志文件类型，闪回恢复区是闪回数据库的先决条件，因为 RVWR 进程要将闪回日志写入闪回恢复区。因此，在使用闪回数据库功能时，必须先配置闪回恢复区。

首先，在 SGA 中分配一些内存并在磁盘上分配一些空间来存储闪回数据，同时启动 RVWR 后台进程来记录闪回日志（Flashback_logs）。此进程会将闪回缓冲区内容刷新到磁盘和闪回日志，LGWR 进程会将日志缓冲区刷新到磁盘。闪回日志记录是此操作的附属物。

与重做日志不同的是，闪回日志不是记录变化的日志，而是记录完整块映像的日志。闪回日志不同于重做日志，它不能多路复用和归档闪回日志，它们是自动创建和管理的。当执行闪回时，Oracle 会使用闪回日志将数据库及时回退到期望的时间之前的某个时间点，然后按照不完整恢复中的常规方式应用重做日志（最大限度的使用归档重做日志文件和联机重做日志文件），以便将数据文件前滚到希望的确切时间。

闪回的过程，则是一个提取闪回日志 --> 将块映像复制回数据文件的过程。

闪回数据库（Flashback database architecture）架构如下：

开启闪回数据库功能之后，会在 SGA中 开辟内存 Flashback buffer，记录 buffer cache 中的部分改变然后后台恢复写入进程 RVWR 将记录写入闪回日志 Flashback logs 中。FBDA（Flashback Data Archive）进程则会将 Flashback logs 进行归档。这个过程和重做日志类似。

配置闪回数据库（闪回数据库要求数据库为归档模式）的步骤如下：

### 1、查看数据库是否为归档模式

归档日志模式是启用闪回数据库的先决条件，可通过查询 V$DATABASE 视图或 ARCHIVE LOG LIST 命令来确认。

```java
--数据库已经处于归档模式
SQL> select log_mode from v$database;
LOG_MODE
------------
ARCHIVELOG
SQL> archive log list;
Database log mode	       Archive Mode
Automatic archival	       Enabled
Archive destination	       +BAK
Oldest online log sequence     84
Next log sequence to archive   87
Current log sequence	       87
```

打开或关闭归档模式的方法：首先启动数据库到 mount 状态，然后执行如下命令：

```java
-- 打开归档模式
alter database archivelog;
-- 关闭归档模式
alter database noarchivelog;
```

### 2、指定闪回恢复区，也就是存放闪回日志的位置

Oracle 的很多备份恢复技术都会用到闪回恢复区，比如控制文件的自动备份等会存放到此区域。

查看闪回恢复区的位置、大小：

```java
SQL> show parameter recover;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_recovery_file_dest		    string	     +BAK   --闪回恢复区的位置
db_recovery_file_dest_size	     big integer 4407M   --闪回恢复区的大小
db_unrecoverable_scn_tracking	 boolean	 TRUE
recovery_parallelism		     integer	 0
```

修改闪回恢复区的位置使用如下命令：

```java
alter system set db_recovery_file_dest ='...';
```

修改闪回恢复区的大小使用如下命令：

```java
alter system set db_recovery_file_dest_size = 8G; 
```

### 3、设置闪回保留目标时间

该时间通过 DB_FLASHBACK_RETENTION_TARGET 初始化参数来控制，单位是分钟，其默认值是 1 天。闪回日志空间以循环方式重用，更新的数据将覆盖旧数据。该参数指示 Oracle 在重用之前保存闪回数据的分钟数。

```java
SQL> show parameter flashback
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_flashback_retention_target	     integer	 1440
```

指定闪回日志保留时间为 2 小时：

```java
SQL> alter system set db_flashback_retention_target=120; 
System altered.
```

### 4、正常停库，然后重新启动数据库到 mount 状态

```java
--正常停库
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
--重新启动数据库到 mount 状态
SQL> startup mount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  570428496 bytes
Database Buffers	  260046848 bytes
Redo Buffers		    2371584 bytes
Database mounted.
```

### 5、启用闪回数据库

```java
SQL> alter database flashback on;
Database altered.
```

### 6、打开数据库，查看数据库状态

```java
SQL> alter database open;
Database altered.
SQL> select dbid, name, flashback_on, current_scn from v$database;
      DBID NAME      FLASHBACK_ON	CURRENT_SCN
---------- --------- ------------------ -----------
1598252726 ORCL      YES		    2772117
```

### 7、对数据库中的数据进行修改

```java
SQL> conn scott/tiger;
Connected.
SQL> select * from tab;
TNAME			       TABTYPE	CLUSTERID
------------------------------ ------- ----------
BONUS			       TABLE
DEPT			       TABLE
E01			       TABLE
EMP			       TABLE
EMP_BAK 		       TABLE
SALGRADE		       TABLE
SYS_TEMP_FBT		       TABLE
TS_001			       TABLE
8 rows selected.
SQL> create table t1(id int primary key,name char(20));
Table created.
SQL> insert into t1 values(1,'Jack');
1 row created.
SQL> insert into t1 values(2,'Mark');
1 row created.
SQL> drop table e01 purge;
Table dropped.
SQL> drop table emp_bak purge;
Table dropped.
SQL> commit;
Commit complete.
```

### 8、闪回数据库

### （1）正常停库

```java
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
```

### （2）启动数据库到 mount

```java
SQL> startup mount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  570428496 bytes
Database Buffers	  260046848 bytes
Redo Buffers		    2371584 bytes
Database mounted.
```

### （3）闪回数据库到 scn：2772117

```java
SQL> Flashback database to scn 2772117;
Flashback complete.
```

### （4）使用 resetlogs 参数打开数据库

```java
SQL> alter database open resetlogs;
Database altered.
```

### （5）查看数据

```java
SQL> select * from tab;
TNAME			       TABTYPE	CLUSTERID
------------------------------ ------- ----------
BONUS			       TABLE
DEPT			       TABLE
E01			           TABLE
EMP			           TABLE
EMP_BAK 		       TABLE
SALGRADE		       TABLE
SYS_TEMP_FBT	        TABLE
TS_001			       TABLE
8 rows selected.
```
