# 04、Solr速成之bean
- 来源：https://ddkk.com/zhuanlan/search/solr/3/4.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
以bean的形式提交索引,以bean的形式查询出来

```java
package com.liucheng.solr;
import java.io.Serializable;
import org.apache.solr.client.solrj.beans.Field;
public class student implements Serializable{
    private static final long serialVersionUID = 1L;
    @Field
    private String id;
    @Field
    private String name_s;
    @Field
    private int score_i;
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getName_s() {
        return name_s;
    }
    public void setName_s(String name_s) {
        this.name_s = name_s;
    }
    public int getScore_i() {
        return score_i;
    }
    public void setScore_i(int score_i) {
        this.score_i = score_i;
    }
}
```

其中field的值必须要在scheme.xml中配置，因为该文件中已经有id和动态field的配置，这里就不用配置

```xml
<field name="id" type="string" indexed="true" stored="true" required="true" multiValued="false" /> 
<dynamicField name="*_i"  type="int"    indexed="true"  stored="true"/>
<dynamicField name="*_s"  type="string"  indexed="true"  stored="true" />
```

测试类：

```java
package com.liucheng.solr;
import java.io.IOException;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
public class solrTest {
    public static void addIndex(){
        HttpSolrClient server = solrServer.getServer();
        student stu = new student();
        stu.setId("1005");
        stu.setName_s("wanglc5");
        stu.setScore_i(885);
        try {
            server.addBean(stu);
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
            List<student> list = queryResponse.getBeans(student.class);
            System.out.println("num = "+list.size());
            for(int i=0;i<list.size();i++){
                System.out.println(list.get(i).getName_s());
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

solrserver：

```java
package com.liucheng.solr;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
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
