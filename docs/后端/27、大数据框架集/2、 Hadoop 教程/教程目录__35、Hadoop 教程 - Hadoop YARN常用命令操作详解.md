# 35、Hadoop 教程 - Hadoop YARN常用命令操作详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/35.html
- 分类：大数据框架
- 分组：教程目录
## 1. 用户命令

用户命令主要包括对`Application`、`ApplicationAttempt`、`Classpath`、`Container`、`Jar`、`Logs`、`Node`、`Queue`和`Version`的使用。

### 1.1 application

使用方式：

```java
yarn application [options]
```

- 查看帮助

```java
yarn application --help
```

- 查看所有的Application

仅显示状态为 SUBMITTED、ACCEPTED、RUNNING 应用。

```java
yarn application -list
```

- 杀死某一个Application

```java
yarn application -kill application_1573364048641_0004
```

- 查看某一个Application的统计报告

```java
yarn application -status application_1614179148030_0001
```

- 查看状态为ALL的Application列表

```java
yarn application -list -appStates ALL
```

- 查看类型为MAPREDUCE的Application列表

```java
yarn application -list -appTypes MAPREDUCE
```

- 移动一个Application到default队列

**注意：** 如果使用 FairScheduler 时，使用此命令移动应用程序从 A 队列到 B 队列时，出于公平考虑，它在 A 队列所分配的资源会在 B 队列中重新资源分配。如果加入被移动的应用程序的资源超出 B 队列的 maxRunningApps 或者 maxResources 限制，会导致移动失败。

```java
yarn application -movetoqueue application_1573364048641_0004 -queue default
```

- 修改一个Application的优先级

**注：** 整数值越高则优先级越高

```java
yarn application -updatePriority 0 -appId application_1573364048641_0006
```

### 1.2 jar

使用方式：

```java
yarn jar x.jar [mainClass] args...
```

使用 yarn jar 提交运行 MapReduce 应用，命令如下所示：

```java
yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.3.1.jar wordcount /input /output
```

### 1.3 applicationattempt

使用方式：

```java
yarn applicationattempt [options]
```

- 查看帮助

```java
yarn applicationattempt -help
```

- 标记applicationattempt失败

```java
yarn applicationattempt -fail appattempt_1573364048641_0004_000001
```

- 查看某个应用所有的attempt

```java
yarn applicationattempt -list application_1614179148030_0001
```

- 查看具体某一个applicationattemp的报告

```java
yarn applicationattempt -status appattempt_1614179148030_0001_000001
```

### 1.4 container

使用方式：

```java
yarn container [options]
```

- 查看帮助

```java
yarn container -help
```

- 查看某一个applicationattempt下所有的container

**注：** 应用在 YARN 时，才能够查看出 Contanier 容器信息。

```java
yarn container -list appattempt_1614179148030_0001_000001
```

### 1.5 logs

使用方式：

```java
yarn logs -applicationId <application ID> [options]
```

- 查看帮助

```java
yarn logs -help
```

- 查看应用程序所有的logs

```java
yarn logs -applicationId application_1614179148030_0001
```

-`查看应用程序某个container运行所在节点的log`

```java
yarn logs -applicationId application_1614179148030_0001 -containerId container_e01_1614179148030_0001_01_000001
```

### 1.6 classpath

获取 yarn 的类路径，执行命令，显示如下结果：

```java
[hadoop@hadoop1 hadoop-3.3.1]$ yarn classpath
/data/hadoop-3.3.1/etc/hadoop:/data/hadoop-3.3.1/share/hadoop/common/lib/*:/data/hadoop-3.3.1/share/hadoop/common/*:/data/hadoop-3.3.1/share/hadoop/hdfs:/data/hadoop-3.3.1/share/hadoop/hdfs/lib/*:/data/hadoop-3.3.1/share/hadoop/hdfs/*:/data/hadoop-3.3.1/share/hadoop/mapreduce/*:/data/hadoop-3.3.1/share/hadoop/yarn:/data/hadoop-3.3.1/share/hadoop/yarn/lib/*:/data/hadoop-3.3.1/share/hadoop/yarn/*
```

### 1.7 queue

使用方式：

```java
yarn queue [options]
```

- 查看帮助

```java
yarn queue -help
```

### 1.8 node

使用方式：

```java
yarn node [options]
```

- 查看帮助

```java
yarn node -help
```

-`查看yarn所有从节点`

```java
yarn node -list -all
```

-`查看yarn所有节点的详情`

```java
yarn node -list -showDetails
```

- 查看yarn所有正在运行的节点

```java
yarn node -list -states RUNNING
```

- 查看yarn某一个节点的报告

```java
yarn node -status hadoop1:45046
```

### 1.9 version

使用方式：

```java
yarn version
```

## 2. 管理命令

对于 Hadoop 集群的管理员使用的相关命令，主要包括`daemonlog`、`nodemanager`、`proxymanager`、`resourcemanager`、`rmadmin`、`scmadmin`、`sharedcachemanager`和`timelineserver`命令。

### 2.1 resourcemanager

- 使用方式：

```java
yarn resourcemanager [options]
```

- 启动某个节点的resourcemanager

```java
yarn resourcemanager 
```

- 格式化resourcemanager的RMStateStore

清除 RMStateStore，如果不再需要以前的应用程序，则将非常有用。只有在 ResourceManager 没有运行时才能使用此命令。

```java
yarn resourcemanager -format-state-store
```

- 删除RMStateStore中的Application

从 RMStateStore 删除该应用程序，只有在 ResourceManager 没有运行时才能使用此命令。

```java
yarn resourcemanager -remove-application-from-state-store <appId> 
```

### 2.2 nodemanager

- 启动某个节点的nodemanager

```java
yarn nodemanager
```

### 2.3 proxyserver

- 启动某个节点的proxyserver

```java
yarn proxyserver
```

如果启动 YARN ProxyServer 服务，需要在`yarn-site.xml`文件中配置如下属性：

```java
<property>
	<name>yarn.web-proxy.address</name>
	<value>hadoop3:8089</value>
</property>
```

### 2.4 daemonlog

使用方式：

```java
yarn daemonlog -getlevel <host:httpport> <classname>
yarn daemonlog -setlevel <host:httpport> <classname> <level>
```

- 查看帮助

```java
yarn daemonlog
```

- 查看RMAppImpl的日志级别

```java
yarn daemonlog -getlevel hadoop2:8088 org.apache.hadoop.yarn.server.resourcemanager.rmapp.RMAppImpl 
```

- 设置RMAppImpl的日志级别

```java
yarn daemonlog -setlevel hadoop2:8088 org.apache.hadoop.yarn.server.resourcemanager.rmapp.RMAppImpl DEBUG
```

### 2.5 rmadmin

使用方式：

```java
yarn rmadmin [options]
```

- 查看帮助

```java
yarn rmadmin
```

- 重新加载mapred-queues配置文件

重新加载队列的 ACL，状态和调度程序特定的属性，ResourceManager 将重新加载 mapred-queues 配置文件。

```java
yarn rmadmin -refreshQueues
```

- 刷新ResourceManager的主机信息

```java
yarn rmadmin -refreshNodes
```

- 在ResourceManager上刷新NodeManager的资源

```java
yarn rmadmin -refreshNodesResources
```

- 刷新超级用户代理组映射

```java
yarn rmadmin -refreshSuperUserGroupsConfiguration
```

- 刷新ACL以管理ResourceManager

```java
yarn rmadmin -refreshAdminAcls
```

- 获取ResourceManager服务的Active/Standby状态
- `获取所有RM状态`

```java
yarn rmadmin -getAllServiceState
```

- `获取rm1的状态`

```java
yarn rmadmin -getServiceState rm1
```

- `获取rm2的状态`

```java
yarn rmadmin -getServiceState rm2
```

- ResourceManager服务执行健康检查

请求 ResourceManager 服务执行健康检查，如果检查失败，RMAdmin 工具将使用非零退出码退出。

```java
yarn rmadmin -checkHealth rm1
yarn rmadmin -checkHealth rm2
```

### 2.6 timelineserver

- 启动TimelineServer服务

启动完成以后，提供 WEB UI 端口号：8188，访问地址：http://hadoop2:8188

```java
yarn-daemon.sh start timelineserver
```

### 2.7 scmadmin

scmadmin 是 ShareCacheManager（共享缓存管理）的管理客户端，使用方式：

```java
yarn scmadmin [options]
```

- 查看帮助

```java
yarn scmadmin
```

- 执行清理任务

```java
yarn scmadmin -runCleanerTask
```

先启动 SCM 服务（SharedCacheManager服务）

```java
yarn-daemon.sh start sharedcachemanager
```
