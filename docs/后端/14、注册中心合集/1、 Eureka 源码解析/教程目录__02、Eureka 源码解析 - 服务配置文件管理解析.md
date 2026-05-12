# 02、Eureka 源码解析 - 服务配置文件管理解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/2.html
- 分类：注册中心
- 分组：教程目录
Eureka 服务在进行配置管理的时候使用的是接口进行管理。对于 Eureka 服务它提供了很多自定义参数用于服务器上面的各种管理。其实对于 Eureka 来说：它即是一个服务器，因为它是一个注册中心，需要对外部微服务提供服务注册与服务发现；同时它又是一个 Client，因为对于分步式环境当中存在单点故障，为了解决这个功能 Eureka 提供了集群部署功能。那么不同的 Eureka 服务之间就面临微服务注册的注册表信息同步问题。所以 Eureka 也是一个 Eureka Client 它会拉取配置上面的其它 Eureka Server 上在的注册信息进行同步。

当Eureka 服务进行启动的时候可以对它进行Eureka Server 相关的配置，也可以进行 Eureka Client 的相关的配置。

- Eureka Servlet ：默认通过 eureka-server.properites 对它进行解析，并且 Eureka Server 相关的参数都可以通过 EurekaServerConfig 接口进行访问。
- Eureka Client：默认通过 eureka-client.properites 对它进行解析，并且 Eureka Client 相关的参数都可以通过 EurekaInstanceConfig 接口进行访问。

相对于通过 Properties 这种 Key/Value 类型的数据结构进行访问时，一方面它更符合面向对象原则，对访问进行值进行包装，另一方面当某个属性的 KEY 需要变更时，只需要变更接口提供的方法而不需要改变每个地方的 get(Key)，这个里面的 key 进行变更。

Eureka 在进行配置管理底层其实是封装了 Apache 提供的工具包 [commons-configuration](https://commons.apache.org/proper/commons-configuration/)。那么我们首先就来分析 commons-configuration 这个 jar 包

### 1、commons configuration

commons-configuration 的最新版本是 2.7，但是 Eureka 使用的是 1.x。那么我们就来分析一下 commons-configuration 1.x 的使用方式。

#### 1.1 commons configuration 概述

Commons Configuration 允许您从各种不同的来源访问配置属性。无论它们存储在属性文件、XML文档还是JNDI树中，都可以通过通用配置接口以相同的方式访问它们。

Commons Configuration 的另一个优点是它能够混合来自不同来源的配置，并将它们视为单个逻辑配置。本节将向您介绍可用的不同配置，并向您展示如何组合它们。

#### 1.2 配置源

目前，配置对象有相当多的不同来源。但是，通过仅使用配置对象而不是使用XMLConfiguration或JNDIConfiguration等特定类型，您可以避免实际检索配置值的机制。这些各种来源包括:

- PropertiesConfiguration ：从属性文件中加载配置值。
- XMLConfiguration：从XML文档中获取值。
- INIConfiguration：加载Windows使用的.ini文件中的值。
- PropertyListConfiguration：从OpenStep .plist文件加载值。XMLPropertyListConfiguration 也可用于读取Mac OS X使用的XML变体。
- JNDIConfiguration：使用JNDI树中的键，可以检索作为配置属性的值。
- BaseConfiguration：填充配置对象的内存方法。
- HierarchicalConfiguration：一个内存中的配置对象，可以处理复杂的结构化数据。
- SystemConfiguration：使用系统属性的配置
- ConfigurationConverter：接受 java.util.Properties 或 org.apache.commons.collections.ExtendedProperties，并将其转换为配置对象。

#### 1.3 commons configuration 示例

因为Eureka 里面主要的是使用 properties 文件，那我们就举例一个 properties 文件的示例。

首先添加一 resources 目录下添加 properties 类型的配置文件：`config.properties`，并添加一个简单的属性。

> config.properties

```java
name=carl
```

下面就通过 `commons-configuration` 对它进行访问：

> App.java

```java
public class App {
    public static void main( String[] args ) {
        CompositeConfiguration config = new CompositeConfiguration();
        try {
            config.addConfiguration(new SystemConfiguration());
            config.addConfiguration(new PropertiesConfiguration("config.properties"));
        } catch (ConfigurationException e) {
            // do nothing
        }
        // from system
        System.out.println("system java home is : " + config.getString("java.home"));
        // from config.properties
        System.out.println("config value name is : " + config.getString("name"));
    }
}
```

运行结果如下：

### 2、commons configuration 源码分析

commons-configuration 里面的核心其实就是 `Configuration` 这个接口，首先我们来看一下这个接口的定义：

其实这个接口就是根据某个属性的 Key，来获取它对应的值。其实和 Map 这种数据结构提供的接口类似，只是它可以从不同的配置文件中加载配置。

下面就是 commons-configuration 加载 config.properties 的时序图：

可以看到它主要是读取 properties 类型的配置文件，并把配置在 properites 里面的属性都读取到 `PropertiesConfiguration` 的父类 `BaseConfiguration` 的属性 `store` 当中：

> BaseConfiguration.java

```java
public class BaseConfiguration extends AbstractConfiguration implements Cloneable
{
    private Map<String, Object> store = new LinkedHashMap<String, Object>();
	....
}
```

其实`store` 就是一个 Key/Value 的 Map 数据结果，当外部需要查询一个属性的值时，直接就从这个 Map 中获取就可以了。下面我们来看一下获取一个属性的时序图：

其实我们在读取配置文件的时候是初始化的一个 `CompositeConfiguration` ，这个对象里面可以包含多个 `Configuration`。所以在读取配置属性的时候它会遍历它包含的所有的 `Configuration` ，如果找到包含传入属性的`Configuration` 就直接返回配置的值，否则返回空值。

那么我们下面就来讨论一下 Eureka Server 中是如何进行数据配置的。

### 3、Eureka 配置文件管理

我们都知道 Eureka Server 是 Netflix 开源的框架，其实 Netflix 对 commons-configuration 也进行了进一步的抽象。抽象成了 `archaius-core` 这个 Jar 包，它其实最主要的是使得配置可以动态化还可以添加一些事件。

`archaius-core`抽象了 `ConfigurationManager` 对 `commons-configuration` 进行包装可以获取、加载 `org.apache.commons.configuration.Configuration`。然后抽象了 `com.netflix.config.Property` 可以获取配置文件文件中的值，也可以获取默认的值。

> Property.java

```java
public interface Property<T> {
	// 获取动态值
    T getValue();
	// 获取默认值
    T getDefaultValue();
	// 获取配置名称
    String getName();
	// 获取修改时间
    long getChangedTimestamp();
	// 添加回调函数
    void addCallback(Runnable callback);
	// 移除回调函数
    void removeAllCallbacks();
}
```

以获取 Integer 动态值为例， 在获取动态值的时候会通过 com.netflix.config.DynamicPropertyFactory#getInstance 把 ConfigurationManager 加载的配置文件持有的 org.apache.commons.configuration.Configuration 加载到 DynamicPropertyFactory 当中。然后调用 DynamicPropertyFactory#getIntProperty(key, defaultValue) 构建 DynamicIntProperty 对象，其实就是 Property 接口的实例对象。调用DynamicIntProperty的父类 PropertyWrapper 持有的 DynamicProperty#getInteger 最终拿到配置文件的值。

下面就是整个创建 `ConfigurationManager` 对象，然后加载配置文件，并且`ConfigurationManager` 对象持有的 `org.apache.commons.configuration.Configuration` 加载到 `DynamicPropertyFactory` 当中。

- ConfigurationManager 创建的其实是 ConcurrentCompositeConfiguration 这个类继承自 commons-configuration 中的 org.apache.commons.configuration.AbstractConfiguration 它的内部可以包含多个 org.apache.commons.configuration.Configuration 信息。
- 通过 ConfigurationManager#loadCascadedPropertiesFromResources 加载 eureka-server.properties 的值，最终是调用 OverridingPropertiesConfiguration 它继承自 org.apache.commons.configuration.PropertiesConfiguration。
- 加载 eureka-server.properties，最终会把 properties 中配置的值读取到 ConfigurationManager 创建的的 ConcurrentCompositeConfiguration属性：配置列表 – List`` configList 以及配置映射 – Map`` namedConfigurations 当中。

既然配置文件都读取了，那可 eureka server 就可以从配置中获取值了。下面是 eureka server 获取配置文件值的时序图：

- DynamicPropertyFactory#getInstance() 会把 ConfigurationManager 中管理的配置文件加载到 DynamicPropertyFactory 当中
- Eureka Server 获取值的时候会创建一个 Property的实例，比如：DynamicStringProperty 对象。在DynamicStringProperty 对象初始化的同时也会初始化它的父类 PropertyWrapper。PropertyWrapper在初始化的过程当中会设置传入的默认值以及根据传入的属性 key 值通过调用 DynamicProperty#getInstance 获取一个动态获取属性值的类 DynamicProperty。
- 在创建 DynamicProperty对象的时候会调用 DynamicProperty#updateValue 更新值，它会调用 DynamicPropertySupport#getString 方法。这个对象其实是在每一步的时候当调用 DynamicPropertyFactory#getInstance() 会把 ConfigurationManager 持有的 org.apache.commons.configuration.Configuration添加到 DynamicPropertySupport当中。
- 最后会调用 org.apache.commons.configuration.Configuration 的配置管理来获取配置文件中配置的值。
