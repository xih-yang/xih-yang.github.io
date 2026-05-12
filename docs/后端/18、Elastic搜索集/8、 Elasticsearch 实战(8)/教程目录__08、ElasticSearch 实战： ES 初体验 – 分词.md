# 08、ElasticSearch 实战： ES 初体验 – 分词
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/8.html
- 分类：搜索引擎
- 分组：教程目录
前面几章节中我们安装和配置了 Elasticsearch，也知晓了 Elasticsearch RESTful API 使用 HTTP 作为传输协议，使用 JSON 作为数据交换格式

任何语言或框架的入门必须是输出 Hello World ，但是，要怎么在 Elasticsearch 输出 Hello World 我却没有任何思绪

算了，我们先来讲讲分割句子

## 分割句子为单个单词

假如我们有一个问候语

```java
Hello World , Nice to meet you !
```

我们想把它分割成一个一个单词，如

```java
"Hello", "World", ",", "Nice", "to", "meet", "you", "!"
```

这在各种语言中简直就是内建操作

### JavaScript

JavaScript 中可以使用 split() 方法来分割

```java
'Hello World , Nice to meet you !'.split(' ')
```

输出结果如下

```java
["Hello", "World", ",", "Nice", "to", "meet", "you", "!"]
```

### PHP

PHP中可以使用 explode() 方法来分割

```java
<?php
    $words = explode(' ', 'Hello World , Nice to meet you !');
    print_r( $words );
```

输出结果如下

```java
Array
(
    [0] => Hello
    [1] => World
    [2] => ,
    [3] => Nice
    [4] => to
    [5] => meet
    [6] => you
    [7] => !
)
```

## Elasticsearch 分词

Elasticsearch 也可以把一个句子分割成一个一个单词，不过它有一个更好听的名字，叫做分词，能做的事情也比普通的 split() 函数多更多

Elasticsearch 可以通过向 /_analyze 发起一个 HTTP POST 请求并传递需要分析的文本和分析器类型对一段文本进行分词

```java
POST http://localhost:9200/_analyze 
```

请求正文

```java
{
   "analyzer" : "standard",    # 分词器，我们使用默认的  standard
   "text" : "Hello World , Nice to meet you !"  # 要分割的文本
}
```

返回响应

```java
{
  "tokens" : [
    {
      "token" : "hello",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "world",
      "start_offset" : 6,
      "end_offset" : 11,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "nice",
      "start_offset" : 14,
      "end_offset" : 18,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "to",
      "start_offset" : 19,
      "end_offset" : 21,
      "type" : "<ALPHANUM>",
      "position" : 3
    },
    {
      "token" : "meet",
      "start_offset" : 22,
      "end_offset" : 26,
      "type" : "<ALPHANUM>",
      "position" : 4
    },
    {
      "token" : "you",
      "start_offset" : 27,
      "end_offset" : 30,
      "type" : "<ALPHANUM>",
      "position" : 5
    }
  ]
}
```

后面的章节中我们会看到这种 请求 - 请求正文 - 响应正文 的格式

**1、** POSThttp://localhost:9200/_analyze?pretty表示对http://localhost:9200/_analyze发起一个HTTPPOST的请求；

```java
pretty 参数表示对结果进行格式化，以方便阅读
```

**2、****请求正文**表示发起的请求要传输的正文(body)；

**3、****响应正文**表示Elasticsearch对发起的请求的响应结果；

上面这个 HTTP 请求，如果使用 curl 命令，那么格式如下

```java
curl -XPOST http://localhost:9200/_analyze\?pretty  -H'Content-Type:application/json' -d '{
   "analyzer" : "standard",
   "text" : "Hello World , Nice to meet you !"
}'
```

且会返回一个格式化了的 JSON 数据

```java
{
  "tokens" : [
    {
      "token" : "hello",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "world",
      "start_offset" : 6,
      "end_offset" : 11,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "nice",
      "start_offset" : 14,
      "end_offset" : 18,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "to",
      "start_offset" : 19,
      "end_offset" : 21,
      "type" : "<ALPHANUM>",
      "position" : 3
    },
    {
      "token" : "meet",
      "start_offset" : 22,
      "end_offset" : 26,
      "type" : "<ALPHANUM>",
      "position" : 4
    },
    {
      "token" : "you",
      "start_offset" : 27,
      "end_offset" : 30,
      "type" : "<ALPHANUM>",
      "position" : 5
    }
  ]
}
```

从结果中可以看出 Elasticsearch 内置的标准的分词器 standard 将我们的问候语划分为 6 个单词，剔除了文本中的标点符号，同时把所有的大写字母改成了小写

作为搜索来说，这是我们想要的结果，因为大小写显得不是那么重要，至于标点符号，那就更不重要了

上面我们传递的问候语是英文的，如果我们使用中文的问候语呢，比如

```java
你好，世界，很高兴认识你！
```

我们试一试吧，对 http://localhost:9200/_analyze 发起一个 HTTP POST 请求

```java
POST http://localhost:9200/_analyze 
```

请求正文

```java
{
   "analyzer" : "standard",
   "text" : "你好，世界，很高兴认识你！"
}
```

返回响应

```java
{
  "tokens" : [
    {
      "token" : "你",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "<IDEOGRAPHIC>",
      "position" : 0
    },
    {
      "token" : "好",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "<IDEOGRAPHIC>",
      "position" : 1
    },
    {
      "token" : "世",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "<IDEOGRAPHIC>",
      "position" : 2
    },
    {
      "token" : "界",
      "start_offset" : 4,
      "end_offset" : 5,
      "type" : "<IDEOGRAPHIC>",
      "position" : 3
    },
    {
      "token" : "很",
      "start_offset" : 6,
      "end_offset" : 7,
      "type" : "<IDEOGRAPHIC>",
      "position" : 4
    },
    {
      "token" : "高",
      "start_offset" : 7,
      "end_offset" : 8,
      "type" : "<IDEOGRAPHIC>",
      "position" : 5
    },
    {
      "token" : "兴",
      "start_offset" : 8,
      "end_offset" : 9,
      "type" : "<IDEOGRAPHIC>",
      "position" : 6
    },
    {
      "token" : "认",
      "start_offset" : 9,
      "end_offset" : 10,
      "type" : "<IDEOGRAPHIC>",
      "position" : 7
    },
    {
      "token" : "识",
      "start_offset" : 10,
      "end_offset" : 11,
      "type" : "<IDEOGRAPHIC>",
      "position" : 8
    },
    {
      "token" : "你",
      "start_offset" : 11,
      "end_offset" : 12,
      "type" : "<IDEOGRAPHIC>",
      "position" : 9
    }
  ]
}
```

从结果中可以看出 Elasticsearch 内置的标准的分词器 standard 将我们的问候语划分为 9 个单词，剔除了文本中的标点符号

但是，但是这是我们想要的分词结果吗？

显然不是，我们想要的不是

```java
你 好 世 界 很 高 兴 认 识 你
```

我们想要的分词结果应该是

```java
你好 世界  很 高兴 认识 你
```

为了达到我们想要的结果，我们就不能使用默认的分词器，我们应该使用我们中文的分词器

下一章节，我们将会介绍如何配置安装中文分词器，并对刚刚的问候语进行合适的分词
