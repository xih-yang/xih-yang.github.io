# 20、MySQL 教程 - MySQL 什么是索引条件下推？
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/20.html
- 分类：缓存数据库
- 分组：教程目录
数据准备：

```java
create table single_table(
	id int not null auto_increment, 
	key1 varchar(100),         
	key2 int,
	key3 varchar(100),
	key_part1 varchar(100),
	key_part2 varchar(100),
	key_part3 varchar(100),
    common_field varchar(100),
	primary key(id),          聚簇索引
	key idx_key1(key1),       二级索引
	unique key uk_key2(key2), 二级索引，而且该索引是唯一二级索引
	key idx_key3(key3),       二级索引
	key idx_key_part(key_part1,key_part2,key_part3) 二级索引，也是联合索引
)Engine=InnoDB CHARSET=utf8;
```

## 1. 案例分析

对于查询语句：

```java
explain select * from single_table where key1>'z' and key1 like '%a';
```

搜索条件`key1>'z'`可以使用到索引，但是搜索条件`key1 like '%a'`却不能使用到索引。

`MySQL`服务器程序其实分为`server`层和存储引擎层。在没有索引条件下推特性之前，`server`层生成执行计划之后，是按照下面的步骤来执行这个查询的。

**步骤1**：`server`层首先调用存储引擎的接口定位到满足·key1>‘z’·条件的第一条二级索引记录。

**步骤2**：存储引擎根据B+树索引快速定位到这条二级索引记录后，根据二级索引记录的主键值进行回表操作，将完整的用户记录返回给server层。

**步骤3**：`server`层在判断其他的搜索条件是否成立，如果成立则将其发送给客户端，否则跳过该记录，然后向存储引擎层要下一条记录。

**步骤4**：由于记录在索引中是按单向链表连接的，因此可以快速定位到符合`key1>'z'`条件的下一条二级索引记录。然后再执行回表操作，将完整的用户记录返回给`server`层。然后重复步骤3，直到将符合条件的所有记录都扫描过为止。

虽然`key1 like '%a'`不能使用到索引，但是这个搜索条件只涉及到`key1`列，而`key1`列包含在索引`idx_key1`中，所以MySQL改进了上面的执行步骤：

**步骤1**：`server`层首先调用存储引擎的接口定位到满足`key1>'z'`条件的第一条二级索引记录。

**步骤2**：存储引擎根据B+树索引快速定位到这条二级索引记录后，不着急执行回表操作，而是先判断一下所有关于`idx_key1`索引中包含的列的条件是否成立，如果这些条件不成立，则直接跳过该二级索引记录，然后去找下一条二级索引记录，如果这些条件成立，则执行回表操作，将完整的用户记录返回给server层。

**步骤3**：`server`层在判断其他的搜索条件是否成立（本例中没有其他条件了），如果成立则将其发送给客户端，否则跳过该记录，然后向存储引擎层要下一条记录。

**步骤4**：由于记录在索引中是按单向链表连接的，因此可以快速定位到符合`key1>'z'`条件的下一条二级索引记录。还是不着急进行回表操作，先判断一下`idx_key1`索引中包含的列的条件是否成立。如果这些条件不成立，则直接跳过该二级索引记录，然后去找下一条二级索引记录， 如果这些条件成立，则执行回表操作，将完整的用户记录返回给server层。然后重复步骤3，直到将符合条件的所有记录都扫描过为止。

每次执行回表操作时，都会将一个聚簇索引页面加载到内存中，这比较耗时，所以尽管上述修改只改进了一点点，但是可以省去好多回表操作的成本。MySQL把他们这个改进称为索引条件下推。

有些搜索条件中虽然出现了索引列，但却不能充当边界条件形成扫描区间，也就是不能用来减少需要扫描的记录数量，将会提示该using index condition。

如果在查询语句的执行过程找那个使用索引条件下推特性，在Extra显示列中也会提示using index condition。

## 2. 案例分析

索引下推在联合索引中使用的更多。

对于查询语句:

```java
explain select * from single_table where key_part1='a' and key_part3='c';
```

如果使用`idx_key_part`索引执行查询，只有`key_part1`列的搜索条件走了索引。

虽然搜索条件`key_part3='c'`列不能作为形成扫描区间的边界条件，但是`idx_key_part`的二级索引记录是包含`key_part3`列的。因此每当从`idx_key_part`索引中获取一条二级索引记录，就先判断这条二级索引记录是否符合`key_part3='c'`的条件。如果符合该条件，再执行回表操作，如果不符合就不再执行回表操作，直接跳到下一条索引记录，这样可以减少回表操作带来的性能损耗。

## 3. 案例分析

```java
// 创建表
create table people(
    id int not null auto_increment,
    zipcode varchar(20) collate utf8_bin default null,
    firstname varchar(20) collate utf8_bin default null,
    lastname varchar(20) collate utf8_bin default null,
    address varchar(50) collate utf8_bin default null,
    primary key(id),
    key zip_last_first (zipcode,lastname,firstname)
) engine=innodb auto_increment=5 default charset=utf8mb3 collate=utf8_bin;
// 插入数据
insert into people values(1,'000001','三','张','北京市'),(2,'000002','四','李','北京市'),(3,'000003','五','王','北京市'),(4,'000001','六','赵','北京市');
```

执行查询：

```java
explain select * from people where zipcode='000001' and lastname like '%张%' and address like '%北京市%';
```

使用了联合索引`zip_last_first`；`key_len`的值为63，即仅有索引的zipcode列的搜索条件使用了索引，而lastname和address列的搜索条件都没有使用到索引（%开头的搜索条件会使得索引失效）；出现了using index condition说明搜索时使用了索引下推特性；
