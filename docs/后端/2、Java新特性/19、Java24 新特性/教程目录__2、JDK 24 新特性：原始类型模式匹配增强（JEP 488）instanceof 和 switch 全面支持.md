# 2、JDK 24 新特性：原始类型模式匹配增强（JEP 488）instanceof 和 switch 全面支持
- 来源：https://ddkk.com/zhuanlan/java/java24/2.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
搞Java开发这么多年，鹏磊我最烦的就是处理原始类型（primitive types）的时候，特别是用instanceof判断类型，那叫一个麻烦。以前想判断一个Object是不是int类型，得先装箱成Integer，然后再判断，写出来的代码又臭又长，看着就难受。

现在好了，JDK 24 的 JEP 488 终于把这个痛点给解决了。这个特性是第2次预览，让instanceof和switch语句全面支持原始类型，代码能简洁不少，写起来也顺手多了。兄弟们别磨叽，咱这就开始整活，把这个特性给整明白。

## 什么是原始类型模式匹配

先说说啥是原始类型模式匹配。简单来说，就是可以在instanceof和switch语句里直接匹配原始类型（int、long、double、float、boolean、byte、short、char这些），不用再装箱成包装类型了。

以前你想判断一个Object是不是int，得这么写：

```java
// 老写法，得先装箱
Object value = 42;
if (value instanceof Integer) {
    Integer i = (Integer) value;  // 还得强制转换
    int num = i.intValue();  // 再拆箱
    System.out.println("这是整数: " + num);
}
```

现在JDK 24里，直接就能这么写：

```java
// 新写法，直接匹配原始类型
Object value = 42;
if (value instanceof int i) {  // 直接匹配int，变量i自动绑定
    System.out.println("这是整数: " + i);  // 直接用，不用拆箱
}
```

是不是清爽多了？代码量少了，逻辑也更清晰，不用再搞那些装箱拆箱的破事了。

## JEP 488 的核心改进

JEP 488 主要做了两件事：一个是让instanceof支持原始类型模式，另一个是让switch表达式和语句也支持原始类型。咱一个个来看。

### instanceof 支持原始类型

instanceof现在可以直接匹配原始类型了，语法是 `instanceof 原始类型 变量名`。匹配成功后，变量会自动绑定到对应的原始类型值，不用再手动转换。

```java
public class InstanceofPrimitiveDemo {
    public static void processValue(Object value) {
        // 匹配int类型
        if (value instanceof int i) {
            System.out.println("整数: " + i);
            // i 已经是int类型，可以直接用
            int doubled = i * 2;
            System.out.println("翻倍: " + doubled);
        }
        // 匹配long类型
        else if (value instanceof long l) {
            System.out.println("长整数: " + l);
            // l 已经是long类型
            long squared = l * l;
            System.out.println("平方: " + squared);
        }
        // 匹配double类型
        else if (value instanceof double d) {
            System.out.println("双精度浮点数: " + d);
            // d 已经是double类型
            double rounded = Math.round(d);
            System.out.println("四舍五入: " + rounded);
        }
        // 匹配float类型
        else if (value instanceof float f) {
            System.out.println("单精度浮点数: " + f);
        }
        // 匹配boolean类型
        else if (value instanceof boolean b) {
            System.out.println("布尔值: " + b);
            // b 已经是boolean类型
            if (b) {
                System.out.println("这是true");
            }
        }
        // 匹配byte类型
        else if (value instanceof byte by) {
            System.out.println("字节: " + by);
        }
        // 匹配short类型
        else if (value instanceof short s) {
            System.out.println("短整数: " + s);
        }
        // 匹配char类型
        else if (value instanceof char c) {
            System.out.println("字符: " + c);
        }
        else {
            System.out.println("未知类型");
        }
    }
    public static void main(String[] args) {
        // 测试各种原始类型
        processValue(42);           // int
        processValue(100L);         // long
        processValue(3.14);         // double
        processValue(2.5f);         // float
        processValue(true);         // boolean
        processValue((byte) 127);   // byte
        processValue((short) 1000); // short
        processValue('A');         // char
        processValue("字符串");     // String，不匹配
    }
}
```

这个特性用起来确实爽，代码简洁多了，逻辑也更清晰。特别是处理那种从外部系统传过来的数据，类型不确定的时候，用这个特性能省不少事。

### switch 支持原始类型

switch表达式和语句现在也支持原始类型模式了，可以在case标签里直接匹配原始类型。

```java
public class SwitchPrimitiveDemo {
    // switch表达式支持原始类型
    public static int processWithSwitchExpression(Object value) {
        return switch (value) {
            case int i -> {
                // i 是int类型，可以直接用
                System.out.println("处理整数: " + i);
                yield i * 2;  // 返回翻倍后的值
            }
            case long l -> {
                System.out.println("处理长整数: " + l);
                yield (int)(l / 2);  // 返回除以2后的值，转成int
            }
            case double d -> {
                System.out.println("处理双精度浮点数: " + d);
                yield (int) Math.round(d);  // 四舍五入后转int
            }
            case float f -> {
                System.out.println("处理单精度浮点数: " + f);
                yield (int) f;  // 直接转int
            }
            case boolean b -> {
                System.out.println("处理布尔值: " + b);
                yield b ? 1 : 0;  // true返回1，false返回0
            }
            case byte by -> {
                System.out.println("处理字节: " + by);
                yield (int) by;  // 转成int返回
            }
            case short s -> {
                System.out.println("处理短整数: " + s);
                yield (int) s;  // 转成int返回
            }
            case char c -> {
                System.out.println("处理字符: " + c);
                yield (int) c;  // 转成ASCII码返回
            }
            default -> {
                System.out.println("未知类型，返回0");
                yield 0;
            }
        };
    }
    // switch语句也支持原始类型
    public static void processWithSwitchStatement(Object value) {
        switch (value) {
            case int i -> {
                // 处理int类型
                if (i > 0) {
                    System.out.println("正整数: " + i);
                } else if (i < 0) {
                    System.out.println("负整数: " + i);
                } else {
                    System.out.println("零");
                }
            }
            case long l -> {
                // 处理long类型
                System.out.println("长整数范围: " + 
                    (l > Integer.MAX_VALUE ? "超出int范围" : "在int范围内"));
            }
            case double d -> {
                // 处理double类型
                if (Double.isNaN(d)) {
                    System.out.println("不是数字");
                } else if (Double.isInfinite(d)) {
                    System.out.println("无穷大");
                } else {
                    System.out.println("正常浮点数: " + d);
                }
            }
            case boolean b -> {
                // 处理boolean类型
                String result = b ? "真" : "假";
                System.out.println("布尔值: " + result);
            }
            default -> {
                System.out.println("其他类型或null");
            }
        }
    }
    public static void main(String[] args) {
        // 测试switch表达式
        System.out.println("=== switch表达式测试 ===");
        System.out.println("结果: " + processWithSwitchExpression(42));
        System.out.println("结果: " + processWithSwitchExpression(100L));
        System.out.println("结果: " + processWithSwitchExpression(3.14));
        System.out.println("结果: " + processWithSwitchExpression(true));
        System.out.println("\n=== switch语句测试 ===");
        processWithSwitchStatement(42);
        processWithSwitchStatement(-10);
        processWithSwitchStatement(0);
        processWithSwitchStatement(100L);
        processWithSwitchStatement(3.14);
        processWithSwitchStatement(Double.NaN);
        processWithSwitchStatement(true);
    }
}
```

switch支持原始类型后，代码能更简洁，特别是那种需要根据不同类型做不同处理的场景，用switch比一堆if-else清爽多了。

## 类型转换和自动装箱拆箱

原始类型模式匹配在处理类型转换的时候，会自动处理装箱拆箱，不用咱手动搞了。但有些细节得注意，咱看看。

### 自动类型转换

当匹配到原始类型后，变量会自动绑定到对应的原始类型值。如果原始值是包装类型（比如Integer），会自动拆箱；如果是原始类型，就直接用。

```java
public class TypeConversionDemo {
    public static void demonstrateAutoConversion(Object value) {
        // 如果value是Integer对象，会自动拆箱成int
        if (value instanceof int i) {
            System.out.println("匹配到int: " + i);
            // i 是原始int类型，不是Integer对象
            System.out.println("类型: " + i.getClass());  // 这行会编译错误，因为int是原始类型
        }
        // 如果value是Long对象，会自动拆箱成long
        if (value instanceof long l) {
            System.out.println("匹配到long: " + l);
            // l 是原始long类型
        }
        // 如果value是Double对象，会自动拆箱成double
        if (value instanceof double d) {
            System.out.println("匹配到double: " + d);
            // d 是原始double类型
        }
    }
    public static void main(String[] args) {
        // 测试包装类型，会自动拆箱
        demonstrateAutoConversion(Integer.valueOf(42));
        demonstrateAutoConversion(Long.valueOf(100L));
        demonstrateAutoConversion(Double.valueOf(3.14));
        // 测试原始类型（虽然Object不能直接存原始类型，但这里演示概念）
        // 实际使用中，原始类型会被自动装箱
        Integer intObj = 42;  // 自动装箱
        demonstrateAutoConversion(intObj);
    }
}
```

### 类型兼容性

原始类型模式匹配的时候，得注意类型兼容性。比如int和Integer都能匹配`instanceof int`，但String就不能匹配。

```java
public class TypeCompatibilityDemo {
    public static void checkCompatibility(Object value) {
        // int和Integer都能匹配
        if (value instanceof int i) {
            System.out.println("匹配int: " + i);
        }
        // long和Long都能匹配
        if (value instanceof long l) {
            System.out.println("匹配long: " + l);
        }
        // double和Double都能匹配
        if (value instanceof double d) {
            System.out.println("匹配double: " + d);
        }
        // 但String不能匹配原始类型
        if (value instanceof String s) {
            System.out.println("这是字符串: " + s);
            // 下面这行会编译错误，因为String不能匹配int
            // if (s instanceof int i) { ... }
        }
    }
    public static void main(String[] args) {
        checkCompatibility(42);        // int，能匹配
        checkCompatibility(Integer.valueOf(42));  // Integer，也能匹配
        checkCompatibility("hello");   // String，不能匹配原始类型
    }
}
```

## 实际应用场景

原始类型模式匹配在实际开发中能解决不少问题，特别是处理那种类型不确定的数据。咱看看几个常见的应用场景。

### 场景1：处理JSON数据

从JSON解析出来的数据，类型经常不确定，用原始类型模式匹配能简化代码。

```java
import java.util.Map;
public class JsonProcessingDemo {
    // 模拟从JSON解析出来的数据
    public static void processJsonValue(Object jsonValue) {
        // 根据不同类型做不同处理
        String result = switch (jsonValue) {
            case int i -> {
                // 整数类型，可能是年龄、数量等
                System.out.println("解析到整数: " + i);
                yield "整数: " + i;
            }
            case long l -> {
                // 长整数类型，可能是时间戳、大数值等
                System.out.println("解析到长整数: " + l);
                yield "长整数: " + l;
            }
            case double d -> {
                // 浮点数类型，可能是价格、坐标等
                System.out.println("解析到浮点数: " + d);
                yield "浮点数: " + d;
            }
            case boolean b -> {
                // 布尔类型，可能是开关、状态等
                System.out.println("解析到布尔值: " + b);
                yield "布尔值: " + b;
            }
            case String s -> {
                // 字符串类型
                System.out.println("解析到字符串: " + s);
                yield "字符串: " + s;
            }
            case null -> {
                System.out.println("值为null");
                yield "null";
            }
            default -> {
                System.out.println("未知类型: " + jsonValue.getClass());
                yield "未知类型";
            }
        };
        System.out.println("处理结果: " + result);
    }
    // 处理JSON对象中的字段
    public static void processJsonField(String key, Object value) {
        System.out.println("处理字段: " + key);
        // 根据字段名和类型做不同处理
        if ("age".equals(key) && value instanceof int age) {
            // age字段，必须是int类型
            if (age < 0 || age > 150) {
                System.out.println("警告: 年龄值异常: " + age);
            } else {
                System.out.println("年龄: " + age);
            }
        } else if ("price".equals(key) && value instanceof double price) {
            // price字段，必须是double类型
            if (price < 0) {
                System.out.println("警告: 价格不能为负: " + price);
            } else {
                System.out.println("价格: " + price);
            }
        } else if ("isActive".equals(key) && value instanceof boolean isActive) {
            // isActive字段，必须是boolean类型
            System.out.println("激活状态: " + (isActive ? "激活" : "未激活"));
        } else {
            System.out.println("其他字段: " + key + " = " + value);
        }
    }
    public static void main(String[] args) {
        // 模拟处理JSON数据
        processJsonValue(25);           // 年龄
        processJsonValue(1699123456789L);  // 时间戳
        processJsonValue(99.99);       // 价格
        processJsonValue(true);        // 状态
        processJsonValue("用户名");    // 字符串
        processJsonValue(null);        // null值
        System.out.println("\n=== 处理JSON字段 ===");
        processJsonField("age", 25);
        processJsonField("price", 99.99);
        processJsonField("isActive", true);
        processJsonField("name", "张三");
    }
}
```

### 场景2：数据验证和转换

在处理用户输入或者外部数据的时候，经常需要验证类型和做转换，原始类型模式匹配能让代码更简洁。

```java
public class DataValidationDemo {
    // 验证并转换数值
    public static Integer validateAndConvert(Object input) {
        return switch (input) {
            case int i -> {
                // 已经是int，直接返回
                if (i < 0) {
                    System.out.println("警告: 负数: " + i);
                }
                yield i;
            }
            case Integer integer -> {
                // Integer对象，拆箱后返回
                int value = integer;
                if (value < 0) {
                    System.out.println("警告: 负数: " + value);
                }
                yield value;
            }
            case long l -> {
                // long类型，检查范围后转int
                if (l < Integer.MIN_VALUE || l > Integer.MAX_VALUE) {
                    System.out.println("错误: 超出int范围: " + l);
                    yield null;
                }
                yield (int) l;
            }
            case double d -> {
                // double类型，四舍五入后转int
                if (Double.isNaN(d) || Double.isInfinite(d)) {
                    System.out.println("错误: 无效的浮点数: " + d);
                    yield null;
                }
                yield (int) Math.round(d);
            }
            case String s -> {
                // 字符串，尝试解析
                try {
                    int value = Integer.parseInt(s);
                    yield value;
                } catch (NumberFormatException e) {
                    System.out.println("错误: 无法解析为整数: " + s);
                    yield null;
                }
            }
            default -> {
                System.out.println("错误: 不支持的类型: " + 
                    (input != null ? input.getClass() : "null"));
                yield null;
            }
        };
    }
    // 验证布尔值
    public static Boolean validateBoolean(Object input) {
        return switch (input) {
            case boolean b -> b;  // 直接返回
            case Boolean bool -> bool;  // Boolean对象，直接返回
            case String s -> {
                // 字符串，尝试解析
                if ("true".equalsIgnoreCase(s) || "1".equals(s)) {
                    yield true;
                } else if ("false".equalsIgnoreCase(s) || "0".equals(s)) {
                    yield false;
                } else {
                    System.out.println("错误: 无法解析为布尔值: " + s);
                    yield null;
                }
            }
            case int i -> i != 0;  // 整数，非0为true
            default -> {
                System.out.println("错误: 不支持的类型: " + 
                    (input != null ? input.getClass() : "null"));
                yield null;
            }
        };
    }
    public static void main(String[] args) {
        // 测试数据验证和转换
        System.out.println("=== 数值验证和转换 ===");
        System.out.println("结果: " + validateAndConvert(42));
        System.out.println("结果: " + validateAndConvert(Integer.valueOf(100)));
        System.out.println("结果: " + validateAndConvert(1000L));
        System.out.println("结果: " + validateAndConvert(3.7));
        System.out.println("结果: " + validateAndConvert("123"));
        System.out.println("结果: " + validateAndConvert("abc"));
        System.out.println("\n=== 布尔值验证 ===");
        System.out.println("结果: " + validateBoolean(true));
        System.out.println("结果: " + validateBoolean(Boolean.FALSE));
        System.out.println("结果: " + validateBoolean("true"));
        System.out.println("结果: " + validateBoolean("1"));
        System.out.println("结果: " + validateBoolean(42));
        System.out.println("结果: " + validateBoolean(0));
    }
}
```

### 场景3：类型分发和处理

在处理不同类型数据的时候，用原始类型模式匹配能实现更清晰的类型分发。

```java
public class TypeDispatchDemo {
    // 统一的处理接口
    public static void processData(Object data) {
        // 根据类型分发到不同的处理逻辑
        switch (data) {
            case int i -> processInt(i);
            case long l -> processLong(l);
            case double d -> processDouble(d);
            case boolean b -> processBoolean(b);
            case String s -> processString(s);
            case null -> processNull();
            default -> processUnknown(data);
        }
    }
    // 处理int类型
    private static void processInt(int value) {
        System.out.println("处理整数: " + value);
        // 可以做一些int特有的处理
        if (value % 2 == 0) {
            System.out.println("  是偶数");
        } else {
            System.out.println("  是奇数");
        }
    }
    // 处理long类型
    private static void processLong(long value) {
        System.out.println("处理长整数: " + value);
        // 可以做一些long特有的处理
        if (value > Integer.MAX_VALUE) {
            System.out.println("  超出int范围");
        }
    }
    // 处理double类型
    private static void processDouble(double value) {
        System.out.println("处理浮点数: " + value);
        // 可以做一些double特有的处理
        if (value == (int) value) {
            System.out.println("  是整数");
        } else {
            System.out.println("  是小数");
        }
    }
    // 处理boolean类型
    private static void processBoolean(boolean value) {
        System.out.println("处理布尔值: " + value);
        // 可以做一些boolean特有的处理
        System.out.println("  逻辑值: " + (value ? "真" : "假"));
    }
    // 处理String类型
    private static void processString(String value) {
        System.out.println("处理字符串: " + value);
        // 可以做一些String特有的处理
        System.out.println("  长度: " + value.length());
    }
    // 处理null
    private static void processNull() {
        System.out.println("处理null值");
    }
    // 处理未知类型
    private static void processUnknown(Object value) {
        System.out.println("处理未知类型: " + value.getClass());
    }
    public static void main(String[] args) {
        // 测试类型分发
        processData(42);
        processData(100L);
        processData(3.14);
        processData(true);
        processData("hello");
        processData(null);
        processData(new Object());
    }
}
```

## 与现有特性的结合

原始类型模式匹配可以和其他Java特性结合使用，比如记录类（Record）、密封类（Sealed Class）等，能写出更强大的代码。

### 与记录类结合

记录类和原始类型模式匹配结合，能更优雅地处理数据。

```java
// 定义一个记录类
public record Point(int x, int y) {
    // 记录类可以包含方法
    public double distance() {
        return Math.sqrt(x * x + y * y);
    }
}
public class RecordWithPrimitiveDemo {
    // 处理不同类型的坐标数据
    public static void processCoordinate(Object coord) {
        switch (coord) {
            case Point p -> {
                // 匹配记录类
                System.out.println("记录类坐标: (" + p.x() + ", " + p.y() + ")");
                System.out.println("距离: " + p.distance());
            }
            case int[] arr when arr.length == 2 -> {
                // 匹配int数组，且长度为2
                System.out.println("数组坐标: (" + arr[0] + ", " + arr[1] + ")");
            }
            case double[] arr when arr.length == 2 -> {
                // 匹配double数组，且长度为2
                System.out.println("浮点数组坐标: (" + arr[0] + ", " + arr[1] + ")");
            }
            default -> {
                System.out.println("不支持的坐标格式");
            }
        }
    }
    // 处理混合类型的数据
    public static void processMixedData(Object data) {
        switch (data) {
            case int i -> {
                System.out.println("整数: " + i);
            }
            case double d -> {
                System.out.println("浮点数: " + d);
            }
            case Point p -> {
                System.out.println("点: " + p);
            }
            case String s -> {
                System.out.println("字符串: " + s);
            }
            default -> {
                System.out.println("其他类型");
            }
        }
    }
    public static void main(String[] args) {
        // 测试记录类
        Point point = new Point(3, 4);
        processCoordinate(point);
        // 测试数组
        int[] intCoords = {5, 6};
        processCoordinate(intCoords);
        double[] doubleCoords = {7.5, 8.5};
        processCoordinate(doubleCoords);
        // 测试混合数据
        System.out.println("\n=== 混合数据处理 ===");
        processMixedData(42);
        processMixedData(3.14);
        processMixedData(new Point(1, 2));
        processMixedData("hello");
    }
}
```

### 与守卫模式结合

原始类型模式匹配可以和守卫模式（guarded pattern）结合，实现更复杂的条件判断。

```java
public class GuardedPatternDemo {
    // 使用守卫模式进行条件判断
    public static void processWithGuard(Object value) {
        switch (value) {
            // 匹配int，且值大于0
            case int i when i > 0 -> {
                System.out.println("正整数: " + i);
            }
            // 匹配int，且值小于0
            case int i when i < 0 -> {
                System.out.println("负整数: " + i);
            }
            // 匹配int，且值为0
            case int i when i == 0 -> {
                System.out.println("零");
            }
            // 匹配long，且值在int范围内
            case long l when l >= Integer.MIN_VALUE && l <= Integer.MAX_VALUE -> {
                System.out.println("长整数（在int范围内）: " + l);
            }
            // 匹配long，且值超出int范围
            case long l -> {
                System.out.println("长整数（超出int范围）: " + l);
            }
            // 匹配double，且是有效数字
            case double d when !Double.isNaN(d) && !Double.isInfinite(d) -> {
                System.out.println("有效浮点数: " + d);
            }
            // 匹配double，且是NaN
            case double d when Double.isNaN(d) -> {
                System.out.println("NaN（不是数字）");
            }
            // 匹配double，且是无穷大
            case double d when Double.isInfinite(d) -> {
                System.out.println("无穷大: " + d);
            }
            // 匹配boolean
            case boolean b -> {
                System.out.println("布尔值: " + b);
            }
            default -> {
                System.out.println("其他类型");
            }
        }
    }
    // 处理数值范围
    public static String categorizeNumber(Object value) {
        return switch (value) {
            case int i when i >= 0 && i <= 100 -> "小整数: " + i;
            case int i when i > 100 && i <= 1000 -> "中等整数: " + i;
            case int i when i > 1000 -> "大整数: " + i;
            case int i -> "负整数: " + i;
            case long l when l > Integer.MAX_VALUE -> "超大整数: " + l;
            case long l -> "长整数: " + l;
            case double d when d >= 0 && d < 1 -> "小数: " + d;
            case double d when d >= 1 && d < 100 -> "普通浮点数: " + d;
            case double d -> "大浮点数: " + d;
            default -> "非数值类型";
        };
    }
    public static void main(String[] args) {
        // 测试守卫模式
        System.out.println("=== 守卫模式测试 ===");
        processWithGuard(42);
        processWithGuard(-10);
        processWithGuard(0);
        processWithGuard(100L);
        processWithGuard(3000000000L);
        processWithGuard(3.14);
        processWithGuard(Double.NaN);
        processWithGuard(Double.POSITIVE_INFINITY);
        processWithGuard(true);
        System.out.println("\n=== 数值分类 ===");
        System.out.println(categorizeNumber(50));
        System.out.println(categorizeNumber(500));
        System.out.println(categorizeNumber(5000));
        System.out.println(categorizeNumber(-10));
        System.out.println(categorizeNumber(3000000000L));
        System.out.println(categorizeNumber(0.5));
        System.out.println(categorizeNumber(50.5));
        System.out.println(categorizeNumber(500.5));
    }
}
```

## 性能考虑

原始类型模式匹配在性能上也有优势，因为避免了不必要的装箱拆箱操作，减少了对象创建和内存分配。

### 性能对比

咱写个简单的性能测试，看看新旧写法的性能差异。

```java
public class PerformanceDemo {
    // 旧写法：使用包装类型
    public static int processOldWay(Object value) {
        if (value instanceof Integer) {
            Integer i = (Integer) value;
            return i.intValue() * 2;
        } else if (value instanceof Long) {
            Long l = (Long) value;
            return (int)(l.longValue() / 2);
        } else if (value instanceof Double) {
            Double d = (Double) value;
            return (int) Math.round(d.doubleValue());
        }
        return 0;
    }
    // 新写法：使用原始类型模式匹配
    public static int processNewWay(Object value) {
        return switch (value) {
            case int i -> i * 2;
            case long l -> (int)(l / 2);
            case double d -> (int) Math.round(d);
            default -> 0;
        };
    }
    public static void main(String[] args) {
        // 准备测试数据
        Object[] testData = new Object[1000000];
        for (int i = 0; i < testData.length; i++) {
            if (i % 3 == 0) {
                testData[i] = i;  // int
            } else if (i % 3 == 1) {
                testData[i] = (long) i;  // long
            } else {
                testData[i] = (double) i;  // double
            }
        }
        // 测试旧写法
        long startTime = System.nanoTime();
        int sum1 = 0;
        for (Object value : testData) {
            sum1 += processOldWay(value);
        }
        long oldTime = System.nanoTime() - startTime;
        // 测试新写法
        startTime = System.nanoTime();
        int sum2 = 0;
        for (Object value : testData) {
            sum2 += processNewWay(value);
        }
        long newTime = System.nanoTime() - startTime;
        System.out.println("旧写法耗时: " + oldTime / 1_000_000 + " ms");
        System.out.println("新写法耗时: " + newTime / 1_000_000 + " ms");
        System.out.println("性能提升: " + 
            String.format("%.2f%%", (1.0 - (double)newTime / oldTime) * 100));
        System.out.println("结果验证: " + (sum1 == sum2 ? "通过" : "失败"));
    }
}
```

虽然性能测试的结果会因环境而异，但新写法避免了装箱拆箱，理论上应该更快，特别是在大量数据处理的时候。

## 最佳实践

用原始类型模式匹配的时候，有几个最佳实践值得注意。

### 1. 优先使用switch表达式

switch表达式比if-else链更简洁，特别是在需要返回值的时候。

```java
public class BestPracticeDemo {
    // 推荐：使用switch表达式
    public static int processValueGood(Object value) {
        return switch (value) {
            case int i -> i * 2;
            case long l -> (int)(l / 2);
            case double d -> (int) Math.round(d);
            default -> 0;
        };
    }
    // 不推荐：使用if-else链
    public static int processValueBad(Object value) {
        if (value instanceof int i) {
            return i * 2;
        } else if (value instanceof long l) {
            return (int)(l / 2);
        } else if (value instanceof double d) {
            return (int) Math.round(d);
        }
        return 0;
    }
}
```

### 2. 合理使用守卫模式

守卫模式能让代码更清晰，但别过度使用，否则会影响可读性。

```java
public class GuardBestPractice {
    // 推荐：合理的守卫条件
    public static String categorizeGood(Object value) {
        return switch (value) {
            case int i when i > 0 -> "正整数";
            case int i when i < 0 -> "负整数";
            case int i -> "零";
            case double d when d > 0 -> "正浮点数";
            case double d when d < 0 -> "负浮点数";
            default -> "其他";
        };
    }
    // 不推荐：过度复杂的守卫条件
    public static String categorizeBad(Object value) {
        return switch (value) {
            case int i when i > 0 && i < 100 && i % 2 == 0 && i % 3 == 0 -> {
                // 条件太复杂，应该提取成方法
                yield "复杂的条件";
            }
            default -> "其他";
        };
    }
    // 推荐：复杂条件提取成方法
    private static boolean isSpecialNumber(int i) {
        return i > 0 && i < 100 && i % 2 == 0 && i % 3 == 0;
    }
    public static String categorizeBetter(Object value) {
        return switch (value) {
            case int i when isSpecialNumber(i) -> "特殊数字";
            default -> "其他";
        };
    }
}
```

### 3. 处理null值

记得处理null值，避免空指针异常。

```java
public class NullHandlingDemo {
    // 推荐：明确处理null
    public static String processWithNull(Object value) {
        return switch (value) {
            case null -> "值为null";
            case int i -> "整数: " + i;
            case long l -> "长整数: " + l;
            default -> "其他类型";
        };
    }
    // 不推荐：忽略null处理
    public static String processWithoutNull(Object value) {
        // 如果value是null，这里可能会出问题
        return switch (value) {
            case int i -> "整数: " + i;
            case long l -> "长整数: " + l;
            default -> "其他类型";
        };
    }
}
```

### 4. 保持代码简洁

原始类型模式匹配的优势就是简洁，别写得太复杂。

```java
public class SimplicityDemo {
    // 推荐：简洁明了
    public static int doubleValue(Object value) {
        return switch (value) {
            case int i -> i * 2;
            case long l -> (int)(l * 2);
            default -> 0;
        };
    }
    // 不推荐：过度复杂
    public static int doubleValueComplex(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof int i) {
            if (i < 0) {
                return -i * 2;
            } else {
                return i * 2;
            }
        } else if (value instanceof long l) {
            if (l < 0) {
                return (int)(-l * 2);
            } else {
                return (int)(l * 2);
            }
        }
        return 0;
    }
}
```

## 常见问题和注意事项

用原始类型模式匹配的时候，可能会遇到一些问题，咱看看怎么解决。

### 问题1：类型擦除的影响

泛型类型擦除可能会影响模式匹配，需要注意。

```java
import java.util.List;
public class TypeErasureDemo {
    // 注意：由于类型擦除，List<Integer>和List<String>在运行时都是List
    public static void processList(List<?> list) {
        // 不能直接匹配List<Integer>，因为类型擦除
        // case List<Integer> li -> { ... }  // 编译错误
        // 可以匹配List本身
        if (list instanceof List) {
            System.out.println("这是一个List");
        }
        // 对于原始类型，可以直接匹配
        Object value = list.get(0);
        if (value instanceof int i) {
            System.out.println("第一个元素是int: " + i);
        }
    }
}
```

### 问题2：装箱类型的处理

原始类型模式匹配会自动处理装箱类型，但要注意边界情况。

```java
public class BoxingDemo {
    public static void processBoxed(Object value) {
        // Integer会自动拆箱匹配int
        if (value instanceof int i) {
            System.out.println("匹配到int: " + i);
        }
        // 但如果是Integer对象，想获取Integer本身，需要单独处理
        if (value instanceof Integer integer) {
            System.out.println("Integer对象: " + integer);
            // 可以获取Integer的方法
            System.out.println("字节数: " + integer.byteValue());
        }
        // 如果想同时匹配int和Integer，需要两个case
        switch (value) {
            case int i -> System.out.println("原始int: " + i);
            case Integer integer -> System.out.println("Integer对象: " + integer);
            default -> System.out.println("其他类型");
        }
    }
}
```

### 问题3：switch的完整性

switch表达式必须覆盖所有可能的情况，或者有default分支。

```java
public class CompletenessDemo {
    // 编译错误：switch表达式不完整，缺少default
    // public static int processIncomplete(Object value) {
    //     return switch (value) {
    //         case int i -> i * 2;
    //         case long l -> (int)(l / 2);
    //         // 缺少default，编译错误
    //     };
    // }
    // 正确：有default分支
    public static int processComplete(Object value) {
        return switch (value) {
            case int i -> i * 2;
            case long l -> (int)(l / 2);
            default -> 0;  // 必须有default
        };
    }
}
```

## 迁移指南

如果兄弟们现在用的是旧版本Java，想迁移到JDK 24用原始类型模式匹配，可以按这个步骤来。

### 步骤1：启用预览特性

JEP 488是预览特性，需要启用预览功能。

```bash
# 编译时启用预览
javac --enable-preview --release 24 YourClass.java
# 运行时启用预览
java --enable-preview YourClass
```

### 步骤2：逐步迁移代码

不用一次性改完，可以逐步迁移。

```java
public class MigrationDemo {
    // 旧代码：使用包装类型
    public static void oldCode(Object value) {
        if (value instanceof Integer) {
            Integer i = (Integer) value;
            System.out.println("整数: " + i);
        } else if (value instanceof Long) {
            Long l = (Long) value;
            System.out.println("长整数: " + l);
        }
    }
    // 新代码：使用原始类型模式匹配
    public static void newCode(Object value) {
        if (value instanceof int i) {
            System.out.println("整数: " + i);
        } else if (value instanceof long l) {
            System.out.println("长整数: " + l);
        }
    }
    // 或者用switch表达式
    public static void newCodeWithSwitch(Object value) {
        switch (value) {
            case int i -> System.out.println("整数: " + i);
            case long l -> System.out.println("长整数: " + l);
            default -> System.out.println("其他类型");
        }
    }
}
```

### 步骤3：测试和验证

迁移后要好好测试，确保功能正常。

```java
public class MigrationTest {
    public static void testMigration(Object[] testCases) {
        for (Object testCase : testCases) {
            // 测试新代码
            processWithPrimitivePattern(testCase);
        }
    }
    private static void processWithPrimitivePattern(Object value) {
        switch (value) {
            case int i -> {
                assert i >= Integer.MIN_VALUE && i <= Integer.MAX_VALUE;
                System.out.println("测试通过: int " + i);
            }
            case long l -> {
                assert l >= Long.MIN_VALUE && l <= Long.MAX_VALUE;
                System.out.println("测试通过: long " + l);
            }
            default -> System.out.println("测试通过: 其他类型");
        }
    }
}
```

## 总结

JEP 488 原始类型模式匹配增强这个特性，确实让Java代码更简洁了。instanceof和switch全面支持原始类型，不用再搞那些装箱拆箱的破事，代码量少了，逻辑也更清晰。

主要优势：

1. **代码更简洁**：不用手动装箱拆箱，代码量减少
2. **性能更好**：避免不必要的对象创建，减少内存分配
3. **类型安全**：编译时就能检查类型，减少运行时错误
4. **可读性更强**：代码逻辑更清晰，维护更容易

适用场景：

- 处理JSON数据、外部API返回的数据
- 数据验证和类型转换
- 类型分发和处理
- 需要根据不同类型做不同处理的场景

注意事项：

- 这是预览特性，需要启用`--enable-preview`
- 记得处理null值，避免空指针异常
- switch表达式必须完整，要有default分支
- 注意类型擦除对泛型的影响

虽然还是预览特性，但已经能看到Java在朝着更现代、更简洁的方向发展。兄弟们可以在项目中试试，特别是那种需要处理多种类型数据的场景，用这个特性能省不少事。

好了，关于JEP 488原始类型模式匹配增强的内容就讲到这。下一期咱讲灵活构造函数体（JEP 492），那个特性也挺有意思的，能让构造函数写得更灵活。兄弟们有啥问题可以在评论区留言，鹏磊会尽量回复。
