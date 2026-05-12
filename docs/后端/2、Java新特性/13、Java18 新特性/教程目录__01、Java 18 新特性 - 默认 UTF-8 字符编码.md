# 01、Java 18 新特性 - 默认 UTF-8 字符编码
- 来源：https://ddkk.com/zhuanlan/java/java18/1.html
- 分类：Java 18 新特性
- 分组：教程目录
JDK一直都是支持 UTF-8 字符编码，这次是把 UTF-8 设置为了默认编码，也就是在不加任何指定的情况下，默认所有需要用到编码的 JDK API 都使用 UTF-8 编码，这样就可以避免因为不同系统，不同地区，不同环境之间产生的编码问题。

> Mac OS 默认使用 UTF-8 作为默认编码，但是其他操作系统上，编码可能取决于系统的配置或者所在区域的设置。如中国大陆的 windows 使用 GBK 作为默认编码。很多同学初学 Java 时可能都遇到过一个正常编写 Java 类，在 windows 系统的命令控制台中运行却出现乱码的情况。

使用下面的命令可以输出 JDK 的当前编码。

```java
# Mac 系统，默认 UTF-8
➜  ~ java -XshowSettings:properties -version 2>&1 | grep file.encoding
    file.encoding = UTF-8
    file.encoding.pkg = sun.io
➜  ~
```

下面编写一个简单的 Java 程序，输出默认字符编码，然后输出中文汉字 ” 你好 “，看看 Java 18 和 Java 17 运行区别。

系统环境：Windows 11

```java
import java.nio.charset.Charset;
public class Hello{
    public static void main(String[] args) {
        System.out.println(Charset.defaultCharset());
        System.out.println("你好");
    }
}
```

从下面的运行结果中可以看到，使用 JDK 17 运行输出的默认字符编码是 GBK，输出的中文 ” 你好 “已经乱码了；乱码是因为 VsCode 默认的文本编辑器编码是 UTF-8，而中国地区的 Windows 11 默认字符编码是 GBK，也是 JDK 17 默认获取到的编码，所以会在控制台输出时乱码；而使用 JDK 18 输出的默认编码就是 UTF-8，所以可以正常的输出中文” 你好 “。
