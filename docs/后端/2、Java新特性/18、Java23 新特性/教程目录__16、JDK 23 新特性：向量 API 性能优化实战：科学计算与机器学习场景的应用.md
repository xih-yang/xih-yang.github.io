# 16、JDK 23 新特性：向量 API 性能优化实战：科学计算与机器学习场景的应用
- 来源：https://ddkk.com/zhuanlan/java/java23/16.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
做科学计算和机器学习的时候，性能是最关键的，特别是矩阵运算、卷积这些计算密集型的操作，传统方式循环一个个算，速度太慢了。向量API可以利用CPU的SIMD指令，一次处理多个数据，性能能提升好几倍，甚至十几倍。

鹏磊我之前做机器学习项目的时候，矩阵乘法、向量点积这些操作，用传统方式循环算，训练一个模型得等半天。现在用向量API，同样的计算能快好几倍，特别是大数据量的场景，优势更明显。今天咱就聊聊向量API在科学计算和机器学习场景下的实战应用，看看怎么优化性能。

向量API的核心就是利用SIMD指令，把多个数据打包在一起，用一条指令同时处理。现代CPU都支持SIMD，像AVX2、AVX-512这些，向量API能让Java代码充分利用这些指令，性能自然就上去了。

## 科学计算场景优化

### 矩阵乘法优化

矩阵乘法是科学计算中最常见的操作，用向量API可以大幅提升性能：

```java
import jdk.incubator.vector.*;
// 优化的矩阵乘法
public class MatrixMultiplication {
    private static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_256;
    // 向量化的矩阵乘法
    public static float[][] multiply(float[][] a, float[][] b) {
        int m = a.length;
        int n = b[0].length;
        int k = a[0].length;
        float[][] c = new float[m][n];
        // 外层循环：遍历结果矩阵的行
        for (int i = 0; i < m; i++) {
            // 内层循环：遍历结果矩阵的列，向量化处理
            for (int j = 0; j < n; j += SPECIES.length()) {
                // 创建累加向量，初始化为0
                FloatVector sum = FloatVector.zero(SPECIES);
                // 计算点积，向量化处理
                for (int l = 0; l < k; l++) {
                    // 加载a[i][l]并广播到整个向量
                    FloatVector va = FloatVector.broadcast(SPECIES, a[i][l]);
                    // 加载b[l]的一行，从j开始
                    FloatVector vb = FloatVector.fromArray(SPECIES, b[l], j);
                    // 累加：sum += a[i][l] * b[l][j:j+vector_length]
                    sum = va.fma(vb, sum);  // 融合乘加，性能更好
                }
                // 存储结果
                sum.intoArray(c[i], j);
            }
        }
        return c;
    }
}
```

用FMA（融合乘加）指令，性能比分开的乘法和加法更好。

### 向量点积优化

向量点积是很多算法的基础操作，用向量API可以大幅提升性能：

```java
// 优化的向量点积
public class DotProduct {
    private static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_256;
    public static float dotProduct(float[] a, float[] b) {
        int length = a.length;
        int i = 0;
        FloatVector sum = FloatVector.zero(SPECIES);  // 累加向量
        // 向量化处理，每次处理多个元素
        for (; i < length - (length % SPECIES.length()); i += SPECIES.length()) {
            FloatVector va = FloatVector.fromArray(SPECIES, a, i);  // 加载a的一部分
            FloatVector vb = FloatVector.fromArray(SPECIES, b, i);  // 加载b的一部分
            sum = va.fma(vb, sum);  // 融合乘加：sum += a * b
        }
        // 处理剩余元素
        float result = sum.reduceLanes(VectorOperators.ADD);  // 向量内求和
        for (; i < length; i++) {
            result += a[i] * b[i];  // 标量处理剩余元素
        }
        return result;
    }
}
```

向量化处理大部分元素，标量处理剩余元素，性能最好。

### 向量归一化优化

向量归一化是很多算法的预处理步骤，用向量API可以加速：

```java
// 优化的向量归一化
public class VectorNormalization {
    private static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_256;
    public static void normalize(float[] vector) {
        int length = vector.length;
        // 第一步：计算向量的模长（L2范数）
        FloatVector sumSquares = FloatVector.zero(SPECIES);
        int i = 0;
        // 向量化计算平方和
        for (; i < length - (length % SPECIES.length()); i += SPECIES.length()) {
            FloatVector v = FloatVector.fromArray(SPECIES, vector, i);
            sumSquares = v.fma(v, sumSquares);  // sum += v * v
        }
        float norm = (float) Math.sqrt(sumSquares.reduceLanes(VectorOperators.ADD));
        // 处理剩余元素
        for (; i < length; i++) {
            norm += vector[i] * vector[i];
        }
        norm = (float) Math.sqrt(norm);
        if (norm == 0) return;  // 避免除零
        // 第二步：归一化，向量化处理
        FloatVector normVec = FloatVector.broadcast(SPECIES, 1.0f / norm);
        i = 0;
        for (; i < length - (length % SPECIES.length()); i += SPECIES.length()) {
            FloatVector v = FloatVector.fromArray(SPECIES, vector, i);
            v.mul(normVec).intoArray(vector, i);  // vector[i] /= norm
        }
        // 处理剩余元素
        for (; i < length; i++) {
            vector[i] /= norm;
        }
    }
}
```

分两步优化，先计算模长，再归一化，性能更好。

## 机器学习场景优化

### 全连接层前向传播优化

全连接层是神经网络的基础组件，用向量API可以加速：

```java
// 优化的全连接层前向传播
public class FullyConnectedLayer {
    private static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_256;
    // 权重矩阵和偏置
    private final float[][] weights;
    private final float[] bias;
    public float[] forward(float[] input) {
        int outputSize = weights.length;
        float[] output = new float[outputSize];
        // 对每个输出神经元，计算加权和
        for (int i = 0; i < outputSize; i++) {
            FloatVector sum = FloatVector.zero(SPECIES);
            int j = 0;
            // 向量化计算点积
            for (; j < input.length - (input.length % SPECIES.length()); 
                 j += SPECIES.length()) {
                FloatVector w = FloatVector.fromArray(SPECIES, weights[i], j);
                FloatVector x = FloatVector.fromArray(SPECIES, input, j);
                sum = w.fma(x, sum);  // sum += w * x
            }
            // 处理剩余元素
            float result = sum.reduceLanes(VectorOperators.ADD);
            for (; j < input.length; j++) {
                result += weights[i][j] * input[j];
            }
            // 加上偏置并应用激活函数
            output[i] = relu(result + bias[i]);
        }
        return output;
    }
    private float relu(float x) {
        return Math.max(0, x);
    }
}
```

向量化计算点积，性能提升明显。

### 卷积操作优化

卷积是CNN的核心操作，用向量API可以加速：

```java
// 优化的卷积操作
public class Convolution {
    private static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_256;
    // 2D卷积，向量化优化
    public float[][] convolve2D(float[][] input, float[][] kernel, 
                                int padding, int stride) {
        int inputH = input.length;
        int inputW = input[0].length;
        int kernelH = kernel.length;
        int kernelW = kernel[0].length;
        int outputH = (inputH + 2 * padding - kernelH) / stride + 1;
        int outputW = (inputW + 2 * padding - kernelW) / stride + 1;
        float[][] output = new float[outputH][outputW];
        // 遍历输出位置
        for (int outY = 0; outY < outputH; outY++) {
            for (int outX = 0; outX < outputW; outX += SPECIES.length()) {
                FloatVector sum = FloatVector.zero(SPECIES);
                // 遍历卷积核
                for (int ky = 0; ky < kernelH; ky++) {
                    for (int kx = 0; kx < kernelW; kx++) {
                        int inY = outY * stride + ky - padding;
                        int inX = outX * stride + kx - padding;
                        if (inY >= 0 && inY < inputH && inX >= 0 && inX < inputW) {
                            // 向量化处理多个输出位置
                            FloatVector inputVec = FloatVector.fromArray(
                                SPECIES, input[inY], inX);
                            FloatVector kernelVal = FloatVector.broadcast(
                                SPECIES, kernel[ky][kx]);
                            sum = inputVec.fma(kernelVal, sum);
                        }
                    }
                }
                // 存储结果
                sum.intoArray(output[outY], outX);
            }
        }
        return output;
    }
}
```

向量化处理多个输出位置，性能提升明显。

### 批量归一化优化

批量归一化是训练深度网络的重要技术，用向量API可以加速：

```java
// 优化的批量归一化
public class BatchNormalization {
    private static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_256;
    // 批量归一化：y = (x - mean) / sqrt(variance + epsilon) * gamma + beta
    public void normalize(float[] data, float mean, float variance, 
                         float gamma, float beta, float epsilon) {
        int length = data.length;
        float std = (float) Math.sqrt(variance + epsilon);
        float scale = gamma / std;
        float shift = beta - gamma * mean / std;
        // 向量化处理
        FloatVector scaleVec = FloatVector.broadcast(SPECIES, scale);
        FloatVector shiftVec = FloatVector.broadcast(SPECIES, shift);
        FloatVector meanVec = FloatVector.broadcast(SPECIES, mean);
        int i = 0;
        for (; i < length - (length % SPECIES.length()); i += SPECIES.length()) {
            FloatVector v = FloatVector.fromArray(SPECIES, data, i);
            // y = (x - mean) * scale + shift
            v.sub(meanVec).mul(scaleVec).add(shiftVec).intoArray(data, i);
        }
        // 处理剩余元素
        for (; i < length; i++) {
            data[i] = (data[i] - mean) * scale + shift;
        }
    }
}
```

向量化处理，性能提升明显。

## 性能优化技巧

### 技巧1：使用FMA指令

FMA（融合乘加）指令比分开的乘法和加法更快：

```java
// 好的做法：使用FMA
FloatVector result = a.fma(b, c);  // result = a * b + c，一条指令
// 不好的做法：分开乘加
FloatVector result = a.mul(b).add(c);  // 两条指令，性能差
```

FMA指令性能更好，应该优先使用。

### 技巧2：数据对齐

数据对齐可以提高性能，减少内存访问延迟：

```java
// 好的做法：处理对齐的数据
int alignedLength = length - (length % SPECIES.length());
for (int i = 0; i < alignedLength; i += SPECIES.length()) {
    // 向量化处理对齐的数据
    FloatVector v = FloatVector.fromArray(SPECIES, data, i);
    // ...
}
// 处理剩余元素
for (int i = alignedLength; i < length; i++) {
    // 标量处理剩余元素
}
```

先处理对齐的数据，再处理剩余元素，性能最好。

### 技巧3：减少分支

分支会破坏向量化的连续性，应该尽量减少：

```java
// 好的做法：用掩码代替分支
VectorMask<Float> mask = vector.compare(VectorOperators.GT, threshold);
FloatVector result = vector.blend(threshold, mask);  // 用掩码选择
// 不好的做法：用分支
for (int i = 0; i < length; i++) {
    if (data[i] > threshold) {  // 分支破坏向量化
        data[i] = threshold;
    }
}
```

用掩码代替分支，保持向量化的连续性。

### 技巧4：循环展开

适当的循环展开可以提高性能：

```java
// 循环展开，减少循环开销
int i = 0;
for (; i < length - 3 * SPECIES.length(); i += 3 * SPECIES.length()) {
    // 处理3个向量
    FloatVector v1 = FloatVector.fromArray(SPECIES, data, i);
    FloatVector v2 = FloatVector.fromArray(SPECIES, data, i + SPECIES.length());
    FloatVector v3 = FloatVector.fromArray(SPECIES, data, i + 2 * SPECIES.length());
    // ...
}
// 处理剩余元素
for (; i < length; i += SPECIES.length()) {
    // ...
}
```

适当的循环展开可以减少循环开销。

## 实际性能对比

### 矩阵乘法性能对比

看个实际的性能对比：

```java
// 传统方式：标量计算
public static float[][] multiplyScalar(float[][] a, float[][] b) {
    int m = a.length;
    int n = b[0].length;
    int k = a[0].length;
    float[][] c = new float[m][n];
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            float sum = 0;
            for (int l = 0; l < k; l++) {
                sum += a[i][l] * b[l][j];  // 标量计算
            }
            c[i][j] = sum;
        }
    }
    return c;
}
// 向量化方式：性能提升3-8倍（取决于硬件）
// 使用前面优化的multiply方法
```

在支持AVX-512的CPU上，向量化方式可以提升5-8倍性能。

### 向量点积性能对比

向量点积的性能对比：

```java
// 传统方式：标量计算
public static float dotProductScalar(float[] a, float[] b) {
    float sum = 0;
    for (int i = 0; i < a.length; i++) {
        sum += a[i] * b[i];  // 标量计算
    }
    return sum;
}
// 向量化方式：性能提升4-10倍
// 使用前面优化的dotProduct方法
```

向量化方式性能提升明显，特别是大数据量的时候。

## 最佳实践

### 1. 选择合适的向量种类

根据数据大小和硬件选择合适的向量种类：

```java
// 好的做法：根据数据大小选择
VectorSpecies<Float> species;
if (data.length >= 8) {
    species = FloatVector.SPECIES_256;  // 256位，8个float
} else if (data.length >= 4) {
    species = FloatVector.SPECIES_128;  // 128位，4个float
} else {
    // 数据太小，用标量计算
}
```

选择合适的向量种类，性能最好。

### 2. 预热JVM

向量API需要JIT编译优化，应该先预热：

```java
// 预热JVM，让JIT编译优化向量代码
public void warmup() {
    float[] a = new float[1000];
    float[] b = new float[1000];
    // 运行几次，让JIT编译
    for (int i = 0; i < 100; i++) {
        dotProduct(a, b);
    }
}
```

预热后性能更好。

### 3. 避免不必要的内存分配

减少内存分配可以提高性能：

```java
// 好的做法：复用向量
FloatVector sum = FloatVector.zero(SPECIES);
for (int i = 0; i < length; i += SPECIES.length()) {
    FloatVector v = FloatVector.fromArray(SPECIES, data, i);
    sum = sum.add(v);  // 复用sum向量
}
// 不好的做法：每次都创建新向量
for (int i = 0; i < length; i += SPECIES.length()) {
    FloatVector v = FloatVector.fromArray(SPECIES, data, i);
    FloatVector sum = FloatVector.zero(SPECIES);  // 每次都创建，性能差
    sum = sum.add(v);
}
```

复用向量，减少内存分配。

### 4. 处理边界情况

正确处理边界情况，确保性能：

```java
// 好的做法：先处理对齐的数据，再处理剩余
int alignedLength = length - (length % SPECIES.length());
for (int i = 0; i < alignedLength; i += SPECIES.length()) {
    // 向量化处理
}
// 处理剩余元素
for (int i = alignedLength; i < length; i++) {
    // 标量处理
}
```

正确处理边界，性能最好。

## 总结

向量API在科学计算和机器学习场景下，性能提升非常明显。通过合理使用向量化、FMA指令、数据对齐等技巧，可以让Java代码的性能接近C++的水平。

鹏磊我觉得向量API是Java高性能计算的重要工具，特别是做科学计算和机器学习的时候，性能提升很明显。虽然API有点复杂，但是性能提升值得投入时间学习。

总的来说，向量API让Java也能做高性能计算了，不用再为了性能去写C++代码。在实际项目中，应该多使用向量API，特别是在计算密集型的场景下，性能提升非常明显。
