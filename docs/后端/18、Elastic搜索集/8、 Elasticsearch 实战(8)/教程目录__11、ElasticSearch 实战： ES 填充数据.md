# 11、ElasticSearch 实战： ES 填充数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/11.html
- 分类：搜索引擎
- 分组：教程目录
上一章节我们已经规划好了要填充的用户、索引和 JSON 数据，本章节我们就把它们添加到 Elasticsearch 中吧。

本章节中，我们将添加一些索引、映射和数据到 Elasticsearch 中。为后面的章节添加一些测试用例

## 创建索引

```java
PUT http://localhost:9200/user_admin?pretty
```

#### 请求正文

可以在请求正文中包含特定于索引的设置，但现在，默认设置为空

#### 响应

```java
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "user_admin"
}
```

意思是创建索引成功

## 创建映射和添加数据

Elasticsearch 会根据请求正文中提供的数据自动创建映射

这里，我们使用批量添加功能在此索引中添加多个 JSON 对象

```java
POST http://localhost:9200/user_admin/_bulk?pretty
```

请求正文

```java
{"index":{"_index":"user_admin", "_type":"user", "_id":"1"} }
{"nickname":"站长","description":"创业是的天赋是天生的，而我偏偏是后生的","street":"东四十条","city":"Beijing","state":"Beijing","zip":"100007","location":[116.432727,39.937732],"money":5201314,"tags":["PHP", "Python"],"vitality":"9.0"}
{"index":{"_index":"user_admin", "_type":"user", "_id":"2"}}
{"nickname":"雅少","description":"虚怀若谷","street":"四川大学","city":"Chengdu","state":"Sichuan","zip":"610044","location":[104.094537,30.640174],"money":68023,"tags":["Python", "HTML"],"vitality":"7.8"}
{"index":{"_index":"user_admin", "_type":"user", "_id":"3"}}
{"nickname":"歌者","description":"程序设计也是设计，研发新菜也是研发","street":"五道口","city":"Beijing","state":"Beijing","zip":"100083","location":[116.346346,39.999333],"money":71128,"tags":["Java", "Scala"],"vitality":"6.9"}
```

响应内容

```java
{
    "took": 1001,
    "errors": false,
    "items": [
        {
            "index": {
                "_index": "user_admin",
                "_type": "user",
                "_id": "1",
                "_version": 1,
                "result": "created",
                "_shards": {
                    "total": 2,
                    "successful": 1,
                    "failed": 0
                },
                "_seq_no": 0,
                "_primary_term": 1,
                "status": 201
            }
        },
        {
            "index": {
                "_index": "user_admin",
                "_type": "user",
                "_id": "2",
                "_version": 1,
                "result": "created",
                "_shards": {
                    "total": 2,
                    "successful": 1,
                    "failed": 0
                },
                "_seq_no": 0,
                "_primary_term": 1,
                "status": 201
            }
        },
        {
            "index": {
                "_index": "user_admin",
                "_type": "user",
                "_id": "3",
                "_version": 1,
                "result": "created",
                "_shards": {
                    "total": 2,
                    "successful": 1,
                    "failed": 0
                },
                "_seq_no": 0,
                "_primary_term": 1,
                "status": 201
            }
        }
    ]
}
```

> _bulk 模式 JSON 串有逆天的要求：每个json串不能换行，只能放一行，同时一个json串和一个json串之间，必须有一个换行，最后要以一个新行结尾
>
> 否则就会报错：json_e_o_f_exception

## 添加另一个索引

#### 创建索引

```java
POST http://localhost:9200/user?pretty
```

#### 请求正文

可以在请求正文中包含特定于索引的设置，但现在，默认设置为空

#### 响应

```java
{
    "acknowledged": true,
    "shards_acknowledged": true,
    "index": "user"
}
```

### 创建映射和添加数据

```java
POST http://localhost:9200/user/_bulk?pretty
```

请求正文

```java
{"index":{"_index":"user", "_type":"user", "_id":"1"} }
{"nickname":"question", "description":"问题少年也是少年","street":"张江高科技园区","city":"Shanghai","state":"Shanghai","zip":"201204","location":[121.60632,31.199305],"money":13648,"tags":["VUE", "HTML"],"vitality":"8.8"}
{"index":{"_index":"user", "_type":"user", "_id":"2"} }
{"nickname":"枫晚","description":"停车坐爰枫林晚","street":"苏州大学","city":"Suzhou","state":"Jiangsu","zip":"215006","location":[120.65426,31.30797],"money":10235,"tags":["Java", "Android"],"vitality":"3.5"}
```

响应内容

```java
{"index":{"_index":"user", "_type":"user", "_id":"1"} }
{"nickname":"question", "description":"问题少年也是少年","street":"张江高科技园区","city":"Shanghai","state":"Shanghai","zip":"201204","location":[121.60632,31.199305],"money":13648,"tags":["VUE", "HTML"],"vitality":"8.8"}
{"index":{"_index":"user", "_type":"user", "_id":"2"} }
{"nickname":"枫晚","description":"停车坐爰枫林晚","street":"苏州大学","city":"Suzhou","state":"Jiangsu","zip":"215006","location":[120.65426,31.30797],"money":10235,"tags":["Java", "Android"],"vitality":"3.5"}
```
