# 14、Kubernetes - 实战：k8s之Ingress
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/14.html
- 分类：容器服务
- 分组：教程目录
## 一、Ingress介绍

## 1、什么是Ingress?

Kubernetes提供了两种内建的云端负载均衡机制（cloud load balancing）用于发布公共应用，一种是工作于传输层的Service资源，它实现的是“TCP负载均衡器”，另一种是Ingress资源，它实现的是“HTTP/HTTPS负载均衡器”。

（1）TCP负载均衡器 无论是iptables还是ipvs模型的Service资源都配置于Linux内核中的Netfilter之上进行四层调度，是一种类型更为通用的调度器，支持调度HTTP、MySQL等应用层服务。不过，也正是由于工作于传输层从而使得它无法做到类似卸载HTTPS中的SSL会话等一类操作，也不支持基于URL的请求调度机制，而且，Kubernetes也不支持为此类负载均衡器配置任何类型的健康状态检查机制。

（2）HTTP/HTTPS负载均衡器 HTTP/HTTPS负载均衡器是应用层负载均衡机制的一种，支持根据环境做出更好的调度决策。与传输层调度器相比，它提供了诸如可自定义URL映射和TLS卸载等功能，并支持多种类型的后端服务器健康状态检查机制。

Ingress 公开了从集群外部到集群内服务的 HTTP 和 HTTPS 路由。 流量路由由 Ingress 资源上定义的规则控制。

下面是一个将所有流量都发送到同一 Service 的简单 Ingress 示例：

通常负责通过负载均衡器来实现 Ingress，尽管它也可以配置边缘路由器或其他前端来帮助处理流量。

Ingress 不会公开任意端口或协议。 将 HTTP 和 HTTPS 以外的服务公开到 Internet 时，通常使用 [Service.Type=NodePort](https://kubernetes.io/zh/docs/concepts/services-networking/service/#nodeport) 或 [Service.Type=LoadBalancer](https://kubernetes.io/zh/docs/concepts/services-networking/service/#loadbalancer) 类型的服务。

## 2、Ingress和Ingress Controller

Kubernetes中，Service资源和Pod资源的IP地址仅能用于集群网络内部的通信，所有的网络流量都无法穿透边界路由器（Edge Router）以实现集群内外通信。尽管可以为Service使用NodePort或LoadBalancer类型通过节点引入外部流量，但它依然是4层流量转发，可用的负载均衡器也为传输层负载均衡机制。

Ingress：https://kubernetes.io/zh/docs/concepts/services-networking/ingress/

Ingress是kubernetes API中的标准资源类型之一，ingress实现的功能是将客户端请求的host名称或请求的URL路径把请求转发到指定的service资源的规则，即用于将kubernetes集群外部的请求资源转发之集群内部的service，再被service转发之pod处理客户端的请求。

Ingress controller：https://kubernetes.io/zh/docs/concepts/services-networking/ingress-controllers/

Ingress资源需要指定监听地址、请求的host和URL等配置，然后根据这些规则的匹配机制将客户端的请求进行转发，这种能够为ingress配置资源监听并转发流量的组件称为ingress控制器(ingress controller)，ingress controller是kubernetes的一个附件，类似于dashboard或者flannel一样，需要单独部署。

Ingress控制器可以由任何具有反向代理（HTTP/HTTPS）功能的服务程序实现，如Nginx、Envoy、HAProxy、Vulcand和Traefik等。Ingress控制器自身也是运行于集群中的Pod资源对象，它与被代理的运行为Pod资源的应用运行于同一网络中。

简单来说：

•Ingress：K8s中的一个抽象资源，给管理员提供一个暴露应用的入口定义方法。

•Ingress Controller：根据Ingress生成具体的路由规则，并对Pod负载均衡器。

Ingress Controller有很多实现，我们这里采用官方维护的Nginx控制器。 项目地址：https://github.com/kubernetes/ingress-nginx

YAML文件：https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/mandatory.yaml

注意事项：

•镜像地址修改成国内的：lizhenliang/nginx-ingress-controller:0.30.0

•将Ingress Controller暴露，一般使用宿主机网络（hostNetwork: true）或者使用NodePort 其他控制器：https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/

## 二、ingress的应用

使用Ingress资源进行流量分发时，Ingress控制器可基于某Ingress资源定义的规则将客户端的请求流量直接转发至与Service对应的后端Pod资源之上，这种转发机制会绕过Service资源，从而省去了由kube-proxy实现的端口代理开销。

Ingress规则需要由一个Service资源对象辅助识别相关的所有Pod对象，但ingress-nginx控制器可经由api.ilinux.io规则的定义直接将请求流量调度至后端pod，而无须经由Service对象API的再次转发。因此，ingress仅仅只需要通过service来识别后端pod，不需要从service转发数据流量。

Ingress选型：

https://kubernetes.io/zh/docs/concepts/services-networking/ingress-controllers/

部署ingress controller：

https://kubernetes.github.io/ingress-nginx/deploy/

NodePort方式：

https://kubernetes.github.io/ingress-nginx/deploy/#bare-metal

官方配置文档：

https://kubernetes.io/zh/docs/concepts/services-networking/ingress/

## 1、准备后端服务

nginx+svc

nginx-deployment.yaml

```java
---
#定义一个deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: web-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-nginx
  template:
    metadata:
      labels:
        app: web-nginx
    spec:
      containers:
      - name: nginx
       image: nginx:1.18.0
        image: harbor.zhai.com/k8s-baseimages/nginx:v1
        ports:
        - containerPort: 80
---
#定义一个service
apiVersion: v1
kind: Service
metadata:
  name: web-nginx
  labels:
    app: web-nginx
spec:
  type: NodePort
  ports:
  - port: 80 Service端口
    protocol: TCP 协议
    targetPort: 80 容器端口
    nodePort: 30010
  selector:
    app: web-nginx 指定关联Pod的标签，与前面deployment定义的标签一致
```

tomcat+svc

nginx-deployment.yaml

```java
---
#定义一个deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tomcat-deployment
  labels:
    app: web-tomcat
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-tomcat
  template:
    metadata:
      labels:
        app: web-tomcat
    spec:
      containers:
      - name: tomcat
       image: tomcat
       image: harbor.zhai.com/k8s-baseimages/tomcat:v1
        ports:
        - containerPort: 8080
---
#定义一个service
apiVersion: v1
kind: Service
metadata:
  name: web-tomcat
  labels:
    app: web-tomcat
spec:
  type: NodePort
  ports:
  - name: http
    port: 8080 Service端口
    protocol: TCP 协议
    targetPort: 8080 容器端口
    nodePort: 30011
  selector:
    app: web-tomcat 指定关联Pod的标签，与前面deployment定义的标签一致
```

运行清单并测试

```java
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl apply -f nginx-deployment.yaml -f tomcat-deployment.yaml 
deployment.apps/nginx-deployment created
service/web-nginx created
deployment.apps/tomcat-deployment created
service/web-tomcat created
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl get pod -o wide
NAME                                 READY   STATUS    RESTARTS   AGE   IP              NODE             NOMINATED NODE   READINESS GATES
nginx-deployment-649765f484-92b29    1/1     Running   0          22s   172.20.58.225   172.168.33.211   <none>           <none>
tomcat-deployment-597746c8b4-nmgml   1/1     Running   0          21s   172.20.58.226   172.168.33.211   <none>           <none>
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes   ClusterIP   10.68.0.1       <none>        443/TCP          11d
web-nginx    NodePort    10.68.59.230    <none>        80:30010/TCP     27s
web-tomcat   NodePort    10.68.124.181   <none>        8080:30011/TCP   27s
#root@k8s-master01:/apps/k8s-yaml/ingress-nginx# curl 172.168.33.210:30010
#web-nginx
#root@k8s-master01:/apps/k8s-yaml/ingress-nginx# curl 172.168.33.210:30011
#web-tomcat
```

## 2、ingress-controller配置清单

需要更改的地方：

```java
1)添加宿主机网络
template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/component: controller
    spec:
      dnsPolicy: ClusterFirst
      hostNetwork: true使用宿主机网络
2)提前下载好image
```

**1、** 在deployment；

```java
apiVersion: v1
kind: Namespace
metadata:
  name: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
---
# Source: ingress-nginx/templates/controller-serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx
  namespace: ingress-nginx
---
# Source: ingress-nginx/templates/controller-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
---
# Source: ingress-nginx/templates/clusterrole.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
  name: ingress-nginx
  namespace: ingress-nginx
rules:
  - apiGroups:
      - ''
    resources:
      - configmaps
      - endpoints
      - nodes
      - pods
      - secrets
    verbs:
      - list
      - watch
  - apiGroups:
      - ''
    resources:
      - nodes
    verbs:
      - get
  - apiGroups:
      - ''
    resources:
      - services
    verbs:
      - get
      - list
      - update
      - watch
  - apiGroups:
      - extensions
      - networking.k8s.io   k8s 1.14+
    resources:
      - ingresses
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ''
    resources:
      - events
    verbs:
      - create
      - patch
  - apiGroups:
      - extensions
      - networking.k8s.io   k8s 1.14+
    resources:
      - ingresses/status
    verbs:
      - update
  - apiGroups:
      - networking.k8s.io   k8s 1.14+
    resources:
      - ingressclasses
    verbs:
      - get
      - list
      - watch
---
# Source: ingress-nginx/templates/clusterrolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
  name: ingress-nginx
  namespace: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ingress-nginx
subjects:
  - kind: ServiceAccount
    name: ingress-nginx
    namespace: ingress-nginx
---
# Source: ingress-nginx/templates/controller-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx
  namespace: ingress-nginx
rules:
  - apiGroups:
      - ''
    resources:
      - namespaces
    verbs:
      - get
  - apiGroups:
      - ''
    resources:
      - configmaps
      - pods
      - secrets
      - endpoints
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ''
    resources:
      - services
    verbs:
      - get
      - list
      - update
      - watch
  - apiGroups:
      - extensions
      - networking.k8s.io   k8s 1.14+
    resources:
      - ingresses
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - extensions
      - networking.k8s.io   k8s 1.14+
    resources:
      - ingresses/status
    verbs:
      - update
  - apiGroups:
      - networking.k8s.io   k8s 1.14+
    resources:
      - ingressclasses
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ''
    resources:
      - configmaps
    resourceNames:
      - ingress-controller-leader-nginx
    verbs:
      - get
      - update
  - apiGroups:
      - ''
    resources:
      - configmaps
    verbs:
      - create
  - apiGroups:
      - ''
    resources:
      - endpoints
    verbs:
      - create
      - get
      - update
  - apiGroups:
      - ''
    resources:
      - events
    verbs:
      - create
      - patch
---
# Source: ingress-nginx/templates/controller-rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx
  namespace: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ingress-nginx
subjects:
  - kind: ServiceAccount
    name: ingress-nginx
    namespace: ingress-nginx
---
# Source: ingress-nginx/templates/controller-service-webhook.yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx-controller-admission
  namespace: ingress-nginx
spec:
  type: ClusterIP
  ports:
    - name: https-webhook
      port: 443
      targetPort: webhook
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/component: controller
---
# Source: ingress-nginx/templates/controller-service.yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: NodePort
  ports:
    - name: http
      port: 80
      protocol: TCP
      targetPort: http
      nodePort: 40080
    - name: https
      port: 443
      protocol: TCP
      targetPort: https
      nodePort: 40444
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/component: controller
---
# Source: ingress-nginx/templates/controller-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/instance: ingress-nginx
      app.kubernetes.io/component: controller
  revisionHistoryLimit: 10
  minReadySeconds: 0
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/component: controller
    spec:
      dnsPolicy: ClusterFirst
      hostNetwork: true
      containers:
        - name: controller
          image: quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.33.0
          imagePullPolicy: IfNotPresent
          lifecycle:
            preStop:
              exec:
                command:
                  - /wait-shutdown
          args:
            - /nginx-ingress-controller
            - --election-id=ingress-controller-leader
            - --ingress-class=nginx
            - --configmap=ingress-nginx/ingress-nginx-controller
            - --validating-webhook=:8443
            - --validating-webhook-certificate=/usr/local/certificates/cert
            - --validating-webhook-key=/usr/local/certificates/key
          securityContext:
            capabilities:
              drop:
                - ALL
              add:
                - NET_BIND_SERVICE
            runAsUser: 101
            allowPrivilegeEscalation: true
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          livenessProbe:
            httpGet:
              path: /healthz
              port: 10254
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 1
            successThreshold: 1
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /healthz
              port: 10254
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 1
            successThreshold: 1
            failureThreshold: 3
          ports:
            - name: http
              containerPort: 80
              protocol: TCP
            - name: https
              containerPort: 443
              protocol: TCP
            - name: webhook
              containerPort: 8443
              protocol: TCP
          volumeMounts:
            - name: webhook-cert
              mountPath: /usr/local/certificates/
              readOnly: true
          resources:
            requests:
              cpu: 100m
              memory: 90Mi
      serviceAccountName: ingress-nginx
      terminationGracePeriodSeconds: 300
      volumes:
        - name: webhook-cert
          secret:
            secretName: ingress-nginx-admission
---
# Source: ingress-nginx/templates/admission-webhooks/validating-webhook.yaml
apiVersion: admissionregistration.k8s.io/v1beta1
kind: ValidatingWebhookConfiguration
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  name: ingress-nginx-admission
  namespace: ingress-nginx
webhooks:
  - name: validate.nginx.ingress.kubernetes.io
    rules:
      - apiGroups:
          - extensions
          - networking.k8s.io
        apiVersions:
          - v1beta1
        operations:
          - CREATE
          - UPDATE
        resources:
          - ingresses
    failurePolicy: Fail
    clientConfig:
      service:
        namespace: ingress-nginx
        name: ingress-nginx-controller-admission
        path: /extensions/v1beta1/ingresses
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/clusterrole.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ingress-nginx-admission
  annotations:
    helm.sh/hook: pre-install,pre-upgrade,post-install,post-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
rules:
  - apiGroups:
      - admissionregistration.k8s.io
    resources:
      - validatingwebhookconfigurations
    verbs:
      - get
      - update
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/clusterrolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ingress-nginx-admission
  annotations:
    helm.sh/hook: pre-install,pre-upgrade,post-install,post-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ingress-nginx-admission
subjects:
  - kind: ServiceAccount
    name: ingress-nginx-admission
    namespace: ingress-nginx
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/job-createSecret.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ingress-nginx-admission-create
  annotations:
    helm.sh/hook: pre-install,pre-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
spec:
  template:
    metadata:
      name: ingress-nginx-admission-create
      labels:
        helm.sh/chart: ingress-nginx-2.4.0
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/version: 0.33.0
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/component: admission-webhook
    spec:
      containers:
        - name: create
          image: jettech/kube-webhook-certgen:v1.2.0
          imagePullPolicy: IfNotPresent
          args:
            - create
            - --host=ingress-nginx-controller-admission,ingress-nginx-controller-admission.ingress-nginx.svc
            - --namespace=ingress-nginx
            - --secret-name=ingress-nginx-admission
      restartPolicy: OnFailure
      serviceAccountName: ingress-nginx-admission
      securityContext:
        runAsNonRoot: true
        runAsUser: 2000
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/job-patchWebhook.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ingress-nginx-admission-patch
  annotations:
    helm.sh/hook: post-install,post-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
spec:
  template:
    metadata:
      name: ingress-nginx-admission-patch
      labels:
        helm.sh/chart: ingress-nginx-2.4.0
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/version: 0.33.0
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/component: admission-webhook
    spec:
      containers:
        - name: patch
          image: jettech/kube-webhook-certgen:v1.2.0
          imagePullPolicy: IfNotPresent
          args:
            - patch
            - --webhook-name=ingress-nginx-admission
            - --namespace=ingress-nginx
            - --patch-mutating=false
            - --secret-name=ingress-nginx-admission
            - --patch-failure-policy=Fail
      restartPolicy: OnFailure
      serviceAccountName: ingress-nginx-admission
      securityContext:
        runAsNonRoot: true
        runAsUser: 2000
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ingress-nginx-admission
  annotations:
    helm.sh/hook: pre-install,pre-upgrade,post-install,post-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
rules:
  - apiGroups:
      - ''
    resources:
      - secrets
    verbs:
      - get
      - create
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ingress-nginx-admission
  annotations:
    helm.sh/hook: pre-install,pre-upgrade,post-install,post-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ingress-nginx-admission
subjects:
  - kind: ServiceAccount
    name: ingress-nginx-admission
    namespace: ingress-nginx
---
# Source: ingress-nginx/templates/admission-webhooks/job-patch/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ingress-nginx-admission
  annotations:
    helm.sh/hook: pre-install,pre-upgrade,post-install,post-upgrade
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
  labels:
    helm.sh/chart: ingress-nginx-2.4.0
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.33.0
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
```

运行ingress-controller

```java
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl apply -f ingress-controller-deploy.yaml 
namespace/ingress-nginx created
serviceaccount/ingress-nginx created
configmap/ingress-nginx-controller created
clusterrole.rbac.authorization.k8s.io/ingress-nginx created
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx created
role.rbac.authorization.k8s.io/ingress-nginx created
rolebinding.rbac.authorization.k8s.io/ingress-nginx created
service/ingress-nginx-controller-admission created
service/ingress-nginx-controller created
deployment.apps/ingress-nginx-controller created
validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission configured
clusterrole.rbac.authorization.k8s.io/ingress-nginx-admission unchanged
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx-admission unchanged
job.batch/ingress-nginx-admission-create created
job.batch/ingress-nginx-admission-patch created
role.rbac.authorization.k8s.io/ingress-nginx-admission created
rolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
serviceaccount/ingress-nginx-admission created
[root@k8s-master01 apps]# kubectl get deployment -A -o wide|grep ingress-nginx
ingress-nginx          nginx-ingress-controller    1/1     1            1           87s    nginx-ingress-controller    lizhenliang/nginx-ingress-controller:0.30.0             app.kubernetes.io/name=ingress-nginx,app.kubernetes.io/part-of=ingress-nginx
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl get deployment -A -o wide|grep ingress-nginx
ingress-nginx          ingress-nginx-controller    1/1     1            1           3m31s   controller                  quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.33.0   app.kubernetes.io/component=controller,app.kubernetes.io/instance=ingress-nginx,app.kubernetes.io/name=ingress-nginx
```

## 3、单Service资源型Ingress

要求：

用户访问web1.ctnrs.com转到后端的nginx

ngress_single-host.yamll文件

```java
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"指定Ingress Controller的类型
    nginx.ingress.kubernetes.io/use-regex: "true"指定后面rules定义的path可以使用正则表达式
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"连接超时时间,默认为5s
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"后端服务器回转数据超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"后端服务器响应超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"客户端上传文件，最大大小，默认为20m
   nginx.ingress.kubernetes.io/rewrite-target: /URL重写
    nginx.ingress.kubernetes.io/app-root: /index.html
spec:
  rules:路由规则
  - host: web1.ctnrs.com客户端访问的host域名
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-nginx转发至哪个service
            port:
              number: 80转发至service的端口号
```

运行ingress_single-host.yaml

```java
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl apply -f ingress_single-host.yaml 
ingress.networking.k8s.io/web-ingress created
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl get ingress web-ingress 
NAME          CLASS    HOSTS            ADDRESS          PORTS   AGE
web-ingress   <none>   web1.ctnrs.com   172.168.33.212   80      19s
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl describe ingress web-ingress 
Name:             web-ingress
Namespace:        default
Address:          172.168.33.212
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
Rules:
  Host            Path  Backends
  ----            ----  --------
  web1.ctnrs.com  
                  /   web-nginx:80 (172.20.58.225:80)
Annotations:      kubernetes.io/ingress.class: nginx
                  nginx.ingress.kubernetes.io/app-root: /index.html
                  nginx.ingress.kubernetes.io/proxy-body-size: 50m
                  nginx.ingress.kubernetes.io/proxy-connect-timeout: 600
                  nginx.ingress.kubernetes.io/proxy-read-timeout: 600
                  nginx.ingress.kubernetes.io/proxy-send-timeout: 600
                  nginx.ingress.kubernetes.io/use-regex: true
Events:
  Type    Reason  Age   From                      Message
  ----    ------  ----  ----                      -------
  Normal  CREATE  23s   nginx-ingress-controller  Ingress default/web-ingress
  Normal  UPDATE  9s    nginx-ingress-controller  Ingress default/web-ingress
#ingress已经绑定了后端pod的ip
```

在外部网络访问web1.ctnrs.com，可以访问后端pod

```java
#把ingress-controller地址与web1.ctnrs.com绑定
#echo "ingress-controller<所在节点ip> blog.ctnrs.com" >> /etc/hosts
root@harbor:~# curl web1.ctnrs.com/index.html
web-nginx
```

## 4、Ingress：基于URI路由多个服务

垂直拆分或微服务架构中，每个小的应用都有其专用的Service资源暴露服务，但在对外开放的站点上，它们可能是财经、新闻、电商、无线端或API接口等一类的独立应用，可通过主域名的URL路径（path）分别接入，例如，[www.ilinux.io/api](https://www.cnblogs.com/yaokaka/p/www.ilinux.io/api)、[www.ilinux.io/wap](https://www.cnblogs.com/yaokaka/p/www.ilinux.io/wap)等，用于发布集群内名称为API和WAP的Services资源。于是，可对应地创建一个如下的Ingress资源，它将对[www.ilinux.io/api](https://www.cnblogs.com/yaokaka/p/www.ilinux.io/api)的请求统统转发至API Service资源，将对[www.ilinux.io/wap](https://www.cnblogs.com/yaokaka/p/www.ilinux.io/wap)的请求转发至WAP Service资源。

```java
#访问web.zhai.com/nginx，ingress将转到后端的nginx pod
#访问web.zhai.com/myapp1和web.zhai.com/myapp2，ingress将转到后端的tomcat pod
```

ingress-multi-url.yaml

```java
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"指定Ingress Controller的类型
    nginx.ingress.kubernetes.io/use-regex: "true"指定后面rules定义的path可以使用正则表达式
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"连接超时时间,默认为5s
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"后端服务器回转数据超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"后端服务器响应超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"客户端上传文件，最大大小，默认为20m
   nginx.ingress.kubernetes.io/rewrite-target: /URL重写
    nginx.ingress.kubernetes.io/app-root: /index.html
spec:
  rules:路由规则
  - host: web.zhai.com客户端访问的host域名
    http:
      paths:
      - path: /nginx
        pathType: Prefix
        backend:
          service:
            name: web-nginx转发至哪个service
            port:
              number: 80转发至service的端口号
      - path: /myapp1
        pathType: Prefix
        backend:
          service:
            name: web-tomcat转发至哪个service
            port:
              number: 8080
      - path: /myapp2
        pathType: Prefix
        backend:
          service:
            name: web-tomcat转发至哪个service
            port:
              number: 8080
```

运行清单并测试

```java
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl apply -f ingress-multi-url.yaml 
ingress.networking.k8s.io/web-ingress created
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl get ingress web-ingress 
NAME          CLASS    HOSTS         ADDRESS          PORTS   AGE
web-ingress   <none>   web.zhai.com   172.168.33.212   80      5m50s
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl describe ingress web-ingress 
Name:             web-ingress
Namespace:        default
Address:          172.168.33.212
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
Rules:
  Host         Path  Backends
  ----         ----  --------
  web.ywx.com  
               /nginx/   web-nginx:80 (172.20.58.225:80)
               /myapp1   web-tomcat:8080 (172.20.58.226:8080)
               /myapp2   web-tomcat:8080 (172.20.58.226:8080)
Annotations:   kubernetes.io/ingress.class: nginx
               nginx.ingress.kubernetes.io/app-root: /index.html
               nginx.ingress.kubernetes.io/proxy-body-size: 50m
               nginx.ingress.kubernetes.io/proxy-connect-timeout: 600
               nginx.ingress.kubernetes.io/proxy-read-timeout: 600
               nginx.ingress.kubernetes.io/proxy-send-timeout: 600
               nginx.ingress.kubernetes.io/use-regex: true
Events:
  Type    Reason  Age    From                      Message
  ----    ------  ----   ----                      -------
  Normal  CREATE  5m57s  nginx-ingress-controller  Ingress default/web-ingress
  Normal  UPDATE  5m36s  nginx-ingress-controller  Ingress default/web-ingress
#在其他机子上测试
root@harbor:~# curl web.zhai.com/nginx/index.html
web.ywx.com/nginx
root@harbor:~# curl web.zhai.com/myapp1/index.jsp
myapp1
root@harbor:~# curl web.zhai.com/myapp2/index.jsp
myapp2
```

## 5、Ingress：多名称的虚拟主机

```java
#访问web.nginx.com，ingress将转到后端的nginx pod
#访问web.tomcat.com，ingress将转到厚点的tomcat pod
```

ingress-multi-host.yaml

```java
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"指定Ingress Controller的类型
    nginx.ingress.kubernetes.io/use-regex: "true"指定后面rules定义的path可以使用正则表达式
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"连接超时时间,默认为5s
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"后端服务器回转数据超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"后端服务器响应超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"客户端上传文件，最大大小，默认为20m
   nginx.ingress.kubernetes.io/rewrite-target: /URL重写
    nginx.ingress.kubernetes.io/app-root: /index.html
spec:
  rules:路由规则
  - host: web.nginx.com客户端访问的host域名
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-nginx转发至哪个service
            port:
              number: 80转发至service的端口号
  - host: web.tomcat.com客户端访问的host域名
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-tomcat转发至哪个service
            port:
              number: 8080
```

运行清单并验证

```java
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl apply -f ingress-multi-host.yaml 
ingress.networking.k8s.io/web-ingress created
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl get ingress web-ingress 
NAME          CLASS    HOSTS                          ADDRESS   PORTS   AGE
web-ingress   <none>   web.nginx.com,web.tomcat.com             80      7s
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl describe ingress web-ingress 
Name:             web-ingress
Namespace:        default
Address:          172.168.33.212
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
Rules:
  Host            Path  Backends
  ----            ----  --------
  web.nginx.com   
                  /   web-nginx:80 (172.20.58.225:80)
  web.tomcat.com  
                  /   web-tomcat:8080 (172.20.58.226:8080)
Annotations:      kubernetes.io/ingress.class: nginx
                  nginx.ingress.kubernetes.io/app-root: /index.html
                  nginx.ingress.kubernetes.io/proxy-body-size: 50m
                  nginx.ingress.kubernetes.io/proxy-connect-timeout: 600
                  nginx.ingress.kubernetes.io/proxy-read-timeout: 600
                  nginx.ingress.kubernetes.io/proxy-send-timeout: 600
                  nginx.ingress.kubernetes.io/use-regex: true
Events:
  Type    Reason  Age   From                      Message
  ----    ------  ----  ----                      -------
  Normal  CREATE  12s   nginx-ingress-controller  Ingress default/web-ingress
  Normal  UPDATE  3s    nginx-ingress-controller  Ingress default/web-ingress
#在其他主机测试
root@harbor:~# curl web.tomcat.com/index.jsp
tomcat
root@harbor:~# curl web.tomcat.com/myapp1/index.jsp
myapp1
root@harbor:~# curl web.tomcat.com/myapp2/index.jsp
myapp2
root@harbor:~# curl web.nginx.com/index.html
web-nginx
```

## 6、Ingress：HTTPS

配置HTTPS步骤：1、准备域名证书文件（来自：openssl/cfssl工具自签或者权威机构颁发）

```java
root@k8s-master01:~# mkdir -p /apps/certs
root@k8s-master01:~# cd /apps/certs
root@k8s-master01:~# openssl  genrsa -out tls.key 2048
root@k8s-master01:~# openssl  req -new -x509 -key tls.key  -out tls.crt -subj /C=CN/ST=Beijing/L=Beijing/O=magedu/CN=blog.ctnrs.com -days  3650
```

**2、** 将证书文件保存到Secret；

```java
kubectl create secret tls blog-ctnrs-com --cert=tls.crt --key=tls.key
```

**3、** Ingress规则配置tls；

ngress-single-tls.yaml

```java
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: blog-https
  annotations:
    kubernetes.io/ingress.class: "nginx"指定Ingress Controller的类型
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
spec:
 配置tls证书
  tls:
  - hosts:
    - blog.ctnrs.com
    secretName: blog-ctnrs-com
  rules:路由规则
  - host: blog.ctnrs.com客户端访问的host域名
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-nginx转发至哪个service
            port:
              number: 80转发至service的端口号
```

运行清单并测试

```java
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl apply -f ingress-single-tls.yaml 
ingress.networking.k8s.io/blog-https created
root@k8s-master01:/apps/k8s-yaml/ingress-nginx# kubectl describe ingress blog-https 
Name:             blog-https
Namespace:        default
Address:          172.168.33.212
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
TLS:
  blog-ctnrs-com terminates blog.ctnrs.com
Rules:
  Host            Path  Backends
  ----            ----  --------
  blog.ctnrs.com  
                  /   web-nginx:80 (172.20.58.225:80)
Annotations:      kubernetes.io/ingress.class: nginx
                  nginx.ingress.kubernetes.io/ssl-redirect: true
Events:
  Type    Reason  Age   From                      Message
  ----    ------  ----  ----                      -------
  Normal  CREATE  37s   nginx-ingress-controller  Ingress default/blog-https
  Normal  UPDATE  20s   nginx-ingress-controller  Ingress default/blog-https
#在其他机子上测试
#添加hosts文件
#echo "ingress-controller<所在节点ip> blog.ctnrs.com" >> /etc/hosts
root@harbor:~# curl https://blog.ctnrs.com
curl: (60) SSL certificate problem: self signed certificate
More details here: https://curl.haxx.se/docs/sslcerts.html
curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
root@harbor:~# curl -k  https://blog.ctnrs.com
web-nginx
```

## 7、Ingress：个性化配置

```java
示例1：设置代理超时参数
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
 ......
注：上面这些配置都是针对Nginx Server块生效
配置文件建议写进容器中
示例2：设置客户端上传文件大小
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
示例3：重定向
nginx.ingress.kubernetes.io/rewrite-target: https://www.baidu.com
示例4：自定义规则
nginx.ingress.kubernetes.io/server-snippet: |
if ($http_user_agent ~* '(Android|iPhone)') {
rewrite ^/(.*) http://m.baidu.com break;
}
```

更多使用方法：[https://github.com/kubernetes/ingress-nginx/blob/master/docs/user-guide/nginx-configuration/annotations.md](https://github.com/kubernetes/ingress-nginx/blob/master/docs/user-guide/nginx-configuration/annotations.md)

## 8、IngressController

Ingress Contronler怎么工作的？

Ingress Contronler通过与Kubernetes API 交互，动态的去感知集群中Ingress 规则变化，然后读取它，按照自定义的规则，规则就是写明了哪个域名对应哪个service，生成一段Nginx 配置，应用到管理的Nginx服务，然后热加载生效。以此来达到Nginx负载均衡器配置及动态更新的问题。

流程包流程：客户端->Ingress Controller（nginx）-> 分布在各节点Pod

## 三、Ingress Controller高可用方案

一般Ingress Controller会以DaemonSet+nodeSelector部署到几台特定Node，然后将这几台挂载到公网负载均衡器对外提供服务。
