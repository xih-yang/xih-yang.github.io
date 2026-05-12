# 17、ElasticSearch 实战：使用elasticdump导出导入数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/17.html
- 分类：搜索引擎
- 分组：教程目录
在docker环境中部署了ES集群后，需要将原ES中的数据导入到新的ES集群中。遂对elasticdump工具进行了简单的研究。

此处仅对本人用过的方法进行记录，更多内容请参考：

[https://www.npmjs.com/package/elasticdump](https://www.npmjs.com/package/elasticdump)

## 前言：

elaticdump 依赖于nodejs的环境，需要下载nodejs的相关依赖环境。

## 一、安装

```java
npm install elasticdump -g
```

检测安装是否成功：

```java
elasticdump --version
```

控制台打印出版本信息，即为安装成功。

## 二、常用方法

## 2.1、将索引中的数据导出到本地

```java
elasticdump --input=http://172.20.88.72:9200/knowledgebase --output=E:\query.json --type=data
```

## 2.2、将本地数据导入到索引中

```java
elasticdump --input=E:\query.json --output=http://172.20.88.72:9200/knowledgebase --type=data
```

## 2.3、将ES中的数据导入到另一个ES中

```java
elasticdump --input=http://172.20.88.72:9200/knowledgebase --output=http://192.168.56.32:9200/knowledgebase  --type=data
```
