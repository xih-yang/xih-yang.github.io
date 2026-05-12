# 08、Solr速成之FacetPivot
- 来源：https://ddkk.com/zhuanlan/search/solr/3/8.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## 什么是Facet.pivot

Facet.pivot就是按照多个维度进行分组查询，是Facet的加强，在实际运用中经常用到， 一个典型的例子就是商品目录树

NamedList解释：

NamedList，一个有序的name/value容器，NamedList不像Map，他具有以下特点：

**1、** 名字可以重复；

**2、** NamedList中的element保持这有序状态；

**3、** 可以下标的形式访问Elements；

**4、** name和value都可以为null；

```java
package com.liucheng.solr;
import java.io.IOException;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrRequest;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.PivotField;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.util.NamedList;
public class FacetPivot {
    public static void facetPivotQuery(){
        HttpSolrClient server = solrServer.getServer();
        SolrQuery query = new SolrQuery();
        String para = "*:*";
        query.setFacet(true);
        query.add("facet.pivot", "major_s,subMajor_s,brand_s");//多维度分组查询
        query.setFacetLimit(100);//限制facet返回数量
        query.setQuery(para);
        try {
            QueryResponse queryResponse = server.query(query,SolrRequest.METHOD.POST);
            NamedList<List<PivotField>> namedList = queryResponse.getFacetPivot();
            if(namedList != null){
                List<PivotField> pivotList = null;
                for(int i=0;i<namedList.size();i++){
                    pivotList = namedList.getVal(i);
                    if(pivotList != null){
                        for(PivotField pivot : pivotList){
                            System.out.println("一级："+pivot.getValue()+" "+pivot.getCount());
                            List<PivotField> fieldList = pivot.getPivot();
                            if(fieldList!=null){
                                for(PivotField field : fieldList){
                                    System.out.println("2级："+field.getValue()+" "+field.getCount());
                                    List<PivotField> fieldList1 = field.getPivot();
                                    if(fieldList1!=null){
                                        for(PivotField field1 : fieldList1){
                                            System.out.println("3级："+field1.getValue()+" "+field1.getCount());
                                        }
                                    }
                                }
                            }
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
        facetPivotQuery();
    }
}
```

一级：无敌电器 1

2级：无敌显示器 1

3级：无敌海尔儿 1

一级：电器 1

2级：显示器 1

3级：海尔儿 1

一级：超级电器 1

2级：超级显示器 1

3级：超级海尔儿 1
