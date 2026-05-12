# 08、ActiveMQ 实战 - Spring整合ActiveMQ
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/8.html
- 分类：消息队列
- 分组：教程目录
### 环境准备

- 启动的ActiveMQ服务
- JDK1.8+
- IDEA或Eclipse
- Maven环境
- Spring环境依赖

```java
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>5.2.1.RELEASE</version>
</dependency>
```

- ActiveMQ环境依赖

```java
<!--activemq核心依赖-->
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-all</artifactId>
    <version>5.15.11</version>
</dependency>
<!--activemq连接池依赖-->
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-pool</artifactId>
    <version>5.15.10</version>
</dependency>
```

### 编码阶段

- applicationContext.xml 配置文件：

```java
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
                <property name="brokerURL" value="tcp://192.168.64.129:61616"/>
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
    <!--  配置Jms消息监听器  -->
    <bean id="defaultMessageListenerContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
        <!--  Jms连接的工厂     -->
        <property name="connectionFactory" ref="connectionFactory"/>
        <!--   设置默认的监听目的地     -->
        <property name="destination" ref="destinationTopic"/>
        <!--传入默认目的地，可以是queue，也可以是topic-->
        <property name="messageListener" ref="myMessageListener"/>
    </bean>
</beans>
```

- 队列消费者代码：

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

- 启动消费者和订阅者，结果如下：
- 订阅者代码

```java
package com.huazai.activemq.spring.topic;
import org.apache.xbean.spring.context.ClassPathXmlApplicationContext;
import org.springframework.context.ApplicationContext;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
import javax.jms.Destination;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/01/11 23:40
 */
@Service
public class SpringMQTopicConsumer {
	private final JmsTemplate jmsTemplate;
	public SpringMQTopicConsumer(JmsTemplate jmsTemplate) {
		this.jmsTemplate = jmsTemplate;
	}
	public static void main(String[] args) {
		ApplicationContext applicationContext = new ClassPathXmlApplicationContext("applicationContext.xml");
		SpringMQTopicConsumer springMQConsumer = applicationContext.getBean(SpringMQTopicConsumer.class);
		JmsTemplate jmsTemplate = springMQConsumer.jmsTemplate;
		// applicationContext.xml的默认目的地配置为队列，所以此处需要用代码修改默认目的地
		jmsTemplate.setDefaultDestination(((Destination) applicationContext.getBean("destinationTopic")));
//		jmsTemplate.setDestinationResolver((session, s, b) -> session.createTopic("spring-test-topic"));
		while (true) {
			String returnValue = (String) jmsTemplate .receiveAndConvert();
			if ("exit-".equals(returnValue)) {
				System.exit( -1);
			}
			System.out.println("****消费者收到的消息:   " + returnValue);
		}
	}
}
```

- 发布者代码

```java
package com.huazai.activemq.spring.topic;
import org.apache.xbean.spring.context.ClassPathXmlApplicationContext;
import org.springframework.context.ApplicationContext;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
import javax.jms.Destination;
import java.util.Scanner;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/01/11 23:41
 */
@Service
public class SpringMQTopicProducer {
	static final Scanner input = new Scanner(System.in);
	private final JmsTemplate jmsTemplate;
	public SpringMQTopicProducer(JmsTemplate jmsTemplate) {
		this.jmsTemplate = jmsTemplate;
	}
	public static void main(String[] args) throws InterruptedException {
		ApplicationContext applicationContext = new ClassPathXmlApplicationContext("applicationContext.xml");
		SpringMQTopicProducer springMQ_topic_producer = applicationContext.getBean(SpringMQTopicProducer.class);
		//直接调用application.xml里面创建的destinationTopic这个bean设置为目的地就行了
		JmsTemplate jmsTemplate = springMQ_topic_producer.jmsTemplate;
		// applicationContext.xml的默认目的地配置为队列，所以此处需要用代码修改默认目的地
		jmsTemplate.setDefaultDestination(((Destination) applicationContext.getBean("destinationTopic")));
//		jmsTemplate.setDestinationResolver((session, s, b) -> session.createTopic("spring-test-topic"));
		jmsTemplate.send(session -> session.createTextMessage("***Spring和ActiveMQ的整合TopicCase111....."));
		System.out.println("********send task over");
		while(true) {
			System.out.println("\n请输入要发送的内容");
			final String msgText = input.next();
			if ("exit".equals(msgText)) {
				System.exit(-1);
			} else {
				jmsTemplate.send(session -> session.createTextMessage(msgText));
				System.out.println(msgText + "\t->|\t发送完成");
			}
		}
	}
}
```

先启动订阅者，再启动发布者，结果如下：

- 监听器实现消费者不启动直接消费消息

applicationContext.xml 监听器配置：

```java
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

**2、** 只启动主题订阅者；

以上两个案例实现了不启动消费者通过监听器实现queue和topic消息消费。

代码已上传至个人gitgub，地址：[https://github.com/SexCastException/ActiveMQ.git](https://github.com/SexCastException/ActiveMQ.git)
