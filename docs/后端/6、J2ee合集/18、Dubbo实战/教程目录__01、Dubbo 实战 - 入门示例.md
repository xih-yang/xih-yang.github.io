# 01、Dubbo 实战 - 入门示例
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/1.html
- 分类：J2EE框架
- 分组：教程目录
dubbo是一个分布式服务框架，致力于提供高性能和透明化的RPC远程服务调用方案，以及SOA服务治理方案。简单的说，dubbo就是个服务框架，如果没有分布式的需求，其实是不需要用的，只有在分布式的时候，才有dubbo这样的分布式服务框架的需求。

下面将介绍如何搭建一个简单的示例程序（用maven构建）。

众所周知，RPC调用涉及到消费者、提供者和接口，所以需要在maven工程warehouse-component-parent里面新建3个模块，分别是warehouse-component-dubbo-facade（接口）、warehouse-component-dubbo-provider（提供者）和warehouse-component-dubbo-consumer（消费者）。对应的pom文件如下。

warehouse-component-parent：

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.wu</groupId>
    <artifactId>warehouse-component-parent</artifactId>
    <version>0.0.1</version>
    <packaging>pom</packaging>
    <name>component warehouse parent</name>
    <modules>
        <module>warehouse-component-dubbo-facade</module>
        <module>warehouse-component-dubbo-provider</module>
        <module>warehouse-component-dubbo-consumer</module>
    </modules>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>4.12</junit.version>
        <spring.version>4.3.8.RELEASE</spring.version>
        <log4j.over.slf4j.version>1.7.25</log4j.over.slf4j.version>
        <jcl.over.slf4j.version>1.7.25</jcl.over.slf4j.version>
        <logback.version>1.2.3</logback.version>
        <dubbo.version>2.5.3</dubbo.version>
        <zkclient.version>0.1</zkclient.version>
    </properties>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>junit</groupId>
                <artifactId>junit</artifactId>
                <version>${junit.version}</version>
                <scope>test</scope>
            </dependency>
            <!-- spring -->
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-context</artifactId>
                <version>${spring.version}</version>
                <exclusions>
                    <exclusion>
                        <groupId>commons-logging</groupId>
                        <artifactId>commons-logging</artifactId>
                    </exclusion>
                </exclusions>
            </dependency>
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-test</artifactId>
                <version>${spring.version}</version>
            </dependency>
            <!-- logback -->
            <dependency>
                <groupId>org.slf4j</groupId>
                <artifactId>jcl-over-slf4j</artifactId>
                <version>${jcl.over.slf4j.version}</version>
            </dependency>
            <dependency>
                <groupId>org.slf4j</groupId>
                <artifactId>log4j-over-slf4j</artifactId>
                <version>${log4j.over.slf4j.version}</version>
            </dependency>
            <dependency>
                <groupId>ch.qos.logback</groupId>
                <artifactId>logback-classic</artifactId>
                <version>${logback.version}</version>
            </dependency>
            <!-- dubbo -->
            <dependency>
                <groupId>com.alibaba</groupId>
                <artifactId>dubbo</artifactId>
                <version>${dubbo.version}</version>
                <exclusions>
                    <exclusion>
                        <groupId>log4j</groupId>
                        <artifactId>log4j</artifactId>
                    </exclusion>
                    <exclusion>
                        <groupId>org.springframework</groupId>
                        <artifactId>spring</artifactId>
                    </exclusion>
                </exclusions>
            </dependency>
            <!-- zkclient -->
            <dependency>
                <groupId>com.github.sgroschupf</groupId>
                <artifactId>zkclient</artifactId>
                <version>${zkclient.version}</version>
                <exclusions>
                    <exclusion>
                        <groupId>log4j</groupId>
                        <artifactId>log4j</artifactId>
                    </exclusion>
                </exclusions>
            </dependency>
            <dependency>
                <groupId>org.wu</groupId>
                <artifactId>warehouse-component-dubbo-facade</artifactId>
                <version>${project.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

warehouse-component-dubbo-provider：

```java
<?xml version="1.0"?>
<project
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"
    xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.wu</groupId>
        <artifactId>warehouse-component-parent</artifactId>
        <version>0.0.1</version>
    </parent>
    <artifactId>warehouse-component-dubbo-provider</artifactId>
    <name>warehouse-component-dubbo-provider</name>
    <url>http://maven.apache.org</url>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- spring -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
        </dependency>
        <!-- dubbo -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
        </dependency>
        <!-- zkclient -->
        <dependency>
            <groupId>com.github.sgroschupf</groupId>
            <artifactId>zkclient</artifactId>
        </dependency>
        <!-- logback -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>jcl-over-slf4j</artifactId>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>log4j-over-slf4j</artifactId>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
        </dependency>
        <dependency>
            <groupId>org.wu</groupId>
            <artifactId>warehouse-component-dubbo-facade</artifactId>
        </dependency>
    </dependencies>
</project>
```

warehouse-component-dubbo-consumer：

```java
<?xml version="1.0"?>
<project
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"
    xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.wu</groupId>
        <artifactId>warehouse-component-parent</artifactId>
        <version>0.0.1</version>
    </parent>
    <artifactId>warehouse-component-dubbo-consumer</artifactId>
    <name>warehouse-component-dubbo-consumer</name>
    <url>http://maven.apache.org</url>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- spring -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-test</artifactId>
        </dependency>
        <!-- dubbo -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
        </dependency>
        <!-- zkclient -->
        <dependency>
            <groupId>com.github.sgroschupf</groupId>
            <artifactId>zkclient</artifactId>
        </dependency>
        <!-- logback -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>jcl-over-slf4j</artifactId>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>log4j-over-slf4j</artifactId>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
        </dependency>
        <dependency>
            <groupId>org.wu</groupId>
            <artifactId>warehouse-component-dubbo-facade</artifactId>
        </dependency>
    </dependencies>
</project>
```

工程使用的日志框架为logback，配置文件如下：

```java
<?xml version="1.0" encoding="UTF-8" ?>
<configuration scan="true" scanPeriod="3 seconds">
    <statusListener class="ch.qos.logback.core.status.OnConsoleStatusListener" />
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <layout class="ch.qos.logback.classic.PatternLayout">
        <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%-5level] [%logger:%L] %msg%n</pattern>
        </layout>
    </appender>
    <appender name="ALL_LOG_FILE"
        class="ch.qos.logback.core.rolling.RollingFileAppender">
        <File>warehouse_component.log</File>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <FileNamePattern>
                warehouse_component.%d{yyyy-MM-dd}.log
            </FileNamePattern>
        </rollingPolicy>
        <layout class="ch.qos.logback.classic.PatternLayout">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%-5level] [%logger:%L] %msg%n</pattern>
        </layout>
    </appender>
    <appender name="ERROR_LOG_FILE"
        class="ch.qos.logback.core.rolling.RollingFileAppender">
        <File>warehouse_component_error.log</File>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <FileNamePattern>
                warehouse_component_error.%d{yyyy-MM-dd}.log
            </FileNamePattern>
        </rollingPolicy>
        <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
            <level>ERROR</level>
        </filter>
        <layout class="ch.qos.logback.classic.PatternLayout">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%-5level] [%logger:%L] %msg%n</pattern>
        </layout>
    </appender>
    <root>
        <level value="INFO" />
        <appender-ref ref="STDOUT" />
        <appender-ref ref="ALL_LOG_FILE" />
        <appender-ref ref="ERROR_LOG_FILE" />
    </root>
</configuration>
```

上述配置信息都设置好后，就可以进行dubbo程序的开发了。首先，定义dubbo接口，在warehouse-component-dubbo-facade模块中定义一个接口：

```java
package org.warehouse.component.dubbo.facade;
public interface DemoFacade {
    /**
     * dubbo接口
     */
    String sayHello(String name);
}
```

接口定义好后，dubbo服务提供者warehouse-component-dubbo-provider需要实现该接口，进行相关的业务逻辑处理。

```java
package org.warehouse.component.dubbo.provider;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.springframework.stereotype.Service;
import org.warehouse.component.dubbo.facade.DemoFacade;
import com.alibaba.dubbo.rpc.RpcContext;
@Service("demoFacadeImpl")
public class DemoFacadeImpl implements DemoFacade {
    @Override
    public String sayHello(String name) {
        System.out.println("[" + new SimpleDateFormat("HH:mm:ss").format(new Date()) + "] Hello " + name
                + ", request from consumer: " + RpcContext.getContext().getRemoteAddress());
        return "Hello " + name + ", response form provider: " + RpcContext.getContext().getLocalAddress();
    }
}
```

并通过spring配置文件（dubbo-provider.xml）暴露该服务：

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:context="http://www.springframework.org/schema/context"
    xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans-4.3.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context-4.3.xsd
        http://code.alibabatech.com/schema/dubbo 
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <!-- 自动检测并装配bean -->
    <context:component-scan base-package="org.warehouse.component.dubbo.provider" />
    <!-- 提供方应用信息，用于计算依赖关系 -->
    <dubbo:application name="provider-of-hello-world-app" />
    <!-- 使用zookeeper注册中心暴露服务地址 -->
    <dubbo:registry protocol="zookeeper" address="192.168.1.103:2181" />
    <!-- 用dubbo协议在20880端口暴露服务 -->
    <dubbo:protocol name="dubbo" port="20880" />
    <!-- 声明需要暴露的服务接口 -->
    <dubbo:service interface="org.warehouse.component.dubbo.facade.DemoFacade" ref="demoFacadeImpl" />
</beans>
```

现在可以通过加载spring配置启动服务提供者了（运行以下代码）：

```java
package org.warehouse.component.dubbo.provider;
import java.io.IOException;
import org.springframework.context.support.ClassPathXmlApplicationContext;
public class Provider {
    public static void main(String[] args) throws IOException {
        @SuppressWarnings("resource")
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("dubbo-provider.xml");
        context.start();
        System.in.read();
    }
}
```

服务提供者启动之后，服务消费者通过spring配置（dubbo-consumer.xml）引用远程服务：

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xmlns:context="http://www.springframework.org/schema/context"
    xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans-4.3.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context-4.3.xsd
        http://code.alibabatech.com/schema/dubbo 
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <!-- 自动检测并装配bean -->
    <context:component-scan base-package="org.warehouse.component.dubbo.consumer" />
    <!-- 提供方应用信息，用于计算依赖关系 -->
    <dubbo:application name="consumer-of-hello-world-app" />
    <!-- 使用zookeeper注册中心暴露服务地址 -->
    <dubbo:registry protocol="zookeeper" address="192.168.1.103:2181" />
    <dubbo:reference id="demoFacade" interface="org.warehouse.component.dubbo.facade.DemoFacade" />
</beans>
```

加载Spring配置，并调用远程服务（这里是通过spring unit test的方式）：

```java
package org.warehouse.component.dubbo.consumer;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.warehouse.component.dubbo.facade.DemoFacade;
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:dubbo-consumer.xml"})
public class ConsumerTest {
    @Autowired
    ApplicationContext context;
    @Test
    public void testDemoFacade() {
        DemoFacade facade = (DemoFacade) context.getBean("demoFacade");
        String hello = facade.sayHello("world");
        System.out.println(hello);
    }
}
```

服务的调用就像是方法本地调用一样简单，这其实是dubbo将底层通信封装好了，我们只需要关注业务逻辑实现。

在spring文件中配置dubbo服务时，eclipse会出现无法找到dubbo.xsd文件的问题。在本工程的解决办法是将dubbo-2.5.3.jar包中的dubbo.xsd文件（META-INF文件夹中）复制到文件系统中，然后

windows -> Preferrences -> XML -> XML Catalog

Add-> Catalog Entry -> File System 选择刚刚下载的文件路径

修改key值和配置文件的http://code.alibabatech.com/schema/dubbo/dubbo.xsd 相同

保存。。在xml文件右键validate ok解决了。

最后还有一点需要说明：dubbo和zkclient需要排除对log4j的依赖后才可以使用logback来记录详细日志，具体排除方式已经在warehouse-component-parent的pom文件中展示。
