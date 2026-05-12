# 01、JDK 17 新特性：JDK 17 新特性全面了解 Java 17 的核心改进
- 来源：https://ddkk.com/zhuanlan/java/java17/1.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
兄弟们，鹏磊今天来给大伙儿聊聊 JDK 17 这个 LTS 版本，2021年9月发布的，到现在已经好几年了，但很多老铁还在用 JDK 8 或者 JDK 11，对 JDK 17 的新特性可能还不太熟悉。咱今天就整一个总览，把 JDK 17 的核心改进都给你捋一遍，让你心里有个数。

JDK 17 作为长期支持版本，引入了 14 个 JEP（Java Enhancement Proposal），涵盖了语言特性、API 增强、平台支持、性能优化和安全改进等多个方面。这些改进让 Java 语言更加现代化，也提升了开发效率和运行时性能。

## 语言特性增强

### 密封类（Sealed Classes）JEP 409

密封类这玩意儿是 JDK 17 的一个重磅特性，允许你精确控制哪些类可以继承或实现特定的类或接口。以前咱们写代码的时候，一个类被继承后，你根本不知道会有哪些子类，现在好了，用 `sealed` 关键字可以明确指定允许的子类。

```java
// 定义一个密封类，只允许 Circle 和 Rectangle 继承
public sealed class Shape permits Circle, Rectangle {
    // Shape 的基础实现
}
// Circle 必须声明为 final、sealed 或 non-sealed
public final class Circle extends Shape {
    private final double radius;
    // Circle 的实现
}
public final class Rectangle extends Shape {
    private final double width, height;
    // Rectangle 的实现
}
```

这玩意儿配合模式匹配用起来贼爽，后面咱会详细讲。

### Switch 模式匹配（预览）JEP 406

Switch 表达式在 JDK 14 就有了，JDK 17 又增强了模式匹配功能。现在可以在 switch 里直接做类型判断和模式匹配，代码简洁多了。

```java
// 以前得这么写
Object obj = getObject();
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}
// 现在可以这么写，简洁多了
switch (obj) {
    case String s -> System.out.println(s.length());  // 直接匹配并绑定变量
    case Integer i -> System.out.println(i * 2);
    case null -> System.out.println("null");
    default -> System.out.println("其他类型");
}
```

## API 增强

### 外部函数和内存 API（孵化）JEP 412

这玩意儿是 Project Panama 的一部分，让你能安全高效地调用本地代码和操作外部内存。以前用 JNI 那叫一个麻烦，现在这个 API 简化了很多。

```java
import jdk.incubator.foreign.*;
// 分配外部内存
MemorySegment segment = MemorySegment.allocateNative(1024);
// 操作内存
segment.set(ValueLayout.JAVA_INT, 0, 42);
// 读取内存
int value = segment.get(ValueLayout.JAVA_INT, 0);
```

这个 API 还在孵化阶段，但已经能解决很多实际问题了，特别是需要调用 C/C++ 库的场景。

### 向量 API（二次孵化）JEP 414

向量 API 让你能利用 SIMD（单指令多数据）指令来加速数值计算。对于科学计算、图像处理这些需要大量并行计算的场景，性能提升非常明显。

```java
import jdk.incubator.vector.*;
// 创建向量
var species = IntVector.SPECIES_256;
var a = IntVector.fromArray(species, array1, 0);
var b = IntVector.fromArray(species, array2, 0);
// 向量运算，一次处理多个元素
var result = a.add(b);
result.intoArray(resultArray, 0);
```

### 增强的伪随机数生成器 JEP 356

新增了 `RandomGenerator` 接口和多个实现类，提供了更灵活的随机数生成能力。支持不同的算法，还能在多线程环境下高效工作。

```java
import java.util.random.*;
// 使用新的随机数生成器
RandomGenerator generator = RandomGenerator.of("L64X128MixRandom");
int randomInt = generator.nextInt(100);
```

## 平台支持改进

### 恢复始终严格的浮点语义 JEP 306

这个改动确保了浮点运算在所有平台上的一致性。以前不同平台可能会有细微差异，现在统一了，计算结果更可预测。

### 新的 macOS 渲染管道 JEP 382

macOS 上引入了基于 Metal 的渲染管道，替代了已弃用的 OpenGL。图形性能提升了不少，特别是对于 Swing 和 JavaFX 应用。

### macOS/AArch64 移植 JEP 391

支持了 Apple Silicon（M1/M2 芯片），让 Java 能在 ARM 架构的 macOS 上原生运行。性能表现相当不错，比通过 Rosetta 转译快多了。

## 安全与模块化

### 强封装 JDK 内部 API JEP 403

进一步封装了 JDK 的内部 API，移除了 `--illegal-access` 选项。以前能访问的一些内部 API 现在被严格限制了，提高了安全性和模块化程度。

如果你之前用了这些内部 API，升级到 JDK 17 可能会遇到问题，需要找替代方案或者使用标准 API。

### 上下文特定的反序列化过滤器 JEP 415

增强了反序列化的安全性，允许根据上下文设置过滤器，防止反序列化攻击。这个功能对于处理不可信数据源的应用特别重要。

```java
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "java.base.*;!*"
);
ObjectInputStream ois = new ObjectInputStream(inputStream);
ois.setObjectInputFilter(filter);
```

## 性能优化

JDK 17 在性能方面也有不少改进，特别是垃圾回收器：

- **ZGC**：低延迟垃圾回收器，停顿时间进一步降低
- **Shenandoah**：另一个低停顿时间的垃圾回收器，性能也有提升

这些改进让 Java 应用在高并发、低延迟场景下表现更好。

## 迁移建议

如果你要从 JDK 8 或 JDK 11 升级到 JDK 17，需要注意：

1. **密封类和模式匹配**：这些新特性可以逐步采用，不影响现有代码
2. **内部 API 封装**：检查是否使用了内部 API，需要替换为标准 API
3. **移除的功能**：Applet API、RMI 激活系统等已被移除，需要找替代方案
4. **性能调优**：可以尝试新的垃圾回收器，根据应用特点选择合适的配置

## 总结

JDK 17 作为 LTS 版本，带来了很多实用的改进。语言特性更现代化，API 更强大，平台支持更广泛，安全性也更高。虽然有些特性还在预览或孵化阶段，但已经能解决很多实际问题了。

对于新项目，建议直接上 JDK 17；对于老项目，可以逐步迁移，先在新功能里用新特性，慢慢过渡。反正这个版本会支持到 2029 年，时间还长着呢。

接下来咱会逐个深入讲解这些特性，从密封类开始，到模式匹配、外部函数 API、向量 API 等等，每个都会配上详细的代码示例和实战案例。兄弟们有啥问题随时问，鹏磊会尽量解答。
