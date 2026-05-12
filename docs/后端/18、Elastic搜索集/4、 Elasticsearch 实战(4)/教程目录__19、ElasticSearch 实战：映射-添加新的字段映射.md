# 19、ElasticSearch 实战：映射-添加新的字段映射
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/19.html
- 分类：搜索引擎
- 分组：教程目录
> 接第18节

#### 3）、新版本改变

ES7及以上移除了 type 的概念。

- 关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的。 elasticsearch 是基于 Lucene 开发的搜索引擎，而 ES 中不同 type 下名称相同的 filed 最终在 Lucene 中的处理方式是一样的。
- 两个不同 type 下的两个 user_name，在 ES 同一个索引下其实被认为是同一个 filed，你必须在两个不同的 type 中定义相同的 filed 映射。否则，不同 type 中的相同字段名称就会在处理中出现冲突的情况，导致 Lucene 处理效率下降。
- 去掉type就是为了提高 ES 处理数据的效率。

Elasticsearch 7.x：

- URL中的 type 参数为可选。比如，索引一个文档不再要求提供文档类型。

Elasticsearch 8.x：

- 不再支持URL中的type参数。

`解决`:

1）、将索引从多类型迁移到单类型，每种类型文档一个独立索引

2）、将已存在的索引下的类型数据，全部迁移到指定位置即可。详见数据迁移

##### 1、创建映射

创建索引并指定映射

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

##### 2、添加新的字段映射

```java
PUT /my-index/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false//索引选项控制是否对字段值建立索引。 它接受true或false，默认为true。未索引的字段不可查询。
    }
  }
}
```

##### 3、更新映射

对于已经存在的映射字段，我们不能更新。更新必须创建新的索引进行数据迁移

> 参考文档-mapping
