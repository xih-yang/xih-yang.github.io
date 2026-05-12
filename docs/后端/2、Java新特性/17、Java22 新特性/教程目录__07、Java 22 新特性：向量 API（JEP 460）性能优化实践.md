# 07、Java 22 新特性：向量 API（JEP 460）性能优化实践
- 来源：https://ddkk.com/zhuanlan/java/java22/7.html
- 分类：Java 22 新特性
- 分组：教程目录
- 日期：2025-11-26
兄弟们，鹏磊今天来聊聊 Java 22 里的向量 API（Vector API）这个新特性，这玩意儿是 JEP 460 引入的，专门用来做性能优化的。说实话，写高性能代码这么多年了，最头疼的就是如何充分利用 CPU 的 SIMD（单指令多数据）能力，以前只能指望 JVM 自动向量化，但自动向量化有很多限制，很多场景下根本优化不了。向量 API 就是为了解决这个问题来的，它让咱们可以直接用 Java 代码表达向量计算，运行时编译成最优的向量指令，性能提升贼明显。

向量 API 是 Java 22 的孵化特性，它提供了一个平台无关的接口来表达向量计算，可以在运行时编译成支持 CPU 架构上的最优向量指令。核心思想是：把多个数据打包成向量，然后用一条指令同时处理多个数据，这样能充分利用现代 CPU 的 SIMD 能力，性能提升几倍甚至几十倍。这玩意儿特别适合需要大量数值计算的场景，比如矩阵运算、图像处理、科学计算、机器学习推理啥的。

## 为什么需要向量 API

先说说传统标量计算的问题。咱们平时写代码，大部分都是标量计算，一个数据一个数据地处理：

```java
// 传统标量计算：数组相加
public void scalarAdd(float[] a, float[] b, float[] result) {
    for (int i = 0; i < a.length; i++) {  // 循环处理每个元素
        result[i] = a[i] + b[i];  // 一次只处理一个元素
    }
}
// 问题1：CPU 的 SIMD 能力没有被充分利用
// 现代 CPU 支持 AVX-512，可以一次处理 16 个 float（512 位 / 32 位）
// 但标量代码一次只能处理 1 个，浪费了 15/16 的计算能力
// 问题2：JVM 自动向量化有限制
// JVM 虽然能自动向量化一些简单循环，但很多场景下无法自动优化
// 比如复杂的控制流、函数调用、不规则的访问模式等
// 问题3：无法跨平台保证性能
// 不同平台的 SIMD 指令集不同（x86 的 AVX、ARM 的 NEON）
// 标量代码无法利用这些特性
```

向量 API 就是为了解决这些问题。它让咱们可以直接表达向量计算，运行时根据硬件自动选择最优的向量指令，性能提升明显。

## 核心概念

向量 API 的核心概念包括：

1. **Vector（向量）**：表示一组打包的数据，比如 8 个 int 或 16 个 float
2. **VectorSpecies（向量种类）**：定义向量的形状和大小，比如 256 位的 float 向量
3. **Lane（通道）**：向量中的一个元素，比如 8 个 int 向量有 8 个通道
4. **VectorMask（向量掩码）**：控制哪些通道参与计算，用于处理边界情况
5. **VectorOperators（向量操作符）**：定义向量操作，比如 ADD、MUL、MAX 等

## 基本用法

### 简单的向量运算

最基础的用法就是向量相加，把两个数组的元素对应相加：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 向量相加：使用向量 API 加速数组相加
public void vectorAdd(float[] a, float[] b, float[] result) {
    // 获取首选向量种类，根据硬件自动选择最优大小
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    int i = 0;  // 循环索引
    // 向量化处理：每次处理一个向量的数据
    for (; i < species.loopBound(a.length); i += species.length()) {  // 循环直到边界
        // 从数组加载向量
        FloatVector va = FloatVector.fromArray(species, a, i);  // 从数组 a 加载向量
        FloatVector vb = FloatVector.fromArray(species, b, i);  // 从数组 b 加载向量
        // 向量相加：一条指令同时处理多个元素
        FloatVector vc = va.add(vb);  // 向量相加，所有通道同时计算
        // 将结果写回数组
        vc.intoArray(result, i);  // 将向量结果写回数组
    }
    // 处理剩余元素（不足一个向量的部分）
    for (; i < a.length; i++) {  // 处理剩余元素
        result[i] = a[i] + b[i];  // 标量处理剩余部分
    }
}
```

这玩意儿的好处是，向量相加一条指令就能处理多个元素（比如 8 个或 16 个），比标量代码快很多。而且代码会自动适配不同硬件，在支持 AVX-512 的 CPU 上会用 512 位向量，在支持 AVX2 的 CPU 上会用 256 位向量。

### 向量乘法和融合乘加

向量 API 还支持更复杂的运算，比如乘法和融合乘加（FMA）：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 向量乘法和融合乘加
public void vectorMultiplyAdd(float[] a, float[] b, float[] c, float[] result) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(a.length); i += species.length()) {  // 循环处理
        FloatVector va = FloatVector.fromArray(species, a, i);  // 加载向量 a
        FloatVector vb = FloatVector.fromArray(species, b, i);  // 加载向量 b
        FloatVector vc = FloatVector.fromArray(species, c, i);  // 加载向量 c
        // 方法1：先乘后加（两条指令）
        // FloatVector vmul = va.mul(vb);  // 向量乘法
        // FloatVector vresult = vmul.add(vc);  // 向量加法
        // 方法2：融合乘加（一条指令，性能更好）
        // FMA 指令：result = a * b + c，一条指令完成乘加
        FloatVector vresult = va.fma(vb, vc);  // 融合乘加，一条指令完成
        vresult.intoArray(result, i);  // 写回结果
    }
    // 处理剩余元素
    for (; i < a.length; i++) {  // 处理剩余部分
        result[i] = a[i] * b[i] + c[i];  // 标量处理
    }
}
```

融合乘加（FMA）特别有用，它把乘法和加法合并成一条指令，性能比分开执行更好。现代 CPU 都支持 FMA 指令，向量 API 会自动利用这个特性。

### 向量归约操作

向量 API 还支持归约操作，比如计算数组所有元素的和：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 向量归约：计算数组所有元素的和
public float vectorSum(float[] array) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    FloatVector sum = FloatVector.zero(species);  // 初始化为零向量
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(array.length); i += species.length()) {  // 循环处理
        FloatVector v = FloatVector.fromArray(species, array, i);  // 加载向量
        sum = sum.add(v);  // 累加到 sum 向量
    }
    // 向量归约：把向量中的所有通道归约成一个标量值
    float result = sum.reduceLanes(VectorOperators.ADD);  // 归约求和
    // 处理剩余元素
    for (; i < array.length; i++) {  // 处理剩余部分
        result += array[i];  // 累加剩余元素
    }
    return result;  // 返回结果
}
```

向量归约特别适合计算总和、最大值、最小值等聚合操作。它先把数据打包成向量累加，最后再归约成标量，比标量代码快很多。

## 处理边界情况：使用 VectorMask

实际应用中，数组长度可能不是向量长度的整数倍，这时候需要用 `VectorMask` 来处理边界：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 使用 VectorMask 处理边界情况
public void vectorAddWithMask(float[] a, float[] b, float[] result) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    int i = 0;  // 循环索引
    // 向量化处理（完整向量部分）
    for (; i < species.loopBound(a.length); i += species.length()) {  // 循环处理完整向量
        FloatVector va = FloatVector.fromArray(species, a, i);  // 加载向量 a
        FloatVector vb = FloatVector.fromArray(species, b, i);  // 加载向量 b
        FloatVector vc = va.add(vb);  // 向量相加
        vc.intoArray(result, i);  // 写回结果
    }
    // 处理剩余元素（不足一个向量的部分）
    if (i < a.length) {  // 如果还有剩余元素
        // 创建掩码：标记哪些通道是有效的
        VectorMask<Float> mask = species.indexInRange(i, a.length);  // 创建有效通道掩码
        // 使用掩码加载向量（只加载有效通道，无效通道为 0）
        FloatVector va = FloatVector.fromArray(species, a, i, mask);  // 带掩码加载
        FloatVector vb = FloatVector.fromArray(species, b, i, mask);  // 带掩码加载
        FloatVector vc = va.add(vb);  // 向量相加
        // 使用掩码写回（只写回有效通道）
        vc.intoArray(result, i, mask);  // 带掩码写回
    }
}
```

使用 `VectorMask` 的好处是，即使数组长度不是向量长度的整数倍，也能用向量指令处理，避免标量回退，性能更好。

## 实际应用场景

### 场景1：矩阵乘法优化

矩阵乘法是典型的数值计算场景，向量 API 能大幅提升性能：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 矩阵乘法优化：使用向量 API 加速
public void matrixMultiply(float[][] a, float[][] b, float[][] result) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    int n = a.length;  // 矩阵维度
    for (int i = 0; i < n; i++) {  // 遍历结果矩阵的行
        for (int j = 0; j < n; j++) {  // 遍历结果矩阵的列
            // 计算 result[i][j] = sum(a[i][k] * b[k][j])
            FloatVector sum = FloatVector.zero(species);  // 初始化和向量
            int k = 0;  // 循环索引
            // 向量化内积计算
            for (; k < species.loopBound(n); k += species.length()) {  // 向量化处理
                // 加载 a[i][k...k+vectorLength-1]
                FloatVector va = FloatVector.fromArray(species, a[i], k);  // 加载向量 a
                // 加载 b[k...k+vectorLength-1][j]
                FloatVector vb = FloatVector.fromArray(species, b[k], j, species.length());  // 加载向量 b（需要特殊处理）
                // 向量乘加：sum += va * vb
                sum = sum.fma(va, vb);  // 融合乘加累加
            }
            // 归约求和
            result[i][j] = sum.reduceLanes(VectorOperators.ADD);  // 归约求和
            // 处理剩余元素
            for (; k < n; k++) {  // 处理剩余部分
                result[i][j] += a[i][k] * b[k][j];  // 标量处理
            }
        }
    }
}
```

这个例子展示了如何用向量 API 优化矩阵乘法。关键是向量化内积计算，用融合乘加指令累加，性能提升明显。

### 场景2：图像处理：像素操作

图像处理是另一个典型场景，需要对大量像素进行相同操作：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 图像亮度调整：使用向量 API 加速像素操作
public void adjustBrightness(int[] pixels, float factor) {
    VectorSpecies<Int> species = IntVector.SPECIES_PREFERRED;  // 获取首选种类（int 向量）
    VectorSpecies<Float> floatSpecies = FloatVector.SPECIES_PREFERRED;  // float 向量种类
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(pixels.length); i += species.length()) {  // 循环处理
        // 加载像素向量（ARGB 格式）
        IntVector pixelVector = IntVector.fromArray(species, pixels, i);  // 加载像素向量
        // 提取 RGB 通道（需要位操作，这里简化处理）
        // 实际应用中需要分别处理 R、G、B 通道
        // 这里只是示例，展示向量化的思路
        // 转换为 float 进行亮度调整
        // 注意：这里需要更复杂的处理来提取和重组 RGB 通道
        // 实际实现会更复杂，需要位掩码和移位操作
        // 写回像素
        pixelVector.intoArray(pixels, i);  // 写回结果
    }
    // 处理剩余像素
    for (; i < pixels.length; i++) {  // 处理剩余部分
        // 标量处理剩余像素
        int pixel = pixels[i];  // 获取像素值
        // 调整亮度（简化处理）
        pixels[i] = pixel;  // 写回（实际需要更复杂的处理）
    }
}
```

图像处理场景下，向量 API 能同时处理多个像素，性能提升明显。不过实际应用中，处理 ARGB 格式需要更复杂的位操作。

### 场景3：数组查找和过滤

向量 API 还支持比较操作，可以用来做数组查找和过滤：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 数组过滤：找出大于阈值的元素
public int[] filterGreaterThan(float[] array, float threshold) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    int[] indices = new int[array.length];  // 存储符合条件的索引
    int count = 0;  // 计数器
    FloatVector thresholdVector = FloatVector.broadcast(species, threshold);  // 广播阈值
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(array.length); i += species.length()) {  // 循环处理
        FloatVector v = FloatVector.fromArray(species, array, i);  // 加载向量
        // 向量比较：v > threshold
        VectorMask<Float> mask = v.compare(VectorOperators.GT, thresholdVector);  // 创建比较掩码
        // 处理掩码：找出哪些通道满足条件
        if (mask.anyTrue()) {  // 如果有任何通道满足条件
            // 遍历掩码，找出满足条件的索引
            for (int j = 0; j < species.length(); j++) {  // 遍历通道
                if (mask.laneIsSet(j)) {  // 如果第 j 个通道满足条件
                    indices[count++] = i + j;  // 记录索引
                }
            }
        }
    }
    // 处理剩余元素
    for (; i < array.length; i++) {  // 处理剩余部分
        if (array[i] > threshold) {  // 标量比较
            indices[count++] = i;  // 记录索引
        }
    }
    // 返回结果数组（截取到实际长度）
    int[] result = new int[count];  // 创建结果数组
    System.arraycopy(indices, 0, result, 0, count);  // 复制数据
    return result;  // 返回结果
}
```

这个例子展示了如何用向量 API 做数组过滤。向量比较能同时比较多个元素，比标量代码快很多。

### 场景4：科学计算：向量点积

向量点积是科学计算中的常见操作，向量 API 能大幅提升性能：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
// 向量点积：使用向量 API 加速
public float dotProduct(float[] a, float[] b) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    FloatVector sum = FloatVector.zero(species);  // 初始化和向量
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(a.length); i += species.length()) {  // 循环处理
        FloatVector va = FloatVector.fromArray(species, a, i);  // 加载向量 a
        FloatVector vb = FloatVector.fromArray(species, b, i);  // 加载向量 b
        // 向量乘加：sum += va * vb
        sum = sum.fma(va, vb);  // 融合乘加累加
    }
    // 归约求和
    float result = sum.reduceLanes(VectorOperators.ADD);  // 归约求和
    // 处理剩余元素
    for (; i < a.length; i++) {  // 处理剩余部分
        result += a[i] * b[i];  // 标量处理
    }
    return result;  // 返回结果
}
```

向量点积是典型的向量化场景，用融合乘加指令累加，性能提升明显。

## 性能优化技巧

### 1. 使用首选向量种类

使用 `SPECIES_PREFERRED` 让代码自动适配硬件：

```java
// ✅ 正确：使用首选种类
VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 自动选择最优大小
// ❌ 错误：硬编码向量大小
VectorSpecies<Float> species = FloatVector.SPECIES_256;  // 硬编码，可能不是最优的
```

### 2. 最小化跨通道操作

跨通道操作（比如洗牌、置换）比通道内操作慢，尽量少用：

```java
// ✅ 正确：通道内操作（快）
FloatVector v1 = va.add(vb);  // 通道内相加，每个通道独立计算
FloatVector v2 = va.mul(vb);  // 通道内相乘
// ❌ 避免：跨通道操作（慢）
// FloatVector v3 = va.rearrange(indices);  // 跨通道重排，性能较差
```

### 3. 使用融合乘加

尽量使用融合乘加（FMA）而不是分开的乘法和加法：

```java
// ✅ 正确：使用融合乘加（一条指令）
FloatVector result = va.fma(vb, vc);  // result = va * vb + vc
// ❌ 错误：分开的乘法和加法（两条指令）
FloatVector mul = va.mul(vb);  // 乘法
FloatVector result = mul.add(vc);  // 加法
```

### 4. 处理边界情况

用 `VectorMask` 处理边界，避免标量回退：

```java
// ✅ 正确：使用掩码处理边界
if (i < array.length) {  // 如果有剩余元素
    VectorMask<Float> mask = species.indexInRange(i, array.length);  // 创建掩码
    FloatVector v = FloatVector.fromArray(species, array, i, mask);  // 带掩码加载
    v.intoArray(result, i, mask);  // 带掩码写回
}
// ❌ 错误：标量回退处理边界
for (; i < array.length; i++) {  // 标量处理，性能较差
    result[i] = array[i] * 2;  // 标量操作
}
```

### 5. 预热和基准测试

向量 API 需要 JIT 编译优化，记得预热和基准测试：

```java
// 预热：让 JIT 编译优化代码
for (int i = 0; i < 10000; i++) {  // 预热循环
    vectorAdd(a, b, result);  // 执行向量化代码
}
// 基准测试：测量性能
long start = System.nanoTime();  // 开始时间
for (int i = 0; i < 100000; i++) {  // 测试循环
    vectorAdd(a, b, result);  // 执行代码
}
long end = System.nanoTime();  // 结束时间
System.out.println("耗时: " + (end - start) / 1_000_000 + " ms");  // 输出耗时
```

## 性能对比

向量 API 的性能提升取决于具体场景和硬件，但一般来说：

1. **简单运算**（加减乘除）：2-4 倍提升
2. **复杂运算**（融合乘加、三角函数）：4-8 倍提升
3. **归约操作**（求和、最大值）：3-6 倍提升
4. **矩阵运算**：5-10 倍提升（取决于矩阵大小）

实际性能提升还取决于：

- **硬件支持**：支持 AVX-512 的 CPU 性能更好
- **数据对齐**：对齐的数据性能更好
- **缓存友好**：缓存友好的访问模式性能更好
- **JIT 优化**：需要充分预热让 JIT 优化

## 注意事项

使用向量 API 时，有几个注意事项：

### 1. 硬件依赖

向量 API 的性能提升依赖于硬件支持，不支持 SIMD 的硬件可能没有提升：

```java
// 检查硬件支持
VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
int vectorLength = species.length();  // 获取向量长度
System.out.println("向量长度: " + vectorLength);  // 输出向量长度
// 如果向量长度是 1，说明硬件不支持 SIMD，向量化没有意义
```

### 2. API 还在孵化阶段

向量 API 还在孵化阶段，API 可能会变化，生产环境使用要谨慎：

```java
// 注意：API 在 jdk.incubator.vector 包中，可能会变化
import jdk.incubator.vector.*;  // 孵化 API，未来可能会移到 java.util.vector
```

### 3. 需要启用预览特性

Java 22 中，向量 API 需要启用预览特性：

```bash
# 编译时启用预览特性
javac --enable-preview --release 22 VectorExample.java
# 运行时启用预览特性
java --enable-preview VectorExample
```

### 4. 数据对齐

虽然向量 API 会自动处理未对齐的数据，但对齐的数据性能更好：

```java
// 尽量使用对齐的数据
// 某些场景下，手动对齐数据可能性能更好
// 但大多数情况下，向量 API 会自动处理
```

## 总结

向量 API（JEP 460）是 Java 22 引入的一个重要特性，它让咱们可以直接用 Java 代码表达向量计算，充分利用 CPU 的 SIMD 能力，性能提升明显。核心优势包括：

1. **平台无关**：代码自动适配不同硬件，在不同平台上都能获得最优性能
2. **性能提升明显**：简单运算 2-4 倍，复杂运算 4-8 倍，矩阵运算 5-10 倍
3. **类型安全**：编译时检查类型，避免运行时错误
4. **易于使用**：API 设计清晰，比手写汇编简单很多
5. **JIT 优化**：运行时编译成最优向量指令

虽然向量 API 还在孵化阶段，但它的设计理念和 API 已经相当成熟了。如果你需要做大量数值计算、图像处理、科学计算，或者需要极致性能优化，强烈建议试试向量 API，它能让你的代码性能提升几倍甚至几十倍。

兄弟们，今天就聊到这里。向量 API 这玩意儿确实能大幅提升性能，但也要注意硬件依赖和 API 稳定性。有啥问题欢迎留言讨论，鹏磊会继续分享 Java 22 的其他新特性。
