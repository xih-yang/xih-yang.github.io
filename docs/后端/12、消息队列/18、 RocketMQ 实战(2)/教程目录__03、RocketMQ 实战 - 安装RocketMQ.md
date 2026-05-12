# 03、RocketMQ 实战 - 安装RocketMQ
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/3.html
- 分类：消息队列
- 分组：教程目录
RocketMQ 的安装包分为两种，二进制包和源码包。 点击[这里](https://dist.apache.org/repos/dist/release/rocketmq/5.1.3/rocketmq-all-5.1.3-source-release.zip) 下载 Apache RocketMQ 5.1.3的源码包。你也可以从[这里](https://dist.apache.org/repos/dist/release/rocketmq/5.1.3/rocketmq-all-5.1.3-bin-release.zip) 下载到二进制包。二进制包是已经编译完成后可以直接运行的，源码包是需要编译后运行的。

这里使用Windows系统安装RocketMQ5.1.3。JAVA版本选择jdk1.8。下载页面是： [https://rocketmq.apache.org/zh/download/](https://rocketmq.apache.org/zh/download/) 。下载完成后解压后进入conf目录修改broker.conf，增加以下内容：

```java
#自动创建Topic
autoCreateTopicEnable=true
#存储路径
storePathRootDir=D:\\rocketmq-all-5.1.3-bin-release\\store
#commitLog 存储路径
storePathCommitLog=D:\\rocketmq-all-5.1.3-bin-release\\store\\commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=D:\\rocketmq-all-5.1.3-bin-release\\store\\consumequeue
#消息索引存储路径
storePathIndex=D:\\rocketmq-all-5.1.3-bin-release\\store\\index
#checkpoint 文件存储路径
storeCheckpoint=D:\\rocketmq-all-5.1.3-bin-release\\store\\checkpoint
#abort 文件存储路径
abortFile=D:\\rocketmq-all-5.1.3-bin-release\\store\\abort
```

然后在解压后的目录新建store文件夹，和conf目录同级。并将解压后的目录配置到系统变量中，变量名为ROCKETMQ_HOME。之后再cmd中分别运行mqnamesrv.cmd，mqbroker.cmd -n localhost:9876和mqproxy -n localhost:9876启动namesrv，broker和mqproxy。

用工具测试发送消息，在cmd中运行：

```java
tools.cmd org.apache.rocketmq.example.quickstart.Producer
```

在控制台看到：

用工具测试接收消息，在控制台中运行：

```java
set NAMESRV_ADDR=localhost:9876 
tools.cmd org.apache.rocketmq.example.quickstart.Consumer
```

在控制台中看到：
