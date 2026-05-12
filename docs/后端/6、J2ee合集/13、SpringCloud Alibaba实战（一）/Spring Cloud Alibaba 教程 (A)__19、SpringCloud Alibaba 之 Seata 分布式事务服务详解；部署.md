# 19、SpringCloud Alibaba 之 Seata 分布式事务服务详解；部署
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/19.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、事务

事务是数据库的概念，数据库事务(简称：**事务**，**Transaction**)是指数据库执行过程中的一个逻辑单位，由一个有限的数据库操作序列构成[由当前业务逻辑多个不同操作构成

事务通常由[高级数据库](https://baike.baidu.com/item/%E9%AB%98%E7%BA%A7%E6%95%B0%E6%8D%AE%E5%BA%93/1439366)操纵语言或编程语言（如SQL，C++或Java）书写的[用户程序](https://baike.baidu.com/item/%E7%94%A8%E6%88%B7%E7%A8%8B%E5%BA%8F/7450916)的执行所引起，并用形如begin transaction和end transaction语句（或[函数调用](https://baike.baidu.com/item/%E5%87%BD%E6%95%B0%E8%B0%83%E7%94%A8/4127405)）来界定

## 事务特性

一般来说，事务是必须满足4个条件（ACID）：原子性（Atomicity，或称不可分割性）、一致性（Consistency）、隔离性（Isolation，又称独立性）、持久性（Durability）

【1】原子性（Atomicity）：一个事务（transaction）中的所有操作，要么全部完成，要么全部不完成，不会结束在中间某个环节。事务在执行过程中发生错误，会被回滚（Rollback）到事务开始前的状态，就像这个事务从来没有执行过一样

【2】一致性（Consistency）：在事务开始之前和事务结束以后，数据库的完整性没有被破坏。这表示写入的资料必须完全符合所有的预设规则，这包含资料的精确度、串联性以及后续数据库可以自发性地完成预定的工作。

【3】隔离性（Isolation）：数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。事务隔离分为不同级别，包括读未提交（Read uncommitted）、读提交（read committed）、可重复读（repeatable read）和串行化（Serializable）。

【4】持久性（Durability）：事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。

### Java数据库事务处理

Java的事务处理，如果对数据库进行多次操作，每一次的执行或步骤都是一个事务。如果数据库操作在某一步没有执行或出现异常而导致事务失败，这样有的事务被执行有的就没有被执行，从而就有了事务的[回滚](https://baike.baidu.com/item/%E5%9B%9E%E6%BB%9A/11033128)，取消先前的操作

## 二、分布式事务

## （一）本地事务

起初，事务仅限于对单一数据库资源的访问控制。架构服务化以后，事务的概念延伸到了服务中。倘若将一个单一的服务操作作为一个事务，那么整个服务操作只能涉及一个单一的数据库资源，这类基于单个服务单一数据库资源访问的事务，被称为本地事务(Local Transaction)。

分布式事务的产生，是由于数据库的拆分和分布式架构(微服务)带来的，在常规情况下，我们在一个进程中操作一个数据库，这属于本地事务，如果在一个进程中操作多个数据库，或者在多个进程中操作一个或多个数据库，就产生了分布式事务

## （二）分布式事务

分布式事务是指事务的参与者、支持事务的服务器、资源服务器以及事务管理器分别位于不同的[分布式系统](https://baike.baidu.com/item/%E5%88%86%E5%B8%83%E5%BC%8F%E7%B3%BB%E7%BB%9F/4905336)的不同节点之上，且属于不同的应用，分布式事务需要保证这些操作要么全部成功，要么全部失败。本质上来说，分布式事务就是为了保证不同数据库的数据一致性。

### 1、数据库分库分表产生分布式事务

### 2、项目拆分模块服务产生分布式事务

## 三、Seata分布式事务服务

Seata 是一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。Seata 为用户提供了 AT、TCC、SAGA 和 XA 事务模式，为用户打造一站式的分布式解决方案。四种事务模式中，XA模式正在开发中...，其他事务模式已经实现

目前使用的流行度情况是：AT > TCC > Saga；

可以参看seata各公司使用列表：

[https://github.com/seata/seata/issues/1246](https://github.com/seata/seata/issues/1246) 大部分公司都采用的AT事务模式

### Seata官网：

[http://seata.io/](http://seata.io/)

### Seata官网文档地址：

[Seata 是什么](http://seata.io/zh-cn/docs/overview/what-is-seata.html)

### Seata的GitHub地址：

[.](https://github.com/seata/seata)[GitHub - seata/seata: Seata is an easy-to-use, high-performance, open source distributed transaction solution.](https://github.com/seata/seata)[.](https://github.com/seata/seata)

## （一）Seata架构

Seata 对分布式事务的协调和控制，主要是通过 XID 和 3 个核心组件实现的

### XID

XID是全局事务的唯一标识，它可以在服务的调用链路中传递，绑定到服务的事务上下文中

### 核心组件

Seata 定义了 3 个核心组件

### 1、TC (Transaction Coordinator) - 事务协调者

维护全局和分支事务的状态，驱动全局事务提交或回滚

### 2、TM (Transaction Manager) - 事务管理器

定义全局事务的范围：开始全局事务、提交或回滚全局事务

### 3、RM (Resource Manager) - 资源管理器

管理分支事务处理的资源，与TC交互以注册分支事务和报告分支事务的状态，并驱动分支事务提交或回滚

> TC为单独部署的 Server 服务端，TM 和 RM 为嵌入到应用中的 Client 客户端

## （二）Seata生命周期

在Seata中，一个分布式事务的生命周期如下：

**1、** TM请求TC开启一个全局事务，TC会生成一个XID作为该全局事务的编号，XID会在微服务的调用链路中传播，保证将多个微服务的子事务关联在一起；

**2、** RM请求TC将本地事务注册为全局事务的分支事务，通过全局事务的XID进行关联；

**3、** TM请求TC告诉XID对应的全局事务是进行提交还是回滚；

**4、** TC驱动RM将XID对应的自己的本地事务进行提交还是回滚；

## （三）Seata TC Server存储模式

TC进行全局事务和分支事务的记录，需要对应的存储，Seata TC Server支持三种存储模式( store.mode )：

**file模式**：单机模式，全局事务会话信息在内存中读写，并持久化本地文件 root.data，性能较高（默认）

**db模式**：集群模式（高可用），全局事务会话信息通过 db 共享，相对性能差点

**redis模式**：解决db存储的性能问题；Seata-Server1.3及以上版本支持，性能较高，存在事务信息丢失风险，需要配合实际场景使用

以file模式为例，部署单机TC Server如下图所示：

## 四、Seata TC Server运行环境部署

**Seata Server下载地址**：

[下载中心](http://seata.io/zh-cn/blog/download.html)

[https://github.com/seata/seata/tags](https://github.com/seata/seata/tags)

博主一般都是安装在Linux系统上，选择版本

**1、** 以v1.4.2为例，点击Download，滑到相应版本最下方Assets，选择tar.gz包下载；

**2、** 通过SecureFX软件将其上传到Linux下opt/software目录下，解压；

```bash
tar -zxvf seata-server-1.4.2.tar.gz -C /opt/software/
```

**3、** 切换到该目录下；

```bash
cd seata/seata-server-1.4.2
```

目录结构如下

> Seata Server 目录中包含以下子目录：
>
>
> bin：用于存放 Seata Server 可执行命令
> conf：用于存放 Seata Server 的配置文件
> lib：用于存放 Seata Server 依赖的各种 Jar 包
> logs：用于存放 Seata Server 的日志

注：！！！

seata-server.sh脚本 默认设置的jvm内存参数2G，因博主使用的虚拟机，将其设置为512M

```bash
cd bin
vim seata-server.sh
```

默认设置内存2G

将其修改为512M

**4、** 切换到bin目录下，在bin目录下启动：./seata-server.sh；

```bash
cd bin
vim seata-server.sh
```

**1、默认配置下，Seata TC Server 启动在 8091 端口**

此时再查看 bin 目录下，多出一个 **sessionStore** 文件夹，进入该目录下查看，会有一个 **root.data** 文件

这个 **sessionStore** 文件夹 是在 conf 目录下 的 **file.conf** 配置文件中配置的 **dir = "sessionStore"**

**2、**默认情况下，seata使用的是file模式进行数据持久化，因此启动 seata TC server之后可以在 bin/sessionStore 目录下看到用于持久化的本地文件 **root.data**

## 1、conf/file.conf 配置文件

conf 目录下的 **file.conf** 配置文件（主要修改自定义事务组名称，事务日志存储模式为db及数据库连接信息）

## 2、 conf/registry.conf 配置文件

conf 目录下的 **registry.conf** 配置文件（主要修改注册中心，指明注册中心为nacos，及修改nacos连接信息即可）

“配置中心”内部存放着各种各样的配置文件，我们可以根据自己的需要从其中获取指定的配置文件，加载到对应的客户端中。

Seata 支持多种配置中心：

- nacos
- consul
- apollo
- etcd
- zookeeper
- file （读本地文件，包含 conf、properties、yml 等配置文件）

如果使用了 注册中心 ，如 type="nacos"等要检查nacos的 应用名application、服务注册地址serverAddr、分组group、命名空间namespace、集群cluster、用户名username、密码password是否正确等

### Seata Server 配置

### Seata Client 配置

在Seata Client（即微服务架构中的服务）中，通过 application.properties/yml 等配置文件对 Nacos 配置中心进行配置

```java
#设置使用注册中心
#seata-spring-boot-starter 1.1版本少一些配置项
seata.enabled=true
seata.registry.type=nacos
# 集群
seata.registry.nacos.cluster=default
# 分组
seata.registry.nacos.group=SEATA_GROUP
# 应用名
seata.registry.nacos.application=seata-server
# 服务注册地址
seata.registry.nacos.server-addr=192.168.133.129:8848
```

注：

> 1.5版本的配置使用的是yml配置文件，取消了1.4及之前版本的file.conf和registry.conf

Seata 集成 Nacos配置中心可参考

[https://blog.csdn.net/MinggeQingchun/article/details/126176893](https://blog.csdn.net/MinggeQingchun/article/details/126176893)
