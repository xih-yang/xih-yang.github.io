# 15、RabbitMQ 实战 - 死信队列的简介与死信队列和死信消费者的实现
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/15.html
- 分类：消息队列
- 分组：教程目录
**1、** 死信的概念；

死信，顾名思义就是无法被消费的消息，一般来说producer（生产者）将消息投递到broker或直接放到queue（队列）中，consumer（消费者）从queue（队列）取出消息进行消费，但某些时候由于特定的原因导致queue（队列）中的消息无法被消费，若这些消息没有后续的处理，则这些消息就变成了死信，有死信自然就有了死信队列

**2、** 死信的应用场景；

为保证订单业务的消息数据不丢失，需要使用RabbitMQ的死信队列机制，当消息发生异常时，将消息投入死信队列中

**3、** 死信的来源；

(1)消息TTL（存活时间）过期

(2)队列达到最大长度（队列满了，无法再添加数据到mq中）

(3)消息被拒绝（basic.reject或basic.nack）并且requeue=false

**4、** 死信队列的实现；

(1)我们将根据这张死信队列的代码架构图来实现死信队列

(2)新建一个名为dead的包，用于装实现死信队列的代码

效果图：

(3)新建一个名为Consumer01的类用于编写消费者的代码

代码如下：

注：RabbitMqUtils工具类的实现在我的另一篇文章里，有需要的同学可以查看参考

[RabbitMQ系列（6）--RabbitMQ模式之工作队列(Work queues)的简介及实现_Ken_1115的博客-CSDN博客](/zhuanlan/mq/activemq/2/6.html)

```java
package com.ken.dead;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.rabbitmq.client.Delivery;
import java.util.HashMap;
import java.util.Map;
public class Consumer01 {
    //普通交换机的名称
    public static  final String NORMAL_EXCHANGE = "normal_exchange";
    //死信交换机的名称
    public static final String DEAD_EXCHANGE = "dead_exchange";
    //普通队列的名称
    public static  final String NORMAL_QUEUE = "normal_queue";
    //死信队列的名称
    public static final String DEAD_QUEUE = "dead_queue";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMqUtils.getChannel();
        //声明普通死信交换机，类型为direct
        channel.exchangeDeclare(NORMAL_EXCHANGE, BuiltinExchangeType.DIRECT);
        //声明死信交换机，类型为direct
        channel.exchangeDeclare(DEAD_EXCHANGE,BuiltinExchangeType.DIRECT);
        //用于在消息成为死信后，把消息转发到死信交换机dead_exchange里
        Map<String, Object> arguments = new HashMap<>();
        //正常队列设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信routingkey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置正常队列长度的限制
        //arguments.put("x-max-length",6);
        /**
         * 声明普通队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(NORMAL_QUEUE,false,false,false,arguments);
        /**
         * 声明死信队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(DEAD_QUEUE,false,false,false,null);
        //普通队列与普通交换机通过routingkey进行捆绑
        channel.queueBind(NORMAL_QUEUE,NORMAL_EXCHANGE,"normal");
        //死信队列与死信交换机通过routingkey进行捆绑
        channel.queueBind(DEAD_QUEUE,DEAD_EXCHANGE,"dead");
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
            System.out.println("Consumer01接收的消息是：" + new String(message.getBody(),"UTF-8"));
        };
        channel.basicConsume(NORMAL_QUEUE,true,deliverCallback,consumerTag -> {});
    }
}
```

(4)复制Consumer01类并粘贴重命名为Consumer02

代码如下：

```java
package com.ken.dead;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import java.util.HashMap;
import java.util.Map;
public class Consumer02 {
    //普通队列的名称
    public static  final String NORMAL_QUEUE = "normal_queue";
    //死信队列的名称
    public static final String DEAD_QUEUE = "dead_queue";
    public static void main(String[] args) throws Exception {
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
            System.out.println("Consumer02接收的消息是：" + new String(message.getBody(),"UTF-8"));
        };
        channel.basicConsume(DEAD_QUEUE,true,deliverCallback,consumerTag -> {});
    }
}
```

(5)新建一个名为Producer的类用于编写生产者的代码

代码如下：

```java
package com.ken.dead;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
/**
 * 生产者
 */
public class Producer {
    //普通交换机的名称
    public static  final String NORMAL_EXCHANGE = "normal_exchange";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMqUtils.getChannel();
        //死信消息，设置TTL时间（存活时间），单位是ms 10000ms = 10s
        AMQP.BasicProperties properties= new AMQP.BasicProperties().builder().expiration("10000").build();
        for (int i = 1; i < 11; i++) {
            String message = "info" + i;
            /**
             * 用信道对消息进行发布（消息持久化）
             * 第一个参数：发送到哪个交换机
             * 第二个参数：路由的Key值是哪个，本次是队列名
             * 第三个参数：其他参数信息
             * 第四个参数：发送消息的消息体
             */
            channel.basicPublish(NORMAL_EXCHANGE,"normal",properties,message.getBytes());
        }
    }
}
```

(6)先运行Consumer01，生成队列和交换机

(7)然后停止Consumer01，模拟消费者宕机

(8)运行Producer

(9)观察normal_queue队列和dead_queue队列消息数量的变化，一开始normal_queue队列里有10条消息，过了10s后消息都到了dead_queue队列里，证明消费者消费消息失败，消息从normal_queue队列移到了dead_queue队列里，由此可见当消息TTL过期后，死信队列成功运行

(10)启动Consumer02，可以看到Consumer02消费了dead_queue队列里的消息

(10)删除normal_queue队列

(11) 修改Produces的代码，把设置TTL时间的代码注释掉，basicPublish方法的第3个参数设置为null

代码如下：

```java
package com.ken.dead;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
/**
 * 生产者
 */
public class Producer {
    //普通交换机的名称
    public static  final String NORMAL_EXCHANGE = "normal_exchange";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMqUtils.getChannel();
        //死信消息，设置TTL时间（存活时间），单位是ms 10000ms = 10s
        //AMQP.BasicProperties properties= new AMQP.BasicProperties().builder().expiration("10000").build();
        for (int i = 1; i < 11; i++) {
            String message = "info" + i;
            /**
             * 用信道对消息进行发布（消息持久化）
             * 第一个参数：发送到哪个交换机
             * 第二个参数：路由的Key值是哪个，本次是队列名
             * 第三个参数：其他参数信息
             * 第四个参数：发送消息的消息体
             */
            channel.basicPublish(NORMAL_EXCHANGE,"normal",null,message.getBytes());
        }
    }
}
```

(12)修改Consumer01的代码，把之前注释的用于限制队列长度的代码放出来

代码如下：

```java
package com.ken.dead;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.rabbitmq.client.Delivery;
import java.util.HashMap;
import java.util.Map;
public class Consumer01 {
    //普通交换机的名称
    public static  final String NORMAL_EXCHANGE = "normal_exchange";
    //死信交换机的名称
    public static final String DEAD_EXCHANGE = "dead_exchange";
    //普通队列的名称
    public static  final String NORMAL_QUEUE = "normal_queue";
    //死信队列的名称
    public static final String DEAD_QUEUE = "dead_queue";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMqUtils.getChannel();
        //声明普通死信交换机，类型为direct
        channel.exchangeDeclare(NORMAL_EXCHANGE, BuiltinExchangeType.DIRECT);
        //声明死信交换机，类型为direct
        channel.exchangeDeclare(DEAD_EXCHANGE,BuiltinExchangeType.DIRECT);
        //用于在消息成为死信后，把消息转发到死信交换机dead_exchange里
        Map<String, Object> arguments = new HashMap<>();
        //正常队列设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信routingkey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置正常队列长度的限制
        arguments.put("x-max-length",6);
        /**
         * 声明普通队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(NORMAL_QUEUE,false,false,false,arguments);
        /**
         * 声明死信队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(DEAD_QUEUE,false,false,false,null);
        //普通队列与普通交换机通过routingkey进行捆绑
        channel.queueBind(NORMAL_QUEUE,NORMAL_EXCHANGE,"normal");
        //死信队列与死信交换机通过routingkey进行捆绑
        channel.queueBind(DEAD_QUEUE,DEAD_EXCHANGE,"dead");
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
            System.out.println("Consumer01接收的消息是：" + new String(message.getBody(),"UTF-8"));
        };
        channel.basicConsume(NORMAL_QUEUE,true,deliverCallback,consumerTag -> {});
    }
}
```

(13)停掉所有程序，然后重新运行Consumer01，生成队列和交换机

(14)然后停止Consumer01，模拟消费者宕机

(15)重新运行Producer

(16)观察normal_queue队列和dead_queue队列消息数量的变化，可以看到normal_queue队列只能堆积最多6条消息，而剩余的4条消息都移到了dead_queue队列里，由此可见当队列达到最大长度6条后，死信队列成功运行

(17)删除normal_queue队列和dead_queue队列

(18)修改Consumer01的代码，注释掉限制队列长度的代码，修改消息应答的部分代码

代码如下：

```java
package com.ken.dead;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.rabbitmq.client.Delivery;
import java.util.HashMap;
import java.util.Map;
public class Consumer01 {
    //普通交换机的名称
    public static  final String NORMAL_EXCHANGE = "normal_exchange";
    //死信交换机的名称
    public static final String DEAD_EXCHANGE = "dead_exchange";
    //普通队列的名称
    public static  final String NORMAL_QUEUE = "normal_queue";
    //死信队列的名称
    public static final String DEAD_QUEUE = "dead_queue";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMqUtils.getChannel();
        //声明普通死信交换机，类型为direct
        channel.exchangeDeclare(NORMAL_EXCHANGE, BuiltinExchangeType.DIRECT);
        //声明死信交换机，类型为direct
        channel.exchangeDeclare(DEAD_EXCHANGE,BuiltinExchangeType.DIRECT);
        //用于在消息成为死信后，把消息转发到死信交换机dead_exchange里
        Map<String, Object> arguments = new HashMap<>();
        //正常队列设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信routingkey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置正常队列长度的限制
        //arguments.put("x-max-length",6);
        /**
         * 声明普通队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(NORMAL_QUEUE,false,false,false,arguments);
        /**
         * 声明死信队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(DEAD_QUEUE,false,false,false,null);
        //普通队列与普通交换机通过routingkey进行捆绑
        channel.queueBind(NORMAL_QUEUE,NORMAL_EXCHANGE,"normal");
        //死信队列与死信交换机通过routingkey进行捆绑
        channel.queueBind(DEAD_QUEUE,DEAD_EXCHANGE,"dead");
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
            String mes = new String(message.getBody(),"UTF-8");
            //消息被拒绝，basicReject第二个参数是false表示被拒绝后不放回队列
            if("info5".equals(mes)) {
                System.out.println("Consumer01接收的消息是：" + mes + "，此消息被拒绝");
                channel.basicReject(message.getEnvelope().getDeliveryTag(),false);
            }else {
                System.out.println("Consumer01接收的消息是：" + mes);
                channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
            }
        };
        //开启手动应答
        channel.basicConsume(NORMAL_QUEUE,false,deliverCallback,consumerTag -> {});
    }
}
```

(19)停掉所有程序，然后重新运行Consumer01，生成队列和交换机

(20)重新运行Producer

(21)查看Consumer01控制台的输出，观察dead_queue队列消息数量的变化，因为没有开启Consumer02消费dead_queue队列，可以看到dead_queue队列堆积了1条消息，查看这条消息，可以看出就是我们拒绝掉的info5，这证明消费者拒绝消费消息info5后，消息info5从normal_queue队列移到了dead_queue队列里，由此可见当消息被拒绝消费后，死信队列成功运行

(22)启动Consumer02，可以看到Consumer02消费了dead_queue队列里的消息
