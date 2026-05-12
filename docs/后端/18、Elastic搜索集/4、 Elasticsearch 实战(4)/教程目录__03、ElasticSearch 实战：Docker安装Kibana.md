# 03、ElasticSearch 实战：Docker安装Kibana
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/3.html
- 分类：搜索引擎
- 分组：教程目录
> 接第二节内容

#### 2, Kibana

安装可视化界面

```java
docker run --name kibana -e ELASTICSEARCH_HOSTS=http://192.168.56.10:9200 -p 5601:5601 \
-d kibana:7.4.2
```

> 注意，一定要将192.168.56.10修改为自己的虚拟机地址

安装完成后在浏览器地址栏访问`http://192.168.56.10:5601/`，可以看到 kibana 已经启动成功：

选择yes或no都可以：

使用我们自己的数据：

安装成功的界面：

> 注意:如果访问http://192.168.56.10:5601/时出现下面的提示，可以稍等一会，可能是 kibana 还没有启动成功
>
>
>
> 也可以使用docker logs kibana来查看一下 kibana 的启动日志，下面的日志表示 kibana 启动正常：
