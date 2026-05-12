# 16、MySQL 教程 - MySQL 索引优化：索引失效的情况
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/16.html
- 分类：缓存数据库
- 分组：教程目录
### 数据准备

```java
# 创建表class
CREATE TABLE class (
id INT(11) NOT NULL AUTO_INCREMENT,
className VARCHAR(30) DEFAULT NULL,
address VARCHAR(40) DEFAULT NULL,
monitor INT NULL ,
PRIMARY KEY (id)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
# 创建表student
CREATE TABLE student (
id INT(11) NOT NULL AUTO_INCREMENT,
stuno INT NOT NULL ,
name VARCHAR(20) DEFAULT NULL,
age INT(3) DEFAULT NULL,
classId INT(11) DEFAULT NULL,
PRIMARY KEY (id)
#CONSTRAINT fk_class_id FOREIGN KEY (classId) REFERENCES t_class (id)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
# 允许创建函数设置
set global log_bin_trust_function_creators=1; 
#随机产生字符串
DELIMITER //
CREATE FUNCTION rand_string(n INT) RETURNS VARCHAR(255)
BEGIN
DECLARE chars_str VARCHAR(100) DEFAULT
'abcdefghijklmnopqrstuvwxyzABCDEFJHIJKLMNOPQRSTUVWXYZ';
DECLARE return_str VARCHAR(255) DEFAULT '';
DECLARE i INT DEFAULT 0;
WHILE i < n DO
SET return_str =CONCAT(return_str,SUBSTRING(chars_str,FLOOR(1+RAND()*52),1));
SET i = i + 1;
END WHILE;
RETURN return_str;
END //
DELIMITER ;
#用于随机产生多少到多少的编号
DELIMITER //
CREATE FUNCTION rand_num (from_num INT ,to_num INT) RETURNS INT(11)
BEGIN
DECLARE i INT DEFAULT 0;
SET i = FLOOR(from_num +RAND()*(to_num - from_num+1)) ;
RETURN i;
END //
DELIMITER ;
#创建往stu表中插入数据的存储过程
DELIMITER //
CREATE PROCEDURE insert_stu( START INT , max_num INT )
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0;设置手动提交事务
REPEAT循环
SET i = i + 1;赋值
INSERT INTO student (stuno, name ,age ,classId ) VALUES
((START+i),rand_string(6),rand_num(1,50),rand_num(1,1000));
UNTIL i = max_num
END REPEAT;
COMMIT;提交事务
END //
DELIMITER ;
#执行存储过程，往class表添加随机数据
DELIMITER //
CREATE PROCEDURE insert_class( max_num INT )
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0;
REPEAT
SET i = i + 1;
INSERT INTO class ( classname,address,monitor ) VALUES
(rand_string(8),rand_string(10),rand_num(1,100000));
UNTIL i = max_num
END REPEAT;
COMMIT;
END //
DELIMITER ;
# 调用存储过程
CALL insert_class(10000);
CALL insert_stu(100000,500000);
# 删除某表上的索引
DELIMITER //
CREATE PROCEDURE proc_drop_index(dbname VARCHAR(200),tablename VARCHAR(200))
BEGIN
DECLARE done INT DEFAULT 0;
DECLARE ct INT DEFAULT 0;
DECLARE _index VARCHAR(200) DEFAULT '';
DECLARE _cur CURSOR FOR SELECT index_name FROM
information_schema.STATISTICS WHERE table_schema=dbname AND table_name=tablename AND
seq_in_index=1 AND index_name <>'PRIMARY' ;
#每个游标必须使用不同的declare continue handler for not found set done=1来控制游标的结束
DECLARE CONTINUE HANDLER FOR NOT FOUND set done=2 ;
#若没有数据返回,程序继续,并将变量done设为2
OPEN _cur;
FETCH _cur INTO _index;
WHILE _index<>'' DO
SET @str = CONCAT("drop index " , _index , " on " , tablename );
PREPARE sql_str FROM @str ;
EXECUTE sql_str;
DEALLOCATE PREPARE sql_str;
SET _index='';
FETCH _cur INTO _index;
END WHILE;
CLOSE _cur;
END //
DELIMITER ;
# 执行存储过程
# CALL proc_drop_index("dbname","tablename");
CALL proc_drop_index("atguigudb1","student");
```

### 1. 全值匹配

**1、** 表中是不存在索引：；

```java
explain select sql_no_cache * from student where age=30 and classId=4 and name='abcd';
```

**2、** 只给age列建立索引：；

```java
create index idx_age on student(age);
explain select sql_no_cache * from student where age=30 and classId=4 and name='abcd';
```

（1）可能使用到的索引是idx_age，实际使用到的索引也是idx_age。

（2）idx_age索引并不包含classId和name列，存储引擎需要根据二级索引记录执行回表操作，并将完整的用户记录返回给server层之后，再在server层判断这个条件`age=30 and classId=4 and name='abcd'`是否成立，因此extra是using where。

（3）age的数据类型为int类型，并且可以存储null值，因此key_len的值为5。

（4）当通过普通的二级索引列与常量进行等值匹配的方式来查询某个表达示，对该表的访问方法就可能是ref。

**3、** 给age和classId列建立联合索引：；

```java
create index idx_age_classId on student(age,classId);
explain select sql_no_cache * from student where age=30 and classId=4 and name='abcd';
```

（1）可能使用的索引idx_age，idx_age_classId，实际使用到的索引idx_age_classId。

（2）idx_age_classId索引并不包含name列，存储引擎需要根据二级索引记录执行回表操作，并将完整的用户记录返回给server层之后，再在server层判断这个条件`age=30 and classId=4 and name='abcd'`是否成立，因此extra是using where。

（3）age的数据类型为int类型，并且可以存储null值，因此key_len的值为5；classId的数据类型为int类型，并且可以存储null值，因此key_len的值为5；

（4）通过执行计划的key_len列为10`（age:4+1，classId:4+1）`，则MySQL在执行上述查询时使用了联合索引中的age和classId这两个列的搜索条件来充当形成扫描区间的边界条件。

（5）当通过普通的二级索引列与常量进行等值匹配的方式来查询某个表达示，对该表的访问方法就可能是ref。

**4、** 给age、classId、name列建立联合索引：；

```java
create index idx_age_classId_name on student(age,classId,name);
explain select sql_no_cache * from student where age=30 and classId=4 and name='abcd';
```

（1）可能使用的索引`idx_age,idx_age_classId,idx_age_classId_name`，实际使用的索引`idx_age_classId_name`。

（2）这个语句在执行时将会用到`idx_age_classId_name`二级索引，并且索引列中包含age,classId,name三列，不用执行回表操作，extra为null。

（3）age的数据类型为int类型，并且可以存储null值，因此key_len的值为5；classId的数据类型为int类型，并且可以存储null值，因此key_len的值为5；name的数据类型为varchar(20)，并且可以存储null值，因此key_len的值为63。

（4）通过执行计划的key_len列为73`（age:4+1，classId:4+1，name:20*3+1+2）`，则MySQL在执行上述查询时使用了联合索引中的age、classId、name这3个列的搜索条件来充当形成扫描区间的边界条件。

（5）当通过普通的二级索引列与常量进行等值匹配的方式来查询某个表达示，对该表的访问方法就可能是ref。

### 2. 最佳左前缀规则

在MySQL建立联合索引时会遵守最佳左前缀匹配原则，即最左优先，在检索数据时从联合索引的最左边开始匹配。

MySQL可以为多个字段创建索引，一个索引可以包括16个字段，对于多列索引，过滤条件要使用索引必须按照索引建立时的顺序，依次满足，一旦跳过某个字段，索引后面的字段都没法使用。如果查询条件中没有使用这些字段中第一个字段，联合索引不会被使用。

**1、** 先把之前建立的索引：；

```java
drop index idx_age on student;
drop index idx_age_classId on student;
drop index idx_age_classId_name on student;
```

**2、** 举例：；

```java
create index idx_age_classId_name on student(age,classId,name);
explain select sql_no_cache * from student where age=30 and name='abcd';
```

（1）key_len为5，使用了idx_age_classId_name索引的age列的搜索条件来充当形成扫描区间的边界条件。

（2）如果在查询语句的执行过程中使用索引下推特性，在extra列中将会显示using index condition。

（3）当通过普通的二级索引列与常量进行等值匹配的方式来查询某个表达示，对该表的访问方法就可能是ref。

**3、** 举例：如果索引了多列，要遵循左前缀法则，即查询从索引的最左前列开始并且不跳过其中的列；

```java
explain select sql_no_cache * from student where classId=1 and name='abcd';
```

**4、** 举例：；

```java
explain select sql_no_cache * from student where classId=1 and age=30 and name='abcd';
```

由于联合索引的左边列并没有缺失，因此时可以走索引的，查询优化器会对他们的查询顺序进行优化：

（1）key_len为73，说明使用了联合索引中的age，classId，name列的搜搜条件。

（2）extra为null，说明走了索引，可以在存储引擎层判断条件是否成立，而不用到service层判断。

（3）当通过普通的二级索引列与常量进行等值匹配的方式来查询某个表达示，对该表的访问方法就可能是ref

```java
explain select sql_no_cache * from student where classId=1 and age=30 ;
```

```java
explain select sql_no_cache * from student where classId=1 ;
```

### 3. 主键插入顺序

对于一个使用InnoDB存储引擎的表来说，在我们没有显式的创建索引时，表中的数据实际上都是存储在聚簇索引的叶子节点的，而记录又是存储在数据页的，数据页和记录又是按照记录主键值从小到大的顺序进行排序，所以如果我们插入的记录的主键值依次增大的话，那我们每插满一个数据页就换到下一个数据页继续插，而如果我们插入的主键值忽大忽小的话，就比较麻烦了。

某个数据页存储的记录已经满了，它存储的主键值在1-100之间，假如再插入一条主键值为9的记录，那就需要将当前页面分裂成两个页面，把本页中的一些记录移动到新创建的这个页中。

页分裂意味着性能损耗，如果我们想尽量避免这样无谓的性能损耗，最好插入的记录的主键值依次递增，这样就不会发生这样的性能损耗了。

所以我们建议：让主键具有 AUTO_INCREMENT ，让存储引擎为自己表生成主键，而不是我们手动插入。

我们自定义的主键列 id 拥有 AUTO_INCREMENT 属性，在插入记录时存储引擎会自动为我们填入自增的 主键值。这样的主键占用空间小，顺序写入，减少页分裂。

### 4. 计算、函数、类型转换导致索引失效

删除之前创建的索引：

```java
drop index idx_age_classId_name on student;
```

**1、** 举例：索引列上使用函数时，将会导致索引失效；

```java
create index idx_name on student(name);
explain select sql_no_cache * from student where name like 'abc%';
```

```java
// 使用left函数
explain select sql_no_cache * from student where left(name,3)='abc';
```

**2、** 举例：索引列上进行计算，将会导致索引失效；

```java
create index idx_stuno on student(stuno);
explain select sql_no_cache * from student where stuno=900000;
```

```java
explain select sql_no_cache * from student where stuno+1=900001;
```

**3、** 举例：类型转换，将会导致索引失效；

```java
explain select sql_no_cache * from student where name="123";
```

```java
explain select sql_no_cache * from student where name=123;
```

### 5. 范围条件右边的列索引失效

```java
create index idx_age_classid_name on student(age,classid,name);
explain select sql_no_cache * from student where age=30 and classId>20 and name='abc';
```

`ken_len=10`，说明只用到了联合索引中的age和calssId列，而没有使用到name列。因为classId>20属于范围查询，导致name列索引没有使用到。

改进方法：调整联合索引的顺序，将范围查询条件放置语句最后

```java
create index idx_age_name_classid on student(age,name,classId);
explain select sql_no_cache * from student where age=30 and classId>20 and name='abc';
```

### 6. 不等于(!= 或者<>)索引失效

```java
// 删除所有索引
CALL proc_drop_index("atguigudb1","student");
// 创建索引
create index idx_name on student(name);
explain select * from student where name !='abc';
```

### 7. is null可以使用索引，is not null无法使用索引

```java
explain select * from student where name is null;
```

```java
explain select * from student where name is not null;
```

设计数据表的时候将字段设置为not null约束，比如将int类型的字段默认值设为0，将字符类型的默认值设置为空字符串（‘’）;

### 8. like以通配符%开头索引失效

在使用like关键字进行查询的查询语句中，如果匹配字符串的第一个自读为%，索引就不会起作用，只有%不在第一个位置，索引才会起作用。

```java
explain select * from student where name like "%abc";
```

```java
explain select * from student where name like "a%bc";
```

```java
explain select * from student where name like "abc%";
```

页面搜索严谨左模糊或者全模糊，如果需要请走搜素引擎来解决。

### 9. OR 前后存在非索引的列，索引失效

在where子句中，如果在or前的条件列进行了索引，而在or后的条件列没有进行索引，那么索引就会生效。也就是说，or前后的两个条件中的列都是索引是时，查询中才使用索引。

```java
create index idx_name on student(name);
explain select sql_no_cache * from student where name='abc' or classId=20;
```

改进方法：

```java
create index idx_classId on student(classId);
explain select sql_no_cache * from student where name='abc' or classId=20;
```

### 10. 数据库和表的字符集统一使用utf8mb4

统一使用utfmb4兼容性更好，统一字符集可以避免由于字符集转换产生的乱码，不同的字符集进行比较前需要进行转换会造成索引失效。
