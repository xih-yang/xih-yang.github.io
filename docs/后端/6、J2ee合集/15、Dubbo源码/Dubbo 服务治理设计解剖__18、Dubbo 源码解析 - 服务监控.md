# 18、Dubbo 源码解析 - 服务监控
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/18.html
- 分类：J2EE框架
- 分组：Dubbo 服务治理设计解剖
在分布式服务当中监控服务的各项指标至关重要，而 dubbo 也提供了一个简单的监控中心(Simple Monito)。Simple Monitor挂掉不会影响到Consumer和Provider之间的调用，所以用于生产环境不会有风险。 并且配置好了之后可以结合 admin 管理后台使用，可以清晰的看到服务的访问记录、成功次数、失败次数等…

Simple Monitor 采用磁盘存储统计信息，请注意安装机器的磁盘限制，如果要集群，建议用mount共享磁盘。

#### 1、监控中心

我们先来看一下 dubbo 监控中心的配置文件：

```java
# 1
dubbo.container=log4j,spring,registry,jetty
# 2
dubbo.application.name=simple-monitor
dubbo.application.owner=dubbo
#dubbo.registry.address=multicast://224.5.6.7:1234
dubbo.registry.address=zookeeper://127.0.0.1:2181
#dubbo.registry.address=redis://127.0.0.1:6379
#dubbo.registry.address=dubbo://127.0.0.1:9090
dubbo.protocol.port=7070
# 3
dubbo.jetty.port=8080
dubbo.jetty.directory=${user.home}/monitor
# 4
dubbo.charts.directory=${dubbo.jetty.directory}/charts
dubbo.statistics.directory=${user.home}/monitor/statistics
dubbo.log4j.file=logs/dubbo-monitor-simple.log
dubbo.log4j.level=WARN
```

我把这个配置文件分成了 4 个部分：

- dubbo Container SPI 配置，用于启动 dubbo 服务，监控中心等
- dubbo 服务配置，连接配置中心暴露配置在dubbo-monitor-simple.xml中的 MonitorService 以及引用 RegistryService。
- Jetty 容器相关的配置，监控中心显示页面使用 Jetty 容器启动。
- dubbo monitor 显示页面持久化的数据，包括显示展示图、调用统一、dubbo 监控中心的日志以及日志级别

下面我们来分别分析一下配置文件中配置的 4 个部分：

##### 1、Container

可以看到在配置文件中， dubbo 配置了 4 个容器(Container)。我们首先来看一下容器接口的定义：

```java
@SPI("spring")
public interface Container {
    void start();
    void stop();
}
```

dubbo 定义的 SPI 接口 Container 很简单，一个 `start` 方法用于容器的启动还有一个 `stop` 方法用于容器的停止。在 dubbo 监控中心启动的时候用调用 com.alibaba.dubbo.container.Main 中的 main 方法。在 main

方法里面会依次启动这 4 个容器对应类。下面我们来看一下配置的这 4 个容器对应的容器类。

```java
log4j      ---      Log4jContainer
spring     ---      SpringContainer
registry   ---      RegistryContainer
jetty      ---      JettyContainer
```

**Log4jContainer**

Log4jContainer 用于配置 Log4j 日志参数，如果配置了 `dubbo.log4j.subdirectory` 参数就会打印日志

**SpringContainer**

SpringContainer 会加载`classpath*:META-INF/spring/*.xml`目录下面的 spring 配置文件， 也就是`dubbo-monitor-simple.xml`。

> dubbo-monitor-simple.xml

```java
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xmlns="http://www.springframework.org/schema/beans"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
        http://www.springframework.org/schema/beans/spring-beans-2.5.xsd
	http://code.alibabatech.com/schema/dubbo 
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <bean class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">
        <property name="systemPropertiesModeName" value="SYSTEM_PROPERTIES_MODE_OVERRIDE"/>
        <property name="location" value="classpath:dubbo.properties"/>
    </bean>
    <bean id="monitorService" class="com.alibaba.dubbo.monitor.simple.SimpleMonitorService">
    </bean>
    <dubbo:application name="${dubbo.application.name}" owner="${dubbo.application.owner}"/>
    <dubbo:registry address="${dubbo.registry.address}"/>
    <dubbo:protocol name="dubbo" port="${dubbo.protocol.port}"/>
    <dubbo:service interface="com.alibaba.dubbo.monitor.MonitorService" ref="monitorService" delay="-1"/>
    <dubbo:reference id="registryService" interface="com.alibaba.dubbo.registry.RegistryService"/>
</beans>
```

它的作用与需要监控的注册中心以注册中心用 Spring 里面的 ClassPathXmlApplicationContext 来启动 dubbo 服务。暴露一个 MonitorService 的服务，用于监控数据采集以及监控数据查询(后面会详细分析)。并且引用注册中心的服务 RegistryService，订阅符合条件的已注册数据，当有注册数据变更时自动推送或者取消订阅。并且提供一个静态方法 `getContext()` 用于获取 ClassPathXmlApplicationContext 来操作 Spring 容器里面的 bean 对象。

**RegistryContainer**

它的类属性包括服务提供者和服务的消费者分类，收集服务名称，服务的url，服务提供方或者消费方的系统相关信息。并且提供了一个 `getInstance` 返回当前 RegistryContainer 的实例对象用于查询这些属性。下面我们来看一下 `start` 方法做了哪些事：

- 通过SpringContainer获取前面初始化的RegistryService，获取到一个远程代理服务
- 构建订阅注册中心数据的URL，看可以看出下面的url是订阅服务提供者和服务消费者的所有服务
- 调注册中心服务 registry.subscirbe(subscribeUrl,listener) 订阅所有数据, NotifyListener在监控中心暴露为回调服务，由注册中心回调. 回调接口NotifyListener实现的功能主要是按服务提供者和服务的消费者分类，收集服务名称，服务的url，服务提供方或者消费方的系统相关信息。 同时提供了一系列方法供注册中心调用查询。

**JettyContainer**

JettyContainer 容器用于启动一个内置的 Jetty web 服务.将 dubbo 自定义的前置控制器 PageServlet 及这个Servlet 的访问映射配置到 jetty 容器当中用于分发请求。把本地文件目录设置到 ResourceFilter 中，并设置这个filter的访问映射到 Jetty 中。ResourceFilter 主要是读取本地保存的 JFreeChart 绘制的图片到浏览器中去。

PageServlet 会在 init 方法中初始化对应菜单 URL 与 相应的处理类。这些处理类都是实现了 PageHandler 这个 SPI 接口。这些 key 被 HomePageHandler 用来生成主页以及各个页面的 URI。而对应的 PageHandler 用来处理页面分页请求逻辑。

#### 2、获取数据

如果想在 dubbo 的监控中心获取数据必须在 dubbo 服务的 provider 与 consumer 中加入以下代码：

```java
<dubbo:monitor protocol="registry" />
```

这样它就会激活 dubbo 服务中的 provider 与 consumer 中的 Filter 扩展 MonitorFilter 了。在 MonitorFilter 里面会引用到 dubbo 监控服务通过 SpringContainer 暴露出来的 MonitorService 服务。

```java
Monitor monitor = monitorFactory.getMonitor(url);
```

过程是通过 SPI 机制获取 MonitorFactory 的实现类 DubboMonitorFactroy，由 DubboMonitorFactroy 创建 MonitorService 接口的实例 DubboMonitor. 主要代码如下：

```java
        Invoker<MonitorService> monitorInvoker = protocol.refer(MonitorService.class, url);
        MonitorService monitorService = proxyFactory.getProxy(monitorInvoker);
        return new DubboMonitor(monitorInvoker, monitorService);
```

下面我们来看一下 MonitorService 接口的定义：

```java
public interface MonitorService {
    /**
     * 监控数据采集.
     * 1. 支持调用次数统计：count://host/interface?application=foo&method=foo&provider=10.20.153.11:20880&success=12&failure=2&elapsed=135423423
     * 1.1 host,application,interface,group,version,method 记录监控来源主机，应用，接口，方法信息。
     * 1.2 如果是消费者发送的数据，加上provider地址参数，反之，加上来源consumer地址参数。
     * 1.3 success,faulure,elapsed 记录距上次采集，调用的成功次数，失败次数，成功调用总耗时，平均时间将用总耗时除以成功次数。
     *
     * @param statistics
     */
    void collect(URL statistics);
    /**
     * 监控数据查询. 
     * 1. 支持按天查询：count://host/interface?application=foo&method=foo&side=provider&view=chart&date=2012-07-03
     * 1.1 host,application,interface,group,version,method 查询主机，应用，接口，方法的匹配条件，缺失的条件的表示全部，host用0.0.0.0表示全部。
     * 1.2 side=consumer,provider 查询由调用的哪一端采集的数据，缺省为都查询。
     * 1.3 缺省为view=summary，返回全天汇总信息，支持view=chart表示返回全天趋势图表图片的URL地址，可以进接嵌入其它系统的页面上展示。
     * 1.4 date=2012-07-03 指定查询数据的日期，缺省为当天。
     *
     * @param query
     * @return statistics
     */
    List<URL> lookup(URL query);
}
```

它其实就是使用的是 Dubbo 监控中心暴露出来的 SimpleMonitorService。它的 `collect` 方法被远程调用后将数据url(传过来的url包含监控需要的数据)保存到一个阻塞队列中BlockingQueue 当中并且启动两个定时任务。

一个定时任务用于把统计数据写在如下的文件中：

```java
                String filename = ${user.home}/monitor/statistics
                        + "/" + day
                        + "/" + statistics.getServiceInterface()
                        + "/" + statistics.getParameter(METHOD)
                        + "/" + consumer
                        + "/" + provider
                        + "/" + type + "." + key;
```

文件格式如下：

一个定时任务利用 JFreeeChart 绘制图表,保存路径文件夹为：

```java
${user.home}\monitor\charts\date\interfaceName\methodName
```

- 包含成功图片(success.png)、耗时图片(elapsed.png)

- 请求平均耗时、响应平均耗时

然后我们再回到如果把数据发送到 SimpleMonitorService，也就是激活的 provider 与 consumer 端的 MonitorFilter.

主要逻辑在 com.alibaba.dubbo.monitor.support.MonitorFilter#collect

```java
    // 信息采集
    private void collect(Invoker<?> invoker, Invocation invocation, Result result, String remoteHost, long start, boolean error) {
        try {
            // ---- 服务信息获取 ----
            long elapsed = System.currentTimeMillis() - start; // 计算调用耗时
            int concurrent = getConcurrent(invoker, invocation).get(); // 当前并发数
            String application = invoker.getUrl().getParameter(Constants.APPLICATION_KEY);
            String service = invoker.getInterface().getName(); // 获取服务名称
            String method = RpcUtils.getMethodName(invocation); // 获取方法名
            URL url = invoker.getUrl().getUrlParameter(Constants.MONITOR_KEY);
            Monitor monitor = monitorFactory.getMonitor(url);
            if (monitor == null) {
                return;
            }
            int localPort;
            String remoteKey;
            String remoteValue;
            if (Constants.CONSUMER_SIDE.equals(invoker.getUrl().getParameter(Constants.SIDE_KEY))) {
                // ---- 服务消费方监控 ----
                localPort = 0;
                remoteKey = MonitorService.PROVIDER;
                remoteValue = invoker.getUrl().getAddress();
            } else {
                // ---- 服务提供方监控 ----
                localPort = invoker.getUrl().getPort();
                remoteKey = MonitorService.CONSUMER;
                remoteValue = remoteHost;
            }
            String input = "", output = "";
            if (invocation.getAttachment(Constants.INPUT_KEY) != null) {
                input = invocation.getAttachment(Constants.INPUT_KEY);
            }
            if (result != null && result.getAttachment(Constants.OUTPUT_KEY) != null) {
                output = result.getAttachment(Constants.OUTPUT_KEY);
            }
            monitor.collect(new URL(Constants.COUNT_PROTOCOL,
                    NetUtils.getLocalHost(), localPort,
                    service + "/" + method,
                    MonitorService.APPLICATION, application,
                    MonitorService.INTERFACE, service,
                    MonitorService.METHOD, method,
                    remoteKey, remoteValue,
                    error ? MonitorService.FAILURE : MonitorService.SUCCESS, "1",
                    MonitorService.ELAPSED, String.valueOf(elapsed),
                    MonitorService.CONCURRENT, String.valueOf(concurrent),
                    Constants.INPUT_KEY, input,
                    Constants.OUTPUT_KEY, output));
        } catch (Throwable t) {
            logger.error("Failed to monitor count service " + invoker.getUrl() + ", cause: " + t.getMessage(), t);
        }
    }
    // 获取并发计数器
    private AtomicInteger getConcurrent(Invoker<?> invoker, Invocation invocation) {
        String key = invoker.getInterface().getName() + "." + invocation.getMethodName();
        AtomicInteger concurrent = concurrents.get(key);
        if (concurrent == null) {
            concurrents.putIfAbsent(key, new AtomicInteger());
            concurrent = concurrents.get(key);
        }
        return concurrent;
    }
```

代码里面的注释已经很清晰了，就不需要过多的说明了。需要注意的是 DubboMonitor 是调用监控中心的服务的封装。之所以没有直接调监控中心而是通过DubboMonitor调用，是因为监控是附加功能，不应该影响主链路更不应该损害主链路的新能，DubboMonitor采集到数据后通过任务定时调用监控中心服务将数据提交到监控中心。

#### 3、Simple Monitor 安装

从官方网站下载 dubbo monitor 打包并解压

```java
git clone https://github.com/apache/incubator-dubbo-ops
cd incubator-dubbo-ops && mvn package
cd dubbo-monitor-simple/target && tar xvf dubbo-monitor-simple-2.0.0-assembly.tar.gz
cd dubbo-monitor-simple-2.0.0
```

修改监控中心配置文件`conf/dubbo.properties` 把注册中心修改为你的 dubbo 服务真实的注册中心。

> vi conf/dubbo.properties

```java
dubbo.container=log4j,spring,registry,jetty
dubbo.application.name=simple-monitor
dubbo.application.owner=
#dubbo.registry.address=multicast://224.5.6.7:1234
dubbo.registry.address=zookeeper://127.0.0.1:2181
#dubbo.registry.address=redis://127.0.0.1:6379
#dubbo.registry.address=dubbo://127.0.0.1:9090
dubbo.protocol.port=7070
dubbo.jetty.port=8080
dubbo.jetty.directory=${user.home}/monitor
dubbo.charts.directory=${dubbo.jetty.directory}/charts
dubbo.statistics.directory=${user.home}/monitor/statistics
dubbo.log4j.file=logs/dubbo-monitor-simple.log
dubbo.log4j.level=WARN
```

这里我是在本地演示，所以服务是使用 dubbo 的 demo 服务，然后在本地启动的 zookeeper 做为注册中心。

**监控中心命令：**

```java
# 启动:
./assembly.bin/start.sh
# 停止:
./assembly.bin/stop.sh
# 重启:
./assembly.bin/restart.sh
# 调试:
./assembly.bin/start.sh debug
# 系统状态:
./assembly.bin/dump.sh
```

可以通过`http://127.0.0.1:8080`进行访问：

#### 4、页面菜单

dubbo monitor 主要展现了以下几个页面菜单：Home、Applications、Services、Hosts、Registries、Servers、Status、Log、System 十个页面。下面我们简单的为这十个页面截图一下。

##### 4.1 Home

##### 4.2 Applications

##### 4.3 Services

还可以点击具体服务的 Statistics 查看统计信息：

##### 4.4 Hosts

##### 4. 5 Registries

##### 4. 6 Servers

##### 4.7 Status

##### 4.8 Log

##### 4.9 System

参考文章：

- http://dubbo.apache.org/books/dubbo-admin-book/install/simple-monitor-center.html
- https://blog.csdn.net/quhongwei_zhanqiu/article/details/41896667
