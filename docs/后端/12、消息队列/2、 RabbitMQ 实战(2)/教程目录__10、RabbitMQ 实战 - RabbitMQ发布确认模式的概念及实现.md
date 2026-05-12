# 10、RabbitMQ 实战 - RabbitMQ发布确认模式的概念及实现
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/10.html
- 分类：消息队列
- 分组：教程目录
概念：虽然我们可以设置队列和队列中的消息持久化，但任然存在消息在持久化的过程中，即在写入磁盘的过程中，消息未完全写入，然后服务器宕机导致消息丢失的情况，发布确认就是为了解决这种情况的概念，在消息完全写入磁盘后才确认消息完全持久化了

**1、** 发布确认模式：；

(1)单个确认发布模式（简单，但吞吐量有限）

(2)批量确认发布模式（简单，吞吐量合理，但出现问题很难找出是那条消息出现的问题）

(3)异步确认发布模式（最佳性能和资源使用，在出现错误的情况下能很好的控制，推荐使用）

**2、** 实现开启发布确认；

在生产者的代码中在channel调用confirmSelect方法，即channel.confirmSelect()

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
        //开启发布确认
        channel.confirmSelect();
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

**3、** 新建包，用于装实现确认发布模式的代码；

(1)新建一个名为confirm的包，用于装发布确认的代码

效果图：

(2)新建一个名为ConfirmMessage的类

**4、** 单个确认发布模式；

单个确认发布是一种同步确认发布的方式，在发布一个消息后并且该条消息被确认发布了，后续的消息才能继续发布，不过这种确认方式的最大缺点就是发布速度特别慢

代码如下：

```java
package com.ken.confirm;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
/**
 * 发布确认模式：
 * 1、单个确认发布模式
 * 2、批量确认发布模式
 * 3、异步确认发布模式
 */
public class ConfirmMessage {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //批量发布消息的个数
    public static final int MESSAGE_COUNT = 1000;
    public static void main(String[] args) throws Exception{
        //1、单个确认发布模式
        ConfirmMessage.publishMessageIndividually();
    }
    public static void publishMessageIndividually() throws  Exception{
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
        //开启发布确认
        channel.confirmSelect();
        //开始时间
        long begin = System.currentTimeMillis();
        //批量发消息
        for (int i = 0; i < MESSAGE_COUNT; i++) {
            String message = i + "";
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
            //单个消息发布确认
            channel.waitForConfirms();
        }
        //结束时间
        long end = System.currentTimeMillis();
        System.out.println("发布" + MESSAGE_COUNT + "个单个确认消息，耗时" + (end - begin) + "ms");
    }
}
```

运行代码，查看单个确认发布模式消耗的时间

**5、** 批量确认发布模式；

批量确认发布是一种能极大的提高吞吐量的发布模式，在发布一批消息后一起确认，不过这种确认方式的缺点是当发送故障导致发布出现问题时，不知道是哪个消息出现的问题

代码如下：

```java
package com.ken.confirm;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
/**
 * 发布确认模式：
 * 1、单个确认模式
 * 2、批量确认模式
 * 3、异步确认模式
 */
public class ConfirmMessage {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //批量发布消息的个数
    public static final int MESSAGE_COUNT = 1000;
    public static void main(String[] args) throws Exception{
        //2、批量确认模式
        ConfirmMessage.publishMessageBatch();
    }
    public static void publishMessageBatch() throws  Exception{
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
        //开启发布确认
        channel.confirmSelect();
        //开始时间
        long begin = System.currentTimeMillis();
        //批量确认消息大小
        int batchSize = 100;
        //批量发消息
        for (int i = 0; i < MESSAGE_COUNT; i++) {
            String message = i + "";
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
            //达到100条消息的时候，批量确认一次
            if(i % batchSize == 0) {
                //批量消息发布确认
                channel.waitForConfirms();
            }
        }
        //结束时间
        long end = System.currentTimeMillis();
        System.out.println("发布" + MESSAGE_COUNT + "个批量确认消息，耗时" + (end - begin) + "ms");
    }
}
```

运行代码，查看批量确认发布模式消耗的时间

**6、** 异步确认发布模式；

(1)代码实现

异步确认发布实现逻辑比上面两种要复杂，但性价比高，无论是可靠性还是效率都非常突出，异步确认发布通过回调函数来达到消息可靠性传递，消息的结构类似于map，都是key-value的结构，当相应的消息被消费了或消费失败了，都可以通过对应的key值来确认消费或消费失败的是哪一条消息，所以可靠性很高

代码如下：

```java
package com.ken.confirm;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConfirmCallback;
/**
 * 发布确认模式：
 * 1、单个确认模式
 * 2、批量确认模式
 * 3、异步批量确认模式
 */
public class ConfirmMessage {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //批量发布消息的个数
    public static final int MESSAGE_COUNT = 1000;
    public static void main(String[] args) throws Exception{
        //3、异步批量确认模式
        ConfirmMessage.publishMessageAsync();
    }
    //异步发布确认
    public static void  publishMessageAsync() throws Exception {
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
        //开启发布确认
        channel.confirmSelect();
        //开始时间
        long begin = System.currentTimeMillis();
        /**
         * 消息确认成功回调函数
         * 第一个参数：消息的标记
         * 第二个参数：是否确立确认
         */
        ConfirmCallback ackCallback = (deliveryTag,  multiple) -> {
            System.out.println("确认的消息：" + deliveryTag);
        };
        /**
         * 消息确认失败回调函数
         * 第一个参数：消息的标记
         * 第二个参数：是否确立确认
         */
        ConfirmCallback nackCallback = (deliveryTag,  multiple) -> {
            System.out.println("未确认的消息：" + deliveryTag);
        };
        /**
         * 消息监听器，用于监听消息发送是否成功
         * 第一个参数：消息确认成功回调函数
         * 第二个参数：消息确认失败回调函数
         */
        channel.addConfirmListener(ackCallback,nackCallback);
        //批量发消息
        for (int i = 0; i < MESSAGE_COUNT; i++) {
            String message = "消息" + i;
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
        }
        //结束时间
        long end = System.currentTimeMillis();
        System.out.println("发布" + MESSAGE_COUNT + "个异步发布确认消息，耗时" + (end - begin) + "ms");
    }
}
```

(2)运行代码，查看异步确认发布模式消耗的时间

这里因为是异步的，即代码执行完并输出耗时时间了，但消息监听器还在运行，所以还在时间输出后还在输出确认的消息

(3)处理异步未确认消息

已确认的消息没必要处理，而未确认的消息需要进行重新入队的处理，但由上述步骤(2)的效果图可看出程序在执行完后监听器还在监听消息是否确认成功，而要怎么做才能在程序执行完后再处理监听器监听出来未确认的消息呢？最好的解决方案便是把未确认的消息放在一个基于内存的能被发布线程访问到的队列里，例如就用ConcurrentSkipListMap这个集合在confirm（发布确认）、 callbacks（回调）与发布线程之间进行消息的传递；实现的思路是先用ConcurrentSkipListMap记录发送的所有消息，然后监听器监听消息，确认消息成功后会执行消息确认成功的回调函数，而回调函数执行删除ConcurrentSkipListMap集合里当前被确认的消息的操作，最后ConcurrentSkipListMap里剩下的就是未确认成功的消息

代码如下：

```java
package com.ken.confirm;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConfirmCallback;
import java.util.concurrent.ConcurrentNavigableMap;
import java.util.concurrent.ConcurrentSkipListMap;
/**
 * 发布确认模式：
 * 1、单个确认模式
 * 2、批量确认模式
 * 3、异步批量确认模式
 */
public class ConfirmMessage {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //批量发布消息的个数
    public static final int MESSAGE_COUNT = 1000;
    public static void main(String[] args) throws Exception{
        //3、异步批量确认模式
        ConfirmMessage.publishMessageAsync();
    }
    //异步发布确认
    public static void  publishMessageAsync() throws Exception {
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
        //开启发布确认
        channel.confirmSelect();
        /**
         * 线程安全有序的一个哈希表，适用于高并发的情况下
         * 功能：
         * 1、轻松的把序号（key）与消息(value)进行关联
         * 2、只要给了序号（key）就能批量删除条目
         * 3、支持高并发（多线程）
         */
        ConcurrentSkipListMap<Long,String> outStandingConfirms = new ConcurrentSkipListMap<>();
        //开始时间
        long begin = System.currentTimeMillis();
        /**
         * 消息确认成功回调函数
         * 第一个参数：消息的标记
         * 第二个参数：是否确立确认
         */
        ConfirmCallback ackCallback = (deliveryTag,  multiple) -> {
            //删除队列里所有已经确认的消息，剩下的就是未确认的消息
            if(multiple) {
                //multiple为true时将一次性ack所有小于deliveryTag的消息，headMap是用于获取第一个key到传入key的所有的key
                ConcurrentNavigableMap<Long, String> confirmed = outStandingConfirms.headMap(deliveryTag);
                System.out.println("确认的消息：" + deliveryTag);
                confirmed.clear();
            }else {
                outStandingConfirms.remove(deliveryTag);
            }
        };
        /**
         * 消息确认失败回调函数
         * 第一个参数：消息的标记
         * 第二个参数：是否确立确认
         */
        ConfirmCallback nackCallback = (deliveryTag,  multiple) -> {
            //打印未确认的消息
            String message = outStandingConfirms.get(deliveryTag);
            System.out.println("未确认的消息：" + message + "未确认消息的tag：" + deliveryTag);
        };
        /**
         * 消息监听器，用于监听消息发送是否成功
         * 第一个参数：消息确认成功回调函数
         * 第二个参数：消息确认失败回调函数
         */
        channel.addConfirmListener(ackCallback,nackCallback);
        //批量发消息
        for (int i = 0; i < MESSAGE_COUNT; i++) {
            String message = "消息" + i;
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
            //收集所有发送的消息(channel.getNextPublishSeqNo()用于获取下一次发布的序号)
            outStandingConfirms.put(channel.getNextPublishSeqNo(),message);
        }
        //结束时间
        long end = System.currentTimeMillis();
        System.out.println("发布" + MESSAGE_COUNT + "个异步发布确认消息，耗时" + (end - begin) + "ms");
    }
}
```

效果图：
