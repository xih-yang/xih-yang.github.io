# 55、MapReduce的替代API：Cascading
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/55.html
- 分类：大数据框架
- 分组：教程目录
## Cascading

Cascading 是 MapReduce 的替代 API，它实际上使用 MapReduce，但允许您以简化的方式编写 MapReduce 代码。

以下示例显示了 Cascading Flow，它将数据“汇集（sinks）”到 HBase 集群中。同样的 hBaseTap API 也可以用于“源（source）”数据：

```java
// read data from the default filesystem
// emits two fields: "offset" and "line"
Tap source = new Hfs( new TextLine(), inputFileLhs );
// store data in an HBase cluster
// accepts fields "num", "lower", and "upper"
// will automatically scope incoming fields to their proper familyname, "left" or "right"
Fields keyFields = new Fields( "num" );
String[] familyNames = {"left", "right"};
Fields[] valueFields = new Fields[] {new Fields( "lower" ), new Fields( "upper" ) };
Tap hBaseTap = new HBaseTap( "multitable", new HBaseScheme( keyFields, familyNames, valueFields ), SinkMode.REPLACE );
// a simple pipe assembly to parse the input into fields
// a real app would likely chain multiple Pipes together for more complex processing
Pipe parsePipe = new Each( "insert", new Fields( "line" ), new RegexSplitter( new Fields( "num", "lower", "upper" ), " " ) );
// "plan" a cluster executable Flow
// this connects the source Tap and hBaseTap (the sink Tap) to the parsePipe
Flow parseFlow = new FlowConnector( properties ).connect( source, hBaseTap, parsePipe );
// start the flow, and block until complete
parseFlow.complete();
// open an iterator on the HBase table we stuffed data into
TupleEntryIterator iterator = parseFlow.openSink();
while(iterator.hasNext())
  {
  // print out each tuple from HBase
  System.out.println( "iterator.next() = " + iterator.next() );
  }
iterator.close();
```
