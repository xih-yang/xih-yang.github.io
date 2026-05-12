# 11、Spring Boot - 中异常处理与单元测试
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/11.html
- 分类：J2EE框架
- 分组：教程目录
## 1.异常处理

- SpringBoot 中对于异常处理提供了五种处理方式

### 1.自定义错误页面

- SpringBoot 默认的处理异常的机制：SpringBoot默认的已经提供了一套处理异常的机制。一旦程序中出现了异常 SpringBoot 会向/error 的 url 发送请求。在 SpringBoot 中提供了一个名为 BasicErrorController 来处理/error 请求，然后跳转到默认显示异常的页面来展示异常信息。
- 如果我们需要将所有的异常同一跳转到自定义的错误页面，需要再 src/main/resources/templates 目录下创建 error.html 页面。注意：页面名称必须叫 error

### 2.通过@ExceptionHandler 注解处理异常

#### 1.修改Controller

#### 1.修改Controller

```java
@Controller
public class UsersController {
    @RequestMapping("/showInfo")
    public String showInfo() {
        String str = null;
        str.length();
        return "ok";
    }
    @ExceptionHandler(value = {java.lang.NullPointerException.class} )
    public ModelAndView nullpointExcepitonHandler(Exception e){
        ModelAndView mv = new ModelAndView();
        mv.addObject("err",e.toString());
        mv.setViewName("error1");
        return mv;
    }
}
```

#### 2.创建页面

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>地球村公民</title>
</head>
<body>
出错了。。。
<span th:text="${err}"/>
</body>
</html>
```

### 3.通过@ControllerAdvice 与@ExceptionHandler 注解处理异常

```java
@ControllerAdvice
public class GlobalException {
   @ExceptionHandler(value = {java.lang.NullPointerException.class} )
    public ModelAndView nullpointExcepitonHandler(Exception e){
        ModelAndView mv = new ModelAndView();
        mv.addObject("err",e.toString());
        mv.setViewName("error1");
        return mv;
    }
    @ExceptionHandler(value = {java.lang.ArithmeticException.class} )
    public ModelAndView arithmeticExceptionHandler(Exception e){
        ModelAndView mv = new ModelAndView();
        mv.addObject("err",e.toString());
        mv.setViewName("error2");
        return mv;
    }
}
```

### 4.通过 SimpleMappingExceptionResolver 对象处理异常

```java
@Configuration
public class GlobalException2 {
    /**
     * 此方法返回值必须是SimpleMappingExceptionResolver对象
     * @return
     */
    @Bean
    public SimpleMappingExceptionResolver getSimpleMappingExceptionResolver(){
        SimpleMappingExceptionResolver resolver = new SimpleMappingExceptionResolver();
        Properties properties = new Properties();
        /**
      参数一：异常类型，并且是全名
      参数二：视图名称
     */
        properties.put("java.lang.NullPointerException","error3");
        properties.put("java.lang.ArithmeticException","error4");
        resolver.setExceptionMappings(properties);
        return resolver;
    }
}
```

### 5.通过自定义 HandlerExceptionResolver 对象处理异常

```java
@Configuration
public class GlobalException3 implements HandlerExceptionResolver {
    @Override
    public ModelAndView resolveException(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Object handler, Exception e) {
        ModelAndView mv = new ModelAndView();
        //判断不同异常类型，做不同视图的跳转
        if (e instanceof NullPointerException) {
            mv.setViewName("error5");
        }
        if (e instanceof ArithmeticException) {
            mv.setViewName("error6");
        }
        mv.addObject("error", e.toString());
        return mv;
    }
}
```

2.Spring Boot 整合Junit单元测试

SpringBoot2.x 使用 Junit5 作为测试平台

### 1.修改 POM 文件添加 Test 启动器

```xml
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
```

### 2.编写测试代码

```java
@SpringBootTest
class SpringbootexcepionandjunitApplicationTests {
    @Autowired
    private UsersServiceImpl usersService;
    @Test
    void suibian() {
        this.usersService.addUser();
    }
}
```
