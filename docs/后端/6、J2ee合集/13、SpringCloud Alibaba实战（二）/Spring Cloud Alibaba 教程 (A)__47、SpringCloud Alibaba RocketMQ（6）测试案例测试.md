# 47、SpringCloud Alibaba RocketMQ（6）测试案例测试
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/80.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.启动服务

启动 2 个服务：

rocketmq-produce-example

rocketmq-consumer-example

## 2.发送消息测试

### 2.1 发送简单的字符串

http://localhost:28081/send/simple?msg=RocketMQ

### 2.2 发送对象消息

http://localhost:28081/send/object?id=1&userName=dqcgm&password=123456&tags=xxx

### 2.3 发送事务消息

http://localhost:28081/send/transaction?msg=order&num=1

http://localhost:28081/send/transaction?msg=order&num=2

http://localhost:28081/send/transaction?msg=order&num=3

## 2.4 手动拉取消息

http://localhost:28081/send/poll?msg=order
