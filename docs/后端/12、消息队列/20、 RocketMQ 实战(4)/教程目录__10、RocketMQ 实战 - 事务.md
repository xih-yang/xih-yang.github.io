# 10、RocketMQ 实战 - 事务
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/10.html
- 分类：消息队列
- 分组：教程目录
## 事务

### 事务消息的发送和提交

- 发送消息(half消息)
- 服务端响应消息写入结果
- 根据发送结果执行本地事务(如果写入失败,辞职half消息对业务不可见,本地逻辑不执行)
- 根据本地事务状态进行Commit或Rollbace(commit之后对消费者可见)

### 事务补偿

- 对没有commit/rollback的事务消息(pending状态的消息),从服务端发起一次回查
- producer收到回查消息,检查回查消息对应的本地事务的状态
- 根据本地事务状态,重新commit或者rollback
- 补偿阶段是用来解决消息commit或rollback发生超时或失败的情况

### 事务消息状态

- TransactionStatus.CommitTransaction:提交事务,允许消费者消费此消息
- TransactionStatus.RollbackTransaction:回滚事务,该消息将被删除,不允许被消费
- TransactionStatus.Unknown:中间状态,需要检查消息队列来确定状态

### 生产者

```java
public class DefaultProducer {
  public static void main(String[] args) throws Exception {
      TransactionListrnerImpl listrner = new TransactionListrnerImpl();
      //初始化生产者
      TransactionMQProducer producer = new TransactionMQProducer("producer_group");
      //指定nameServer地址
      producer.setNamesrvAddr("localhost:9876");
      producer.setTransactionListener(listrner);
      //启动
      producer.start();
      for (int i = 0; i < 100; i++) {
          //创建消息,指定topic,tag和消息体
          Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
          //设置属性,可以在消费端进行筛选
          msg.putUserProperty("a",String.valueOf(i));
          //发送并有result返回,可根据result判断发送是否成功
          SendResult result = producer.sendMessageInTransaction(msg,null);
          System.out.println(result);
      }
      //关闭
      producer.shutdown();
  }
}
```

- 需要加一个事务监听器

```java
public class TransactionListrnerImpl implements TransactionListener {
   //判断这个消息是否需要回滚,还是提交
    @Override
    public LocalTransactionState executeLocalTransaction(Message message, Object o) {
        System.out.println("执行本地事务");
        if (message.getProperties().equals("a")) {
            return LocalTransactionState.COMMIT_MESSAGE;
        } else if (message.getProperties().equals("b")) {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        } else {
            return LocalTransactionState.UNKNOW;
        }
    }
//检验他自身携带的参数
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt messageExt) {
        System.out.println("mq检查自身携带的用户信息"+messageExt.getProperty("a"));
        return LocalTransactionState.COMMIT_MESSAGE;
    }
}
```

### 使用限制

- 事务消息不支持延时消息和批量消息
- 避免了单个消息被重复检查多次导致队列消息堆积,默认检查次数为15次,
- 可以修改检查次数,在broker的配置文件中修改参数transactionCheckMax
- 超过transactionCheckMax次数后,broker将丢弃这个消息,并打印错误日志,可以重写AbstracttransactionCheckLinstener类来修改这个行为
- 事务消息在多长时间后开始被检查,在broker配置文件中的transactionMsgTimeout设定,也可以发送消息时设置用户属性CHECK_IMMUNITY_TIME_IN_SECONDS来覆盖

broker上的配置
- 事务性消息可能不止一次被检查和消费
- 提交目标的主题消息可能会失败,事务消息的高可用,依赖于rocketMQ本身的高可用机制,最好选用同步的双重写入机制
- 事务消息生产者id和其他类型的生产者id不能共享,因为事务消息允许通过生产者id反向查询找到消费者
