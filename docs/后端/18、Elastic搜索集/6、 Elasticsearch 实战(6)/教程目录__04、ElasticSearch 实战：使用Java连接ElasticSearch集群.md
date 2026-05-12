# 04、ElasticSearch 实战：使用Java连接ElasticSearch集群
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/4.html
- 分类：搜索引擎
- 分组：教程目录
```java
 1 public class ESIndexMapping {
 2     
 3     private static String host="192.168.56.3"; // 服务器地址
 4     private static int port=9300; // 端口
 5     
 6     public static final String CLUSTER_NAME = "my-application"; //集群名称
 7     
 8     private TransportClient client=null;
 9     
10     private static Settings settings= Settings.builder()
11             .put("cluster.name",CLUSTER_NAME)
12             .put("client.transport.sniff", true)
13             .build();
14     
15     //获取客户端
16     @SuppressWarnings({ "resource", "unchecked" })
17     @Before
18     public void getClient() throws Exception {
19         try {
20             client = new PreBuiltTransportClient(settings)
21                     .addTransportAddress(new InetSocketTransportAddress(InetAddress.getByName(host),port));
22         } catch (Exception e) {
23             // TODO Auto-generated catch block
24             e.printStackTrace();
25         }
26     }
27     
28     //关闭客户端
29     @After
30     public void close() {
31         if(client!=null) {
32             client.close();
33         }
34     }
35 }
```
