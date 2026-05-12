# 02、Dubbo 2.7 源码解析 - 入门（第一个 Dubbo 程序（直连式）、Zookeeper 注册中心、将 Dubbo 应用到 web 工程、Dubbo 管理控制台
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/2.html
- 分类：J2EE框架
- 分组：教程目录
## dubbo入门

## 1. 第一个 Dubbo 程序（直连式）

### 1.1 创建业务接口工程 00-api

业务接口名即服务名称。无论是服务提供者向服务注册中心注册服务，还是服务消费者从注册中心索取服务，都是通过接口名称进行注册与查找的。即，提供者与消费者都依赖于业务接口。所以，一般情况下，会将业务接口专门定义为一个工程，让提供者与消费者依赖。

#### (1) 创建 Maven 的 Java 工程

#### (2) 创建业务接口

```java
/**
 * 业务接口
 */
public interface SomeService {
    String hello(String name);
}
```

#### (3) 修改 pom 文件

这个pom 中无需任何依赖。

```java
<modelVersion>4.0.0</modelVersion>
<groupId>com.abc</groupId>
<artifactId>00-api</artifactId>
<version>1.0-SNAPSHOT</version>
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
</properties>
```

### 1.2 创建提供者(自建 Spring 容器)01-provider

#### (1) 创建工程

创建一个 Maven 的 Java 工程，并命名为 01-provider。

#### (2) 在 pom 中导入依赖

主要包含三类依赖：

- 业务接口依赖
- Dubbo 依赖(2.7.0 版本)
- Spring 依赖(4.3.16 版本)

```java
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
    <!-- 自定义版本号 -->
    <spring-version>4.3.16.RELEASE</spring-version>
</properties>
<dependencies>
    <!--业务接口工程依赖-->
    <dependency>
        <groupId>com.abc</groupId>
        <artifactId>00-api</artifactId>
        <version>1.0-SNAPSHOT</version>
    </dependency>
    <!-- dubbo依赖 -->
    <dependency>
        <groupId>org.apache.dubbo</groupId>
        <artifactId>dubbo</artifactId>
        <version>2.7.0</version>
    </dependency>
    <!-- Spring依赖 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-beans</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-expression</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-aop</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-aspects</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-tx</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-jdbc</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <!-- commons-logging依赖 -->
    <dependency>
        <groupId>commons-logging</groupId>
        <artifactId>commons-logging</artifactId>
        <version>1.2</version>
    </dependency>
</dependencies>
```

#### (3) 定义接口实现类

```java
public class SomeServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println(name + "，我是提供者");
        return "Hello Dubbo World! " + name;
    }
}
```

#### (4) 定义 spring-provider 配置文件

src/main/resources 下定义 spring-provider.xml 配置文件。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <!--指定当前工程在管控平台中的名称-->
    <dubbo:application name="01-provider"/>
    <!--指定注册中心：不使用注册中心-->
    <dubbo:registry address="N/A"/>
    <!--注册业务接口实现类，它是真正的服务提供者-->
    <bean id="someService" class="com.abc.provider.SomeServiceImpl"/>
    <!--服务暴露-->
    <dubbo:service interface="com.abc.service.SomeService" ref="someService"/>
</beans>
```

#### (5) 定义测试类

在/src/test/java 中创建测试类 RunProvider。

```java
public class ProviderRun {
    public static void main(String[] args) throws IOException {
        // 创建Spring容器
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-provider.xml");
        // 启动Spring容器
        ((ClassPathXmlApplicationContext) ac).start();
        // 使主线程阻塞
        System.in.read();
    }
}
```

#### (6) 启动测试

### 1.3 创建提供者(Main 启动) 01-provider2

使用自建 Spring 容器方式是比较浪费资源的。容器的作用仅仅就是创建一个单例的提供者对象，其本身并不需要 Tomcat 或 JBoss 等 Web 容器的功能。如果硬要用 Web 容器去加载服务提供方，就增加了代码的复杂性，也浪费了资源。

Dubbo 提供了一个 Main.main()方法可以直接创建并启动 Provider，其底层仅仅是加载了一个简单的用于暴露服务的 Spring 容器。`该方式要求 Spring 配置文件必须要放到类路径下的 META-INF/spring 目录中`，Spring 配置文件名称无所谓。

#### (1) 工程创建

复制01-provider 工程，并修改其工程名 01-provider2。

#### (2) 创建目录并移动配置文件

在resources 目录中创建 META-INF/spring 目录，并将 spring-provider.xml 配置文件拖入其中。

#### (3) 修改启动类

```java
import org.apache.dubbo.container.Main;
import java.io.IOException;
public class ProviderRun {
    public static void main(String[] args) throws IOException {
        Main.main(args);
    }
}
```

#### (4) 启动测试

### 1.4 创建消费者 01-consumer

#### (1) 创建工程

创建一个 Maven 的 Java 工程，并命名为 01-consumer。

#### (2) 在 pom 中导入依赖

该工程的依赖与 Provider 中的完全相同，直接复制来就可以。

#### (3) 定义 spring-consumer 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <!--指定当前工程在管控平台中的名称-->
    <dubbo:application name="01-consumer"/>
    <!--指定注册中心：不使用注册中心-->
    <dubbo:registry address="N/A"/>
    <!--直连式连接提供者，通过url属性配置的方式就是直连的方式，不用注册中心 -->
    <dubbo:reference id="someService"
                     interface="com.abc.service.SomeService"
                     url="dubbo://localhost:20880"/>
</beans>
```

#### (4) 定义消费者类

```java
public class ConsumerRun {
    public static void main(String[] args) {
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-consumer.xml");
        SomeService service = (SomeService) ac.getBean("someService");
        String hello = service.hello("China");
        System.out.println(hello);
    }
}
```

#### (5) 演示

Provider：

Consumer：

## 2. Zookeeper 注册中心

在生产环境下使用最多的注册中心为 Zookeeper，当然，Redis 也可以做注册中心。下面就来学习 Zookeeper 作为注册中心的用法。

### 2.1 创建提供者 02-provider-zk

#### (1) 导入依赖

复制前面的提供者工程 01-provider，并更名为 02-provider-zk。修改 pom 文件，并在其中导入 Zookeeper 客户端依赖 curator。

```java
<!-- zk客户端依赖：curator -->
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>2.13.0</version>
</dependency>
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>2.13.0</version>
</dependency>
```

#### (2) 修改 spring 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://dubbo.apache.org/schema/dubbo
       http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="02-provider-zk"/>
    <!--声明注册中心：单机版zk-->
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <!-- 这种写法也可以 -->
    <!--<dubbo:registry protocol="zookeeper" address="zkOS:2181"/>-->
    <!--声明注册中心：zk群集-->
    <!--<dubbo:registry address="zookeeper://zkOS1:2181?backup=zkOS2:2181,zkOS3:2181,zkOS4:2181"/>-->
    <!--<dubbo:registry protocol="zookeeper" address="zkOS1:2181,zkOS2:2181,zkOS3:2181,zkOS4:2181"/>-->
    <bean id="someService" class="com.abc.provider.SomeServiceImpl"/>
    <dubbo:service interface="com.abc.service.SomeService" ref="someService" />
</beans>
```

> 注意：别忘了要启动了一个ZK服务器
>
>
>
> 我启动的ZK地址绑定了域名，所以address中可以直接使用域名

#### (3) 启动测试

### 2.2 创建消费者 02-consumer-zk

#### (1) 导入依赖

复制前面的消费者工程 01-consumer，并更名为 02-consumer-zk。修改 pom 文件，并在其中导入 Zookeeper 客户端 curator 依赖。

```java
<!-- zk客户端依赖：curator -->
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>2.13.0</version>
</dependency>
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>2.13.0</version>
</dependency>
```

#### (2) 修改 Spring 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="02-consumer-zk"/>
    <!--指定服务注册中心：zk单机-->
    <dubbo:registry address="zookeeper://zkOS:2181" />
    <!--<dubbo:registry protocol="zookeeper" address="zkOS:2181"/>-->
    <!--指定服务注册中心：zk集群-->
    <!--<dubbo:registry address="zookeeper://zkOS1:2181?backup=zkOS2:2181,zkOS3:2181,zkOS4:2181"/>-->
    <!--<dubbo:registry protocol="zookeeper" address="zkOS1:2181,zkOS2:2181,zkOS3:2181,zkOS4:2181"/>-->
    <dubbo:reference id="someService" interface="com.abc.service.SomeService"/>
</beans>
```

#### (3) 启动测试

consumer：

provider：

### 2.3 添加日志文件

通过前面的运行可知，无论是提供者还是消费者，控制台给出的提示信息都太少，若想看到更多的信息，可以在提供者与消费者工程的类路径 src/main/resources 下添加日志文件。可以添加 log4j.xml，即使用 log4j2 日志技术；也可以添加 log4j.properties，即使用 log4j 日志技术。我们这里添加 log4j.properties 文件。

```java
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.Target=System.out
log4j.appender.console.layout=org.apache.log4j.PatternLayout
log4j.appender.console.layout.ConversionPattern=[%-5p] %m%n
log4j.rootLogger=info,console
```

#### (1) 提供者添加日志文件

在提供者的 src/main/resources 目录中添加 log4j.properties 文件。运行后可以看到如下的日志输出。其中最为重要的是 provider://xxxxx，这里显示的就是当前工程所提供的能够被订阅的服务描述，即服务元数据信息。另外，我们还可以看到当前应用与 qos-server（Quality of Service 服务器，即 Dubbo 的管控平台）进行通信的端口号为 22222。

#### (2) 消费者添加日志文件

在消费者的 src/main/resources 目录中添加 log4j.properties 文件。运行后在控制台的日志输出中可以看到报错。其报错内容原因是，消费者连接 qos-server 的端口号被占用了。其与 qos-server 通信的端口号默认也为 22222，已经被提供者给占用了。当然，原因主要是由于消费者与提供者都在同一主机，若分别存在于不同的主机也不会报错。

所以解决方案就是为消费者修改与 qos-server 通信的端口号。有两种修改方式。可以在src/main/resources 中新建一个 dubbo.properties 文件，文件内容仅需如下一行：

也可以直接在 spring-consumer.xml 文件中修改。

```java
<dubbo:application name="02-consumer-zk">
    <dubbo:parameter key="qos.port" value="33333"/>
</dubbo:application>
```

修改端口号后再运行，就没有了报错。

### 2.4 看下ZK中有哪些数据

Dubbo中的元数据信息都是URL的形式。

## 3. 将 Dubbo 应用到 web 工程

前面所有提供者与消费者均是 Java 工程，而在生产环境中，它们都应是 web 工程，Dubbo如何应用于 Web 工程中呢？

### 3.1 创建提供者 03-provider-web

#### (1) 创建工程

创建Maven 的 web 工程，然后将 02-provider-zk 中的 Service 实现类及 spring-provider配置文件复制到当前工程中。

#### (2) 导入依赖

这里使用的 Spring 的版本为 4.3.16。

需要的依赖有：

- dubbo2.7.0 版本依赖
- zk 客户端 curator 依赖
- spring 相关依赖
- spring 需要的 commons-logging 依赖
- 自定义 00-api 依赖

```java
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
    <!-- 自定义版本号 -->
    <spring-version>4.3.16.RELEASE</spring-version>
</properties>
<dependencies>
    <!-- zk客户端依赖：curator -->
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-recipes</artifactId>
        <version>2.13.0</version>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-framework</artifactId>
        <version>2.13.0</version>
    </dependency>
    <!-- dubbo依赖 -->
    <dependency>
        <groupId>org.apache.dubbo</groupId>
        <artifactId>dubbo</artifactId>
        <version>2.7.0</version>
    </dependency>
    <!-- Spring依赖 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-beans</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-expression</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-aop</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-aspects</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-tx</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-jdbc</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-web</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-webmvc</artifactId>
        <version>${spring-version}</version>
    </dependency>
    <!-- commons-logging依赖 -->
    <dependency>
        <groupId>commons-logging</groupId>
        <artifactId>commons-logging</artifactId>
        <version>1.2</version>
    </dependency>
    <!--业务接口工程依赖-->
    <dependency>
        <groupId>com.abc</groupId>
        <artifactId>00-api</artifactId>
        <version>1.0-SNAPSHOT</version>
    </dependency>
</dependencies>
```

#### (3) 定义 web.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">
    <!--注册Spring配置文件-->
    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath:spring-*.xml</param-value>
    </context-param>
    <!--注册ServletContext监听器-->
    <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
    </listener>
</web-app>
```

#### (4) 修改 spring-provider.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="03-provider-web"/>
    <!--指定服务注册中心：zk单机-->
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <!--注册服务执行对象-->
    <bean id="someService" class="com.abc.provider.SomeServiceImpl"/>
    <!--服务暴露-->
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="someService" />
</beans>
```

### 3.2 创建消费者 03-consumer-web

#### (1) 创建工程

创建Maven 的 web 工程，然后将 02-consumer-zk 中的 spring-provider 配置文件复制到当前工程中。

#### (2) 导入依赖

与提供者工程中的依赖相同。

消费者这边有页面，多加servlet 与 jsp 依赖。

```java
<!-- Servlet依赖 -->
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>3.1.0</version>
    <scope>provided</scope>
</dependency>
<!-- JSP依赖 -->
<dependency>
    <groupId>javax.servlet.jsp</groupId>
    <artifactId>javax.servlet.jsp-api</artifactId>
    <version>2.2.1</version>
    <scope>provided</scope>
</dependency>
```

#### (3) 定义处理器

```java
@Controller
public class SomeController {
    @Autowired
    private SomeService service;
    @RequestMapping("/some.do")
    public String someHandle() {
        String result = service.hello("China");
        System.out.println("消费者端接收到 = " +  result);
        return "/welcome.jsp";
    }
}
```

#### (4) 定义欢迎页面

在src/main/webapp 目录下定义欢迎页面。

```java
<html>
<body>
<h2>welcome you!</h2>
</body>
</html>
```

#### (5) 定义 web.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">
    <!--对于2.6.4版本（dubbo），其Spring配置文件必须指定从<context-param>中加载-->
    <!--<context-param>-->
        <!--<param-name>contextConfigLocation</param-name>-->
        <!--<param-value>classpath:spring-*.xml</param-value>-->
    <!--</context-param>-->
    <!--字符编码过滤器-->
    <filter>
        <filter-name>CharacterEncodingFilter</filter-name>
        <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
        <init-param>
            <param-name>encoding</param-name>
            <param-value>utf-8</param-value>
        </init-param>
        <init-param>
            <param-name>forceEncoding</param-name>
            <param-value>true</param-value>
        </init-param>
    </filter>
    <filter-mapping>
        <filter-name>CharacterEncodingFilter</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>
    <!--注册中央调度器-->
    <servlet>
        <servlet-name>springmvc</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>classpath:spring-*.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>springmvc</servlet-name>
        <!--不能写/*，不建议写/（静态资源不能访问），建议扩展名方式-->
        <url-pattern>*.do</url-pattern>
    </servlet-mapping>
</web-app>
```

#### (6) 修改 spring-consumer.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xmlns:mvc="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd">
    <dubbo:application name="03-consumer-web"/>
    <!--指定服务注册中心：zk单机-->
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <!--订阅服务-->
    <dubbo:reference id="someService"
                     interface="com.abc.service.SomeService"/>
    <!--注册处理器-->
    <mvc:component-scan base-package="com.abc.controller"/>
</beans>
```

### 3.3 部署运行

为了方便部署测试，这里将提供者与消费者部署到一个 Tomcat 中。

#### (1) 设置 Tomcat

- A、修改 Tomcat 默认端口号

由于 Dubbo 管控台端口号为 8080，所以这里将 Tomcat 默认端口号修改为 8081。
- B、 两个应用两个 context

#### (2) 演示

## 4. Dubbo 管理控制台

2019 年初，官方发布了 Dubbo 管理控制台 0.1 版本。结构上采取了前后端分离的方式，前端使用 Vue 和 Vuetify 分别作为 Javascript 框架和 UI 框架，后端采用 Spring Boot 框架。

### 4.1 下载

Dubbo 管理控制台的下载地址为：[https://github.com/apache/dubbo-admin](https://github.com/apache/dubbo-admin)

下载完毕后会得到一个 zip 文件。

### 4.2 配置

这是一个 Spring Boot 工程，在下载的 zip 文件的解压目录的如下目录中修改配置文件。主要就是配置注册中心、配置中心，与元数据中心的地址。当然，这是一个 springboot 工程，默认端口号为 8080，若要修改端口号，则在配置文件中增加形如 server.port=8888 的配置。

`dubbo-admin-develop\dubbo-admin-server\src\main\resources\application.properties`

这个配置文件，针对不同版本 Dubbo 应用的管控，有不同的配置方式。

#### (1) 管控 dubbo2.6 版本

以下配置方式对于 2.6 与 2.7 版本的 Dubbo 应用都可以进行管控。但无法查看应用的元数据信息。

#### (2) 管控 dubbo2.7 版本

以下配置方式对于 2.7 版本的 Dubbo 应用可正常进行管控。但会导致 2.6 版本应用无法正常启动。原因是该方式的配置会在 zk 中创建一个元数据中心，然后在 2.6 版本应用启动时会查找下 zk 的元数据中心工厂扩展类，会找不到，然后无法启动。

- A、修改 application.properties
- B、 修改 zk 中的配置

在/dubbo 节点下再手工创建出 config/dubbo/dubbo.properties 子节点，并在dubbo.properties 节点中如加如下的节点内容。添加完成后，点击上面的保存按钮保存。

### 4.3 打包

在命令行窗口中进入到解压目录根目录，执行打包命令，跳过 test 阶段。

当看到以下提示时表示打包成功。

打包结束后，进入到解压目录下的 dubbo-admin-distribution 目录下的 target 目录。该目录下有个 dubbo-admin-0.1.jar 文件。该 Jar 包文件即为 Dubbo 管理控制台的运行文件，可以将其放到任意目录下运行。

### 4.4 运行

#### (1) 启动 zk

#### (2) 启动管控台

将dubbo-admin-0.1.jar 文件存放到任意目录下，例如 D 盘根目录下，直接运行。

#### (3) 访问

在浏览器地址栏中输入 [http://localhost:8080](http://localhost:8080) ，即可看到 Dubbo 管理控制台界面。

点击详情：
