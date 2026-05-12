# 32、HBase限制因素
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/32.html
- 分类：大数据框架
- 分组：教程目录
## HBase限制因素

HBase 目前支持传统（SQL）数据库术语中的“限制（constraints）”。Constraints 的建议用法是强制执行表中属性的业务规则（例如，确保值在 1-10 范围内）。也可以使用限制来强制引用完整性，但是强烈建议不要使用限制，因为它会显着降低启用完整性检查的表的写入吞吐量。 从版本 0.94 开始，可以在Constraint 中找到有关使用限制的大量文档 。
