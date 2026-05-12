# 03、Spring Boot 4 整合 Freemarker 完整教程
- 来源：https://ddkk.com/springboot/4-action/3.html
- 分类：Spring Boot 4 整合教程
- 分组：一、核心框架与模板
- 日期：2025-12-08
上次聊了Thymeleaf,这次鹏磊说说FreeMarker;FreeMarker也是个老牌的模板引擎了,比Thymeleaf还早,很多老项目都在用;虽然现在Thymeleaf更流行,但是FreeMarker也有它的优势,语法更简洁,性能也不错,特别适合生成静态内容;Spring Boot 4对FreeMarker的支持也很完善,自动配置给你整得明明白白的。

FreeMarker最大的特点就是语法简单,学习成本低,而且功能强大,支持宏定义、函数、条件判断、循环啥的都有;它不像Thymeleaf那样需要HTML命名空间,模板文件就是纯文本,用起来更灵活。

## 项目搭建和依赖配置

### 创建Maven项目

项目结构跟Thymeleaf差不多,也是有个`templates`目录放模板文件:

```plaintext
spring-boot-freemarker-demo/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java
│   │   │               ├── controller/
│   │   │               ├── service/
│   │   │               └── dto/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── static/              # 静态资源目录
│   │       │   ├── css/
│   │       │   ├── js/
│   │       │   └── images/
│   │       └── templates/           # FreeMarker模板目录
│   │           ├── index.ftl
│   │           ├── user/
│   │           └── layout/
│   └── test/
```

### pom.xml完整配置

FreeMarker的依赖就一个`spring-boot-starter-freemarker`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-freemarker-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 FreeMarker Demo</name>
    <description>Spring Boot 4整合FreeMarker示例项目</description>
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- FreeMarker Starter: FreeMarker模板引擎 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-freemarker</artifactId>
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
        <!-- Lombok: 简化代码 -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
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

FreeMarker的配置项也不多,主要是模板路径、缓存、编码啥的:

```yaml
server:
  port: 8080
  servlet:
    context-path: /
spring:
  application:
    name: spring-boot-freemarker-demo
  # FreeMarker配置
  freemarker:
    # 模板文件位置,默认是classpath:/templates/
    template-loader-path: classpath:/templates/
    # 模板文件后缀,默认是.ftl
    suffix: .ftl
    # 模板编码,默认UTF-8
    charset: UTF-8
    # 是否启用模板缓存,生产环境建议true,开发环境false
    cache: false
    # 是否检查模板是否存在
    check-template-location: true
    # Content-Type,默认text/html
    content-type: text/html
    # 是否暴露RequestAttributes到模板
    expose-request-attributes: false
    # 是否暴露SessionAttributes到模板
    expose-session-attributes: false
    # 是否暴露SpringMacroHelpers
    expose-spring-macro-helpers: true
    # 是否优先使用文件系统加载模板(开发环境)
    prefer-file-system-access: true
  # 静态资源配置
  web:
    resources:
      static-locations: classpath:/static/
      cache:
        period: 3600  # 静态资源缓存1小时
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
    freemarker: DEBUG  # FreeMarker日志
```

### 启动类配置

启动类跟之前一样:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 FreeMarker应用启动类
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 FreeMarker应用启动成功!");
    }
}
```

## Spring Boot 4的FreeMarker自动配置

Spring Boot 4会自动配置FreeMarker,核心类是`FreeMarkerAutoConfiguration`;它会自动创建`FreeMarkerConfigurationFactory`、`FreeMarkerViewResolver`等Bean,你基本不用手动配置。

自动配置会做这些事:

- 创建`FreeMarkerConfigurationFactory`,配置模板加载路径、编码等
- 创建`FreeMarkerViewResolver`,处理视图解析
- 配置模板缓存、Content-Type等属性
- 自动注册Spring的宏助手,可以在模板中使用Spring的功能

## 创建第一个FreeMarker模板

### 简单的FTL模板

FreeMarker模板文件后缀是`.ftl`,先整个最简单的模板试试:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>首页</title>
</head>
<body>
    <h1>${message}</h1>
    <p>当前时间: ${now?string("yyyy-MM-dd HH:mm:ss")}</p>
    <p>用户数量: ${userCount}</p>
</body>
</html>
```

FreeMarker的语法用`${}`来输出变量,`?string()`是格式化函数;语法比Thymeleaf更简洁,不需要命名空间。

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
     * 返回视图名称"index",FreeMarker会自动找templates/index.ftl
     */
    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("message", "欢迎使用Spring Boot 4 + FreeMarker!");  // 往模型里添加数据
        model.addAttribute("now", LocalDateTime.now());  // 添加当前时间
        model.addAttribute("userCount", 100);  // 添加用户数量
        return "index";  // 返回视图名称,框架会自动加上前缀后缀
    }
}
```

## FreeMarker常用语法

### 1. 变量输出

```html
<!-- 输出变量 -->
<p>用户名: ${user.name}</p>
<!-- 输出变量,如果为null则显示默认值 -->
<p>邮箱: ${user.email!"未设置"}</p>
<!-- 输出变量,如果为null则什么都不显示 -->
<p>电话: ${user.phone!}</p>
<!-- 安全输出,避免null异常 -->
<p>地址: ${(user.address.city)!""}</p>
```

### 2. 字符串操作

```html
<!-- 字符串连接 -->
<p>${user.firstName + " " + user.lastName}</p>
<!-- 字符串截取 -->
<p>${user.description?substring(0, 50)}...</p>
<!-- 字符串长度 -->
<p>描述长度: ${user.description?length}</p>
<!-- 字符串替换 -->
<p>${user.content?replace("old", "new")}</p>
<!-- 大小写转换 -->
<p>${user.name?upper_case}</p>
<p>${user.name?lower_case}</p>
<!-- 首字母大写 -->
<p>${user.name?cap_first}</p>
```

### 3. 数字格式化

```html
<!-- 数字格式化 -->
<p>价格: ${price?string("0.00")}</p>  <!-- 保留两位小数 -->
<p>价格: ${price?string.currency}</p>  <!-- 货币格式 -->
<p>价格: ${price?string.number}</p>  <!-- 数字格式,千分位 -->
<!-- 百分比 -->
<p>完成度: ${progress?string.percent}</p>
<!-- 整数 -->
<p>数量: ${count?int}</p>
```

### 4. 日期格式化

```html
<!-- 日期格式化 -->
<p>创建时间: ${createTime?string("yyyy-MM-dd HH:mm:ss")}</p>
<p>创建日期: ${createTime?date}</p>  <!-- 只显示日期 -->
<p>创建时间: ${createTime?time}</p>  <!-- 只显示时间 -->
<p>格式化: ${createTime?string("yyyy年MM月dd日")}</p>
<!-- 相对时间 -->
<p>${createTime?datetime?string("yyyy-MM-dd HH:mm")}</p>
```

### 5. 条件判断

```html
<!-- if-else判断 -->
<#if user.active>
    <p>用户已激活</p>
<#else>
    <p>用户未激活</p>
</#if>
<!-- 多条件判断 -->
<#if user.role == "admin">
    <p>管理员</p>
<#elseif user.role == "user">
    <p>普通用户</p>
<#else>
    <p>访客</p>
</#if>
<!-- 判断变量是否存在 -->
<#if user??>
    <p>用户存在</p>
</#if>
<!-- 判断变量是否为空 -->
<#if user.email?? && user.email != "">
    <p>邮箱: ${user.email}</p>
</#if>
```

### 6. 循环遍历

```html
<!-- 遍历列表 -->
<#list users as user>
    <p>${user.name} - ${user.email}</p>
</#list>
<!-- 遍历Map -->
<#list userMap?keys as key>
    <p>${key}: ${userMap[key]}</p>
</#list>
<!-- 获取循环索引 -->
<#list users as user>
    <p>${user_index + 1}. ${user.name}</p>
</#list>
<!-- 判断是否是第一个或最后一个 -->
<#list users as user>
    <#if user?is_first>
        <p class="first">${user.name}</p>
    <#elseif user?is_last>
        <p class="last">${user.name}</p>
    <#else>
        <p>${user.name}</p>
    </#if>
</#list>
<!-- 遍历时获取索引和计数 -->
<#list users as user>
    <p>索引: ${user_index}, 计数: ${user?counter}, 总数: ${users?size}</p>
</#list>
```

### 7. 宏定义(Macro)

宏定义是FreeMarker的特色功能,可以定义可复用的模板片段:

```html
<!-- 定义宏 -->
<#macro userCard user>
    <div class="user-card">
        <h3>${user.name}</h3>
        <p>邮箱: ${user.email}</p>
        <p>年龄: ${user.age}</p>
    </div>
</#macro>
<!-- 使用宏 -->
<@userCard user=currentUser />
<!-- 带默认参数的宏 -->
<#macro button text type="primary" size="medium">
    <button class="btn btn-${type} btn-${size}">${text}</button>
</#macro>
<!-- 使用宏 -->
<@button text="提交" />
<@button text="取消" type="secondary" size="small" />
```

### 8. 包含模板(Include)

```html
<!-- 包含其他模板文件 -->
<#include "header.ftl">
<#include "footer.ftl">
<!-- 包含时可以传递参数 -->
<#include "user-info.ftl" with {"user": currentUser}>
```

### 9. 导入模板(Import)

```html
<!-- 导入模板,可以使用其中的宏 -->
<#import "macros.ftl" as macros>
<!-- 使用导入的宏 -->
<@macros.userCard user=currentUser />
```

## 完整的用户管理示例

### 用户实体类

```java
package com.example.demo.dto;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
/**
 * 用户实体类
 */
public class User {
    private Long id;  // 用户ID
    @NotBlank(message = "用户名不能为空")
    private String name;  // 用户名
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;  // 邮箱
    @NotNull(message = "年龄不能为空")
    private Integer age;  // 年龄
    private Boolean active;  // 是否激活
    private LocalDateTime createTime;  // 创建时间
    // 构造函数
    public User() {
    }
    public User(Long id, String name, String email, Integer age) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.age = age;
        this.active = true;
        this.createTime = LocalDateTime.now();
    }
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public Boolean getActive() {
        return active;
    }
    public void setActive(Boolean active) {
        this.active = active;
    }
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
```

### 用户控制器

```java
package com.example.demo.controller;
import com.example.demo.dto.User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
/**
 * 用户管理控制器
 */
@Controller
@RequestMapping("/user")
public class UserController {
    // 模拟数据存储(实际应该用Service和Repository)
    private List<User> users = new ArrayList<>();
    private Long nextId = 1L;
    /**
     * 用户列表页面
     */
    @GetMapping("/list")
    public String list(Model model) {
        model.addAttribute("users", users);  // 添加用户列表到模型
        return "user/list";  // 返回视图名称
    }
    /**
     * 显示添加用户表单
     */
    @GetMapping("/add")
    public String addForm(Model model) {
        model.addAttribute("user", new User());  // 添加空用户对象到模型
        return "user/form";  // 返回表单页面
    }
    /**
     * 保存用户
     */
    @PostMapping("/save")
    public String save(@Valid @ModelAttribute User user,  // @Valid校验,@ModelAttribute绑定表单数据
                      BindingResult bindingResult,  // 校验结果
                      RedirectAttributes redirectAttributes) {  // 重定向属性
        // 如果校验失败,返回表单页面
        if (bindingResult.hasErrors()) {
            return "user/form";
        }
        // 设置ID和创建时间
        if (user.getId() == null) {
            user.setId(nextId++);
            user.setCreateTime(LocalDateTime.now());
            users.add(user);  // 添加到列表
            redirectAttributes.addFlashAttribute("message", "用户添加成功!");  // 添加成功消息
        } else {
            // 更新用户
            users = users.stream()
                    .map(u -> u.getId().equals(user.getId()) ? user : u)
                    .collect(Collectors.toList());
            redirectAttributes.addFlashAttribute("message", "用户更新成功!");
        }
        return "redirect:/user/list";  // 重定向到列表页面
    }
    /**
     * 显示编辑用户表单
     */
    @GetMapping("/edit/{id}")
    public String editForm(@PathVariable Long id, Model model) {
        User user = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (user == null) {
            return "redirect:/user/list";  // 用户不存在,重定向到列表
        }
        model.addAttribute("user", user);
        return "user/form";
    }
    /**
     * 删除用户
     */
    @GetMapping("/delete/{id}")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        boolean removed = users.removeIf(u -> u.getId().equals(id));
        if (removed) {
            redirectAttributes.addFlashAttribute("message", "用户删除成功!");
        } else {
            redirectAttributes.addFlashAttribute("error", "用户不存在!");
        }
        return "redirect:/user/list";
    }
    /**
     * 查看用户详情
     */
    @GetMapping("/detail/{id}")
    public String detail(@PathVariable Long id, Model model) {
        User user = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (user == null) {
            return "redirect:/user/list";
        }
        model.addAttribute("user", user);
        return "user/detail";
    }
}
```

### 用户列表模板 (templates/user/list.ftl)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>用户列表</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <h1>用户列表</h1>
        <!-- 显示消息 -->
        <#if message??>
            <div class="alert alert-success">${message}</div>
        </#if>
        <#if error??>
            <div class="alert alert-error">${error}</div>
        </#if>
        <!-- 添加用户按钮 -->
        <a href="/user/add" class="btn btn-primary">添加用户</a>
        <!-- 用户列表表格 -->
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>年龄</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <!-- 如果没有用户 -->
                <#if users?size == 0>
                    <tr>
                        <td colspan="7" class="text-center">暂无用户数据</td>
                    </tr>
                </#if>
                <!-- 遍历用户列表 -->
                <#list users as user>
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.age}</td>
                        <td>
                            <#if user.active>
                                <span class="badge badge-success">激活</span>
                            <#else>
                                <span class="badge badge-danger">未激活</span>
                            </#if>
                        </td>
                        <td>${user.createTime?string("yyyy-MM-dd HH:mm:ss")}</td>
                        <td>
                            <a href="/user/detail/${user.id}" class="btn btn-sm">查看</a>
                            <a href="/user/edit/${user.id}" class="btn btn-sm">编辑</a>
                            <a href="/user/delete/${user.id}" 
                               class="btn btn-sm btn-danger"
                               onclick="return confirm('确定要删除用户 ${user.name} 吗?');">删除</a>
                        </td>
                    </tr>
                </#list>
            </tbody>
        </table>
    </div>
</body>
</html>
```

### 用户表单模板 (templates/user/form.ftl)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><#if user.id??>编辑用户<#else>添加用户</#if></title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <h1><#if user.id??>编辑用户<#else>添加用户</#if></h1>
        <!-- 表单 -->
        <form action="/user/save" method="post">
            <!-- 隐藏字段: 用户ID -->
            <#if user.id??>
                <input type="hidden" name="id" value="${user.id}"/>
            </#if>
            <!-- 用户名 -->
            <div class="form-group">
                <label>用户名</label>
                <input type="text" name="name" value="${user.name!""}" class="form-control" placeholder="请输入用户名"/>
                <#if (spring.status.errorMessages["name"])??>
                    <span class="error-message">${spring.status.errorMessages["name"][0]}</span>
                </#if>
            </div>
            <!-- 邮箱 -->
            <div class="form-group">
                <label>邮箱</label>
                <input type="email" name="email" value="${user.email!""}" class="form-control" placeholder="请输入邮箱"/>
                <#if (spring.status.errorMessages["email"])??>
                    <span class="error-message">${spring.status.errorMessages["email"][0]}</span>
                </#if>
            </div>
            <!-- 年龄 -->
            <div class="form-group">
                <label>年龄</label>
                <input type="number" name="age" value="${user.age!0}" class="form-control" placeholder="请输入年龄"/>
                <#if (spring.status.errorMessages["age"])??>
                    <span class="error-message">${spring.status.errorMessages["age"][0]}</span>
                </#if>
            </div>
            <!-- 提交按钮 -->
            <div class="form-group">
                <button type="submit" class="btn btn-primary">保存</button>
                <a href="/user/list" class="btn btn-secondary">取消</a>
            </div>
        </form>
    </div>
</body>
</html>
```

## 布局和宏定义

### 基础布局模板 (templates/layout/base.ftl)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><#if title??>${title} - 我的网站<#else>我的网站</#if></title>
    <link rel="stylesheet" href="/css/style.css">
    <#if head??>
        ${head}
    </#if>
</head>
<body>
    <!-- 头部 -->
    <header>
        <nav>
            <a href="/">首页</a>
            <a href="/user/list">用户管理</a>
        </nav>
    </header>
    <!-- 主要内容区域 -->
    <main>
        <#if content??>
            ${content}
        <#else>
            <p>默认内容</p>
        </#if>
    </main>
    <!-- 页脚 -->
    <footer>
        <p>&copy; 2024 我的网站</p>
    </footer>
</body>
</html>
```

### 使用布局的页面

```html
<#include "layout/base.ftl">
<#assign title="用户列表">
<#assign content>
    <h1>用户列表</h1>
    <!-- 页面内容 -->
</#assign>
```

### 宏定义示例 (templates/macros.ftl)

```html
<!-- 用户卡片宏 -->
<#macro userCard user>
    <div class="user-card">
        <h3>${user.name}</h3>
        <p>邮箱: ${user.email}</p>
        <p>年龄: ${user.age}</p>
        <#if user.active>
            <span class="badge badge-success">激活</span>
        <#else>
            <span class="badge badge-danger">未激活</span>
        </#if>
    </div>
</#macro>
<!-- 按钮宏 -->
<#macro button text type="primary" size="medium" href="">
    <#if href != "">
        <a href="${href}" class="btn btn-${type} btn-${size}">${text}</a>
    <#else>
        <button class="btn btn-${type} btn-${size}">${text}</button>
    </#if>
</#macro>
<!-- 分页宏 -->
<#macro pagination currentPage totalPages baseUrl>
    <div class="pagination">
        <#if currentPage > 1>
            <a href="${baseUrl}?page=${currentPage - 1}">上一页</a>
        </#if>
        <#list 1..totalPages as page>
            <#if page == currentPage>
                <span class="current">${page}</span>
            <#else>
                <a href="${baseUrl}?page=${page}">${page}</a>
            </#if>
        </#list>
        <#if currentPage < totalPages>
            <a href="${baseUrl}?page=${currentPage + 1}">下一页</a>
        </#if>
    </div>
</#macro>
```

### 使用宏

```html
<#import "macros.ftl" as macros>
<!-- 使用用户卡片宏 -->
<@macros.userCard user=currentUser />
<!-- 使用按钮宏 -->
<@macros.button text="提交" type="primary" />
<@macros.button text="取消" type="secondary" href="/user/list" />
<!-- 使用分页宏 -->
<@macros.pagination currentPage=page totalPages=totalPages baseUrl="/user/list" />
```

## 自定义FreeMarker配置

虽然Spring Boot的自动配置已经很完善了,但是有时候你还是需要自定义一些东西:

```java
package com.example.demo.config;
import freemarker.template.Configuration;
import freemarker.template.TemplateExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.view.freemarker.FreeMarkerConfigurer;
import org.springframework.web.servlet.view.freemarker.FreeMarkerViewResolver;
import java.io.IOException;
/**
 * FreeMarker自定义配置
 * 如果不需要自定义,可以不用这个配置类,Spring Boot会自动配置
 */
@Configuration
public class FreeMarkerConfig {
    /**
     * 自定义FreeMarker配置
     */
    @Bean
    public FreeMarkerConfigurer freeMarkerConfigurer() throws IOException {
        FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
        configurer.setTemplateLoaderPath("classpath:/templates/");  // 模板路径
        configurer.setDefaultEncoding("UTF-8");  // 编码
        // 获取Configuration对象进行更详细的配置
        Configuration configuration = configurer.createConfiguration();
        configuration.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);  // 异常处理
        configuration.setLogTemplateExceptions(false);  // 不记录模板异常到日志
        configuration.setWrapUncheckedExceptions(true);  // 包装未检查异常
        // 设置共享变量(全局变量)
        configuration.setSharedVariable("appName", "我的应用");  // 应用名称
        configuration.setSharedVariable("version", "1.0.0");  // 版本号
        configurer.setConfiguration(configuration);
        return configurer;
    }
    /**
     * 自定义视图解析器
     */
    @Bean
    public FreeMarkerViewResolver freeMarkerViewResolver() {
        FreeMarkerViewResolver resolver = new FreeMarkerViewResolver();
        resolver.setPrefix("");  // 前缀
        resolver.setSuffix(".ftl");  // 后缀
        resolver.setContentType("text/html;charset=UTF-8");  // Content-Type
        resolver.setExposeRequestAttributes(true);  // 暴露Request属性
        resolver.setExposeSessionAttributes(true);  // 暴露Session属性
        resolver.setExposeSpringMacroHelpers(true);  // 暴露Spring宏助手
        resolver.setOrder(1);  // 视图解析器优先级
        return resolver;
    }
}
```

## Spring宏助手

FreeMarker集成了Spring的宏助手,可以在模板中使用Spring的功能:

```html
<!-- 使用Spring的URL宏 -->
<@spring.url value="/user/list" />
<!-- 使用Spring的表单绑定 -->
<@spring.bind "user.name" />
<input type="text" name="${spring.status.expression}" value="${spring.status.value}"/>
<!-- 显示错误信息 -->
<@spring.showErrors separator=", " classOrStyle="error" />
<!-- 表单绑定 -->
<@spring.formInput "user.email" />
<@spring.formPasswordInput "user.password" />
<@spring.formTextarea "user.description" />
<@spring.formSingleSelect "user.role" options=roles />
<@spring.formMultiSelect "user.tags" options=allTags />
```

## 最佳实践和注意事项

### 1. 模板缓存配置

开发环境建议关闭缓存(`spring.freemarker.cache=false`),这样修改模板后刷新浏览器就能看到效果;生产环境一定要开启缓存,提升性能。

### 2. 使用宏定义

大型项目建议把公共的部分提取成宏,比如用户卡片、按钮、分页等,避免重复代码。

### 3. 模板组织

按功能模块组织模板文件,比如用户相关的放在`user/`目录下,布局相关的放在`layout/`目录下。

### 4. 表单校验

使用`@Valid`和Bean Validation进行表单校验,FreeMarker可以通过`spring.status`访问错误信息。

### 5. 静态资源处理

静态资源放在`src/main/resources/static/`目录下,FreeMarker会自动处理URL重写。

### 6. 避免在模板中写复杂逻辑

模板里尽量只做数据展示,复杂逻辑放在Controller或Service层;FreeMarker虽然支持函数,但是写多了不好维护。

### 7. 使用include和import

公共的头部、尾部用`include`,可复用的宏用`import`,代码更清晰。

### 8. 开发工具配置

使用`spring-boot-devtools`,它会自动禁用模板缓存,开发更方便。

### 9. 注意WebFlux限制

如果使用WebFlux,FreeMarker的某些功能可能不支持,比如模板缓存;建议用Thymeleaf或者传统的Spring MVC。

## 总结

Spring Boot 4整合FreeMarker其实很简单,主要就是加个依赖,然后写模板和控制器就行了;FreeMarker的语法比Thymeleaf更简洁,学习成本低,特别适合快速开发;关键是要理解它的宏定义功能,可以大大提高代码复用率;鹏磊在实际项目中多练练,慢慢就熟悉了;记住一点,能用自动配置就别自己写配置,省事还不容易出错。
