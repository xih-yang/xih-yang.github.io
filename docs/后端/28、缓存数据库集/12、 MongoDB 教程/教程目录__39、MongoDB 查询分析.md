# 39、MongoDB 查询分析
- 来源：https://ddkk.com/zhuanlan/db/mongodb/39.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 查询分析常用方法有：explain() 和 hint()

## 使用 explain() 分析性能

MongoDB explain() 方法提供了查询信息，使用索引及查询统计等

MongoDB explain() 有利于我们对索引的优化

### explain() 语法格式

MongoDB explain() 语法格式如下

```sh
db.collection.explain().<method(...)>
```

可以是以下几个方法

- aggregate()
- count()
- distinct()
- find()
- group()
- remove()
- update()

### 范例数据

使用以下命令向数据库 souyunku 中的 users 集合添加数据

```sh
> use souyunku;
> db.users.remove({})
> db.users.insert({"tel" : "13888886666", "birthday" : "11-11", "sex" : "M", "name" : "Ro penglei", "user_name" : "penglei" })
```

现在我们在 users 集合中创建 sex 和 user_name 的索引

```sh
> db.users.ensureIndex({sex:1,user_name:1})
{
   "createdCollectionAutomatically" : false,
   "numIndexesBefore" : 1,
   "numIndexesAfter" : 2,
   "ok" : 1
}
```

然后在查询语句中使用 explain() 方法

```sh
> db.users.find({sex:"M"},{user_name:1,_id:0}).explain()
```

以上的explain() 查询输出结果如下

```sh
> db.users.find({sex:"M"},{user_name:1,_id:0}).explain()
{
   "queryPlanner" : {
      "plannerVersion" : 1,
      "namespace" : "souyunku.users",
      "indexFilterSet" : false,
      "parsedQuery" : {
         "sex" : {
            "$eq" : "M"
         }
      },
      "winningPlan" : {
         "stage" : "PROJECTION",
         "transformBy" : {
            "user_name" : 1,
            "_id" : 0
         },
         "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
               "sex" : 1,
               "user_name" : 1
            },
            "indexName" : "sex_1_user_name_1",
            "isMultiKey" : false,
            "isUnique" : false,
            "isSparse" : false,
            "isPartial" : false,
            "indexVersion" : 1,
            "direction" : "forward",
            "indexBounds" : {
               "sex" : [
                  "[\"M\", \"M\"]"
               ],
               "user_name" : [
                  "[MinKey, MaxKey]"
               ]
            }
         }
      },
      "rejectedPlans" : [ ]
   },
   "serverInfo" : {
      "host" : "lie",
      "port" : 27017,
      "version" : "3.4.9",
      "gitVersion" : "876ebee8c7dd0e2d992f36a848ff4dc50ee6603e"
   },
   "ok" : 1
}
```

## 使用 hint() 方法强制使用索引

MongoDB hint() 方法可以强制 MongoDB 使用一个指定的索引

MongoDB hint() 方法在某些情形下会提升性能，比如一个有索引的 collection 并且执行一个多字段的查询(一些字段已经索引了)

下面的命令指定 使用 gender 和 user_name 索引字段来查询

```sh
> db.users.find({gender:"M"},{user_name:1,_id:0}).hint({gender:1,user_name:1})
```

可以使用 explain() 方法分析上面的查询

```sh
> db.users.find({gender:"M"},{user_name:1,_id:0}).hint({gender:1,user_name:1}).explain()
```
