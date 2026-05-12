# 23、Kubernetes - 实战：Service Mesh之在Kubernetes部署Istio进行service mesh
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/23.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

演进到今天，Istio已经明确了作为ServiceMesh基础设施，它的主要服务能力包括：

在之前的文章[《十八：使用helm安装istio》](/zhuanlan/container/kubernetes/4/18.html)中，基于Istio V1.0.2进行了安装和测试；最新的基于V1.6.0的版本对于V1.0.2，可以看到Istio对架构进行了大刀阔口的改造，包括舍弃部分功能以及单体化集成：

Istio架构变化/2020

在新的架构中，istiod deployment里面的discovery进行所有控制面的工作：

这也是非常具有讽刺性的一个变化：**用于支持微服务的基础设施服务在经过微服务化架构曲折尝试之后，最终转向了单体结构**。

可以参考文章[《Introducing istiod: simplifying the control plane》](https://istio.io/blog/2020/istiod/)和文章[《Service Mesh 化繁为简：基于 Istiod 回归单体设计》](https://www.infoq.cn/article/iCLxbfNWd3FlxcAFWD3h)。

## 二、部署Istio

### 2.1 下载

```java
curl -L https://istio.io/downloadIstio | sh -
```

并且将istioctl放到PATH目录里面

### 2.2 安装

```java
istioctl install --set profile=demo
```

demo profile安装的组建如下：

安装过程如下：

###

查看资源部署情况:

```java
[root@master01 ~]# kubectl get all -n istio-system
NAME                                        READY   STATUS    RESTARTS   AGE
pod/grafana-74dc798895-jp5hk                1/1     Running   2          10d
pod/istio-egressgateway-69bf865cf8-c22sx    1/1     Running   2          10d
pod/istio-ingressgateway-569d44555d-l79mq   1/1     Running   2          10d
pod/istio-tracing-8584b4d7f9-wb72v          1/1     Running   3          10d
pod/istiod-84cc4dfcd8-csnvh                 1/1     Running   3          10d
pod/kiali-6f457f5964-8vpxh                  1/1     Running   2          10d
pod/prometheus-79878ff5fd-bk2rr             2/2     Running   4          10d
NAME                                TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                                      AGE
service/grafana                     ClusterIP      10.98.168.175    <none>        3000/TCP                                                                     10d
service/istio-egressgateway         ClusterIP      10.108.187.5     <none>        80/TCP,443/TCP,15443/TCP                                                     10d
service/istio-ingressgateway        LoadBalancer   10.103.145.106   172.2.0.201   15020:32553/TCP,80:30327/TCP,443:30820/TCP,31400:32112/TCP,15443:30203/TCP   10d
service/istiod                      ClusterIP      10.100.69.129    <none>        15010/TCP,15012/TCP,443/TCP,15014/TCP,53/UDP,853/TCP                         10d
service/jaeger-agent                ClusterIP      None             <none>        5775/UDP,6831/UDP,6832/UDP                                                   10d
service/jaeger-collector            ClusterIP      10.110.41.80     <none>        14267/TCP,14268/TCP,14250/TCP                                                10d
service/jaeger-collector-headless   ClusterIP      None             <none>        14250/TCP                                                                    10d
service/jaeger-query                ClusterIP      10.99.101.46     <none>        16686/TCP                                                                    10d
service/kiali                       ClusterIP      10.97.23.46      <none>        20001/TCP                                                                    10d
service/prometheus                  ClusterIP      10.108.215.160   <none>        9090/TCP                                                                     10d
service/tracing                     ClusterIP      10.104.57.128    <none>        80/TCP                                                                       10d
service/zipkin                      ClusterIP      10.96.186.118    <none>        9411/TCP                                                                     10d
```

## 三、部署应用

这里还是使用服务系统[emojivoto](https://github.com/BuoyantIO/emojivoto)来进行演示。

### 3.1 标注namespace为Istio关注点

```java
kubectl label namespace emojivoto-istio istio-injection=enabled
```

有了这个label之后，在这个namespace部署的POD都会被Istio自动注入一个istio sidecard作为mesh的agent。

### 3.2 部署应用

部署了四个服务如下：

```java
[root@master01 ~]# kubectl get all -n emojivoto-istio
NAME                            READY   STATUS    RESTARTS   AGE
pod/emoji-c7db89d7b-hldc7       2/2     Running   0          9d
pod/vote-bot-585bff7fc8-vdfhp   2/2     Running   0          9d
pod/voting-857966b445-2pmrr     2/2     Running   0          9d
pod/web-54f74db995-c26xv        2/2     Running   0          9d
NAME                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)             AGE
service/emoji-svc    ClusterIP   10.101.145.187   <none>        8080/TCP,8801/TCP   9d
service/voting-svc   ClusterIP   10.107.28.210    <none>        8080/TCP,8801/TCP   9d
service/web-svc      ClusterIP   10.96.133.77     <none>        80/TCP              9d
```

### 3.3 通过Istio dashboard查看mesh情况

默认的istioctl支持的dashboard如下：

```java
Available Commands:
  controlz    Open ControlZ web UI
  envoy       Open Envoy admin web UI
  grafana     Open Grafana web UI
  jaeger      Open Jaeger web UI
  kiali       Open Kiali web UI
  prometheus  Open Prometheus web UI
  zipkin      Open Zipkin web UI
```

这里可以访问的包括envoy、grafana、jaeger、kiali和prometheus。

```java
istioctl dashboard grafana
```

```java
istioctl dashboard kiali
```

查看服务POD，可以发现POD之间通信是基于mTLS加密的：

```java
[root@master01 ~]# istioctl experimental authz check web-54f74db995-c26xv  -n emojivoto-istio | egrep "mTLS|yes"
LISTENER[FilterChain]     CERTIFICATE          mTLS (MODE)          AuthZ (RULES)
virtualInbound[0]         noneSDS: default     yes (none)           no (none)
virtualInbound[2]         noneSDS: default     yes (none)           no (none)
virtualInbound[5]         noneSDS: default     yes (PERMISSIVE)     no (none)
```

mTLS enabled

## 四、配置istio ingress进行服务暴露

通过查看istio-system的SVC可以看到istio的ingress 80端口对应的nodePort是30080：

```java
istio-ingressgateway        LoadBalancer   10.103.145.106   172.2.0.201   15020:32553/TCP,80:30080/TCP,443:30820/TCP,31400:32112/TCP,15443:30203/TCP   10d
```

我们将域名绑定到某个kubernetes node上之后，就可以定义如下gateway和virtualservice：

```java
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: emojivoto-gateway
  namespace: emojivoto-istio
spec:
  selector:
    istio: ingressgateway use istio default controller
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "emoji-istio.test.net"
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: emojivoto
  namespace: emojivoto-istio
spec:
  hosts:
  - "emoji-istio.test.net"
  gateways:
  - emojivoto-gateway
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: web-svc
        port:
          number: 80
```

然后可以用以下方式进行访问：

http://emoji-istio.test.net:30080/

部署了ingress routing之后的Kiali状态图：

## 五、混沌工程和错误注入

通过Istio进行service mesh的服务，它们之间的通信都是通过istio proxy，所以可以在proxy层面主动注入错误，进行chaos engineering的实践，现在istio支持的fault injection类型包括：

- HTTP错误
- 延时

### 5.1 HTTP错误注入

在virtualservice里面加入如下内容：

```java
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: emojivoto
  namespace: emojivoto-istio
spec:
  hosts:
  - "emoji-istio.test.net"
  gateways:
  - emojivoto-gateway
  http:
  - fault:
      abort:
        httpStatus: 500
        percentage:
          value: 50
    match:
    - uri:
        prefix: /
    route:
    - destination:
        host: web-svc
        port:
          number: 80
```

访问服务会有50%的概率失败:

```java
curl http://emoji-istio.test.net:30080/ -v | grep HTTP
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying 172.2.0.24...
* TCP_NODELAY set
* Connected to emoji-istio.test.net (172.2.0.24) port 30080 (#0)
> GET / HTTP/1.1
> Host: emoji-istio.test.net:30080
> User-Agent: curl/7.54.0
> Accept: */*
> 
< HTTP/1.1 500 Internal Server Error
< content-length: 18
< content-type: text/plain
< date: Fri, 05 Jun 2020 03:40:34 GMT
< server: istio-envoy
< 
{ [18 bytes data]
100    18  100    18    0     0   1598      0 --:--:-- --:--:-- --:--:--  1636
* Connection0 to host emoji-istio.test.net left intact
```

### 5.2 延时注入

###

增加了3秒延时：

```java
curl http://emoji-istio.test.net:30080/ -v | grep HTTP
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying 172.2.0.24...
* TCP_NODELAY set
* Connected to emoji-istio.test.net (172.2.0.24) port 30080 (#0)
> GET / HTTP/1.1
> Host: emoji-istio.test.net:30080
> User-Agent: curl/7.54.0
> Accept: */*
> 
  0     0    0     0    0     0      0      0 --:--:--  0:00:02 --:--:--     0< HTTP/1.1 200 OK
< content-type: text/html
< date: Fri, 05 Jun 2020 04:06:29 GMT
< content-length: 560
< x-envoy-upstream-service-time: 1
< server: istio-envoy
< 
{ [560 bytes data]
100   560  100   560    0     0    183      0  0:00:03  0:00:03 --:--:--   183
* Connection0 to host emoji-istio.test.net left intact
```
