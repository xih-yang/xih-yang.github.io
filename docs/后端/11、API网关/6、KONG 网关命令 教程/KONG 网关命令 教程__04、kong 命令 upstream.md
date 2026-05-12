# 04、kong 命令 upstream
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-3/4.html
- 分类：API网关
- 分组：KONG 网关命令 教程
## 介绍

upstream 就是一个虚拟的服务。可用于配置多个target目标服务时实现负载均衡的效果。

注意：service的host指的就是upstream的name。

同时upstream提供了一个health check方法，用于检查target目标服务是否健康。以此控制启用或禁用target目标服务

和upstream关联的kong模块:service ,target

主要参数:**algorithm 负载算法：round-robin（默认）, consistent-hashing, or least-connections**

**healthchecks.active.http_path 健康检查路径：默认/，该地址是指在目标服务器上，适用于目标服务器的所有请求**

## 命令

### 1、addupstream；

方法post

api:/upstreams

### 2、list upstream ,retrieve upstream

方法：get

api：/upstreams

/upstreams/upstream id or name

/targets/{target host:port or id}/upstream 关联指定target目标服务的upstream

### 3、update upstream

方法：patch

api:/upstreams/{upstream name or id}

/targets/{target host:port or id}/upstream

### 4、create or update upstream

方法：put

api:/upstreams/{upstream name or id}

/targets/{target host:port or id}/upstream

### 5、delete

方法：delete

api：/upstreams/{upstream name or id}

/targets/{target host:port or id}/upstream

**健康检查 health check**

kong会发起对配置在upstream上的所有target进行健康检查，若检查失败，将会暂时移除不健康的target服务。

恢复之后会再次加入。具体参数可在upstream参数中配置。

检查结果主要为一下四大类（官网介绍）

- If a Target fails to be activated in the balancer due to DNS issues, its status displays as DNS_ERROR.
- When [health checks](https://docs.konghq.com/1.4.x/health-checks-circuit-breakers) are not enabled in the Upstream configuration, the health status for active Targets is displayed as HEALTHCHECKS_OFF.
- When health checks are enabled and the Target is determined to be healthy, either automatically or [manually](https://docs.konghq.com/1.4.x/admin-api/#set-target-as-healthy), its status is displayed as HEALTHY. This means that this Target is currently included in this Upstream’s load balancer execution.
- When a Target has been disabled by either active or passive health checks (circuit breakers) or [manually](https://docs.konghq.com/1.4.x/admin-api/#set-target-as-unhealthy), its status is displayed as UNHEALTHY. The load balancer is not directing any traffic to this Target via this Upstream.

上述HEALTHY 、HEALTHCHECKS_OFF情况，target目标可以被转发请求，其他两类不被负载转发。

查看：get方法。api:/upstreams/{name or id}/health/

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/jybky/category/1591749.html
