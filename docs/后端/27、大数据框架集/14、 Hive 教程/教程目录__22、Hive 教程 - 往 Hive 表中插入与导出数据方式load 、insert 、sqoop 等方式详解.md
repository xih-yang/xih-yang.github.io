# 22、Hive 教程 - 往 Hive 表中插入与导出数据方式load 、insert 、sqoop 等方式详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/22.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

往hive数据仓库的表中导入数据，可以直接insert ，也可以选择load方式。当然也可以通过第三方工具如sqoop等将数据导入到hive当初。特别注意：hive虽然不会验证用户装载的数据和表的模式是否匹配，但是hive会验证文件的存储格式和hive定义的表结构的存储格式是否一致。比如将文本文件装载到sequencefile表中则报错。

## 二、往hive表中导入数据

load data 导入数据到hive中，这种情况适合提供了外部数据文件，然后将其导入hive仓库的表中。（这种方式其实使用的不是太多，大厂的数据源一般都是数据库中数据，直接定时任务抽取即可，除非外包数据以文件形式提供）

```java
1.将本地数据文件导入到hive非分区表中,如下文件可以是个目录，会导入目录中所有的文件
load data local inpath '/home/robot/'
overwrite into table fdm_sor.personinfo
2.将本地数据文件导入到hive分区表中
load data local inpath '/home/robot/'
overwrite into table fdm_sor.personinfo
partition(country='china',city='nanjing')
注意：
   1.inpath里只要填目录即可，不用具体到文件，会加载目录下所有问题，但该目录下不能再有子目录，否则报错。
   2.overwrite 可以不加，加的话会将表中所有数据覆盖掉（分区表只覆盖当前分区数据），into talbe 将数据追加到表中。
   3.into talbe 如果表里数据已经存在了，会再次到导入，底层文件存储会给同文件名加序列号然后存储。
3.将分布式文件系统上的数据导入的hive中，比如讲hdfs上数据导入到hive中
load data inpath '/user/robot/'
overwrite into table fdm_sor.personinfo
注意：去掉local，则默认的路径是分布式文件系统上的路径，如hdfs上的路径。
```

**总结：overwrite覆盖的原理，是先删除数据，然后再写入数据。如果开了trash回收站功能，可以在回收站查看到回收的数据。**

## 三、通过查询insert …select的形式往hive中导入数据

使用insert子句将查询结果插入表中，这是开发中往表里导入数据最常用的方式之一，主要用来项目开发中使用，多表关联计算等操作。

```java
1.通过查询将数据覆盖导入的分区表中(或者用into追加结果，往动态分区表中插入数据，请参考本系列其他博客。）
insert overwrite table fdm_sor.personinfo
partition(statis_date='${staits_date}'
select a.id,a.name,b.address
from  person a left join address b
on a.id = b.id
2.多次插入，从一张表中读数据，下面这种方式效率最高，只需要扫描一次表即可。注意中间没有分号；
from T_DEDUCT_SIGN_D_external t
insert into table t1 
select 123 ,sign_no string,null
insert into table t2
select 345 ,null ,bp_no string
insert into table t3
select 678 ,sign_no string,bp_no string
where t.statis_date = '20180101';
```

注意：使用，insert…select 往表中导入数据时，查询的字段个数必须和目标的字段个数相同，不能多，也不能少,否则会报错。但是如果字段的类型不一致的话，则会使用null值填充，不会报错。而使用load data形式往hive表中装载数据时，则不会检查。如果字段多了则会丢弃，少了则会null值填充。同样如果字段类型不一致，也是使用null值填充。

## 四、使用create…as 语句往hive表里装载数据

```java
hive (fdm_sor)> create table mytest_createas  
              > as select id ,name
                 from  mytest_tmp2_p
                where country='china' and city='beijing';
注意：使用create... as 创建的表，表的存储属性是默认的textfile，serde也是默认的lazyserde.同时表没有分区.如果对表的结构有要求，
比如我们公司sor要求使用rcfile存储，则不能使用create ..as创建表，并且加载数据。
2.如果多次操作需要取同一个表中数据，可以优化如下,将from放到最前面，这样只扫描一次表即可完成。
  from  tu_trade t
  insert overwrite table credit
       partition(statis_date='201805')
       select *  where t.statis_date ='201805'
  insert overwrite table credit
    partition(statis_date='201804')
    select *  where t.statis_date ='201804'
    .......
  insert overwrite table credit
    partition(statis_date='201704')
    select *  where t.statis_date ='201704'
```

## 五、从hive表里导出数据到文件系统

不管数据在hive中如何存储，hive会将所有内容以字符串的形式序列化到文件里。但是要注意的是hive将数据序列化成文件的时候，文件的编码格式和hive里的一致。比如，hive中存储格式为sequencefile，则序列化的数据文件编码也是二进制格式，如果hive中列分隔符是默认的，则序列化文件也是默认的^A（不可视）的分隔符。所以为了序列化后文件可读性，一般要将需要导出的数据在hive中的编码格式改成textfile,分隔符比如为逗号等等（可以通过使用临时表）。注意导出数据只要insert overwrite没有insert into 所以很容易造成数据覆盖丢失。

**1、** 使用insert…overwrite…directory方式导出数据到本地或者分布式文件系统上；

```java
标准语法格式：
INSERT OVERWRITE [LOCAL] DIRECTORY directory1
  [ROW FORMAT row_format] [STORED AS file_format] (Note: Only available starting with Hive 0.11.0)
  SELECT ... FROM ...
多次多出语法格式：
FROM from_statement
INSERT OVERWRITE [LOCAL] DIRECTORY directory1 select_statement1
[INSERT OVERWRITE [LOCAL] DIRECTORY directory2 select_statement2] ...
案例演示：
hive (fdm_sor)> insert overwrite local directory '/home/robot/mydata/111' 
              > select *  from mytest_tmp2_p where country='china';
注意：1.不加local则将数据导出到分布式文件系统上，比如hdfs.加了local则默认为本地，如linux上。
     2.overwrite会将目录下的内容覆盖掉，尤其是如果当前目录下有数据，会丢失。但是这里没有into的用法。
     3.如果导出的目录，不存在，则会重新创建。
     4.注意导出产生的文件个数取决于计算过程中reducers个数。
```

**2、** 如果对表里的数据全部需要的话，因为hive的数据存储在hdfs上，可以直接通过hadoop命令-cp从该表的存储位置上将数据文件下载下来这是最快的方式；

**3、** 通过sqoop等工具导出数据，具体参考sqoop篇章；
