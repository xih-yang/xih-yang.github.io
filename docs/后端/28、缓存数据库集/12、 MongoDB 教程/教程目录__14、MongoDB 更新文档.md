# 14、MongoDB 更新文档
- 来源：https://ddkk.com/zhuanlan/db/mongodb/14.html
- 分类：缓存数据库
- 分组：教程目录
## update() 方法

MongoDB update() 方法用于更新已存在的文档

### 语法

```sh
> db.collection.update(
   <query>,
   <update>,
   {
     upsert: <boolean>,
     multi: <boolean>,
     writeConcern: <document>
   }
)
```

#### 参数说明

参数
说明

query
update 方法的查询条件，类似 sql update 查询内 where 语句

update
update的数据和一些更新的操作符（如 `$` , `$` inc…）等
可以理解为 sql update 语句中的 set 子句

upsert
可选。如果数据不存在集合中，是否插入数据
true 插入 ， 默认是 false，不插入

multi
可选。是否只更新找到的第一条记录。如果为 true，就把按条件查出来多条记录全部更新，默认是 false 只更新第一条

writeConcern
可选，设置抛出异常的级别

### 实例

上一章节中学习 insert() 方法的插入了三条数据

> pretty() 用于美化输出结果

```sh
> db.lession.find().pretty()
{
    "_id" : ObjectId("59ed9d2dc3ba87608db0fe4b"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com",
    "tags" : [
        "mongodb",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000000
}
{
    "_id" : ObjectId("59ed9efdc3ba87608db0fe4c"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com",
    "tags" : [
        "mongodb",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000000
}
{
    "_id" : ObjectId("59ed9fc5c3ba87608db0fe4d"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com",
    "tags" : [
        "mongodb",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000001
}
> 
```

我们使用 **update()** 方法将 **by** 设置为 **DDKK.COM 弟弟快看，程序员编程资料站**

```sh
> db.lession.update({'by':'penglei'},{$set:{'by':'DDKK.COM 弟弟快看，程序员编程资料站'}})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
```

使用db.lession.find() 方法查看刚刚的更新

```sh
> db.lession.find().pretty()
{
    "_id" : ObjectId("59ed9d2dc3ba87608db0fe4b"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "DDKK.COM 弟弟快看，程序员编程资料站",
    "url" : "https://ddkk.com",
    "tags" : [
        "mongodb",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000000
}
{
    "_id" : ObjectId("59ed9efdc3ba87608db0fe4c"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com",
    "tags" : [
        "mongodb",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000000
}
{
    "_id" : ObjectId("59ed9fc5c3ba87608db0fe4d"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com",
    "tags" : [
        "mongodb",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000001
}
>
```

我们可以看到只有第一条数据的 by 由 “penglei” 变成了 **DDKK.COM 弟弟快看，程序员编程资料站**

如果要修改全部符合查询条件的文档，则需要设置 multi 参数为 true

```sh
> db.lession.update({'by':'penglei'},{$set:{'by':'DDKK.COM 弟弟快看，程序员编程资料站'}},{multi:true})
WriteResult({ "nMatched" : 2, "nUpserted" : 0, "nModified" : 2 })
```

## save() 方法

MongoDB save() 方法通过传入的文档来替换已有文档

### 语法

```sh
> db.collection.save(
   <document>,
   {
     writeConcern: <document>
   }
)
```

### 参数说明

参数
说明

document
文档数据

writeConcern
可选，抛出异常的级别

### 范例

我们使用 save() 方法来替换 _id 为 59ed9fc5c3ba87608db0fe4d 的文档

我们修改了两个地方，一个是 favorite 的值，另一个是矫正了 tags 中的大小写

```sh
> db.lession.save({
    "_id" : ObjectId("59ed9fc5c3ba87608db0fe4d"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是最流行的 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com",
    "tags" : [
        "MongoDB",
        "database",
        "NoSQL"
    ],
    "favorite" : 1000005
})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
```

替换成功后，我们可以通过 find() 方法来查看替换后的数据

```sh
> db.lession.find()
{ "_id" : ObjectId("59ed9d2dc3ba87608db0fe4b"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "DDKK.COM 弟弟快看，程序员编程资料站", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000000 }
{ "_id" : ObjectId("59ed9efdc3ba87608db0fe4c"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "DDKK.COM 弟弟快看，程序员编程资料站", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000000 }
{ "_id" : ObjectId("59ed9fc5c3ba87608db0fe4d"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com", "tags" : [ "MongoDB", "database", "NoSQL" ], "favorite" : 1000005 }
```

可以看到最后一条数据已经更改过来了

## 更多范例

只更新第一条记录

```sh
db.author.update({"count":{$gt:1}} , {$set : {"by" : "souyunku"}});
```

全部更新

```sh
db.author.update({"count":{$gt:3}},{$set:{"by":"souyunku"}},false,true );
```

只添加第一条

```sh
db.author.update({"count":{$gt:4}},{$set:{"penglei":"souyunku"}},true,false);
```

全部添加进去

```sh
db.author.update({"count":{$gt:5}} ,{$set : {"by":"penglei"} },true,true );
```

全部更新

```sh
db.author.update({"count":{$gt:15}},{$inc:{"count":1}},false,true );
```

只更新第一条记录

```sh
db.author.update({"count":{$gt:10}},{$inc:{"count":1} },false,false );
```
