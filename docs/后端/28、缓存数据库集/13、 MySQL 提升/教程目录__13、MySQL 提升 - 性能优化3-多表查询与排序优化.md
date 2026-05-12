# 13、MySQL 提升 - 性能优化3-多表查询与排序优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/13.html
- 分类：缓存数据库
- 分组：教程目录
### 一、IN和EXISTS

#### 1.介绍

in：查询相当于多个or条件的叠加；in查询的子条件返回结果必须只有一个字段。

exists：子句当能返回结果集则为true，不能返回结果集则为false；exists查询的子条件返回结果无限制。

#### 2.数据准备

继续使用上一篇中的consumer_info表。

然后再新建一个user_details_info表。

```java
create table user_details_info
(
	id int auto_increment,
	sex varchar(8) null,
	address varchar(128) null,
	op_time datetime null,
	constraint user_details_info_pk
		primary key (id)
);
insert into user_details_info(id, sex, address, op_time) VALUES (1,'女','极北之地','2020-07-07');
insert into user_details_info(id, sex, address, op_time) VALUES (2,'男','天上人间','2020-07-07');
```

#### 3.使用举例

如下两条sql的查询结果是一致的：

```java
sql1:
select * from consumer_info where details_id in(select id from user_details_info);
sql2:
select * from consumer_info where exists(select * from user_details_info where user_details_info.id=consumer_info.details_id);
```

但是查询过程却不一致：

sql1:

```java
explain select * from consumer_info where details_id in(select id from user_details_info);
```

从图中可以看到，对user_details_info表使用到了主键索引，但是对consumer_info表是全表扫描。

主要用到了user_details_info表的索引，consumer_info的details_id字段是否有索引关系不大。注意rows的值user_details_info表被读取了2行。

sql2:

```java
explain select * from consumer_info where exists(select * from user_details_info where user_details_info.id=consumer_info.details_id);
```

从图中可以看到，对user_details_info表使用到了主键索引，但是type类型变为了eq_ref，查询性能比起index有提升。

同样是用到了user_details_info表的索引，但是注意rows的值user_details_info表被读取行数为1。

#### 4.小结

上面的例子并不是很能说明问题，但是还是可以看到是sql2的执行效率要更高一些的，因为它用小表user_details_info来驱动大表consumer_info进行查询。

- IN查询如果在关联字段上有索引，那么索引都可以被用到。
- Exists查询只可以在子语句中使用到索引。
- 当使用小表驱动大表（大结果集）是使用Exists查询的效率高于in查询。
- 反过来，当使用大表驱动小表（小结果集）时，Exists查询的效率优化不明显，IN的字段如果有索引，那么in的查询效率会优于Exists。

### 二、order by 排序

还是使用前一篇使用的consumer_info表的数据，先查看一下索引：

当前主要关注user_name,age,account_name三个字段的复合索引。

> Using filesort：说明mysql会对数据使用一个外部的索引排序，而不是按照表内的索引顺序进行读取。mysql中无法利用索引完成的排序操作称为“文件排序”。

#### 1.测试

- 测试一：使用复合索引的首列，select *

```java
explain select * from consumer_info  order by user_name;
```

使用了filesort排序

- 测试二：使用复合索引的首列，select 索引字段

```java
explain select id, user_name, age, account_name from consumer_info  order by user_name;
```

使用了index排序

- 测试三：掉过使用复合索引的首列，select 索引字段

```java
explain select user_name, age, account_name from consumer_info  order by age;
```

使用了filesort排序

- 测试四：order by没有使用复合索引的首列，但是where条件中使用了复合索引首列，select 索引字段

```java
explain select id, user_name, age, account_name from consumer_info where user_name='' order by age;
```

使用了index排序。

- 测试五：使用复合索引的多列（包含首列），但是有升序和降序

```java
explain select user_name, age, account_name from consumer_info  order by user_name desc ,age  asc ;
```

在使用复合索引排序时，有升序和降序，使用了filesort排序。

#### 2.小结：

- mysql支持两种排序方式：filesort和index，index排序效率高，filesort效率低。
- order by 使用索引的首列可以使用索引排序。
- 如果where的条件中使用了索引的首列，那么order by就能用到索引排序。
- select 字段使用有索引的字段，排序时可以使用index排序。

### 三、group by 排序

group by实质时先排序后分组。

所以group by的使用与order by基本一致。

补充一点：能写在where限定的条件就不要去having限定了。

无法使用索引列的时候，可以尝试增大max_length_for_sort_data的参数设置和增大sort_buffer_size参数的设置。
