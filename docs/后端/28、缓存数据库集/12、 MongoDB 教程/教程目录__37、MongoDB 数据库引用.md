# 37、MongoDB 数据库引用
- 来源：https://ddkk.com/zhuanlan/db/mongodb/37.html
- 分类：缓存数据库
- 分组：教程目录
### MongoDB 引用有两种

**1、** 手动引用(ManualReferences)；

**2、** DBRefs；

## DBRefs vs 手动引用

假如有这样一个场景，在不同的集合中 ( address_home, address_office, address_mailing, 等) 存储不同的地址 ( 住址，办公室地址，邮件地址等 )

这样，我们在调用不同地址时，也需要指定集合，一个文档从多个集合引用文档，我们应该使用 DBRefs

## DBRefs

MongoDB DBRef 格式

```sh
{ $ref : , $id : , $db :  }
```

三个字段表示的意义为：

- ** `$` ref ：** 集合名称
- ** `$` id ：** 引用的id
- ** `$` db :** 数据库名称，可选参数

下面的范例中用户数据文档使用了 DBRef, 字段 address

```sh
{
   "_id" : ObjectId("59ee8457a0f7c7d445f864aa"),
   "name" : "penglei",
   "tel" : "13866668888",
   "birthday" : "11-11"
   "address": {
      "$ref": "address_home",
      "$id": ObjectId("59ee861ba0f7c7d445f864ac"),
      "$db": "souyunku"
   }
}
```

**address** DBRef 字段指定了引用的地址文档是在 address_home 集合下的 souyunku 数据库，id 为 59ee861ba0f7c7d445f864ac

下面的代码通过指定 `$` ref 参数（address_home 集合）来查找集合中指定 id 的用户地址信息

```sh
> var user = db.users.findOne({"name":"penglei"})
> var dbRef = user.address
> db[dbRef.$ref].findOne({"_id":(dbRef.$id)})
```

运行以上命令，返回了 address_home 集合中的地址数据

```sh
{
   "_id" : ObjectId("59ee861ba0f7c7d445f864ac"),
   "pincode" : 100007,
   "user" : "penglei",
   "city" : "Pek",
   "state" : "China",
   "building" : "东城区东四君临天下大酒店 220220"
}
```
