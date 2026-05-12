# 03、Dubbo 3.x 源码解析 - Dubbo SPI机制的介绍与使用
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/3.html
- 分类：J2EE框架
- 分组：教程目录
> 介绍了JDK的SPI机制的概念和原理，并且介绍了Dubbo SPI机制的概念和原理，以及Dubbo SPI机制的优缺点

## 1 JDK的SPI机制

我们知道Dubbo通过自己的SPI机制对于Dubbo的模块实现了插件式的可插拔扩展功能，对接入方进行自由扩展需求的支持非常友好，我们简单看看SPI机制到底是什么。

### 1.1 SPI的概念

API是接口和实现类都由服务提供方实现，调用方仅仅只有调用方法的权限，一般的，如果接口和实现类位于同一个jar包体系中，就属于API。

而SPI，则是由服务调用方提供接口，由服务实现方（提供方）提供接口的实现。以数据库驱动Driver来说，我们的项目作为使用者/调用方，仅仅提供了Driver驱动接口（位于JDK核心包中），而具体的驱动实现则是不同的数据库厂商来实现的，我们引入的数据驱动jar包的中并不包含Driver接口，仅包含接口的实现，这就是典型的SPI机制。

SPI全名Service Provider Interface，它是 JDK 内置的一个服务发现机制， SPI机制使得接口和具体实现完全解耦，接口和实现可以不位于同一个jar包中。我们只需要声明接口，具体的实现类在的配置中选择即可。SPI早在Java6的时候就被引入JDK中了。

**JDK的SPI机制通过一系列规范的流程来实现服务的自动查找：**

**1、****当服务的提供者提供了服务接口的一种实现之后，在jar包的META-INF/services/目录里同时创建一个以服务接口全路径名命名的文件，文件的内容就是实现该服务接口的具体实现类的全路径名，有多个实现类则一行一个实现**；

**2、****在引入jar包之后，当需要该服务的时候，SPI机制就能通过查找jar包下的META-INF/services/目录，然后根据接口名找到对应配置文件，然后就能读取到文件的内容，即服务接口具体的实现类名，最后将该实现类加载并实例化，完成服务的加载**；

### 1.2 SPI的原理

JDK的SPI机制的简单原理如下：

**1、** 服务实现的查找、加载是通过JDK自带的java.util.ServiceLoader类的load静态方法实现的，该方法会查找全部本地以及引入的jar包中的META-INF/services目录下的和接口同名的文件中的具体服务实现类；

**2、** 随后会将服务实现类封装到一个ServiceLoader对象中，该对象是一个Iterable的实现，可以进行for-each循环迭代！此后，我们就可以对ServiceLoader进行迭代来选择适合自己需求的服务实现；

可以看到，Java的SPI模式是运用java的动态加载特性实现的，也就是反射模式创建实例。**注意，在迭代的时候next方法中会实例化具体的服务实现类**：

### 1.3 SPI的应用

**SPI机制最常见的案例就是新版本数据库驱动（JDBC4.0之后）的自动注册了。**

要使用JDBC连接，必须先加载数据库驱动到DriverManager中，因为DriverManager作为数据库驱动的发现与管理者。而在Java6引入SPI机制之后，在加载DriverManager类的时候，就会在DriverManager的静态块中采用SPI机制通过ServiceLoader.load方法来自动的发现和注册数据库驱动，所以对于符合SPI规范的新版本数据库驱动jar包，我们不需要通过Class.forName来手动注册驱动或者直接通过DriverManager.getConnection方法获取连接。

**以下是mysql8的驱动jar包中的文件，可以看到符合SPI的规则，那么DriverManager类在加载时将会在静态块中自动加载mysql驱动，因此如果我们使用DriverManager来操作数据库，那么我们根本不用手动通过Class.forName注册mysql驱动。**

同样的，ojdbc8的jar包中也使用了SPI机制！

**请注意，某些低版本数据驱动如果不符合SPI规范，比如某些低版本的驱动jar包中可能没有对应的文件，那么就仍然需要手动调用Class.forName注册驱动。**

注意，SPI和JDBC规范是两码事，SPI是一个通用的服务发现与注册机制，后一个则是SUN公司制定的一套通过Java语言访问、操作数据库的API规范接口，各个数据库厂商提供的具体实现的jar包则被称为数据库驱动！

SPI可以通过配置来实现服务的动态发现、替换功能，不需要改动基础框架的源码即可实现功能扩展，符合开闭原则，提供的实现类对基础代码也没有侵入性，有点类似于IOC的思想！在基础服务或者一些开源框架中，SPI机制使用得非常广泛，比如JDBC4的Driver、Dubbo、Druid、Kafka、Spring等等。

还有一些常见的SPI机制，比如Spring TransactionManager事务管理中具体的事务管理器服务实现，比如Spring Cache中具体的缓存服务实现，比如Spring类型转换中的Converter服务实现。比如apache的common-logging日志服务的具体服务实现。

## 2 Dubbo SPI的简介

SPI通过配置就可以来实现服务的动态发现、替换功能，非常适合类似插件扩展的场景，Dubbo框架肯定也是用上了的。

Dubbo的SPI机制贯穿了整个Dubbo架构和全部处理流程，几乎所有的Dubbo接口都支持Dubbo SPI机制。但是，Dubbo并没有采用JDK原生的SPI机制，而是在此基础上做了加强。

官方文档如下：[https://dubbo.apache.org/zh/overview/what/extensibility/#dubbo-%E6%89%A9%E5%B1%95%E7%9A%84%E7%89%B9%E6%80%A7](https://dubbo.apache.org/zh/overview/what/extensibility/#dubbo-%E6%89%A9%E5%B1%95%E7%9A%84%E7%89%B9%E6%80%A7)

**JDK的SPI机制有如下缺点：**

**1、** DK的SPI会一次性实例化扩展点所有实现，如果有扩展实现初始化很耗时，但如果没用上也加载，会很浪费资源；

**2、** JDK的SPI机制仅仅是扩展服务实现类没有IoC和AOP的支持，功能比较原始；

Dubbo的SPI机制有以下优点：

**1、****按需加载**Dubbo的扩展能力不会一次性实例化所有实现，而是用哪个扩展类则实例化哪个扩展类，减少资源浪费使用者指定一个需要加载的实现名，随后Dubbo的SPI会通过名字去文件里面找到对应的实现类全限定名然后加载并实例化即可，无需实例化全部实现类；

**2、****扩展点IoC和AOP的支持**DubboSPI在一个Dubbo扩展点实例化之后，返回之前，可以进行IoC和AOP增强：；

**1、** 通过调用injectExtension方法进行setter方法注入其他的依赖，这就是IoC；

**2、** 通过wapperclass和装饰设计模式对实例进行一层层的包装，实现了重复逻辑的抽取，这就是AOP；

**3、****自适应扩展**Dubbo的SPI增加了自适应扩展机制，根据请求时候的参数来动态选择对应的扩展，提高了Dubbo的扩展能力；

**4、****扩展排序**可以对扩展实现进行排序能够基于用户需求，指定扩展实现的执行顺序；

**Dubbo的SPI和Java的SPI对于配置文件的约定中，相同的地方在于配置文件的名字都是接口名，不同的地方则有两点：**

Dubbo的SPI分了三类目录：

**1、** META-INF/services/：该目录下的SPI配置文件是为了用来兼容JavaSPI；

**2、** META-INF/dubbo/：该目录存放用户自定义的SPI配置文件；

**3、** META-INF/dubbo/internal/：该目录存放Dubbo内部使用的SPI配置文件；

**2、** Dubbo的文件内容为key=value键值对的形式，即扩展名=具体的类全路径名，在使用时只需要配置扩展名，Dubbo即可找到应对的具体实现类并初始化；

Dubbo内部本身就提供了很多默认的SPI接口的实现，它们位于ETA-INF/dubbo/internal/目录下的SPI文件中：

## 3 Dubbo SPI的使用

Dubbo 为自己的SPI机制提供了专门的注解方便使用，下面是常用注解：

注解
作用

@SPI
表示当前接口时一个SPI接口，如果value不为空，那么该value的值表示当前接口的默认SPI实现。

@Adaptive
表示一个SPI接口的自适应扩展实现，可放在类与方法上，放置类上表示当前类就是该接口的自适应扩展实现；放在方法上，会生成动态代理的自适应扩展实现，然后通过动态代理调用相应方法。

一个扩展接口的多个实现类中只能有一个实现类有@Adaptive注解，否则抛出异常。

@Activate
表示一个扩展是否被激活(使用)，可以放在类定义和方法上，dubbo用它在SPI扩展类定义上，表示这个扩展实现激活条件和时机。

Dubbo的很多模块都支持使用SPI机制进行扩展：

怎么使用呢？其实我们不需要知道底层原理，只需要按照规则来就行了。

如果我们自己要扩展某个模块，那么我们首先需要自己写个用于扩展的项目。

在内部编写对应模块的接口的实现类以及实现代码，比如自己要扩展dubbo的负载均衡机制，那么我们的实现类需要实现org.apache.dubbo.rpc.cluster.LoadBalance接口。这些个顶级接口比如LoadBalance上，都一个@SPI注解，该注解表示这个接口需要通过SPI机制来提供实现类。

XxxLoadBalance：

```java
package com.xxx;
import org.apache.dubbo.rpc.cluster.LoadBalance;
import org.apache.dubbo.rpc.Invoker;
import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.RpcException; 
public class XxxLoadBalance implements LoadBalance {
    public <T> Invoker<T> select(List<Invoker<T>> invokers, Invocation invocation) throws RpcException {
        // ...
    }
}
```

在项目resources下的META-INF/dubbo/目录下新建org.apache.dubbo.rpc.cluster.LoadBalance文件，内容就是xxx=com.xxx.XxxLoadBalance。

整个扩展Maven项目结构：

```java
src
 |-main
    |-java
        |-com
            |-xxx
                |-XxxLoadBalance.java (实现LoadBalance接口)
    |-resources
        |-META-INF
            |-dubbo
                |-org.apache.dubbo.rpc.cluster.LoadBalance (纯文本文件，内容为：xxx=com.xxx.XxxLoadBalance)
```

使用起来也很简单，将扩展项目打成jar包，在dubbo consumer项目中引入该jar包，然后通过在标签中指定名字即可替换默认的负载均衡实现：

```java
<dubbo:protocol loadbalance="xxx" />
<!-- 缺省值设置，当<dubbo:protocol>没有配置loadbalance时，使用此配置 -->
<dubbo:provider loadbalance="xxx" />
```

@SPI注解中还提供了默认的服务实现名字，如果没有手动指定使用哪个实现，那么使用默认实现名。比如负载均衡LoadBalance接口的默认服务实现名就是random。

通过上述方式，可以轻松的替换掉大量的 dubbo 内部的组件，实现自定义扩展。

## 4 总结

**本次我们学习了JDK的SPI机制的概念和原理，并且介绍了Dubbo SPI机制的概念和原理，以及Dubbo SPI机制的优点，下文我们将介绍Dubbo SPI机制的源码，学习Dubbo到底是怎么实现SPI的！**
