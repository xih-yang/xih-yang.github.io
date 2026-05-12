# 16、ElasticSearch 实战：增删改查ES中的索引数据 (CRUD)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/16.html
- 分类：搜索引擎
- 分组：教程目录
> 说在前面: 本文的所有演示, 都是基于Elasticsearch 6.6.0进行的, 不同的版本可能存在API发生修改、不支持的情况, 还请注意.

## 1 创建document

## 1.1 创建时手动指定id

(1)适用情景:

从其他系统中导入数据到ES时, 会采取这种方式: 使用原有系统中数据已有的唯一标识, 作为ES中document的id.

而如果数据一生产出来就存储到了ES中, 一般是不适合手动指定id的.

(2)使用语法:

```java
put index/type/id
```

(3)使用示例:

```java
PUT employee/developer/1
{
    "name": "shoufeng", 
    "e_id": 5220
}
```

(4)添加成功后的响应信息:

```java
{
  "_index" : "employee",
  "_type" : "developer",
  "_id" : "1",          // 指定了id, 控制底层的_id元字段
  "_version" : 1,       // 当前版本号, 基于此字段进行并发控制
  "result" : "created",
  "_shards" : {
    "total" : 2,        // 参与创建的分片数, 包括Primary和Replica
    "successful" : 1,   // 成功创建索引的分片数量
    "failed" : 0        // 创建索引失败的分片数量
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}
```

## 1.2 创建时自动生成id

(1)使用情景:

ES作为数据存储服务器, 应用程序中的数据直接对接到ES中, 这种场景适合自动生成id.

在多节点并发生成大量数据的场景下, 自动生成id更具安全性.

(2)使用语法:

```java
POST index/type
```

(3)使用示例:

```java
POST employee/developer
{
    "name": "shoufeng",
    "sex": "male",
    "age": 20
}
```

(4)添加成功后的响应结果:

```java
{
  "_index" : "employee",
  "_type" : "developer",
  "_id" : "vMxcFWoBfKUnm9s_Uxen",  // 没有指定id, 就会自动生成id, 长度为20个字符
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}
```

官方文档中指出:

**Elasticsearch自动生成的id, 长度为20个字符, 是URL安全的, 它是Base64编码的GUID字符串, 多节点(分布式系统)并行生成id时不会发生冲突.**

## 2 查看document

## 2.1 根据id查询文档

**查询时可以不指定type, 即下述的developer, 而用_all代替.**

```java
// 查询语法:
GET employee/developer/1
// 结果如下: 
{
  "_index" : "employee",
  "_type" : "developer",
  "_id" : "1",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {          // 文档的元数据
    "name" : "shoufeng",
    "e_id" : 5220
  }
}
```

## 2.2 通过_source字段控制查询结果

(1)只获取指定id的文档的`_source`内容:

```java
GET employee/developer/1/_source
// 结果是:
{
  "name" : "shoufeng",
  "e_id" : 5220
}
```

(2)禁用指定id的文档的`_source`字段:

```java
GET employee/developer/1?_source=false
// 结果是:
{
  "_index" : "employee",
  "_type" : "developer",
  "_id" : "1",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true
}
```

(3)过滤`_source`中的某些field:

```java
// _source_includes和_source_excludes可以匹配通配符*
GET employee/developer/1?_source_includes=name,age&_source_excludes=sex
GET employee/developer/_search?_source_includes=name,age&_source_excludes=sex
```

(4)通过`stored_fields` API过滤文档中已存储的字段:

> 在Elasticsearch 6.0之后, 不再支持fields, 需要使用stored_fieldsAPI替换.

```java
GET employee/developer/1?stored_fields=name,age        // 指定id
GET employee/developer/_search?stored_fields=name,age  // 不指定id, 将查询所有文档
```

> 其他查询操作, 将在后续的文章中详细演示.

## 3 修改document

## 3.1 全量替换document

全量替换是基于指定文档id的修改:

```java
// 语法与创建语法相同: 
PUT employee/developer/1
{
    "name": "shoufeng001",  // 修改姓名
    "age": 20,              // 添加年龄
    "sex": "male",          // 添加性别
    "e_id": 5220
}
```

**操作过程说明:**

**1、** 如果指定的document id不存在, 就是创建操作;

**2、** 如果指定的document id已经存在, 就是全量替换操作 —— 替换旧文档的JSON串内容;

**3、****Lucene中倒排索引一旦被创建就是不可变的**, 要修改文档内容, 可以采取全量替换的方式 —— 对文档重新建立索引, 替换旧文档的所有内容;

**4、** ES会将旧文档标记为deleted, 然后根据我们提交的请求创建一个新文档, 当标记为deleted的文档数达到一定量时, ES会在自动删除这些旧文档.

## 3.2 强制创建document

(1)存在这样的场景:

> 我们不知道索引中是否已经存在某个文档 —— 可能有其他用户在并发添加文档;
>
> 为了防止创建操作被执行为全量替换操作, 从而导致数据的丢失, 我们可以使用强制创建的方式, 来避免这种失误.

(2)强制创建示例:

```java
PUT employee/developer/1?op_type=create
{
    "name": "shoufeng",
    "age": 20
}
// 或者使用:
PUT employee/developer/1/_create
{
    "name": "shoufeng",
    "age": 20
}
// 响应结果中出现冲突:
{
  "error": {
    "root_cause": [
      {         // 由于文档已经存在, 发生版本冲突, 导致创建失败
        "type": "version_conflict_engine_exception",
        "reason": "[developer][1]: version conflict, document already exists (current version [2])",
        "index_uuid": "OYu6J2x_S2S5v-R74aq6NQ",
        "shard": "3",
        "index": "employee"
      }
    ],
    "type": "version_conflict_engine_exception",
    "reason": "[developer][1]: version conflict, document already exists (current version [2])",
    "index_uuid": "OYu6J2x_S2S5v-R74aq6NQ",
    "shard": "3",
    "index": "employee"
  },
  "status": 409
}
```

出现冲突的原因:

**1、****Elasticsearch通过乐观锁控制每个文档的_version信息, 强制创建语法会对当前操作的文档的_version信息进行初始化**;

**2、** 添加索引时, 发现已经存在对应id的文档, 而且其版本号与正在强制创建的文档的版本信息不匹配, 所以报错.

出现冲突后, 我们就能知道索引中已存在该文档了, 就可以根据自己的应用需求, 采取更改id后重新添加, 或者更改已有的文档等操作.

## 4 删除document

(1)删除语法:

```java
DELETE index/type/id
```

(2)删除示例:

```java
DELETE employee/developer/1
// 再次查看id为1的文档, 发现"found": false
```

(3)**Elasticsearch删除文档采取的是懒删除机制**:

不会立即物理删除, 而是将其标记为deleted, 当被删除的文档数量达到一定级别后, ES会在后台自动删除这些文档.
