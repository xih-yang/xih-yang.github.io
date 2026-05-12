# 05、Spring Boot - 中整合 Web 层技术-5800字匠心出品
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/5.html
- 分类：J2EE框架
- 分组：教程目录
## 1.通过注解扫描完成 Servlet 组件的注册

**创建 Servlet：**

```java
package com.dqcgm.springbootweb.servlet;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
@WebServlet(name = "First Servlet",urlPatterns = "/first")
public class FirstServlet extends HttpServlet {
    public void doGet(HttpServletRequest req, HttpServletResponse resp){
        System.out.println("First Servlet ............");
    }
}
```

**修改启动类：**

```java
package com.dqcgm.springbootweb;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;
@SpringBootApplication
@ServletComponentScan//在 spring Boot 启动时会扫描@WebServlet 注解，并将该类实例化
public class SpringbootwebApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootwebApplication.class, args);
    }
}
```

运行结果：

## 2.通过方法完成 Servlet 组件的注册

**创建 Servlet：**

```java
package com.dqcgm.springbootweb.servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
public class SecondServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("SecondServlet............");
    }
}
```

**创建 Servlet 配置类：**

```java
package com.dqcgm.springbootweb.servlet;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class ServletConfig {
    @Bean
    public ServletRegistrationBean getServletRegistrationBean() {
        ServletRegistrationBean bean = new ServletRegistrationBean(new SecondServlet());
        bean.addUrlMappings("/second");
        return bean;
    }
}
```

运行结果：

## 3.通过注解扫描完成 Filter 组件注册

**创建 Filter：**

```java
package com.dqcgm.springbootweb.filter;
import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import java.io.IOException;
@WebFilter(filterName = "FirstFilter",urlPatterns = "/FirstFilter")
public class FirstFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        System.out.println("进入FirstFilter...........");
        filterChain.doFilter(servletRequest,servletResponse);
        System.out.println("离开FirstFilter............");
    }
    @Override
    public void destroy() {
    }
}
```

**修改启动类：**

```java
package com.dqcgm.springbootweb;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;
@SpringBootApplication
@ServletComponentScan//在 spring Boot 启动时会扫描@WebServlet 注解，并将该类实例化
public class SpringbootwebApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootwebApplication.class, args);
    }
}
```

运行结果：

## 4.通过方法完成 Filter 组件注册

**创建 Filter：**

```java
package com.dqcgm.springbootweb.filter;
import javax.servlet.*;
import java.io.IOException;
public class SecondFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        System.out.println("进入SecondFilter...........");
        filterChain.doFilter(servletRequest,servletResponse);
        System.out.println("离开SecondFilter............");
    }
    @Override
    public void destroy() {
    }
}
```

**创建 Filter 配置类：**

```java
package com.dqcgm.springbootweb.filter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class FilterConfig {
    @Bean
    public FilterRegistrationBean getFilterRegistrationBean(){
        FilterRegistrationBean bean = new FilterRegistrationBean(new SecondFilter());
        bean.addUrlPatterns("/SecondFilter");
        return bean;
    }
}
```

## 5.通过注解扫描完成 Listener 组件注册

**编写 Listener：**

```java
package com.dqcgm.springbootweb.listener;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;
@WebListener
public class FirstListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println("Listener init ............");
    }
    @Override
    public void contextDestroyed(ServletContextEvent sce) {
    }
}
```

**修改启动类：**

```java
package com.dqcgm.springbootweb;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;
@SpringBootApplication
@ServletComponentScan//在 spring Boot 启动时会扫描@WebServlet 注解，并将该类实例化
public class SpringbootwebApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootwebApplication.class, args);
    }
}
```

运行结果：

## 6.通过方法完成 Listener 组件注册

**编写 Listener：**

```java
package com.dqcgm.springbootweb.listener;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;
public class SecondListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println("SecondListener init ............");
    }
    @Override
    public void contextDestroyed(ServletContextEvent sce) {
    }
}
```

**创建 Listener 配置类：**

```java
package com.dqcgm.springbootweb.listener;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class ListenerConfig {
    @Bean
    public ServletListenerRegistrationBean getServletListenerRegistrationBean(){
        ServletListenerRegistrationBean bean = new ServletListenerRegistrationBean(new SecondListener());
        return bean;
    }
}
```

运行结果：
