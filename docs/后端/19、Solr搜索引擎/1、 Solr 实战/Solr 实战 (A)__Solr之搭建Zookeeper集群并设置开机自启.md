# Solr之搭建Zookeeper集群并设置开机自启
- 来源：https://ddkk.com/zhuanlan/search/solr/2/13.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

## 1. zk集群模式

zk可以作为注册中心和配置中心，常用在微服务各类组件的多节点服务治理场景。而单节点的zk，容易出现故障时无备用节点的问题。

zk的集群模式是主从模式，主节点负责写入数据，从节点负责读取数据，从节点数据从主节点同步。各节点之间通过2888端口进行数据通信。

**集群角色**

既然是主从模式，那么其角色自然就有主（Leader）、从（Follower）两个角色，除此之外，还有一个观察者角色

角色
说明

Leader 主节点
为客户端提供读写服务，并且负责选主投票

Follower 从节点
为客户端提供读服务，并且参与选主投票

Observer 观察者
为客户端提供读服务，不参与选主投票

## 2. 搭建

**0、** 因为zookeeper是基于java开发的，所以要先安装java环境，之前已经讲解过，这里不再单独说明；

**1、** 下载zookeeper安装包：[zookeeper安装包下载地址][zookeeper1]；

这里我选择了`3.8.0`版本

**2、** 解压安装包，这里我将zk压缩包上传到了虚拟机`/data`目录下；

```bash
cd /data
tar -zxvf apache-zookeeper-3.8.0-bin.tar.gz
```

**3、** 在zk安装目录下，创建`tmp`目录，并创建`myid`文件，声明集群节点id，第一个节点，我们声明文件内容为`1`；

```bash
cd /data/apache-zookeeper-3.8.0-bin
mkdir tmp
vim tmp/myid
```

**4、** 修改zk配置文件，重命名`zoo_sample.cfg`为`zoo.cfg`，使其生效；

```bash
cp conf/zoo_sample.cfg conf/zoo.cfg
```

**5、** 修改配置文件中内容；

```bash
vim conf/zoo.cfg
```

内容为：

```bash
## 修改数据目录为刚刚创建的tmp目录
dataDir=/data/apache-zookeeper-3.8.0-bin/tmp
## 添加集群节点，其中2888是节点通信端口，3888是节点选主端口
server.1=192.168.244.42:2888:3888
server.2=192.168.244.43:2888:3888
server.3=192.168.244.44:2888:3888
```

**6、** 将zookeeper安装目录文件复制到其他2个zk节点；

```bash
scp -r /data/apache-zookeeper-3.8.0-bin root@192.168.244.43:/data/
scp -r /data/apache-zookeeper-3.8.0-bin root@192.168.244.44:/data/
```

**7、** 修改另外两个节点的`myid`内容，分别为`2,3`，注意与上面第5步的内容保持一致；

**8、** 开启zk相关端口，如果没有开启防火墙，则可省略这步；

```bash
firewall-cmd --add-port=2181/tcp --permanent
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --add-port=2888/tcp --permanent
firewall-cmd --add-port=3888/tcp --permanent
firewall-cmd --reload
## 查询开放端口
netstat -anp
```

**9、** 启动3个节点的zk；

```bash
/data/apache-zookeeper-3.8.0-bin/bin/zkServer.sh start
```

**10、** 查看节点集群状态；

```bash
 /data/apache-zookeeper-3.8.0-bin/bin/zkServer.sh status
```

可以看到zk集群启动成功，通过查询状态发现是2个follower节点，1个leader节点

所以实际上zk的集群模式，是主从模式，而我们这里是1主双从

## 2. 设置开机自启

**1、** 编写启动脚本；

```bash
cd /etc/init.d
vim zookeeper
```

内容：

```bash
#!bin/bash
#chkconfig:2345 54 26
#processname:zookeeper
#description:zk server
prog=/data/apache-zookeeper-3.8.0-bin/bin/zkServer.sh
start(){                                
        $prog start 
        echo "zookeeper启动"
}
stop(){                                
        $prog stop 
        echo "zookeeper关闭"
}
status(){
        $prog status
}
restart(){              
        stop
        start
}
case "$1" in        
"start")
        start      
        ;;
"stop")            
        stop
        ;;
"status")
        status
        ;;
"restart")            
        restart
        ;;
*)      
        echo "支持指令：$0 start|stop|restart|status"
        ;;
esac
```

其中

> chkconfig:2345 54 26 用于设置开机自启时的运行级别、启动优先级、关闭优先级

**2、** 给脚本赋权；

```bash
chmod +x /etc/init.d/zookeeper
```

**3、** 还需要配置JAVA路径，否则执行会报错`Error:JAVA_HOMEisnotsetandjavacouldnotbefoundinPATH`；

在zk安装目录的bin目录下，修改`zkEnv.sh`，添加java路径说明

```bash
vim /data/apache-zookeeper-3.8.0-bin/bin/zkEnv.sh
## 内容
JAVA_HOME="/var/local/zulu8.58.0.13-ca-jdk8.0.312-linux_aarch64"
```

**4、** 执行脚本，验证一下；

```bash
service zookeeper status
service zookeeper stop
service zookeeper start
```

**5、** 添加到开机自启列表；

```bash
## 添加开机自启
chkconfig --add zookeeper
## 状态设置为启动
chkconfig zookeeper on
```

**6、** 重启虚拟机，查看zookeeper状态，发现自动启动了；

**7、** 在其他2个节点执行同样的自启设置；

如上，我们的zk集群安装就完成了！
