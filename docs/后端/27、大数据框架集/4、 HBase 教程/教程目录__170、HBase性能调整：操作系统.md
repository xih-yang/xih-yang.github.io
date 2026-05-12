# 170、HBase性能调整：操作系统
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/170.html
- 分类：大数据框架
- 分组：教程目录
## 操作系统

### 内存

HBase一定需要RAM！

### 64位

使用64位平台（和64位JVM）。

### 交换

注意交换，将swappiness设为0。

### CPU

确保已将Hadoop设置为使用本机的硬件校验和。
