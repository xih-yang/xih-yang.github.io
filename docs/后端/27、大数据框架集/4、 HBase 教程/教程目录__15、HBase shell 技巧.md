# 15、HBase shell 技巧
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/15.html
- 分类：大数据框架
- 分组：教程目录
## shell 技巧

### 表变量

HBase 0.95 版本增加了为表提供 jruby 风格的面向对象引用的 shell 命令。以前，作用于表的所有 shell 命令都具有程序风格，该风格始终将表的名称作为参数。HBase 0.95 引入了将表分配给 jruby 变量的功能。表引用可以用来执行数据读写操作，比如放入、扫描、以及管理功能（如禁用，删除，描述表等）。

例如，以前你总是会指定一个表名：

```java
hbase(main):000:0> create ‘t’, ‘f’
0 row(s) in 1.0970 seconds
hbase(main):001:0> put 't', 'rold', 'f', 'v'
0 row(s) in 0.0080 seconds
hbase(main):002:0> scan 't'
ROW                                COLUMN+CELL
 rold                              column=f:, timestamp=1378473207660, value=v
1 row(s) in 0.0130 seconds
hbase(main):003:0> describe 't'
DESCRIPTION                                                                           ENABLED
 't', {NAME => 'f', DATA_BLOCK_ENCODING => 'NONE', BLOOMFILTER => 'ROW', REPLICATION_ true
 SCOPE => '0', VERSIONS => '1', COMPRESSION => 'NONE', MIN_VERSIONS => '0', TTL => '2
 147483647', KEEP_DELETED_CELLS => 'false', BLOCKSIZE => '65536', IN_MEMORY => 'false
 ', BLOCKCACHE => 'true'}
1 row(s) in 1.4430 seconds
hbase(main):004:0> disable 't'
0 row(s) in 14.8700 seconds
hbase(main):005:0> drop 't'
0 row(s) in 23.1670 seconds
hbase(main):006:0>
```

现在，您可以将该表分配给一个变量，并在 jruby shell 代码中使用结果。

```java
hbase(main):007 > t = create 't', 'f'
0 row(s) in 1.0970 seconds
=> Hbase::Table - t
hbase(main):008 > t.put 'r', 'f', 'v'
0 row(s) in 0.0640 seconds
hbase(main):009 > t.scan
ROW                           COLUMN+CELL
 r                            column=f:, timestamp=1331865816290, value=v
1 row(s) in 0.0110 seconds
hbase(main):010:0> t.describe
DESCRIPTION                                                                           ENABLED
 't', {NAME => 'f', DATA_BLOCK_ENCODING => 'NONE', BLOOMFILTER => 'ROW', REPLICATION_ true
 SCOPE => '0', VERSIONS => '1', COMPRESSION => 'NONE', MIN_VERSIONS => '0', TTL => '2
 147483647', KEEP_DELETED_CELLS => 'false', BLOCKSIZE => '65536', IN_MEMORY => 'false
 ', BLOCKCACHE => 'true'}
1 row(s) in 0.0210 seconds
hbase(main):038:0> t.disable
0 row(s) in 6.2350 seconds
hbase(main):039:0> t.drop
0 row(s) in 0.2340 seconds
```

如果该表已被创建，则可以使用 get_table 方法将一个表分配给一个变量：

```java
hbase(main):011 > create 't','f'
0 row(s) in 1.2500 seconds
=> Hbase::Table - t
hbase(main):012:0> tab = get_table 't'
0 row(s) in 0.0010 seconds
=> Hbase::Table - t
hbase(main):013:0> tab.put ‘r1’ ,’f’, ‘v’
0 row(s) in 0.0100 seconds
hbase(main):014:0> tab.scan
ROW                                COLUMN+CELL
 r1                                column=f:, timestamp=1378473876949, value=v
1 row(s) in 0.0240 seconds
hbase(main):015:0>
```

列表功能也已被扩展，以便它返回一个表名称作为字符串的列表。然后，您可以使用 jruby 根据这些名称对表操作进行脚本编写。list_snapshots 命令的作用也相似。

```java
hbase(main):016 > tables = list(‘t.*’)
TABLE
t
1 row(s) in 0.1040 seconds
=> #<#<Class:0x7677ce29>:0x21d377a4>
hbase(main):017:0> tables.map { |t| disable t ; drop  t}
0 row(s) in 2.2510 seconds
=> [nil]
hbase(main):018:0>
```

#### irbrc

在您的主目录中为自己创建一个 .irbrc 文件，添加自定义项。一个有用的是历史记录命令，因此命令可以跨 Shell 调用进行保存：

```java
$ more .irbrc
require 'irb/ext/save-history'
IRB.conf[:SAVE_HISTORY] = 100
IRB.conf[:HISTORY_FILE] = "#{ENV['HOME']}/.irb-save-history"
```

请参阅.irbrc 的 ruby 文档以了解其他可能的配置。

### 将数据记录到时间戳

要将日期“08/08/16 20:56:29”从 hbase 日志转换为时间戳，请执行以下操作：

```java
hbase(main):021:0> import java.text.SimpleDateFormat
hbase(main):022:0> import java.text.ParsePosition
hbase(main):023:0> SimpleDateFormat.new("yy/MM/dd HH:mm:ss").parse("08/08/16 20:56:29", ParsePosition.new(0)).getTime() => 1218920189000
```

从走另一个方向：

```java
hbase(main):021:0> import java.util.Date
hbase(main):022:0> Date.new(1218920189000).toString() => "Sat Aug 16 20:56:29 UTC 2008"
```

以与HBase 日志格式完全相同的格式输出将会对 SimpleDateFormat 产生一些影响。

### 查询 Shell 配置

```java
hbase(main):001:0> @shell.hbase.configuration.get("hbase.rpc.timeout")
=> "60000"
```

在shell 中设置一个配置：

```java
hbase(main):005:0> @shell.hbase.configuration.setInt("hbase.rpc.timeout", 61010)
hbase(main):006:0> @shell.hbase.configuration.get("hbase.rpc.timeout")
=> "61010"
```

### 使用 HBase Shell 预分割表

在通过HBase Shell 的 create 命令创建表时，您可以使用各种选项预先拆分表。

最简单的方法是在创建表格时指定一个分割点数组。请注意，当将字符串文字指定为分割点时，这些将根据字符串的基础字节表示创建分割点。所以当指定分割点“10”时，我们实际上是指定了字节分割点“\x31\30”。

分割点将定义 n+1 区域，其中 n 是分割点的数量。最低的区域将包含从最低可能的键直到但不包括第一分割点密钥的所有密钥。下一个区域将包含从第一个分割点开始的密钥，但不包括下一个分割点密钥键。这将持续到最后的所有分界点。最后一个区域将从最后一个拆分点定义为最大可能的密钥。

```java
hbase>create 't1','f',SPLITS => ['10','20',30']
```

在上面的例子中，将使用列族 “f” 创建表 “t1″，预先拆分到四个区域。请注意，第一个区域将包含从“\x00”到“\x30”（因为“\x31”是“1”的 ASCII 码）的所有密钥。

您可以使用以下变化将分割点传递到文件中。在这个例子中，分割是从对应于本地文件系统上的本地路径的文件中读取的。文件中的每一行都指定一个分割点密钥。

```java
hbase>create 't14','f',SPLITS_FILE=>'splits.txt'
```

其他选项是根据所需的区域数量和分割算法自动计算分割。HBase 提供基于统一拆分或基于十六进制密钥分割密钥范围的算法，但您可以提供自己的拆分算法来细分密钥范围。

```java
# create table with four regions based on random bytes keys
hbase>create 't2','f1', { NUMREGIONS => 4 , SPLITALGO => 'UniformSplit' }
# create table with five regions based on hex keys
hbase>create 't3','f1', { NUMREGIONS => 5, SPLITALGO => 'HexStringSplit' }
```

由于HBase Shell 实际上是一个 Ruby 环境，因此您可以使用简单的 Ruby 脚本以算法方式计算分割。

```java
# generate splits for long (Ruby fixnum) key range from start to end key
hbase(main):070:0> def gen_splits(start_key,end_key,num_regions)
hbase(main):071:1>   results=[]
hbase(main):072:1>   range=end_key-start_key
hbase(main):073:1>   incr=(range/num_regions).floor
hbase(main):074:1>   for i in 1 .. num_regions-1
hbase(main):075:2>     results.push([i*incr+start_key].pack("N"))
hbase(main):076:2>   end
hbase(main):077:1>   return results
hbase(main):078:1> end
hbase(main):079:0>
hbase(main):080:0> splits=gen_splits(1,2000000,10)
=> ["\000\003\r@", "\000\006\032\177", "\000\t'\276", "\000\f4\375", "\000\017B<", "\000\022O{", "\000\025\\\272", "\000\030i\371", "\000\ew8"]
hbase(main):081:0> create 'test_splits','f',SPLITS=>splits
0 row(s) in 0.2670 seconds
=> Hbase::Table - test_splits
```

请注意，HBase Shell 命令 truncate 有效地删除并重新创建具有默认选项的表格，这将丢弃任何预分割。如果您需要截断预分割表，则必须显式删除并重新创建表以重新指定自定义分割选项。

### 调试

#### shell 调试开关

您可以在 shell 中设置一个调试开关，以查看更多输出 – 例如，运行命令时出现更多的异常堆栈跟踪：

```java
hbase> debug <RETURN>
```

#### DEBUG 日志级别

要在shell 中启用 DEBUG 级日志记录，请使用该 -d 选项启动它：

```java
$ ./bin/hbase shell -d
```

### Count 命令

Count 命令返回表中的行数。配置正确的 CACHE 时速度非常快：

```java
hbase> count '<tablename>', CACHE => 1000
```

上述计数一次取 1000 行。如果行很大，请将 CACHE 设置得较低。默认是每次读取一行。
