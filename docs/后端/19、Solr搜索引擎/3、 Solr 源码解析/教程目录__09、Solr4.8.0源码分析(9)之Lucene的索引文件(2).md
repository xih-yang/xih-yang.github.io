# 09、Solr4.8.0源码分析(9)之Lucene的索引文件(2)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/9.html
- 分类：搜索引擎
- 分组：教程目录
## Segments_N文件

一个索引对应一个目录，索引文件都存放在目录里面。Solr的索引文件存放在Solr/Home下的core/data/index目录中，一个core对应一个索引。

Segments_N例举了索引所有有效的segments信息以及删除的具体信息，一个索引可以有多个Segments_N，但是有效的往往总是N最大的那个，为什么会出现多个segments_N，主要是由于暂时无法删除它们或者有indexwriter在进行commit操作，又或者`IndexDeletionPolicy` 在进行。Segments_N的代码主要在Segmentsinfos.java里面。

### 1.1 Segments_N的选取

如何选择Segments_N文件进行读取：

- 遍历索引目录内以Segments开头但是不是Segments_gen的文件，取出最大的N作为genA。

```java
String[] files = null;
long genA = -1;
files = directory.listAll();  
if (files != null) {
      genA = getLastCommitGeneration(files);
}
...
```

```java
public static long getLastCommitGeneration(String[] files) {
  if (files == null) {
    return -1;
  }
  long max = -1;
  for (String file : files) {
    if (file.startsWith(IndexFileNames.SEGMENTS) && !file.equals(IndexFileNames.SEGMENTS_GEN)) {
      long gen = generationFromSegmentsFileName(file);
      if (gen > max) {
        max = gen;
      }
    }
  }
  return max;
}
```

- 打开segments.gen，其中保存了当前的N值。其格式如下，读出版本号(Version)，然后再读出两个N，如果两者相等，则作为genB。

```java
long genB = -1;
ChecksumIndexInput genInput = null;
try {
       genInput = directory.openChecksumInput(IndexFileNames.SEGMENTS_GEN, IOContext.READONCE);
} catch (IOException e) {
...
int version = genInput.readInt();
long gen0 = genInput.readLong();
long gen1 = genInput.readLong();
if (gen0 == gen1) {
          genB = gen0;
   }
```

在上述得到的genA和genB中选择最大的那个作为当前的N，方才打开segments_N文件

1gen = Math.max(genA, genB);

### 1.2 Segments_N的结构

Segment的结构：

**Header, Version, NameCounter, SegCount, SegCount, CommitUserData, Footer**

其中表示一个段的信息，SegCount表示段的数量，所以

SegCount 表示这样的SegCount个段连在一起。

- head：head是一个CodecHeader，包含了Magic,CodecName,Version三部分。

Magic是一个开始表示符，通常情况下为1071082519.

CodecName是文件的标识符

Version索引文件版本信息，当用某个版本号的IndexReader读取另一个版本号生成的索引的时候，会因为此值不同而报错。

```java
public static int checkHeader(DataInput in, String codec, int minVersion, int maxVersion)
  throws IOException {
  // Safety to guard against reading a bogus string:
  final int actualHeader = in.readInt();   //读取Magic
  if (actualHeader != CODEC_MAGIC) {
    throw new CorruptIndexException("codec header mismatch: actual header=" + actualHeader + " vs expected header=" + CODEC_MAGIC + " (resource: " + in + ")");
  }
  return checkHeaderNoMagic(in, codec, minVersion, maxVersion); //读取CodecName和Version，并判断
}
```

- Version：
- 索引的版本号，记录了IndexWriter将修改提交到索引文件中的次数
- 其初始值大多数情况下从索引文件里面读出。
- 我们并不关心IndexWriter将修改提交到索引的具体次数，而更关心到底哪个是最新的。IndexReader中常比较自己的version和索引文件中的version是否相同来判断此IndexReader被打开后，还有没有被IndexWriter更新。

```java
public boolean isCurrent() throws IOException {
ensureOpen();
if (writer == null || writer.isClosed()) {
  // Fully read the segments file: this ensures that it's
  // completely written so that if
  // IndexWriter.prepareCommit has been called (but not
  // yet commit), then the reader will still see itself as
  // current:
  SegmentInfos sis = new SegmentInfos();
  sis.read(directory);
  // we loaded SegmentInfos from the directory
  return sis.getVersion() == segmentInfos.getVersion();
} else {
  return writer.nrtIsCurrent(segmentInfos);
}
```

- NameCount
- 是下一个新段(Segment)的段名。
- 所有属于同一个段的索引文件都以段名作为文件名，一般为_0.xxx, _0.yyy, _1.xxx, _1.yyy ……
- 新生成的段的段名一般为原有最大段名加一。
- SegCount
- 段(Segment)的个数。
- SegCount个段的元数据信息：
- SegName：段名，所有属于同一个段的文件都有以段名作为文件名。
- SegCodec：编码segment的codec名字
- del文件的版本号

Lucene中，在optimize之前，删除的文档是保存在.del文件中的。
- DelGen是每当IndexWriter向索引文件中提交删除操作的时候，加1，并生成新的.del文件
- 如果该值设为-1表示没有删除的document

DeletionCount：本segment删除的documents个数

FieldInfosGen：segment中域文件的版本信息，如果该值为-1表示对域文件未有更新操作，如果大于0表示有更新操作

UpdatesFiles：存储本segment更新的文件列表

CommitUserData：

Footer：codec编码的结尾，包含了检验和以及检验算法ID

### 1.3 read()

可以通过查看read()函数来对照Segment_N的格式

```java
public final void read(Directory directory, String segmentFileName) throws IOException {
boolean success = false;
// Clear any previous segments:
this.clear();
//获取现在的segment代号，即Segment_N的N值
generation = generationFromSegmentsFileName(segmentFileName);
lastGeneration = generation;
//获取检验和
ChecksumIndexInput input = directory.openChecksumInput(segmentFileName, IOContext.READ);
try {
  //获取Header的Magic一般情况下为1071082519 ，Header由Magic，Codecname以及Version组成
  final int format = input.readInt();       
  final int actualFormat;
  if (format == CodecUtil.CODEC_MAGIC) {
    // 4.0+ 获取Header的Codecname信息
    actualFormat = CodecUtil.checkHeaderNoMagic(input, "segments", VERSION_40, VERSION_48);
    version = input.readLong();         //获取Header的version信息
    counter = input.readInt();          //获取NameCount，即下一段新的段名
    int numSegments = input.readInt();  //获取segment个数
    if (numSegments < 0) {
      throw new CorruptIndexException("invalid segment count: " + numSegments + " (resource: " + input + ")");
    }
    //遍历SegCount个的段数据
    for(int seg=0;seg<numSegments;seg++) {
      String segName = input.readString();                  //SegName
      Codec codec = Codec.forName(input.readString());      //SegCodec
      //System.out.println("SIS.read seg=" + seg + " codec=" + codec);
      SegmentInfo info = codec.segmentInfoFormat().getSegmentInfoReader().read(directory, segName, IOContext.READ);
      info.setCodec(codec);
      long delGen = input.readLong();                       //DelGen
      int delCount = input.readInt();                       //DeletionCount
      if (delCount < 0 || delCount > info.getDocCount()) {
        throw new CorruptIndexException("invalid deletion count: " + delCount + " vs docCount=" + info.getDocCount() + " (resource: " + input + ")");
      }
      long fieldInfosGen = -1;
      if (actualFormat >= VERSION_46) {
        fieldInfosGen = input.readLong();                   //FieldInfosGen
      }
      SegmentCommitInfo siPerCommit = new SegmentCommitInfo(info, delCount, delGen, fieldInfosGen);
      if (actualFormat >= VERSION_46) {
        //UpdatesFiles 首先读取UpdatesFiles的个数，如果等于0则后续接着没有更新的文件，
        //否则就获取所有numGensUpdatesFiles个文件并写入SegmentCommitInfo中。
        int numGensUpdatesFiles = input.readInt();          
        final Map<Long,Set<String>> genUpdatesFiles;
        if (numGensUpdatesFiles == 0) {
          genUpdatesFiles = Collections.emptyMap();
        } else {
          genUpdatesFiles = new HashMap<>(numGensUpdatesFiles);
          for (int i = 0; i < numGensUpdatesFiles; i++) {
            genUpdatesFiles.put(input.readLong(), input.readStringSet());
          }
        }
        siPerCommit.setGenUpdatesFiles(genUpdatesFiles);
      }
      add(siPerCommit);
    }
    userData = input.readStringStringMap();                  //CommitUserData
  } else {
    actualFormat = -1;
    Lucene3xSegmentInfoReader.readLegacyInfos(this, directory, input, format);
    Codec codec = Codec.forName("Lucene3x");
    for (SegmentCommitInfo info : this) {
      info.info.setCodec(codec);
    }
  }
  //Footer
  if (actualFormat >= VERSION_48) {
    CodecUtil.checkFooter(input);
  } else {
    final long checksumNow = input.getChecksum();
    final long checksumThen = input.readLong();
    if (checksumNow != checksumThen) {
      throw new CorruptIndexException("checksum mismatch in segments file (resource: " + input + ")");
    }
    CodecUtil.checkEOF(input);
  }
  success = true;
} finally {
  if (!success) {
    // Clear any segment infos we had loaded so we
    // have a clean slate on retry:
    this.clear();
    IOUtils.closeWhileHandlingException(input);
  } else {
    input.close();
  }
}
}
```

```java
SegmentInfo info = codec.segmentInfoFormat().getSegmentInfoReader().read(directory, segName, IOContext.READ);
```

前文Solr4.8.0源码分析(7)之Solr SPI 中讲到，Solr会从看resources/META-INF/services/org.apache.lucene.codecs.Codec中读取相应版本的Codec，在solrconfg.xml中配置4.8，那么solr会去获取org.apache.lucene.codecs.lucene46.Lucene46Codec。所以上面代码的codec其实是Lucene46Codec，segmentInfoFormat返回的是Lucene46SegmentInfoFormat。由此可见在读取segment_N时候，Solr也会取读取每一个Segment的信息(.si).

```java
private final StoredFieldsFormat fieldsFormat = new Lucene41StoredFieldsFormat();
private final TermVectorsFormat vectorsFormat = new Lucene42TermVectorsFormat();
private final FieldInfosFormat fieldInfosFormat = new Lucene46FieldInfosFormat();
private final SegmentInfoFormat segmentInfosFormat = new Lucene46SegmentInfoFormat();
private final LiveDocsFormat liveDocsFormat = new Lucene40LiveDocsFormat();
```

对照read()和write()，基本上可以看出write是read是逆过程。

read的过程首要保证的是我们读到的segment是最新的。read()是个不停循环尝试读取最新segmentinfo的过程，如果发生IOException则说明此时正在进行commit操作，那么这个时候获取的segment信息就不是最新的。Lucene提供三种方法来尝试获取最新的segment信息：

**1、** 首先就是前文提到的获取最大的gen(generation)，当尝试两次之后，如果最大的gen大于lastgen说明segment信息已经更新，否则说明没有更新或者该方法不适用所以转入第二这种方法；

**2、** 如果第一种方法失败，则直接gen++，即直接去解析下一个gen的segment_N文件；

**3、** 如果解析失败，则进行gen的回退，gen--，尝试解析该gen的segment_N文件，即segment信息并未更新；

### 1.4 write()

write的过程跟read()是相反，这里主要想了解下SegmentCommitInfo与genUpdatesFiles。

首先看下write的调用关系：commit操作分为两部分prepareCommit和finishcommit。prepareCommit调用write将新的Segment_N，之后在finishcommit中进行真正的commit操作，如果操作失败就进行回归。commit成功后再把gen信息写入segment.gen.

```java
final void prepareCommit(Directory dir) throws IOException {
  if (pendingSegnOutput != null) {
    throw new IllegalStateException("prepareCommit was already called");
  }
  write(dir);
}
```

```java
for (SegmentCommitInfo siPerCommit : this) {
        SegmentInfo si = siPerCommit.info;
        segnOutput.writeString(si.name);
        segnOutput.writeString(si.getCodec().getName());
        segnOutput.writeLong(siPerCommit.getDelGen());
        int delCount = siPerCommit.getDelCount();
        if (delCount < 0 || delCount > si.getDocCount()) {
          throw new IllegalStateException("cannot write segment: invalid docCount segment=" + si.name + " docCount=" + si.getDocCount() + " delCount=" + delCount);
        }
        segnOutput.writeInt(delCount);
        segnOutput.writeLong(siPerCommit.getFieldInfosGen());
        final Map<Long,Set<String>> genUpdatesFiles = siPerCommit.getUpdatesFiles();
        segnOutput.writeInt(genUpdatesFiles.size());
        for (Entry<Long,Set<String>> e : genUpdatesFiles.entrySet()) {
          segnOutput.writeLong(e.getKey());
          segnOutput.writeStringSet(e.getValue());
        }
...
}
```

在finishcommit中主要完成三个操作，

**1、** 在Segment_N中加入footer，如果加入失败则进行回滚；

**2、** 调用Directory.syc()将所有的writer写入磁盘，如果写入失败则进行回滚；

**3、** 生成segment_gen；

在prepareCommit和finishcommit过程中间会出现一个IndexOutput流 pendingSegnOutput 负责将当前commit时的Sgementinfos的状态写入到Segment_N中，它只存在prepareCommit和finishcommit之间，在其他时候为null。

至此，基本上对Segmentinfos.java这个类有了初步的了解，以及对Segment_N以及Segment_gen的结构理解。但是到这里我还是有点疑问：Segment_N结构每一个segment段信息中有个updatefiles，它到底有啥用处，留着以后再回过头来学习。
