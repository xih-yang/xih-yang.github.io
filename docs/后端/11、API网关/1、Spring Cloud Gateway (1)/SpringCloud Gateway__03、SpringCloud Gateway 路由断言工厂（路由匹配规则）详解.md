# 03、SpringCloud Gateway 路由断言工厂（路由匹配规则）详解
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/19.html
- 分类：API网关
- 分组：SpringCloud Gateway
## RoutePredicateFactory

在上篇的入门案例中，我们使用 Path 实现了一个简单的针对请求路径的转发规则，在编写路由时，需要配置id、uri、predicates。

Spring Cloud Gateway 创建 Route对象时，使用RoutePredicateFactory 创建 Predicate对象，Predicate对象可以赋值给Route。

Spring Cloud Gateway包含许多内置的 Route Predicate Factories：

- 所有这些断言都匹配 HTTP请求的不同属性。
- 多个Route Predicate Factories可以通过逻辑与(and)结合起来一起使用。
- 路由断言工厂RoutePredicateFactory包含的主要实现类如图所示，包括Datetime、请求的远程地址、路由权重、请求头、Http地址、请求方法、请求路径和请求参数等类型的路由断言。

还可以查看RoutePredicateFactory 接口的实现类，每个都对应了一个规则。

## Spring Cloud Gateway提供的路由断言工厂（路由规则）

### After

`AfterRoutePredicateFactory`有一个参数datetime（Java ZonedDateTime）。表示匹配在指定日期时间之后发生的请求。

```bash
spring:
  cloud:
    gateway:
      enabled: true
      routes:
      - id: app-service001 路由唯一ID
        uri: http://localhost:9000    目标URI,
        predicates:   断言，为真则匹配成功
        匹配亚洲上海时间 2021-11-29：17:42:47 以后的请求
        - After=2021-11-29T17:42:47.000+08:00[Asia/Shanghai]
       - Path=/app1/** 配置规则Path，如果是app1开头的请求，则会将该请求转发到目标URL
  application:
```

以上案例表示2021-11-29 17:42:47以后的请求才会被转发，这个时间之前的请求，则会报错404。

### Before

`BeforeRoutePredicateFactory`有一个参数datetime（Java ZonedDateTime）。匹配发生在指定日期时间之前的请求。

以下示例表示2017-01-20T17:42:47 之前的请求将被转发。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: before_route
        uri: https://example.org
        predicates:
        - Before=2017-01-20T17:42:47.789-07:00[America/Denver]
```

可以看到源码中，对时间进行了校验，如果不是配置时间的之前日期，则会返回false，表示断言不通过。

```java
public class BeforeRoutePredicateFactory extends AbstractRoutePredicateFactory<BeforeRoutePredicateFactory.Config> {
    public static final String DATETIME_KEY = "datetime";
    public BeforeRoutePredicateFactory() {
        super(BeforeRoutePredicateFactory.Config.class);
    }
	// 配置项排序
    public List<String> shortcutFieldOrder() {
        return Collections.singletonList("datetime");
    }
    public Predicate<ServerWebExchange> apply(BeforeRoutePredicateFactory.Config config) {
        return new GatewayPredicate() {
            public boolean test(ServerWebExchange serverWebExchange) {
            	// 对时间进行了校验，如果不是配置时间的之前日期，则会返回false，表示断言不通过。
                ZonedDateTime now = ZonedDateTime.now();
                return now.isBefore(config.getDatetime());
            }
            public String toString() {
                return String.format("Before: %s", config.getDatetime());
            }
        };
    }
	//  配置项
    public static class Config {
        private ZonedDateTime datetime;
        public Config() {
        }
        public ZonedDateTime getDatetime() {
            return this.datetime;
        }
        public void setDatetime(ZonedDateTime datetime) {
            this.datetime = datetime;
        }
    }
}
```

### Between

`BetweenRoutePredicateFactory`有两个参数，datetime1、datetime2 （Java ZonedDateTime）。匹配发生在 datetime1之后和datetime2之前的请求。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: between_route
        uri: https://example.org
        predicates:
        - Between=2017-01-20T17:42:47.789-07:00[America/Denver], 2017-01-21T17:42:47.789-07:00[America/Denver]
```

此路由匹配 2017 年 1 月 20 日 17:42之后和 2017 年 1 月 21 日 17:42 之前发送的任何请求。

### Cookie

`CookieRoutePredicateFactory`可以接收两个参数，一个是 Cookie 名称,一个是正则表达式，路由规则会通过获取对应的 Cookie 名称值和正则表达式去匹配，如果匹配上就会执行路由，如果没有匹配上则不执行。

以下路由匹配具有名为chocolate的cookie，且该 cookie的值以 ch.p开头的请求。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: cookie_route
        uri: https://example.org
        predicates:
        - Cookie=chocolate, ch.p
```

### Header

`HeaderRoutePredicateFactory`和 Cooki一样，也是接收 2 个参数，一个 header 中属性名称和一个正则表达式，这个属性值和正则表达式匹配则执行。

以下示例表示如果请求具有名称X-Request-Id与\d+正则表达式（即，它具有一位或多位数字的值）匹配的请求头，则此路由匹配。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: header_route
        uri: https://example.org
        predicates:
        - Header=X-Request-Id, \d+
```

### Host

`HostRoutePredicateFactory` 接收一组参数，一组匹配的域名列表。它通过参数中的主机地址作为匹配规则。

以下配置表示消息头中的Host以somehost.org或者anotherhost.org结尾则会匹配转发。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: host_route
        uri: https://example.org
        predicates:
        - Host=**.somehost.org,**.anotherhost.org
```

### Method

`MethodRoutePredicateFactory` 需要methods的参数，它是一个或多个参数，使用HTTP方法来匹配。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: method_route
        uri: https://example.org
        predicates:
        - Method=GET,POST
```

如果请求方法是GET或POST，则此路由匹配。

### Path

`PathRoutePredicateFactory`接收一个匹配路径的参数。使用请求路径来匹配。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: path_route
        uri: https://example.org
        predicates:
        - Path=/red/{
     segment},/blue/{
     segment}
```

如果请求路径是，例如：/red/1、 /red/1/、 /red/blueor、/blue/green ，则此路由匹配。

### Query

`QueryRoutePredicateFactory`接受两个参数，请求参数和可选的regexp（Java正则表达式）。

以下配置表示，必须包含一个名为green的参数，并且其值匹配正则表达式 gree.。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: query_route
        uri: https://example.org
        predicates:
        - Query=green,gree.
```

### RemoteAddr

`RemoteAddrRoutePredicateFactory`通过请求 ip 地址进行匹配，

以下配置表示如果请求的远程地址是192.168.1.10 ，则此路由匹配。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: remoteaddr_route
        uri: https://example.org
        predicates:
        - RemoteAddr=192.168.1.1/24
```

默认情况下，RemoteAddr使用来自传入请求的远程地址。如果 Spring Cloud Gateway 位于代理层之后，这可能与实际客户端 IP 地址不匹配。

您可以通过设置自定义RemoteAddressResolver带有一个非默认远程地址解析器。

### Weight

`WeightRoutePredicateFactory`有两个参数：group 和 weight（一个int数值）。权重是按组计算的。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: weight_high
        uri: https://weighthigh.org
        predicates:
        - Weight=group1, 8
      - id: weight_low
        uri: https://weightlow.org
        predicates:
        - Weight=group1, 2
```

该路由会将约 80% 的流量转发到weighthigh.org，将约 20% 的流量转发到weightlow.org。
