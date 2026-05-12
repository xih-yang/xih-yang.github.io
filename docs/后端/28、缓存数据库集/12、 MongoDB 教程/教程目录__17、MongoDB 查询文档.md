# 17、MongoDB 查询文档
- 来源：https://ddkk.com/zhuanlan/db/mongodb/17.html
- 分类：缓存数据库
- 分组：教程目录
find() 方法以非结构化的方式来显示所有文档

除了find() 方法之外，还有一个 findOne() 方法，它只返回一个文档

### 语法

find() 方法语法格式如下

```sh
> db.COLLECTION_NAME.find(query, projection)
```

### 参数说明

参数
说明

query
可选，使用查询操作符指定查询条件

projection
可选，使用投影操作符指定返回的键。查询时返回文档中所有键值， 只需省略该参数即可（默认省略）

## pretty() 方法

MongoDB **pretty()** 方法以易读的方式来显示数据

### pretty() 语法格式如下

```sh
> db.COLLECTION_NAME.find().pretty()
```

### 范例数据

使用以下命令向 数据库 souyunku 中的 **lession** 集合中插入数据

```sh
> db.lession.remove({});
```

```sh
> db.lession.insert({
    title: 'PHP 基础教程', 
    description: 'PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言',
    by: 'penglei',
    url: 'https://ddkk.com/l/penglei/php/php-basic-index.html',
    tags: ['php','php7'],
    favorite: 2000
})
```

```sh
> db.lession.insert({title: 'Java 基础教程', 
    description: 'Java 可以用来开发 JAVA WEB 和 AndRoid APP 运用程序',
    by: 'penglei',
    url: 'https://ddkk.com/l/penglei/java/java-basic-index.html',
    tags: ['java','android'],
    favorite: 3000
})
```

```sh
> db.lession.insert({title: 'MongoDB 基础教程', 
    description: 'MongoDB 是一个 Nosql 数据库',
    by: 'penglei',
    url: 'https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html',
    tags: ['mongodb'],
    favorite: 1000
})
```

现在，我们使用 find() 来查询集合 lession 中的数据 以下实例我们查询了集合 col 中的数据：

```sh
> db.lession.find().pretty()
{
    "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"),
    "title" : "PHP 基础教程",
    "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html",
    "tags" : [
        "php",
        "php7"
    ],
    "favorite" : 2000
}
{
    "_id" : ObjectId("59ede9b9a0f7c7d445f864a7"),
    "title" : "Java 基础教程",
    "description" : "Java 可以用来开发 JAVA WEB 和 AndRoid APP 运用程序",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/java/java-basic-index.html",
    "tags" : [
        "java",
        "android"
    ],
    "favorite" : 3000
}
{
    "_id" : ObjectId("59edea6da0f7c7d445f864a9"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是一个 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html",
    "tags" : [
        "mongodb"
    ],
    "favorite" : 1000
}
> 
```

## MongoDB 与 RDBMS WHERE 语句比较

如果你熟悉常规的 SQL 数据，通过下表可以更好的理解 MongoDB 的条件语句查询

操作
格式
范例
RDBMS 中的类似语句

等于
{:}
db.lession.find({“by”:”penglei”}).pretty()
where by = ‘penglei’

小于
{:{ `$` lt:}}
db.lession.find({“favorite”:{ `$` lt:50}}).pretty()
where favorite :{ `$` lte:}}
db.lession.find({“favorite”:{ `$` lte:50}}).pretty()
where favorite :{ `$` gt:}}
db.lession.find({“favorite”:{ `$` gt:50}}).pretty()
where favorite > 1000

大于或等于
{:{ `$` gte:}}
db.lession.find({“favorite”:{ `$` gte:50}}).pretty()
where favorite >= 1000

不等于
{:{ `$` ne:}}
db.lession.find({“favorite”:{ `$` ne:50}}).pretty()
where favorite != 1000

## MongoDB AND 条件

MongoDB 的 find() 方法可以传入多个键(key)，每个键(key)以逗号隔开，及常规 SQL 的 AND 条件

语法格式如下：

```sh
> db.lession.find({key1:value1, key2:value2}).pretty()
```

### 范例

下面的范例通过 **by** 和 **title** 键来查询 **penglei** 中 **MongoDB 基础教程** 的数据

```sh
> db.lession.find({"by":"penglei", "title":"MongoDB 基础教程"}).pretty()
{
    "_id" : ObjectId("59edea6da0f7c7d445f864a9"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是一个 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html",
    "tags" : [
        "mongodb"
    ],
    "favorite" : 1000
}
```

以上范例类似于 WHERE 语句

```sh
WHERE by = 'penglei' AND title = 'MongoDB 基础教程'
```

## MongoDB OR 条件

MongoDB OR 条件语句使用了关键字 ** `$` or**

语法格式如下：

```sh
> db.lession.find({$or: [{key1: value1}, {key2:value2}]}).pretty()
```

### 范例

下面的范例演示了查询键 **favorite** 值为 “1000” 或键 **title** 值为 **PHP 基础教程** 的文档

```sh
> db.lession.find({$or:[{"favorite":1000},{"title": "PHP 基础教程"}]}).pretty()
{
    "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"),
    "title" : "PHP 基础教程",
    "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html",
    "tags" : [
        "php",
        "php7"
    ],
    "favorite" : 2000
}
{
    "_id" : ObjectId("59edea6da0f7c7d445f864a9"),
    "title" : "MongoDB 基础教程",
    "description" : "MongoDB 是一个 Nosql 数据库",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html",
    "tags" : [
        "mongodb"
    ],
    "favorite" : 1000
}
```

## AND 和 OR 联合使用

下面的范例演示了 AND 和 OR 联合使用，类似常规 SQL 语句为

```sh
WHERE favorite > 1000 AND ( by = 'penglei' OR title = 'PHP 基础教程')
```

```sh
> db.lession.find({favorite: {$gt:1000}, $or: [{"by": "penglei"},{"title": "PHP 基础教程"}]}).pretty()
{
    "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"),
    "title" : "PHP 基础教程",
    "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html",
    "tags" : [
        "php",
        "php7"
    ],
    "favorite" : 2000
}
{
    "_id" : ObjectId("59ede9b9a0f7c7d445f864a7"),
    "title" : "Java 基础教程",
    "description" : "Java 可以用来开发 JAVA WEB 和 AndRoid APP 运用程序",
    "by" : "penglei",
    "url" : "https://ddkk.com/l/penglei/java/java-basic-index.html",
    "tags" : [
        "java",
        "android"
    ],
    "favorite" : 3000
}
```
