# 14、SpringBoot 整合 ActiveMQ 关闭持久化不起作用
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/14.html
- 分类：消息队列
- 分组：教程目录
需要写jmsTemplate.setExplicitQosEnabled(true);

```java
@Bean
public JmsTemplate jmsTemplate(ActiveMQConnectionFactory connectionFactory) {
    JmsTemplate jmsTemplate = new JmsTemplate();
    jmsTemplate.setConnectionFactory(connectionFactory);
    //deliveryMode, priority, timeToLive 的开关，要生效，必须配置为true，默认false
    jmsTemplate.setExplicitQosEnabled(true);
    // 持久化消息
    jmsTemplate.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
    // 是否开启事务
    jmsTemplate.setSessionTransacted(false);
    // 消费者receive消息后必须手动的调用acknowledge()方法进行签收
    jmsTemplate.setSessionAcknowledgeMode(Session.CLIENT_ACKNOWLEDGE);
    return jmsTemplate;
}
```
