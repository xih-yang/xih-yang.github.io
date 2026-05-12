# 06、Solr速成 通过Solr7的API实现商品的列表查询
- 来源：https://ddkk.com/zhuanlan/search/solr/3/19.html
- 分类：搜索引擎
- 分组：Solr 教程 (B)
工具类：

```java
获取 HttpSolrClient
```

```java
public class Constant {
    public static HttpSolrClient getSolrClient() {
        HttpSolrClient solrServer= new HttpSolrClient.Builder("http://127.0.0.1:8080/solr/core1").build();
        return solrServer;
    }   
}
```

jsp表单：

```xml
<form id="actionForm" action="serch.do" method="POST">
<div class="form">
    <input type="text" class="text" accesskey="s" name="queryString" id="key" value="${queryString }"
        autocomplete="off" onkeydown="javascript:if(event.keyCode==13) {query()}">
    <input type="button" value="搜索" class="button" onclick="query()">
</div>
<input type="hidden" name="catalog_name" id="catalog_name" value="${catalog_name }"/> 
<input type="hidden" name="price" id="price" value="${price }"/> 
<input type="hidden" name="page" id="page" value="${page }"/> 
<input type="hidden" name="sort" id="sort" value="${sort }"/> 
</form>
```

Controller控制层：

```java
//搜索
@RequestMapping("/serch.do")
public String serchProduct(String queryString,String catalog_name,Integer price,String page,String sort ,Model model) throws Exception{
　　　　　　　Result result = productService.querylist(queryString,catalog_name,price,page,sort);
    System.out.println(result);
    model.addAttribute("result", result);
    model.addAttribute("queryString",queryString);
    model.addAttribute("商品",catalog_name);
    System.out.println("访问成功");
    return "product_list";
}
```

service层，没有dao层这里直接在service查询solr，童鞋可以自己使用dao：

```java
//主列表查询    
public Result querylist(String qName, String catalog_name, Integer price, String page, String sort) throws Exception {
HttpSolrClient solrServer = Constant.getSolrClient();
//使用solrQuery封装查询条件
SolrQuery solrQuery = new SolrQuery();
//封装主查询条件
if(qName!=null && !qName.equals("")){
    //solrQuery.setQuery(qName);
    //关键词  商品名称
    solrQuery.setQuery("p_name:" + qName+"");//^10是查询权重
    solrQuery.setStart(0);
    solrQuery.setRows(12);
    //开启高亮
    solrQuery.setHighlight(true);
    solrQuery.addHighlightField("p_name");
    solrQuery.setHighlightSimplePre("<font color='red'>");
    solrQuery.setHighlightSimplePost("</font>");
}else{
    solrQuery.setStart(0);
    solrQuery.setRows(12);
    solrQuery.setQuery("*:*");
}
QueryResponse resp = solrServer.query(solrQuery);
Map<String, Map<String, List<String>>> highlighting = resp.getHighlighting();
SolrDocumentList results = resp.getResults();
Result result = new Result();
List<Product> pList = result.getProductList();
for (SolrDocument doc : results) {
    Product product = new Product();
    System.out.println(doc.getFieldValuesMap());
    String id = (String) doc.get("id");//id
    Integer product_number = Integer.parseInt(doc.get("p_number")+"");//数量
    String product_name = (String) doc.get("p_name");//商品名称
    Double product_price = (Double.parseDouble(doc.get("p_price")+"")) ;//价格
    String product_catalog_name = (String) doc.get("p_catalog_name");//商品分类名称
    String product_picture = (String) doc.get("p_picture");//图片
    //商品ＩＤ
    product.setPid(Integer.valueOf(id));
    //商品名称
    if (null!=highlighting) {
        Map<String, List<String>> map = highlighting.get(id);
        List<String> list = map.get("p_name");
        //String name = (String) doc.get("name_ik");
        product.setName(list.get(0));            
    }else {
        product.setName(product_name);
    }
    //图片
    product.setPicture(product_picture);
    //价格
    product.setPrice(product_price);
    //品牌ID
    product.setCatalogName(product_catalog_name);
    //商品数量
    product.setNumber(product_number);
    pList.add(product);
}
result.setProductList(pList);
return result;
}
```
