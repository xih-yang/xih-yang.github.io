# 19、Solr4.8.0源码分析(19)之缓存机制(二)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/19.html
- 分类：搜索引擎
- 分组：教程目录
前文 Solr4.8.0源码分析(18)之缓存机制(一) 介绍了Solr缓存的生命周期，重点介绍了Solr缓存的warn过程。本节将更深入的来介绍下Solr的四种缓存类型，以及两种SolrCache接口实现类。

## 1、SolrCache接口实现类

前文已经提到SolrCache有两种接口实现类：solr.search.LRUCache 和 solr.search.LRUCache。 那么两者具体有啥区别呢？

## 1.1 solr.search.LRUCache

LRUCache具有以下几个参数：

- size：cache中可保存的最大的项数，默认是1024
- initialSize：cache初始化时的大小，默认是1024
- autowarmCount：当切换SolrIndexSearcher时，可以对新生成的SolrIndexSearcher做autowarm（预热）处理。autowarmCount表示从旧的SolrIndexSearcher中取多少项来在新的SolrIndexSearcher中被重新生成，如何重新生成由CacheRegenerator实现。在4.0版本可以指定为已有cache项数的百分比，以便能更好的平衡autowarm的开销及效果。如果不指定该参数，则表示不做autowarm处理。

实现上，LRUCache直接使用LinkedHashMap来缓存数据，由initialSize来限定cache的大小，淘汰策略也是使用LinkedHashMap的内置的LRU方式，读写操作都是对map的全局锁，所以并发性效果方面稍差。而对cache的get与put操作其实质上也就是对LinkedHashMap的put与get操作。

```java
map = new LinkedHashMap<K,V>(initialSize, 0.75f, true) {
@Override
protected boolean removeEldestEntry(Map.Entry eldest) {
  if (size() > limit) {
    // increment evictions regardless of state.
    // this doesn't need to be synchronized because it will
    // only be called in the context of a higher level synchronized block.
    evictions++;
    stats.evictions.incrementAndGet();
    return true;
  }
  return false;
}
};
```

对cache的get与put操作其实质上也就是对LinkedHashMap的put与get操作。

```java
@Override
public V put(K key, V value) {
  synchronized (map) {
    if (getState() == State.LIVE) {
      stats.inserts.incrementAndGet();  //Cache累计插入数目
    }
    // increment local inserts regardless of state???
    // it does make it more consistent with the current size...
    inserts++;  //当前cache的插入数目
    return map.put(key,value);
  }
}
@Override
public V get(K key) {
  synchronized (map) {
    V val = map.get(key);
    if (getState() == State.LIVE) {
      // only increment lookups and hits if we are live.
      lookups++;    //当前cache的查询数目
      stats.lookups.incrementAndGet();  //Cache累计查询数目
      if (val!=null) {
        hits++;
        stats.hits.incrementAndGet();
      }
    }
    return val;
  }
}
```

## 1.2 solr.search.FastLRUCache

在配置方面，FastLRUCache除了需要LRUCache的参数，还可有选择性的指定下面的参数：

- minSize：当cache达到它的最大数，淘汰策略使其降到minSize大小，默认是0.9*size。
- acceptableSize：当淘汰数据时，期望能降到minSize，但可能会做不到，则可勉为其难的降到acceptableSize，默认是0.95*size。
- cleanupThread：相比LRUCache是在put操作中同步进行淘汰工作，FastLRUCache可选择由独立的线程来做，也就是配置cleanupThread的时候。当cache大小很大时，每一次的淘汰数据就可能会花费较长时间，这对于提供查询请求的线程来说就不太合适，由独立的后台线程来做就很有必要。

实现上，FastLRUCache内部使用了ConcurrentLRUCache来缓存数据，它是个加了LRU淘汰策略的ConcurrentHashMap，所以其并发性要好很多，这也是多数Java版Cache的极典型实现。

```java
1 cache = new ConcurrentLRUCache<>(limit, minLimit, acceptableLimit, initialSize, newThread, false, null);
```

## 2. 缓存类型

## 2.1 filterCache

filterCache存储了无序的lucene document id集合，该cache有3种用途：

- filterCache存储了filter queries(“fq”参数)得到的document id集合结果。Solr中的query参数有两种，即q和fq。如果fq存在，Solr是先查询fq（因为fq可以多个，所以多个fq查询是个取结果交集的过程），之后将fq结果和q结果取并。在这一过程中，filterCache就是key为单个fq（类型为Query），value为document id集合（类型为DocSet）的cache。对于fq为range query来说，filterCache表现出其有价值的一面。
- 另外一个最为重要的例外场景，在Solr中如果设置，useFilterForSortedQuery=true，filterCache不为空，且带有sort的排序查询，将会进入如下代码块:

```java
if ((flags & (GET_SCORES|NO_CHECK_FILTERCACHE))==0 && useFilterForSortedQuery && cmd.getSort() != null && filterCache != null) {
useFilterCache=true;
    SortField[] sfields = cmd.getSort().getSort();
    for (SortField sf : sfields) {
    if (sf.getType() == SortField.SCORE) {
      useFilterCache=false;
      break;
    }
    }
}
// disable useFilterCache optimization temporarily
if (useFilterCache) {
    // now actually use the filter cache.
    // for large filters that match few documents, this may be
    // slower than simply re-executing the query.
    if (out.docSet == null) {//在DocSet方法中将会把Query的结果也Cache到filterCache中。
    out.docSet = getDocSet(cmd.getQuery(),cmd.getFilter());
    DocSet bigFilt = getDocSet(cmd.getFilterList());//fq不为空将Cache结果到filterCache中。
    if (bigFilt != null) out.docSet = out.docSet.intersection(bigFilt);//返回2个结果集合的交集
}
// todo: there could be a sortDocSet that could take a list of
// the filters instead of anding them first...
// perhaps there should be a multi-docset-iterator
superset = sortDocSet(out.docSet,cmd.getSort(),supersetMaxDoc);//排序
out.docList = superset.subset(cmd.getOffset(),cmd.getLen());//返回len 大小的结果集合
```

- filterCache还可用于facet查询，facet查询中各facet的计数是通过对满足query条件的document id集合（可涉及到filterCache）的处理得到的。因为统计各facet计数可能会涉及到所有的doc id，所以filterCache的大小需要能容下索引的文档数。这一部分暂未学习到。
- 对于是否使用filterCache及如何配置filterCache大小，需要根据应用特点、统计、效果、经验等各方面来评估。对于使用fq、facet的应用，对filterCache的调优是很有必要的。

## 2.2 queryResultCache

queryResultCache对Query的结果进行缓存，主要在SolrIndexSearcher类的getDocListC（）方法中被使用，主要缓存具有 QueryResultKey的结果集。也就是说具有相同QueryResultKey的查询都可以命中cache,所以我们看看 QueryResultKey的equals方法如何判断怎么才算相同QueryResultKey：

```java
@Override
public boolean equals(Object o) {
  if (o==this) return true;
  if (!(o instanceof QueryResultKey)) return false;
  QueryResultKey other = (QueryResultKey)o;
  // fast check of the whole hash code... most hash tables will only use
  // some of the bits, so if this is a hash collision, it's still likely
  // that the full cached hash code will be different.
  if (this.hc != other.hc) return false;
  // check for the thing most likely to be different (and the fastest things)
  // first.
  if (this.sfields.length != other.sfields.length) return false;
  if (!this.query.equals(other.query)) return false;
  if (!unorderedCompare(this.filters, other.filters)) return false;
  for (int i=0; i<sfields.length; i++) {
    SortField sf1 = this.sfields[i];
    SortField sf2 = other.sfields[i];
    if (!sf1.equals(sf2)) return false;
  }
  return true;
}
```

由以上代码可以看出，如果要命中一个queryResultCache，需要满足query、filterquery sortFiled一致才行。

因为查询参数是有start和rows的，所以某个QueryResultKey可能命中了cache，但start和rows却不在cache的document id set范围内。当然，document id set是越大命中的概率越大，但这也会很浪费内存，这就需要个参数：queryResultWindowSize来指定document id set的大小。Solr中默认取值为50,可配置，WIKI上的解释很深简单明了：

```xml
<!-- An optimization for use with the queryResultCache.  When a search
is requested, a superset of the requested number of document ids
are collected.  For example, of a search for a particular query
requests matching documents 10 through 19, and queryWindowSize is 50,
then documents 0 through 50 will be collected and cached.  Any further
requests in that range can be satisfied via the cache.
-->
<queryResultWindowSize>50</queryResultWindowSize>
```

```java
// If we are going to generate the result, bump up to the
// next resultWindowSize for better caching.
if ((flags & NO_SET_QCACHE) == 0) {
  // handle 0 special case as well as avoid idiv in the common case.
  if (maxDocRequested < queryResultWindowSize) {
    supersetMaxDoc=queryResultWindowSize;
  } else {
    supersetMaxDoc = ((maxDocRequested -1)/queryResultWindowSize + 1)*queryResultWindowSize;
    if (supersetMaxDoc < 0) supersetMaxDoc=maxDocRequested;
  }
} else {
  key = null;  // we won't be caching the result
}
```

同样的queryResultCache在预热的时候也是根据queryResultWindowSize大小进行预热的。

相比filterCache来说，queryResultCache内存使用上要更少一些，但它的效果如何就很难说。就索引数据来说，通常我们只是在索引上存储应用主键id，再从数据库等数据源获取其他需要的字段。这使得查询过程变成，首先通过solr得到document id set，再由Solr得到应用id集合，最后从外部数据源得到完成的查询结果。如果对查询结果正确性没有苛刻的要求，可以在Solr之外独立的缓存完整的查询结果（定时作废），这时queryResultCache就不是很有必要，否则可以考虑使用queryResultCache。当然，如果发现在queryResultCache生命周期内，query重合度很低，也不是很有必要开着它。

## 2.3 documentCache

Solr的查询主要分为两步，第一步根据查询条件获取ids，第二步根据id获取相应的具体id集合。相比于queryResultCache和filterCache存储的是键为query，值为ids这样的结构(第一步)，documentCache存储的是建为id，值为具体的域(第二步)。但是实际上documentCache的缓存效果并不明显，相比于第二步，Solr的查询费时主要集中在第一步上，而且在进行commit的时候documentCache都会清零。所以对于一个commit比较频率的solr来说，documentCache的效果并不大。但是如果使用documentCache，就尽可能开大些，至少要大过 * ，否则因为cache的淘汰，一次请求期间还需要重新获取document一次。也要注意document中存储的字段的多少，避免大量的内存消耗。

```java
1  private final SolrCache<Integer,Document> documentCache;
```

## 2.4 fieldvalueCache

fieldvalueCache 缓存在facet组件使用情况下对multiValued=true的域相关计数进行Cache，一般那些多值域采用facet查询一定要开启该Cache，主要缓存（参考UnInvertedField 的实现）:

- maxTermCounts 最大Term数目
- numTermsInField 该Field有多少个Term
- bigTerms 存储那些Term docFreq 大于threshold的term
- tnums 一个记录 term和何其Nums的二维数组
- 每次FacetComponent执行process方法–>SimpleFacets.getFacetCounts()–>getFacetFieldCounts()–>getTermCounts(facetValue)–>UnInvertedField.getUnInvertedField(field, searcher);展开看该方法

```java
public static UnInvertedField getUnInvertedField(String field, SolrIndexSearcher searcher) throws IOException {
SolrCache cache = searcher.getFieldValueCache();
if (cache == null) {
  return new UnInvertedField(field, searcher);//直接返回
}
UnInvertedField uif = (UnInvertedField)cache.get(field);
if (uif == null) {//第一次初始化该域对应的UnInvertedField
  synchronized (cache) {
    uif = (UnInvertedField)cache.get(field);
    if (uif == null) {
      uif = new UnInvertedField(field, searcher);
      cache.put(field, uif);
    }
  }
}
return uif;
}
```

## 3. Cache的命中监控

可以在SolrAdmin的插件页面中对cache进行监控。

****

其中lookups 为当前cache 查询数， hitratio 为当前cache命中率，inserts为当前cache插入数，evictions从cache中踢出来的数据个数,size 为当前cache缓存数， warmuptime为当前cache预热所消耗时间，而已cumulative都为该类型Cache累计的查询，命中，命中率，插入、踢出的数目。

## 总结：

本节主要介绍了Solr的几种缓存类型以及两种缓存实现接口，最后介绍了如何监控缓存的方法，由于目前学习的较浅，更深的缓存知识将在以后再深入介绍。
