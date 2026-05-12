# 67、HBase：标签
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/67.html
- 分类：大数据框架
- 分组：教程目录
## HBase：标签（Tags）

标签（Tags）是HFile v3的一项功能。标签是作为单元的一部分的元数据，与密钥（key），值（value）和版本（version）分开。标签为其他与安全相关的功能（如单元级ACL和可见性标签）提供实现细节。标签存储在HFiles自身中。将来可能会使用标签来实现其他HBase功能。为了使用它们启用的安全功能，您无需了解很多关于标签的信息。

### 实现细节

每个单元可以有零个或多个标签。每个标签都有一个类型和实际的标签字节数组。

就像行键，列族，限定符和值可以被编码一样（参见data.block.encoding.types），标签也可以被编码。您可以在列族级别启用或禁用标签编码，并且默认情况下启用。使用该HColumnDescriptor#setCompressionTags(boolean compressTags)方法来管理列族的编码设置。您还需要为列族启用DataBlockEncoder，以使标记的编码生效。

如果启用WAL压缩，则可以通过在hbase-site.xml中设置hbase.regionserver.wal.tags.enablecompressionto的值为true来启用WAL中每个标记的压缩。标记压缩使用字典编码。

使用WAL加密时，不支持标记压缩。
