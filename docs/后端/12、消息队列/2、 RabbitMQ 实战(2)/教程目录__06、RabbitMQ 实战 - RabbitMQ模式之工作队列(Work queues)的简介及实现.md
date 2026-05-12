# 06、RabbitMQ 实战 - RabbitMQ模式之工作队列(Work queues)的简介及实现
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/6.html
- 分类：消息队列
- 分组：教程目录
概念：工作队列的主要思想是避免立即执行资源密集型任务。当有多个工作线程（消费者）时，这些工作线程（消费者）将一起处理这些任务。

**1、** 工作队列原理；

工作线程（消费者）轮询的处理队列里的消息。值得注意的是一个消息只能被处理一次，不可以处理多次，三个工作线程之间是竞争关系

**2、** 在写实现工作队列前先新建一个名为utils用于放工具类的包，然后在包里新建一个RabbitMqUtils工具类，抽取重复性的代码放入其中，这样就不用每次都写重复的代码了；

RabbitMqUtils工具类代码如下：

```java
package com.ken.utils;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
/**
 * 用于连接工厂，创建信道的工具类
 */
public class RabbitMqUtils {
    //获取一个连接的信道
    public static Channel getChannel() throws Exception {
        //创建一个连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        //设置工厂IP，用于连接RabbitMQ的队列
        factory.setHost("192.168.194.150");
        //设置连接RabbitMQ的用户名
        factory.setUsername("admin");
        //设置连接RabbitMQ的密码
        factory.setPassword("123456");
        //创建连接
        Connection connection = factory.newConnection();
        //获取信道
        Channel channel = connection.createChannel();
        return channel;
    }
}
```

效果图：

**3、** 新建一个名为workqueues的包，用于装工作队列的代码；

效果图：

**4、** 新建一个名为Task01的类用于编写生产者代码，代码如下：；

```java
package com.ken.workqueues;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import java.util.Scanner;
/**
 * 生产者
 */
public class Task01 {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //进行发送操作
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        /**
         * 创建队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(QUEUE_NAME,false,false,false,null);
        //从控制台读取要发送的信息
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNext()) {
            String message = scanner.next();
            /**
             * 用信道对消息进行发布
             * 第一个参数：发送到哪个交换机
             * 第二个参数：路由的Key值是哪个，本次是队列名
             * 第三个参数：其他参数信息
             * 第四个参数：发送消息的消息体
             */
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
            System.out.println("消息发送成功:" + message);
        }
    }
}
```

效果图：

**5、** 新建一个名为Worker01的类用于编写工作线程代码，代码如下：；

```java
package com.ken.workqueues;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 * 第一个工作线程
 */
public class Worker01 {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //进行接收操作
    public static void main(String[] args) throws Exception{
        //通过工具类获取信道
        Channel channel = RabbitMqUtils.getChannel();
        /**
         * 声明消费者接收消息后的回调方法(由于回调方法DeliverCallback是函数式接口，所以需要给DeliverCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数deliverCallback的类型DeliverCallback用 @FunctionalInterface注解规定DeliverCallback是一个函数式接口，所以要往deliverCallback参数传的值要是一个函数
         *
         * 以下是DeliverCallback接口的源代码
         *  @FunctionalInterface
         *  public interface DeliverCallback {
         *      void handle (String consumerTag, Delivery message) throws IOException;
         *  }
         */
        DeliverCallback deliverCallback = (consumerTag, message) -> {
            System.out.println("接收的消息：" + new String(message.getBody()));
        };
        /**
         * 声明消费者取消接收消息后的回调方法(由于回调方法CancelCallback是函数式接口，所以需要给CancelCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数cancelCallback的类型CancelCallback用 @FunctionalInterface注解规定CancelCallback是一个函数式接口，所以要往cancelCallback参数传的值要是一个函数
         *
         *  @FunctionalInterface
         *  public interface CancelCallback {
         *      void handle (String consumerTag) throws IOException;
         *  }
         *
         */
        CancelCallback cancelCallback = consumerTag -> {
            System.out.println("取消消费消息：" + consumerTag);
        };
        /**
         * 用信道对消息进行接收
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work01等待接收消息...");
        channel.basicConsume(QUEUE_NAME,true,deliverCallback,cancelCallback);
    }
}
```

效果图：

**6、** 复制Worker01类，粘贴并重命名为Woker02，消息输出变为“Work02等待接收消息...“；

Worker02类代码如下：

```java
package com.ken.workqueues;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 * 第二个工作线程
 */
public class Worker02 {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //进行接收操作
    public static void main(String[] args) throws Exception{
        //通过工具类获取信道
        Channel channel = RabbitMqUtils.getChannel();
        /**
         * 声明消费者接收消息后的回调方法(由于回调方法DeliverCallback是函数式接口，所以需要给DeliverCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数deliverCallback的类型DeliverCallback用 @FunctionalInterface注解规定DeliverCallback是一个函数式接口，所以要往deliverCallback参数传的值要是一个函数
         *
         * 以下是DeliverCallback接口的源代码
         *  @FunctionalInterface
         *  public interface DeliverCallback {
         *      void handle (String consumerTag, Delivery message) throws IOException;
         *  }
         */
        DeliverCallback deliverCallback = (consumerTag, message) -> {
            System.out.println("接收的消息：" + new String(message.getBody()));
        };
        /**
         * 声明消费者取消接收消息后的回调方法(由于回调方法CancelCallback是函数式接口，所以需要给CancelCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数cancelCallback的类型CancelCallback用 @FunctionalInterface注解规定CancelCallback是一个函数式接口，所以要往cancelCallback参数传的值要是一个函数
         *
         *  @FunctionalInterface
         *  public interface CancelCallback {
         *      void handle (String consumerTag) throws IOException;
         *  }
         *
         */
        CancelCallback cancelCallback = consumerTag -> {
            System.out.println("取消消费消息：" + consumerTag);
        };
        /**
         * 用信道对消息进行接收
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work02等待接收消息...");
        channel.basicConsume(QUEUE_NAME,true,deliverCallback,cancelCallback);
    }
}
```

效果图：

**7、** 分别运行Worker01和Worker02两个工作线程；

效果图：

Worker01:

Worker02

**8、** 运行Task01，运行成功后分别控制台输入4条不同的消息；

例：

**9、** 查看工作线程（消费者）接收信息的情况；

Worker01：

Worker02:

由图可看出两个工作线程（消费者）轮询的消费掉生产者发送的信息，由此可以证明工作队列运行成功！
