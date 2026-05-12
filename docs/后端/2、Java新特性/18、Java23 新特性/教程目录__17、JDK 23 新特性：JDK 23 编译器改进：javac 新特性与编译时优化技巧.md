# 17、JDK 23 新特性：JDK 23 编译器改进：javac 新特性与编译时优化技巧
- 来源：https://ddkk.com/zhuanlan/java/java23/17.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
写Java代码的时候，编译速度、编译时检查、代码生成质量这些都很重要，但是javac以前的功能比较基础，很多优化得靠JIT编译器在运行时做。JDK 23对javac做了不少改进，增加了新特性，也优化了编译过程，让编译更快、检查更严格、生成的代码质量更高。

鹏磊我之前做大型项目的时候，编译时间特别长，有时候改一行代码得等好几分钟，特别烦。现在javac有了更多优化选项，编译速度提升了不少。而且编译时的检查也更严格了，能提前发现很多问题，不用等到运行时才发现。

JDK 23的编译器改进主要包括：类文件API让类文件操作更方便，Markdown文档注释让文档更易读，模式匹配增强让代码更简洁，流收集器增强让数据处理更灵活。这些改进让Java开发体验更好了。

## 类文件API（JEP 466）

### 类文件API的核心功能

类文件API提供了标准化的方式来解析、生成和转换Java类文件，不需要直接操作字节码。

类文件API的优势：

1. **类型安全**：提供类型安全的API，避免直接操作字节码
2. **易于使用**：API设计友好，比直接操作字节码简单
3. **标准化**：是标准API，未来版本会继续支持
4. **功能完整**：支持解析、生成、转换等操作

```java
// 使用类文件API解析类文件
import java.lang.classfile.*;
// 解析类文件
ClassFile cf = ClassFile.of();
ClassModel model = cf.parse(bytecode);  // 解析字节码
// 访问类信息
String className = model.thisClass().name().stringValue();
List<MethodModel> methods = model.methods();
// 遍历方法
for (MethodModel method : methods) {
    String methodName = method.methodName().stringValue();
    CodeModel code = method.code().orElse(null);
    if (code != null) {
        // 访问字节码指令
        for (CodeElement element : code) {
            // 处理指令
        }
    }
}
```

类文件API让类文件操作更方便，不需要直接操作字节码。

### 生成类文件

可以用类文件API生成类文件：

```java
// 使用类文件API生成类文件
import java.lang.classfile.*;
// 生成类文件
ClassFile cf = ClassFile.of();
byte[] bytecode = cf.build(ClassDesc.of("com.example.MyClass"), classBuilder -> {
    classBuilder.withFlags(ClassFile.ACC_PUBLIC);
    // 添加字段
    classBuilder.withField("value", ClassDesc.of("I"), fieldBuilder -> {
        fieldBuilder.withFlags(ClassFile.ACC_PRIVATE);
    });
    // 添加方法
    classBuilder.withMethod("getValue", MethodTypeDesc.of(ClassDesc.of("I")), 
        methodBuilder -> {
            methodBuilder.withFlags(ClassFile.ACC_PUBLIC);
            methodBuilder.withCode(codeBuilder -> {
                codeBuilder.aload(0);  // 加载this
                codeBuilder.getfield(ClassDesc.of("com.example.MyClass"), 
                    "value", ClassDesc.of("I"));  // 获取字段
                codeBuilder.ireturn();  // 返回int
            });
        });
});
```

类文件API让类文件生成更方便，代码更清晰。

### 转换类文件

可以用类文件API转换类文件：

```java
// 使用类文件API转换类文件
import java.lang.classfile.*;
// 转换类文件，添加日志
ClassFile cf = ClassFile.of();
byte[] originalBytecode = ...;  // 原始字节码
byte[] transformedBytecode = cf.transform(originalBytecode, 
    (classBuilder, classElement) -> {
        if (classElement instanceof MethodModel method) {
            // 转换方法，添加日志
            classBuilder.withMethod(method.methodName(), 
                method.methodTypeSymbol(), method.flags().flagsMask(),
                methodBuilder -> {
                    methodBuilder.withCode(codeBuilder -> {
                        // 添加日志代码
                        codeBuilder.ldc("Method called: " + method.methodName());
                        codeBuilder.invokestatic(ClassDesc.of("java.lang.System"), 
                            "out", MethodTypeDesc.of(ClassDesc.of("java.io.PrintStream")));
                        codeBuilder.invokevirtual(ClassDesc.of("java.io.PrintStream"), 
                            "println", MethodTypeDesc.of(ClassDesc.of("V"), 
                            ClassDesc.of("java.lang.String")));
                        // 复制原始代码
                        method.code().ifPresent(code -> {
                            for (CodeElement element : code) {
                                codeBuilder.with(element);
                            }
                        });
                    });
                });
        } else {
            classBuilder.with(classElement);  // 保留其他元素
        }
    });
```

类文件API让类文件转换更方便，可以轻松添加功能。

## Markdown文档注释（JEP 467）

### Markdown文档注释的优势

Markdown文档注释让JavaDoc更易读、更易写：

```java
/**
 * # 用户服务类
 * 
 * 提供用户相关的操作，包括：
 * - 用户注册
 * - 用户登录
 * - 用户信息查询
 * 
 * ## 使用示例
 * 
 * ```java
 * UserService service = new UserService();
 * User user = service.getUser("123");
 * ```
 * 
 * @param userId 用户ID
 * @return 用户对象
 * 
 * > **注意**：用户ID不能为空
 */
public User getUser(String userId) {
    // ...
}
```

Markdown文档注释让文档更易读，支持代码块、列表、强调等格式。

### Markdown语法支持

支持常用的Markdown语法：

```java
/**
 * ## 方法说明
 * 
 * 这是一个**重要**的方法，用于处理*关键*业务逻辑。
 * 
 * ### 参数说明
 * 
 * 1. `param1` - 第一个参数
 * 2. `param2` - 第二个参数
 * 
 * ### 返回值
 * 
 * 返回处理后的结果，格式如下：
 * 
 * ```
 * {
 *   "status": "success",
 *   "data": {...}
 * }
 * ```
 * 
 * ### 异常
 * 
 * - `IllegalArgumentException` - 参数无效时抛出
 * - `NullPointerException` - 参数为null时抛出
 * 
 * @see OtherClass#otherMethod()
 */
public Result process(String param1, int param2) {
    // ...
}
```

Markdown语法让文档更丰富，可读性更好。

## 模式匹配增强（JEP 455）

### 原始类型模式匹配

模式匹配现在支持原始类型，让代码更简洁：

```java
// 原始类型模式匹配
public String process(Object obj) {
    return switch (obj) {
        case int i -> "Integer: " + i;  // 原始类型int
        case long l -> "Long: " + l;  // 原始类型long
        case double d -> "Double: " + d;  // 原始类型double
        case String s -> "String: " + s;
        default -> "Other: " + obj;
    };
}
// instanceof也支持原始类型
if (obj instanceof int i) {
    System.out.println("Integer: " + i);
}
```

原始类型模式匹配让代码更简洁，不需要装箱拆箱。

### 模式匹配优化

编译器会对模式匹配进行优化：

```java
// 编译器优化的模式匹配
public String process(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "Positive: " + i;  // 带守卫的模式
        case Integer i when i < 0 -> "Negative: " + i;
        case Integer i -> "Zero: " + i;
        case String s when s.length() > 10 -> "Long string: " + s;
        case String s -> "Short string: " + s;
        default -> "Other";
    };
}
```

编译器会优化模式匹配，生成高效的代码。

## 流收集器增强（JEP 473）

### 自定义中间操作

流收集器现在支持自定义中间操作：

```java
// 自定义中间操作
public <T> Stream<T> customFilter(Stream<T> stream, Predicate<T> predicate) {
    return stream.collect(Collectors.filtering(predicate, 
        Collectors.toList())).stream();
}
// 使用自定义中间操作
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
List<Integer> evens = numbers.stream()
    .collect(Collectors.filtering(n -> n % 2 == 0, 
        Collectors.toList()));
```

自定义中间操作让流处理更灵活。

### 流管道优化

编译器会对流管道进行优化：

```java
// 编译器优化的流管道
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
List<Integer> result = numbers.stream()
    .filter(n -> n > 2)  // 过滤
    .map(n -> n * 2)  // 映射
    .collect(Collectors.toList());  // 收集
// 编译器可能会优化为：
// 1. 融合过滤和映射操作
// 2. 减少中间集合的创建
// 3. 优化收集器操作
```

编译器会优化流管道，减少中间操作的开销。

## 编译时优化技巧

### 技巧1：启用增量编译

增量编译可以只编译修改的文件，提升编译速度：

```bash
# 启用增量编译
javac -Xincremental MyClass.java
# 或者用Maven配置
# <plugin>
#   <groupId>org.apache.maven.plugins</groupId>
#   <artifactId>maven-compiler-plugin</artifactId>
#   <configuration>
#     <compilerArgs>
#       <arg>-Xincremental</arg>
#     </compilerArgs>
#   </configuration>
# </plugin>
```

增量编译可以大幅提升编译速度，特别是大型项目。

### 技巧2：使用并行编译

并行编译可以利用多核CPU，提升编译速度：

```bash
# 启用并行编译
javac -J-XX:+UseParallelGC -J-XX:ParallelGCThreads=4 MyClass.java
# 或者用Maven配置
# <plugin>
#   <groupId>org.apache.maven.plugins</groupId>
#   <artifactId>maven-compiler-plugin</artifactId>
#   <configuration>
#     <fork>true</fork>
#     <meminitial>128m</meminitial>
#     <maxmem>512m</maxmem>
#   </configuration>
# </plugin>
```

并行编译可以充分利用多核CPU，提升编译速度。

### 技巧3：优化编译选项

使用合适的编译选项可以提升编译速度和代码质量：

```bash
# 优化编译选项
javac -Xlint:all  # 启用所有警告检查
javac -Xmaxwarns 100  # 限制警告数量
javac -Xprefer:source  # 优先使用源文件
javac -Xmaxerrs 100  # 限制错误数量
```

合适的编译选项可以提升编译体验。

### 技巧4：使用编译时注解处理

编译时注解处理可以在编译时生成代码，减少运行时开销：

```java
// 使用编译时注解处理
@GenerateBuilder
public class User {
    private String name;
    private int age;
    // 编译时会生成Builder类
}
// 使用生成的Builder
User user = User.builder()
    .name("John")
    .age(30)
    .build();
```

编译时注解处理可以减少运行时开销，提升性能。

## 编译性能优化

### 减少编译时间

可以通过以下方式减少编译时间：

1. **使用增量编译**：只编译修改的文件
2. **使用并行编译**：利用多核CPU
3. **优化依赖管理**：减少不必要的依赖
4. **使用编译缓存**：缓存编译结果

```bash
# 使用编译缓存
javac -Xprefer:source  # 优先使用源文件，减少类文件查找
javac -Xmaxwarns 0  # 禁用警告，减少检查时间
```

减少编译时间可以提升开发效率。

### 优化代码生成

编译器会优化代码生成，提升运行时性能：

```java
// 编译器优化的代码
public int calculate(int a, int b) {
    return a + b;  // 编译器可能会内联
}
// 编译器优化的字符串拼接
public String concat(String a, String b) {
    return a + b;  // 编译器会优化为StringBuilder
}
```

编译器会优化代码生成，提升运行时性能。

## 最佳实践

### 1. 使用合适的编译选项

根据项目需求选择合适的编译选项：

```bash
# 开发环境：启用所有检查
javac -Xlint:all -Werror MyClass.java
# 生产环境：优化编译
javac -O MyClass.java
```

合适的编译选项可以提升代码质量。

### 2. 启用编译时检查

启用编译时检查可以提前发现问题：

```bash
# 启用所有警告检查
javac -Xlint:all MyClass.java
# 将警告视为错误
javac -Werror MyClass.java
```

编译时检查可以提前发现问题，减少运行时错误。

### 3. 使用类文件API

使用类文件API可以更方便地操作类文件：

```java
// 使用类文件API
ClassFile cf = ClassFile.of();
ClassModel model = cf.parse(bytecode);
// 处理类文件
```

类文件API让类文件操作更方便。

### 4. 使用Markdown文档

使用Markdown文档可以让文档更易读：

```java
/**
 * ## 方法说明
 * 
 * 这是一个**重要**的方法。
 * 
 * ### 示例
 * 
 * ```java
 * method();
 * ```
 */
public void method() {
    // ...
}
```

Markdown文档让文档更易读、更易维护。

## 总结

JDK 23的编译器改进，确实让Java开发体验更好了。类文件API让类文件操作更方便，Markdown文档注释让文档更易读，模式匹配增强让代码更简洁，流收集器增强让数据处理更灵活。

鹏磊我觉得这些改进都挺实用的，特别是类文件API和Markdown文档注释，让开发更方便了。编译时优化也能提升开发效率，大型项目编译时间能减少不少。

总的来说，JDK 23的编译器改进让Java开发更现代化了，编译更快、检查更严格、代码质量更高。在实际开发中，应该多使用这些新特性，提升开发效率和代码质量。
