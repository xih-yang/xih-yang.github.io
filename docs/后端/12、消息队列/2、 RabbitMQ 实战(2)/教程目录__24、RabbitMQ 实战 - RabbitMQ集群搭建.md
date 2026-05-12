# 24、RabbitMQ 实战 - RabbitMQ集群搭建
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/24.html
- 分类：消息队列
- 分组：教程目录
前言：当RabbitMQ服务器遇到内存崩溃、机器掉电或者主板故障等情况，该怎么办?单台RabbitMQ服务器可以满足每秒1000条消息的吞吐量，那如果应用需要RabbitMQ服务满足每秒10万条消息的吞吐量呢?购买昂贵的服务器来增强单机RabbitMQ服务的性能不太现实，再强的服务器也会有宕机的风险，所以搭建一个RabbitMQ集群才是解决实际问题的关键。

集群示意图

前期准备：

(1)准备3台服务器或者虚拟机

(2)3台服务器或者虚拟机都安装了RabbitMQ

安装步骤可以看我这篇文章：[RabbitMQ系列（2）--Linux安装RabbitMQ_Ken_1115的博客-CSDN博客](/zhuanlan/mq/activemq/2/2.html)

我这里准备了3台虚拟机，ip分别为192.168.194.128、192.168.194.129、192.168.194.130

**1、** 分别在3台服务器输入以下命令，然后分别更改3台服务器的主机名称；

```java
vim /etc/hostname
```

**2、** 更改主机名称后输入以下命令重启，使变更生效；

```java
reboot
```

**3、** 配置每个节点的hosts文件，让各个节点间能互相访问对方；

使用以下命令编辑每个节点的hosts文件，并给各个节点的ip映射成对应的节点名称，然后保存并退出hosts文件

```java
vim /etc/hosts
```

例：

node1

node2

node3

**4、** 因为搭建RabbitMQ集群要求erlang的cookie必须一模一样，所以得确保各个节点的cookie文件使用同一个值；

在node1节点执行以下2条命令，用以把node1节点的cookie复制到node2、node3节点上去，保证3个节点的cookie都一致

```java
scp /var/lib/rabbitmq/.erlang.cookie root@node2:/var/lib/rabbitmq/.erlang.cookie
```

```java
scp /var/lib/rabbitmq/.erlang.cookie root@node3:/var/lib/rabbitmq/.erlang.cookie
```

效果图：

**5、** 分别重启3个节点上的RabbitMQ服务和Erlang虚拟机；

在3台节点上分别执行以下命令重启

```java
rabbitmq-server -detached
```

效果图：

**6、** 以node1节点为集群，分别将node2和node3节点加入集群；

(1)将node2节点加入集群

[1]把RabbitMQ服务关闭

```java
#注：rabbitmqctl stop命令会将Erlang虚拟机关闭，而rabbitmqctl stop_app命令只会关闭RabbitMQ服务
rabbitmqctl stop_app
```

效果图：

[2]重置RabbitMQ服务

```java
rabbitmqctl reset
```

效果图：

[3]将当前节点加入到node1节点当中

```java
rabbitmqctl join_cluster rabbit@node1
```

效果图：

[4]启动RabbitMQ服务

```java
#注：这个命令只启动应用服务
rabbitmqctl start_app
```

效果图：

(2)将node3节点加入集群

[1]把RabbitMQ服务关闭

```java
#注：rabbitmqctl stop命令会将Erlang虚拟机关闭，而rabbitmqctl stop_app命令只会关闭RabbitMQ服务
rabbitmqctl stop_app
```

效果图：

[2]重置RabbitMQ服务

```java
rabbitmqctl reset
```

效果图：

[3]将当前节点加入到node2节点当中（因为node2已经加入到了node1，node2处在集群中，所以把node3加入node2也能把node3加入到集群中）

```java
rabbitmqctl join_cluster rabbit@node2
```

效果图：

[4]启动RabbitMQ服务

```java
#注：这个命令只启动应用服务
rabbitmqctl start_app
```

效果图：

**7、** 查看集群的状态；

```java
rabbitmqctl cluster_status
```

**8、** 为集群创建一个账号；

```java
rabbitmqctl add_user admin 123456
```

效果图：

**9、** 为账号设置角色；

```java
rabbitmqctl set_user_tags admin administrator
```

效果图：

**10、** 设置用户权限；

```java
rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
```

效果图：

**11、** 登录其中一个节点；

从图中我们可以看到有3个节点，这证明node1、node2、node3是一个集群，即搭建RabbitMQ集群成功

**12、** 查看节点信息（由于我们在第6步里重置了RabbitMQ，所以所有的交换机、队列除了默认的之外，其他的都被清掉了）；

其他：

**1、** 解除集群节点；

[1]把RabbitMQ服务关闭

```java
#注：rabbitmqctl stop命令会将Erlang虚拟机关闭，而rabbitmqctl stop_app命令只会关闭RabbitMQ服务
rabbitmqctl stop_app
```

[2]重置RabbitMQ服务

```java
rabbitmqctl reset
```

[3]将当前节点加入到node1节点当中

```java
rabbitmqctl join_cluster rabbit@node1
```

[4]启动RabbitMQ服务

```java
#注：这个命令只启动应用服务
rabbitmqctl start_app
```

[5]脱离集群（在node1节点上执行）

```java
#node2为需要脱离集群的节点
rabbitmqctl forget_cluster_node rabbit@node2
```
