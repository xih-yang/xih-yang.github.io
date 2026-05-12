# 06、ActiveMQ 实战 - 消息存储持久化
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/6.html
- 分类：消息队列
- 分组：教程目录
## 1 消息存储机制

ActiveMQ不仅支持persistent【持久的】和non-persistent【非持久的】两种方式，还支持消息的recovery【恢复】方式。

Queue的存储是很简单的，就是一个FIFO的Queue。

对于持久化订阅主题，每一个消费者将获得一个消息的复制。

ActiveMQ提供了一个插件式的消息存储，类似于消息的多点传播，主要实现了如下几种：

AMQ消息存储，基于文件的存储方式，是以前的默认消息存储。

KahaDB消息存储，提供了容量的提升和恢复能力，是现在的默认存储方式。

JDBC消息存储，消息基于JDBC存储的。

Memory 消息存储，基于内存的消息存储。

## 2 消息存储方式

### 2.1 KahaDB消息存储

KahaDB是目前默认的存储方式，可用于任何场景，提高了性能和恢复能力。消息存储使用一个事务日志和仅仅用一个索引文件来存储它所有的地址。

KahaDB是一个专门针对消息持久化的解决方案，它对典型的消息使用模式进行了优化。在KahaDB中，数据被追加到data logs中。当不再需要log文件中的数据的时候，log文件会被丢弃。

基本配置实例：

```java
<persistenceAdapter>
             <kahaDB directory="${activemq.data}/kahadb"/>
</persistenceAdapter>
```

可用的属性有

director：KahaDB存放的路径，默认值activemq-data。

indexWriteBatchSize： 批量写入磁盘的索引page数量，默认值1000。

indexCacheSize：内存中缓存索引page的数量，默认值10000。

enableIndexWriteAsync：是否异步写出索引，默认false。

journalMaxFileLength：设置每个消息data log的大小，默认是32MB。

enableJournalDiskSyncs：设置是否保证每个没有事务的内容，被同步写入磁盘，JMS持久化的时候需要，默认为true。

cleanupInterval：在检查到不再使用的消息后，在具体删除消息前的时间，默认30000。

checkpointInterval：checkpoint的间隔时间，默认5000。

ignoreMissingJournalfiles：是否忽略丢失的消息日志文件，默认false。

checkForCorruptJournalFiles：在启动的时候，将会验证消息文件是否损坏，默认false。

checksumJournalFiles：是否为每个消息日志文件提供checksum，默认false。

archiveDataLogs： 是否移动文件到特定的路径，而不是删除它们，默认false。

directoryArchive：定义消息已经被消费过后，移动data log到的路径，默认null。

databaseLockedWaitDelay：获得数据库锁的等待时间 (used by shared master/slave)，默认10000。

maxAsyncJobs：设置最大的可以存储的异步消息队列，默认值10000，可以和concurrentMessageProducers 设置成一样的值。

concurrentStoreAndDispatchTransactions：是否分发消息到客户端，同时事务存储消息，默认true。

concurrentStoreAndDispatchTopics：是否分发Topic消息到客户端，同时进行存储，默认true。

concurrentStoreAndDispatchQueues：是否分发queue消息到客户端，同时进行存储，默认true。

### 2.2 AMQ Message Store

AMQMessage Store是ActiveMQ5.0缺省的持久化存储，它是一个基于文件、事务存储设计为快速消息存储的一个结构，该结构是以流的形式来进行消息交互的。

这种方式中，Messages被保存到data logs中，同时被reference store进行索引以提高存取速度。Date logs由一些单独的data log文件组成，缺省的文件大小是32M，如果某个消息的大小超过了data log文件的大小，那么可以修改配置以增加data log文件的大小。如果某个data log文件中所有的消息都被成功消费了，那么这个data log文件将会被标记，以便在下一轮的清理中被删除或者归档。

```java
<broker brokerName="broker" persistent="true" useShutdownHook="false">
          <persistenceAdapter>
                    <amqPersistenceAdapter directory="${activemq.base}/data" maxFileLength="32mb"/>
          </persistenceAdapter>
</broker>
```

### 2.3 JDBC持久化消息

修改配置文件：

1）修改persistenceAdapter

```java
<persistenceAdapter>
          <jdbcPersistenceAdapter dataSource="#my-ds"/>
</persistenceAdapter>
```

2）增加数据源

```java
<bean id="my-ds" class="org.apache.commons.dbcp2.BasicDataSource" destroy-method="close">
             <property name="driverClassName" value="com.mysql.jdbc.Driver" />
             <property name="url" value="jdbc:mysql://192.168.45.1:3306/activemq?characterEncoding=utf-8" />
             <property name="username" value="root" />
          <property name="password" value="hwl123" />
          <property name="initialSize" value="5" />
          <property name="maxTotal" value="100" />
          <property name="maxIdle" value="30" />
          <property name="maxWaitMillis" value="10000" />
          <property name="minIdle" value="1" />
</bean>
```

3）引入mysql-connector和commons-dpcp2 jar包

4）允许mysql远程连接

1GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'hwl123'

2flush privileges;

5）Journal性能提升

这种方式克服了JDBC Store的不足，使用快速的缓存写入技术，大大提高了性能。 配置示例如下

```java
<beans>
          <broker brokerName="test-broker" xmlns="http://activemq.apache.org/schema/core">
                    <persistenceFactory>
                              <journalPersistenceAdapterFactory
                              journalLogFiles="4"
                              journalLogFileSize="32768"
                              useJournal="true"
                              useQuickJournal="true"
                              dataSource="#my-ds"
                              dataDirectory="activemq-data" />
                    </persistenceFactory>
          </broker>
</beans>
```

JDBC Store和JDBC Message Store with ActiveMQ Journal的区别

1、Jdbc with journal的性能优于jdbc。

2、Jdbc用于master/slave模式的数据库分享。

3、Jdbc with journal不能用于master/slave模式。

4、一般情况下，推荐使用jdbc with journal。

### 2.4 memory message store

内存消息存储主要是存储所有的持久化消息在内存中，这里没有动态缓存存在，所以必须注意设置broker所在的jvm内存限制

内存消息存储配置只需要配置消息持久化为false即可

```java
<beans>
   <broker brokerName="test-broker" xmlns="http://activemq.apache.org/schema/core" persistent="false"></broker>
<beans>
```
