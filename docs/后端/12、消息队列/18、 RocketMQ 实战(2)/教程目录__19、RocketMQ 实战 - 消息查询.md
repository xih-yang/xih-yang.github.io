# 19、RocketMQ 实战 - 消息查询
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/19.html
- 分类：消息队列
- 分组：教程目录
RocketMQ支持按照下面两种维度（“按照Message Id查询消息”、“按照Message Key查询消息”）进行消息查询。在RocketMQ dashboard中：

点击消息，可以选择Message Id和Message Key查询。

### 按照MessageId查询消息

RocketMQ中的MessageId的长度总共有16字节，其中包含了消息存储主机地址（IP地址和端口），消息Commit Log offset。“按照MessageId查询消息”在RocketMQ中具体做法是：Client端从MessageId中解析出Broker的地址（IP地址和端口）和Commit Log的偏移地址后封装成一个RPC请求后通过Remoting通信层发送（业务请求码：VIEW_MESSAGE_BY_ID）。Broker端走的是QueryMessageProcessor，读取消息的过程用其中的 commitLog offset 和 size 去 commitLog 中找到真正的记录并解析成一个完整的消息返回。

### 按照Message Key查询消息

“按照Message Key查询消息”，主要是基于RocketMQ的[IndexFile索引文件](/zhuanlan/mq/rocketmq/6/17.html)来实现的。RocketMQ的具体做法是，主要通过Broker端的QueryMessageProcessor业务处理器来查询，读取消息的过程就是用topic和key找到IndexFile索引文件中的一条记录，根据其中的commitLog offset从CommitLog文件中读取消息的实体内容。Index索引文件中保存了key的hash值，broker返回数据后，客户端还要将key与返回的数据对比。过滤不符合条件的数据。
