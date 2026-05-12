# 06、Solr速成之multicore查询
- 来源：https://ddkk.com/zhuanlan/search/solr/3/6.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
查询关联多个core

再新建一个core

向每个core添加索引，修改

```java
final static String SOLR_URL = "http://localhost:8080/solr/test";
```

即可

多个core的关联查询

```java
package com.liucheng.solr;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
public class solrServer {
    private solrServer(){};
    final static String SOLR_URL = "http://localhost:8080/solr/core1";
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

```java
package com.liucheng.solr;
import java.io.IOException;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrQuery.ORDER;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
public class solrTest {
    public static void addIndex(){
        HttpSolrClient server = solrServer.getServer();
        student stu = new student();
        stu.setId("1006");
        stu.setName_s("wanglc6");
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
        //query.setQuery("*:*");
        query.set("q", "*:*");
        query.setStart(0);
        query.setRows(5);
        query.setSort("score_i",ORDER.desc);
        query.set("shards", "http://localhost:8080/solr/core1,http://localhost:8080/solr/test");
        QueryResponse queryResponse;
        try {
            queryResponse = server.query(query);
            List<student> list = queryResponse.getBeans(student.class);
            System.out.println("num = "+list.size());
            for(int i=0;i<list.size();i++){
                System.out.println(list.get(i).getId() + "___" +list.get(i).getName_s() + "___" +list.get(i).getName_s() + "___" + list.get(i).getScore_i());
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

测试的结果：

会综合两个core中的数据，如果有重复的id，只会取其中一个

但是会有一个问题，当两个core中主键相同，但是内容不同的时候，他会怎么取值，测试结果有点随机， 两个值不时的更换，实际业务中不会出现这种不同值的情况吧！
