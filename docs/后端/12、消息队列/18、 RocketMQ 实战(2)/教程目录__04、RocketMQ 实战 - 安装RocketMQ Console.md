# 04、RocketMQ 实战 - 安装RocketMQ Console
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/4.html
- 分类：消息队列
- 分组：教程目录
Apache RocketMQ最先进的Dashboard提供了卓越的监控功能。用户可以明显地获得客户端和应用程序的事件、性能和系统信息的各种图表和统计信息。官网地址是： [https://github.com/apache/rocketmq-dashboard](https://github.com/apache/rocketmq-dashboard) 。

```java
git clone https://github.com/apache/rocketmq-dashboard.git
```

克隆到本地后，用IDEA打开，修改application.yml：

```java
rocketmq:
  config:
    if this value is empty,use env value rocketmq.config.namesrvAddr  NAMESRV_ADDR | now, default localhost:9876
    configure multiple namesrv addresses to manage multiple different clusters
    namesrvAddrs:
      - 127.0.0.1:9876
    dataPath: D:\\rocketmq-all-5.1.3-bin-release\\store
```

这里修改两个参数。

根据需要修改RocketMQ的配置参数，之后在IDEA打开Terminal运行：

```java
mvn clean package -Dmaven.test.skip=true
```

打包成功后，进入target文件夹，发现生成了可执行jar。

运行以下命令：

```java
java -jar rocketmq-dashboard-1.0.1-SNAPSHOT.jar
```

在浏览器中访问http://localhost:8080/，点击右上角的更换语言，选择中文，看到
