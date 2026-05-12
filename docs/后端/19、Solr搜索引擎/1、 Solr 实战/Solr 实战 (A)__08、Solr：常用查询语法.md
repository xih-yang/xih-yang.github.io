# 08、Solr：常用查询语法
- 来源：https://ddkk.com/zhuanlan/search/solr/2/8.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

solr作为搜索引擎，就像我们使用mysql一样，在日常业务中，更多接触的则是各类操作语法，所以今天，我们再来学习solr的常用查询语法，为大家在工作中最基本的solr查询打下基础。

## 1. 基本概念

### 1.1 通配符

当需要进行正则类匹配时，需要用到通配符

通配符
说明

?
匹配任意单个字符

*
匹配任意多个字符

> product_name:?果

> remarks:送货*

### 1.2 连接符

solr中要实现多条件查询，就需要通过连接符来实现，支持并`&&`,或`||`连接

> remarks:送货* && product_name:苹果

> remarks:送货* || product_name:苹果

## 2. 常用查询语法

### 1.1 精确查询

分词查询 filed:value

> remarks:送货

强制不分词查询 field:“value”

> remarks:“送货上门”
>
> 在查询词外加上双引号

短语查询 field:“value1 value2”

> remarks:“送货上门 不想下楼”
>
> 不同的短语之间用空格隔开

### 1.2 模糊查询

通配符查询 field:value*, field:v?lue

> remarks:送货* | 匹配以“送货”开头的数据
>
> product_name:?果 | 匹配以“果”结尾，且前面只有一个字符的数据
>
> product_name:* | 匹配product_name不为空的数据
>
> *:*不区分字段，| 查询所有数据

模糊搜索 field:value~N

> 区别于上述的通配符查询，模糊查询指的是我们在日常查询中出现的错别字，近似词等查询场景，用一个“～”符号表示，后面的N表示允许误差的字符个数，不写默认为1
>
> remarks:送火上门～1

邻近搜索 field:“value”~N

> 所谓邻近搜索，就是多个关键词之间的距离在指定范围，主要应用于近似词的搜索，比如搜索“apple pie”~2， 那就是搜索文档中包含“apple”, "pie"分词，且两个分词之间距离不超过2的数据
>
> 与模糊查询的区别是这个多了双引号
>
> remarks:“送货 下楼”~2， “送货”与“下楼”之间隔了“上门”与“不想”，距离在2个之内，于是可以查询出来

### 1.3 排除查询

排除查询 filed:(* NOT “value1” NOT “value2”)

> 排除指定的分词，将其他的数据查询出来
>
> remarks:(* NOT “送货” NOT “红的”)

### 1.4 范围查询

数值范围查询 field:[v1 TO v2] , field:{v1 TO v2}

> price:[10 TO 29] | 表示price >= 10 & price
> price:{10 TO 29} | 表示price >10 & price
> price:[10 TO *] | 表示price >= 10

日期范围 field:[YYYY-MM-DDTHH:mm:ssZ TO YYYY-MM-DDTHH:mm:ssZ]

> create_time:[2023-05-01T00:00:00Z TO 2023-05-10T23:00:00Z]

### 1.5 权重查询

权重查询 field:value1^2 value2^0.5

> 存在部分场景，我们需要将匹配查询词1的数据优先排序，匹配查询词2的降低优先级，这时就需要用到"^"关键词，通过其对查询得分设置权重
>
> remarks:送货^2

## 2. 更多查询

本文我们只列举基础常用的查询，更多查询用法，大家可以查看官方文档拓展：

[https://solr.apache.org/guide/solr/latest/query-guide/standard-query-parser.html##fuzzy-searches](https://solr.apache.org/guide/solr/latest/query-guide/standard-query-parser.html##fuzzy-searches)

如果想要切换对应版本的官方文档，可在页面上调整
