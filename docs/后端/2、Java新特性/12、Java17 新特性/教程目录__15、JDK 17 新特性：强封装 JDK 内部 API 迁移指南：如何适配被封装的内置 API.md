# 15、JDK 17 新特性：强封装 JDK 内部 API 迁移指南：如何适配被封装的内置 API
- 来源：https://ddkk.com/zhuanlan/java/java17/15.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
升级到 JDK 17 后，鹏磊最烦的就是代码里用了内部 API，编译报错，运行也报错。以前用 `sun.misc.Unsafe`、`com.sun.*` 这些包，现在都被封装了，访问不了。得一个个找替代方案，迁移起来特别麻烦。这篇文章就给你整一个完整的迁移指南，帮你把代码从内部 API 迁移到公开 API。

迁移指南是升级到 JDK 17 的关键步骤，需要识别代码中使用的内部 API，找到公开 API 的替代方案，然后逐步迁移。这玩意儿虽然工作量不小，但能让代码更稳定，兼容性更好。建议先用工具检查依赖，然后制定迁移计划，逐步执行。

## 第一步：检查代码依赖

迁移的第一步是检查代码是否依赖内部 API，可以用 `jdeps` 工具：

```bash
# 使用 jdeps 检查 JDK 内部 API 依赖
jdeps --jdk-internals MyApp.jar
# 输出示例：
# MyApp.jar -> JDK removed internal API
#    com.example.MyClass -> sun.misc.Unsafe
#       JDK internal API (JDK removed internal API)
```

`jdeps` 工具能帮你找出所有依赖内部 API 的地方。

## 第二步：常见内部 API 迁移

### 迁移一：sun.misc.Unsafe

`sun.misc.Unsafe` 是最常用的内部 API，迁移方案：

```java
// 错误：使用 sun.misc.Unsafe（内部 API）
// import sun.misc.Unsafe;  // 无法导入
// 方案一：使用外部函数和内存 API（JDK 17）
import jdk.incubator.foreign.*;
public class UnsafeMigration {
    public static void main(String[] args) {
        // 使用外部函数和内存 API 替代 Unsafe
        try (ResourceScope scope = ResourceScope.newConfinedScope()) {
            // 分配内存
            MemorySegment segment = MemorySegment.allocateNative(100, scope);  // 分配 100 字节
            // 写入数据
            segment.set(ValueLayout.JAVA_INT, 0, 42);  // 写入 int
            segment.set(ValueLayout.JAVA_LONG, 8, 123L);  // 写入 long
            // 读取数据
            int intValue = segment.get(ValueLayout.JAVA_INT, 0);  // 读取 int
            long longValue = segment.get(ValueLayout.JAVA_LONG, 8);  // 读取 long
            System.out.println("int: " + intValue);  // 输出: int: 42
            System.out.println("long: " + longValue);  // 输出: long: 123
        }
    }
}
```

使用外部函数和内存 API 替代 `sun.misc.Unsafe`，功能更强大，也更安全。

### 迁移二：sun.misc.BASE64Encoder

`sun.misc.BASE64Encoder` 已经被 `java.util.Base64` 替代：

```java
// 错误：使用 sun.misc.BASE64Encoder（内部 API）
// import sun.misc.BASE64Encoder;  // 无法导入
// 正确：使用 java.util.Base64（公开 API）
import java.util.Base64;
public class Base64Migration {
    public static void main(String[] args) {
        String text = "Hello, World!";  // 原始文本
        // 编码
        String encoded = Base64.getEncoder().encodeToString(text.getBytes());  // 编码
        System.out.println("编码: " + encoded);  // 输出编码结果
        // 解码
        String decoded = new String(Base64.getDecoder().decode(encoded));  // 解码
        System.out.println("解码: " + decoded);  // 输出解码结果
        // Base64 还支持 URL 和 MIME 编码
        String urlEncoded = Base64.getUrlEncoder().encodeToString(text.getBytes());  // URL 编码
        System.out.println("URL 编码: " + urlEncoded);  // 输出 URL 编码结果
    }
}
```

使用 `java.util.Base64` 替代 `sun.misc.BASE64Encoder`，功能更全，也更标准。

### 迁移三：com.sun.management

`com.sun.management` 包中的某些类已经被封装，需要使用公开 API：

```java
// 错误：直接访问 com.sun.management（可能被封装）
// import com.sun.management.OperatingSystemMXBean;  // 可能无法访问
// 正确：使用公开的 ManagementFactory API
import java.lang.management.*;
public class ManagementMigration {
    public static void main(String[] args) {
        // 使用公开的 ManagementFactory API
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();  // 获取操作系统 Bean
        // 获取系统信息
        String osName = osBean.getName();  // 操作系统名称
        String osVersion = osBean.getVersion();  // 操作系统版本
        int processors = osBean.getAvailableProcessors();  // 可用处理器数
        System.out.println("操作系统: " + osName);  // 输出操作系统
        System.out.println("版本: " + osVersion);  // 输出版本
        System.out.println("处理器: " + processors);  // 输出处理器数
        // 如果需要更详细的信息，可以使用 PlatformManagedObject
        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOsBean = 
                (com.sun.management.OperatingSystemMXBean) osBean;  // 类型转换
            long totalMemory = sunOsBean.getTotalMemorySize();  // 总内存
            System.out.println("总内存: " + totalMemory);  // 输出总内存
        }
    }
}
```

使用公开的 `ManagementFactory` API，兼容性更好。

### 迁移四：反射访问内部类

反射访问内部类也需要迁移：

```java
import java.lang.reflect.*;
// 错误：通过反射访问内部类
public class ReflectionMigration {
    public static void main(String[] args) {
        try {
            // 尝试访问内部类（可能失败）
            Class<?> clazz = Class.forName("java.lang.String$CaseInsensitiveComparator");  // 内部类
            System.out.println("成功访问: " + clazz.getName());  // 可能成功
        } catch (Exception e) {
            System.out.println("访问失败: " + e.getMessage());  // 输出错误信息
        }
        // 正确：使用公开 API
        // String.CASE_INSENSITIVE_ORDER 是公开常量
        java.util.Comparator<String> comparator = String.CASE_INSENSITIVE_ORDER;  // 公开 API
        System.out.println("使用公开 API: " + comparator.getClass().getName());  // 输出类名
        // 使用公开 API 进行字符串比较
        String str1 = "Hello";  // 字符串 1
        String str2 = "hello";  // 字符串 2
        int result = comparator.compare(str1, str2);  // 比较
        System.out.println("比较结果: " + result);  // 输出: 比较结果: 0（相等）
    }
}
```

使用公开 API 替代反射访问，代码更安全。

## 第三步：使用 jdeps 工具

`jdeps` 工具是检查依赖的利器：

```bash
# 检查 JAR 文件的内部 API 依赖
jdeps --jdk-internals MyApp.jar
# 检查类路径上的所有依赖
jdeps --jdk-internals -cp "lib/*" MyApp.jar
# 列出所有模块依赖
jdeps --list-deps MyApp.jar
# 生成依赖图
jdeps -dotoutput deps MyApp.jar
```

`jdeps` 工具能帮你全面了解代码的依赖情况。

## 第四步：临时解决方案（不推荐）

如果暂时无法迁移，可以使用 `--add-exports` 或 `--add-opens`（不推荐）：

```bash
# 使用 --add-exports（不推荐，仅用于测试）
java --add-exports java.base/sun.misc=ALL-UNNAMED MyApp
# 使用 --add-opens（不推荐，仅用于测试）
java --add-opens java.base/sun.misc=ALL-UNNAMED MyApp
# 在编译时使用
javac --add-exports java.base/sun.misc=ALL-UNNAMED MyClass.java
```

这些选项只是临时方案，不应该用于生产环境。

## 第五步：实际迁移案例

### 案例一：内存操作迁移

内存操作从 `sun.misc.Unsafe` 迁移到外部函数和内存 API：

```java
// 旧代码：使用 sun.misc.Unsafe
// import sun.misc.Unsafe;
// 
// public class OldMemoryOps {
//     private static final Unsafe unsafe = Unsafe.getUnsafe();
//     
//     public static void main(String[] args) {
//         long address = unsafe.allocateMemory(100);  // 分配内存
//         unsafe.putInt(address, 42);  // 写入 int
//         int value = unsafe.getInt(address);  // 读取 int
//         unsafe.freeMemory(address);  // 释放内存
//     }
// }
// 新代码：使用外部函数和内存 API
import jdk.incubator.foreign.*;
public class NewMemoryOps {
    public static void main(String[] args) {
        try (ResourceScope scope = ResourceScope.newConfinedScope()) {
            // 分配内存
            MemorySegment segment = MemorySegment.allocateNative(100, scope);  // 分配 100 字节
            // 写入数据
            segment.set(ValueLayout.JAVA_INT, 0, 42);  // 写入 int
            // 读取数据
            int value = segment.get(ValueLayout.JAVA_INT, 0);  // 读取 int
            System.out.println("值: " + value);  // 输出: 值: 42
            // scope 关闭时自动释放内存
        }
    }
}
```

使用外部函数和内存 API，代码更安全，内存管理更可靠。

### 案例二：Base64 编码迁移

Base64 编码从 `sun.misc.BASE64Encoder` 迁移到 `java.util.Base64`：

```java
// 旧代码：使用 sun.misc.BASE64Encoder
// import sun.misc.BASE64Encoder;
// 
// public class OldBase64 {
//     public static void main(String[] args) {
//         BASE64Encoder encoder = new BASE64Encoder();
//         String encoded = encoder.encode("Hello".getBytes());
//         System.out.println(encoded);
//     }
// }
// 新代码：使用 java.util.Base64
import java.util.Base64;
public class NewBase64 {
    public static void main(String[] args) {
        String text = "Hello";  // 原始文本
        // 编码
        String encoded = Base64.getEncoder().encodeToString(text.getBytes());  // 编码
        System.out.println("编码: " + encoded);  // 输出编码结果
        // 解码
        String decoded = new String(Base64.getDecoder().decode(encoded));  // 解码
        System.out.println("解码: " + decoded);  // 输出解码结果
    }
}
```

使用 `java.util.Base64`，代码更简洁，功能更全。

### 案例三：系统属性访问迁移

系统属性访问需要迁移到公开 API：

```java
// 旧代码：可能使用内部 API 访问系统属性
// String value = System.getProperty("sun.boot.class.path");  // 可能无法访问
// 新代码：使用公开 API
public class SystemPropertyMigration {
    public static void main(String[] args) {
        // 使用公开的系统属性
        String javaHome = System.getProperty("java.home");  // Java 主目录
        String javaVersion = System.getProperty("java.version");  // Java 版本
        String osName = System.getProperty("os.name");  // 操作系统名称
        System.out.println("Java 主目录: " + javaHome);  // 输出 Java 主目录
        System.out.println("Java 版本: " + javaVersion);  // 输出 Java 版本
        System.out.println("操作系统: " + osName);  // 输出操作系统
        // 如果需要类路径信息，使用公开 API
        String classPath = System.getProperty("java.class.path");  // 类路径
        System.out.println("类路径: " + classPath);  // 输出类路径
    }
}
```

使用公开的系统属性，兼容性更好。

## 第六步：第三方库迁移

第三方库可能也依赖内部 API，需要更新：

```bash
# 检查第三方库的依赖
jdeps --jdk-internals lib/*.jar
# 更新库版本
# 1. 检查库是否支持 JDK 17
# 2. 更新到最新版本
# 3. 寻找替代方案
```

第三方库也需要迁移，及时更新版本。

## 第七步：测试和验证

迁移后需要充分测试：

```java
// 测试迁移后的代码
public class MigrationTest {
    public static void main(String[] args) {
        // 测试内存操作
        testMemoryOps();  // 测试内存操作
        // 测试 Base64 编码
        testBase64();  // 测试 Base64 编码
        // 测试系统属性
        testSystemProperties();  // 测试系统属性
    }
    private static void testMemoryOps() {
        // 测试代码
    }
    private static void testBase64() {
        // 测试代码
    }
    private static void testSystemProperties() {
        // 测试代码
    }
}
```

充分测试确保迁移成功。

## 注意事项

### 注意事项一：逐步迁移

迁移应该逐步进行：

```java
// 逐步迁移
// 1. 先检查依赖
// 2. 制定迁移计划
// 3. 逐个模块迁移
// 4. 充分测试
// 5. 部署上线
```

逐步迁移能降低风险。

### 注意事项二：保留旧代码

迁移时可以保留旧代码作为参考：

```java
// 保留旧代码作为参考
// 旧代码：使用 sun.misc.Unsafe
// 新代码：使用外部函数和内存 API
```

保留旧代码作为参考，方便对比。

### 注意事项三：文档更新

迁移后需要更新文档：

```java
// 更新文档
// 1. 记录迁移的 API
// 2. 说明替代方案
// 3. 更新使用示例
```

更新文档帮助团队理解迁移。

## 最佳实践

### 最佳实践一：使用工具检查

使用工具检查依赖：

```bash
# 使用 jdeps 检查
jdeps --jdk-internals MyApp.jar
# 使用 jdeprscan 检查废弃 API
jdeprscan MyApp.jar
```

使用工具检查依赖，及时发现问题。

### 最佳实践二：制定迁移计划

制定详细的迁移计划：

```java
// 迁移计划
// 1. 列出所有依赖内部 API 的代码
// 2. 找到每个 API 的替代方案
// 3. 评估迁移工作量
// 4. 制定时间表
// 5. 分配任务
```

制定详细的迁移计划，确保迁移顺利进行。

### 最佳实践三：充分测试

充分测试迁移后的代码：

```java
// 充分测试
// 1. 单元测试
// 2. 集成测试
// 3. 性能测试
// 4. 兼容性测试
```

充分测试确保迁移成功。

## 总结

强封装 JDK 内部 API 的迁移虽然工作量不小，但能让代码更稳定，兼容性更好。建议先用 `jdeps` 工具检查依赖，然后制定迁移计划，逐步执行。虽然迁移可能需要一些时间，但长远来看是值得的。

建议在实际项目中尽早开始迁移，避免在 JDK 更新时出现问题。虽然迁移可能需要一些工作，但能让代码更稳定，兼容性更好。下一篇文章咱就聊聊上下文特定的反序列化过滤器，看看怎么增强反序列化安全性。兄弟们有啥问题随时问，鹏磊会尽量解答。
