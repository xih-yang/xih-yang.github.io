# 13、JDK 17 新特性：macOS/AArch64 移植 JEP 391：支持 ARM 架构的 macOS 系统
- 来源：https://ddkk.com/zhuanlan/java/java17/13.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
苹果推出 Apple Silicon（M1、M2 等芯片）后，鹏磊最烦的就是 Java 应用在 ARM 架构的 macOS 上跑不了。以前只能在 x86_64 的 Mac 上跑，现在有了 ARM 版本的 Mac，就得重新编译。JDK 17 的 JEP 391 引入了 macOS/AArch64 移植，让 Java 应用能在 ARM 架构的 macOS 上运行，性能也提升了不少。

macOS/AArch64 移植是 JEP 391 引入的特性，让 JDK 17 支持 ARM 架构的 macOS 系统（Apple Silicon）。这玩意儿对于在 Apple Silicon Mac 上开发 Java 应用特别有用，性能提升明显，而且能充分利用 ARM 架构的优势。现在你可以在 M1、M2 等芯片的 Mac 上直接运行 Java 应用，不需要通过 Rosetta 2 转译。

## 什么是 Apple Silicon

Apple Silicon 是苹果自研的 ARM 架构芯片，包括 M1、M1 Pro、M1 Max、M2、M2 Pro、M2 Max 等。相比 Intel 芯片，Apple Silicon 有以下优势：

1. **性能更好**：单核和多核性能都更好
2. **功耗更低**：电池续航更长
3. **集成更好**：与 macOS 系统集成更好
4. **统一架构**：iOS、iPadOS、macOS 统一架构

```java
// Apple Silicon 的优势
// 1. 性能更好：单核和多核性能都更好
// 2. 功耗更低：电池续航更长
// 3. 集成更好：与 macOS 系统集成更好
// 4. 统一架构：iOS、iPadOS、macOS 统一架构
```

Apple Silicon 性能更好，功耗更低，与 macOS 集成更好。

## 为什么需要 macOS/AArch64 移植

以前 JDK 只支持 x86_64 架构的 macOS，在 Apple Silicon Mac 上运行需要通过 Rosetta 2 转译，有几个问题：

1. **性能损失**：Rosetta 2 转译会有性能损失
2. **兼容性问题**：某些功能可能不兼容
3. **原生体验差**：不能充分利用 ARM 架构的优势

JDK 17 引入了 macOS/AArch64 移植，解决了这些问题。

## 检测系统架构

检测系统架构是使用 macOS/AArch64 移植的第一步：

```java
// 检测系统架构
public class ArchitectureDetection {
    public static void main(String[] args) {
        // 获取操作系统架构
        String osArch = System.getProperty("os.arch");  // 获取架构
        String osName = System.getProperty("os.name");  // 获取操作系统名称
        System.out.println("操作系统: " + osName);  // 输出操作系统
        System.out.println("架构: " + osArch);  // 输出架构
        // 判断是否是 Apple Silicon
        if (osName.toLowerCase().contains("mac") && osArch.equals("aarch64")) {
            System.out.println("这是 Apple Silicon Mac (ARM 架构)");  // Apple Silicon
        } else if (osName.toLowerCase().contains("mac") && osArch.equals("x86_64")) {
            System.out.println("这是 Intel Mac (x86_64 架构)");  // Intel Mac
        } else {
            System.out.println("这是其他平台");  // 其他平台
        }
        // 获取其他系统属性
        System.out.println("Java 版本: " + System.getProperty("java.version"));  // Java 版本
        System.out.println("Java 供应商: " + System.getProperty("java.vendor"));  // Java 供应商
    }
}
```

检测系统架构能帮你了解运行环境，选择合适的代码路径。

## 性能优势

使用原生 ARM 架构后，性能提升明显：

```java
// 性能测试示例
public class PerformanceTest {
    public static void main(String[] args) {
        int iterations = 10_000_000;  // 1000 万次迭代
        // 测试计算性能
        long start = System.nanoTime();  // 开始时间
        long sum = 0;  // 累加和
        for (int i = 0; i < iterations; i++) {
            sum += i * i;  // 计算平方和
        }
        long time = System.nanoTime() - start;  // 计算时间
        System.out.println("计算时间: " + time / 1_000_000 + " ms");  // 输出时间
        System.out.println("结果: " + sum);  // 输出结果
        // 在 Apple Silicon 上，性能通常比 Rosetta 2 转译好 20-30%
    }
}
```

使用原生 ARM 架构后，性能提升明显，特别是在计算密集型任务中。

## 实际应用：原生应用开发

原生应用开发是 macOS/AArch64 移植的典型应用：

```java
import java.awt.*;
import javax.swing.*;
// 原生应用示例
public class NativeApp {
    public static void main(String[] args) {
        // 检测架构
        String osArch = System.getProperty("os.arch");  // 获取架构
        System.out.println("运行架构: " + osArch);  // 输出架构
        // 创建 Swing 应用
        JFrame frame = new JFrame("原生应用");  // 创建窗口
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);  // 设置关闭操作
        frame.setSize(800, 600);  // 设置大小
        // 创建标签，显示架构信息
        JLabel label = new JLabel("运行架构: " + osArch, JLabel.CENTER);  // 创建标签
        label.setFont(new Font("Arial", Font.BOLD, 24));  // 设置字体
        frame.add(label);  // 添加标签
        frame.setVisible(true);  // 显示窗口
        // 在 Apple Silicon 上，应用会以原生 ARM 架构运行
        // 性能更好，体验更流畅
    }
}
```

原生应用开发用 macOS/AArch64 移植，性能更好，体验更流畅。

## 实际应用：高性能计算

高性能计算也是 macOS/AArch64 移植的典型应用：

```java
import java.util.*;
import java.util.concurrent.*;
// 高性能计算示例
public class HighPerformanceComputing {
    public static void main(String[] args) {
        int size = 10_000_000;  // 1000 万元素
        int[] array = new int[size];  // 数组
        // 初始化数组
        Random random = new Random();  // 随机数生成器
        for (int i = 0; i < size; i++) {
            array[i] = random.nextInt(1000);  // 随机数
        }
        // 并行排序
        long start = System.nanoTime();  // 开始时间
        Arrays.parallelSort(array);  // 并行排序
        long time = System.nanoTime() - start;  // 计算时间
        System.out.println("排序时间: " + time / 1_000_000 + " ms");  // 输出时间
        // 在 Apple Silicon 上，并行计算性能提升明显
        // 特别是多核任务，性能提升更明显
    }
}
```

高性能计算用 macOS/AArch64 移植，性能提升明显，特别是多核任务。

## 实际应用：机器学习

机器学习也是 macOS/AArch64 移植的典型应用：

```java
import java.util.*;
// 机器学习示例（简化版）
public class MachineLearning {
    // 简单的线性回归
    public static double[] linearRegression(double[] x, double[] y) {
        int n = x.length;  // 数据点数量
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;  // 累加变量
        // 计算统计量
        for (int i = 0; i < n; i++) {
            sumX += x[i];  // 累加 X
            sumY += y[i];  // 累加 Y
            sumXY += x[i] * y[i];  // 累加 XY
            sumX2 += x[i] * x[i];  // 累加 X²
        }
        // 计算斜率和截距
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);  // 斜率
        double intercept = (sumY - slope * sumX) / n;  // 截距
        return new double[]{slope, intercept};  // 返回结果
    }
    public static void main(String[] args) {
        // 生成测试数据
        int n = 1000;  // 数据点数量
        double[] x = new double[n];  // X 数据
        double[] y = new double[n];  // Y 数据
        Random random = new Random();  // 随机数生成器
        for (int i = 0; i < n; i++) {
            x[i] = i;  // X 值
            y[i] = 2 * i + 1 + random.nextGaussian();  // Y 值（带噪声）
        }
        // 执行线性回归
        long start = System.nanoTime();  // 开始时间
        double[] result = linearRegression(x, y);  // 线性回归
        long time = System.nanoTime() - start;  // 计算时间
        System.out.println("斜率: " + result[0]);  // 输出斜率
        System.out.println("截距: " + result[1]);  // 输出截距
        System.out.println("计算时间: " + time / 1_000 + " 微秒");  // 输出时间
        // 在 Apple Silicon 上，机器学习计算性能提升明显
        // 特别是矩阵运算，性能提升更明显
    }
}
```

机器学习用 macOS/AArch64 移植，性能提升明显，特别是矩阵运算。

## 外部函数和内存 API 支持

macOS/AArch64 移植还支持外部函数和内存 API：

```java
import jdk.incubator.foreign.*;
// 外部函数和内存 API 示例（macOS AArch64）
public class ForeignFunctionExample {
    public static void main(String[] args) {
        // 在 macOS AArch64 上，外部函数和内存 API 完全支持
        // 可以调用本地 C 函数，性能很好
        try (ResourceScope scope = ResourceScope.newConfinedScope()) {
            // 分配内存
            MemorySegment segment = MemorySegment.allocateNative(100, scope);  // 分配 100 字节
            // 使用内存
            segment.set(ValueLayout.JAVA_INT, 0, 42);  // 写入数据
            int value = segment.get(ValueLayout.JAVA_INT, 0);  // 读取数据
            System.out.println("值: " + value);  // 输出: 值: 42
            // 在 macOS AArch64 上，外部函数和内存 API 性能很好
            // 可以充分利用 ARM 架构的优势
        }
    }
}
```

macOS/AArch64 移植支持外部函数和内存 API，可以调用本地 C 函数，性能很好。

## 注意事项

### 注意事项一：仅限 macOS

macOS/AArch64 移植仅限 macOS 平台：

```java
// 检查平台
public class PlatformCheck {
    public static void main(String[] args) {
        String osName = System.getProperty("os.name");  // 获取操作系统名称
        String osArch = System.getProperty("os.arch");  // 获取架构
        if (osName.toLowerCase().contains("mac") && osArch.equals("aarch64")) {
            System.out.println("支持 macOS/AArch64");  // macOS AArch64 支持
        } else {
            System.out.println("不支持 macOS/AArch64");  // 其他平台不支持
        }
    }
}
```

macOS/AArch64 移植仅限 macOS 平台，其他平台不支持。

### 注意事项二：需要 JDK 17+

macOS/AArch64 移植需要 JDK 17 或更高版本：

```java
// 检查 Java 版本
public class VersionCheck {
    public static void main(String[] args) {
        String javaVersion = System.getProperty("java.version");  // 获取 Java 版本
        System.out.println("Java 版本: " + javaVersion);  // 输出版本
        // 解析版本号
        int majorVersion = Integer.parseInt(javaVersion.split("\\.")[0]);  // 主版本号
        if (majorVersion >= 17) {
            System.out.println("支持 macOS/AArch64");  // JDK 17+ 支持
        } else {
            System.out.println("需要 JDK 17 或更高版本");  // 需要升级
        }
    }
}
```

macOS/AArch64 移植需要 JDK 17 或更高版本。

### 注意事项三：二进制兼容性

macOS/AArch64 移植与 x86_64 版本二进制不兼容：

```java
// 二进制兼容性
// macOS/AArch64 版本的 Java 应用不能直接在 x86_64 Mac 上运行
// 反之亦然
// 需要为不同架构编译不同的版本
```

macOS/AArch64 移植与 x86_64 版本二进制不兼容，需要为不同架构编译不同的版本。

## 最佳实践

### 最佳实践一：检测架构

检测架构能帮你选择合适的代码路径：

```java
// 检测架构
String osArch = System.getProperty("os.arch");  // 获取架构
if (osArch.equals("aarch64")) {
    // Apple Silicon 特定代码
} else if (osArch.equals("x86_64")) {
    // Intel Mac 特定代码
}
```

检测架构能帮你选择合适的代码路径。

### 最佳实践二：使用原生库

使用原生库能提升性能：

```java
// 使用原生库
// 在 macOS AArch64 上，使用原生 ARM 库性能更好
// 避免使用 x86_64 库，会有性能损失
```

使用原生库能提升性能，避免使用 x86_64 库。

### 最佳实践三：性能测试

性能测试能帮你了解性能提升：

```java
// 性能测试
// 在 Apple Silicon 上测试性能
// 与 Rosetta 2 转译版本对比
// 了解性能提升情况
```

性能测试能帮你了解性能提升，与 Rosetta 2 转译版本对比。

## 总结

macOS/AArch64 移植是 JDK 17 的一个重要特性，让 Java 应用能在 ARM 架构的 macOS 系统上运行，性能提升明显，而且能充分利用 ARM 架构的优势。这玩意儿对于在 Apple Silicon Mac 上开发 Java 应用特别有用，性能提升明显。

虽然仅限 macOS 平台，需要 JDK 17+，但与 x86_64 版本二进制不兼容。建议在 Apple Silicon Mac 上使用 JDK 17，享受原生 ARM 架构带来的性能提升。下一篇文章咱就聊聊强封装 JDK 内部 API，看看怎么提升安全性和模块化。兄弟们有啥问题随时问，鹏磊会尽量解答。
