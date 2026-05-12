# 07、ElasticSearch 实战：es的嵌套聚合，下钻分析，聚合分析
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/7.html
- 分类：搜索引擎
- 分组：教程目录
演示前先往es写入三条商品数据用来演示查询

```java
PUT /product/book/1
{
	"product_name": "yuwen shu",
	"price": 20,
	"all_tags": ["bad","ugly"]
}
```

```java
PUT /product/book/2
{
	"product_name": "shuxue shu",
	"price": 10,
	"all_tags": ["good","ugly"]
}
```

### 1、统计每个标签对应的商品数量

对all_tags字段做聚合/排序/脚本访问我们需要先把all_tags字段默认关闭的fielddata开启

```java
PUT /product/_mapping/book
{
  "properties": {
    "all_tags": {
      "type": "text",
      "fielddata": true
    }
  }
}
```

开始演示

```java
GET /product/book/_search
{
  "size": 0,
  "aggs": {
    "terms_all_tags": {
      "terms": { "field": "all_tags" }
    }
  }
}
```

aggregations.terms_all_tags.buckets.key：标签

aggregations.terms_all_tags.buckets.doc_count：该标签对应的商品数量

### 2、对商品名称包含shu的商品，统计每个标签对应的商品数量

```java
GET /product/book/_search
{
  "size": 0,
  "query": {
    "match": {
      "product_name": "shu"
    }
  },
  "aggs": {
    "terms_all_tags": {
      "terms": {
        "field": "all_tags"
      }
    }
  }
}
```

### 3、计算每个标签对应的商品的平均价格

```java
GET /product/book/_search
{
    "size": 0,
    "aggs" : {
        "terms_all_tags" : {
            "terms" : { "field" : "all_tags" },
            "aggs" : {
                "avg_price" : {
                    "avg" : { "field" : "price" }
                }
            }
        }
    }
}
```

### 4、计算每个标签对应的商品的平均价格并按平均价格降序排序

```java
GET /product/book/_search
{
    "size": 0,
    "aggs" : {
        "terms_all_tags" : {
            "terms" : { "field" : "all_tags", "order": { "avg_price": "desc" } },
            "aggs" : {
                "avg_price" : {
                    "avg" : { "field" : "price" }
                }
            }
        }
    }
}
```

### 5、按价格区间进行分组，然后在每组内计算每个标签对应的商品的平均价格

```java
GET /product/book/_search
{
  "size": 0,
  "aggs": {
    "range_price": {
      "range": {
        "field": "price",
        "ranges": [
          {
            "from": 0,
            "to": 50
          },
          {
            "from": 50,
            "to": 100
          }
        ]
      },
      "aggs": {
        "terms_all_tags": {
          "terms": {
            "field": "all_tags"
          },
          "aggs": {
            "average_price": {
              "avg": {
                "field": "price"
              }
            }
          }
        }
      }
    }
  }
}
```
