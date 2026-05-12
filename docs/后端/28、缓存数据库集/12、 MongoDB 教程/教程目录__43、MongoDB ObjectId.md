# 43、MongoDB ObjectId
- 来源：https://ddkk.com/zhuanlan/db/mongodb/43.html
- 分类：缓存数据库
- 分组：教程目录
其实在前面几个章节中我们已经使用了 MongoDB ObjectId

本章节，我们将学习 ObjectId 的结构

ObjectId 是一个 12 字节 BSON 类型数据，由以下几部分组成

**1、** 前4个字节表示时间戳；

**2、** 接下来的3个字节是机器标识码；

**3、** 紧接的两个字节由进程id组成（PID）；

**4、** 最后三个字节是随机数；

MongoDB中存储的文档必须有一个 **_id** 键 这个键的值可以是任何类型的，默认是 ObjectId 对象

在一个集合里面，每个文档都有唯一的 **_id** 值，来确保集合里面每个文档都能被唯一标识

MongoDB 采用 ObjectId，而不是其他比较常规的做法（比如自动增加的主键）的主要原因，因为在多个 服务器上同步自动增加主键值既费力还费时

## MongoDB 创建新的 ObjectId

下面的代码可以生成新的 ObjectId

```sh
> newid = ObjectId()
ObjectId("59ef2598a0f7c7d445f864b3")
```

可以使用生成的 id 来取代 MongoDB 自动生成的 ObjectId

## 创建文档的时间戳

由于ObjectId 中存储了 4 个字节的时间戳

所以我们不需要再为文档保存时间戳字段，因为可以通过 getTimestamp 函数来获取文档的创建时间

```sh
> ObjectId("59ef2598a0f7c7d445f864b3").getTimestamp()
ISODate("2017-10-24T11:35:52Z")
```

## ObjectId 转换为字符串

**str** 属性可以返回 ObjectId 的字符串格式

```sh
> ObjectId("59ef2598a0f7c7d445f864b3").str
59ef2598a0f7c7d445f864b3
```
