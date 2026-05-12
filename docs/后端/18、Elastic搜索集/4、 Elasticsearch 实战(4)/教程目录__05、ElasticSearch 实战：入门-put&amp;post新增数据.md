# 05、ElasticSearch 实战：入门-put&amp;post新增数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/5.html
- 分类：搜索引擎
- 分组：教程目录
> 接第4节

### 2、索引一个文档(对应成Mysql就是保存一条记录)

保存一个数据，保存在哪个`索引`的哪个`类型`下，指定用哪个唯一标识`PUT customer/external/1`；

在customer 索引下的 external 类型下保存 1 号数据为

PUT customer/external/1

{
 “name”:“lohn Doe”
}

PUT 和 POST 都可以；
POST 新增。如果不指定id，会自动生成 id。指定 id 就会修改这个数据，并新增版本号；
PUT 可以新增也可以修改。PUT 必须指定 id；由于 PUT 需要指定 id，我们一般都用来做修改；

在postman 地址栏中输入 `http://192.168.56.10:9200/customer/external/1`，使用 put 方法，输入参数体：

```java
{
"name":"lohn Doe"
}
```

可以看到创建记录成功：

再一次发送请求后得到如下结果：

```java
{
    "_index": "customer",
    "_type": "external",
    "_id": "1",
    "_version": 2, //注意版本号
    "result": "updated",//注意结果是 update
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 1, //注意序列号
    "_primary_term": 1
}
```

所以put 方法既可以用来新增，也可以用来更新。

在postman 中使用 post 方法发送 `http://192.168.56.10:9200/customer/external/` 请求，注意没有带 id，使用的还是上面 put 方法中的参数，

可以看到创建记录成功，es 帮我们生成了一个id：

当我们使用这个 id 再一次发送 post 请求时，就会变成更新操作：

所以post 方法不带 id 时是新增，带 id 不存在时也是新增，带 id 且数据存在时是更新操作。

那么问题来了，put 和 post 方法有啥区别呢？如果使用 put 方法不带 id 发送请求行不行？

可以看到使用 put 方法不带 id 请求会报错，也就是说 put 是不允许不带 id 请求的，而 post 是允许的。
