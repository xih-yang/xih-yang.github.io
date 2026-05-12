# 24、MongoDB 聚合运算( aggregate )
- 来源：https://ddkk.com/zhuanlan/db/mongodb/24.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 聚合有点类似 SQL 语句中的 COUNT( * )

## aggregate() 方法

MongoDB **aggregate()** 为 MongoDB 数据库提供了聚合运算

### 语法

aggregate() 方法的语法如下

```sh
> db.COLLECTION_NAME.aggregate(AGGREGATE_OPERATION)
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

现在，我们使用 aggregate() 方法统计每个作者的课程数量

```sh
> db.lession.aggregate([{$group : {_id : "$by_user", num_lession : {$sum : 1}}}]);
{ "_id" : "Neo4j", "num_lession" : 1 }
{ "_id" : "penglei", "num_lession" : 2 }
```

上面的例子，通过字段 by_user 字段对数据进行分组，并计算 by_user 字段相同值的总和

上面的命令类似于 SQL 中的

```sh
select by_user, count(*) from lession group by by_user
```

### 下面罗列出了一些聚合的表达式

**1、** ** `$` sum**；

```sh
计算总和
```

```sh
    db.lession.aggregate([{$group:{_id:"$by_user",num_tutorial:{$sum : "$likes"}}}])
```

**2、** ** `$` avg**；

```sh
计算平均值
```

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", num_tutorial : {$avg : "$likes"}}}])
```

**3、** ** `$` min**；

```sh
获取集合中所有文档对应值得最小值
```

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", num_tutorial : {$min : "$likes"}}}])
```

**4、**`$` max；

```sh
获取集合中所有文档对应值得最大值
```

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", num_tutorial : {$max : "$likes"}}}])
```

**5、**`$` push；

```sh
在结果文档中插入值到一个数组中
```

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", url : {$push: "$url"}}}])
```

**6、**`$` addToSet；

```sh
在结果文档中插入值到一个数组中，但不创建副本
```

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", url : {$addToSet : "$url"}}}])
```

**7、**`$` first；

```sh
根据资源文档的排序获取第一个文档数据
```

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", first_url : {$first : "$url"}}}])
```

**8、**`$` last根据资源文档的排序获取最后一个文档数据；

```sh
    db.mycol.aggregate([{$group : {_id : "$by_user", last_url : {$last : "$url"}}}])
```
