# 24、ElasticSearch 实战：full text和exact value的查询演示
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/24.html
- 分类：搜索引擎
- 分组：教程目录
我们先写入三条演示数据

```java
PUT /product/book/1
{
  "post_date": "2020-01-01",
  "title": "my first book"
}
```

```java
PUT /product/book/2
{
  "post_date": "2020-01-02",
  "title": "my second book"
}
```

```java
PUT /product/book/3
{
  "post_date": "2020-01-03",
  "title": "my thrid book"
}
```

然后我们尝试各种搜索

```java
(1) GET /product/book/_search?q=2020		#搜索到3条数据          
(2) GET /product/book/_search?q=2020-01-01       搜索到3条数据
(3) GET /product/book/_search?q=post_date:2020-01-01  搜索到1条数据
```

接下来我们逐个分析下为什么会有这些结果出现

第(1),(2)个查询用的是_all元数据，三条演示数据进行分词后所拼接的字符串分别为

“2020-01-01 my first book”，"2020-01-02 my second book"，“2020-01-03 my thrid book”

我看看上面4个查询

(1) GET /product/book/_search?q=2020 #搜索到3条数据

此时会用2020去上面三个字符串找，因此找到三条数据

(2) GET /product/book/_search?q=2020-01-01 #搜索到3条数据

此时会把2020-01-01先分词成2020,01然后拿2020,01依次去上面三个字符串找，因此找到三条数据

(3) GET /product/book/_search?q=post_date:2020-01-01 #搜索到1条数据

post_date默认是date类型，会作为exact value去建立索引

doc1
doc2
doc3

2020-01-01
*

2020-01-02

*

2020-01-03

*

而query string会用跟建立倒排索引时一样的分词器去进行分词，因此请求关键字2020-01-01分词完后依然是2020-01-01，2020-01-01去倒排索引检索，因此找到一条数据
