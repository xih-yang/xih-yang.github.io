# 08、Spring Boot - 中整合视图层技术（JSP/Freemarker/Thymeleaf）-11000字匠心巨作
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/8.html
- 分类：J2EE框架
- 分组：教程目录
## 1.Spring Boot 整合 JSP 技术

### 1.创建项目

详细创建步骤可以参考博文：[传送门！！！](/zhuanlan/j2ee/springboot/4/2.html)

### 2.修改 POM 文件，添加 JSP 引擎与 JSTL 标签库

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.dqcgm</groupId>
    <artifactId>springbootjsp</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springbootjsp</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--添加 jsp 引擎，SpringBoot 内置的 Tomat 中没有此依赖-->
        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
        </dependency>
        <!--添加 JSTL 坐标依赖-->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 3.创建 webapp 目录

### 4.标记为 web 目录

### 5.创建 JSP

```xml
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
</head>
<body>
    <h2>JSP</h2>
</body>
</html>
```

### 6.修改配置文件，配置视图解析器

```java
spring.mvc.view.prefix=/WEB-INF/jsp/ 
spring.mvc.view.suffix=.jsp
```

### 7.创建 Controller

```java
package com.dqcgm.springbootjsp.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@Controller
public class PageController {
    @GetMapping("/page")
    public String showPage(@PathVariable String page){
        return page;
    }
}
```

- 如果在 IDEA 中项目结构为聚合工程。那么在运行 jsp 是需要指定路径。如果项目结构为独立项目则不需要。

## 2.Spring Boot 整合 Freemarker

### 1.创建项目

详细创建步骤可以参考博文：[传送门！！！](/zhuanlan/j2ee/springboot/4/2.html)

### 2.修改 POM 文件，添加 Freemarker 启动器

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.dqcgm</groupId>
    <artifactId>springbootfreemarker</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springbootfreemarker</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--Freemarker 启动器依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-freemarker</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 3.创建 Users 实体

```java
package com.dqcgm.springbootfreemarker.pojo;
public class Users {
    private String username;
    private String userage;
    private String usersex;
    @Override
    public String toString() {
        return "Users{" +
                "username='" + username + '\'' +
                ", userage='" + userage + '\'' +
                ", usersex='" + usersex + '\'' +
                '}';
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getUserage() {
        return userage;
    }
    public void setUserage(String userage) {
        this.userage = userage;
    }
    public String getUsersex() {
        return usersex;
    }
    public Users(String username, String userage, String usersex) {
        this.username = username;
        this.userage = userage;
        this.usersex = usersex;
    }
    public void setUsersex(String usersex) {
        this.usersex = usersex;
    }
}
```

### 4.创建Controller

```java
package com.dqcgm.springbootfreemarker.controller;
import com.dqcgm.springbootfreemarker.pojo.Users;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import java.util.ArrayList;
import java.util.List;
@Controller
public class UsersController {
    public String showUsers(Model model){
        List<Users> list = new ArrayList<>();
        list.add(new Users("admin","20","F"));
        list.add(new Users("dqc","21","m"));
        list.add(new Users("dqcgm","22","m"));
        model.addAttribute("list",list);
        return "userList";
    }
}
```

### 5.创建视图（.ftl）

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    <table border="1" align="center" width="50%">
        <tr>
            <th>Name</th>
            <th>Sex</th>
            <th>Age</th>
        </tr>
        <#list list as user>
            <tr>
                <td>${
     user.username}</td>
                <td>${
     user.usersex}</td>
                <td>${
     user.userage}</td>
            </tr>
        </#list>
    </table>
</body>
</html>
```

### 6.修改配置文件添加后缀

```java
spring.freemarker.suffix=.ftl
```

运行结果：

## 3.Spring Boot 整合 Thymeleaf

### 1.Thymeleaf 介绍

- Thymeleaf 的主要目标是将优雅的自然模板带到开发工作流程中，并将 HTML 在浏览器中正确显示，并且可以作为静态原型，让开发团队能更容易地协作。Thymeleaf 能够处理 HTML，XML，JavaScript，CSS 甚至纯文本。
- 长期以来,jsp 在视图领域有非常重要的地位,随着时间的变迁,出现了一位新的挑战者:Thymeleaf,Thymeleaf 是原生的,不依赖于标签库.它能够在接受原始 HTML 的地方进行编辑和渲染.因为它没有与Servelet规范耦合,因此Thymeleaf模板能进入jsp所无法涉足的领域。

### 2.Thymeleaf 基本使用

#### 1.创建项目

详细创建步骤可以参考博文：[传送门！！！](/zhuanlan/j2ee/springboot/4/2.html)

#### 2.修改 POM 文件，添加 Thymeleaf 启动器依赖

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.dqcgm</groupId>
    <artifactId>springbootthymeleaf</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springbootthymeleaf</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--添加 Thymeleaf 启动器依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 3.创建 Controller

```java
package com.dqcgm.springbootthymeleaf.controller;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class PageController {
    @GetMapping("/show")
    public String showPage(Model model){
        model.addAttribute("msg","Thymyleaf");
        return "index";
    }
}
```

#### 4.创建视图

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01
Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>地球村公民首页</title>
</head>
<body>
    <span th:text="地球村公民"></span>
    <hr/>
    <span th:text="${msg}"></span></body>
</html>
```

运行结果：

### 3.Thymeleaf 语法讲解

- 命名空间：xmlns:th=“http://www.thymeleaf.org”

#### 1.字符串与变量输出操作

- th:text

在页面中输出值
- th:value

可以将一个值放入到 input 标签的 value 中

#### 2.字符串操作

- Thymeleaf 提供了一些内置对象，内置对象可直接在模板中使用。这些对象是以#引用的。
- 大部分内置对象的名称都以 s 结尾。如：strings、numbers、dates

- `$`{#strings.isEmpty(key)}

判断字符串是否为空，如果为空返回 true，否则返回 false
- `$`{#strings.contains(msg,‘T’)}

判断字符串是否包含指定的子串，如果包含返回 true，否则返回 false
- `$`{#strings.startsWith(msg,‘a’)}

判断当前字符串是否以子串开头，如果是返回 true，否则返回 false
- `$`{#strings.endsWith(msg,‘a’)}

判断当前字符串是否以子串结尾，如果是返回 true，否则返回 false
- `$`{#strings.length(msg)}

返回字符串的长度
- `$`{#strings.indexOf(msg,‘h’)}

查找子串的位置，并返回该子串的下标，如果没找到则返回-1
- `$` {#strings.substring(msg,2)}，`$`{#strings.substring(msg,2,5)}

截取子串，用户与 jdk String 类下 SubString 方法相同
- `$`{#strings.toUpperCase(msg)}， `$`{#strings.toLowerCase(msg)}

字符串转大小写

#### 3.日期格式化处理

- `$`{#dates.format(key)}

格式化日期，默认的以浏览器默认语言为格式化标准
- `$`{#dates.format(key,‘yyyy/MM/dd’)}

按照自定义的格式做日期转换
- `$`{#dates.year(key)}， `$`{#dates.month(key)}， `$`{#dates.day(key)}

Year：取年 ，Month：取月， Day：取日

#### 4.条件判断

- th:if

条件判断
- th:switch / th:case

**1、** th:switch/th:case与Java中的switch语句等效，有条件地显示匹配的内容如果有多个匹配结果只选择第一个显示；

**2、** th:case="*“表示Java中switch的default，即没有case的值为true时则显示th:case=”*"的内容；

#### 5.迭代遍历

- th:each

迭代器，用于循环迭代集合
- th:each 状态变量

**1、** index:当前迭代器的索引从0开始；

**2、** count:当前迭代对象的计数从1开始；

**3、** size:被迭代对象的长度；

**4、** odd/even:布尔值，当前循环是否是偶数/奇数从0开始；

**5、** first:布尔值，当前循环的是否是第一条，如果是返回true否则返回false；

**6、** last:布尔值，当前循环的是否是最后一条，如果是则返回true否则返回false；

#### 6.th:each 迭代 Map

```xml
<table border="1" width="50%"> 
	<tr>
		<th>ID</th> 
		<th>Name</th> 
		<th>Age</th> 
		<th>Key</th> 
	</tr>
	<tr th:each="m : ${map}"> 
		<td th:text="${m.value.id}"></td> 
		<td th:text="${m.value.name}"></td> 
		<td th:text="${m.value.age}"></td> 
		<td th:text="${m.key}"></td> 
	</tr> 
</table>
```

#### 7.操作域对象

- HttpServletRequest

```java
request.setAttribute("req", "HttpServletRequest");
<span th:text="${#httpServletRequest.getAttribute('req')}"></span>
<span th:text="${#request.getAttribute('req')}"></span>
```

- HttpSession

```java
request.getSession().setAttribute("sess", "HttpSession");
<span th:text="${session.ses}"></span><br/>
<span th:text="${#session.getAttribute('ses')}"></span><br/>
```

- ServletContext

```java
request.getSession().getServletContext().setAttribute("app", "Application");
<span th:text="${application.app}"></span>
<span th:text="${#servletContext.getAttribute('app')}"></span>
```

#### 8.URL 表达式

- 在 Thymeleaf 中 URL 表达式的语法格式为@{}
- 绝对路径

```xml
<a th:href="@{http://www.baidu.com}">绝对路径</a>
```

- 相对路径

```java
//相对于当前项目的根
<a th:href="@{/show}">相对路径</a>
//相对于服务器路径的根
<a th:href="@{~/project2/resourcename}">相对于服务器的根</a>
```

- 在 URL 中传递参数
- 在普通格式的 URL 中传递参数

```xml
<a th:href="@{/show?id=1&name=zhangsan}">普通 URL 格式传参</a>
<a th:href="@{/show(id=1,name=zhangsan)}">普通 URL 格式传参</a>
<a th:href="@{'/show?id='+${id}+'&name='+${name}}"> 普通 URL 格式传参 </a>
<a th:href="@{/show(id=${id},name=${name})}">普通 URL 格式传参</a>
```

- 在 restful 格式的 URL 中传递参数

```xml
<a th:href="@{/show/{id}(id=1)}">restful 格式传参</a>
<a th:href="@{/show/{id}/{name}(id=1,name=admin)}">restful 格式传参 </a>
<a th:href="@{/show/{id}(id=1,name=admin)}">restful 格式传参</a>
<a th:href="@{/show/{id}(id=${id},name=${name})}">restful 格式传参</a>
```

#### 9.在配置文件中配置 Thymeleaf

```java
spring.thymeleaf.prefix=classpath:/templates/suibian/ 
spring.thymeleaf.suffix=.html 
spring.thymeleaf.mode=HTML配置视图模板类型，如果视图模板使用的 是 html5 需要配置
spring.thymeleaf.encoding=utf-8 
spring.thymeleaf.servlet.content-type=text/html响应类型 
#配置页面缓存
spring.thymeleaf.cache=false
```
