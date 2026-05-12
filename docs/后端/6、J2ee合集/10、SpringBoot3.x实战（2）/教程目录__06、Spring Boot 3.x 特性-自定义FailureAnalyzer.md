# 06、Spring Boot 3.x 特性-自定义FailureAnalyzer
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/6.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
### 自定义FailureAnalyzer

`FailureAnalyzer`拦截Spring Boot程序启动异常,将异常信息包装成可读性更好的消息，并且包装成`FailureAnalysis`对象。Spring Boot默认提供了大量的`FailureAnalyzer`。

如果要实现自定义的`FailureAnalyzer`,只需要实现`AbstractFailureAnalyzer`抽象类,接下来先模拟程序启动异常。

```java
public class CustomerFailException extends RuntimeException {
}
```

```java
@SpringBootApplication
public class CustomerFailureanalyzerApplication {
    public static void main(String[] args) {
        SpringApplication.run(CustomerFailureanalyzerApplication.class, args);
    }
    @Bean
    public TestBean testBean() {
        return new TestBean();
    }
    class TestBean {
        public TestBean() {
            throw new CustomerFailException();
        }
    }
}
```

程序启动报错如下：

接下来自定义`FailureAnalyzer`,处理`CustomerFailException`异常。

**1、** 创建自定义`FailureAnalyzer`继承`AbstractFailureAnalyzer`；

```java
public class ArithmeticExceptionFailureAnalyzer extends AbstractFailureAnalyzer<CustomerFailException> {
    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, CustomerFailException cause) {
        return new FailureAnalysis(cause.getMessage(), "检测Bean初始化是否正常!", cause);
    }
}
```

**2、** 注册自定义`FailureAnalyzer`,在`resources`目录新建`META-INF/spring.factories`文件，添加如下内容:；

```java
org.springframework.boot.diagnostics.FailureAnalyzer=com.example.customerfailureanalyzer.ArithmeticExceptionFailureAnalyzer
```

**3、** 启动应用程序；

注意:**main线程抛出的异常无法处理**,如下例子:

```java
@SpringBootApplication
public class CustomerFailureanalyzerApplication {
    public static void main(String[] args) {
        TestBean testBean=new TestBean();
        SpringApplication.run(CustomerFailureanalyzerApplication.class, args);
    }
    static class TestBean {
        public TestBean() {
            throw new CustomerFailException();
        }
    }
}
```

启动程序:
