# 05、JDK 23 新特性：向量 API（JEP 469）：高性能数值计算的向量化编程指南
- 来源：https://ddkk.com/zhuanlan/java/java23/5.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
做数值计算的时候，最头疼的就是性能问题了。CPU的SIMD指令可以同时处理多个数据，但是Java以前很难直接用上这些指令。现在JDK 23的向量API（第八次孵化）终于提供了标准化的方式来做向量化计算，性能能提升好几倍。

鹏磊我之前做科学计算的时候，为了性能都得上C++，现在Java也有向量API了，以后做高性能计算就方便多了。今天咱就聊聊这个向量API，看看怎么用它来提升数值计算的性能。

## 向量API的核心概念

向量API提供了表达向量计算的标准方式，可以在运行时编译为最优的向量指令。向量化就是把多个数据打包在一起，用一条指令同时处理，这样可以充分利用CPU的SIMD（Single Instruction Multiple Data）能力。

比如要计算两个数组的和，传统方式是循环一个个加，向量化就是一次处理4个、8个或者更多个元素，性能自然就上去了。现代CPU都支持SIMD，像AVX2、AVX-512这些，向量API能让Java代码充分利用这些指令。

## 基础用法

### 创建向量

首先得导入向量API的包，然后创建向量：

```java
import jdk.incubator.vector.*;
// 选择向量种类，比如256位的int向量
VectorSpecies<Integer> species = IntVector.SPECIES_256;
// 创建向量，从数组加载数据
int[] data = {1, 2, 3, 4, 5, 6, 7, 8};
IntVector vector = IntVector.fromArray(species, data, 0);  // 从索引0开始加载
```

向量种类决定了向量的宽度，也就是一次能处理多少个元素。`SPECIES_256`表示256位，对于int类型（32位）来说，就是一次处理8个元素。

### 向量运算

向量支持各种运算操作，比如加法、乘法、减法等：

```java
int[] a = {1, 2, 3, 4, 5, 6, 7, 8};
int[] b = {2, 3, 4, 5, 6, 7, 8, 9};
int[] c = new int[8];
VectorSpecies<Integer> species = IntVector.SPECIES_256;
// 创建两个向量
IntVector va = IntVector.fromArray(species, a, 0);
IntVector vb = IntVector.fromArray(species, b, 0);
// 向量加法
IntVector vc = va.add(vb);  // 对应位置相加
// 把结果存回数组
vc.intoArray(c, 0);
// c = {3, 5, 7, 9, 11, 13, 15, 17}
```

### 向量乘法

向量乘法也很简单：

```java
IntVector va = IntVector.fromArray(species, a, 0);
IntVector vb = IntVector.fromArray(species, b, 0);
// 向量乘法
IntVector vc = va.mul(vb);  // 对应位置相乘
vc.intoArray(c, 0);
```

### 向量混合运算

可以进行更复杂的运算：

```java
// 先加再乘
IntVector vc = va.add(vb).mul(2);  // (a + b) * 2
// 混合运算
IntVector vd = va.mul(vb).add(va);  // a * b + a
```

## 实际应用场景

### 数组求和

传统的数组求和是循环一个个加，用向量API可以一次处理多个：

```java
public int sumArray(int[] array) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;
    int length = array.length;
    int i = 0;
    IntVector sumVector = IntVector.zero(species);  // 初始化为0的向量
    // 向量化处理，每次处理多个元素
    for (; i < length - (length % species.length()); i += species.length()) {
        IntVector v = IntVector.fromArray(species, array, i);
        sumVector = sumVector.add(v);  // 累加
    }
    // 计算向量内元素的和
    int sum = sumVector.reduceLanes(VectorOperators.ADD);
    // 处理剩余的元素
    for (; i < length; i++) {
        sum += array[i];
    }
    return sum;
}
```

### 数组点积

两个数组的点积也可以用向量API优化：

```java
public int dotProduct(int[] a, int[] b) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;
    int length = Math.min(a.length, b.length);
    int i = 0;
    IntVector sumVector = IntVector.zero(species);
    // 向量化处理
    for (; i < length - (length % species.length()); i += species.length()) {
        IntVector va = IntVector.fromArray(species, a, i);
        IntVector vb = IntVector.fromArray(species, b, i);
        sumVector = sumVector.add(va.mul(vb));  // a[i] * b[i] 然后累加
    }
    // 计算总和
    int sum = sumVector.reduceLanes(VectorOperators.ADD);
    // 处理剩余元素
    for (; i < length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}
```

### 数组过滤

向量API还可以用来做过滤操作，比如找出大于某个值的元素：

```java
public int[] filterGreaterThan(int[] array, int threshold) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;
    int[] result = new int[array.length];
    int resultIndex = 0;
    int i = 0;
    IntVector thresholdVector = IntVector.broadcast(species, threshold);  // 广播阈值
    // 向量化处理
    for (; i < array.length - (array.length % species.length()); i += species.length()) {
        IntVector v = IntVector.fromArray(species, array, i);
        VectorMask<Integer> mask = v.compare(VectorOperators.GT, thresholdVector);  // 大于阈值的掩码
        // 提取满足条件的元素
        IntVector filtered = v.filter(mask);
        int filteredCount = mask.trueCount();  // 统计满足条件的数量
        // 复制到结果数组
        filtered.intoArray(result, resultIndex);
        resultIndex += filteredCount;
    }
    // 处理剩余元素
    for (; i < array.length; i++) {
        if (array[i] > threshold) {
            result[resultIndex++] = array[i];
        }
    }
    // 返回正确大小的数组
    return Arrays.copyOf(result, resultIndex);
}
```

### 矩阵乘法

矩阵乘法是数值计算里的经典操作，向量API能大幅提升性能：

```java
public void matrixMultiply(float[] a, float[] b, float[] c, 
                          int rowsA, int colsA, int colsB) {
    VectorSpecies<Float> species = FloatVector.SPECIES_256;
    for (int i = 0; i < rowsA; i++) {
        for (int j = 0; j < colsB; j += species.length()) {
            FloatVector sum = FloatVector.zero(species);  // 累加向量
            for (int k = 0; k < colsA; k++) {
                // 加载a[i][k]
                float aValue = a[i * colsA + k];
                // 加载b[k][j...j+vectorLength-1]
                FloatVector bVector = FloatVector.fromArray(
                    species, b, k * colsB + j);
                // 广播a值并相乘
                FloatVector aVector = FloatVector.broadcast(species, aValue);
                sum = sum.add(aVector.mul(bVector));  // 累加
            }
            // 存储结果
            sum.intoArray(c, i * colsB + j);
        }
    }
}
```

## 不同数据类型的向量

向量API支持多种数据类型，int、long、float、double都可以用：

```java
// int向量
IntVector.SPECIES_256
// long向量
LongVector.SPECIES_256
// float向量
FloatVector.SPECIES_256
// double向量
DoubleVector.SPECIES_256
```

不同数据类型的向量宽度不一样，比如double是64位，256位向量就只能放4个元素；int是32位，256位向量能放8个元素。

## 性能优化技巧

### 选择合适的向量种类

不同的CPU支持不同的向量宽度，要根据实际情况选择：

```java
// 优先选择最大宽度
VectorSpecies<Integer> species = IntVector.SPECIES_PREFERRED;
// 或者根据CPU特性选择
if (IntVector.SPECIES_512.vectorByteSize() > 0) {
    species = IntVector.SPECIES_512;  // 支持512位就用512位
} else if (IntVector.SPECIES_256.vectorByteSize() > 0) {
    species = IntVector.SPECIES_256;  // 支持256位就用256位
} else {
    species = IntVector.SPECIES_128;  // 否则用128位
}
```

### 处理数组边界

向量化的时候要注意处理数组长度不是向量宽度的倍数的情况：

```java
public void processArray(int[] array) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;
    int vectorLength = species.length();
    int i = 0;
    // 向量化处理主体部分
    for (; i < array.length - (array.length % vectorLength); i += vectorLength) {
        IntVector v = IntVector.fromArray(species, array, i);
        // 处理向量
        IntVector result = v.mul(2);
        result.intoArray(array, i);
    }
    // 处理剩余元素（标量处理）
    for (; i < array.length; i++) {
        array[i] *= 2;
    }
}
```

### 减少内存分配

向量操作要尽量避免不必要的内存分配：

```java
// 好的做法：重用向量对象
IntVector sum = IntVector.zero(species);
for (int i = 0; i < array.length; i += species.length()) {
    IntVector v = IntVector.fromArray(species, array, i);
    sum = sum.add(v);  // 重用sum向量
}
// 不好的做法：每次都创建新向量（虽然编译器会优化，但显式重用更清晰）
```

### 数据对齐

数据对齐能提升性能，尽量让数组在内存中对齐：

```java
// 创建对齐的数组
int[] alignedArray = new int[array.length + vectorLength];
System.arraycopy(array, 0, alignedArray, 0, array.length);
// 从对齐的位置开始处理
IntVector v = IntVector.fromArray(species, alignedArray, 0);
```

## 与标量代码的性能对比

看个简单的性能对比，计算数组元素平方和：

```java
// 标量版本
public long sumSquaresScalar(int[] array) {
    long sum = 0;
    for (int value : array) {
        sum += (long) value * value;
    }
    return sum;
}
// 向量化版本
public long sumSquaresVectorized(int[] array) {
    VectorSpecies<Integer> species = IntVector.SPECIES_256;
    int length = array.length;
    int i = 0;
    LongVector sumVector = LongVector.zero(LongVector.SPECIES_256);
    // 向量化处理
    for (; i < length - (length % species.length()); i += species.length()) {
        IntVector v = IntVector.fromArray(species, array, i);
        LongVector squares = v.mul(v).castShape(LongVector.SPECIES_256, 0);  // 转换为long并平方
        sumVector = sumVector.add(squares);
    }
    long sum = sumVector.reduceLanes(VectorOperators.ADD);
    // 处理剩余元素
    for (; i < length; i++) {
        sum += (long) array[i] * array[i];
    }
    return sum;
}
```

在大数组上，向量化版本通常能快3-5倍，具体取决于CPU和数据类型。

## 注意事项

### 孵化API

向量API还是孵化状态，包名是`jdk.incubator.vector`，API可能会变化。使用的时候需要加`--add-modules jdk.incubator.vector`参数：

```bash
javac --add-modules jdk.incubator.vector MyClass.java
java --add-modules jdk.incubator.vector MyClass
```

### CPU支持

向量API的性能提升依赖于CPU的SIMD指令支持。老CPU可能不支持某些向量宽度，需要检查：

```java
// 检查向量宽度是否支持
if (IntVector.SPECIES_256.vectorByteSize() == 0) {
    // 不支持256位向量，使用128位或标量代码
}
```

### 数据大小

向量化在小数组上可能没有优势，甚至可能更慢，因为有向量化开销。通常数组长度大于100的时候，向量化才有明显优势。

## 总结

向量API让Java也能做高性能的数值计算了，通过向量化可以充分利用CPU的SIMD能力，性能能提升好几倍。虽然还是孵化状态，但是方向是对的，未来应该会稳定下来。

对于需要做大量数值计算的场景，比如科学计算、机器学习、图像处理这些，向量API很有价值。虽然API用起来稍微复杂点，但是性能提升很明显，值得学习使用。

总的来说，向量API是Java高性能计算的重要一步，让Java在数值计算领域更有竞争力了。兄弟们如果遇到性能瓶颈，可以试试向量API，看看能不能解决问题。不过要注意，向量API对CPU有要求，老CPU可能用不了。
