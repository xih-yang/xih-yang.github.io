# 05、MySQL 教程 - MySQL 哪些情况下适合建立索引？
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/5.html
- 分类：缓存数据库
- 分组：教程目录
### 数据准备

查看mysql是否允许创建函数：

```java
show variables like 'log_bin_trust_function_creators';
```

命令开启：允许创建函数设置：

```java
set global log_bin_trust_function_creators=1; 不加global只是当前窗口有效。
```

```java
# 创建表
CREATE TABLE student_info (
 id INT(11) NOT NULL AUTO_INCREMENT,
 student_id INT NOT NULL ,
 name VARCHAR(20) DEFAULT NULL,
 course_id INT NOT NULL ,
 class_id INT(11) DEFAULT NULL,
 create_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (id)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8
CREATE TABLE course (
id INT(11) NOT NULL AUTO_INCREMENT,
course_id INT NOT NULL ,
course_name VARCHAR(40) DEFAULT NULL,
PRIMARY KEY (id)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
#函数1：创建随机产生字符串函数
DELIMITER //
CREATE FUNCTION rand_string(n INT)
	RETURNS VARCHAR(255)该函数会返回一个字符串
BEGIN
	DECLARE chars_str VARCHAR(100) DEFAULT 'abcdefghijklmnopqrstuvwxyzABCDEFJHIJKLMNOPQRSTUVWXYZ';
	DECLARE return_str VARCHAR(255) DEFAULT '';
	DECLARE i INT DEFAULT 0;
	WHILE i < n DO
	   SET return_str =CONCAT(return_str,SUBSTRING(chars_str,FLOOR(1+RAND()*52),1));
	   SET i = i + 1;
    END WHILE;
    RETURN return_str;
END //
DELIMITER ;
#函数2：创建随机数函数
DELIMITER //
CREATE FUNCTION rand_num (from_num INT ,to_num INT) RETURNS INT(11)
BEGIN 
DECLARE i INT DEFAULT 0; 
SET i = FLOOR(from_num +RAND()*(to_num - from_num+1))  ;
RETURN i; 
END //
DELIMITER ;
# 存储过程1：创建插入课程表存储过程
DELIMITER //
CREATE PROCEDURE insert_course( max_num INT )
BEGIN 
	DECLARE i INT DEFAULT 0; 
	SET autocommit = 0;  设置手动提交事务
	REPEAT 循环
	SET i = i + 1; 赋值
	INSERT INTO course (course_id, course_name ) VALUES
	(rand_num(10000,10100),rand_string(6)); 
	UNTIL i = max_num 
	END REPEAT; 
	COMMIT; 提交事务
END //
DELIMITER ;
# 存储过程2：创建插入学生信息表存储过程
DELIMITER //
CREATE PROCEDURE insert_stu( max_num INT )
BEGIN 
	DECLARE i INT DEFAULT 0; 
	SET autocommit = 0;  设置手动提交事务
	REPEAT 循环
	SET i = i + 1; 赋值
	INSERT INTO student_info (course_id, class_id ,student_id ,NAME ) VALUES
(rand_num(10000,10100),rand_num(10000,10200),rand_num(1,200000),rand_string(6)); 
	UNTIL i = max_num 
	END REPEAT; 
	COMMIT; 提交事务
END //
DELIMITER ;
# 调用存储过程
CALL insert_course(100);
CALL insert_stu(1000000);
```

### 1. 字段的数值有唯一性的限制

索引本身可以起到约束的作用，比如唯一索引，主键索引都是可以起到唯一约束的，因此在我们的数据表中，如果某个字段是唯一性的，就可以直接创建唯一性索引，或者主键索引。这样就可以更快速的通过该索引来确定某条记录。

在业务上具有唯一特性的字段，即使是组合字段，也必须建成唯一索引。

### 2. 频繁作为 where 查询条件的字段

某个字段在select语句的where条件中经常被用到，那么就需要给这个字段创建索引了，尤其是在数据量大的情况下，创建索引就可以大幅度提升数据查询的效率。

**解读：**

```java
# 为student_id字段添加索引
alter table student_info add index idx_sid(student_id);
select course_id,class_id,name,create_time,student_id from student_info where student_id=123110;
# 删除为student_id字段创建的索引
drop index idx_sid on student_info;
```

当为`student_id`创建索引后，这个索引的叶子节点和非叶子节点都是按照`student_id`大小进行排序的，叶子节点存放的是`索引列student_id+主键列id`，非叶子节点存放的是`索引列student_id+页号`。

由于`idx_sid`是一个二级索引，而我们查询的信息除了student_id字段还有其他字段，因此没有做到索引覆盖，在二级索引中获取到主键信息后会到聚簇索引中执行回表获取其他要查询的字段信息，也是有一定代价的，这个时候底层的查询优化器会计算一个成本，选择使用二级索引+回表的方式还是全表扫描的方式进行查询。

### 3. 经常 group by 和 order by 的列

索引就是让数据按照某种顺序进行存储或检索，因此当我们使用group by对数据进行分组查询，或者使用order by 对数据进行排序的时候，就需要对分组或者排序的字段进行索引。如果排序的列有多个，那么可以在这些列上建立联合索引。

参考我的这篇文章，可以理解底层原理：https://hengheng.blog.csdn.net/article/details/123156589

**解读：**

```java
alter table student_info add index idx_sid(student_id);
select student_id count(*) count from student_info order by student_id limit 100;
```

如果没有为student_id字段建立索引，就得建立一个用于统计的临时表，在扫描索引的记录时将统计的中间结果填入这个临时表。当扫描完记录后，再把临时表中的结果作为结果集发送给客户端。如果为student_id字段建立了索引，那么索引的叶子节点和非叶子节点都是按照student_id大小进行排序的，student_id相同的肯定会相邻，因此不需要使用临时表存放中间结果了。

```java
alter table student_info add index idx_sid(student_id);
select student_id from student_info order by student_id limit 100;
```

如果为student_id字段建立了索引，那么索引本身就是按照student_id大小进行排序的，因此不用再对查询到的数据进行排序了。

```java
# 为student_id和create_time字段创建联合索引
alter table student_info add index idx_index(student_id,create_time);
select student_id,count(*) count from student_info group by student_id order by create_time desc limit 100;
```

创建联合索引`idx_index(student_id,create_time)`，这个联合索引会先按照student_id进行排序，在student_id相同的情况下再按照create_time进行排序。注意联合索引的顺序，不可以`idx_index(create_time,student_id)`，这个联合索引会先按照create_time排序，在create_time相同的情况下再按照student_id排序。

### 4. update、delete 的 where条件列

当我们对某条数据进行update或者delete操作的时候，是否需要对where条件后的条件列创建索引呢？

对数据按照某个条件进行查询后再进行 update或 delete的操作，如果对 where字段创建了索引，就能大幅提升效率。原理是因为我们需要先根据 WHERE 条件列检索出来这条记录，然后再对它进行更新或 删除。如果进行更新的时候，更新的字段是非索引字段，提升的效率会更明显，这是因为非索引字段更 新不需要对索引进行维护。

**解读：**

```java
alter table student_info add index idx_name(name);
update student_info set student_id=10002 where name='462eed7ac7688daj90';
delete from student_info where name='462eed7ac7688daj90';
```

### 5. distinct 字段需要创建索引

有时候我们需要对某个字段进行去重，使用distinct，那么对这个字段创建索引，也会提升查询效率。

**解读：**

```java
alter table student_info add index idx_sid(student_id);
select distinct(student_id) from student_info;
```

当为student_id字段建立索引后，索引是按照student_id值的大小进行排序的，相同的数据会相邻，所以去重时会快很多。

### 6. 多表 join 连接操作时，创建索引注意事项

（1）首先， 连接表的数量尽量不要超过 3 张 ，因为每增加一张表就相当于增加了一次嵌套的循环，数量级增 长会非常快，严重影响查询的效率。

（2）其次， 对 where条件创建索引 ，因为where才是对数据条件的过滤。如果在数据量非常大的情况下， 没有where条件过滤是非常可怕的。

（3）最后， 对用于连接的字段创建索引 ，并且该字段在多张表中的类型必须一致 。比如 course_id 在 student_info 表和 course 表中都为 int(11) 类型，而不能一个为 int 另一个为 varchar 类型。

```java
alter table student_info add index idx_name(name);
select course_id, name, student_info.student_id, course_name from student_info join course on student_info.course_id = course.course_id
where name = '462eed7ac6e791292a79';
```

### 7. 使用列的类型小的创建索引

在定义表结构时，要显式的指定列的类型。以整数类型为例，有tingint、mediumint、int、bigint这几种，他们占用的存储空间的大小依次递增，他们能表示的整数范围当然也是依次递增。如果想要对某个整数类型的列建立索引，在表示的整数范围允许的情况下，尽量让索引列使用较小的类型，比如使用int就不要用bigint，因为数据类型越小，索引占用的存储空间就越少，在一个数据页内就可以存放更多的记录，磁盘IO带来的性能损耗也就越小，读写效率也就越高。

这个建议对表的主键来说更加适用，因为不仅聚簇索引会存储主键值，所有的二级索引的节点都会存储一份记录的主键值，如果主键使用更小的数据类型，也就意味着能节省更多的存储空间。

### 8. 使用字符串前缀创建索引

假如字符串很长，那么存储这个字符串就会占用很多的存储空间。在为这个字符串所在的列建立索引时，就需要在对应的B+树中，把列的完整字符串存储起来，字符串越长，在索引中占用的存储空间越大。

索引列的字符串前缀其实也是排好序的，我们可以通过截取字段前面的一部分内容建立索引，这个就叫**前缀索引**，即只将字符串的前几个字符存放到索引中，也就是说二级索引的记录中只保留字符串的前几个字符，这样在查找记录时虽然不能精确的定位到记录的位置，但是能定位到相应前缀所在的位置，然后根据前缀相同的记录的主键值回表查询完整的字符串值。既节约空间，又减少了字符串的比较时间，还能解决排序问题。

**解读：**

比如可以这样修改`idx_key1`索引，让索引中只保留字符串的前10个字符：

```java
alert table single_table drop index idx_key1;
alert table single_table add index idx_key1(key1(10));
```

然后再执行下面的查询语句：

```java
select * from single_table where key1='abcdefghijklmn';
```

由于在`idx_key1`的二级索引记录中只保留字符串的前10个字符，所以我们只能定位到前缀为`‘abcdefghij'`的二级索引记录，在扫描这些二级索引记录时再判断它们是否满足`key1='abcdefghijklmn'`条件，当列中存储的字符串包含的字符较多时，这种为列前缀建立索引的方式可以明显减少索引大小。

不过，在只对前缀建立索引的情况下，下面这个查询语句就不能使用索引来完成排序需求了：

```java
select * from single_table order by key1 limit 10;
```

因为二级索引`idx_key1`中不包含完整的`key1`列信息，所以在仅使用`idx_key1`索引执行查询时，无法对`key1`列前10个字符相同但其余字符不同的记录进行排序，也就是说，只为列前缀建立索引的方式无法支持使用索引进行排序的需求。

注意：在varchar字段上建立索引时，必须指定索引长度，没必要对全字段建立索引，根据实际文本区分度决定索引长度。

### 9. 区分度高(散列性高)的列适合作为索引

当列中不重复值的个数在总记录条数中的占比很大时，才为列建立索引。

列的基数指的是某一列中不重复数据的个数，在记录行数一定的情况下，列的基数越大，该列中的值越分散，列的基数越小，该列中的值越集中。这个列的基数指标非常重要，直接影响我们是否能有效的利用索引。最好为列的基数大的建立索引，为列的基数小的建立索引效果可能不太好。

可以使用公式`select count(distinct a)/count(*) from t1`计算区分度，越接近1越好，一把超过33%就算是比较高效的索引了。

**解读：**

```java
alter table student_info add index idx_sid(student_id);
select * from student_info where student_id = '1';
```

B+树是按照索引列排序的，在不符合索引覆盖的情况下，每次从二级索引中获取到主键信息后就要到聚簇索引中查询完整的用户记录。

假如表中有100条记录，其中student_id=1的有99条，若mysql查询优化器选择了二级索引+回表的方式执行查询，那么就需要回表99次，回表的代价是非常高的。

假如表中有100条记录，其中student_id=1的记录只有1条，那么只需要执行1次回表操作。

### 10. 使用最频繁的列放到联合索引的左侧

这样也可以较少的建立一些索引。同时，由于"最左前缀原则"，可以增加联合索引的使用率。

### 11. 在多个字段都要创建索引的情况下，联合索引优于单值索引

索引建立的越多，维护的成本就越高。
