# 08、ElasticSearch 实战：增删改查、打开、关闭ES的索引
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/8.html
- 分类：搜索引擎
- 分组：教程目录
> Elasticsearch中的index相当于RDBMS(关系型数据库, 比如MySQL)中的DataBase.
>
> 本篇文章通过Kibana插件, 演示了ES的基础语法: 对ES中的index进行CRUD(增删改查)以及关闭、开启操作.

**阅读须知:**

> 在ES 6.x之前的版本中, 每个index中可以有多个type, 类似于MySQL中每个数据库可以有多张表, 可在ES 6.0开始, 每个index都只能有1个type.
>
> 本篇文章写作较早, 用的是ES 5.6版本, 因此有些操作可能出现不支持等问题, 还请读者查阅解决:-)

## 1 创建index（配置mapping[映射]）

(1)创建语法:

```java
PUT index
{
    "settings": { ... some settings ... },
    "mappings": {
        // ES 6.x开始不再支持1个index中同时存在多个type
        "type1": { ... some mappings ... },
        "type2": { ... some mappings ... },
        ...
    }
}
```

> 如果不指定settings和mappings, 直接插入数据时, ES会根据要插入数据的类型, 自动创建相关配置 —— 功能强大, 但扩展性不够, 后续若有其他原因需要修改mappings, 会很困难.

**—— 所以创建index时, 推荐手动指定settings和mappings的相关配置.** 可以参考文章: ES XX - ES的mapping的设置.

(2)创建示例:

```java
PUT address        // 关于地址(address)的索引
{
    "settings": {
        "number_of_shards": 1,    // 默认分片数为5
        "number_of_replicas": 0   // 默认副本数为1
    },
    "mappings": {
        "province": {             // type是province(省份)
            "properties": {
                "name": {
                    "type": "text"  // 存储类型是text
                },
                "area": {
                    "type": "float"
                }
            }
        }
    }
}
```

(3)创建结果:

```java
{
  "acknowledged": true,
  "shards_acknowledged": true,
  "index": "address"
}
```

## 2 查看index

(1)查看示例:

```java
GET address
// 也可同时查看多个索引, 类似于删除操作: 
GET *
GET _all
GET *index*
GET address,shop
// 在6.0之前的版本中, 还可以指定返回某些指定项的结果:
GET address/_settings,_mappings
```

- 弃用提示:

> 查看索引时, 若通过","分隔要返回的结果, Elasticsearch将抛出如下警告:

```java
! Deprecation: Requesting comma-separated features is deprecated and will be removed in 6.0+, retrieve all features instead.
```

> 意为: Elasticsearch不推荐使用逗号分隔功能, 将在6.0+中删除. 建议不要使用",", 而是直接检索全部数据, 或检索某一项的结果.

> 在ES 6.6.0中将直接出现:

```java
{
   "error": "Incorrect HTTP method for uri [/address/_settings,_mappings?pretty] and method [GET], allowed: [POST]",
   "status": 405
}
```

> 换做POST请求时, 必须携带请求体, 仍然不支持.

(2)查看的结果:

```java
{
  "address": {
    "aliases": {},
    "mappings": {
      "province": {
        "properties": {
          "area" : {
            "type" : "float"
          },
          "name" : {
            "type" : "text"
          }
        }
      }
    },
    "settings": {
      "index": {
        "creation_date": "1542108754899",
        "number_of_shards": "1",
        "number_of_replicas": "0",
        "uuid": "MMpLNHzZR8K1k48rJplWVw",
        "version": {
          "created": "6060099"
        },
        "provided_name": "address"
      }
    }
  }
}
```

## 3 修改index

修改索引的示例:

```java
PUT address/_settings
{
    "number_of_replicas": 1		// 修改副本数为1
}
```

说明:Elasticsearch中的分片数(number_of_shards)只能在创建索引时设置, 无论是否添加过数据, 都不支持修改.

> 这与文档的路由有关, 而Solr的SPLITSHARD可以算作动态修改分片的另一种思路: 只对某一路由范围内的进行拆分, 可以参考 管理SolrCloud集群 (创建集合、切割分片、更新配置) 第5节的内容.
>
> 关于修改ES的分片数, 应该有其他思路, 后期了解到再作研究整理.

## 4 删除index

> 删除索引需要指明索引名称、别名或通配符.
>
> Elasticsearch支持同时删除多个索引, 或使用_all或通配符*删除全部索引.

**删除示例:**

```java
DELETE address        // 删除指定索引
DELETE index1,index2  // 删除多个索引
DELETE index_*        // 按通配符删除以'index_'开头的索引
DELETE _all           // 删除全部索引
```

**为避免_all操作误删除全部索引, 可在配置文件elasticsearch.yml中作如下配置:**

```java
# 要求操作索引时必须指定索引的名称
action.destructive_requires_name: true
```

## 5 打开/关闭index

(1)操作说明:

**1、** 可以打开一个已经打开/关闭的索引, 以最后一次操作为准;

**2、** 可以关闭一个已经关闭/打开的索引, 以最后一次操作为准;

**3、****关闭的索引只能查看index的配置信息, 不能对内部的索引数据进行读写操作.**

(2)操作示例:

```java
// 可以使用_all打开或关闭全部索引, 也可使用通配符(*)配合操作
POST address/_close
POST address/_open
```

**说明事项:**

**1、** 使用`_all`或通配符操作索引, 都会受到配置文件中`action.destructive_requires_name=true`的限制.

**2、** 关闭的索引会继续占用磁盘空间, 却又不能使用 —— 造成磁盘空间的浪费.

**3、** 可以在配置文件中禁止使用关闭索引的功能: `settingscluster.indices.close.enable=false`, 默认为true(开启).

## 6 常见问题及解决方法

(1)查看不存在的索引时, 将抛出如下错误信息:

如果要查看的索引不存在, 比如`GET addre`, 就会抛出类似下面的异常信息:

```java
{
  "error" : {
    "root_cause" : [
      {
        "type" : "index_not_found_exception",
        "reason" : "no such index",
        "resource.type" : "index_or_alias",
        "resource.id" : "addre",
        "index_uuid" : "_na_",
        "index" : "addre"
      }
    ],
    "type" : "index_not_found_exception",
    "reason" : "no such index",
    "resource.type" : "index_or_alias",
    "resource.id" : "addre",
    "index_uuid" : "_na_",
    "index" : "addre"
  },
  "status" : 404
}
```

(2)在6.0之前的版本中, 如果修改已经关闭了的索引, 会抛出类似于下面的错误:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "illegal_argument_exception",
        "reason": "Can't update [index.number_of_replicas] on closed indices [[address/MMpLNHzZR8K1k48rJplWVw]] - can leave index in an unopenable state"
      }
    ],
    "type": "illegal_argument_exception",
    "reason": "Can't update [index.number_of_replicas] on closed indices [[address/MMpLNHzZR8K1k48rJplWVw]] - can leave index in an unopenable state"
  },
  "status": 400
}
```

> 在本篇博客演示所用的Elasticsearch 6.6.0版本中, 并不存在此异常信息.
