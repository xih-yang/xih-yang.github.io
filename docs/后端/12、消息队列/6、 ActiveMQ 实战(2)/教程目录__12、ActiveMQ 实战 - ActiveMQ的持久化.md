# 12、ActiveMQ 实战 - ActiveMQ的持久化
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/12.html
- 分类：消息队列
- 分组：教程目录
为了避免服务器意外宕机后导致消息队列数据丢失，需要引入持久化机制保证服务器重启后恢复消息队列数据使ActiveMQ达到高可用性。

ActiveMQ的消息持久化机制有JDBC，AMQ，KahaDB和LevelDB，无论使用哪种持久化方式，消息的存储逻辑都是一致的。

就是在发送者将消息发送出去后，消息中心首先将消息存储到本地数据文件、内存数据库或者远程数据库等。再试图将消息发给接收者，成功则将消息从存储中删除，失败则继续尝试尝试发送。

消息中心启动以后，要先检查指定的存储位置是否有未成功发送的消息，如果有，则会先把存储位置中的消息发出去。

### 持久化方式

- AMQ（了解）

AMQ 消息存储是一种基于文件存储形式，它具有写入速度快和容易恢复的特点。消息存储在一个个文件中文件的默认大小为32M，当一个文件中的消息已经全部被消费，那么这个文件将被标识为可删除，在下一个清除阶段，这个文件被删除。AMQ适用于ActiveMQ5.3之前的版本
- KahaDB（重点）
- KahaDB消息存储是基于日志文件的存储方式，它是5.4版本之后默认存储方式。

在ActiveMQ安装目录的`conf/activemq.xml`文件配置了ActiveMQ的默认持久化方式。

其中，directory属性值配置了KahaDB持久化方式日志所在目录，即`data/kahadb`。官方参考地址：[http://activemq.apache.org/kahadb](http://activemq.apache.org/kahadb)

- KahaDB可用于任何场景，提高了性能和恢复能力。消息存储使用一个`事务日志`和仅仅用一个`索引文件`来存储它所有的地址。

`事务日志用于保存持久化数据，相当于新华字典内容；索引文件作为索引指向事务日志，相当于新华字典目录。`
- KahaDB是一个专门针对消息持久化的解决方案，它对典型的消息使用模型进行了优化。

数据被追加到data logs中。当不再需要log文件中的数据的时候，log文件会被丢弃。

- db-number.log（事务日志）

KahaDB存储消息到预定大小的数据纪录文件中，文件名为db-number.log。当数据文件已满时，一个新的文件会随之创建，number数值也会随之递增，它随着消息数量的增多，如每32M一个文件，文件名按照数字进行编号，如db-1.log，db-2.log······。当不再有引用到数据文件中的任何消息时，文件会被删除或者归档。
- db.data（索引文件）

该文件包含了持久化的BTree索引，索引了消息数据记录中的消息，它是消息的索引文件，本质上是B-Tree（B树），使用B-Tree作为索引指向db-number.log里面存储消息。
- db.free

记录当前db.data文件里面哪些页面是空闲的，文件具体内容是所有空闲页的ID，方便下次记录数据时，从空闲的页面开始建立索引，保证索引的连续型且没有碎片。
- db.redo

用来进行消息恢复，如果KahaDB消息存储再强制退出后启动，用于恢复BTree索引。
- lock

文件锁，表示当前kahadb独写权限的broker。
- LevelDB（了解）

LevelDB文件系统是从ActiveMQ5.8之后引进的，它和KahaDB很相似，也是基于文件的本地数据库存储形式，但是它提供比KahaDB更快的持久性，但它不再使用自定义B-Tree实现来索引预写日志，而是使用基于LevelDB的索引。相对于KahaDB它具有如下更好的优点：
- 快速更新（无需进行随机磁盘更新）
- 并发读取
- 使用硬链接快速索引快照

为什么LevelDB比KahaDB有着更好的性能，为什么现在使用KahaDB使用广泛呢？按照官网的说法是：LevelDB存储已被弃用，不再支持或推荐使用，Replicated LevelDB（可复制的LevelDB）有望取代LevelDB。推荐的存储方式是KahaDB。参考官网地址：[http://activemq.apache.org/leveldb-store](http://activemq.apache.org/leveldb-store)

如何配置LevelDB?在ActiveMQ安装目录的`conf/activemq.xml`找到`persistenceAdapter`地方将原来默认的kahaDB进行如下修改：

```java
 <persistenceAdapter>
 		<!--<kahaDB directory="${activemq.data}/kahadb"/> -->
        <levelDB directory="${activemq.data}/leveldb"/>
 </persistenceAdapter>
```

- JDBC（重点）

JDBC持久化方式顾名思义就是将数据持久化到数据库中（如mysql），实现步骤如下：

**1、** 添加mysql驱动到ActiveMQ安装目录的`lib`文件夹中；

**2、** 配置ActiveMQ.xml；

在ActiveMQ安装目录的`conf/activemq.xml`中找到`persistenceAdapter`标签替换有以下内容：

```java
<persistenceAdapter>
    <!--<kahaDB directory="${activemq.data}/kahadb"/> -->
    <jdbcPersistenceAdapter dataSource="#mysql-ds" createTablesOnStartup="true" />
</persistenceAdapter>
```

`dataSource属性值指定将要引用的持久化数据库的bean名称（后面会配置一个名为mysql-ds的bean）；createTablesOnStartup属性值是否在启动的时候创建数据库表，默认是true，这样每次启动都会去创建表了，一般是第一次启动的时候设置为true，然后再去改成false。`

**1、** 数据库连接池配置；

配置连接池之前先在数据库中建立一个数据库，比如我建立数据库名称为：activemq_test

```java
<bean id="mysql-ds" class="org.apache.commons.dbcp2.BasicDataSource" destroy-method="close">
    <!-- 数据库驱动名称，此处是mysql驱动名称-->
    <property name="driverClassName" value="com.mysql.jdbc.Driver"/>
    <!-- 连接数据库url，ip换成自己数据库所在的机器ip，数据库名为新建立数据库的名称-->
    <property name="url" value="jdbc:mysql://your ip:3306/your db's name?relaxAutoCommit=true&serverTimezone=GMT"/>
    <!-- 连接数据库用户名-->
    <property name="username" value="your username"/>
    <!-- 连接数据库密码-->
    <property name="password" value="your password"/>
    <property name="poolPreparedStatements" value="true"/>
</bean>
```

`ActiveMQ默认使用DBCP连接池，并且自带了DBCP连接池相关jar包，如果想要换成C3P0等连接池，需要自行引入相关jar包。其中bean的id属性值一定要和上面的dataSource属性值一样。`

**1、** 启动ActiveMQ；

运行命令`./activemq start`启动服务，不出意外的话，启动成功后，将会在配置的数据库中生成相应的三张表。

`表创建后记得修改activemq.xml的jdbcPersistenceAdapter标签的createTablesOnStartup属性值改为false。`

ACTIVEMQ_MSGS：消息表，Queue和Topic都存在里面。

列名
类型
字段描述

ID
bigint(20)
主键

CONTAINER
varchar(250)
消息的Destination

MSGID_PROD
varchar(250)
消息发送者的主键

MSGID_SEQ
bigint(20)
发送消息的顺序，MSGID_PROD+MSG_SEQ可以组成JMS的MessageID

EXPIRATION
bigint(20)
消息的过期时间，存储的是从1970-01-01到现在的毫秒数，0表示用不过期

MSG
blob(0)
消息本体的Java序列化对象的二进制数据

PRIORITY
bigint(20)
优先级，从0-9，数值越大优先级越高，默认0

XID
varchar(250)
-

ACTIVEMQ_ACKS：订阅关系表，如果是持久化Topic，订阅者和服务器的订阅关系保存在这个表。

列名
类型
字段描述

CONTAINER
varchar(250)
消息的Destination

SUB_DEST
varchar(250)
如果使用的是Static集群（静态集群）,将保存集群其他系统的信息

CLIENT_ID
varchar(250)
每个订阅者都必须有一个唯一的客户端ID用以区分

SUB_NAME
varchar(250)
订阅者名称

SELECTOR
varchar(250)
选择器，可以选择只消费满足条件的消息，条件可以自定义属性实现，可支持多属性AND和OR操作

LAST_ACKED_ID
bigint(20)
记录消费过消息的ID

PRIORITY
bigint(20)
优先级，从0-9，数值越大优先级越高，默认5

XID
varchar(250)
-

ACTIVEMQ_LOCK：在集群环境下才有用，只有一个Broker可以获取消息，称为Master Broker，其他的只能作为备份等待Master Broker不可用，才可能成为下一个Master Broker。这个表用于记录哪个Broker是当前的Master Broker。

列名
类型
字段描述

ID
bigint(20)
主键

TIME
bigint(20)
timestamp

BROKER_NAME
varchar(250)
当前的 master broker名称

(意外启动失败则看这里）ActiveMQ启动日志记录在安装目录的`data/activemq.log`日志文件中，启动失败的常见原因拒绝连接数据库，因为mysql默认没有开启连接远程连接的权限，比如我启动失败的错误信息如下（启动错误请根据自身情况处理）：

解决方案：开启允许远程连接mysql服务，执行脚本如下：

```java
use mysql;
select host, user, authentication_string, plugin from user;
update user set host='%' where user='root';
flush privileges;
```

`此方式是开放所有IP的root访问权限，如果是正式环境还是建议用 开放指定IP的方式。`

**1、** java代码连接测试queue；

代码参考：[4.Java编码实现ActiveMQ通讯（Queue）](/zhuanlan/mq/activemq/2/4.html)

先启动队列生产者，由于ActiveMQ默认是开启持久化方式，启动成功后，表ACTIVEMQ_MSGS表数据如下：

再启动队列消费者，消息消费成功后，数据表的数据被清空了，结论如下：

- 当DeliveryMode设置为NON_PERSISTENCE时，消息被保存在内存中。
- 当DeliveryMode设置为PERSISTENCE时，消息保存在broker的相应的文件或者数据库中。
- 点对点类型中消息一旦被Consumer消费，就从数据中删除。
- 消费前的队列消息,会被存放到数据库。

`如果开启非持久化方式，则消息不会持久化到数据表。`
**2、** java代码连接测试topic；

代码参考：[5.Java编码实现ActiveMQ通讯（Topic）](/zhuanlan/mq/activemq/2/5.html)

先启动topic订阅者，再启动主题发布者，数据表数据如下：

`一定先启动订阅者，表示该topic存在订阅者，否则发布的topic是不会持久化到数据库中，换句话说不存在订阅者的topic就是废消息，没必要持久化到JDBC中。`

结论如下：

topic与queue不同，被消费的消息不会在数据表中删除。
**3、** jdbc持久化方式+ActiveMQJournal（日志）；

jdbc持久化方式将消息持久化到数据库中虽好，但是JDBC每次消息过来，都需要去写库读库。引入

ActiveMQ Journal，使每次消息过来之后在ActiveMQ和JDBC之间加一层高速缓存，使用高速缓存写入技术，大大提高了性能。

如：当有消息过来后，消息不会立马持久化到数据库中，而是先保存到缓存中，被消费的消息也是先从缓存中读取，经过了指定的时间之后，才把缓存中的数据持久化到数据库中。如果是queue，则只持久化未被消费的消息。

用法：在activemq.xml文件中，将persistenceFactory替换掉persistenceAdapter内容

```java
<!-- <persistenceAdapter> -->
<!--<kahaDB directory="${activemq.data}/kahadb"/> -->
<!--<jdbcPersistenceAdapter dataSource="#mysql-ds" createTablesOnStartup="true" /> -->
<!-- </persistenceAdapter> -->
<persistenceFactory>
    <journalPersistenceAdapterFactory
            journalLogFiles="5"
            journalLogFileSize="32768"
            useJournal="true"
            useQuickJournal="true"
            dataSource="#mysql-ds"
            dataDirectory="../activemq-data" />
</persistenceFactory>
```

`dataSource属性值指定将要引用的持久化数据库的bean名称，dataDirectory属性指定了Journal相关的日志保存位置。成功启动后则会发现多出一个activemq-data文件夹。`

配置成功后，重启ActiveMQ服务。启动队列生产生产消息，消息不会立即同步到数据库中，如果过了一段时间后队列的消息还没被消费，则会自动持久化到数据库中。

### 总结

- 从最初的AMQ Message Store方案到ActiveMQ V4版本退出的High Performance Journal（高性能事务支持）附件，并且同步推出了关于关系型数据库的存储方案。ActiveMQ5.3版本又推出了对KahaDB的支持（5.4版本后被作为默认的持久化方案），后来ActiveMQ 5.8版本开始支持LevelDB，到现在5.9提供了标准的Zookeeper+LevelDB集群化方案。
- ActiveMQ消息持久化机制有：
- AMQ 基于日志文件
- KahaDB 基于日志文件，从ActiveMQ5.4开始默认使用
- JDBC 基于第三方数据库
- Replicated LevelDB Store 从5.9开始提供了LevelDB和Zookeeper的数据复制方法，用于Master-slave方式的首选数据复制方案。
