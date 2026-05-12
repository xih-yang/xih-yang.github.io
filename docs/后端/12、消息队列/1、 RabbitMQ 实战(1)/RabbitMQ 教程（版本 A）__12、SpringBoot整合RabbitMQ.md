# 12、SpringBoot整合RabbitMQ
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/12.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、环境搭建

### 1.1、创建一个Springboot项目

### 1.2、导入相关依赖

**或者不勾选Spring for RabbitMQ,自己导入依赖**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

### 1.3、编写配置文件

```sh
# 应用名称
spring.application.name=rabbitmq_springboot
# 应用服务 WEB 访问端口
server.port=8080
spring.rabbitmq.port=5672
spring.rabbitmq.host=192.168.137.5
spring.rabbitmq.username=admin
spring.rabbitmq.password=123
#虚拟主机
spring.rabbitmq.virtual-host=/
```

## 2、helloworld模型

### 2.1、编写消费者

```java
package com.zww.spring;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
@Component
// 生产端没有指定交换机只有routingKey和Object。
//消费方产生hello队列，放在默认的交换机(AMQP default)上。
//而默认的交换机有一个特点，只要你的routerKey的名字与这个
//交换机的队列有相同的名字，他就会自动路由上。 
//生产端routingKey 叫hello ，消费端生产hello队列。
//他们就路由上了
@RabbitListener(queuesToDeclare = @Queue(value = "hello"))  //表示RabbitMQ消费者,声明一个队列
public class HelloConsumer {
    @RabbitHandler //当消费者从队列取出消息时的回调方法
    public void receive(String message){
        System.out.println("message = " + message);
    }
}
```

### 2.2、编写生产者测试类

```java
package com.zww;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
@SpringBootTest(classes = RabbitmqSpringbootApplication.class)
@RunWith(SpringRunner.class)
public class TestRabbitMQ {
    //注入rabbitTemplate
    @Autowired
    private RabbitTemplate rabbitTemplate;
    //hello world
    @Test
    public void testHelloWorld(){
        //转换和发送    1.routingKey 2.消息
        rabbitTemplate.convertAndSend("hello","hello world");
    }
}
```

### 2.3、运行生产者测试类

## 3、work工作模型

### 3.1、消费者

```java
package com.zww.work;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
@Component
public class WorkConsumer {
    //第一个消费者
    @RabbitListener(queuesToDeclare = @Queue("work")) //@RabbitListener在方法上代表它监听这个方法作为队列消费回调
    public void receive1(String message){
        System.out.println("message1 = " + message);
    }
    //第二个消费者
    @RabbitListener(queuesToDeclare = @Queue("work")) //@RabbitListener在方法上代表它监听这个方法作为队列消费回调
    public void receive2(String message){
        System.out.println("message2 = " + message);
    }
}
```

### 3.2、生产者

```java
@Test
public void testWork(){
    for (int i = 0; i < 10; i++) {
        rabbitTemplate.convertAndSend("work","work模型");
    }
}
```

### 3.3、运行测试

## 4、fanout广播模型

### 4.1、消费者

```java
package com.zww.fanout;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
@Component
public class FanoutConsumer {
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue, //创建临时队列
                    exchange =@Exchange(value = "logs",type = "fanout") //绑定的交换机
            )
    })
    public void receive1(String message){
        System.out.println("message1 = " + message);
    }
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue, //创建临时队列
                    exchange =@Exchange(value = "logs",type = "fanout") //绑定的交换机
            )
    })
    public void receive2(String message){
        System.out.println("message2 = " + message);
    }
}
```

### 4.2、生产者

```java
@Test
public void testFanout(){
    rabbitTemplate.convertAndSend("logs","","Fanout模型发送的消息");
}
```

### 4.3、运行测试

## 5、route路由模型

### 5.1、消费者

```java
package com.zww.route;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
@Component
public class RouteConsumer {
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,//临时队列
                    exchange = @Exchange(value = "directs",type = "direct"),//指定交换机名称和类型
                    key = {"info","error","warn"}
            )
    })
    public void receive1(String message){
        System.out.println("message1 = " + message);
    }
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,//临时队列
                    exchange = @Exchange(value = "directs",type = "direct"),//指定交换机名称和类型
                    key = {"error"}
            )
    })
    public void receive2(String message){
        System.out.println("message2 = " + message);
    }
}
```

### 5.2、生产者

```java
@Test
public void testRoute(){
    rabbitTemplate.convertAndSend("directs","error","发送info的key的路由信息");
}
```

### 5.3、运行测试

## 6、Topic动态路由模型

### 6.1、消费者

```java
package com.zww.topic;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
@Component
public class TopicConsumer {
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,//临时队列
                    exchange = @Exchange(type = "topic",name = "topics"),
                    key = {"user.save","user.*"}
            )
    })
    public void receive1(String message){
        System.out.println("message1 = " + message);
    }
    @RabbitListener(bindings = {
            @QueueBinding(
                    value = @Queue,//临时队列
                    exchange = @Exchange(type = "topic",name = "topics"),
                    key = {"order.#","produce.#","user.*"}
            )
    })
    public void receive2(String message){
        System.out.println("message2 = " + message);
    }
}
```

### 6.2、生产者

```java
@Test
public void testTopic(){
    rabbitTemplate.convertAndSend("topics","user.save","user.save 路由消息");
}
```

### 6.3、运行测试

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
