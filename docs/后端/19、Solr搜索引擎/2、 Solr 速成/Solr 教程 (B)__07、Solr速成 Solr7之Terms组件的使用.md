# 07、Solr速成 Solr7之Terms组件的使用
- 来源：https://ddkk.com/zhuanlan/search/solr/3/20.html
- 分类：搜索引擎
- 分组：Solr 教程 (B)
Terms组件提供访问索引项的字段和每个词相匹配的文档数量。 这可以用于建立一个自动建议特性或任何其他的特性,而这个terms不是搜索或文档级别的水平。快速检索索引顺序是直接使用Lucene的TermEnum来遍历这个terms词典。

在某种意义上,这种搜索组件提供快速field-faceting在整个指数,基本不受限制的查询或任何过滤器。 返回的文档频率是文档的数量相匹配的term,包括任何文件被标记为删除但尚未从索引中删除。

## 配置Terms组件

默认情况下,Terms组件已经配置`solrconfig.xml为每个集合`。

## 定义Terms组件

定义terms搜索组件很简单:只需给它一个名称,然后使用的类 `solr.TermsComponent`。

```xml
<searchComponent name="terms" class="solr.TermsComponent"/>
```

但是单单是这样是不可用的，需要配合一个请求处理程序才能正常使用。

## 请求处理程序中使用的组件

这个terms组件是包含的条款 `/terms`请求处理程序,这是在Solr的开箱即用的请求处理程序——请看 [隐式 RequestHandlers](http://lucene.apache.org/solr/guide/7_1/implicit-requesthandlers.html#implicit-requesthandlers)。

注意,这个请求处理程序设置参数的默认值"terms" 为 true，它允许条件返回请求。 “distrib”参数设置为false,它允许使用这个处理程序只在一个Solr的核心。

你可以将这个组件添加到另一个处理程序,如果你想，并通过 "terms=true" HTTP请求以收回条款。 如果只定义在一个单独的处理程序,查询时必须使用该处理程序为了得到terms，而不是常规的文档作为结果。

## Terms组件参数

下面的参数允许您控制Terms的返回。 您还可以配置任何的请求处理程序如果你想永久设置它们。 或者,您可以将它们添加到查询请求。 这些参数是:

`terms`

设置为true，则开启组件。 默认情况下是`false`

例子:terms=true

`terms.fl`

指定字段的检索条件。 terms=true 这个参数是必需的。

例子:terms.fl=title

`terms.list`

获取文档频率的逗号分隔的列表。 总是在索引顺序返回。 如果 `terms.ttf`设置为true，也返回他们的总的term频率。 如果多个 `terms.fl 被`定义,这些统计的数据将为每一项在每一个请求返回字段。

例子:terms.list=termA,termB,termC

`terms.limit`

返回指定的最大数量terms。 默认值是 `10`。 如果限制设置为小于0,然后没有最大限度地执行。 虽然这不是必需的,或者这个参数 `terms.upper`必须定义。

例子:`terms.limit = 20`

`terms.lower`

指定的term。 如果未指定,则使用空字符串,导致Solr从头开始的。

例子:terms.lower=orange

`terms.lower.incl`

如果设置为true,包括下界(指定 `terms.lower`的结果集。

例子:`terms.lower.incl = false`

`terms.mincount`

指定最低文档频率返回为了一个term被包括在一个查询响应。 结果是包容性的mincount(> = mincount)。

例子:`terms.mincount = 5`

`terms.maxcount`

指定的最大文档频率项必须被包括在一个查询响应。 默认设置为 -1,这集没有上限。 结果是包容性的maxcount(< = maxcount)。

例子:`terms.maxcount = 25`

`terms.prefix`

从指定的字符串匹配以***为前缀的。

例子:`terms.prefix=inter`

`terms.raw`

如果设置为true,返回原始字符的索引term,不管它是否可读。 例如,数字数据的索引形式不是人类可读的。

例子:`terms.raw = true`

`terms.regex`

限制条件匹配的正则表达式匹配。

例子:`* pedist terms.regex =`

`terms.regex.flag`

定义了一个Java正则表达式国旗使用在评估定义的正则表达式 `terms.regex`。 看到 [http://docs.oracle.com/javase/tutorial/essential/regex/pattern.html](http://docs.oracle.com/javase/tutorial/essential/regex/pattern.html)每个国旗的详情。 有效的选项是:

- case_insensitive
- 评论
- 多行
- 文字
- dotall
- unicode_case
- canon_eq
- unix_lines

例子: `terms.regex.flag = case_insensitive`

`terms.stats`

包括索引统计信息的结果。 目前只返回 **numDocs** 对于一个集合。 当结合 `terms.list`它提供了足够的信息来计算逆文档频率(IDF)术语的列表。

`terms.sort`

定义了如何返回的terms。 有效的选项是 count,这类词的频率,频率最高的词,或 index 在指数排序顺序。

例子:terms.sort=index

`terms.ttf`

如果设置为true ,返回 `df`(docFreq)和 `ttf`为每个请求项(totalTermFreq)统计 `terms.list`。 在这种情况下,响应格式是:

```xml
<lst name="terms">
  <lst name="field">
    <lst name="termA">
      <long name="df">22</long>
      <long name="ttf">73</long>
    </lst>
  </lst>
</lst>
```

`terms.upper`

指定要停在这个词。 虽然不需要此参数,这个参数或 `terms.limit`必须定义。

例子:``terms.upper=plum

`terms.upper.incl`

如果设置为true,上界项是包含在结果集。默认是false。

例子:`terms.upper.incl = true`

terms请求的响应是一个术语及其文档频率值的列表。

你可能也会感兴趣的 [TermsComponent javadoc](https://lucene.apache.org/solr/7_1_0//solr-core/org/apache/solr/handler/component/TermsComponent.html)。

## Terms组件的例子

请求查询的十个terms名称的字段:

```java
http://localhost:8983/solr/techproducts/terms?terms.fl=name&wt=xml
```

结果：

```xml
<response>
  <lst name="responseHeader">
    <int name="status">0</int>
    <int name="QTime">2</int>
  </lst>
  <lst name="terms">
    <lst name="name">
      <int name="one">5</int>
      <int name="184">3</int>
      <int name="1gb">3</int>
      <int name="3200">3</int>
      <int name="400">3</int>
      <int name="ddr">3</int>
      <int name="gb">3</int>
      <int name="ipod">3</int>
      <int name="memory">3</int>
      <int name="pc">3</int>
    </lst>
  </lst>
</response>
```

### 得到前十项以字母“a”开始

请求查询的前十个terms名称的字段是按照索引顺序(而不是排名前十位的结果文档数):

```java
http://localhost:8983/solr/techproducts/terms?terms.fl=name&terms.lower=a&terms.sort=index&wt=xml
```

结果:

```xml
<response>
  <lst name="responseHeader">
    <int name="status">0</int>
    <int name="QTime">0</int>
  </lst>
  <lst name="terms">
    <lst name="name">
      <int name="a">1</int>
      <int name="all">1</int>
      <int name="apple">1</int>
      <int name="asus">1</int>
      <int name="ata">1</int>
      <int name="ati">1</int>
      <int name="belkin">1</int>
      <int name="black">1</int>
      <int name="british">1</int>
      <int name="cable">1</int>
    </lst>
  </lst>
</response>
```

### SolrJ调用

```java
 SolrQuery query = new SolrQuery();
    query.setRequestHandler("/terms");
    query.setTerms(true);
    query.setTermsLimit(5);
    query.setTermsLower("s");
    query.setTermsPrefix("s");
    query.addTermsField("terms_s");
    query.setTermsMinCount(1);
    QueryRequest request = new QueryRequest(query);
    List<Term> terms = request.process(getSolrClient()).getTermsResponse().getTerms("terms_s");
```

## 使用Terms组件自动建议特性

如果Suggester不能满足您的需求,您可以使用Solr的Terms组成部分来构建自己的搜索应用程序类似的功能。 只需提交一个查询指定用户已经输入的任何字符作为前缀。 例如,如果用户输入的"at",搜索引擎的接口将提交以下查询:

```java
http://localhost:8983/solr/techproducts/terms?terms.fl=name&terms.prefix=at&wt=xml
```

结果:

```xml
<response>
  <lst name="responseHeader">
    <int name="status">0</int>
    <int name="QTime">1</int>
  </lst>
  <lst name="terms">
    <lst name="name">
      <int name="ata">1</int>
      <int name="ati">1</int>
    </lst>
  </lst>
</response>
```

您可以使用参数 `omitHeader = true`省略了查询响应的响应头,像在这个例子中,也以JSON格式返回响应:

```java
http://localhost:8983/solr/techproducts/terms?terms.fl=name&terms.prefix=at&omitHeader=true
```

结果:

```java
{
  "terms": {
    "name": [
      "ata",
      1,
      "ati",
      1
    ]
  }
}
```

## 分布式搜索支持

TermsComponent还支持分布式索引。 为 `/terms`请求处理程序,您必须提供以下两个参数:

`shards`

分布式索引配置中指定了碎片。 关于分布式索引的更多信息,请参阅 [分布式搜索和索引分片](http://lucene.apache.org/solr/guide/7_1/distributed-search-with-index-sharding.html#distributed-search-with-index-sharding)。

`shards.qt`

指定请求的请求处理程序使用shards。
