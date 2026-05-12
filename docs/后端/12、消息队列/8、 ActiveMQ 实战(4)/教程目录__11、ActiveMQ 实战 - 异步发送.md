# 11、ActiveMQ 实战 - 异步发送
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/11.html
- 分类：消息队列
- 分组：教程目录
ActiveMQ官方说异步发送是很多模式下默认的传输方式，但是在发送非事物持久化消息的时候默认使用的是同步发送模式。同步发送时，Producer.send() 方法会被阻塞，直到 broker 发送一个确认消息给生产者，这个确认消息暗示生产者 broker 已经成功地将它发送的消息路由到目标目的并把消息保存到二级存储中。

同步发送持久消息能够提供更好的可靠性，但这潜在地影响了程序的相应速度，因为在接受到 broker 的确认消息之前应用程序或线程会被阻塞。如果应用程序能够容忍一些消息的丢失，那么可以使用异步发送。异步发送不会在受到 broker 的确认之前一直阻塞 Producer.send 方法。

有几种方式可以使用异步发送：

1、设置ConnectionFactory时指定使用异步

cf= new ActiveMQConnectionFactory("tcp://locahost:61616?jms.useAsyncSend=true");

2、不在构造函数中指定，而是修改ConnectionFactory的配置

((ActiveMQConnectionFactory)connectionFactory).setUseAsyncSend(true);

3、在实例化后的ActiveMQConnection对象中设置异步发送

((ActiveMQConnection)connection).setUseAsyncSend(true)

发送回调

```java
producer.send(msg, new AsyncCallback() {
             @Override
             public void onSuccess() {
                       System.out.println(msgid+" has been successfully sent.");
             }
             @Override
             public void onException(JMSException exception) {
                       System.out.println(msgid+" fail to send to mq.");
                       exception.printStackTrace();
             }
   });
```
