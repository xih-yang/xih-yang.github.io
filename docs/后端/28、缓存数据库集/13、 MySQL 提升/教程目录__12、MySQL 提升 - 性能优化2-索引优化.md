# 12、MySQL 提升 - 性能优化2-索引优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/12.html
- 分类：缓存数据库
- 分组：教程目录
### 一、创建测试数据

```java
mysql版本5.7.30
创建表结构
create table consumer_info
(
    id           int auto_increment
        primary key,
    user_name    varchar(32) null,
    age          int         null,
    account_name varchar(32) null,
    email        varchar(64) null,
    details_id   int         null
);
插入数据
insert into consumer_info(id, user_name, age, account_name, email, details_id) values (null,'lily',20,'lily_admin','lily@163.com',1);
insert into consumer_info(id, user_name, age, account_name, email, details_id) values (null,'zhangsan',59,'zhangsan_admin','zhangsan@163.com',2);
insert into consumer_info(id, user_name, age, account_name, email, details_id) values (null,'xiaobai',17,'xiaobai_admin','xiaobai@qq.com',1);
insert into consumer_info(id, user_name, age, account_name, email, details_id) values (null,'huahua',21,'huahua_admin','huahua@163.com',1);
```

创建复合索引（user_name,age,account_name）：索引名叫index_uaa

```java
ALTER TABLE consumer_info ADD INDEX index_uaa(user_name,age,account_name);
```

查看创建好的索引：

```java
show index from consumer_info;
```

### 二、测试索引

#### 1.复合索引跳过首字段导致索引失效

- 测试一：复合索引的三个字段（user_name,age,account_name）都使用

```java
explain select * from consumer_info where user_name='xiaobai' and age=17 and account_name='xiaobai_admin';
```

可以看到使用了索引，并且ref为三个常量。此时使用到了索引，索引没有失效。

- 测试二：仅使用age和account_name字段做检索

```java
explain select * from consumer_info where  age=17 and account_name='xiaobai_admin';
```

可以从表中看到type为all：全表扫描，说明索引失效了。

- 测试三：跳过复合索引的中间字段，使用（user_name,和account_name）做检索

```java
explain select * from consumer_info where user_name='xiaobai'  and account_name='xiaobai_admin';
```

ref中只有一个const，说明只使用一个常量来索引。说明中间跳过一个索引字段之后，后面的字段索引会失效。

- 测试四： 在复合索引中使用范围查找(age字段使用范围条件)

```java
explain select * from consumer_info where user_name='xiaobai' and age>10  and account_name='xiaobai_admin';
```

使用了范围条件，索引type变为了range，同时key_len值为104，如果是全匹配应该为203，才对，说明是某个索引列失效了。

- 结论：

对于复合索引，要遵循最左前缀法则，即查询从索引的最左列开始，并且不要跳过索引中的列。

在复合索引中，范围条件后边的列索引会失效。

#### 2.在索引字段上函数、计算或者类型转换导致索引失效

- 测试一：使用user_name正常检索

```java
explain select * from consumer_info where user_name = 'xiaobai';
```

可以看到索引正常使用。

- 测试二：在user_name列使用了函数

```java
explain select * from consumer_info where left(user_name,7) = 'xiaobai';
```

发现变成了全表扫描，索引失效。

- 测试三：使用了类型转换

```java
explain select * from consumer_info where user_name = 100;
```

user_name字段本来是字符串类型，但是查询的时候使用了数值类型，倒是隐式的类型转换，索引失效。

- 结论

在索引字段上函数、计算或者类型转换会导致索引失效。

#### 3.使用 select * 与select 索引列对比

- 测试一：使用select *

```java
explain select * from consumer_info where user_name='xiaobai' and age=17  and account_name='xiaobai_admin';
```

此时extra为空。

- 测试二：使用select 索引列

```java
explain select user_name,age,account_name from consumer_info where user_name='xiaobai' and age=17  and account_name='xiaobai_admin';
```

在extra中多出了一个using idnex：表示使用了覆盖索引，避免访问了表的数据行。对性能提升有帮助。

- 结论：尽量使用覆盖索引，查询列和索引列保持一致。

#### 4.使用不等于(!= 或 <>)

- 测试一：使用=

```java
explain select * from consumer_info where user_name='xiaobai'；
```

索引正常使用。

- 测试二：使用!=

```java
explain select * from consumer_info where user_name!='xiaobai';
```

全表扫描，索引失效。

- 结论

尽量不要使用!=或者<>，因为这样会使索引失效。

#### 5.使用is null 或 is not null

- 测试一：使用is null

```java
explain select * from consumer_info where user_name is null;
```

- 测试二：使用is not null

```java
explain select * from consumer_info where user_name is not null;
```

- 结论

使用is not null 的时候会导致索引失效。

#### 6.使用like以通配符开头的检索

- 测试一：使用like：xxx%

```java
explain select * from consumer_info where user_name like 'xiaobai%';
```

用到索引了，但是不是ref，而是range

- 测试二：使用like：%xxx

```java
explain select * from consumer_info where user_name like 'xiaobai%';
```

type为all，全表扫描，索引失效。

- 测试三：使用like %xxx，并且覆盖索引查询

```java
explain select user_name,account_name from consumer_info where user_name like '%xiaobai%';
```

使用复合索引中的一个或者多个字段来做覆盖索引，可以看到此时是使用了索引的。解决了%开头索引失效的问题。

- 结论：

like以通配符%开头的条件会让索引失效。

like以通配符%开头的条件，使用覆盖索引可以解决索引失效的问题。

#### 7.使用or来查询

- 测试：

```java
explain select * from consumer_info where user_name='xiaobai' or age=17 ;
```

- 结论

在where条件中使用了or，会导致索引失效，从而全表扫描。

### 三、总结

- 对于复合索引，要遵循最左前缀法则，即查询从索引的最左列开始，并且不要跳过索引中的列。

**1、** 在复合索引中，范围条件后边的列索引会失效；

**2、** 在索引字段上函数、计算或者类型转换会导致索引失效；

**3、** 尽量使用覆盖索引，查询列和索引列保持一致；

**4、** 使用!=或者<>会使索引失效；

**5、** 使用isnotnull会导致索引失效；

**6、** like以通配符%开头的条件会让索引失效；

**7、** like以通配符%开头的条件，使用覆盖索引可以解决索引失效的问题；

**8、** 在where条件中使用了or，会导致索引失效；
