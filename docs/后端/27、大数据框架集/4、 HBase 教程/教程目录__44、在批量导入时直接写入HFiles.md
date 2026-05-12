# 44、在批量导入时直接写入HFiles
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/44.html
- 分类：大数据框架
- 分组：教程目录
## 在批量导入时直接写入HFiles

如果您正在导入新表格，则可以绕过 HBase API 并将您的内容直接写入文件系统，格式化为 HBase 数据文件（HFiles）。您的导入将运行得更快，也许快一个数量级。有关此机制如何工作的更多信息，请参阅批量加载。
