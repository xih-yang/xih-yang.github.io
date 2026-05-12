# 17、Kafka 源码解析 - Kafka 0.11客户端集群管理工具AdminClient
- 来源：https://ddkk.com/zhuanlan/mq/kafka/8/17.html
- 分类：消息队列
- 分组：教程目录
很多用户都有直接使用程序API操作Kafka集群的需求。在0.11版本之前，kafka的服务器端代码(即添加kafka_2.**依赖)提供了AdminClient和AdminUtils可以提供部分的集群管理操作，但社区官网主页并没有给出这两个类的使用文档。用户只能自行查看源代码和测试用例才能了解具体的使用方法。倘若使用客户端API的话(即添加kafka_clients依赖)，用户必须构造特定的请求并自行编写代码向指定broker创建Socket连接并发送请求，同样是十分繁琐。故Kafka 0.11版本引入了客户端的AdminClient工具。注意，虽然和原先服务器端的AdminClient类同名，但这个工具是属于客户端的，因此需要在程序中添加kafka_clients依赖，比如Gradle的话则增加 compile group: 'org.apache.kafka', name: 'kafka-clients', version: '0.11.0.0'

**该工具提供的所有功能包括**：

- 创建topic
- 查询所有topic
- 查询单个topic详情
- 删除topic
- 修改config（包括BROKER和TOPIC资源的config）
- 查询资源config详情
- 创建ACL
- 查询ACL详情
- 删除ACL
- 查询整个集群详情

用户使用该类的方式与Java clients的使用方式一致，不用连接Zookeeper，而是直接给定集群中的broker列表。另外该类是线程安全的，因此可以放心地在多个线程中使用该类的实例。AdminClient的实现机制与[《Java API方式调用Kafka各种协议》](http://www.cnblogs.com/huxi2b/p/6508274.html)一文中的方式完全一样：都是在后台自行构建Kafka的各种请求然后发送，只不过所有的细节AdminClient都帮用户实现了，用户不再自己编写底层的各种功能代码了。

下面给出一个该类的测试实例，列出了除ACL操作之外的所有操作样例代码，如下所示：

```java
public class AdminClientTest {
    private static final String TEST_TOPIC = "test-topic";
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092,localhost:9093");
        try (AdminClient client = AdminClient.create(props)) {
            describeCluster(client);
            createTopics(client);
            listAllTopics(client);
            describeTopics(client);
            alterConfigs(client);
            describeConfig(client);
            deleteTopics(client);
        }
    }
    /**
     * describe the cluster
     * @param client
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public static void describeCluster(AdminClient client) throws ExecutionException, InterruptedException {
        DescribeClusterResult ret = client.describeCluster();
        System.out.println(String.format("Cluster id: %s, controller: %s", ret.clusterId().get(), ret.controller().get()));
        System.out.println("Current cluster nodes info: ");
        for (Node node : ret.nodes().get()) {
            System.out.println(node);
        }
    }
    /**
     * describe topic's config
     * @param client
     */
    public static void describeConfig(AdminClient client) throws ExecutionException, InterruptedException {
        DescribeConfigsResult ret = client.describeConfigs(Collections.singleton(new ConfigResource(ConfigResource.Type.TOPIC, TEST_TOPIC)));
        Map<ConfigResource, Config> configs = ret.all().get();
        for (Map.Entry<ConfigResource, Config> entry : configs.entrySet()) {
            ConfigResource key = entry.getKey();
            Config value = entry.getValue();
            System.out.println(String.format("Resource type: %s, resource name: %s", key.type(), key.name()));
            Collection<ConfigEntry> configEntries = value.entries();
            for (ConfigEntry each : configEntries) {
                System.out.println(each.name() + " = " + each.value());
            }
        }
    }
    /**
     * alter config for topics
     * @param client
     */
    public static void alterConfigs(AdminClient client) throws ExecutionException, InterruptedException {
        Config topicConfig = new Config(Arrays.asList(new ConfigEntry("cleanup.policy", "compact")));
        client.alterConfigs(Collections.singletonMap(
                new ConfigResource(ConfigResource.Type.TOPIC, TEST_TOPIC), topicConfig)).all().get();
    }
    /**
     * delete the given topics
     * @param client
     */
    public static void deleteTopics(AdminClient client) throws ExecutionException, InterruptedException {
        KafkaFuture<Void> futures = client.deleteTopics(Arrays.asList(TEST_TOPIC)).all();
        futures.get();
    }
    /**
     * describe the given topics
     * @param client
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public static void describeTopics(AdminClient client) throws ExecutionException, InterruptedException {
        DescribeTopicsResult ret = client.describeTopics(Arrays.asList(TEST_TOPIC, "__consumer_offsets"));
        Map<String, TopicDescription> topics = ret.all().get();
        for (Map.Entry<String, TopicDescription> entry : topics.entrySet()) {
            System.out.println(entry.getKey() + " ===> " + entry.getValue());
        }
    }
    /**
     * create multiple sample topics
     * @param client
     */
    public static void createTopics(AdminClient client) throws ExecutionException, InterruptedException {
        NewTopic newTopic = new NewTopic(TEST_TOPIC, 3, (short)3);
        CreateTopicsResult ret = client.createTopics(Arrays.asList(newTopic));
        ret.all().get();
    }
    /**
     * print all topics in the cluster
     * @param client
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public static void listAllTopics(AdminClient client) throws ExecutionException, InterruptedException {
        ListTopicsOptions options = new ListTopicsOptions();
        options.listInternal(true); // includes internal topics such as __consumer_offsets
        ListTopicsResult topics = client.listTopics(options);
        Set<String> topicNames = topics.names().get();
        System.out.println("Current topics in this cluster: " + topicNames);
    }
}
```

最后提一句，由于该类本质上是异步发送请求然后等待操作处理结果，因此每个返回的结果都使用了KafkaFuture进行了封装——KafkaFuture实现了Java的Future接口。既然是Future，那么用户在具体实现上便可以自行决定是异步接收结果还是同步等待。本例中大量使用了KafkaFuture.get()，即同步等待结果。
