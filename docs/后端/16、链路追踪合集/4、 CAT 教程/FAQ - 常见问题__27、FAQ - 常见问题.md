# 27、FAQ - 常见问题
- 来源：https://ddkk.com/zhuanlan/linktrack/cat/27.html
- 分类：链路追踪
- 分组：FAQ - 常见问题
## 常见问题

## cat系统的定位

- cat本质上一个实时监控系统，主要体现在监控报表Transaction、event、problem、heartbeat等，cat系统定制的监控模型以及定制的实时分析报表也是cat系统核心优势。
- logview是cat原始的log采集方式，cat的logview使用的技术是threadlocal，将一个thread里面的打点聚合上报，有一点弱化版本的链路功能，但是cat并不是一个标准的全链路系统，全链路系统参考dapper的论文，业内比较知名的鹰眼，zipkin等，其实经常拿cat和这类系统进行比较其实是不合适的。cat的logview在异步线程等等一些场景下，其实不合适，cat本身模型并不适合这个。在美团点评内部，有mtrace专门做全链路分析。

## Cat客户端日志目录？

- cat客户端日志在/data/applogs/cat/*.log 目录下，这里面有关于cat客户端的启动日志，包括业务配置的domain，连接的cat服务端信息等，建议出现问题优先看下这个日志。

## 采样只会上报一部分数据吗？

- 采样不影响 Transaction、Event、Heartbeat、Problem、Bussiness 报表，这些报表都在客户端做了轻量级的聚合处理，保证服务端的全量。
- 采样是基于特征采样, 符合一些特征的消息不做采样：
- 消息链路有long-url, long-sql, long-service, long-cache
- 链路中有抛异常的消息
- 心跳消息、业务指标监控消息

## CAT 显示出问题服务端？

- 建议cat配置的都使用服务端内网的 IP，CAT 使用环境应该是内网，什么是内网 IP，可以自行 google 搜索。CAT 优先使用内网 IP，可以查看 CAT 上报 transaction 报表里面IP信息。
- 这个显示不影响数据上报和监控，仅仅是IP配置不规范

## 修改/data/目录？

- 建议使用linux的软链接创建目录指向 /data/ 目录
- cat不支持配置修改，如果想修改，自行阅读源码解决

## 看不到监控数据？

- 请检查下客户端的 log，在 /data/applogs/cat/*.log 目录
- 请检查下客户端和服务端时钟是否对应

## 看不到昨天的历史数据

- cat的历史模式报表数据都是夜间任务执行的。比如今天一天的报表数据, 会在明天凌晨1点以后开始执行。
- 偶尔会遇到数据库插入较慢, 或者任务集中密集的时候, 会导致任务执行速度较慢, 一些离线任务在预定的时间内未完成。导致我们看不到类似昨天天报表的情况。

## 消息错乱问题

- 有时候部分业务会出现打开一个 exception 或者 打开一个心跳的链接, 会读取到一个不相干的消息, 这个时候请检查下两个内容。
- 机器的 /data/appdatas/cat/{domain}.mark，domain为统一项目名, 这个文件是否具有读写权限
- 同一台机器上是否部署了两个相同domain的应用, CAT 支持同一个 IP 节点部署多个不相同的项目, 不支持同一个 IP 节点部署相同的项目。

## 本地测试看不到打点信息

- 本地 Test 时候发现使用 CAT 打点, 在测试环境看不到相关打点信息, 这个原因是cat是异步序列化和异步发送, 有时候 test 主线程退出了, jvm 就停止掉了, 导致根本来不及发送。
- 测试代码参考

```java
   
@Test 
public void test() throws Exception { 
    Transaction t = Cat.newTransaction("Check1", "name"); 
    Transaction t3 = Cat.newTransaction("Check2", "name"); 
    for (int i = 0; i < 2080; i++) { 
        Transaction t4 = Cat.newTransaction("Check3", "name"); 
        t4.complete(); 
    } 
    t3.complete(); 
    t.complete(); 
    Thread.sleep(1000); // 此处 sleep 一会, 就能保证 CAT 异步消息发送 
} 
```

## IPV6解决办法

- -Dhost.ip 传入ip
- -Djava.net.preferIPv4Stack=true

## 看不到异常详细堆栈信息

- JVM 就是为了性能考虑, 当一个内建的异常被抛出一定次数后, 会被重新编译, 抛出不带有堆栈的异常, 如果要禁用这个优化, 就得使用这个参数。
- 使用 -XX:-OmitStackTraceInFastThrow 关闭此项优化可以强制打印堆栈。优点是便于排查问题, 缺点是可能会增大开销。
- XX:-OmitStackTraceInFastThrow, 看看官方解释

> The compiler in the server VM now provides correct stack backtraces for all “cold” built-in exceptions. For performance purposes, when such an exception is thrown a few times, the method may be recompiled. After recompilation, the compiler may choose a faster tactic using preallocated exceptions that do not provide a stack trace. To disable completely the use of preallocated exceptions, use this new flag: -XX:-OmitStackTraceInFastThrow.

## QPS的统计

### 时间跨度

- 当前小时的数据, 是从当前小时整点开始到现在的秒数。实时计算。

```java
 
   如现在是 2016-11-25 16:55:10, 则时间跨度为 3310 秒（55*60+10） 
```

- 如果是已经过去的小时或历史数据, 是一整个小时（3600秒）或者一天的所有秒数

```java
 
   可以查看报表上方的开始和结束时间进行计算 
```

### 如何计算

- 时间跨度内的请求总量 / 时间跨度（总秒数）

## CAT帐户管理问题

- 默认账号是admin admin

## 多语言客户端支持情况

- 目前支持 Java C/C++ Go Node Python，其他语言暂无计划
- .NET语言客户端，携程的开源 [https://github.com/ctripcorp/cat.net](https://github.com/ctripcorp/cat.net)

## 自定义客户端的IP

- CAT 目前采集默认机器内网IP，如果需要自定义，可以传入环境变量 host.ip 来自定义ip
- 具体的源码在 NetworkInterfaceManager 类，业务可以自行扩展,比如说统一读取机器上一个环境properties的文件，这个文件内部存储了机器的IP地址以及机器名等

## 历史报表没有数据

- [https://github.com/dianping/cat/wiki/global](https://github.com/dianping/cat/wiki/global) 需要配置 job-machine，这样才会执行历史任务。
- 历史模式要隔一天才可以看到，后端离线任务做天、周、月报表合并
- 修改完配置后一定要重启服务

## 出现java.net.UnknownHostException: test

- 这个是cat需要集成公司内部的告警接口，cat本身不会自动发邮件、短信等，cat需要每个公司的研发自己配置http的api，cat通过调用这个api进行告警发送。在cat默认demo里面是写死的test域名，你得需要根据公司实际情况进行配置。具体可以参考文档中告警集成部分。

## 本地开发环境找不到类

- 根据ide的类型，在cat目录中执行 mvn eclipse:eclipse 或者 mvn idea:idea，此步骤会生成一些代码文件，直接导入到工程会发现找不到类
- 如果ide是eclipse，将源码以普通项目到入eclipse中，注意不要以maven项目导入工程
- 具体可以参考服务端部署文档 [https://github.com/dianping/cat/wiki/readme_server](https://github.com/dianping/cat/wiki/readme_server)

## cat的数据API

- 开源版本在当前url下加上 &forceDownload=xml，可以看到当前数据页面模型，但这个api性能偏差，不建议大范围做数据拉取，会影响数据处理

## cat3.0升级logRemoteCallClient API需要业务迁移

- 1.4.0版本的logRemoteCallClient方法内部的domain取的是当前项目的app.name
- 3.0.0版本的logRemoteCallClient方法内部的domain是default

```java
 
  public static void logRemoteCallClient(Context ctx) { 
  logRemoteCallClient(ctx, "default"); 
  } 
```

- 业务项目之前用的是1.4.0版本的cat，分布式调用链都正常显示，升级为3.0.0版本的cat时，由于logRemoteCallClient方法内部的domain是default导致调用链异常。
- 业务代码必须从Cat.logRemoteCallClient(catContext)改为Cat.logRemoteCallClient(catContext,”`$`{targertDomain}”);才可以正常显示调用链。
- 注意，这里面domain，是调用服务端的domain，并不是本身的domain
