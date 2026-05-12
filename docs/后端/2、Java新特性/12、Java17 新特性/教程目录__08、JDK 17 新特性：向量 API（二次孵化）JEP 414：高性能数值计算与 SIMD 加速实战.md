# 08、JDK 17 新特性：向量 API（二次孵化）JEP 414：高性能数值计算与 SIMD 加速实战
- 来源：https://ddkk.com/zhuanlan/java/java17/8.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
搞数值计算的时候，鹏磊最烦的就是性能瓶颈。数组相加、矩阵运算这些操作，用传统方式写循环，CPU 利用率低，速度也慢。JDK 17 的向量 API（Vector API）终于解决了这个问题，让你能利用 SIMD（单指令多数据）指令加速计算，性能提升好几倍。

向量 API 是 JEP 414 引入的二次孵化特性，让你能在 Java 里写向量化代码，利用 CPU 的 SIMD 指令集（比如 SSE、AVX）并行处理多个数据。这玩意儿对于科学计算、图像处理、机器学习这些需要大量并行计算的场景特别有用，性能提升非常明显。

## 什么是 SIMD

SIMD（Single Instruction, Multiple Data）是单指令多数据的缩写，意思是一条指令能同时处理多个数据。比如传统的加法是一条指令处理一对数据，SIMD 加法是一条指令同时处理多对数据。

```java
// 传统方式：循环相加
int[] a = {1, 2, 3, 4, 5, 6, 7, 8};
int[] b = {2, 3, 4, 5, 6, 7, 8, 9};
int[] c = new int[8];
// 一条指令处理一对数据，需要 8 次循环
for (int i = 0; i < 8; i++) {
    c[i] = a[i] + b[i];  // 每次处理一对
}
// 向量 API：SIMD 相加
// 一条指令同时处理 8 对数据，只需要 1 次操作
// 性能提升 8 倍（理论上）
```

看，SIMD 能同时处理多个数据，性能提升明显。

## 启用向量 API

向量 API 是孵化特性，需要启用预览特性：

```bash
# 编译时启用预览特性
javac --enable-preview --release 17 Main.java
# 运行时启用预览特性
java --enable-preview Main
```

或者在模块信息里声明：

```java
module my.module {
    requires jdk.incubator.vector;  // 需要 incubator 模块
}
```

## 基础用法

先看看向量 API 的基础用法：

```java
import jdk.incubator.vector.*;
// 创建向量物种（Vector Species），指定元素类型和向量大小
VectorSpecies<Integer> species = IntVector.SPECIES_256;  // 256 位向量，可以存 8 个 int
// 从数组创建向量
int[] array1 = {1, 2, 3, 4, 5, 6, 7, 8};  // 源数组 1
int[] array2 = {2, 3, 4, 5, 6, 7, 8, 9};  // 源数组 2
int[] result = new int[8];  // 结果数组
// 创建向量
IntVector vec1 = IntVector.fromArray(species, array1, 0);  // 从数组创建向量 1
IntVector vec2 = IntVector.fromArray(species, array2, 0);  // 从数组创建向量 2
// 向量运算：一条指令同时处理 8 个元素
IntVector vecResult = vec1.add(vec2);  // 向量相加
// 写回数组
vecResult.intoArray(result, 0);  // 写回结果数组
// 打印结果
for (int value : result) {
    System.out.print(value + " ");  // 输出: 3 5 7 9 11 13 15 17
}
```

看，向量 API 用起来很简单，一条指令就能处理多个数据。

## 向量运算

向量 API 支持各种运算：

```java
import jdk.incubator.vector.*;
VectorSpecies<Integer> species = IntVector.SPECIES_256;  // 256 位向量
int[] a = {10, 20, 30, 40, 50, 60, 70, 80};  // 数组 a
int[] b = {2, 3, 4, 5, 6, 7, 8, 9};  // 数组 b
int[] result = new int[8];  // 结果数组
IntVector vecA = IntVector.fromArray(species, a, 0);  // 创建向量 a
IntVector vecB = IntVector.fromArray(species, b, 0);  // 创建向量 b
// 加法
IntVector addResult = vecA.add(vecB);  // 向量相加
addResult.intoArray(result, 0);  // 写回数组
System.out.println("加法结果: " + java.util.Arrays.toString(result));  // 输出: [12, 23, 34, 45, 56, 67, 78, 89]
// 减法
IntVector subResult = vecA.sub(vecB);  // 向量相减
subResult.intoArray(result, 0);  // 写回数组
System.out.println("减法结果: " + java.util.Arrays.toString(result));  // 输出: [8, 17, 26, 35, 44, 53, 62, 71]
// 乘法
IntVector mulResult = vecA.mul(vecB);  // 向量相乘
mulResult.intoArray(result, 0);  // 写回数组
System.out.println("乘法结果: " + java.util.Arrays.toString(result));  // 输出: [20, 60, 120, 200, 300, 420, 560, 720]
// 除法
IntVector divResult = vecA.div(vecB);  // 向量相除
divResult.intoArray(result, 0);  // 写回数组
System.out.println("除法结果: " + java.util.Arrays.toString(result));  // 输出: [5, 6, 7, 8, 8, 8, 8, 8]
// 最大值
IntVector maxResult = vecA.max(vecB);  // 向量最大值
maxResult.intoArray(result, 0);  // 写回数组
System.out.println("最大值结果: " + java.util.Arrays.toString(result));  // 输出: [10, 20, 30, 40, 50, 60, 70, 80]
// 最小值
IntVector minResult = vecA.min(vecB);  // 向量最小值
minResult.intoArray(result, 0);  // 写回数组
System.out.println("最小值结果: " + java.util.Arrays.toString(result));  // 输出: [2, 3, 4, 5, 6, 7, 8, 9]
```

向量运算支持加减乘除、最大值、最小值等，一条指令处理多个数据。

## 处理大数组

处理大数组是向量 API 的典型应用：

```java
import jdk.incubator.vector.*;
// 数组相加的向量化实现
public static void vectorAdd(int[] a, int[] b, int[] c) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;  // 256 位向量
    int i = 0;  // 循环索引
    // 向量化循环：每次处理 8 个元素
    for (; i < species.loopBound(a.length); i += species.length()) {
        // 从数组创建向量
        IntVector vecA = IntVector.fromArray(species, a, i);  // 向量 a
        IntVector vecB = IntVector.fromArray(species, b, i);  // 向量 b
        // 向量相加
        IntVector vecC = vecA.add(vecB);  // 向量相加
        // 写回数组
        vecC.intoArray(c, i);  // 写回结果
    }
    // 处理剩余元素（不足一个向量的部分）
    for (; i < a.length; i++) {
        c[i] = a[i] + b[i];  // 标量相加
    }
}
// 使用示例
int[] a = new int[1000];  // 数组 a，1000 个元素
int[] b = new int[1000];  // 数组 b，1000 个元素
int[] c = new int[1000];  // 结果数组
// 初始化数组
for (int i = 0; i < 1000; i++) {
    a[i] = i;  // 初始化 a
    b[i] = i * 2;  // 初始化 b
}
// 向量化相加
vectorAdd(a, b, c);  // 调用向量化函数
// 验证结果
for (int i = 0; i < 1000; i++) {
    if (c[i] != a[i] + b[i]) {
        System.out.println("错误: " + i);  // 检查错误
    }
}
System.out.println("计算完成");  // 输出: 计算完成
```

向量化处理大数组，性能提升明显，特别是数组很大的时候。

## 向量掩码（Vector Mask）

向量掩码能选择性地处理元素：

```java
import jdk.incubator.vector.*;
VectorSpecies<Integer> species = IntVector.SPECIES_256;  // 256 位向量
int[] a = {1, 2, 3, 4, 5, 6, 7, 8};  // 数组 a
int[] b = {10, 20, 30, 40, 50, 60, 70, 80};  // 数组 b
int[] result = new int[8];  // 结果数组
IntVector vecA = IntVector.fromArray(species, a, 0);  // 创建向量 a
IntVector vecB = IntVector.fromArray(species, b, 0);  // 创建向量 b
// 创建掩码：选择大于 3 的元素
VectorMask<Integer> mask = vecA.gt(3);  // 大于 3 的掩码
// 条件相加：只有掩码为 true 的元素才相加
IntVector vecResult = vecA.add(vecB, mask);  // 条件相加
// 写回数组
vecResult.intoArray(result, 0);  // 写回结果
// 打印结果
for (int i = 0; i < 8; i++) {
    if (mask.laneIsSet(i)) {
        System.out.println("元素 " + i + ": " + result[i]);  // 输出掩码为 true 的元素
    }
}
```

向量掩码能选择性地处理元素，适合条件计算。

## 实际应用：矩阵运算

矩阵运算是向量 API 的典型应用：

```java
import jdk.incubator.vector.*;
// 矩阵向量相乘
public static void matrixVectorMultiply(double[] matrix, double[] vector, double[] result, int rows, int cols) {
    VectorSpecies<Double> species = DoubleVector.SPECIES_256;  // 256 位向量，可以存 4 个 double
    for (int i = 0; i < rows; i++) {
        double sum = 0.0;  // 累加和
        int j = 0;  // 列索引
        // 向量化循环：每次处理 4 个元素
        for (; j < species.loopBound(cols); j += species.length()) {
            // 从矩阵行创建向量
            DoubleVector matVec = DoubleVector.fromArray(species, matrix, i * cols + j);  // 矩阵行向量
            DoubleVector vecVec = DoubleVector.fromArray(species, vector, j);  // 向量向量
            // 向量相乘并累加
            DoubleVector mulVec = matVec.mul(vecVec);  // 向量相乘
            sum += mulVec.reduceLanes(VectorOperators.ADD);  // 累加向量元素
        }
        // 处理剩余元素
        for (; j < cols; j++) {
            sum += matrix[i * cols + j] * vector[j];  // 标量相乘
        }
        result[i] = sum;  // 保存结果
    }
}
// 使用示例
int rows = 100;  // 矩阵行数
int cols = 100;  // 矩阵列数
double[] matrix = new double[rows * cols];  // 矩阵
double[] vector = new double[cols];  // 向量
double[] result = new double[rows];  // 结果
// 初始化矩阵和向量
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        matrix[i * cols + j] = i * cols + j;  // 初始化矩阵
    }
}
for (int j = 0; j < cols; j++) {
    vector[j] = j;  // 初始化向量
}
// 矩阵向量相乘
matrixVectorMultiply(matrix, vector, result, rows, cols);  // 调用向量化函数
// 验证结果
System.out.println("矩阵向量相乘完成");  // 输出: 矩阵向量相乘完成
```

矩阵运算用向量 API 加速，性能提升明显，特别是大矩阵的时候。

## 实际应用：图像处理

图像处理也是向量 API 的典型应用：

```java
import jdk.incubator.vector.*;
// 图像亮度调整（向量化）
public static void adjustBrightness(byte[] pixels, int adjustment) {
    VectorSpecies<Byte> species = ByteVector.SPECIES_256;  // 256 位向量，可以存 32 个 byte
    int i = 0;  // 循环索引
    // 向量化循环：每次处理 32 个像素
    for (; i < species.loopBound(pixels.length); i += species.length()) {
        // 从数组创建向量
        ByteVector vec = ByteVector.fromArray(species, pixels, i);  // 像素向量
        // 转换为 int 向量（避免溢出）
        IntVector intVec = vec.castShape(IntVector.SPECIES_256, 0);  // 转换为 int
        // 调整亮度
        IntVector adjusted = intVec.add(adjustment);  // 加上调整值
        // 限制范围 [0, 255]
        IntVector clamped = adjusted.max(0).min(255);  // 限制范围
        // 转换回 byte 向量
        ByteVector result = clamped.castShape(ByteVector.SPECIES_256, 0);  // 转换回 byte
        // 写回数组
        result.intoArray(pixels, i);  // 写回像素数组
    }
    // 处理剩余像素
    for (; i < pixels.length; i++) {
        int value = (pixels[i] & 0xFF) + adjustment;  // 调整亮度
        pixels[i] = (byte) Math.max(0, Math.min(255, value));  // 限制范围
    }
}
// 使用示例
byte[] pixels = new byte[1920 * 1080 * 3];  // 1920x1080 RGB 图像
// 初始化像素数据...
adjustBrightness(pixels, 20);  // 增加亮度 20
```

图像处理用向量 API 加速，性能提升明显，特别是高分辨率图像。

## 性能对比

性能对比能看出向量 API 的优势：

```java
import jdk.incubator.vector.*;
// 传统方式：标量相加
public static void scalarAdd(int[] a, int[] b, int[] c) {
    for (int i = 0; i < a.length; i++) {
        c[i] = a[i] + b[i];  // 标量相加
    }
}
// 向量化方式：SIMD 相加
public static void vectorAdd(int[] a, int[] b, int[] c) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;  // 256 位向量
    int i = 0;  // 循环索引
    // 向量化循环
    for (; i < species.loopBound(a.length); i += species.length()) {
        IntVector vecA = IntVector.fromArray(species, a, i);  // 向量 a
        IntVector vecB = IntVector.fromArray(species, b, i);  // 向量 b
        IntVector vecC = vecA.add(vecB);  // 向量相加
        vecC.intoArray(c, i);  // 写回数组
    }
    // 处理剩余元素
    for (; i < a.length; i++) {
        c[i] = a[i] + b[i];  // 标量相加
    }
}
// 性能测试
int size = 10_000_000;  // 1000 万元素
int[] a = new int[size];  // 数组 a
int[] b = new int[size];  // 数组 b
int[] c1 = new int[size];  // 结果数组 1
int[] c2 = new int[size];  // 结果数组 2
// 初始化数组
for (int i = 0; i < size; i++) {
    a[i] = i;  // 初始化 a
    b[i] = i * 2;  // 初始化 b
}
// 测试标量方式
long start = System.nanoTime();  // 开始时间
scalarAdd(a, b, c1);  // 标量相加
long scalarTime = System.nanoTime() - start;  // 标量时间
// 测试向量方式
start = System.nanoTime();  // 开始时间
vectorAdd(a, b, c2);  // 向量相加
long vectorTime = System.nanoTime() - start;  // 向量时间
// 输出性能对比
System.out.println("标量时间: " + scalarTime / 1_000_000 + " ms");  // 输出标量时间
System.out.println("向量时间: " + vectorTime / 1_000_000 + " ms");  // 输出向量时间
System.out.println("加速比: " + (double) scalarTime / vectorTime);  // 输出加速比
```

向量 API 性能提升明显，特别是大数组的时候，加速比能达到 4-8 倍。

## 注意事项和最佳实践

### 注意事项

1. **孵化 API**：向量 API 还在孵化阶段，API 可能会变化，不建议在生产环境使用。
2. **平台支持**：不同平台的 SIMD 指令集不同，性能可能有差异。
3. **数组对齐**：数组对齐能提升性能，但向量 API 会自动处理。
4. **剩余元素**：数组长度不是向量大小的倍数时，需要处理剩余元素。

### 最佳实践

1. **选择合适的向量大小**：根据 CPU 和数据类型选择合适的向量大小。
2. **循环展开**：向量化循环能提升性能，但要处理好剩余元素。
3. **避免数据依赖**：避免循环中的数据依赖，让编译器能更好地优化。
4. **性能测试**：实际测试性能，不同场景性能可能有差异。
5. **文档说明**：在代码注释中说明为什么用向量 API，帮助其他开发者理解。

## 总结

向量 API 是 JDK 17 的一个重磅特性，让你能利用 SIMD 指令加速数值计算，性能提升明显。对于科学计算、图像处理、机器学习这些需要大量并行计算的场景特别有用。

虽然还在孵化阶段，但已经很好用了。建议在新项目里试试，特别是需要高性能数值计算的场景。下一篇文章咱就聊聊增强的伪随机数生成器，看看怎么生成更灵活的随机数。兄弟们有啥问题随时问，鹏磊会尽量解答。
