# PinPoint APM链路跟踪：安装部署实战详细手册
- 来源：https://ddkk.com/zhuanlan/linktrack/pinpoint/5.html
- 分类：链路追踪
- 分组：教程目录
## 1、PinPoint介绍

PinPoint是开源在github上的一款APM监控工具，它是由java编写的，用于大规模分布式系统的监控；它对性能的影响最小(只增加约3%资源利用率)，安装agent是无侵入式的，只需要在被测试的Tomcat中加上3句话，打下探针，就可以监控整套程序了。PinPoint支持的功能比较丰富，可以支持如下几种功能：

- 服务拓扑图：对整个系统中应用的调用关系进行了可视化的展示，单击某个服务节点，可以显示该节点的详细信息，比如当前节点状态、请求数量等
- 实时活跃线程图：监控应用内活跃线程的执行情况，对应用的线程执行性能可以有比较直观的了解
- 请求响应散点图：以时间维度进行请求计数和响应时间的展示，拖过拖动图表可以选择对应的请求查看执行的详细情况
- 请求调用栈查看：对分布式环境中每个请求提供了代码维度的可见性，可以在页面中查看请求针对到代码维度的执行详情，帮助查找请求的瓶颈和故障原因。
- 应用状态、机器状态检查：通过这个功能可以查看相关应用程序的其他的一些详细信息，比如CPU使用情况，内存状态、垃圾收集状态，TPS和JVM信息等参数。

### 架构组成

pipoint由pinpoint agent、pinpoint collector、pinpoint web、HBase 4部分组成；

- Pinpoint Agent：用于收集应用端监控数据，无侵入式，只需要在启动命令中加入部分参数即可;
- Pinpoint Collector：数据收集模块，接收Agent发送过来的监控数据，并存储到HBase;
- Pinpoint Web：监控展示模块，展示系统调用关系、调用详情、应用状态等，并支持报警等功能;
- HBase：数据库，用于保存监控数据；

**架构图如下：**

## 2、安装环境准备

- jdk1.8（下面的hbase GC调优主要针对jdk1.8，其他版本会有所不同）
- pinpoint-web-boot-2.3.3.jar（下载地址：https://github.com/naver/pinpoint）
- pinpoint-collector-boot-2.3.3.jar（下载地址：https://github.com/naver/pinpoint）
- pinpoint-agent-2.3.3.tar.gz（下载地址：https://github.com/naver/pinpoint）
- hbase-1.4.9-bin.tar.gz（下载地址：http://archive.apache.org/dist/hbase/1.4.9/）
- hbase-create.hbase（下载地址：https://github.com/pinpoint-apm/pinpoint/tree/master/hbase/scripts）

## 3、HBase单机安装

**1）将安装包hbase-1.4.9-bin.tar.gz上传到服务器/home目录，并解压；**

```bash
tar -xzvf hbase-1.4.9-bin.tar.gz
```

**2）修改HBase配置文件hbase-site.xml**

注：HBase支持HDFS存储，但是需要安装Hadoop等组件，这里为了方便，暂时先不使用HDFS。另外，生产环境建议搭HBase集群，这里暂时只搭HBase单节点。

```xml
<configuration>
    <property>
    <name>hbase.rootdir</name>
    <value>file:///app/application/data/hbase</value>
</property>
<property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/app/application/data/zookeeper</value>
</property>
<property>
    <name>zookeeper.session.timeout</name>
    <value>300000</value>
    <description>加大zookeeper会话超时时间</description>
</property>
<property>
    <name>hbase.regionserver.restart.on.zk.expire</name>
    <value>true</value>
    <description>设置 regionserver 起死回生</description>
</property>
<property>
    <name>hbase.regionserver.handler.count</name>
    <value>50</value>
    <description>regionserver处理IO请求的线程数</description>
</property>
  <property>
    <name>hbase.zookeeper.property.tickTime</name>
    <value>60000</value>
  <description>Client端与zk发送心跳的时间间隔</description>
  </property>
    <property>
        <name>zookeeper.session.timeout.localHBaseCluster</name>
        <value>300000</value>
        <description>本地模式HMasterCommandLine类中的startMaster方法会将zookeeper.session.timeout.localHBaseCluster设置给zookeeper.session.timeout,本地模式默认10000ms</description>
    </property>
    <property>
        <name>hbase.localcluster.assign.random.ports</name>
        <value>false</value>
        <description>本地模式端口号是随机分配,取消随机端口才能变成默认端口</description>
    </property>
</configuration>
```

**3）修改启动文件hbase-env.sh的JAVA_HOME环境变量位置**

```bash
vi /home/hbase-1.4.9/conf/hbase-env.sh
# 在27行左右的位置，修改如下
export JAVA_HOME=/opt/jdk1.8.0/
# 在124行开启自带zookeeper
export HBASE_MANAGES_ZK=true
```

**4）配置环境变量**

```bash
#配置环境变量HBASE_HOME
vi /etc/profile
#在末尾添加：
export HBASE_HOME=/home/hbase-1.4.9
#让环境变量生效
source /etc/profile
```

**5）启动HBase**

```bash
cd /home/hbase-1.4.9/bin
./start-hbase.sh
```

**6）验证是否启动成功：**

```bash
jps
```

启动成功会看到HMaster进程

**7）初始化HBase的pinpoint库**

执行pinpoint提供的Hbase初始化语句

```bash
cd /home/hbase-1.4.9/bin
./hbase shell /home/hbase-create.hbase 
```

执行成功：

**8）结果验证**

方法1：进入数据库，查看初始化表

```bash
#进入数据库
cd /home/hbase-1.4.9/bin
./hbase shell
#查看初始化表
list
```

方法2：登录web，查看初始化数据是否成功；

HbaseWeb地址 : http://192.168.197.129:16010/master-status,IP地址为hbase数据库所在服务器的IP地址

**9）命令**

进入自带zookeeper模式命令

```bash
./hbase zkcli
```

进入hbase命令

```bash
./hbase shell
```

## 四、pinpoint安装

## 1.安装pinpoint-collector

pinpoint-collector-boot-2.3.3.jar默认端口为8081，可自行修改application.yml的端口地址

```bash
nohup java -Dpinpoint.zookeeper.address=localhost -jar /home/pinpoint/pinpoint-collector-boot-2.3.3.jar >/var/logs/pinpoint-collector.log 2>&1 &
```

## 2.安装pinpoint-web

pinpoint-collector-boot-2.3.3.jar默认端口为8080，可自行修改application.yml的端口地址

```bash
nohup java -Dpinpoint.zookeeper.address=localhost -jar /home/pinpoint/pinpoint-web-boot-2.3.3.jar >/var/logs/pinpoint-web.log 2>&1 &
```

浏览器上输入：http://ip:8080，可以进入到PinPoint主界面。由于此时还没有在被测服务上运行agent，因此页面上没有应用可以显示。

## 3.安装pinpoint-agent

注：PinPoint-Agent需要与被测应用安装在一起

1）修改agent配置文件

```bash
vim /home/pinpoint-agent-2.3.3/profiles/release/pinpoint.config
profiler.collector.ip=192.168.197.131  hbase服务器地址
profiler.transport.grpc.collector.ip=192.168.0.10    即安装pinpoint-collector的虚拟机IP
profiler.sampling.counting.sampling-rate=1采样率配置，访问量不大的情况，建议全部采集
```

2）增加监控的服务的启动命令

```bash
# 启动应用A
nohup java -javaagent:/root/pinpoint/pinpoint-agent-2.3.3/pinpoint-bootstrap-2.3.3.jar -Dpinpoint.agentId=demoA -Dpinpoint.applicationName=demoA -jar demoA.jar > nohup.out 2>&1 &
```

- -javaagent:/root/pinpoint/pinpoint-agent-2.1.0/pinpoint-bootstrap-2.3.3.jar：agent所在位置
- -Dpinpoint.agentId：这个参数只能唯一
- -Dpinpoint.applicationName：可以重复，但为了更好地查看应用间的调用关系，这里按照应用名取值

刷新PinPoint页面，即可看到应用，使用JMeter客户端工具对demoA发起调用，则可以显示出调用关系。

## 五、pinpoint优化

## 1.collector日志输出级别优化

collector默认输出级别为info，当服务多，访问高时，日志量比较大，可以设置为warn

文件路径：pinpoint-collector-boot-2.3.3.jar\BOOT-INF\classes\profiles\release\log4j2.xml

## 2.Hbase GC优化（jdk1.8）

修改hbase/conf/hbase-env.sh配置文件

修改/新增配置如下：

`注意修改GC日志路径/app/application/linux/hbase-1.4.9为实际部署路径`

```bash
export HBASE_HEAPSIZE=4G
export HBASE_MASTER_OPTS="$HBASE_MASTER_OPTS -Xms4g -Xmx4g"
export HBASE_REGIONSERVER_OPTS="$HBASE_REGIONSERVER_OPTS -Xloggc:/app/application/linux/hbase-1.4.9/logs/hbase.gc.log -XX:ErrorFile=/app/application/linux/hbase-1.4.9/logs/hs_err_pid.log -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+HeapDumpOnOutOfMemoryError -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:CMSInitiatingOccupancyFraction=70 -Xmx4g -Xms4g"
```
