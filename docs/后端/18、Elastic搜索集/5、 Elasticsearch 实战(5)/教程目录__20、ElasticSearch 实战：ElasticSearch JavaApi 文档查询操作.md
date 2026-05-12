# 20、ElasticSearch 实战：ElasticSearch JavaApi 文档查询操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/20.html
- 分类：搜索引擎
- 分组：教程目录
## Elasticsearch JavaApi 文档查询操作

在前面的`restful api`测试的过程中，我们使用的大量的参数提交的方式进行文档的查询操作。例如：全量查询，分页查询，模糊查询等等。 那`java api`其实也是提供了对应的查询操作功能的。

### 全量查询

全量查询就是不提交任何的查询条件直接将`ES`上有的文档数据一次性的查询出来。查询的核心是要构造一个`org.elasticsearch.action.search.SearchRequest;`对象，并且使用`client.search()`方法即可查询。下面是`java api`查询文档的步骤:

**1、** 构造`Httphost`对象；

**2、** 构造`RestClientBuilder`对象；

**3、** 构建客户端对象`RestHighLevelClient`对象；

**4、** 构造`org.elasticsearch.action.search.SearchRequest`.；

**5、** 使用`indices（）`方法设置要查询文档所在的`index`；

**6、** 发起请求得到查询结果响应；

**7、** 关闭客户端链接；

测试代码如下:

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.search.SearchHits;
/**
 * 简单的全量查询
 */
public class DocQueryAll {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 查询数据
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

由于我们将执行后的结果的`hits`进行了打印。所以程序运行的输出为:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7001",
  "_score" : 1.0,
  "_source" : {
    "name" : "方腊",
    "sex" : "男",
    "age" : "38",
    "title" : "教授"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.0,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7003",
  "_score" : 1.0,
  "_source" : {
    "name" : "花荣",
    "sex" : "男",
    "age" : "25",
    "title" : "助教"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7004",
  "_score" : 1.0,
  "_source" : {
    "name" : "孙二娘",
    "sex" : "女",
    "age" : "28",
    "title" : "副教授"
  }
}
Process finished with exit code 0
```

从执行的结果可以看出， 我们把`teacher`索引下的内容都正常的请求下来了。`java api`的全量查询结果其实也是和`restful api`是基本一致的。

### 条件查询

条件查询其实就是在全量查询的基础上进行怎么条件内容. 条件的构建分了3步走：

**1、** 构建一个`QueryBuilder`,改对象由`QueryBuilders`来构建，比如，年龄等于`35`的，`QueryBuilderage=QueryBuilders.termQuery("age",35);`；

**2、** 创建一个`org.elasticsearch.search.builder.SearchSourceBuilder`,直接`new`就ok；

**3、** 然后把条件弄进`SearchSourceBuilder`，弄进去就用`query()`方法.；

**4、** 把`SearchSourceBuilder`设置到`SearchRequest`中`request.source(query);`；

以上就已经把条件弄到请求里面去了。样例代码如下:

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.TermQueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 条件查询
 */
public class DocQueryCondition {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 条件查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 添加条件
        QueryBuilder age = QueryBuilders.termQuery("age", 35);
        SearchSourceBuilder query = new SearchSourceBuilder().query(age);
        request.source(query);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

执行结果:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.0,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
```

结果仅匹配到了`35`岁的宋江大哥.

我们再测试一下

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.TermQueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 条件查询
 */
public class DocQueryCondition {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 条件查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 添加条件
        QueryBuilder age = QueryBuilders.termQuery("name", "宋");
        SearchSourceBuilder query = new SearchSourceBuilder().query(age);
        request.source(query);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

这次使用的是`name`字段,值是`宋`。

查询结果:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.2613049,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
```

### 分页查询

分页查询就是在条件查询的`SearchSourceBuilder`设置起查询文档的起始位置。

分页查询代码如下:

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 分页查询
 */
public class DocQueryPagination {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 添加条件
        QueryBuilder queryBuilder = QueryBuilders.matchAllQuery();//全查
        SearchSourceBuilder query = new SearchSourceBuilder().query(queryBuilder);
        query.from(0);
        query.size(2); //每页显示几条
        request.source(query);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

执行结果:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7001",
  "_score" : 1.0,
  "_source" : {
    "name" : "方腊",
    "sex" : "男",
    "age" : "38",
    "title" : "教授"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.0,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
```

从结果上可以看到，分页查询仅查询到了一页数据。

### 查询结果排序

查询结果排序就是在`SearchSourceBuilder`的`sort`方法进行。

例如:

```java
 SearchSourceBuilder query = new SearchSourceBuilder().query(queryBuilder);
 query.sort("age", SortOrder.DESC);//年龄从大大小
```

以下是全量查询，以年龄倒序的查询例子.

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
/**
 * 查询排序
 */
public class DocQueryOrder {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 添加条件
        QueryBuilder queryBuilder = QueryBuilders.matchAllQuery();//全查
        SearchSourceBuilder query = new SearchSourceBuilder().query(queryBuilder);
        query.sort("age", SortOrder.DESC);//年龄从大大小
        request.source(query);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

查询输出结果：

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7001",
  "_score" : null,
  "_source" : {
    "name" : "方腊",
    "sex" : "男",
    "age" : "38",
    "title" : "教授"
  },
  "sort" : [
    38
  ]
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : null,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  },
  "sort" : [
    35
  ]
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7004",
  "_score" : null,
  "_source" : {
    "name" : "孙二娘",
    "sex" : "女",
    "age" : "28",
    "title" : "副教授"
  },
  "sort" : [
    28
  ]
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7003",
  "_score" : null,
  "_source" : {
    "name" : "花荣",
    "sex" : "男",
    "age" : "25",
    "title" : "助教"
  },
  "sort" : [
    25
  ]
}
```

从输出结果可以看出，结果的顺序是按照年龄从大到小的形式输出。

### 过滤字段

在我们查询的过程中，我们可能存在只需要部分字段的情况。

下面例子是仅获取，姓名和性别的过滤的例子。

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
/**
 * 字段过滤查询
 */
public class DocQueryFieldFilter {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 添加条件
        QueryBuilder queryBuilder = QueryBuilders.matchAllQuery();//全查
        SearchSourceBuilder query = new SearchSourceBuilder().query(queryBuilder);
//        过滤字段
        query.fetchSource(new String[]{
     "name", "sex"}, null);
        request.source(query);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

执行查询的结果为:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7001",
  "_score" : 1.0,
  "_source" : {
    "sex" : "男",
    "name" : "方腊"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.0,
  "_source" : {
    "sex" : "男",
    "name" : "宋江"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7003",
  "_score" : 1.0,
  "_source" : {
    "sex" : "男",
    "name" : "花荣"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7004",
  "_score" : 1.0,
  "_source" : {
    "sex" : "女",
    "name" : "孙二娘"
  }
}
```

从返回的内容可以看出，仅查询了`sex`和`name`。

### 多条件联合查询

多条件查询需要用到`BoolQueryBuilder`,通过`QueryBuilders.boolQuery();`获取. 多个条件的满足关系。

**1、** 必须满足`must`；

**2、** 必须不满足`mustNot`；

**3、** 可以满足`should`；

例子，查询年龄必须等于`35`.性别必须等于`男`。

样例代码：

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 组合条件查询
 */
public class DocQueryMultCondition {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 组合条件
        BoolQueryBuilder queryBuilder = QueryBuilders.boolQuery();//全查
        queryBuilder.must(QueryBuilders.matchQuery("age", "35"));
        queryBuilder.must(QueryBuilders.matchQuery("sex", "男"));
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().query(queryBuilder);
        request.source(searchSourceBuilder);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

由于`ES`的文档中只有`宋江`满足。所以查询结果为:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.3566749,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
```

### 范围查询

范围查询在工程实践中也是常常被要求的，比如需要得到30岁到40岁的`teacher`. 需要用到`RangeQueryBuilder`。

样例代码：

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.RangeQueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 组合条件查询
 */
public class DocQueryRange {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 组合条件
        RangeQueryBuilder query = QueryBuilders.rangeQuery("age");
        query.gte(30);
        query.lte(40);
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().query(query);
        request.source(searchSourceBuilder);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

查询结果:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7001",
  "_score" : 1.0,
  "_source" : {
    "name" : "方腊",
    "sex" : "男",
    "age" : "38",
    "title" : "教授"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.0,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
```

### 模糊查询

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.unit.Fuzziness;
import org.elasticsearch.index.query.FuzzyQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.RangeQueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 模糊查询
 */
public class DocFuzzyQuery {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 组合条件
        FuzzyQueryBuilder query = QueryBuilders.fuzzyQuery("name", "宋").fuzziness(Fuzziness.ONE);
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().query(query);
        request.source(searchSourceBuilder);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

### 高亮查询

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.unit.Fuzziness;
import org.elasticsearch.index.query.FuzzyQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.TermQueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightBuilder;
/**
 * 模糊查询
 */
public class DocHigLightQuery {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 组合条件
        TermQueryBuilder query = QueryBuilders.termQuery("name", "宋");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().query(query);
        request.source(searchSourceBuilder);
        HighlightBuilder highlight = SearchSourceBuilder.highlight();
        highlight.preTags("<font color='red'");
        highlight.postTags("/font>");
        highlight.field("name");
        searchSourceBuilder.highlighter(highlight);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

响应结果:

```java
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.2613049,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  },
  "highlight" : {
    "name" : [
      "<font color='red'宋/font>江"
    ]
  }
}
```

### 聚合查询

查询最大年龄

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.TermQueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.aggregations.AggregationBuilder;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.metrics.ParsedMax;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightBuilder;
/**
 * 模糊查询
 */
public class DocPolyQuery {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 组合条件
        AggregationBuilder query = AggregationBuilders.max("maxAge").field("age");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().aggregation(query);
        request.source(searchSourceBuilder);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        System.out.println(((ParsedMax) search.getAggregations().get("maxAge")).getValue());
        System.out.println(search.getAggregations().getAsMap().get("maxAge").getName());
        SearchHits hits = search.getHits();
        hits.forEach(System.out::println);
        client.close();
    }
}
```

查询输出:

```java
38.0
maxAge
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7001",
  "_score" : 1.0,
  "_source" : {
    "name" : "方腊",
    "sex" : "男",
    "age" : "38",
    "title" : "教授"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7002",
  "_score" : 1.0,
  "_source" : {
    "name" : "宋江",
    "sex" : "男",
    "age" : "35",
    "title" : "副教授"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7003",
  "_score" : 1.0,
  "_source" : {
    "name" : "花荣",
    "sex" : "男",
    "age" : "25",
    "title" : "助教"
  }
}
{
  "_index" : "teacher",
  "_type" : "_doc",
  "_id" : "7004",
  "_score" : 1.0,
  "_source" : {
    "name" : "孙二娘",
    "sex" : "女",
    "age" : "28",
    "title" : "副教授"
  }
}
Process finished with exit code 0
```

### 分组查询

分组查询也是聚合查询的一种，他可以按照某个字段进行分组，统计。比如统计个数.

```java
package com.maomao.elastic.search.query;
import org.apache.http.HttpHost;
import org.apache.lucene.queryparser.flexible.standard.builders.GroupQueryNodeBuilder;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.aggregations.AggregationBuilder;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.ParsedLongTerms;
import org.elasticsearch.search.aggregations.metrics.ParsedMax;
import org.elasticsearch.search.builder.SearchSourceBuilder;
/**
 * 分组查询
 */
public class DocGroupQuery {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 3. 分页查询
        SearchRequest request = new SearchRequest();
        request.indices("teacher");
        // 分组查询
        AggregationBuilder query = AggregationBuilders.terms("ageGroup").field("age");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().aggregation(query);
        request.source(searchSourceBuilder);
        SearchResponse search = client.search(request, RequestOptions.DEFAULT);
        ((ParsedLongTerms) search.getAggregations().get("ageGroup")).getBuckets().forEach(item -> {
            System.out.println(item.getKey() + "===>>" + item.getDocCount());
        });
        client.close();
    }
}
```

输出结果’

```java
25===>>1
28===>>1
35===>>1
38===>>1
```
