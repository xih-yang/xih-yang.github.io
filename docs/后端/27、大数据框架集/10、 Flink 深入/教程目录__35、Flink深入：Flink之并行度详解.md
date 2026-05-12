# 35、Flink深入：Flink之并行度详解
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/35.html
- 分类：大数据框架
- 分组：教程目录
## 1. Flink中的TaskManger与Slots

Flink中每一个worker(TaskManager)都是一个**JVM进程**，它可能会在**独立的线程**上执行一个或多个subtask。为了控制一个worker能接收多少个task，worker通过task slot来进行控制（一个worker至少有一个task slot）。

每个task slot表示TaskManager拥有资源的**一个固定大小的子集**。假如一个TaskManager有三个slot，那么它会将其管理的内存分成三份给各个slot。资源slot化意味着一个subtask将不需要跟来自其他job的subtask竞争被管理的内存，取而代之的是它将拥有一定数量的内存储备。需要注意的是，这里不会涉及到CPU的隔离，slot目前仅仅用来隔离task的受管理的内存。

通过调整task slot的数量，允许用户定义subtask之间如何互相隔离。如果一个TaskManager一个slot，那将意味着每个task group运行在独立的JVM中（该JVM可能是通过一个特定的容器启动的），而一个TaskManager多个slot意味着更多的subtask可以共享同一个JVM。而在同一个JVM进程中的task将共享TCP连接（基于多路复用）和心跳消息。它们也可能共享数据集和数据结构，因此这减少了每个task的负载。

图 TaskManager与Slot

图 子任务共享Slot

默认情况下，Flink允许子任务共享slot，即使它们是不同任务的子任务（前提是它们来自同一个job）。 这样的结果是，一个slot可以保存作业的整个管道。

**Task Slot是静态的概念，是指TaskManager具有的并发执行能力**，可以通过参数taskmanager.numberOfTaskSlots进行配置；而**并行度parallelism是动态概念，即TaskManager运行程序时实际使用的并发能力**，可以通过参数parallelism.default进行配置。

也就是说，假设一共有3个TaskManager，每一个TaskManager中的分配3个TaskSlot，也就是每个TaskManager可以接收3个task，一共9个TaskSlot，如果我们设置parallelism.default=1，即运行程序默认的并行度为1，9个TaskSlot只用了1个，有8个空闲，因此，设置合适的并行度才能提高效率。

## 2. Flink中并行度概述

Flink程序的执行具有**并行、分布式**的特性。

在执行过程中，一个流（stream）包含一个或多个分区（stream partition），而每一个算子（operator）可以包含一个或多个子任务（operator subtask），这些子任务在不同的线程、不同的物理机或不同的容器中彼此互不依赖地执行。

**一个特定算子的子任务（subtask）的个数被称之为其并行度（parallelism**。一般情况下，一个流程序的并行度，可以认为就是其所有算子中最大的并行度。一个程序中，不同的算子可能具有不同的并行度。

图 并行数据流

> 模式一：类似于spark中的窄依赖
>
> Stream在算子之间传输数据的形式可以是one-to-one(forwarding)的模式也可以是redistributing的模式，具体是哪一种形式，取决于算子的种类。
>
> One-to-one ：stream(比如在source和map operator之间)维护着分区以及元素的顺序。那意味着map 算子的子任务看到的元素的个数以及顺序跟source 算子的子任务生产的元素的个数、顺序相同，map、fliter、flatMap等算子都是one-to-one的对应关系。
>
>
> 模式二：类似于spark中的宽依赖
>
> Redistributing ：stream(map()跟keyBy/window之间或者keyBy/window跟sink之间)的分区会发生改变。每一个算子的子任务依据所选择的transformation发送数据到不同的目标任务。例如，keyBy() 基于hashCode重分区、broadcast和rebalance会随机重新分区，这些算子都会引起redistribute过程，而redistribute过程就类似于Spark中的shuffle过程。

## 3. 算子级别（Operator Level）并行度

> 一个算子、数据源和sink的并行度可以通过调用 setParallelism()方法来指定

## 4. Env级别（Execution Environment Level）并行度

> 执行环境(任务)的默认并行度可以通过调用setParallelism()方法指定。为了以并行度3来执行所有的算子、数据源和data sink， 可以通过如下的方式设置执行环境的并行度：执行环境的并行度可以通过显式设置算子的并行度而被重写。

## 5. 客户端级别（Client Level）并行度

> 并行度可以在客户端将job提交到Flink时设定。
>
> 对于CLI客户端，可以通过-p参数指定并行度 ./bin/flink run -p 10 WordCount-java.jar

## 6. 系统默认级别（System Level）并行度

> 在系统级可以通过设置flink-conf.yaml文件中的parallelism.default属性来指定所有执行环境的默认并行度。

## 7. 示例说明

示例 图1

示例 图2

> Example1：
>
> 在fink-conf.yaml中 taskmanager.numberOfTaskSlots 默认值为1，即每个Task Manager上只有一个Slot ，此处是3
>
> Example1中，WordCount程序设置了并行度为1，意味着程序 Source、Reduce、Sink在一个Slot中，占用一个Slot
>
> Example2：
>
> 通过设置并行度为2后，将占用2个Slot
>
> Example3：
>
> 通过设置并行度为9，将占用9个Slot
>
> Example4：
>
> 通过设置并行度为9，并且设置sink的并行度为1，则Source、Reduce将占用9个Slot，但是Sink只占用1个Slot

## 8. 注意

```java
① 并行度的优先级：算子级别 > env级别 > Client级别 > 系统默认级别 (越靠前具体的代码并行度的优先级越高)
② 如果source不可以被并行执行，即使指定了并行度为多个，也不会生效
③ 在实际生产中，我们推荐在算子级别显示指定各自的并行度，方便进行显示和精确的资源控制。
④ slot是静态的概念，是指taskmanager具有的并发执行能力; parallelism是动态的概念，是指程序运行时实际使用的并发能力
```

## 9. Flink中的任务链（Operator Chains）

**相同并行度的one to one****操作**，Flink这样相连的算子链接在一起形成一个task，原来的算子成为里面的一部分。将算子链接成task是非常有效的优化：它能减少线程之间的切换和基于缓存区的数据交换，在减少时延的同时提升吞吐量。链接的行为可以在编程API中进行指定。

图 task与operator chains

**注意：可以通过 .disableChaining() 方法来切分算子链**
