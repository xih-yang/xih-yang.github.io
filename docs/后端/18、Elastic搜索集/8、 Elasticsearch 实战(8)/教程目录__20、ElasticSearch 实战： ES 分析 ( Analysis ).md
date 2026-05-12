# 20、ElasticSearch 实战： ES 分析 ( Analysis )
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/20.html
- 分类：搜索引擎
- 分组：教程目录
Analysis 很多文档都将它翻译为 **分析**，其实也是蛮有道理的，因为 **Analysis** 不仅有分词的过程，还要负责分析已分词的情况

其实从使用上看，翻译成分词更好，毕竟提起分词，大家都知道啥意思，但分析，谁能第一时间想到要先分词

搜索操作过程中处理查询时，任何索引中的内容均由分析模块进行分析

分析模块一般由分析器、标记器、tokenfilters 和 charfilters 组成

如果没有显式的定义任何分析器，那么 Elasticsearch 会使用相应的默认的内建分析器，这些默认的分析器由分析模块注册，包括分析器、令牌、过滤器和标记器

### 范例

例如下面这个请求，创建一个默认的图片索引

```java
POST http://localhost:9200/pictures
```

请求正文

```java
{
   "settings": {
      "analysis": {
         "analyzer": {
            "index_analyzer": {
               "tokenizer": "standard", "filter": [
                  "standard", "my_delimiter", "lowercase", "stop", 
                     "asciifolding", "porter_stem"
               ]
            },
            "search_analyzer": {
               "tokenizer": "standard", "filter": [
                  "standard", "lowercase", "stop", "asciifolding", "porter_stem"
               ]
            }
         },
         "filter": {
            "my_delimiter": {
               "type": "word_delimiter",
               "generate_word_parts": true,
               "catenate_words": true,
               "catenate_numbers": true,
               "catenate_all": true,
               "split_on_case_change": true,
               "preserve_original": true,
               "split_on_numerics": true,
               "stem_english_possessive": true
            }
         }
      }
   }
}
```

## 分析过程

分析( analysis ) 是这样一个过程：

**1、** 首先，标记化一个文本块为适用于倒排索引单独的**词**(term)；

**2、** 然后标准化这些词为标准形式，提高它们的「可搜索性」和「查全率」；

这两个工作由 分析器 (analyzer) 完成的

一个分析器 (analyzer) 一般由下面三个功能组成：

**1、****字符过滤器**；

```java
首先字符串经过字符过滤器( character filter )，它们的工作是在标记化前处理字符串
字符过滤器能够去除 HTML 标记，或者转换 "&" 为 "and"
```

**2、****分词器**；

```java
下一步，分词器 (tokenizer) 被标记化成独立的词
一个简单的分词器 (tokenizer) 可以根据空格或逗号将单词分开
> 译者注：这个在中文中不适用
```

**3、****标记过滤**；

```java
最后，每个词都通过所有标记过滤(token filters)，它可以修改词（例如将 "Quick" 转为小写），去掉词（ 例如停用词像 "a"、"and"、"the"等等），或者增加词（ 例如同义词像 "jump" 和 "leap" ）
```

Elasticsearch 提供很多开箱即用的字符过滤器，分词器和标记过滤器

这些可以组合来创建自定义的分析器以应对不同的需求

## 分析器

分词器由一个标记器和可选的标记过滤器组成

下表列出了 Elasticsearch 提供的大量的内置分词器，这些分词器在分析模块中使用逻辑名称进行注册，可以在映射定义中或在某些 API 中引用它们

分析器
逻辑名
说明

标准分词器
standard
可以自定义停止词 ( stopwords ) 和最大 token 长度 ( max_token_length )
默认设置中，停止词为空，最大 token 长度为 255

简单分词器
simple
该分词器使用了小写标记器 (lowercase tokenizer )

空白分词器
whitespace
该非瓷器使用了空白标记器 ( whitespace tokenizer )

停止词分词器
stop
可以自定义停止词 ( stopwords ) 和停止词所在路径保存 ( stopwords_path )
默认情况下，停止词使用了英文停止词 ( English stop words ) ，而停止词保存路径则是该英文停止词文件所在的路径

关键字分析器
keyword
该分析器将传递的所有参数内容视为一个单一标记，可以用于类似电话号码或邮政编码等

正则分析器
pattern
该分析器主要处理正则表达式。可以在此分析器中设置大小写敏感、模式、标志、停用词等

特定语言分析器

该分析仪处理诸如印地语，阿拉伯语，荷兰语等

雪球分析器
snowball
该分析器使用标准的分词器，并且组合使用了标准过滤器、小写过滤器、停止词过滤器和雪球过滤器

自定义分析器
custom
主要在用户需要自定义分析器时使用，由自定义分词器，可选的标记过滤器和可选的字符过滤器组成
可以设置的选项有分词器 ( tokenizer ), 过滤器 ( filter ), 字符过滤器 ( char_filter ) 和 position_increment_gap

## 分词器 ( Tokenizers )

分词器可以将一段分本分割为一个一个单词或词语

一个简单的分词器 ( tokenizer ) 可以根据空格或逗号将单词分开 ( 这个在中文中不适用 )

Elasticsearch 提供了有许多内置的分词器，我们也可用于自定义分词器

分词器
逻辑名
说明

标准分词器
standard
该分词器使用基于词的语法来分词，可配置的选项有 max_token_length

edgeNGram 分词器
edgeNGram
可以配置的选项有 min_gram, max_gram , token_chars

关键字分词器
keyword
该分词器将一整块的输入数据作为一个单独的分词。可以配置的选项有 buffer_size

字母分词器
letter
该分词器会将遇到非字母之前的所有字母视为一个词

小写分词器
lowercase
和字母分词器相同，但在获取到一个词后会将其中的大写字母转换为小写

NGram 分词器
nGram
可配置的选项有 min_gram ( 默认值 1) 、 max_gram (默认值 2 ) 和 token_chars

空白符分词器
whitespace
这个过滤器使用空白符划分文本

正则分词器
pattern
使用正则表达式作为分词分隔符，可以配置的选项有 Pattern, flags 和 group

UAX Email URL Tokenizer
uax_url_email
和标准分词器相同，但会把电子邮件和 URL 视为一个单独的词

层级路径分词器
path_hierarchy
该分词器会生成输入路径的所有可能路径
可配置的选项有 delimiter ( 默认 / ), replacement, buffer_size ( 默认 1024), reverse ( 默认 false ) 和 skip ( 默认 0 )

经典分词器
classic
该分词器使用基于词的基本语法来分词。可配置的选项有 max_token_length

泰语分词器
thai
使用内置的泰语分词算法对泰语进行分词

## 标记过滤器 ( token filters )

标记过滤可以修改词 ( 例如将 “Quick” 转为小写），去掉词（ 例如停用词像 “a”、”and”、”the” 等等 ），或者增加词 ( 例如同义词像 “jump” 和 “leap” )

Elasticsearch 提供很多开箱即用的字符过滤器

## 字符过滤器

这些过滤器一般在分词器之前使用

字符过滤器查找特殊字符或 HTML 标记或指定模式，然后将其删除或更改为适当的单词，例如将 ＆ 改成 and , 同时移除 html 标记标签

下面的代码是一个分析器的例子，synonym.txt 文件用于指定同义词

```java
{
    "settings":{
        "index":{
            "analysis":{
                "analyzer":{
                    "synonym":{
                        "tokenizer":"whitespace",
                        "filter":["synonym"]
                    }
                },
                "filter":{
                    "synonym":{
                        "type":"synonym", 
                        "synonyms_path":"synonym.txt", 
                        "ignore_case":"true"
                    }
                }
            }
        }
    }
}
```
