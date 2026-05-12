# 05、Java 任务调度 - Azkaban 入门实战(安装部署)
- 来源：https://ddkk.com/zhuanlan/job/job/1/5.html
- 分类：作业调度
- 分组：教程目录
本文主要介绍Azkaban的安装部署，文中文中使用到的软件版本：Azkaban 3.90.0、MySQL 5.7、Centos 7。

## 1、Azkaban简介

Azkaban是由Linkedin公司推出的一个批量工作流任务调度器，主要用于在一个工作流内以一个特定的顺序运行一组工作和流程，它的配置是通过简单的key:value对的方式，通过配置中的dependencies 来设置依赖关系。Azkaban使用job配置文件建立任务之间的依赖关系，并提供一个易于使用的web用户界面维护和跟踪你的工作流。

### 1.1、Azkaban结构

Azkaban由三个关键组件构成：

**1、** AzkabanWebServer：AzkabanWebServer是整个Azkaban工作流系统的主要管理者，它负责用户登录认证、project管理、定时执行工作流、跟踪工作流执行进度等一系列任务；

**2、** AzkabanExecutorServer：负责具体的工作流的提交、执行，它们通过mysql数据库来协调任务的执行；

**3、** 关系型数据库(MySQL)：存储大部分执行流状态，AzkabanWebServer和AzkabanExecutorServer都需要访问数据库；

### 1.2、Azkaban部署模式

在3.0后，Azkaban提供了两种部署模式：

#### 1.2.1、solo-server模式

DB使用的是一个内嵌的H2，Web Server和Executor Server运行在同一个进程里。这种模式包含Azkaban的所有特性，但一般用来学习和测试，也可以用于小的应用。

#### 1.2.2、distributed multiple-executor模式

DB使用的是MySQL，MySQL最好使用master-slave架构，Web Server和Executor Server运行在不同机器上，且有多个Executor Server；这为Azkaban提供了很强的扩展性。

## 2、安装

### 2.1、编译

#### 2.1.1、下载源码并解压

下载地址：https://github.com/azkaban/azkaban/releases

```java
tar zxvf azkaban-3.90.0.tar.gz
```

#### 2.1.2、修改maven地址

修改build.gradle中maven地址为阿里云仓库，不然下载jar包会很慢。

```java
buildscript {
  repositories {
    //mavenCentral()
    //maven {
      //url 'https://plugins.gradle.org/m2/'
    //}
    maven {
      url 'https://maven.aliyun.com/repository/gradle-plugin'
    }
  }
allprojects {
  apply plugin: 'jacoco'
  repositories {
    //mavenCentral()
    //mavenLocal()
    maven {
      url 'https://maven.aliyun.com/repository/gradle-plugin'
    }
  }
}
```

#### 2.1.3、编译

进入解压的目录(/home/hadoop/app/azkaban-3.90.0)，执行：

```java
# Build Azkaban
./gradlew build
# Clean the build
./gradlew clean
# Build and install distributions
./gradlew installDist
# Run tests
./gradlew test
# Build without running tests
./gradlew build -x test
```

在执行./gradlew build时，大概执行到58%时会卡住，Ctrl+c后在重新执行成功了。

在执行这命令时偶尔会出现超时错误，导致命令执行失败(failed)；可以重新执行命令。

### 2.2、部署

#### 2.2.1、solo-server模式

编译完成后，进入/home/hadoop/app/azkaban-3.90.0/azkaban-solo-server/build/install/azkaban-solo-server目录

##### 3.2.1.1、修改时区

conf/azkaban.properties：

```java
#default.timezone.id=America/Los_Angeles
default.timezone.id=Asia/Shanghai
```

##### 2.2.1.2、启停

```java
bin/start-solo.sh
```

停止命令：

```java
bin/shutdown-solo.sh
```

##### 2.2.1.3、控制台

http://10.49.196.10:8081/ (azkaban/azkaban)

用户可以在conf/azkaban-users.xml文件中配置。

##### 2.2.1.4、部署包

在/home/hadoop/app/azkaban-3.90.0/azkaban-solo-server/build/distributions目录下有部署包可以copy到其他地方部署。

#### 2.2.2、distributed multiple-executor模式

##### 2.2.2.1、规划

假设Mysql已经安装完成，这里只考虑Web Server和Executor Server；源代码的编译在10.49.196.10上，目录为/home/hadoop/app/azkaban-3.90.0。

10.49.196.10
Web Server

10.49.196.11
Executor Server

10.49.196.12
Executor Server

##### 2.2.2.2、初始化数据库

```java
mysql> CREATE DATABASE azkaban;
```

然后在azkaban库中执行/home/hadoop/app/azkaban-3.90.0/azkaban-db/build/install/azkaban-db/create-all-sql-0.1.0-SNAPSHOT.sql脚本

##### 2.2.2.3、部署Executor Server

###### 2.2.2.3.1、分发部署包#

从10.49.196.10上拷贝部署包到10.49.196.11上

```java
cd /home/hadoop/app/azkaban-3.90.0/azkaban-exec-server/build/distributions
scp ./azkaban-exec-server-0.1.0-SNAPSHOT.tar.gz hadoop@10.49.196.11:/home/hadoop/app
```

###### 2.2.2.3.2、10.49.196.11上部署Executor Server#

```java
cd /home/hadoop/app
tar zxvf azkaban-exec-server-0.1.0-SNAPSHOT.tar.gz
```

修改conf/azkaban.properties文件：

```java
#default.timezone.id=America/Los_Angeles
default.timezone.id=Asia/Shanghai
azkaban.webserver.url=http://10.49.196.10:8081
mysql.port=3306
mysql.host=10.49.196.10
mysql.database=azkaban
mysql.user=root
mysql.password=123
executor.port=9000#设置启动端口，不然每次会随机生成一个端口
```

启动：

```java
bin/start-exec.sh
```

启动完之后，还需要激活：

```java
curl -G "localhost:9000/executor?action=activate" && echo
```

###### 2.2.2.3.3、10.49.196.12上部署Executor Server#

**10、** 49.196.12上的部署与10.49.196.11类似的操作步骤；或者直接把10.49.196.11上的部署目录直接拷贝到10.49.196.12上；

##### 2.2.2.3、部署Web Server

可以直接使用10.49.196.10上编译好的部署目录/home/hadoop/app/azkaban-3.90.0/azkaban-web-server/build/install/azkaban-web-server

a、修改/etc/hosts文件，设置Executor Server主机的主机名和ip的对应关系：

```java
10.49.196.11 pxc2
10.49.196.12 pxc3
```

b、修改conf/azkaban.properties文件：

```java
#default.timezone.id=America/Los_Angeles
default.timezone.id=Asia/Shanghai
mysql.port=3306
mysql.host=10.49.196.10
mysql.database=azkaban
mysql.user=root
mysql.password=123
```

c、启动：

```java
bin/start-web.sh
```

##### 2.2.2.4、控制台

http://10.49.196.10:8081/

用户名密码为：azkaban/azkaban 用户可用在conf/azkaban-users.xml中配置。

##### 2.2.2.5、启动顺序

一定要先启动Exector Server，再启动Web Server；如果有Exector Server需要重启，Web Server也需要重启以同步Exector Server信息。

##### 2.2.2.6、常见异常处理

a、job不执行

WebServer控制提示如下信息：

```java
2020/10/22 10:24:02.453 +0800  INFO [ExecutorManager] [AzkabanWebServer-QueueProcessor-Thread] [Azkaban] Reached handleNoExecutorSelectedCase stage for exec 124 with error count 0
```

可能原因：

MinimumFreeMemory过滤器会检查executor主机空余内存是否会大于6G，如果不足6G，则web-server不会将任务交由该主机执行。

处理方法：

修改conf/azkaban.properties文件，去除MinimumFreeMemory过滤器

```java
#azkaban.executorselector.filters=StaticRemainingFlowSize,MinimumFreeMemory,CpuStatus
azkaban.executorselector.filters=StaticRemainingFlowSize,CpuStatus
```

b、Cannot request memory (Xms 0 kb, Xmx 0 kb) from system for job second

Azkaban控制台Job Logs报如下错误：

原因：

azkaban要求执行主机可用内存必须大于3G才能满足执行任务的条件。

处理方法：

Executor Server部署目录下plugins/jobtypes/commonprivate.properties文件增加：

```java
memCheck.enabled=false
```

c、Failed to assign non-existent executor Id: xxx to execution : yyy

WebServer后台报：

```java
2020/10/22 10:45:47.047 +0800  WARN [ExecutorManager] [AzkabanWebServer-QueueProcessor-Thread] [Azkaban] Executor pxc2:9000 (id: 12), active=true responded with exception for exec: 131
azkaban.executor.ExecutorManagerException: Failed to assign non-existent executor Id: 12 to execution : 131  
        at azkaban.executor.AssignExecutorDao.assignExecutor(AssignExecutorDao.java:43)
        at azkaban.executor.JdbcExecutorLoader.assignExecutor(JdbcExecutorLoader.java:331)
        at azkaban.executor.ExecutorManager.dispatch(ExecutorManager.java:1059)
        at azkaban.executor.ExecutorManager.access$500(ExecutorManager.java:69)
        at azkaban.executor.ExecutorManager$QueueProcessorThread.selectExecutorAndDispatchFlow(ExecutorManager.java:1238)
        at azkaban.executor.ExecutorManager$QueueProcessorThread.processQueuedFlows(ExecutorManager.java:1210)
        at azkaban.executor.ExecutorManager$QueueProcessorThread.run(ExecutorManager.java:1148)
```

原因：

重启Executor后，它的id会变化(自增)，导致Web Server根据缓存的id找不到Executor。

处理方法：

Executor Server重启后，Web Server也重启下。
