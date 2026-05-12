# 22、MongoDB 排序
- 来源：https://ddkk.com/zhuanlan/db/mongodb/22.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB sort() 方法可以通过参数指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 1 为升序排列，而-1是用于降序排列

### 语法

sort() 方法语法如下

```sh
> db.COLLECTION_NAME.find().sort({KEY:1})
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

现在，我们按字段 favorite 的降序排列输出数据

```sh
> db.lession.find({},{"title":1,_id:0,'favorite':1}).sort({"favorite":-1})
{ "title" : "Neo4j 基础教程", "favorite" : 750 }
{ "title" : "MongoDB 基础教程", "favorite" : 100 }
{ "title" : "NoSQL 基础教程", "favorite" : 10 }
>
```
