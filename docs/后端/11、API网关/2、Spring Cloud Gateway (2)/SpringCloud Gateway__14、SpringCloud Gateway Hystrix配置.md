# 14、SpringCloud Gateway Hystrix配置
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/14.html
- 分类：API网关
- 分组：SpringCloud Gateway
适用版本 spring cloud gateway 2.0.0 及以上 之前的版本我没使用过，说不定可以行。

最初我们用的是这种配置方式

```sh
spring.cloud.gateway.default-filters[1].name=Hystrix
spring.cloud.gateway.default-filters[1].args.name=fallbackcmd
spring.cloud.gateway.default-filters[1].args.fallbackUri=forward:/fallback
```

并且我们并没有给每一个服务单独配置路由 而是使用了服务发现自动注册路由的方式

也就是通过

```sh
spring.cloud.gateway.discovery.locator.enabled=true
```

这样配置会涉及到一个很严重的问题 那就是 所有服务公用一个熔断 fallbackcmd 这会导致 当一个子服务熔断后，所有服务都被熔断了。整个集群都不可用了。

这时我们应该怎么办 第一 为每个服务单独配置一个route 在 这个route的filters里配置hystrix

```sh
spring.cloud.gateway.routes[8].id = dsd
spring.cloud.gateway.routes[8].uri = lb://TEST-DEMO2
spring.cloud.gateway.routes[8].predicates[0].name = Path
spring.cloud.gateway.routes[8].predicates[0].args[pattern] = /TEST-DEMO2/test/**
spring.cloud.gateway.routes[8].filters[0].name = Hystrix
spring.cloud.gateway.routes[8].filters[0].args.name = fallbackcmd
spring.cloud.gateway.routes[8].filters[0].args.fallbackUri = forward:/fallback
spring.cloud.gateway.routes[8].filters[1] = StripPrefix=1
spring.cloud.gateway.routes[8].order = -2
```

这样在兼容原有调用方式的同时 添加了 熔断机制，并且只对该服务生效

但我们几十个服务都要配这个，并且人工还可能出现遗漏。

这时我去翻看了spring cloud gateway 的最新文档发现

可以在discovery 里配置 filter 或者 predicates

于是我尝试使用这个配置

```sh
spring.cloud.gateway.discovery.locator.predicates[0].name: Path
spring.cloud.gateway.discovery.locator.predicates[0].args[pattern]: "'/'+serviceId+'/**'"
spring.cloud.gateway.discovery.locator.predicates[1].name: Host
spring.cloud.gateway.discovery.locator.predicates[1].args[pattern]: "'**.foo.com'"
spring.cloud.gateway.discovery.locator.filters[0].name: Hystrix
spring.cloud.gateway.discovery.locator.filters[0].args[name]: serviceId
spring.cloud.gateway.discovery.locator.filters[1].name: RewritePath
spring.cloud.gateway.discovery.locator.filters[1].args[regexp]: "'/' + serviceId + '/(?<remaining>.*)'"
spring.cloud.gateway.discovery.locator.filters[1].args[replacement]: "'/${remaining}'"
```

加上之后发现我的服务都没法调用了

这时跟进源码 org.springframework.cloud.gateway.discovery.DiscoveryLocatorProperties

在这两个地方debug

这是他默认添加的

这两张是我们手动添加后的

这里发现他给的示例配置中多了“号

去掉

```sh
spring.cloud.gateway.discovery.locator.predicates[0].name: Path
spring.cloud.gateway.discovery.locator.predicates[0].args[pattern]: '/'+serviceId+'/**'
spring.cloud.gateway.discovery.locator.filters[0].name: Hystrix
spring.cloud.gateway.discovery.locator.filters[0].args[name]: serviceId
spring.cloud.gateway.discovery.locator.filters[1].name: RewritePath
spring.cloud.gateway.discovery.locator.filters[1].args[regexp]: '/' + serviceId + '/(?<remaining>.*)'
spring.cloud.gateway.discovery.locator.filters[1].args[replacement]: '/${remaining}'
```

变成这样 此时启动服务就能按照原先方式调用了 ，并且他为每个服务添加了一个 hystrix

但是org.springframework.cloud.gateway.discovery.DiscoveryClientRouteDefinitionLocator中

```java
@Override
 public Flux<RouteDefinition> getRouteDefinitions() {
  SpelExpressionParser parser = new SpelExpressionParser();
  Expression includeExpr = parser
    .parseExpression(properties.getIncludeExpression());
  Expression urlExpr = parser.parseExpression(properties.getUrlExpression());
  Predicate<ServiceInstance> includePredicate;
  if (properties.getIncludeExpression() == null
    || "true".equalsIgnoreCase(properties.getIncludeExpression())) {
   includePredicate = instance -> true;
  }
  else {
   includePredicate = instance -> {
    Boolean include = includeExpr.getValue(evalCtxt, instance, Boolean.class);
    if (include == null) {
     return false;
    }
    return include;
   };
  }
  return Flux.fromIterable(discoveryClient.getServices())
    .map(discoveryClient::getInstances)
    .filter(instances -> !instances.isEmpty())
    .map(instances -> instances.get(0)).filter(includePredicate)
    .map(instance -> {
     String serviceId = instance.getServiceId();
     RouteDefinition routeDefinition = new RouteDefinition();
     routeDefinition.setId(this.routeIdPrefix + serviceId);
     String uri = urlExpr.getValue(evalCtxt, instance, String.class);
     routeDefinition.setUri(URI.create(uri));
     final ServiceInstance instanceForEval = new DelegatingServiceInstance(
       instance, properties);
     for (PredicateDefinition original : this.properties.getPredicates()) {
      PredicateDefinition predicate = new PredicateDefinition();
      predicate.setName(original.getName());
      for (Map.Entry<String, String> entry : original.getArgs()
        .entrySet()) {
       String value = getValueFromExpr(evalCtxt, parser,
         instanceForEval, entry);
       predicate.addArg(entry.getKey(), value);
      }
      routeDefinition.getPredicates().add(predicate);
     }
    // 注意这里 他set了Name
     for (FilterDefinition original : this.properties.getFilters()) {
      FilterDefinition filter = new FilterDefinition();
      filter.setName(original.getName());
     // 这里就是参数的值 他使用el表达式读取值，如果你想添加 一个字符串进来 前后加'即可
      for (Map.Entry<String, String> entry : original.getArgs()
        .entrySet()) {
       String value = getValueFromExpr(evalCtxt, parser,
         instanceForEval, entry);
       filter.addArg(entry.getKey(), value);
      }
      routeDefinition.getFilters().add(filter);
     }
     return routeDefinition;
    });
 }
```

最终在这读取到的route 就是如下，我还没找到怎么给他们设置fallbackUri的方式

至此我们为每个服务添加了一个默认的hystrix 对于有特殊需求的服务来说可以像我上面单独配置route的方式配置，只要order  版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
