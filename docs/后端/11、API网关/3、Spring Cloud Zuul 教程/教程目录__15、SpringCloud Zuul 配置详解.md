# 15、SpringCloud Zuul 配置详解
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/15.html
- 分类：API网关
- 分组：教程目录
SpringCloud Zuul 作为网关存在，主要负责请求的分发，下面详细讲解zuul的所有核心配置（如有不对之处请各位大佬在评论指出）：

```shell
zuul:
  # 是否开启重试，默认为false
  # 注意使用此功能需要引入依赖，并且需要配合最下面的ribbon配置一起使用
  #        <dependency>
  #          <groupId>org.springframework.retry</groupId>
  #         <artifactId>spring-retry</artifactId>
  #    </dependency>
  retryable: false
  # 设置全局访问的前缀，配置之后所有请求前缀需要加上/api
  prefix: /api
  # 配置该属性将会禁止header中的某些属性向下传递，默认为"Cookie", "Set-Cookie", "Authorization"
  # 其源码在PreDecorationFilter.run()中体现，其原理主要是将配置项加入下面的ignored-headers而已
  sensitive-headers:
    - Cookie
    - Set-Cookie
    - Authorization
    - token
  # 忽略请求头中的某些属性，具体实现在构建ProxyRequestHelper.buildZuulRequestHeaders(HttpServletRequest request) 中体现，
  # 会根据配置的ignored-headers排除掉忽略的header然后重新构造一个header供ribbon使用
  ignored-headers:
    - token
  # 此属性只会对SimpleHostRoutingFilter生效，RibbonRoutingFilter使用的是ribbon的配置
  host:
    # 最大连接数，默认为200
    max-total-connections: 200
    # 单个路由可以使用的最大连接数，默认为20
    max-per-route-connections: 20
    # http client中从connection pool中获得一个connection的超时时间，默认为-1，不超时
    connection-request-timeout-millis: -1
    # 连接建立的超时时间；，默认为2000ms
    connect-timeout-millis: 2000
    # 响应超时时间，默认为10000ms
    socket-timeout-millis: 10000
  # 路由规则
  routes:
    # 用户自定义一个名称，内部是一个Map<String, ZuulRoute>
    user-server:
      # 需要拦截后转发请求的地址，支持通配符匹配，不配置默认为/user-server/**
      path: /user-server/**
      # spring cloud服务id，不配默认为上面自定义的名称
      serverId: user-server
      # 是否支持上面的prefix，默认为true，设为false访问该服务前缀不需要/api
      stripPrefix: true
      # 将请求发送到指定的服务器，不会走ribbon、hystrix，正常请求是走RibbonRoutingFilter，此请求会走SimpleHostRoutingFilter
      url: http://localhost:9000
      # 和全局配置作用一样，优先级高于全局配置
      sensitive-headers:
        - Cookie
        - Set-Cookie
        - Authorization
      # 是否启用自定义配置，默认为false,初始化时会根据sensitive-headers的长度来判断，长度大于0则为true
      custom-sensitive-headers: false
  # 可配置THREAD（线程池模式）, SEMAPHORE（信号量模式），默认为SEMAPHORE
  # 此功能是基于hystrix实现，将请求包装为一个HystrixCommond，hystrix内部自身实现了熔断、隔离等机制
  ribbonIsolationStrategy: SEMAPHORE
  # 可以通过这个配置控制所有服务的信号量，默认为100，这里指的是每个服务都是100不是所有服务加起来为100
  semaphore:
    maxSemaphores: 100
  # 单独配置每个服务的信号量，不配置默认为100
  eureka:
    # 用户自定义一个名称
    user-server:
      # 信号量模式
      semaphore:
        # 最大访问量，默认为全局配置的值也就是100，单独配置的优先级高于全局配置
        # 此配置的源码在AbstractRibbonCommand.getSetter(final String commandKey,ZuulProperties zuulProperties, IClientConfig config)中被使用
        maxSemaphores: 100
# ribbon配置,ribbon的初始化源码在RibbonClientConfiguration.ribbonClientConfig()
# 核心代码为config.loadProperties(this.name);这句代码加载了ribbon的配置
# 重试是针对在eureka注册表中能够获取到服务对应的实例然后发起http请求失败时生效，如果根本无法获取到服务实例则会直接抛出异常
ribbon:
  # 下面三个参数在源码DefaultLoadBalancerRetryHandler的构造方法中被使用
  # 构造方法：public DefaultLoadBalancerRetryHandler(IClientConfig clientConfig)
  # 是否所有请求都启用重试机制，默认为false，源码中发现默认的时候只支持的是GET请求，如果配置为true支持所有请求
  # 源码：return HttpMethod.GET == method || lbContext.isOkToRetryOnAllOperations();
  # 重试核心源代码在RetryTemplate.doExecute(RetryCallback<T, E> retryCallback,RecoveryCallback<T> recoveryCallback, RetryState state)
  # 重试的原理如下图所示，N代表第一次请求，R代表重试
  # 第一种情况MaxAutoRetries=1，MaxAutoRetriesNextServer=1，总请求次数为4次
  # NR NR
  # 第二种情况MaxAutoRetries=2，MaxAutoRetriesNextServer=1，总请求次数为6次
  # NRR NRR
  # 第三种情况MaxAutoRetries=1，MaxAutoRetriesNextServer=2，总请求次数为6次
  # NR NR NR
  # 第四种情况MaxAutoRetries=2，MaxAutoRetriesNextServer=2，总请求次数为9次
  # NRR NRR NRR
  OkToRetryOnAllOperations: true
  # 当前实例重试次数，默认为0
  MaxAutoRetries: 1
  # 切换实例重试次数，默认为1
  MaxAutoRetriesNextServer: 2        
```
