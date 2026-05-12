# 09、SpringCloud Gateway 动态路由
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/9.html
- 分类：API网关
- 分组：SpringCloud Gateway
SpringCloud Gateway 路由配置变更的时候，如果不重启网关，是无法生效的，本文介绍如果在不重启网关的情况下，动态刷新路由配置。

### 1、解决路由无法删除的问题

Spring Cloud Gateway 默认使用的**基于内存为存储器**的 InMemoryRouteDefinitionRepository，在GatewayAutoConfiguration中可以看到

```java
@Bean
@ConditionalOnMissingBean(RouteDefinitionRepository.class)
public InMemoryRouteDefinitionRepository inMemoryRouteDefinitionRepository() {
	return new InMemoryRouteDefinitionRepository();
}
```

在InMemoryRouteDefinitionRepository中我们可以看到，只有根据路由id去删除路由的操作。而要获取需要删除的路由的id，是比较复杂的。所以我们在路由变更的时候采用比较暴力的方式，即**清空->重新加载**。所以我们需要对InMemoryRouteDefinitionRepository进行改造。

基于此，我们重新定义了CustomInMemoryRouteDefinitionRepository。代码如下：

```java
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionRepository;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.util.ObjectUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.LinkedHashMap;
import java.util.Map;
import static java.util.Collections.synchronizedMap;
/**
 * @Author: Flex.Zang
 * 解决无法删除路由的问题
 */
public class CustomInMemoryRouteDefinitionRepository implements RouteDefinitionRepository {
    private static final String DELETE = "delete";
    private final Map<String, RouteDefinition> routes = synchronizedMap(new LinkedHashMap<String, RouteDefinition>());
    @Override
    public Mono<Void> save(Mono<RouteDefinition> route) {
        return route.flatMap(r -> {
            if (ObjectUtils.isEmpty(r.getId())) {
                return Mono.error(new IllegalArgumentException("id may not be empty"));
            }
            routes.put(r.getId(), r);
            return Mono.empty();
        });
    }
    @Override
    public Mono<Void> delete(Mono<String> routeId) {
        return routeId.flatMap(id -> {
            if (DELETE.equals(id)) {
                routes.clear();
                return Mono.empty();
            }
            if (routes.containsKey(id)) {
                routes.remove(id);
                return Mono.empty();
            }
            return Mono.defer(() -> Mono.error(new NotFoundException("RouteDefinition not found: " + routeId)));
        });
    }
    @Override
    public Flux<RouteDefinition> getRouteDefinitions() {
        Map<String, RouteDefinition> routesSafeCopy = new LinkedHashMap<>(routes);
        return Flux.fromIterable(routesSafeCopy.values());
    }
}
```

并将默认的RouteDefinitionRepository替换成我们定义的CustomInMemoryRouteDefinitionRepository，代码如下

```java
@Bean
public RouteDefinitionRepository routeDefinitionRepository() {
    return new CustomInMemoryRouteDefinitionRepository();
}
```

### 2、定义动态路由操作类

此处内容较简单，直接上代码

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionWriter;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationEventPublisherAware;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
/**
 * @Author: Flex.Zang
 */
@Slf4j
@Component
public class DynamicRouteService implements ApplicationEventPublisherAware {
    private final RouteDefinitionWriter routeDefinitionWriter;
    private ApplicationEventPublisher publisher;
    private static final String CONS_DELETE = "delete";
    @Autowired
    public DynamicRouteService(RouteDefinitionWriter routeDefinitionWriter) {
        this.routeDefinitionWriter = routeDefinitionWriter;
    }
    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.publisher = applicationEventPublisher;
    }
    /**
     * 新增路由
     *
     * @param definition
     * @return
     */
    public String add(RouteDefinition definition) {
        try {
            routeDefinitionWriter.save(Mono.just(definition)).subscribe();
            this.publisher.publishEvent(new RefreshRoutesEvent(this));
            return "success";
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return "update route fail";
        }
    }
    /**
     * 更新路由
     *
     * @param definition
     * @return
     */
    public String update(RouteDefinition definition) {
        try {
            this.routeDefinitionWriter.delete(Mono.just(definition.getId())).subscribe();
        } catch (Exception e) {
            return "update fail,not find route  routeId: " + definition.getId();
        }
        try {
            routeDefinitionWriter.save(Mono.just(definition)).subscribe();
            this.publisher.publishEvent(new RefreshRoutesEvent(this));
            return "success";
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return "update route fail";
        }
    }
    /**
     * 清空路由
     *
     * @return
     */
    public String clear() {
        try {
            this.routeDefinitionWriter.delete(Mono.just(CONS_DELETE)).subscribe();
            this.publisher.publishEvent(new RefreshRoutesEvent(this));
            return "success";
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return "clear route fail";
        }
    }
}
```

### 3、监听路由变更

此处内容较简单，直接上代码

```java
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import javax.annotation.Resource;
import java.util.List;
/**
 * @Author: Flex.Zang
 */
@Component
@ConfigurationProperties(prefix = "spring.cloud.gateway")
public class GatewayConfig {
    private List<RouteDefinition> routes;
    @Resource
    private DynamicRouteService dynamicRouteService;
    public void setRoutes(List<RouteDefinition> routes) {
        this.routes = routes;
        updateDefinition();
    }
    private void updateDefinition() {
        //清空路由
        dynamicRouteService.clear();
        if (!CollectionUtils.isEmpty(this.routes)) {
            //重新加载路由
            this.routes.forEach(definition -> {
                dynamicRouteService.add(definition);
            });
        }
    }
}
```

That's all, thank you!

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
