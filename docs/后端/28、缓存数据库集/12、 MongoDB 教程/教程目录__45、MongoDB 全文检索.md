# 45、MongoDB 全文检索
- 来源：https://ddkk.com/zhuanlan/db/mongodb/45.html
- 分类：缓存数据库
- 分组：教程目录
这个过程类似于通过字典中的检索字表查字的过程。

MongoDB 从 2.4 版本开始支持全文检索

MongoDB 在 2.6 版本以后是默认开启全文检索的

### MongoDB 目前支持 15 种语言( 暂时不支持中文 )的全文索引

- danish
- dutch
- english
- finnish
- french
- german
- hungarian
- italian
- norwegian
- portuguese
- romanian
- russian
- spanish
- swedish
- turkish

## 启用全文检索

MongoDB 在 2.6 版本以后是默认开启全文检索的，如果你使用之前的版本，你需要使用以下代码来启用全文检索:

```sh
>db.adminCommand({setParameter:true,textSearchEnabled:true})
```

或者使用命令：

```sh
mongod --setParameter textSearchEnabled=true
```

## 创建全文索引

考虑以下 posts 集合的文档数据，包含了文章内容（post_text）及标签(tags)：

```sh
{
   "post_text": "enjoy the mongodb articles on Twle",
   "tags": [
      "mongodb",
      "souyunku"
   ]
}
```

我们可以对 post_text 字段建立全文索引，这样我们可以搜索文章内的内容：

```sh
>db.posts.ensureIndex({post_text:"text"})
```

## 使用全文索引

现在我们已经对 post_text 建立了全文索引，我们可以搜索文章中的关键词 souyunku：

```sh
>db.posts.find({$text:{$search:"souyunku"}})
```

以下命令返回了如下包含 souyunku 关键词的文档数据：

```sh
{ 
   "_id" : ObjectId("53493d14d852429c10000002"), 
   "post_text" : "enjoy the mongodb articles on Twle", 
   "tags" : [ "mongodb", "souyunku" ]
}
```

如果你使用的是旧版本的 MongoDB，你可以使用以下命令：

```sh
>db.posts.runCommand("text",{search:"souyunku"})
```

使用全文索引可以提高搜索效率。

## 删除全文索引

MongoDB **dropIndex** 方法可以用来删除已经建立的索引

### 语法

```sh
> db.COLLECTION_NAME.dropIndex( INDEX_NAME )
```

### 范例

先使用getIndexes() 方法列出所有的索引

```sh
> db.lession.getIndexes()
```

通过以上命令获取索引名，本例的索引名为post_text_text，执行以下命令来删除索引：

```sh
>db.posts.dropIndex("post_text_text")
```
