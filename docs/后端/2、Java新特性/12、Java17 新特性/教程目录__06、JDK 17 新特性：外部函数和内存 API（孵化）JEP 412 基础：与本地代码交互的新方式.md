# 06、JDK 17 新特性：外部函数和内存 API（孵化）JEP 412 基础：与本地代码交互的新方式
- 来源：https://ddkk.com/zhuanlan/java/java17/6.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
以前在 Java 里调用 C/C++ 代码，鹏磊最烦的就是 JNI 那套东西。写个 native 方法，还得写 C 代码做桥接，编译成动态库，配置路径，麻烦得要死。JDK 17 的外部函数和内存 API（Foreign Function & Memory API）终于解决了这个问题，让你能直接在 Java 里调用本地函数，操作外部内存，代码简洁多了，安全性也更高。

外部函数和内存 API 是 JEP 412 引入的孵化特性，属于 Project Panama 的一部分。这玩意儿让你能安全高效地调用外部函数和操作外部内存，不用再写 JNI 那套繁琐的代码了。虽然还在孵化阶段，但已经能解决很多实际问题了，特别是需要调用系统 API 或者 C 库的场景。

## 为什么需要外部函数和内存 API

以前用 JNI 调用本地代码，得这么干：

1. 在 Java 里声明 native 方法
2. 用 javah 生成 C 头文件
3. 写 C 代码实现桥接
4. 编译成动态库（.so 或 .dll）
5. 配置库路径
6. 在 Java 里加载库

这一套流程下来，没个半天搞不定，还容易出错。外部函数和内存 API 直接在 Java 里就能调用本地函数，不用写 C 代码，也不用编译动态库，方便多了。

## 基础概念

外部函数和内存 API 主要包含这几个核心类：

- **MemorySegment**：内存段，表示一块连续的内存区域
- **MemoryAddress**：内存地址，指向内存中的某个位置
- **Linker**：链接器，用于调用本地函数
- **FunctionDescriptor**：函数描述符，描述 C 函数的签名
- **ValueLayout**：值布局，描述数据类型在内存中的布局

## 启用预览特性

外部函数和内存 API 是孵化特性，需要启用预览特性：

```bash
# 编译时启用预览特性
javac --enable-preview --release 17 Main.java
# 运行时启用预览特性
java --enable-preview Main
```

或者在模块信息里声明：

```java
module my.module {
    requires jdk.incubator.foreign;  // 需要 incubator 模块
}
```

## 分配和操作内存

先看看怎么分配和操作外部内存：

```java
import jdk.incubator.foreign.*;
// 分配外部内存
try (ResourceScope scope = ResourceScope.newConfinedScope()) {
    // 分配 100 字节的内存
    MemorySegment segment = MemorySegment.allocateNative(100, scope);
    // 写入数据
    segment.set(ValueLayout.JAVA_INT, 0, 42);  // 在偏移 0 处写入 int 值 42
    segment.set(ValueLayout.JAVA_INT, 4, 100);  // 在偏移 4 处写入 int 值 100
    // 读取数据
    int value1 = segment.get(ValueLayout.JAVA_INT, 0);  // 从偏移 0 读取 int 值
    int value2 = segment.get(ValueLayout.JAVA_INT, 4);  // 从偏移 4 读取 int 值
    System.out.println("值1: " + value1);  // 输出: 值1: 42
    System.out.println("值2: " + value2);  // 输出: 值2: 100
}
// scope 关闭时自动释放内存，不用担心内存泄漏
```

看，用 `ResourceScope` 管理内存生命周期，关闭 scope 时自动释放内存，不用担心内存泄漏。

## 调用 C 函数

调用 C 函数是外部函数 API 的核心功能：

```java
import jdk.incubator.foreign.*;
import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodType;
// 获取系统链接器
Linker linker = Linker.nativeLinker();
// 查找 C 库中的函数（比如 libc 的 strlen）
SymbolLookup stdlib = SymbolLookup.loaderLookup();  // 查找系统库
MemoryAddress strlenAddr = stdlib.lookup("strlen").orElseThrow();  // 查找 strlen 函数地址
// 定义函数描述符：strlen(const char*) -> size_t
FunctionDescriptor strlenSig = FunctionDescriptor.of(
    ValueLayout.JAVA_LONG,  // 返回值类型：size_t 是 long
    ValueLayout.ADDRESS      // 参数类型：const char* 是地址
);
// 创建方法句柄
MethodHandle strlen = linker.downcallHandle(strlenAddr, strlenSig);  // 创建调用句柄
// 调用函数
try (ResourceScope scope = ResourceScope.newConfinedScope()) {
    // 分配内存并写入字符串
    MemorySegment str = MemorySegment.allocateNative(10, scope);  // 分配 10 字节
    str.setUtf8String(0, "Hello");  // 写入字符串 "Hello"
    // 调用 strlen
    long length = (long) strlen.invoke(str.address());  // 调用 strlen 函数
    System.out.println("字符串长度: " + length);  // 输出: 字符串长度: 5
}
```

看，直接就能调用 C 函数，不用写 JNI 代码，也不用编译动态库。

## 处理字符串

处理字符串是常见需求，外部函数 API 提供了便捷方法：

```java
import jdk.incubator.foreign.*;
try (ResourceScope scope = ResourceScope.newConfinedScope()) {
    // 分配内存并写入字符串
    MemorySegment str = MemorySegment.allocateNative(20, scope);  // 分配 20 字节
    str.setUtf8String(0, "Hello, World!");  // 写入 UTF-8 字符串
    // 读取字符串
    String result = str.getUtf8String(0);  // 从偏移 0 读取字符串
    System.out.println("字符串: " + result);  // 输出: 字符串: Hello, World!
    // 也可以手动处理
    byte[] bytes = "Hello".getBytes();  // 转换为字节数组
    MemorySegment segment = MemorySegment.allocateNative(bytes.length, scope);  // 分配内存
    MemorySegment.copy(bytes, 0, segment, ValueLayout.JAVA_BYTE, 0, bytes.length);  // 复制字节
}
```

字符串处理很简单，`setUtf8String` 和 `getUtf8String` 就能搞定。

## 处理数组

处理数组也很方便：

```java
import jdk.incubator.foreign.*;
try (ResourceScope scope = ResourceScope.newConfinedScope()) {
    // 分配数组内存（10 个 int）
    int[] array = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};  // Java 数组
    MemorySegment segment = MemorySegment.allocateNative(
        array.length * 4,  // 每个 int 占 4 字节
        scope
    );
    // 写入数组
    for (int i = 0; i < array.length; i++) {
        segment.set(ValueLayout.JAVA_INT, i * 4, array[i]);  // 写入每个元素
    }
    // 读取数组
    int[] result = new int[array.length];  // 创建结果数组
    for (int i = 0; i < array.length; i++) {
        result[i] = segment.get(ValueLayout.JAVA_INT, i * 4);  // 读取每个元素
    }
    // 打印结果
    for (int value : result) {
        System.out.print(value + " ");  // 输出: 1 2 3 4 5 6 7 8 9 10
    }
}
```

数组处理就是循环读写，注意偏移量计算就行。

## 调用系统 API

调用系统 API 是外部函数 API 的典型应用：

```java
import jdk.incubator.foreign.*;
import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodType;
// 获取系统链接器
Linker linker = Linker.nativeLinker();
// 查找系统库中的函数
SymbolLookup systemLookup = SymbolLookup.loaderLookup();  // 查找系统库
// 调用 time 函数：time_t time(time_t*)
MemoryAddress timeAddr = systemLookup.lookup("time").orElseThrow();  // 查找 time 函数
FunctionDescriptor timeSig = FunctionDescriptor.of(
    ValueLayout.JAVA_LONG,  // 返回值：time_t 是 long
    ValueLayout.ADDRESS     // 参数：time_t* 是地址（可以为 null）
);
MethodHandle time = linker.downcallHandle(timeAddr, timeSig);  // 创建调用句柄
// 调用 time 函数
try (ResourceScope scope = ResourceScope.newConfinedScope()) {
    long currentTime = (long) time.invoke(MemoryAddress.NULL);  // 传入 null 指针
    System.out.println("当前时间戳: " + currentTime);  // 输出当前时间戳
}
```

看，直接就能调用系统 API，不用写 JNI 代码。

## 内存布局

理解内存布局很重要，不同类型的值在内存中的布局不同：

```java
import jdk.incubator.foreign.*;
// 基本类型的布局
ValueLayout.OfInt intLayout = ValueLayout.JAVA_INT;  // int 类型，4 字节
ValueLayout.OfLong longLayout = ValueLayout.JAVA_LONG;  // long 类型，8 字节
ValueLayout.OfDouble doubleLayout = ValueLayout.JAVA_DOUBLE;  // double 类型，8 字节
ValueLayout.OfAddress addressLayout = ValueLayout.ADDRESS;  // 地址类型，平台相关
// 使用布局
try (ResourceScope scope = ResourceScope.newConfinedScope()) {
    MemorySegment segment = MemorySegment.allocateNative(16, scope);  // 分配 16 字节
    // 写入不同类型的数据
    segment.set(intLayout, 0, 42);  // 偏移 0，写入 int
    segment.set(longLayout, 4, 100L);  // 偏移 4，写入 long
    segment.set(doubleLayout, 12, 3.14);  // 偏移 12，写入 double
    // 读取数据
    int intValue = segment.get(intLayout, 0);  // 读取 int
    long longValue = segment.get(longLayout, 4);  // 读取 long
    double doubleValue = segment.get(doubleLayout, 12);  // 读取 double
    System.out.println("int: " + intValue);  // 输出: int: 42
    System.out.println("long: " + longValue);  // 输出: long: 100
    System.out.println("double: " + doubleValue);  // 输出: double: 3.14
}
```

注意偏移量，不同数据类型占用的字节数不同。

## 实际应用：调用数学库

调用数学库是常见需求：

```java
import jdk.incubator.foreign.*;
import java.lang.invoke.MethodHandle;
// 获取系统链接器
Linker linker = Linker.nativeLinker();
// 查找数学库中的函数（比如 sin）
SymbolLookup mathLookup = SymbolLookup.loaderLookup();  // 查找系统库
MemoryAddress sinAddr = mathLookup.lookup("sin").orElseThrow();  // 查找 sin 函数
// 定义函数描述符：double sin(double)
FunctionDescriptor sinSig = FunctionDescriptor.of(
    ValueLayout.JAVA_DOUBLE,  // 返回值：double
    ValueLayout.JAVA_DOUBLE   // 参数：double
);
MethodHandle sin = linker.downcallHandle(sinAddr, sinSig);  // 创建调用句柄
// 调用 sin 函数
double result = (double) sin.invoke(Math.PI / 2);  // 计算 sin(π/2)
System.out.println("sin(π/2) = " + result);  // 输出: sin(π/2) = 1.0
```

调用数学库很简单，定义好函数描述符就能调用。

## 注意事项和最佳实践

### 注意事项

1. **孵化 API**：外部函数和内存 API 还在孵化阶段，API 可能会变化，不建议在生产环境使用。
2. **内存管理**：必须用 `ResourceScope` 管理内存，关闭 scope 时自动释放，避免内存泄漏。
3. **线程安全**：`ResourceScope` 有线程限制，`newConfinedScope()` 创建的 scope 只能在创建线程使用。
4. **平台差异**：不同平台的内存布局可能不同，要注意对齐和字节序。

### 最佳实践

1. **使用 try-with-resources**：用 try-with-resources 管理 ResourceScope，确保内存释放。
2. **检查函数地址**：调用函数前检查地址是否存在，避免空指针异常。
3. **正确设置函数描述符**：函数描述符必须和 C 函数签名匹配，否则会出错。
4. **处理错误**：调用本地函数可能失败，要做好错误处理。
5. **文档说明**：在代码注释中说明调用的 C 函数和参数含义，帮助其他开发者理解。

## 总结

外部函数和内存 API 是 JDK 17 的一个重磅特性，让你能直接在 Java 里调用本地函数，操作外部内存，不用再写 JNI 那套繁琐的代码了。虽然还在孵化阶段，但已经能解决很多实际问题了。

建议在新项目里试试，特别是需要调用系统 API 或者 C 库的场景。下一篇文章咱就聊聊内存管理和性能优化，看看怎么更高效地使用这个 API。兄弟们有啥问题随时问，鹏磊会尽量解答。
