# 09、Solr：菜单项目 query 查询使用办法
- 来源：https://ddkk.com/zhuanlan/search/solr/2/23.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
## 1.查询全部

只要在 q 参数中写入*:*既是搜索全部数据。

## 2.条件查询

在 q 参数部分写入 字段名:搜索条件值， 既是条件搜索

## 3.分页查询

在条件 start,rows 中输入从第几条数据开始查询，查询多少条数据。下标从 0 开始。类似 MySQL 数据库中的 limit。

## 4.查询排序

在 sort 条件中输入 字段名 排序规则。 排序规则包括 asc 和 desc

## 5.高亮查询

选中 hl 高亮复选框，在 hl.fl 中输入高亮显示的字段名称，在 hl.simple.pre 中输入高亮前缀，在 hl.simple.post 中输入高亮后缀。
