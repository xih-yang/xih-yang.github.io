# 10、Solr速成之高亮显示
- 来源：https://ddkk.com/zhuanlan/search/solr/3/10.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## Solr高亮显示的三种实现

高亮显示在搜索中使用的比较多，比较常用的有三种使用方式,如果要对某field做高亮显示，必须对该field设置stored=true 。

第一种是普通的高亮显示Highlighter，根据查询的docIdSet，获取Documents，并获取当前document的需要高亮的field的value，根据query的term和该field的value做匹配算法。

第二种是，快速高亮显示FastVectorHighlighter，效率比普通的高亮显示要高；需要定义termvector(占用空间和IO)，包括position和offset，根据query term的termvector到field value中做快速的定位标记，进而实现快速的高亮显示。

第三种是在solr外部做高亮显示，由于高亮显示需要对field设置为store=true，所有对于单节点数据量比较大并且该字段比较大的话，会消耗大量的IO操作，那么可以把该字段存储在另外的地方，比如Hbase，在外部做高亮显示的匹配。

Solr高亮实例

参数说明

hl.fl: 用空格或逗号隔开的字段列表。要启用某个字段的highlight功能，就得保证该字段在schema中是stored。如果该参数未被给出，那么就会高亮默认字段 standard handler会用df参数，dismax字段用qf参数。你可以使用星号去方便的高亮所有字段。如果你使用了通配符，那么要考虑启用hl.requiredFieldMatch选项。

hl.requireFieldMatch: 如果置为true，除非用hl.fl指定了该字段，查询结果才会被高亮。它的默认值是false。

hl.usePhraseHighlighter: 如果一个查询中含有短语（引号框起来的）那么会保证一定要完全匹配短语的才会被高亮。

hl.highlightMultiTerm :如果使用通配符和模糊搜索，那么会确保与通配符匹配的term会高亮。默认为false，同时hl.usePhraseHighlighter要为true。

hl.fragsize: 返回的最大字符数。默认是100.如果为0，那么该字段不会被fragmented且整个字段的值会被返回。

```java
package Facet;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
public class solrHighLight {
    public static void search(){
        HttpSolrClient server = solrServer.getServer();
        SolrQuery query = new SolrQuery();
        query.setQuery("name_s:wanglctest*");
        query.setHighlight(true);//开启高亮功能
        query.addHighlightField("name_s");//高亮字段
        query.setHighlightSimplePre("<font color='red'>");//渲染标签
        query.setHighlightSimplePost("</font>");//渲染标签
        query.setStart(0);
        query.setRows(20);
        QueryResponse queryResponse;
        try {
            queryResponse = server.query(query);
            SolrDocumentList lists = queryResponse.getResults();//查询结果集
            List<student> items = new ArrayList<student>();
             String tmpId = "";
            Map<String, Map<String, List<String>>> highLightMap = queryResponse.getHighlighting();
            for(SolrDocument solrDocument: lists){
                 student stu = new student();
                tmpId = solrDocument.getFieldValue("id").toString();
                stu.setId(tmpId);
                stu.setScore_i((int) solrDocument.getFieldValue("score_i"));
                stu.setName_s(solrDocument.getFieldValue("name_s").toString());
                List<String> nameList = highLightMap.get(tmpId).get("name_s");
                if(nameList!=null && nameList.size()>0){
                    stu.setName_s(nameList.get(0));//获取并设置高亮字段name
                }
                System.out.println(stu.getScore_i() + " | " +stu.getName_s());
            }
        } catch (SolrServerException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        search();
    }
}
```
