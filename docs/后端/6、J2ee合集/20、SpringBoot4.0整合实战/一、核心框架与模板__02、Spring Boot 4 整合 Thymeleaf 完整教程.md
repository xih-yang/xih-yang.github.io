# 02、Spring Boot 4 整合 Thymeleaf 完整教程
- 来源：https://ddkk.com/springboot/4-action/2.html
- 分类：Spring Boot 4 整合教程
- 分组：一、核心框架与模板
- 日期：2025-12-08
做Web开发的时候,最烦的就是写JSP那一堆标签,什么JSTL、EL表达式,整得人头大;而且JSP还得编译,性能也不咋地;后来听说Thymeleaf这玩意儿不错,语法简洁、功能强大,还能直接在浏览器里预览,不用启动服务器;现在Spring Boot 4出来了,整合Thymeleaf更是方便得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合Thymeleaf的。

其实Thymeleaf在Spring Boot里早就支持了,你只要加个`spring-boot-starter-thymeleaf`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用布局、片段、国际化这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-thymeleaf-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── controller/               # 控制器目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── dto/                      # 数据传输对象目录
│   │   │               └── config/                    # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       ├── static/                               # 静态资源目录
│   │       │   ├── css/
│   │       │   ├── js/
│   │       │   └── images/
│   │       ├── templates/                            # Thymeleaf模板目录
│   │       │   ├── index.html                        # 首页模板
│   │       │   ├── user/                            # 用户相关模板
│   │       │   │   ├── list.html
│   │       │   │   └── detail.html
│   │       │   ├── layouts/                         # 布局模板目录
│   │       │   │   ├── base.html                    # 基础布局
│   │       │   │   └── admin.html                   # 管理后台布局
│   │       │   └── fragments/                       # 片段模板目录
│   │       │       ├── header.html                 # 头部片段
│   │       │       ├── footer.html                 # 底部片段
│   │       │       └── sidebar.html                # 侧边栏片段
│   │       └── i18n/                                # 国际化资源文件目录
│   │           ├── messages.properties              # 默认语言
│   │           ├── messages_zh_CN.properties       # 中文
│   │           └── messages_en_US.properties       # 英文
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Thymeleaf版本会自动管理。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-thymeleaf-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Thymeleaf Demo</name>
    <description>Spring Boot 4整合Thymeleaf示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Thymeleaf Starter: Thymeleaf模板引擎 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <!-- Thymeleaf Layout Dialect: 布局方言,支持布局和片段 -->
        <dependency>
            <groupId>nz.net.ultraq.thymeleaf</groupId>
            <artifactId>thymeleaf-layout-dialect</artifactId>
        </dependency>
        <!-- Spring Boot Validation: 参数校验 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Spring Boot DevTools: 开发工具,支持热重载 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml配置

Thymeleaf的配置项挺多的,但是大部分用默认值就行;下面是一些常用的配置:

```yaml
server:
  port: 8080  # 服务端口
  servlet:
    context-path: /  # 上下文路径
spring:
  application:
    name: spring-boot-thymeleaf-demo  # 应用名称
  # Thymeleaf配置
  thymeleaf:
    # 模板文件位置,默认是classpath:/templates/
    prefix: classpath:/templates/
    # 模板文件后缀,默认是.html
    suffix: .html
    # 模板编码,默认UTF-8
    encoding: UTF-8
    # 模板模式,默认HTML
    mode: HTML
    # 是否启用模板缓存,生产环境建议true,开发环境false
    cache: false
    # 是否检查模板是否存在
    check-template: true
    # 是否检查模板位置是否存在
    check-template-location: true
    # Content-Type,默认text/html
    servlet:
      content-type: text/html
    # 是否启用Thymeleaf视图解析器
    enabled: true
  # 静态资源配置
  web:
    resources:
      static-locations: classpath:/static/
      cache:
        period: 3600  # 静态资源缓存1小时
      chain:
        strategy:
          content:
            enabled: true  # 启用内容版本策略
  # 国际化配置
  messages:
    basename: i18n/messages  # 国际化资源文件基础名称
    encoding: UTF-8  # 编码
    cache-duration: 3600  # 缓存时间(秒)
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
    org.thymeleaf: DEBUG  # Thymeleaf日志
```

### 启动类配置

启动类很简单,就一个`@SpringBootApplication`注解:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 Thymeleaf应用启动类
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 Thymeleaf应用启动成功!");
    }
}
```

## Spring Boot 4的Thymeleaf自动配置

Spring Boot 4会自动配置Thymeleaf,核心类是`ThymeleafAutoConfiguration`;它会自动创建`SpringResourceTemplateResolver`、`SpringTemplateEngine`、`ThymeleafViewResolver`等Bean,你基本不用手动配置。

自动配置会做这些事:

- 创建`SpringResourceTemplateResolver`,配置模板加载路径、编码等
- 创建`SpringTemplateEngine`,自动应用`SpringStandardDialect`
- 创建`ThymeleafViewResolver`,处理视图解析
- 配置模板缓存、Content-Type等属性
- 自动集成Spring的`MessageSource`,支持国际化
- 自动集成Spring的转换服务(ConversionService)

```java
// Spring Boot 4会自动配置这些Bean,你不需要手动创建
// SpringResourceTemplateResolver templateResolver = ...  // 自动创建
// SpringTemplateEngine templateEngine = ...  // 自动创建
// ThymeleafViewResolver viewResolver = ...  // 自动创建
```

## 创建第一个Thymeleaf模板

### 简单的HTML模板

Thymeleaf模板就是HTML文件,但是可以包含Thymeleaf表达式;先整个最简单的模板试试:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>首页</title>
</head>
<body>
    <h1 th:text="${message}">默认标题</h1>
    <p th:text="${'当前时间: ' + #dates.format(now, 'yyyy-MM-dd HH:mm:ss')}">当前时间</p>
    <p th:text="${'用户数量: ' + userCount}">用户数量</p>
</body>
</html>
```

Thymeleaf的语法用`th:`前缀,`th:text`是文本输出;注意模板里还有默认值,这样在浏览器里直接打开也能看到内容,不用启动服务器。

### 对应的控制器

```java
package com.example.demo.controller;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.time.LocalDateTime;
/**
 * 首页控制器
 */
@Controller  // 注意这里是@Controller,不是@RestController
public class IndexController {
    /**
     * 首页
     * 返回视图名称"index",Thymeleaf会自动找templates/index.html
     */
    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("message", "欢迎使用Spring Boot 4 + Thymeleaf!");  // 往模型里添加数据
        model.addAttribute("now", LocalDateTime.now());  // 添加当前时间
        model.addAttribute("userCount", 100);  // 添加用户数量
        return "index";  // 返回视图名称,框架会自动加上前缀后缀
    }
}
```

## Thymeleaf常用语法

### 1. 变量输出

```html
<!-- 输出变量,th:text会转义HTML -->
<p th:text="${user.name}">用户名</p>
<!-- 输出变量,不转义HTML -->
<p th:utext="${user.htmlContent}">HTML内容</p>
<!-- 内联语法,直接在HTML属性中使用 -->
<p>用户名: [[${user.name}]]</p>  <!-- 转义 -->
<p>HTML: [(${user.htmlContent})]</p>  <!-- 不转义 -->
<!-- 输出变量,如果为null则显示默认值 -->
<p th:text="${user.email} ?: '未设置'">邮箱</p>
<!-- 安全导航,避免null异常 -->
<p th:text="${user?.address?.city}">城市</p>
```

### 2. 字符串操作

```html
<!-- 字符串连接 -->
<p th:text="${user.firstName + ' ' + user.lastName}">全名</p>
<!-- 字符串替换 -->
<p th:text="${#strings.replace(user.content, 'old', 'new')}">内容</p>
<!-- 字符串截取 -->
<p th:text="${#strings.substring(user.description, 0, 50)}">描述</p>
<!-- 字符串长度 -->
<p th:text="${'描述长度: ' + #strings.length(user.description)}">长度</p>
<!-- 大小写转换 -->
<p th:text="${#strings.toUpperCase(user.name)}">大写</p>
<p th:text="${#strings.toLowerCase(user.name)}">小写</p>
<!-- 首字母大写 -->
<p th:text="${#strings.capitalize(user.name)}">首字母大写</p>
<!-- 判断是否为空 -->
<p th:if="${#strings.isEmpty(user.email)}">邮箱为空</p>
<p th:if="${#strings.isEmpty(user.email)}">邮箱不为空</p>
```

### 3. 数字格式化

```html
<!-- 数字格式化 -->
<p th:text="${#numbers.formatDecimal(price, 0, 2)}">价格</p>  <!-- 保留两位小数 -->
<p th:text="${#numbers.formatCurrency(price)}">货币格式</p>  <!-- 货币格式 -->
<p th:text="${#numbers.formatPercent(progress)}">百分比</p>  <!-- 百分比 -->
<!-- 整数格式化 -->
<p th:text="${#numbers.formatInteger(count, 3)}">数量</p>  <!-- 至少3位数字 -->
```

### 4. 日期格式化

```html
<!-- 日期格式化 -->
<p th:text="${#dates.format(createTime, 'yyyy-MM-dd HH:mm:ss')}">创建时间</p>
<p th:text="${#dates.format(createTime, 'yyyy年MM月dd日')}">创建日期</p>
<!-- 日期格式化(简化) -->
<p th:text="${#temporals.format(createTime, 'yyyy-MM-dd')}">创建日期</p>
<!-- 相对时间 -->
<p th:text="${#dates.format(createTime, 'yyyy-MM-dd')}">日期</p>
<p th:text="${#dates.format(createTime, 'HH:mm:ss')}">时间</p>
<!-- 日期计算 -->
<p th:text="${#dates.createToday()}">今天</p>
<p th:text="${#dates.createNow()}">现在</p>
```

### 5. 条件判断

```html
<!-- if判断 -->
<div th:if="${user.active}">
    <p>用户已激活</p>
</div>
<!-- if-else判断 -->
<div th:if="${user.role == 'admin'}">
    <p>管理员</p>
</div>
<div th:unless="${user.role == 'admin'}">
    <p>普通用户</p>
</div>
<!-- switch-case判断 -->
<div th:switch="${user.role}">
    <p th:case="'admin'">管理员</p>
    <p th:case="'user'">普通用户</p>
    <p th:case="*">访客</p>  <!-- 默认情况 -->
</div>
<!-- 判断变量是否存在 -->
<div th:if="${user != null}">
    <p>用户存在</p>
</div>
<!-- 判断集合是否为空 -->
<div th:if="${!users.isEmpty()}">
    <p>用户列表不为空</p>
</div>
```

### 6. 循环遍历

```html
<!-- 遍历列表 -->
<ul>
    <li th:each="user : ${users}" th:text="${user.name}">用户名</li>
</ul>
<!-- 遍历Map -->
<ul>
    <li th:each="entry : ${userMap}">
        <span th:text="${entry.key}">键</span>: 
        <span th:text="${entry.value}">值</span>
    </li>
</ul>
<!-- 获取循环状态 -->
<ul>
    <li th:each="user, iterStat : ${users}">
        <span th:text="${iterStat.index + 1}">序号</span>. 
        <span th:text="${user.name}">用户名</span>
        <span th:if="${iterStat.first}">(第一个)</span>
        <span th:if="${iterStat.last}">(最后一个)</span>
    </li>
</ul>
<!-- 遍历数组 -->
<ul>
    <li th:each="item : ${items}" th:text="${item}">项</li>
</ul>
```

### 7. URL链接

```html
<!-- 生成URL -->
<a th:href="@{/user/list}">用户列表</a>
<!-- 带参数的URL -->
<a th:href="@{/user/detail(id=${user.id})}">用户详情</a>
<!-- 多个参数 -->
<a th:href="@{/user/search(name=${name}, age=${age})}">搜索</a>
<!-- 路径变量 -->
<a th:href="@{/user/{id}(id=${user.id})}">用户详情</a>
<!-- 上下文路径 -->
<a th:href="@{~/static/css/style.css}">样式文件</a>
<!-- 绝对URL -->
<a th:href="@{http://www.example.com}">外部链接</a>
```

### 8. 属性设置

```html
<!-- 设置属性 -->
<input type="text" th:value="${user.name}" />
<img th:src="@{/images/logo.png}" th:alt="${siteName}" />
<!-- 动态设置class -->
<div th:class="${user.active ? 'active' : 'inactive'}">用户</div>
<div th:class="'user-' + ${user.role}">用户</div>
<!-- 动态设置多个class -->
<div th:classappend="${user.vip ? 'vip' : ''}">用户</div>
<!-- 动态设置style -->
<div th:style="'color:' + ${user.color}">用户</div>
<!-- 条件属性 -->
<input type="checkbox" th:checked="${user.active}" />
<input type="text" th:readonly="${user.readonly}" />
```

## 表单处理

### 表单绑定

Thymeleaf和Spring的表单绑定集成得很好,可以自动处理验证错误、数据绑定等:

```html
<!-- 表单 -->
<form th:action="@{/user/save}" th:object="${user}" method="post">
    <!-- 用户名输入框 -->
    <div>
        <label>用户名:</label>
        <input type="text" th:field="*{name}" />
        <span th:if="${#fields.hasErrors('name')}" th:errors="*{name}">错误信息</span>
    </div>
    <!-- 邮箱输入框 -->
    <div>
        <label>邮箱:</label>
        <input type="email" th:field="*{email}" />
        <span th:if="${#fields.hasErrors('email')}" th:errors="*{email}">错误信息</span>
    </div>
    <!-- 年龄输入框 -->
    <div>
        <label>年龄:</label>
        <input type="number" th:field="*{age}" />
    </div>
    <!-- 提交按钮 -->
    <button type="submit">保存</button>
</form>
```

### 对应的实体类和控制器

```java
package com.example.demo.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import lombok.Data;
/**
 * 用户DTO
 */
@Data
public class UserDTO {
    private Long id;
    @NotBlank(message = "用户名不能为空")
    private String name;
    @Email(message = "邮箱格式不正确")
    @NotBlank(message = "邮箱不能为空")
    private String email;
    @Min(value = 1, message = "年龄必须大于0")
    private Integer age;
}
// 控制器
package com.example.demo.controller;
import com.example.demo.dto.UserDTO;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
/**
 * 用户控制器
 */
@Controller
public class UserController {
    /**
     * 显示用户表单
     */
    @GetMapping("/user/form")
    public String showForm(Model model) {
        model.addAttribute("user", new UserDTO());  // 创建空对象用于表单绑定
        return "user/form";
    }
    /**
     * 保存用户
     */
    @PostMapping("/user/save")
    public String saveUser(@Valid UserDTO user, BindingResult result, Model model) {
        if (result.hasErrors()) {
            // 有验证错误,返回表单页面
            return "user/form";
        }
        // 保存用户逻辑...
        return "redirect:/user/list";  // 重定向到列表页
    }
}
```

### 复选框和单选按钮

```html
<!-- 复选框 -->
<div th:each="hobby : ${allHobbies}">
    <input type="checkbox" 
           th:field="*{hobbies}" 
           th:value="${hobby.id}" />
    <label th:text="${hobby.name}">爱好</label>
</div>
<!-- 单选按钮 -->
<div th:each="role : ${allRoles}">
    <input type="radio" 
           th:field="*{role}" 
           th:value="${role.id}" />
    <label th:text="${role.name}">角色</label>
</div>
<!-- 下拉框 -->
<select th:field="*{country}">
    <option value="">请选择</option>
    <option th:each="c : ${countries}" 
            th:value="${c.code}" 
            th:text="${c.name}">国家</option>
</select>
```

## 布局和片段

Thymeleaf Layout Dialect提供了布局和片段功能,可以复用模板代码。

### 创建基础布局

```html
<!-- templates/layouts/base.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout">
<head>
    <meta charset="UTF-8">
    <title layout:title-pattern="$CONTENT_TITLE - $LAYOUT_TITLE">默认标题</title>
    <link rel="stylesheet" th:href="@{/css/style.css}" />
    <th:block layout:fragment="head">
        <!-- 子页面可以在这里添加额外的head内容 -->
    </th:block>
</head>
<body>
    <!-- 头部片段 -->
    <header th:replace="~{fragments/header :: header}">头部</header>
    <!-- 主要内容区域 -->
    <main layout:fragment="content">
        <!-- 子页面的内容会插入这里 -->
    </main>
    <!-- 底部片段 -->
    <footer th:replace="~{fragments/footer :: footer}">底部</footer>
    <script th:src="@{/js/main.js}"></script>
    <th:block layout:fragment="scripts">
        <!-- 子页面可以在这里添加额外的脚本 -->
    </th:block>
</body>
</html>
```

### 创建片段

```html
<!-- templates/fragments/header.html -->
<header xmlns:th="http://www.thymeleaf.org" th:fragment="header">
    <nav>
        <a th:href="@{/}">首页</a>
        <a th:href="@{/user/list}">用户列表</a>
        <a th:href="@{/about}">关于</a>
    </nav>
</header>
<!-- templates/fragments/footer.html -->
<footer xmlns:th="http://www.thymeleaf.org" th:fragment="footer">
    <p>&copy; 2024 我的网站. All rights reserved.</p>
</footer>
```

### 使用布局

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{layouts/base}">
<body>
    <th:block layout:fragment="content">
        <h1 th:text="${message}">欢迎</h1>
        <p>这是首页内容</p>
    </th:block>
    <th:block layout:fragment="scripts">
        <script th:src="@{/js/index.js}"></script>
    </th:block>
</body>
</html>
```

### 片段参数

片段可以接收参数,实现更灵活的复用:

```html
<!-- 定义带参数的片段 -->
<div xmlns:th="http://www.thymeleaf.org" th:fragment="user-card(user)">
    <div class="card">
        <h3 th:text="${user.name}">用户名</h3>
        <p th:text="${user.email}">邮箱</p>
    </div>
</div>
<!-- 使用片段并传递参数 -->
<div th:replace="~{fragments/user-card :: user-card(${user})}">用户卡片</div>
<!-- 或者使用th:with定义局部变量 -->
<div th:replace="~{fragments/user-card :: user-card}" th:with="user=${currentUser}">用户卡片</div>
```

## 国际化(i18n)

Thymeleaf集成了Spring的MessageSource,支持国际化。

### 创建国际化资源文件

```properties
# i18n/messages.properties (默认)
welcome.message=Welcome
user.name=Name
user.email=Email
# i18n/messages_zh_CN.properties (中文)
welcome.message=欢迎
user.name=姓名
user.email=邮箱
# i18n/messages_en_US.properties (英文)
welcome.message=Welcome
user.name=Name
user.email=Email
```

### 在模板中使用

```html
<!-- 使用消息 -->
<h1 th:text="#{welcome.message}">欢迎</h1>
<p th:text="#{user.name}">姓名</p>
<!-- 带参数的消息 -->
<!-- messages.properties: welcome.user=Welcome, {0}! -->
<p th:text="#{welcome.user(${user.name})}">欢迎, 用户名!</p>
<!-- 内联语法 -->
<p>[[#{welcome.message}]]</p>
```

### 语言切换

```java
// 控制器中设置语言
@GetMapping("/change-locale")
public String changeLocale(@RequestParam String lang, HttpServletRequest request, HttpServletResponse response) {
    LocaleResolver localeResolver = RequestContextUtils.getLocaleResolver(request);
    localeResolver.setLocale(request, response, new Locale(lang));
    return "redirect:/";
}
```

```html
<!-- 语言切换链接 -->
<a th:href="@{/change-locale(lang='zh_CN')}">中文</a>
<a th:href="@{/change-locale(lang='en_US')}">English</a>
```

## 高级功能

### 1. 工具对象

Thymeleaf提供了很多工具对象,可以在模板中直接使用:

```html
<!-- #dates: 日期工具 -->
<p th:text="${#dates.format(now, 'yyyy-MM-dd')}">日期</p>
<!-- #calendars: 日历工具 -->
<p th:text="${#calendars.format(now, 'yyyy-MM-dd')}">日期</p>
<!-- #numbers: 数字工具 -->
<p th:text="${#numbers.formatDecimal(price, 0, 2)}">价格</p>
<!-- #strings: 字符串工具 -->
<p th:text="${#strings.toUpperCase(name)}">大写</p>
<!-- #objects: 对象工具 -->
<p th:text="${#objects.nullSafe(obj, 'default')}">默认值</p>
<!-- #lists: 列表工具 -->
<p th:text="${#lists.size(users)}">列表大小</p>
<p th:if="${#lists.contains(users, currentUser)}">包含</p>
<!-- #sets: 集合工具 -->
<p th:text="${#sets.size(userSet)}">集合大小</p>
<!-- #maps: Map工具 -->
<p th:text="${#maps.size(userMap)}">Map大小</p>
<!-- #arrays: 数组工具 -->
<p th:text="${#arrays.length(items)}">数组长度</p>
<!-- #messages: 消息工具(国际化) -->
<p th:text="${#messages.msg('welcome.message')}">消息</p>
<!-- #uris: URI工具 -->
<p th:text="${#uris.escapePath(path)}">转义路径</p>
<!-- #conversions: 转换工具 -->
<p th:text="${#conversions.convert(value, String.class)}">转换</p>
<!-- #temporals: 时间工具(Java 8+) -->
<p th:text="${#temporals.format(now, 'yyyy-MM-dd')}">日期</p>
```

### 2. 表达式工具对象

```html
<!-- #ctx: 上下文对象 -->
<p th:text="${#ctx.request.requestURI}">请求URI</p>
<p th:text="${#ctx.session.user}">Session用户</p>
<!-- #request: 请求对象 -->
<p th:text="${#request.getAttribute('attr')}">请求属性</p>
<p th:text="${#request.getParameter('param')}">请求参数</p>
<!-- #session: Session对象 -->
<p th:text="${#session.getAttribute('user')}">Session用户</p>
<!-- #servletContext: ServletContext对象 -->
<p th:text="${#servletContext.getAttribute('appName')}">应用名称</p>
```

### 3. 条件表达式

```html
<!-- 三元运算符 -->
<p th:text="${user.active ? '已激活' : '未激活'}">状态</p>
<!-- Elvis运算符(如果为null则使用默认值) -->
<p th:text="${user.email ?: '未设置'}">邮箱</p>
<!-- 安全导航 -->
<p th:text="${user?.address?.city}">城市</p>
```

### 4. 模板注释

```html
<!-- 普通HTML注释,会被输出到页面 -->
<!-- 这是HTML注释 -->
<!-- Thymeleaf注释,不会被输出 -->
<!--/* 这是Thymeleaf注释 */-->
<!-- 条件注释 -->
<!--/*<div th:if="${debug}">调试信息</div>*/-->
```

## 自定义配置

### 自定义Thymeleaf配置

如果需要自定义Thymeleaf配置,可以创建配置类:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;
/**
 * Thymeleaf自定义配置
 */
@Configuration
public class ThymeleafConfig {
    /**
     * 自定义模板解析器
     */
    @Bean
    public SpringResourceTemplateResolver templateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:/templates/");  // 模板路径
        resolver.setSuffix(".html");  // 模板后缀
        resolver.setTemplateMode(TemplateMode.HTML);  // 模板模式
        resolver.setCharacterEncoding("UTF-8");  // 编码
        resolver.setCacheable(false);  // 是否缓存(开发环境false)
        resolver.setOrder(1);  // 解析器优先级
        return resolver;
    }
    /**
     * 自定义模板引擎
     */
    @Bean
    public SpringTemplateEngine templateEngine(SpringResourceTemplateResolver templateResolver) {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(templateResolver);
        // 可以添加自定义方言
        // engine.addDialect(new MyDialect());
        return engine;
    }
}
```

### 添加自定义方言

```java
package com.example.demo.config;
import org.thymeleaf.dialect.AbstractProcessorDialect;
import org.thymeleaf.processor.IProcessor;
import org.thymeleaf.standard.StandardDialect;
import java.util.HashSet;
import java.util.Set;
/**
 * 自定义Thymeleaf方言
 */
public class MyDialect extends AbstractProcessorDialect {
    public MyDialect() {
        super("My Dialect", "my", 1000);  // 名称、前缀、优先级
    }
    @Override
    public Set<IProcessor> getProcessors(String dialectPrefix) {
        Set<IProcessor> processors = new HashSet<>();
        // 添加自定义处理器
        // processors.add(new MyProcessor(dialectPrefix));
        return processors;
    }
}
```

## 最佳实践和注意事项

### 1. 模板组织

- 使用布局和片段复用代码,避免重复
- 按功能模块组织模板文件
- 公共组件放在`fragments`目录
- 布局文件放在`layouts`目录

### 2. 性能优化

- 生产环境启用模板缓存(`cache: true`)
- 开发环境禁用缓存(`cache: false`),方便调试
- 避免在模板中进行复杂计算,应该在Controller中处理
- 使用`th:if`而不是`th:unless`,性能更好

### 3. 安全性

- 使用`th:text`而不是`th:utext`,避免XSS攻击
- 如果必须使用`th:utext`,确保内容已经转义
- 不要在模板中直接输出用户输入,应该先验证和转义

### 4. 代码规范

- 保持模板简洁,复杂逻辑应该在Controller或Service中处理
- 使用语义化的HTML标签
- 合理使用Thymeleaf表达式,避免过度复杂
- 统一使用布局,保持页面风格一致

### 5. 调试技巧

- 使用`th:debug`属性查看变量值
- 在模板中使用注释说明复杂逻辑
- 使用浏览器开发者工具查看生成的HTML
- 启用Thymeleaf日志查看模板解析过程

```html
<!-- 调试模式,显示所有变量 -->
<div th:debug="true">
    <!-- 模板内容 -->
</div>
```

## 总结

Spring Boot 4整合Thymeleaf其实挺简单的,主要就这几步:

1. 添加`spring-boot-starter-thymeleaf`依赖
2. 创建HTML模板文件,使用`th:`属性
3. Controller返回视图名称,框架自动解析
4. 使用布局和片段复用代码
5. 配置国际化支持多语言

Thymeleaf最大的优势就是语法简洁、功能强大,而且可以直接在浏览器预览,开发体验好;相比JSP,Thymeleaf更现代、更灵活,是Spring Boot项目首选的模板引擎;实际项目中根据需求选择就行,别想太复杂,先用起来再说。
