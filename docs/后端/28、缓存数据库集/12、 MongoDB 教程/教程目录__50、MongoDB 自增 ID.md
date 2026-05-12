# 50、MongoDB 自增 ID
- 来源：https://ddkk.com/zhuanlan/db/mongodb/50.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 的 _id 是系统自动生成的 12 字节唯一标识

为了实现 ObjectId 自动增长功能，我们需要另外取巧的方法来实现

接下来我们将学习如何在 counters 集合中实现自增字段 _id

## 使用 counters 集合

假设我们有如下的 language 文档

我们希望 _id 字段是自增的，也就是从 1,2,3,4 到 n 的自动增长

```sh
{
  "_id":1,
  "name": "Python",
  "category": "server"
}
```

取巧的方法，就是创建 counters 集合，序列字段值可以实现自动长

```sh
> db.createCollection("counters")
```

然后向counters 集合中插入以下文档，使用 language_id 作为 key

```sh
{
  "_id":"language_id",
  "sequence_value": 0
}
```

sequence_value 字段是 language 中的 “_id” 通过自动增长后的一个值

最后，使用以下命令插入 counters 集合的序列文档中

```sh
>db.counters.insert({_id:"language_id",sequence_value:0})
```

准备工作到这里就完成了，接下来创建 JavaScript 函数

## 创建 Javascript 函数

我们创建一个函数 getNextSequenceValue 作为序列名的输入

实现指定的序列自动增长 1 并返回最新序列值

```sh
>function getNextSequenceValue( sequenceName ) {
   var sequenceDocument = db.counters.findAndModify(
      {
         query:{_id: sequenceName },
         update: {$inc:{sequence_value:1}},
         new:true
      });
   return sequenceDocument.sequence_value;
}
```

getNextSequenceValue 函数也很简单，就是自增 sequence_value 而已

## 使用 Javascript 函数

既然创建好了函数，是时候使用它了

我们可以像下面一样调用 getNextSequenceValue 函数创建一个新的文档

并设置文档 _id 自动为返回的序列值

```sh
>db.language.insert({
   "_id":getNextSequenceValue("language_id"),
   "name":"Kotlin",
   "category":"APP"})
>db.language.insert({
   "_id":getNextSequenceValue("language_id"),
   "name":"JavaScript",
   "category":"script"})
```

为了验证函数是否有效，我们可以使用以下命令读取文档

```sh
>db.language.find()
```

如果一切顺利，你就能看到如下的输出了 以上命令将返回以下结果，我们发现 _id 字段是自增长的：

```sh
> db.language.find()
{ "_id" : 1, "name" : "Kotlin", "category" : "APP" }
{ "_id" : 3, "name" : "JavaScript", "category" : "script" }
```
