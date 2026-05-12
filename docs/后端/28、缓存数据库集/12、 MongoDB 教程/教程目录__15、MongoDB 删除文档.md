# 15、MongoDB 删除文档
- 来源：https://ddkk.com/zhuanlan/db/mongodb/15.html
- 分类：缓存数据库
- 分组：教程目录
在前面一章节中我们学习了如何向文档中插入数据，现在我们来学习如何在删除 MongoDB 集合

## remove() 方法

MongoDB **remove()** 方法是用来删除集合中的数据

### 语法

remove() 方法语法格式如下

```sh
> db.collection.remove(
   <query>,
   <justOne>
)
```

> 在运行 remove() 函数前先执行 find() 命令来判断执行的条件是否正确，这是一个良好的习惯

### 参数说明

参数
说明

query
必选。删除的文档的条件

justOne
可选。如果设为 true 或 1，则只删除一个文档

如果MongoDB 是 2.6 版本以后的，语法格式如下

```sh
> db.collection.remove(
   <query>,
   {
     justOne: <boolean>,
     writeConcern: <document>
   }
)
```

### 参数说明

参数
说明

query
可选。删除的文档的条件

justOne
可选。如果设为 true 或 1，则只删除一个文档

writeConcern
可选。抛出异常的级别

### 范例

首先我们执行 **insert()** 方法 3 次插入 3 条数据

```sh
> db.lession.insert({title: 'MongoDB 基础教程', 
  by: 'penglei',
  favorite: 1000000
})
WriteResult({ "nInserted" : 1 })
> db.lession.insert({title: 'MongoDB 基础教程', 
  by: 'penglei',
  favorite: 1000000
})
WriteResult({ "nInserted" : 1 })
> db.lession.insert({title: 'MongoDB 基础教程', 
...   by: 'penglei',
...   favorite: 1000000
... })
WriteResult({ "nInserted" : 1 })
```

接着使用 find() 函数查询数据

```sh
> db.lession.find().pretty()
{
  "_id" : ObjectId("59edadf7c3ba87608db0fe4e"),
  "title" : "MongoDB 基础教程",
  "by" : "penglei",
  "favorite" : 1000000
}
{
  "_id" : ObjectId("59edadf8c3ba87608db0fe4f"),
  "title" : "MongoDB 基础教程",
  "by" : "penglei",
  "favorite" : 1000000
}
{
  "_id" : ObjectId("59edae8ac3ba87608db0fe50"),
  "title" : "MongoDB 基础教程",
  "by" : "penglei",
  "favorite" : 1000000
}
> 
```

现在我们来移除 一 条 by 为 ‘penglei’ 的文档，需要设置 justOne 为 1

```sh
> db.lession.remove({'by':'penglei'},true)
WriteResult({ "nRemoved" : 1 })  # 删除了 1 条数据，还剩下两条
> db.lession.find()
{ "_id" : ObjectId("59edadf8c3ba87608db0fe4f"), "title" : "MongoDB 基础教程", "by" : "penglei", "favorite" : 1000000 }
{ "_id" : ObjectId("59edae8ac3ba87608db0fe50"), "title" : "MongoDB 基础教程", "by" : "penglei", "favorite" : 1000000 }
```

接下来我们删除剩下的两条

```sh
> db.lession.remove({'by':'penglei'})
WriteResult({ "nRemoved" : 2 })  # 删除了两条 
> db.lession.find()  # 数据库空了
> 
```

如果想删除所有数据，可以使用以下方式

```sh
> db.lession.remove({})
```
