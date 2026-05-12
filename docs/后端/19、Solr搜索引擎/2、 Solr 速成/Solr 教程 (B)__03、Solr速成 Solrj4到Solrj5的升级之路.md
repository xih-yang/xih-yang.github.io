# 03、Solr速成 Solrj4到Solrj5的升级之路
- 来源：https://ddkk.com/zhuanlan/search/solr/3/16.html
- 分类：搜索引擎
- 分组：Solr 教程 (B)
Solr5发布了，带来了许多激动人心的新特性，但Solrj的许多接口也发生了变化，升级是痛苦的，但也是必须的，下面就赶紧来看看有哪些代码需要升级吧。

**变化1：SolrServer变成了SolrClient**

应该说这个变化是合理的，毕竟Solrj就是一个客户端，命名为Server本身就有问题。这样一来，所有SolrServer系列的类都需要更改为SolrClient系列的类，好在方法基本继承过来了，只需要修改一下类名就可以了。

```java
SolrServer -> SolrClient
HttpSolrServer -> HttpSolrClient
CloudSolrServer -> CloudSolrClient
```

**变化2：提交请求的方式变了**

在Solrj4中，向服务器提交请求的方式比较简单，首先扩展SolrRequest类，将需要组合的参数都以方法的形式暴露出来，并重写process方法进行参数组合，如下所示。

```java
class MySolrRequest extends SolrRequest {
    ......
    @Override
    public SolrResponse process(SolrServer server)
                    throws SolrServerException, IOException {
        long startTime = System.currentTimeMillis();
        CoreAdminResponse res = new CoreAdminResponse();
        res.setResponse( server.request( this ) );
        res.setElapsedTime( System.currentTimeMillis()-startTime );
        return res;
    }
}
SolrRequest req = new MySolrRequest();
SolrResponse res = req.process(solrServer);
if (res.getResponse().findRecursive("error", "failure") != null)
    return false;
return true;
```

在Solrj5中，SolrRequest被极大地增强了，定义了许多新的子类出来，用户基本上不需要自定义新的Request类了，但学习成本相应的也变高了，有得必有失啊！

以在Cloud中创建Collection为例，新的Request为CollectionAdminRequest.Create类，用户只需要创建这个类的实例就可以设置所有的相关参数。提交仍然是process方法，只不过这个方法已经不需要我们重载了，直接调用就可以了，而且还扩展了返回的SolrResponse类，例如这里返回的就是CollectionAdminResponse类，代码如下。

```java
CollectionAdminRequest.Create req = new CollectionAdminRequest.Create();
try {
    req.setCollectionName(coreName);
    req.setConfigName(confName);
    req.setReplicationFactor(factor);
    req.setNumShards(shards);
    req.setMaxShardsPerNode(maxShardsPerNode);
    CollectionAdminResponse res = req.process(cloudSolrClient);
    if (res.getResponse().findRecursive("error", "failure") != null)
        return false;
    return true;
} catch (SolrServerException e) {
    e.printStackTrace();
} catch (IOException e) {
    e.printStackTrace();
}  
```

新版的process方法比老版的多抛出一个IOException异常，需要增加对该异常的处理。

**变化三：对Zookeeper的支持增强了**

在Solrj4中，对Zookeeper的支持还比较简单，主要就是通过`org.apache.solr.cloud.ZkController`类来完成对Zookeeper中内容的管理。

到了Solrj5，对ZkController类的方法进行了分隔，新增加了不少类，而且干脆就抛弃了对ZkController类的支持，因此给代码升级带来不少麻烦。

例如对于对在Zookeeper中配置文件的管理，老版代码为

```java
ZkController.uploadConfigDir(zkClient, new File(confDir), confName);
ZkController.downloadConfigDir(zkClient, confName, new File(confDir));
```

新版增加了ZkConfigManager类进行专门管理，相应的方法也由静态方法变成了动态方法，尤其是参数从File类型变成了JDK7中新引入的Path类型。

```java
ZkConfigManager confManager = new ZkConfigManager(zkClient);
confManager.uploadConfigDir(Paths.get(confDir), confName);
confManager.downloadConfigDir(confName, Paths.get(confDir));
```
