# 04、JDK 23 新特性：Markdown 文档注释（JEP 467）：使用 Markdown 语法编写现代化 JavaDoc
- 来源：https://ddkk.com/zhuanlan/java/java23/4.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
写JavaDoc的时候最烦的就是那些HTML标签了，``、``、``什么的，写起来特别别扭。现在JDK 23的JEP 467终于支持Markdown语法了，这下写文档注释就方便多了，直接用Markdown就能写出漂亮的文档。

鹏磊我平时写代码文档就喜欢用Markdown，现在JavaDoc也能用Markdown了，真是太好了。今天咱就聊聊这个JEP 467，看看怎么用Markdown语法写JavaDoc，让文档更易读、更好写。

## JEP 467 的核心改进

JEP 467允许在JavaDoc注释中使用Markdown语法。以前JavaDoc只能用HTML，现在可以用Markdown了，这对开发者来说是个好消息。Markdown语法简洁直观，写起来更快，读起来也更舒服。

这个特性不是完全替代HTML，而是可以混用。Markdown支持的地方用Markdown，需要HTML的地方还能用HTML，这样灵活性就很高了。不过大部分情况下，用Markdown就够了，HTML标签基本用不上了。

## 基础语法支持

### 标题

在JavaDoc里可以用Markdown的标题语法，从一级到六级：

```java
/**
 * # 一级标题
 * ## 二级标题
 * ### 三级标题
 * 
 * 这是普通的文档内容
 */
public class MyClass {
}
```

### 强调和加粗

可以用`*`或者`_`来做强调和加粗：

```java
/**
 * 这是*斜体*文本
 * 这是**加粗**文本
 * 这是***粗斜体***文本
 * 
 * 也可以用_下划线_做斜体
 * 用__双下划线__做加粗
 */
public void myMethod() {
}
```

### 代码块

代码块的支持让JavaDoc更好用了，可以用三个反引号：

```java
/**
 * 行内代码用单个反引号：`code`
 * 
 * 代码块用三个反引号：
 * ```java
 * public void example() {
 *     System.out.println("Hello");
 * }
 * ```
 */
public class Example {
}
```

还可以指定语言，会有语法高亮：

```java
/**
 * Java代码块：
 * ```java
 * String name = "Java";
 * ```
 * 
 * JSON代码块：
 * ```json
 * {"name": "value"}
 * ```
 */
public void examples() {
}
```

### 列表

支持有序列表和无序列表：

```java
/**
 * 无序列表：
 * - 第一项
 * - 第二项
 *   - 嵌套项
 * - 第三项
 * 
 * 有序列表：
 * 1. 第一步
 * 2. 第二步
 * 3. 第三步
 */
public void listExamples() {
}
```

### 链接

可以用Markdown语法写链接：

```java
/**
 * 行内链接：[链接文本](https://example.com)
 * 
 * 引用链接：[链接文本][ref]
 * 
 * [ref]: https://example.com
 * 
 * 自动链接：<https://example.com>
 */
public void linkExamples() {
}
```

### 引用

支持引用块：

```java
/**
 * > 这是一个引用块
 * > 可以有多行
 * > 
 * > 也可以嵌套引用
 */
public void quoteExample() {
}
```

## 实际应用示例

### 完整的类文档

看个完整的例子，用Markdown写类文档：

```java
/**
 * # UserService
 * 
 * 用户服务类，提供用户相关的业务功能
 * 
 * ## 功能特性
 * 
 * - 用户注册和登录
 * - 用户信息管理
 * - 权限验证
 * 
 * ## 使用示例
 * 
 * ```java
 * UserService service = new UserService();
 * User user = service.createUser("username", "password");
 * ```
 * 
 * ## 注意事项
 * 
 * > 警告：修改用户信息前需要验证权限
 * 
 * @author 开发者名称
 * @since 1.0
 */
public class UserService {
}
```

### 方法文档

方法文档用Markdown也能写得很清晰：

```java
/**
 * ## 创建用户
 * 
 * 创建一个新的用户账户
 * 
 * ### 参数
 * 
 * - `username`: 用户名，必须唯一
 * - `password`: 密码，至少8位
 * - `email`: 邮箱地址，用于验证
 * 
 * ### 返回值
 * 
 * 返回创建的用户对象，如果创建失败返回`null`
 * 
 * ### 异常
 * 
 * - `IllegalArgumentException`: 参数不合法时抛出
 * - `UserExistsException`: 用户名已存在时抛出
 * 
 * ### 使用示例
 * 
 * ```java
 * UserService service = new UserService();
 * try {
 *     User user = service.createUser("john", "password123", "john@example.com");
 *     System.out.println("用户创建成功: " + user.getId());
 * } catch (UserExistsException e) {
 *     System.out.println("用户已存在");
 * }
 * ```
 * 
 * @param username 用户名
 * @param password 密码
 * @param email 邮箱
 * @return 创建的用户对象
 * @throws IllegalArgumentException 参数不合法
 * @throws UserExistsException 用户已存在
 */
public User createUser(String username, String password, String email) {
    // 实现代码
    return null;
}
```

### 字段文档

字段文档也可以用Markdown：

```java
public class User {
    /**
     * 用户ID
     * 
     * 唯一标识符，自动生成，格式为：`UUID-时间戳`
     * 
     * 示例：`550e8400-e29b-41d4-a716-446655440000-1234567890`
     */
    private String id;
    /**
     * 用户名
     * 
     * **要求**：
     * - 长度：3-20个字符
     * - 只能包含字母、数字和下划线
     * - 不能以数字开头
     */
    private String username;
    /**
     * 用户邮箱
     * 
     * > 注意：邮箱需要验证后才能使用
     */
    private String email;
}
```

## 高级用法

### 表格

Markdown表格在JavaDoc里也能用：

```java
/**
 * ## 状态码说明
 * 
 * | 状态码 | 说明 | 处理方式 |
 * |--------|------|----------|
 * | 200 | 成功 | 正常处理 |
 * | 400 | 参数错误 | 检查参数 |
 * | 404 | 资源不存在 | 查找其他资源 |
 * | 500 | 服务器错误 | 联系管理员 |
 */
public class ApiResponse {
}
```

### 任务列表

任务列表可以用checkbox：

```java
/**
 * ## 功能清单
 * 
 * - [x] 用户注册
 * - [x] 用户登录
 * - [ ] 密码找回
 * - [ ] 邮箱验证
 */
public class FeatureList {
}
```

### 脚注

支持脚注：

```java
/**
 * 这是一个带有脚注的文档[^1]
 * 
 * [^1]: 这是脚注的内容
 */
public class FootnoteExample {
}
```

### HTML混用

需要复杂格式的时候，还可以混用HTML：

```java
/**
 * ## Markdown和HTML混用
 * 
 * 这是Markdown文本，可以用**加粗**
 * 
 * <div style="color: red;">
 *   这是HTML，可以做更复杂的样式
 * </div>
 * 
 * 继续用Markdown写内容
 */
public class MixedExample {
}
```

## 最佳实践

### 保持简洁

JavaDoc用Markdown的时候，保持简洁最重要：

```java
/**
 * 创建用户
 * 
 * @param username 用户名
 * @return 用户对象
 */
public User createUser(String username) {
    // 简单的方法，简单文档就够了
}
```

复杂的方法才需要详细文档：

```java
/**
 * ## 批量处理用户数据
 * 
 * 对大量用户数据进行批量处理，支持并行处理
 * 
 * ### 处理流程
 * 
 * 1. 验证输入数据
 * 2. 分批处理数据
 * 3. 合并处理结果
 * 
 * ### 性能说明
 * 
 * - 单线程处理：约1000条/秒
 * - 并行处理：约5000条/秒
 */
public void batchProcess(List<UserData> data) {
}
```

### 代码示例要有用

代码示例要能直接运行，或者至少能说明用法：

```java
/**
 * ## 使用示例
 * 
 * ```java
 * // 正确的用法
 * UserService service = new UserService();
 * User user = service.getUser("john");
 * 
 * // 错误的用法 - 会导致空指针
 * // User user = service.getUser(null);  // 不要这样做
 * ```
 */
public User getUser(String username) {
    return null;
}
```

### 用表格整理信息

参数多或者返回值复杂的时候，用表格更清晰：

```java
/**
 * ## 配置参数
 * 
 * | 参数名 | 类型 | 默认值 | 说明 |
 * |--------|------|--------|------|
 * | timeout | int | 30 | 超时时间（秒） |
 * | retryCount | int | 3 | 重试次数 |
 * | enableCache | boolean | true | 是否启用缓存 |
 */
public class Config {
}
```

## 与HTML的兼容性

### HTML标签仍然可用

虽然有了Markdown，HTML标签还是能用的：

```java
/**
 * 这是Markdown文本
 * 
 * <p>这是HTML段落</p>
 * 
 * 继续用Markdown
 */
public class CompatibilityExample {
}
```

### 优先使用Markdown

能用Markdown的时候，优先用Markdown，因为更简洁：

```java
/**
 * 推荐：用Markdown
 * - 列表项1
 * - 列表项2
 * 
 * 不推荐：用HTML
 * <ul>
 *   <li>列表项1</li>
 *   <li>列表项2</li>
 * </ul>
 */
public class BestPractice {
}
```

## 工具支持

### javadoc工具

javadoc工具会自动处理Markdown语法，生成HTML文档：

```bash
javadoc -d docs MyClass.java
```

生成的HTML文档会保留Markdown格式，看起来更现代。

### IDE支持

大部分现代IDE都支持Markdown，写JavaDoc的时候会有语法高亮和预览：

- IntelliJ IDEA：内置Markdown支持
- Eclipse：需要安装Markdown插件
- VS Code：原生支持Markdown

## 注意事项

### 不要过度使用

虽然Markdown好用，但是不要过度使用。简单的文档用普通文本就够了：

```java
/**
 * 简单的文档，普通文本就行
 */
public void simpleMethod() {
}
```

### 保持一致性

项目里要统一风格，要么都用Markdown，要么都用HTML，不要混用：

```java
// 统一用Markdown
/**
 * ## 标题
 * - 列表
 */
public class Consistent {
}
// 不要混用
/**
 * <h2>标题</h2>  // HTML
 * - 列表          // Markdown
 */
public class Inconsistent {
}
```

### 注意转义

有些字符需要转义，特别是代码块里的内容：

```java
/**
 * 代码块会自动处理，不需要转义：
 * ```java
 * String text = "包含\"引号\"的文本";
 * ```
 */
public class EscapeExample {
}
```

## 总结

JEP 467让JavaDoc写起来更方便了，用Markdown语法就能写出清晰的文档。这个改进对开发者来说很实用，特别是那些习惯用Markdown的开发者。

虽然还是预览特性，但是这个方向是对的。未来应该会稳定下来，成为JavaDoc的标准写法。兄弟们可以在新项目里试试，体验一下Markdown写文档的便利性。

总的来说，JEP 467是个很实用的改进，让Java的文档编写更现代化了。特别是对那些要写大量文档的项目来说，这个特性能省不少时间。建议大家可以试试，看看能不能提升写文档的效率。
