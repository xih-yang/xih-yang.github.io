# 13、Solr4.8.0源码分析(13)之LuceneCore的索引修复
- 来源：https://ddkk.com/zhuanlan/search/solr/1/13.html
- 分类：搜索引擎
- 分组：教程目录
题记：今天在公司研究elasticsearch,突然看到一篇博客说elasticsearch具有索引修复功能，顿感好奇，于是点进去看了下，发现原来是Lucene Core自带的功能。说实话之前学习Lucene文件格式的时候就想做一个索引文件解析和检测的工具，也动手写了一部分，最后没想到发现了一个已有的工具，正好对照着学习下。

索引的修复主要是用到CheckIndex.java这个类，可以直接查看类的Main函数来了解下。

**1、** CheckIndex的使用；

首先使用以下命令来查看lucenecore.jar怎么使用：

```java
192:lib rcf$ java -cp lucene-core-4.8-SNAPSHOT.jar -ea:org.apache.lucene... org.apache.lucene.index.CheckIndex 
ERROR: index path not specified
Usage: java org.apache.lucene.index.CheckIndex pathToIndex [-fix] [-crossCheckTermVectors] [-segment X] [-segment Y] [-dir-impl X]
  -fix: actually write a new segments_N file, removing any problematic segments
  -crossCheckTermVectors: verifies that term vectors match postings; THIS IS VERY SLOW!
  -codec X: when fixing, codec to write the new segments_N file with
  -verbose: print additional details
  -segment X: only check the specified segments.  This can be specified multiple
              times, to check more than one segment, eg '-segment _2 -segment _a'.
              You can't use this with the -fix option
  -dir-impl X: use a specific FSDirectory implementation. If no package is specified the org.apache.lucene.store package will be used.
**WARNING**: -fix should only be used on an emergency basis as it will cause
documents (perhaps many) to be permanently removed from the index.  Always make
a backup copy of your index before running this!  Do not run this tool on an index
that is actively being written to.  You have been warned!
Run without -fix, this tool will open the index, report version information
and report any exceptions it hits and what action it would take if -fix were
specified.  With -fix, this tool will remove any segments that have issues and
write a new segments_N file.  This means all documents contained in the affected
segments will be removed.
This tool exits with exit code 1 if the index cannot be opened or has any
corruption, else 0.
```

当敲java -cp lucene-core-4.8-SNAPSHOT.jar -ea:org.apache.lucene... org.apache.lucene.index.CheckIndex 这个就能看到相当于help的信息啦，但是为什么这里用这么一串奇怪的命令呢？通过java -help来查看-cp 以及 -ea就可以发现，-cp其实等同于-classpath 提供类和jar的搜索路径，-ea等同于-enableassertions提供是否启动断言设置。所以上述的命令其实可以简化为java -cp lucene-core-4.8-SNAPSHOT.jar org.apache.lucene.index.CheckIndex 。

首先来检查下索引的情况：可以看出信息蛮清楚明了的。

```java
userdeMacBook-Pro:lib rcf$ java -cp lucene-core-4.8-SNAPSHOT.jar -ea:org.apache.lucene.index...  org.apache.lucene.index.CheckIndex ../../../../../../solr/Solr/test/data/index
Opening index @ ../../../../../../solr/Solr/test/data/index
Segments file=segments_r numSegments=7 version=4.8 format= userData={commitTimeMSec=1411221019854}
  1 of 7: name=_k docCount=18001
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.493
    diagnostics = {timestamp=1411221019346, os=Mac OS X, os.version=10.9.4, mergeFactor=10, source=merge, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, mergeMaxNumSegments=-1, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [36091 terms; 54003 terms/docs pairs; 18001 tokens]
    test: stored fields.......OK [54003 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
  2 of 7: name=_l docCount=1000
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.028
    diagnostics = {timestamp=1411221019406, os=Mac OS X, os.version=10.9.4, source=flush, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [2002 terms; 3000 terms/docs pairs; 1000 tokens]
    test: stored fields.......OK [3000 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
  3 of 7: name=_m docCount=1000
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.028
    diagnostics = {timestamp=1411221019478, os=Mac OS X, os.version=10.9.4, source=flush, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [2002 terms; 3000 terms/docs pairs; 1000 tokens]
    test: stored fields.......OK [3000 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
  4 of 7: name=_n docCount=1000
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.028
    diagnostics = {timestamp=1411221019552, os=Mac OS X, os.version=10.9.4, source=flush, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [2002 terms; 3000 terms/docs pairs; 1000 tokens]
    test: stored fields.......OK [3000 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
  5 of 7: name=_o docCount=1000
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.028
    diagnostics = {timestamp=1411221019629, os=Mac OS X, os.version=10.9.4, source=flush, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [2002 terms; 3000 terms/docs pairs; 1000 tokens]
    test: stored fields.......OK [3000 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
  6 of 7: name=_p docCount=1000
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.028
    diagnostics = {timestamp=1411221019739, os=Mac OS X, os.version=10.9.4, source=flush, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [2002 terms; 3000 terms/docs pairs; 1000 tokens]
    test: stored fields.......OK [3000 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
  7 of 7: name=_q docCount=1000
    codec=Lucene46
    compound=false
    numFiles=10
    size (MB)=0.027
    diagnostics = {timestamp=1411221019863, os=Mac OS X, os.version=10.9.4, source=flush, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, os.arch=x86_64, java.version=1.7.0_60, java.vendor=Oracle Corporation}
    no deletions
    test: open reader.........OK
    test: check integrity.....OK
    test: check live docs.....OK
    test: fields..............OK [3 fields]
    test: field norms.........OK [1 fields]
    test: terms, freq, prox...OK [2001 terms; 3000 terms/docs pairs; 1000 tokens]
    test: stored fields.......OK [3000 total field count; avg 3 fields per doc]
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
    test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
No problems were detected with this index.
```

由于我的索引文件是正常的，那么通过网上的例子来查看下错误的情况下是什么样子的，并且-fix是怎么样子的效果：

来自网友：http://blog.csdn.net/laigood/article/details/8296678

```java
Segments file=segments_2cg numSegments=26 version=3.6.1 format=FORMAT_3_1 [Lucene 3.1+] userData={translog_id=1347536741715}
  1 of 26: name=_59ct docCount=4711242
    compound=false
    hasProx=true
    numFiles=9
    size (MB)=6,233.694
    diagnostics = {mergeFactor=13, os.version=2.6.32-71.el6.x86_64, os=Linux, lucene.version=3.6.1 1362471 - thetaphi - 2012-07-17 12:40:12, source=merge, os.arch=amd64, mergeMaxNumSegments=-1, java.version=1.6.0_24, java.vendor=Sun Microsystems Inc.}
    has deletions [delFileName=_59ct_1b.del]
    test: open reader.........OK [3107 deleted docs]
    test: fields..............OK [25 fields]
    test: field norms.........OK [10 fields]
    test: terms, freq, prox...OK [36504908 terms; 617641081 terms/docs pairs; 742052507 tokens]
    test: stored fields.......ERROR [read past EOF: MMapIndexInput(path="/usr/local/sas/escluster/data/cluster/nodes/0/indices/index/5/index/_59ct.fdt")]
java.io.EOFException: read past EOF: MMapIndexInput(path="/usr/local/sas/escluster/data/cluster/nodes/0/indices/index/5/index/_59ct.fdt")
        at org.apache.lucene.store.MMapDirectory$MMapIndexInput.readBytes(MMapDirectory.java:307)
        at org.apache.lucene.index.FieldsReader.addField(FieldsReader.java:400)
        at org.apache.lucene.index.FieldsReader.doc(FieldsReader.java:253)
        at org.apache.lucene.index.SegmentReader.document(SegmentReader.java:492)
        at org.apache.lucene.index.IndexReader.document(IndexReader.java:1138)
        at org.apache.lucene.index.CheckIndex.testStoredFields(CheckIndex.java:852)
        at org.apache.lucene.index.CheckIndex.checkIndex(CheckIndex.java:581)
        at org.apache.lucene.index.CheckIndex.main(CheckIndex.java:1064)
    test: term vectors........OK [0 total vector count; avg 0 term/freq vector fields per doc]
FAILED
    WARNING: fixIndex() would remove reference to this segment; full exception:
java.lang.RuntimeException: Stored Field test failed
        at org.apache.lucene.index.CheckIndex.checkIndex(CheckIndex.java:593)
        at org.apache.lucene.index.CheckIndex.main(CheckIndex.java:1064)
WARNING: 1 broken segments (containing 4708135 documents) detected
WARNING: 4708135 documents will be lost
```

在检查结果中可以看到，分片5的_59ct.fdt索引文件损坏，.fdt文件主要存储lucene索引中存储的fields，所以在检查test: stored fields时出错。

下面的警告是说有一个损坏了的segment，里面有4708135个文档。

在原来的命令基础上加上-fix参数可以进行修复索引操作（ps：在进行修改前最好对要修复的索引进行备份，不要在正在执行写操作的索引上执行修复。）

```java
java -cp lucene-core-3.6.1.jar -ea:org.apache.lucene... org.apache.lucene.index.CheckIndex /usr/local/sas/escluster/data/cluster/nodes/0/indices/index/5/index/ -fix
NOTE: will write new segments file in 5 seconds; this will remove 4708135 docs from the index. THIS IS YOUR LAST CHANCE TO CTRL+C!
  5...
  4...
  3...
  2...
  1...
Writing...
OK
Wrote new segments file "segments_2ch"
```

还可以通过检查某一个segment：

```java
userdeMacBook-Pro:lib rcf$ java -cp lucene-core-4.8-SNAPSHOT.jar -ea:org.apache.lucene.index...  org.apache.lucene.index.CheckIndex ../../../../../../solr/Solr/test/data/index -segment _9
Opening index @ ../../../../../../solr/Solr/test/data/index
Segments file=segments_r numSegments=7 version=4.8 format= userData={commitTimeMSec=1411221019854}
Checking only these segments: _9:
No problems were detected with this index.
```

还可以通过-verbose查看更多详细信息，这里就不在详述。

**2、** CheckIndex的源码；

接着我们再来学习下CheckIndex的源码是怎么来实现以上功能的，检查索引的功能主要集中在checkindex()函数上，

```java
public Status checkIndex(List<String> onlySegments) throws IOException {
..
   final int numSegments = sis.size();                         //获取segment个数
   final String segmentsFileName = sis.getSegmentsFileName();  //获取segment_N名字
   // note: we only read the format byte (required preamble) here!
   IndexInput input = null;
   try {
     input = dir.openInput(segmentsFileName, IOContext.READONCE);//读取segment_N文件
   } catch (Throwable t) {
     msg(infoStream, "ERROR: could not open segments file in directory");
     if (infoStream != null)
       t.printStackTrace(infoStream);
     result.cantOpenSegments = true;
     return result;
   }
   int format = 0;
   try {
     format = input.readInt();  //读取segment_N version
   } catch (Throwable t) {
     msg(infoStream, "ERROR: could not read segment file version in directory");
     if (infoStream != null)
       t.printStackTrace(infoStream);
     result.missingSegmentVersion = true;
     return result;
   } finally {
     if (input != null)
       input.close();
   }
   String sFormat = "";
   boolean skip = false;
   result.segmentsFileName = segmentsFileName;//segment_N名字
   result.numSegments = numSegments;      //segment个数
   result.userData = sis.getUserData();   //获取user信息，如userData={commitTimeMSec=1411221019854}
   String userDataString;
   if (sis.getUserData().size() > 0) {
     userDataString = " userData=" + sis.getUserData();
   } else {
     userDataString = "";
   }
    //获取版本信息，如version=4.8
   String versionString = null;
   if (oldSegs != null) {
     if (foundNonNullVersion) {
       versionString = "versions=[" + oldSegs + " .. " + newest + "]";
     } else {
       versionString = "version=" + oldSegs;
     }
   } else {
     versionString = oldest.equals(newest) ? ( "version=" + oldest ) : ("versions=[" + oldest + " .. " + newest + "]");
   }
   msg(infoStream, "Segments file=" + segmentsFileName + " numSegments=" + numSegments
       + " " + versionString + " format=" + sFormat + userDataString);
   if (onlySegments != null) {
     result.partial = true;
     if (infoStream != null) {
       infoStream.print("\nChecking only these segments:");
       for (String s : onlySegments) {
         infoStream.print(" " + s);
       }
     }
     result.segmentsChecked.addAll(onlySegments);
     msg(infoStream, ":");
   }
   if (skip) {
     msg(infoStream, "\nERROR: this index appears to be created by a newer version of Lucene than this tool was compiled on; please re-compile this tool on the matching version of Lucene; exiting");
     result.toolOutOfDate = true;
     return result;
   }
   result.newSegments = sis.clone();
   result.newSegments.clear();
   result.maxSegmentName = -1;
   //开始遍历segment，检查segment
   for(int i=0;i<numSegments;i++) {
     final SegmentCommitInfo info = sis.info(i); //获取segment信息
     int segmentName = Integer.parseInt(info.info.name.substring(1), Character.MAX_RADIX);
     if (segmentName > result.maxSegmentName) {
       result.maxSegmentName = segmentName;
     }
     if (onlySegments != null && !onlySegments.contains(info.info.name)) {
       continue;
     }
     Status.SegmentInfoStatus segInfoStat = new Status.SegmentInfoStatus();
     result.segmentInfos.add(segInfoStat);
     //获取segments编号，名字，document个数，如下信息 1 of 7: name=_k docCount=18001
     msg(infoStream, "  " + (1+i) + " of " + numSegments + ": name=" + info.info.name + " docCount=" + info.info.getDocCount());
     segInfoStat.name = info.info.name;
     segInfoStat.docCount = info.info.getDocCount();
     final String version = info.info.getVersion();
     if (info.info.getDocCount() <= 0 && version != null && versionComparator.compare(version, "4.5") >= 0) {
       throw new RuntimeException("illegal number of documents: maxDoc=" + info.info.getDocCount());
     }
     int toLoseDocCount = info.info.getDocCount();
     AtomicReader reader = null;
     try {
       final Codec codec = info.info.getCodec(); //获取codec信息，如codec=Lucene46
       msg(infoStream, "    codec=" + codec);
       segInfoStat.codec = codec;
       msg(infoStream, "    compound=" + info.info.getUseCompoundFile());//获取复合文档格式标志位：compound=false
       segInfoStat.compound = info.info.getUseCompoundFile();
       msg(infoStream, "    numFiles=" + info.files().size());
       segInfoStat.numFiles = info.files().size(); //获取段内文件个数numFiles=10
       segInfoStat.sizeMB = info.sizeInBytes()/(1024.*1024.);//获取segment大小如size (MB)=0.493
       if (info.info.getAttribute(Lucene3xSegmentInfoFormat.DS_OFFSET_KEY) == null) {
         // don't print size in bytes if its a 3.0 segment with shared docstores
         msg(infoStream, "    size (MB)=" + nf.format(segInfoStat.sizeMB));
       }
       //获取诊断信息，diagnostics = {timestamp=1411221019346, os=Mac OS X, os.version=10.9.4, mergeFactor=10, 
       //source=merge, lucene.version=4.8-SNAPSHOT Unversioned directory - rcf - 2014-09-20 21:11:36, 
       //os.arch=x86_64, mergeMaxNumSegments=-1, java.version=1.7.0_60, java.vendor=Oracle Corporation}
       Map<String,String> diagnostics = info.info.getDiagnostics();
       segInfoStat.diagnostics = diagnostics;
       if (diagnostics.size() > 0) {
         msg(infoStream, "    diagnostics = " + diagnostics);
       }
       //判断是否有document删除，如输出no deletions 或者 has deletions [delFileName=_59ct_1b.del]
       if (!info.hasDeletions()) {
         msg(infoStream, "    no deletions");
         segInfoStat.hasDeletions = false;
       }
       else{
         msg(infoStream, "    has deletions [delGen=" + info.getDelGen() + "]");
         segInfoStat.hasDeletions = true;
         segInfoStat.deletionsGen = info.getDelGen();
       }
       //通过新建SegmentReader对象来检查是否能获取索引reader，如果扔出错误说明不能打开。例如输出test: open reader.........OK，
       if (infoStream != null)
         infoStream.print("    test: open reader.........");
       reader = new SegmentReader(info, DirectoryReader.DEFAULT_TERMS_INDEX_DIVISOR, IOContext.DEFAULT);
       msg(infoStream, "OK");
       segInfoStat.openReaderPassed = true;
       //通过checkIntegrity来检查文件的完整性，例如输出：test: check integrity.....OK
       //checkIntegrity函数是通过CodecUtil.checksumEntireFile()实现来检查文件的完整。
       if (infoStream != null)
         infoStream.print("    test: check integrity.....");
       reader.checkIntegrity();
       msg(infoStream, "OK");
       //检查document数量是否正确，如果有删除的document时候，通过reader.numDocs() 
       //== info.info.getDocCount() - info.getDelCount()以及统计以及检测livedocs的个数是否于reader.numDocs() 一致。
       //注意：没有删除的document时候，livedocs为null；
       //当没有删除的document时候，reader.maxDoc() == info.info.getDocCount()来检查是否一致。
       //输出结果比如：test: check live docs.....OK 
       //solr的管理界面可以显示： 现有document，删除的document以及所有的document数量，获取方法就是如下。
       if (infoStream != null)
         infoStream.print("    test: check live docs.....");
       final int numDocs = reader.numDocs();
       toLoseDocCount = numDocs;
       if (reader.hasDeletions()) {
         if (reader.numDocs() != info.info.getDocCount() - info.getDelCount()) {
           throw new RuntimeException("delete count mismatch: info=" + (info.info.getDocCount() - info.getDelCount()) + " vs reader=" + reader.numDocs());
         }
         if ((info.info.getDocCount()-reader.numDocs()) > reader.maxDoc()) {
           throw new RuntimeException("too many deleted docs: maxDoc()=" + reader.maxDoc() + " vs del count=" + (info.info.getDocCount()-reader.numDocs()));
         }
         if (info.info.getDocCount() - numDocs != info.getDelCount()) {
           throw new RuntimeException("delete count mismatch: info=" + info.getDelCount() + " vs reader=" + (info.info.getDocCount() - numDocs));
         }
         Bits liveDocs = reader.getLiveDocs();
         if (liveDocs == null) {
           throw new RuntimeException("segment should have deletions, but liveDocs is null");
         } else {
           int numLive = 0;
           for (int j = 0; j < liveDocs.length(); j++) {
             if (liveDocs.get(j)) {
               numLive++;
             }
           }
           if (numLive != numDocs) {
             throw new RuntimeException("liveDocs count mismatch: info=" + numDocs + ", vs bits=" + numLive);
           }
         }
         segInfoStat.numDeleted = info.info.getDocCount() - numDocs;
         msg(infoStream, "OK [" + (segInfoStat.numDeleted) + " deleted docs]");
       } else {
         if (info.getDelCount() != 0) {
           throw new RuntimeException("delete count mismatch: info=" + info.getDelCount() + " vs reader=" + (info.info.getDocCount() - numDocs));
         }
         Bits liveDocs = reader.getLiveDocs();
         if (liveDocs != null) {
           // its ok for it to be non-null here, as long as none are set right?
           // 这里好像有点问题，当delete document不存在时候，liveDocs应该为null。
           for (int j = 0; j < liveDocs.length(); j++) {
             if (!liveDocs.get(j)) {
               throw new RuntimeException("liveDocs mismatch: info says no deletions but doc " + j + " is deleted.");
             }
           }
         }
         msg(infoStream, "OK");
       }
       if (reader.maxDoc() != info.info.getDocCount()) {
         throw new RuntimeException("SegmentReader.maxDoc() " + reader.maxDoc() + " != SegmentInfos.docCount " + info.info.getDocCount());
       }
       // Test getFieldInfos()
       // 获取域状态以及数量 如：test: fields..............OK [3 fields]
       if (infoStream != null) {
         infoStream.print("    test: fields..............");
       }         
       FieldInfos fieldInfos = reader.getFieldInfos();
       msg(infoStream, "OK [" + fieldInfos.size() + " fields]");
       segInfoStat.numFields = fieldInfos.size();
       // Test Field Norms
       // 获取Field Norms的状态以及数量 test: field norms.........OK [1 fields]
       segInfoStat.fieldNormStatus = testFieldNorms(reader, infoStream);
       // Test the Term Index
       // 获取Field Index的状态以及数量 test: terms, freq, prox...OK [36091 terms; 54003 terms/docs pairs; 18001 tokens]
       segInfoStat.termIndexStatus = testPostings(reader, infoStream, verbose);
       // Test Stored Fields
       // 获取Stored Field 的状态 test: stored fields.......OK [54003 total field count; avg 3 fields per doc]
       segInfoStat.storedFieldStatus = testStoredFields(reader, infoStream);
       // Test Term Vectors
       // 获取Term Field 的状态 test: stored fields.......OK [54003 total field count; avg 3 fields per doc]
       segInfoStat.termVectorStatus = testTermVectors(reader, infoStream, verbose, crossCheckTermVectors);
    // 获取Doc Value 的状态 test: docvalues...........OK [0 docvalues fields; 0 BINARY; 0 NUMERIC; 0 SORTED; 0 SORTED_SET]
       segInfoStat.docValuesStatus = testDocValues(reader, infoStream);
       // Rethrow the first exception we encountered
       //  This will cause stats for failed segments to be incremented properly
       if (segInfoStat.fieldNormStatus.error != null) {
         throw new RuntimeException("Field Norm test failed");
       } else if (segInfoStat.termIndexStatus.error != null) {
         throw new RuntimeException("Term Index test failed");
       } else if (segInfoStat.storedFieldStatus.error != null) {
         throw new RuntimeException("Stored Field test failed");
       } else if (segInfoStat.termVectorStatus.error != null) {
         throw new RuntimeException("Term Vector test failed");
       }  else if (segInfoStat.docValuesStatus.error != null) {
         throw new RuntimeException("DocValues test failed");
       }
       msg(infoStream, "");
     } catch (Throwable t) {
       msg(infoStream, "FAILED");
       String comment;
       comment = "fixIndex() would remove reference to this segment";
       msg(infoStream, "    WARNING: " + comment + "; full exception:");
       if (infoStream != null)
         t.printStackTrace(infoStream);
       msg(infoStream, "");
       result.totLoseDocCount += toLoseDocCount;
       result.numBadSegments++;
       continue;
     } finally {
       if (reader != null)
         reader.close();
     }
     // Keeper
     result.newSegments.add(info.clone());
   }
   if (0 == result.numBadSegments) {
     result.clean = true;
   } else
     msg(infoStream, "WARNING: " + result.numBadSegments + " broken segments (containing " + result.totLoseDocCount + " documents) detected");
   if ( ! (result.validCounter = (result.maxSegmentName < sis.counter))) {
     result.clean = false;
     result.newSegments.counter = result.maxSegmentName + 1; 
     msg(infoStream, "ERROR: Next segment name counter " + sis.counter + " is not greater than max segment name " + result.maxSegmentName);
   }
   if (result.clean) {
     msg(infoStream, "No problems were detected with this index.\n");
   }
   return result;
 }
```

其中关于testFieldNorms这几个的源码明天继续学习
