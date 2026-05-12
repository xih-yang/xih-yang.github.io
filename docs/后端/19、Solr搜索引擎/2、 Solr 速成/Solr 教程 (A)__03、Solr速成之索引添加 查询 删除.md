# 03、Solr速成之索引添加 查询 删除
- 来源：https://ddkk.com/zhuanlan/search/solr/3/3.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
solrserver.java

```java
public class solrServer {
    private solrServer(){};
    final static String SOLR_URL = "http://localhost:8080/solr/test";
    private static HttpSolrClient server = null;
    public static HttpSolrClient getServer(){
        if(server == null){
            server = new HttpSolrClient(SOLR_URL);
            server.setDefaultMaxConnectionsPerHost(1000);
            server.setMaxTotalConnections(10000);
            server.setConnectionTimeout(60000);
            server.setSoTimeout(60000);
            server.setFollowRedirects(false);
            server.setAllowCompression(true);
        }
        return server;
    }
}
```

solrTest.java

```java
public class solrTest {
    public static void addIndex(){
        HttpSolrClient server = solrServer.getServer();
        SolrInputDocument doc = new SolrInputDocument();
        doc.addField("id", "1003");
        doc.addField("name_s", "wanglc3");
        doc.addField("score_i", "883");
        try {
            server.add(doc);
            server.commit();
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
        }
    }
    public static void delete(){
        HttpSolrClient server = solrServer.getServer();
        try {
            server.deleteById("1001");
            server.commit();
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
        }
    }
    public static void search(){
        HttpSolrClient server = solrServer.getServer();
        SolrQuery query = new SolrQuery();
        query.setQuery("*:*");
        query.setStart(0);
        query.setRows(5);
        QueryResponse queryResponse;
        try {
            queryResponse = server.query(query);
            SolrDocumentList list = queryResponse.getResults();
            System.out.println("num = "+list.getNumFound());
            for(int i=0;i<list.size();i++){
                System.out.println(list.get(i).getFieldValue("name_s"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        //addIndex();
        //delete();
        search();
    }
}
```
