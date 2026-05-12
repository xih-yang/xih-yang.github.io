# 35、HBase模式案例：客户-订单
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/35.html
- 分类：大数据框架
- 分组：教程目录
## HBase案例：客户/订单

假设HBase 用于存储客户和订单信息。有两种核心记录类型被摄取：客户记录类型和订单记录类型。

客户记录类型将包含您通常期望的所有内容：

- 客户编号
- 客户名称
- 地址（例如，城市，州，邮编）
- 电话号码等

订单记录类型将包含如下内容：

- 客户编号
- 订单编号
- 销售日期
- 一系列用于装运位置和订单项的嵌套对象

假设客户编号和销售订单的组合唯一地标识一个订单，对于一个订单（ORDER）表，这两个属性将组成 rowkey，特别是一个组合键，例如：

```java
[customer number][order number]
```

但是，还有更多的设计决策需要：原始值是 rowkeys 的最佳选择吗？

LogData 用例中的相同设计问题在这里面对我们。客户编号的密钥空间是什么，以及格式是什么（例如，数字或是字母数字？）由于在HBase中使用固定长度的密钥以及可以在密钥空间中支持合理分布的密钥是有利的，因此会出现类似的选项：

带有哈希的复合 Rowkey：

- [客户号码的 MD5] = 16字节
- [订单号的 MD5] = 16字节

复合数字/哈希组合 Rowkey：

- [代替客户编号] = 8个字节
- [订单号的 MD5] = 16字节

### 单个表/多个表

传统的设计方法会为有单独的 CUSTOMER 和 SALES 表格。另一种选择是将多个记录类型打包到一个表中（例如，CUSTOMER ++）。

客户记录类型 Rowkey：

- [customer-id]
- [type] = 表示客户记录类型为’1’的类型

订单记录类型Rowkey：

- [customer-id]
- [type] = 指示订单记录类型为’2’的类型
- [order]

这种特殊的 CUSTOMER ++ 方法的优点是通过客户 ID 来组织许多不同的记录类型（例如，一次扫描就可以得到关于该客户的所有信息）。缺点是扫描特定的记录类型并不容易。

### HBase订单对象设计

现在我们需要解决如何建模 Order 对象。假设类结构如下：

Order

Order 可以有多个 ShippingLocations

LineItem

一个ShippingLocation 可以有多个 LineItems

存储这些数据有多种选择。

### 完全标准化

通过这种方法，ORDER，SHIPPING_LOCATION和LINE_ITEM 将会有单独的表格。

上面描述了 ORDER 表的 rowkey：schema.casestudies.custorder

SHIPPING_LOCATION 的复合 rowkey 就像这样：

- [order-rowkey]
- [shipping location number] （例如，第一地点，第二地点等）

LINE_ITEM 表的复合 rowkey 将如下所示：

- [order-rowkey]
- [shipping location number] （例如，第一地点，第二地点等）
- [line item number] （例如，第一条线，第二条等）

这样的标准化模型很可能是 RDBMS 的方法，但这不是 HBase 唯一的选择。这种做法的缺点是要检索任何订单的信息，您需要：

- 获取订单的订单表
- 在 SHIPPING_LOCATION 表上扫描该订单以获取 ShippingLocation 实例
- 扫描每个 ShippingLocation 的 LINE_ITEM

这是一个 RDBMS 无论如何都会在封面下做的事情，但由于 HBase 中没有加入，所以您只是更加意识到这一点。

### 具有记录类型的单个表

采用这种方法，将会存在一个包含单个表的ORDER

Order rowkey 如上所述：schema.casestudies.custorder

- [order-rowkey]
- [ORDER record type]

ShippingLocation 复合 rowkey 将如下所示：

- [order-rowkey]
- [SHIPPING record type]
- [shipping location number] （例如，第一地点，第二地点等）

LineItem 复合 rowkey 将如下所示：

- [order-rowkey]
- [LINE record type]
- [shipping location number] （例如，第一地点，第二地点等）
- [line item number] （例如，第一条线，第二条等）

### 非规范化

具有记录类型的单个表格的一种变体是对一些对象层次结构进行非规范化和扁平化，比如将 ShippingLocation 属性折叠到每个 LineItem 实例上。

LineItem 复合 rowkey 将如下所示：

- [order-rowkey]
- [LINE record type]
- [line item number] （例如，第一条线，第二条等，必须注意的是，在整个订单中都是唯一的）

LineItem 列将是这样的：

- 项目编号（itemNumber）
- 数量（quantity）
- 价钱（price）
- shipToLine1（从 ShippingLocation 非正规化）
- shipToLine2（从 ShippingLocation 非正规化）
- shipToCity（从 ShippingLocation 非正规化）
- shipToState（从 ShippingLocation 非正规化）
- shipToZip（从 ShippingLocation 非正规化）

这种方法的优点包括不太复杂的对象层次结构，但其中一个缺点是，如果这些信息发生变化，更新会变得更加复杂。

##### BLOB对象

通过这种方法，整个 Order 对象图都以某种方式处理为 BLOB。例如，上面描述了 ORDER 表的 rowkey：schema.casestudies.custorder，而一个名为“order”的列将包含一个可以反序列化的对象，该对象包含一个容器 Order，ShippingLocations 和 LineItems。

这里有很多选项：JSON，XML，Java 序列化，Avro，Hadoop Writable等等。所有这些都是相同方法的变体：将对象图编码为字节数组。应该注意这种方法，以确保在对象模型发生更改时保持向后兼容性，使旧的持久结构仍能从 HBase 中读出。

优点是能够以最少的 I/O 来管理复杂的对象图（例如，在本例中每个 HBase Get 有 Order），但缺点包括前面提到的关于序列化的向后兼容性，序列化的语言依赖性（例如 Java 序列化只适用于 Java 客户端），事实上你必须反序列化整个对象才能获得 BLOB 中的任何信息，以及像 Hive 这样的框架难以使用像这样的自定义对象。
