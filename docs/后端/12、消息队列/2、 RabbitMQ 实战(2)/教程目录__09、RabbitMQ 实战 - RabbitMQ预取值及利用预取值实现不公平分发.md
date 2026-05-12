# 09、RabbitMQ 实战 - RabbitMQ预取值及利用预取值实现不公平分发
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/9.html
- 分类：消息队列
- 分组：教程目录
概念：RabbitMQ的默认分发消息机制是轮询分发，但在消费者之间处理任务速度不同时，这种分发消息机制会导致任务的处理效率低下，处理任务速度快的消费者很大一部分的时间处于空闲状态，速度慢的消费者则一直在干活，所以这种情况下需要改变下RabbitMQ分发消息的策略，实现不公平分发。

**1、** 预取值；

预取值指消费者管道的缓冲区大小，即是信道中可以存储未应答消息的最大值

**2、** 利用预取值实现不公平分发；

如果设置预取值为1，则表示每个消费者允许未确认的消息最大值为1条，在消费者未完全处理完这1条消息并应答时，由于设置的预取值为1，队列不会再分配新的消息给它处理，那处理快的消费者很快就处理完消息，然后队列根据预取值为1，立马就给快的消费者分配新的1条消息，然后快的消费者可以继续处理下一条，慢的消费者还得继续处理原来未完成的消息，利用这个思路就能实现不公平分发，实现不公平分发需要在消费者端设置basicQos方法的参数为1，即channel.basicQos(1);（不设置时默认为0，即是轮询分发），

Task02代码如下：

注：RabbitMqUtils工具类的实现在我的另一篇文章里，有需要的同学可以查看参考

[https://blog.csdn.net/m0_64284147/article/details/129465871](/zhuanlan/mq/activemq/2/6.html)

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import java.util.Scanner;
public class Task02 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "my_queue";
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

Worker03代码如下：

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.ken.utils.SleepUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 *  手动应答的第一个消费者
 */
public class Worker03 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "my_queue";
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
            //沉睡1S，用于模拟业务处理需要1s的时间（处理任务速度快）
            SleepUtils.sleep(1);
            System.out.println("接收的消息：" + new String(message.getBody()));
            /**
             * 手动应答
             *  第一个参数：表示消息的标记Tag（每个消息都有标记Tag）
             *  第二个参数：是否批量应答,true表示批量，false表示不批量
             */
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
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
        //设置预取值为1，实现不公平分发
        channel.basicQos(1);
        /**
         * 用信道对消息进行接收(采用手动应答)
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work03等待接收消息...");
        channel.basicConsume(QUEUE_NAME,false,deliverCallback,cancelCallback);
    }
}
```

Worker04代码如下：

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.ken.utils.SleepUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 *  手动应答的第二个消费者
 */
public class Worker04 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "my_queue";
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
            //沉睡30S，用于模拟业务处理需要30s的时间（处理任务速度慢）
            SleepUtils.sleep(30);
            System.out.println("接收的消息：" + new String(message.getBody()));
            /**
             * 手动应答
             *  第一个参数：表示消息的标记Tag（每个消息都有标记Tag）
             *  第二个参数：是否批量应答,true表示批量，false表示不批量
             */
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
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
        //设置预取值为1，实现不公平分发
        channel.basicQos(1);
        /**
         * 用信道对消息进行接收(采用手动应答)
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work04等待接收消息...");
        channel.basicConsume(QUEUE_NAME,false,deliverCallback,cancelCallback);
    }
}
```

**2、** 测试分发效果；

在上述的代码里，我们把Worker03处理任务的速度设置为了1s，模拟成处理任务速度快的那个消费者，把Worker04处理任务的速度设置为了30s，模拟成处理任务速度慢的那个消费者

(1)把Task02、Worker03、Worker04都启动起来

(2)往队列发送多条消息

(3)观察消费者消费消息的情况

效果图：

Worker03

Worker04

由上述图片的两个消费者处理消息的数量对比得知我们设置的不公平分发策略生效了，Worker03处理任务速度快，从而承担了处理更多任务的责任，而Worker04处理任务的速度慢，从而导致处理任务的条数没有Worker03多

**3、** 利用预取值来实现向指定消费者侧重分发消息；

除了上述的不公平分发，我们也可以手动的为不同的消费者设置不同的预取值，从而实现向指定的消费者侧重分发消息

Task02代码如下：

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import java.util.Scanner;
public class Task02 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "my_queue";
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

Worker03代码如下：

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.ken.utils.SleepUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 *  手动应答的第一个消费者
 */
public class Worker03 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "my_queue";
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
            //沉睡1S，用于模拟业务处理需要1S的时间
            SleepUtils.sleep(1);
            System.out.println("接收的消息：" + new String(message.getBody()));
            /**
             * 手动应答
             *  第一个参数：表示消息的标记Tag（每个消息都有标记Tag）
             *  第二个参数：是否批量应答,true表示批量，false表示不批量
             */
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
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
        //设置不公平分发
        channel.basicQos(2);
        /**
         * 用信道对消息进行接收(采用手动应答)
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work03等待接收消息...");
        channel.basicConsume(QUEUE_NAME,false,deliverCallback,cancelCallback);
    }
}
```

Worker04代码如下

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.ken.utils.SleepUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 *  手动应答的第二个消费者
 */
public class Worker04 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "my_queue";
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
            //沉睡30S，用于模拟业务处理需要30S的时间
            SleepUtils.sleep(30);
            System.out.println("接收的消息：" + new String(message.getBody()));
            /**
             * 手动应答
             *  第一个参数：表示消息的标记Tag（每个消息都有标记Tag）
             *  第二个参数：是否批量应答,true表示批量，false表示不批量
             */
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
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
        //设置不公平分发
        channel.basicQos(5);
        /**
         * 用信道对消息进行接收(采用手动应答)
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work04等待接收消息...");
        channel.basicConsume(QUEUE_NAME,false,deliverCallback,cancelCallback);
    }
}
```

**4、** 测试分发效果；

在上述的代码里，我们把Worker03处理任务的速度设置为了1s，模拟成处理任务速度快的那个消费者，把Worker04处理任务的速度设置为了30s，模拟成处理任务速度慢的那个消费者

(1)把Task02、Worker03、Worker04都启动起来

(2)快速的往队列发送多条消息（注意要快速，不然就被Worker03消费完了，看不出效果）

(3)查看RabbitMQ的管理页面，可以看到我们发送了这么多条消息，最大的消费消息上限是我们设置的5条

也可以在Channels里查看，可以分别看到我们为消费者设置的预取值
