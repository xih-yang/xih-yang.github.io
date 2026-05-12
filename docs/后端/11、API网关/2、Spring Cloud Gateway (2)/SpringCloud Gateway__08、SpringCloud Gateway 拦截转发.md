# 08、SpringCloud Gateway 拦截转发
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/8.html
- 分类：API网关
- 分组：SpringCloud Gateway
**1、** application.yml配置；

```sh
spring:
  cloud:
    gateway:
      routes:
      - id: remoteaddr_route
        uri: http://localhost:8080
        predicates:
          - Path=/test
        filters:
          - RewritePath=/test, /add
          - Test
```

参数解析：

predicates：当满足predicates下的条件时，即path路径为/test时网关生效。

uri：跳转到uri(注意:此处为uri不是url)。

filters：filters 下的RewritePath会将路径重定义将/test换为/add。若不加此处就会将path所带路径自动拼接到uri后面。

最后一行的- Test 是文件名，下面会写到

**2、** 网关实现；

网关的主要实现由Filter，Mono，GatewayFilterFactory三部分组成。

解析：

GatewayFilterFactory：上面的-Test的文件名就是此处的名称应为TestGatewayFilterFactory，网关匹配时会自动忽略后面的GatewayFilterFactory，从而通过Test找到TestGatewayFilterFactory。

```java
@Component
@Slf4j
@Lazy
public class TestGatewayFilterFactory extends AbstractGatewayFilterFactory {
    @Autowired
    TestFilter TestFilter;
    @Override
    public GatewayFilter apply(Object config) {
        return TestFilter;
    }
}
```

Filter：相当于一个中间层

```java
@Component
public class TestFilter implements GatewayFilter, Ordered {
    @Autowired
    TestMono TestMono;
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return TestMono.testMono(exchange, chain);
    }
    @Override
    public int getOrder() {
        return -2;
    }
}
```

Mono：主要的逻辑实现层

主要实现由testMono来协调，网关转发的请求的解析在此方法内实现，若有解密需求在此方法内添加方法即可。

requestDecorator：此方法用于请求的转换，代码中实现的是将post请求转为get。

urlEncodeUTF8：在此代码的实现中用于解析post请求的参数将其拼接到get请求中。

responseDecorator：网关处理完毕后返回的结果将在这里包装后输出，若有加密在此方法内执行。

```java
@Component
@Slf4j
public class TestMono {
//主方法
public Mono<Void> testMono(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ServerHttpResponse response = exchange.getResponse();
        return DataBufferUtils.join(request.getBody())
                .flatMap(dataBuffer -> {
                    DataBufferUtils.retain(dataBuffer);
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    //释放掉内存
                    DataBufferUtils.release(dataBuffer);
                    String body = new String(bytes, StandardCharsets.UTF_8);
                    URI url = request.getURI();
                    log.info("url: {}", url);
                    JSONObject bodyJson = JSON.parseObject(body);
                    JSONObject innerBody = bodyJson.getJSONObject("BODY");
                    return chain.filter(exchange.mutate().request(requestDecorator(request, innerBody)).response(responseDecorator(response)).build());
                });
    }
//将post请求转换成get（若是get可连同下面的方法省略）
    private static ServerHttpRequestDecorator requestDecorator(ServerHttpRequest request, JSONObject body) {
        return new ServerHttpRequestDecorator(request) {
            // 重新设置http method
            @Override
            public HttpMethod getMethod() {
                return HttpMethod.GET;
            }
            @Override
            public String getMethodValue() {
                return "GET";
            }
            // 转换请求参数
            @Override
            public URI getURI() {
                String params = urlEncodeUTF8(body);
                return URI.create(request.getURI() + "?" + params);
            }
        };
    }
    /**
     * 转换urlparam
     *（post请求忽略）
     * @param jsonObject
     * @return
     */
    private static String urlEncodeUTF8(JSONObject jsonObject) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : jsonObject.entrySet()) {
            if (sb.length() > 0) {
                sb.append("&");
            }
            sb.append(String.format("%s=%s",
                    entry.getKey(),
                    entry.getValue()
            ));
        }
        log.info("format param: {}", sb);
        return sb.toString();
    }
//网关转出
    private ServerHttpResponseDecorator responseDecorator
            (ServerHttpResponse response) {
        return new ServerHttpResponseDecorator(response) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                if (body instanceof Flux) {
                    Flux<? extends DataBuffer> flux = Flux.from(body);
                    return super.writeWith(flux.buffer().map(dataBuffers -> {
                        DataBufferFactory dataBufferFactory = new NettyDataBufferFactory(ByteBufAllocator.DEFAULT);
                        StringBuilder sb = new StringBuilder("");
                        DataBuffer join = dataBufferFactory.join(dataBuffers);
                        byte[] bytes = new byte[join.readableByteCount()];
                        join.read(bytes);
                        DataBufferUtils.release(join);
                        String s = new String(bytes, StandardCharsets.UTF_8);
                        sb.append(s);
                        //去掉字符串最外层的[]
                        //sb.deleteCharAt(0).deleteCharAt(sb.length() - 1);
                        // 构造返回报文
                        JSONObject jsonBody = JSON.parseObject(sb.toString(), JSONObject.class, Feature.OrderedField);
                        String content = JSON.toJSONString(jsonBody, SerializerFeature.WRITE_MAP_NULL_FEATURES, SerializerFeature.QuoteFieldNames, SerializerFeature.PrettyFormat);
                        byte[] contentByte = content.getBytes();
                        // 重置content-length
                        response.getHeaders().setContentLength(contentByte.length);
                        return response.bufferFactory().wrap(contentByte);
                    }));
                }
                return super.writeWith(body);
            }
        };
    }
}
```

Spring cloud gateway学习地址：[Spring Cloud Gateway 2.1.0 中文官网文档 - 云+社区 - 腾讯云](https://cloud.tencent.com/developer/article/1403887)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
