# 06、JVM 实战 - 本地方法接口
- 来源：https://ddkk.com/zhuanlan/java/jvm/7/6.html
- 分类：JVM 实战
- 分组：教程目录
### 1、什么是本地方法

简单地讲，一个Native Method就是一个Java调用非Java代码的接口。一个Native Method是这样一个Java方法：该方法的实现由非Java语言实现，比如c。

标识符native可以与所有其它的java标识符连用，但是abstract除外。

### 2、为什么使用native method

Java应用需要与Java外面的环境交互，这是本地方法存在的主要原因。

- 例如与操作系统底层或硬件交换信息时的情况
- 例如启动一个线程
