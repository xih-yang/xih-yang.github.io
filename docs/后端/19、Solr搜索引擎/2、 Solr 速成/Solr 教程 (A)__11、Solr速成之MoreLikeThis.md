# 11、Solr速成之MoreLikeThis
- 来源：https://ddkk.com/zhuanlan/search/solr/3/11.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## Solr相似匹配

在网页搜索或电商产品搜索结果页面，很多时候会看到一个相似文档、相似产品或找相似的链接。Solr 使用 MoreLikeThisComponent（MLT）和 MoreLikeThisHandler 实现了一样的功能。如上所述，MLT 是与标准 SolrRequestHandler 集成在一起的；MoreLikeThisHandler 与 MLT 结合在一起，并添加了一些其他选项，但它要求发布一个单一的请求。我将着重讲述 MLT，因为使用它的可能性更大一些。

MLT要求字段被储存或使用检索词向量，检索词向量以一种以文档为中心的方式储存信息。MLT 通过文档的内容来计算文档中关键词语，然后使用原始查询词语和这些新词语创建一个新的查询。提交新查询就会返回其他查询结果。所有这些都可以用检索词向量来完成：只需将 termVectors="true" 添加到 schema.xml 中的  声明。

## 查询参数

id，文档主键，或使用其他唯一键；

fl，需要返回的字段

mtl.fl，根据哪些字段判断相似度

mlt.mindf，最小文档频率，所在文档的个数小于这个值的词将不用于相似判断

mlt.mintf，最小分词频率，在单个文档中出现频率小于这个值的词将不用于相似判断

mlt.count，返回相似文章个数

需要注意的是 mlt.fl 中的 field 的 termVectors=true 才有效果。

```java
public static void addIndex(){
        HttpSolrClient server = solrServer.getServer();
        List<ProductBO> list = new ArrayList<>();
        ProductBO bo1 = new ProductBO();
        bo1.setId("1001");
        bo1.setTitle("海尔模卡 (MOOKA) 65K5 65寸安卓智能网络窄边框全高清LED液晶电视");
        bo1.setMajor_s("家用电器");
        bo1.setSubMajor_s("电视");
        bo1.setBrand_s("海尔");
        bo1.setModel_s("65K5");
        bo1.setPrice_i(5400);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("1002");
        bo1.setTitle("三星 (SANSUNG) UA55JU5900JXXZ 55英寸 4K超高清智能 LED液晶电视 黑色");
        bo1.setMajor_s("家用电器");
        bo1.setSubMajor_s("电视");
        bo1.setModel_s("UA55JU5900");
        bo1.setBrand_s("三星");
        bo1.setPrice_i(6400);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("2001");
        bo1.setTitle("格力(GREE) 大1匹 变频 Qbo 壁挂式冷暖空调 KFR-26GW/(26596)FNAa-A3");
        bo1.setMajor_s("家用电器");
        bo1.setSubMajor_s("空调");
        bo1.setBrand_s("格力");
        bo1.setModel_s("KFR-26GW/(26596)FNAa-A3");
        bo1.setPrice_i(7700);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("2002");
        bo1.setTitle("奥克斯(AUX) 正1.5匹 冷暖 定速 隐藏式显示屏 壁挂式 空调 KFR-35GW/HFJ+3");
        bo1.setMajor_s("家用电器");
        bo1.setSubMajor_s("空调");
        bo1.setBrand_s("奥克斯");
        bo1.setModel_s("KFR-35GW/HFJ+3");
        bo1.setPrice_i(6600);
        list.add(bo1);
        bo1 = new ProductBO();
        bo1.setId("2003");
        bo1.setTitle("海尔(HAIER) 1.5匹 变频 静音空调 冷暖 壁挂式空调 KFR-35GW/01JDA23A");
        bo1.setMajor_s("家用电器");
        bo1.setSubMajor_s("空调");
        bo1.setBrand_s("海尔");
        bo1.setModel_s("KFR-35GW/01JDA23A");
        bo1.setPrice_i(9600);
        list.add(bo1);
        try {
            server.addBeans(list);
            server.commit();
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
        }
    }
```

```java
package morelikethis;
import java.io.Serializable;
import org.apache.solr.client.solrj.beans.Field;
public class ProductBO implements Serializable{
    private static final long serialVersionUID = 1L;
    @Field
    private String id;
    @Field
    private String title;
    @Field
    private String major_s;
    @Field
    private String subMajor_s;
    @Field
    private String brand_s;
    @Field
    private int price_i;
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getMajor_s() {
        return major_s;
    }
    public void setMajor_s(String major_s) {
        this.major_s = major_s;
    }
    public String getSubMajor_s() {
        return subMajor_s;
    }
    public void setSubMajor_s(String subMajor_s) {
        this.subMajor_s = subMajor_s;
    }
    public String getBrand_s() {
        return brand_s;
    }
    public void setBrand_s(String brand_s) {
        this.brand_s = brand_s;
    }
    public int getPrice_i() {
        return price_i;
    }
    public void setPrice_i(int price_i) {
        this.price_i = price_i;
    }
}
```

```java
package morelikethis;
import java.util.ArrayList;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.util.SimpleOrderedMap;
import solr.solrServer;
public class SolrMlt {
    @SuppressWarnings("unchecked")
    public static void search(){
        HttpSolrClient server = solrServer.getServer();
        SolrQuery query = new SolrQuery();
        List<ProductBO> articles = new ArrayList<ProductBO>();
        query.setQuery("id:1001")
                .setParam("fl", "id,title,brand_s")//返回的字段
                .setParam("mlt", "true")//打开组建
                .setParam("mlt.fl", "title")//用于判断相似的字段
                .setParam("mlt.mindf", "1")//过滤文档数小于1的文档集合
                .setParam("mlt.mintf","1")//过滤单个文档中关键字小于1的文档
                .setParam("mlt.count", "10");
        QueryResponse queryResponse;
        try {
            queryResponse = server.query(query);
            SimpleOrderedMap<SolrDocumentList> mltResults = (SimpleOrderedMap<SolrDocumentList>) queryResponse.getResponse().get("moreLikeThis");
            for(int i=0;i<mltResults.size();i++){
                SolrDocumentList items = mltResults.getVal(i);
                for (SolrDocument doc : items) {
                    String id = doc.getFieldValue("id").toString();
                    if(id.equals("1001")){
                        continue;//排除自身
                    }
                    System.out.println(doc.getFieldValue("title").toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        search();
    }
}
```
