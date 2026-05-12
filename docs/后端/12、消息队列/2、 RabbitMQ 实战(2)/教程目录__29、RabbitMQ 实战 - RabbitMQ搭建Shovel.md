# 29、RabbitMQ 实战 - RabbitMQ搭建Shovel
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/29.html
- 分类：消息队列
- 分组：教程目录
前言：

Federation具备的数据转发功能类似，Shovel能够可靠、持续地从一个Broker中的队列(作为源端，即source)拉取数据并转发至另一个Broker中的交换器(作为目的端，即destination)。作为源端的队列和作为目的端的交换器可以同时位于同一个Broker，也可以位于不同的Broker 上。Shovel可以翻译为"铲子"，是一种比较形象的比喻，这个"铲子"可以将消息从一方"铲子"另一方。Shovel行为就像优秀的客户端应用程序能够负责连接源和目的地、负责消息的读写及负责连接失败问题的处理。

**1、** Shovel工作原理图；

分别往Q1和Q2各自发送一条消息，Q1的消息也会通过Shovel发送给Q2，所以Q1收到1条消息，Q2收到2条消息

**2、** 搭建shovel；

(1)分别在3个RabbitMQ节点上安装shovel插件

```java
rabbitmq-plugins enable rabbitmq_shovel
```

效果图：

node1：

node2：

node3：

(2)分别在3个RabbitMQ节点上安装shovel管理插件

```java
rabbitmq-plugins enable rabbitmq_shovel_managemen
```

效果图：

node1：

node2：

node3：

(3)进入Admin页面，可以发现多出了2个与shovel有关的菜单

(4)新增shovel

(5)填写shovel的相关信息

(6)新增shovel

效果图：

(7)点击Shovel Status菜单查看Shovel的运行状态，若状态显示running，则证明Shovel正在正常运行，若这时候往Q1队列发送消息，消息会自动同步到Q2
