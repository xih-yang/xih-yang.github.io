# 10、ElasticSearch 实战：ElasticSearch文档分页查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/10.html
- 分类：搜索引擎
- 分组：教程目录
## 文档分页查询

在实践中分页查询对于前段展示，性能等问题来说都是刚需。分页的方式其实就是在条件查询的内容体中加入分页数据。

在body体中添加两个关键字段：

**1、**`from`:起始的下标值，从`0`开始；

**2、**`size`:一页的数量；

请求body:

```java
{
    "query":{
        "match": {
            "category":"床上用品"
        }
    },
    "from":1,
    "size":1
}
```

因为使用的是`size =1`,所以只返回匹配的一条数据。其实页的计算就应该是：`（页码-1）*单页数量`。

### 修改返回内容的

比如我们期望查询部分字段，而并非所有字段的时候可以通过`_source`字段进行控制。比如仅查询`title`字段`"_source":["title"]`。

参数属性:`_source`。

```java
{
    "query":{
        "match": {
            "category":"床上用品"
        }
    },
    "from":1,
    "size":1,
    "_source":["title"]
}
```
