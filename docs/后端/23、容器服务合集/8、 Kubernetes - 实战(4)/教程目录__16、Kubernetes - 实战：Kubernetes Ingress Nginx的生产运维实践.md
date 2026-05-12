# 16、Kubernetes - 实战：Kubernetes Ingress Nginx的生产运维实践
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/16.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

文章[Kubernetes Ingress Nginx的架构和工作原理》](/zhuanlan/container/kubernetes/4/15.html)讲述了Ingress Nginx的工作原理，本文将对生产环境的Ingress的实践进行一些介绍。

首先需要明确的是，生产环境的Ingress Nginx一般不是直接对外的，在它的前面还有内网LB/Kong/外网LB等组建，到达Ingress Nginx所要做的应该就是针对域名和路径进行路由选择。

## 二、部署

### 2.1 部署应用

由于我们在AWS部署的Kubernetets集群使用的是Calico CNI，所以部署Ingress Nginx使用的是如下的部署方式：

[https://github.com/kubernetes/ingress-nginx/blob/master/docs/deploy/baremetal.md](https://github.com/kubernetes/ingress-nginx/blob/master/docs/deploy/baremetal.md)

事先需要部署ingress nginx的配置文件如下：

```java
apiVersion: v1
data:
  compute-full-forwarded-for: "true"
  forwarded-for-header: X-Forwarded-For
  upstream-keepalive-connections: "110"
  use-forwarded-headers: "true"
  worker-processes: "4"
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
  name: nginx-configuration
  namespace: ingress-nginx
```

这里指定了Nginx启动时候使用4个worker、keepalive是110秒

在部署Ingress Nginx之前，先选择几个节点打上标签，这些节点会被加入LB并且Ingress Nginx daemonset会只部署在这几个节点上。同时，部署daemonset的时候，可以看到Ingress Nginx的启动参数如下：

```java
        - args:
          - /nginx-ingress-controller
          - --configmap=$(POD_NAMESPACE)/nginx-configuration
          - --tcp-services-configmap=$(POD_NAMESPACE)/tcp-services
          - --udp-services-configmap=$(POD_NAMESPACE)/udp-services
          - --publish-service=$(POD_NAMESPACE)/ingress-nginx
          - --annotations-prefix=nginx.ingress.kubernetes.io
```

包括适用于ingress nginx的configmap、暴露tcp/udp服务使用的configmap等。

### 2.2 NodePort服务部署

部署完daemonset之后，需要另外部署NodePort Service来接入外部流量：

```java
piVersion: v1
kind: Service
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
spec:
  type: NodePort
  ports:
    - name: http
      port: 80
      targetPort: 80
      protocol: TCP
      nodePort: 80
    - name: https
      port: 443
      targetPort: 443
      protocol: TCP
      nodePort: 443
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
```

上述的Ingress Nginx将会接入80和443的流量，下图显示了不同后端服务的请求是通过NodePort进入Ingress，并且最终进入到各个业务POD：

通过Ingress的NodePort接入外部流量

## 三、日志方案

### 3.1 日志落盘路径

Ingress的日志写入到POD内部的log路径，而这个log路径是主机本地路径作为hostPath而mount到POD内部的，所以Nginx的日志实际上是落盘到主机磁盘上的。为此，每个主机我们挂载了一块日志盘，专门进行日志存储。部署Daemonset的时候路径mount的配置如下：

```java
...
          volumeMounts:
          - mountPath: /var/log/nginx/
            name: log-volume
...
        volumes:
        - hostPath:
            path: /var/log/pod-logs/ingress-nginx
            type: Directory
          name: log-volume
```

### 3.2 日志格式

可以在nginx-configuration这个configmap里面定义Ingress Nginx的日志格式：

```java
  log-format-upstream: $remote_addr - $remote_user [$time_local] $server_name:$server_port
    $scheme "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
    "$http_x_forwarded_for" $connection $upstream_addr $upstream_response_time $request_time
    $request_length
```

### 3.3 日志rotate

由于业务系统所有请求都会经过Ingress，所以Ingress的日志量非常巨大，所以需要及时的压缩和rotate。在Ingress Nginx POD中进行log rotate，最大的难度在于要通过宿主机cronjob达成两件事情：

- 在容器内部使用kill向nginx进程发送reload信号，进行不影响业务的日志切换
- 能在外部运行logroate对日志进行rotate

下图就展示了这个流程：

Ingress Nginx日志rotate流程

我们系统每隔一小时进行一次rotate，对应的cron job如下：

```java
*/5 * * * *  /usr/sbin/logrotate /var/log/pod-logs/ingress-nginx/nginx.logroate >/dev/null 2>&1
```

nginx.logroate的内容如下：

```java
/var/log/pod-logs/ingress-nginx/*.log {
size 1024M
rotate 10
missingok
notifempty
sharedscripts
dateext
dateformat -%Y-%m-%d-%s
postrotate
    if [ /usr/bin/docker ps | grep ingress-controller_nginx-ingress | grep -v pause | awk '{print $1}' ]; then
        /bin/bash /var/log/pod-logs/ingress-nginx/cron-cmd  || true
    fi
endscript
}
```

cron-cmd内容如下：

```java
#!/bin/bash
CID=/usr/bin/docker ps | grep ingress-controller_nginx-ingress | grep -v pause | awk '{print $1}'
/usr/bin/docker exec $CID bash /var/log/nginx/nginx-ingress-rotate.sh
```

nginx-ingress-rotate.sh内容如下：

```java
#!/bin/bash
getdatestring()
{
    TZ='Asia/Chongqing' date "+%Y%m%d%H%M"
}
datestring=$(getdatestring)
#mv /var/log/nginx/access.log /var/log/nginx/access.${datestring}.log
#mv /var/log/nginx/error.log /var/log/nginx/error.${datestring}.log
kill -USR1 cat /tmp/nginx.pid
```

最后的rotate效果如下：

## 四、监控方案

Ingress Nginx默认部署的时候就开启了兼容Prometheus的监控数据接口，所以我们可以定义如下的cluster service来暴露这些接口：

```java
kind: Service
apiVersion: v1
metadata:
  namespace: ingress-nginx
  name: nginx-ingress-prometheus
  labels:
    k8s-app: ingress
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - name: metrics
    port: 10254
    protocol: TCP
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
```

然后定义如下的servicemonitor向prometheus进行注册：

```java
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kube-nginx-ingress
  namespace: monitoring
  labels:
    k8s-app: ingress
spec:
  jobLabel: k8s-app
  endpoints:
  - port: metrics
    interval: 30s
  selector:
    matchLabels:
      k8s-app: ingress
  namespaceSelector:
    matchNames:
    - ingress-nginx
```

最后在grafana进行展示：

## 五、配置Ingress暴露服务

### 5.1 暴露HTTP服务

这个路径给出了ingress的一些配置类型可以进行参考：

[https://kubernetes.io/docs/concepts/services-networking/ingress/#types-of-ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/#types-of-ingress)

**经典的案例:**

```java
piVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-body-size: 50m
  labels:
    app: myapi-service-ingress
  name: myapi-service-ingress
  namespace: myapi
spec:
  rules:
  - host: myapi.test.com
    http:
      paths:
      - backend:
          serviceName: myapi-service-service
          servicePort: 8080
        path: /
```

**路径替换的案例：**

```java
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-body-size: 50m
    nginx.ingress.kubernetes.io/rewrite-target: /$2
  labels:
    app: my-api-kong-ingress
  name: my-api-kong-ingress
  namespace: myapp
spec:
  rules:
  - host: platform.test.com
    http:
      paths:
      - backend:
          serviceName: my-api-service
          servicePort: 8080
        path: /brand(/|$)(.*)
```

**fanout的案例：**

```java
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-body-size: 50m
  labels:
    app: my-service-ingress
  name: my-service-ingress
  namespace: myapp
spec:
  rules:
  - host: my.test.com
    http:
      paths:
      - backend:
          serviceName: my-service
          servicePort: 8000
        path: /
      - backend:
          serviceName: my-service
          servicePort: 9102
        path: /metrics
```

### 5.2 暴露TCP/UDP服务

在我们的业务场景中，我们需要暴露TCP服务来向集群外的应用提供集群内部署的TCP服务，比如MySQL/Etcd/Zookeeper，Etcd服务用于虚拟机和POD进行服务发现，而Zookeeper用于基于虚拟机安装的Kafka进行HA保障。

Ingress Nginx在启动的时候可以指定如下两个configmap，所有需要暴露的TCP/UDP服务可以在这两个configmap里面指定：

暴露的zookeeper的TCP服务如下：
