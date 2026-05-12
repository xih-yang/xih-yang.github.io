# 19、ElasticSearch 实战： ES 映射 ( Mapping )
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/19.html
- 分类：搜索引擎
- 分组：教程目录
索引中每个文档都有一个类型( type ) 。 每个类型拥有自己的映射 ( mapping )或者模式定义 (schema definition)

一个映射定义了字段类型，每个字段的数据类型，以及字段被 Elasticsearh 处理的方式。映射还用于设置关联到类型上的元数据

所以，从某些方面说，映射是存储在索引中的文档的大纲，或者说相当于数据库中的某个表的表结构

### 范例

例如下面这个请求，用于定义银行账户详情

```java
POST http://localhost:9200/bankaccountdetails?pretty
```

请求正文

```java
{
"mappings":{
    "report":{
        "properties":{
            "name":{ "type":"text"}, 
            "date":{ "type":"date"},
            "balance":{ "type":"double"}, 
            "liability":{ "type":"double"}
        }
    }
}
}
```

返回响应如下

```java
{
"acknowledged" : true,
"shards_acknowledged" : true,
"index" : "bankaccountdetails"
}
```

## 字段类型

Elasticsearch 为文档中的字段提供了大量的数据类型支持。以下列出的数据类型都可以用来定义文档的字段类型

**1、** 基础数据类型；

Elasticsearch 几乎支持所有系统的基本数据类型

**1、** 整型(integer)；

**2、** 长整型(longint)；

**3、** 双精度型(double)；

**4、** 短整型(shortint)；

**5、** 字节型(byte)；

**6、** 浮点型(float)；

**7、** 字符串型(string)；

**8、** 日期类型(date)；

**9、** 布尔类型(boolean)；

**10、** 二进制类型(binary)；

**2、** 复合数据类型；

复合数据类型一般由一种或多种数据类型组合而成，比如数据、JSON 对象和嵌套数据类型。

下面的请求的请求正文和响应正文就是一个嵌套数据类型的

```java
POST http://localhost:9200/tabletennis/team/1?pretty
```

请求正文

```java
{
   "group" : "players",
   "user" : [
      {
         "first" : "dave", "last" : "jones"
      },
      {
         "first" : "kevin", "last" : "morris"
      }
   ]
}
```

响应正文

```java
{
  "_index" : "tabletennis",
  "_type" : "team",
  "_id" : "1",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}
```

**3、** Geo数据类型；

Geo数据类型用于定义一个地理位置信息

例如

数据类型
说明

geo_point
用于定义经度和纬度

geo_shape
用于定义矩形等不同的几何形状

**4、** 特殊的数据类型；

特殊的字段类型是指那些由特殊用途的数据类型

例如，IPv4("ip") 接受一个 IP 4 的地址

例如，自动完成数据类型用于支持自动完成或输入建议

例如，token_count 用于统计字符串中的令牌数量

## 类型映射

每个索引都会映射到一个或多个类型，这样就可以在逻辑上将索引的文档细分成一个个小的组成部分

如果传递的参数不同，那么映射类型也可以彼此不同

**1、****元字段**(Meta-Fields)；

这些字段提供了映射和与该字段有关的其它对象的信息

例如

**1、** _index；

**2、** _type；

**3、** _id；

**4、** _source；

**2、****普通字段**(Fields)；

不同的映射可以含有不同数量的字段，且字段的类型也可以各不相同

## 动态映射

Elasticsearch 提供了一个用户友好的自动创建映射机制

**用户可以将数据直接发布到任何未预先定义的映射中，Elasticsearch 将自动创建映射**

这种机制，称为动态映射

### 范例

例如下面的请求

```java
POST http://localhost:9200/accountdetails/tansferreport
```

请求正文

```java
{
"from_acc":"7056443341", "to_acc":"7032460534",
"date":"6/28/2019", "amount":10000
}
```

响应内容

```java
{
"_index" : "accountdetails",
"_type" : "tansferreport",
"_id" : "6EnaRmQBwP8hfMtC_uoj",
"_version" : 1,
"result" : "created",
"_shards" : {
"total" : 2,
"successful" : 1,
"failed" : 0
},
"_seq_no" : 0,
"_primary_term" : 1
}
```

## 映射参数

映射参数定义了映射的结构、字段的信息、存储的信息以及搜索时将如何分析映射的数据

下面列出了 Elasticsearch 支持的所有映射参数

**1、** analyzer；

**2、** boost；

**3、** coerce；

**4、** copy_to；

**5、** doc_values；

**6、** dynamic；

**7、** enabled；

**8、** fielddata；

**9、** geohash；

**10、** geohash_precision；

**11、** geohash_prefix；

**12、** format；

**13、** ignore_above；

**14、** ignore_malformed；

**15、** include_in_all；

**16、** index_options；

**17、** lat_lon；

**18、** index；

**19、** fields；

**20、** norms；

**21、** null_value；

**22、** position_increment_gap；

**23、** properties；

**24、** search_analyzer；

**25、** similarity；

**26、** store；

**27、** term_vector；
