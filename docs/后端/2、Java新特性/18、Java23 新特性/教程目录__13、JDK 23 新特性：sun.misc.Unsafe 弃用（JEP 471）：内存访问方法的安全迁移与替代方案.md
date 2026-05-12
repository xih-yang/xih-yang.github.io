# 13、JDK 23 新特性：sun.misc.Unsafe 弃用（JEP 471）：内存访问方法的安全迁移与替代方案
- 来源：https://ddkk.com/zhuanlan/java/java23/13.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
写高性能Java代码的时候，有时候得用sun.misc.Unsafe来直接操作内存，但是Unsafe是不安全的，可能导致JVM崩溃，而且不是标准API，未来版本可能会移除。JDK 23的JEP 471把Unsafe中的内存访问方法标记为弃用了，并且提供了标准API作为替代方案，让开发者可以安全地迁移。

鹏磊我之前做高性能库的时候，用过Unsafe来直接操作内存，性能确实好，但是风险也大，一不小心就崩溃，而且代码可移植性差，不同JDK版本可能行为不一样。现在有了VarHandle和外部函数与内存API这些标准API，可以安全地做内存操作，性能也不差，而且代码更可靠。

JEP 471主要是为了给未来移除Unsafe的内存访问方法做准备，帮助开发者意识到他们的代码什么时候依赖了Unsafe，并且提供了迁移路径。虽然Unsafe类不会完全移除，但是内存访问方法会被弃用并最终移除。

## JEP 471 的背景

### Unsafe的历史和问题

`sun.misc.Unsafe`类在2002年被引入，作为JDK中执行低级操作的一种方式。它的大多数方法用于访问内存，包括JVM的垃圾回收堆内存和堆外内存。

Unsafe的问题：

1. **不安全**：可能导致未定义行为，包括JVM崩溃
2. **非标准API**：不在标准API中，不同JDK版本可能行为不同
3. **难以维护**：代码可读性差，难以理解和维护
4. **安全风险**：绕过Java的安全模型，可能导致安全问题

```java
// 传统方式，用Unsafe直接操作内存
import sun.misc.Unsafe;
public class UnsafeExample {
    private static final Unsafe UNSAFE = getUnsafe();
    private static final long VALUE_OFFSET;
    static {
        try {
            VALUE_OFFSET = UNSAFE.objectFieldOffset(
                UnsafeExample.class.getDeclaredField("value")
            );
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private int value;
    public void setValue(int newValue) {
        UNSAFE.putInt(this, VALUE_OFFSET, newValue);  // 直接操作内存，不安全
    }
    private static Unsafe getUnsafe() {
        // 通过反射获取Unsafe实例，很麻烦
        // ...
    }
}
```

这种方式不安全，而且代码复杂。

### JEP 471的目标

JEP 471的目标：

1. **为未来移除做准备**：为在未来JDK版本中移除Unsafe的内存访问方法做准备
2. **提高意识**：帮助开发者意识到他们的代码何时依赖Unsafe
3. **提供迁移路径**：提供标准API作为替代方案

JEP 471并不打算完全移除Unsafe类，其他不涉及内存访问的方法会被单独弃用和移除。

## 替代方案

### VarHandle API（JEP 193）

VarHandle API在JDK 9中引入，提供了安全高效地操作堆内存的方法，包括对象的字段、类的静态字段和数组的元素。

VarHandle的优势：

1. **类型安全**：编译时类型检查，更安全
2. **标准API**：是标准API，未来版本会继续支持
3. **性能好**：JVM可以优化，性能不输Unsafe
4. **易用**：API设计更友好，代码更易读

```java
// 用VarHandle替代Unsafe
import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;
public class VarHandleExample {
    private static final VarHandle VALUE_HANDLE;
    static {
        try {
            VALUE_HANDLE = MethodHandles.lookup()
                .findVarHandle(VarHandleExample.class, "value", int.class);
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile int value;  // 用volatile支持原子操作
    public void setValue(int newValue) {
        VALUE_HANDLE.set(this, newValue);  // 类型安全，标准API
    }
    public int getValue() {
        return (int) VALUE_HANDLE.get(this);  // 类型安全
    }
    public boolean compareAndSet(int expected, int update) {
        return VALUE_HANDLE.compareAndSet(this, expected, update);  // 原子操作
    }
}
```

VarHandle方式更安全，代码也更清晰。

### 外部函数与内存API（JEP 454）

外部函数与内存API在JDK 22中引入，提供了安全高效地访问堆外内存的方法，有时会与VarHandle协同工作。

外部函数与内存API的优势：

1. **堆外内存访问**：可以安全地访问堆外内存
2. **类型安全**：提供类型安全的内存访问
3. **标准API**：是标准API，未来版本会继续支持
4. **性能好**：性能不输Unsafe

```java
// 用外部函数与内存API替代Unsafe操作堆外内存
import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
public class MemoryAPIExample {
    public void allocateOffHeapMemory() {
        try (Arena arena = Arena.ofConfined()) {
            // 分配堆外内存
            MemorySegment segment = arena.allocate(1024);  // 分配1KB内存
            // 使用VarHandle操作内存
            VarHandle intHandle = segment.varHandle(
                MemoryLayout.sequenceLayout(256, ValueLayout.JAVA_INT)
            );
            // 写入数据
            intHandle.set(0, 42);  // 类型安全的内存操作
            // 读取数据
            int value = (int) intHandle.get(0);
        }  // 自动释放内存
    }
}
```

外部函数与内存API提供了安全的内存管理。

## 迁移指南

### 字段访问迁移

Unsafe的字段访问可以用VarHandle替代：

```java
// 传统方式，用Unsafe访问字段
public class UnsafeFieldAccess {
    private static final Unsafe UNSAFE = getUnsafe();
    private static final long FIELD_OFFSET;
    static {
        try {
            FIELD_OFFSET = UNSAFE.objectFieldOffset(
                UnsafeFieldAccess.class.getDeclaredField("field")
            );
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private int field;
    public void setField(int value) {
        UNSAFE.putInt(this, FIELD_OFFSET, value);  // Unsafe方式
    }
    public int getField() {
        return UNSAFE.getInt(this, FIELD_OFFSET);  // Unsafe方式
    }
}
// 新方式，用VarHandle访问字段
public class VarHandleFieldAccess {
    private static final VarHandle FIELD_HANDLE;
    static {
        try {
            FIELD_HANDLE = MethodHandles.lookup()
                .findVarHandle(VarHandleFieldAccess.class, "field", int.class);
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile int field;  // 用volatile支持原子操作
    public void setField(int value) {
        FIELD_HANDLE.set(this, value);  // VarHandle方式，类型安全
    }
    public int getField() {
        return (int) FIELD_HANDLE.get(this);  // VarHandle方式，类型安全
    }
}
```

VarHandle方式更安全，代码也更清晰。

### 原子操作迁移

Unsafe的原子操作可以用VarHandle替代：

```java
// 传统方式，用Unsafe做原子操作
public class UnsafeAtomicOps {
    private static final Unsafe UNSAFE = getUnsafe();
    private static final long VALUE_OFFSET;
    static {
        try {
            VALUE_OFFSET = UNSAFE.objectFieldOffset(
                UnsafeAtomicOps.class.getDeclaredField("value")
            );
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile int value;
    public boolean compareAndSet(int expected, int update) {
        return UNSAFE.compareAndSwapInt(this, VALUE_OFFSET, expected, update);  // Unsafe方式
    }
    public int getAndAdd(int delta) {
        return UNSAFE.getAndAddInt(this, VALUE_OFFSET, delta);  // Unsafe方式
    }
}
// 新方式，用VarHandle做原子操作
public class VarHandleAtomicOps {
    private static final VarHandle VALUE_HANDLE;
    static {
        try {
            VALUE_HANDLE = MethodHandles.lookup()
                .findVarHandle(VarHandleAtomicOps.class, "value", int.class);
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile int value;
    public boolean compareAndSet(int expected, int update) {
        return VALUE_HANDLE.compareAndSet(this, expected, update);  // VarHandle方式
    }
    public int getAndAdd(int delta) {
        return (int) VALUE_HANDLE.getAndAdd(this, delta);  // VarHandle方式
    }
}
```

VarHandle提供了完整的原子操作支持。

### 堆外内存访问迁移

Unsafe的堆外内存访问可以用外部函数与内存API替代：

```java
// 传统方式，用Unsafe操作堆外内存
public class UnsafeOffHeap {
    private static final Unsafe UNSAFE = getUnsafe();
    private long address;
    private long size;
    public void allocate(long size) {
        this.size = size;
        this.address = UNSAFE.allocateMemory(size);  // Unsafe分配堆外内存
    }
    public void putInt(long offset, int value) {
        UNSAFE.putInt(address + offset, value);  // Unsafe写入
    }
    public int getInt(long offset) {
        return UNSAFE.getInt(address + offset);  // Unsafe读取
    }
    public void free() {
        UNSAFE.freeMemory(address);  // Unsafe释放内存
    }
}
// 新方式，用外部函数与内存API操作堆外内存
import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
public class MemoryAPIOffHeap {
    private final Arena arena;
    private final MemorySegment segment;
    public MemoryAPIOffHeap(long size) {
        this.arena = Arena.ofConfined();
        this.segment = arena.allocate(size);  // 分配堆外内存
    }
    public void putInt(long offset, int value) {
        segment.set(ValueLayout.JAVA_INT, offset, value);  // 类型安全写入
    }
    public int getInt(long offset) {
        return segment.get(ValueLayout.JAVA_INT, offset);  // 类型安全读取
    }
    public void free() {
        arena.close();  // 自动释放内存
    }
}
```

外部函数与内存API提供了安全的内存管理。

### 数组访问迁移

Unsafe的数组访问可以用VarHandle替代：

```java
// 传统方式，用Unsafe访问数组
public class UnsafeArrayAccess {
    private static final Unsafe UNSAFE = getUnsafe();
    private static final int ARRAY_BASE_OFFSET;
    private static final int ARRAY_INDEX_SCALE;
    static {
        ARRAY_BASE_OFFSET = UNSAFE.arrayBaseOffset(int[].class);
        ARRAY_INDEX_SCALE = UNSAFE.arrayIndexScale(int[].class);
    }
    public void setArrayElement(int[] array, int index, int value) {
        long offset = ARRAY_BASE_OFFSET + (long) index * ARRAY_INDEX_SCALE;
        UNSAFE.putInt(array, offset, value);  // Unsafe方式
    }
    public int getArrayElement(int[] array, int index) {
        long offset = ARRAY_BASE_OFFSET + (long) index * ARRAY_INDEX_SCALE;
        return UNSAFE.getInt(array, offset);  // Unsafe方式
    }
}
// 新方式，用VarHandle访问数组
public class VarHandleArrayAccess {
    private static final VarHandle ARRAY_HANDLE;
    static {
        ARRAY_HANDLE = MethodHandles.arrayElementVarHandle(int[].class);
    }
    public void setArrayElement(int[] array, int index, int value) {
        ARRAY_HANDLE.set(array, index, value);  // VarHandle方式，更简单
    }
    public int getArrayElement(int[] array, int index) {
        return (int) ARRAY_HANDLE.get(array, index);  // VarHandle方式，更简单
    }
}
```

VarHandle方式更简单，代码也更清晰。

## 实际迁移示例

### 示例1：高性能计数器

```java
// 传统方式，用Unsafe实现高性能计数器
public class UnsafeCounter {
    private static final Unsafe UNSAFE = getUnsafe();
    private static final long VALUE_OFFSET;
    static {
        try {
            VALUE_OFFSET = UNSAFE.objectFieldOffset(
                UnsafeCounter.class.getDeclaredField("value")
            );
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile long value;
    public long increment() {
        return UNSAFE.getAndAddLong(this, VALUE_OFFSET, 1);  // Unsafe方式
    }
    public long get() {
        return value;
    }
}
// 新方式，用VarHandle实现高性能计数器
public class VarHandleCounter {
    private static final VarHandle VALUE_HANDLE;
    static {
        try {
            VALUE_HANDLE = MethodHandles.lookup()
                .findVarHandle(VarHandleCounter.class, "value", long.class);
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile long value;
    public long increment() {
        return (long) VALUE_HANDLE.getAndAdd(this, 1);  // VarHandle方式
    }
    public long get() {
        return value;
    }
}
```

VarHandle方式更安全，性能也不差。

### 示例2：无锁数据结构

```java
// 传统方式，用Unsafe实现无锁栈
public class UnsafeStack<T> {
    private static final Unsafe UNSAFE = getUnsafe();
    private static final long HEAD_OFFSET;
    static {
        try {
            HEAD_OFFSET = UNSAFE.objectFieldOffset(
                UnsafeStack.class.getDeclaredField("head")
            );
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile Node<T> head;
    public void push(T value) {
        Node<T> newNode = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = head;
            newNode.next = oldHead;
        } while (!UNSAFE.compareAndSwapObject(this, HEAD_OFFSET, oldHead, newNode));  // Unsafe方式
    }
    public T pop() {
        Node<T> oldHead;
        do {
            oldHead = head;
            if (oldHead == null) {
                return null;
            }
        } while (!UNSAFE.compareAndSwapObject(this, HEAD_OFFSET, oldHead, oldHead.next));  // Unsafe方式
        return oldHead.value;
    }
}
// 新方式，用VarHandle实现无锁栈
public class VarHandleStack<T> {
    private static final VarHandle HEAD_HANDLE;
    static {
        try {
            HEAD_HANDLE = MethodHandles.lookup()
                .findVarHandle(VarHandleStack.class, "head", Node.class);
        } catch (Exception e) {
            throw new Error(e);
        }
    }
    private volatile Node<T> head;
    public void push(T value) {
        Node<T> newNode = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = head;
            newNode.next = oldHead;
        } while (!HEAD_HANDLE.compareAndSet(this, oldHead, newNode));  // VarHandle方式
    }
    public T pop() {
        Node<T> oldHead;
        do {
            oldHead = head;
            if (oldHead == null) {
                return null;
            }
        } while (!HEAD_HANDLE.compareAndSet(this, oldHead, oldHead.next));  // VarHandle方式
        return oldHead.value;
    }
}
```

VarHandle方式更安全，代码也更清晰。

## 检测Unsafe使用

### 使用jdeprscan工具

JDK提供了`jdeprscan`工具来扫描代码中使用的已弃用API：

```bash
# 扫描JAR文件中的Unsafe使用
jdeprscan --release 23 myapp.jar
# 扫描类文件
jdeprscan --release 23 com/example/MyClass.class
# 扫描整个目录
jdeprscan --release 23 -cp lib/*.jar target/classes
```

这个工具可以帮助发现代码中对Unsafe的依赖。

### 编译时警告

使用Unsafe的代码在编译时会收到警告：

```bash
# 编译时会有警告
javac -Xlint:deprecation MyClass.java
# 输出示例：
# warning: [deprecation] putInt(Object,long,int) in sun.misc.Unsafe has been deprecated
```

这些警告可以帮助开发者意识到对Unsafe的依赖。

## 迁移时间表

### JDK 23

在JDK 23中，Unsafe的内存访问方法被标记为弃用（deprecated for removal），但还可以使用。

### 未来版本

在未来的JDK版本中（可能是JDK 24或更晚），Unsafe的内存访问方法会被移除。开发者应该尽快迁移到标准API。

### 建议

1. **尽快迁移**：不要等到Unsafe被移除才迁移，尽早迁移更安全
2. **测试充分**：迁移后要充分测试，确保功能正常
3. **性能测试**：验证新API的性能是否满足要求
4. **文档更新**：更新相关文档，说明迁移情况

## 最佳实践

### 1. 优先使用标准API

优先使用VarHandle和外部函数与内存API，避免使用Unsafe：

```java
// 好的做法：使用VarHandle
private static final VarHandle FIELD_HANDLE = ...;
FIELD_HANDLE.set(this, value);
// 不好的做法：使用Unsafe
private static final Unsafe UNSAFE = ...;
UNSAFE.putInt(this, offset, value);
```

### 2. 类型安全

使用VarHandle时，确保类型安全：

```java
// 好的做法：类型安全
private static final VarHandle INT_HANDLE = 
    MethodHandles.lookup().findVarHandle(MyClass.class, "field", int.class);
INT_HANDLE.set(this, 42);  // 类型安全
// 不好的做法：类型不安全
private static final VarHandle HANDLE = ...;
HANDLE.set(this, "wrong type");  // 可能运行时出错
```

### 3. 内存管理

使用外部函数与内存API时，注意内存管理：

```java
// 好的做法：使用try-with-resources自动管理内存
try (Arena arena = Arena.ofConfined()) {
    MemorySegment segment = arena.allocate(1024);
    // 使用内存
}  // 自动释放
// 不好的做法：手动管理内存，容易泄漏
Arena arena = Arena.ofConfined();
MemorySegment segment = arena.allocate(1024);
// 忘记释放内存
```

### 4. 性能测试

迁移后要进行性能测试，确保性能满足要求：

```java
// 性能测试
public void benchmark() {
    long start = System.nanoTime();
    for (int i = 0; i < 1000000; i++) {
        // 执行操作
    }
    long duration = System.nanoTime() - start;
    System.out.println("Duration: " + duration + " ns");
}
```

## 总结

JEP 471弃用sun.misc.Unsafe中的内存访问方法，是为了推动开发者迁移到更安全、更标准的内存访问API。VarHandle和外部函数与内存API提供了完整的替代方案，性能不输Unsafe，而且更安全、更易用。

鹏磊我觉得这个迁移是必要的，虽然Unsafe性能好，但是风险大，而且不是标准API。用VarHandle和外部函数与内存API，代码更安全，未来版本也会继续支持，长期来看更划算。

总的来说，JEP 471是Java平台向更安全、更标准的内存访问API演进的重要一步。开发者应该尽快迁移到标准API，确保应用程序在未来的JDK版本中保持兼容性。
