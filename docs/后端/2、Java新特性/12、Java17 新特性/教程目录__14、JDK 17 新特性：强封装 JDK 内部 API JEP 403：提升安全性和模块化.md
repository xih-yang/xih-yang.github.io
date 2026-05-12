# 14、JDK 17 新特性：强封装 JDK 内部 API JEP 403：提升安全性和模块化
- 来源：https://ddkk.com/zhuanlan/java/java17/14.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
以前在 Java 里访问 JDK 内部 API，鹏磊最烦的就是各种警告和错误。用反射访问 `sun.*` 包，用 `--illegal-access` 绕过限制，代码不稳定，还容易出问题。JDK 17 的 JEP 403 强封装了 JDK 内部 API，移除了 `--illegal-access` 选项，让内部 API 完全封装，提升了安全性和模块化。

强封装 JDK 内部 API 是 JEP 403 引入的特性，移除了 `--illegal-access` 选项，让 JDK 内部 API 完全封装。这玩意儿提升了安全性和模块化，防止应用访问不稳定的内部 API，避免因为 JDK 更新导致应用崩溃。虽然可能会影响一些依赖内部 API 的旧代码，但长远来看是好事，让 Java 生态系统更健康。

## 什么是 JDK 内部 API

JDK 内部 API 是指那些以 `sun.*`、`com.sun.*`、`jdk.internal.*` 等开头的包，这些包是 JDK 内部实现，不是公开 API。以前可以通过反射或 `--illegal-access` 选项访问这些 API，但这是不安全的。

```java
// JDK 内部 API 示例（不推荐使用）
// sun.* 包
// com.sun.* 包
// jdk.internal.* 包
// 这些包是 JDK 内部实现，不应该被应用代码访问
// 在 JDK 17 中，这些 API 被完全封装，无法访问
```

JDK 内部 API 是 JDK 内部实现，不应该被应用代码访问。

## 为什么需要强封装

以前访问 JDK 内部 API 有几个问题：

1. **不稳定**：内部 API 可能在任何版本中改变或删除
2. **不安全**：访问内部 API 可能绕过安全检查
3. **不兼容**：不同 JDK 版本的内部 API 可能不兼容
4. **维护困难**：依赖内部 API 的代码难以维护

JDK 17 强封装了内部 API，解决了这些问题。

## --illegal-access 选项的移除

`--illegal-access` 选项在 JDK 17 中被移除了：

```bash
# JDK 16 之前：可以使用 --illegal-access 选项
java --illegal-access=permit MyApp  # 允许访问内部 API
# JDK 16：--illegal-access 被废弃
java --illegal-access=permit MyApp  # 仍然可用，但会警告
# JDK 17：--illegal-access 被移除
java --illegal-access=permit MyApp  # 错误：未知选项
```

`--illegal-access` 选项在 JDK 17 中被移除了，无法再绕过封装。

## 访问内部 API 的错误

在 JDK 17 中，访问内部 API 会直接报错：

```java
import java.lang.reflect.*;
// 尝试访问内部 API（会失败）
public class InternalAPIAccess {
    public static void main(String[] args) {
        try {
            // 尝试访问 sun.misc.Unsafe（内部 API）
            Class<?> unsafeClass = Class.forName("sun.misc.Unsafe");  // 会抛出异常
            System.out.println("成功访问: " + unsafeClass.getName());  // 不会执行
        } catch (Exception e) {
            System.out.println("访问失败: " + e.getMessage());  // 输出错误信息
            // 输出: 访问失败: class sun.misc.Unsafe (in module java.base) cannot be accessed
        }
    }
}
```

在 JDK 17 中，访问内部 API 会直接报错，无法绕过。

## 迁移指南

如果代码依赖内部 API，需要迁移到公开 API：

### 迁移示例一：sun.misc.Unsafe

`sun.misc.Unsafe` 是常用的内部 API，需要迁移：

```java
// 错误：使用 sun.misc.Unsafe（内部 API）
// import sun.misc.Unsafe;  // 无法导入
// 正确：使用公开 API
// 对于内存操作，可以使用外部函数和内存 API（JDK 17）
import jdk.incubator.foreign.*;
public class MemoryAccess {
    public static void main(String[] args) {
        // 使用外部函数和内存 API（公开 API）
        try (ResourceScope scope = ResourceScope.newConfinedScope()) {
            MemorySegment segment = MemorySegment.allocateNative(100, scope);  // 分配内存
            segment.set(ValueLayout.JAVA_INT, 0, 42);  // 写入数据
            int value = segment.get(ValueLayout.JAVA_INT, 0);  // 读取数据
            System.out.println("值: " + value);  // 输出: 值: 42
        }
    }
}
```

使用公开 API 替代内部 API，代码更稳定。

### 迁移示例二：反射访问

反射访问内部 API 也会失败：

```java
import java.lang.reflect.*;
// 错误：使用反射访问内部 API
public class ReflectionAccess {
    public static void main(String[] args) {
        try {
            // 尝试通过反射访问内部类
            Class<?> clazz = Class.forName("java.lang.String$CaseInsensitiveComparator");  // 内部类
            System.out.println("成功访问: " + clazz.getName());  // 可能成功（如果是公开的）
        } catch (Exception e) {
            System.out.println("访问失败: " + e.getMessage());  // 输出错误信息
        }
        // 对于内部类，应该使用公开 API
        // 例如，使用 String.CASE_INSENSITIVE_ORDER（公开常量）
        java.util.Comparator<String> comparator = String.CASE_INSENSITIVE_ORDER;  // 公开 API
        System.out.println("使用公开 API: " + comparator.getClass().getName());  // 输出类名
    }
}
```

使用公开 API 替代反射访问，代码更安全。

### 迁移示例三：内部工具类

内部工具类也需要迁移：

```java
// 错误：使用内部工具类
// import sun.misc.BASE64Encoder;  // 无法导入
// 正确：使用公开 API
import java.util.Base64;
public class Base64Example {
    public static void main(String[] args) {
        // 使用公开的 Base64 API
        String text = "Hello, World!";  // 原始文本
        String encoded = Base64.getEncoder().encodeToString(text.getBytes());  // 编码
        System.out.println("编码: " + encoded);  // 输出编码结果
        String decoded = new String(Base64.getDecoder().decode(encoded));  // 解码
        System.out.println("解码: " + decoded);  // 输出解码结果
    }
}
```

使用公开 API 替代内部工具类，代码更稳定。

## 实际应用：检查依赖

检查代码是否依赖内部 API：

```java
import java.util.*;
import java.util.regex.*;
// 检查代码是否依赖内部 API
public class InternalAPIChecker {
    public static void main(String[] args) {
        // 常见的内部 API 包
        String[] internalPackages = {
            "sun.",           // sun.* 包
            "com.sun.",       // com.sun.* 包
            "jdk.internal."   // jdk.internal.* 包
        };
        // 检查代码中是否使用了内部 API
        String code = "import sun.misc.Unsafe;";  // 示例代码
        for (String pkg : internalPackages) {
            if (code.contains(pkg)) {
                System.out.println("警告: 代码使用了内部 API: " + pkg);  // 输出警告
            }
        }
        // 使用 jdeps 工具检查依赖
        // jdeps --jdk-internals MyApp.jar
    }
}
```

检查代码是否依赖内部 API，及时迁移。

## 实际应用：使用公开 API

使用公开 API 替代内部 API：

```java
import java.util.*;
import java.util.stream.*;
// 使用公开 API 的示例
public class PublicAPIExample {
    public static void main(String[] args) {
        // 使用公开的集合 API
        List<String> list = new ArrayList<>();  // 公开 API
        list.add("Hello");  // 公开方法
        list.add("World");  // 公开方法
        // 使用公开的流 API
        list.stream()  // 公开 API
            .map(String::toUpperCase)  // 公开方法
            .forEach(System.out::println);  // 公开方法
        // 使用公开的工具类
        Collections.sort(list);  // 公开 API
        System.out.println("排序后: " + list);  // 输出结果
    }
}
```

使用公开 API，代码更稳定，兼容性更好。

## 模块系统的影响

强封装与 Java 模块系统密切相关：

```java
// 模块系统示例
module my.module {
    requires java.base;  // 需要 java.base 模块
    // 无法访问内部 API
    // 只能访问模块导出的公开 API
}
// 如果需要访问特定功能，应该：
// 1. 使用公开 API
// 2. 使用 --add-exports（不推荐，仅用于测试）
// 3. 使用 --add-opens（不推荐，仅用于测试）
```

模块系统确保了强封装，只能访问模块导出的公开 API。

## 注意事项

### 注意事项一：向后兼容性

强封装可能影响向后兼容性：

```java
// 向后兼容性问题
// 旧代码可能依赖内部 API
// 升级到 JDK 17 后可能无法运行
// 需要迁移到公开 API
```

强封装可能影响向后兼容性，需要迁移旧代码。

### 注意事项二：第三方库

第三方库可能依赖内部 API：

```java
// 第三方库问题
// 某些第三方库可能依赖内部 API
// 升级到 JDK 17 后可能无法使用
// 需要更新库版本或寻找替代方案
```

第三方库可能依赖内部 API，需要更新或寻找替代方案。

### 注意事项三：测试代码

测试代码可能需要特殊处理：

```java
// 测试代码
// 测试代码可能需要访问内部 API
// 可以使用 --add-exports 或 --add-opens（不推荐）
// 更好的方式是使用公开 API 或模拟
```

测试代码可能需要特殊处理，但应该尽量使用公开 API。

## 最佳实践

### 最佳实践一：使用公开 API

始终使用公开 API：

```java
// 使用公开 API
// 1. 查看官方文档
// 2. 使用标准库
// 3. 避免使用内部 API
```

始终使用公开 API，代码更稳定。

### 最佳实践二：检查依赖

定期检查代码依赖：

```java
// 检查依赖
// 1. 使用 jdeps 工具
// 2. 检查编译警告
// 3. 运行测试
```

定期检查代码依赖，及时发现问题。

### 最佳实践三：更新库

及时更新第三方库：

```java
// 更新库
// 1. 检查库是否支持 JDK 17
// 2. 更新到最新版本
// 3. 寻找替代方案
```

及时更新第三方库，确保兼容性。

## 总结

强封装 JDK 内部 API 是 JDK 17 的一个重要特性，移除了 `--illegal-access` 选项，让内部 API 完全封装，提升了安全性和模块化。这玩意儿虽然可能会影响一些依赖内部 API 的旧代码，但长远来看是好事，让 Java 生态系统更健康。

建议在实际项目中检查代码是否依赖内部 API，及时迁移到公开 API。虽然迁移可能需要一些工作，但能让代码更稳定，兼容性更好。下一篇文章咱就聊聊强封装 JDK 内部 API 的迁移指南，看看怎么适配被封装的内置 API。兄弟们有啥问题随时问，鹏磊会尽量解答。
