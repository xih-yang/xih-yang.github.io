# 05、Intellij Idea 与Eclipse的区别
- 来源：https://ddkk.com/zhuanlan/tools/idea/5.html
- 分类：开发工具
- 分组：教程目录
## Intellij Idea

IntelliJ IDEA 是面向 Java 开发人员的最强大、最受欢迎和功能齐全的IDE，于 2001 年面向公众发布。它由Jet Brains 公司开发和维护。它由Apache 2.0授权。

IntelliJ Idea 有两个版本：

社区版：免费提供，主要用于 Java 和 Android 开发人员。它支持大多数语言，如 Java、Kotlin、Groovy、Clojure、Scala 等。它包括代码完成、深度静态分析、智能重构、调试器、测试运行器等功能。

商业版：商业版具有用于开发 Web 和桌面应用程序的最高级功能集。支持Spring框架的集成，Node.js、Angular、React等Web开发框架，JSF、JAX-RS、JPA、CDI等Java EE支持。

## Eclipse

Eclipse 是一个开源 IDE，用于使用 Java、Python、Ruby、C、C++ 等开发应用程序。IBM于 2001 年根据Eclipse 公共许可证 (EPL)发布了它。它很快因开发免费和商业项目而流行起来。今天，它成为最流行的 Java IDE。它包含一个基础工作区和一个用于自定义环境的可扩展插件系统。

关于这个话题有很多争议，这使得很难决定哪些是最重要的。因此，大多数开发人员声称这两个 IDE 在功能上是相同的，选择其中任何一个是品味问题。但是，我认为这不仅仅是品味问题。有一些原因可以帮助您区分两者之间的差异。

## Intellij Idea 与Eclipse的区别

### 1. 系统要求

我们可以使用以下硬件在 Windows、macOS 和 Linux 上安装 IntelliJ Idea：

- 至少 2 GB RAM，推荐 4 GB RAM
- 1.5 GB 硬盘空间 + 至少 1 MB 用于缓存
- 1024×768 最小屏幕分辨率

我们可以在任何支持 JVM 的平台上运行 Eclipse IDE，包括 Windows、macOS、Linux 和 Solaris。它需要以下硬件：

- 最低 0.5 GB RAM，推荐 1+ GB RAM
- 最少 300 MB 硬盘空间，建议 1+ GB
- 处理器速度最低为 800 MHz，推荐 1.5 GHz 或更快

### 2. 调试

在调试过程中，有时我们想评估某个表达式以查看其值。在 Eclipse 中，您需要选择整个表达式。否则，日食无法评估它。但是，使用 IntelliJ Idea，您无需选择整个表达式。您只需将光标放在表达式内的任何位置，然后按 Alt+F8。IntelliJ Idea 了解您需要哪种表达式，并显示一个对话框窗口，建议该表达式的几种可能变体。您还可以在此对话窗口中编辑和计算表达式。

### 3. 自动完成

自动完成是一个选项，它不同于记事本中的任何 IDE。在这里，感受上下文使 IntelliJ Idea 比 Eclipse 具有质的优势。例如，我们开始编写代码：

```java
assertElement(By.id( "errorMessage" ), vi
```

现在，我们想找出哪些选项可以以字母“vi”开头。IntelliJ 立即理解了需要 Condition 类实例作为第二个参数的方法，即Condition.visible。因此，IntelliJ 立即建议该方法的唯一有效选项，而 Eclipse 无法快速理解有效上下文。它不知道光标位于该方法的第二个参数应该放置的位置。因此，当您按下 Ctrl + Space 时，Eclipse 会显示所有以字母“vi”开头的无用信息。

### 4. 重构

所有现代 IDE 都提供了一组非常令人印象深刻的重构。但是，与其他 IDE 相比，IntelliJ Idea 重构更智能。它可以很容易地理解你想要什么，并提供了许多适合大多数情况的选项。

### 5. 插件

Eclipse 市场提供了 1250 多个插件，而 IntelliJ Idea 提供了大约 1250 个插件。仅 750 个插件。但是，插件差异并没有太大区别，因为新技术的插件通常主要为 Eclipse 创建。

### 6. 性能

IDE中安装的插件越多，它对您的计算机来说就越沉重。然而，与 IntelliJ Idea 相比，Eclipse 处理大型项目的速度更快，因为它在启动时索引整个项目。但是，当您处理现有项目时，与 Eclipse 相比，IntelliJ Idea 的工作速度更快、更流畅。

### 7. 可用性

与Eclipse 相比，IntelliJ 更易于使用。IntelliJ 中的学习曲线要快得多，这使得开发更容易、更自然。代码补全、下拉菜单、快速查看、项目向导等，Eclipse 和 IntelliJ 都可以实现，但 IntelliJ 的用户体验要令人满意得多。
