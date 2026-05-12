# 10、ActiveMQ 实战 - ActiveMQ的存储和持久化
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/10.html
- 分类：消息队列
- 分组：教程目录
### 官网

[click to 官网](http://activemq.apache.org/persistence)

完美的诠释了持久化数据库问题

### 体会一下面试

### redis持久化方式有几种

AOF、RDB

同样对于activemq，也是需要了解它的持久化机制

### 持久化

一句话就是：ActiveMQ宕机了，消息不会丢失的机制\color{red}一句话就是：ActiveMQ宕机了，消息不会丢失的机制一句话就是：ActiveMQ宕机了，消息不会丢失的机制

说明：为了避免意外宕机以后丢失信息，需要做到重启后可以恢复消息队列，消息系统一半都会采用持久化机制。
ActiveMQ的消息持久化机制有JDBC，AMQ，KahaDB和LevelDB\color{red}ActiveMQ的消息持久化机制有JDBC，AMQ，KahaDB和LevelDBActiveMQ的消息持久化机制有JDBC，AMQ，KahaDB和LevelDB

无论使用哪种持久化方式，消息的存储逻辑都是一致的。就是在发送者将消息发送出去后，消息中心首先将消息存储到本地数据文件、内存数据库或者远程数据库等。再试图将消息发给接收者，成功则将消息从存储中删除，失败则继续尝试尝试发送。消息中心启动以后，要先检查指定的存储位置是否有未成功发送的消息，如果有，则会先把存储位置中的消息发出去。

JDBC，AMQ，KahaDB，LevelDB和JDBCMessageStorewithActiveMQJournal下面详细说明\color{red}JDBC，AMQ，KahaDB，LevelDB和JDBCMessageStorewithActiveMQJournal下面详细说明JDBC，AMQ，KahaDB，LevelDB和JDBCMessageStorewithActiveMQJournal下面详细说明

### 详细介绍各种持久化方式

### 1. AMQ Message Store （了解，不需要掌握）

基于文件的存储机制，是以前的默认机制，现在不再使用。\color{red}基于文件的存储机制，是以前的默认机制，现在不再使用。基于文件的存储机制，是以前的默认机制，现在不再使用。
AMQ是一种文件存储形式，它具有写入速度快和容易恢复的特点。消息存储再一个个文件中文件的默认大小为32M，当一个文件中的消息已经全部被消费，那么这个文件将被标识为可删除，在下一个清除阶段，这个文件被删除。AMQ适用于ActiveMQ5.3之前的版本

一句话理解：5.3之前默认时候AMQ，现在已经更新到15，老早被淘汰了，不用管它，只需要记住这个名词即可\color{red}一句话理解：5.3之前默认时候AMQ，现在已经更新到15，老早被淘汰了，不用管它，只需要记住这个名词即可一句话理解：5.3之前默认时候AMQ，现在已经更新到15，老早被淘汰了，不用管它，只需要记住这个名词即可

### 2. kahaDB 消息存储 （5.4版本后默认 重要）

KahaDB消息存储是基于日志文件的存储方式，它是5.4版本之后默认存储方式。

#### 证明#

在ActiveMQ安装目录的conf/activemq.xml文件配置了ActiveMQ的默认持久化方式。

其中，directory属性值配置了KahaDB持久化方式日志所在目录，即data/kahadb。

官方参考地址：http://activemq.apache.org/kahadb

#### 说明#

**1、** KahaDB可用于任何场景，提高了性能和恢复能力消息存储使用一个事务日志和仅仅用一个索引文件来存储它所有的地址事务日志用于保存持久化数据，相当于新华字典内容；索引文件作为索引指向事务日志，相当于新华字典目录；

**2、** KahaDB是一个专门针对消息持久化的解决方案，它对典型的消息使用模型进行了优化；

数据被追加到data logs中。当不再需要log文件中的数据的时候，log文件会被丢弃。

#### KahaDB的存储原理#

**1、** db-number.log（事务日志）；

KahaDB存储消息到预定大小的数据纪录文件中，文件名为db-number.log。当数据文件已满时，一个新的文件会随之创建，number数值也会随之递增，它随着消息数量的增多，如每32M一个文件，文件名按照数字进行编号，如db-1.log，db-2.log······。当不再有引用到数据文件中的任何消息时，文件会被删除或者归档。

**2、** db.data（索引文件）；

该文件包含了持久化的BTree索引，索引了消息数据记录中的消息，它是消息的索引文件，本质上是B-Tree（B树），使用B-Tree作为索引指向db-number.log里面存储消息。
**3、** db.free；

记录当前db.data文件里面哪些页面是空闲的，文件具体内容是所有空闲页的ID，方便下次记录数据时，从空闲的页面开始建立索引，保证索引的连续型且没有碎片。
**4、** db.redo；

用来进行消息恢复，如果KahaDB消息存储再强制退出后启动，用于恢复BTree索引。
**5、** lock；

文件锁，表示当前kahadb独写权限的broker。

### 3. LevelDB消息存储（了解）

LevelDB文件系统是从ActiveMQ5.8之后引进的，它和KahaDB很相似，也是基于文件的本地数据库存储形式，但是它提供比KahaDB更快的持久性，但它不再使用自定义B-Tree实现来索引预写日志，而是使用基于LevelDB的索引。相对于KahaDB它具有如下更好的优点：

- 快速更新（无需进行随机磁盘更新）
- 并发读取
- 使用硬链接快速索引快照

为什么LevelDB比KahaDB有着更好的性能，为什么现在使用KahaDB使用广泛呢？

按照官网的说法是：LevelDB存储已被弃用，不再支持或推荐使用，Replicated LevelDB（可复制的LevelDB）有望取代LevelDB。推荐的存储方式是KahaDB。参考官网地址：http://activemq.apache.org/leveldb-store

如何配置LevelDB?在ActiveMQ安装目录的conf/activemq.xml找到persistenceAdapter地方将原来默认的kahaDB进行如下修改：

```java
 <persistenceAdapter>
 		<!--<kahaDB directory="${activemq.data}/kahadb"/> -->
        <levelDB directory="${activemq.data}/leveldb"/>
 </persistenceAdapter>
```

大白 话 总 结 ： 过 于 新 兴 的 技 术 ， 现 在 有 些 不 确 定 。 \color{red}大白话总结：过于新兴的技术，现在有些不确定。 大白话总结：过于新兴的技术，现在有些不确定。

### 4. JDBC消息存储（重点）

JDBC持久化方式顾名思义就是将数据持久化到数据库中（如mysql）

#### 原理图#

#### 实现步骤#

**1、** 添加mysql驱动到ActiveMQ安装目录的lib文件夹中；

**2、** 配置ActiveMQ.xml；

在ActiveMQ安装目录的conf/activemq.xml中找到persistenceAdapter标签替换有以下内容：

dataSource是指定将要引用的持久化数据库的bean名称。

createTableOnStartup是否在启动的时候创建数据库表，默认是true，这样每次启动都会去创建表了，一般是第一次启动的时候设置为true，然后再去改成false。

大白话理解：就像是Hibernate可以指定表的生成策略，如果设置为true，则每次启动都会去新建这套表，这里我就手动建表\color{red}大白话理解：就像是Hibernate可以指定表的生成策略，如果设置为true，则每次启动都会去新建这套表，这里我就手动建表大白话理解：就像是Hibernate可以指定表的生成策略，如果设置为true，则每次启动都会去新建这套表，这里我就手动建表

```xml
<!--  
<persistenceAdapter>
            <kahaDB directory="${activemq.data}/kahadb"/>
      </persistenceAdapter>
-->
<persistenceAdapter>  
      <jdbcPersistenceAdapter dataSource="#mysql-ds" createTablesOnStartup="true"/> 
</persistenceAdapter>
```

**3、** 数据库连接池配置；

配置连接池之前先在数据库中建立一个数据库，比如我建立数据库名称为：mysql-ds

```java
 <bean id="mysql-ds" class="org.apache.commons.dbcp2.BasicDataSource" destroy-method="close"> 
    <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/> 
    <property name="url" value="jdbc:mysql://自己数据库IP:3306/activemq?relaxAutoCommit=true"/> 
    <property name="username" value="自己数据库用户名"/> 
    <property name="password" value="自己数据库密码"/> 
    <property name="poolPreparedStatements" value="true"/> 
  </bean>
```

在ActiveMQ安装目录的conf/activemq.xml中的broker下面增加内容：

**1、** 建库SQL和创表说明；

创建数据库

运行命令./activemq start启动服务，不出意外的话，启动成功后，将会在配置的数据库中生成相应的三张表。

表创建后记得修改activemq.xml的jdbcPersistenceAdapter标签的createTablesOnStartup属性值改为false。\color{red}表创建后记得修改activemq.xml的jdbcPersistenceAdapter标签的createTablesOnStartup属性值改为false。表创建后记得修改activemq.xml的jdbcPersistenceAdapter标签的createTablesOnStartup属性值改为false。

#### ACTIVEMQ_MSGS：消息表，Queue和Topic都存在里面#

#### ACTIVEMQ_ACKS：订阅关系表，如果是持久化Topic，订阅者和服务器的订阅关系保存在这个表#

#### ACTIVEMQ_LOCK#

在集群环境下才有用，只有一个Broker可以获取消息，称为Master Broker，其他的只能作为备份等待Master Broker不可用，才可能成为下一个Master Broker。这个表用于记录哪个Broker是当前的Master Broker。

### 脚下留心

若修改了activemq配置文件之后，启动不了，则通过

```java
./activemq console
```

例如不小心将：createTablesOnStartup 写成 createTableOnStartup报错提示，它会具体到某一行

又入：不小心删除了关闭标签

### 详细看下一篇
