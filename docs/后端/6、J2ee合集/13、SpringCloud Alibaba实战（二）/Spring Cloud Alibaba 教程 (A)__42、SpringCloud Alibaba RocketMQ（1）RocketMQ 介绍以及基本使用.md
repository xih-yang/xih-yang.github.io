# 42、SpringCloud Alibaba RocketMQ（1）RocketMQ 介绍以及基本使用
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/75.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.RocketMQ 介绍

RocketMQ 是一款开源的分布式消息系统，基于高可用分布式集群技术，提供低延时的、高可靠的消息发布与订阅服务。同时，广泛应用于多个领域，包括异步通信解耦、企业解决方案、金融支付、电信、电子商务、快递物流、广告营销、社交、即时通信、移动应用、手游、视频、物联网、车联网等

**具有以下特点：**

- 能够保证严格的消息顺序
- 提供丰富的消息拉取模式
- 高效的订阅者水平扩展能力
- 实时的消息订阅机制
- 亿级消息堆积能力

## 2.RocketMQ 基本使用

### 2.1 下载 RocketMQ

使用浏览器打开：

[传送门](http://rocketmq.apache.org/release_notes/release-notes-4.4.0/)

这里我们选择 4.4.0 版本的原因在于，我们 SpringCloud Alibaba 版本为：2.2.0.RELEASE，它里面控制的 rocketMQ 的版是 4.4.0

### 2.2 RocketMQ 目录分析

将该压缩包复制到软件目录里面，使用压缩软件进行解压

- Benchmark：包含一些性能测试的脚本；
- Bin：可执行文件目录；
- Conf：配置文件目录；
- Lib：第三方依赖；
- LICENSE：授权信息;
- NOTICE：版本公告；

### 2.3 配置环境变量

找到配置环境变量的对话框：

点击新建创建一个环境变量：

变量名：ROCKETMQ_HOME

变量值：D:\devtools\rocketMQ\rocketmq-all-4.4.0-bin-release

### 2.4 RocketMQ 的启动

我们进入到`$`{rocketMQ}/bin，在此目录里面启动和停止命令。

#### 2.4.1 启动 NameServer

注意：弹出的黑窗口不要关闭

### 2.4.2 启动 Broker

- ./mqbroker.cmd -n localhost:9876
- 其中：
- -n localhost:9876 是为了指定 nameserver 的地址

### 2.5 RocketMQ 的停止

直接把弹出的黑框关闭，即可停止 RocketMQ 的 namesrv 和 broker。

### 2.6 RocketMQ 控制台的安装

Rocketmq 控制台可以可视化 MQ 的消息发送！

#### 2.6.1 下载 RocketMQ 控制台

直接从官网下载的是源码

#### 2.6.2 复制到软件目录里面

#### 2.6.3 运行该 jar

java -jar rocketmq-console-ng-1.0.0.jar --rocketmq.config.namesrvAddr=127.0.0.1:9876

其中：

```java
--rocketmq.config.namesrvAddr=127.0.0.1:9876 是为了指定 nameserver 的地址
```

运行成功后：

访问：

http://localhost:8080/#/
