# 02、JDK 23 新特性：模式匹配增强（JEP 455）：原始类型、instanceof 和 switch 模式匹配实战
- 来源：https://ddkk.com/zhuanlan/java/java23/2.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
你有没有遇到过这样的情况，写代码的时候要判断一个对象是不是某个基本类型，然后还得手动拆箱？以前Java里模式匹配只能处理引用类型，搞得处理基本类型的时候特别别扭。现在JDK 23的JEP 455终于支持原始类型模式匹配了，这下可方便多了。

鹏磊我最近在项目里用这个特性，感觉确实好用，代码简洁了不少。今天咱就好好聊聊这个JEP 455，看看它是怎么让模式匹配变得更强大的。

## JEP 455 的核心改进

JEP 455主要做了这么几件事：首先，允许在所有模式上下文中使用原始类型；其次，在`instanceof`和`switch`语句中支持原始类型模式匹配；最后，统一了引用类型和原始类型的模式匹配语法。这个改进让Java的模式匹配功能更完整了，特别是处理基本类型的时候。

以前Java的模式匹配只能匹配引用类型，像`String`、`Integer`这些。但Java有8种基本类型（`int`、`long`、`double`、`float`、`byte`、`short`、`char`、`boolean`），以前要处理这些类型，得手动拆箱，代码写起来挺麻烦的。现在可以直接用原始类型做模式匹配了，省了不少事。

## instanceof 中的原始类型模式匹配

### 基础用法

最直观的改进就是在`instanceof`里可以直接用原始类型了。看个例子：

```java
// JDK 23之前，得这么写
Object obj = getValue();  // 可能返回Integer对象
if (obj instanceof Integer) {
    Integer i = (Integer) obj;  // 先强制转换
    int value = i.intValue();   // 再手动拆箱
    System.out.println(value * 2);  // 才能用int进行计算
}
```

现在可以直接这样写：

```java
// JDK 23的新写法，简洁多了
Object obj = getValue();
if (obj instanceof int value) {  // 直接匹配int类型，value就是int
    System.out.println(value * 2);  // 直接使用，不用拆箱了
}
```

这样写的好处很明显：代码更简洁，少了一层转换，性能也更好（避免了装箱拆箱的开销）。

### 处理不同类型的原始类型

JEP 455支持所有8种基本类型的模式匹配。看个更复杂的例子：

```java
Object value = getValue();  // 可能返回不同类型的值
// 匹配不同的原始类型
if (value instanceof int i) {
    System.out.println("整数: " + i);
} else if (value instanceof long l) {
    System.out.println("长整数: " + l);
} else if (value instanceof double d) {
    System.out.println("双精度浮点数: " + d);
} else if (value instanceof boolean b) {
    System.out.println("布尔值: " + b);
} else if (value instanceof char c) {
    System.out.println("字符: " + c);
}
```

这种方式在处理不确定类型的值时特别有用，代码逻辑清晰，不用写一堆`instanceof`和强制转换。

### 与引用类型配合使用

原始类型模式匹配可以跟引用类型模式匹配混用，这样能处理更多场景：

```java
Object obj = getObject();
if (obj instanceof String s) {
    // 引用类型模式匹配
    System.out.println("字符串: " + s.toUpperCase());
} else if (obj instanceof int i) {
    // 原始类型模式匹配
    System.out.println("整数: " + i);
} else if (obj instanceof Integer wrapper) {
    // 也可以匹配包装类型
    System.out.println("包装类型: " + wrapper);
}
```

## switch 表达式中的原始类型模式匹配

### switch 中的原始类型匹配

`switch`表达式也支持原始类型模式匹配了，这让`switch`变得更强大。看个例子：

```java
Object value = getValue();
// 使用switch表达式匹配不同的原始类型
String result = switch (value) {
    case int i -> "整数: " + i;  // 匹配int类型
    case long l -> "长整数: " + l;  // 匹配long类型
    case double d -> "浮点数: " + d;  // 匹配double类型
    case boolean b -> "布尔值: " + b;  // 匹配boolean类型
    case String s -> "字符串: " + s;  // 也可以匹配引用类型
    default -> "未知类型";
};
```

这种方式比用`if-else`链更简洁，特别是要处理多个分支的时候。

### switch 语句中的模式匹配

除了`switch`表达式，`switch`语句也支持：

```java
Object value = getValue();
switch (value) {
    case int i -> {
        // 处理int类型
        System.out.println("整数: " + i);
        processInt(i);
    }
    case long l -> {
        // 处理long类型
        System.out.println("长整数: " + l);
        processLong(l);
    }
    case double d -> {
        // 处理double类型
        System.out.println("浮点数: " + d);
        processDouble(d);
    }
    default -> {
        System.out.println("其他类型");
    }
}
```

### 结合守卫条件使用

模式匹配还可以跟守卫条件（guard）结合使用，这样能更精确地匹配：

```java
Object value = getValue();
switch (value) {
    case int i when i > 0 -> "正整数: " + i;  // 匹配大于0的int
    case int i when i < 0 -> "负整数: " + i;  // 匹配小于0的int
    case int i -> "零: " + i;  // 匹配0
    case long l when l > 1000L -> "大长整数: " + l;  // 匹配大于1000的long
    case long l -> "长整数: " + l;
    default -> "其他";
}
```

这种方式让模式匹配更灵活，能根据值的范围做不同的处理。

## 实际应用场景

### 解析用户输入

处理用户输入的时候，经常要判断输入的类型。用原始类型模式匹配就很方便：

```java
public void processUserInput(Object input) {
    switch (input) {
        case int userId -> {
            // 用户输入的是整数ID
            User user = userService.getUserById(userId);
            displayUser(user);
        }
        case String username -> {
            // 用户输入的是字符串用户名
            User user = userService.getUserByUsername(username);
            displayUser(user);
        }
        case double amount -> {
            // 用户输入的是金额
            if (amount > 0) {
                processPayment(amount);
            } else {
                showError("金额必须大于0");
            }
        }
        default -> {
            showError("输入格式不正确");
        }
    }
}
```

### 处理配置值

从配置文件或者命令行参数读取值的时候，类型往往不确定，用模式匹配处理很方便：

```java
public void loadConfig(String key, Object value) {
    switch (value) {
        case int port -> {
            // 配置的是端口号
            serverConfig.setPort(port);
        }
        case boolean enabled -> {
            // 配置的是布尔开关
            feature.setEnabled(enabled);
        }
        case String path -> {
            // 配置的是路径字符串
            config.setPath(path);
        }
        default -> {
            throw new IllegalArgumentException("不支持的配置类型: " + value.getClass());
        }
    }
}
```

### 数据转换

做数据转换的时候，经常要判断源数据的类型，原始类型模式匹配能简化这个过程：

```java
public Number convertToNumber(Object value) {
    return switch (value) {
        case int i -> i;  // int直接返回
        case long l -> l;  // long直接返回
        case double d -> d;  // double直接返回
        case String s -> {
            // 字符串尝试解析
            try {
                return Double.parseDouble(s);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("无法转换为数字: " + s);
            }
        }
        case Integer wrapper -> wrapper.intValue();  // 包装类型拆箱
        case Long wrapper -> wrapper.longValue();
        default -> throw new IllegalArgumentException("不支持的类型: " + value.getClass());
    };
}
```

## 性能考虑

原始类型模式匹配在性能上有优势，主要是不用装箱拆箱了。看个对比：

```java
// 旧方式：有装箱拆箱开销
Object obj = 42;  // 自动装箱成Integer
if (obj instanceof Integer) {
    Integer i = (Integer) obj;  // 强制转换
    int value = i.intValue();   // 手动拆箱
    int result = value * 2;     // 计算
}
// 新方式：没有装箱拆箱开销
Object obj = 42;
if (obj instanceof int value) {  // 直接匹配原始类型
    int result = value * 2;      // 直接计算，性能更好
}
```

在大量数据处理的场景下，这个性能优势还是挺明显的。特别是循环里做类型判断的时候，能省不少开销。

## 注意事项和限制

### 匹配规则

原始类型模式匹配有个重要的规则：只能匹配对应包装类型的对象。比如`instanceof int`只能匹配`Integer`对象，不能匹配其他类型。看个例子：

```java
Object obj1 = Integer.valueOf(42);
Object obj2 = Long.valueOf(42L);
if (obj1 instanceof int i) {  // 这个能匹配，因为obj1是Integer
    System.out.println(i);
}
if (obj2 instanceof int i) {  // 这个不能匹配，因为obj2是Long
    // 不会执行
}
```

### null 处理

模式匹配不会匹配`null`值，这点要注意：

```java
Object obj = null;
if (obj instanceof int i) {  // 不会匹配null
    // 不会执行
} else {
    System.out.println("obj是null或者不是int类型");
}
```

如果需要处理`null`，要单独判断：

```java
Object obj = getValue();
if (obj == null) {
    // 处理null
} else if (obj instanceof int i) {
    // 处理int类型
}
```

### 预览特性

JEP 455还是预览特性，使用的时候需要加`--enable-preview`参数。编译和运行都要加：

```bash
# 编译时
javac --enable-preview --release 23 Main.java
# 运行时
java --enable-preview Main
```

在Maven项目里，可以这样配置：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <release>23</release>
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## 最佳实践

### 优先使用原始类型

能匹配原始类型的时候，优先用原始类型，而不是包装类型。这样性能更好，代码也更简洁：

```java
// 推荐：用原始类型
if (obj instanceof int i) {
    // 处理逻辑
}
// 不推荐：用包装类型
if (obj instanceof Integer i) {
    int value = i.intValue();
    // 处理逻辑
}
```

### 合理使用 switch 表达式

如果有很多分支要处理，用`switch`表达式比`if-else`链更清晰：

```java
// 推荐：用switch表达式
String type = switch (value) {
    case int i -> "整数";
    case long l -> "长整数";
    case double d -> "浮点数";
    default -> "其他";
};
// 不推荐：用if-else链
String type;
if (value instanceof int i) {
    type = "整数";
} else if (value instanceof long l) {
    type = "长整数";
} else if (value instanceof double d) {
    type = "浮点数";
} else {
    type = "其他";
}
```

### 结合守卫条件

需要根据值的范围做不同处理的时候，用守卫条件让代码更清晰：

```java
switch (value) {
    case int i when i > 100 -> handleLargeInt(i);
    case int i when i > 0 -> handlePositiveInt(i);
    case int i -> handleOtherInt(i);
    default -> handleDefault(value);
}
```

## 总结

JEP 455让Java的模式匹配功能更完整了，特别是对原始类型的支持，解决了模式匹配的一个痛点。这个特性让代码更简洁、性能更好，特别是在处理基本类型的时候。

虽然还是预览特性，但这个改进方向是对的，未来应该会稳定下来。兄弟们可以在新项目里试试这个特性，体验一下模式匹配的便利性。不过生产环境用预览特性还是要谨慎，等正式发布再大规模使用更稳妥。

总的来说，JEP 455是个很实用的改进，让Java的模式匹配功能更完整、更实用了。特别是那些要处理多种类型数据的场景，这个特性能帮上大忙。
