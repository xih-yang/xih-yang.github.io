# 07、ElasticSearch 实战：入门-put&amp;post修改数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/7.html
- 分类：搜索引擎
- 分组：教程目录
> 接第6节

### 4、更新文档

更新操作
参数或结论

POST
customer/external/1/_update
{
 “doc”: {
 “name”: “Jane Doe”,
 “age”: 20
 }
}

或者POST
customer/external/1
{
“name”: “John Nash2”
}

或者PUT
customer/external/1
{
“name”: “John Nash3”
}

不同
POST 操作会对比源文档数据,如果相同不会有什么操作,文档 version 、_seq_no 不增加;
PUT 操作总会将数据重新保存并增加 version 版本;
带 _update 对比元数据如果一样就不进行任何操作。

看场景
对于大并发更新,不带update;
对于大并发查询偶尔更新,带update;对比更新,重新计算分配规则。

更新同时增加属性
POST
customer/external/1/_update
{
 “doc”: {
 “name”: “Jane Doe”,
 “age”: 20
 }
}

更新同时增加属性
PUT&POST
customer/external/1
{
 “name”: “John Nash2”,
 “age”: 40
}

使用带`_update` 的 post 请求更新数据，在 postman 中使用 post 方法发送 `http://192.168.56.10:9200/customer/external/1/_update` 请求，参数传：

```java
{
     "doc": {
          "name": "John Nash"
     }
}
```

发送请求可以得到下面的结果，可以看到更新成功：

再次发送请求，可以看到如果数据相同，对比原来数据，与原来一样就什么都不做，`_version`、`_seq_no`也不会变：

使用`不`带 `_update` 的 post 请求更新数据，在 postman 中使用 post 方法发送 `http://192.168.56.10:9200/customer/external/1` 请求，

参数同上，可以看到，每点击一次就会更新一次数据，不会做数据的校验：

> 注意，对于不带 _update 的更新，传参时可以使用

```java
{
     "doc": {
          "name": "John Nash",
          "age":40
     }
}
```

> 也可以使用：

```java
{
     "name": "John Nash2",
     "age": 40
}
```
