# 18、ElasticSearch 实战：search的multi-index&amp;multi-type搜索模式
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/18.html
- 分类：搜索引擎
- 分组：教程目录
所谓multi-index和multi-type搜索模式就是我们可以一次性搜索多个index和多个type下的数据

(1)/_search：所有索引，所有type下的所有数据都搜索出来

(2)/index1/_search：指定一个index，搜索其下所有type的数据

(3)/index1,index2/_search：同时搜索两个index下的数据

(4)/*1,*2/_search：按照通配符去匹配多个索引

(5)/index1/type1/_search：搜索一个index下指定的type的数据

(6)/index1/type1,type2/_search：可以搜索一个index下多个type的数据

(7)/index1,index2/type1,type2/_search：搜索多个index下的多个type的数据

(8)/_all/type1,type2/_search：_all，可以代表搜索所有index下的指定type的数据
