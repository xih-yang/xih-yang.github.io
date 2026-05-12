# 07、Java 20 新特性 - Vector API（第五个孵化器版本）
- 来源：https://ddkk.com/zhuanlan/java/java20/7.html
- 分类：Java 20 新特性
- 分组：教程目录
Vector API 将使得能够表达可靠地在运行时编译为最优向量指令的向量计算。这意味着这些计算将在支持的 CPU 体系结构（x64 和 AArch64）上显着优于等价的标量计算。

向量（Vector）计算是对一个或多个任意长度的一维矩阵进行的数学运算。将向量视为具有动态长度的数组。此外，可以通过索引在常数时间内访问向量中的元素，就像数组一样。

过去，Java程序员只能在汇编代码级别上编写此类计算。但现在，现代 CPU 支持高级单指令，多数据（SIMD）功能，因此重要性更大，需要利用 SIMD 指令和多个并行操作的性能增益。Vector API让Java程序员更容易实现这一点。

## 示例代码

以下是一段代码示例（取自 JEP），它比较了使用数组元素的简单标量计算以及使用 Vector API 的等效计算：

```java
void scalarComputation(float[] a, float[] b, float[] c) {
        for (int i = 0; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
        }
        }
static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
        void vectorComputation(float[] a, float[] b, float[] c) {
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        for (; i < upperBound; i += SPECIES.length()) {
        // FloatVector va, vb, vc;
        var va = FloatVector.fromArray(SPECIES, a, i);
        var vb = FloatVector.fromArray(SPECIES, b, i);
        var vc = va.mul(va)
        .add(vb.mul(vb))
        .neg();
        vc.intoArray(c, i);
        }
        for (; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
        }
        }
```

从Java 开发者的角度来看，这只是表达标量计算的另一种方式。它可能会显得略微冗长，但另一方面它可以带来惊人的性能提升。

**典型用例**

Vector API 提供了一种在 Java 中编写复杂向量算法的方法，例如向量化的 hashCode 实现或专门的数组比较。许多领域可以从中受益，包括机器学习、线性代数、加密、文本处理、金融和 JDK 本身的代码。

## 与 Java 19 有何不同

除了一小部分错误修复和性能增强外，这个特性与 Valhalla 项目的对齐是与 Java 19 最大的不同之处。它的意义是非常明确的，因为向量 API 和 Valhalla 项目都专注于性能提升。

回想一下，Valhalla 项目的目标是通过值对象和用户自定义原语增强 Java 对象模型，将面向对象编程的抽象与简单原语的性能特性相结合。

一旦Valhalla 项目的功能可用，将会适应 Vector API 以利用值对象，届时它将被提升为预览功能。
