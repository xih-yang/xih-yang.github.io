# 04、Kafka 实战 - 数据日志分离
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/4.html
- 分类：消息队列
- 分组：教程目录
> 数据日志分离

**安装的时候直接设置别的目录，就不需要这么操作了**

在安装的时候，在配置文件`server.properties`中设置的地址是`/opt/kafka/logs`，但是创建topic后，相关日志及topic数据都在这个目录

在kafka目录下新建一个`data`目录，然后编辑`server.properties`

```java
log.dirs=/opt/kafka/data
```

**需要重启zk和kafka，并且zk中的kafka数据需要删除**
