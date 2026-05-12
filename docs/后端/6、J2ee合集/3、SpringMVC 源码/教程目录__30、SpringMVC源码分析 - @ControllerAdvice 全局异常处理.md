# 30、SpringMVC源码分析 - @ControllerAdvice 全局异常处理
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/30.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

在请求到达了 DispatcherServlet 的处理流程，进入 doDispatch( ) 以及后续流程处理业务的过程中出现异常，会进入到 processDispatchResult( ) 处理异常，此时，如果定义了@ControllerAdvice、@RestControllerAdvice 对应的方法能够处理该异常，则进入对应的方法进行异常处理。

## 一、示例

**1、** 返回值结构：；

```java
@Data
@ToString(callSuper = true)
@Accessors(chain = true)
@AllArgsConstructor
public class ResponseEntity<T> implements Serializable {
    /**
     * 状态码
     */
    protected Integer status;
    /**
     * 提示信息
     */
    protected String msg;
    /**
     * 错误描述
     */
    protected String desc;
    /**
     * 返回数据
     */
    protected T data;
	 public ResponseEntity() {
        this.message = "操作成功";
        this.status = 200;
    }
   }
```

**2、** 全局异常处理；

定义一些处理异常的方法，可以添加项目中自定义的一些异常

```java
@RestControllerAdvice
@Component
@Slf4j
public class CustomExceptionAdivsor {
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity to400(MethodArgumentNotValidException e) {
        ResponseEntity responseEntity = new ResponseEntity()
                .setStatus(HttpStatus.BAD_REQUEST.value())
                .setDesc(e.getMessage());
        return responseEntity;
    }
    @ExceptionHandler(value = AuthorizationException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity to403(AuthorizationException e) {
        ResponseEntity responseEntity = new ResponseEntity()
                .setStatus(HttpStatus.FORBIDDEN.value())
                .setDesc(e.getMessage());
        return responseEntity;
    }
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity to500(RuntimeException e) {
        ResponseEntity responseEntity = new ResponseEntity()
                .setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .setDesc(e.getMessage());
        return responseEntity;
    }
    @ExceptionHandler(value = Throwable.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity to500(Throwable throwable) {
        ResponseEntity responseEntity = new ResponseEntity()
                .setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .setDesc(throwable.getMessage());
        return responseEntity;
    }
}
```

**3、** @RestControllerAdvice；

@RestControllerAdvice 包含了 @ControllerAdvice 和 @ResponseBody

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ControllerAdvice
@ResponseBody
public @interface RestControllerAdvice {
```

## 二、原理

在上一篇文章中分析过了
