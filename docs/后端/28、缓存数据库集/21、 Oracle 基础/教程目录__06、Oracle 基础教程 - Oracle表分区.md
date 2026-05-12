# 06、Oracle 基础教程 - Oracle表分区
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/6.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 基本概念

Oracle表分区是将一个大型表分割成更小、更易于管理的部分的技术。分区后的表被称为**分区表**，其中每个分区都可以独立地进行维护、管理和查询。表分区可基于表中的一列或多列，称为**分区键**，分区键的值确定了每行数据属于哪个分区。

> 使用分区具有以下优点：

**改善查询性能**：由于表分区将数据分割成更小、更可管理的部分，对分区对象的查询可以仅搜索特定分区，提高检索速度。如在范围分区的情况下，可以更快地查询特定时间段的数据。

**维护方便**：分而治之，每个分区都可以独立地进行维护和管理，更容易地维。如表的某个分区出现故障，需要修复数据，只修复该分区即可；又如在范围分区的情况下，可以更容易地删除或归档旧数据。

**可用性**：实际各分区的数据是独立存放，如果表的某个分区出现故障，表在其他分区的数据仍然可用；

**均衡I/O**：可把不同的分区映射到磁盘以平衡I/O，改善整个系统性能；并且可以更快地加载数据，因为可以并行加载多个分区。如在哈希分区的情况下，可以并行加载多个分区，从而大大提高了数据加载的速度。

Oracle数据库提供对表或索引的分区常用方法主要有三种：

- 范围分区
- Hash分区（散列分区）
- 复合分区

先建三个表空间：

```java
create tablespace ma_tra01 datafile 'D:\oracle\product\10.2.0\oradata\orcl\ma_tra01.dnf' size 50M; 
create tablespace ma_tra02 datafile 'D:\oracle\product\10.2.0\oradata\orcl\ma_tra02.dnf' size 50M; 
create tablespace ma_tra03 datafile 'D:\oracle\product\10.2.0\oradata\orcl\ma_tra03.dnf' size 50M;
```

## 2. 范围分区

范围分区就是对数据表中的某个值的范围进行分区，根据某个值的范围，决定将该数据存储在哪个分区上。如根据序号分区，根据业务记录的创建日期进行分区等。

**e.g.**

需求描述：有一个物料交易表，表名：material_transactions。该表将来可能有千万级的数据记录数。要求在建该表的时候使用分区表。 这时候我们可以使用序号分区三个区，每个区中预计存储三千万的数据，也可以使用日期分区，如每五年的数据存储在一个分区上。

- 根据交易记录的序号分区建表

```java
create table material_transactions ( 
transaction_id number primary key,
item_id number(8) not null,
item_description varchar2(300),
transaction_date date not null 
) 
partition by range (transaction_id) ( 
partition part_01 values less than(30000000) tablespace ma_tra01,
partition part_02 values less than(60000000) tablespace ma_tra02, 
partition part_03 values less than(maxvalue) tablespace ma_tra03); 
```

- 根据交易日期分区建表

```java
create table material_transactions (
transaction_id number primary key, 
item_id number(8) not null,
item_description varchar2(300), 
transaction_date date not null ) 
partition by range (transaction_date) (
partition part_01 values less than(to_date('2006-01-01','yyyy-mm-dd')) tablespace ma_tra01,
partition part_02 values less than(to_date('2010-01-01','yyyy-mm-dd')) tablespace ma_tra02,
partition part_03 values less than(maxvalue) tablespace ma_tra03); 
```

这样分别建了以交易序号和交易日期来分区的分区表。

- 插入数据：每次插入数据的时候，系统将根据指定的字段的值来自动将记录存储到制定的分区（表空间）中。

```java
insert into material_transactions values(1,12,'BOOKS1',sysdate); 
insert into material_transactions Values(2,12, 'BOOKS2',sysdate+30); 
insert into material_transactions values(3,12, 'BOOKS3',to_date('2006-05-30','yyyy-mm-dd')); 
insert into material_transactions values(4,12, 'BOOKS4',to_date('2007-06-23','yyyy-mm-dd')); 
insert into material_transactions values(5,12, 'BOOKS5',to_date('2011-02-26','yyyy-mm-dd')); 
insert into material_transactions values(6,12, 'BOOKS6',to_date('2011-04-30','yyyy-mm-dd')); 
Commit;
```

- 查询分区表

```java
select * from material_transactions partition(part_03) t
```

可以对分区表进行跟新或删除，默认情况下，oracle的分区表对于分区字段是不允许进行`update`操作的，如果有对分区字段行进`update`，就会报`ORA-14402`错误: 更新分区关键字列将导致分区的更改。但是可以通过打开表的`row movement`属性来允许对分区字段的`update`操作，但是这样会导致无效对象的产生，所以不推荐使用。可通过删除旧数据，插入新数据来解决。

还可以根据需求，使用两个字段的范围分布来分区，如`partition by range ( transaction_id ，transaction_date)`， 分区条件中的值也做相应的改变。

- 增加一个分区

```java
Alter Table  material_transactions Add Partition part_04 Values Less Than (to_date('20150101','yyyymmdd')) Tablespace ma_tra04
```

增加分区的条件必须大于现有分区的最大条件值，否则会提示`ORA-14074`：分区界限必须调整为高于最后一个分区界限

- 合并两个个分区

```java
Alter Table material_transactions Merge Partitions part_01,part_02 Into Partition part_02;
```

- 删除分区（数据也会被删除）

```java
Alter Table material_transactions Drop Partition part_03;
```

## 3. Hash分区（散列分区）

散列分区为通过指定分区编号来均匀分布数据的一种分区类型，因为通过在I/O设备上进行散列分区，使得这些分区大小一致。如将物料交易表的数据根据交易ID散列地存放在指定的三个表空间中：

```java
create table material_transactions_hash (
transaction_id number primary key,
item_id number(8) not null,
item_description varchar2(300), 
transaction_date Date) 
partition by hash(transaction_id) (
partition part_01 tablespace ma_tra01, 
partition part_02 tablespace ma_tra02, 
partition part_03 tablespace ma_tra03); 
```

建表成功，此时插入数据，系统将按transaction_id将记录散列地插入三个分区中，这里也就是三个不同的表空间中。

## 3. 复合分区

有时需要根据范围分区后，每个分区内的数据再散列地分布在几个表空间中，这样我们就要使用复合分区。复合分区是先使用范围分区，然后在每个分区内 再使用散列分区的一种分区方法，如将物料交易的记录按时间分区，然后每个分区中的数据分三个子分区，将数据散列地存储在三个指定的表空间中：

```java
create table material_transactions_test  (
transaction_id number primary key,
item_id number(8) not null,
item_description varchar2(300), 
transaction_date date ) 
partition by range(transaction_date) subpartition by hash(transaction_id) 
subpartitions 3 store in (ma_tra01,ma_tra02,ma_tra03) (
partition part_01 values less than(to_date('2006-01-01','yyyy-mm-dd')), 
partition part_02 values less than(to_date('2010-01-01','yyyy-mm-dd')), 
```

该例中，先是根据交易日期进行范围分区，然后根据交易的ID将记录散列地存储在三个表空间中。

分区表可以建立局部索引与全局索引，当分区表中出现许多事务并且要保证所有分区中的数据记录的唯一性时需要采用全局索引。

```java
Create Index idx_matra_itemid On material_transactions(item_id) Local;
Create Index idx_matra_itemid On material_transactions(item_id);
```
