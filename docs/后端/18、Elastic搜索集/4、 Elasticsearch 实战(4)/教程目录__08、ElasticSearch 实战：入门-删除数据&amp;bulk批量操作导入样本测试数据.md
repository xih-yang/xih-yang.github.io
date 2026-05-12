# 08、ElasticSearch 实战：入门-删除数据&amp;bulk批量操作导入样本测试数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/8.html
- 分类：搜索引擎
- 分组：教程目录
> 接第7节

### 5、删除文档&索引

删除类型
方法或路径参数

删除文档
DELETE customer/external/1

删除索引
DELETE customer

#### 5.1、删除文档

在postman 中使用 delete 方法发送 `http://192.168.56.10:9200/customer/external/1` 请求，可以看到以下结果，可以看到删除文档成功：

再发送一次请求，会返回一个 404 状态的 `not_found` 结果：

查询一下刚才删除的文档，会返回一个`"found": false`的 404 状态的结果：

#### 5.2、删除索引

在postman 中使用 delete 方法发送 `http://192.168.56.10:9200/customer` 请求，可以看到以下结果，可以看到删除索引成功：

再发送一次请求，会返回一个 404 状态的 `index_not_found_exception` 结果：

查询一下刚才删除的索引，会返回一个`no such index [customer]`的 404 状态的结果：

> 那么问题来了，既然可以删除文档和索引，那么能不能删除类型呢？
>
> 在ES 中，一个索引下有很多种类型，但是 ES 没有提供删除类型的方法，删除了索引，就会删除所有类型。

### 6、bulk 批量 API

操作
参数

POST
customer/external/_bulk
{“index” {"_id":“1”}
{“name”: “John Nash”}

{“index”:"_id"2"}
{“name”: “Jane Nash”}

语法格式
{action: {metadata}}\n
{request body}\n

{action: {metadata}}\n
{request body}\n

复杂实例
POST /_bulk
{“delete”:{"_index":“website”,"_type":“blog”,"_id":“123”}}
{“create”:{"_index":“website”,"_type":“blog”,"_id":“123”}}
{“title”:“My first blog post”}
{“index”:{"_index":“website”,"_type":“blog”}}
{“title”:“My second blog post”}
{“update”:{"_index":“website”,"_type":“blog”,"_id":“123”}}
{“doc”:{“title”:“My updated blog post”}}

要使用bulk 批量 API，就需要在 kibana 中来执行我们的操作，如果在 postman 中请求会报错：

首先我们的请求体中的数据已经不是 json 格式了，我们是用 text 格式，会报下面的错误：

我们再换成 json 试一下：

上面的json 格式有误，修改再试一下：

可以看到在 postman 中无法完成 bulk 批量操作，我们需要在之前装好的 kibana 中进行操作。

打开kibana 的控制台，选择 `DevTools`：

点击后出现 `DevTools` 数据操作界面。我们就是要在这里来进行数据操作：

使用`DevTools` 来执行批量操作，可以看到下面的结果：

进行一个复杂的批量操作：

```java
POST /_bulk
{"delete":{"_index":"website","_type":"blog","_id":"123"}}
{"create":{"_index":"website","_type":"blog","_id":"123"}}
{"title":"My first blog post"}
{"index":{"_index":"website","_type":"blog"}}
{"title":"My second blog post"}
{"update":{"_index":"website","_type":"blog","_id":"123"}}
{"doc":{"title":"My updated blog post"}}
```

上面直接使用了`/_bulk`，没有指定具体的索引，表示在 ES 全局执行。执行结果如下：

bulk API 以此按顺序执行所有的 `action` (动作) 。

如果一个单个的动作因任何原因而失败，它将继续处理它后面剩余的动作。

当bulk API 返回时，它将提供每个动作的状态(与发送的顺序相同) ，所以你可以检查是否一个指定的动作是不是失败了。

### 7、样本测试数据

我准备了一份顾客银行账户信息的虚构的 JSON 文档样本。每个文档都有下列的 schema(模式) :

schema

{
 “account_number”: 1,
 “balance”: 39225,
 “firstname”: “Amber”,
 “lastname”: “Duke”,
 “age”: 32,
 “gender”: “M”,
 “address”: “880 Holmes Lane”,
 “employer”: “Pyrami”,
 “email”: “amberduke@pyrami.com”,
 “city”: “Brogan”,
 “state”: “IL”
}

上面的数据是从 github 的 ES 官方文档中截取的，可以访问下面的地址：

[accounts.json](https://github.com/elastic/elasticsearch/blob/master/docs/src/test/resources/accounts.json) 导入测试数据

在ES 中执行测试数据

`POST bank/account/_bulk`:

> 如果在 github 上不好拷贝数据，可以使用我下载好的数据：accounts.json，或访问 gitee-accounts.json

创建完成后可以使用`http://192.168.56.10:9200/_cat/indices`，来查看一下现在 ES 中的索引，可以看到有 bank 的索引有 1000 条数据：
