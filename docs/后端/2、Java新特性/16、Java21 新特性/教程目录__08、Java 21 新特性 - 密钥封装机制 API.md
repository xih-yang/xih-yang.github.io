# 08、Java 21 新特性 - 密钥封装机制 API
- 来源：https://ddkk.com/zhuanlan/java/java21/8.html
- 分类：Java 21 新特性
- 分组：教程目录
介绍一种用于密钥封装机制（Key Encapsulation Mechanism，简称KEM）的API，这是一种使用公钥加密来保护对称密钥的加密技术。

值得注意的是，最初针对 JDK 21 的JEP 404， Generational Shenandoah（实验性）已从 JDK 21 的最终功能集中正式删除。这是由于“审查过程中发现的风险以及缺乏时间”可以执行如此大的代码贡献所需的彻底审查。” Shenandoah 团队决定“尽其所能提供最好的 Generational Shenandoah”，并将寻求以 JDK 22 为目标。

我们研究了其中一些新功能，并包括它们在四个主要 Java 项目（ Amber、Loom、Panama和Valhalla ）支持下的位置，这些项目旨在孵化一系列组件，以便通过精心策划的合并最终包含在 JDK 中。
7131
