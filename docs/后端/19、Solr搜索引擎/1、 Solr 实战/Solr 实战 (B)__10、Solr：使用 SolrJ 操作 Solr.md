# 10、Solr：使用 SolrJ 操作 Solr
- 来源：https://ddkk.com/zhuanlan/search/solr/2/24.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
SolrJ 是 Solr 提供的 Java 客户端 API。通过 SolrJ 可以实现 Java 程序对 Solr 中数据的操作

大前提：添加 SolrJ 依赖。依赖版本和 Solr 版本严格对应

```xml
<dependencies> 
	<dependency> 
		<groupId>org.apache.solr</groupId> 
		<artifactId>solr-solrj</artifactId> 
		<version>8.2.0</version> 
	</dependency> 
</dependencies>
```

## 1.新增/修改实现

```java
String url = "http://192.168.32.133:8983/solr/testcore";
HttpSolrClient solrClient = new HttpSolrClient.Builder(url).build();
SolrInputDocument inputDocument = new SolrInputDocument();
inputDocument.addField("id","3");
inputDocument.addField("myfield","myfield3");
solrClient.add(inputDocument);
solrClient.commit();
```

## 2.删除实现

```java
String url = "http://192.168.32.133:8983/solr/testcore";
HttpSolrClient solrClient = new HttpSolrClient.Builder(url).build();
solrClient.deleteById("3");
solrClient.commit();
```

## 3.查询实现

```java
public void testQuery(){
	try {
		String url = "http://192.168.52.130:8983/solr/testcore";
		HttpSolrClient solrClient = new HttpSolrClient.Builder(url).build();
		//封装了所有查询条件
		SolrQuery params = new SolrQuery();
		params.setQuery("name:丰富的");
		/排序
		params.setSort("price", SolrQuery.ORDER.desc);
		//分页
		params.setStart(0);
		params.setRows(1);
		//高亮
		params.setHighlight(true);
		params.addHighlightField("name");
		params.setHighlightSimplePre("<span>");
		params.setHighlightSimplePost("</span>");
		QueryResponse response = solrClient.query(params);
		SolrDocumentList list = response.getResults();
		System.out.println("总条数："+list.getNumFound());
		//高亮数据
		Map<String, Map<String, List<String>>> highlighting = response.getHighlighting();
		for(SolrDocument doc :list){
			System.out.println(doc.get("id"));
			Map<String, List<String>> map = highlighting.get(doc.get("id"));
			List<String> HLList = map.get("name");
			if(HLList!=null&&HLList.size()>0){
     //显示高亮数据
				System.out.println(HLList.get(0));
			}else{
				System.out.println(doc.get("name"));
			}
			System.out.println(doc.get("price"));
			System.out.println("===================");
		}
		solrClient.close();
	} catch (SolrServerException e) {
		e.printStackTrace();
	} catch (IOException e) {
		e.printStackTrace();
	}
}
```
