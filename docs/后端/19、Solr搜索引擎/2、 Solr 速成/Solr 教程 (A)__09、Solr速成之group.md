# 09、Solr速成之group
- 来源：https://ddkk.com/zhuanlan/search/solr/3/9.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## Group与Facet的区别

facet的查询结果主要是分组信息：有什么分组，每个分组包括多少记录；但是分组中有哪些数据是不可知道的，只有进一步搜索。

group则类似于关系数据库的group by，可以用于一个或者几个字段去重、显示一个group的前几条记录等。

再细说点就是如果你想查询归查询聚类归聚类，那么使用facet，如果想使用类似采集的效果，每个group分组采集多少个，那么使用group查询。

```java
package com.liucheng.solr;
import java.io.IOException;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.Group;
import org.apache.solr.client.solrj.response.GroupCommand;
import org.apache.solr.client.solrj.response.GroupResponse;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.params.GroupParams;
public class SolrGroup {
    public static void searchByGroup(){
        HttpSolrClient server = solrServer.getServer();
        SolrQuery query = new SolrQuery("brand_s:海尔儿");
        query.setParam(GroupParams.GROUP, true);//表示查询时使用group机制
        query.setParam(GroupParams.GROUP_FIELD, "brand_s");//设置group查询针对的域
        //设置每个组最多返回记录数，可用于数据采集，若只需要数量，可设置为0
        query.setParam(GroupParams.GROUP_LIMIT, "5");
        //设置返回的行数
        query.setRows(10);
        try {
            QueryResponse queryResponse = server.query(query);
            if(queryResponse!=null){
                GroupResponse groupResponse = queryResponse.getGroupResponse();
                if(groupResponse != null){
                    List<GroupCommand> groupList = groupResponse.getValues();
                    for(GroupCommand groupCommand : groupList){
                        List<Group> groups = groupCommand.getValues();
                        for(Group group : groups){
                            System.out.println(group.getResult().get(0).getFieldValue("subMajor_s"));
                            System.out.println("group查询。。。"+group.getGroupValue()+"数量为："
                                    + group.getResult().getNumFound());
                        }
                    }
                }
            }
        } catch (SolrServerException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        searchByGroup();
    }
}
```

显示器

group查询。。。海尔儿数量为：1
