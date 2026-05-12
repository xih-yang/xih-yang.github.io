# 34、Python 教程 - Mongodb增、删、改、查
- 来源：https://ddkk.com/zhuanlan/other/python/5/34.html
- 分类：Python 快速上手
- 分组：教程目录
### Mongodb 插入文档

MongoDB 中的一个文档类似 SQL 表中的一条记录。

#### 插入集合

集合中插入文档使用 insert_one() 方法，该方法的第一参数是字典 name => value 对。

以下实例向 sites 集合中插入文档：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
mydict = {
      "name": "dyf", "alexa": "10000", "url": "https://www.dyf.com" }
x = mycol.insert_one(mydict) 
print(x)
print(x)
```

执行输出结果为：

>

#### 返回 _id 字段

insert_one() 方法返回 InsertOneResult 对象，该对象包含 inserted_id 属性，它是插入文档的 id 值。

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient('mongodb://localhost:27017/')
mydb = myclient['dyfdb']
mycol = mydb["sites"]
mydict = {
      "name": "Google", "alexa": "1", "url": "https://www.google.com" }
x = mycol.insert_one(mydict)
print(x.inserted_id)
```

执行输出结果为：

> 5b2369cac315325f3698a1cf

如果我们在插入文档时没有指定 _id，MongoDB 会为每个文档添加一个唯一的 id。

#### 插入多个文档

集合中插入多个文档使用 insert_many() 方法，该方法的第一参数是字典列表。

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
mylist = [
  {
      "name": "Taobao", "alexa": "100", "url": "https://www.taobao.com" },
  {
      "name": "QQ", "alexa": "101", "url": "https://www.qq.com" },
  {
      "name": "Facebook", "alexa": "10", "url": "https://www.facebook.com" },
  {
      "name": "知乎", "alexa": "103", "url": "https://www.zhihu.com" },
  {
      "name": "Github", "alexa": "109", "url": "https://www.github.com" }
]
x = mycol.insert_many(mylist)
# 输出插入的所有文档对应的 _id 值
print(x.inserted_ids)
```

输出结果类似如下：

> [ObjectId(‘5b236aa9c315325f5236bbb6’), ObjectId(‘5b236aa9c315325f5236bbb7’), ObjectId(‘5b236aa9c315325f5236bbb8’), ObjectId(‘5b236aa9c315325f5236bbb9’), ObjectId(‘5b236aa9c315325f5236bbba’)]

insert_many() 方法返回 InsertManyResult 对象，该对象包含 inserted_ids 属性，该属性保存着所有插入文档的 id 值。

执行完以上查找，我们可以在命令终端，查看数据是否已插入。

#### 插入指定 _id 的多个文档

我们也可以自己指定 id，插入，以下实例我们在 site2 集合中插入数据，_id 为我们指定的：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["site2"]
mylist = [
  {
      "_id": 1, "name": "Dyf", "cn_name": "菜猿"},
  {
      "_id": 2, "name": "Google", "address": "Google 搜索"},
  {
      "_id": 3, "name": "Facebook", "address": "脸书"},
  {
      "_id": 4, "name": "Taobao", "address": "淘宝"},
  {
      "_id": 5, "name": "Zhihu", "address": "知乎"}
]
x = mycol.insert_many(mylist)
# 输出插入的所有文档对应的 _id 值
print(x.inserted_ids)
```

输出结果为：

> [1, 2, 3, 4, 5]

执行完以上查找，我们可以在命令终端，查看数据是否已插入.

### Mongodb 查询文档

MongoDB 中使用了 find 和 find_one 方法来查询集合中的数据，它类似于 SQL 中的 SELECT 语句。

本文使用的测试数据如下：

#### 查询一条数据

我们可以使用 find_one() 方法来查询集合中的一条数据。

查询sites 文档中的第一条数据：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
x = mycol.find_one()
print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b2369cac315325f3698a1cf’), ‘name’: ‘Google’, ‘alexa’: ‘1’, ‘url’: ‘https://www.google.com’}

#### 查询集合中所有数据

find() 方法可以查询集合中的所有数据，类似 SQL 中的 SELECT * 操作。

以下实例查找 sites 集合中的所有数据：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
for x in mycol.find():
  print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b2369cac315325f3698a1cf’), ‘name’: ‘Google’, ‘alexa’: ‘1’, ‘url’: ‘https://www.google.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb6’), ‘name’: ‘Taobao’, ‘alexa’: ‘100’, ‘url’: ‘https://www.taobao.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb7’), ‘name’: ‘QQ’, ‘alexa’: ‘101’, ‘url’: ‘https://www.qq.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb8’), ‘name’: ‘Facebook’, ‘alexa’: ‘10’, ‘url’: ‘https://www.facebook.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb9’), ‘name’: ‘知乎’, ‘alexa’: ‘103’, ‘url’: ‘https://www.zhihu.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbba’), ‘name’: ‘Github’, ‘alexa’: ‘109’, ‘url’: ‘https://www.github.com’}

#### 查询指定字段的数据

我们可以使用 find() 方法来查询指定字段的数据，将要返回的字段对应值设置为 1。

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
for x in mycol.find({
     },{
      "_id": 0, "name": 1, "alexa": 1 }):
  print(x)
```

输出结果为：

> {‘name’: ‘Google’, ‘alexa’: ‘1’}
>
> {‘name’: ‘Taobao’, ‘alexa’: ‘100’}
>
> {‘name’: ‘QQ’, ‘alexa’: ‘101’}
>
> {‘name’: ‘Facebook’, ‘alexa’: ‘10’}
>
> {‘name’: ‘知乎’, ‘alexa’: ‘103’}
>
> {‘name’: ‘Github’, ‘alexa’: ‘109’}

除了_id，你不能在一个对象中同时指定 0 和 1，如果你设置了一个字段为 0，则其他都为 1，反之亦然。

以下实例除了 alexa 字段外，其他都返回：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
for x in mycol.find({
     },{
      "alexa": 0 }):
  print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b2369cac315325f3698a1cf’), ‘name’: ‘Google’, ‘url’: ‘https://www.google.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb6’), ‘name’: ‘Taobao’, ‘url’: ‘https://www.taobao.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb7’), ‘name’: ‘QQ’, ‘url’: ‘https://www.qq.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb8’), ‘name’: ‘Facebook’, ‘url’: ‘https://www.facebook.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb9’), ‘name’: ‘知乎’, ‘url’: ‘https://www.zhihu.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbba’), ‘name’: ‘Github’, ‘url’: ‘https://www.github.com’}

以下代码同时指定了 0 和 1 则会报错：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
for x in mycol.find({
     },{
      "name": 1, "alexa": 0 }):
  print(x)
```

错误内容大概如下：

> …
> pymongo.errors.OperationFailure: Projection cannot have a mix of inclusion and exclusion.
>
> …

#### 根据指定条件查询

我们可以在 find() 中设置参数来过滤数据。

以下实例查找 name 字段为 “Google” 的数据：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "name": "Google" }
mydoc = mycol.find(myquery)
for x in mydoc:
  print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b2369cac315325f3698a1cf’), ‘name’: ‘Google’, ‘url’: ‘https://www.google.com’}

#### 高级查询

查询的条件语句中，我们还可以使用修饰符。

以下实例用于读取 name 字段中第一个字母 ASCII 值大于 “H” 的数据，大于的修饰符条件为 {“$gt”: “H”} :

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "name": {
      "$gt": "H" } }
mydoc = mycol.find(myquery)
for x in mydoc:
  print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb6’), ‘name’: ‘Taobao’, ‘alexa’: ‘100’, ‘url’: ‘https://www.taobao.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb7’), ‘name’: ‘QQ’, ‘alexa’: ‘101’, ‘url’: ‘https://www.qq.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb9’), ‘name’: ‘知乎’, ‘alexa’: ‘103’, ‘url’: ‘https://www.zhihu.com’}

#### 使用正则表达式查询

我们还可以使用正则表达式作为修饰符。

正则表达式修饰符只用于搜索字符串的字段。

以下实例用于读取 name 字段中第一个字母为 “G” 的数据，正则表达式修饰符条件为 {“$regex”: “^G”} :

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "name": {
      "$regex": "^G" } }
mydoc = mycol.find(myquery)
for x in mydoc:
  print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b2369cac315325f3698a1cf’), ‘name’: ‘Google’, ‘url’: ‘https://www.google.com’}

#### 返回指定条数记录

如果我们要对查询结果设置指定条数的记录可以使用 limit() 方法，该方法只接受一个数字参数。

以下实例返回 3 条文档记录：

```java
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myresult = mycol.find().limit(3)
# 输出结果
for x in myresult:
  print(x)
```

输出结果为：

> {‘_id’: ObjectId(‘5b2369cac315325f3698a1cf’), ‘name’: ‘Google’, ‘url’: ‘https://www.google.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb6’), ‘name’: ‘Taobao’, ‘url’: ‘https://www.taobao.com’}
>
> {‘_id’: ObjectId(‘5b236aa9c315325f5236bbb7’), ‘name’: ‘QQ’, ‘url’: ‘https://www.qq.com’}

### Mongodb 修改文档

我们可以在 MongoDB 中使用 update_one() 方法修改文档中的记录。该方法第一个参数为查询的条件，第二个参数为要修改的字段。

如果查找到的匹配数据多于一条，则只会修改第一条。

本文使用的测试数据如下

以下实例将 alexa 字段的值 1改为 12345:

```java
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "alexa": "1" }
newvalues = {
      "$set": {
      "alexa": "12345" } }
mycol.update_one(myquery, newvalues)
# 输出修改后的  "sites"  集合
for x in mycol.find():
  print(x)
```

执行输出结果为：

> {‘name’: ‘Google’, ‘alexa’: ‘12345’, ‘url’: ‘https://www.google.com’}
>
> { ‘name’: ‘Taobao’, ‘alexa’: ‘100’, ‘url’: ‘https://www.taobao.com’}
>
> { ‘name’: ‘QQ’, ‘alexa’: ‘101’, ‘url’: ‘https://www.qq.com’}
>
> { ‘name’: ‘Facebook’, ‘alexa’: ‘10’, ‘url’: ‘https://www.facebook.com’}
>
> {‘name’: ‘知乎’, ‘alexa’: ‘103’, ‘url’: ‘https://www.zhihu.com’}
>
> { ‘name’: ‘Github’, ‘alexa’: ‘109’, ‘url’: ‘https://www.github.com’}

update_one() 方法只能修匹配到的第一条记录，如果要修改所有匹配到的记录，可以使用 update_many()。

以下实例将查找所有以 F 开头的 name 字段，并将匹配到所有记录的 alexa 字段修改为 123：

```java
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "name": {
      "$regex": "^F" } }
newvalues = {
      "$set": {
      "alexa": "123" } }
x = mycol.update_many(myquery, newvalues)
print(x.modified_count, "文档已修改")
```

输出结果为：

> 1文档已修改

查看数据是否已修改：

> {‘name’: ‘Google’, ‘alexa’: ‘12345’, ‘url’: ‘https://www.google.com’}
>
> { ‘name’: ‘Taobao’, ‘alexa’: ‘100’, ‘url’: ‘https://www.taobao.com’}
>
> { ‘name’: ‘QQ’, ‘alexa’: ‘101’, ‘url’: ‘https://www.qq.com’}
>
> { ‘name’: ‘Facebook’, ‘alexa’: ‘123’, ‘url’: ‘https://www.facebook.com’}
>
> {‘name’: ‘知乎’, ‘alexa’: ‘103’, ‘url’: ‘https://www.zhihu.com’}
>
> { ‘name’: ‘Github’, ‘alexa’: ‘109’, ‘url’: ‘https://www.github.com’}

### 排序

sort() 方法可以指定升序或降序排序。

sort() 方法第一个参数为要排序的字段，第二个字段指定排序规则，1 为升序，-1 为降序，默认为升序。

本文使用的测试数据如下

对字段alexa 按升序排序：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
mydoc = mycol.find().sort("alexa")
for x in mydoc:
  print(x)
```

输出结果为：

对字段alexa 按降序排序：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
mydoc = mycol.find().sort("alexa", -1)
for x in mydoc:
  print(x)
```

输出结果为：

### Mongodb 删除数据

我们可以使用 delete_one() 方法来删除一个文档，该方法第一个参数为查询对象，指定要删除哪些数据。

本文使用的测试数据如下

以下实例删除 name 字段值为 “Taobao” 的文档：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "name": "Taobao" }
mycol.delete_one(myquery)
# 删除后输出
for x in mycol.find():
  print(x)
```

输出结果为：

#### 删除多个文档

我们可以使用 delete_many() 方法来删除多个文档，该方法第一个参数为查询对象，指定要删除哪些数据。

删除所有 name 字段中以 F 开头的文档:

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
myquery = {
      "name": {
     "$regex": "^F"} }
x = mycol.delete_many(myquery)
print(x.deleted_count, "个文档已删除")
```

输出结果为：

> 1个文档已删除

#### 删除集合中的所有文档

delete_many() 方法如果传入的是一个空的查询对象，则会删除集合中的所有文档：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
x = mycol.delete_many({
     })
print(x.deleted_count, "个文档已删除")
```

输出结果为：

> 4个文档已删除

#### 删除集合

我们可以使用 drop() 方法来删除一个集合。

以下实例删除了 customers 集合：

```java
#!/usr/bin/python3
import pymongo
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dyfdb"]
mycol = mydb["sites"]
mycol.drop()
```

如果删除成功 drop() 返回 true，如果删除失败(集合不存在)则返回 false。

我们使用以下命令在终端查看集合是否已删除：

```java
> use dyfdb
switched to db dyfdb
> show tables;
```
