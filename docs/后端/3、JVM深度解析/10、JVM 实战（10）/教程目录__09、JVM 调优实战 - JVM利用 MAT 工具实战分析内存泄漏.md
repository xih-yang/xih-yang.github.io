# 09、JVM 调优实战 - JVM利用 MAT 工具实战分析内存泄漏
- 来源：https://ddkk.com/zhuanlan/java/jvm/10/9.html
- 分类：JVM 实战
- 分组：教程目录
**今天 JVM利用 MAT 工具实战分析内存泄漏**

**1、** 通过程序做一份OOM之前的dump日志例如：；

java -jar -XX:+HeapDumpOnOutOfMemoryError jvm-1.0-SNAPSHOT.jar

ab-c 10 -n 1000 http://127.0.0.1:8080/jvm/mat

**2、** 程序在OOM之前导出了dump日志，如下图：；

**3、** 通过MAT工具分析：；

在这里我们就可以很明显地查看到是 ThreadLocal 这块的代码出现了问题。

**4、原因分析**

ThreadLocal 是基于 ThreadLocalMap 实现的，这个 Map 的 Entry 继承了 WeakReference ，而 Entry 对象中的 key 使用了 WeakReference 封装，也就是说 Entry 中的 key 是一个弱引用类型，而弱引用类型只能存活在下次 GC 之前。

当把threadlocal 变量置为 null 以后，没有任何强引用指向 threadlocal 实例，所以 threadlocal 将会被 gc 回收。

当发生一次垃圾回收， ThreadLocalMap 中就会出现 key 为 null 的 Entry ，就没有办法访问这些 key 为 null 的 Entry 的 value ，如果当前线程再迟迟不结束的话（肯定不会结束），这些 key 为 null 的 Entry 的 value 就会一直存在一条强引用链： Thread Ref -> Thread -> ThreaLocalMap -> Entry -> value ，而这块 value

永远不会被访问到了，所以存在着内存泄露。如下图：

只有当前 thread 结束以后， current thread 就不会存在栈中，强引用断开， Current Thread 、 Map value 将全部被 GC 回收（但是这种情况很难）。最好的做法是不在需要使用 ThreadLocal 变量后，都调用它的 remove() 方法，清除数据。

**5、总结**

可以看到，上手 MAT 工具是有一定门槛的，除了其操作模式，还需要对我们前面介绍的理论知识有深入的理解，比如 GC Roots 、各种引用级别等。 如果不能通过大对象发现问题，则需要对快照进行深入分析。使用柱状图和支配树视图，配合引入引出和各种排序，能够对内存的使用进行整体的摸底。 由于我们能够看到内存中的具体数据，排查一些异常数据就容易得多。

上面这些问题通过分析业务代码，也不难发现其关联性。问题如果非常隐蔽，则需要使用 OQL 等语言，对问题一一排查、确认。
