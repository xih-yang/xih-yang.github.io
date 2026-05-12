# 02、Oracle 基础教程 - Oracle数据字典
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/2.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 什么是Oracle数据字典

数据字典（Data Dictionary）是Oracle元数据（Metadata）的存储地点，汇集了数据库对象及数据库运行时需要的基础信息。Oracle RDBMS使用数据字典记录和管理对象信息和安全信息，用户可以通过数据字典获取数据库相关信息，从而进行数据库管理、优化和维护工作。

## 2. 数据字典的内容

数据字典包括以下内容：

> 所有数据库Schema对象的定义（表、视图、索引、聚簇、同义词、序列、过程、函数、包、触发器等）；

> Oracle用户名称、角色、权限等信息；

> 完整性约束信息；

> 数据库的空间分配和使用情况；

> 字段缺省值；

> 审计信息；

> 其他数据库信息。

Oracle字典包括四个层次，分别为内部RDBMS表（X ）、基础数据字典表、数据字典视图和动态性能视图（ V ）、基础数据字典表、数据字典视图和动态性能视图（V ）、基础数据字典表、数据字典视图和动态性能视图（V）。

**（1）X$表**

X$表是Oracle数据库的核心部分，用于跟踪内部数据库信息，维持数据库正常运行，在数据库启动时由Oracle应用程序动态创建，不允许SYSDBA之外的用户直接访问。X$表是加密命名的且不作文档说明。Oracle通过X$建立起其他大量视图，供用户查询管理数据库之用。

**（2）数据字典表、数据字典视图**

数据字典表（Data Dictionary Table）用以存储表、索引、约束以及其他数据库结构的信息，

表名都用$结尾（如tab$、obj$、ts$等），在创建数据库的时候通过运行`sql.bsq`（`$ORACLE_HOME/RDBMS/admin`目录下）脚本来创建。

数据字典表的用户都是sys，存在在system这个表空间里，Oracle对这些数据字典都分别建立了数据字典视图，Oracle针对这些对象的范围，分别把视图命名为**DBA_XXXX**， **ALL_XXXX**和**USER_XXXX**，dictionary视图记录了所有的数据字典视图的名称。

- user_类视图：描述了当前用户schema下的对象；
- all_类视图：描述了当前用户有权限访问到的所有对象的信息；
- dba_类视图：包括了所有数据库对象的信息；

通常USER_类视图不包含Owner字段，查询返回当前用户的对象信息。

**e.g.**

```java
SQL> select username from all_users; //查询所有用户
SQL> select username from dba_users; //查询dba用户
SQL> select table_name from user_tables;  //查询当前用户的表
SQL> select table_name from all_tables;  //查询所有用户的表
SQL> select table_name from dba_tables;  //查询包括系统表
SQL> select owner，constraint_name，constraint_type，table_name from user_constraints; 
SQL> select owner，constraint_name，constraint_type，table_name from all_ constraints; 
SQL> select owner，constraint_name，constraint_type，table_name from dba_ constraints ;
```

**（3）动态性能视图**

动态性能（V$）视图（Dynamic Performance View）记录了数据库运行时的信息和统计数据。

创建X$表之后，Oracle创建了GV$和V$视图，在GV$和V$之后，Oracle建立了GV_$和V_$视图，随后为这些视图建立了公共同义词。这些工作都是通过`catalog.sql`脚本实现的。通过V_$视图，Oracle把V$视图和普通用户隔离，V_$视图的权限可以授予其他用户，而Oracle不允许任何对于V$视图的直接授权。Oracle提供了一些特殊视图用以记录其他视图创建方式，如v$fixed_view_defition，可以查看视图的定义。

```java
SQL> select view_definition from v\$fixed_view_definition where view_name ='V$NLS_PARAMETERS';
```

## 3. 数据字典应用示例

**（1）查询表的信息**

查询**DBA_TABLES视图**可以获取所有表的信息，包括表名、表空间、拥有者等等。例如，以下查询语句可以获取所有表的表名和表空间：

```java
SQL> SELECT table_name, tablespace_name FROM dba_tables;
```

**（2）查询索引的信息**

查询**DBA_INDEXES视图**可以获取所有索引的信息，包括索引名、所属表、索引类型等等。例如，以下查询语句可以获取所有索引的信息：

```java
SQL> SELECT index_name, table_name, index_type FROM dba_indexes;
```

**（3）查询用户的信息**

查询DBA_USERS视图可以获取所有用户的信息，包括用户名、默认表空间、临时表空间等等。例如，以下查询语句可以获取所有用户的用户名和默认表空间：

```java
SQL> SELECT username, default_tablespace FROM dba_users;
```

**（4）查询表空间的信息**

查询DBA_TABLESPACES视图可以获取所有表空间的信息，包括表空间名、块大小、状态等等。例如，以下查询语句可以获取所有表空间的表空间名和状态：

```java
SQL> SELECT tablespace_name, status FROM dba_tablespaces;
```

**（5）查询数据文件的信息**

查询DBA_DATA_FILES视图可以获取所有数据文件的信息，包括数据文件名、表空间名、文件大小等等。例如，以下查询语句可以获取所有数据文件的数据文件名和文件大小：

```java
SQL> SELECT file_name, bytes FROM dba_data_files;
```

**（6） 查询数据库的性能数据**

查询DBA_HIST_SNAPSHOT视图可以获取数据库的历史性能数据，包括CPU利用率、内存利用率、I/O等等。例如，以下查询语句可以获取数据库的CPU利用率和内存利用率：

```java
SQL> SELECT begin_interval_time, end_interval_time, cpu_usage, memory_usage
FROM dba_hist_sysmetric_summary
WHERE metric_name IN ('CPU Usage Per Sec', 'Memory Usage Per Sec')
ORDER BY begin_interval_time;
```
