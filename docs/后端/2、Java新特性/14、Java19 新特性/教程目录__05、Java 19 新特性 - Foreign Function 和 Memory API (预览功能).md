# 05、Java 19 新特性 - Foreign Function 和 Memory API (预览功能)
- 来源：https://ddkk.com/zhuanlan/java/java19/5.html
- 分类：Java 19 新特性
- 分组：教程目录
在[Project Panama][]中，取代繁琐、易出错、速度慢的 Java 本地接口（JNI）的工作已经进行了很长时间。

在Java 14 和 Java 16 中已经引入了 "外来内存访问 API "和 “外来链接器 API”–最初都是单独处于孵化阶段。在 Java 17 中，这些 API 被合并为 “Foreign Function & Memory API”（FFM API），直到 Java 18，它一直处于孵化阶段。

在Java 19 中，[JDK Enhancement Proposal 424][]最终将新的 API 提升到了预览阶段，

FFMAPI 可以直接从 Java 访问本地内存（即 Java 堆外的内存）和访问本地代码（如 C 库）。

下面是一个简单的例子，它在堆外内存中存储一个字符串，并对其调用 C 语言标准库的 "strlen "函数。

```java
package git.snippets.jdk19;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.SymbolLookup;
import java.lang.invoke.MethodHandle;
import static java.lang.foreign.SegmentAllocator.implicitAllocator;
import static java.lang.foreign.ValueLayout.ADDRESS;
import static java.lang.foreign.ValueLayout.JAVA_LONG;
public class FFMTest {
    public static void main(String[] args) throws Throwable {
        // 1. Get a lookup object for commonly used libraries
        SymbolLookup stdlib = Linker.nativeLinker().defaultLookup();
        // 2. Get a handle to the "strlen" function in the C standard library
        MethodHandle strlen = Linker.nativeLinker().downcallHandle(
                stdlib.lookup("strlen").orElseThrow(),
                FunctionDescriptor.of(JAVA_LONG, ADDRESS));
        // 3. Convert Java String to C string and store it in off-heap memory
        MemorySegment str = implicitAllocator().allocateUtf8String("Happy Coding!");
        // 4. Invoke the foreign function
        long len = (long) strlen.invoke(str);
        System.out.println("len = " + len);
    }
}
```
