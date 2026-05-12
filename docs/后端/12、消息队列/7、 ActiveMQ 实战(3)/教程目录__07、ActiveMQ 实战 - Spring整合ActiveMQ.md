# 07、ActiveMQ 实战 - Spring整合ActiveMQ
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/7.html
- 分类：消息队列
- 分组：教程目录
### 环境准备

- 启动的ActiveMQ服务
- JDK1.8+
- IDEA或Eclipse
- Maven环境
- Spring环境依赖

核心依赖

```xml
<!--  activemq  所需要的jar 包-->
<dependency>
  <groupId>org.apache.activemq</groupId>
  <artifactId>activemq-all</artifactId>
  <version>5.15.9</version>
</dependency>
<!-- activemq连接池 -->
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-pool</artifactId>
    <version>5.15.10</version>
</dependency>
<!-- spring支持jms的包 -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-jms</artifactId>
    <version>5.2.1.RELEASE</version>
</dependency>
```

全部pom依赖，参考

```xml
<dependencies>
   <!-- activemq核心依赖包  -->
    <dependency>
        <groupId>org.apache.activemq</groupId>
        <artifactId>activemq-all</artifactId>
        <version>5.10.0</version>
    </dependency>
    <!--  嵌入式activemq的broker所需要的依赖包   -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.10.1</version>
    </dependency>
    <!-- activemq连接池 -->
    <dependency>
        <groupId>org.apache.activemq</groupId>
        <artifactId>activemq-pool</artifactId>
        <version>5.15.10</version>
    </dependency>
    <!-- spring支持jms的包 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-jms</artifactId>
        <version>5.2.1.RELEASE</version>
    </dependency>
    <!--spring相关依赖包-->
    <dependency>
        <groupId>org.apache.xbean</groupId>
        <artifactId>xbean-spring</artifactId>
        <version>4.15</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-aop</artifactId>
        <version>5.2.1.RELEASE</version>
    </dependency>
    <!-- Spring核心依赖 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
        <version>4.3.23.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>4.3.23.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-aop</artifactId>
        <version>4.3.23.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-orm</artifactId>
        <version>4.3.23.RELEASE</version>
    </dependency>
</dependencies>
```

### 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context https://www.springframework.org/schema/context/spring-context.xsd">
    <!--开启包的自动扫描-->
    <context:component-scan base-package="com.huazai.activemq.spring"></context:component-scan>
    <!--配置连接对象-->
    <bean id="connectionFactory" class="org.apache.activemq.pool.PooledConnectionFactory" destroy-method="stop">
        <property name="connectionFactory">
            <!--真正可以生产Connection的ConnectionFactory,由对应的JMS服务商提供-->
            <bean class="org.apache.activemq.spring.ActiveMQConnectionFactory">
                <property name="brokerURL" value="tcp://7.98.163.118:61616"/>
            </bean>
        </property>
        <!--配置最大连接数-->
        <property name="maxConnections" value="100"/>
    </bean>
    <!--这个是队列目的地,点对点的Queue-->
    <bean id="destinationQueue" class="org.apache.activemq.command.ActiveMQQueue">
        <!--通过构造注入队列名称-->
        <constructor-arg index="0" value="spring-active-queue"/>
    </bean>
    <!--这个是队列目的地,发布订阅的主题Topic-->
    <bean id="destinationTopic" class="org.apache.activemq.command.ActiveMQTopic">
        <!--通过构造器注入主题名称-->
        <constructor-arg index="0" value="spring-active-topic"/>
    </bean>
    <!--Spring提供的JMS工具类,他可以进行消息发送,接收等，类似JDBCTemplate-->
    <bean id="jmsTemplate" class="org.springframework.jms.core.JmsTemplate">
        <!--传入连接工厂-->
        <property name="connectionFactory" ref="connectionFactory"/>
        <!--传入默认目的地，可以是queue，也可以是topic-->
        <property name="defaultDestination" ref="destinationTopic"/>
        <!--消息自动转换器-->
        <property name="messageConverter">
            <bean class="org.springframework.jms.support.converter.SimpleMessageConverter"/>
        </property>
    </bean>
</beans>
```

### 生产者Queue

队列生产者代码：

```java
package com.huazai.activemq.spring.queue;
import org.apache.xbean.spring.context.ClassPathXmlApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
import java.util.Scanner;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/01/11 23:39
 */
@Service
public class SpringMQProducer {
    static final Scanner input = new Scanner(System.in);
    @Autowired
    private final JmsTemplate jmsTemplate;
    @Autowired
    public SpringMQProducer(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }
    public static void main(String[] args) {
        ApplicationContext applicationContext = new ClassPathXmlApplicationContext("applicationContext.xml");
        SpringMQProducer springMQ_producer = applicationContext.getBean(SpringMQProducer.class);
        JmsTemplate jmsTemplate = springMQ_producer.jmsTemplate;
        // 发送消息
        jmsTemplate.send(session -> session.createTextMessage("***Spring和ActiveMQ的整合case....."));
        System.out.println("********send task over");
        while(true) {
            System.out.println("\n请输入要发送的内容");
            final String msgText = input.next();
            // 输入exit推出程序
            if ("exit".equals(msgText)) {
                System.exit(-1);
            }
            if (msgText.startsWith("auto:")) {
                int amount;
                try {
                    amount = Integer.parseInt(msgText.substring(5));
                } catch (NumberFormatException e) {
                    System.out.println("auto指令格式错误，正确的应该是：auto:number");
                    continue;
                }
                System.out.println("请稍等...");
                for (int i = 1; i <= amount; i++) {
                    final int ii = i;
                    jmsTemplate.send(session -> session.createTextMessage(ii + ""));
                }
                System.out.println(msgText + "\t->|\t指令执行完成");
            } else {
                jmsTemplate.send(session -> session.createTextMessage(msgText));
                System.out.println(msgText + "\t->|\t发送完成");
            }
        }
    }
}
```

队列消费者代码：

```java
package com.huazai.activemq.spring.queue;
import org.apache.xbean.spring.context.ClassPathXmlApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/01/11 23:39
 */
@Service
public class SpringMQConsumer {
    @Autowired
    private JmsTemplate jmsTemplate;
    @Autowired
    public void setJmsTemplate(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }
    public static void main(String[] args) {
        ApplicationContext applicationContext = new ClassPathXmlApplicationContext("applicationContext.xml");
        SpringMQConsumer springMQConsumer = applicationContext.getBean(SpringMQConsumer.class);
        while(true) {
            // 接受消息
            String returnValue = (String) springMQConsumer.jmsTemplate.receiveAndConvert();
            // 输入exit-退出
            if ("exit-".equals(returnValue)) {
                System.exit(-1);
            }
            System.out.println("****消费者收到的消息: " + returnValue);
        }
    }
}
```

启动消费者和订阅者，结果如下：

### 生产者Topic

增加核心配置

```xml
<!--主题-->
<bean id="destinationTopic" class="org.apache.activemq.command.ActiveMQTopic">
    <constructor-arg index="0" value="spring-active-topic"></constructor-arg>
</bean>
```

消费者和生产者代码不需要改变

就这 么 简 简 单 单 \color{red}就这么简简单单 就这么简简单单

### 监听器实现消费者不启动直接消费消息

applicationContext.xml 监听器配置：

```xml
<!--  配置Jms消息监听器  -->
<bean id="defaultMessageListenerContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
    <!--  Jms连接的工厂     -->
    <property name="connectionFactory" ref="connectionFactory"/>
    <!--   设置默认的监听目的地     -->
    <property name="destination" ref="destinationTopic"/>
    <!--传入默认目的地，可以是queue，也可以是topic-->
    <property name="messageListener" ref="myMessageListener"/>
</bean>
```

自定义监听器：

```java
package com.huazai.activemq.spring.listener;
import org.springframework.stereotype.Component;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageListener;
import javax.jms.TextMessage;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/1/12 0:14
 */
@Component
public class MyMessageListener implements MessageListener {
    @Override
    public void onMessage(Message message) {
        if (message instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) message;
            try {
                System.out.println("消费者收到的消息" + textMessage.getText());
            } catch (JMSException e) {
                e.printStackTrace();
            }
        }
    }
}
```

增加了监听器之后，在原来代码基础上

**1、** 只启动队列生产者；

以上案例实现了不启动消费者通过监听器实现queue和topic消息消费。
