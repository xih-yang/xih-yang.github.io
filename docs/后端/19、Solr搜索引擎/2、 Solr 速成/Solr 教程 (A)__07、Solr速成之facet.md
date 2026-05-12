# 07、Solr速成之facet
- 来源：https://ddkk.com/zhuanlan/search/solr/3/7.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## Facet 介绍

Facet 是 solr 的高级搜索功能之一 ，可以给用户提供更友好的搜索体验，在搜索关键字的同时 , 能够按照 Facet 的字段进行分组并统计。

比如你上淘宝，输入“笔记本”进行搜索，就会出现品牌分类，价格范围等分类，这个就叫facet了。这个例子也许不是那么准确的描述facet，不过基本上就是这个意思。对输入关键字后搜索出来的结果再进行分类。

**solr有几种facet:**

普通facet，比如从厂商品牌的维度建立fact 。

查询facet，比如根据价格查询时，将根据价格，设置多个区间，比如0-10, 10-20, 20-30等。

日期facet， 也是一种特殊的范围查询，比如按照月份进行facet。

进行Facet查询需要在请求参数中加入“facet=on”或“facet=true”只有这样Facet组件才起作用。

**1、** FieldFacet；

Facet字段通过在请求中加入“facet.field”参数加以声明，如果需要对多个字段进行Facet查询,那么将该参数声明多次.比如

http://localhost:8081/solr/select?q=联想&facet=on&facet.field=cpu&facet.field=videoCard

各个Facet字段互不影响,且可以针对每个Facet字段设置查询参数.以下介绍的参数既可以应用于所有的Facet字段,也可以应用于每个单独的Facet字段.应用于单独的字段时通过 f.字段名.参数名=参数值，这种方式调用。比如facet.prefix参数应用于cpu字段,可以采用如下形式

f.cpu.facet.prefix=Intel

```java
package Facet;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.FacetField;
import org.apache.solr.client.solrj.response.FacetField.Count;
import org.apache.solr.client.solrj.response.QueryResponse;
public class SolrFacet {
    public static void addIndex(){
        HttpSolrClient server = solrServer.getServer();
        List<ProductBO> list = new ArrayList<>();
        ProductBO bo1 = new ProductBO();
        bo1.setId("1001");
        bo1.setTitle("27寸曲面显示器");
        bo1.setMajor_s("电器");
        bo1.setSubMajor_s("显示器");
        bo1.setBrand_s("海尔儿");
        bo1.setPrice_i(5000);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("1002");
        bo1.setTitle("无敌28寸曲面显示器");
        bo1.setMajor_s("无敌电器");
        bo1.setSubMajor_s("无敌显示器");
        bo1.setBrand_s("无敌海尔儿");
        bo1.setPrice_i(6000);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("1003");
        bo1.setTitle("超级28寸曲面显示器");
        bo1.setMajor_s("超级电器");
        bo1.setSubMajor_s("超级显示器");
        bo1.setBrand_s("超级海尔儿");
        bo1.setPrice_i(7000);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("1004");
        bo1.setTitle("28寸曲面显示器");
        bo1.setMajor_s("电器");
        bo1.setSubMajor_s("显示器");
        bo1.setBrand_s("海尔儿");
        bo1.setPrice_i(7000);
        list.add(bo1);
        try {
            server.addBeans(list);
            server.commit();
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
        }
    }
    public static void facetQuery(){
        HttpSolrClient server = solrServer.getServer();
        SolrQuery query = new SolrQuery();
        String para = "*:*";
        query.setFacet(true);
        query.addFacetField(new String[]{"subMajor_s","brand_s"});
        query.setFacetLimit(100);//限制facet返回数量
        query.setFacetMissing(false);//不统计null的值
        query.setFacetMinCount(1);//分组的数据最小为1
        query.addFacetQuery("price_i:[5000 TO 6000]");
        query.setQuery(para);
        QueryResponse queryResponse;
        try {
            queryResponse = server.query(query);
            List<FacetField> list = queryResponse.getFacetFields();
            for(FacetField f : list){
                System.out.println(f.getName());
                System.out.println("-------------------");
                List<Count> values = f.getValues();
                for(Count c : values){
                    System.out.println(c.getName() + ":" + c.getCount());
                }
                System.out.println("===================");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        //addIndex();
        facetQuery();
    }
}
```

结果：

subMajor_s

-------------------

显示器:2

无敌显示器:1

超级显示器:1

===================

brand_s

-------------------

海尔儿:2

无敌海尔儿:1

超级海尔儿:1

===================
