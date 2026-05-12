# 05、ElasticSearch 实战：Java操作ElasticSearch执行查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/5.html
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
 14 import org.elasticsearch.search.fetch.subphase.highlight.HighlightBuilder;
 15 import org.elasticsearch.search.sort.SortOrder;
 16 import org.elasticsearch.transport.client.PreBuiltTransportClient;
 17 import org.junit.After;
 18 import org.junit.Before;
 19 import org.junit.Test;
 20 
 21 public class ESQuery {
 22     private static String host="192.168.56.3"; // 服务器地址
 23     private static int port=9300; // 端口
 24     
 25     public static final String CLUSTER_NAME = "my-application"; //集群名称
 26     
 27     private TransportClient client=null;
 28     
 29     private static Settings settings= Settings.builder()
 30             .put("cluster.name",CLUSTER_NAME)
 31             .put("client.transport.sniff", true)
 32             .build();
 33     
 34     //获取客户端
 35     @SuppressWarnings({ "resource", "unchecked" })
 36     @Before
 37     public void getClient() throws Exception {
 38         try {
 39             client = new PreBuiltTransportClient(settings)
 40                     .addTransportAddress(new InetSocketTransportAddress(InetAddress.getByName(host),port));
 41         } catch (Exception e) {
 42             // TODO Auto-generated catch block
 43             e.printStackTrace();
 44         }
 45     }
 46     
 47     //关闭客户端
 48     @After
 49     public void close() {
 50         if(client!=null) {
 51             client.close();
 52         }
 53     }
 54     
 55     /**
 56      * 查询所有
 57      */
 58     @Test
 59     public void searchAll() {
 60         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
 61         SearchResponse sr=srb.setQuery(QueryBuilders.matchAllQuery()).execute().actionGet();//查询所有
 62         SearchHits hits=sr.getHits();
 63         for(SearchHit hit:hits) {
 64             System.out.println(hit.getSourceAsString());
 65         }
 66     }
 67     /**
 68      * 分页查询
 69      */
 70     @Test
 71     public void searchPaging() {
 72         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
 73         SearchResponse sr=srb.setQuery(QueryBuilders.matchAllQuery()).setFrom(0).setSize(2).execute().actionGet();
 74         SearchHits hits=sr.getHits();
 75         for (SearchHit hit : hits) {
 76             System.out.println(hit.getSourceAsString());
 77         }
 78     }
 79     /**
 80      * 排序查询
 81      */
 82     @Test
 83     public void searchOrderBy() {
 84         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
 85         SearchResponse sr=srb.setQuery(QueryBuilders.matchAllQuery())
 86                 .addSort("publishDate",SortOrder.DESC).execute().actionGet();
 87         SearchHits hits=sr.getHits();
 88         for (SearchHit hit : hits) {
 89             System.out.println(hit.getSourceAsString());
 90         }
 91     }
 92     /**
 93      * 数据列过滤查询
 94      */
 95     @Test
 96     public void searchInclude() {
 97         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
 98         SearchResponse sr=srb.setQuery(QueryBuilders.matchAllQuery())
 99                 .setFetchSource(new String[] {"title","price"},null)
100                 .execute()
101                 .actionGet();
102         SearchHits hits=sr.getHits();
103         for (SearchHit hit : hits) {
104             System.out.println(hit.getSourceAsString());
105         }
106     }
107     /***
108      * 简单条件查询
109      */
110     @Test
111     public void searchByCondition() {
112         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
113         SearchResponse sr=srb.setQuery(QueryBuilders.matchQuery("title","铁"))
114                 .setFetchSource(new String[] {"title","price"},null)
115                 .execute()
116                 .actionGet();
117         SearchHits hits=sr.getHits();
118         for (SearchHit hit : hits) {
119             System.out.println(hit.getSourceAsString());
120         }
121     }
122     /**
123      * 条件查询高亮实现
124      */
125     @Test
126     public void searchHighlight() {
127         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
128         HighlightBuilder highlightBuilder=new HighlightBuilder();
129         highlightBuilder.preTags("<h2>");
130         highlightBuilder.postTags("</h2>");
131         highlightBuilder.field("title");
132         SearchResponse sr=srb.setQuery(QueryBuilders.matchQuery("title","战"))
133                 .highlighter(highlightBuilder)
134                 .setFetchSource(new String[] {"title","price"},null)
135                 .execute()
136                 .actionGet();
137         SearchHits hits=sr.getHits();
138         for (SearchHit hit : hits) {
139             System.out.println(hit.getSourceAsString());
140             System.out.println(hit.getHighlightFields());
141         }
142     }
143     /**
144      * 多条件查询  must
145      */
146     @Test
147     public void searchMutil() {
148         SearchRequestBuilder srb =client.prepareSearch("film").setTypes("dongzuo");
149         QueryBuilder queryBuilder=QueryBuilders.matchPhraseQuery("title", "战");
150         QueryBuilder queryBuilder2=QueryBuilders.matchPhraseQuery("content", "星球");
151         SearchResponse sr=srb.setQuery(QueryBuilders.boolQuery()
152                 .must(queryBuilder)
153                 .must(queryBuilder2))
154                 .execute()
155                 .actionGet();
156         SearchHits hits=sr.getHits();
157         for (SearchHit hit : hits) {
158             System.out.println(hit.getSourceAsString());
159         }
160     }
161     
162     /**
163      * 多条件查询  mustNot
164      */
165     @Test
166     public void searchMutil2() {
167         SearchRequestBuilder srb =client.prepareSearch("film").setTypes("dongzuo");
168         QueryBuilder queryBuilder=QueryBuilders.matchPhraseQuery("title", "战");
169         QueryBuilder queryBuilder2=QueryBuilders.matchPhraseQuery("content", "武士");
170         SearchResponse sr=srb.setQuery(QueryBuilders.boolQuery()
171                 .must(queryBuilder)
172                 .mustNot(queryBuilder2))
173                 .execute()
174                 .actionGet();
175         SearchHits hits=sr.getHits();
176         for (SearchHit hit : hits) {
177             System.out.println(hit.getSourceAsString());
178         }
179     }
180     
181     /**
182      * 多条件查询  should提高得分
183      * @throws Exception
184      */
185     @Test
186     public void searchMutil3()throws Exception{
187         SearchRequestBuilder srb=client.prepareSearch("film").setTypes("dongzuo");
188         QueryBuilder queryBuilder=QueryBuilders.matchPhraseQuery("title", "战");
189         QueryBuilder queryBuilder2=QueryBuilders.matchPhraseQuery("content", "星球");
190         QueryBuilder queryBuilder3=QueryBuilders.rangeQuery("publishDate").gt("2018-01-01");
191         SearchResponse sr=srb.setQuery(QueryBuilders.boolQuery()
192                 .must(queryBuilder)
193                 .should(queryBuilder2)
194                 .should(queryBuilder3))
195             .execute()
196             .actionGet(); 
197         SearchHits hits=sr.getHits();
198         for(SearchHit hit:hits){
199             System.out.println(hit.getScore()+":"+hit.getSourceAsString());
200         }
201     }
202     /***
203      * 多条件查询 range限制范围
204      */
205     @Test
206     public void searchMutil4() {
207         SearchRequestBuilder srb = client.prepareSearch("film").setTypes("dongzuo");
208         QueryBuilder queryBuilder=QueryBuilders.matchPhraseQuery("title", "战");
209         QueryBuilder queryBuilder2=QueryBuilders.rangeQuery("price").lte(40);
210         SearchResponse sr=srb.setQuery(QueryBuilders.boolQuery()
211                 .must(queryBuilder)
212                 .filter(queryBuilder2))
213                 .execute()
214                 .actionGet();
215         SearchHits hits=sr.getHits();
216         for (SearchHit hit : hits) {
217             System.out.println(hit.getSourceAsString());
218         }
219     }
220 }
```
