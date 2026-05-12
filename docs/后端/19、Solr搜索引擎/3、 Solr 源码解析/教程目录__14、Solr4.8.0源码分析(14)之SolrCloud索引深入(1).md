# 14、Solr4.8.0源码分析(14)之SolrCloud索引深入(1)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/14.html
- 分类：搜索引擎
- 分组：教程目录
本节开始将通过阅读源码来深入学习下SolrCloud的索引过程。

## 1. SolrCloud的索引过程流程图

这里借用下《[solrCloud Update Request Handling 更新索引流程](http://blog.csdn.net/duck_genuine/article/details/17021149)》流程图：

由上图可以看出，SolrCloud的索引过程主要通过一个索引链过程来实现的，那么本节主要讲述下索引链以及DistributedUpdateProcessor这个过程。

## 2. SolrCloud update索引链

- SolrCloud的Update索引链的类是UpdateRequestProcessorChain，这个类在Solr初始化的时候就会进行定义。
- SolrCloud的Update索引链的组成可以通过solrconfig.xml进行自定义，比较灵活，例如：

```xml
<updateRequestProcessorChain name="key" default="true">
  <processor class="package.Class1" />
  <processor class="package.Class2" >
    <str name="someInitParam1">value</str>
    <int name="someInitParam2">42</int>
  </processor>
  <processor class="solr.LogUpdateProcessorFactory" >
    <int name="maxNumToLog">100</int>
  </processor>
  <processor class="solr.RunUpdateProcessorFactory" />
</updateRequestProcessorChain>
```

- 如果未自定义UpdateRequestProcessorChain，那么Solr就默认以下三个过程组成索引链，依次如下：
- LogUpdateProcessorFactory， 它对应的处理过程为LogUpdateProcessor , 主要负责日志的记录；
- DistributedUpdateProcessorFactory, 它对应的处理过程为DistributedUpdateProcessor ，主要负责对version的处理以及request的分发；
- RunUpdateProcessorFactory, 它对应的处理过程为DirectUpdateHandler2 ，主要负责将记录add进本shard的lucene中；
- 如果最后一个索引链包含了RunUpdateProcessorFactory，但是没有包含DistributedUpdateProcessorFactory，那么Solr会在索引链init的时候自动在RunUpdateProcessorFactory前面加入DistributedUpdateProcessorFactory；
- 每一次update操作，都会重新创建一个索引链，即createProcessor，然后依次进行下去；
- update操作包含add，delete，commit，所以上述UpdateProcessor都会分别包含processAdd，processDelete，processCommit，依次可以细分成add 索引链，delete索引链，commit索引链。

明白了以上几点，那么开始学习索引链的源码

- 首先来查看索引链的init代码，UpdateRequestProcessorChain.init()在初始化SolrCore的时候就调用了

```java
public void init(PluginInfo info) {
   final String infomsg = "updateRequestProcessorChain \"" + 
     (null != info.name ? info.name : "") + "\"" + 
     (info.isDefault() ? " (default)" : "");
   log.info("creating " + infomsg);
   // wrap in an ArrayList so we know we know we can do fast index lookups 
   // and that add(int,Object) is supported
   //从solrcore获取索引链的成员，存放成列表形式。索引链在Solrconfig.xml中是以插件的形式加入的
   List<UpdateRequestProcessorFactory> list = new ArrayList
     (solrCore.initPlugins(info.getChildren("processor"),UpdateRequestProcessorFactory.class,null));
   if(list.isEmpty()){
     throw new SolrException(SolrException.ErrorCode.SERVER_ERROR,
                             infomsg + " require at least one processor");
   }
   int numDistrib = 0;
   int runIndex = -1;
   // hi->lo incase multiple run instances, add before first one
   // (no idea why someone might use multiple run instances, but just in case)
   //从后往前遍历索引链列表，寻找DistributingUpdateProcessorFactory和RunUpdateProcessorFactory
   for (int i = list.size()-1; 0 <= i; i--) {
     UpdateRequestProcessorFactory factory = list.get(i);
     if (factory instanceof DistributingUpdateProcessorFactory) {
       numDistrib++; //DistributingUpdateProcessorFactory的个数不能超过1
     }
     if (factory instanceof RunUpdateProcessorFactory) {
       runIndex = i; //RunUpdateProcessorFactory的编号
     }
   }
   if (1 < numDistrib) {
     throw new SolrException(SolrException.ErrorCode.SERVER_ERROR,
                             infomsg + " may not contain more then one " +
                             "instance of DistributingUpdateProcessorFactory");
   }
   //如果存在RunUpdateProcessorFactory且没有DistributingUpdateProcessorFactory，
   //那么会在RunUpdateProcessorFactory之前加入DistributingUpdateProcessorFactory
   if (0 <= runIndex && 0 == numDistrib) {
     // by default, add distrib processor immediately before run
     DistributedUpdateProcessorFactory distrib 
       = new DistributedUpdateProcessorFactory();
     distrib.init(new NamedList());
     list.add(runIndex, distrib);
     log.info("inserting DistributedUpdateProcessorFactory into " + infomsg);
   }
   chain = list.toArray(new UpdateRequestProcessorFactory[list.size()]); 
 }
```

- 每当有update请求时候就会触发索引链的创建，UpdateRequestProcessorChain**.**createProcessor。

```java
public UpdateRequestProcessor createProcessor(SolrQueryRequest req, 
                                                SolrQueryResponse rsp) 
  {
    UpdateRequestProcessor processor = null;
    UpdateRequestProcessor last = null;
    //获取distribPhase 是否需要跳过DistributingUpdateProcessorFactory前面那一过程（即LogUpdateProcessor），该参数不是由客户端生成
    final String distribPhase = req.getParams().get(DistributingUpdateProcessorFactory.DISTRIB_UPDATE_PARAM);
    final boolean skipToDistrib = distribPhase != null;
    boolean afterDistrib = true;  // we iterate backwards, so true to start
    //从后往前组件索引链即
    //LogUpdateProcessor.next = DistributedUpdateProcessor
    //DistributedUpdateProcessor.next = DirectUpdateHandler2
    //DirectUpdateHandler2.next = null
    for (int i = chain.length-1; i>=0; i--) {
      UpdateRequestProcessorFactory factory = chain[i];
      if (skipToDistrib) {
        if (afterDistrib) {
          // 跳过DistributingUpdateProcessorFactory前面的索引链过程
          if (factory instanceof DistributingUpdateProcessorFactory) {
            afterDistrib = false;
          }
        } else if (!(factory instanceof UpdateRequestProcessorFactory.RunAlways)) {
          // skip anything that doesn't have the marker interface
          continue;
        }
      }
      //创建UpdateRequestProcessorFactory对应的UpdateProcessor，并进行连接
      processor = factory.getInstance(req, rsp, last);
      last = processor == null ? last : processor;
    }
    return last;
  }
```

- 在UpdateRequestProcessorChain.createProcessor会调用UpdateRequestProcessorFactory的getInstance创建对应的updateProcessor，
- LogUpdateProcessor

```java
public UpdateRequestProcessor getInstance(SolrQueryRequest req, SolrQueryResponse rsp, UpdateRequestProcessor next) {
  return LogUpdateProcessor.log.isInfoEnabled() ? new LogUpdateProcessor(req, rsp, this, next) : null;
}
```

- DistributedUpdateProcessor

```java
public DistributedUpdateProcessor getInstance(SolrQueryRequest req,
    SolrQueryResponse rsp, UpdateRequestProcessor next) {
  return new DistributedUpdateProcessor(req, rsp, next);
}
```

- RunUpdateProcessorFactory

```java
public UpdateRequestProcessor getInstance(SolrQueryRequest req, SolrQueryResponse rsp, UpdateRequestProcessor next) 
{
  return new RunUpdateProcessor(req, next);
}
```

总结：本节主要学习了SolrCloud分布式索引的整体流程，以及SolrCloud建索引时候索引链的情况，下一节将详细介绍索引链的具体过程。
