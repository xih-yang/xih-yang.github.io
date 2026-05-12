# 10、ElasticSearch 实战： ES 准备数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/10.html
- 分类：搜索引擎
- 分组：教程目录
上一章节我们体验了下结巴分词器，对中文的分词效果真的好好啊，是不是跃跃欲试，想要赶紧怎么把自己的数据添加到 Elasticsearch

别急别急，在添加数据之前我们必须先要对自己的数据进行格式化

本章节我们就来讨论如何格式化数据

对于DDKK.COM 弟弟快看，程序员编程资料站 的搜索功能，我初步的计划是把用户信息放到 Elasticsearch 上，于是我对此做了一些简单的分析

## 索引

网站的用户分为两大类，版主以上级别的用户和普通注册的用户

根据前面所学，我们知道 Elasticsearch 也有数据库、表结构和行数据的概念，分别是索引、映射和文档

所以我们首先需要创建两个索引 user_admin 和 user，分别用于索引版主和普通用户

而且它们有功能的类型 type，都是 user

## 字段

因为具有相同的类型，所以我们的版主和普通用户的信息几乎是一模一样的，都包括以下字段

字段
类型
说明

id
int
ID

nickname
string
昵称

description
string
用户简介

street
string
当前居住街道

city
string
当前所在城市

state
string
当前所在省

zip
int
邮政编码

location
array
地理位置，两个元素数组，第一个表示经度，第二个表示纬度

money
int
当前站币

tags
array
标签

vitality
float
活跃度，满分为 10 分

## 数据

我们需要把数据库中用户相关的所有数据读出来，然后筛选出上面的字段，拼接成多个 JSON 对象

**1、** 版主(user_admin)；

```java
    [
     {
        "id":1,
        "nickname":"站长",
        "description":"创业是的天赋是天生的，而我偏偏是后生的", "street":"东四十条",
        "city":"Beijing",
        "state":"Beijing",
        "zip":"100007",
        "location":[116.432727,39.937732],
        "money":5201314,
        "tags":["PHP", "Python"],
        "vitality":"9.0"
     },
     {
        "id":2,
        "nickname":"雅少",
        "description":"虚怀若谷",
        "street":"四川大学",
        "city":"Chengdu",
        "state":"Sichuan",
        "zip":"610044",
        "location":[104.094537,30.640174],
        "money":68023,
        "tags":["Python", "HTML"],
        "vitality":"7.8"
     },
     {
        "id":3,
        "nickname":"歌者",
        "description":"程序设计也是设计，研发新菜也是研发",
        "street":"五道口",
        "city":"Beijing",
        "state":"Beijing",
        "zip":"100083",
        "location":[116.346346,39.999333],
        "money":71128,
        "tags":["Java", "Scala"],
        "vitality":"6.9"
     }
    ]
```

**2、** 普通用户；

```java
    [
     {
        "id":1,
        "nickname":"question", 
        "description":"问题少年也是少年",
        "street":"张江高科技园区",
        "city":"Shanghai",
        "state":"Shanghai",
        "zip":"201204",
        "location":[121.60632,31.199305],
        "money":13648,
        "tags":["VUE", "HTML"],
        "vitality":"8.8"
     },
     {
        "id":2,
        "nickname":"枫晚",
        "description":"停车坐爰枫林晚",
        "street":"苏州大学",
        "city":"Suzhou",
        "state":"Jiangsu",
        "zip":"215006",
        "location":[120.65426,31.30797],
        "money":10235,
        "tags":["Java", "Android"],
        "vitality":"3.5"
     }
    ]
```
