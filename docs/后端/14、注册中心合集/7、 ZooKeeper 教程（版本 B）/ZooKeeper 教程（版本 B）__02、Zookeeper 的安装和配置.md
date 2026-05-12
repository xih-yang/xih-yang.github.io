# 02、Zookeeper 的安装和配置
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-2/2.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 B）
安装前准备

## 1.1. 安装JDK

对应的JDK安装可以参考博主的另一篇博客： [Centos7安装和配置JDK1.8版本](https://blog.csdn.net/yang_shibiao/article/details/123785479)

## 1.2. 下载对应的Zookeeper安装包

下载地址： https://zookeeper.apache.org/

下载截图：

## 1.3. 上传安装包至服务器并配置软连接

解压对应的安装包：

```java
tar -zxvf apache-zookeeper-3.5.7-bin.tar.gz -C /opt/module/
```

配置软连接：

```java
ln -s 源文件 目标文件
ln -s /opt/module/apache-zookeeper-3.5.7-bin/ /opt/module/zookeeper
```

目录截图如下：

## 2. Zookeeper本地安装

1）将/opt/module/zookeeper-3.5.7/conf 这个路径下的 zoo_sample.cfg 修改为 zoo.cfg：

```java
 mv zoo_sample.cfg zoo.cfg
```

2）打开 zoo.cfg 文件，修改 dataDir 路径

```java
vim zoo.cfg
# 修改如下内容
dataDir=/opt/module/zookeeper/zkData
# 并新建如下文件夹
mkdir /opt/module/zookeeper/zkData
```

3）启动 Zookeeper

```java
cd /opt/module/zookeeper/
bin/zkServer.sh start
```

4）查看进程和状态

```java
# 查看进程
jps
# 查看状态
/opt/module/zookeeper/bin/zkServer.sh status
```

5）启动客户端

```java
/opt/module/zookeeper/bin/zkCli.sh
```

6）退出客户端

7）停止Zookeeper

```java
/opt/module/zookeeper/bin/zkServer.sh stop
```

## 3. 配置参数解读

Zookeeper中的配置文件zoo.cfg中参数含义解读如下：

1）tickTime = 2000：通信心跳时间，Zookeeper服务器与客户端心跳时间，单位毫秒

2）initLimit = 10：LF初始通信时限

Leader和Follower初始连接时能容忍的最多心跳数（tickTime的数量）

3）syncLimit = 5：LF同步通信时限

Leader和Follower之间通信时间如果超过syncLimit * tickTime，Leader认为Follwer死掉，从服务器列表中删除Follwer。

4）dataDir：保存Zookeeper中的数据

注意：默认的tmp目录，容易被Linux系统定期删除，所以一般不用默认的tmp目录。

5）clientPort = 2181：客户端连接端口，通常不做修改

## 4. Zookeeper的集群安装

说明：在Zookeeper的集群安装中，一般是3台节点以及以上，并且是奇数台

## 4.1. 配置服务器编号

1）在/opt/module/zookeeper/ 这个目录下创建 zkData

```java
mkdir zkData
```

2）在/opt/module/zookeeper/zkData 目录下创建一个 myid 的文件

```java
vi myid
# 在文件中添加与 server 对应的编号（注意：上下不要有空行，左右不要有空格）
2
```

注意：添加 myid 文件，一定要在 Linux 里面创建，在 notepad++里面很可能乱码

3）拷贝配置好的 zookeeper 到其他机器上

```java
xsync zookeeper-3.5.7
# 并在其他节点也配置相应软连接
# 并分别在 其他节点 上修改 myid 文件中内容为 3、4
```

4）同步 zoo.cfg 配置文件

```java
 xsync zoo.cfg
```

## 4.2. 配置zoo.cfg文件

1）重命名/opt/module/zookeeper-3.5.7/conf 这个目录下的 zoo_sample.cfg 为 zoo.cfg

```java
mv zoo_sample.cfg zoo.cfg
```

2）打开 zoo.cfg 文件，并配置对应的参数配置

```java
vim zoo.cfg
# 修改数据存储路径配置
dataDir=/opt/module/zookeeper/zkData
# 增加如下配置
#######################cluster##########################
server.2=bigdata01:2888:3888
server.3=bigdata02:2888:3888
server.4=bigdata03:2888:3888
```

3）配置参数解读

> server.A=B:C:D
>
> A 是一个数字，表示这个是第几号服务器；
>
> B 是这个服务器的地址；
>
> C 是这个服务器 Follower 与集群中的 Leader 服务器交换信息的端口；
>
> D 是万一集群中的 Leader 服务器挂了，需要一个端口来重新进行选举，选出一个新的Leader，而这个端口就是用来执行选举时服务器相互通信的端口。
>
> 集群模式下配置一个文件 myid，这个文件在 dataDir 目录下，这个文件里面有一个数据就是A 的值，Zookeeper 启动时读取此文件，拿到里面的数据与 zoo.cfg 里面的配置信息比较从而判断到底是哪个 server。

## 4.3. 启动Zookeeper集群并查看状态

1）在所有机器上执行如下命令

```java
bin/zkServer.sh start
```

2）可以执行如下命令查看Zookeeper的状态

```java
 bin/zkServer.sh status
```

## 4.4. ZK集群启动停止脚本

1）在bigdata01 的/root/bin 目录下创建脚本

```java
vim zk.sh
```

2）脚本内容如下

```sh
#!/bin/bash
case $1 in
"start"){
    for i in bigdata01 bigdata02 bigdata03
    do
        echo ---------- zookeeper $i 启动 ------------
        ssh $i "/opt/module/zookeeper/bin/zkServer.sh start"
    done
};;
"stop"){
    for i in bigdata01 bigdata02 bigdata03
    do
        echo ---------- zookeeper $i 停止 ------------ 
        ssh $i "/opt/module/zookeeper/bin/zkServer.sh stop"
    done
};;
"status"){
    for i in bigdata01 bigdata02 bigdata03
    do
        echo ---------- zookeeper $i 状态 ------------ 
        ssh $i "/opt/module/zookeeper/bin/zkServer.sh status"
    done
};;
esac
```

3）增加脚本执行权限并进行集群的启动和停止

```java
# 添加文件权限
chmod u+x zk.sh
# 启动集群
zk.sh start
# 停止集群
zk.sh stop
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
