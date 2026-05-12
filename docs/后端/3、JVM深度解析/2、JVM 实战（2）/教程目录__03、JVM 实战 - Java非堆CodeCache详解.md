# 03、JVM 实战 - Java非堆CodeCache详解
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/3.html
- 分类：JVM 实战
- 分组：教程目录
Java的内存由堆和非堆两个部分组成。对于堆来说，它的组成是比较确定的，它包含了年轻代和年老代两个部分，而年轻代又是由Eden区和两个Survivor区组成。可是，非堆由哪些部分组成呢？

在很多时候，我们认为持久代（Perm Generation）就是非堆，但其实持久代也仅是非堆的组成之一。请看下面jconsole内存标签页所展示的非堆。

从上面看，非堆除了包括持久代外，非堆还包括了CodeCache代码缓存区，它主要用于存放JIT所编译的代码。CodeCache代码缓冲区的大小在client模式下默认最大是32m，在server模式下默认是48m，当然，这个值也是可以设置的，它所对应的JVM参数为ReservedCodeCacheSize 和 InitialCodeCacheSize，可以通过如下的方式来为Java程序设置。

java -XX:ReservedCodeCacheSize=128m -version

CodeCache缓存区是可能被充满的，当CodeCache满时，后台会收到CodeCache is full的警告信息。

如果想查看Java进程的全部默认值，可以使用下面的命令，它会把所有的默认XX参数值都输出来。

java -XX:+PrintFlagsFinal
