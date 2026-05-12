# 48、MongoDB GridFS
- 来源：https://ddkk.com/zhuanlan/db/mongodb/48.html
- 分类：缓存数据库
- 分组：教程目录
GridFS 也是文件存储的一种方式，但是它是存储在 MonoDB 的集合中

GridFS 会将大文件对象分割成多个小的 chunk(文件片段),一般为 256k / 个,每个 chunk 将作为 MongoDB 的一个文档 (document) 被存储在 chunks 集合中

GridFS 用两个集合来存储一个文件：fs.files 与 fs.chunks

每个文件的实际内容被存在chunks(二进制数据)中,和文件有关的 meta 数据 (filename,content_type,还有用户自定义的属性)将会被存在files集合中

这是一个简单的 fs.files 集合文档

```sh
{
   "_id" : ObjectId("59ed5f4c2a2f951ba5353165"),
   "chunkSize" : 261120,
   "uploadDate" : ISODate("2017-10-23T03:17:32.209Z"),
   "length" : 4904740, 
   "md5" : "4da09a6750c7bbcc49f916d940fde4f2", 
   "filename" : "20171023.mp3" 
}
```

这是一个简单的 fs.chunks 集合文档

```sh
{
   "files_id": ObjectId("534a75d19f54bfec8a2fe44b"),
   "n": NumberInt(0),
   "data": "Mongo Binary Data"
}
```

## GridFS 添加文件

GridFS 的 put 命令可以用来添加文件

先调用MongoDB 安装目录下 bin 的 mongofiles.exe 工具

> 打开命令提示符，进入到 MongoDB 的安装目录的 bin目录中，找到 mongofiles.exe

#### Windows

```sh
> mongofiles.exe -d gridfs put <filename>
```

### Linux

```sh
$ mongofiles -d gridfs put <filename>
```

下面的范例把当前目录下的 20171023.mp3 添加到 gridfs 集合中

```sh
$ mongofiles -d gridfs put 20171023.mp3
2017-10-23T11:17:32.026+0800  connected to: localhost
added file: 20171023.mp3
```

**gridfs** 是存储文件的数据名称，如果不存在该数据库，MongoDB会自动创建

20171023.mp3 是音频文件名

### 查询 GridFS 中的文档

可以使用以下命令来查看数据库中文件的文档

```sh
> use gridfs
> db.fs.files.find()
```

以上命令执行后返回以下文档数据

```sh
{
   "_id" : ObjectId("59ed5f4c2a2f951ba5353165"),
   "chunkSize" : 261120,
   "uploadDate" : ISODate("2017-10-23T03:17:32.209Z"),
   "length" : 4904740, 
   "md5" : "4da09a6750c7bbcc49f916d940fde4f2", 
   "filename" : "20171023.mp3" 
}
```

通过使用 fs.files 中的 _id 值，我们可以查询 fs.chunks 中的区块数据

```sh
> db.fs.chunks.find({files_id:ObjectId('59ed5f4c2a2f951ba5353165')})
```

```sh
> db.fs.chunks.find( {files_id:ObjectId('59ed5f4c2a2f951ba5353165')} ).count()
19
```

这个命令，查询返回了 19 个文档的数据，意味着 mp3 文件被存储在 19 个区块中
