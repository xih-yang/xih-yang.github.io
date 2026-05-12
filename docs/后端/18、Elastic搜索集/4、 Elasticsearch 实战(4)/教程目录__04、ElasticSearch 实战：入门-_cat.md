# 04、ElasticSearch 实战：入门-_cat
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/4.html
- 分类：搜索引擎
- 分组：教程目录
## 三、初步检索

对ES 的所有请求都被封装成了 REST API，因此我们可以使用 postman 来访问它。

> 使用 postman 或者在浏览器地址栏输入请求路径http://192.168.56.10:9200/_cat/xxx

### 1、_cat

- GET /_cat/nodes:查看所有节点

- GET /_cat/health:查看es健康状况

- GET /_cat/master:查看主节点

- GET /_cat/indices:查看所有索引 ；相当于 MySQL 的 show databases;
