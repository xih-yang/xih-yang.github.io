# 10、MySQL 教程 - MySQL 性能分析工具：定位执行慢的SQL~慢查询日志
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/10.html
- 分类：缓存数据库
- 分组：教程目录
定位执行慢的SQL ：慢查询日志

MySQl的慢查询日志，用来记录在MySQL中响应时间超过阈值的语句，具体指运行时间超过long_query_time值的SQL，则会被记录到慢查询日志中。long_query_time的默认值为10，意思是运行10秒以上（不含10秒）的语句，认为是超出了我们的最大忍耐时间。

它的主要作用是，帮助我们发现那些执行时间特别长的SQL查询，并且有针对性的进行优化，从而提高系统的整体效率。当我们的数据库服务器发生阻塞、运行变慢的时候，检查一下慢查询日志，找出那些慢查询，对解决问题很有帮助。比如一条SQL执行超过5秒中，我们就算慢SQL。希望能收集超过5秒的SQl，结合explain进行全面根系。

默认情况下，MySQL数据库没有开启慢查询日志，需要我们手动来设置这个参数。如果不是调优需要的话，一般不建议启动该参数，因为开启慢查询日志会或多或少带来一定的性能影响。

慢查询日志支持将日志记录写入文件。

## 1. 开启慢查询日志参数

查询慢查询日志是否开启：

```java
show variables like 'slow_query_log';
```

将慢查询日志打开：

```java
set global slow_query_log='on';
```

查看慢查询日志是否开启，慢查询日志文件的位置：

```java
show variables like 'slow_query_log%';
```

## 2. 修改long_query_time阈值

查看慢查询的时间阈值设置，使用如下命令：

```java
show variables like '%long_query_time%';
```

这里如果我们想把时间缩短，比如设置为 1 秒，可以这样设置：

```java
// 全局会话
set global long_query_time = 1;
// 当前会话
set long_query_time=1;
```

## 3. 查询慢查询的条目数

查询当前系统中有多少条慢查询记录：

```java
SHOW GLOBAL STATUS LIKE '%Slow_queries%';
```

用于测试的数据准备：

```java
// 1、创建表
CREATE TABLE student (
id INT(11) NOT NULL AUTO_INCREMENT,
stuno INT NOT NULL ,
name VARCHAR(20) DEFAULT NULL,
age INT(3) DEFAULT NULL,
classId INT(11) DEFAULT NULL,
PRIMARY KEY (id)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
// 2、设置参数 log_bin_trust_function_creators允许创建函数
set global log_bin_trust_function_creators=1;
// 3、创建函数
// 产生随机字符串
DELIMITER //
CREATE FUNCTION rand_string(n INT)
RETURNS VARCHAR(255)该函数会返回一个字符串
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
// 产生随机数值
DELIMITER //
CREATE FUNCTION rand_num (from_num INT ,to_num INT) RETURNS INT(11)
BEGIN
DECLARE i INT DEFAULT 0;
SET i = FLOOR(from_num +RAND()*(to_num - from_num+1)) ;
RETURN i;
END //
DELIMITER ;
// 4、创建存储过程
DELIMITER //
CREATE PROCEDURE insert_stu1( START INT , max_num INT )
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0;设置手动提交事务
REPEAT循环
SET i = i + 1;赋值
INSERT INTO student (stuno, NAME ,age ,classId ) VALUES
((START+i),rand_string(6),rand_num(10,100),rand_num(10,1000));
UNTIL i = max_num
END REPEAT;
COMMIT;提交事务
END //
DELIMITER ;
// 5、调用存储过程
// 调用刚刚写好的函数, 4000000条记录,从100001号开始
CALL insert_stu1(100001,4000000);
```

执行两条查询语句：

```java
select * from student where stuno=3455655;
select * from student where name='RMkRAc';
```

查询当前系统中有多少条慢查询记录：

```java
show global status like 'slow_queries';
```

可以看到共有2条慢查询记录。

## 4. 慢查询日志分析工具：mysqldumpslow

在生产环境中，如果要手工分析日志，查找、分析SQL，显然是个体力活，MySQL提供了日志分析工具 `mysqldumpslow` 。 查看`mysqldumpslow`的帮助信息：

```java
perl mysqldumpslow.pl --help
```

`mysqldumpslow`命令的具体参数如下：

```java
-a: 不将数字抽象成N，字符串抽象成S
-s: 是表示按照何种方式排序：
c: 访问次数
l: 锁定时间
r: 返回记录
t: 查询时间
al:平均锁定时间
ar:平均返回记录数
at:平均查询时间 （默认方式）
ac:平均查询次数
-t: 即为返回前面多少条的数据；
```

**举例：**

查看慢查询日志的位置：

```java
show variables like 'slow_query_log%'
```

按照查询时间排序，查看前五条 SQL 语句，可以这样写：

```java
perl mysqldumpslow.pl -s t -t 5 F:\installbag\mysql-8.0.27-winx64\data\LAPTOP-6TF38M5O-slow.log
```

因为没有加`-a`参数，因此会将数字抽象成`N`，字符串抽象成`S`，假如加入`-a`参数：

**举例：**

```java
// 得到返回记录集最多的10个SQL
perl mysqldumpslow.pl -a -s r -t 5 F:\installbag\mysql-8.0.27-winx64\data\LAPTOP-6TF38M5O-slow.log
// 得到访问次数最多的10个SQL 
perl mysqldumpslow.pl -a -s c -t 5 F:\installbag\mysql-8.0.27-winx64\data\LAPTOP-6TF38M5O-slow.log  
// 得到按照时间排序的前10条里面含有左连接的查询语句 
perl mysqldumpslow.pl -a -s t -t 10 -g "left join" F:\installbag\mysql-8.0.27-winx64\data\LAPTOP-6TF38M5O-slow.log      
// 建议在使用这些命令时结合 | 和more 使用 ，否则有可能出现爆屏情况
perl mysqldumpslow.pl -a -s r -t 10 -g "left join" F:\installbag\mysql-8.0.27-winx64\data\LAPTOP-6TF38M5O-slow.log |more     
```

## 5. 关闭慢查询日志

**方式1：永久性方式**

```java
[mysqld]
slow_query_log=OFF
```

重启MySQL服务，执行如下语句查询慢日志功能：

```java
SHOW VARIABLES LIKE '%slow%';查询慢查询日志所在目录
SHOW VARIABLES LIKE '%long_query_time%';查询超时时长
```

**方式2：临时性方式**

（1）停止MySQL慢查询日志功能：

```java
set global slow_query_log=off;
```

（2）重启MySQL服务，使用show语句查询慢查询日志功能信息：

```java
show variables like '%slow%';
show variables like '%long_query_time%';
```
