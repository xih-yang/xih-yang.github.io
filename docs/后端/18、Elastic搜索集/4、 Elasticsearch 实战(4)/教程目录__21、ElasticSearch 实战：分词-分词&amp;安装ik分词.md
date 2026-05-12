# 21、ElasticSearch 实战：分词-分词&amp;安装ik分词
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/21.html
- 分类：搜索引擎
- 分组：教程目录
> 接第20节

### 4、分词

一个`tokenizer` (分词器)接收一个`字符流`,将之分割为独立的 `tokens` (词元，通常是独立的单词)，然后输出 `tokens`流。

例如,whitespace `tokenizer` 遇到空白字符时分割文本。它会将文本"*Quick brown fox!*"分割为[`Quick`， `brown`， `fox!`l。

该`tokenizer` (分词器)还负责记录各个 `term` (词条)的顺序或 `position`位置(用于 `phrase`短语和 `word proximity` 词近邻查询) ，以及 `term` (词条)所代表的原始 `word` (单词)的 `start`(起始)和 `end` (结束)的 `character offsets` (字符偏移量) (用于高亮显示搜索的内容)。

`Elasticsearch` 提供了很多内置的分词器，可以用来构建 custom analyzers (自定义分词器) 。

测试ES 默认的标准分词器：

`英文`：

```java
POST _analyze
{
  "analyzer": "standard",
  "text": "The 2 QUICK Brown-Foxes jumped over the lazy dog's bone."
}
```

`中文`：

```java
POST _analyze
{
  "analyzer": "standard",
  "text": "pafcmall电商项目"
}
```

#### 1）、安装 ik 分词器

`注意`：不能用默认 elasticsearch-plugin install xxx.zip 进行自动安装

进入[https://github.com/medcl/elasticsearch-analysis-ik/releases](https://github.com/medcl/elasticsearch-analysis-ik/releases)

找到对应的 es 版本安装

**1、**`进入es容器内部plugins目录`；

```java
docker exec -it 容器id /bin/bash
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.4.2/elasticsearch-analysis-ik-7.4.2.zip
```

**2、** 安装`wget`：；

```java
yum install wget
```

**3、** 下载和ES匹配版本的`ik`分词器：；

```java
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.4.2/elasticsearch-analysis-ik-7.4.2.zip
```

**4、**`unzip`下载文件并解压；

1）、使用 `unzip` 解压 `elasticsearch-analysis-ik-7.4.2.zip` 发现 `unzip` 命令还未安装，先安装 `unzip`

2）、解压文件到 `plugins` 目录下的 `ik` 目录

3）删除压缩包，并给 `ik` 目录及其文件授权

```java
rm -rf *.zip
chmod -R 777 ik/
```

**5、** 可以确认是否安装好了分词器；

```java
cd../bin
elasticsearch plugin list：即可列出系统的分词器
```

1）、进入docker中的es容器内

2）、列出系统的分词器

**6、** 重启ES使ik分词器生效；

```java
docker restart elasticsearch
```

#### 2）、测试分词器

- 使用默认分词：

```java
POST _analyze
{
  "analyzer": "standard",
  "text": "pafcmall电商项目"
}
```

结果：

- ik智能分词：

```java
POST _analyze
{
  "analyzer": "ik_smart",
  "text": "pafcmall电商项目"
}
```

结果：

```java
POST _analyze
{
  "analyzer": "ik_smart",
  "text": "我是中国人"
}
```

结果：

- ik_max_word分词：

```java
POST _analyze
{
  "analyzer": "ik_max_word",
  "text": "我是中国人"
}
```

结果：

够看出不同的分词器，分词有明显的区别，所以以后定义一个索引不能再使用默认的 mapping 了，要手工建立 mapping，因为要选择分词器。

> 参考文档-analysis
