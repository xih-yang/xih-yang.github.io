# 18、Solr4.8.0源码分析(18)之缓存机制(一)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/18.html
- 分类：搜索引擎
- 分组：教程目录
前文在介绍commit的时候具体介绍了getSearcher()的实现，并提到了Solr的预热warn。那么本文开始将详细来学习下Solr的缓存机制。

## 1. 简介

Solr目前支持4中cache类型，每种缓存对应一种查询类型。

- filterCache
- documentCache
- fieldvalueCache
- queryresultCache

Solr提供了两种SolrCache接口实现类：

- solr.search.LRUCache
- solr.search.FastLRUCache。

FastLRUCache是1.4版本中引入的，其速度在普遍意义上要比LRUCache更fast些。

本文开始将详细介绍以上的内容，而本文的重要内容是Cache的生命周期，即

### 2. Cache生命周期

所有的Cache的生命周期由SolrIndexSearcher来管理，如果Cache对应的SolrIndexSearcher被重新构建都代表正在运行的Cache对象失效。

### 2.1 Cache初始化

前文 Solr4.8.0源码分析(17)之SolrCloud索引深入(4) 中讲到了，增量数据更新后提交DirectUpdateHandler2.commit(CommitUpdateCommand cmd)过程时候getSearcher()会获取到SolrIndexSearcher，如果设置forceNew=true ，就会重新打开一个SolrIndexSearcher，这个时候Solr就会进行warn。SolrIndexSearcher的有关cache的初始化代码如下, 可以看出cachingEnabled是个很关键的配置，如果该值为false 缓存就不会初始化。

```java
if (cachingEnabled) {
      ArrayList<SolrCache> clist = new ArrayList<>();
      fieldValueCache = solrConfig.fieldValueCacheConfig==null ? null : solrConfig.fieldValueCacheConfig.newInstance();
      if (fieldValueCache!=null) clist.add(fieldValueCache);
      filterCache= solrConfig.filterCacheConfig==null ? null : solrConfig.filterCacheConfig.newInstance();
      if (filterCache!=null) clist.add(filterCache);
      queryResultCache = solrConfig.queryResultCacheConfig==null ? null : solrConfig.queryResultCacheConfig.newInstance();
      if (queryResultCache!=null) clist.add(queryResultCache);
      documentCache = solrConfig.documentCacheConfig==null ? null : solrConfig.documentCacheConfig.newInstance();
      if (documentCache!=null) clist.add(documentCache);
      if (solrConfig.userCacheConfigs == null) {
        cacheMap = noGenericCaches;
      } else {
        cacheMap = new HashMap<>(solrConfig.userCacheConfigs.length);
        for (CacheConfig userCacheConfig : solrConfig.userCacheConfigs) {
          SolrCache cache = null;
          if (userCacheConfig != null) cache = userCacheConfig.newInstance();
          if (cache != null) {
            cacheMap.put(cache.name(), cache);
            clist.add(cache);
          }
        }
      }
      cacheList = clist.toArray(new SolrCache[clist.size()]);
    } else {
      filterCache=null;
      queryResultCache=null;
      documentCache=null;
      fieldValueCache=null;
      cacheMap = noGenericCaches;
      cacheList= noCaches;
    }
```

从上述代码中可以看出，Solr的缓存接口主要有两种，LRUCache和FastLRUCache，这可以在SolrConfig.xml上进行配置。

其中size为缓存设置大小，initalSize初始化大小，autowarmCount 是最为关键的参数代表每次构建新的SolrIndexSearcher的时候需要后台线程预热加载到新Cache中多少个结果集。autowarmCount不但支持具体的参数比如300，也支持按百分比设置，比如autowarmCount="300"。如果autowarmCount为0则表示不进行预热。

那是不是这个预热数目越大就越好呢，其实还是要根据实际情况而定。如果你的应用为实时应用，很多实时应用的实现都会在很短的时间内去得到重新打开的 内存索引indexReader，而Solr默认实现就会重新打开一个新的SolrIndexSearcher,那么如果Cache需要预热的数目越多，那么打开新的SolrIndexSearcher就会越慢，这样对实时性就会大打折扣。但是如果设置很小。每次都打开新的SolrIndexSearcher都是空Cache，基本上那些fq和facet的查询就基本不会命中缓存。所以对实时应用需要特别注意。

```xml
<query>
<filterCache      class="solr.LRUCache"     size="300"      initialSize="10"      autowarmCount="300"/>
<queryResultCache class="solr.LRUCache"     size="300"      initialSize="10"      autowarmCount="300"/>
<fieldValueCache  class="solr.FastLRUCache"     size="300"      initialSize="10"       autowarmCount="300" />
<documentCache    class="solr.FastLRUCache"     size="5000"      initialSize="512"      autowarmCount="300"/>
<useFilterForSortedQuery>true</useFilterForSortedQuery>//是否能使用到filtercache关键配置
<queryResultWindowSize>50</queryResultWindowSize>//queryresult的结果集控制
<enableLazyFieldLoading>false</enableLazyFieldLoading>//是否启用懒加载field
</query>
```

### 2.2 Cache的预热

预热，也许会很多人不了解预热的含义，在这里稍微解释下，例如一个Cache已经缓存了比较多的值，如果因为新的IndexSearcher被重新构建，那么新的Cache又会需要重新累积数据，那么会发现搜索突然会在一段时间性能急 剧下降，要等到Cache重新累计了一定数据，命中率才会慢慢恢复。所以这样的情形其实是不可接受的，那么我们可以做的事情就是将老Cache对应的key,在重新构建SolrIndexSearcher返回之前将这些已经在老Cache中Key预先从磁盘重新load Value到Cache中，这样暴露出去的SolrIndexSearcher对应的Cache就不是一个内容为空的Cache，而是已经“背地”准备好内容的Cache。

前文在getSearcher()中以及提到了预热，那么再来回顾下它的源码。

```java
future = searcherExecutor.submit(new Callable() {
  @Override
  public Object call() throws Exception {
    try {
      newSearcher.warm(currSearcher);
    } catch (Throwable e) {
      SolrException.log(log, e);
      if (e instanceof Error) {
        throw (Error) e;
      }
    }
    return null;
  }
});
```

真正开始进行预热是在SolrIndexSearcher.warn函数中，可以看出SolrIndexSearcher会对每一个缓存类型(filterCache，documentCache等)依次进行预热。而每一种类型的Cache都会根据其cache的接口类型来调用接口类型的warn。比如Solrconfig.xml中设置了filterCache的类型为FastLRUCache，那么Solr就会调用FastLRUCache的warn。

```java
for (int i=0; i<cacheList.length; i++) {
  if (debug) log.debug("autowarming " + this + " from " + old + "\n\t" + old.cacheList[i]);
  SolrQueryRequest req = new LocalSolrQueryRequest(core,params) {
    @Override public SolrIndexSearcher getSearcher() { return SolrIndexSearcher.this; }
    @Override public void close() { }
  };
  SolrQueryResponse rsp = new SolrQueryResponse();
  SolrRequestInfo.setRequestInfo(new SolrRequestInfo(req, rsp));
  try {
    this.cacheList[i].warm(this, old.cacheList[i]);
  } finally {
    try {
      req.close();
    } finally {
      SolrRequestInfo.clearRequestInfo();
    }
  }
  if (debug) log.debug("autowarming result for " + this + "\n\t" + this.cacheList[i]);
}
```

FastLRUCache和LRUCache的区别我们暂且不讲，后文会详细介绍。我们提取出了它们共同实现warn的代码，即CacheRegenerator**.**regenerateItem()。regenerateItem的作用是对单个查询条件进行预热处理。

```java
for (int i=0; i<keys.length; i++) {
  try {
    boolean continueRegen = regenerator.regenerateItem(searcher, this, old, keys[i], vals[i]);
    if (!continueRegen) break;
  }
  catch (Exception e) {
    SolrException.log(log,"Error during auto-warming of key:" + keys[i], e);
  }
}
```

目前有三个CacheRegenerator，分别对应fieldValueCache，filterCache，以及queryResultCache。在SolrCore初始化的时候会分别对这三个类型的CacheRegenerator进行初始化。

```java
public static void initRegenerators(SolrConfig solrConfig) {
if (solrConfig.fieldValueCacheConfig != null && solrConfig.fieldValueCacheConfig.getRegenerator() == null) {
  solrConfig.fieldValueCacheConfig.setRegenerator(
          new CacheRegenerator() {
            @Override
            public boolean regenerateItem(SolrIndexSearcher newSearcher, SolrCache newCache, SolrCache oldCache, Object oldKey, Object oldVal) throws IOException {
              if (oldVal instanceof UnInvertedField) {
                UnInvertedField.getUnInvertedField((String)oldKey, newSearcher);
              }
              return true;
            }
          }
  );
}
if (solrConfig.filterCacheConfig != null && solrConfig.filterCacheConfig.getRegenerator() == null) {
  solrConfig.filterCacheConfig.setRegenerator(
          new CacheRegenerator() {
            @Override
            public boolean regenerateItem(SolrIndexSearcher newSearcher, SolrCache newCache, SolrCache oldCache, Object oldKey, Object oldVal) throws IOException {
              newSearcher.cacheDocSet((Query)oldKey, null, false);
              return true;
            }
          }
  );
}
if (solrConfig.queryResultCacheConfig != null && solrConfig.queryResultCacheConfig.getRegenerator() == null) {
final int queryResultWindowSize = solrConfig.queryResultWindowSize;
solrConfig.queryResultCacheConfig.setRegenerator(
  new CacheRegenerator() {
    @Override
    public boolean regenerateItem(SolrIndexSearcher newSearcher, SolrCache newCache, SolrCache oldCache, Object oldKey, Object oldVal) throws IOException {
      QueryResultKey key = (QueryResultKey)oldKey;
      int nDocs=1;
      // request 1 doc and let caching round up to the next window size...
      // unless the window size is <=1, in which case we will pick
      // the minimum of the number of documents requested last time and
      // a reasonable number such as 40.
      // TODO: make more configurable later...
      if (queryResultWindowSize<=1) {
        DocList oldList = (DocList)oldVal;
        int oldnDocs = oldList.offset() + oldList.size();
        // 40 has factors of 2,4,5,10,20
        nDocs = Math.min(oldnDocs,40);
      }
      int flags=NO_CHECK_QCACHE | key.nc_flags;
      QueryCommand qc = new QueryCommand();
      qc.setQuery(key.query)
        .setFilterList(key.filters)
        .setSort(key.sort)
        .setLen(nDocs)
        .setSupersetMaxDoc(nDocs)
        .setFlags(flags);
      QueryResult qr = new QueryResult();
      newSearcher.getDocListC(qr,qc);
      return true;
    }
  }
);
}
}
```

- 关于fieldValueCache的预热将会在facet查询部分再介绍，本节将介绍filterCache和queryResultCache的regenerateItem。
- filterCache 在预热的时候会根据oldkey即根据缓存中的查询条件再去查询一次，并吧查询结果放入缓存。
- queryResultCache 在SolrConfig.xml上有queryResultWindowSize，即每次查询是以该值为单位来返回查询结果个数。比如queryResultWindowSize为50，那么返回的结果就是50的倍数。在预热的时候，queryResultCache会再次用chache的查询条件查询一次，并返回queryResultWindowSize的结果放入缓存。
- documentCache 存放的是``键值对，在预热的时候将会被遗弃。也即该缓存在进行commit的时候就会清零。

从上述的代码中可以看出，预热的本质就是将旧的Searcher中的query在进行commit时重新查询一遍，并将结果放入新的Searcher中。因此如果这个query的个数越多，预热的时间越久，所以autowarnCount这个参数很重要，它控制了旧的Searcher进行预热的query数量，如果该值为0就不会进行预热。如果autowarnCount较大，预热时间就会持续太久，将大大影响索引的性能，如果autowarnCount较少，虽然预热时间会持续较短，但是一开始缓存的命中将很低，影响查询性能。

### 2.3 Cache的添加

每查询一次，Solr都会把查询条件和查询结果进行缓存，以queryResultCache为例。

```java
// lastly, put the superset in the cache if the size is less than or equal
// to queryResultMaxDocsCached
if (key != null && superset.size() <= queryResultMaxDocsCached && !qr.isPartialResults()) {
  queryResultCache.put(key, superset);
}
```

### 2.3 Cache的销毁

Cache的销毁也是通过SolrIndexSearcher的关闭一并进行，见solrIndexSearcher.close()方法：

```java
@Override
public void close() throws IOException {
if (debug) {
 if (cachingEnabled) {
   StringBuilder sb = new StringBuilder();
   sb.append("Closing ").append(name);
   for (SolrCache cache : cacheList) {
     sb.append("\n\t");
     sb.append(cache);
   }
   log.debug(sb.toString());
 } else {
   if (debug) log.debug("Closing " + name);
 }
}
core.getInfoRegistry().remove(name);
// super.close();
// can't use super.close() since it just calls reader.close() and that may only be called once
// per reader (even if incRef() was previously called).
long cpg = reader.getIndexCommit().getGeneration();
try {
 if (closeReader) reader.decRef();
} catch (Exception e) {
 SolrException.log(log, "Problem dec ref'ing reader", e);
}
if (directoryFactory.searchersReserveCommitPoints()) {
 core.getDeletionPolicy().releaseCommitPoint(cpg);
}
for (SolrCache cache : cacheList) {
 cache.close();
}
if (reserveDirectory) {
 directoryFactory.release(getIndexReader().directory());
}
if (createdDirectory) {
 directoryFactory.release(getIndexReader().directory());
}
// do this at the end so it only gets done if there are no exceptions
numCloses.incrementAndGet();
}
```

### 总结：

本节主要介绍了Cache的创建，预热，添加以及销毁，重点阐述了预热的原理。下节将介绍几种Cache的结构，使用场景，命中监控等。
