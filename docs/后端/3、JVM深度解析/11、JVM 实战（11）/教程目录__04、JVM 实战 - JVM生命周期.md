# 04、JVM 实战 - JVM生命周期
- 来源：https://ddkk.com/zhuanlan/java/jvm/11/4.html
- 分类：JVM 实战
- 分组：教程目录
## 虚拟机的启动（生命的开始）

Java虚拟机的启动是通过引导类加载器(bootstrap class loader)创建个初始类(initial class)来完成的，这个类是由虚拟机的具体实现指定的。

想让这个程序执行，如果它的一些类结构、父类和其他一些必要的类都没有，就得先让虚拟机执行起来。调用初始类，内部有个main方法，main方法中使用一些其他类，相继的就把后续一些类加载进来。

## 虚拟机的执行

一个运行中的Java虚拟机有着一个清晰的任务：执行Java程序。

程序开始执行时他才运行，程序结束时他就停止。

执行一个所谓的Java程序的时候，真真正正在执行的是一个叫做Java虚拟机的进程。

## 虚拟机的退出

如:

程序正常执行结束

程序在执行过程中遇到了异常或错误而异常终止·由于操作系统出现错误而导致Java虚拟机进程终止

某线程调用Runtime类或system类的exit方法，或Runtime类的halt方法，并且Java安全管理器也允许这次exit或halt操作。（最终殊途同归，只是调用的名字不一样）

此外，JNI ( Java Native Interface)规范描述了用JNI Invocation API来加载或卸载Java虚拟机时，Java虚拟机的退出情况。
