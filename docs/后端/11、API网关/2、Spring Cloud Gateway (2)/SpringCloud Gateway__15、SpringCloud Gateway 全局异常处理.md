# 15、SpringCloud Gateway 全局异常处理
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/15.html
- 分类：API网关
- 分组：SpringCloud Gateway
在全局过滤器中可以处理网络异常请求，但是当设置Gateway请求超时时间，超时后的异常全局过滤器中处理不了。

## 定义CustomWebExceptionHandler类

```java
import com.alibaba.csp.sentinel.slots.block.BlockException;
import com.tigerkin.util.ApiResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.HttpMessageReader;
import org.springframework.http.codec.HttpMessageWriter;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.RequestPredicates;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.reactive.result.view.ViewResolver;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.Collections;
import java.util.List;
/**
 * @ClassName CustomWebExceptionHandler
 * @Description 自定义异常处理
 * @Author tigerkin
 * @Date 2022/3/15 14:10
 */
@Component
public class CustomWebExceptionHandler implements ErrorWebExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(CustomWebExceptionHandler.class);
    /**
     * MessageReader
     */
    private List<HttpMessageReader<?>> messageReaders = Collections.emptyList();
    /**
     * MessageWriter
     */
    private List<HttpMessageWriter<?>> messageWriters = Collections.emptyList();
    /**
     * ViewResolvers
     */
    private List<ViewResolver> viewResolvers = Collections.emptyList();
    /**
     * 存储处理异常后的信息
     */
    private ThreadLocal<ApiResult> exceptionHandlerResult = new ThreadLocal<>();
    /**
     * 参考AbstractErrorWebExceptionHandler
     */
    public void setMessageReaders(List<HttpMessageReader<?>> messageReaders) {
        Assert.notNull(messageReaders, "'messageReaders' must not be null");
        this.messageReaders = messageReaders;
    }
    /**
     * 参考AbstractErrorWebExceptionHandler
     */
    public void setViewResolvers(List<ViewResolver> viewResolvers) {
        this.viewResolvers = viewResolvers;
    }
    /**
     * 参考AbstractErrorWebExceptionHandler
     */
    public void setMessageWriters(List<HttpMessageWriter<?>> messageWriters) {
        Assert.notNull(messageWriters, "'messageWriters' must not be null");
        this.messageWriters = messageWriters;
    }
    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        // 按照异常类型进行处理
        HttpStatus httpStatus;
        String body;
        if (ex instanceof ResponseStatusException) {
            ResponseStatusException responseStatusException = (ResponseStatusException) ex;
            httpStatus = responseStatusException.getStatus();
            body = responseStatusException.getMessage();
        } else if (ex instanceof BlockException) { // Sentinel Block 异常
            httpStatus = HttpStatus.TOO_MANY_REQUESTS;
            body = "服务器压力山大，请稍后再试！";
        } else {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
            body = httpStatus.name();
        }
        ServerHttpRequest request = exchange.getRequest();
        log.error("[全局异常处理] 异常请求路径:{}, 记录异常信息:{}", request.getPath(), ex.getMessage());
        // 参考AbstractErrorWebExceptionHandler
        if (exchange.getResponse().isCommitted()) {
            return Mono.error(ex);
        }
        exceptionHandlerResult.set(ApiResult.error(httpStatus, body));
        ServerRequest newRequest = ServerRequest.create(exchange, this.messageReaders);
        return RouterFunctions.route(RequestPredicates.all(), this::renderErrorResponse).route(newRequest)
                .switchIfEmpty(Mono.error(ex))
                .flatMap((handler) -> handler.handle(newRequest))
                .flatMap((response) -> write(exchange, response));
    }
    /**
     * 参考DefaultErrorWebExceptionHandler
     * 在这里定义返回的是Json还是Html
     */
    protected Mono<ServerResponse> renderErrorResponse(ServerRequest request) {
        ApiResult result = exceptionHandlerResult.get();
        return ServerResponse.status(result.getCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(result));
    }
    /**
     * 参考AbstractErrorWebExceptionHandler
     */
    private Mono<? extends Void> write(ServerWebExchange exchange,
                                       ServerResponse response) {
        exchange.getResponse().getHeaders()
                .setContentType(response.headers().getContentType());
        return response.writeTo(exchange, new ResponseContext());
    }
    /**
     * 参考AbstractErrorWebExceptionHandler
     */
    private class ResponseContext implements ServerResponse.Context {
        @Override
        public List<HttpMessageWriter<?>> messageWriters() {
            return CustomWebExceptionHandler.this.messageWriters;
        }
        @Override
        public List<ViewResolver> viewResolvers() {
            return CustomWebExceptionHandler.this.viewResolvers;
        }
    }
}
```

## 定义ExceptionConfig类

```java
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.web.reactive.result.view.ViewResolver;
import java.util.Collections;
import java.util.List;
@Configuration
public class ExceptionConfig {
    /**
     * 自定义异常处理[@@]注册Bean时依赖的Bean，会从容器中直接获取，所以直接注入即可
     */
    @Primary
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public ErrorWebExceptionHandler errorWebExceptionHandler(ObjectProvider<List<ViewResolver>> viewResolversProvider,
                                                             ServerCodecConfigurer serverCodecConfigurer,
                                                             CustomWebExceptionHandler customWebExceptionHandler) {
        customWebExceptionHandler.setViewResolvers(viewResolversProvider.getIfAvailable(Collections::emptyList));
        customWebExceptionHandler.setMessageWriters(serverCodecConfigurer.getWriters());
        customWebExceptionHandler.setMessageReaders(serverCodecConfigurer.getReaders());
        return customWebExceptionHandler;
    }
}
```

将配置类放进项目中，就可以实现全局异常处理。

## ApiResult类

```java
public class ApiResult<T> implements Serializable {
    private static final long serialVersionUID = 1166356696537391753L;
    private Integer code;
    private String msg;
    private T data;
    public ApiResult() {
    }
    public ApiResult(Integer code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }
    public static ApiResult success() {
        return new ApiResult(HttpStatus.OK.value(), "success", null);
    }
    public static ApiResult success(String msg) {
        return new ApiResult(HttpStatus.OK.value(), msg, null);
    }
    public static ApiResult success(String msg, Object data) {
        return new ApiResult(HttpStatus.OK.value(), msg, data);
    }
    public static ApiResult error(HttpStatus status, String msg) {
        return new ApiResult(status.value(), msg, null);
    }
    public Integer getCode() {
        return code;
    }
    public void setCode(Integer code) {
        this.code = code;
    }
    public String getMsg() {
        return msg;
    }
    public void setMsg(String msg) {
        this.msg = msg;
    }
    public T getData() {
        return data;
    }
    public void setData(T data) {
        this.data = data;
    }
    @Override
    public String toString() {
        return "Result{" +
                "code=" + code +
                ", msg='" + msg + '\'' +
                ", data=" + data +
                '}';
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
