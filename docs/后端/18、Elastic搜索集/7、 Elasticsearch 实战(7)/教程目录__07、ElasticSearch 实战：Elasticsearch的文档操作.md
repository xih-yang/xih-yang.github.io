# 07、ElasticSearch 实战：Elasticsearch的文档操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/7.html
- 分类：搜索引擎
- 分组：教程目录
**关于版本**

内容
版本

Elasticsearch版本
7.2.0

JAVA依赖版本
7.2.1

> Elasticsearch 7.x 和之前版本有相当大的变化，所以本篇内容尤其是JAVA代码的操作对于使用旧版本的同学帮助可能不大。因为本人主要是JAVA开发，在介绍相关操作的时候会附带JAVA代码操作的逻辑。

### 新增文档

完成了索引和映射的创建之后，我们就可以向ES实例中插入数据。

**http请求**

ES插入数据的时候，可以选择一个ID作为这次插入文档的ID来使用，当然不设置ID的时候系统会自动生成一个

- 指定ID格式

**请求地址**

```java
PUT localhost:9200/test_city_info/_doc/1
```

**请求参数**

```java
{
    "name": "北京",
    "population": "特大城市",
    "desc": "首都",
    "gdp": "万亿级",
    "province": "北京",
    "college": "清华、北大",
    "celebrity": "老舍"
}
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 0,
    "_primary_term": 3
}
```

使用自己的id需要注意一件事情。当指定的id在es中已经存在的时候，这个时候尝试使用上面的操作，系统会执行更新操作，使用新的文档覆盖掉之前的文档。假如你为了避免因为误操作而导致错误更新，可以在操作的时候指定操作类型`op_type=create`。这个时候系统检测到你对一个已经存在的ID进行新增操作的时候，会抛出异常

```java
localhost:9200/test_city_info/_doc/1?op_type=create
```

此时尝试保存文档到已经存在的id中的时候会抛出异常

```java
{
    "error": {
        "root_cause": [
            {
                "type": "version_conflict_engine_exception",
                "reason": "[1]: version conflict, document already exists (current version [6])",
                "index_uuid": "ljfFHhspSSmGaBVD3PHjbA",
                "shard": "0",
                "index": "test_city_info"
            }
        ],
        "type": "version_conflict_engine_exception",
        "reason": "[1]: version conflict, document already exists (current version [6])",
        "index_uuid": "ljfFHhspSSmGaBVD3PHjbA",
        "shard": "0",
        "index": "test_city_info"
    },
    "status": 409
}
```

- 不指定ID格式

不指定插入id的时候系统会默认生成一个id

```java
POST localhost:9200/test_city_info/_doc
```

**请求参数**

```java
{
    "name": "上海",
    "population": "特大城市",
    "desc": "经济中心、大城市",
    "gdp": "万亿级",
    "province": "上海",
    "college": "复旦大学",
    "celebrity": "黄炎培"
}
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "6MEczm0BIQZGGtiybqNs",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 1,
    "_primary_term": 3
}
```

在新增文档的时候，当你尝试向一个不存在的索引插入数据的时候，会发现系统并不会发生错误，而是直接创建一个默认的索引和映射。这个时候除了数据被保存下来，es中也会多一个新的索引和映射。有的时候这些操作可能并不是我们故意实现的。为了避免系统创建过多错误的索引，这个时候假如不希望es自动创建索引的话，需要修改其`action.auto_create_index`参数

```java
PUT localhost:9200/_cluster/settings
```

```java
HEAD Content-Type:application/json
```

**参数**

```java
{
    "persistent": {
        "action.auto_create_index": "false"
    }
}
```

**创建文档的java代码**

```java
    public static void createDoc() throws IOException {
        XContentBuilder builder = XContentFactory.jsonBuilder();
        builder.startObject();
        builder.field("name", "北京");
        builder.field("population", "特大城市");
        builder.field("desc", "首都");
        builder.field("gdp", "万亿级");
        builder.field("province", "北京");
        builder.field("college", "清华、北大");
        builder.field("celebrity", "老舍");
        builder.endObject();
        IndexRequest indexRequest = new IndexRequest("test_city_info")
            .id("1").source(builder);
        IndexResponse indexResponse = getClient() .index(indexRequest, RequestOptions.DEFAULT);
    }
```

### 查询文档

es使用`_doc`和`GET`请求方式查询已经保存的文档。

**http请求**

```java
GET localhost:9200/test_city_info/_doc/6MEczm0BIQZGGtiybqNs
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "6MEczm0BIQZGGtiybqNs",
    "_version": 1,
    "_seq_no": 1,
    "_primary_term": 3,
    "found": true,
    "_source": {
        "name": "上海",
        "population": "特大城市",
        "desc": "经济中心、大城市",
        "gdp": "万亿级",
        "province": "上海",
        "college": "复旦大学",
        "celebrity": "黄炎培"
    }
}
```

查询文档java代码

```java
    public static void queryDoc() throws IOException {
        GetRequest getRequest = new GetRequest(
            "test_city_info", //索引名称
            "1");   //文档id
        GetResponse response = getClient().get(getRequest, RequestOptions.DEFAULT);
        Map<String, Object> source = response.getSource();
        System.out.println(source);
    }
```

### 查询多个文档

和之前索引映射不同。查询多个文档的时候，我们需要将查询参数放入的请求体的JSON中。下面是进行多文档查询JSON的多个写法之一。

**http请求**

```java
GET localhost:9200/test_city_info/_mget
```

**请求头**

```java
HEAD Content-Type:application/json
```

**请求参数**

```java
{
    "docs": [
        {
            "_index": "test_city_info",
            "_type": "_doc",
            "_id": "1"
        },
        {
            "_index": "test_city_info",
            "_type": "_doc",
            "_id": "6MEczm0BIQZGGtiybqNs"
        }
    ]
}
```

**响应内容**

```java
{
    "docs": [
        {
            "_index": "test_city_info",
            "_type": "_doc",
            "_id": "1",
            "_version": 1,
            "_seq_no": 0,
            "_primary_term": 3,
            "found": true,
            "_source": {
                "name": "北京",
                "population": "特大城市",
                "desc": "首都",
                "gdp": "万亿级",
                "province": "北京",
                "college": "清华、北大",
                "celebrity": "老舍"
            }
        },
        {
            "_index": "test_city_info",
            "_type": "_doc",
            "_id": "6MEczm0BIQZGGtiybqNs",
            "_version": 1,
            "_seq_no": 1,
            "_primary_term": 3,
            "found": true,
            "_source": {
                "name": "上海",
                "population": "特大城市",
                "desc": "经济中心、大城市",
                "gdp": "万亿级",
                "province": "上海",
                "college": "复旦大学",
                "celebrity": "黄炎培"
            }
        }
    ]
}
```

**多文档请求JAVA代码**

多文档请求JAVA代码中使用了`MultiGetRequest`对象，后续我们操作的时候会接触到很多`Multi*****`相关的请求对象，ES中多请求操作的对象都是以此为前缀

```java
    public static void queryMultiDoc() throws IOException {
        MultiGetRequest multiGetRequest = new MultiGetRequest();
        MultiGetRequest.Item item1 = new MultiGetRequest.Item(
            "test_city_info", //索引名称
            "1");
        MultiGetRequest.Item item2 = new MultiGetRequest.Item(
            "test_city_info", //索引名称
            "6MEczm0BIQZGGtiybqNs");
        multiGetRequest.add(item1);
        multiGetRequest.add(item2);
        MultiGetResponse mget = getClient().mget(multiGetRequest, RequestOptions.DEFAULT);
        MultiGetItemResponse[] responses = mget.getResponses();
        for (int i = 0; i < responses.length; i++) {
            MultiGetItemResponse rest = responses[i];
            Map<String, Object> source = rest.getResponse().getSource();
            System.out.println(source);
        }
    }
```

### 修改文档

针对更新数据es提供了多种可能，除了传统的全量还提供了了部分字段更新，或者在更新操作中嵌套某些逻辑

**http请求**

```java
POST localhost:9200/test_city_info/_update/1
```

**请求头**

```java
HEAD Content-Type:application/json
```

**请求参数**

```java
{
    "doc": {
        "name": "北京",
        "population": "特大城市",
        "desc": "首都、特大城市",
        "gdp": "万亿级",
        "province": "北京",
        "college": "清华、北大",
        "celebrity": "老舍"
    }
}
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 2,
    "result": "updated",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 2,
    "_primary_term": 3
}
```

**java**

```java
    public static void updateDoc() throws IOException {
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("name", "北京");
        jsonMap.put("population", "特大城市");
        jsonMap.put("desc", "首都");
        jsonMap.put("gdp", "万亿级");
        jsonMap.put("province", "北京");
        jsonMap.put("college", "清华、北大");
        jsonMap.put("celebrity", "老舍");
        UpdateRequest request = new UpdateRequest("test_city_info", "1")
            .doc(jsonMap); //作为Map提供的部分文档源会自动转换为JSON格式
    }
```

修改文档中某个字段

使用脚本我们可以更新某个数据部分内容。

**http请求**

```java
POST localhost:9200/test_city_info/_update/1
```

**请求头**

```java
HEAD Content-Type:application/json
```

**请求参数**

```java
{
    "script": "ctx._source.remove(\"desc\")"
}
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 3,
    "result": "updated",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 3,
    "_primary_term": 3
}
```

**查询后内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 3,
    "_seq_no": 3,
    "_primary_term": 3,
    "found": true,
    "_source": {
        "name": "北京",
        "population": "特大城市",
        "gdp": "万亿级",
        "province": "北京",
        "college": "清华、北大",
        "celebrity": "老舍"
    }
}
```

在请求值的赋值动作上，我们不需要直接赋上最终结果，可以将其结果使用请求体中的某些参数的值

**http请求**

```java
POST localhost:9200/test_city_info/_update/1
HEAD Content-Type:application/json
参数
{
    "script": {
        "source": "ctx._source.desc = params.desc",
        "params": {
            "desc": "新的描述"
        }
    }
}
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 5,
    "result": "updated",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 5,
    "_primary_term": 3
}
```

**查询后内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 5,
    "_seq_no": 5,
    "_primary_term": 3,
    "found": true,
    "_source": {
        "name": "北京",
        "population": "特大城市",
        "gdp": "万亿级",
        "province": "北京",
        "college": "清华、北大",
        "celebrity": "老舍",
        "desc": "新的描述"
    }
}
```

### 删除文档

删除文档内容比较简单，使用`DELETE`方法，将之前创建请求就可以修改为删除请求

**http请求**

```java
localhost:9200/test_city_info/_doc/1
```

**响应内容**

```java
{
    "_index": "test_city_info",
    "_type": "_doc",
    "_id": "1",
    "_version": 7,
    "result": "deleted",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 7,
    "_primary_term": 3
}
```

**删除文档JAVA逻辑**

```java
    public static void deleteDoc() throws IOException {
        DeleteRequest request = new DeleteRequest(
            "test_city_info",    //索引
            "6MEczm0BIQZGGtiybqNs");       //文档id
        DeleteResponse delete = getClient().delete(request, RequestOptions.DEFAULT);
    }
```
