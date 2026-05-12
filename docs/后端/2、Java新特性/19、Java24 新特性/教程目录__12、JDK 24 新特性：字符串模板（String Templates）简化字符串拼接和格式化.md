# 12、JDK 24 新特性：字符串模板（String Templates）简化字符串拼接和格式化
- 来源：https://ddkk.com/zhuanlan/java/java24/12.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
写Java代码的时候，最烦的就是字符串拼接了。以前用`+`号拼接，代码写得又臭又长，特别是那种多行字符串，看着就头疼。后来有了`StringBuilder`和`String.format()`，稍微好点，但还是不够优雅。鹏磊我之前写日志、生成SQL、拼接URL这些场景，每次都得写一堆`+`号，代码可读性差，还容易出错。

现在好了，JDK 24终于引入了字符串模板（String Templates）这个特性，虽然还是预览版，但已经能解决不少问题了。这个特性让字符串拼接变得简洁明了，代码写起来也顺手多了。兄弟们别磨叽，咱这就开始整活，把这个特性给整明白。

## 什么是字符串模板

先说说啥是字符串模板。字符串模板是JDK 24引入的一个预览特性，用来简化字符串拼接和格式化。它通过模板表达式（Template Expression）的方式，让你可以在字符串里直接嵌入变量和表达式，不用再写一堆`+`号了。

字符串模板的核心思想是：提供一个统一的机制来处理字符串拼接，同时保证安全性（自动转义特殊字符）。它使用模板处理器（Template Processor）来处理模板表达式，最常用的是`STR`处理器。

以前拼接字符串，得这么写：

```java
// 老写法，用+号拼接
String name = "鹏磊";
int age = 30;
String city = "北京";
String message = "我叫" + name + "，今年" + age + "岁，住在" + city + "。";
System.out.println(message);  // 输出: 我叫鹏磊，今年30岁，住在北京。
```

现在用字符串模板，直接就能这么写：

```java
// 新写法，用字符串模板
String name = "鹏磊";
int age = 30;
String city = "北京";
String message = STR."我叫\{name}，今年\{age}岁，住在\{city}。";
System.out.println(message);  // 输出: 我叫鹏磊，今年30岁，住在北京。
```

是不是清爽多了？代码量少了，逻辑也更清晰，不用再搞那些`+`号的破事了。

## 字符串模板的语法

字符串模板的语法很简单，主要就是模板表达式。模板表达式由三部分组成：模板处理器、点号（`.`）、模板字符串。

### 基本语法

模板表达式的格式是：`处理器.模板字符串`。模板字符串用双引号或三引号包裹，里面用`\{表达式}`来嵌入变量或表达式。

```java
// 基本语法示例
String name = "Alice";
int score = 95;
// 使用STR处理器，\{name}和\{score}会被替换成实际值
String result = STR."学生\{name}的分数是\{score}分";
System.out.println(result);  // 输出: 学生Alice的分数是95分
```

### 模板字符串格式

模板字符串可以用双引号或三引号（用于多行字符串）：

```java
// 单行模板字符串
String singleLine = STR."Hello, \{name}!";
// 多行模板字符串（用三引号）
String multiLine = STR."""
    这是第一行: \{name}
    这是第二行: \{score}
    这是第三行: 结束
    """;
```

### 嵌入表达式

模板字符串里可以嵌入任何Java表达式，不只是变量：

```java
// 嵌入方法调用
String result1 = STR."当前时间: \{LocalDateTime.now()}";
// 嵌入算术表达式
int a = 10;
int b = 20;
String result2 = STR."\{a} + \{b} = \{a + b}";  // 输出: 10 + 20 = 30
// 嵌入条件表达式
int age = 25;
String result3 = STR."\{age >= 18 ? "成年" : "未成年"}";  // 输出: 成年
// 嵌入对象方法调用
String name = "  Java  ";
String result4 = STR."处理后的名字: \{name.trim().toUpperCase()}";  // 输出: 处理后的名字: JAVA
```

## STR处理器

`STR`是JDK 24提供的一个内置模板处理器，全称是`StringTemplate.Processor`。它是最常用的处理器，用来处理字符串模板表达式。

### STR的基本使用

`STR`处理器会自动把模板表达式转换成字符串，处理嵌入的变量和表达式：

```java
// STR处理器的基本使用
String name = "鹏磊";
int age = 30;
// STR处理器处理模板表达式
String message = STR."我叫\{name}，今年\{age}岁";
System.out.println(message);  // 输出: 我叫鹏磊，今年30岁
```

### STR的自动转义

`STR`处理器会自动转义特殊字符，防止注入攻击。这对生成SQL、HTML、JSON这些场景特别有用：

```java
// STR自动转义示例
String userInput = "'; DROP TABLE users; --";  // 恶意输入
// 老写法，容易SQL注入
String sql1 = "SELECT * FROM users WHERE name = '" + userInput + "'";
// 危险！可能被注入攻击
// 新写法，STR自动转义
String sql2 = STR."SELECT * FROM users WHERE name = '\{userInput}'";
// 安全！STR会自动转义特殊字符
```

### STR处理多行字符串

`STR`处理器支持多行字符串，用三引号包裹：

```java
// 多行字符串模板
String name = "鹏磊";
String email = "penglei@example.com";
int age = 30;
String profile = STR."""
    姓名: \{name}
    邮箱: \{email}
    年龄: \{age}
    """;
System.out.println(profile);
// 输出:
// 姓名: 鹏磊
// 邮箱: penglei@example.com
// 年龄: 30
```

## 其他模板处理器

除了`STR`，JDK 24还提供了其他模板处理器，用于不同的场景。

### FMT处理器（格式化）

`FMT`处理器用来格式化字符串，类似`String.format()`，但语法更简洁：

```java
// FMT处理器示例（格式化数字）
double price = 99.99;
int quantity = 5;
// 格式化价格，保留两位小数
String formatted = FMT."价格: %6.2f\{price}, 数量: %d\{quantity}";
System.out.println(formatted);  // 输出: 价格:  99.99, 数量: 5
```

### RAW处理器（原始模板）

`RAW`处理器返回原始的模板对象，不进行字符串转换，可以用来自定义处理逻辑：

```java
// RAW处理器示例
String name = "鹏磊";
StringTemplate template = RAW."Hello, \{name}!";
// 可以获取模板的片段和值
List<String> fragments = template.fragments();  // 获取模板片段
List<Object> values = template.values();  // 获取嵌入的值
System.out.println("片段: " + fragments);  // 输出: [Hello, , !]
System.out.println("值: " + values);  // 输出: [鹏磊]
```

## 实际应用场景

字符串模板在实际开发中有很多应用场景，咱来看看几个常见的。

### 场景1：日志记录

以前写日志，得用`String.format()`或者`+`号拼接，代码又臭又长：

```java
// 老写法，用String.format()
String name = "用户A";
int userId = 12345;
String action = "登录";
log.info(String.format("用户[%s]\\(ID:%d\\)执行了操作:%s", name, userId, action));
// 新写法，用字符串模板
log.info(STR."用户[\{name}]\\(ID:\{userId}\\)执行了操作:\{action}");
```

### 场景2：SQL查询构建

构建SQL查询的时候，字符串模板特别有用，特别是动态查询：

```java
// 构建动态SQL查询
String tableName = "users";
String column = "name";
String value = "鹏磊";
// 用字符串模板构建SQL（注意：实际项目中要用参数化查询防止SQL注入）
String sql = STR."""
    SELECT * FROM \{tableName}
    WHERE \{column} = '\{value}'
    ORDER BY id DESC
    """;
System.out.println(sql);
// 输出:
// SELECT * FROM users
// WHERE name = '鹏磊'
// ORDER BY id DESC
```

### 场景3：HTML生成

生成HTML的时候，字符串模板让代码更清晰：

```java
// 生成HTML内容
String title = "Java教程";
String author = "鹏磊";
String content = "这是教程内容...";
String html = STR."""
    <div class="article">
        <h1>\{title}</h1>
        <p class="author">作者: \{author}</p>
        <div class="content">\{content}</div>
    </div>
    """;
System.out.println(html);
```

### 场景4：URL拼接

拼接URL的时候，字符串模板比`+`号拼接清晰多了：

```java
// 拼接API URL
String baseUrl = "https://api.example.com";
String version = "v1";
String endpoint = "users";
int userId = 12345;
String url = STR."\{baseUrl}/api/\{version}/\{endpoint}/\{userId}";
System.out.println(url);  // 输出: https://api.example.com/api/v1/users/12345
```

### 场景5：错误消息

生成错误消息的时候，字符串模板让消息更清晰：

```java
// 生成错误消息
String fieldName = "email";
String reason = "格式不正确";
String errorMsg = STR."字段 '\{fieldName}' 验证失败: \{reason}";
System.out.println(errorMsg);  // 输出: 字段 'email' 验证失败: 格式不正确
```

## 自定义模板处理器

除了内置的处理器，你还可以自定义模板处理器，实现自己的处理逻辑。

### 实现自定义处理器

自定义处理器需要实现`StringTemplate.Processor`接口：

```java
// 自定义JSON处理器示例
import java.util.StringTemplate;
public class JSONProcessor implements StringTemplate.Processor<String, RuntimeException> {
    @Override
    public String process(StringTemplate template) throws RuntimeException {
        // 获取模板片段和值
        List<String> fragments = template.fragments();
        List<Object> values = template.values();
        // 构建JSON字符串
        StringBuilder json = new StringBuilder("{");
        for (int i = 0; i < fragments.size() - 1; i++) {
            // 处理键值对（简化示例）
            String key = fragments.get(i).trim().replaceAll("[:\\s]+", "");
            Object value = values.get(i);
            json.append("\"").append(key).append("\": ");
            if (value instanceof String) {
                json.append("\"").append(value).append("\"");
            } else {
                json.append(value);
            }
            if (i < fragments.size() - 2) {
                json.append(", ");
            }
        }
        json.append("}");
        return json.toString();
    }
}
// 使用自定义处理器
JSONProcessor JSON = new JSONProcessor();
String name = "鹏磊";
int age = 30;
String json = JSON."name: \{name}, age: \{age}";
System.out.println(json);  // 输出: {"name": "鹏磊", "age": 30}
```

### 处理器的异常处理

自定义处理器可以抛出异常，用来做验证或错误处理：

```java
// 带异常处理的自定义处理器
public class SafeSQLProcessor implements StringTemplate.Processor<String, SQLException> {
    @Override
    public String process(StringTemplate template) throws SQLException {
        List<Object> values = template.values();
        // 检查是否有SQL注入风险
        for (Object value : values) {
            if (value instanceof String) {
                String str = (String) value;
                // 简单的SQL注入检测（实际项目中要用更严格的验证）
                if (str.contains(";") || str.contains("--") || str.contains("DROP")) {
                    throw new SQLException("检测到潜在的SQL注入风险: " + str);
                }
            }
        }
        // 安全处理模板
        return STR.process(template);
    }
}
```

## 性能考虑

字符串模板的性能怎么样？这是很多兄弟关心的问题。

### 编译时优化

字符串模板在编译时会被优化，性能接近`StringBuilder`：

```java
// 字符串模板会被编译器优化
String name = "鹏磊";
int age = 30;
// 编译后，这个表达式会被优化成高效的字符串拼接
String result = STR."我叫\{name}，今年\{age}岁";
```

### 与StringBuilder对比

对于简单的拼接，字符串模板的性能和`StringBuilder`差不多；对于复杂场景，字符串模板可能稍微慢一点，但差距不大：

```java
// 性能测试示例
long start1 = System.nanoTime();
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append("数字: ").append(i).append("\n");
}
String result1 = sb.toString();
long end1 = System.nanoTime();
long start2 = System.nanoTime();
StringBuilder result2 = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    result2.append(STR."数字: \{i}\n");
}
long end2 = System.nanoTime();
// 实际测试中，性能差距很小，可以忽略
```

### 最佳实践

对于性能敏感的场景，建议：

1. 简单拼接用字符串模板，代码更清晰
2. 大量循环拼接用`StringBuilder`，性能更好
3. 格式化用`FMT`处理器，比`String.format()`更简洁

## 预览特性说明

字符串模板在JDK 24中还是预览特性，需要启用预览功能才能用。

### 编译时启用预览

编译的时候需要加`--enable-preview`参数：

```bash
# 编译时启用预览特性
javac --enable-preview --release 24 Main.java
```

### 运行时启用预览

运行的时候也需要加`--enable-preview`参数：

```bash
# 运行时启用预览特性
java --enable-preview Main
```

### Maven配置

如果用Maven，需要在`pom.xml`里配置：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>24</source>
                <target>24</target>
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## 常见问题和注意事项

用字符串模板的时候，有几个地方需要注意。

### 转义字符

模板字符串里的`\{`需要转义成`\\{`，如果想输出字面量`\{`：

```java
// 转义示例
String literal = STR."这是字面量: \\{不会替换}";
System.out.println(literal);  // 输出: 这是字面量: \{不会替换}
```

### null值处理

如果嵌入的值是`null`，`STR`处理器会把它转换成字符串`"null"`：

```java
// null值处理
String name = null;
String result = STR."名字: \{name}";
System.out.println(result);  // 输出: 名字: null
```

### 嵌套模板

可以嵌套使用模板表达式，但要注意可读性：

```java
// 嵌套模板示例
String outer = "外层";
String inner = "内层";
String nested = STR."\{outer} -> \{STR."\{inner}"}";
System.out.println(nested);  // 输出: 外层 -> 内层
```

## 总结

字符串模板是JDK 24引入的一个很实用的特性，虽然还是预览版，但已经能解决不少字符串拼接的问题了。它让代码更简洁、更清晰，还能自动处理转义，提高安全性。

主要优势：

1. **语法简洁**：不用再写一堆`+`号，代码更清晰
2. **安全性高**：自动转义特殊字符，防止注入攻击
3. **功能强大**：支持多行字符串、格式化、自定义处理器
4. **性能不错**：编译时优化，性能接近`StringBuilder`

适用场景：

- 日志记录
- SQL查询构建（注意安全性）
- HTML生成
- URL拼接
- 错误消息生成

虽然还是预览特性，但已经能看到Java在朝着更现代化的方向发展了。兄弟们可以试试，特别是那些经常需要字符串拼接的场景，用起来确实方便。等正式发布后，肯定会成为Java开发的标准做法。
