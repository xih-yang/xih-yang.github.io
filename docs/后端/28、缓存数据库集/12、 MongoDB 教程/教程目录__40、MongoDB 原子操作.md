# 40、MongoDB 原子操作
- 来源：https://ddkk.com/zhuanlan/db/mongodb/40.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 数据库不支持事务，所以，在我们的项目中，无论什么设计，都不能要求 MongoDB 保证数据的完整性

但MongoDB 提供了许多原子操作，比如文档的保存，修改，删除等，都是原子操作

原子操作就是

```sh
要么文档保存到 MongoDB，要么没有保存到 MongoDB，不会出现查询到的文档没有保存完整的情况
```

## 原子操作方法

MongoDB **findAndy..** 方法提供了原子操作机制

MongoDB 支持原子操作方法如下

**1、** db.collection.findAndModify()；

**2、** db.collection.findOneAndDelete()；

**3、** db.collection.findOneAndReplace()；

**4、** db.collection.findOneAndUpdate()；

## 原子操作数据模型

假设我们遇到了下面这种需求：书店的书籍及结账信息

这个范例说明了在一个相同的文档中如何确保嵌入字段关联原子操作（update：更新）的字段是同步的

#### souyunku.bookstore

```sh
book = {
          id: 88888888
          title: "MongoDB: 最终指南",
          author: [ "Kristina Chodorow", "Mike Dirolf" ],
          published_date: ISODate("2010-09-24"),
          pages: 216,
          language: "English",
          publisher_id: "oreilly",
          available: 3,
          checkout: [ { by: "penglei", date: ISODate("2017-10-15") } ]
        }
```

我们可以使用 **db.collection.findAndModify()** 方法来判断书籍是否可结算并更新新的结算信息

需要同一个文档中嵌入的 available 和 checkout 字段来确保这些字段是同步更新的

```sh
> db.bookstore.findAndModify ( {
   query: {
            _id: 88888888,
            available: { $gt: 0 }
          },
   update: {
             $inc: { available: -1 },
             $push: { checkout: { by: "penglei", date: new Date() } }
           }
} )
```

## 原子操作常用命令

#### $ set

用来指定一个键并更新键值，若键不存在并创建。

```sh
{ $set : { field : value } }
```

#### $ unset

用来删除一个键。

```sh
{ $unset : { field : 1} }
```

#### $ inc

`$` inc可以对文档的某个值为数字型（只能为满足要求的数字）的键进行增减的操作。

```sh
{ $inc : { field : value } }
```

#### $ push

用法：

```sh
{ $push : { field : value } }
```

把value追加到field里面去，field一定要是数组类型才行，如果field不存在，会新增一个数组类型加进去。

#### $ pushAll

同 `$` push,只是一次可以追加多个值到一个数组字段内。

```sh
{ $pushAll : { field : value_array } }
```

#### $ pull

从数组field内删除一个等于value值。

```sh
{ $pull : { field : _value } }
```

#### $ addToSet

增加一个值到数组内，而且只有当这个值不在数组内才增加。

#### $ pop

删除数组的第一个或最后一个元素

```sh
{ $pop : { field : 1 } }
```

#### $ rename

修改字段名称

```sh
{ $rename : { old_field_name : new_field_name } }
```

#### $ bit

位操作，integer类型

```sh
{$bit : { field : {and : 5}}}
```

#### 偏移操作符

```sh
> db.votes.find() { "_id" : ObjectId("4b97e62bf1d8c7152c9ccb74"), "title" : "ABC", "comments" : [ { "by" : "penglei", "votes" : 3 }, { "by" : "jane", "votes" : 7 } ] }
> db.votes.update( {'comments.by':'penglei'}, {$inc:{'comments.$.votes':1}}, false, true )
>  db.votes.find() { "_id" : ObjectId("4b97e62bf1d8c7152c9ccb74"), "title" : "ABC", "comments" : [ { "by" : "penglei", "votes" : 4 }, { "by" : "jane", "votes" : 7 } ] }
```
