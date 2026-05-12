# 19、MongoDB `$` type操作符
- 来源：https://ddkk.com/zhuanlan/db/mongodb/19.html
- 分类：缓存数据库
- 分组：教程目录
### 下表是 MongoDB 中的数据类型

类型
数字

Double
1

String
2

Object
3

Array
4

Binary data
5

Undefined已废弃
6

Object id
7

Boolean
8

Date
9

Null
10

Regular Expression
11

JavaScript
13

Symbol
14

JavaScript (with scope)
15

32-bit integer
16

Timestamp
17

64-bit integer
18

Min key
255

Max key
127

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

可以使用 **find()** 方法查看数据

```sh
> db.lession.find()
{ "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"), "title" : "PHP 基础教程", "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html", "tags" : [ "php", "php7" ], "favorite" : 2000 }
{ "_id" : ObjectId("59ede9b9a0f7c7d445f864a7"), "title" : "Java 基础教程", "description" : "Java 可以用来开发 JAVA WEB 和 AndRoid APP 运用程序", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/java/java-basic-index.html", "tags" : [ "java", "android" ], "favorite" : 3000 }
{ "_id" : ObjectId("59edea6da0f7c7d445f864a9"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是一个 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html", "tags" : [ "mongodb" ], "favorite" : 1000 }
```

### MongoDB $ type 操作符范例

下面的命令可以获取 “lession” 集合中 title 为 String 的数据

```sh
> db.lession.find({"title" : {$type : 2}},{"title":1,"favorite":1,_id:0})
```

输出结果为：

```sh
{ "title" : "PHP 基础教程", "favorite" : 2000 }
{ "title" : "Java 基础教程", "favorite" : 3000 }
{ "title" : "MongoDB 基础教程", "favorite" : 1000 }
```
