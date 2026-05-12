# 07、ElasticSearch 实战：Java操作elasticsearch基于smartcn中文分词查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/7.html
- 分类：搜索引擎
- 分组：教程目录
```java
 1 package com.gxy.ESChap01;
 2 
 3 import java.net.InetAddress;
 4 
 5 import org.elasticsearch.action.search.SearchRequestBuilder;
 6 import org.elasticsearch.action.search.SearchResponse;
 7 import org.elasticsearch.client.transport.TransportClient;
 8 import org.elasticsearch.common.settings.Settings;
 9 import org.elasticsearch.common.transport.InetSocketTransportAddress;
10 import org.elasticsearch.index.query.QueryBuilder;
11 import org.elasticsearch.index.query.QueryBuilders;
12 import org.elasticsearch.search.SearchHit;
13 import org.elasticsearch.search.SearchHits;
14 import org.elasticsearch.transport.client.PreBuiltTransportClient;
15 import org.junit.After;
16 import org.junit.Before;
17 import org.junit.Test;
18 /**
19  * 使用smartcn分词查询
20  * @author 郭祥跃
21  *
22  */
23 public class ESQuerySmartcn {
24     private static String host="192.168.56.3"; // 服务器地址
25     private static int port=9300; // 端口
26     
27     public static final String CLUSTER_NAME = "my-application"; //集群名称
28     
29     private TransportClient client=null;
30     
31     private static final String ANALYZER="smartcn";
32     
33     private static Settings settings= Settings.builder()
34             .put("cluster.name",CLUSTER_NAME)
35             .put("client.transport.sniff", true)
36             .build();
37     
38     //获取客户端
39     @SuppressWarnings({ "resource", "unchecked" })
40     @Before
41     public void getClient() throws Exception {
42         try {
43             client = new PreBuiltTransportClient(settings)
44                     .addTransportAddress(new InetSocketTransportAddress(InetAddress.getByName(host),port));
45         } catch (Exception e) {
46             // TODO Auto-generated catch block
47             e.printStackTrace();
48         }
49     }
50     
51     //关闭客户端
52     @After
53     public void close() {
54         if(client!=null) {
55             client.close();
56         }
57     }
58     /**
59      * 条件分词查询
60      */
61     @Test
62     public void search() {
63         SearchRequestBuilder srb=client.prepareSearch("book").setTypes("kehuan");
64         SearchResponse sr=srb.setQuery(QueryBuilders.matchQuery("title", "三体").analyzer(ANALYZER))
65                 .setFetchSource(new String[] {"title","price"},null)
66                 .execute()
67                 .actionGet();
68         SearchHits hits=sr.getHits();
69         for(SearchHit hit:hits){
70             System.out.println(hit.getSourceAsString());
71         }
72     }
73     /**
74      * 多字段条件分词查询
75      */
76     @Test
77     public void search2() {
78         SearchRequestBuilder srb=client.prepareSearch("book").setTypes("kehuan");
79         SearchResponse sr=srb.setQuery(QueryBuilders.multiMatchQuery("美国宇宙红岸", "title","content")
80                 .analyzer(ANALYZER))
81                 .setFetchSource(new String[] {"title","price"},null)
82                 .execute()
83                 .actionGet();
84         SearchHits hits=sr.getHits();
85         for(SearchHit hit:hits){
86             System.out.println(hit.getSourceAsString());
87         }
88     }
89 }
```
