# 03、JDK 17 新特性：密封类（Sealed Classes）JEP 409 进阶：密封接口与模式匹配结合
- 来源：https://ddkk.com/zhuanlan/java/java17/3.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
上篇文章咱聊了密封类的基础用法，今天鹏磊来给大伙儿整点进阶的。密封接口配合模式匹配用起来那叫一个爽，代码简洁、类型安全，还能让编译器帮你检查完整性。这俩特性凑一块儿，简直就是天作之合。

密封接口和密封类一样，能限制实现类，但接口更灵活，特别是配合记录类（Records）用。模式匹配在 switch 表达式里能直接匹配类型并绑定变量，不用再写一堆 instanceof 和强制转换了。这俩组合起来，处理代数数据类型（ADT）特别方便，代码可读性也提升不少。

## 密封接口基础回顾

先简单回顾一下密封接口的语法，和密封类差不多：

```java
// 定义一个密封接口 Result
public sealed interface Result<T> permits Success, Failure {
    // Result 的基础方法
    boolean isSuccess();  // 判断是否成功
}
// Success 是记录类，实现了 Result
public record Success<T>(T value) implements Result<T> {
    @Override
    public boolean isSuccess() {
        return true;  // 成功返回 true
    }
}
// Failure 也是记录类
public record Failure<T>(Throwable error) implements Result<T> {
    @Override
    public boolean isSuccess() {
        return false;  // 失败返回 false
    }
}
```

看，接口也可以密封，用 `sealed` 和 `permits` 指定允许的实现类。记录类实现密封接口特别合适，代码简洁。

## Switch 模式匹配基础

JDK 17 的 switch 模式匹配还在预览阶段，但已经很好用了。基本语法是这样的：

```java
// 以前得这么写，又臭又长
Object obj = getObject();
if (obj instanceof String) {
    String s = (String) obj;  // 强制转换
    System.out.println(s.length());
} else if (obj instanceof Integer) {
    Integer i = (Integer) obj;  // 强制转换
    System.out.println(i * 2);
} else {
    System.out.println("其他类型");
}
// 现在可以这么写，简洁多了
switch (obj) {
    case String s -> System.out.println(s.length());  // 直接匹配并绑定变量
    case Integer i -> System.out.println(i * 2);
    case null -> System.out.println("null");  // 还能匹配 null
    default -> System.out.println("其他类型");
}
```

`case` 后面直接写类型和变量名，匹配成功就绑定到变量，不用再强制转换了。

## 密封接口 + 模式匹配实战

### 场景一：结果类型（Result Type）

结果类型是函数式编程里的经典模式，用密封接口配合模式匹配处理特别优雅：

```java
// 定义密封接口 Result
public sealed interface Result<T> permits Success, Failure {
    // Result 的基础方法
}
// 成功结果
public record Success<T>(T value) implements Result<T> {
    // Success 的实现，value 是成功返回的值
}
// 失败结果
public record Failure<T>(Throwable error) implements Result<T> {
    // Failure 的实现，error 是错误信息
}
// 使用模式匹配处理结果
public <T> void handleResult(Result<T> result) {
    switch (result) {
        case Success<T> success -> {
            T value = success.value();  // 直接获取值，不用强制转换
            System.out.println("成功: " + value);  // 处理成功情况
        }
        case Failure<T> failure -> {
            Throwable error = failure.error();  // 直接获取错误，不用强制转换
            System.err.println("失败: " + error.getMessage());  // 处理失败情况
        }
    }
}
```

看，代码简洁多了，类型安全，编译器还能检查是否覆盖了所有情况。

### 场景二：表达式求值

表达式求值是密封接口 + 模式匹配的另一个经典应用：

```java
// 定义表达式为密封接口
public sealed interface Expr permits Literal, Variable, Add, Multiply {
    // Expr 的基础方法
}
// 字面量表达式
public record Literal(int value) implements Expr {
    // Literal 的实现，value 是字面量的值
}
// 变量表达式
public record Variable(String name) implements Expr {
    // Variable 的实现，name 是变量名
}
// 加法表达式
public record Add(Expr left, Expr right) implements Expr {
    // Add 的实现，left 和 right 是左右操作数
}
// 乘法表达式
public record Multiply(Expr left, Expr right) implements Expr {
    // Multiply 的实现，left 和 right 是左右操作数
}
// 使用模式匹配求值
public int evaluate(Expr expr, java.util.Map<String, Integer> vars) {
    return switch (expr) {
        case Literal(int value) -> value;  // 字面量直接返回值
        case Variable(String name) -> vars.getOrDefault(name, 0);  // 变量从映射中取值
        case Add(Expr left, Expr right) -> {
            // 递归求值左右操作数
            int leftValue = evaluate(left, vars);  // 求左操作数的值
            int rightValue = evaluate(right, vars);  // 求右操作数的值
            yield leftValue + rightValue;  // 返回相加结果
        }
        case Multiply(Expr left, Expr right) -> {
            // 递归求值左右操作数
            int leftValue = evaluate(left, vars);  // 求左操作数的值
            int rightValue = evaluate(right, vars);  // 求右操作数的值
            yield leftValue * rightValue;  // 返回相乘结果
        }
    };
}
```

嵌套模式匹配，直接解构记录类的字段，代码清晰，递归求值也简单。

### 场景三：JSON 解析器

JSON 解析器也能用密封接口 + 模式匹配实现：

```java
// 定义 JSON 值为密封接口
public sealed interface JsonValue permits JsonNull, JsonBoolean, JsonNumber, JsonString, JsonArray, JsonObject {
    // JsonValue 的基础方法
}
// JSON null
public record JsonNull() implements JsonValue {
    // JsonNull 的实现
}
// JSON 布尔值
public record JsonBoolean(boolean value) implements JsonValue {
    // JsonBoolean 的实现
}
// JSON 数字
public record JsonNumber(double value) implements JsonValue {
    // JsonNumber 的实现
}
// JSON 字符串
public record JsonString(String value) implements JsonValue {
    // JsonString 的实现
}
// JSON 数组
public record JsonArray(java.util.List<JsonValue> elements) implements JsonValue {
    // JsonArray 的实现
}
// JSON 对象
public record JsonObject(java.util.Map<String, JsonValue> properties) implements JsonValue {
    // JsonObject 的实现
}
// 使用模式匹配格式化 JSON
public String formatJson(JsonValue json, int indent) {
    String indentStr = "  ".repeat(indent);  // 生成缩进字符串
    return switch (json) {
        case JsonNull() -> "null";  // null 直接返回
        case JsonBoolean(boolean value) -> String.valueOf(value);  // 布尔值转字符串
        case JsonNumber(double value) -> String.valueOf(value);  // 数字转字符串
        case JsonString(String value) -> "\"" + escape(value) + "\"";  // 字符串加引号
        case JsonArray(java.util.List<JsonValue> elements) -> {
            // 数组格式化
            if (elements.isEmpty()) {
                yield "[]";  // 空数组
            }
            StringBuilder sb = new StringBuilder("[\n");  // 开始数组
            for (int i = 0; i < elements.size(); i++) {
                sb.append(indentStr).append("  ");  // 添加缩进
                sb.append(formatJson(elements.get(i), indent + 1));  // 递归格式化元素
                if (i < elements.size() - 1) {
                    sb.append(",");  // 添加逗号
                }
                sb.append("\n");  // 换行
            }
            sb.append(indentStr).append("]");  // 结束数组
            yield sb.toString();  // 返回格式化结果
        }
        case JsonObject(java.util.Map<String, JsonValue> properties) -> {
            // 对象格式化
            if (properties.isEmpty()) {
                yield "{}";  // 空对象
            }
            StringBuilder sb = new StringBuilder("{\n");  // 开始对象
            var entries = properties.entrySet().iterator();  // 获取条目迭代器
            while (entries.hasNext()) {
                var entry = entries.next();  // 获取下一个条目
                sb.append(indentStr).append("  \"").append(entry.getKey()).append("\": ");  // 添加键
                sb.append(formatJson(entry.getValue(), indent + 1));  // 递归格式化值
                if (entries.hasNext()) {
                    sb.append(",");  // 添加逗号
                }
                sb.append("\n");  // 换行
            }
            sb.append(indentStr).append("}");  // 结束对象
            yield sb.toString();  // 返回格式化结果
        }
    };
}
// 转义字符串
private String escape(String s) {
    return s.replace("\\", "\\\\")  // 转义反斜杠
             .replace("\"", "\\\"");  // 转义引号
}
```

嵌套模式匹配处理复杂数据结构，代码清晰，递归处理也方便。

## 守卫模式（Guarded Patterns）

JDK 17 还支持守卫模式，可以在模式匹配后加条件：

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
public String classify(Number num) {
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

## 嵌套模式匹配

嵌套模式匹配可以同时匹配多个层次：

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
public int evaluateConstant(Expr expr) {
    return switch (expr) {
        case Literal(int value) -> value;  // 字面量直接返回
        case Add(Literal(int left), Literal(int right)) -> left + right;  // 两个字面量相加
        case Multiply(Literal(int left), Literal(int right)) -> left * right;  // 两个字面量相乘
        default -> throw new IllegalArgumentException("不是常量表达式");  // 其他情况抛异常
    };
}
```

嵌套模式匹配能同时匹配多个层次，代码更简洁。

## 编译器完整性检查

密封接口 + 模式匹配的一个巨大优势是编译器能检查完整性。如果你漏掉了某个情况，编译器会报错：

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

## 实际应用：HTTP 响应处理

HTTP 响应处理是密封接口 + 模式匹配的典型应用：

```java
// 定义 HTTP 响应为密封接口
public sealed interface HttpResponse permits SuccessResponse, ErrorResponse, RedirectResponse {
    // HttpResponse 的基础方法
    int statusCode();  // 获取状态码
}
// 成功响应
public record SuccessResponse(int statusCode, String body) implements HttpResponse {
    // SuccessResponse 的实现
}
// 错误响应
public record ErrorResponse(int statusCode, String message) implements HttpResponse {
    // ErrorResponse 的实现
}
// 重定向响应
public record RedirectResponse(int statusCode, String location) implements HttpResponse {
    // RedirectResponse 的实现
}
// 使用模式匹配处理响应
public void handleResponse(HttpResponse response) {
    switch (response) {
        case SuccessResponse(int code, String body) -> {
            System.out.println("成功响应 " + code + ": " + body);  // 处理成功响应
            // 进一步处理响应体
        }
        case ErrorResponse(int code, String message) -> {
            System.err.println("错误响应 " + code + ": " + message);  // 处理错误响应
            // 记录错误日志
        }
        case RedirectResponse(int code, String location) -> {
            System.out.println("重定向响应 " + code + " 到: " + location);  // 处理重定向响应
            // 处理重定向逻辑
        }
    }
}
```

代码清晰，类型安全，编译器还能检查完整性。

## 最佳实践

1. **优先使用记录类**：记录类实现密封接口特别合适，代码简洁，自动生成构造方法和访问器。
2. **利用编译器检查**：不要用 `default` 分支，让编译器检查完整性，漏掉情况会报错。
3. **合理使用守卫模式**：守卫模式能处理复杂条件，但不要过度使用，保持代码可读性。
4. **嵌套模式匹配**：嵌套模式匹配能同时匹配多个层次，但不要嵌套太深，影响可读性。
5. **文档说明**：在接口的 JavaDoc 中说明为什么是密封的，帮助其他开发者理解设计意图。

## 总结

密封接口配合模式匹配用起来是真香，代码简洁、类型安全，还能让编译器帮你检查完整性。处理代数数据类型特别方便，代码可读性也提升不少。

虽然模式匹配还在预览阶段，但已经很好用了。建议在新项目里试试，特别是需要处理复杂数据结构的场景。下一篇文章咱就聊聊 Switch 模式匹配的详细用法，看看还有哪些高级特性。兄弟们有啥问题随时问，鹏磊会尽量解答。
