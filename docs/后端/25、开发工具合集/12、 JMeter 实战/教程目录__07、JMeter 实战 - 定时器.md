# 07、JMeter 实战 - 定时器
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/7.html
- 分类：开发工具
- 分组：教程目录
jmeter提供了很多元件，帮助我们更好的完成各种场景的性能测试，其中，定时器（timer）是很重要的一个元件，最新的3.0版本jemter提供了9种定时器（之前6种），下面一一介绍：

## 一、定时器的作用域

**1、** 定时器是在每个sampler（采样器）之前执行的，而不是之后（无论定时器位置在sampler之前还是下面）；

**2、** 当执行一个sampler之前时，所有当前作用域内的定时器都会被执行；

**3、** 如果希望定时器仅应用于其中一个sampler，则把定时器作为子节点加入；

**4、** 如果希望在sampler执行完之后再等待，则可以使用Test Action；

## 二、定时器的作用

**1、固定定时器（Constant Timer）**

如果你需要让每个线程在请求之前按相同的指定时间停顿，那么可以使用这个定时器；需要注意的是，固定定时器的延时不会计入单个sampler的响应时间，但会计入事务控制器的时间。

对于“java请求”这个sampler来说，定时器相当于loadrunner中的pacing（两次迭代之间的间隔时间）；

对于“事务控制器”来说，定时器相当于loadrunner中的think time（思考时间：实际操作中，模拟真实用户在操作过程中的等待时间）。

我们通常说的响应时间，应该大部分情况下是针对某一个具体的sampler（http请求），而不是针对一组sampler组合的事务 。

**2、高斯随机定时器（Gaussian Random Timer）**

如需要每个线程在请求前按随机时间停顿，那么使用这个定时器，上图表示暂停时间会分布在100到400之间，计算公式参考：Math.abs((this.random.nextGaussian() * 300) + 100)

**3、均匀随机定时器（Uniform Random Timer）**

和高斯随机定时器的作用差异不大，区别在于延时时间在指定范围内且每个时间的取值概率相同，每个时间间隔都有相同的概率发生，总的延迟时间就是随机值和偏移值之和。

下面表示的是随机延迟时间的最大值是100毫秒：

（1）Random Delay Maximum(in milliseconds):随机延迟时间的最大毫秒数

（2）Constant Delay Offset(in milliseconds):暂停的毫秒数减去随机延迟的毫秒数

**4、固定吞吐量定时器（Constant Throughput Timer）**

可以让JMeter以指定数字的吞吐量（即指定TPS，只是这里要求指定每分钟的执行数，而不是每秒）执行。

吞吐量计算的范围可以为指定为当前线程、当前线程组、所有线程组等范围，并且计算吞吐量的依据可以是最近一次线程的执行时延。这种定时器在特定的场景下，还是很有用的。

**5、同步定时器（Synchronizing Timer）**

这个定时器和loadrunner当中的集合点（rendezvous point）作用相似，其作用是：阻塞线程，直到指定的线程数量到达后，再一起释放，可以瞬间产生很大的压力（人多力量大- -哈哈！）

（1）Number of Simulated Users to Group by:模拟用户的数量，即指定同时释放的线程数数量

（2）Timeout in milliseconds:超时时间，即超时多少毫秒后同时释放指定的线程数

**6、BeanShell定时器（BeanShell Timer）**

这个定时器，一般情况下用不到，但它可以说是最强大的，因为可以自己变成实现想要做的任何事情，例如：希望在每个线程执行完等待一下，或者希望在某个变量达到指定值的时候等待一下。

这里给大家介绍下BeanShell：

BeanShell是一种松散类型的脚本语言（这点和JS类似），一种完全符合java语法的java脚本语言，并且又拥有自己的一些语法和方法。

**7、泊松随机定时器（Poisson Random Timer）**

这个定时器在每个线程请求之前按随机的时间停顿，大部分的时间间隔出现在一个特定的值，总的延迟就是泊松分布值和偏移值之和。

上面表示暂停时间会分布在100到400毫秒之间：

（1）Lambda(in milliseconds):兰布达值

（2）Constant Delay Offset(in milliseconds):暂停的毫秒数减去随机延迟的毫秒数

**8、JSR223定时器（JSR223 Timer）**

在jemter最新的版本中，新增了这个定时器，可以这么理解，这个定时器相当于BeanShell定时器的“父集”，它可以使用java、JavaScript、beanshell等多种语言去实现你希望完成的事情；

我们都知道jemter是一种开源的纯java工具，可以自己构件各个组件，jar包去完成各种事情。

**9、BSF定时器（BSF Timer）**

BSFTimer，也是jmeter新的版本中新增的定时器，其使用方法和JSR223 Timer很相似，只需要在jmeter的lib文件夹导入其jar包，就可以支持脚本语言直接访问Java对象和方法的一定时器。

有了它, 你就能在java application中使用javascript, Python, XSLT, Perl, tcl, ……等一大堆scripting language. 反过来也可以；
