# 10、ElasticSearch 实战：如何使用ES的索引模板(index template)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/10.html
- 分类：搜索引擎
- 分组：教程目录
## 1 什么是索引模板

> 索引模板: 就是把已经创建好的某个索引的参数设置(settings)和索引映射(mapping)保存下来作为模板, 在创建新索引时, 指定要使用的模板名, 就可以直接重用已经定义好的模板中的设置和映射.

## 1.1 索引模板中的内容

(1)settings: 指定index的配置信息, 比如分片数、副本数, tranlog同步条件、refresh策略等信息;

(2)mappings: 指定index的内部构建信息, 主要有:

**1、**`_all`: All Field字段, 如果开启, `_all`字段就会把所有字段的内容都包含进来,检索的时候可以不用指定字段查询 —— 会检索多个字段, 设置方式: `"_all": {"enabled": true}`;

> 在ES 6.0开始, _all字段被禁用了, 作为替换, 可以通过copy_to自定义实现all字段的功能.

**2、**`_source`: Source Field字段, ES为每个文档都保存一份源数据, 如果不开启, 也就是`"_source": {"enabled": false}`, 查询的时候就只会返回文档的ID, 其他的文档内容需要通过Fields字段到索引中再次获取, 效率很低. 但若开启, 索引的体积会更大, 此时就可以通过Compress进行压缩, 并通过`inclueds`、`excludes`等方式在field上进行限制 —— 指定义允许哪些字段存储到`_source`中, 哪些不存储;

>

**3、**`properties`: **最重要的配置**, 是对索引结构和文档字段的设置.

## 1.2 索引模板的用途

**索引模板一般用在时间序列相关的索引中.**

——也就是说, 如果你需要每间隔一定的时间就建立一次索引, 你只需要配置好索引模板, 以后就可以直接使用这个模板中的设置, 不用每次都设置settings和mappings.

**索引模板一般与索引别名一起使用.** 关于索引别名, 后续研究之后再做补充.

## 2 创建索引模板

创建一个商品的索引模板的示例:

(1)ES 6.0之前的版本:

```java
PUT _template/shop_template
{
    "template": "shop*",       // 可以通过"shop*"来适配
    "order": 0,                // 模板的权重, 多个模板的时候优先匹配用, 值越大, 权重越高
    "settings": {
        "number_of_shards": 1  // 分片数量, 可以定义其他配置项
    },
    "aliases": {
        "alias_1": {}          // 索引对应的别名
    },
    "mappings": {
        "_default": {          // 默认的配置, ES 6.0开始不再支持
            "_source": { "enabled": false },  // 是否保存字段的原始值
            "_all": { "enabled": false },     // 禁用_all字段
            "dynamic": "strict"               // 只用定义的字段, 关闭默认的自动类型推断
        },
        "type1": {             // 默认的文档类型设置为type1, ES 6.0开始只支持一种type, 所以这里不需要指出
        */
            "_source": {"enabled": false},
            "properties": {        // 字段的映射
                "@timestamp": {    // 具体的字段映射
                    "type": "date",           
                    "format": "yyyy-MM-dd HH:mm:ss"
                },
                "@version": {
                    "doc_values": true,
                    "index": "not_analyzed",  // 不索引
                    "type": "string"          // string类型
                },
                "logLevel": {
                    "type": "long"
                }
            }
        }
    }
}
```

(2)ES 6.0之后的版本:

```java
PUT _template/shop_template
{
    "index_patterns": ["shop*", "bar*"],       // 可以通过"shop*"和"bar*"来适配, template字段已过期
    "order": 0,                // 模板的权重, 多个模板的时候优先匹配用, 值越大, 权重越高
    "settings": {
        "number_of_shards": 1  // 分片数量, 可以定义其他配置项
    },
    "aliases": {
        "alias_1": {}          // 索引对应的别名
    },
    "mappings": {
        // ES 6.0开始只支持一种type, 名称为“_doc”
        "_doc": {
            "_source": {            // 是否保存字段的原始值
                "enabled": false
            },
            "properties": {        // 字段的映射
                "@timestamp": {    // 具体的字段映射
                    "type": "date",           
                    "format": "yyyy-MM-dd HH:mm:ss"
                },
                "@version": {
                    "doc_values": true,
                    "index": "false",   // 设置为false, 不索引
                    "type": "text"      // text类型
                },
                "logLevel": {
                    "type": "long"
                }
            }
        }
    }
}
```

说明:

**直接修改mapping的优先级 > 索引模板中的设置**;

> 索引匹配了多个template, 当属性等配置出现不一致时, 以模板的权重(order属性的值)为准, 值越大越优先, order的默认值是0.
>
> ES 6.0之后的版本API变化较大, 请重点关注.

## 3 查看索引模板

(1)查看示例:

```java
GET _template                // 查看所有模板
GET _template/temp*          // 查看与通配符相匹配的模板
GET _template/temp1,temp2    // 查看多个模板
GET _template/shop_template  // 查看指定模板
```

(2)判断模板是否存在:

判断示例:

```java
HEAD _template/shop_tem
```

结果说明:

> a) 如果存在, 响应结果是: 200 - OK
>
> b) 如果不存在, 响应结果是: 404 - Not Found

## 4 删除索引模板

删除示例:

```java
DELETE _template/shop_template	// 删除上述创建的模板
```

如果模板不存在, 将抛出如下错误:

```java
{
  "error" : {
    "root_cause" : [
      {
        "type" : "index_template_missing_exception",
        "reason" : "index_template [shop_temp] missing"
      }
    ],
    "type" : "index_template_missing_exception",
    "reason" : "index_template [shop_temp] missing"
  },
  "status" : 404
}
```

## 5 模板的使用建议

## 5.1 一个index中不能有多个type

——Elasticsearch 6.X版本中已经不支持在同一个index下创建多个type.

> 6.X之前的版本中, 父子文档的实现是一个索引中定义多个type, 6.X中实现方式改变为join方式.

如果在同一个index下创建多个type, 会报出如下错误信息:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "illegal_argument_exception",
        "reason": "Rejecting mapping update to [book_shop] as the final mapping would have more than 1 type: [books, novel_book]"
      }
    ],
    "type": "illegal_argument_exception",
    "reason": "Rejecting mapping update to [book_shop] as the final mapping would have more than 1 type: [books, novel_book]"
  },
  "status": 400
}
```

错误信息指出: 拒绝对[book_shop]的mapping信息进行修改, 因为它作为final mapping(终态的mapping), 将会有超过2个type.

## 5.2 设置_source = false

如果我们只关心查询的评分结果, 而不用查看原始文档的内容, 就设置`"_source": {"enabled": false}`.

——这能节省磁盘空间并减少磁盘IO上的开销.

> 我们可以把原始的数据存储在MySQL、HBase等数据库, 从ES中得到文档的ID之后, 再到相应的数据库中获取数据.

## 5.3 设置_all = false

如果能够确切地知道要对哪个field做查询操作, 就设置`"_all": {"enabled": false}`.

——这能实现性能提升, 并节省存储空间.

而在6.X版本开始, `_all`字段也不再支持了, ES官方建议我们通过`copy_to`自定义我们自己的all字段.

## 5.4 设置dynamic = strict

如果我们的数据是结构化数据, 就设置`"dynamic": "strict"`.

——把动态类型判断设置为严格, 也就是不允许ES为插入的数据进行动态类型设置, 避免注入脏数据.

## 5.5 使用keyword类型

如果我们只关心精确匹配, 就设置`test_field: {"type": "keyword"}`.

——keyword类型要比text类型的性能更高, 并且还能节省磁盘的存储空间.
