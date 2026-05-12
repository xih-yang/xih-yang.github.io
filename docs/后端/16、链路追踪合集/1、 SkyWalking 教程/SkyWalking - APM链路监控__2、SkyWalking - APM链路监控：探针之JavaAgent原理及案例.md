# 2、SkyWalking - APM链路监控：探针之JavaAgent原理及案例
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/16.html
- 分类：链路追踪
- 分组：SkyWalking - APM链路监控
## 探针

在SkyWalking中，探针是指集成到目标系统中的代理或SDK库，负责收集遥测数据，包括跟踪和度量。基于目标系统技术堆栈，探针可以使用非常不同的方式来执行此操作。但最终它们是相同的，只是收集并重新格式化数据，然后发送到后端。

**对于Java语言程序，SkyWalking探针使用JavaAgent来实现。**

## 什么是JavaAgent

agent翻译过来就是经纪人、代理人，所谓JavaAgent就是JAVA代理，JDK 1.5 引入，位于java.lang.instrument包下。实现机制是在JVM启动前或启动后进行修改方法字节码。类似于AOP，但是完全无侵入性，比如，我已经完成了一个订单服务，但是我想在不修改订单服务代码的情况下，统计所有方法的执行时间，此时可以使用JavaAgent，添加执行启动参数即可。

## byte-buddy框架

[GitHub地址](https://github.com/raphw/byte-buddy)

**简介**：Byte Buddy是一个代码生成和操作库，用于在Java应用程序运行时创建和修改Java类，而无需编译器的帮助。除了Java类库附带的代码生成实用程序外，Byte Buddy还允许创建任意类，并且不限于实现用于创建运行时代理的接口。此外，Byte Buddy提供了一个方便的API，可以使用Java代理或在构建过程中手动更改类。

## 使用JavaAgent记录操作日志

**需求**： 在不修改订单服务代码的情况下，记录订单服务下所有接口请求的操作日志(只是为了演示javaagent怎么使用)

**1、** 创建一个普通的maven项目；

**2、** 添加bytebuddy框架及assembly插件，用于打包所需格式的jar包；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.pearl</groupId>
    <artifactId>pearl-agent</artifactId>
    <version>1.0.0</version>
    <dependencies>
        <dependency>
            <groupId>net.bytebuddy</groupId>
            <artifactId>byte-buddy</artifactId>
            <version>1.10.14</version>
        </dependency>
        <dependency>
            <groupId>net.bytebuddy</groupId>
            <artifactId>byte-buddy-agent</artifactId>
            <version>1.10.14</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-assembly-plugin</artifactId>
                <version>3.3.0</version>
                <executions>
                    <execution>
                        <id>make-assembly</id>
                        <goals>
                            <goal>single</goal>
                        </goals>
                        <phase>package</phase>
                        <configuration>
                            <descriptorRefs>
                                <descriptorRef>jar-with-dependencies</descriptorRef>
                            </descriptorRefs>
                            <archive>
                                <manifest>
                                    <addClasspath>true</addClasspath>
                                </manifest>
                                <manifestEntries>
                                    <Premain-Class>org.pearl.agent.AgentMethod</Premain-Class>
                                    <Agent-Class>org.pearl.agent.AgentMethod</Agent-Class>
                                    <Can-Redefine-Classes>true</Can-Redefine-Classes>
                                    <Can-Retransform-Classes>true</Can-Retransform-Classes>
                                </manifestEntries>
                            </archive>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

**1、** 添加AgentMethod及RequestLogInterceptor类；

```java
package org.pearl.agent;
import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.dynamic.DynamicType;
import net.bytebuddy.implementation.MethodDelegation;
import net.bytebuddy.matcher.ElementMatchers;
import net.bytebuddy.utility.JavaModule;
import java.beans.MethodDescriptor;
import java.lang.instrument.Instrumentation;
/**
 * Created by TD on 2020/9/13
 */
public class AgentMethod {
    public static void premain(String args, Instrumentation inst){
        System.err.println("premain start... ");
        System.err.println("args: "+args);
        AgentBuilder.Transformer transformer=new AgentBuilder.Transformer() {
            @Override
            public DynamicType.Builder<?> transform(DynamicType.Builder<?> builder, TypeDescription typeDescription, ClassLoader classLoader, JavaModule javaModule) {
                // method对所有方法进行拦截
                // intercept添加拦截器
                return builder.method(ElementMatchers.<MethodDescription>any())
                        .intercept(MethodDelegation.to(RequestLogInterceptor.class));
            }
        };
        // 指定拦截org.pearl.order下
        new AgentBuilder.Default().type(ElementMatchers.<TypeDescription>nameStartsWith("org.pearl.order"))
                                .transform(transformer).installOn(inst);
    }
}
```

```java
package org.pearl.agent;
import net.bytebuddy.implementation.bind.annotation.Origin;
import net.bytebuddy.implementation.bind.annotation.RuntimeType;
import net.bytebuddy.implementation.bind.annotation.SuperCall;
import java.lang.reflect.Method;
import java.util.concurrent.Callable;
/**
 * Created by TD on 2020/9/14
 */
public class RequestLogInterceptor {
    @RuntimeType
    public static Object interceptor(@Origin Method method, @SuperCall  Callable<?> callable) throws Exception {
        System.err.println("执行方法："+method.getName());
        // 其他。。。根据实际获取
        return callable.call();
    }
}
```

**1、** package打包；

**2、** 对应项目添加JVM启动参数，=test为传递一个参数值test；

```java
-javaagent:E:\pearla\Pearl\agent_demo\target\agent_demo-1.0-SNAPSHOT-jar-with-dependencies.jar=test
```

**1、** 执行测试类，完成无代码侵入代理操作；
