# 08、RocketMQ 实战 - 发送批量消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/8.html
- 分类：消息队列
- 分组：教程目录
## 发送批量消息

- 批量发送下消息
- 优点:能提高性能
- 缺点

一批消息只能有相同的topic,相同的waitStroeMsgOK
- 不能是延时消息
- 一批消息的总大小不能超过4MB

```java
public class BatchProducer {
    public static void main(String[] args) throws Exception {
        //初始化生产者
        DefaultMQProducer producer = new DefaultMQProducer("producer_group");
        //指定nameServer地址
        producer.setNamesrvAddr("localhost:9876");
        //启动
        producer.start();
        List<Message> msgs = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            //创建消息,指定topic,tag和消息体
            Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            msgs.add(msg);
        }
        //批量发送
        SendResult result = producer.send(msgs);
        System.out.println(result);
        //关闭
        producer.shutdown();
    }
}
```

- 针对总长度不能超过4MB,可以调用以下这个工具类

```java
public class Listsplitter implements Iterator<List<Message>> {
   private final int SIZE_LIMIT = 1024 * 1024 * 4;
   private final List<Message> messages;
   private int currIndex;
   public Listsplitter(List<Message> messages) {
       this.messages = messages;
   }
   @Override
   public boolean hasNext() {
       return currIndex < messages.size();
   }
   @Override
   public List<Message> next() {
       int nextIndex = currIndex;
       int totalSize = 0;
       for (;nextIndex < messages.size();nextIndex ++){
           Message message = messages.get(nextIndex);
           int tmpSize = message.getTopic().length()+message.getBody().length;
           Map<String, String> properties = message.getProperties();
           for (Map.Entry<String, String> entry : properties.entrySet()) {
             tmpSize += entry.getKey().length()+entry.getValue().length();
           }
           tmpSize = tmpSize + 20;//增加日志的开销20字节
           if (tmpSize > SIZE_LIMIT){
               //单条消息超过了最大的限制
               //忽略,否则会阻塞分裂的进程
               if (nextIndex - currIndex == 0){
                 //假如下一个子列表没有元素,则添加这个子列表然后退出循环,否则只是退出循环
                   nextIndex ++;
               }
               break;
           }
           if (tmpSize + totalSize > SIZE_LIMIT){
               break;
           }else{
               totalSize += tmpSize;
           }
       }
       List<Message> subList = messages.subList(currIndex,nextIndex);
       currIndex = nextIndex;
       return subList;
   }
}
```

- 生产者就变成了这样

```java
public class BatchProducer {
   public static void main(String[] args) throws Exception {
       //初始化生产者
       DefaultMQProducer producer = new DefaultMQProducer("producer_group");
       //指定nameServer地址
       producer.setNamesrvAddr("localhost:9876");
       //启动
       producer.start();
       List<Message> msgs = new ArrayList<>();
       for (int i = 0; i < 100; i++) {
           //创建消息,指定topic,tag和消息体
           Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
           msgs.add(msg);
       }
       Listsplitter listsplitter = new Listsplitter(msgs);
       while (listsplitter.hasNext()){
           List<Message> next = listsplitter.next();
           //批量发送
           SendResult result = producer.send(next);
           System.out.println(result);
       }
       //关闭
       producer.shutdown();
   }
}
```
