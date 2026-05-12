# 03、Lombok 实战教程 - @Cleanup | 如何优雅的自动管理资源，安全地调用你的close()方法。
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/3.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

你可以使用`@Cleanup`来确保一个给定的资源在代码执行路径退出你的当前作用域之前被自动清理掉。你可以用`@Cleanup`注解对任何局部变量声明进行注解，像这样：

```java
@Cleanup InputStream in = new FileInputStream("some/file");
```

因此，在所处范围的末尾，`in.close()`被调用。这个调用通过`try/finally`结构保证运行。请看下面的例子，看看它是如何工作的。

如果你想清理的对象类型没有`close()`方法，而是其他一些无参数的方法，你可以这样指定这个方法的名称。

```java
@Cleanup("dispose") org.eclipse.swt.widgets.CoolBar bar = new CoolBar(parent, 0);
```

默认情况下，清理方法被认为是`close()`。一个需要`1`个或多个参数的清理方法不能通过`@Cleanup`调用。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.Cleanup;
import java.io.*;
public class CleanupExample {
  public static void main(String[] args) throws IOException {
    @Cleanup InputStream in = new FileInputStream(args[0]);
    @Cleanup OutputStream out = new FileOutputStream(args[1]);
    byte[] b = new byte[10000];
    while (true) {
      int r = in.read(b);
      if (r == -1) break;
      out.write(b, 0, r);
    }
  }
}
```

### 2. Java 标准写法

```java
import java.io.*;
public class CleanupExample {
  public static void main(String[] args) throws IOException {
    InputStream in = new FileInputStream(args[0]);
    try {
      OutputStream out = new FileOutputStream(args[1]);
      try {
        byte[] b = new byte[10000];
        while (true) {
          int r = in.read(b);
          if (r == -1) break;
          out.write(b, 0, r);
        }
      } finally {
        if (out != null) {
          out.close();
        }
      }
    } finally {
      if (in != null) {
        in.close();
      }
    }
  }
}
```

## 三、支持的配置项

`lombok.cleanup.flagUsage = [warning | error]` (默认: 未设置)

如果配置了，`Lombok`会将`@Cleanup`的任何使用标记为`warning`或`error`。

## 四、附属说明

在`finally`块中，仅当给定资源不为`null`时才调用`cleanup`方法。但是，如果在代码上使用`delombok`，则会插入对`lombok.Lombok.preventNullAnalysis(Object o)`的调用，以防止在静态代码分析确定不需要空检查时发出警告。在类路径上使用`lombok.jar`进行编译将删除该方法调用，因此不存在运行时依赖关系。

如果你的代码抛出了一个异常，而随后触发的清理方法调用也抛出了一个异常，那么原来的异常就会被清理调用抛出的异常所隐藏。你不应该依赖这个 “特性”。最好的情况是，`lombok`希望生成的代码是，如果主体抛出了一个异常，任何由关闭调用抛出的异常都会被默默地吞掉（但是如果主体以任何其他方式退出，关闭调用的异常将不会被吞掉）。`lombok`的作者目前还不知道有什么可行的方法来实现这个方案，但是如果`java`的更新允许，或者我们找到了方法，将会修复它。

你仍然需要处理清理方法可能产生的任何异常。
