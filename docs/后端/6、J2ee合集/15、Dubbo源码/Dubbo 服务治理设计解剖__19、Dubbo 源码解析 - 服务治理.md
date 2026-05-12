# 19、Dubbo 源码解析 - 服务治理
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/19.html
- 分类：J2EE框架
- 分组：Dubbo 服务治理设计解剖
在之前的 dubbo 源码分析中我们分析了 dubbo 的服务暴露。provider 把需要暴露的服务地址信息注册到注册中心(比如:zookeeper)，然后把通过 java nio 框架 netty 以 socket 的方式把远程服务暴露给 consumer 调用，并且订阅注解中心，当注册中心发生变化的时候 Inovke 调用就会改变。当 consumer 需要引用服务的时候通过 javassist 创建代理对象，获取到代理对象 InvokerInvocationHandler，而它组合了一个 MockClusterInvoker。dubbo 通过这个对象进行服务治理，也就是之前分析的集群容错源码的分析。我们再来看一下集群容错的架构图：

dubbo 不仅提供了 dubbo monitor 来监控服务指数，还提供了一个管理控制台用于服务的治理。

#### 1、dubbo admin 安装

安装

```java
wget https://archive.apache.org/dist/tomcat/tomcat-6/v6.0.35/bin/apache-tomcat-6.0.35.tar.gz
tar zxvf apache-tomcat-6.0.35.tar.gz
cd apache-tomcat-6.0.35
rm -rf webapps/ROOT
git clone https://github.com/dubbo/dubbo-ops.git /var/tmp/dubbo-ops
pushd /var/tmp/dubbo-ops
mvn clean package
popd
unzip /var/tmp/dubbo-ops/dubbo-admin/target/dubbo-admin-2.0.0.war -d webapps/ROOT
```

配置`dubbo.properties` 把 dubbo 注解中心地址配置成真正项目里面的注册中心

```java
vi webapps/ROOT/WEB-INF/dubbo.properties
#dubbo.properties
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.admin.root.password=root
dubbo.admin.guest.password=guest
```

运维：

```java
# 启动:
./bin/startup.sh
# 停止:
./bin/shutdown.sh
```

然后可以通过: `http://127.0.0.1:8080/` 进行访问。

#### 2、dubbo admin

dubbo admin 主要包含以下几个页面。

##### 搜索页面

当你需要管理 Dubbo 的服务时，首先要搜索到这个服务，然后打开它的管理页面

##### 服务提供者页面

##### 服务消费者页面

##### 服务应用页面

##### 添加路由规则页面

##### 添加动态配置页面

通过这些页面可以查询所有的服务提供者、服务消费者、服务的应用以及动态的添加路由规则或者添加动态的配置。当然也包含服务的降级、服务访问权重的调节以及负载均衡的调节。

#### 3、服务治理原理

dubbo admin 使用 Spring MVC 来自页面展示的。我们先来看一下dubbo admin 中的配置文件 `dubbo.properties`里面配置了 dubbo 的注册中心地址以及 dubbo admin 的用户名与密码。

> dubbo.properties

```java
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.admin.root.password=root
dubbo.admin.guest.password=guest
```

通过配置的暴露服务的注册中心地址，就可以从注册中心获取提供者、消费者、路由信息、权重等信息。

下面我们再来看一下 `dubbo-admin` 里面的配置：

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xmlns="http://www.springframework.org/schema/beans"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://code.alibabatech.com/schema/dubbo http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <bean class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">
        <property name="systemPropertiesModeName" value="SYSTEM_PROPERTIES_MODE_OVERRIDE"/>
        <property name="ignoreResourceNotFound" value="true"/>
        <property name="locations">
            <list>
                <value>/WEB-INF/dubbo.properties</value>
                <value>file://${user.home}/dubbo.properties</value>
            </list>
        </property>
    </bean>
    <dubbo:application name="dubbo-admin"/>
    <dubbo:registry client="curator" address="${dubbo.registry.address}" check="false" file="false"/>
    <dubbo:reference id="registryService" interface="com.alibaba.dubbo.registry.RegistryService" check="false"/>
    <bean id="configService" class="com.alibaba.dubbo.governance.service.impl.ConfigServiceImpl"/>
    <bean id="consumerService" class="com.alibaba.dubbo.governance.service.impl.ConsumerServiceImpl"/>
    <bean id="overrideService" class="com.alibaba.dubbo.governance.service.impl.OverrideServiceImpl"/>
    <bean id="ownerService" class="com.alibaba.dubbo.governance.service.impl.OwnerServiceImpl"/>
    <bean id="providerService" class="com.alibaba.dubbo.governance.service.impl.ProviderServiceImpl"/>
    <bean id="routeService" class="com.alibaba.dubbo.governance.service.impl.RouteServiceImpl"/>
    <bean id="userService" class="com.alibaba.dubbo.governance.service.impl.UserServiceImpl">
        <property name="rootPassword" value="${dubbo.admin.root.password}"/>
        <property name="guestPassword" value="${dubbo.admin.guest.password}"/>
    </bean>
    <bean id="governanceCache" class="com.alibaba.dubbo.governance.sync.RegistryServerSync"/>
</beans>
```

##### 3.1 RegistryService

这个其实就是 dubbo admin 进行服务治理的对象，当在页面更新了服务信息的时候后台会通过这个对象进行服务信息的更新：

```java
# 取消注册旧的服务信息
registryService.unregister(oldOverride);
# 注册新的服务信息
registryService.register(newOverride);
```

在这里它会引用 `dubbo.properties` 里面配置的注册中心，然后引用 `RegistryService` 这个服务。这个是不是和 consumer 引用远程服务的配置是一样的。但是我们可以使用 Zookeeper 数据查看工具 ZooInspector 查看 zookeeper 节点上面的数据。

可以看到在 zookeeper 里面并没有暴露远程服务 RegistryService 。然后我们来看打断点的跟踪到 RegistryProtocol#refer的时候：

```java
    public <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException {
        url = url.setProtocol(url.getParameter(Constants.REGISTRY_KEY, Constants.DEFAULT_REGISTRY)).removeParameter(Constants.REGISTRY_KEY);
        Registry registry = registryFactory.getRegistry(url);
        if (RegistryService.class.equals(type)) {
            return proxyFactory.getInvoker((T) registry, type, url);
        }
        // group="a,b" or group="*"
        Map<String, String> qs = StringUtils.parseQueryString(url.getParameterAndDecoded(Constants.REFER_KEY));
        String group = qs.get(Constants.GROUP_KEY);
        if (group != null && group.length() > 0) {
            if ((Constants.COMMA_SPLIT_PATTERN.split(group)).length > 1
                    || "*".equals(group)) {
                return doRefer(getMergeableCluster(), registry, type, url);
            }
        }
        return doRefer(cluster, registry, type, url);
    }
```

发现dubbo admin 再进行服务引用的时候会先根据配置 URL 获取一个 Registry 而 Registry 又是继承于 RegistryService 接口。然后再选择远程服务之前会判断这个服务是不是 RegistryService 。如果是就会根据已经获取到的 Registry 创建一个本地 Invoke，然后由这个本地 Invoke 创建 ZookeeperRegistry 的代理对象。(这个比较坑，我纠结了很久才发现 😦 )。

##### 3.2 RegistryServerSync

这个对象实现了 Spring 框架的 InitializingBean，所以在这个 bean 初始化的时候就会订阅以下 URL：

```java
    private static final URL SUBSCRIBE = new URL(Constants.ADMIN_PROTOCOL, NetUtils.getLocalHost(), 0, "",
            Constants.INTERFACE_KEY, Constants.ANY_VALUE,
            Constants.GROUP_KEY, Constants.ANY_VALUE,
            Constants.VERSION_KEY, Constants.ANY_VALUE,
            Constants.CLASSIFIER_KEY, Constants.ANY_VALUE,
            Constants.CATEGORY_KEY, Constants.PROVIDERS_CATEGORY + ","
            + Constants.CONSUMERS_CATEGORY + ","
            + Constants.ROUTERS_CATEGORY + ","
            + Constants.CONFIGURATORS_CATEGORY,
            Constants.ENABLED_KEY, Constants.ANY_VALUE,
            Constants.CHECK_KEY, String.valueOf(false));
```

因为它的 interface 设置的是 Constants.ANY_VALUE 也就是 * ，所以会订阅所有的服务。具体 zookeeper 注册中心的订阅服务可以参考 ZookeeperRegistry#doSubscribe 方法。订阅了所以服务并且会获取到所有服务的服务信息缓存到 RegistryServerSync#registryCache 属性中。RegistryServerSync 还实现了NotifyListener，所以在注册中心订阅的时候还把它本身传进进去了。当注册中心的所有服务信息发生变更的时候就会调用 RegistryServerSync#notify 更新RegistryServerSync#registryCache 缓存信息。这样就可以对服务进行治理。

##### 3.3 原理分析

dubbo admin 通过 Spring mvc 来展示注册中心保存的服务地址信息：提供者、消费者、路由信息、权重等信息。通过 `com.alibaba.dubboadmin.web.mvc.BaseController` 的继承类来修改注册中心中的服务信息：

这些controller 主要是通过 AbstractService 的继承类来修改注册中心里面的注册信息。

```java
public class AbstractService {
    protected static final Logger logger = LoggerFactory.getLogger(AbstractService.class);
    @Autowired
    protected RegistryService registryService;
    @Autowired
    private RegistryServerSync sync;
    public ConcurrentMap<String, ConcurrentMap<String, Map<Long, URL>>> getRegistryCache() {
        return sync.getRegistryCache();
    }
}
```

它有一个 RegistryService 是 ZookeeperRegistry 的代理对象，而且还有 RegistryServerSync 这个注册中心的服务信息缓存(当服务地址信息发生变更时还可以动态更新缓存)。这样就起到了服务治理的效果。以下都是可以动态修改信息的实现类：

#### 4、服务治理应用

通过dubbo admin 页面不仅仅可以展示服务提供者、消费者、路由信息、权重等信息。还可以修改服务提供者，消息者的属性来达到服务治理的目的。下面我们就来看一下有哪一些应用：

**4、** 1服务降级；

可以通过dubbo admin 来实现服务降级功能，服务降级其实是临时屏蔽某个出错的非关键服务，并定义降级后的返回策略。有两种方式：

```java
mock=force:return+null 表示消费方对该服务的方法调用都直接返回 null 值，
不发起远程调用。用来屏蔽不重要服务不可用时对调用方的影响。
还可以改为 mock=fail:return+null 表示消费方对该服务的方法调用在失败后，再返回 null 值，
不抛异常。用来容忍不重要服务不稳定时对调用方的影响。
```

它的实现其实就是在集群调用的入口： MockClusterInvoker#invoke：

```java
    public Result invoke(Invocation invocation) throws RpcException {
        Result result = null;
        String value = directory.getUrl().getMethodParameter(invocation.getMethodName(), Constants.MOCK_KEY, Boolean.FALSE.toString()).trim();
        if (value.length() == 0 || value.equalsIgnoreCase("false")) {
            //no mock
            result = this.invoker.invoke(invocation);
        } else if (value.startsWith("force")) {
            if (logger.isWarnEnabled()) {
                logger.info("force-mock: " + invocation.getMethodName() + " force-mock enabled , url : " + directory.getUrl());
            }
            //force:direct mock
            result = doMockInvoke(invocation, null);
        } else {
            //fail-mock
            try {
                result = this.invoker.invoke(invocation);
            } catch (RpcException e) {
                if (e.isBiz()) {
                    throw e;
                } else {
                    if (logger.isWarnEnabled()) {
                        logger.info("fail-mock: " + invocation.getMethodName() + " fail-mock enabled , url : " + directory.getUrl(), e);
                    }
                    result = doMockInvoke(invocation, e);
                }
            }
        }
        return result;
    }
```

这段代码的逻辑分为 3 种情况：

- no mock：正常情况，从注册中心经过集群、目录服务、路由服务、负载均衡选择一个合适的 Invoke 来进行调用。
- force:direct mock：屏蔽，它不进行远程调用,直接返回一个之前设置的值.
- fail-mock：容错，容错的其实就是调用失败后,返回一个设置的值

##### 4.2 灰度发布

灰度发布（又名金丝雀发布）是指在黑与白之间，能够平滑过渡的一种发布方式。在其上可以进行A/B testing，即让一部分用户继续用产品特性A，一部分用户开始用产品特性B，如果用户对B没有什么反对意见，那么逐步扩大范围，把所有用户都迁移到B上面来。灰度发布可以保证整体系统的稳定，在初始灰度的时候就可以发现、调整问题，以保证其影响度。

比如我们需要在两台机器(192.168.100.38、192.168.48.32)上暴露服务，可以通过以下方式来进行灰度发布：

- 发布192.168.48.32，切断192.168.48.32访问流量，然后进行服务的发布。
- 192.168.48.32发布成功后，恢复 192.168.48.32的流量，
- 切断192.168.100.38，继续发布 192.168.100.38

参考文章：

- http://dubbo.apache.org/books/dubbo-admin-book/install/admin-console.html
- http://dubbo.apache.org/books/dubbo-user-book/demos/service-downgrade.html
- https://blog.csdn.net/quhongwei_zhanqiu/article/details/41896943
