# 11、ElasticSearch 实战：ElasticSearch查询排序
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/11.html
- 分类：搜索引擎
- 分组：教程目录
## 查询排序

根据文档的部分字段信息排序。在查询条件中加入字段:`sort`,例如通过价格排序：

```java
{
    "query":{
        "match_all": {
        }
    },
    "sort":{
        "price":{
            "order":"asc"
        }
    }
}
```

请求操作

其中排序字段下可以指定排序的类型，递增、递减。

**1、**`asc`:递增排序；

**2、**`desc`:递减排序；
