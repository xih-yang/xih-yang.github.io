# 18、ElasticSearch 实战：映射-mapping创建
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/18.html
- 分类：搜索引擎
- 分组：教程目录
> 接第17节

### 3、Mapping

#### 1）、字段类型

- 核心类型
- 字符串（string）

`text`，`keyword`
- 数字类型（Numeric）

`long`, `integer`, `short`, `byte`, `double`, `float`, `half_float`, `scaled_float`
- 日期类型（Date）

`date`
- 布尔类型（Boolean）

`boolean`
- 二进制类型（Binary）

`binary`
- 复合类型
- 数组类型（Array）

`Array` 支持不针对特定的数据类型
- 对象类型（Object）

`object` 用于单个JSON对象的对象
- 嵌套类型（Nested）

`nested` 用于JSON对象的数组
- 地理类型（Geo）
- 地理坐标（Geo-point）

`geo_point` 纬度/经度坐标
- 地理圆形（Geo-shape）

`geo_shape` 用于多边形等复杂形状
- 特定类型
- IP 类型（IP）

`ip` 用于描述 IPv4 和 IPv6 地址
- 补全类型（Completion）

`completion` 提供自动完成提示
- 令牌计数类型（Token count）

`token_count` 用来统计字符串中词条的数量
- 附件类型（attachment）

参考 [mapper-attachments](https://github.com/elastic/elasticsearch/tree/5.6/plugins/mapper-attachments) 插件，支持将附件例如Microsoft Office格式，open document格式，ePub，HTML等索引为 `attachment` 数据类型。
- 抽取类型（Percolator）

接受来自领域特定语言（`query-dsl`）的查询

更多字段类型，请参考 ES 官方文档：[参考文档-mapping-types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html)

#### 2）、映射

Mapping (映射)

`Mapping 是用来定义一个文档(document)，以及它所包含的属性(field)是如何存储和索引的`。比如，使用mapping来定义：

- 哪些字符串属性应该被看做全文本属性(full text fields)
- 哪些属性包含数字，日期或者地理位置
- 文档中的所有属性是否都能被索引(_all 配置)
- 日期的格式
- 自定义映射规则来执行动态添加属性
- 查看 mapping 信息：

`GET bank/_mapping`
- 修改 mapping 信息：
- 创建索引

```java
PUT /my-index
{
  "mappings": {
     //映射规则
    "properties": {
      "age":    {
      "type": "integer" },  
      "email":  {
      "type": "keyword"  },//keyword不会进行全文检索 
      "name":   {
      "type": "text"  }//text保存的时候进行分词，搜索的时候进行全文检索   
    }
  }
}
```

ES自动猜测的映射类型：

JSON type
域 type

布尔型：true、false
boolean

整数：123
long

浮点数：1.23
double

字符串，有效日期 2020-02-02
date

字符串，foo bar
string

对象，也称为哈希，存储对象类型
object

> 参考文档-mapping
