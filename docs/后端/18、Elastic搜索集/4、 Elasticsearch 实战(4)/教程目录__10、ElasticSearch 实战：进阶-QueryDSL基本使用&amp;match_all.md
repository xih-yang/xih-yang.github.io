# 10、ElasticSearch 实战：进阶-QueryDSL基本使用&amp;match_all
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/10.html
- 分类：搜索引擎
- 分组：教程目录
> 接第9节

### 2、Query DSL

> 在上一节中使用的形如

```java
GET /bank/_search
{
  "query": {
    "match_all": {
      }
  },
  "sort": [
    {
      "account_number": "asc"
    },
    {
      "balance": "desc"
     }
   ]
 }
```

> 的查询语言风格，我们称之为 Query DSL。

#### 1)、基本语法格式

Elastisearch 提供了一个可以执行查询的 Json 风格的 DSl (domain-specific language 领域特定语言) 。这个被称为Query DSL。

该查询语言非常全面，并且刚开始的时候感觉有点复杂，真正学好它的方法是从一些基础的示例开始的。

- 一个查询语句的典型结构

```java
{
	QUERY_NAME:{
		ARGUMENT: VALUE,
		ARGUMENT: VALUE,
		...
	}
}
```

例如：

```java
GET /bank/_search
{
  "query": {
    "match_all": {}
  }
}
```

- 如果是针对某个字段,那么它的结构如下：

```java
{
	QUERY_NAME:{
		FIELD_NAME:{
			ARGUMENT: VALUE,
			ARGUMENT: VALUE,
			...
		}
	}
}
```

例如：

GET /bank/_search
{
 “query”: {
 “match_all”: {}
 },
 “sort”: [
 {
 “balance”: {
 “order”: “desc”
 }
 }
 ],
 “from”: 0,
 “size”: 5
}

- query 定义如何查询；
- match_all 查询类型【代表查询所有的所有】， es 中可以在 query 中组合非常多的查询类型完成复杂查询
- 除了 query 参数之外，我们也可以传递其它的参数以改变查询结果。如 sort，size；
- from+size 限定，完成分页功能；
- sort 排序，多字段排序，会在前序字段相等时后续字段内部排序，否则以前序为准

#### 2)、返回部分字段

```java
GET /bank/_search
{
  "query": {
    "match_all": {
     }
  },
  "sort": [
    {
      "balance": {
        "order": "desc"
      }
    }
  ],
  "from": 0,
  "size": 5,
  "_source": ["balance","firstname"]
}
```

只返回`_source` 中指定的字段，类似于 MySQL 中的 `select field_1,field_2,... from table`

> 参考文档-query-dsl
