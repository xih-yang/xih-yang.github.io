# 12、Java10 新特性 - JDK多个代码仓库合并
- 来源：https://ddkk.com/zhuanlan/java/java10/12.html
- 分类：Java 10 新特性
- 分组：教程目录
## JEP 296 ： 将 JDK 多个代码仓库合并到一个仓库

在JDK 9 中，有八个基于模块的目录，称为 repos。

- root
- corba
- hotspot
- jaxp
- jaxws
- jdk
- langtools
- nashorn

代码的组织方式如下 ：

```java
$ROOT/jdk/src/java.base
...
$ROOT/langtools/src/java.compiler
...
```

从Java 10 开始，将 JDK 多个代码仓库合并到一个仓库。现在的结构为 ：

```java
$ROOT/src/java.base
$ROOT/src/java.compiler
...
```
