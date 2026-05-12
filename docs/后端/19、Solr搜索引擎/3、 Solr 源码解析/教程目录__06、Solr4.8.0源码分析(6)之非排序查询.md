# 06、Solr4.8.0源码分析(6)之非排序查询
- 来源：https://ddkk.com/zhuanlan/search/solr/1/6.html
- 分类：搜索引擎
- 分组：教程目录
上篇文章简单介绍了Solr的查询流程，本文开始将详细介绍下查询的细节。查询主要分为排序查询和非排序查询，由于两者走的是两个分支，所以本文先介绍下非排序的查询。

查询的流程主要在SolrIndexSearch.getDocListC(QueryResult qr, QueryCommand cmd),顾名思义该函数对queryResultCache进行处理，并根据查询条件选择进入排序查询还是非排序查询。

```java
/**
* getDocList version that uses+populates query and filter caches.
* In the event of a timeout, the cache is not populated.
*/
private void getDocListC(QueryResult qr, QueryCommand cmd) throws IOException {
DocListAndSet out = new DocListAndSet();
qr.setDocListAndSet(out);
QueryResultKey key=null;
int maxDocRequested = cmd.getOffset() + cmd.getLen(); //当有偏移的查询产生，Solr首先会获取cmd.getOffset()+cmd.getLen()个的doc id然后　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　//再根据偏移量获取子集，所以maxDocRequested是实际的查询个数。
// check for overflow, and check for docs in index
if (maxDocRequested < 0 || maxDocRequested > maxDoc()) maxDocRequested = maxDoc();// 最多的情况获取所有doc id
int supersetMaxDoc= maxDocRequested;
DocList superset = null;
int flags = cmd.getFlags();
Query q = cmd.getQuery();
if (q instanceof ExtendedQuery) {
 ExtendedQuery eq = (ExtendedQuery)q;
 if (!eq.getCache()) {
   flags |= (NO_CHECK_QCACHE | NO_SET_QCACHE | NO_CHECK_FILTERCACHE);
 }
}
// we can try and look up the complete query in the cache.
// we can't do that if filter!=null though (we don't want to
// do hashCode() and equals() for a big DocSet).
// 先从查询结果的缓存区查找是否出现过该条件的查询，若出现过则返回缓存的结果.关于缓存的内容将会独立写一篇文章
if (queryResultCache != null && cmd.getFilter()==null
   && (flags & (NO_CHECK_QCACHE|NO_SET_QCACHE)) != ((NO_CHECK_QCACHE|NO_SET_QCACHE)))
{
   // all of the current flags can be reused during warming,
   // so set all of them on the cache key.
   key = new QueryResultKey(q, cmd.getFilterList(), cmd.getSort(), flags);
   if ((flags & NO_CHECK_QCACHE)==0) {
     superset = queryResultCache.get(key);
     if (superset != null) {
       // check that the cache entry has scores recorded if we need them
       if ((flags & GET_SCORES)==0 || superset.hasScores()) {
         // NOTE: subset() returns null if the DocList has fewer docs than
         // requested
         out.docList = superset.subset(cmd.getOffset(),cmd.getLen()); //如果有缓存，就从中去除一部分子集
       }
     }
     if (out.docList != null) {   
       // found the docList in the cache... now check if we need the docset too.
       // OPT: possible future optimization - if the doclist contains all the matches,
       // use it to make the docset instead of rerunning the query.
       //获取缓存中的docSet，并传给result。
       if (out.docSet==null && ((flags & GET_DOCSET)!=0) ) {
         if (cmd.getFilterList()==null) {
           out.docSet = getDocSet(cmd.getQuery());
         } else {  
           List<Query> newList = new ArrayList<>(cmd.getFilterList().size()+1);
           newList.add(cmd.getQuery());
           newList.addAll(cmd.getFilterList());
           out.docSet = getDocSet(newList);
         }
       }
       return;
     }
   }
 // If we are going to generate the result, bump up to the
 // next resultWindowSize for better caching.
 // 修改supersetMaxDoc为queryResultWindwSize的整数倍
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
}
cmd.setSupersetMaxDoc(supersetMaxDoc);
// OK, so now we need to generate an answer.
// One way to do that would be to check if we have an unordered list
// of results for the base query.  If so, we can apply the filters and then
// sort by the resulting set.  This can only be used if:
// - the sort doesn't contain score
// - we don't want score returned.
// check if we should try and use the filter cache
boolean useFilterCache=false;
if ((flags & (GET_SCORES|NO_CHECK_FILTERCACHE))==0 && useFilterForSortedQuery && cmd.getSort() != null && filterCache != null) {
  useFilterCache=true;
  SortField[] sfields = cmd.getSort().getSort();
  for (SortField sf : sfields) {
    if (sf.getType() == SortField.Type.SCORE) {
      useFilterCache=false;
      break;
    }
  }
}
if (useFilterCache) {
  // now actually use the filter cache.
  // for large filters that match few documents, this may be
  // slower than simply re-executing the query.
  if (out.docSet == null) {
    out.docSet = getDocSet(cmd.getQuery(),cmd.getFilter());
    DocSet bigFilt = getDocSet(cmd.getFilterList());
    if (bigFilt != null) out.docSet = out.docSet.intersection(bigFilt);
  }
  // todo: there could be a sortDocSet that could take a list of
  // the filters instead of anding them first...
  // perhaps there should be a multi-docset-iterator
  sortDocSet(qr, cmd);  //排序查询
} else {
  // do it the normal way...
  if ((flags & GET_DOCSET)!=0) {
    // this currently conflates returning the docset for the base query vs
    // the base query and all filters.
    DocSet qDocSet = getDocListAndSetNC(qr,cmd);
    // cache the docSet matching the query w/o filtering
    if (qDocSet!=null && filterCache!=null && !qr.isPartialResults()) filterCache.put(cmd.getQuery(),qDocSet);
  } else {
    getDocListNC(qr,cmd); //非排序查询，这也是本文的流程。
  }
  assert null != out.docList : "docList is null";
}
if (null == cmd.getCursorMark()) {
  // Kludge...
  // we can't use DocSlice.subset, even though it should be an identity op
  // because it gets confused by situations where there are lots of matches, but
  // less docs in the slice then were requested, (due to the cursor)
  // so we have to short circuit the call.
  // None of which is really a problem since we can't use caching with
  // cursors anyway, but it still looks weird to have to special case this
  // behavior based on this condition - hence the long explanation.
  superset = out.docList; //根据offset和len截取查询结果
  out.docList = superset.subset(cmd.getOffset(),cmd.getLen()); 
} else {
  // sanity check our cursor assumptions
  assert null == superset : "cursor: superset isn't null";
  assert 0 == cmd.getOffset() : "cursor: command offset mismatch";
  assert 0 == out.docList.offset() : "cursor: docList offset mismatch";
  assert cmd.getLen() >= supersetMaxDoc : "cursor: superset len mismatch: " +
    cmd.getLen() + " vs " + supersetMaxDoc;
}
// lastly, put the superset in the cache if the size is less than or equal
// to queryResultMaxDocsCached
if (key != null && superset.size() <= queryResultMaxDocsCached && !qr.isPartialResults()) {
  queryResultCache.put(key, superset);    //如果结果的个数小于或者等于queryResultMaxDocsCached则将本次查询结果放入缓存
}
}
```

进入非排序查询分支getDocListNC(),该函数内部分直接调用Lucene的IndexSearch.Search()

```java
final TopDocsCollector topCollector = buildTopDocsCollector(len, cmd); //新建TopDocsCollector对象，里面会新建(offset + len(查询条          //件的len))的HitQueue，每当获取到一个符合查询条件的doc，就会将该doc id放入HitQueue,并totalhit计数加一，这个totalhit变量也就是查询结果的数量
Collector collector = topCollector;
if (terminateEarly) {
  collector = new EarlyTerminatingCollector(collector, cmd.len);
}
if( timeAllowed > 0 ) {
  collector = new TimeLimitingCollector(collector, TimeLimitingCollector.getGlobalCounter(), timeAllowed); 
  //TimeLimitingCollector的实现原理很简单，从第一个找到符合查询条件的doc id开始计时，在达到timeAllowed之前，会想查询得到的doc id放入HitQue           //ue,一旦timeAllowed到了，就会立即扔出错误，中断后续的查询。这对于我们优化查询是个重要的提示
}
if (pf.postFilter != null) {
  pf.postFilter.setLastDelegate(collector);
  collector = pf.postFilter;
}
try {
  // 进入Lucene的IndexSearch.Search()
  super.search(query, luceneFilter, collector);
  if(collector instanceof DelegatingCollector) {
    ((DelegatingCollector)collector).finish();
  }
}
catch( TimeLimitingCollector.TimeExceededException x ) {
  log.warn( "Query: " + query + "; " + x.getMessage() );
  qr.setPartialResults(true);
}
totalHits = topCollector.getTotalHits();           //返回totalhit的结果
TopDocs topDocs = topCollector.topDocs(0, len);    //返回优先级队列hitqueue的doc id
populateNextCursorMarkFromTopDocs(qr, cmd, topDocs);
maxScore = totalHits>0 ? topDocs.getMaxScore() : 0.0f;
nDocsReturned = topDocs.scoreDocs.length;
ids = new int[nDocsReturned];
scores = (cmd.getFlags()&GET_SCORES)!=0 ? new float[nDocsReturned] : null;
for (int i=0; i<nDocsReturned; i++) {
  ScoreDoc scoreDoc = topDocs.scoreDocs[i];
  ids[i] = scoreDoc.doc;
  if (scores != null) scores[i] = scoreDoc.score;
}
```

```java
TimeLimitingCollector统计查询结果的方法，一旦timeAllowed到了，就会立即扔出错误，中断后续的查询
```

```java
/**
 * Calls {@link Collector#collect(int)} on the decorated {@link Collector}
 * unless the allowed time has passed, in which case it throws an exception.
 * 
 * @throws TimeExceededException
 *           if the time allowed has exceeded.
 */
@Override
public void collect(final int doc) throws IOException {
  final long time = clock.get();
  if (timeout < time) {
    if (greedy) {
      //System.out.println(this+"  greedy: before failing, collecting doc: "+(docBase + doc)+"  "+(time-t0));
      collector.collect(doc);
    }
    //System.out.println(this+"  failing on:  "+(docBase + doc)+"  "+(time-t0));
    throw new TimeExceededException( timeout-t0, time-t0, docBase + doc );   
  }
  //System.out.println(this+"  collecting: "+(docBase + doc)+"  "+(time-t0));
  collector.collect(doc);
}
```

接下来开始lucece的查询过程，

**1、** 首先会为每一个查询条件新建一个Weight的对象，最后将所有Weight对象放入ArrayListweights该过程给出每个查询条件的权重，并用于后续的评分过程；

```java
public BooleanWeight(IndexSearcher searcher, boolean disableCoord)
  throws IOException {
  this.similarity = searcher.getSimilarity();
  this.disableCoord = disableCoord;
  weights = new ArrayList<>(clauses.size());
  for (int i = 0 ; i < clauses.size(); i++) {
    BooleanClause c = clauses.get(i);
    Weight w = c.getQuery().createWeight(searcher);
    weights.add(w);
    if (!c.isProhibited()) {
      maxCoord++;
    }
  }
}
```

**2、** 遍历所有sgement，一个接一个的查找符合查询条件的docidAtomicReaderContext是包含segment的具体信息，包括docbase，numdocs，这些信息室非常有用的，在实现查询优化时候很有帮助这里需要注意的是这个collector是TopDocsCollector类型的对象，这在上面的代码中已经赋值过了；

```java
/**
* Lower-level search API.
* 
* <p>
* {@link Collector#collect(int)} is called for every document. <br>
* 
* <p>
* NOTE: this method executes the searches on all given leaves exclusively.
* To search across all the searchers leaves use {@linkleafContexts}.
* 
* @param leaves 
*          the searchers leaves to execute the searches on
* @param weight
*          to match documents
* @param collector
*          to receive hits
* @throws BooleanQuery.TooManyClauses If a query would exceed 
*         {@link BooleanQuery#getMaxClauseCount()} clauses.
*/
protected void search(List<AtomicReaderContext> leaves, Weight weight, Collector collector)
  throws IOException {
// TODO: should we make this
// threaded...?  the Collector could be sync'd?
// always use single thread:
for (AtomicReaderContext ctx : leaves) { // search each subreader
  try {
    collector.setNextReader(ctx);
  } catch (CollectionTerminatedException e) {
    // there is no doc of interest in this reader context
    // continue with the following leaf
    continue;
  }
  BulkScorer scorer = weight.bulkScorer(ctx, !collector.acceptsDocsOutOfOrder(), ctx.reader().getLiveDocs());
  if (scorer != null) {
    try {
      scorer.score(collector);
    } catch (CollectionTerminatedException e) {
      // collection was terminated prematurely
      // continue with the following leaf
    }
  }
}
}
```

**3、** Weight.bulkScorer对查询条件进行评分，Lucene的多条件查询优化还是写的很不错的Lucece会根据每个查询条件的词频对查询条件进行排序，词频小的排在前面，词频大的排在后面这大大优化了多条件的查询多条件查询的优化会在下文中详细介绍；

**4、** 最后Lucene会使用scorer.score(collector)这个过程真正的进行查询看下Weight的两个函数，就能明白Lucene怎么进行查询统计；

```java
@Override
public boolean score(Collector collector, int max) throws IOException {
 // TODO: this may be sort of weird, when we are
 // embedded in a BooleanScorer, because we are
 // called for every chunk of 2048 documents.  But,
 // then, scorer is a FakeScorer in that case, so any
 // Collector doing something "interesting" in
 // setScorer will be forced to use BS2 anyways:
 collector.setScorer(scorer);
 if (max == DocIdSetIterator.NO_MORE_DOCS) {
   scoreAll(collector, scorer);
   return false;
 } else {
   int doc = scorer.docID();
   if (doc < 0) {
     doc = scorer.nextDoc();
   }
   return scoreRange(collector, scorer, doc, max);
 }
}
```

Lucece会不停的从segment获取符合查询条件的doc，并放入collector的hitqueue里面。需要注意的是这里的collector是Collector类型，是TopDocsCollector等类的父类，所以scoreAll不仅能实现获取TopDocsCollector的doc is也能获取其他查询方式的doc id。

```java
static void scoreAll(Collector collector, Scorer scorer) throws IOException {
  int doc;
  while ((doc = scorer.nextDoc()) != DocIdSetIterator.NO_MORE_DOCS) {
    collector.collect(doc);
  }
}
```

进入collector.collect(doc)查看TopDocsCollector的统计doc id的方式，就跟之前说的一样。

```java
@Override
public void collect(int doc) throws IOException {
float score = scorer.score();
// This collector cannot handle these scores:
assert score != Float.NEGATIVE_INFINITY;
assert !Float.isNaN(score);
totalHits++;
if (score <= pqTop.score) {
 // Since docs are returned in-order (i.e., increasing doc Id), a document
 // with equal score to pqTop.score cannot compete since HitQueue favors
 // documents with lower doc Ids. Therefore reject those docs too.
 return;
}
pqTop.doc = doc + docBase;
pqTop.score = score;
pqTop = pq.updateTop();
}
```

总结：本章详细的介绍了非排序查询的流程，主要涉及了以下几个类QueryComponent,SolrIndexSearch,TimeLimitingCollector,TopDocsCollector,IndexSearch,BulkScore,Weight. 篇幅原因，并没有将如何从segment里面获取doc id以及多条件查询是怎么实现的，这将是下一问多条件查询中详细介绍。
