# 17、Intellij Idea Profiler分析器
- 来源：https://ddkk.com/zhuanlan/tools/idea/17.html
- 分类：开发工具
- 分组：教程目录
Profiler 提供了有关我们应用程序性能的准确信息。它通过我们的应用程序测量 CPU、内存和堆使用的性能。它还为我们提供了有关应用程序线程的详细信息。VisualVM 工具用于测量 Java 应用程序分析。

## 什么是 VisualVM？

它是一个可视化工具，已与 JDK 以及 Java 6 或更高版本捆绑在一起。它适合初学者，并提供有关我们应用程序性能的详细信息。

## 配置

### 在 Windows 中

**1、** 下载VisualVM[点击这里](https://visualvm.github.io/download.html)下载；

**2、** 解压缩下载的Zip文件；

**3、** 在提取的文件中，转到etc/visualvm.conf文件检查以下行visualvm_jdkhome="”；

**4、** 如果安装了Jdk，那么它应该看起来像这样visualvm_jdkhome="C:\ProgramFiles\Java\jdk-8.0.1"；

### 在 Linux 中

要安装VisualVM，请在终端中键入以下内容：

**1、** $sudoapt-getinstalldefault-jdk；

**2、** $sudoapt安装visualvm；

**3、** 要打开VisualVM，请键入$visualvm；

## 监控应用

**1、** 打开visualvm；

**2、** 在左窗格中选择应用程序；

**3、** 选择监视器选项卡；

我们可以在这里看到 CPU、堆、类和线程的使用情况。我们还可以通过将鼠标悬停在任何图形上来查看特定用法。

## 螺纹测量

每个Java 应用程序都有多个线程。我们可以在 VisualVM 工具中查看线程的详细信息。选择Thread选项卡，它将显示有关我们应用程序线程的各种统计信息，例如Live 线程数和Daemon 线程数。我们可以在下图中看到它，其中Running、Sleeping、Wait、Park、Monitor线程向我们展示。

## 抽样申请

VisualVM 为我们提供了 CPU、内存采样和内存泄漏的信息。要进行采样，请选择应用程序并选择采样器选项卡。Sampler Tab 有 3 个 Sub-Tab-：CPU Tab、Memory Tab 和 Stop Tap。

## CPU采样

要进行CPU 采样，请单击CPU 按钮。将出现以下屏幕截图。

## 内存采样

要进行内存采样，请单击内存按钮。将出现以下屏幕截图。

## 内存泄漏

内存泄漏是应用程序中不再使用某些对象并且垃圾收集器无法将它们识别为未使用的情况。在程序运行过程中，它用程序中没有使用的对象填充堆区域。当由于不必要的对象存储而导致内存空间已满时，我们可以将其理解为内存泄漏的迹象。
