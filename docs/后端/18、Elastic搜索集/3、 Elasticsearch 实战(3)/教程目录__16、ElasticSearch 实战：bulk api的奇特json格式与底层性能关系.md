# 16、ElasticSearch 实战：bulk api的奇特json格式与底层性能关系
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/16.html
- 分类：搜索引擎
- 分组：教程目录
### 1、bulk的执行过程

一次bulk请求可能包含了多个增删改document的操作，因此bulk的每个操作都可能要转发到不同的es node的primary shard去执行，这个过程就包含了json数据的传输。

### 2、假如采用比较良好的json数组格式

假如使用比较良好的json数组格式，会是这个样子

```java
POST /_bulk
{ "update": { "_index": "test_index", "_type": "test_type", "_id": "1", "_retry_on_conflict" : 3} }
{
    "doc": {
        "test_field": "update test"
    }
}
```

这样看起来是不是清晰明了？但es是不支持的。因为假如es支持的话，es需要对json数组进行额外处理，整个_bulk流程是下面这样的

(1)将良好的json数组格式解析为JSONArray对象，这个时候，整个json就会在内存中出现一份一模一样的拷贝，一份是json文本，一份是JSONArray对象

(2)解析出json数组里的每个json(也就是document)

(3)对每个请求的document进行路由

(4)为路由到同一个shard上的多个请求，创建一个请求数组

(5)将这个请求数组序列化

(6)将序列化后的请求数组发送到对应的节点上去

之前提到过bulk size最佳大小的问题，一般建议在几千条或者10MB左右。所以说可怕的事情来了，假如有100个bulk请求发送到一个节点上去，然后每个请求是10MB，100个请求就是1000M=1G，然后每个请求的json都copy一份为JSONArray对象，此时内存占用就会翻倍，共占用2G内存，甚至不止，因为弄成JSONArray之后，还可能会搞一些其它的数据结构，就会占用2G+的内存。

占用更多的内存可能就会积压内存，影响其它请求的内存使用量，比如说最重要的搜索请求、搜索请求等等，此时就可能导致其它请求的性能急速下降。

另外，占用内存更多，也会导致java虚拟机的垃圾回收次数更频繁，每次要回收的垃圾对象更多，耗费时间更多，导致es的java虚拟机阻塞工作线程的时间更多

### 3、es支持的json格式

bulk的格式要求为一条数据的json要放在一行

```java
POST /_bulk
{ "update": { "_index": "test_index", "_type": "test_type", "_id": "1", "_retry_on_conflict" : 3} }
{ "doc" : {"test_field" : "update test"} }
```

这样做有什么好处呢？我们来看下整个_bulk流程

(1)不用将其转换为json对象，不会出现内存中相同数据的拷贝，直接按照换行符切割json

(2)对每两个一组的json，读取meta，进行document路由

(3)直接将对应的json发送到node上去

其最大优势在于，不需要讲json数组解析为一个JSONArray对象，形成一份大数据的拷贝，浪费内存空间，尽可能地保证性能
