# 06、Hive 教程 - Hive DML 数据操纵语言详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/6.html
- 分类：大数据框架
- 分组：教程目录
## 一、数据导入

### 1.1 向表中装载数据（Load）

1．语法

```java
hive> load data [local] inpath '/opt/module/datas/student.txt' overwrite | into table student [partition (partcol1=val1,…)];
```

**1、****loaddata**:表示加载数据；

**2、****local**:表示从本地加载数据到hive表；否则从HDFS加载数据到hive表；

**3、****inpath**:表示加载数据的路径；

**4、****overwrite**:表示覆盖表中已有数据，否则表示追加；

**5、****intotable**:表示加载到哪张表；

**6、****student**:表示具体的表；

**7、****partition**:表示上传到指定分区；

2．实操案例

（0）创建一张表

```java
hive (default)> create table student(id string, name string) row format delimited fields terminated by '\t';
```

（1）加载本地文件到hive

```java
hive (default)> load data local inpath '/opt/module/datas/student.txt' into table default.student;
```

（2）加载HDFS文件到hive中

上传文件到HDFS

```java
hive (default)> dfs -put /opt/module/datas/student.txt /user/atguigu/hive;
```

加载HDFS上数据

```java
hive (default)> load data inpath '/user/atguigu/hive/student.txt' into table default.student;
```

（3）加载数据覆盖表中已有的数据

上传文件到HDFS

```java
hive (default)> dfs -put /opt/module/datas/student.txt /user/atguigu/hive;
```

加载数据覆盖表中已有的数据

```java
hive (default)> load data inpath '/user/atguigu/hive/student.txt' overwrite into table default.student;
```

### 1.2 通过查询语句向表中插入数据（Insert）

1．创建一张分区表

```java
hive (default)> create table student(id int, name string) partitioned by (month string) row format delimited fields terminated by '\t';
```

2．基本插入数据

```java
hive (default)> insert into table  student partition(month='201709') values(1,'wangwu');
```

3．基本模式插入（根据单张表查询结果）

```java
hive (default)> insert overwrite table student partition(month='201708')
             select id, name from student where month='201709';
```

4．多插入模式（根据多张表查询结果）

```java
hive (default)> from student
              insert overwrite table student partition(month='201707')
              select id, name where month='201709'
              insert overwrite table student partition(month='201706')
              select id, name where month='201709';
```

### 1.3 查询语句中创建表并加载数据（As Select）

根据查询结果创建表（查询的结果会添加到新创建的表中）

```java
create table if not exists student3
as select id, name from student;
```

### 1.4 创建表时通过Location指定加载数据路径

1．创建表，并指定在hdfs上的位置

```java
hive (default)> create table if not exists student5(
              id int, name string
              )
              row format delimited fields terminated by '\t'
              location '/user/hive/warehouse/student5';
```

2．上传数据到hdfs上

```java
hive (default)> dfs -put /opt/module/datas/student.txt
/user/hive/warehouse/student5;
```

3．查询数据

```java
hive (default)> select * from student5;
```

### 1.5 Import数据到指定Hive表中

注意：先用export导出后，再将数据导入。

```java
hive (default)> import table student2 partition(month='201709') from
 '/user/hive/warehouse/export/student';
```

## 二、数据导出

### 2.1 Insert导出

1．将查询的结果导出到本地

```java
hive (default)> insert overwrite local directory '/opt/module/datas/export/student'
            select * from student;
```

2．将查询的结果格式化导出到本地

```java
hive(default)>insert overwrite local directory '/opt/module/datas/export/student1'
           ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'             
           select * from student;
```

3．将查询的结果导出到HDFS上(没有local)

```java
hive (default)> insert overwrite directory '/user/atguigu/student2'
             ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t' 
             select * from student;
```

### 2.2 Hadoop命令导出到本地

```java
hive (default)> dfs -get /user/hive/warehouse/student/month=201709/000000_0
/opt/module/datas/export/student3.txt;
```

### 2.3 Hive Shell 命令导出

基本语法：（hive -f/-e 执行语句或者脚本 > file）

```java
[atguigu@hadoop102 hive]$ bin/hive -e 'select * from default.student;' >
 /opt/module/datas/export/student4.txt;
```

### 2.4 Export导出到HDFS上

```java
(defahiveult)> export table default.student to
 '/user/hive/warehouse/export/student';
```

## 三、清除表中数据（Truncate）

注意：Truncate只能删除管理表，不能删除外部表中数据

```java
hive (default)> truncate table student;
```
