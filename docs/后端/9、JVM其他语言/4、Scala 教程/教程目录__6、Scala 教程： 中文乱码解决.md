# 6、Scala 教程： 中文乱码解决
- 来源：https://ddkk.com/zhuanlan/java/scala/6.html
- 分类：Scala 教程
- 分组：教程目录
在Scala 2.11.7 版本上，Mac OS X 或 Linux 系统上编译 Scala 代码，如果出现中文，会出现乱码的情况。

解决方案如下，分别编辑以下两个执行脚本:

```java
$ vim which scala 
```

定位到

```java
[ -n "$JAVA_OPTS" ] || JAVA_OPTS="-Xmx256M -Xms32M"
```

替换成

```java
[ -n "$JAVA_OPTS" ] || JAVA_OPTS="-Xmx256M -Xms32M -Dfile.encoding=UTF-8"
```

```java
$ vim which scalac
```

定位到

```java
[ -n "$JAVA_OPTS" ] || JAVA_OPTS="-Xmx256M -Xms32M"
```

替换成

```java
[ -n "$JAVA_OPTS" ] || JAVA_OPTS="-Xmx256M -Xms32M -Dfile.encoding=UTF-8"
```

重新编译脚本，既可以正常显示中文。
