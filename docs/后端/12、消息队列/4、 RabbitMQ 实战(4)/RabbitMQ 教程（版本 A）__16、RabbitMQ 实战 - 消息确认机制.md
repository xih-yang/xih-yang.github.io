# 16、RabbitMQ 实战 - 消息确认机制
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/16.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
两种解决方案:

**1、** AMQP事务机制；

**2、** Confirm模式；

## 一、事务机制

事务机制分为三部分，开启事务，提交事务，事务回滚，如下：

**1、** txSelect将当前channel通道设置为transaction模式（开启事务）；

**2、** txCommit提交当前事务；

**3、** txRollback事务回滚；

我们通过一个例子模拟消息生产者发送消息过程发生异常，进行事务回滚的过程。

```java
public class Producer {
    /** 队列名称 */
    private static final String QUEUE_NAME = "test_queue";
    public static void main(String[] args) throws IOException, TimeoutException {
        /** 1.获取连接 */
        Connection newConnection = MQConnectionUtils.newConnection();
         /** 2.创建通道 */
        Channel channel = newConnection.createChannel();
         /** 3.创建队列声明 */
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        /** 4.发送消息 */
        try {
            /** 4.1 开启事务 */
            channel.txSelect();
            String msg = "我是生产者生成的消息";
            System.out.println("生产者发送消息："+msg);
            channel.basicPublish("", QUEUE_NAME, null, msg.getBytes());
            /** 4.2 提交事务 - 模拟异常 */
            int i = 1/0;
            channel.txCommit();
        }catch (Exception e){
            e.printStackTrace();
            System.out.println("发生异常，我要进行事务回滚了！");
            /** 4.3 事务回滚 */
            channel.txRollback();
        }finally {
            channel.close();
            newConnection.close();
        }
    }
}
```

```java
打印结果：
生产者发送消息：我是生产者生成的消息
java.lang.ArithmeticException: / by zero at club.sscai.producer.Producer.main(Producer.java:37)
发生异常，我要进行事务回滚了！
```

## 二、Confirm模式

像上方这种采用 AMQP 事务机制来保证消息的准确到达，在一定程度上是消耗了性能的，所以我们再来看看 Confirm 模式。

Confirm 模式分为两块，一是生产者的 Confirm 模式，再就是消费者的 Confirm 模式。

#### 2.1 生产者

通过生产者的确认模式我们是要保证消息准确达到客户端，而与 AMQP 事务不同的是 Confirm 是针对一条消息的，而事务是可以针对多条消息的。

Confirm 模式最大的好处在于它是异步的，一旦发布一条消息，生产者应用程序就可以在等信道返回确认的同时继续发送下一条消息，当消息最终得到确认之后，生产者应用便可以通过回调方法来处理该确认消息。

Confirm 的三种实现方式：

**1、** channel.waitForConfirms()普通发送方确认模式；

**2、** channel.waitForConfirmsOrDie()批量确认模式；

**3、** channel.addConfirmListener()异步监听发送方确认模式；

#### 2.1.1 普通Confirm模式

```java
public class Producer11 {
    /** 队列名称 */
    private static final String QUEUE_NAME = "test_queue";
    public static void main(String[] args) throws IOException, TimeoutException {
        /** 1.获取连接 */
        Connection newConnection = MQConnectionUtils.newConnection();
        /** 2.创建通道 */
        Channel channel = newConnection.createChannel();
        /** 3.创建队列声明 */
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        /** 4.开启发送方确认模式 */
        channel.confirmSelect();
        /** 5.发送消息 */
        for (int i = 0; i < 5; i++) {
            channel.basicPublish("", QUEUE_NAME, MessageProperties.PERSISTENT_BASIC, (" Confirm模式， 第" + (i + 1) + "条消息").getBytes());
            try {
                if (channel.waitForConfirms()) {
                    System.out.println("发送成功");
                }else{
                    System.out.println("进行消息重发");
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        /** 5.关闭通道、连接 */
        channel.close();
        newConnection.close();
    }
}
```

在推送消息之前，**channel.confirmSelect()** 声明开启发送方确认模式，再使用**channel.waitForConfirms()** 等待消息被服务器确认即可。

#### 2.1.2 批量Confirm模式

```java
public class Producer22 {
    /** 队列名称 */
    private static final String QUEUE_NAME = "test_queue";
    public static void main(String[] args) throws IOException, TimeoutException, InterruptedException {
        /** 1.获取连接 */
        Connection newConnection = MQConnectionUtils.newConnection();
        /** 2.创建通道 */
        Channel channel = newConnection.createChannel();
        /** 3.创建队列声明 */
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        /** 4.开启发送方确认模式 */
        channel.confirmSelect();
        /** 5.发送消息 */
        for (int i = 0; i < 5; i++) {
            channel.basicPublish("", QUEUE_NAME, null, (" Confirm模式， 第" + (i + 1) + "条消息").getBytes());
        }
        /** 6.直到所有信息都发布，只要有一个未确认就会IOException */
        channel.waitForConfirmsOrDie();
        System.out.println("全部执行完成");
        /** 5.关闭通道、连接 */
        channel.close();
        newConnection.close();
    }
}
```

**channel.waitForConfirmsOrDie()** 使用同步方式等所有的消息发送之后才会执行后面代码，只要有一个消息未被确认就会抛出 IOException 异常。

#### 2.1.3 异步Confirm模式

```java
public class Producer33 {
    /** 队列名称 */
    private static final String QUEUE_NAME = "test_queue";
    public static void main(String[] args) throws IOException, TimeoutException {
        /** 1.获取连接 */
        Connection newConnection = MQConnectionUtils.newConnection();
        /** 2.创建通道 */
        Channel channel = newConnection.createChannel();
        /** 3.创建队列声明 */
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        /** 4.开启发送方确认模式 */
        channel.confirmSelect();
        for (int i = 0; i < 10; i++) {
            String message = "我是生产者生成的消息：" + i;
            channel.basicPublish("", QUEUE_NAME, null, message.getBytes("UTF-8"));
        }
        /** 5.发送消息 异步监听确认和未确认的消息 */
        channel.addConfirmListener(new ConfirmListener() {
            @Override
            public void handleNack(long deliveryTag, boolean multiple) throws IOException {
                System.out.println("未确认消息，标识：" + deliveryTag);
            }
            @Override
            public void handleAck(long deliveryTag, boolean multiple) throws IOException {
                System.out.println(String.format("已确认消息，标识：%d，多个消息：%b", deliveryTag, multiple));
            }
        });
        /** 6.关闭通道、连接 */
        /** channel.close();*/
        /** newConnection.close();*/
    }
}
```

异步模式的优点，就是执行效率高，不需要等待消息执行完，只需要监听消息即可，以上异步返回的信息如下：

可以看出，代码是异步执行的，消息确认有可能是批量确认的，是否批量确认在于返回的 multiple 的参数，此参数为 bool 值，如果 true 表示批量执行了 deliveryTag 这个值以前的所有消息，如果为 false 的话表示单条确认。

> 维持异步调用要求我们不能断掉连接，因此注释掉第6步。

#### 2.2 消费者

为了保证消息从队列可靠地到达消费者，RabbitMQ 提供消息确认机制(message acknowledgment)。消费者在声明队列时，可以指定 noAck 参数，当 noAck=false 时， RabbitMQ 会等待消费者显式发回ack信号后才从内存(和磁盘，如果是持久化消息的话)中移去消息。否则，RabbitMQ 会在队列中消息被消费后立即删除它。

在消费者中 Confirm 模式又分为手动确认和自动确认。

关于两者的介绍：

**自动确认：** 在自动确认模式下，消息在发送后立即被认为是发送成功。 这种模式可以提高吞吐量（只要消费者能够跟上），不过会降低投递和消费者处理的安全性。 这种模式通常被称为“发后即忘”。 与手动确认模式不同，如果消费者的TCP连接或信道在成功投递之前关闭，该消息则会丢失。

**手动确认：** 使用自动确认模式时需要考虑的另一件事是消费者过载。 手动确认模式通常与有限的信道预取一起使用，限制信道上未完成（“进行中”）传送的数量。 然而，对于自动确认，根据定义没有这样的限制。 因此，消费者可能会被交付速度所压倒，可能积压在内存中，堆积如山，或者被操作系统终止。 某些客户端库将应用TCP反压（直到未处理的交付积压下降超过一定的限制时才停止从套接字读取）。 因此，只建议当消费者可以有效且稳定地处理投递时才使用自动投递方式。

> 综上：尽量选择手动确认方式。

主要实现代码：

```java
// 手动确认消息
channel.basicAck(envelope.getDeliveryTag(), false);
// 关闭自动确认
boolean autoAck = false;
channel.basicConsume(QUEUE_NAME, autoAck, consumer);
```

三、其他

**1、如果 RabbitMQ 服务器宕机了，消息会丢失吗？**

> 不会丢失，RabbitMQ 服务器支持消息持久化机制，会把消息持久化到硬盘上。

**2、如何确保消息正确地发送至RabbitMQ？**

> RabbitMQ 使用发送方确认模式，确保消息正确地发送到 RabbitMQ。
>
> 发送方确认模式：将信道设置成 confirm 模式（发送方确认模式），则所有在信道上发布的消息都会被指派一个唯一的ID。一旦消息被投递到目的队列后，或者消息被写入磁盘后（可持久化的消息），信道会发送一个确认给生产者（包含消息唯一ID）。如果RabbitMQ发生内部错误从而导致消息丢失，会发送一条nack（not acknowledged，未确认）消息。
>
> 发送方确认模式是异步的，生产者应用程序在等待确认的同时，可以继续发送消息。当确认消息到达生产者应用程序，生产者应用程序的回调方法就会被触发来处理确认消息。
