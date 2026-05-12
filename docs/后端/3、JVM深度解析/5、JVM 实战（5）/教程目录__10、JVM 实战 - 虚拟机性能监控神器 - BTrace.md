# 10、JVM 实战 - 虚拟机性能监控神器 - BTrace
- 来源：https://ddkk.com/zhuanlan/java/jvm/5/10.html
- 分类：JVM 实战
- 分组：教程目录
## BTrace 是什么？

BTrace 是一个动态安全的 Java 追踪工具，它通过向运行中的 Java 程序植入字节码文件，来对运行中的 Java 程序热更新，方便的获取程序运行时的数据信息，并且，保证自己的消耗特别小，大部分情况下不会影响 Java 程序的性能。

## BTrace 能干什么？

相信每一位开发都或多或少的干过这档子事：为了解决线上的一个 bug，不得不在代码中打印下入参、出参数据，然后再重启服务器，观察日志。BTrace 的出现就是为了解决这类事宜，BTrace 的最大好处，是可以通过自己编写的脚本，获取应用的一切调用信息，而不需要不断的修改代码，然后重启应用。

以下是BTrace 的一些典型应用场景：

- 服务慢，能找出慢在哪一步，哪个函数里么？
- 谁调用了System.gc()，调用栈如何？
- 谁构造了一个超大的 ArrayList?
- 什么样的入参或对象属性，导致抛出了这个异常？或进入了这个处理分支？

## BTrace 快速开始

下载最新的 BTrace releases 版本：[https://github.com/btraceio/btrace/releases](https://github.com/btraceio/btrace/releases)

解压文件夹，在 /bin 目录下主要有两个命令：一个是 btrace，一个是 btracec。

### btrace

```java
BTRACE_HOME/bin/btrace PID <trace_script>
```

btrace 将通过 JVM Attach API 连接到 的 java 应用程序，然后把脚本绑定到应用进程，进行 AOP 式的代码植入。

### btracec

```java
BTRACE_HOME/bin/btracec <trace_script>
```

类似于javac，btracec 命令是用来预编译脚本的，以此校验脚本语法的正确性，要不然等运行到线上才发现写错就尴尬了。

## BTrace 脚本

写到这里，唯一能阻碍我们继续下去的，就是怎么写 BTrace 脚本了。

首先，推荐在集成工具（IDEA、Eclipse）中编写 BTrace 脚本，引入 BTrace 的依赖：

```java
<dependency>
    <groupId>com.sun.tools.btrace</groupId>
    <artifactId>btrace-agent</artifactId>
    <version>1.2.3</version>
    <type>jar</type>
    <scope>system</scope>
    <systemPath>D:\btace\libs\btrace-agent.jar</systemPath>
</dependency>
<dependency>
    <groupId>com.sun.tools.btrace</groupId>
    <artifactId>btrace-boot</artifactId>
    <version>1.2.3</version>
    <type>jar</type>
    <scope>system</scope>
    <systemPath>D:\btace\libs\btrace-boot.jar</systemPath>
</dependency>
<dependency>
    <groupId>com.sun.tools.btrace</groupId>
    <artifactId>btrace-client</artifactId>
    <version>1.2.3</version>
    <type>jar</type>
    <scope>system</scope>
    <systemPath>D:\btace\libs\btrace-client.jar</systemPath>
</dependency>
```

先来看一个简单的 Demo 示例：

```java
@BTrace//表示这是一个BTrace跟踪脚本
public class Hello {
    @OnMethod(clazz = "org.jvm.demo.chapter4.btrace.BtraceCase", // 全类名
            method = "add", // 方法名
            location = @Location(Kind.RETURN) // 表示跟踪某个类的某个方法，位置为方法返回处
    )
    public static void run(@Self Object self, int a, int b, // 入参，按顺序定义
                           @Return int result, // 出参
                           @Duration long time // 方法耗时
    ) {
        BTraceUtils.print("打印入参, a = " + a + ",b=" + b);
        BTraceUtils.print("打印出参, result = " + result);
        BTraceUtils.print("打印耗时，time = " + time);
    }
}
```

```java
btrace.bat 4284 src/main/java/org/jvm/demo/chapter4/btrace/Hello.java
```

BTrace 主要有两类注解需要学习，一类是**探测方法的注解**，像上面的 @OnMethod 注解，类似的还有 @OnTimer、@OnError、@OnExit、@OnEvent、@OnLowMemory、@OnProbe 等等；另一类是**探测方法参数的注解**，像上面的 @Return、@Duration、@Self，类似的还有 @ProbeMethodName、@ProbeClassName、@TargetInstance、@TargetMethodOrField 等等

本文不过分说明 BTrace 的语法，私以为平常遇到什么样的业务场景，边学边用就是了，以下是官方的一些 BTrace 资料：

- [BTrace Github Wiki](https://github.com/btraceio/btrace/wiki)
- [BTrace User's Guide](https://zcfy.cc/original/btrace-wiki-userguide-mdash-project-kenai-952.html)

由于BTrace 的安全和性能考虑，一般情况下不允许在探查方法中调用 BTraceUtils 以外的其它方法，但可使用 unsafe 模式。

BTrace 植入过的代码，会一直在，直到应用重启为止。所以即使 Btrace 退出了，业务函数每次执行时都会多出一次 Btrace 是否 Attach 状态的判断。

为了保证程序的安全，BTrace对编写的脚本进行了一些限制，比如不允许在脚本中创建对象，不允许在脚本中抛出异常等，更详细的限制请参考 [BTrace 使用限制](https://github.com/btraceio/btrace/wiki/Trace-Scripts)。

推荐阅读：

**1、**[Btrace入门到熟练小工完全指南](https://github.com/btraceio/btrace/wiki/Trace-Scripts)；

**2、** [如何在生产环境使用Btrace进行调试][Btrace1]；

**3、** [BTrace使用小结][BTrace1]；
