# 10、Java 22 新特性：在 super() 调用之前的语句（JEP 447）灵活构造函数
- 来源：https://ddkk.com/zhuanlan/java/java22/10.html
- 分类：Java 22 新特性
- 分组：教程目录
- 日期：2025-11-26
兄弟们，鹏磊今天来聊聊 Java 22 里的一个预览特性，就是在 super() 调用之前可以执行语句，这玩意儿是 JEP 447 引入的，专门用来增强构造函数的灵活性。说实话，写 Java 代码这么多年了，最头疼的就是构造函数里必须先调用 super() 或 this()，而且必须是第一行，这导致很多场景下代码写起来特别别扭，比如参数验证、字段初始化、参数计算啥的，都得用静态辅助方法或者工厂方法，代码可读性差，维护起来也麻烦。JEP 447 就是为了解决这个问题来的，它允许在 super() 调用之前执行一些语句，只要这些语句不引用正在创建的实例就行，这功能贼实用。

JEP 447 是 Java 22 的预览特性，它允许在显式构造函数调用（super() 或 this()）之前执行语句，这些语句所在的区域叫做"预构造上下文"（preconstruction context）。核心思想是：在调用父类构造函数之前，可以执行一些不涉及实例的操作，比如参数验证、参数计算、字段初始化（但不能访问实例字段或方法）等。这玩意儿特别适合需要参数验证、参数转换、字段初始化的场景，代码写起来更自然，可读性也更好。

## 为什么需要这个特性

先说说传统构造函数的限制。在 Java 里，构造函数的第一条语句必须是 super() 或 this()，这导致很多场景下代码写起来特别别扭：

```java
// 传统构造函数的限制
public class PositiveBigInteger extends BigInteger {
    // 问题1：参数验证必须在 super() 之前，但 super() 必须是第一行
    // 所以只能用静态辅助方法
    public PositiveBigInteger(long value) {
        super(verifyPositive(value));  // 必须用静态方法验证
    }
    // 静态辅助方法：验证参数是否为正数
    private static long verifyPositive(long value) {
        if (value <= 0) {  // 如果值不是正数
            throw new IllegalArgumentException("non-positive value");  // 抛出异常
        }
        return value;  // 返回验证后的值
    }
}
// 问题2：参数计算也很麻烦
public class Rectangle extends Shape {
    private int width;
    private int height;
    public Rectangle(int area, int aspectRatio) {
        // 需要根据面积和宽高比计算宽度和高度
        // 但 super() 必须是第一行，所以只能用静态方法
        super(calculateDimensions(area, aspectRatio));
    }
    private static Dimensions calculateDimensions(int area, int aspectRatio) {
        // 计算逻辑...
        return new Dimensions(width, height);
    }
}
// 问题3：字段初始化也很别扭
public class Child extends Parent {
    private int x;
    public Child(int x) {
        // 想先验证或转换 x，再传给父类
        // 但 super() 必须是第一行，所以很麻烦
        super(x);
        this.x = x;  // 只能在这里初始化
    }
}
```

这些问题导致代码可读性差，维护起来也麻烦。JEP 447 就是为了解决这些问题，让构造函数更灵活。

## 核心概念

JEP 447 的核心概念包括：

1. **预构造上下文（Preconstruction Context）**：构造函数中显式构造函数调用（super() 或 this()）之前的区域
2. **实例引用限制**：在预构造上下文中，不能引用正在创建的实例，包括：

- 不能访问实例字段
- 不能调用实例方法
- 不能使用 `this` 或 `super` 引用
3. **允许的操作**：在预构造上下文中可以执行：

- 参数验证
- 参数计算
- 局部变量声明和赋值
- 条件语句、循环语句等控制流
- 调用静态方法
- 字段初始化（但不能访问实例字段）

## 基本用法

### 参数验证

最常用的场景就是参数验证，现在可以直接在构造函数里验证，不用写静态辅助方法了：

```java
import java.math.BigInteger;
// 参数验证：直接在构造函数里验证参数
public class PositiveBigInteger extends BigInteger {
    // 新写法：可以在 super() 之前验证参数
    public PositiveBigInteger(long value) {
        // 在预构造上下文中验证参数
        if (value <= 0) {  // 如果值不是正数
            throw new IllegalArgumentException("Value must be positive");  // 抛出异常
        }
        super(Long.toString(value));  // 验证通过后调用父类构造函数
    }
    // 对比：旧写法需要用静态辅助方法
    // public PositiveBigInteger(long value) {
    //     super(verifyPositive(value));  // 必须用静态方法
    // }
    // private static long verifyPositive(long value) {
    //     if (value <= 0) throw new IllegalArgumentException("non-positive value");
    //     return value;
    // }
}
// 使用示例
public class Example {
    public static void main(String[] args) {
        // 正常情况：创建正数
        PositiveBigInteger pos = new PositiveBigInteger(100);  // 正常创建
        System.out.println(pos);
        // 异常情况：尝试创建非正数
        try {
            PositiveBigInteger neg = new PositiveBigInteger(-10);  // 会抛出异常
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());  // 输出错误信息
        }
    }
}
```

这玩意儿的好处是，参数验证逻辑直接写在构造函数里，代码更直观，可读性更好，不用跳来跳去看静态辅助方法了。

### 参数计算和转换

除了验证，还可以在 super() 之前计算或转换参数：

```java
// 参数计算：在 super() 之前计算参数
public class Rectangle extends Shape {
    private int width;
    private int height;
    public Rectangle(int area, double aspectRatio) {
        // 在预构造上下文中计算宽度和高度
        // 根据面积和宽高比计算：area = width * height, height = width * aspectRatio
        // 所以：area = width * (width * aspectRatio) = width^2 * aspectRatio
        // width = sqrt(area / aspectRatio)
        int calculatedWidth = (int) Math.sqrt(area / aspectRatio);  // 计算宽度
        int calculatedHeight = (int) (calculatedWidth * aspectRatio);  // 计算高度
        // 确保宽度和高度都是正数
        if (calculatedWidth <= 0 || calculatedHeight <= 0) {  // 验证计算结果
            throw new IllegalArgumentException("Invalid area or aspect ratio");  // 抛出异常
        }
        super(calculatedWidth, calculatedHeight);  // 调用父类构造函数
        this.width = calculatedWidth;  // 初始化字段
        this.height = calculatedHeight;  // 初始化字段
    }
}
// 参数转换：在 super() 之前转换参数
public class Temperature extends Measurement {
    private double celsius;
    public Temperature(double fahrenheit) {
        // 在预构造上下文中转换温度单位
        double converted = (fahrenheit - 32) * 5.0 / 9.0;  // 华氏度转摄氏度
        super(converted, "Celsius");  // 调用父类构造函数
        this.celsius = converted;  // 初始化字段
    }
}
```

参数计算和转换的好处是，逻辑更清晰，不用写静态辅助方法，代码更自然。

### 字段初始化

还可以在 super() 之前初始化字段，但不能访问实例字段或方法：

```java
// 字段初始化：在 super() 之前初始化字段
public class Child extends Parent {
    private int x;
    private String name;
    public Child(int x, String name) {
        // 在预构造上下文中可以初始化字段
        // 但不能访问实例字段或方法，所以只能初始化，不能读取
        // 可以验证和转换参数
        if (x < 0) {  // 如果 x 是负数
            x = 0;  // 设置为 0
        }
        if (name == null || name.isEmpty()) {  // 如果名字为空
            name = "Unknown";  // 设置默认值
        }
        super(x);  // 调用父类构造函数
        this.x = x;  // 初始化字段（在 super() 之后）
        this.name = name;  // 初始化字段（在 super() 之后）
    }
}
// 注意：不能在预构造上下文中访问实例字段
public class WrongExample extends Parent {
    private int x;
    public WrongExample(int value) {
        // 错误：不能在 super() 之前访问实例字段
        // if (this.x < 0) {  // 编译错误！
        //     throw new IllegalArgumentException();
        // }
        // 正确：只能使用局部变量
        int localX = value;  // 使用局部变量
        if (localX < 0) {  // 验证局部变量
            localX = 0;  // 修改局部变量
        }
        super(localX);  // 调用父类构造函数
        this.x = localX;  // 在 super() 之后初始化字段
    }
}
```

字段初始化的好处是，可以在 super() 之前验证和转换参数，然后再初始化字段，逻辑更清晰。

### 复杂验证逻辑

还可以在 super() 之前执行复杂的验证逻辑：

```java
// 复杂验证逻辑：在 super() 之前执行复杂验证
public class EmailAddress extends String {
    public EmailAddress(String email) {
        // 在预构造上下文中执行复杂的邮箱验证
        if (email == null || email.isEmpty()) {  // 检查是否为空
            throw new IllegalArgumentException("Email cannot be null or empty");  // 抛出异常
        }
        // 检查邮箱格式
        if (!email.contains("@")) {  // 必须包含 @
            throw new IllegalArgumentException("Email must contain @");  // 抛出异常
        }
        String[] parts = email.split("@");  // 分割邮箱
        if (parts.length != 2) {  // 必须只有两部分
            throw new IllegalArgumentException("Invalid email format");  // 抛出异常
        }
        String localPart = parts[0];  // 本地部分
        String domain = parts[1];  // 域名部分
        if (localPart.isEmpty() || domain.isEmpty()) {  // 两部分都不能为空
            throw new IllegalArgumentException("Email local part and domain cannot be empty");  // 抛出异常
        }
        if (!domain.contains(".")) {  // 域名必须包含点
            throw new IllegalArgumentException("Email domain must contain a dot");  // 抛出异常
        }
        super(email);  // 验证通过后调用父类构造函数
    }
}
// 使用示例
public class EmailExample {
    public static void main(String[] args) {
        // 正常情况：创建有效邮箱
        EmailAddress email1 = new EmailAddress("user@example.com");  // 正常创建
        System.out.println(email1);
        // 异常情况：无效邮箱格式
        try {
            EmailAddress email2 = new EmailAddress("invalid-email");  // 会抛出异常
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());  // 输出错误信息
        }
    }
}
```

复杂验证逻辑的好处是，可以把所有验证逻辑都写在构造函数里，代码更集中，更容易维护。

## 限制和注意事项

### 不能引用实例

在预构造上下文中，不能引用正在创建的实例：

```java
// 错误示例：不能在预构造上下文中引用实例
public class WrongExample extends Parent {
    private int x;
    private int y;
    public WrongExample(int value) {
        // 错误1：不能访问实例字段
        // if (this.x < 0) {  // 编译错误！
        //     throw new IllegalArgumentException();
        // }
        // 错误2：不能调用实例方法
        // if (this.isValid(value)) {  // 编译错误！
        //     throw new IllegalArgumentException();
        // }
        // 错误3：不能使用 this 引用
        // this.x = value;  // 编译错误！
        // 错误4：不能使用 super 引用（除了 super() 调用）
        // super.someMethod();  // 编译错误！
        // 正确：只能使用局部变量和静态方法
        int localValue = value;  // 使用局部变量
        if (localValue < 0) {  // 验证局部变量
            localValue = 0;  // 修改局部变量
        }
        super(localValue);  // 调用父类构造函数
        this.x = localValue;  // 在 super() 之后初始化字段
    }
}
```

这个限制是必须的，因为在 super() 调用之前，实例还没有完全初始化，所以不能访问实例成员。

### 可以使用静态方法

虽然不能访问实例成员，但可以使用静态方法：

```java
// 可以使用静态方法：在预构造上下文中调用静态方法
public class ValidatedBigInteger extends BigInteger {
    // 静态辅助方法：验证参数
    private static long validateAndNormalize(long value) {
        if (value <= 0) {  // 如果值不是正数
            throw new IllegalArgumentException("Value must be positive");  // 抛出异常
        }
        return value;  // 返回验证后的值
    }
    public ValidatedBigInteger(long value) {
        // 在预构造上下文中可以调用静态方法
        long normalized = validateAndNormalize(value);  // 调用静态方法
        super(Long.toString(normalized));  // 调用父类构造函数
    }
}
// 也可以调用其他类的静态方法
public class MathUtils {
    public static int calculate(int a, int b) {
        return a + b;  // 简单的计算
    }
}
public class CalculatedValue extends Parent {
    public CalculatedValue(int a, int b) {
        // 在预构造上下文中可以调用其他类的静态方法
        int result = MathUtils.calculate(a, b);  // 调用静态方法
        super(result);  // 调用父类构造函数
    }
}
```

静态方法的好处是，可以把复杂的逻辑封装成静态方法，然后在预构造上下文中调用。

### 可以使用控制流语句

在预构造上下文中可以使用各种控制流语句：

```java
// 控制流语句：在预构造上下文中使用控制流
public class FlexibleConstructor extends Parent {
    public FlexibleConstructor(int value, String mode) {
        // 可以使用 if 语句
        if (value < 0) {  // 如果值是负数
            value = 0;  // 设置为 0
        }
        // 可以使用 switch 语句
        switch (mode) {  // 根据模式处理
            case "double":  // 如果是 double 模式
                value = value * 2;  // 值乘以 2
                break;
            case "square":  // 如果是 square 模式
                value = value * value;  // 值平方
                break;
            default:  // 默认情况
                // 不做处理
                break;
        }
        // 可以使用循环（虽然不常用）
        int sum = 0;  // 初始化累加器
        for (int i = 0; i < value; i++) {  // 循环累加
            sum += i;  // 累加
        }
        super(sum);  // 调用父类构造函数
    }
}
```

控制流语句的好处是，可以在预构造上下文中执行复杂的逻辑，比如条件判断、循环处理等。

## 实际应用场景

### 场景1：参数验证和规范化

最常见的场景就是参数验证和规范化，现在可以直接在构造函数里处理：

```java
// 参数验证和规范化：直接在构造函数里处理
public class ValidatedDate extends Date {
    public ValidatedDate(int year, int month, int day) {
        // 在预构造上下文中验证和规范化参数
        if (year < 1900 || year > 2100) {  // 验证年份范围
            throw new IllegalArgumentException("Year must be between 1900 and 2100");  // 抛出异常
        }
        if (month < 1 || month > 12) {  // 验证月份范围
            throw new IllegalArgumentException("Month must be between 1 and 12");  // 抛出异常
        }
        // 规范化月份（从 0 开始）
        int normalizedMonth = month - 1;  // Java 的 Date 月份从 0 开始
        // 验证日期范围（简化版，实际应该考虑月份天数）
        if (day < 1 || day > 31) {  // 验证日期范围
            throw new IllegalArgumentException("Day must be between 1 and 31");  // 抛出异常
        }
        super(year, normalizedMonth, day);  // 调用父类构造函数
    }
}
// 使用示例
public class DateExample {
    public static void main(String[] args) {
        // 正常情况：创建有效日期
        ValidatedDate date1 = new ValidatedDate(2024, 3, 15);  // 正常创建
        System.out.println(date1);
        // 异常情况：无效年份
        try {
            ValidatedDate date2 = new ValidatedDate(1800, 3, 15);  // 会抛出异常
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());  // 输出错误信息
        }
    }
}
```

参数验证和规范化的好处是，可以把所有验证逻辑都写在构造函数里，代码更集中，更容易维护。

### 场景2：参数计算和转换

参数计算和转换也是常见场景，现在可以直接在构造函数里计算：

```java
// 参数计算和转换：直接在构造函数里计算
public class Circle extends Shape {
    private double radius;
    public Circle(double area) {
        // 在预构造上下文中根据面积计算半径
        if (area <= 0) {  // 如果面积不是正数
            throw new IllegalArgumentException("Area must be positive");  // 抛出异常
        }
        // 计算半径：area = π * r^2, 所以 r = sqrt(area / π)
        double calculatedRadius = Math.sqrt(area / Math.PI);  // 计算半径
        super(calculatedRadius);  // 调用父类构造函数
        this.radius = calculatedRadius;  // 初始化字段
    }
    public Circle(double diameter, boolean isDiameter) {
        // 在预构造上下文中根据直径计算半径
        if (isDiameter) {  // 如果参数是直径
            if (diameter <= 0) {  // 验证直径
                throw new IllegalArgumentException("Diameter must be positive");  // 抛出异常
            }
            double calculatedRadius = diameter / 2.0;  // 直径转半径
            super(calculatedRadius);  // 调用父类构造函数
            this.radius = calculatedRadius;  // 初始化字段
        } else {  // 如果参数是半径
            if (diameter <= 0) {  // 验证半径
                throw new IllegalArgumentException("Radius must be positive");  // 抛出异常
            }
            super(diameter);  // 直接调用父类构造函数
            this.radius = diameter;  // 初始化字段
        }
    }
}
```

参数计算和转换的好处是，可以在构造函数里直接处理各种参数形式，代码更灵活。

### 场景3：条件初始化

条件初始化也是常见场景，可以根据不同条件初始化不同的值：

```java
// 条件初始化：根据条件初始化不同的值
public class ConfigurableValue extends Parent {
    private String value;
    public ConfigurableValue(String input, String mode) {
        // 在预构造上下文中根据模式处理输入
        String processedValue;  // 处理后的值
        if (mode == null || mode.isEmpty()) {  // 如果模式为空
            mode = "default";  // 使用默认模式
        }
        switch (mode) {  // 根据模式处理
            case "uppercase":  // 如果是大写模式
                processedValue = input != null ? input.toUpperCase() : "";  // 转大写
                break;
            case "lowercase":  // 如果是小写模式
                processedValue = input != null ? input.toLowerCase() : "";  // 转小写
                break;
            case "trim":  // 如果是修剪模式
                processedValue = input != null ? input.trim() : "";  // 修剪空格
                break;
            default:  // 默认模式
                processedValue = input != null ? input : "";  // 不做处理
                break;
        }
        super(processedValue);  // 调用父类构造函数
        this.value = processedValue;  // 初始化字段
    }
}
```

条件初始化的好处是，可以根据不同条件初始化不同的值，代码更灵活。

## 注意事项和最佳实践

### 1. 预览特性需要启用

JEP 447 是预览特性，编译和运行都需要启用预览特性：

```bash
# 编译时启用预览特性
javac --enable-preview --release 22 Main.java
# 运行时启用预览特性
java --enable-preview Main
```

### 2. 不能引用实例

在预构造上下文中，绝对不能引用正在创建的实例，包括实例字段、实例方法、this 引用等：

```java
// 错误示例：不能在预构造上下文中引用实例
public class WrongExample extends Parent {
    private int x;
    public WrongExample(int value) {
        // 所有这些都会编译错误
        // this.x = value;  // 错误：不能访问实例字段
        // this.method();  // 错误：不能调用实例方法
        // if (this.x > 0) { }  // 错误：不能访问实例字段
        // 正确：只能使用局部变量
        int localValue = value;  // 使用局部变量
        if (localValue < 0) {  // 验证局部变量
            localValue = 0;  // 修改局部变量
        }
        super(localValue);  // 调用父类构造函数
        this.x = localValue;  // 在 super() 之后初始化字段
    }
}
```

### 3. 保持代码简洁

虽然可以在预构造上下文中执行复杂逻辑，但最好保持代码简洁，复杂逻辑可以封装成静态方法：

```java
// 好的实践：复杂逻辑封装成静态方法
public class GoodExample extends Parent {
    public GoodExample(int value) {
        // 复杂逻辑封装成静态方法
        int processed = processValue(value);  // 调用静态方法
        super(processed);  // 调用父类构造函数
    }
    // 静态方法：处理复杂逻辑
    private static int processValue(int value) {
        // 复杂的处理逻辑...
        if (value < 0) value = 0;  // 处理负数
        if (value > 100) value = 100;  // 处理大于 100 的值
        return value * 2;  // 乘以 2
    }
}
// 不好的实践：所有逻辑都写在构造函数里
public class BadExample extends Parent {
    public BadExample(int value) {
        // 所有逻辑都写在构造函数里，代码太长，可读性差
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        value = value * 2;
        // ... 更多逻辑 ...
        super(value);
    }
}
```

### 4. 错误处理要清晰

在预构造上下文中抛出异常时，要确保错误信息清晰：

```java
// 好的实践：清晰的错误信息
public class GoodExample extends Parent {
    public GoodExample(int value) {
        if (value < 0) {  // 如果值小于 0
            throw new IllegalArgumentException(
                "Value must be non-negative, but got: " + value  // 清晰的错误信息
            );
        }
        super(value);  // 调用父类构造函数
    }
}
// 不好的实践：模糊的错误信息
public class BadExample extends Parent {
    public BadExample(int value) {
        if (value < 0) {  // 如果值小于 0
            throw new IllegalArgumentException("Invalid value");  // 模糊的错误信息
        }
        super(value);  // 调用父类构造函数
    }
}
```

## 总结

JEP 447 是 Java 22 引入的一个很实用的预览特性，它允许在 super() 调用之前执行语句，只要这些语句不引用正在创建的实例就行。这功能让构造函数更灵活，代码写起来更自然，可读性也更好。

这玩意儿特别适合需要参数验证、参数计算、字段初始化的场景，不用再写静态辅助方法或者工厂方法了，代码更集中，更容易维护。而且它支持各种控制流语句，可以执行复杂的逻辑。

不过要注意，在预构造上下文中不能引用实例，包括实例字段、实例方法、this 引用等，这是必须的限制，因为在 super() 调用之前实例还没有完全初始化。

好了，今天就聊到这里，兄弟们有啥问题可以在评论区留言，鹏磊看到会回复的。下次咱们聊聊 Java 22 的其他新特性，比如启动多个源文件程序（JEP 458），这玩意儿也挺有意思的。
