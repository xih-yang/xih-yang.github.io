# 02、JVM 调优实战 - 调优工具 Arthas 实战使用
- 来源：https://ddkk.com/zhuanlan/java/jvm/10/2.html
- 分类：JVM 实战
- 分组：教程目录
Arthas 是 Alibaba 开源的 Java 诊断工具，深受开发者喜爱。Arthas 支持 JDK 6以上版本，支持 Linux/Mac/Windows，而且这些环境的命令都一样，采用命令行交互模式，同时提供丰富的 Tab 自动补全功能，进行问题的定位和诊断

官方文档参考 https://alibaba.github.io/arthas/

## 一、下载和安装

不需要安装，就是一个 jar 包

curl -O https://alibaba.github.io/arthas/arthas-boot.jar

java -jar arthas-boot.jar

启动arthas 的 jar 包是 arthas-boot.jar

## 二、快速入门

**1、** 直接java-jararthas-boot.jar选择attach的进程绑定一步方便进行问题的定位和诊断；

**2、** 通过jps命令快速查找java进程，再次直接绑定java-jararthas-boot.jarpid启动arthas工具attach到目标进程；

进入arthas 后命令行前面出现标识 ：[arthas@11312]$，都是很有规律的。

## 三、常用命令

**1、Dashboard 仪表盘作用的命令**

注意在 arthas 中，有 tab 键填充功能，所以比较好用。但是这个界面是实时刷新的，一般 5s 刷新一次，使用 q 键退出刷新（没有退出 arthasq ）

每一列的意义：

**2、Thread**

这个命令和 jstack 很相似，但是功能更加强大，主要是查看当前 JVM 的线程堆栈信息

同时可以结合使用 thread –b 来进行死锁的排查死锁。

参数解释：

-n 指定最忙的前 n 个线程并打印堆栈 -b 找出阻塞当前线程的线程

-i 指定 cpu 占比统计的采样间隔，单位为毫秒

**实战演示**

thread 显示线程信息

thread –h 显示帮助

**thread –b****找出阻塞当前线程的线程，如图：**

如果有死锁，会有红色的字提醒着，这个阻塞的线程已经被另外一个线程阻塞。

**thread -i 1000 -n 3****每过****1000****毫秒进行采样，显示最占****CPU****时间的前****3****个线程**

**thread --state WAITING****查看处于等待状态的线程**

**3、JVM**

**4、Jad**

反编译指定已加载类的源码

**5、trace**

使用**trace** 命令可以跟踪统计方法耗时。 继续跟踪耗时高的方法，然后再次访问 比如使用一个 Springboot 项目（当然，不想 Springboot 的话，你也可以直接在 UserController 里 main 方法启动）控制层 getUser 方法调用

了userService.get(uid); ，这个方法中分别进行 check 、 service 、 redis 、 mysql 等操作操作。就可以根据这个命令跟踪出来哪里的耗时最长。

访问一次：

**6、** monitor；

每5 秒统计一次 cn.enjoyedu.demo.controller.DemoController 类的 test 方法执行情况

调用方法后 5 秒刷新一次

**7、** watch命令观察方法的入参出参信息；

# 查看入参和出参，现在调用两次看效果：

$watch cn.enjoyedu.demo.controller.DemoController test '{params[0],returnObj}'

**8、** 主要命令汇总：；

[参考其他](https://mp.weixin.qq.com/s/HfbAoUIwv4kWXN95sVnYSA)

Arthas 工具使用主要是这么多，下一篇我们分析它的原理 Java Agent 技术，敬请期待！
