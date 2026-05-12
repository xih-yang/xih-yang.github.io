# 26、Rowkey（行键）设计
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/26.html
- 分类：大数据框架
- 分组：教程目录
本节介绍了 HBase 中的行键（Rowkey）设计。

## Hotspotting

HBase 中的行按行键按顺序排序。这种设计优化了扫描（scan），允许您将相关的行或彼此靠近的行一起读取。但是，设计不佳的行键是 hotspotting 的常见来源。当大量客户端通信针对群集中的一个节点或仅少数几个节点时，会发生 Hotspotting。此通信量可能表示读取、写入或其他操作。通信量压倒负责托管该区域的单个机器，从而导致性能下降并可能导致区域不可用性。这也会对由同一台区域服务器托管的其他区域产生不利影响，因为该主机无法为请求的负载提供服务。设计数据访问模式以使群集得到充分和均匀利用非常重要。

为了防止 hotspotting 写入，请设计行键，使真正需要在同一个区域中的行成为行，但是从更大的角度来看，数据将被写入整个群集中的多个区域，而不是一次。以下描述了避免 hotspotting 的一些常用技术，以及它们的一些优点和缺点。

### Salting

从这个意义上说，Salting 与密码学无关，而是指将随机数据添加到行键的开头。在这种情况下，salting 是指为行键添加一个随机分配的前缀，以使它的排序方式与其他方式不同。可能的前缀数量对应于要传播数据的区域数量。如果你有一些“hotspotting”行键模式，反复出现在其他更均匀分布的行中，那么 Salting 可能会有帮助。请考虑以下示例，该示例显示 salting 可以跨多个 RegionServer 传播写入负载，并说明读取的一些负面影响。

使用实例

假设您有以下的行键列表，并且您的表格被拆分，以便字母表中的每个字母都有一个区域。前缀’a’是一个区域，前缀’b’是另一个区域。在此表中，所有以’f’开头的行都在同一个区域中。本示例重点关注具有以下键的行：

```java
foo0001
foo0002
foo0003
foo0004
```

现在，想象你想要在四个不同的地区传播这些信息。您决定使用四个不同的 Salting：a，b，c 和 d。在这种情况下，每个这些字母前缀将位于不同的区域。应用 Salting 后，您可以使用以下 rowkeys。由于您现在可以写入四个不同的区域，因此理论上写入时的吞吐量是吞吐量的四倍，如果所有写入操作都在同一个区域，则会有这样的吞吐量。

```java
A-foo0003
B-foo0001
C-foo0004
d-foo0002
```

然后，如果添加另一行，它将随机分配四种可能的 Salting 值中的一种，并最终靠近现有的一行。

```java
A-foo0003
B-foo0001
C-foo0003
C-foo0004
d-foo0002
```

由于这个任务是随机的，如果你想按字典顺序检索行，你需要做更多的工作。以这种方式，Salting 试图增加写入吞吐量，但在读取期间会产生成本。

### Hashing

除了随机分配之外，您可以使用单向 Hashing，这会导致给定的行总是被相同的前缀“salted”，其方式会跨 RegionServer 传播负载，但允许在读取期间进行预测。使用确定性 Hashing 允许客户端重建完整的 rowkey 并使用 Get 操作正常检索该行。

Hashing 示例

考虑到上述 salting 示例中的相同情况，您可以改为应用单向 Hashing，这会导致带有键的行 foo0003 始终处于可预见的状态并接收 a 前缀。

然后，为了检索该行，您已经知道了密钥。

例如，您也可以优化事物，以便某些键对总是在相同的区域中。

反转关键

防止热点的第三种常用技巧是反转固定宽度或数字行键，以便最经常（最低有效位数）改变的部分在第一位。这有效地使行键随机化，但牺牲了行排序属性。

## 单调递增行键/时间序列数据

在Tom White 的书“Hadoop: The Definitive Guide”（O’Reilly）的一章中，有一个优化笔记，关注一个现象，即导入过程与所有客户一起敲击表中的一个区域（并且因此是单个节点），然后移动到下一个区域等等。随着单调递增的行键（即，使用时间戳），这将发生。通过将输入记录随机化为不按排序顺序排列，可以缓解由单调递增密钥带来的单个区域上的堆积，但通常最好避免使用时间戳或序列（例如1，2，3）作为行键。

如果您确实需要将时间序列数据上传到 HBase 中，则应将 OpenTSDB 作为一个成功的示例进行研究。它有一个描述它在 HBase 中使用的模式的页面。OpenTSDB 中的关键格式实际上是 [metric_type] [event_timestamp]，它会在第一眼看起来与之前关于不使用时间戳作为关键的建议相矛盾。但是，区别在于时间戳不在密钥的主导位置，并且设计假设是有几十个或几百个（或更多）不同的度量标准类型。因此，即使连续输入数据和多种度量类型，Puts也会分布在表中不同的地区。

## 尽量减少行和列的大小

在HBase 中，值总是随着坐标而运行；当单元格值通过系统时，它将始终伴随其行，列名称和时间戳。如果你的行和列的名字很大，特别是与单元格的大小相比，那么你可能会遇到一些有趣的场景。其中之一就是 Marc Limotte 在 HBASE-3551 尾部描述的情况。其中，保存在 HBase商店文件（ StoreFile（HFile））以方便随机访问可能最终占用 HBase 分配的 RAM 的大块，因为单元值坐标很大。上面引用的注释中的标记建议增加块大小，以便存储文件索引中的条目以更大的间隔发生，或者修改表模式，以便使用较小的行和列名称。压缩也会使更大的指数。在用户邮件列表中查看线程问题 storefileIndexSize。

大多数时候，小的低效率并不重要。不幸的是，这是他们的情况。无论为 ColumnFamilies，属性和 rowkeys 选择哪种模式，都可以在数据中重复数十亿次。

### 列族

尽量保持 ColumnFamily 名称尽可能小，最好是一个字符（例如，”d” 用于 data 或者 default）。

### 属性

虽然详细的属性名称（例如，“myVeryImportantAttribute”）更易于阅读，但更喜欢使用较短的属性名称（例如，“via”）来存储在 HBase 中。

### Rowkey长度

保持它们尽可能短，这样它们仍然可以用于所需的数据访问（例如，Get 和 Scan）。对数据访问无用的短密钥并不比具有更好的 get/scan 属性的更长密钥更好。在设计行键时需要权衡。

### 字节模式

长为8个字节。您可以在这八个字节中存储最多18,446,744,073,709,551,615的未签名数字。如果您将此数字作为字符串存储 – 假定每个字符有一个字节 – 则需要接近3倍的字节。

以下是您可以自行运行的一些示例代码：

```java
// long
//
long l = 1234567890L;
byte[] lb = Bytes.toBytes(l);
System.out.println("long bytes length: " + lb.length);   // returns 8
String s = String.valueOf(l);
byte[] sb = Bytes.toBytes(s);
System.out.println("long as string length: " + sb.length);    // returns 10
// hash
//
MessageDigest md = MessageDigest.getInstance("MD5");
byte[] digest = md.digest(Bytes.toBytes(s));
System.out.println("md5 digest bytes length: " + digest.length);    // returns 16
String sDigest = new String(digest);
byte[] sbDigest = Bytes.toBytes(sDigest);
System.out.println("md5 digest as string length: " + sbDigest.length);    // returns 26
```

不幸的是，使用类型的二进制表示会使您的数据难以在代码之外读取。例如，这是您在增加值时在 shell 中将看到的内容：

```java
hbase(main):001:0> incr 't', 'r', 'f:q', 1
COUNTER VALUE = 1
hbase(main):002:0> get 't', 'r'
COLUMN                                        CELL
 f:q                                          timestamp=1369163040570, value=\x00\x00\x00\x00\x00\x00\x00\x01
1 row(s) in 0.0310 seconds
```

shell 会尽最大努力打印一个字符串，并且它决定只打印十六进制。区域名称内的行键也会发生同样的情况。如果您知道存储的内容可能没问题，但如果可以将任意数据放入同一个单元格中，它可能也是不可读的。这是主要的权衡。

## 反向时间戳

### 反向扫描 API

HBASE-4811 实现一个 API，以反向扫描表中的表或区域，从而减少了为正向或反向扫描优化模式的需要。此功能在 HBase 0.98 和更高版本中可用。

数据库处理中的一个常见问题是快速找到最新版本的值。使用反向时间戳作为密钥的一部分的技术可以帮助解决这个问题的一个特例。在 Tom White 的书籍“Hadoop：The Definitive Guide（O’Reilly）”的 HBase 章节中也有介绍，该技术包括附加 Long.MAX_VALUE – timestamp 到任何密钥的末尾（例如，[key][reverse_timestamp]）。

通过执行 Scan [key] 并获取第一条记录，可以找到表格中 [key] 的最新值。由于 HBase 密钥的排序顺序不同，因此该密钥在 [key] 的任何较旧的行键之前排序，因此是第一个。

这种技术将被用来代替使用版本号，其意图是永久保存所有版本（或者很长时间），同时通过使用相同的扫描技术来快速获得对任何其他版本的访问。

## Rowkeys和ColumnFamilies

行键的范围为 ColumnFamilies。因此，相同的 rowkey 可以存在于没有碰撞的表中存在的每个 ColumnFamily 中。

## Rowkeys的不变性

行键无法更改。他们可以在表格中“更改”的唯一方法是该行被删除然后重新插入。这是 HBase dist-list 上的一个相当常见的问题，所以在第一次（或在插入大量数据之前）获得 rowkeys 是值得的。

## RowKeys与区域分割之间的关系

如果您预先拆分表格，了解您的 rowkey 如何在区域边界上分布是非常重要的。作为重要的一个例子，考虑使用可显示的十六进制字符作为键的前导位置（例如，“0000000000000000” 到 “ffffffffffffffff”）的示例。通过这些关键范围 Bytes.split（这是在 Admin.createTable(byte[] startKey, byte[] endKey, numRegions) 为10个区域创建区域时使用的分割策略）将生成以下分割：

```java
48 48 48 48 48 48 48 48 48 48 48 48 48 48 48 48 // 0
54 -10 -10 -10 -10 -10 -10 -10 -10 -10 -10 -10 -10 -10 -10 // 6
61 = 67 -67 -67 -67 -67 -67 -67 -67 -67 -67 -67 -67 -67 -68 // =
68 -124 -124 -124 -124 -124 -124 -124 -124 -124 -124 -124 -124 -124 -124 -126 // D
75 75 75 75 75 75 75 75 75 75 75 75 75 75 75 72 // K
82 18 18 18 18 18 18 18 18 18 18 18 18 18 18 14 // R
88 -40 -40 -40 -40 -40 -40 -40 -40 -40 -40 -40 -40 -40 -40 -44 // X
95 -97 -97 -97 -97 -97 -97 -97 -97 -97 -97 -97 -97 -97 -97 -102 // _
102 102 102 102 102 102 102 102 102 102 102 102 102 102 102 102 // f
```

（注意：前导字节作为注释列在右侧。）鉴于第一个分割是’0’而最后一个分割是’f’，一切都很好，但是还没有结束。

其中的问题是，所有的数据都会堆积在前两个区域和最后一个区域，从而产生一个“块状（lumpy）”（也可能是“hot”）区域问题。’0’是字节48，’f’是字节102，但字节值（字节58到96）之间存在巨大的差距，永远不会出现在这个密钥空间中，因为唯一的值是 [0-9] 和 [af]。因此，中间地区将永远不会被使用。要使用此示例键空间进行预分割工作，需要分割的自定义定义（即，不依赖于内置拆分方法）。

第1课：预分割表通常是最佳做法，但您需要预先拆分它们，以便可以在密钥空间中访问所有区域。虽然此示例演示了十六进制密钥空间的问题，但任何密钥空间都会出现同样的问题。了解你的数据。

第2课：尽管通常不可取，但只要所有创建的区域都可在密钥空间中访问，则使用十六进制键（更一般而言，可显示的数据）仍可用于预分割表。

为了总结这个例子，以下是如何为十六进制密钥预先创建恰当的分割的例子：

```java
public static boolean createTable(Admin admin, HTableDescriptor table, byte[][] splits)
throws IOException {
  try {
    admin.createTable( table, splits );
    return true;
  } catch (TableExistsException e) {
    logger.info("table " + table.getNameAsString() + " already exists");
    // the table already exists...
    return false;
  }
}
public static byte[][] getHexSplits(String startKey, String endKey, int numRegions) {
  byte[][] splits = new byte[numRegions-1][];
  BigInteger lowestKey = new BigInteger(startKey, 16);
  BigInteger highestKey = new BigInteger(endKey, 16);
  BigInteger range = highestKey.subtract(lowestKey);
  BigInteger regionIncrement = range.divide(BigInteger.valueOf(numRegions));
  lowestKey = lowestKey.add(regionIncrement);
  for(int i=0; i < numRegions-1;i++) {
    BigInteger key = lowestKey.add(regionIncrement.multiply(BigInteger.valueOf(i)));
    byte[] b = String.format("%016x", key).getBytes();
    splits[i] = b;
  }
  return splits;
}
```
