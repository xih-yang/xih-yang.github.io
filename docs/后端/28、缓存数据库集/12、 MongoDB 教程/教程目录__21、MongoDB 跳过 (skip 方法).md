# 21、MongoDB 跳过 (skip 方法)
- 来源：https://ddkk.com/zhuanlan/db/mongodb/21.html
- 分类：缓存数据库
- 分组：教程目录
skip() 方法接受一个数字参数作为跳过的记录条数

### 语法

skip() 方法语法格式如下

```sh
> db.COLLECTION_NAME.find().limit(NUMBER).skip(NUMBER)
```

skip() 方法默认参数为 0 表示不跳过任何行

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

现在我们使用下面的命令显示第二条文档数据

```sh
> db.lession.find({},{"title":1,_id:0}).limit(1).skip(1)
{ "title" : "NoSQL 基础教程" }
>
```
