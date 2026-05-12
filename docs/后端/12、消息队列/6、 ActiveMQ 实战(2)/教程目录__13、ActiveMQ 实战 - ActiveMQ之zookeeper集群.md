# 13、ActiveMQ 实战 - ActiveMQ之zookeeper集群
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/13.html
- 分类：消息队列
- 分组：教程目录
ActiveMQ集群提高了高可用性，避免单点故障。ActiveMQ集群有以下三种方式：

**1、** 基于shareFileSystem共享文件系统（KahaDB）；

**2、** 基于JDBC；

**3、** 基于Zookeeper和LevelDB搭建的集群；

本章只重点讲解基于Zookeeper和LevelDB的集群方式，其他集群方式参考官网：[http://activemq.apache.org/masterslave](http://activemq.apache.org/masterslave)

### Zookeeper集群介绍

从ActiveMQ5.9开始,ActiveMQ的集群实现方式取消了传统的Masster-Slave方式，增加了基于Zookeeper+LevelDB的Master-Slave实现方式,从5.9版本后也是官网的推荐。

### 集群原理

使用Zookeeper集群注册所有的ActiveMQ Broker但只有其中一个Broker可以提供服务，它将被视为Master，其他的Broker处于待机状态被视为Slave。

如果Master因故障而不能提供服务，Zookeeper会从Slave中选举出一个Broker充当Master。Slave连接Master并同步他们的存储状态，Slave不接受client连接，所有的client都只会连接到Master。Master所有的存储操作都将被复制到连接至Maste的Slaves。

如果Master宕机了，则最新更新的Slave会变成Master。如果原本Master故障节点恢复，则会重新加入集群并连接新的Master进入Slave模式。

所有需要同步的消息操作都将等待存储状态被复制到其他法定节点的操作完成才能完成。 所以，如给你配置了replicas=3，name法定大小是（3/2）+1 = 2。Master将会存储更新然后等待（2-1）=1个Slave存储和更新完成，才汇报success。

在Zookeeper中，有一个node要作为观察者存在。当一个新的Master被选中，你需要至少保障一个法定node在线以能够找到拥有最新状态的node，这个node才可以成为新的Master。因此，推荐运行至少3个replica nodes以防止一个node失败后服务中断。

### 集群操作

集群环境准备：linux系统 + jdk + zookeeper + apache-activemq。

在linux操作系统上创建`mq_cluster`文件夹，以下所有下载安装的文件都放到这里。创建命令：`mkdir /opt/mq_cluster`

zookeeper安装和配置

- zookeeper下载

下载命令：`wget https://archive.apache.org/dist/zookeeper/zookeeper-3.5.3-beta/zookeeper-3.5.3-beta.tar.gz`
- 下载成功后解压3份并分别重命名为：`zk01`、`zk02`、`zk03`

解压命令：`tar -xvf zookeeper-3.5.3-beta.tar.gz`
- 配置端口

分别打开拷贝`zk01`、`zk02`和`zk03`的`conf/zoo_sample.cfg`在当前路径并重命名为`zoo.cfg`。拷贝命令：`cp zoo_sample.cfg zoo.cfg`

编辑三份`zoo.cfg`文件，连接端口分别改为`2181`、`2182`和`2183`。示例如下：
- 配置数据文件夹

分别在`zk01`、`zk02`和`zk03`目录下创建名为`data`（名称可自定义）文件夹，在修改各自的`zoo_sample.cfg`文件中修改`dataDir`值为到各自`data`文件夹的绝对路径。示例如下：
- 创建节点

在`zk01`、`zk02`和`zk03`的`data`文件夹分别创建`myid`文件，分别只写入`1`、`2`和`3`，分别各表示1、2和3号节点。
- 配置集群信息

在各自的`zoo.cfg`最后追加以下信息（三份都一样）：

`server.1=localhost:2888:3888`

`server.2=localhost:2888:3888`

`server.3=localhost:2888:3888`

`server.1`的1是一个数字，标识这个是第几号服务器。

`localhost`是zookeeper安装所在机器域名，可改成本机IP（由于我都是在同一台机器测试，所以都写成localhost。如果分别安装在了三台不同的机器，请分别将IP地址改成三台不同的IP）。

`2888`第一个端口用来集群成员的信息交换，标识这个服务器与集群中的leader服务器交换信息的端口。

`3888`是在leader挂掉时专门用来进行选举leader所用的端口。

- ActiveMQ安装和配置
- ActiveMQ下载

此处重点讲ActiveMQ集群配置，ActiveMQ下载和安装参考：[2.ActiveMQ下载和安装（Linux版）](/zhuanlan/mq/activemq/2/2.html)
- 将下载好的ActiveMQ解压3份并分别重命名为：`mq_node01`、`mq_node02`、`mq_node03`
- 修改访问控制台端口

除了`mq_node01`使用默认的控制台访问端口（8161）不用修改外，`mq_node02`和`mq_node03`控制台访问端口分别改为`8162`和`8163`。

分别在`mq_node02`和`mq_node03`路径的`conf/jetty.xml`配置文件中找到bean id为`jettyPort`，并将port属性值分别改为`8162`和`8163`。将host改为`0.0.0.0`方便外部机器远程连接访问控制台，示例如下：
- 修改brokerName

`mq_node01`、`mq_node02`和`mq_node03`的`activemq.xml`的brokerName改成一样。示例如下：
- 持久化配置

在`mq_node01`、`mq_node02`、`mq_node03`目录下的`conf/activemq.xm`将默认的persistenceAdapter替换成以下内容：

```java
<!--
<persistenceAdapter>
<kahaDB directory="${activemq.data}/kahadb"/>
</persistenceAdapter>
-->
<!-- mq_node01的bind属性值端口为63631，mq_node02的bind属性值端口为63632，mq_node03的bind属性值端口为63633 -->
<persistenceAdapter>
<replicatedLevelDB
directory="${activemq.data}/leveldb"
replicas="3"
bind="tcp://0.0.0.0:63631"
zkAddress="localhost:2181,localhost:2182,localhost:2183"
hostname="localhost"
zkPath="/activemq/leveldb-stores"
/>
</persistenceAdapter>
```

```java
directory：持久化数据路径
replicas：当前主从模型中的节点数，根据实际配置
bind：主从实例间的通讯端口。
zkAddress：zookeeper应用的安装位置
hostname：ActiveMQ实例安装的实际linux主机名
zkPath：ActiveMQ的主从信息保存在zookeeper中的什么目录　　　　　　
```

- .
- 修改消息端口

除了`mq_node01`使用默认端口（61616），同样修改`activemq.xml`，`mq_node02`和`mq_node03`端口分别改为`61617`和`616168`。示例如下：
- 测试集群

编写`zk_batch_start.sh`批量启动zookeeper：

```java
#!/bin/sh
cd /opt/mq_cluster/zk01/bin
./zkServer.sh start
cd /opt/mq_cluster/zk02/bin
./zkServer.sh start
cd /opt/mq_cluster/zk03/bin
./zkServer.sh start
```

编写`zk_batch_stop.sh`批量关闭zookeeper：

```java
#!/bin/sh
cd /opt/mq_cluster/zk01/bin
./zkServer.sh stop
cd /opt/mq_cluster/zk02/bin
./zkServer.sh stop
cd /opt/mq_cluster/zk03/bin
./zkServer.sh stop
```

编写`mq_batch_start.sh`批量开启activeMQ：

```java
#!/bin/sh
cd /opt/mq_cluster/mq_node01/bin
./activemq start
cd /opt/mq_cluster/mq_node02/bin
./activemq start
cd /opt/mq_cluster/mq_node03/bin
./activemq start
```

编写`mq_batch_stop.sh`批量关闭activeMQ：

```java
#!/bin/sh
cd /opt/mq_cluster/mq_node01/bin
./activemq stop
cd /opt/mq_cluster/mq_node02/bin
./activemq stop
cd /opt/mq_cluster/mq_node03/bin
./activemq stop
```

分别给四个批处理文件赋予执行权限，命令：`chomod 777 `

先执行`./zk_batch_start.sh`分别启动zookeeper服务，再执行`ps -ef|grep zookeeper|grep -v grep|wc -l`，如果输出3，则表示3台zookeeper服务成功启动。

再执行`./mq_batch_start.sh`分别启动activeMQ服务，`ps -ef|grep activemq|grep -v grep`查看MQ启动情况。

使用客户端连接其中一台zookeeper，`./zkCli.sh -server 127.0.0.1:2181`

查看三台activeMQ是否成功注册到了zookeeper，`ls /activemq/leveldb-stores`

可以看到三台activeMQ节点分别为：00000000016, 00000000017, 00000000018。

分别查看这三个节点的主从状态，`get /activemq/leveldb-stores/00000000016`、`get /activemq/leveldb-stores/00000000017`、`get /activemq/leveldb-stores/00000000018`。

可以看到仅仅00000000018节点的`elected`属性值不为null，则表示00000000018为Master，其他两个节点为Slave。

### 集群可用性测试

Slave不接受client连接，client只与Master连接，所以客户端连接的Broker应该使用failover协议（失败转移）。

由以上连接测试可知，Master为00000000016节点，该节点访问消息端口为61616，访问控制台（client）端口为8161。所以通过浏览器打开控制台只能使用8161，同样的，使用`lsof -i:`命令查看ActiveMQ服务启动情况，只能查看到61616端口的服务在监听着。

###### java代码连通测试#

集群测试消息生产者代码：

```java
package com.huazai.activemq.cluster;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class ClusterJMSProducer {
    // 集群地址需要换成failover协议（失败转移）
    public static final String ACTIVEMQ_URL = "failover:(tcp://192.168.64.129:61616,tcp://192.168.64.129:61617,tcp://192.168.64.129:61618)";
    // 消息队列名称
    public static final String QUEUE_NAME = "queue-cluster";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 可以用父接口Destination接受
        // Destination queue = session.createQueue(QUEUE_NAME);
        // 5.创建消息的生产者
        MessageProducer producer = session.createProducer(queue);
        // 6.通过消息生产者生产6条消息发送MQ队列
        for (int i = 0; i < 3; i++) {
            // 7.创建消息
            TextMessage textMessage = session.createTextMessage("msg" + i + ":hello world");
            // 8.将消息发送到MQ
            producer.send(textMessage);
        }
        // 9.关闭资源
        producer.close();
        session.close();
        connection.close();
        System.out.println("finish");
    }
}
```

集群测试消息消费者代码：

```java
package com.huazai.activemq.cluster;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class ClusterJMSConsumer {
    // 集群地址需要换成failover协议（失败转移）
    public static final String ACTIVEMQ_URL = "failover:(tcp://192.168.64.129:61616,tcp://192.168.64.129:61617,tcp://192.168.64.129:61618)";
    // 消息队列名称，取消息必须和存消息的队列名称一致
    public static final String QUEUE_NAME = "queue-cluster";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.CLIENT_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5.创建消费者
        MessageConsumer consumer = session.createConsumer(queue);
        while (true) {
            // 接受消息根据生产者发送消息类型强类型转换
            TextMessage message = (TextMessage) consumer.receive();
            if (message != null) {
                String text = message.getText();
                System.out.println(text);
                message.acknowledge();
//                session.commit();
            } else {
                break;
            }
        }
        consumer.close();
        session.close();
        connection.close();
    }
}
```

先启动生产者，再启动消费者代码，控制台输出如下：

###### 测试Master选举#

手动将Master的broker服务关闭（演示宕机）后，是否会从其他两台Slave中选举出一个Master呢？

由此可知，当Master宕机后，查看00000000016节点已经不存在，通过选举00000000017为新的Master。

当旧的Master服务重新连接后，是继续为Master，还是为新的Master成为Slave？

右图可知，当旧的Master重新连接后，生成了一个新的节点，并为Slave，现Master仍然是通过选举的00000000017。

###### 总结#

saysay easy，do do hard。
