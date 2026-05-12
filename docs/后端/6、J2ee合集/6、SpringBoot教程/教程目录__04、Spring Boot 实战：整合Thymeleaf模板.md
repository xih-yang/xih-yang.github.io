# 04、Spring Boot 实战：整合Thymeleaf模板
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/8/4.html
- 分类：J2EE框架
- 分组：教程目录
在前面几章中已经介绍了如何创建一个SpringBoot 项目，同时简单的描述了SpringBoot REST Web服务。除此之外它也是支持如JSP、Thymeleaf、FreeMarker、Mustache、Velocity 等各种模板引擎，同时还为开发者提供了自定义模板扩展的支持。

> 使用嵌入式Servlet容器时，请避免使用JSP，因为使用JSP打包后会存在一些限制。

在SpringBoot使用上述模板，默认从 **src/main/resources/templates**下加载。

## thymeleaf介绍

Thymeleaf是现代化服务器端的Java模板引擎，不同与其它几种模板的是Thymeleaf的语法更加接近HTML，并且具有很高的扩展性。详细资料可以浏览[官网](https://www.thymeleaf.org/)。

> 特点

- 支持无网络环境下运行，由于它支持 html 原型，然后在 html 标签里增加额外的属性来达到模板+数据的展示方式。浏览器解释 html 时会忽略未定义的标签属性，所以 thymeleaf 的模板可以静态地运行；当有数据返回到页面时，Thymeleaf 标签会动态地替换掉静态内容，使页面动态显示。所以它可以让前端小姐姐在浏览器中查看页面的静态效果，又可以让程序员小哥哥在服务端查看带数据的动态页面效果。
- 开箱即用，为Spring提供方言，可直接套用模板实现JSTL、 OGNL表达式效果，避免每天因套用模板而修改JSTL、 OGNL标签的困扰。同时开发人员可以扩展自定义的方言。
- SpringBoot官方推荐模板，提供了可选集成模块(spring-boot-starter-thymeleaf)，可以快速的实现表单绑定、属性编辑器、国际化等功能。

## 使用

首先要在 pom.xml 中添加对 thymeleaf 模板依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

然后创建一个 ThymeleafController 用来映射HTTP请求与页面的跳转，下面写了两种方式，第一种比较直观和优雅，第二种相对普遍且代码较少，且迎合从struts2跳坑的朋友们…

- **Spring4.3以后为简化@RequestMapping(method = RequestMethod.XXX)的写法，故而将其做了一层包装，也就是现在的GetMapping、PostMapping、PutMapping、DeleteMapping、PatchMapping**

```java
package com.battcn.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import javax.servlet.http.HttpServletRequest;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/4/23 0023
 */
@Controller
@RequestMapping
public class ThymeleafController {
    @GetMapping("/index")
    public ModelAndView index() {
        ModelAndView view = new ModelAndView();
        // 设置跳转的视图 默认映射到 src/main/resources/templates/{viewName}.html
        view.setViewName("index");
        // 设置属性
        view.addObject("title", "我的第一个WEB页面");
        view.addObject("desc", "欢迎进入battcn-web 系统");
        Author author = new Author();
        author.setAge(22);
        author.setEmail("1837307557@qq.com");
        author.setName("唐亚峰");
        view.addObject("author", author);
        return view;
    }
    @GetMapping("/index1")
    public String index1(HttpServletRequest request) {
        // TODO 与上面的写法不同，但是结果一致。
        // 设置属性
        request.setAttribute("title", "我的第一个WEB页面");
        request.setAttribute("desc", "欢迎进入battcn-web 系统");
        Author author = new Author();
        author.setAge(22);
        author.setEmail("1837307557@qq.com");
        author.setName("唐亚峰");
        request.setAttribute("author", author);
        // 返回的 index 默认映射到 src/main/resources/templates/xxxx.html
        return "index";
    }
    class Author {
        private int age;
        private String name;
        private String email;
        // 省略 get set
    }
}
```

最后在src/main/resources/templates 目录下创建一个名 index.html 的模板文件，可以看到 thymeleaf 是通过在标签中添加额外属性动态绑定数据的

```java
    Title
    Hello World 
    =====作者信息===== 
```

> 静态效果

双击打开 index.html 既可以看到如下的静态效果，并未和其它模板一样显示一堆标签的内容，而是正常渲染静态页面

> 动态效果

在浏览器输入：[http://localhost:8080/index](http://localhost:8080/index) 可以看到渲染后的效果，真正意义上的动静分离了

## 小技巧

> 模板热部署

在IntelliJ IDEA 中使用 thymeleaf 模板的时候，发现每次修改静态页面都需要重启才生效，这点是很不友好的，百度了下发现原来是默认配置搞的鬼，为了提高响应速度，默认情况下会缓存模板。如果是在开发中请**将spring.thymeleaf.cache 属性设置成 false**。在每次修改静态内容时**按Ctrl+Shift+F9**即可重新加载了…

> 修改默认favicon.ico 图标

默认情况下使用springboot总能看到一片叶子，这是因为我们没配置自己的ico导致的，解决方法也很简单，只需要在src/main/static/目录下放置一张名为favicon.ico就可以了

## 默认配置

SpringBoot 默认情况下为我们做了如下的默认配置工作，熟悉默认配置在开发过程中可以更好的解决问题

## 总结

目前很多大佬都写过关于 **SpringBoot** 的教程了，如有雷同，请多多包涵，本教程基于最新的 spring-boot-starter-parent：2.0.1.RELEASE编写，包括新版本的特性都会一起介绍…

## 说点什么

全文代码：[https://github.com/battcn/spring-boot2-learning/tree/master/chapter3](https://github.com/battcn/spring-boot2-learning/tree/master/chapter3)
