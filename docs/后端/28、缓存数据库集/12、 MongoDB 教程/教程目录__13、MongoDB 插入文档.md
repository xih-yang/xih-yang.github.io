# 13、MongoDB 插入文档
- 来源：https://ddkk.com/zhuanlan/db/mongodb/13.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 文档的数据结构和 JSON 基本一样

存储在MongoDB 集合中的数据都是 BSON 格式

BSON 是一种类 json 的一种二进制形式的存储格式,简称 Binary JSON

## insert() 方法

MongoDB 使用 insert() 或 save() 方法向集合中插入文档

### insert() 方法语法格式如下

```sh
db.COLLECTION_NAME.insert(document)
```

### 范例

这个范例使用 insert() 方法将文档存储到 souyunku 数据库的 lession 集合中

```sh
> db.lession.insert({title: 'MongoDB 基础教程', 
    description: 'MongoDB 是最流行的 Nosql 数据库',
    by: 'penglei',
    url: 'https://ddkk.com',
    tags: ['mongodb', 'database', 'NoSQL'],
    favorite: 1000000
})
WriteResult({ "nInserted" : 1 })
```

如果lession 集合不在数据库 souyunku 中， MongoDB 会自动创建该集合并插入文档

#### 查看已插入文档

```sh
> db.lession.find()
{
    "_id" : ObjectId("59ed9d2dc3ba87608db0fe4b"), 
    "title" : "MongoDB 基础教程", 
    "description" : "MongoDB 是最流行的 Nosql 数据库", 
    "by" : "penglei", 
    "url" : "https://ddkk.com", 
    "tags" : [ "mongodb", "database", "NoSQL" ], 
    "favorite" : 1000000 
}
```

我们可以将数据先赋值给一个变量

#### 语法如下

```sh
variable_name = ( document_data );
```

小括号是可选的

比如下面把 **MongoDB 基础教程** 文档赋值给 **doc** 变量

```sh
> doc=({
    "title" : "MongoDB 基础教程", 
    "description" : "MongoDB 是最流行的 Nosql 数据库", 
    "by" : "penglei", 
    "url" : "https://ddkk.com", 
    "tags" : [ "mongodb", "database", "NoSQL" ], 
    "favorite" : 1000000 
});
```

然后再使用 **insert** 方法将文档插入到集合中

```sh
> db.lession.insert(doc)
WriteResult({ "nInserted" : 1 })
>
```

执行后显示结果如下：

```sh
> db.lession.find()
{ "_id" : ObjectId("59ed9d2dc3ba87608db0fe4b"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000000 }
{ "_id" : ObjectId("59ed9efdc3ba87608db0fe4c"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000000 }
> 
```

### save() 方法

插入文档也可以使用 db.lession.save(document) 方法

如果不指定 _id 字段 save() 方法类似于 insert() 方法

如果指定 _id 字段，则会更新该 _id 的数据

### save() 方法语法格式如下

```sh
db.COLLECTION_NAME.save(document)
```

### 范例

这个范例使用 save() 方法将文档存储到 souyunku 数据库的 lession 集合中

```sh
> db.lession.save({title: 'MongoDB 基础教程', 
    description: 'MongoDB 是最流行的 Nosql 数据库',
    by: 'penglei',
    url: 'https://ddkk.com',
    tags: ['mongodb', 'database', 'NoSQL'],
    favorite: 1000001
})
WriteResult({ "nInserted" : 1 })
```

使用find() 方法查询刚刚保存的数据

```sh
> db.lession.find()
{ "_id" : ObjectId("59ed9d2dc3ba87608db0fe4b"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000000 }
{ "_id" : ObjectId("59ed9efdc3ba87608db0fe4c"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000000 }
{ "_id" : ObjectId("59ed9fc5c3ba87608db0fe4d"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是最流行的 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com", "tags" : [ "mongodb", "database", "NoSQL" ], "favorite" : 1000001 }
```
