# 04、Hive 实战 - Hive的DDL数据定义
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/4.html
- 分类：大数据框架
- 分组：教程目录
## 1. 创建数据库

```java
CREATE DATABASE [IF NOT EXISTS] database_name
[COMMENT database_comment]
[LOCATION hdfs_path]
[WITH DBPROPERTIES (property_name=property_value, ...)];
```

1）创建一个数据库，数据库在HDFS上的默认存储路径是/user/hive/warehouse/*.db

```java
hive (default)> create database db_hive;
```

2）避免要创建的数据库已经存在错误，增加if not exists判断。（标准写法）

```java
hive (default)> create database db_hive;
FAILED: Execution Error, return code 1 from org.apache.hadoop.hive.ql.exec.DDLTask. Database db_hive already exists
hive (default)> create database if not exists db_hive;
```

3）创建一个数据库，指定数据库在HDFS上存放的位置

```java
hive (default)> create database db_hive2 location '/db_hive2.db';
```

## 2. 查询数据库

### 2.1. 显示数据库

1）显示数据库

```java
hive> show databases;
```

2）过滤显示查询的数据库

```java
hive> show databases like 'db_hive*';
OK
db_hive
db_hive_1
```

### 2.2. 查看数据库详情

1）显示数据库信息

```java
hive> desc database db_hive;
OK
db_hive		hdfs://hadoop102:9820/user/hive/warehouse/db_hive.db	rootUSER	
```

2）显示数据库详细信息，extended

```java
hive> desc database extended db_hive;
OK
db_hive		hdfs://hadoop102:9820/user/hive/warehouse/db_hive.db	rootUSER	
```

### 2.3. 切换当前数据库

```java
hive (default)> use db_hive;
```

## 3. 修改数据库

用户可以使用ALTER DATABASE命令为某个数据库的DBPROPERTIES设置键-值对属性值，来描述这个数据库的属性信息。

```java
hive (default)> alter database db_hive set dbproperties('createtime'='20170830');
```

在hive中查看修改结果

```java
hive> desc database extended db_hive;
db_name comment location        owner_name      owner_type      parameters
db_hive         hdfs://hadoop102:9820/user/hive/warehouse/db_hive.db    root USER    {createtime=20170830}
```

## 4. 删除数据库

1）删除空数据库

```java
hive>drop database db_hive2;
```

2）如果删除的数据库不存在，最好采用 if exists判断数据库是否存在

```java
hive> drop database db_hive;
FAILED: SemanticException [Error 10072]: Database does not exist: db_hive
hive> drop database if exists db_hive2;
```

3）如果数据库不为空，可以采用cascade命令，强制删除

```java
hive> drop database db_hive;
FAILED: Execution Error, return code 1 from org.apache.hadoop.hive.ql.exec.DDLTask. InvalidOperationException(message:Database db_hive is not empty. One or more tables exist.)
hive> drop database db_hive cascade;
```

## 5. 创建表

1）建表语法

```java
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] table_name
[(col_name data_type [COMMENT col_comment], ...)]
[COMMENT table_comment]
[PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)]
[CLUSTERED BY (col_name, col_name, ...)
[SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS]
[ROW FORMAT row_format]
[STORED AS file_format]
[LOCATION hdfs_path]
[TBLPROPERTIES (property_name=property_value, ...)]
[AS select_statement]
```

2）字段解释说明

- CREATE TABLE 创建一个指定名字的表。如果相同名字的表已经存在，则抛出异常；用户可以用 IF NOT EXISTS 选项来忽略这个异常。
- EXTERNAL关键字可以让用户创建一个外部表，在建表的同时可以指定一个指向实际数据的路径（LOCATION），在删除表的时候，内部表的元数据和数据会被一起删除，而外部表只删除元数据，不删除数据。
- COMMENT：为表和列添加注释。
- PARTITIONED BY创建分区表
- CLUSTERED BY创建分桶表
- SORTED BY不常用，对桶中的一个或多个列另外排序
- ROW FORMAT

```java
DELIMITED [FIELDS TERMINATED BY char] [COLLECTION ITEMS TERMINATED BY char]
        [MAP KEYS TERMINATED BY char] [LINES TERMINATED BY char]
   | SERDE serde_name [WITH SERDEPROPERTIES (property_name=property_value, property_name=property_value, ...)]
```

> 用户在建表的时候可以自定义SerDe或者使用自带的SerDe。如果没有指定ROW FORMAT 或者ROW FORMAT DELIMITED，将会使用自带的SerDe。在建表的时候，用户还需要为表指定列，用户在指定表的列的同时也会指定自定义的SerDe，Hive通过SerDe确定表的具体的列的数据。
>
> SerDe是Serialize/Deserilize的简称， hive使用Serde进行行对象的序列与反序列化。

- STORED AS指定存储文件类型

> 常用的存储文件类型：SEQUENCEFILE（二进制序列文件）、TEXTFILE（文本）、RCFILE（列式存储格式文件）
>
> 如果文件数据是纯文本，可以使用STORED AS TEXTFILE。如果数据需要压缩，使用STORED AS SEQUENCEFILE。

- LOCATION ：指定表在HDFS上的存储位置。
- AS：后跟查询语句，根据查询结果创建表。
- LIKE允许用户复制现有的表结构，但是不复制数据。

### 5.1. 管理表

1）理论

> 默认创建的表都是所谓的管理表，有时也被称为内部表。因为这种表，Hive会（或多或少地）控制着数据的生命周期。Hive默认情况下会将这些表的数据存储在由配置项hive.metastore.warehouse.dir(例如，/user/hive/warehouse)所定义的目录的子目录下。
>
> 当我们删除一个管理表时，Hive也会删除这个表中数据。管理表不适合和其他工具共享数据。

2）案例实操

- 原始数据

```java
1001	ss1
1002	ss2
1003	ss3
1004	ss4
1005	ss5
1006	ss6
1007	ss7
1008	ss8
1009	ss9
1010	ss10
1011	ss11
1012	ss12
1013	ss13
1014	ss14
1015	ss15
1016	ss16
```

- 普通创建表

```java
create table if not exists student(
    id int, 
    name string
)
row format delimited fields terminated by '\t'
stored as textfile
location '/user/hive/warehouse/student';
```

- 根据查询结果创建表（查询的结果会添加到新创建的表中）

```java
create table if not exists student2 as select id, name from student;
```

- 根据已经存在的表结构创建表

```java
create table if not exists student3 like student;
```

- 查询表的类型

```java
hive (default)> desc formatted student2;
Table Type:             MANAGED_TABLE
```

### 5.2. 外部表

1）理论

> 因为表是外部表，所以Hive并非认为其完全拥有这份数据。删除该表并不会删除掉这份数据，不过描述表的元数据信息会被删除掉。

2）管理表和外部表的使用场景

> 每天将收集到的网站日志定期流入HDFS文本文件。在外部表（原始日志表）的基础上做大量的统计分析，用到的中间表、结果表使用内部表存储，数据通过SELECT+INSERT进入内部表。

3）案例实操（分别创建部门和员工外部表，并向表中导入数据）

- 原始数据

> dept:

```java
10	ACCOUNTING	1700
20	RESEARCH	1800
30	SALES	1900
40	OPERATIONS	1700
```

> emp：

```java
7369	SMITH	CLERK	7902	1980-12-17	800.00		20
7499	ALLEN	SALESMAN	7698	1981-2-20	1600.00	300.00	30
7521	WARD	SALESMAN	7698	1981-2-22	1250.00	500.00	30
7566	JONES	MANAGER	7839	1981-4-2	2975.00		20
7654	MARTIN	SALESMAN	7698	1981-9-28	1250.00	1400.00	30
7698	BLAKE	MANAGER	7839	1981-5-1	2850.00		30
7782	CLARK	MANAGER	7839	1981-6-9	2450.00		10
7788	SCOTT	ANALYST	7566	1987-4-19	3000.00		20
7839	KING	PRESIDENT		1981-11-17	5000.00		10
7844	TURNER	SALESMAN	7698	1981-9-8	1500.00	0.00	30
7876	ADAMS	CLERK	7788	1987-5-23	1100.00		20
7900	JAMES	CLERK	7698	1981-12-3	950.00		30
7902	FORD	ANALYST	7566	1981-12-3	3000.00		20
7934	MILLER	CLERK	7782	1982-1-23	1300.00		10
```

- 上传数据到HDFS

```java
hive (default)> dfs -mkdir /student;
hive (default)> dfs -put /opt/module/datas/student.txt /student;
```

- 建表语句，创建外部表

> 创建部门表：

```java
create external table if not exists dept(
    deptno int,
    dname string,
    loc int
)
row format delimited fields terminated by '\t';
```

> 创建员工表：

```java
create external table if not exists emp(
    empno int,
    ename string,
    job string,
    mgr int,
    hiredate string,
    sal double,
    comm double,
    deptno int
)
row format delimited fields terminated by '\t';
```

- 查看创建的表

```java
hive (default)>show tables;
```

- 查看表格式化数据

```java
hive (default)> desc formatted dept;
Table Type:             EXTERNAL_TABLE
```

- 删除外部表

```java
hive (default)> drop table dept;
```

> 外部表删除后，hdfs中的数据还在，但是metadata中dept的元数据已被删除

### 5.3. 管理表与外部表的互相转换

- 查询表的类型

```java
hive (default)> desc formatted student2;
Table Type:             MANAGED_TABLE
```

- 修改内部表student2为外部表

```java
alter table student2 set tblproperties('EXTERNAL'='TRUE');
```

- 查询表的类型

```java
hive (default)> desc formatted student2;
Table Type:             EXTERNAL_TABLE
```

- 修改外部表student2为内部表

```java
alter table student2 set tblproperties('EXTERNAL'='FALSE');
```

- 查询表的类型

```java
hive (default)> desc formatted student2;
Table Type:             MANAGED_TABLE
```

> 注意：('EXTERNAL'='TRUE')和('EXTERNAL'='FALSE')为固定写法，区分大小写！

## 6. 修改表

### 6.1. 重命名表

1）语法

```java
ALTER TABLE table_name RENAME TO new_table_name
```

2）实操案例

```java
hive (default)> alter table dept_partition2 rename to dept_partition3;
```

### 6.2. 增加和删除表分区

1）创建单个分区

```java
hive (default)> alter table dept_partition add partition(day='20200404');
```

2）同时创建多个分区

```java
hive (default)> alter table dept_partition add partition(day='20200405') partition(day='20200406');
```

3）删除单个分区

```java
hive (default)> alter table dept_partition drop partition (day='20200406');
```

4）同时删除多个分区

```java
hive (default)> alter table dept_partition drop partition (day='20200404'),partition(day='20200405');
```

### 6.3. 增加/修改/替换列信息

#### 6.3.1. 语法

1）更新列

```java
ALTER TABLE table_name CHANGE [COLUMN] col_old_name col_new_name column_type [COMMENT col_comment] [FIRST|AFTER column_name]
```

2）增加和替换列

```java
ALTER TABLE table_name ADD|REPLACE COLUMNS (col_name data_type [COMMENT col_comment], ...) 
```

注：ADD是代表新增一字段，字段位置在所有列后面(partition列前)，REPLACE则是表示替换表中所有字段。

#### 6.3.2. 实操案例

1）查询表结构

```java
hive> desc dept;
```

2）添加列

```java
hive (default)> alter table dept add columns(deptdesc string);
```

3）查询表结构

```java
hive> desc dept;
```

4）更新列

```java
hive (default)> alter table dept change column deptdesc desc string;
```

5）查询表结构

```java
hive> desc dept;
```

6）替换列

```java
hive (default)> alter table dept replace columns(deptno string, dname string, loc string);
```

7）查询表结构

```java
hive> desc dept;
```

## 7. 删除表

```java
hive (default)> drop table dept;
```
