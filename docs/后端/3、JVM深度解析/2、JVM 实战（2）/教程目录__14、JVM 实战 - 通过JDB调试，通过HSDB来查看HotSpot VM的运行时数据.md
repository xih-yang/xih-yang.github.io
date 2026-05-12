# 14、JVM 实战 - 通过JDB调试，通过HSDB来查看HotSpot VM的运行时数据
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/13.html
- 分类：JVM 实战
- 分组：教程目录
## 一、JDB调试

在预发环境下进行debug时，时常因为工具和环境的限制，导致debug体验非常差，那么有什么方法能够简化我们进行debug的体验吗？JDB就是一种。

JDB是 **The Java Debugger** 的简称，它可以用来debug一个Java程序，同时它是 JPDA 的一个参考实现，只是这个实现是基于命令行的。

使用JDB的目的是，更细节的诊断和操控代码，如果只是观察值，可以使用arthas之类的工具

## 1.1、JPDA

JPDA将调试过程分为两部分：被调试的程序（被调试者-debuggee）和JDI（调试者-debugger）。JDI一般为一个调试应用程序的用户接口（或Java IDE的一部分），本文中就是JDB。被调试的应用程序在后端运行，而JDI在前端运行。在前端与后端之间有一个通信通道运行JDWP（Java Debug Wire Protocol）协议，因此，被调试程序与调试器可以位于同一个系统内，也可位于不同的系统中。

从开发者的角度，一个调试应用程序可进入任何JPDA层面。只要JDI基于JDWP，就可以debug任何厂商实现的JVM了，比如：j9等。

JDWP 有两种基本的包（packet）类型：命令包（command packet）和回复包（reply packet）。

在JDB里的例子中，我们使用JDB通过socket向本地的JVM发送JDWP请求。

Debugger 和 target Java 虚拟机都有可能发送 command packet。Debugger 通过发送 command packet 获取 target Java 虚拟机的信息以及控制程序的执行。Target Java 虚拟机通过发送 command packet 通知 debugger 某些事件的发生，如到达断点或是产生异常。

Reply packet 是用来回复 command packet 该命令是否执行成功，如果成功 reply packet 还有可能包含 command packet 请求的数据，比如当前的线程信息或者变量的值。从 target Java 虚拟机发送的事件消息是不需要回复的。

### 1.1.1、三个模块的主要功能

Java 虚拟机工具接口（JVMTI）

JVMTI（Java Virtual Machine Tool Interface）即指 Java 虚拟机工具接口，它是一套由虚拟机直接提供的 native 接口，它处于整个 JPDA 体系的最底层，所有调试功能本质上都需要通过 JVMTI 来提供。通过这些接口，开发人员不仅调试在该虚拟机上运行的 Java 程序，还能查看它们运行的状态，设置回调函数，控制某些环境变量，从而优化程序性能。我们知道，JVMTI 的前身是 JVMDI 和 JVMPI，它们原来分别被用于提供调试 Java 程序以及 Java 程序调节性能的功能。在 J2SE 5.0 之后 JDK 取代了 JVMDI 和 JVMPI 这两套接口，JVMDI 在最新的 Java SE 6 中已经不提供支持，而 JVMPI 也计划在 Java SE 7 后被彻底取代。

Java 调试交互协议（JDWP）

JDWP（Java Debug Wire Protocol）是一个为 Java 调试而设计的一个通讯交互协议，它定义了调试器和被调试程序之间传递的信息的格式。在 JPDA 体系中，作为前端（front-end）的调试者（debugger）进程和后端（back-end）的被调试程序（debuggee）进程之间的交互数据的格式就是由 JDWP 来描述的，它详细完整地定义了请求命令、回应数据和错误代码，保证了前端和后端的 JVMTI 和 JDI 的通信通畅。比如在 Sun 公司提供的实现中，它提供了一个名为 jdwp.dll（jdwp.so）的动态链接库文件，这个动态库文件实现了一个 Agent，它会负责解析前端发出的请求或者命令，并将其转化为 JVMTI 调用，然后将 JVMTI 函数的返回值封装成 JDWP 数据发还给后端。

另外，这里需要注意的是 JDWP 本身并不包括传输层的实现，传输层需要独立实现，但是 JDWP 包括了和传输层交互的严格的定义，就是说，JDWP 协议虽然不规定我们是通过 EMS 还是快递运送货物的，但是它规定了我们传送的货物的摆放的方式。在 Sun 公司提供的 JDK 中，在传输层上，它提供了 socket 方式，以及在 Windows 上的 shared memory 方式。当然，传输层本身无非就是本机内进程间通信方式和远端通信方式，用户有兴趣也可以按 JDWP 的标准自己实现。

Java 调试接口（JDI）

JDI（Java Debug Interface）是三个模块中最高层的接口，在多数的 JDK 中，它是由 Java 语言实现的。 JDI 由针对前端定义的接口组成，通过它，调试工具开发人员就能通过前端虚拟机上的调试器来远程操控后端虚拟机上被调试程序的运行，JDI 不仅能帮助开发人员格式化 JDWP 数据，而且还能为 JDWP 数据传输提供队列、缓存等优化服务。从理论上说，开发人员只需使用 JDWP 和 JVMTI 即可支持跨平台的远程调试，但是直接编写 JDWP 程序费时费力，而且效率不高。因此基于 Java 的 JDI 层的引入，简化了操作，提高了开发人员开发调试程序的效率。

### 1.1.2、三个模块的不同点

## 1.2、Jdb使用

用法:jdb

options参数

```java
其中, 选项包括:
    -help             输出此消息并退出
    -sourcepath <由 ";" 分隔的目录>
                      要在其中查找源文件的目录
    -attach <address>
                      使用标准连接器附加到指定地址处正在运行的 VM
    -listen <address>
                      等待正在运行的 VM 使用标准连接器在指定地址处连接
    -listenany
                      等待正在运行的 VM 使用标准连接器在任何可用地址处连接
    -launch
                      立即启动 VM 而不是等待 'run' 命令
    -listconnectors   列出此 VM 中的可用连接器
    -connect <connector-name>:<name1>=<value1>,...
                      使用所列参数值通过指定的连接器连接到目标 VM
    -dbgtrace [flags] 输出信息供调试jdb
    -tclient          在 HotSpot(TM) 客户机编译器中运行应用程序
    -tserver          在 HotSpot(TM) 服务器编译器中运行应用程序
转发到被调试进程的选项:
    -v -verbose[:class|gc|jni]
                      启用详细模式
    -D<name>=<value>  设置系统属性
    -classpath <由 ";" 分隔的目录>
                      列出要在其中查找类的目录
    -X<option>        非标准目标 VM 选项
<class> 是要开始调试的类的名称
<arguments> 是传递到 <class> 的 main() 方法的参数
```

更多参数

```java
Java远程调试 
-Xdebug -Xnoagent -Djava.compiler=NONE -Xrunjdwp:transport=dt_socket,server=y,address=3999,suspend=n 
-XDebug               启用调试。 
-Xnoagent             禁用默认sun.tools.debug调试器。 
-Djava.compiler=NONE  禁止 JIT 编译器的加载。 
-Xrunjdwp             加载JDWP的JPDA参考执行实例。 
transport             用于在调试程序和 VM 使用的进程之间通讯。 
dt_socket             套接字传输。 
dt_shmem              共享内存传输，仅限于 Windows。 
server=y/n            VM 是否需要作为调试服务器执行。 
address=3999          调试服务器的端口号，客户端用来连接服务器的端口号。 
suspend=y/n           是否在调试客户端建立连接之后启动 VM 。 
```

## 1.3、进入Jdb后调试命令

- 添加断点

```java
stop at com.test.MyClass:22 stop in java.lang.String.length stop in com.test.MyClass.<init>#构造函数 stop in com.test.MyClass.<clinit>#静态代码块 
```

- 查看线程

```java
threads查看所有线程
thread <id>查看单个线程
where查看线程堆栈
pop   当前帧出栈, 且打印当前帧 
```

- 单步调试

```java
step               执行当前行
step up            一直执行, 直到当前方法返回到其调用方
stepi              执行当前指令
next               步进一行 (调用) cont从断点处继续执行 
```

- 查看变量

```java
print <expr>          输出表达式的值
dump <expr>           输出所有对象信息
eval <expr>           对表达式求值 (与 print 相同) set <lvalue> = <expr>向字段/变量/数组元素分配新值 locals输出当前堆栈帧中的所有本地变量 
```

- 其他

```java
list [line number|method] -- 输出源代码
use (或 sourcepath) [source file path]显示或更改源路径(目录)
run运行
```

## 1.4、调试方式

测试类

```java
package com.lhx.cloud.javathread;
public class JdbTest {
    public void fn(){
        System.out.println("-----fn-----");
    }
}
```

View Code

```java
package com.lhx.cloud.javathread;
public class JdbMain {
    public static void main(String[] args) {
        JdbTest jdbTest=new JdbTest();
        jdbTest.fn();
    }
}
```

### 1.4.1、交互式调试【本机调试】

进入项目的：target\classes>目录下：

```java
jdb -XX:-UseCompressedOops -XX:+UseSerialGC  --启动jdb,可带参数
run com.lhx.cloud.javathread.JdbMain
```

或

```java
jdb com.lhx.cloud.javathread.JdbMain
run
```

注意：在window上可以成功，mac上此种方式调试失败

### 1.4.2、JDWP【远端连接调试】【mac可用】

java应用启动时，增加启动参数(linux和windows配置方式不一样

**1、**[jdb7官方说明文档](https://link.jianshu.com/?t=http://docs.oracle.com/javase/7/docs/technotes/tools/windows/jdb.html)；

**2、**[jdwp官方说明文档](https://link.jianshu.com/?t=https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/introclientissues005.html)；

**3、**[jdb8官方说明文档](https://link.jianshu.com/?t=http://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/tooldescr011.html#BABGIEHH)；

Linux：

一个窗口开启，使用下面命令

```java
java -Xdebug -Xrunjdwp:transport=dt_socket,address=8888,server=y,suspend=y com.lhx.cloud.javathread.MarkWord.JdbMain
```

开启另一个新窗口

```java
jdb -attach <ip>:8888连接到JVM，本机IP即可省略
```

WIndows

一个窗口开启，使用下面命令

```java
java -Xdebug -Xrunjdwp:transport=dt_shmem,address=debug,server=y,suspend=y com.lhx.cloud.javathread.MarkWord.JdbMain
```

开启另一个新窗口

```java
jdb -attach 'debug'连接到JVM，本机IP即可省略
```

当然以上方式同时可以配置在eclipse、idea等工具上

### 1.4.3、Connector

通过** jdb -listconnectors** 命令可以查看本机JDK支持的连接器;

**注意:通过Connector不需要做任何额外配置，但调速器不能对进程做任何修改，也就是说类似进入只读模式;**

1. 调试本地进程

```java
jdb -connect sun.jvm.hotspot.jdi.SAPIDAttachingConnector:pid=44159
```

**1、** 调试远程进程；

- 启动SA Debug Server

```java
jsadebugd <pid> [server-id]
```

如果启动多个debug server,可以配置server-id;

- 连接到远程SA Debug Server

```java
jdb -connect sun.jvm.hotspot.jdi.SADebugServerAttachingConnector:debugServerName=machine1
```

注:**machine1**为机器名或IP

**1、** 调试本机CoreDump；

```java
jdb  -connect sun.jvm.hotspot.jdi.SACoreAttachingConnector:core=   <core  file>,javaExecutable=$JAVA_HOME/bin/java
```

**1、** 调试远程CoreDump；

- 启动SA Debug Server

```java
jsadebugd $JAVA_HOME/bin/java core.20441
```

- 连接到远程SA Debug Server

```java
jdb -connect sun.jvm.hotspot.jdi.SADebugServerAttachingConnector:debugServerName=machine1
```

注:**machine1**为机器名或IP

## 二、通过HSDB来查看HotSpot VM的运行时数据

准备一、测试代码：

```java
package com.lhx.cloud.javathread.MarkWord
public class Test {
    static Test2 t1 = new Test2();
    Test2 t2 = new Test2();
    public void fn() {
        Test2 t3 = new Test2();
        System.out.println("-----fnfnfn-----");
    }
}
class Test2 {
}
```

main方法

```java
package com.lhx.cloud.javathread.MarkWord;
public class Main {
    public static void main(String[] args) {
        System.out.println("start");
        Test test = new Test();
        test.fn();
        System.out.println("end");
    }
}
```

准备二、使用JDB方式调试，打开一个终端

```java
java -Xdebug -Xrunjdwp:transport=dt_socket,address=8888,server=y,suspend=y com.lhx.cloud.javathread.MarkWord.Main
```

再打开另一个终端， attach上后，打一个行号断点在输出end代码，具体行号即可。

```java
jdb -attach 8888
```

```java
stop at com.lhx.cloud.javathread.MarkWord.Main:13
```

注意：推荐使用JDB调试模式，【idea工具测试了，找不到scanoops的类型】

为了方便klass地址显示，在mac上禁用掉指针压缩，即jdb -XX:-UseCompressedOops ,如果是JDWP，需要在java启动时候添加

为了方便调试和查看后续，可以在jdb 后追加 -XX:+UseSerialGC -Xmx10m ， 如果是JDWP，需要在java启动时候添加，故

```java
java -XX:-UseCompressedOops -XX:+UseSerialGC -Xmx10m -Xdebug -Xrunjdwp:transport=dt_socket,address=8888,server=y,suspend=y com.x.cloud.javathread.MarkWord.Main
```

## 2.1、启动

**1、** windows启动；

```java
java -cp .;%JAVA_HOME%/lib/sa-jdi.jar sun.jvm.hotspot.HSDB
```

注意：Linux和Solaris在Oracle/Sun JDK6就可以使用HSDB了，但Windows上要到Oracle JDK7才可以用HSDB

**2、** mac启动；

```java
 echo $JAVA_HOME  查看存在java_home
```

执行启动命令

```java
java -cp $JAVA_HOME/lib/sa-jdi.jar sun.jvm.hotspot.HSDB
```

如果没有权限：sudo chmod -R 777 你的文件夹名【sa-jdi.jar】,启动后显示如下

如果内部连接无效：可以尝试使用命令。异常信息【在Attach to HotSpot process时，sun.jvm.hotspot.debugger.DebuggerException:Can't attach to the process.……lack of privilege。】

```java
sudo java -cp $JAVA_HOME/lib/sa-jdi.jar sun.jvm.hotspot.HSDB
```

## 2.2、进程连接以及使用

**2、** 2.1、基本连接；

启动HSDB之后，把它连接到目标进程上。从菜单里选择File -> Attach to HotSpot process：

启动java程序，通过idea等工具打断点，暂停程序，可以通过JPS查看等查看进程ID

在弹出的对话框里输入刚才记下的pid，然后按OK。这会儿就连接到目标进程了：

刚开始打开的窗口是Java Threads，里面有个线程列表。双击代表线程的行会打开一个Oop Inspector窗口显示HotSpot VM里记录线程的一些基本信息的C++对象的内容。

不过这里我们更可能会关心的是线程栈的内存数据。先选择main线程，然后点击Java Threads窗口里的工具栏按钮从左数第2个可以打开Stack Memory窗口来显示main线程的栈：

Stack Memory窗口的内容有三栏：

左起第1栏是内存地址，请让我提醒一下本文里提到“内存地址”的地方都是指虚拟内存意义上的地址，**不是**“物理内存地址”，请不要弄混了这俩概念；

第2栏是该地址上存的数据，以字宽为单位，本文例子中我是在Windows 7 64-bit上跑64位的JDK7的HotSpot VM，字宽是64位（8字节）；

第3栏是对数据的注释，竖线表示范围，横线或斜线连接范围与注释文字。

**2、** 2.2、console使用以及命令；

现在让我们打开HSDB里的控制台，以便用命令来了解更多信息。

在菜单里选择Windows -> Console

然后会得到一个空白的Command Line窗口。在里面敲一下回车就会出现hsdb>提示符

可以通过help命令看看命令列表

```java
  assert true | false
  attach pid | exec core
  buildreplayjars [ all | app | boot ]  | [ prefix ]
  class name
  classes
  detach
  dis address [length]
  disassemble address
  dumpcfg { -a | id }
  dumpclass { address | name } [ directory ]
  dumpcodecache
  dumpheap [ file ]
  dumpideal { -a | id }
  dumpilt { -a | id }
  dumpreplaydata { <address > | -a | <thread_id> }
  echo [ true | false ]
  examine [ address/count ] | [ address,address]
  field [ type [ name fieldtype isStatic offset address ] ]
  findpc address
  flags [ flag | -nd ]
  help [ command ]
  history
  inspect expression
  intConstant [ name [ value ] ]
  jdis address
  jhisto
  jseval script
  jsload file
  jstack [-v]
  livenmethods
  longConstant [ name [ value ] ]
  mem address [ length ]
  pmap
  print expression
  printall
  printas type expression
  printmdo [ -a | expression ]
  printstatics [ type ]
  pstack [-v]
  quit
  reattach
  revptrs address
  scanoops start end [ type ]
  search [ heap | perm | rawheap | codecache | threads ] value
  source filename
  symbol address
  symboldump
  symboltable name
  sysprops
  thread { -a | id }
  threads
  tokenize ...
  type [ type [ name super isOop isInteger isUnsigned size ] ]
  universe#查看GC堆的地址范围和使用情况
  verbose true | false
  versioncheck [ true | false ]
  vmstructsdump
  whatis address
  where { -a | id }
```

基本命令说明：

1、universe命令来查看GC堆的地址范围和使用情况

```java
hsdb> universe
Heap Parameters:
Gen 0:   eden [0x0000000110400000,0x00000001104ab870,0x00000001106b0000) space capacity = 2818048, 24.93129996366279 used
  from [0x00000001106b0000,0x00000001106b0000,0x0000000110700000) space capacity = 327680, 0.0 used
  to   [0x0000000110700000,0x0000000110700000,0x0000000110750000) space capacity = 327680, 0.0 usedInvocations: 0
Gen 1:   old  [0x0000000110750000,0x0000000110750000,0x0000000110e00000) space capacity = 7012352, 0.0 usedInvocations: 0
```

可以发现HotSpot在1.8的Java堆中，已经去除了Perm gen区，由youyoung gen和old gen组成。

2、scanoops 查看类型

Java代码里，执行到Test.fn()末尾为止应该创建了3个Test2的实例，它们必然在GC堆里，但都在哪里，可以用scanoops命令来看：

```java
hsdb> scanoops 0x0000000110400000 0x0000000110e00000 com.lhx.cloud.javathread.MarkWord.Test2
0x00000001104a5ec0 com/lhx/cloud/javathread/MarkWord/Test2
0x00000001104a5ee8 com/lhx/cloud/javathread/MarkWord/Test2
0x00000001104a5ef8 com/lhx/cloud/javathread/MarkWord/Test2
```

scanoops接受两个必选参数和一个可选参数：必选参数是要扫描的地址范围，一个是起始地址一个是结束地址；可选参数用于指定要扫描什么类型的对象实例。实际扫描的时候会扫出指定的类型及其派生类的实例。

左边是对象的起始地址，右边是对象的实际类型

从它们所在的地址，对照前面universe命令看到的GC堆的地址范围，可以知道它们都在eden里。

3、whatis命令可以进一步知道它们都在eden之中分配给main线程的thread-local allocation buffer (TLAB)中

```java
hsdb> whatis 0x00000001104a5ec0
Address 0x00000001104a5ec0: In thread-local allocation buffer for thread "main" (6659)  [0x000000011049db70,0x00000001104a5fd0,0x00000001104ab858,{0x00000001104ab870})
```

如果是用Parallel GC，其实稍微改造一下Serviceability Agent的Java部分就可以让whatis正确显示了，其实就是上文在启动时设置下GC方式

```java
hsdb> whatis 0x000000076ab7a5b8
Address 0x000000076ab7a5b8: In unknown section of Java heap 
```

4、inspect命令来查看对象的内容：

```java
hsdb> inspect 0x00000001104a5ec0
instance of Oop for com/lhx/cloud/javathread/MarkWord/Test2 @ 0x00000001104a5ec0 @ 0x00000001104a5ec0 (size = 16)
_mark: 1
_metadata._klass: InstanceKlass for com/lhx/cloud/javathread/MarkWord/Test2
```

为了方便klass地址显示，在mac上禁用掉指针压缩，即jdb -XX:-UseCompressedOops ,但此处没生效，可以使用下面的men查看

可见一个Test2的实例要16字节。因为Test2类没有任何Java层的实例字段，这里就没有任何Java实例字段可显示。

5、mem命令来看实际内存里的数据格式：

```java
hsdb> mem 0x00000001104a5ec0 2
0x00000001104a5ec0: 0x0000000000000001 
0x00000001104a5ec8: 0x0000000111201028 
```

mem命令接受的两个参数都必选，一个是起始地址，另一个是以字宽为单位的“长度”。我们知道一个Test2实例有16字节，所以给定长度为2来看。

mem详细含义：

```java
0x00000001104a5ec0:  _mark:                        0x0000000000000001   
0x00000001104a5ec8:  _metadata._compressed_klass:  0x0000000111201028  
```

对于一个空的Test2的实例包含2个给VM用的隐含字段作为对象头，和0个Java字段。

对象头的第一个字段是mark word，记录该对象的GC状态、同步状态、identity hash code之类的多种信息

对象头的第二个字段是个类型信息指针，klass pointer。这里因为默认开启了压缩指针，所以本来应该是64位的指针存在了32位字段里。

最后还有4个字节是为了满足对齐需求而做的填充（padding）

6、Inspector工具界面

结合4、5可以通过，在菜单里选Tools -> Inspector，在地址里输入前面看到的klass地址：【5中第二项左侧的地址】

Oop【原InstanceKlass】存着Java类型的名字、继承关系、实现接口关系，字段信息，方法信息，运行时常量池的指针，还有内嵌的虚方法表（vtable）、接口方法表（itable）和记录对象里什么位置上有GC会关心的指针（oop map）等等。

是给VM内部用的，并不直接暴露给Java层；InstanceKlass不是java.lang.Class的实例。

在HotSpot VM里，java.lang.Class的实例被称为“Java mirror”，意思是它是VM内部用的klass对象的“镜像”，把klass对象包装了一层来暴露给Java层使用。

在InstanceKlass里有个_java_mirror字段引用着它对应的Java mirror，而mirror里也有个隐藏字段指向其对应的InstanceKlass。所以当我们写obj.getClass()，在HotSpot VM里实际上经过了两层间接引用才能找到最终的Class对象：

```java
obj->_klass->_java_mirror
```

在Oracle JDK7之前，Oracle/Sun JDK的HotSpot VM把Java类的静态变量存在InstanceKlass结构的末尾；从Oracle JDK7开始，为了配合PermGen移除的工作，Java类的静态变量被挪到Java mirror（Class对象）的末尾了。

在JDK7之前Java mirror存放在PermGen里，而从JDK7开始Java mirror默认也跟普通Java对象一样先从eden开始分配而不放在PermGen里。到JDK8则进一步彻底移除了PermGen，把诸如klass之类的元数据都挪到GC堆之外管理，而Java mirror的处理则跟JDK7一样。

7、revptrs 反向指针

HotSpot VM内部使用直接指针来实现Java引用。在64位环境中有可能启用“压缩指针”的功能把64位指针压缩到只用32位来存。压缩指针与非压缩指针直接有非常简单的1对1对应关系，前者可以看作后者的特例。

如果要找t1、t2、t3这三个变量，等同于找出存有指向上述3个Test2实例的地址的存储位置。

“反向指针”——如果a变量引用着b对象，那么从b对象出发去找a变量就是找一个“反向指针”。

※、查询第一个test2实例：

```java
hsdb> revptrs 0x00000001104a5ec0
Computing reverse pointers...
Done.
null
Oop for java/lang/Class @ 0x00000001104a35c8
```

找到了一个包含指向Test2实例的指针，在一个java.lang.Class的实例里。

用whatis命令来看看这个Class对象在哪里：

```java
hsdb> whatis 0x00000001104a35c8
Address 0x00000001104a35c8: In thread-local allocation buffer for thread "main" (6659)  [0x000000011049db70,0x00000001104a5fd0,0x00000001104ab858,{0x00000001104ab870})
```

可以看到这个Class对象也在eden里，具体来说在main线程的TLAB里。

这个Class对象是如何引用到Test2的实例的呢？再用inspect命令：

```java
hsdb> inspect 0x00000001104a35c8
instance of Oop for java/lang/Class @ 0x00000001104a35c8 @ 0x00000001104a35c8 (size = 168)
<<Reverse pointers>>: 
t1: Oop for com/lhx/cloud/javathread/MarkWord/Test2 @ 0x00000001104a5ec0 Oop for com/lhx/cloud/javathread/MarkWord/Test2 @ 0x00000001104a5ec0
hsdb> 
```

可以看到，这个Class对象里存着Test类的静态变量t1，指向着第一个Test2实例。 【这里没有对象头】

本来JVM规范里也没明确规定静态变量要存在哪里，通常认为它应该在概念中的“方法区”里；但现在在JDK7的HotSpot VM里它实质上也被放在Java heap里了。可以把这种特例看作是HotSpot VM把方法区的一部分数据也放在Java heap里了。

前面也已经提过，在JDK7之前的Oracle/Sun JDK里的HotSpot VM把静态变量存在InstanceKlass末尾，存在PermGen里。那个时候的PermGen更接近于完整的方法区一些。

※、查询第二个test2实例：

依次通过，revptrs，whatis，inspect命令查看

```java
hsdb> revptrs 0x00000001104a5ee8
Oop for com/lhx/cloud/javathread/MarkWord/Test @ 0x00000001104a5ed0
hsdb> whatis 0x00000001104a5ed0
Address 0x00000001104a5ed0: In thread-local allocation buffer for thread "main" (6659)  [0x000000011049db70,0x00000001104a5fd0,0x00000001104ab858,{0x00000001104ab870})
hsdb> inspect 0x00000001104a5ed0
instance of Oop for com/lhx/cloud/javathread/MarkWord/Test @ 0x00000001104a5ed0 @ 0x00000001104a5ed0 (size = 24)
<<Reverse pointers>>: 
_mark: 1
_metadata._klass: InstanceKlass for com/lhx/cloud/javathread/MarkWord/Test
t2: Oop for com/lhx/cloud/javathread/MarkWord/Test2 @ 0x00000001104a5ee8 Oop for com/lhx/cloud/javathread/MarkWord/Test2 @ 0x00000001104a5ee8
```

也在main线程的TLAB里，可以看到这个Test实例里有个成员字段t2，指向了第二个Test2实例。

※、查询第三个test2实例：

```java
hsdb> revptrs 0x00000001104a5ef8
no live references to 0x00000001104a5ef8
```

查看线程栈

更多使用：https://rednaxelafx.iteye.com/blog/1847971
