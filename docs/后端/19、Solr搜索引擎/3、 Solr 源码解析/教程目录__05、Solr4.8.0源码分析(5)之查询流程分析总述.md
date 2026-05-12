# 05、Solr4.8.0源码分析(5)之查询流程分析总述
- 来源：https://ddkk.com/zhuanlan/search/solr/1/5.html
- 分类：搜索引擎
- 分组：教程目录
前面已经写到，solr查询是通过http发送命令，solr servlet接受并进行处理。所以solr的查询流程从SolrDispatchsFilter的dofilter开始。dofilter包含了对http的各个请求的操作。Solr的查询方式有很多，比如q,fq等，本章只关注select和q。页面下发的查询请求如下：[http://localhost:8080/solr/test/select?q=code%3A%E8%BE%BD*+AND+last_modified%3A%5B0+TO+1408454600265%5D+AND+id%3Acheng&wt=json&indent=true](http://localhost:8080/solr/test/select?q=code%3A%E8%BE%BD*+AND+last_modified%3A%5B0+TO+1408454600265%5D+AND+id%3Acheng&wt=json&indent=true)

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
  doFilter(request, response, chain, false);
}
```

由于只关注select，实际的查询是从如下代码开始：this.execute()是查询的入口函数。这里需要注意下writeResponse()函数。execute只是获取了符合查询条件的doc id，最后在writeResponse()中会根据doc id获取stored属性的字段信息，并写入返回结果。

```java
// With a valid handler and a valid core...
if( handler != null ) {
// if not a /select, create the request
if( solrReq == null ) {
 solrReq = parser.parse( core, path, req );
}
if (usingAliases) {
 processAliases(solrReq, aliases, collectionsList);
}
final Method reqMethod = Method.getMethod(req.getMethod());
HttpCacheHeaderUtil.setCacheControlHeader(config, resp, reqMethod);
// unless we have been explicitly told not to, do cache validation
// if we fail cache validation, execute the query
if (config.getHttpCachingConfig().isNever304() ||
   !HttpCacheHeaderUtil.doCacheHeaderValidation(solrReq, req, reqMethod, resp)) {
   SolrQueryResponse solrRsp = new SolrQueryResponse();
   /* even for HEAD requests, we need to execute the handler to
    * ensure we don't get an error (and to make sure the correct
    * QueryResponseWriter is selected and we get the correct
    * Content-Type)
    */
   SolrRequestInfo.setRequestInfo(new SolrRequestInfo(solrReq, solrRsp));
   this.execute( req, handler, solrReq, solrRsp );
   HttpCacheHeaderUtil.checkHttpCachingVeto(solrRsp, resp, reqMethod);
 // add info to http headers
 //TODO: See SOLR-232 and SOLR-267.  
   /*try {
     NamedList solrRspHeader = solrRsp.getResponseHeader();
    for (int i=0; i<solrRspHeader.size(); i++) {
      ((javax.servlet.http.HttpServletResponse) response).addHeader(("Solr-" + solrRspHeader.getName(i)), String.valueOf(solrRspHeader.getVal(i)));
    }
   } catch (ClassCastException cce) {
     log.log(Level.WARNING, "exception adding response header log information", cce);
   }*/
  QueryResponseWriter responseWriter = core.getQueryResponseWriter(solrReq);
  writeResponse(solrRsp, response, responseWriter, solrReq, reqMethod);
}
```

进入excute后会进入SolrCore的excute(), preDecorateResponse 对结果的头信息比如进行预处理，postDecorateResponse对将时间、返回结果写入response中。handleRequest继续进行查询操作。

```java
public void execute(SolrRequestHandler handler, SolrQueryRequest req, SolrQueryResponse rsp) {
  if (handler==null) {
    String msg = "Null Request Handler '" +
      req.getParams().get(CommonParams.QT) + "'";
    if (log.isWarnEnabled()) log.warn(logid + msg + ":" + req);
    throw new SolrException(SolrException.ErrorCode.BAD_REQUEST, msg);
  }
  preDecorateResponse(req, rsp);
  // TODO: this doesn't seem to be working correctly and causes problems with the example server and distrib (for example /spell)
  // if (req.getParams().getBool(ShardParams.IS_SHARD,false) && !(handler instanceof SearchHandler))
  //   throw new SolrException(SolrException.ErrorCode.BAD_REQUEST,"isShard is only acceptable with search handlers");
  handler.handleRequest(req,rsp);
  postDecorateResponse(handler, req, rsp);
  if (log.isInfoEnabled() && rsp.getToLog().size() > 0) {
    log.info(rsp.getToLogAsString(logid));
  }
}
```

RequestHandlerBase.handleRequest(SolrQueryRequest req, SolrQueryResponse rsp)再次调用了SearchHandle.handleRequestBody(SolrQueryRequest req, SolrQueryResponse rsp),这是时候才真正开始加载QueryComponents。

以下语句会加载查询有关的组件，包括QueryComponents,FacetComponents,MoreLikeThisComponent,HighlightComponent,StatsComponent,

DebugComponent,ExpandComponent。本文只关注查询，所以进入的QueryComponent.java.

```java
for( SearchComponent c : components ) {
    c.process(rb);
}    
```

暂且不提QueryComponent.java中的关于Query的处理(查询的细节将在后面章节中说明，本章只作总述)，QueryComponent.process

(ResponseBuilder rb) 会调用SolrindexSearch.search(QueryResult qr, QueryCommand cmd)进行查询，并在后续代码中对返回的结果进行处理，主要包括doFieldSortValues(rb, searcher);和doPrefetch(rb)；

```java
// normal search result
searcher.search(result,cmd);
rb.setResult( result );
ResultContext ctx = new ResultContext();
ctx.docs = rb.getResults().docList;
ctx.query = rb.getQuery();
rsp.add("response", ctx);
rsp.getToLog().add("hits", rb.getResults().docList.matches());
if ( ! rb.req.getParams().getBool(ShardParams.IS_SHARD,false) ) {
  if (null != rb.getNextCursorMark()) {
    rb.rsp.add(CursorMarkParams.CURSOR_MARK_NEXT, 
               rb.getNextCursorMark().getSerializedTotem());
  }
}
doFieldSortValues(rb, searcher);
doPrefetch(rb);
```

SolrindexSearch.search函数比较简单，只是调用了SolrindexSearch.getDocListC.顾名思义，该函数返回了查询结果的doc id 的list。这时候才是真正的查询开始。查询之前，Solr会从queryResultCache缓存里面读取该条件的结果，queryResultCache里面存放了查询条件和查询结果的键值对。如果queryResultCache里面有这个查询条件，那Solr就会直接返回查询条件的值。如果没有该查询条件，则会进行正常查询，并把查询条件和查询命令写入queryResultCache的键值对里。queryResultCache具有容量大小，可以在solrconfig的缓存配置里进行配置。

```java
// we can try and look up the complete query in the cache.
// we can't do that if filter!=null though (we don't want to
// do hashCode() and equals() for a big DocSet).
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
          out.docList = superset.subset(cmd.getOffset(),cmd.getLen());
        }
      }
      if (out.docList != null) {
        // found the docList in the cache... now check if we need the docset too.
        // OPT: possible future optimization - if the doclist contains all the matches,
        // use it to make the docset instead of rerunning the query.
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
```

如果没有复合的缓存，那么将进行正常的查询。这里查询会走排序和非排序的查询分支(两个分支的差别将在后续文章中写道)。最后查询会进入getDocListNC(qr,cmd)函数继续进行查询。superset.subset()会对查询结果进行截断，比如我查询的结果start=20，row=40，那么Solr查询实际的结果是start=0，row=60,也就是至少说会查(start+row)个结果，然后再获取第20到第60的结果集。

```java
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
sortDocSet(qr, cmd);
} else {
// do it the normal way...
if ((flags & GET_DOCSET)!=0) {
// this currently conflates returning the docset for the base query vs
// the base query and all filters.
DocSet qDocSet = getDocListAndSetNC(qr,cmd);
// cache the docSet matching the query w/o filtering
if (qDocSet!=null && filterCache!=null && !qr.isPartialResults()) filterCache.put(cmd.getQuery(),qDocSet);
} else {
getDocListNC(qr,cmd);
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
superset = out.docList;
out.docList = superset.subset(cmd.getOffset(),cmd.getLen());
} else {
// sanity check our cursor assumptions
assert null == superset : "cursor: superset isn't null";
assert 0 == cmd.getOffset() : "cursor: command offset mismatch";
assert 0 == out.docList.offset() : "cursor: docList offset mismatch";
assert cmd.getLen() >= supersetMaxDoc : "cursor: superset len mismatch: " +
cmd.getLen() + " vs " + supersetMaxDoc;
}
```

SolrIndexSearch.getDocListNC(qr,cmd)里面定义了许多Collector的内部类，不过暂时与本章节无关，所以直接查看以下这段代码。首先Solr会创建TopDocsCollector，它会存放所有复合查询条件的结果集。如果查询的时候设置了timeAllowed开关，那么查询就会走TimeLimitingCollector分支。TimeLimitingCollector是Collector的子类，当timeAllowed设定一个数字时，比如200ms，如果Solr查询一旦获取到结果就会在200ms内返回，不管查询的结果是否已经完整。可以看见最后查询过程最后调用了Lucene IndexSearch.Search(),这层开始进入Lucene.最后Solr会对TopDocsCollector的结果总数以及优先级队列进行处理。

```java
final TopDocsCollector topCollector = buildTopDocsCollector(len, cmd);
Collector collector = topCollector;
if (terminateEarly) {
  collector = new EarlyTerminatingCollector(collector, cmd.len);
}
if( timeAllowed > 0 ) {
  collector = new TimeLimitingCollector(collector, TimeLimitingCollector.getGlobalCounter(), timeAllowed);
}
if (pf.postFilter != null) {
  pf.postFilter.setLastDelegate(collector);
  collector = pf.postFilter;
}
try {
  super.search(query, luceneFilter, collector);
  if(collector instanceof DelegatingCollector) {
    ((DelegatingCollector)collector).finish();
  }
}
catch( TimeLimitingCollector.TimeExceededException x ) {
  log.warn( "Query: " + query + "; " + x.getMessage() );
  qr.setPartialResults(true);
}
totalHits = topCollector.getTotalHits();
TopDocs topDocs = topCollector.topDocs(0, len);
populateNextCursorMarkFromTopDocs(qr, cmd, topDocs);
maxScore = totalHits>0 ? topDocs.getMaxScore() : 0.0f;
nDocsReturned = topDocs.scoreDocs.length;
ids = new int[nDocsReturned];
scores = (cmd.getFlags()&GET_SCORES)!=0 ? new float[nDocsReturned] : null;
for (int i=0; i<nDocsReturned; i++) {
  ScoreDoc scoreDoc = topDocs.scoreDocs[i];
  ids[i] = scoreDoc.doc;
  if 
```

进入Lucene的IndexSearch.Search()后，Solr开始对所有Segment进行遍历，AtomicReaderContext包含了Segment的所有信息，包括docbase，doc的个数。

遍历完后，会调用Weight.bulkScore()对多个条件进行重组，比如多个OR的条件组成一个条件，多个AND的查询条件再组成一个List。Weight.bulkScore()会对这个List按照查询条件的词频进行排序。对条件处理好以后，就是会从segment里面获取所有符合查询条件的doc id(具体的获取方法，在后续的文章里会详细介绍)，这就是scorer.score(collector);的作用了。

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

到这一步已经获取到符合查询条件的所有doc id了，但是我们的查询结果是需要显示多有的字段的，所以也就是说Solr后面还是会根据doc id再次取segment获取所有字段信息，至于这是在哪里实现的，在后续文章中会详细描述。

总结:Solr的查询过程还是比较绕的，且有很多可以优化的地方。本文主要简述了Solr查询的流程，对查询过程中的细节将在后续的文章里面具体阐述。
