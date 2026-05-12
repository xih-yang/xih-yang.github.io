# 17、Kubernetes - 实战：k8s之Calico网络策略
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/17.html
- 分类：容器服务
- 分组：教程目录
## 一、网络策略

网络策略（Network Policy ）是 Kubernetes 的一种资源。Network Policy 通过 Label 选择 Pod，并指定其他 Pod 或外界如何与这些 Pod 通信。

Pod的网络流量包含流入（Ingress）和流出（Egress）两种方向。默认情况下，所有 Pod 是非隔离的，即任何来源的网络流量都能够访问 Pod，没有任何限制。当为 Pod 定义了 Network Policy，只有 Policy 允许的流量才能访问 Pod。

Kubernetes的网络策略功能也是由第三方的网络插件实现的，因此，只有支持网络策略功能的网络插件才能进行配置网络策略，比如Calico、Canal、kube-router等等。

## 二、配置网络策略

在Kubernetes系统中，报文的流入和流出的核心组件是Pod资源，它们也是网络策略功能的主要应用对象。`NetworkPolicy`对象通过`podSelector`选择 一组Pod资源作为控制对象。`NetworkPolicy`是定义在一组Pod资源之上用于管理入站流量，或出站流量的一组规则，有可以是出入站规则一起生效，规则的生效模式通常由`spec.policyTypes`进行 定义。如下图：

默认情况下，Pod对象的流量控制是为空的，报文可以自由出入。在附加网络策略之后，Pod对象会因为NetworkPolicy而被隔离，一旦名称空间中有任何NetworkPolicy对象匹配了某特定的Pod对象，则该Pod将拒绝NetworkPolicy规则中不允许的所有连接请求，但是那些未被匹配到的Pod对象依旧可以接受所有流量。

就特定的Pod集合来说，入站和出站流量默认是放行状态，除非有规则可以进行匹配。还有一点需要注意的是，在`spec.policyTypes`中指定了生效的规则类型，但是在`networkpolicy.spec`字段中嵌套定义了没有任何规则的Ingress或Egress时，则表示拒绝入站或出站的一切流量。定义网络策略的基本格式如下：

```java
apiVersion: networking.k8s.io/v1		#定义API版本
kind: NetworkPolicy					  定义资源类型
metadata:
  name: allow-myapp-ingress			   定义NetwokPolicy的名字
  namespace: default
spec:								 NetworkPolicy规则定义
  podSelector: 						  匹配拥有标签app:myapp的Pod资源
    matchLabels:
      app: myapp
  policyTypes ["Ingress"]			   NetworkPolicy类型，可以是Ingress，Egress，或者两者共存
  ingress:							 定义入站规则
  - from:
    - ipBlock:						 定义可以访问的网段
        cidr: 10.244.0.0/16
        except:						 排除的网段
        - 10.244.3.0/24
    - podSelector:					 选定当前default名称空间，标签为app:myapp可以入站
        matchLabels:
          app: myapp
    ports:							开放的协议和端口定义
    - protocol: TCP
      port: 80
该网络策略就是将default名称空间中拥有标签"app=myapp"的Pod资源开放80/TCP端口给10.244.0.0/16网段，并排除10.244.3.0/24网段的访问，并且也开放给标签为app=myapp的所有Pod资源进行访问。  
```

## 三、实验案例

## 环境准备

创建linux和python两个ns并分别在这两个ns中创建pod资源来用于测试网络策略

```java
root@k8s-deploy-harbor:~/manifest/network-policy# kubectl create ns linux
namespace/linux created
root@k8s-deploy-harbor:~/manifest/network-policy# kubectl create ns python
namespace/python created
root@k8s-deploy-harbor:~/manifest/network-policy
```

创建linux namespace中的资源

nginx-linux-ns.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: linux-nginx-deployment-label
  name: linux-nginx-deployment
  namespace: linux
spec:
  replicas: 1
  selector:
    matchLabels:
      app: linux-nginx-selector
  template:
    metadata:
      labels:
        app: linux-nginx-selector
    spec:
      containers:
      - name: linux-nginx-container
        image: harbor.zhrx.com/baseimages/nginx:alpine
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        - containerPort: 443
          protocol: TCP
          name: https
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: linux-nginx-service-label
  name: linux-nginx-service
  namespace: linux
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30004
  - name: https
    port: 443
    protocol: TCP
    targetPort: 443
    nodePort: 30443
  selector:
    app: linux-nginx-selector
```

tomcat-linux-ns.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: linux-tomcat-app1-deployment-label
  name: linux-tomcat-app1-deployment
  namespace: linux
spec:
  replicas: 1
  selector:
    matchLabels:
      app: linux-tomcat-app1-selector
  template:
    metadata:
      labels:
        app: linux-tomcat-app1-selector
    spec:
      containers:
      - name: linux-tomcat-app1-container
        image: harbor.zhrx.com/baseimages/tomcat:7.0.94-alpine
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          protocol: TCP
          name: http
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: linux-tomcat-app1-service-label
  name: linux-tomcat-app1-service
  namespace: linux
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
    nodePort: 30005
  selector:
    app: linux-tomcat-app1-selector
```

创建资源

```java
root@k8s-deploy-harbor:~/manifest/network-policy/linux-ns# kubectl apply -f nginx-linux-ns.yaml 
deployment.apps/linux-nginx-deployment created
service/linux-nginx-service created
root@k8s-deploy-harbor:~/manifest/network-policy/linux-ns# kubectl apply -f tomcat-linux-ns.yaml 
deployment.apps/linux-tomcat-app1-deployment created
service/linux-tomcat-app1-service created
root@k8s-deploy-harbor:~/manifest/network-policy/linux-ns# kubectl get pod,svc -n linux
NAME                                                READY   STATUS    RESTARTS   AGE
pod/linux-nginx-deployment-74fc689864-f78nb         1/1     Running   0          4m3s
pod/linux-tomcat-app1-deployment-7cc6bdd987-27wf5   1/1     Running   0          14s
NAME                                TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
service/linux-nginx-service         NodePort   10.68.187.8     <none>        80:30004/TCP,443:30443/TCP   4m3s
service/linux-tomcat-app1-service   NodePort   10.68.170.248   <none>        80:30005/TCP                 14s
root@k8s-master:~# kubectl exec -it linux-tomcat-app1-deployment-7cc6bdd987-27wf5 -n linux sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/usr/local/tomcat mkdir webapps/linux
/usr/local/tomcat echo "linux tomcat" > webapps/linux/index.jsp
```

创建python namespace中的资源

nginx-python-ns.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: python-nginx-deployment-label
  name: python-nginx-deployment
  namespace: python
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-nginx-selector
  template:
    metadata:
      labels:
        app: python-nginx-selector
        project: python
    spec:
      containers:
      - name: python-nginx-container
        image: harbor.zhrx.com/baseimages/nginx:alpine
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        - containerPort: 443
          protocol: TCP
          name: https
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: python-nginx-service-label
  name: python-nginx-service
  namespace: python
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30014
  - name: https
    port: 443
    protocol: TCP
    targetPort: 443
    nodePort: 30453
  selector:
    app: python-nginx-selector
    project: python一个或多个selector，至少能匹配目标pod的一个标签
```

tomcat-python-ns.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: python-tomcat-app1-deployment-label
  name: python-tomcat-app1-deployment
  namespace: python
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-tomcat-app1-selector
  template:
    metadata:
      labels:
        app: python-tomcat-app1-selector
    spec:
      containers:
      - name: python-tomcat-app1-container
        image: harbor.zhrx.com/baseimages/tomcat:7.0.94-alpine
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          protocol: TCP
          name: http
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: python-tomcat-app1-service-label
  name: python-tomcat-app1-service
  namespace: python
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
    nodePort: 30015
  selector:
    app: python-tomcat-app1-selector
```

创建资源

```java
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl apply -f nginx-python-ns.yaml 
deployment.apps/python-nginx-deployment created
service/python-nginx-service created
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl apply -f tomcat-python-ns.yaml 
deployment.apps/python-tomcat-app1-deployment created
service/python-tomcat-app1-service created
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl get pod,svc -n python
NAME                                                 READY   STATUS    RESTARTS   AGE
pod/python-nginx-deployment-889b9fd95-6c9pv          1/1     Running   0          11s
pod/python-tomcat-app1-deployment-85d7bcb88c-xcrz4   1/1     Running   0          7s
NAME                                 TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)                      AGE
service/python-nginx-service         NodePort   10.68.192.11   <none>        80:30014/TCP,443:30453/TCP   10s
service/python-tomcat-app1-service   NodePort   10.68.88.145   <none>        80:30015/TCP                 7s
root@k8s-master:~# kubectl exec -it  python-tomcat-app1-deployment-85d7bcb88c-xcrz4 -n python sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/usr/local/tomcat mkdir webapps/python
/usr/local/tomcat echo "python tomcat" > webapps/python/index.jsp
```

在default namespace中创建测试pod

testpod-default.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: testpod-busybox-deployment-label
  name: testpod-busybox-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-nginx-selector
      project: python
  template:
    metadata:
      labels:
        app: python-nginx-selector
        project: python
    spec:
      containers:
      - name: testpod-busybox-container
        image: busybox:latest 
        command:
          - sleep
          - "50000000"
        imagePullPolicy: IfNotPresentc
```

创建资源

```java
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl apply -f testpod-busybox.yaml 
deployment.apps/testpod-busybox-deployment created
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl get pod 
NAME                                         READY   STATUS    RESTARTS   AGE
testpod-busybox-deployment-8f4f66686-wvw6c   1/1     Running   0          49s
```

## case1-ingress-podSelector

仅允许python namespace下拥有project: "python"标签的pod访问 拥有app: python-tomcat-app1-selector 标签的pod

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tomcat-access--networkpolicy
  namespace: python
spec:
  policyTypes:
  - Ingress
  podSelector:
    matchLabels:
      app: python-tomcat-app1-selector对匹配到的目的Pod应用以下规则
  ingress:入栈规则，如果指定目标端口就是匹配全部端口和协议，协议TCP, UDP, or SCTP
  - from:
    - podSelector:
        matchLabels:
         app: python-nginx-selector如果存在多个matchLabel条件，是or的关系，即要同时满足条件A、条件B、条件X
          project: "python"
```

创建规则并验证

```java
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl apply -f case1-ingress-podSelector.yaml 
networkpolicy.networking.k8s.io/tomcat-access--networkpolicy created
#在python ns下的nginx pod中可以访问到tomcat
root@k8s-master:~# kubectl get svc -n python
NAME                         TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)                      AGE
python-nginx-service         NodePort   10.68.192.11   <none>        80:30014/TCP,443:30453/TCP   39m
python-tomcat-app1-service   NodePort   10.68.88.145   <none>        80:30015/TCP                 39m
root@k8s-master:~# kubectl exec -it python-nginx-deployment-889b9fd95-6c9pv -n python sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/ curl python-tomcat-app1-service/python/
python tomcat
#在linux ns下的nginx pod中不可访问
root@k8s-master:~# kubectl exec -it linux-nginx-deployment-74fc689864-f78nb -n linux sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/ curl python-tomcat-app1-service.python.svc.cluster.local/python/
/ 阻塞无返回
```

## case2-ingress-podSelector-ns-SinglePort

仅允许python namespace下拥有project: "python"标签的pod访问 拥有app: python-tomcat-app1-selector 标签的pod 的8080端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tomcat-access--networkpolicy
  namespace: python
spec:
  policyTypes:
  - Ingress
  podSelector:
    matchLabels:
      app: python-tomcat-app1-selector
  ingress:
  - from:
    - podSelector:
        matchLabels:
         app: python-nginx-selector指定访问源的匹配条件,如果存在多个matchLabel条件,是or的关系,即要同时满足条件A、条件B、条件X
          project: "python"
    ports:入栈规则，如果指定目标端口就是匹配全部端口和协议,协议TCP, UDP, or SCTP
    - protocol: TCP
      port: 8080允许通过TCP协议访问目标pod的8080端口,但是其它没有允许的端口将全部禁止访问
     port: 80
```

创建规则并验证

```java
root@k8s-deploy-harbor:~/manifest/network-policy/python-ns# kubectl apply -f case2-ingress-podSelector-ns-SinglePort.yaml 
networkpolicy.networking.k8s.io/tomcat-access--networkpolicy created
# 通ns下nginx pod可以访问tomcat pod的8080端口
root@k8s-master:~# kubectl exec -it python-nginx-deployment-889b9fd95-6c9pv -n python sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/ curl 172.20.36.69:8080/python/
python tomcat
```

## case3-ingress-podSelector-ns-MultiPort

仅允许python namespace下拥有project: "python"标签的pod访问 拥有app: python-tomcat-app1-selector 标签的pod 的8080和8009端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tomcat-access--networkpolicy
  namespace: python
spec:
  policyTypes:
  - Ingress
  podSelector:目标pod
    matchLabels:
      app: python-tomcat-app1-selector
  ingress:
  - from:
    - podSelector:匹配源pod,matchLabels: {}为不限制源pod即允许所有pod,写法等同于resources(不加就是不限制)
        matchLabels: {}
    ports:入栈规则，如果指定目标端口就是匹配全部端口和协议，协议TCP, UDP, or SCTP
    - protocol: TCP
      port: 8080允许通过TCP协议访问目标pod的8080端口，但是其它没有允许的端口将全部禁止访问
    - protocol: TCP
      port: 8009
```

## case4-ingress-podSelector-ns

允许当前namespace下所有pod的通信

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tomcat-access--networkpolicy
  namespace: python
spec:
  policyTypes:
  - Ingress
  podSelector:目标pod
    matchLabels: {}匹配所有目标pod
  ingress:
  - from:
    - podSelector:匹配源pod,matchLabels: {}为不限制源pod即允许所有pod,写法等同于resources(不加就是不限制)
        matchLabels: {}
```

## case5-ingress-ipBlock

允许指定的ip网段访问tomcat pod的808端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tomcat-access--networkpolicy
  namespace: python
spec:
  policyTypes:
  - Ingress
  podSelector:目标pod
    matchLabels:
      app: python-tomcat-app1-selector
  ingress:
  - from:
    - ipBlock:
        cidr: 10.200.0.0/16白名单，允许访问的地址范围，没有允许的将禁止访问目标pod
        except:
        - 10.200.218.0/24在以上范围内禁止访问的源IP地址
        - 10.200.229.0/24在以上范围内禁止访问的源IP地址
        - 10.200.230.239/32在以上范围内禁止访问的源IP地址
    ports:入栈规则，如果指定目标端口就是匹配全部端口和协议，协议TCP, UDP, or SCTP
    - protocol: TCP
      port: 8080允许通过TCP协议访问目标pod的8080端口，但是其它没有允许的端口将全部禁止访问
```

## case6-ingress-namespaceSelector

允许指定的ns访问当前ns下的所有pod 的某些端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tomcat-access--networkpolicy
  namespace: python
spec:
  policyTypes:
  - Ingress
  podSelector:目标pod
    matchLabels: {}允许访问python namespace 中的所有pod
#      app: python-tomcat-app1-selector可以只允许访问python namespace中指定的pod
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          nsname: linux只允许指定的namespace访问
    - namespaceSelector:
        matchLabels:
          nsname: python只允许指定的namespace访问
    ports:入栈规则，如果指定目标端口就是匹配全部端口和协议，协议TCP, UDP, or SCTP
    - protocol: TCP
      port: 8080允许通过TCP协议访问目标pod的8080端口，但是其它没有允许的端口将全部禁止访问
     port: 80
    - protocol: TCP
      port: 3306
    - protocol: TCP
      port: 6379
```

## case7-Egress-ipBlock

允许指定pod访问目的ip网段的指定端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: egress-access-networkpolicy
  namespace: python
spec:
  policyTypes:
  - Egress
  podSelector:目标pod选择器
    matchLabels: 基于label匹配目标pod
      app: python-tomcat-app1-selector匹配python namespace中app的值为python-tomcat-app1-selector的pod,然后基于egress中的指定网络策略进行出口方向的网络限制
  egress:
  - to:
    - ipBlock:
        cidr: 10.200.0.0/16允许匹配到的pod出口访问的目的CIDR地址范围
    - ipBlock:
        cidr: 172.31.7.106/32允许匹配到的pod出口访问的目的主机
    ports:
    - protocol: TCP
      port: 80允许匹配到的pod访问目的端口为80的访问
    - protocol: TCP
      port: 53允许匹配到的pod访问目的端口为53 即DNS的解析
    - protocol: UDP
      port: 53允许匹配到的pod访问目的端口为53 即DNS的解析
```

## case8-Egress-PodSelector

允许拥有app: python-nginx-selector标签的pod 访问 拥有app: python-tomcat-app1-selector 的pod的指定端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: egress-access-networkpolicy
  namespace: python
spec:
  policyTypes:
  - Egress
  podSelector:目标pod选择器
    matchLabels: 基于label匹配目标pod
      app: python-nginx-selector匹配python namespace中app的值为python-tomcat-app1-selector的pod,然后基于egress中的指定网络策略进行出口方向的网络限制
  egress:
  - to:
    - podSelector:匹配pod,matchLabels: {}为不限制源pod即允许所有pod,写法等同于resources(不加就是不限制)
        matchLabels:
          app: python-tomcat-app1-selector
    ports:
    - protocol: TCP
      port: 8080允许80端口的访问
    - protocol: TCP
      port: 53允许DNS的解析
    - protocol: UDP
      port: 53
```

## case9-Egress-namespaceSelector

允许拥有app: python-nginx-selector的pod 去访问指定ns下的pod 的指定端口

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: egress-access-networkpolicy
  namespace: python
spec:
  policyTypes:
  - Egress
  podSelector:目标pod选择器
    matchLabels: 基于label匹配目标pod
      app: python-nginx-selector匹配python namespace中app的值为python-tomcat-app1-selector的pod,然后基于egress中的指定网络策略进行出口方向的网络限制
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          nsname: python指定允许访问的目的namespace
    - namespaceSelector:
        matchLabels:
          nsname: linux指定允许访问的目的namespace
    ports:
    - protocol: TCP
      port: 8080允许80端口的访问
    - protocol: TCP
      port: 53允许DNS的解析
    - protocol: UDP
      port: 53
```
