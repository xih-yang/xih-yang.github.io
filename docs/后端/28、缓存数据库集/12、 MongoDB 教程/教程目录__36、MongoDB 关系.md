# 36、MongoDB 关系
- 来源：https://ddkk.com/zhuanlan/db/mongodb/36.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 文档间可以通过嵌入和引用来建立联系

#### MongoDB 中的关系可以是

**1、** 1:1(1对1)；

**2、** 1:N(1对多)；

**3、** N:1(多对1)；

**4、** N:N(多对多)；

我们使用购物时 **用户 ( users )** 和 **收货地址 ( address )** 之间的关系来理解

```sh
一个用户可以有多个收货地址，所以是一对多的关系
```

下面是**users** 文档的结构

```sh
{
   "_id" : ObjectId("59ee8457a0f7c7d445f864aa"),
   "name" : "penglei",
   "tel" : "13866668888",
   "birthday" : "11-11"
}
```

下面是**address** 文档的结构

```sh
{
   "_id" : ObjectId("59ee861ba0f7c7d445f864ac"),
   "pincode" : 100007,
   "user" : "penglei",
   "city" : "Pek",
   "state" : "China",
   "building" : "东城区东四君临天下大酒店 220220"
}
{
   "_id" : ObjectId("59ee862aa0f7c7d445f864ad"),
   "pincode" : 100007,
   "city" : "Pek",
   "user" : "penglei",
   "state" : "China",
   "building" : "东城区雍和家园 1 号楼 4 单元 2303"
}
```

## 嵌入式关系

使用嵌入式方法，我们可以把用户地址嵌入到用户的文档中：

#### souyunku.user_address

```sh
{
   "_id" : ObjectId("59ee8457a0f7c7d445f864aa"),
   "name" : "penglei",
   "tel" : "13866668888",
   "birthday" : "11-11",
   "address":[
      {
         "_id" : ObjectId("59ee861ba0f7c7d445f864ac"),
         "pincode" : 100007,
         "user" : "penglei",
         "city" : "Pek",
         "state" : "China",
         "building" : "东城区东四君临天下大酒店 220220"
      }
      {
         "_id" : ObjectId("59ee862aa0f7c7d445f864ad"),
         "pincode" : 100007,
         "city" : "Pek",
         "user" : "penglei",
         "state" : "China",
         "building" : "东城区雍和家园 1 号楼 4 单元 2303"
      }
   ]
}
```

以上数据保存在单一的文档中，可以比较容易的获取和维护数据

可以这样查询用户的地址：

```sh
> db.user_address.findOne({"name":"penglei"},{"address":1})
```

这种数据结构的缺点是，如果用户和用户地址在不断增加，数据量不断变大，会影响读写性能

## 引用式关系

引用式关系是设计数据库时经常用到的方法，这种方法把用户数据文档和用户地址数据文档分开，通过引用文档的 **id** 字段来建立关系

#### souyunku.users

```sh
{
   "_id" : ObjectId("59ee8457a0f7c7d445f864aa"),
   "name" : "penglei",
   "tel" : "13866668888",
   "birthday" : "11-11",
   "address":[
      ObjectId("59ee861ba0f7c7d445f864ac"),
      ObjectId("59ee862aa0f7c7d445f864ad"),
   ]
}
```

以上实例中，用户文档的 **address** 字段包含用户地址的对象id（ObjectId）数组

我们可以读取这些用户地址的对象id（ObjectId）来获取用户的详细地址信息

这种方法需要两次查询，第一次查询用户地址的对象id（ObjectId），第二次通过查询的id获取用户的详细地址信息

```sh
> var result = db.users.findOne({"name":"penglei"},{"address":1})
> var addresses = db.address.find({"_id":{"$in":result["address"]}})
```
