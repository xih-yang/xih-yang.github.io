# 06、ElasticSearch 实战：安装中文分词器插件smartcn
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/6.html
- 分类：搜索引擎
- 分组：教程目录
首先进入elasticsearch的bin目录

然后执行 # sh elasticsearch-plugin install analysis-smartcn

安装完成后，需要重启elasticsearch服务。

如果集群中有多台机器，则每台机器都需要安装
