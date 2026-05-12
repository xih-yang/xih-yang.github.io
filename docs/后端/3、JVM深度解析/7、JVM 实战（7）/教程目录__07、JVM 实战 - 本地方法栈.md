# 07、JVM 实战 - 本地方法栈
- 来源：https://ddkk.com/zhuanlan/java/jvm/7/7.html
- 分类：JVM 实战
- 分组：教程目录
Java虚拟机栈：Java方法调用；

本地方法栈：本地方法调用。

本地方法栈，线程私有（key生成hash值为native方法）。允许被实现成固定或者是可动态扩展的内存大小，内存溢出情况和Java虚拟机栈相同。

- 使用C语言实现
- 具体做法是Native Method Stack 中登记native方法，在Execution Engine执行时加载到本地方法库
- 当某个线程调用一个本地方法时，就会进入一个全新，不受虚拟机限制的世界，它和虚拟机拥有同样的权限。
- 并不是所有的JVM都支持本地方法，因为Java虚拟机规范并没有明确要求本地方法栈的使用语言，具体实现方式，数据结构等
- Hotspot JVM中，直接将本地方法栈和虚拟机栈合二为一
