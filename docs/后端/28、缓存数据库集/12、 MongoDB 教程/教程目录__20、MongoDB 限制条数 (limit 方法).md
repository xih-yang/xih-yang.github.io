# 20、MongoDB 限制条数 (limit 方法)
- 来源：https://ddkk.com/zhuanlan/db/mongodb/20.html
- 分类：缓存数据库
- 分组：教程目录
limit() 方法接受一个数字参数，该参数指定从MongoDB中读取的记录条数

### 语法

limit() 方法语法如下：

```sh
> db.COLLECTION_NAME.find().limit(NUMBER)
```

### 范例

使用以下命令添加范例所需要的数据

```sh
> db.lession.remove({});
WriteResult({ "nRemoved" : 0 })
```

```sh
> db.lession.insert({
   title: 'MongoDB 基础教程', 
   by_user: 'penglei',
   tags: ['MongoDB', 'database', 'NoSQL'],
   favorite: 100
});
WriteResult({ "nInserted" : 1 })
```

```sh
> db.lession.insert({
  title: 'NoSQL 基础教程', 
  by_user: 'penglei',
  tags: ['MongoDB', 'database', 'NoSQL'],
  favorite: 10
});
WriteResult({ "nInserted" : 1 })
```

```sh
> db.lession.insert({
   title: 'Neo4j 基础教程', 
   by_user: 'Neo4j',
   tags: ['Neo4j', 'database', 'NoSQL'],
   favorite: 750
});
WriteResult({ "nInserted" : 1 })
```

#### 现在，我们使用以下命令从文档中读取两条记录

```sh
> db.lession.find({},{"title":1,_id:0}).limit(2)
{ "title" : "MongoDB 基础教程" }
{ "title" : "NoSQL 基础教程" }
> 
```

### 注意

如果没有指定limit()方法中的参数则显示集合中的所有数据
