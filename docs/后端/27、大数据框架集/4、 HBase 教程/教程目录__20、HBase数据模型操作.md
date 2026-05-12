# 20、HBase数据模型操作
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/20.html
- 分类：大数据框架
- 分组：教程目录
## HBase数据模型操作

在HBase 中有四个主要的数据模型操作，分别是：Get、Put、Scan 和 Delete。

### Get（读取）

Get指定行的返回属性。读取通过 Table.get 执行。

Get操作的语法如下所示：

```java
get ’<table name>’,’row1’
```

在以下的 get 命令示例中，我们扫描了 emp 表的第一行：

```java
hbase(main):012:0> get 'emp', '1'
   COLUMN                     CELL
personal : city timestamp=1417521848375, value=hyderabad
personal : name timestamp=1417521785385, value=ramu
professional: designation timestamp=1417521885277, value=manager
professional: salary timestamp=1417521903862, value=50000
4 row(s) in 0.0270 seconds
```

#### 读取指定列

下面给出的是使用 get 操作读取指定列语法：

```java
hbase>get 'table name', ‘rowid’, {COLUMN => ‘column family:column name ’}
```

在下面给出的示例表示用于读取 HBase 表中的特定列：

```java
hbase(main):015:0> get 'emp', 'row1', {COLUMN=>'personal:name'}
  COLUMN                CELL
personal:name timestamp=1418035791555, value=raju
1 row(s) in 0.0080 seconds
```

### Put（写）

Put可以将新行添加到表中（如果该项是新的）或者可以更新现有行（如果该项已经存在）。Put 操作通过 Table.put（non-writeBuffer）或 Table.batch（non-writeBuffer）执行。

Put操作的命令如下所示，在该语法中，你需要注明新值：

```java
put ‘table name’,’row ’,'Column family:column name',’new value’
```

新给定的值将替换现有的值，并更新该行。

#### Put操作示例

假设HBase 中有一个表 EMP 拥有下列数据：

```java
hbase(main):003:0> scan 'emp'
 ROW              COLUMN+CELL
row1 column=personal:name, timestamp=1418051555, value=raju
row1 column=personal:city, timestamp=1418275907, value=Hyderabad
row1 column=professional:designation, timestamp=14180555,value=manager
row1 column=professional:salary, timestamp=1418035791555,value=50000
1 row(s) in 0.0100 seconds
```

以下命令将员工名为“raju”的城市值更新为“Delhi”：

```java
hbase(main):002:0> put 'emp','row1','personal:city','Delhi'
0 row(s) in 0.0400 seconds
```

更新后的表如下所示：

```java
hbase(main):003:0> scan 'emp'
  ROW          COLUMN+CELL
row1 column=personal:name, timestamp=1418035791555, value=raju
row1 column=personal:city, timestamp=1418274645907, value=Delhi
row1 column=professional:designation, timestamp=141857555,value=manager
row1 column=professional:salary, timestamp=1418039555, value=50000
1 row(s) in 0.0100 seconds
```

### Scan（扫描）

Scan 允许在多个行上对指定属性进行迭代。

Scan 操作的语法如下：

```java
scan ‘<table name>’ 
```

以下是扫描表格实例的示例。假定表中有带有键 “row1 “、 “row2 “、 “row3 ” 的行，然后是具有键“abc1”，“abc2”和“abc3”的另一组行。以下示例显示如何设置Scan实例以返回以“row”开头的行。

```java
public static final byte[] CF = "cf".getBytes();
public static final byte[] ATTR = "attr".getBytes();
...
Table table = ...      // instantiate a Table instance
Scan scan = new Scan();
scan.addColumn(CF, ATTR);
scan.setRowPrefixFilter(Bytes.toBytes("row"));
ResultScanner rs = table.getScanner(scan);
try {
  for (Result r = rs.next(); r != null; r = rs.next()) {
    // process result...
  }
} finally {
  rs.close();  // always close the ResultScanner!
}
```

请注意，通常，指定扫描的特定停止点的最简单方法是使用 InclusiveStopFilter 类。

### Delete（删除）

Delete 操作用于从表中删除一行。Delete 通过 Table.delete 执行。

HBase 不会修改数据，因此通过创建名为 tombstones 的新标记来处理 Delete 操作。这些 tombstones，以及没用的价值，都在重大的压实中清理干净。

使用Delete 命令的语法如下：

```java
delete ‘<table name>’, ‘<row>’, ‘<column name >’, ‘<time stamp>’
```

下面是一个删除特定单元格的例子：

```java
hbase(main):006:0> delete 'emp', '1', 'personal data:city',
1417521848375
0 row(s) in 0.0060 seconds
```

#### 删除表的所有单元格

使用“deleteall” 命令，可以删除一行中所有单元格。下面给出是 deleteall 命令的语法：

```java
deleteall ‘<table name>’, ‘<row>’,
```

这里是使用“deleteall”命令删除 emp 表 row1 的所有单元的一个例子。

```java
hbase(main):007:0> deleteall 'emp','1'
0 row(s) in 0.0240 seconds
```

使用Scan 命令验证表。表被删除后的快照如下：

```java
hbase(main):022:0> scan 'emp'
ROW                  COLUMN+CELL
2 column=personal data:city, timestamp=1417524574905, value=chennai 
2 column=personal data:name, timestamp=1417524556125, value=ravi
2 column=professional data:designation, timestamp=1417524204, value=sr:engg
2 column=professional data:salary, timestamp=1417524604221, value=30000
3 column=personal data:city, timestamp=1417524681780, value=delhi
3 column=personal data:name, timestamp=1417524672067, value=rajesh
3 column=professional data:designation, timestamp=1417523187, value=jr:engg
3 column=professional data:salary, timestamp=1417524702514, value=25000
```
