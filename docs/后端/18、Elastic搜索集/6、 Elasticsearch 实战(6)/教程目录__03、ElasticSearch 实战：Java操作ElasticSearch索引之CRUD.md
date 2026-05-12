# 03、ElasticSearch 实战：Java操作ElasticSearch索引之CRUD
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/3.html
- 分类：搜索引擎
- 分组：教程目录
```java
  1 package com.gxy.ESChap01;
  2 
  3 import java.net.InetAddress;
  4 import java.util.HashMap;
  5 import java.util.Map;
  6 
  7 import org.elasticsearch.action.delete.DeleteResponse;
  8 import org.elasticsearch.action.get.GetResponse;
  9 import org.elasticsearch.action.index.IndexResponse;
 10 import org.elasticsearch.action.update.UpdateRequest;
 11 import org.elasticsearch.action.update.UpdateResponse;
 12 import org.elasticsearch.client.transport.TransportClient;
 13 import org.elasticsearch.common.settings.Settings;
 14 import org.elasticsearch.common.transport.InetSocketTransportAddress;
 15 import org.elasticsearch.common.xcontent.XContentFactory;
 16 import org.elasticsearch.common.xcontent.XContentType;
 17 import org.elasticsearch.transport.client.PreBuiltTransportClient;
 18 import org.junit.After;
 19 import org.junit.Before;
 20 import org.junit.Test;
 21 
 22 import com.google.gson.JsonObject;
 23 
 24 
 25 public class ESIndex {
 26     
 27     private static String host="192.168.56.3"; // 服务器地址
 28     private static int port=9300; // 端口
 29     
 30     private TransportClient client=null;
 31     
 32     
 33     //获取客户端
 34     @SuppressWarnings({ "resource", "unchecked" })
 35     @Before
 36     public void getClient() throws Exception {
 37         try {
 38             client = new PreBuiltTransportClient(Settings.EMPTY)
 39                     .addTransportAddress(new InetSocketTransportAddress(InetAddress.getByName(host),port));
 40         } catch (Exception e) {
 41             // TODO Auto-generated catch block
 42             e.printStackTrace();
 43         }
 44     }
 45     
 46     //关闭客户端
 47     @After
 48     public void close() {
 49         if(client!=null) {
 50             client.close();
 51         }
 52     }
 53     /***
 54      * 创建索引，添加文档
 55      * @throws Exception 
 56      */
 57     @Test
 58     public void testIndex() throws Exception {
 59         IndexResponse response=client.prepareIndex("book","java","1")
 60                 .setSource(XContentFactory.jsonBuilder()
 61                         .startObject()
 62                         .field("name","MySQL从入门到删库跑路")
 63                         .field("publishDate","2012-11-11")
 64                         .field("price",100)
 65                         .endObject()).get();
 66         System.out.println("索引名称："+response.getIndex());
 67         System.out.println("类型:"+response.getType());
 68         System.out.println("文档ID："+response.getId());
 69         System.out.println("当前实例状态："+response.status());
 70         
 71     }
 72     /**
 73      * 添加文档，创建索引
 74      */
 75     @Test
 76     public void TestIndex2() {
 77         JsonObject jsonObiect=new JsonObject();
 78         jsonObiect.addProperty("name", "java从入门到放弃");
 79         jsonObiect.addProperty("publishDate", "2018-05-06");
 80         jsonObiect.addProperty("price", 62);
 81         System.out.println(jsonObiect);
 82         IndexResponse response=client.prepareIndex("book", "java", "2")
 83                 .setSource(jsonObiect.toString(), XContentType.JSON).get();
 84         System.out.println("索引名称："+response.getIndex());
 85         System.out.println("类型："+response.getType());
 86         System.out.println("文档ID："+response.getId());
 87         System.out.println("当前实例状态："+response.status());
 88         
 89     }
 90     
 91     /**
 92      * 根据ID获取文档
 93      */
 94     @Test
 95     public void testGetById() {
 96         GetResponse response=client.prepareGet("book","java","1").get();
 97         System.out.println(response.getSourceAsString());
 98     }
 99     /***
100      * 根据ID修改文档
101      * @throws Exception 
102      * @throws InterruptedException 
103      */
104     @Test
105     public void testUpdate() throws InterruptedException, Exception {
106         UpdateRequest request=new UpdateRequest("book","java","1");
107         Map<String,Object> source = new HashMap<String, Object>();
108         source.put("name", "python网络爬虫");
109         source.put("publishDate", "2012-11-12");
110         source.put("price", 102);
111         request.doc(source);
112         UpdateResponse response=client.update(request).get();
113         System.out.println("索引名称："+response.getIndex());
114         System.out.println("类型："+response.getType());
115         System.out.println("文档ID："+response.getId());
116         System.out.println("当前实例状态："+response.status());
117     }
118     /**
119      * 根据ID删除文档
120      */
121     @Test
122     public void testDelete() {
123         DeleteResponse response=client.prepareDelete("book","java","1").get();
124         System.out.println("索引名称："+response.getIndex());
125         System.out.println("类型："+response.getType());
126         System.out.println("文档ID："+response.getId());
127         System.out.println("当前实例状态："+response.status());
128     }
129 }
```

注意：ElasticSearch中通过HTTP请求的端口为9200，通过Java API 请求的端口为9300！！！
