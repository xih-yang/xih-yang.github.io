# 06、MySQL 教程 - MySQL 哪些情况不适合建索引？
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/6.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 在where中使用不到的字段，不要设置索引

where条件（包括group by、order by）里用不到的字段不需要创建索引，索引的价值是快速定位，如果起不到快速定位的字段通常是不需要建立索引的。

我们只为出现在where子句中的列、order by或group by子句中的列、连接子句中的连接列创建索引。仅出现在查询列表中的列就没有必要建立索引了。

比如下面的查询语句：

```java
select common_field,key_part3 from single_table where key1='a';
```

我们只需要为出现在where子句中的key1建立索引就可以了，而查询列表中的common_field、key_part3这两个列就没有必要建立索引了。

## 2. 数据量小的表最好不要使用索引

如果表记录太少，比如少于1000个，那么是不需要建立索引的。表记录太少是否建立索引对查询效率的影响并不大。甚至说，查询花费的时间比遍历索引的时间还短，索引可能不会产生优化效果。

## 3. 有大量重复数据的列上不要建立索引

要在100 万行数据中查找其中的 50 万行（比如性别为男的数据），一旦创建了索引，你需要先 访问 50 万次索引，然后再访问 50 万次数据表，这样加起来的开销比不使用索引可能还要大。

## 4. 避免对经常更新的表创建过多的索引

频繁更新的字段不一定要创建索引。因为更新数据的时候，也需要更新索引，如果索引太多，在更新索引的时候也会造成负担，从而影响效率。

## 5. 不建议用无序的值作为索引

例如身份证、UUID(在索引比较时需要转为ASCII，并且插入时可能造成页分裂)、MD5、HASH、无序长字符串等。

## 6. 删除不再使用或者很少使用的索引

表中的数据被大量更新，或者数据的使用方式被改变后，原有的一些索引可能不再需要。数据看管理员应当定期找出这些索引，将他们删除，从而减少索引对更新的影响。

## 7. 不要定义冗余或重复的索引

针对single_table表，可以单独针对key_part1列建立一个idx_key_part1索引：

```java
alert table single_table and index idx_key_part1(key_part1);
```

而此时我们已经有了一个针对key_part1、key_part2、key_part3列建立的联合索引idx_key_par。idx_key_part索引的二级索引记录本身就是按照key_part1列的值排序的，此时再单独为key_part1列建立一个索引其实是没必要的，我们可以把整个新建的idx_key_part1索引看作一个冗余索引，该冗余索引是没有必要的。

有时，我们可能会对同一个列建立多个索引，比如下面两个添加索引的语句：

```java
alert table single_table add unique key uk_id(id);
alert table single_table add index idx_id(id);
```

我们针对id列又建立了一个唯一二级索引uk_id，还建立了一个普通二级索引idx_id，可是id列本身就是single_table表的主键，InnoDB自动为该列建立了聚簇索引，此时uk_id和idx_id就是重复的，这种重复索引应该避免。
