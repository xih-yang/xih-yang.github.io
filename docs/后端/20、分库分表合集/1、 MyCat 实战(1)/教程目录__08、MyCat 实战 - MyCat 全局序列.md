# 08、MyCat 实战 - MyCat 全局序列
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/1/8.html
- 分类：分库分表
- 分组：教程目录
## 全局序列号介绍

在实现分库分表的情况下，数据库自增主键已无法保证自增主键的全局唯一。为此，MyCat 提供了全局 sequence，并且提供了包含本地配置和数据库配置等多种实现方式。

## 1.本地文件方式

**原理：**

此方式MyCat 将 sequence 配置到文件中，当使用到 sequence 中的配置后，MyCat 会更新 sequence_conf.properties文件中 sequence 当前的值。

**配置方式：**

**1.** 在 **conf/sequence_conf.properties**文件中做如下配置。此处为 users 表创建序列，如下图

**2.** 在server.xml 中配置 sequnceHandlerType 属性。**0表示使用本地文件方式**

**(注意：修改配置后，二选一方式。通过 ①MyCat管理端 reload @@config_all ②重启 mycat 服务，使配置生效)**

**使用示例：**

**优缺点：**

**优点：** 本地加载，读取速度较快。

**缺点：** 当MyCAT重新发布后，配置文件中的 sequence 会恢复到初始值。

**疑惑之处：**

> next value for MYCATSEQ_USERS 如果不加 引号，则会报错：Lost connection to MySQL server during query。查看教程发现不加引号也不会出错，目前不清楚是什么原因。难道是版本的问题？？有知道的可以告诉一下我哈。

## 2.数据库方式

**原理：**

在数据库中建立一张表，存放 sequence 名称(name)，sequence 当前值(current_value)，步长(increment，int类型每次读取多少个sequence，假设为K)等信息；

**Sequence 获取步骤：**

1、当初次使用该 sequence 时，根据传入的 sequence 名称，从数据库这张表中读取 current_value 和 increment 到 MyCat 中，并将数据库中的 current_value 设置为原 current_value 值 + increment 值。

2、MyCat 将读取到 current_value + increment 作为本次要使用的 sequence 值，下次使用时，自动加1，当使用 increment 次后，执行步骤1)相同的操作。

3、MyCat 负责维护这张表，用到哪些 sequence，只需要在这张表中插入一条记录即可。若某次读取的 sequence 没有用完，系统就停掉了，则这次读取的sequence剩余值不会再使用。

**配置方式：**

**1.** 在server.xml 中配置 sequnceHandlerType 属性。**1表示使用数据库方式**

**数据库配置：**

**注意：MYCAT_SEQUENCE表和创建的3个function函数，需要放在同一个节点上。创建表和 function 请直接在具体节点的数据库上执行。****切记别在 MyCat 上执行，需要在真实的物理库中执行！！！****本例直接在 db_userHOST1 节点主机执行(节点信息见下图)**

**1.创建 MYCAT_SEQUENCE 表（表名可大写，可小写）**

> 表头介绍：
>
> name sequence名称
>
> current_value 当前value
>
> increment 增长步长! 可理解为mycat在数据库中一次读取多少个sequence. 当这些用完后, 下次再从数据库中读取。

**SQL语句：**

```java
-- 建表语句
DROP TABLE IF EXISTS MYCAT_SEQUENCE;
CREATE TABLE MYCAT_SEQUENCE (name VARCHAR(50) NOT NULL,current_value INT NOT NULL,increment INT NOT NULL DEFAULT 100, PRIMARY KEY(name)) ENGINE=InnoDB;
-- 插入具有自增ID的sequence
-- GLOBAL全局序列
INSERT INTO MYCAT_SEQUENCE(name,current_value,increment) VALUES ('GLOBAL', 100000,100);
-- 本例，为users表添加全局序列,如下所示
INSERT INTO MYCAT_SEQUENCE(name,current_value,increment) VALUES ('USERS', 100000,100);
```

**2.创建存储函数 function**

```java
-- 1.传入序列名,获取当前sequence的值
DROP FUNCTION IF EXISTS MYCAT_SEQ_CURRVAL;
DELIMITER $$
CREATE FUNCTION mycat_seq_currval(SEQ_NAME VARCHAR(50)) RETURNS VARCHAR(64) CHARSET utf8
DETERMINISTIC
BEGIN
DECLARE RETVAL VARCHAR(64);
SET RETVAL = "-999999999,NULL";
SELECT CONCAT(CAST(CURRENT_VALUE AS CHAR), ",", CAST(INCREMENT AS CHAR)) INTO RETVAL FROM MYCAT_SEQUENCE WHERE NAME = SEQ_NAME;
RETURN RETVAL;
END$$
DELIMITER ;
-- 2.给指定的 sequence 设定值
DROP FUNCTION IF EXISTS MYCAT_SEQ_SETVAL;
DELIMITER $$
CREATE FUNCTION mycat_seq_setval(SEQ_NAME VARCHAR(50),VALUE INTEGER) RETURNS        VARCHAR(64) CHARSET UTF8
DETERMINISTIC
BEGIN
UPDATE MYCAT_SEQUENCE
SET CURRENT_VALUE = VALUE
WHERE NAME = SEQ_NAME;
RETURN MYCAT_SEQ_CURRVAL(SEQ_NAME);
END$$
DELIMITER ;
-- 3.获取传入序列名的下一个sequence值
DROP FUNCTION IF EXISTS MYCAT_SEQ_NEXTVAL;
DELIMITER $$
CREATE FUNCTION mycat_seq_nextval(SEQ_NAME VARCHAR(50)) RETURNS VARCHAR(64)  CHARSET UTF8
DETERMINISTIC
BEGIN
UPDATE MYCAT_SEQUENCE
SET CURRENT_VALUE = CURRENT_VALUE + INCREMENT WHERE NAME = SEQ_NAME;
RETURN MYCAT_SEQ_CURRVAL(SEQ_NAME);
END$$
DELIMITER ;
-- 至此，数据库方面的准备工作已结束完毕。
```

**schema.xml 配置：(MyCat中修改schema.xml文件，在指定的 schema 中加入 mycat_sequence 表，如下图所示)**

```java
-- 在指定的 schema 中加入 mycat_sequence 表
<table name="mycat_sequence" dataNode="db_user_dataNode2"/>
```

至此位置，创建库、3个函数、schema.xml 配置完成。

**接下来完成对 conf/sequence_db_conf.properties 文件的相关配置，指定 sequence 相关配置在哪个节点上，通过 vim 命令来完成对 sequence_db_conf.properties 文件的配置，如下图所示**

至此位置，MyCat 全局序列(数据库方式)配置全部完成。接下来开始测试工作。

**(注意：修改配置后，二选一方式。通过 ①MyCat管理端 reload @@config_all ②重启 mycat 服务，使配置生效)**

**测试：(在MyCat中测试)**

> 数据库方式有如下两种使用方式：①使用next value for MYCATSEQ_XXX 或者 ②指定autoIncrement

**1.next value for MYCATSEQ_XXX 测试**

**2.指定autoIncrement 测试（修改MyCat配置文件schema.xml，然后****reload @@config_al 或 重启MyCat，使配置生效****）**

**优缺点：**

**优点：** 在MyCat重启后，sequence值不会被初始化；

**缺点：** 如果存取sequence的数据库挂了，会遇到单点故障；

## 3.本地时间戳方式

**实现方式：**

**ID = 64 位二进制 (42(毫秒)+5(机器 ID)+5(业务编码)+12(重复累加)**

**换算成十进制为 18 位数的 long 类型，每毫秒可以并发 12 位二进制的累加。**

**配置方式：**

**1.** 在server.xml 中配置 sequnceHandlerType 属性。**2表示使用本地时间戳方式**

**2.** 在 MyCat 下，对 conf/sequence_time_conf.properties 文件进行配置

**注意：** 多个MyCat节点下每个mycat配置的 WORKID，DATAACENTERID不同，组成唯一标识，总共支持32*32=1024种组合

**3.** 修改MyCat schema.xml 文件，指定 autoIncrement=true

**(注意：修改配置后，二选一方式。通过 ①MyCat管理端 reload @@config_all ②重启 mycat 服务，使配置生效)**

**测试：**(执行 insert 语句)

```java
insert into users(phoneNum) values('13699999999');
```

如果出现如上错误：**Out of range value for column 'userID' at row 1**，说明主键为int 类型，长度不够导致的。**使用时间戳的方式实现全局唯一主键的话，主键的类型要是bigint**

**修改主键类型为 bigint 后，再次执行 insert 语句，你会看到已经可以成功插入数据，如下图所示。**

**优缺点：**

**优点：** 不存在上面两种方式(本地文件方式、数据库方式)因为MyCat的重启导致id重复的现象

**缺点：** 数据类型太长，建议采用bigint(最大取值18446744073709551615）

## 4.分布式ZK ID生成器

## 5. ZK递增方式

## 6.其他方式

snowflake 算法

UUID

Redis 方式

程序本身自动生成ID方式 等
