# 11、ActiveMQ 实战 - ActiveMQ的存储和持久化2 （续篇）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/11.html
- 分类：消息队列
- 分组：教程目录
### 前言

关于整合配置详细看上一篇：

[ActiveMQ 实战 - ActiveMQ的存储和持久化](/zhuanlan/mq/activemq/3/10.html)

### 验证

## 队列验证

脚下留心：生产者一定要设置持久化，才会持久化到数据库\color{red}脚下留心：生产者一定要设置持久化，才会持久化到数据库脚下留心：生产者一定要设置持久化，才会持久化到数据库

#### 案例1#

生产者生产消息

代码都没变，就不贴出代码了

查看数据库，发现多了三条数据，说明数据持久化到数据库了

#### 案例2#

消费者消费消息

**1、** 启动消费者；

查看数据库：

### 小总结

在点对点类型中

当DeliveryMode设置为NON_PERSISTENCE时，消息被保存在内存中

当DeliveryMode设置为PERSISTENCE时，消息保存在broker的相应的文件或者数据库中。

而且点对点类型中消息一旦被Consumer消费，就从数据中删除

消费前的消息,会被存放到数据库

## Topic验证

**1、** 先订阅，一定要持久化；

查看数据库：

**2、** 后生产消息；

消费完后：

将订阅者关闭

## 小总结

如果是queue

在没有消费者消费的情况下会将消息保存到activemq_msgs表中，只要有任意一个消费者消费了，就会删除消费过的消息

如果是topic，

一般是先启动消费订阅者然后再生产的情况下会将持久订阅者永久保存到qctivemq_acks，而消息则永久保存在activemq_msgs，

在acks表中的订阅者有一个last_ack_id对应了activemq_msgs中的id字段，这样就知道订阅者最后收到的消息是哪一条。

### 开发遇到坑

在配置关系型数据库作为ActiveMQ的持久化存储方案时，有坑

**1、** 数据库jar包，注意把对应版本的数据库jar或者你自己使用的非自带的数据库连接池jar包\color{red}1.数据库jar包，注意把对应版本的数据库jar或者你自己使用的非自带的数据库连接池jar包1.数据库jar包，注意把对应版本的数据库jar或者你自己使用的非自带的数据库连接池jar包；

**2、** createTablesOnStartup属性默认为true，每次启动activemq都会自动创建表，在第一次启动后，应改为false，\color{red}2.createTablesOnStartup属性默认为true，每次启动activemq都会自动创建表，在第一次启动后，应改为false，2.createTablesOnStartup属性默认为true，每次启动activemq都会自动创建表，在第一次启动后，应改为false，避免不必要的损失；

**3、** java.lang.IllegalStateException:LifecycleProcessornotinitialized确认计算机主机名名称没有下划线\color{red}3.java.lang.IllegalStateException:LifecycleProcessornotinitialized确认计算机主机名名称没有下划线3.java.lang.IllegalStateException:LifecycleProcessornotinitialized确认计算机主机名名称没有下划线；

### 续上一篇文章：详细介绍各种持久化方式~第五种

### 5. JDBC Message Store with ActiveMQ Journal

jdbc持久化方式将消息持久化到数据库中虽好，但是JDBC每次消息过来，都需要去写库读库。引入

ActiveMQ Journal，使每次消息过来之后在ActiveMQ和JDBC之间加一层高速缓存，使用高速缓存写入技术，大大提高了性能。

如：当有消息过来后，消息不会立马持久化到数据库中，而是先保存到缓存中，被消费的消息也是先从缓存中读取，经过了指定的时间之后，才把缓存中的数据持久化到数据库中。如果是queue，则只持久化未被消费的消息。

举个例子：生产者生产了1000条消息，这1000条消息会保存到journal文件，如果消费者的消费速度很快的情况下，在journal文件还没有同步到DB之前，消费者已经消费了90%的以上消息，那么这个时候只需要同步剩余的10%的消息到DB。如果消费者的速度很慢，这个时候journal文件可以使消息以批量方式写到DB。

为了高性能，这种方式使用日志文件存储+数据库存储。先将消息持久到日志文件，等待一段时间再将未消费的消息持久到数据库。该方式要比JDBC性能要高。

用法：在activemq.xml文件中，将persistenceFactory替换掉persistenceAdapter内容

```xml
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

至此，就可以了

### 小总结

持久化消息主要指的是：

MQ所在服务器宕机了消息不会丢试的机制。

持久化机制演变的过程：

从最初的AMQ Message Store方案到ActiveMQ V4版本退出的High Performance Journal（高性能事务支持）附件，并且同步推出了关于关系型数据库的存储方案。ActiveMQ5.3版本又推出了对KahaDB的支持（5.4版本后被作为默认的持久化方案），后来ActiveMQ 5.8版本开始支持LevelDB，到现在5.9提供了标准的Zookeeper+LevelDB集群化方案。

ActiveMQ消息持久化机制有：

- List itemAMQ 基于日志文件
- KahaDB 基于日志文件，从ActiveMQ5.4开始默认使用
- JDBC 基于第三方数据库

Replicated LevelDB Store 从5.9开始提供了LevelDB和Zookeeper的数据复制方法，用于Master-slave方式的首选数据复制方案。
