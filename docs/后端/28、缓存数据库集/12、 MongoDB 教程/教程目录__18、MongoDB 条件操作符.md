# 18、MongoDB 条件操作符
- 来源：https://ddkk.com/zhuanlan/db/mongodb/18.html
- 分类：缓存数据库
- 分组：教程目录
### MongoDB中条件操作符有

操作符
描述
MongoDB 表示方法

>
大于
 `$` gt

=
大于等于
 `$` gte

)大于操作符 $ gt**；

```sh
获取 "lession" 集合中 "favorite" 大于 1000 的数据
```

```sh
    db.lession.find({"favorite" : {$gt : 1000}})
```

```sh
类似于 SQL 语句
```

```sh
    SELECT * FROM lession WHERE favorite > 1000;
```

```sh
输出结果
```

```sh
    { "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"), "title" : "PHP 基础教程", "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html", "tags" : [ "php", "php7" ], "favorite" : 2000 }
    { "_id" : ObjectId("59ede9b9a0f7c7d445f864a7"), "title" : "Java 基础教程", "description" : "Java 可以用来开发 JAVA WEB 和 AndRoid APP 运用程序", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/java/java-basic-index.html", "tags" : [ "java", "android" ], "favorite" : 3000 }
```

**2、****MongoDB（>=）大于等于操作符 $ gte**；

```sh
获取 "lession" 集合中 "favorite" 大于等于 1000 的数据
```

```sh
    db.lession.find({favorite : {$gte : 1000}})
```

```sh
类似于 SQL 语句
```

```sh
    SELECT * FROM lession WHERE favorite >= 1000;
```

```sh
输出结果
```

```sh
    { "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"), "title" : "PHP 基础教程", "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html", "tags" : [ "php", "php7" ], "favorite" : 2000 }
    { "_id" : ObjectId("59ede9b9a0f7c7d445f864a7"), "title" : "Java 基础教程", "description" : "Java 可以用来开发 JAVA WEB 和 AndRoid APP 运用程序", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/java/java-basic-index.html", "tags" : [ "java", "android" ], "favorite" : 3000 }
    { "_id" : ObjectId("59edea6da0f7c7d445f864a9"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是一个 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html", "tags" : [ "mongodb" ], "favorite" : 1000 }
```

**3、****MongoDB(<)小于操作符– $ lt**；

```sh
获取 "lession" 集合中 "favorite" 小于 2000 的数据
```

```sh
    db.lession.find({"favorite" : {$lt : 2000}})
```

```sh
类似于 SQL 语句
```

```sh
    SELECT * FROM lession WHERE favorite < 2000;
```

```sh
输出结果
```

```sh
    { "_id" : ObjectId("59edea6da0f7c7d445f864a9"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是一个 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html", "tags" : [ "mongodb" ], "favorite" : 1000 }
```

**4、** **MongoDB(<=)小于操作符– `$` lte；

```sh
获取 "lession" 集合中 "favorite" 小于等于 2000 的数据
```

```sh
    db.lession.find({"favorite" : {$lte : 2000}})
```

```sh
类似于 SQL 语句
```

```sh
    SELECT * FROM lession WHERE favorite <= 2000;
```

```sh
输出结果
```

```sh
    { "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"), "title" : "PHP 基础教程", "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html", "tags" : [ "php", "php7" ], "favorite" : 2000 }
    { "_id" : ObjectId("59edea6da0f7c7d445f864a9"), "title" : "MongoDB 基础教程", "description" : "MongoDB 是一个 Nosql 数据库", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/mongodb/mongodb-basic-index.html", "tags" : [ "mongodb" ], "favorite" : 1000 }
```

**5、****MongoDB使用()查询– $ lt和 $ gt**；

```sh
获取 "lession" 集合中 "favorite" 小于 3000 且大于 1000 的数据
```

```sh
    db.lession.find({"favorite" : {$lt : 3000,$gt:1000}})
```

```sh
类似于 SQL 语句
```

```sh
    SELECT * FROM lession WHERE favorite < 3000 and favorite > 1000;
```

```sh
输出结果
```

```sh
    { "_id" : ObjectId("59ede9b2a0f7c7d445f864a6"), "title" : "PHP 基础教程", "description" : "PHP 是一种创建动态交互性站点的强有力的服务器端脚本语言", "by" : "penglei", "url" : "https://ddkk.com/l/penglei/php/php-basic-index.html", "tags" : [ "php", "php7" ], "favorite" : 2000 }
```
