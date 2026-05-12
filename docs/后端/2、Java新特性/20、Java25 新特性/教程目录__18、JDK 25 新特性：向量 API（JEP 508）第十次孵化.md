# 18、JDK 25 新特性：向量 API（JEP 508）第十次孵化
- 来源：https://ddkk.com/zhuanlan/java/java25/18.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
为啥需要向量 API？因为传统的标量计算太慢了，特别是处理大量数据的时候。比如你要对两个数组做元素级别的运算，以前得一个一个元素循环处理，CPU 一次只能算一个数，效率贼低。但现在的 CPU 都支持 SIMD（单指令多数据）指令，可以一次处理多个数据，性能能提升好几倍。

Java 以前没有标准 API 来用 SIMD 指令，只能靠 JVM 自动向量化，但自动向量化有很多限制，不是所有代码都能被优化。而且自动向量化是黑盒的，你也不知道到底有没有被优化，性能提升也不稳定。

JDK 16 开始引入了向量 API（Vector API）作为孵化特性，到现在 JDK 25 已经是第十次孵化了。这个 API 让你可以显式地表达向量计算，JVM 会把它编译成最优的 SIMD 指令，性能比标量计算好很多，而且代码是平台无关的，可以在不同的 CPU 架构上运行。

JDK 25 里的向量 API 继续改进，增加了对 `VectorShuffle` 的内存段（MemorySegment）访问支持，改进了可维护性，还支持了 `Float16` 的自动向量化。虽然还是孵化特性，但已经比较成熟了，可以在高性能计算、机器学习、图像处理这些场景里用。

## 向量 API 是啥

先说说向量 API 到底是啥吧。向量 API 是 Java 提供的一个 API，用来表达向量计算，也就是对多个数据同时做相同的操作。比如你要把两个数组的对应元素相加，向量 API 可以一次处理多个元素，而不是一个一个处理。

向量 API 的核心概念是向量（Vector），一个向量可以包含多个相同类型的元素。比如 `FloatVector` 可以包含多个 `float` 值，`IntVector` 可以包含多个 `int` 值。向量的长度取决于 CPU 的 SIMD 能力，比如 AVX2 可以一次处理 8 个 `float`（256 位），AVX-512 可以一次处理 16 个 `float`（512 位）。

向量 API 的优势有几个：第一个是性能好，可以利用 SIMD 指令并行处理多个数据，性能能提升好几倍；第二个是平台无关，代码可以在不同的 CPU 架构上运行，JVM 会自动选择最优的实现；第三个是可控性强，你可以显式地表达向量计算，不依赖自动向量化；第四个是类型安全，API 是类型安全的，编译时就能检查错误。

向量 API 跟自动向量化的区别是，自动向量化是 JVM 自动把标量代码转换成向量代码，但有很多限制，不是所有代码都能被优化。向量 API 是显式的，你可以直接写向量代码，JVM 保证会编译成 SIMD 指令，性能更可预测。

## SIMD 是啥

SIMD（Single Instruction Multiple Data，单指令多数据）是 CPU 的一种并行计算能力，可以一条指令同时处理多个数据。比如普通的加法指令一次只能加两个数，SIMD 加法指令可以一次加多个数对。

现代 CPU 都支持 SIMD，比如 Intel 的 SSE、AVX、AVX2、AVX-512，ARM 的 NEON、SVE。这些指令集可以一次处理 128 位、256 位、512 位的数据，对应 4 个、8 个、16 个 `float`，或者 2 个、4 个、8 个 `double`。

向量 API 就是让你可以用 Java 代码表达 SIMD 计算，JVM 会把它编译成对应的 SIMD 指令。这样你就不用写汇编代码了，也不用担心不同 CPU 的兼容性问题，JVM 会自动选择最优的实现。

## 基本用法

向量 API 的基本用法很简单，先选择向量种类（VectorSpecies），然后创建向量，做运算，最后写回数组。看个例子：

```java
import jdk.incubator.vector.*;  // 向量 API 在 jdk.incubator.vector 包里
public class VectorBasicExample {
    // 选择向量种类，SPECIES_PREFERRED 会根据 CPU 自动选择最优的向量长度
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的数组乘法，把 a 和 b 的对应元素相乘，结果存到 c 里
    public static void vectorMultiply(float[] a, float[] b, float[] c) {
        int i = 0;  // 循环索引
        // loopBound 计算循环上界，确保不会越界
        int upperBound = SPECIES.loopBound(a.length);  // 计算可以向量化处理的上界
        // 向量化循环，每次处理一个向量的长度
        for (; i < upperBound; i += SPECIES.length()) {
            // 从数组加载向量，一次加载多个元素
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 从 a 数组加载向量
            FloatVector vb = FloatVector.fromArray(SPECIES, b, i);  // 从 b 数组加载向量
            // 向量乘法，一次计算多个元素的乘积
            FloatVector vc = va.mul(vb);  // 向量乘法，并行计算多个元素
            // 把结果写回数组
            vc.intoArray(c, i);  // 把向量写回 c 数组
        }
        // 处理剩余的元素，这些元素不够一个向量的长度，用标量方式处理
        for (; i < a.length; i++) {
            c[i] = a[i] * b[i];  // 标量方式处理剩余元素
        }
    }
    // 测试
    public static void main(String[] args) {
        float[] a = new float[1000];  // 创建数组 a
        float[] b = new float[1000];  // 创建数组 b
        float[] c = new float[1000];  // 结果数组 c
        // 初始化数组
        for (int i = 0; i < a.length; i++) {
            a[i] = i;  // 初始化 a
            b[i] = i * 2;  // 初始化 b
        }
        // 向量化乘法
        vectorMultiply(a, b, c);  // 调用向量化方法
        // 验证结果
        for (int i = 0; i < 10; i++) {
            System.out.println("c[" + i + "] = " + c[i]);  // 打印前 10 个结果
        }
    }
}
```

这个例子展示了向量 API 的基本用法。`SPECIES_PREFERRED` 会根据 CPU 自动选择最优的向量长度，比如 AVX2 是 256 位（8 个 float），AVX-512 是 512 位（16 个 float）。

`loopBound()` 方法计算可以向量化处理的上界，确保不会越界。循环里每次处理一个向量的长度，用 `fromArray()` 加载向量，做运算，然后用 `intoArray()` 写回数组。剩余的元素不够一个向量的长度，用标量方式处理。

## 向量种类

向量 API 支持多种向量种类，对应不同的数据类型。常用的有 `FloatVector`、`DoubleVector`、`IntVector`、`LongVector` 等。看个例子：

```java
import jdk.incubator.vector.*;
public class VectorSpeciesExample {
    public static void main(String[] args) {
        // FloatVector 的种类，处理 float 数组
        VectorSpecies<Float> floatSpecies = FloatVector.SPECIES_PREFERRED;  // 自动选择最优长度
        System.out.println("Float 向量长度: " + floatSpecies.length());  // 打印向量长度，比如 8（AVX2）
        System.out.println("Float 向量位宽: " + floatSpecies.vectorBitSize());  // 打印位宽，比如 256（AVX2）
        // DoubleVector 的种类，处理 double 数组
        VectorSpecies<Double> doubleSpecies = DoubleVector.SPECIES_PREFERRED;  // 自动选择最优长度
        System.out.println("Double 向量长度: " + doubleSpecies.length());  // 打印向量长度，比如 4（AVX2）
        // IntVector 的种类，处理 int 数组
        VectorSpecies<Integer> intSpecies = IntVector.SPECIES_PREFERRED;  // 自动选择最优长度
        System.out.println("Int 向量长度: " + intSpecies.length());  // 打印向量长度，比如 8（AVX2）
        // LongVector 的种类，处理 long 数组
        VectorSpecies<Long> longSpecies = LongVector.SPECIES_PREFERRED;  // 自动选择最优长度
        System.out.println("Long 向量长度: " + longSpecies.length());  // 打印向量长度，比如 4（AVX2）
        // 也可以指定具体的向量长度
        VectorSpecies<Float> float256 = FloatVector.SPECIES_256;  // 256 位向量（AVX2）
        System.out.println("256 位 Float 向量长度: " + float256.length());  // 应该是 8
        VectorSpecies<Float> float512 = FloatVector.SPECIES_512;  // 512 位向量（AVX-512）
        System.out.println("512 位 Float 向量长度: " + float512.length());  // 应该是 16
    }
}
```

这个例子展示了不同的向量种类。`SPECIES_PREFERRED` 会根据 CPU 自动选择最优的向量长度，你也可以指定具体的长度，比如 `SPECIES_256`、`SPECIES_512`。

## 常用操作

向量 API 支持很多操作，比如加减乘除、数学函数、比较、混洗（Shuffle）等。看几个常用的例子：

### 向量加法

```java
import jdk.incubator.vector.*;
public class VectorAddExample {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的数组加法
    public static void vectorAdd(float[] a, float[] b, float[] c) {
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);  // 计算上界
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载 a
            FloatVector vb = FloatVector.fromArray(SPECIES, b, i);  // 加载 b
            FloatVector vc = va.add(vb);  // 向量加法
            vc.intoArray(c, i);  // 写回结果
        }
        // 处理剩余元素
        for (; i < a.length; i++) {
            c[i] = a[i] + b[i];  // 标量加法
        }
    }
}
```

### 向量乘法和累加

```java
import jdk.incubator.vector.*;
public class VectorFMAExample {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的乘加运算（Fused Multiply-Add），计算 a * b + c
    public static void vectorFMA(float[] a, float[] b, float[] c, float[] result) {
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载 a
            FloatVector vb = FloatVector.fromArray(SPECIES, b, i);  // 加载 b
            FloatVector vc = FloatVector.fromArray(SPECIES, c, i);  // 加载 c
            // 乘加运算，一次完成乘法和加法，比分开算更快
            FloatVector vresult = va.fma(vb, vc);  // a * b + c，融合乘加
            vresult.intoArray(result, i);  // 写回结果
        }
        // 处理剩余元素
        for (; i < a.length; i++) {
            result[i] = a[i] * b[i] + c[i];  // 标量乘加
        }
    }
}
```

### 向量数学函数

```java
import jdk.incubator.vector.*;
public class VectorMathExample {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的平方根
    public static void vectorSqrt(float[] a, float[] result) {
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载 a
            FloatVector vresult = va.sqrt();  // 向量平方根
            vresult.intoArray(result, i);  // 写回结果
        }
        // 处理剩余元素
        for (; i < a.length; i++) {
            result[i] = (float) Math.sqrt(a[i]);  // 标量平方根
        }
    }
    // 向量化的指数函数
    public static void vectorExp(float[] a, float[] result) {
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载 a
            FloatVector vresult = va.exp();  // 向量指数
            vresult.intoArray(result, i);  // 写回结果
        }
        // 处理剩余元素
        for (; i < a.length; i++) {
            result[i] = (float) Math.exp(a[i]);  // 标量指数
        }
    }
}
```

### 向量比较

```java
import jdk.incubator.vector.*;
public class VectorCompareExample {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的比较，找出大于阈值的元素
    public static int vectorCountGreater(float[] a, float threshold) {
        int count = 0;  // 计数器
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载 a
            // 比较，返回一个掩码（Mask），表示哪些元素大于阈值
            VectorMask<Float> mask = va.compare(VectorOperators.GT, threshold);  // 大于比较
            // 统计掩码中为 true 的元素数量
            count += mask.trueCount();  // 统计真值数量
        }
        // 处理剩余元素
        for (; i < a.length; i++) {
            if (a[i] > threshold) {  // 标量比较
                count++;  // 计数
            }
        }
        return count;  // 返回总数
    }
}
```

## 性能对比

向量 API 的性能提升很明显，特别是对大量数据的计算。看个性能对比的例子：

```java
import jdk.incubator.vector.*;
public class VectorPerformanceExample {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 标量方式的点积计算
    public static float scalarDotProduct(float[] a, float[] b) {
        float sum = 0.0f;  // 累加和
        for (int i = 0; i < a.length; i++) {
            sum += a[i] * b[i];  // 标量乘法和加法
        }
        return sum;  // 返回结果
    }
    // 向量方式的点积计算
    public static float vectorDotProduct(float[] a, float[] b) {
        FloatVector sum = FloatVector.zero(SPECIES);  // 初始化为零向量
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载 a
            FloatVector vb = FloatVector.fromArray(SPECIES, b, i);  // 加载 b
            FloatVector product = va.mul(vb);  // 向量乘法
            sum = sum.add(product);  // 累加
        }
        // 处理剩余元素
        float result = sum.reduceLanes(VectorOperators.ADD);  // 把向量里的所有元素加起来
        for (; i < a.length; i++) {
            result += a[i] * b[i];  // 标量处理剩余元素
        }
        return result;  // 返回结果
    }
    // 性能测试
    public static void main(String[] args) {
        int size = 10_000_000;  // 数组大小，1000 万
        float[] a = new float[size];  // 数组 a
        float[] b = new float[size];  // 数组 b
        // 初始化数组
        for (int i = 0; i < size; i++) {
            a[i] = i;  // 初始化 a
            b[i] = i * 2;  // 初始化 b
        }
        // 预热
        for (int i = 0; i < 10; i++) {
            scalarDotProduct(a, b);  // 预热标量方式
            vectorDotProduct(a, b);  // 预热向量方式
        }
        // 测试标量方式
        long start = System.nanoTime();
        float scalarResult = scalarDotProduct(a, b);  // 标量计算
        long scalarTime = System.nanoTime() - start;
        // 测试向量方式
        start = System.nanoTime();
        float vectorResult = vectorDotProduct(a, b);  // 向量计算
        long vectorTime = System.nanoTime() - start;
        System.out.println("标量结果: " + scalarResult);  // 打印标量结果
        System.out.println("向量结果: " + vectorResult);  // 打印向量结果
        System.out.println("标量耗时: " + scalarTime / 1_000_000 + " ms");  // 打印标量耗时
        System.out.println("向量耗时: " + vectorTime / 1_000_000 + " ms");  // 打印向量耗时
        System.out.println("性能提升: " + (scalarTime - vectorTime) * 100 / scalarTime + "%");  // 计算性能提升
    }
}
```

这个例子对比了标量和向量方式的点积计算。向量方式通常能提升 2-4 倍的性能，具体取决于 CPU 的 SIMD 能力和数据大小。

## JDK 25 的新改进

JDK 25 里的向量 API 有几个新改进：

### VectorShuffle 的内存段支持

`VectorShuffle` 现在支持从内存段（MemorySegment）读取和写入，这对堆外内存操作很有用。看个例子：

```java
import jdk.incubator.vector.*;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.MemoryLayout;
public class VectorShuffleMemoryExample {
    static final VectorSpecies<Integer> SPECIES = IntVector.SPECIES_PREFERRED;
    // 从内存段创建混洗
    public static void shuffleFromMemory(MemorySegment segment, int offset) {
        // 从内存段读取混洗索引
        VectorShuffle<Integer> shuffle = VectorShuffle.fromMemorySegment(
            SPECIES,  // 向量种类
            segment,  // 内存段
            offset,  // 偏移量
            ByteOrder.nativeOrder()  // 字节序
        );
        // 使用混洗重新排列向量
        IntVector vector = IntVector.fromArray(SPECIES, new int[]{0, 1, 2, 3, 4, 5, 6, 7}, 0);
        IntVector rearranged = vector.rearrange(shuffle);  // 重新排列
        rearranged.intoArray(new int[8], 0);  // 写回数组
    }
}
```

### Float16 自动向量化

JDK 25 支持 `Float16` 的自动向量化，加法、减法、乘法、除法、平方根、融合乘加这些操作都可以自动向量化。看个例子：

```java
import jdk.incubator.vector.*;
public class Float16VectorExample {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // Float16 向量化加法（如果 CPU 支持）
    public static void float16Add(short[] a, short[] b, short[] c) {
        // Float16 是半精度浮点数，用 short 存储
        // 如果 CPU 支持，这些操作会自动向量化
        int i = 0;
        int upperBound = SPECIES.loopBound(a.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            // 从 Float16 数组加载向量
            FloatVector va = FloatVector.fromArray(SPECIES, 
                convertFloat16ToFloat(a, i), i);  // 转换 Float16 到 float
            FloatVector vb = FloatVector.fromArray(SPECIES, 
                convertFloat16ToFloat(b, i), i);  // 转换 Float16 到 float
            FloatVector vc = va.add(vb);  // 向量加法
            // 写回 Float16 数组
            convertFloatToFloat16(vc, c, i);  // 转换 float 到 Float16
        }
        // 处理剩余元素
        for (; i < a.length; i++) {
            c[i] = (short) (a[i] + b[i]);  // 标量加法
        }
    }
    // 辅助方法：转换 Float16 到 float（简化版）
    private static float[] convertFloat16ToFloat(short[] a, int offset) {
        float[] result = new float[SPECIES.length()];  // 创建结果数组
        for (int i = 0; i < result.length && offset + i < a.length; i++) {
            result[i] = Float16.toFloat(a[offset + i]);  // 转换
        }
        return result;  // 返回结果
    }
    // 辅助方法：转换 float 到 Float16（简化版）
    private static void convertFloatToFloat16(FloatVector v, short[] result, int offset) {
        float[] temp = new float[SPECIES.length()];  // 临时数组
        v.intoArray(temp, 0);  // 向量转数组
        for (int i = 0; i < temp.length && offset + i < result.length; i++) {
            result[offset + i] = Float16.toHalfFloat(temp[i]);  // 转换
        }
    }
}
```

### 改进的可维护性

JDK 25 的向量 API 实现改进了可维护性，通过 Foreign Function & Memory API（JEP 454）链接到原生数学函数库，而不是在 HotSpot JVM 里写自定义 C++ 代码。这样代码更清晰，维护更容易。

## 实际应用场景

向量 API 在实际应用中有很多场景，比如科学计算、机器学习、图像处理、信号处理等。看几个例子：

### 矩阵乘法

矩阵乘法是科学计算里最常见的操作，向量 API 可以大幅提升性能：

```java
import jdk.incubator.vector.*;
public class MatrixMultiplication {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的矩阵乘法，计算 C = A * B
    public static void vectorMatrixMultiply(float[][] A, float[][] B, float[][] C) {
        int n = A.length;  // 矩阵大小
        int m = A[0].length;  // A 的列数
        int p = B[0].length;  // B 的列数
        // 遍历结果矩阵的每一行
        for (int i = 0; i < n; i++) {
            // 遍历结果矩阵的每一列
            for (int j = 0; j < p; j++) {
                float sum = 0.0f;  // 累加和
                int k = 0;
                int upperBound = SPECIES.loopBound(m);  // 计算上界
                // 向量化内积计算
                FloatVector sumVec = FloatVector.zero(SPECIES);  // 零向量
                for (; k < upperBound; k += SPECIES.length()) {
                    // 加载 A 的一行和 B 的一列
                    FloatVector va = FloatVector.fromArray(SPECIES, A[i], k);  // A 的第 i 行
                    FloatVector vb = FloatVector.fromArray(SPECIES, getColumn(B, k, j), 0);  // B 的第 j 列
                    FloatVector product = va.mul(vb);  // 向量乘法
                    sumVec = sumVec.add(product);  // 累加
                }
                // 处理剩余元素
                sum = sumVec.reduceLanes(VectorOperators.ADD);  // 向量求和
                for (; k < m; k++) {
                    sum += A[i][k] * B[k][j];  // 标量处理剩余元素
                }
                C[i][j] = sum;  // 保存结果
            }
        }
    }
    // 辅助方法：获取矩阵的一列
    private static float[] getColumn(float[][] matrix, int startRow, int col) {
        float[] column = new float[SPECIES.length()];  // 创建列数组
        for (int i = 0; i < column.length && startRow + i < matrix.length; i++) {
            column[i] = matrix[startRow + i][col];  // 复制列元素
        }
        return column;  // 返回列数组
    }
}
```

### 图像处理

图像处理里经常需要对像素数组做运算，向量 API 可以大幅提升性能：

```java
import jdk.incubator.vector.*;
public class ImageProcessing {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的图像亮度调整
    public static void vectorBrightnessAdjust(float[] pixels, float factor) {
        int i = 0;
        int upperBound = SPECIES.loopBound(pixels.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            FloatVector vpixels = FloatVector.fromArray(SPECIES, pixels, i);  // 加载像素
            // 调整亮度，乘以因子，然后限制在 0-1 之间
            FloatVector adjusted = vpixels.mul(factor).min(1.0f).max(0.0f);  // 亮度调整
            adjusted.intoArray(pixels, i);  // 写回像素
        }
        // 处理剩余元素
        for (; i < pixels.length; i++) {
            pixels[i] = Math.max(0.0f, Math.min(1.0f, pixels[i] * factor));  // 标量处理
        }
    }
    // 向量化的图像模糊（简化版，只做水平模糊）
    public static void vectorBlur(float[] pixels, int width, int height) {
        float[] result = new float[pixels.length];  // 结果数组
        // 遍历每一行
        for (int y = 0; y < height; y++) {
            int rowStart = y * width;  // 行的起始索引
            int i = rowStart + 1;  // 从第二个像素开始
            int upperBound = SPECIES.loopBound(rowStart + width - 1);  // 计算上界
            // 向量化循环
            for (; i < upperBound; i += SPECIES.length()) {
                // 加载当前像素和相邻像素
                FloatVector vprev = FloatVector.fromArray(SPECIES, pixels, i - 1);  // 前一个像素
                FloatVector vcurr = FloatVector.fromArray(SPECIES, pixels, i);  // 当前像素
                FloatVector vnext = FloatVector.fromArray(SPECIES, pixels, i + 1);  // 下一个像素
                // 计算平均值（简单模糊）
                FloatVector vblur = vprev.add(vcurr).add(vnext).div(3.0f);  // 三像素平均
                vblur.intoArray(result, i);  // 写回结果
            }
            // 处理边界像素
            result[rowStart] = pixels[rowStart];  // 第一个像素不变
            for (i = rowStart + 1; i < rowStart + width - 1; i++) {
                result[i] = (pixels[i - 1] + pixels[i] + pixels[i + 1]) / 3.0f;  // 标量处理
            }
            result[rowStart + width - 1] = pixels[rowStart + width - 1];  // 最后一个像素不变
        }
        // 复制结果回原数组
        System.arraycopy(result, 0, pixels, 0, pixels.length);  // 复制结果
    }
}
```

### 信号处理

信号处理里经常需要对信号数组做滤波、变换等操作，向量 API 可以提升性能：

```java
import jdk.incubator.vector.*;
public class SignalProcessing {
    static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;
    // 向量化的低通滤波（简化版）
    public static void vectorLowPassFilter(float[] signal, float alpha) {
        // alpha 是滤波系数，0 < alpha < 1
        float[] filtered = new float[signal.length];  // 滤波结果
        filtered[0] = signal[0];  // 第一个值不变
        int i = 1;
        int upperBound = SPECIES.loopBound(signal.length);
        // 向量化循环
        for (; i < upperBound; i += SPECIES.length()) {
            // 加载当前信号值和前一个滤波值
            FloatVector vsignal = FloatVector.fromArray(SPECIES, signal, i);  // 当前信号
            FloatVector vprev = FloatVector.fromArray(SPECIES, filtered, i - 1);  // 前一个滤波值
            // 低通滤波公式：filtered[i] = alpha * signal[i] + (1 - alpha) * filtered[i-1]
            FloatVector vfiltered = vsignal.mul(alpha).add(vprev.mul(1.0f - alpha));  // 滤波计算
            vfiltered.intoArray(filtered, i);  // 写回结果
        }
        // 处理剩余元素
        for (; i < signal.length; i++) {
            filtered[i] = alpha * signal[i] + (1.0f - alpha) * filtered[i - 1];  // 标量处理
        }
        // 复制结果回原数组
        System.arraycopy(filtered, 0, signal, 0, signal.length);  // 复制结果
    }
}
```

## 编译和运行

向量 API 是孵化特性，编译和运行的时候需要启用孵化模块。看个例子：

```bash
# 编译的时候启用孵化模块
javac --add-modules jdk.incubator.vector VectorExample.java
# 运行的时候也要启用孵化模块
java --add-modules jdk.incubator.vector VectorExample
```

如果用 Maven，可以在 `pom.xml` 里配置：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <release>25</release>
                <compilerArgs>
                    <arg>--add-modules</arg>
                    <arg>jdk.incubator.vector</arg>
                </compilerArgs>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>exec-maven-plugin</artifactId>
            <version>3.1.0</version>
            <configuration>
                <mainClass>VectorExample</mainClass>
                <jvmArgs>
                    <jvmArg>--add-modules</jvmArg>
                    <jvmArg>jdk.incubator.vector</jvmArg>
                </jvmArgs>
            </configuration>
        </plugin>
    </plugins>
</build>
```

如果用 Gradle，可以在 `build.gradle` 里配置：

```groovy
tasks.withType(JavaCompile) {
    options.compilerArgs += ['--add-modules', 'jdk.incubator.vector']
}
tasks.withType(JavaExec) {
    jvmArgs += ['--add-modules', 'jdk.incubator.vector']
}
```

## 注意事项

用向量 API 的时候有几个注意事项：

第一个是 CPU 支持，向量 API 的性能提升依赖于 CPU 的 SIMD 能力。如果 CPU 不支持 SIMD，或者不支持某些指令集，性能可能不如预期。可以用 `VectorSpecies` 的 `length()` 方法检查向量长度，如果长度是 1，说明可能没有 SIMD 支持。

第二个是数据对齐，虽然向量 API 会自动处理数据对齐，但如果数据已经对齐，性能会更好。可以用 `MemorySegment` 来确保数据对齐。

第三个是数组长度，如果数组长度不是向量长度的倍数，会有剩余元素需要用标量方式处理。这个开销通常很小，但如果数组很小，可能不如直接用标量方式。

第四个是孵化特性，向量 API 还是孵化特性，API 可能会变。而且它依赖于 Project Valhalla 的一些特性，等 Valhalla 的预览特性出来后，向量 API 可能会从孵化提升为预览。

第五个是性能测试，向量 API 的性能提升不是绝对的，取决于具体的场景和 CPU。应该在实际环境中测试性能，不要盲目使用。

## 最佳实践

用向量 API 的时候，有几个最佳实践：

第一个是选择合适的向量种类，`SPECIES_PREFERRED` 会根据 CPU 自动选择最优的向量长度，通常是最好的选择。除非有特殊需求，否则不要指定具体的向量长度。

第二个是处理剩余元素，数组长度通常不是向量长度的倍数，需要处理剩余元素。可以用标量方式处理，或者用掩码（Mask）来处理。

第三个是避免不必要的转换，向量 API 支持类型转换，但转换有开销。应该尽量用相同类型的向量，避免频繁转换。

第四个是预热 JIT，向量 API 的性能提升依赖于 JIT 编译，第一次运行可能比较慢。应该在性能测试前先预热，运行几次让 JIT 编译优化。

第五个是配合其他优化，向量 API 可以配合其他优化一起用，比如循环展开、数据预取等。但要注意不要过度优化，代码可读性也很重要。

## 总结

向量 API（JEP 508）是 JDK 25 里的孵化特性，已经是第十次孵化了。它让你可以显式地表达向量计算，JVM 会把它编译成最优的 SIMD 指令，性能比标量计算好很多，而且代码是平台无关的。

向量 API 适合科学计算、机器学习、图像处理、信号处理这些需要高性能计算的场景。它支持多种数据类型和操作，可以大幅提升性能，通常能提升 2-4 倍。

JDK 25 里的向量 API 继续改进，增加了对 `VectorShuffle` 的内存段支持，改进了可维护性，还支持了 `Float16` 的自动向量化。虽然还是孵化特性，但已经比较成熟了，可以在实际项目里用。

不过向量 API 还是孵化特性，API 可能会变，而且性能提升依赖于 CPU 的 SIMD 能力。应该在实际环境中测试性能，选择合适的场景使用。如果你在写高性能计算的应用，可以试试向量 API，应该会有不错的体验。
