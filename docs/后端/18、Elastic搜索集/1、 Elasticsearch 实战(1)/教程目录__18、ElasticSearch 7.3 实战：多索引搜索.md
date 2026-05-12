# 18、ElasticSearch 7.3 实战：多索引搜索
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/18.html
- 分类：搜索引擎
- 分组：教程目录
### 1、multi-index 多索引搜索

多索引搜索就是一次性搜索多个index下的数据

```java
/_search：所有索引下的所有数据都搜索出来
/index1/_search：指定一个index，搜索其下所有的数据
/index1,index2/_search：同时搜索两个index下的数据
/index*/_search：按照通配符去匹配多个索引
```

应用场景：生产环境log索引可以按照日期分开。

```java
log_to_es_20200910
log_to_es_20200911
log_to_es_20200910
```

### 2、_all metadata的原理和作用

```java
GET /book/_search?q=java
```

直接可以搜索所有的field，任意一个field包含指定的关键字就可以搜索出来。我们在进行中搜索的时候，难道是对document中的每一个field都进行一次搜索吗？不是的。

es中*all元数据。建立索引的时候，插入一条docunment，es会将所有的field值经行全量分词，把这些分词，放到*all field中。在搜索的时候，没有指定field，就在_all搜索。

举例

```java
{
    name:jack
    email:123@qq.com
    address:beijing
}
```

_all : jack,123@qq.com,beijing
