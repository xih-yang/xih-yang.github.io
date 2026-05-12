# 08、JVM 实战 - 查看JVM参数及值的命令行工具
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/8.html
- 分类：JVM 实战
- 分组：教程目录
### 1. HotSpot vm中的各个globals.hpp文件 查看jvm初始的默认值及参数

> globals.hpp
>
> globals_extension.hpp
>
> c1_globals.hpp
>
> c1_globals_linux.hpp
>
> c1_globals_solaris.hpp
>
> c1_globals_sparc.hpp
>
> c1_globals_windows.hpp
>
> c1_globals_x86.hpp
>
> c2_globals.hpp
>
> c2_globals_linux.hpp
>
> c2_globals_solaris.hpp
>
> c2_globals_sparc.hpp
>
> c2_globals_windows.hpp
>
> c2_globals_x86.hpp
>
> g1_globals.hpp
>
> globals_linux.hpp
>
> globals_linux_sparc.hpp
>
> globals_linux_x86.hpp
>
> globals_linux_zero.hpp
>
> globals_solaris.hpp
>
> globals_solaris_sparc.hpp
>
> globals_solaris_x86.hpp
>
> globals_sparc.hpp
>
> globals_windows.hpp
>
> globals_windows_x86.hpp
>
> globals_x86.hpp
>
> globals_zero.hpp
>
> shark_globals.hpp
>
> shark_globals_zero.hpp
>
> arguments.cpp

### 2.-XX:+PrintFlagsInitial参数

> 显示所有可设置参数及默认值，可结合-XX:+PrintFlagsInitial与-XX:+PrintFlagsFinal对比设置前、设置后的差异，方便知道对那些参数做了调整。

### 3.-XX:+PrintFlagsFinal参数

> 可以获取到所有可设置参数及值(手动设置之后的值)，这个参数只能使用在Jdk6 update 21以上版本(包括该版本)。-XX:+PrintFlagsFinal参数的使用 与上面-XX:+PrintFlagsInitial 参数使用相同 java -XX:+PrintFlagsFinal

### 4.使用 jinfo 命令 查看或设置某个参数的值,

> jinfo命令格式：
>
> jinfo [option]
>
> pid虚拟机进程id 可以通过 jps命令查看
>
> 例子：查询MaxPermSize 参数的值

> 或直接使用 jinfo -flags pid 查看vm的所有设置参数

### 5. -XX:+PrintCommandLineFlags参数

> 显示出JVM初始化完毕后所有跟最初的默认值不同的参数及它们的值。

本文原文链接：[http://blog.csdn.net/java2000_wl/article/details/8042010](http://blog.csdn.net/java2000_wl/article/details/8042010)
