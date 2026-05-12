# 189、故障排除和调试HBase：网络
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/189.html
- 分类：大数据框架
- 分组：教程目录
## 网络

### 网络峰值

如果您看到定期的网络峰值，您可能需要检查compactionQueues以查看主要压缩是否正在发生。

有关管理压缩的更多信息，请参阅[管理压缩](https://www.w3cschool.cn/hbase_doc/hbase_doc-fos62kl2.html)部分的内容。

### Loopback IP

HBase期望loopback IP地址为127.0.0.1。

### 网络接口

所有网络接口都正常运行吗？你确定吗？请参阅案例研究中的故障排除案例研究，这将在之后的章节进行介绍。
