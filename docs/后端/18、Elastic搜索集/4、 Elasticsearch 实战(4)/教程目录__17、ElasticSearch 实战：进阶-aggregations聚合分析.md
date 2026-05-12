# 17、ElasticSearch 实战：进阶-aggregations聚合分析
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/17.html
- 分类：搜索引擎
- 分组：教程目录
> 接第16节

#### 9) 、aggregations (执行聚合)

聚合提供了从数据中`分组和提取数据`的能力。

最简单的聚合方法大致等于 `SQL GROUP BY` 和 `SQL 聚合函数`。

在Elasticsearch 中，您有执行搜索返回 hits (命中结果)，并且同时返回聚合结果，

把一个响应中的所有hits(命中结果)分隔开的能力。这是非常强大且有效的，您可以执行查询和多个聚合，

并且在一次使用中得到各自的(任何一个的)返回结果，使用一次简洁和简化的 API 来避免网络往返。

aggregations 查询语法：

```java
"aggregations" : {
    "<aggregation_name>" : {
        "<aggregation_type>" : {
            <aggregation_body>
        }
        [,"meta" : {
       [<meta_data_body>] } ]?
        [,"aggregations" : {
      [<sub_aggregation>]+ } ]?
    }
    [,"<aggregation_name_2>" : {
      ... } ]*
}
```

举个栗子：

- 搜索address中包含mill的所有人的年龄分布以及平均年龄，但不显示这些人的详情。

```java
GET /bank/_search
{
  "query": {
      //查询
    "match": {
      "address": "mill"
    }
  },
  "aggs": {
      //聚合
    "ageAgg": {
      //年龄分布
      "terms": {
        "field": "age",
        "size": 10 //只取10中聚合的结果
      }
    },
    "ageAvg":{
     //平均年龄，基于上一次的结果
      "avg": {
        "field": "age"
      }
    },
    "balanceAvg":{
     //平均薪资
      "avg": {
        "field": "balance"
      }
    }
  },
  "size": 0 //不显示搜索数据，只显示聚合结果
}
```

```java
aggs，执行聚合。聚合语法如下:
"aggs":{
	"ages_name 这次聚合的名字,方便展示在结果集中":{
		"AGG-TYPE 聚合的类型(avg,term,terms) ":{
     }
	}
}
```

- 复杂聚合：按照年龄聚合，并且请求这些年龄段的这些人的平均薪资（使用一个子聚合）

```java
GET /bank/_search
{
  "query": {
    "match_all": {
     }
  },
  "aggs": {
    "ageAgg": {
      "terms": {
     //年龄范围分布聚合
        "field": "age",
        "size": 100//返回100中情况
      },
      "aggs": {
     //基于ageAgg的结果做聚合
        "ageAvg": {
          "avg": {
     //求balance的平均值
            "field": "balance"
          }
        }
      }
    }
  }
}
```

- 复杂聚合进阶：查出所有年龄分布，并且这些年龄段中M的平均薪资和F的平均薪资以及这个年龄段的总体平均新资

```java
GET /bank/_search
{
  "query": {
    "match_all": {
     }
  },
  "aggs": {
     //聚合
    "ageAgg":{
      "terms": {
     //年龄分布
        "field": "age",
        "size": 100
      },
      "aggs": {
     //基于ageAgg做聚合
        "genderAgg": {
     //性别分布
          "terms": {
            //文本字段聚合使用keyword进行精确匹配，否则会报错
            "field": "gender.keyword",
            "size": 10
          },
          "aggs": {
     //基于genderAgg做聚合
            "balanceAvg": {
     //求性别为M和F的各自的平均薪资
              "avg": {
                "field": "balance"
              }
            }
          }
        },
        "ageBalanceAvg":{
     //基于ageAgg，求各个年龄段的平均薪资
          "avg": {
            "field": "balance"
          }
        }
      }
    }
  }
}
```

更多聚合查询操作，请参考 ES 官方文档：[参考文档-search-aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html)

> 参考文档-query-dsl
