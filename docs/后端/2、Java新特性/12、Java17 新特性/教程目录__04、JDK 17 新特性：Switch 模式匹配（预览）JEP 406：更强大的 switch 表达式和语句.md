# 04、JDK 17 新特性：Switch 模式匹配（预览）JEP 406：更强大的 switch 表达式和语句
- 来源：https://ddkk.com/zhuanlan/java/java17/4.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
以前用 switch 的时候，鹏磊最烦的就是只能匹配常量，遇到对象类型就得写一堆 if-else，还得手动做 instanceof 检查和强制转换，代码又臭又长。JDK 17 的 Switch 模式匹配（Pattern Matching）终于解决了这个问题，现在 switch 能直接匹配类型并绑定变量，代码简洁多了，类型安全也有保障。

Switch 模式匹配是 JEP 406 引入的预览特性，让 switch 表达式和语句支持模式匹配。你可以直接在 case 里匹配类型，匹配成功就自动绑定到变量，不用再写 instanceof 和强制转换了。这玩意儿配合密封类用起来特别爽，编译器还能帮你检查完整性，漏掉情况会报错。

## Switch 表达式基础回顾

先简单回顾一下 Switch 表达式，这是 JDK 14 引入的：

```java
// 传统 switch 语句
int day = 3;
String dayName;
switch (day) {
    case 1:
        dayName = "星期一";
        break;  // 必须写 break，不然会穿透
    case 2:
        dayName = "星期二";
        break;
    default:
        dayName = "其他";
}
// Switch 表达式，简洁多了
String dayName = switch (day) {
    case 1 -> "星期一";  // 箭头语法，自动返回
    case 2 -> "星期二";
    default -> "其他";
};
```

Switch 表达式用 `->` 箭头语法，自动返回值，不用写 break，代码简洁多了。

## 类型模式匹配

JDK 17 的 Switch 模式匹配支持类型匹配，可以直接匹配对象类型：

```java
// 以前得这么写，又臭又长
Object obj = getObject();
String result;
if (obj instanceof String) {
    String s = (String) obj;  // 强制转换
    result = "字符串: " + s.length();
} else if (obj instanceof Integer) {
    Integer i = (Integer) obj;  // 强制转换
    result = "整数: " + (i * 2);
} else if (obj == null) {
    result = "null";
} else {
    result = "其他类型";
}
// 现在可以这么写，简洁多了
String result = switch (obj) {
    case String s -> "字符串: " + s.length();  // 直接匹配并绑定变量
    case Integer i -> "整数: " + (i * 2);
    case null -> "null";  // 还能匹配 null
    default -> "其他类型";
};
```

看，`case` 后面直接写类型和变量名，匹配成功就绑定到变量，不用再强制转换了。代码简洁，类型安全。

## Switch 表达式 vs Switch 语句

Switch 模式匹配既支持表达式，也支持语句：

```java
// Switch 表达式，返回结果
String result = switch (obj) {
    case String s -> "字符串: " + s;
    case Integer i -> "整数: " + i;
    default -> "其他";
};
// Switch 语句，执行操作
switch (obj) {
    case String s -> {
        System.out.println("字符串: " + s);  // 执行操作
        processString(s);  // 调用方法
    }
    case Integer i -> {
        System.out.println("整数: " + i);  // 执行操作
        processInteger(i);  // 调用方法
    }
    default -> System.out.println("其他类型");
}
```

表达式用 `yield` 返回值，语句用大括号执行操作，看需求选择。

## 多值匹配

Switch 模式匹配还支持多值匹配，一个 case 可以匹配多个值：

```java
// 匹配多个值
String result = switch (day) {
    case 1, 2, 3, 4, 5 -> "工作日";  // 匹配多个值
    case 6, 7 -> "周末";
    default -> "无效";
};
// 配合类型匹配
String result = switch (obj) {
    case String s when s.length() > 10 -> "长字符串";  // 守卫模式
    case String s -> "短字符串";
    case Integer i when i > 100 -> "大整数";  // 守卫模式
    case Integer i -> "小整数";
    default -> "其他";
};
```

多值匹配让代码更简洁，不用写重复的 case 了。

## 守卫模式（Guarded Patterns）

守卫模式可以在模式匹配后加条件，只有条件满足才匹配：

```java
// 定义密封接口
public sealed interface Number permits Positive, Negative, Zero {
    // Number 的基础方法
}
public record Positive(int value) implements Number {
    // Positive 的实现
}
public record Negative(int value) implements Number {
    // Negative 的实现
}
public record Zero() implements Number {
    // Zero 的实现
}
// 使用守卫模式
String classify(Number num) {
    return switch (num) {
        case Positive(int value) when value > 100 -> "大正数";  // 值大于 100 的正数
        case Positive(int value) -> "正数";  // 其他正数
        case Negative(int value) when value < -100 -> "大负数";  // 值小于 -100 的负数
        case Negative(int value) -> "负数";  // 其他负数
        case Zero() -> "零";  // 零
    };
}
```

`when` 关键字后面跟条件，只有条件满足才匹配，这样能处理更复杂的场景。

## null 处理

Switch 模式匹配对 null 的处理很友好，可以直接匹配 null：

```java
// 处理 null
String process(Object obj) {
    return switch (obj) {
        case null -> "null 值";  // 直接匹配 null
        case String s -> "字符串: " + s;
        case Integer i -> "整数: " + i;
        default -> "其他类型";
    };
}
// 如果不处理 null，遇到 null 会抛 NullPointerException
String processUnsafe(Object obj) {
    return switch (obj) {  // obj 是 null 会抛异常
        case String s -> "字符串: " + s;
        case Integer i -> "整数: " + i;
        default -> "其他类型";
    };
}
```

建议总是处理 null 情况，避免运行时异常。

## 嵌套模式匹配

嵌套模式匹配可以同时匹配多个层次，特别适合处理复杂数据结构：

```java
// 定义表达式
public sealed interface Expr permits Literal, Add, Multiply {
    // Expr 的基础方法
}
public record Literal(int value) implements Expr {
    // Literal 的实现
}
public record Add(Expr left, Expr right) implements Expr {
    // Add 的实现
}
public record Multiply(Expr left, Expr right) implements Expr {
    // Multiply 的实现
}
// 嵌套模式匹配：匹配 Add(Literal, Literal)
int evaluateConstant(Expr expr) {
    return switch (expr) {
        case Literal(int value) -> value;  // 字面量直接返回
        case Add(Literal(int left), Literal(int right)) -> left + right;  // 两个字面量相加
        case Multiply(Literal(int left), Literal(int right)) -> left * right;  // 两个字面量相乘
        default -> throw new IllegalArgumentException("不是常量表达式");  // 其他情况抛异常
    };
}
```

嵌套模式匹配能同时匹配多个层次，代码更简洁，处理复杂数据结构特别方便。

## 实际应用场景

### 场景一：类型安全的类型转换

类型转换是模式匹配的典型应用：

```java
// 安全的类型转换
public <T> Optional<T> safeCast(Object obj, Class<T> clazz) {
    return switch (obj) {
        case Object o when clazz.isInstance(o) -> Optional.of(clazz.cast(o));  // 类型检查
        default -> Optional.empty();  // 类型不匹配返回空
    };
}
// 使用示例
Object obj = getObject();
Optional<String> str = safeCast(obj, String.class);  // 安全转换为 String
if (str.isPresent()) {
    System.out.println("字符串: " + str.get());  // 使用转换后的值
}
```

类型安全，不用手动检查类型了。

### 场景二：JSON 值处理

处理 JSON 值也能用模式匹配：

```java
// 定义 JSON 值为密封接口
public sealed interface JsonValue permits JsonNull, JsonBoolean, JsonNumber, JsonString, JsonArray, JsonObject {
    // JsonValue 的基础方法
}
public record JsonNull() implements JsonValue {
    // JsonNull 的实现
}
public record JsonBoolean(boolean value) implements JsonValue {
    // JsonBoolean 的实现
}
public record JsonNumber(double value) implements JsonValue {
    // JsonNumber 的实现
}
public record JsonString(String value) implements JsonValue {
    // JsonString 的实现
}
public record JsonArray(java.util.List<JsonValue> elements) implements JsonValue {
    // JsonArray 的实现
}
public record JsonObject(java.util.Map<String, JsonValue> properties) implements JsonValue {
    // JsonObject 的实现
}
// 使用模式匹配处理 JSON 值
public Object toJavaObject(JsonValue json) {
    return switch (json) {
        case JsonNull() -> null;  // null 值
        case JsonBoolean(boolean value) -> value;  // 布尔值
        case JsonNumber(double value) -> value;  // 数字
        case JsonString(String value) -> value;  // 字符串
        case JsonArray(java.util.List<JsonValue> elements) -> {
            // 数组转换为 Java List
            java.util.List<Object> list = new java.util.ArrayList<>();  // 创建列表
            for (JsonValue element : elements) {
                list.add(toJavaObject(element));  // 递归转换元素
            }
            yield list;  // 返回列表
        }
        case JsonObject(java.util.Map<String, JsonValue> properties) -> {
            // 对象转换为 Java Map
            java.util.Map<String, Object> map = new java.util.HashMap<>();  // 创建映射
            for (var entry : properties.entrySet()) {
                map.put(entry.getKey(), toJavaObject(entry.getValue()));  // 递归转换值
            }
            yield map;  // 返回映射
        }
    };
}
```

嵌套模式匹配处理复杂数据结构，代码清晰，递归处理也方便。

### 场景三：HTTP 响应处理

HTTP 响应处理也能用模式匹配：

```java
// 定义 HTTP 响应为密封接口
public sealed interface HttpResponse permits SuccessResponse, ErrorResponse, RedirectResponse {
    // HttpResponse 的基础方法
    int statusCode();  // 获取状态码
}
public record SuccessResponse(int statusCode, String body) implements HttpResponse {
    // SuccessResponse 的实现
}
public record ErrorResponse(int statusCode, String message) implements HttpResponse {
    // ErrorResponse 的实现
}
public record RedirectResponse(int statusCode, String location) implements HttpResponse {
    // RedirectResponse 的实现
}
// 使用模式匹配处理响应
public void handleResponse(HttpResponse response) {
    switch (response) {
        case SuccessResponse(int code, String body) when code == 200 -> {
            System.out.println("成功: " + body);  // 处理成功响应
            processSuccess(body);  // 进一步处理
        }
        case SuccessResponse(int code, String body) -> {
            System.out.println("部分成功 " + code + ": " + body);  // 处理部分成功
        }
        case ErrorResponse(int code, String message) when code >= 500 -> {
            System.err.println("服务器错误 " + code + ": " + message);  // 处理服务器错误
            logError(code, message);  // 记录错误
        }
        case ErrorResponse(int code, String message) -> {
            System.err.println("客户端错误 " + code + ": " + message);  // 处理客户端错误
        }
        case RedirectResponse(int code, String location) -> {
            System.out.println("重定向 " + code + " 到: " + location);  // 处理重定向
            followRedirect(location);  // 跟随重定向
        }
    }
}
```

守卫模式处理不同状态码，代码清晰，类型安全。

## 编译器完整性检查

Switch 模式匹配配合密封类，编译器能检查完整性。如果你漏掉了某个情况，编译器会报错：

```java
// 定义密封接口
public sealed interface Status permits Active, Inactive, Pending {
    // Status 的基础方法
}
public record Active() implements Status {
    // Active 的实现
}
public record Inactive() implements Status {
    // Inactive 的实现
}
public record Pending() implements Status {
    // Pending 的实现
}
// 如果漏掉了某个情况，编译器会报错
public String getStatusName(Status status) {
    return switch (status) {
        case Active() -> "活跃";  // 处理 Active
        case Inactive() -> "非活跃";  // 处理 Inactive
        // 漏掉了 Pending，编译器会提示
    };
}
```

这样就不会漏掉某个情况了，类型安全有保障。

## 注意事项和最佳实践

### 注意事项

1. **预览特性**：Switch 模式匹配还在预览阶段，需要启用预览特性：

```bash
javac --enable-preview --release 17 Main.java
java --enable-preview Main
```
2. **null 处理**：建议总是处理 null 情况，避免运行时异常。
3. **模式顺序**：模式匹配按顺序检查，更具体的模式应该放在前面。
4. **守卫条件**：守卫条件不能有副作用，应该是纯函数。

### 最佳实践

1. **配合密封类使用**：密封类 + 模式匹配是绝配，编译器能检查完整性。
2. **避免过度嵌套**：嵌套模式匹配不要嵌套太深，影响可读性。
3. **合理使用守卫模式**：守卫模式能处理复杂条件，但不要过度使用。
4. **利用编译器检查**：不要用 `default` 分支，让编译器检查完整性。
5. **文档说明**：在代码注释中说明为什么用模式匹配，帮助其他开发者理解。

## 总结

Switch 模式匹配是 JDK 17 的一个重磅特性，让 switch 表达式和语句支持类型匹配，代码简洁多了，类型安全也有保障。配合密封类用起来特别爽，编译器还能帮你检查完整性。

虽然还在预览阶段，但已经很好用了。建议在新项目里试试，特别是需要处理复杂数据结构的场景。下一篇文章咱就聊聊模式匹配和密封类结合使用的完整案例，看看实际项目中怎么用。兄弟们有啥问题随时问，鹏磊会尽量解答。
