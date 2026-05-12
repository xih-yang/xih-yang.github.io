# 16、Solr4.8.0源码分析(16)之SolrCloud索引深入(3)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/16.html
- 分类：搜索引擎
- 分组：教程目录
前面两节学习了SolrCloud索引过程以及索引链的前两步，LogUpdateProcessorFactory和DistributedUpdateProcessor。本节将详细介绍了索引链的第三步DirectUpdateHandler2和UpdateLog。

## 1. DirectUpdateHandler2.ADD

DirectUpdateHandler2过程包含了Solr到Lucene的索引过程，在整个索引链中是最复杂也最重要的过程。首先，我们来查看在Solrconfig.xml中关于DirectUpdateHandler2的配置。

```xml
<updateHandler class="solr.DirectUpdateHandler2">
    <autoCommit>
       <maxTime>${solr.autoCommit.maxTime:15000}</maxTime>
       <maxDocs>${solr.autoCommit.maxDocs:25000}</maxDocs>
     <openSearcher>false</openSearcher> 
    </autoCommit>
    <autoSoftCommit> 
       <maxTime>${solr.autoSoftCommit.maxTime:-1}</maxTime> 
       <maxDocs>${solr.autoSoftCommit.maxDocs:1000}</maxDocs>
    </autoSoftCommit>
</updateHandler>
```

从上面中可以看出几个主要的参数：autoCommit和autoSoftCommit

- autoCommit，硬提交，Solr和Lucene原本存在的commit方式，负责把索引内容刷入磁盘，需要重新打开searcher，所以比较费性能。刷入磁盘后，Solr/Lucene对这部分内容可见可查。
- autoSoftCommit，软提交，这是Solr新增的commit方式，Lucene没有。软提交负责将索引内容在内存中生成segment，并使得索引内容对Solr可见可查，该提交方式是autoCommit的改善方式，保证了Solr的实时性同时又兼顾了性能。在进行softcommit过程中需要进行预热(即将现在状态的searcher复制到新的searcher中，保证了旧的softcommit数据不丢失)，虽然没有重新打开searcher那么费性能，但是预热频率过快还是会影响solr的性能。
- 以上两种是Solr自动触发的commit方式，他们都有两个参数maxTime和maxDocs分别表示两个参数的极限，当距离前一次commit maxTime时间后或者内存中的document数量到达maxDocs时候就会触发commit(autoCommit和autoSoftCommit)。相比于前两种，还有另外一种方式即客户端主动commit，该方式由客户端控制。
- 最后openSearcher配置表示进行autocommit时候是否重新打开searcher，如果autocommit频繁又将openSearcher设置为true，那么solr的性能压力会非常大。一般将autocommit的maxTime和maxDocs设的相对大点，对应的softcommit的设置小点，这样即保证了性能又保证了实时性，当然具体的值需要根据索引的频率以及document的大小综合考虑。

前面简要介绍了autoCommit和autoSoftCommit，这部分内容网上较多，本文就不具体介绍了。接下来着重介绍DirectUpdateHandler2的流程。

上一节讲到DirectUpdateHandler2是在DistributedUpdateProcessor过程中的versionadd中进行调用。以add过程为例，RunUpdateProcessorFactory.processAdd()

```java
public void processAdd(AddUpdateCommand cmd) throws IOException {
  if (DistributedUpdateProcessor.isAtomicUpdate(cmd)) {
    throw new SolrException
      (SolrException.ErrorCode.BAD_REQUEST,
       "RunUpdateProcessor has recieved an AddUpdateCommand containing a document that appears to still contain Atomic document update operations, most likely because DistributedUpdateProcessorFactory was explicitly disabled from this updateRequestProcessorChain");
  }
  updateHandler.addDoc(cmd);
  super.processAdd(cmd);
  changesSinceCommit = true;
}
```

接着来查看下addDoc0(),该函数包括了DirectUpdateHandler2的add全过程。代码逻辑比较简单，只需要注意以下几点即可：

- cmd.overwrite，是否会覆盖原先记录。如果传入的cmd中没有unique_id域，那么说明Solr索引中没有采用自定义的unique_id，因此就不会进行覆盖相同unique_id域的记录了。可以在schema.xml中进行设置unique_id域，如果设了该域，一旦新记录的该域值与旧的记录相同，它就会删除旧的记录。经过本人测试，没有unique_id的建索引速度是有unique_id的两到三倍，但是没有unique_id时候需要考虑数据的冗余性，查询时有可能会出现多条相同结果。
- deletesAfter=ulog.getDBQNewer(cmd.version);获取ulog中delete by query的日志，并对这些数据进行删除。
- add的先后顺序是先进行writer.updateDocument()将数据写入Lucene的索引中，后将记录写入uLog中(ulog.add(cmd))。这样更好的保证了数据一致性。
- 关于writer.updateDocument()由于涉及到Lucene的索引建立过程了，在后面单独进行学习。

```java
private int addDoc0(AddUpdateCommand cmd) throws IOException {
int rc = -1;
RefCounted<IndexWriter> iw = solrCoreState.getIndexWriter(core);
try {
  IndexWriter writer = iw.get();
  addCommands.incrementAndGet();
  addCommandsCumulative.incrementAndGet();
  // if there is no ID field, don't overwrite
  if (idField == null) {
    cmd.overwrite = false;
  }
  try {
    IndexSchema schema = cmd.getReq().getSchema();
    if (cmd.overwrite) {
      // Check for delete by query commands newer (i.e. reordered). This
      // should always be null on a leader
      List<UpdateLog.DBQ> deletesAfter = null;
      if (ulog != null && cmd.version > 0) {
        deletesAfter = ulog.getDBQNewer(cmd.version);
      }
      if (deletesAfter != null) {
        log.info("Reordered DBQs detected.  Update=" + cmd + " DBQs="
            + deletesAfter);
        List<Query> dbqList = new ArrayList<>(deletesAfter.size());
        for (UpdateLog.DBQ dbq : deletesAfter) {
          try {
            DeleteUpdateCommand tmpDel = new DeleteUpdateCommand(cmd.req);
            tmpDel.query = dbq.q;
            tmpDel.version = -dbq.version;
            dbqList.add(getQuery(tmpDel));
          } catch (Exception e) {
            log.error("Exception parsing reordered query : " + dbq, e);
          }
        }
        addAndDelete(cmd, dbqList);
      } else {
        // normal update
        Term updateTerm;
        Term idTerm = new Term(cmd.isBlock() ? "_root_" : idField.getName(), cmd.getIndexedId());
        boolean del = false;
        if (cmd.updateTerm == null) {
          updateTerm = idTerm;
        } else {
          // this is only used by the dedup update processor
          del = true;
          updateTerm = cmd.updateTerm;
        }
        if (cmd.isBlock()) {
          writer.updateDocuments(updateTerm, cmd, schema.getAnalyzer());
        } else {
          Document luceneDocument = cmd.getLuceneDocument();
          // SolrCore.verbose("updateDocument",updateTerm,luceneDocument,writer);
          writer.updateDocument(updateTerm, luceneDocument, schema.getAnalyzer());
        }
        // SolrCore.verbose("updateDocument",updateTerm,"DONE");
        if (del) { // ensure id remains unique
          BooleanQuery bq = new BooleanQuery();
          bq.add(new BooleanClause(new TermQuery(updateTerm),
              Occur.MUST_NOT));
          bq.add(new BooleanClause(new TermQuery(idTerm), Occur.MUST));
          writer.deleteDocuments(bq);
        }
        // Add to the transaction log *after* successfully adding to the
        // index, if there was no error.
        // This ordering ensures that if we log it, it's definitely been
        // added to the the index.
        // This also ensures that if a commit sneaks in-between, that we
        // know everything in a particular
        // log version was definitely committed.
        if (ulog != null) ulog.add(cmd);
      }
    } else {
      // allow duplicates
      if (cmd.isBlock()) {
        writer.addDocuments(cmd, schema.getAnalyzer());
      } else {
        writer.addDocument(cmd.getLuceneDocument(), schema.getAnalyzer());
      }
      if (ulog != null) ulog.add(cmd);
    }
    if ((cmd.getFlags() & UpdateCommand.IGNORE_AUTOCOMMIT) == 0) {
      if (commitWithinSoftCommit) {
        commitTracker.addedDocument(-1);
        softCommitTracker.addedDocument(cmd.commitWithin);
      } else {
        softCommitTracker.addedDocument(-1);
        commitTracker.addedDocument(cmd.commitWithin);
      }
    }
    rc = 1;
  } finally {
    if (rc != 1) {
      numErrors.incrementAndGet();
      numErrorsCumulative.incrementAndGet();
    } else {
      numDocsPending.incrementAndGet();
    }
  }
} finally {
  iw.decref();
}
return rc;
}
```

## 2. UpdateLog.ADD

UpdateLog的add也比较简单，主要分为三步：

检查update log有没有生成。同样需要说明，Updatelog是Solr的概念，在Lucene并没有出现，它在solrconfig.xml中进行配置，设置索引库更新日志，默认路径为solr home下面的data/tlog。如果没有ulog文件，那么就会重新生成一个.

```xml
<updateLog>
 <str name="dir">${solr.ulog.dir:}</str>
</updateLog>
```

- 开始写入ulog日志文件中，pos= tlog.write(cmd, operationFlags);该过程调用了TransactionLog的write接口，这在下一小节具体介绍。
- 将update的内容再写入map结构中，存放于内存。

## 3. TransactionLog

咋一看会觉得DirectUpdateHandler2的add过程比较简单，但是当add与commit以及updatelog recovering合并在一起，这个过程就变得比较复杂。本节先介绍updatelog的最小单位transactionLog.

- TransactionLog是一个tlog文件，UpdateLog是多个tlog文件的集合，它更多的指的时tLog目录。
- TransactionLog的文件命名格式如下：列入tlog.00000000000000000001

```java
1 public static String LOG_FILENAME_PATTERN = "%s.%019d";
2 String newLogName = String.format(Locale.ROOT, LOG_FILENAME_PATTERN, TLOG_NAME, id);
```

- TransactionLog的文件格式可以通过写文件的过程查看，注意这里的strings存放的是域，比如titile,author,content,那么后续存放document的值也是按这个顺序存放的，具有一一对应的关系。文件结构比较简单，可以从以下代码中了解。

```java
protected void writeLogHeader(LogCodec codec) throws IOException {
  long pos = fos.size();
  assert pos == 0;
  Map header = new LinkedHashMap<String,Object>();
  header.put("SOLR_TLOG",1); // a magic string + version number
  header.put("strings",globalStringList);
  codec.marshal(header, fos);
  endRecord(pos);
}
```

```java
public long write(AddUpdateCommand cmd, int flags) {
LogCodec codec = new LogCodec(resolver);
SolrInputDocument sdoc = cmd.getSolrInputDocument();
try {
  //写header信息
  checkWriteHeader(codec, sdoc);
  // adaptive buffer sizing
  int bufSize = lastAddSize;    // unsynchronized access of lastAddSize should be fine
  bufSize = Math.min(1024*1024, bufSize+(bufSize>>3)+256);
  MemOutputStream out = new MemOutputStream(new byte[bufSize]);
  codec.init(out);
  //写tag
  codec.writeTag(JavaBinCodec.ARR, 3);
  //写update类型
  codec.writeInt(UpdateLog.ADD | flags);  // should just take one byte
  //写version信息
  codec.writeLong(cmd.getVersion());
  //写document
  codec.writeSolrInputDocument(cmd.getSolrInputDocument());
  lastAddSize = (int)out.size();
  synchronized (this) {
    long pos = fos.size();   // if we had flushed, this should be equal to channel.position()
    assert pos != 0;
    /***
     System.out.println("##writing at " + pos + " fos.size()=" + fos.size() + " raf.length()=" + raf.length());
     if (pos != fos.size()) {
     throw new RuntimeException("ERROR" + "##writing at " + pos + " fos.size()=" + fos.size() + " raf.length()=" + raf.length());
     }
     ***/
    out.writeAll(fos);
    endRecord(pos);
    // fos.flushBuffer();  // flush later
    return pos;
  }
} catch (IOException e) {
  // TODO: reset our file pointer back to "pos", the start of this record.
  throw new SolrException(SolrException.ErrorCode.SERVER_ERROR, "Error logging add", e);
}
}
```

TransactionLog的创建是在每次update操作(add,delete或者deletebyquery)开始时，每当接收到update操作时候，Solr会去判断是否已有当前id的tlog文件，如果没有则新建新的当前id的tlog文件。

```java
protected void ensureLog() {
  if (tlog == null) {
    String newLogName = String.format(Locale.ROOT, LOG_FILENAME_PATTERN, TLOG_NAME, id);
    tlog = new TransactionLog(new File(tlogDir, newLogName), globalStrings);
  }
}
```

Solr如果只进行soft commit，那么TransactionLog文件只会增大不会增多，它只会往最近的(即id最大的)TransactionLog文件中写入ulog日志。如果进行的是hard commit，则会生成新的TransactionLog文件，并且根据存放的总的日志数(record)以及TransactionLog文件的个数进行判断是否需要删除旧的日志文件，默认情况下日志数(record)为100，TransactionLog个数为10个。代码中numRecordsToKeep为100。但是当我们进行快速建索引的时候，一开始并不会满足上述的条件，即会存在多个日志数(record)多余100的情况，这是为什么呢？快速建索引的时候，当soft commit一次进去大量record到TransactionLog中，并不会生成新的id的TransactionLog文件，也就不会取处理旧的TransactionLog文件。当soft commit频率大于hard commit时候，每个TransactionLog文件都会存放大量record，但是hard commit只会删除最旧的那个文件，剩余的TransactionLog的record数量仍然大于100, 因此这种现象是正常的。当你停止建索引，或者调整hard commit频率，这种现象会慢慢改变，直至符合正常的范围。

```java
protected void addOldLog(TransactionLog oldLog, boolean removeOld) {
  if (oldLog == null) return;
  numOldRecords += oldLog.numRecords();
  int currRecords = numOldRecords;
  if (oldLog != tlog &&  tlog != null) {
    currRecords += tlog.numRecords();
  }
  while (removeOld && logs.size() > 0) {
    TransactionLog log = logs.peekLast();
    int nrec = log.numRecords();
    // remove oldest log if we don't need it to keep at least numRecordsToKeep, or if
    // we already have the limit of 10 log files.
    if (currRecords - nrec >= numRecordsToKeep || logs.size() >= 10) {
      currRecords -= nrec;
      numOldRecords -= nrec;
      logs.removeLast().decref();  // dereference so it will be deleted when no longer in use
      continue;
    }
    break;
  }
  // don't incref... we are taking ownership from the caller.
  logs.addFirst(oldLog);
}
```

UpateLog会始终保存最新的两个TransactionLog文件，以及log的信息。每当进行soft commit或者hard commit操作时候进行更新。

```java
protected void newMap() {
  prevMap2 = prevMap;
  prevMapLog2 = prevMapLog;
  prevMap = map;
  prevMapLog = tlog;
  map = new HashMap<>();
}
```

总结：本节主要讲了update 索引链的第三步DirectUpdateHandler2中的add过程，add过程主要包含了两步，第一步调用lucene indexwriter 进行updatedocument以及将索引写入updatelog。lucene indexwriter涉及到lucene的建索引了，将在后续文章中再研究。updatelog的难点主要在recovery上，所以本节又简要的介绍了updatelog的基本内容以及具体的日志文件TransactionLog。下一节将介绍update的commit操作，它也主要涉及了updatelog的更新操作。

##
