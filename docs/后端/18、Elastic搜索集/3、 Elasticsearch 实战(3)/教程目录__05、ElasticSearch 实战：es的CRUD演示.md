# 05、ElasticSearch 实战：es的CRUD演示
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/5.html
- 分类：搜索引擎
- 分组：教程目录
下面以一本书为1个document为例演示下es的CRUD

### 1、新增商品：新增document

```java
PUT /product/book/1
{
    "product_name" : "追风筝的人",
    "price" :  10,
    "tags": [ "忠诚", "赎罪" ]
}
```

第一次新增document时es会自动建立index和type，不需要提前创建，es默认会对document每个field都建立倒排索引，让其可以被全文检索。

### 2、查询商品：查询document

```java
GET /product/book/1
```

### 3、替换document

```java
PUT /product/book/1
{
    "product_name" : "三体",
    "price" :  30,
    "tags": [ "科幻", "末日" ]
}
```

### 4、修改document

```java
POST /product/book/1/_update
{
  "doc":{
    "price": 300 
  }
}
```

### 5、删除document

```java
DELETE /product/book/1
```
