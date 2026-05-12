# 01、JVM 实战 - JVM体系结构
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/1.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 前言

作为Java工程师 ，jvm对于 java的重要性不言而喻，但是 我们又对jvm了解多少

**Java的跨平台性**

java发布的口号 “一处编译到处运行 ” 依赖于jvm，并随着jvm的发展， jvm也不仅仅只是java语言专有的运行虚拟机，相比较java语言本身，jvm更加出色。Groovy、Scala、JRuby、Kotlin等都是Java平台的一部分。

jvm只认识字节码，平时我们所说的字节码 ，通常指的是 java字节码，理论上，只要开发出相应语言的字节码编译器，可以将 相应的语言编译成为 符合jvm规范的 字节码文件，都可以运行在jvm中，这也是jvm的**跨语言性**

示意图：

**多语言混合编程**

**1、** Java平台上的多语言混合编程正成为主流，通过特定领域的语言去解决特定领域的问题是当前软件开发应对日趋复杂的项目需求的一个方向；

**2、** 试想一下，在一个项目之中，并行处理用Clojure语言编写，展示层使用JRuby/Rails，中间层则是Java，每个应用层都将使用不同的编程语言来完成，而且，接口对每一层的开发者都是透明的，各种语言之间的交互不存在任何困难，就像使用自己语言的原生API一样方便，因为它们最终都运行在一个虚拟机之上；

**3、** 对这些运行于Java虚拟机之上、Java之外的语言，来自系统级的、底层的支持正在迅速增强，以JSR-292为核心的一系列项目和功能改进（如DaVinciMachine项目、Nashorn引擎、InvokeDynamic指令java.lang.invoke包等），推动Java虚拟机从“Java语言的虚拟机”向“多语言虚拟机”的方向发展；

## 2. 虚拟机介绍

所谓虚拟机（Virtual Machine），就是一台虚拟的计算机。它是一款软件，用来执行一系列虚拟计算机指令。大体上，虚拟机可以分为系统虚拟机和程序虚拟机。

**1、** 例如windows虚拟机VMware，它完全是对物理计算机的仿真，提供了一个可运行完整操作系统的软件平台；

**2、** 程序虚拟机的典型代表就是Java虚拟机，它专门为执行单个计算机程序而设计，在Java虚拟机中执行的指令我们称为Java字节码指令；

**java虚拟机**

**1、** Java虚拟机是一台执行Java字节码的虚拟计算机，它拥有独立的运行机制，其运行的Java字节码也未必由Java语言编译而成；

**2、** JVM平台的各种语言可以共享Java虚拟机带来的跨平台性、优秀的垃圾回器，以及可靠的即时编译器；

**3、** Java技术的核心就是Java虚拟机（JVM，JavaVirtualMachine），因为所有的Java程序都运行在Java虚拟机内部；

**4、** Java虚拟机就是二进制字节码的运行环境，负责装载字节码到其内部，解释/编译为对应平台上的机器指令执行每一条Java指令，Java虚拟机规范中都有详细定义，如怎么取操作数，怎么处理操作数，处理结果放在哪里；

如今，说到java虚拟机，默认的就是HotSpot VM ，是目前市面上高性能虚拟机的代表作之一。

**特点**：

解释器与即时编译器并存的架构

**执行引擎包含三部分**：解释器，即时编译器，垃圾回收器

代码执行示意图

## 3. JVM 架构模型

**Java编译器输入的指令流基本上是一种基于栈的指令集架构**，另外一种指令集架构则是基于寄存器的指令集架构。

两者的优缺点

**基于栈式架构的特点：**

**1、** 设计和实现更简单，适用于资源受限的系统；

**2、** 避开了寄存器的分配难题：使用零地址指令方式分配；

**3、** 指令流中的指令大部分是零地址指令，其执行过程依赖于操作栈指令集更小，编译器容易实现；

**4、** 不需要硬件支持，可移植性更好，更好实现跨平台；

**基于寄存器架构的特点：**

**1、** 典型的应用是x86的二进制指令集：比如传统的PC以及Android的Davlik虚拟机；

**2、** 指令集架构则完全依赖硬件，与硬件的耦合度高，可移植性差；

**3、** 性能优秀和执行更高效；

**4、** 花费更少的指令去完成一项操作；

**5、** 在大部分情况下，基于寄存器架构的指令集往往都以一地址指令、二地址指令和三地址指令为主，而基于栈式架构的指令集却是以零地址指令为主；

举例：同样执行2+3这种逻辑操作，其指令分别如下：

基于栈的计算流程（以Java虚拟机为例）：

```java
iconst_2 //常量2入栈
istore_1
iconst_3 // 常量3入栈
istore_2
iload_1
iload_2
iadd //常量2/3出栈，执行相加
istore_0 // 结果5入栈
```

而基于寄存器的计算流程

```java
mov eax,2 //将eax寄存器的值设为2
add eax,3 //使eax寄存器的值加3
```

总结：

由于跨平台性的设计，Java的指令都是根据栈来设计的。不同平台CPU架构不同，所以不能设计为基于寄存器的。优点是跨平台，指令集小，编译器容易实现，缺点是性能下降，实现同样的功能需要更多的指令

## 4. JVM生命周期

**虚拟机的启动**

Java虚拟机的启动是通过引导类加载器（bootstrap class loader）创建一个初始类（initial class）来完成的，这个类是由虚拟机的具体实现指定的。

**虚拟机的执行**

**1、** 一个运行中的Java虚拟机有着一个清晰的任务：执行Java程序；

**2、** 程序开始执行时他才运行，程序结束时他就停止；

**3、** 执行一个所谓的Java程序的时候，真真正正在执行的是一个叫做Java虚拟机的进程；

**虚拟机的退出**

**1、** 程序正常执行结束；

**2、** 程序在执行过程中遇到了异常或错误而异常终止；

**3、** 由于操作系统出现错误而导致Java虚拟机进程终止；

**4、** 某线程调用Runtime类或System类的exit()方法，或Runtime类的halt()方法，并且Java安全管理器也允许这次exit()或halt()操作；

**5、** 除此之外，JNI（JavaNativeInterface）规范描述了用JNIInvocationAPI来加载或卸载Java虚拟机时，Java虚拟机的退出情况；

## 5. JVM 发展历程

**1、****SunClassicVM**；

早在1996年Java1.0版本的时候，Sun公司发布了一款名为sun classic VM的Java虚拟机，它同时也是世界上第一款商用Java虚拟机，JDK1.4时完全被淘汰。

这款虚拟机内部只提供解释器，没有即时编译器，因此效率比较低，即时编译器会把热点代码缓存起来，那么以后使用热点代码的时候，效率就比较高。

如果使用JIT编译器，就需要进行外挂。但是一旦使用了JIT编译器，JIT就会接管虚拟机的执行系统。解释器就不再工作。解释器和编译器不能配合工作。

现在Hotspot内置了此虚拟机。

**1、****ExactVM**；

为了解决上一个虚拟机问题，jdk1.2时，Sun提供了此虚拟机。

Exact Memory Management：准确式内存管理

具备现代高性能虚拟机的维形，热点探测（寻找出热点代码进行缓存）编译器与解释器混合工作模式

只在Solaris平台短暂使用，其他平台上还是classic vm，英雄气短，终被Hotspot虚拟机替换

**1、****HotSpotVM**；

HotSpot历史

最初由一家名为“Longview Technologies”的小公司设计

1997年，此公司被Sun收购；2009年，Sun公司被甲骨文收购。

JDK1.3时，HotSpot VM成为默认虚拟机

目前Hotspot占有绝对的市场地位

从服务器、桌面到移动端、嵌入式都有应用。

名称中的HotSpot指的就是它的热点代码探测技术。在编译器与解释器中取得最佳执行平衡

**1、****JRockit**；

1、专注于服务器端应用：它可以不太关注程序启动速度，因此JRockit内部不包含解析器实现，全部代码都靠即时编译器编译后执行。

2、大量的行业基准测试显示，JRockit JVM是世界上最快的JVM：使用JRockit产品，客户已经体验到了显著的性能提高（一些超过了70%）和硬件成本的减少（达50%）。

3、JRockit面向延迟敏感型应用的解决方案JRockit Real Time提供以毫秒或微秒级的JVM响应时间，适合财务、军事指挥、电信网络的需要

4、Mission Control服务套件，它是一组以极低的开销来监控、管理和分析生产环境中的应用程序的工具。

5、2008年，JRockit被Oracle收购。

6、**Oracle表达了整合两大优秀虚拟机的工作，大致在JDK8中完成。整合的方式是在HotSpot的基础上，移植JRockit的优秀特性。**

**1、****IBM的J9**；

- 全称：IBM Technology for Java Virtual Machine，简称IT4J，内部代号：J9
- 市场定位与HotSpot接近，服务器端、桌面应用、嵌入式等多用途VM广泛用于IBM的各种Java产品。
- 目前，有影响力的三大商用虚拟机之一，也号称是世界上最快的Java虚拟机。
- 2017年左右，IBM发布了开源J9VM，命名为openJ9，交给Eclipse基金会管理，也称为Eclipse OpenJ9

**1、****KVM和CDC/CLDCHotspot**；

- Oracle在Java ME产品线上的两款虚拟机为：CDC/CLDC HotSpot Implementation VM KVM（Kilobyte）是CLDC-HI早期产品目前移动领域地位尴尬，智能机被Android和iOS二分天下。
- KVM简单、轻量、高度可移植，面向更低端的设备上还维持自己的一片市场 ，智能控制器、传感器 ，老人手机、经济欠发达地区的功能手机

**1、****AzulVM**；

- 前面三大“高性能Java虚拟机”使用在通用硬件平台上这里Azul VW和BEA Liquid VM是与特定硬件平台绑定、软硬件配合的专有虚拟机：高性能Java虚拟机中的战斗机。
- Azul VM是Azul Systems公司在HotSpot基础上进行大量改进，运行于Azul Systems公司的专有硬件Vega系统上的Java虚拟机。

**1、****LiquidVM**；

- 高性能Java虚拟机中的战斗机。
- BEA公司开发的，直接运行在自家Hypervisor系统上
- Liquid VM即是现在的JRockit VE（Virtual Edition）
- Liquid VM不需要操作系统的支持，或者说它自己本身实现了一个专用操作系统的必要功能，如线程调度、文件系统、网络支持等。
- 随着JRockit虚拟机终止开发，Liquid vM项目也停止了。

**1、****ApacheMarmony**；

- Apache也曾经推出过与JDK1.5和JDK1.6兼容的Java运行平台Apache Harmony。
- 它是IElf和Intel联合开发的开源JVM，受到同样开源的Open JDK的压制，Sun坚决不让Harmony获得JCP认证，最终于2011年退役，IBM转而参与OpenJDK
- 虽然目前并没有Apache Harmony被大规模商用的案例，但是它的Java类库代码吸纳进了Android SDK。

**1、****MicorsoftJVM**；

- 微软为了在IE3浏览器中支持Java Applets，开发了Microsoft JVM。
- 只能在window平台下运行。但确是当时Windows下性能最好的Java VM。
- 1997年，Sun以侵犯商标、不正当竞争罪名指控微软成功，赔了Sun很多钱。微软WindowsXP SP3中抹掉了其VM。现在Windows上安装的jdk都是HotSpot。

**1、****TaobaoJVM**；

- 由AliJVM团队发布。阿里，国内使用Java最强大的公司，覆盖云计算、金融、物流、电商等众多领域，需要解决高并发、高可用、分布式的复合问题。有大量的开源产品。
- 基于OpenJDK开发了自己的定制版本AlibabaJDK，简称AJDK。是整个阿里Java体系的基石。
- 基于OpenJDK Hotspot VM发布的国内第一个优化、深度定制且开源的高性能服务器版Java虚拟机。
- 创新的GCIH（GCinvisible heap）技术实现了off-heap，即将生命周期较长的Java对象从heap中移到heap之外，并且GC不能管理GCIH内部的Java对象，以此达到降低GC的回收频率和提升GC的回收效率的目的。
- GCIH中的对象还能够在多个Java虚拟机进程中实现共享
- 使用crc32指令实现JvM intrinsic降低JNI的调用开销
- PMU hardware的Java profiling tool和诊断协助功能
- 针对大数据场景的ZenGC
- taobao vm应用在阿里产品上性能高，硬件严重依赖inte1的cpu，损失了兼容性，但提高了性能
- 目前已经在淘宝、天猫上线，把Oracle官方JvM版本全部替换了。

**1、****DalvikVM**；

- 谷歌开发的，应用于Android系统，并在Android2.2中提供了JIT，发展迅猛。
- Dalvik VM只能称作虚拟机，而不能称作“Java虚拟机”，它没有遵循 Java虚拟机规范
- 不能直接执行Java的Class文件
- 基于寄存器架构，不是jvm的栈架构。
- 执行的是编译以后的dex（Dalvik Executable）文件。执行效率比较高。
- 它执行的dex（Dalvik Executable）文件可以通过class文件转化而来，使用Java语法编写应用程序，可以直接使用大部分的Java API等。
- Android 5.0使用支持提前编译（Ahead of Time Compilation，AoT）的ART VM替换Dalvik VM。

**1、****GraalVM**；

- 2018年4月，Oracle Labs公开了GraalvM，号称 “Run Programs Faster Anywhere”，勃勃野心。与1995年java的”write once，run anywhere"遥相呼应。
- GraalVM在HotSpot VM基础上增强而成的跨语言全栈虚拟机，可以作为“任何语言”

的运行平台使用。语言包括：Java、Scala、Groovy、Kotlin；C、C++、Javascript、Ruby、Python、R等
- 支持不同语言中混用对方的接口和对象，支持这些语言使用已经编写好的本地库文件
- 工作原理是将这些语言的源代码或源代码编译后的中间格式，通过解释器转换为能被Graal VM接受的中间表示。Graal VM提供Truffle工具集快速构建面向一种新语言的解释器。在运行时还能进行即时编译优化，获得比原生编译器更优秀的执行效率。

总结：目前市场上最流行的 三大jvm ，**HotSpot** ，**JRockit** ， **IBM的J9** 占有率最高，至于未来，如果说HotSpot有一天真的被取代，Graalvm希望最大。但是Java的软件生态没有丝毫变化。
