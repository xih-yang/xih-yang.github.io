# 17、Solr4.8.0源码分析(17)之SolrCloud索引深入(4)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/17.html
- 分类：搜索引擎
- 分组：教程目录
前面几节以add为例已经介绍了solrcloud索引链建索引的三步过程，delete以及deletebyquery跟add过程大同小异，这里暂时就不介绍了。由于commit流程较为特殊，那么本节主要简要介绍下commit的流程。

## 1. SolrCloud的commit流程

SolrCloud的commit流程同样分为三步，本节主要简单介绍下三步过程。

## 1.1 LogUpdateProcessor

LogUpdateProcessor的commit比较简单，主要包含两个步骤，调用DistributedUpdateProcessor的commit以及将commit信息写入日志。

```java
public void processCommit( CommitUpdateCommand cmd ) throws IOException {
  if (logDebug) { log.debug("PRE_UPDATE " + cmd.toString() + " " + req); }
  if (next != null) next.processCommit(cmd);
  final String msg = cmd.optimize ? "optimize" : "commit";
  toLog.add(msg, "");
}
```

## 1.2 DistributedUpdateProcessor

DistributedUpdateProcessor的commit过程较前者稍微复杂点，主要有一个判断，如果本节点满足以下几点之一，不是集群，只有一个node且是leader，是被转发过来的，就会进行dolocalcommit，否则的就会进行commit请求的转发。其中dolocalcommit会调用DirectUpdateHandler2的commit。

```java
@Override
public void processCommit(CommitUpdateCommand cmd) throws IOException {
updateCommand = cmd;
List<Node> nodes = null;
boolean singleLeader = false;
if (zkEnabled) {
zkCheck();
nodes = getCollectionUrls(req, req.getCore().getCoreDescriptor()
    .getCloudDescriptor().getCollectionName());
if (isLeader && nodes.size() == 1) {
  singleLeader = true;
}
}
if (!zkEnabled || req.getParams().getBool(COMMIT_END_POINT, false) || singleLeader) {
doLocalCommit(cmd);
} else if (zkEnabled) {
ModifiableSolrParams params = new ModifiableSolrParams(filterParams(req.getParams()));
if (!req.getParams().getBool(COMMIT_END_POINT, false)) {
  params.set(COMMIT_END_POINT, true);
  params.set(DISTRIB_UPDATE_PARAM, DistribPhase.FROMLEADER.toString());
  params.set(DISTRIB_FROM, ZkCoreNodeProps.getCoreUrl(
      zkController.getBaseUrl(), req.getCore().getName()));
  if (nodes != null) {
    cmdDistrib.distribCommit(cmd, nodes, params);
    finish();
  }
}
}
}
```

```java
private void doLocalCommit(CommitUpdateCommand cmd) throws IOException {
  if (vinfo != null) {
    vinfo.lockForUpdate();
  }
  try {
    if (ulog == null || ulog.getState() == UpdateLog.State.ACTIVE || (cmd.getFlags() & UpdateCommand.REPLAY) != 0) {
      super.processCommit(cmd);
    } else {
      log.info("Ignoring commit while not ACTIVE - state: " + ulog.getState() + " replay:" + (cmd.getFlags() & UpdateCommand.REPLAY));
    }
  } finally {
    if (vinfo != null) {
      vinfo.unlockForUpdate();
    }
  }
}
```

## 1.3 DirectUpdateHandler2

现在才是commit最关键的流程，DirectUpdateHandler2的commit流程。本步骤的commit包含了对softcommit和hardcommit的处理。

- commit过程包含prepareCommit，Commit，以及postCommit，我们主要关注的是commit
- 当进行commit时，会首先取消等待的softcommit和hardcommit。因为commit的效果是对整个solr的，所以多个commit只会影响性能而不会影响效果。
- 其次solr还会判断是否需要进行索引优化，即optimize。optimize的本质是合并策略中的forcemerge，forcemerge比较暴力，它不管你的合并策略是怎么限制segemnt的大小以及个数，它会一股脑的把所有的segment挤成一个，所以他是很费性能的。关于forcemerge的具体内容将在后续的介绍merge中展开。如果不需要优化optimize，Solr会进行forceMergeDeletes来删除已标记删除的document，它相当于一个小型的forcemerge，对性能的影响较少。当然，forcemerge也会对标记删除的document进行真正的删除。
- Solr存在一种情况，没有进行commit但是索引发生变化了，Solr会进行检查这种情况，如果发生了就会进行一次commit。
- 如果Solr进行的softcommit，首先会对ulog进行一次commit操作，将ulog进行一次清理。同时会调用getSearcher()来重新打开一个SolrIndexSearch满足实时性的要求。SolrIndexSearch是本节的重点，将在第2节重点介绍。
- 如果Solr进行的是hardcommit，那么Solr会删除ulog中最旧的日志(前文中讲到的addOldLog),生成新的日志文件TransactionLog编号。Solr会根据是否需要打开Searcher来调用getSearcher还是openNewSearcher。
- 最后waitSearcher[0].get()会等待新的Searcher打开。
- 以上就是DirectUpdateHandler2 commit的主要步骤，重点是在getSearcher和openNewSearcher上，下一节将重点介绍。

```java
public void commit(CommitUpdateCommand cmd) throws IOException {
if (cmd.prepareCommit) {
 prepareCommit(cmd);
 return;
}
if (cmd.optimize) {
 optimizeCommands.incrementAndGet();
} else {
 commitCommands.incrementAndGet();
 if (cmd.expungeDeletes) expungeDeleteCommands.incrementAndGet();
}
Future[] waitSearcher = null;
if (cmd.waitSearcher) {
 waitSearcher = new Future[1];
}
boolean error=true;
try {
 // only allow one hard commit to proceed at once
 if (!cmd.softCommit) {
   solrCoreState.getCommitLock().lock();
 }
 log.info("start "+cmd);
 // We must cancel pending commits *before* we actually execute the commit.
 if (cmd.openSearcher) {
   // we can cancel any pending soft commits if this commit will open a new searcher
   softCommitTracker.cancelPendingCommit();
 }
 if (!cmd.softCommit && (cmd.openSearcher || !commitTracker.getOpenSearcher())) {
   // cancel a pending hard commit if this commit is of equal or greater "strength"...
   // If the autoCommit has openSearcher=true, then this commit must have openSearcher=true
   // to cancel.
    commitTracker.cancelPendingCommit();
 }
 RefCounted<IndexWriter> iw = solrCoreState.getIndexWriter(core);
 try {
   IndexWriter writer = iw.get();
   if (cmd.optimize) {
     writer.forceMerge(cmd.maxOptimizeSegments);
   } else if (cmd.expungeDeletes) {
     writer.forceMergeDeletes();
   }
   if (!cmd.softCommit) {
     synchronized (solrCoreState.getUpdateLock()) { // sync is currently needed to prevent preCommit
                           // from being called between preSoft and
                           // postSoft... see postSoft comments.
       if (ulog != null) ulog.preCommit(cmd);
     }
     // SolrCore.verbose("writer.commit() start writer=",writer);
     if (writer.hasUncommittedChanges()) {
       final Map<String,String> commitData = new HashMap<>();
       commitData.put(SolrIndexWriter.COMMIT_TIME_MSEC_KEY,
           String.valueOf(System.currentTimeMillis()));
       writer.setCommitData(commitData);
       writer.commit();
     } else {
       log.info("No uncommitted changes. Skipping IW.commit.");
     }
     // SolrCore.verbose("writer.commit() end");
     numDocsPending.set(0);
     callPostCommitCallbacks();
   } else {
     callPostSoftCommitCallbacks();
   }
 } finally {
   iw.decref();
 }
 if (cmd.optimize) {
   callPostOptimizeCallbacks();
 }
 if (cmd.softCommit) {
   // ulog.preSoftCommit();
   synchronized (solrCoreState.getUpdateLock()) {
     if (ulog != null) ulog.preSoftCommit(cmd);
     core.getSearcher(true, false, waitSearcher, true);
     if (ulog != null) ulog.postSoftCommit(cmd);
   }
   // ulog.postSoftCommit();
 } else {
   synchronized (solrCoreState.getUpdateLock()) {
     if (ulog != null) ulog.preSoftCommit(cmd);
     if (cmd.openSearcher) {
       core.getSearcher(true, false, waitSearcher);
     } else {
       // force open a new realtime searcher so realtime-get and versioning code can see the latest
       RefCounted<SolrIndexSearcher> searchHolder = core.openNewSearcher(true, true);
       searchHolder.decref();
     }
     if (ulog != null) ulog.postSoftCommit(cmd);
   }
   if (ulog != null) ulog.postCommit(cmd); // postCommit currently means new searcher has
                         // also been opened
 }
 // reset commit tracking
 if (cmd.softCommit) {
   softCommitTracker.didCommit();
 } else {
   commitTracker.didCommit();
 }
 log.info("end_commit_flush");
 error=false;
}
finally {
 if (!cmd.softCommit) {
   solrCoreState.getCommitLock().unlock();
 }
 addCommands.set(0);
 deleteByIdCommands.set(0);
 deleteByQueryCommands.set(0);
 if (error) numErrors.incrementAndGet();
}
// if we are supposed to wait for the searcher to be registered, then we should do it
// outside any synchronized block so that other update operations can proceed.
if (waitSearcher!=null && waitSearcher[0] != null) {
  try {
   waitSearcher[0].get();
 } catch (InterruptedException e) {
   SolrException.log(log,e);
 } catch (ExecutionException e) {
   SolrException.log(log,e);
 }
}
}
```

## 2. getSearcher

getSearcher 获取一个现有的SolrIndexSearcher或者创建新的SolrIndexSearcher。每当进行SoftCommit的时候，重新创建一个新的SolrIndexSearcher是实现近实时索引的基础。在重新打开SolrIndexSearcher的时候，Solr不但会进行预热(warn)，而且还会新建SolrEventListener。

```java
1 public RefCounted<SolrIndexSearcher> getSearcher(boolean forceNew, boolean returnSearcher, final Future[] waitSearcher, boolean updateHandlerReopens) {
2 }
```

getSearcher主要包含以下几个参数:

- 如果已有IndexSearcher打开，是否需要强制打开新的IndexSearcher。如果设置为ture，那么每次都会打开新的IndexSearcher，那么刚add的document就是可查讯的，近实时查询需要该值为true。
- waitSearcher 如果该值不为空，那么Solr会得到新的Searcher注册后才会返回新的Searcher。如果在重新打开Searcher的过程中需要进行预热(关于预热下节重点介绍)，那么这个waitSearcher就会等到预热完成才返回，而预热的过程往往会占用大量的时间，比较影响索引的性能。
- returnSearcher 如果设置为ture，则返回SolrIndexSearcher，并引用加1.

接下来通过源码，来学习下Solr是如何获取到一个Seacher。

需要补充几点：

- onDeckSearchers 表示正在准备新建的Searcher。该值在SolrConfig.xml可以进行配置，该值很大程度上制约了多线程建索引的线程数。如果同时用10个线程在建索引，且commit比较频繁，而maxWarmingSearchers设置为8，那么很容出现以下这种错误：

```java
1 Error opening new searcher. exceeded limit of maxWarmingSearchers
```

而且当多个线程建索引的时候，且commit比较频繁，一直会有warm：

```java
1 PERFORMANCE WARNING: Overlapping onDeckSearchers=2
```

```java
1 <maxWarmingSearchers>10</maxWarmingSearchers>
```

```java
if (onDeckSearchers < 1) {
  // should never happen... just a sanity check
  log.error(logid+"ERROR!!! onDeckSearchers is " + onDeckSearchers);
  onDeckSearchers=1;  // reset
} else if (onDeckSearchers > maxWarmingSearchers) {
  onDeckSearchers--;
  String msg="Error opening new searcher. exceeded limit of maxWarmingSearchers="+maxWarmingSearchers + ", try again later.";
  log.warn(logid+""+ msg);
  // HTTP 503==service unavailable, or 409==Conflict
  throw new SolrException(SolrException.ErrorCode.SERVICE_UNAVAILABLE,msg);
} else if (onDeckSearchers > 1) {
  log.warn(logid+"PERFORMANCE WARNING: Overlapping onDeckSearchers=" + onDeckSearchers);
}
```

- 预热即是提升查询性能的一种方式，但是它是以消耗索引性能的，具体的介绍将会在下一节Solr的缓存机制中详细介绍。
- 在getSearcher时候，Solr同样会对一些listener进行预热.在solrconfig.xml上可以配置在newSearcher和firstSearcher的监听器，在事件触发时，可以做某些热身搜索，让Searcher做好准备提供服务,特别是服务重启的时候，如果没有做好热身，开始提供服务搜索时都很勉强。但是通过配置的方式进行listener的预热只对固定的一些查询进行，对于查询比较自由的环境效果可能并不明显。

```xml
<listener event="newSearcher" class="solr.QuerySenderListener">
<arr name="queries">
  <lst><str name="q">美女</str><str name="qt">standard</str><str name="sort">rtsTime desc</str></lst>
   <lst><str name="q">hadoop</str><str name="qt">standard</str><str name="sort">rtsTime desc</str></lst>
   <lst><str name="q">zoie</str><str name="qt">standard</str><str name="sort">rts desc</str></lst>
   <lst><str name="q">lucene</str><str name="qt">standard</str><str name="sort">pubdate desc</str></lst>        
<lst><str name="q">new searcher</str><str name="qt">standard</str><str name="sort">sourceId desc</str></lst>        
   <lst><str name="q">solr</str><str name="qt">standard</str><str name="sort">price desc</str></lst>               
</arr>
</listener>
```

相比于预热，Solr还提供了另外一种打开Searcher方式即cold Searcher，该方式会直接注册Searcher，并不需要进行预热，因此它会非常迅速，但是由于打开的是完成干净的Searcher，所以一点缓存信息也没有，比较影响一开始的查询性能。

```java
1  <useColdSearcher>false</useColdSearcher>
```

- 最后讲下注册，注册其实是将新建的Searcher写到一个map结构的变量中private final Map`` infoRegistry的过程

```java
public void register() {
  // register self
  core.getInfoRegistry().put("searcher", this);
  core.getInfoRegistry().put(name, this);
  for (SolrCache cache : cacheList) {
    cache.setState(SolrCache.State.LIVE);
    core.getInfoRegistry().put(cache.name(), cache);
  }
  registerTime=System.currentTimeMillis();
}
```

- 最后再简单介绍下openNewSearcher，顾名思义该函数就是重新打开新的Searcher。主要代码如下，本质上就是new一个SolrIndexSearcher，只不过会根据是否是近实时模式（nrtmode），是否已有打开的Searcher(判断是否是启动时候打开的searcher)，以及是否需要快速打开Searcher(若快速打开Searcher则过滤掉预热过程，在前文中讲到DirectUpdateHandler2的commit过程中也调用了RefCounted`` searchHolder = core.openNewSearcher(true, true);这里由于设置了true表示需要快速打开，所以是cold模式的searcher。)

```java
tmp = new SolrIndexSearcher(this, newIndexDir, getLatestSchema(), getSolrConfig().indexConfig, 
(realtime ? "realtime":"main"), newReader, true, !realtime, true, directoryFactory);
```

## 总结：

本节学习了SolrCloud的commit三步过程，重点介绍了DirectUpdateHandler2的commit和getSearcher的过程，篇幅有限并未深入学习Lucene的commit原理。同时本节提到了Warn预热的内容，那么下节开始将学习下SolrCloud的缓存机制。
