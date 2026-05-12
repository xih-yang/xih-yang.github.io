# 08、Solr速成 Solr7实现搜索框的自动提示并统计词频
- 来源：https://ddkk.com/zhuanlan/search/solr/3/21.html
- 分类：搜索引擎
- 分组：Solr 教程 (B)
1：用solr 的suggest组件，统计词频相对麻烦。

2：用TermsComponent，自带词频统计功能。

Terms组件提供访问索引项的字段和每个词相匹配的文档数量，类似于关系型数据库的like模糊查询（keywords like "手机%"），然后统计数量返回给前端，但这样有一个问题。如果该字段非词性的。精确性和效率性不高。

solr中TermsComponent组件完美的解决了这么一个方案，能够统计指定搜索域中所有词的信息。类似于lucene Term查询。

刚研究了会solrj的TermsComponent ：http://wiki.apache.org/solr/TermsComponent

solrconfig配置如下：

这通常是一个默认的配置，一般使用不需要进行配置，除非你有更高的需求。

返回结果：默认按词的count出现次数倒序排序。

相关参数说明：

```java
terms={true|false} -必须的. 打开 TermsComponent组件
terms.fl={FIELD NAME} - 必须的. terms的名称field，可以指定多个如：terms.fl = field1&terms.fl = field2……
terms.lower={term下限} - 可选的. 这个term开始。如果不指定,使用空字符串,这意味着从头开始的。
terms.lower.incl={true|false} - 可选的. 包括下限的结果集。默认是true。
terms.mincount=<Integer> - 可选的. 最小文档频率返回被包含的. 结果包含最小统计数量(例如 >= 最小统计数量)
terms.maxcount=<Integer> - 可选的. 最大文档频率. 默认是 -1 ~ 没有上限. 结果包含最大统计数量(例如 <= 最大统计数量)
terms.prefix={String} - 可选的. 限制匹配terms从前缀开始。
terms.regex={String} - 可选的. 限制条件匹配terms的正则表达式匹配。<!> Solr3.1
terms.regex.flag={case_insensitive|comments|multiline|literal|dotall|unicode_case|canon_eq|unix_lines} - 可选的. Flags to be used when evaluating the regular expression defined in the "terms.regex" parameter (see http://java.sun.com/j2se/1.5.0/docs/api/java/util/regex/Pattern.html#compile%28java.lang.String,%20int%29 fore more details). This parameter can be defined multiple times (each time with different flag) <!> Solr3.1
terms.limit={Integer} - 可选的. 返回的最大的terms数量. 默认是 10. 如果 < 0, 那么包含所有的 terms.
terms.upper={term上限} - 可选的. The term to stop at. Either upper or terms.limit must be set.
terms.upper.incl={true|false} -可选的. 包括上限的结果集。默认是false。
terms.raw={true|false} - 可选的. 如果是 true, return the raw characters of the indexed term, regardless of if it is human readable. For instance, the indexed form of numeric numbers is not human readable. The default is false.
terms.sort={count|index} - 可选的. 如果count，各种各样的terms的频率（最高计数第一）。如果index，索引顺序返回的terms。默认是count。
　　输出是一个term及其文档频率值的列表。
　　注：如terms={true|false}，{}里的内容蓝色的真实要填写的内容，黑色是描述。
```

solr7 之 termsComment 官网的demo：

```java
/**
 * terms词频统计测试
 */
@Test
public void TestTerms() throws Exception{
    //[1]获取连接
    HttpSolrClient client = Constant.getSolrClient();
    //[2]创建SolrQuery
    SolrQuery query = new SolrQuery();
    //[3]设置参数
    query.setRequestHandler("/terms");//设置requestHandler
    query.setTerms(true);//开启terms
    query.setTermsLimit(10);//设置每页返回的条目数量
    query.setTermsLower("家");// 可选的. 这个term开始。如果不指定,使用空字符串,这意味着从头开始的。
    query.setTermsPrefix("家");//可选的. 限制匹配，设置terms前缀是以什么开始的。
    query.addTermsField("p_name");//必须的. 统计的字段
    query.setTermsMinCount(1);//可选的. 设置最小统计个数
    //[4]创建QueryRequest 获取 TermsResponse 
    QueryRequest request = new QueryRequest(query);
    QueryResponse process = request.process(client);
    TermsResponse termsResponse = process.getTermsResponse();
    //[5]遍历结果
    List<Term> terms = termsResponse.getTerms("p_name");
    for (Term term : terms) {
        System.out.println(term.getTerm() + ":\t"+ term.getFrequency());
    }
}
```

查询的结果：

## SolrQuery的父类方法set设置参数的方式统计词频 demo2：

```java
/**
 * terms词频统计测试2
 * @throws Exception 
 */
@Test
public void TestTerms2() throws Exception{
    //[1]实例化HttpSolrClient，以获取与HttpSolrClient的连接
    HttpSolrClient client = Constant.getSolrClient();
    //[2]创建SolrQuery
    SolrQuery query = new SolrQuery();
    //[3]设置查询参数  
    query.set("q", "*:*");  
    query.set("qt","/terms");//设置requestHandler
    // parameters settings for terms requesthandler  
    // 参考 http://wiki.apache.org/solr/termscomponent  
    query.set("terms","true");//开启terms
    query.set("terms.fl", "p_name");//必须的. 统计的字段  
    //指定下限  
    // query.set("terms.lower", ""); // term lower bounder开始的字符  ，// 可选的. 这个term开始。如果不指定,使用空字符串,这意味着从头开始的。
    // query.set("terms.lower.incl", "true");  
    // query.set("terms.mincount", "1");//可选的. 设置最小统计个数  
    // query.set("terms.maxcount", "100"); //可选的. 设置最大统计个数   
    //http://localhost:8983/solr/terms?terms.fl=text&terms.prefix=家//  
    //using for auto-completing   //自动完成  
    //query.set("terms.prefix", "家");//可选的. 限制匹配，设置terms前缀是以什么开始的。  
    query.set("terms.regex", "家+.*");  
    query.set("terms.regex.flag", "case_insensitive");  
    //query.set("terms.limit", "20"); //设置每页返回的条目数量 
    //query.set("terms.upper", ""); //结束的字符  
    //query.set("terms.upper.incl", "false");  
    //query.set("terms.raw", "true");  
    query.set("terms.sort", "count");//terms.sort={count|index} -如果count，各种各样的条款术语的频率（最高计数第一）。 如果index，索引顺序返回条款。默认是count     
    // 查询并获取结果  
    QueryResponse response = client.query(query);  
    // 获取相关的查询结果  
    if (response != null) {  
        TermsResponse termsResponse = response.getTermsResponse();  
        if (termsResponse != null) {  
            Map<String, List<TermsResponse.Term>> termsMap = termsResponse.getTermMap();  
            for (Map.Entry<String, List<TermsResponse.Term>> termsEntry : termsMap.entrySet()) {  
                //System.out.println("Field Name: " + termsEntry.getKey());  
                List<TermsResponse.Term> termList = termsEntry.getValue();  
                for (TermsResponse.Term term : termList) {  
                    System.out.println(term.getTerm() + " : "+ term.getFrequency());  
                }  
            }  
        }  
    }  
}
```

结果：

## 整合到工程中去：

**1、** 需要jQueryUI的自动完成组件（Autocomplete）；

**2、** solr7的Terms组件；

### ①jsp页面：

js引入：

```xml
<link rel="stylesheet" href="resource/js/jquery-ui-1.10.4.custom/css/base/jquery-ui-1.10.4.custom.min.css">
<script src="resource/js/jquery-ui-1.10.4.custom/js/jquery-1.10.2.js"></script>
<script src="resource/js/jquery-ui-1.10.4.custom/development-bundle/ui/jquery.ui.core.js"></script>
<script src="resource/js/jquery-ui-1.10.4.custom/development-bundle/ui/jquery.ui.widget.js"></script>
<script src="resource/js/jquery-ui-1.10.4.custom/development-bundle/ui/jquery.ui.position.js"></script>
<script src="resource/js/jquery-ui-1.10.4.custom/development-bundle/ui/jquery.ui.menu.js"></script>
<script src="resource/js/jquery-ui-1.10.4.custom/development-bundle/ui/jquery.ui.autocomplete.js"></script>
<script src="resource/js/common/jquery.custom.mycomplete.js"></script>    <!-- 自定义扩展小部件autocomplete的js -->
```

自定义扩展autocomplete功能（jquery.custom.mycomplete.js）

```java
/**
 * 扩展autocomplete功能
 * 2017-10-10
 * @param $
 */
(function($){
       $.widget( "custom.mycomplete", $.ui.autocomplete, {
           _renderItem: function( ul, item ) {
               //alert(item.term)
               //alert(item.frequency)
               return $( "<li>" )
              .attr( "data-value", item.value ) //当条目被选中时插入到输入框中的值。
                .append( $("<a>")
                 //.text( item.label) 
               .html("<img width='30' src='img/01.png' />" +
                       //item.label + 
                       item.term + 
                      // " <span>约10000个商品</span>")
                       "<span style='float: right;padding-right: 5px;'> 约"+item.frequency+"个商品</span>")
                 )//条目显示的字符串。        
               .appendTo( ul );//新创建的 <li> 元素必须追加到的 <ul> 元素。
             }
        });  
})(jQuery)
```

form表单：

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

②JQuery代码：

对输入内容的动态自动建议并统计词频：

```xml
<script type="text/javascript">
    $(function() {
         $("#key").mycomplete({
            minLength: 1 ,//执行搜索前用户必须输入的最小字符数
            delay: 300 ,  //按键和执行搜索之间的延迟，以毫秒计
            autoFocus: true,//如果设置为 true，当菜单显示时，第一个条目将自动获得焦点。
            source: function(req,resp) {
                    $.getJSON("serchTerms.do?term="+req.term,resp);
            },
            response: function( event, ui ) {//在搜索完成后菜单显示前触发
                //alert('response')
                //alert(ui.content[0].value)
                //...
            },
            select: function( event, ui ) { //当从菜单中选择条目时触发
                //alert('select')
                //alert(ui.item.term)
                //...
                $(this).val(ui.item.term);
                 return false;
            },
            focus: function( event, ui ) {//当焦点移动到一个条目上（未选择）时触发
                //alert('focus')
                //...
                $(this).val(ui.item.term);
                 return false;
            },
            change: function( event, ui ) {//如果输入域的值改变则触发该事件
                //alert('change')
                //...
            },
            search: function( event, ui ) {//在搜索执行前满足minLength 和 delay 后触发
                //alert('search')
                //...
            }
         });          
    });
</script>
```

③提交表单：

```xml
<script type="text/javascript">
    function query() {
        //执行关键词查询时清空过滤条件
        document.getElementById("catalog_name").value="";
        document.getElementById("price").value="";
        document.getElementById("page").value="";
        //执行查询
        queryList();
    }
    function queryList() {
        //提交表单
        document.getElementById("actionForm").submit();
    }
    function filter(key, value) {
        document.getElementById(key).value=value;
        queryList();
    }
    function sort() {
        var s = document.getElementById("sort").value;
        if (s != "1") {
            s = "1";
        } else {
            s = "0";
        }
        document.getElementById("sort").value = s;
        queryList();
    }
    function changePage(p) {
        var curpage = Number(document.getElementById("page").value);
        curpage = curpage + p;
        document.getElementById("page").value = curpage;
        queryList();
    }
</script>
```

④Controller层：

```java
/**
 * 词频统计查询数据
 * @return
 * @throws Exception
 */
@RequestMapping("/serchTerms.do")
public String serchTerms() throws Exception{
    HttpServletRequest request = ((ServletRequestAttributes)RequestContextHolder.getRequestAttributes()).getRequest();
    HttpServletResponse response = ((ServletRequestAttributes)RequestContextHolder.getRequestAttributes()).getResponse();
    String keywords = request.getParameter("term");
    String serchTerms = productService.serchTerms(keywords);
    System.out.println(serchTerms);
    JsonUtil.writeJson2Page(serchTerms, response);
    return "product_list";
}     
```

⑤Service层：

```java
//关键字建议词频统计查询
@Override
public String serchTerms(String keywords) throws Exception {
   String serchGroupSum = SuggestUtils.getSerchTerms(keywords);
   return serchGroupSum;
}
```

⑥SuggestUtils工具类：

```java
/**
 * 词频统计查询
 * @param keywords
 * @return
 * @throws SolrServerException
 */
public static String getSerchTerms(String keywords) throws Exception {
    HttpSolrClient solrServer = Constant.getSolrClient();
    // 创建查询参数以及设定的查询参数  
    SolrQuery query = new SolrQuery();  
    query.set("q", "*:*");  
    query.set("qt", "/terms");  
    query.set("terms", "true");  
    query.set("terms.fl", "p_name");  
    //tomcat8之前默认是ISO8859-1,tomcat8及以后，是UTF-8,自己百度一下解决办法
　　　　 //推荐学习地址： https://www.w3cschool.cn/regexp/tfua1pq5.html
    query.set("terms.regex", keywords+"+.*"); 
    query.set("terms.regex.flag", "case_insensitive");  
    query.set("terms.sort", "count");//terms.sort={count|index} -如果count，各种各样的条款术语的频率（最高计数第一）。 如果index，索引顺序返回条款。默认是count  
    // 查询并获取相应的结果！  
    QueryResponse response = solrServer.query(query);  
    // 获取相关的查询结果  
    List<TermsResponse.Term> termList=null;
    if (response != null) { 
      TermsResponse termsResponse = response.getTermsResponse();  
       if (termsResponse != null) {
          Map<String, List<TermsResponse.Term>> termsMap = termsResponse.getTermMap();  
            for (Map.Entry<String, List<TermsResponse.Term>> termsEntry : termsMap.entrySet()) {  
                // System.out.println("Field Name: " + termsEntry.getKey());  
                termList = termsEntry.getValue();  
                for (TermsResponse.Term term : termList) {  
                    System.out.println(term.getTerm() + " : "+ term.getFrequency());  
                }  
            }  
        }  
    }
  JSONArray array = JSONArray.fromObject(termList);
  String jsonstr = array.toString();
  return jsonstr;  
}  
```

效果如图：

随便选择一个进行搜索，比如选择‘’家系‘’：

结果确实只有三条数据。

刚才用的p_name，现在改为p_keywords，可以看到查询的内容和条数比刚才多了许多。

```java
 query.set("terms.fl", "p_keywords");  
```

基本功能已经完成，还有待优化，比如：

**1、** 写了十个关键字，删除了一个字也应该建议出下拉的内容（京东是无论你删除前边的关键字还是后边的关键字都能建议出内容）；

**2、** 获取焦点事件，输入框中如果有内容，当再次获取焦点时，同样能获取建议的内容；
