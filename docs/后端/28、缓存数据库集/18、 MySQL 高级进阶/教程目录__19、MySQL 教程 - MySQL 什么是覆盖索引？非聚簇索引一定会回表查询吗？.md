# 19、MySQL 教程 - MySQL 什么是覆盖索引？非聚簇索引一定会回表查询吗？
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/19.html
- 分类：缓存数据库
- 分组：教程目录
> 什么是覆盖索引？
>
> 非聚簇索引一定会回表查询吗？
>
> 非主键索引一定会查询多次吗？

数据准备：

```java
create table single_table(
	id int not null auto_increment, 
	key1 varchar(100),         
    common_field varchar(100),
	primary key(id),          聚簇索引
	key idx_key1(key1),       二级索引引
)Engine=InnoDB CHARSET=utf8;
```

为了彻底告别回表操作带来的性能损耗，建议最好在查询列表中只包含索引列，比如这个查询语句：

```java
select key1,id from single_table where key1>'a' and key1<'c';
```

由于我们只查询key1列和id列的值，所以在使用idx_key1索引来扫描(‘a’,‘c’)区间中的二级索引时，可以直接从获取到的二级索引记录中读出key1列和id列的值，而不需要再通过id值到聚簇索引中执行回表操作了，这样就省去了回表操作带来的性能损耗。

我们把这种索引中已经包含了所有需要读取的列的查询方式称为覆盖索引。如果索引的叶子节点中已经包含要查询的数据，那么还有必要再回表查询呢？如果一个索引包含所有需要查询的字段的值，就称为覆盖索引。

排序操作也优先使用覆盖索引进行查询，比如下面这个查询语句：

```java
select key1 from single_table order by key1;
```

虽然这个查询语句中没有limit子句，但是由于可以采用覆盖索引，所以查询优化器会直接使用idx_key1索引进行排序，而不需要执行回表操作。

当然，如果业务需要查询索引列以外的列，还是要以保证业务需求为重，如无必要，最好把业务中需要的列放在查询列表中，而不是以简单的*替代。

由此可见：二级索引和非主键索引不一定非要有回表操作，只要查询时满足了覆盖索引即可。
