# 01、Java 20 新特性 - switch 模式匹配（第四预览版）
- 来源：https://ddkk.com/zhuanlan/java/java20/1.html
- 分类：Java 20 新特性
- 分组：教程目录
Java 17 中首次引入的“switch 模式匹配”功能已经进入第四个预览阶段，现在 Java 20 已经发布。这个功能过去一直收集了很多反馈，而且还需要与相关的 Record 模式预览功能保持一致。最终有很多理由让它在预览状态下再保持一段时间。

自从Java 16 以来，我们就可以通过使用“instanceof 模式匹配”来避免在 instanceof 检查之后进行强制类型转换。让我们看看在代码示例中它是如何工作的。

```java
static String apply(Effect effect) {
        String formatted = "";
        if (effect instanceof Delay de) {
        formatted = String.format("Delay active of %d ms.", de.timeInMs());
        } else if (effect instanceof Reverb re) {
        formatted = String.format("Reverb active of type %s and roomSize %d.", re.name(), re.roomSize());
        } else if (effect instanceof Overdrive ov) {
        formatted = String.format("Overdrive active with gain %d.", ov.gain());
        } else if (effect instanceof Tremolo tr) {
        formatted = String.format("Tremolo active with depth %d and rate %d.", tr.depth(), tr.rate());
        } else if (effect instanceof Tuner tu) {
        formatted = String.format("Tuner active with pitch %d. Muting all signal!", tu.pitchInHz());
        } else {
        formatted = String.format("Unknown effect active: %s.", effect);
        }
        return formatted;
 }
```

这段代码还是挺有仪式感的。此外还留下一个小漏洞——如果添加了一个 else-if 分支，却没有给 formatted 分配任何内容会怎么样呢？因此，遵循这个 JEP（以及它的前身）的精神，让我们看看在 switch 语句中使用模式匹配会是什么样子：

```java
static String apply(Effect effect) {
        return switch(effect) {
        case Delay de      -> String.format("Delay active of %d ms.", de.timeInMs());
        case Reverb re     -> String.format("Reverb active of type %s and roomSize %d.", re.name(), re.roomSize());
        case Overdrive ov  -> String.format("Overdrive active with gain %d.", ov.gain());
        case Tremolo tr    -> String.format("Tremolo active with depth %d and rate %d.", tr.depth(), tr.rate());
        case Tuner tu      -> String.format("Tuner active with pitch %d. Muting all signal!", tu.pitchInHz());
        case null, default -> String.format("Unknown or empty effect active: %s.", effect);
        };
}
```

使用switch 的模式匹配使我们的代码更加优雅。甚至可以通过为可能的 null 定义一个特定的 case 或将其与默认 case 合并来处理它们。

除了模式匹配之外，还可以使用 guard 来检查额外的条件（在下面的代码中，在 when 关键字后面的部分）。

```java
static String apply(Effect effect, Guitar guitar) {
        return switch(effect) {
        case Delay de      -> String.format("Delay active of %d ms.", de.timeInMs());
        case Reverb re     -> String.format("Reverb active of type %s and roomSize %d.", re.name(), re.roomSize());
        case Overdrive ov  -> String.format("Overdrive active with gain %d.", ov.gain());
        case Tremolo tr    -> String.format("Tremolo active with depth %d and rate %d.", tr.depth(), tr.rate());
        case Tuner tu when !guitar.isInTune() -> String.format("Tuner active with pitch %d. Muting all signal!", tu.pitchInHz());
        case Tuner tu      -> "Guitar is already in tune.";
        case null, default -> String.format("Unknown or empty effect active: %s.", effect);
        };
}
```

这里的guard 确保复杂的布尔逻辑仍然可以用简洁的方式表示。在 case 分支中嵌套 if 语句来测试这种逻辑不仅更冗长，而且还可能引入我们一开始想避免的小错误。

## Java 19 和 Java 20 相比有什么不同

与Java 19 相比，这个功能做了一些改变：

- 当一个模式匹配突然失败时，现在会抛出一个 MatchException
- 在 switch 表达式和语句中支持推断 record 模式的类型参数。这意味着现在可以在要匹配的模式中使用 var
