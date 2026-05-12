# 13、ElasticSearch 实战：ES的元字段 (_index、_type、_source、_routing等)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/13.html
- 分类：搜索引擎
- 分组：教程目录
> 元字段是ES为每个文档配置的内置字段, 主要用于ES内部相关操作.

## 1 标识元字段

## 1.1 _index - 文档所属的索引

`_index`标注document属于哪个index, 是一个虚拟字段, 不会被添加到Lucene索引中.

**将类似的文档 (也就是具有相同field的文档) 存放到同一个index中, 是一种良好的数据建模思想.**

> 提供大量查询的index, 最好不要同时提供大量的统计、聚合等操作——通过把特定的index路由到指定的shard上, 便于系统的优化.

> 注意: 索引名称必须是小写的字母, 不能以下划线"_"开头, 不能包含逗号 ",".

在term或者terms查询, 聚合、脚本以及排序时, 可以访问`_index`字段的值.

在多个索引中执行查询时, 可以通过添加查询子句来关联特定的索引文档, 使用示例——同时查询多种index:

```java
GET website,book_shop/_search
{
    "query": {
        "terms": {    // 查询_index是website和book_shop的文档
            "_index": [ "website", "book_shop"] }
    },
    "aggs": {
        "indices": {  // 对_index字段进行聚合操作
            "terms": { "field": "_index", "size": 10 }
        }
    },
    "sort": {         // 对_index字段进行排序操作
        "_index": { "order": "asc" }
    },
    "script_fields": {  // 使用脚本, 显示_index字段
        "index_name": {
            "script": { 
                "lang": "painless",
                "source": "doc['_index']"
            }
        }
    }
}
```

## 1.2 _uid - 包含_type和_id的复合字段

_uid是_type和_id的组合, 形式为{type}#{id}. 可以用于查询、聚合、脚本和排序.

(1)添加文档:

```java
PUT website/blog/4
{
    "text": "blog with ID 4"
}
PUT website/blog/5?refresh=true
{
    "text": "blog with ID 5"
}
```

(2)检索文档:

> 说明: 对_uid字段的访问API已经过期, 需要使用_id替换.

```java
! Deprecation: Fielddata access on the _uid field is deprecated, use _id instead
```

```java
GET website/_search
{
    "query": { 
        "terms": {       // 通过_uid查询_type和_id的复合字段
            "_uid": ["blog#4", "blog#5"]
        }
    },
    "aggs": {
        "uid_aggs": {
            "terms": {    // 这里通过_uid聚合的操作已经过期
                "field": "_id", "size": 10
              }
        }
    }, 
    "sort": {             // 这里通过_uid排序的操作已经过期
        "_id": { "order": "desc"}
    }, 
    "script_fields": {
        "uid_script": {
            "script": {   // 这里对_uid的脚本操作已经过期
                "lang": "painless", 
                "source": "doc['_id']" 
            }
        }
    }
}
```

## 1.3 _type - 文档的类型

`_type`元字段用来标注document属于哪个类型, 也被称作映射类型.

> 注意: type的名称可以是大写或小写字母, 但不能以下划线"_"开头, 不能包含逗号",".

> 在Elasticsearch 6.0之前的版本中, 一个index可能会被划分为多个type, 例如: 商品中有电子商品, 服装商品, 生鲜商品...
>
> 但在Elasticsearch 6.0之后, 一个index只能包含一个type, 否则将出现错误.

每一个索引文档都包含`_type`和`_id`字段, `_type`字段的目的是通过类型名加快搜索速度.

`_type`字段可以在查询、聚合、排序以及脚本中访问到.

> 关于type的底层数据结构, 可参见ES XX - Elasticsearch对索引类型(_type)的处理方式.

## 1.4 _id - 文档的id

`_id`代表document的唯一标识, 与`_index`和`_type`一起, 唯一标识和定位一个document.

> 注意: 可以手动指定document的id(PUT index/type/id), 也可以不指定, Elasticsearch在添加文档时会自动为其创建id.

可以在查询、脚本中访问, 查询示例:

```java
GET website/_search
{
    "query": {
        "terms": {"_id" : ["1", "2"]}
    },
    "aggs": {
        "id_aggs": {
            "terms": {
                "field": "_id", "size": 10
            }
        }
    }, 
    "script_fields": {
        "id_script": {
            "script": {
                "lang": "painless", 
                "source": "doc['_id']"
            }
        }
    }
}
```

## 2 文档来源元字段

## 2.1 _source - 文档原始JSON内容

文档的原始JSON内容将索引到`_source`字段中, 该字段本身不建立索引, 但是会被存储.

搜索文档时默认返回该字段及其内容, 但无法用于搜索.

### 2.1.1 关闭_source功能

`_source`功能默认是开启的, 它会产生额外的存储开销, 可以关闭:

```java
PUT website
{
    "mappings": {
        "blog": {
            "_source": {"enabled": false}
        }
    }
}
// 或者:
PUT website/_mapping/blog
{
    "_source": {"enabled": false}	
}
```

注意:必须在创建索引时关闭, 创建之后不允许修改, 否则将会发生如下错误:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "resource_already_exists_exception",
        "reason": "index [website/zIUdhInBQsOUi_4Tt2SSkQ] already exists",
        "index_uuid": "zIUdhInBQsOUi_4Tt2SSkQ",
        "index": "website"
      }
    ],
    "type": "resource_already_exists_exception",
    "reason": "index [website/zIUdhInBQsOUi_4Tt2SSkQ] already exists",
    "index_uuid": "zIUdhInBQsOUi_4Tt2SSkQ",
    "index": "website"
  },
  "status": 400
}
```

### 2.1.2 查询时指定返回字段

**_source功能被禁止, 将造成大量功能无法使用:**

> partial update 功能基于_source实现;
>
> hilight 高亮显示功能基于_source实现;
>
> reindex 重建索引功能基于_source实现, 不需要从其他外部存储中获取数据, 再index;
>
> 基于_source定制返回field;
>
> 调试query时更容易, 因为可以很直观地看到_source内容……

可以在创建index时, 在mapping中通过`includes/excludes`参数来减少`_source`字段的内容:

```java
PUT logs
{
    "mappings": {
        "event": {
            "_source": {
                "includes": ["*.count", "meta.*"],         // 包含的字段
                "excludes": ["meta.desc", "meta.other.*"]  // 不包含的字段
            }
        }
    }
}
```

**移除的字段不会被存储在_source中, 但仍然可以搜索到这些字段.**

可以在检索时, 禁止返回原始内容:

```java
GET website/blog/1?_source=false
```

如果只想获取`_source`的部分内容, 可以使用`_source_includes`或`_source_excludes`参数:

```java
GET website/blog/1?_source_includes=title,content
GET website/blog/1?_source_excludes=post_date,author_id
```

> Elasticsearch 6.0之前的版本中: 使用_source_include和_source_exclude用来指定检索的结果中是否包含_source中的某个字段;
>
> Elasticsearch 6.0之后的版本中: 相关的API修改为: _source_includes和_source_excludes——多加了s.

## 2.2 _size - _source字段占用的字节数

记录`_source`字段占用的字节数, 由插件mapper-size提供.

## 3 索引元字段

## 3.1 _all - 文档所有字段的值

(1)ES 6.0之后的方法:

**在Elasticsearch 6.0版本中, _all字段已经被禁用了.** 若要开启, 官方建议是:

> "Enabling [_all] is disabled in 6.0. As a replacement, you can use [copy_to] on mapping fields to create your own catch all field."
>
> ——大致意思是: _all已经不允许使用了, 作为替换, 我们可以使用copy_to关键字来创建需要获取的所有字段的内容.

`copy_to`的使用方法如下:

```java
PUT logs
{
    "mappings": {
        "event": {
            "properties": {
                "event_id": {
                    "type": "text",
                    "copy_to": {"enabled": true}	
                },
            	  "event_desc": {
                    "type": "text",
                    "copy_to": {"enabled": true},
                    "analyzer": "english"
                },
                "time": {
                    "type": "date",
                    "copy_to": {"enabled": true},
                    "format": "strict_date_optional_time||epoch_millis"
                }
            }
        }
    }
}
```

(2)ES 6.0以前的方法:

在Elasticsearch 6.0之前, `_all`字段的使用方式如下:

> _all字段包含1个文档的全部field的内容: 用一个大字符串关联其他所有字段的值, 用空格作为分隔符.
>
> _all字段可以被分析和索引, 但不会被存储 —— 默认的搜索field.
>
> 通过_all字段可以对文档的值进行搜索而不必知道相关的字段名.
>
> _all字段丢失了长字段(低相关性)和短字段(高相关性)之间的区别 —— 在相关性搜索要求比较高的时候, 应该明确指出要查询的字段.

**1、****_all字段需要额外的处理器周期, 且耗费更多的磁盘空间, 若不需要, 建议禁用此功能:**

```java
PUT website/_mapping/blog
{
    "_all": {"enabled": false}
}
```

**2、** 或在field中设置`include_in_all` —— 是否要将field的值包含在`_all`中:

```java
PUT website/_mapping/blog
{
    "properties": {
        "test_field": {
            "type": "text",
            "include_in_all": false
        }
    }
}
```

## 3.2 _field_names - 文档所有非空字段名

该字段可以用在查询、聚合以及脚本中 —— 用于查找指定字段的值非空的文档是否存在.

使用示例:

```java
GET website/_search
{
    "query": {
        "terms": {"_field_names": ["content"]}
    }
}
```

## 4 路由元字段

## 4.1 [过期]_parent - 在type间创建父子关系

(1)创建映射:

```java
PUT store
{
    "mappings": {
        "book": {},
        "it_book": {
            "_parent": {"type": "book"}		// 指定其父类
        }
    }
}
```

(2)插入父文档:

```java
PUT store/book/1
{ "desc": "this is parent book"}
```

(3)插入子文档, 并指出其父文档:

```java
PUT store/it_book/2?parent=1
{ "desc": "this is child it_book"}
```

(4)父子文档的限制:

**1、** 父type和子type必须不同.

**2、** _parent的type的值只能是不存在的类型 —— 一个type被创建后就不能称为父类型了.

(5)其他说明:

> 父子文档必须索引在同一个分片上:
>
> 1、 parent的编号用于子文档的路由值, 确保子文档被索引到父文档所在的分片中.
>
> 2、 查询、更新、删除子文档时, 也需要提供相同的parent值.

## 4.2 _routing - 自定义的路由值

用于将文档路由到指定的分片上. 通过如下公式将文档路由到特定的分片:

`shard_num = hash(_routing) % num_primary_shards`

如果不指定`_routing`的值, 默认使用文档的`_id`字段. 如果存在父文档则使用其`_parent`的编号.

可以通过为某些文档都指定相同的路由值, 来实现对这些文档的自定义路由功能:

```java
// 此文档使用'user_5220'作为其路由值, 在查询、更新、删除时同样需要提供此路由值
PUT website/blog/1?routing=user_5220
{
    "title": "xxx"
}
```

`_routing`字段可以在查询、聚合、脚本以及排序的时候访问. 比如直接指定路由值来搜索相关的文档:

```java
GET website/_search
{
    "query": {
        "terms": {"_routing": [ "user_5220" ] }
    }
}
```

## 5 其他元字段

**_meta - 应用特定的元字段:** 每个type都可以拥有自定义的元数据 —— ES并不会使用, 但可以用来存储应用程序的特定信息.

使用示例:

```java
PUT website
{
    "mappings": {
        "user": {
            "_meta": {
                "class": "com.healchow.website.pojo.User",
                "version": {"min": "1.0", "max": "1.3"}
            }
        }
    }
}
```
