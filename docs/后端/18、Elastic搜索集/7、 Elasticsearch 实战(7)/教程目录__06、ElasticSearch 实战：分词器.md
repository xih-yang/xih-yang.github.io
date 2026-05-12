# 06、ElasticSearch 实战：分词器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/6.html
- 分类：搜索引擎
- 分组：教程目录
### 分词器

分词器的主要作用将用户输入的一段文本，按照一定逻辑，分析成多个词语的一种工具。之前介绍Elasticsearch字段的时候知道字符串中的text类型需要配合分词器进行查询。这一篇就简单的介绍下我们日常接触的分词器。

> Elasticsearch本身就内置了一些分词器，但是它也提供了让我们自己安装分词器的功能。

#### 内置分词器

这里主要介绍的其内置的分词器

**词语分词**

词语分词是日常经常使用的分词工具，他将一段话根据一定规则进行拆分获得多个查询子短语

- 标准分词器
- 字母分词器
- 小写标记器
- 空格标记器
- UAX URL电子邮件分词器
- 经典分词器

**单词分词**

这种分词器主要关注单一的词，将一个词进行划分。这种拆分方式显然对于东亚很多地区的语言来说不适用。

- N-Gram令牌生成器
- Edge N-Gram令牌生成器

**结构化文本分词**

- 关键字标记器
- 正则分词器
- 简单分词器
- 字符组标记
- 简单模式分割标记器
- 路径标记器

##### 词语分词

##### 标准分词器（Standard Tokenizer）

根据standardUnicode文本分段算法的定义。将文本划分为多个单词边界的上的术语。分词的时候将内容转为小写，并移除大多数标点符号。可以通过配置停用词来忽略掉某些内容。

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ the, 2, quick, brown, foxes, jumped, over, the, lazy, dog's, bone ]
```

###### 可配置项#

```java
{
    "settings": {
        "analysis": {
            "analyzer": {
                "my_english_analyzer": {
                    "type": "standard",
                    "max_token_length": 5,
                    "stopwords": "_english_"
                }
            }
        }
    }
}
```

- max_token_length最大令牌长度。如果看到令牌超过此长度，则将其max_token_length间隔分割。默认为255。
- stopwords预定义的停用词列表，例如_english_或包含停用词列表的数组。默认为_none_。
- stopwords_path包含停用词的文件的路径。

##### 简单分词器（Letter Tokenizer）

当simple分析器遇到非字母的字符时，它会将文本划分为多个术语。它小写所有术语。对于中文和亚洲很多国家的语言来说是无用的

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ the, quick, brown, foxes, jumped, over, the, lazy, dog, s, bone ]
```

###### 可配置项#

该分词器没有可配置对象。

##### 小写分词器（Lowercase Tokenizer）

将输入内容转换为小写，然后再使用简单分词器进行分词

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ the, quick, brown, foxes, jumped, over, the, lazy, dog, s, bone ]
```

###### 可配置项#

该分词器没有可配置对象。

##### 空白分词器（Whitespace Tokenizer）

该whitespace分析仪将文本分为方面每当遇到任何空白字符。和上面的分词器不同，空白分词器默认并不会将内容转换为小写。

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ The, 2, QUICK, Brown-Foxes, jumped, over, the, lazy, dog's, bone. ]
```

###### 可配置项#

该分词器没有可配置对象。

##### 电子邮件分词器（UAX URL Email Tokenizer）

此分词器主要是针对email和url地址进行关键内容的标记。

###### 分词例子#

**原始内容**

```java
"Email me at john.smith@global-international.com"
```

**分词后内容**

```java
[ Email, me, at, john.smith@global-international.com ]
```

###### 可配置项#

```java
{
    "settings": {
        "analysis": {
            "analyzer": {
                "my_english_analyzer": {
                    "type": "standard",
                    "max_token_length": 5
                }
            }
        }
    }
}
```

- max_token_length最大令牌长度。如果看到令牌超过此长度，则将其max_token_length间隔分割。默认为255。

##### 经典分词器（Classic Tokenizer）

可对首字母缩写词，公司名称，电子邮件地址和互联网主机名进行特殊处理。但是，这些规则并不总是有效，并且此关键词生成器不适用于英语以外的大多数其他语言

- 它最多将标点符号拆分为单词，删除标点符号。但是，不带空格的点被认为是查询关键词的一部分
- 此分词器可以将邮件地址和URL地址识别为查询的term（词条）

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ The, 2, QUICK, Brown, Foxes, jumped, over, the, lazy, dog's, bone ]
```

###### 可配置项#

```java
{
    "settings": {
        "analysis": {
            "analyzer": {
                "my_analyzer": {
                    "tokenizer": "my_tokenizer"
                }
            },
            "tokenizer": {
                "my_tokenizer": {
                    "type": "classic",
                    "max_token_length": 5
                }
            }
        }
    }
}
```

- max_token_length最大令牌长度。如果看到令牌超过此长度，则将其max_token_length间隔分割。默认为255。

##### 断字分词

###### N-Gram分词器（N-Gram Tokenizer）和Edge N-Gram分词器（Edge N-Gram Tokenizer）#

所述ngram标记生成器可以分解文本成单词，当它遇到任何指定的字符的列表（例如，空格或标点），则它返回的n-gram的每个单词的：

比如这种文本

```java
"Quick Fox"
```

会被拆分成

```java
[ Q, Qu, u, ui, i, ic, c, ck, k, "k ", " ", " F", F, Fo, o, ox, x ]
```

而Edge N-Gram分词器会将

```java
"Quick Fox"
```

拆分成

```java
[ Q, Qu ]
```

**两者都支持配置**

- min_gram最小字符长度
- max_gram最大字符长度
- token_chars关键词中应包含的字符类。Elasticsearch将分割不属于指定类的字符。默认为[]

##### 结构化文本分词

###### 关键词分词器（Keyword Tokenizer）#

关键词分词器其实是执行了一个空操作的分析。它将任何输入的文本作为一个单一的关键词输出。

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ The 2 QUICK Brown-Foxes jumped over the lazy dog's bone. ]
```

会发现前后内容根本没有发生改变，这也是这个分词器的作用，有些时候我们针对一个需要分词查询的字段进行查询的时候，可能并不希望查询条件被分词，这个时候就可以使用这个分词器。整个查询条件作为一个关键词使用。

###### 可配置项#

该分词器没有可配置对象。

###### 正则分词器（Pattern Tokenizer）#

模式标记器使用 Java正则表达式。使用JAVA的正则表达式进行词语的拆分。

###### 分词例子#

**原始内容**

```java
"The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
```

**分词后内容**

```java
[ the, 2, quick, brown, foxes, jumped, over, the, lazy, dog, s, bone ]
```

###### 可配置项#

```java
{
    "settings": {
        "analysis": {
            "analyzer": {
                "my_email_analyzer": {
                    "type": "pattern",
                    "pattern": "\\W|_",
                    "lowercase": true
                }
            }
        }
    }
}
```

- pattern正则表达式
- flags正则表达式标识
- lowercase是否使用小写词汇
- stopwords停止词的列表。
- stopwords_path定义停止词文件的路径。

###### 简单正则分词器（Simple Pattern Tokenizer）#

该分词器使用Lucene正则表达式，它支持的正则表达式功能集比JAVA的正则表达式受到的限制比较多，但是效率比较好。

###### 路径分词器（Path Tokenizer）#

可以对文件系统的路径样式的请求进行拆分，返回被拆分各个层级内容。

**原始内容**

```java
"/one/two/three"
```

**分词后内容**

```java
[ /one, /one/two, /one/two/three ]
```

###### 可配置项#

```java
{
    "settings": {
        "analysis": {
            "analyzer": {
                "my_analyzer": {
                    "tokenizer": "my_tokenizer"
                }
            },
            "tokenizer": {
                "my_tokenizer": {
                    "type": "path_hierarchy",
                    "delimiter": "-",
                    "replacement": "/",
                    "skip": 2
                }
            }
        }
    }
}
```

- delimiter用作路径分隔符的字符
- replacement用于定界符的可选替换字符
- buffer_size单次读取到术语缓冲区中的字符数。默认为1024。术语缓冲区将以该大小增长，直到所有文本都被消耗完为止。建议不要更改此设置。
- reverse正向还是反向获取关键词
- skip要忽略的内容

#### 中文分词器

##### IKAnalyzer

IKAnalyzer是一个开源的，基于java的语言开发的轻量级的中文分词工具包。从2006年12月推出1.0版开始，IKAnalyzer已经推出了3个大版本。在 2012 版本中，IK 实现了简单的分词歧义排除算法，标志着 IK 分词器从单纯的词典分词向模拟语义分词衍化

**分词器的安装**

- 下载地址

https://github.com/medcl/elasticsearch-analysis-ik/releases

注意只能下载和你Elasticsearch版本相同的不要下载错了

- 解压缩

解压下载的压缩包，解压到plugins⽬目录下

```java
[root@iZbp1buyhgwtrw6hrp2ugjZ ~]#  cd /usr/local/elasticsearch-7.2.0/plugins
[root@iZbp1buyhgwtrw6hrp2ugjZ plugins]# ls
ik
```

- 重启服务

```java
[2019-10-21T21:02:45,622][INFO ][o.e.p.PluginsService     ] [node-1] loaded module [x-pack-ml]
[2019-10-21T21:02:45,622][INFO ][o.e.p.PluginsService     ] [node-1] loaded module [x-pack-monitoring]
[2019-10-21T21:02:45,623][INFO ][o.e.p.PluginsService     ] [node-1] loaded module [x-pack-rollup]
[2019-10-21T21:02:45,623][INFO ][o.e.p.PluginsService     ] [node-1] loaded module [x-pack-security]
[2019-10-21T21:02:45,623][INFO ][o.e.p.PluginsService     ] [node-1] loaded module [x-pack-sql]
[2019-10-21T21:02:45,624][INFO ][o.e.p.PluginsService     ] [node-1] loaded module [x-pack-watcher]
[2019-10-21T21:02:45,625][INFO ][o.e.p.PluginsService     ] [node-1] loaded plugin [analysis-ik]
[2019-10-21T21:02:51,095][INFO ][o.e.x.s.a.s.FileRolesStore] [node-1] parsed [0] roles from file [/usr/local/elasticsearch-7.2.0/config/roles.yml]
[2019-10-21T21:02:52,645][INFO ][o.e.x.m.p.l.CppLogMessageHandler] [node-1] [controller/6773] [Main.cc@110] controller (64 bit): Version 7.2.0 (Build 65aefcbfce449b) Copyright (c) 2019 Elasticsearch BV
```

从控制台输出内容可以看到analysis-ik已经加载

- 验证

```java
POST localhost:9200/_analyze
{
    "analyzer": "ik_max_word",
    "text": "这是中文分词器"
}
```

响应内容

```java
{
    "tokens": [
        {
            "token": "这是",
            "start_offset": 0,
            "end_offset": 2,
            "type": "CN_WORD",
            "position": 0
        },
        {
            "token": "中文",
            "start_offset": 2,
            "end_offset": 4,
            "type": "CN_WORD",
            "position": 1
        },
        {
            "token": "分词器",
            "start_offset": 4,
            "end_offset": 7,
            "type": "CN_WORD",
            "position": 2
        },
        {
            "token": "分词",
            "start_offset": 4,
            "end_offset": 6,
            "type": "CN_WORD",
            "position": 3
        },
        {
            "token": "器",
            "start_offset": 6,
            "end_offset": 7,
            "type": "CN_CHAR",
            "position": 4
        }
    ]
}
```

可以看到此时已经完成分词
