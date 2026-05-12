# 04、Dubbo 源码解析 - Spring 集成
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/4.html
- 分类：J2EE框架
- 分组：Dubbo 内核解剖
Spring框架从2.0版本开始,提供了基于Schema风格的Spring XML格式用来定义bean的扩展机制。引入Schema-based XML是为了对Traditional的XML配置形式进行简化。通过Schema的定义，把一些原本需要通过几个bean的定义或者复杂的bean的组合定义的配置形式，用另外一种简单而可读的配置形式呈现出来。

Schema-based XML由三部分构成，我们由一幅图说明：

- namespace —— 拥有很明确的逻辑分类
- element —— 拥有很明确的过程语义
- attributes —— 拥有很简明的配置选项

例如，``这段配置想要表达的意思，就是在mvc的空间内实现Annotation驱动的配置方式。其中，mvc表示配置的有效范围，annotation-driven则表达了一个动态的过程，实际的逻辑含义是：整个SpringMVC的实现是基于Annotation模式，请为我注册相关的行为模式。

在之前的文章中提到过如何自定义Schema实现 – [Spring Extensible XML](http://blog.csdn.net/u012410733/article/details/54413704)。在Spring的内部也大量使用自定义的Schema。

在dubbo中也通过这种自定义Schema的形式简化它的使用与配置。

> DubboNamespaceHandler.java

```java
public class DubboNamespaceHandler extends NamespaceHandlerSupport {
	static {
		Version.checkDuplicate(DubboNamespaceHandler.class);
	}
	public void init() {
	    registerBeanDefinitionParser("application", new DubboBeanDefinitionParser(ApplicationConfig.class, true));
        registerBeanDefinitionParser("module", new DubboBeanDefinitionParser(ModuleConfig.class, true));
        registerBeanDefinitionParser("registry", new DubboBeanDefinitionParser(RegistryConfig.class, true));
        registerBeanDefinitionParser("monitor", new DubboBeanDefinitionParser(MonitorConfig.class, true));
        registerBeanDefinitionParser("provider", new DubboBeanDefinitionParser(ProviderConfig.class, true));
        registerBeanDefinitionParser("consumer", new DubboBeanDefinitionParser(ConsumerConfig.class, true));
        registerBeanDefinitionParser("protocol", new DubboBeanDefinitionParser(ProtocolConfig.class, true));
        registerBeanDefinitionParser("service", new DubboBeanDefinitionParser(ServiceBean.class, true));
        registerBeanDefinitionParser("reference", new DubboBeanDefinitionParser(ReferenceBean.class, false));
        registerBeanDefinitionParser("annotation", new DubboBeanDefinitionParser(AnnotationBean.class, true));
    }
}
```

在dubbo中provider通过ServiceConfig创建服务信息，并且通过调用`export()`方法发布并暴露服务到注册中心提供给consumer使用。下面是dubbo官网给出的Java provider API使用。

```java
import com.alibaba.dubbo.rpc.config.ApplicationConfig;
import com.alibaba.dubbo.rpc.config.RegistryConfig;
import com.alibaba.dubbo.rpc.config.ProviderConfig;
import com.alibaba.dubbo.rpc.config.ServiceConfig;
import com.xxx.XxxService;
import com.xxx.XxxServiceImpl;
// 服务实现
XxxService xxxService = new XxxServiceImpl();
// 当前应用配置
ApplicationConfig application = new ApplicationConfig();
application.setName("xxx");
// 连接注册中心配置
RegistryConfig registry = new RegistryConfig();
registry.setAddress("10.20.130.230:9090");
registry.setUsername("aaa");
registry.setPassword("bbb");
// 服务提供者协议配置
ProtocolConfig protocol = new ProtocolConfig();
protocol.setName("dubbo");
protocol.setPort(12345);
protocol.setThreads(200);
// 注意：ServiceConfig为重对象，内部封装了与注册中心的连接，以及开启服务端口
// 服务提供者暴露服务配置
ServiceConfig<XxxService> service = new ServiceConfig<XxxService>(); // 此实例很重，封装了与注册中心的连接，请自行缓存，否则可能造成内存和连接泄漏
service.setApplication(application);
service.setRegistry(registry); // 多个注册中心可以用setRegistries()
service.setProtocol(protocol); // 多个协议可以用setProtocols()
service.setInterface(XxxService.class);
service.setRef(xxxService);
service.setVersion("1.0.0");
// 暴露及注册服务
service.export();
```

在consumer端通过ReferenceConfig创建引用服务信息，并且通过`get()`方法获取到调用远程服务的代理对象。而通过Spring的自定义Schema通过以下方式就可以创建ServiceConfig对象。下面是dubbo官网提供的Java consumer API使用demo.

```java
import com.alibaba.dubbo.rpc.config.ApplicationConfig;
import com.alibaba.dubbo.rpc.config.RegistryConfig;
import com.alibaba.dubbo.rpc.config.ConsumerConfig;
import com.alibaba.dubbo.rpc.config.ReferenceConfig;
import com.xxx.XxxService;
// 当前应用配置
ApplicationConfig application = new ApplicationConfig();
application.setName("yyy");
// 连接注册中心配置
RegistryConfig registry = new RegistryConfig();
registry.setAddress("10.20.130.230:9090");
registry.setUsername("aaa");
registry.setPassword("bbb");
// 注意：ReferenceConfig为重对象，内部封装了与注册中心的连接，以及与服务提供方的连接
// 引用远程服务
ReferenceConfig<XxxService> reference = new ReferenceConfig<XxxService>(); // 此实例很重，封装了与注册中心的连接以及与提供者的连接，请自行缓存，否则可能造成内存和连接泄漏
reference.setApplication(application);
reference.setRegistry(registry); // 多个注册中心可以用setRegistries()
reference.setInterface(XxxService.class);
reference.setVersion("1.0.0");
// 和本地bean一样使用xxxService
XxxService xxxService = reference.get(); // 注意：此代理对象内部封装了所有通讯细节，对象较重，请缓存复用
```

下面我们再来看一下dubbo通过自定义Schema是如何配置dubbo里面的核心组件的呢？

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://code.alibabatech.com/schema/dubbo http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <!-- 提供方应用信息，用于计算依赖关系 -->
    <dubbo:application name="hello-world-app"  />
    <!-- 使用multicast广播注册中心暴露服务地址 -->
    <dubbo:registry address="multicast://224.5.6.7:1234" />
    <!-- 用dubbo协议在20880端口暴露服务 -->
    <dubbo:protocol name="dubbo" port="20880" />
    <!-- 声明需要暴露的服务接口 -->
    <dubbo:service interface="com.weimob.o2o.carl.provider.DemoService" ref="demoService" />
    <!-- 和本地bean一样实现服务 -->
    <bean id="demoService" class="com.weimob.o2o.carl.provider.impl.DemoServiceImpl" />
</beans>
```

然后通过DubboNamespaceHandler注册的的service把xml解析成ServiceBean。这个Bean是继承自上面提到的ServiceConfig。然后通过利用Spring的生命周期在实例化bean的时候会调用org.springframework.beans.factory.InitializingBean#afterPropertiesSet方法。它最终会调用com.alibaba.dubbo.config.ServiceConfig#export方法进行服务暴露。

而对于服务引用Dubbo也是同样的套路。首先我们来看一下consumer的xml配置。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://code.alibabatech.com/schema/dubbo http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <!-- 消费方应用名，用于计算依赖关系，不是匹配条件，不要与提供方一样 -->
    <dubbo:application name="consumer-of-helloworld-app"  />
    <!-- 使用multicast广播注册中心暴露发现服务地址 -->
    <dubbo:registry address="multicast://224.5.6.7:1234" />
    <!-- 生成远程服务代理，可以和本地bean一样使用demoService -->
    <dubbo:reference id="demoService" interface="com.weimob.o2o.carl.provider.DemoService" />
</beans>
```

它也是通过DubboNamespaceHandler注册的的reference把xml解析成ReferenceBean。这个Bean是继承自上面提到的ReferenceConfig。然后通过利用Spring的生命周期在实例化bean的时候会调用org.springframework.beans.factory.InitializingBean#afterPropertiesSet方法。它最终会调用com.alibaba.dubbo.config.ReferenceConfig#get方法远程服务调用代理类的创建。
