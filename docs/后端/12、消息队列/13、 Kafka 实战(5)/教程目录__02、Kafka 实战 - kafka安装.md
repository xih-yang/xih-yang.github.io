# 02、Kafka 实战 - kafka安装
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/2.html
- 分类：消息队列
- 分组：教程目录
> kafka 安装

集群方式安装，非单机模式

### 下载kafka

[download kafka (apache.org)](https://archive.apache.org/dist/kafka/)

本次使用版本是：*kafka_2.11-0.11.0.0.tgz*

### 准备工作

由于本次使用的kafka版本低，所以还需要准备zookeeper集群环境。

zookeeper集群搭建

三台kafka服务器：

- 192.168.171.132
- 192.168.171.133
- 192.168.171.134

下载好的安装包自行上传到服务器，上传路径自己指定

### 搭建kafka集群

#### 解压安装包

```java
cd /opt
tar -zxvf kafka_2.11-0.11.0.0.tgz
```

可以修改一下解压目录名称，不修改也可以

```java
mv kafka_2.11-0.11.0.0 kafka
```

#### 创建logs目录

进入到kafka目录下，创建logs文件夹

```java
cd /opt/kafka
mkdir logs
```

#### 修改配置文件

```java
cd /opt/kafka/config
# 编辑server.properties
vim server.properties
```

找到以下配置修改，其余配置可以默认不动：

```java
#broker 的全局唯一编号，不能重复，另外的服务器可使用1 2
broker.id=0
#删除 topic 功能使能
delete.topic.enable=true 
#kafka 运行数据日志存放的路径，上面步骤创建的logs文件夹
log.dirs=/opt/kafka/logs
# 配置zookeeper集群
zookeeper.connect=192.168.171.132:2181,192.168.171.133:2181,192.168.171.134:2181
```

#### 环境变量配置

```java
vim /etc/profile
```

添加配置：

```java
#set kafka
export KAFKA_HOME=/opt/kafka
export PATH=$PATH:$KAFKA_HOME/bin
```

```java
#使环境配置生效
source /etc/profile
```

#### 分发安装包

使用命令：

```java
xsync kafka/
```

**注意：分发之后记得配置其他机器的环境变量**

**注：broker.id 不得重复**

或者重复上面的操作步骤在另外的服务器上再次操作一遍。

### 启动kafka集群

依次进入到三台服务器的`bin`目录，执行：

```java
kafka-server-start.sh -daemon ../config/server.properties
```

`-daemon`以进程式的方式启动kafka，不然启动的窗口是阻塞式的，不方便操作

### 关闭kafka集群

```java
kafka-server-stop.sh stop
```

关闭的时候，可能会有点延迟，ps查看进程可能还会存在kafka的信息，稍等一会后再查看即可。

### 群起kafka脚本

**本脚本服务器ip等信息是根据上面安装的环境来的，实际中根据自己的环境替换配置**

**1、** 首先需要设置每个服务器的hostname，如：；

```java
vim /etc/sysconfig/network
```

```java
hostname=kafka1
```

然后另外两台服务器：设置为kafka2、kafka3。设置完成后重启服务器。

```java
hostname=kafka2
hostname=kafka3
```

再用命令修改下主机名：

```java
hostnamectl set-hostname kafka1
hostnamectl set-hostname kafka2
hostnamectl set-hostname kafka3
```

**2、** 将ip与hostname写的hosts文件；

```java
vim /etc/hosts
```

```java
192.168.171.132 kafka1
```

另外两台服务器同样操作一遍。

```java
192.168.171.133 kafka2
192.168.171.134 kafka3
```

**3、** 完成后重启网卡；

```java
systemctl restart network
```

**4、** 在另外一台服务器（运维服务器）上编写脚本，不是这三台kafka服务器；

```java
#!/bin/bash
case $1 in 
"start"){
	for i in kafka1 kafka2 kafka3
	do
		ssh $i@root 'source /etc/profile && /opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties'
		echo "********************$i kafka start success************************"
	done
};;
"stop"){
	for i in kafka1 kafka2 kafka3
	do
	    ssh $i@root 'source /etc/profile && /opt/kafka/bin/kafka-server-stop.sh'
        echo "********************$i kafka stop success************************"
    done
};;
esac
```

然后，在这台服务器的hosts文件中加入：

不然上面脚本里面进行ssh时，无法识别hostname

```java
192.168.171.132 kafka1
192.168.171.133 kafka2
192.168.171.134 kafka3
```

**后面再重新整下这个群起脚本，步骤可能有问题**
