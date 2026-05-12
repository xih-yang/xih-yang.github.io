# 02、Java 20 新特性 - Record 模式（第二预览版）
- 来源：https://ddkk.com/zhuanlan/java/java20/2.html
- 分类：Java 20 新特性
- 分组：教程目录
模式匹配是 Java 中逐步推出的一项功能。使用模式解构对象始终是该功能的终极目标之一。现在，通过引入 record 模式，可以解构记录以及嵌套记录和类型模式，以实现强大、声明性和可组合的数据导航和处理形式。

Record 是数据的透明载体。接收 Record 实例的代码通常会提取数据，这些数据称为组件。如果我们假设所有 Effect 接口的实现都是记录，那么在我们的“switch 模式匹配”代码示例中也是如此。在那段代码中，模式变量很明显只用于访问记录字段。使用 Record 模式，可以避免完全创建模式变量：

```java
static String apply(Effect effect) {
        return switch(effect) {
        case Delay(int timeInMs) -> String.format("Delay active of %d ms.", timeInMs);
        case Reverb(String name, int roomSize) -> String.format("Reverb active of type %s and roomSize %d.", name, roomSize);
        case Overdrive(int gain) -> String.format("Overdrive active with gain %d.", gain);
        case Tremolo(int depth, int rate) -> String.format("Tremolo active with depth %d and rate %d.", depth, rate);
        case Tuner(int pitchInHz) -> String.format("Tuner active with pitch %d. Muting all signal!", pitchInHz);
        case null, default -> String.format("Unknown or empty effect active: %s.", effect);
        };
        }
```

Delay(int timeInMs) 是一个 Record 模式，将 Delay 实例分解为其组件。当我们使用嵌套记录模式时，这种机制可以变得更加强大，应用于更复杂的对象图：

```java
record Tuner(int pitchInHz, Note note) implements Effect {}
        record Note(String note) {}
class TunerApplier {
    static String apply(Effect effect, Guitar guitar) {
        return switch(effect) {
            case Tuner(int pitch, Note(String note)) -> String.format("Tuner active with pitch %d on note %s", pitch, note);
        };
    }
}
```

嵌套的记录模式也受益于类型参数推断。例如：

```java
class TunerApplier {
    static String apply(Effect effect, Guitar guitar) {
        return switch(effect) {
            case Tuner(var pitch, Note(var note)) -> String.format("Tuner active with pitch %d on note %s", pitch, note);
        };
    }
}
```

这里对于嵌套模式 `Tuner(var pitch, Note(var note))`的类型参数进行了推断。目前仅支持嵌套模式的隐式类型推断；类型模式尚不支持隐式类型参数的推断。因此，类型模式 Tuner tu 总是被视为原始类型模式。

## 增强的 for 语句

记录模式现在也被允许用于增强的 for 语句中，这使得循环遍历记录值的集合并快速提取每个记录的组件变得容易：

```java
record Delay(int timeInMs) implements Effect {}
class DelayPrinter {
    static void printDelays(List<Delay> delays) {
        for (Delay(var timeInMs) : delays) {
            System.out.println("Delay found with timeInMs=" + timeInMs);
        }
    }
}
```

## Java 19 与 Java 20 的不同之处

与Java 19 相比，此功能进行了以下更改：

- 添加对泛型记录模式类型参数推断的支持；
- 添加对记录模式出现在增强for语句标题中的支持。

## Loom 项目

Java 20 包含三个源于 Loom 项目 的功能：

- 虚拟线程
- 有作用域的值
- 结构化并发

> Loom 项目旨在通过引入虚拟线程和结构化并发 API 等方式来简化 Java 中并发应用程序的维护。
