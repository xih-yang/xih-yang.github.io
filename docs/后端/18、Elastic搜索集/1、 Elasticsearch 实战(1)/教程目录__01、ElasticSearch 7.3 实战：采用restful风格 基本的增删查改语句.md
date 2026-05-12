# 01、ElasticSearch 7.3 实战：采用restful风格 基本的增删查改语句
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/1.html
- 分类：搜索引擎
- 分组：教程目录
### 1 、新建图书索引

首先建立图书索引 book

语法：put /index

```java
PUT /book
```

结果

### 2、新增图书 :新增文档

语法：PUT /index/type/id

```java
PUT /book/_doc/1
{
"name": "Bootstrap开发",
"description": "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
"studymodel": "201002",
"price":38.6,
"timestamp":"2019-08-25 19:11:35",
"pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
"tags": [ "bootstrap", "dev"]
}
PUT /book/_doc/2
{
"name": "java编程思想",
"description": "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
"studymodel": "201001",
"price":68.6,
"timestamp":"2019-08-25 19:11:35",
"pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
"tags": [ "java", "dev"]
}
PUT /book/_doc/3
{
"name": "spring开发基础",
"description": "spring 在java领域非常流行，java程序员都在用。",
"studymodel": "201001",
"price":88.6,
"timestamp":"2019-08-24 19:11:35",
"pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
"tags": [ "spring", "java"]
}
```

结果

### 3、查询图书：检索文档

语法：GET /index/type/id

查看图书:

```java
GET /book/_doc/1
```

就可看到json形式的文档。方便程序解析。

为方便查看索引中的数据，kibana可以如下操作

Kibana-discover- Create index pattern- Index pattern填book

下一步，再点击discover就可看到数据。点击json还可以看到原始数据

### 4、修改图书：替换操作

```java
PUT /book/_doc/1
{
    "name": "Bootstrap开发教程1",
    "description": "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
    "studymodel": "201002",
    "price":38.6,
    "timestamp":"2019-08-25 19:11:35",
    "pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
    "tags": [ "bootstrap", "开发"]
}
```

替换操作是整体覆盖，要带上所有信息。

### 5、 修改图书：更新文档

语法：POST /{index}/type /{id}/_update

或者POST /{index}/_update/{id}

```java
POST /book/_update/1/ 
{
  "doc": {
   "name": " Bootstrap开发教程高级"
  }
}
```

返回：

```java

```

### 6、删除图书：删除文档

语法：

```java
DELETE /book/_doc/1
```

返回：
