# 06、ElasticSearch 实战：入门-get查询数据&amp;乐观锁字段
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/6.html
- 分类：搜索引擎
- 分组：教程目录
> 接第5节

### 3、查询文档

#### 3.1、get查询数据

GET customer/external/1

结果:
{
 “_index”: “customer”, //在哪个索引
 “_type”: “external”, //在哪个类型
 “_id”: “1”, //记录id
 “_version”: 4, //版本号
 “_seq_no”: 5, //并发控制字段,每次更新就会+1,用来做乐观锁
 “_primary_term”: 1, //同上,主分片重新分配,如重启,就会变化
 “found”: true, //表示找到了数据
 “_source”: { //数据内容
 “name”: “lohn Doe”
 }
}

更新携带 ?if_seq_no=0&if_primary_term=1

在postman 中使用 get 方法请求 `http://192.168.56.10:9200/customer/external/1`，会得到如下的结果：

```java
{
    "_index": "customer",	//在哪个索引
    "_type": "external",	//在哪个类型
    "_id": "1",				//记录id
    "_version": 4,			//版本号
    "_seq_no": 5,			//并发控制字段,每次更新就会+1,用来做乐观锁
    "_primary_term": 1,		//同上,主分片重新分配,如重启,就会变化
    "found": true,			//表示找到了数据
    "_source": {
     			//数据内容
        "name": "lohn Doe"
    }
}
```

#### 3.2、乐观锁修改

要使用乐观锁修改，我们就需要在 put 或 post 请求的路径中加上`?if_seq_no=0&if_primary_term=1`字段；

我们在postman 中使用 put 方法发送 `http://192.168.56.10:9200/customer/external/1?if_seq_no=0&if_primary_term=1` 请求，参数传

```java
{
"name":"update"
}
```

执行更新错操作后，出现如下返回结果：

如果我们使用最新的序列号去更新，就会返回状态为 200 的更新成功的结果：
