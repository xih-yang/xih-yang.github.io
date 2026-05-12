# 05、Hive 教程 - Hive 中动态分区与静态分区详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/5.html
- 分类：大数据框架
- 分组：教程目录
Hive中的分区有两种：动态分区和静态分区

## 一、静态分区

静态分区

**1、** 创建分区表；

```java
hive> create table stu2(
    > id int,
    > name string,
    > likes array<string>,
    > adress map<string,string>
    > )
    > partitioned by (age int,sex string)
    > row format delimited
    > fields terminated by ','
    > collection items terminated by '-'
    > map keys terminated by ':'
    > lines terminated by '\n';
```

**2、** 加载数据到分区表；

```java
hive> load data local inpath '/opt/soft/stu.txt' into table stu2
    > partition (age=20,sex="male");
```

```java
alter table stu2 add partition(age=10,sex='female'); 
// 
show partitions stu2;   // 查看分区
alter table stu2 drop partition(age=10,sex='female');
```

**3、** 这种手动指定分区加载数据，就是常说的静态分区的使用但是在日常工作中用的比较多的是动态分区；

静态分区是在创建表的时候就指定分区或者将表已经创建之后再指定分区（使用alter关键字）

## 二、动态分区

**1、** 创建目标表；

```java
hive> create table stuo1(
    > id int,
    > name string,
    > age int,
    > gender string,
    > likes array<string>,
    > address map<string,string>
    > )
    > row format delimited
    > fields terminated by ','
    > collection items terminated by '-'
    > map keys terminated by ':'
    > lines terminated by '\n';
```

```java
hive> create table stuo2(
    > id int,
    > name string,
    > likes array<string>,
    > address map<string,string>
    > )
    > partitioned by (age int,gender string)
    > row format delimited
    > fields terminated by ','
    > collection items terminated by '-'
    > map keys terminated by ':'
    > lines terminated by '\n';
```

**2、** 采用动态方式加载数据到目标表；

加载之前先设置一下下面的参数

```java
hive> set hive.exec.dynamic.partition=true;
hive> set hive.exec.dynamic.partition.mode=nonstrict;
```

开始加载

```java
hive> insert into table stuo2 partition(age,gender)
    > select id,name,likes,address,age,gender from stuo1;
```

上面加载数据方式并没有指定具体的分区，只是指出了分区字段。在select最后一个字段必须跟你的分区字段，这样就会自行根据`(age,gender)`的value来分区。

**3、** 验证一下；

**创建动态分区表：**

首先是要创建静态分区表；然后将表设置为非严格模式；再次创建动态分区表，并加载数据。

加载数据的时候，是按照静态分区的模式，将数据加载到动态分区中去。
