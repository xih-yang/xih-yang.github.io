# 08、Java 19 新特性 - 弃用和删除的一些 API
- 来源：https://ddkk.com/zhuanlan/java/java19/8.html
- 分类：Java 19 新特性
- 分组：教程目录
在Java SE 19 中，一些函数被标记为 "废弃 "或无法使用。

## 废弃的 Locale 类构造函数

在Java SE 19 中，Locale 类的公共构造函数被标记为 “弃用”。

相反，我们应该使用新的静态工厂方法`Locale.of()`。这可以确保每个 Locale 配置只有一个实例。

下面的例子显示了与构造函数相比工厂方法的使用情况。

示例代码如下

```java
package git.snippets.jdk19;
import java.util.Locale;
public class LocaleTest {
    public static void main(String[] args) {
        Locale german1 = new Locale("de"); // deprecated
        Locale germany1 = new Locale("de", "DE"); // deprecated
        Locale german2 = Locale.of("de");
        Locale germany2 = Locale.of("de", "DE");
        System.out.println("german1 == Locale.GERMAN = " + (german1 == Locale.GERMAN));
        System.out.println("germany1 == Locale.GERMANY = " + (germany1 == Locale.GERMANY));
        System.out.println("german2 == Locale.GERMAN = " + (german2 == Locale.GERMAN));
        System.out.println("germany2 == Locale.GERMANY = " + (germany2 == Locale.GERMANY));
    }
}
```

## java.lang.ThreadGroup

在Java SE 14 和 Java SE 16 中，有几个 Thread 和 ThreadGroup 方法被标记为 “被废弃”

以下这些方法在 Java 19 中已被停用。

```java
ThreadGroup.destroy(); //- 该方法的调用将被忽略。
        ThreadGroup.isDestroyed() ;//- 总是返回false。
        ThreadGroup.setDaemon() ; //- 设置守护者标志，但这已经没有效果了。
        ThreadGroup.suspend();//会抛出一个UnsupportedOperationException。
        ThreadGroup.resume();//会抛出一个UnsupportedOperationException。
        ThreadGroup.stop();//会抛出一个UnsupportedOperationException。
```

所有关于 Java SE 19 的新特性见：[JDK 19 Release Notes][]
