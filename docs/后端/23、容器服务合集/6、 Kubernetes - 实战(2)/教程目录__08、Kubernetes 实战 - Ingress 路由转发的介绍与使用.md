# 08、Kubernetes 实战 - Ingress 路由转发的介绍与使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/8.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，通过 Service 服务，解决了 pod 的 IP 漂移问题；

K8s的 Pod 和 Service 通过 NodePort 将服务暴露到外部，随着服务增加端口就变得不好管理；所以，通常情况下会设计一个 Ingress 进行路由转发方便统一管理；

本篇，介绍 Ingress 的使用；

## 二，Ingress 简介

### 1，Ingress

> ingress：意思是入口、进入；

Ingress 是 kubernetes 组件，能够帮助服务实现负载均衡：根据路径前缀匹配、权重、cookie、header 值访问不同的服务；

### 2，ingress-nginx

ingress-nginx 是基于 nginx 的一个 ingress 实现，能够通过正则匹配路径实现流量转发，基于 cookie、header 切分流量，实现灰度发布；

### 3，路径匹配

如图，根据不同的路径，访问不同的服务

- 当访问 /user 时，跳转访问 user 服务；
- 当访问 /pay 时，跳转访问 pay 服务；

> 备注：也可以根据 cookie 中的某个字段、或根据请求头信息，如 from=beijing，根据不同条件跳转至不同的服务进行访问;

## 三，Ingress 使用

### 1，下载 ingress

```java
#wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/baremetal/deploy.yaml
```

deploy.yaml 内容（如果被墙可以手动创建）

```java
[root@k8s-master deployment]# ls
deployment-user-v1.yaml  deploy.yaml  user-service-v1.yaml
[root@k8s-master deployment]# cat deploy.yaml
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    - name: https
      port: 443
      protocol: TCP
      targetPort: https
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
      containers:
        - name: controller
          image: us.gcr.io/k8s-artifacts-prod/ingress-nginx/controller:v0.34.1@sha256:0e072dddd1f7f8fc8909a2ca6f65e76c5f0d2fcfb8be47935ae3457e8bbceb20
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
            failureThreshold: 5
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
# before changing this value, check the required kubernetes version
# https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#prerequisites
apiVersion: admissionregistration.k8s.io/v1beta1
kind: ValidatingWebhookConfiguration
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    sideEffects: None
    admissionReviewVersions:
      - v1
      - v1beta1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
spec:
  template:
    metadata:
      name: ingress-nginx-admission-create
      labels:
        helm.sh/chart: ingress-nginx-2.11.1
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/version: 0.34.1
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/component: admission-webhook
    spec:
      containers:
        - name: create
          image: docker.io/jettech/kube-webhook-certgen:v1.2.2
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
spec:
  template:
    metadata:
      name: ingress-nginx-admission-patch
      labels:
        helm.sh/chart: ingress-nginx-2.11.1
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/version: 0.34.1
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/component: admission-webhook
    spec:
      containers:
        - name: patch
          image: docker.io/jettech/kube-webhook-certgen:v1.2.2
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
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
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: admission-webhook
  namespace: ingress-nginx
```

### 2，修改 Ingress 配置

```java
vi deploy.yaml
  namespace: ingress-nginx
spec:
  type: NodePort
  ports:
    - name: http
      port: 80
      protocol: TCP
      targetPort: http
+     nodePort: 31234
    - name: https
      port: 443
      protocol: TCP
      targetPort: https
+     nodePort: 31235
+ image: registry.cn-hangzhou.aliyuncs.com/bin_x/nginx-ingress:v0.34.1@sha256:80359bdf124d49264fabf136d2aecadac729b54f16618162194356d3c78ce2fe
```

### 3，根据配置文件启动 ingress

配置生效，拉取 ingress 镜像并自动布署 ingress

```java
[root@k8s-master deployment]# kubectl apply -f deploy.yaml
namespace/ingress-nginx unchanged
serviceaccount/ingress-nginx unchanged
configmap/ingress-nginx-controller configured
clusterrole.rbac.authorization.k8s.io/ingress-nginx unchanged
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx unchanged
role.rbac.authorization.k8s.io/ingress-nginx unchanged
rolebinding.rbac.authorization.k8s.io/ingress-nginx unchanged
service/ingress-nginx-controller-admission unchanged
service/ingress-nginx-controller created
deployment.apps/ingress-nginx-controller configured
Warning: admissionregistration.k8s.io/v1beta1 ValidatingWebhookConfiguration is deprecated in v1.16+, unavailable in v1.22+; use admissionregistration.k8s.io/v1 ValidatingWebhookConfiguration
validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission configured
clusterrole.rbac.authorization.k8s.io/ingress-nginx-admission unchanged
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx-admission unchanged
job.batch/ingress-nginx-admission-create unchanged
job.batch/ingress-nginx-admission-patch unchanged
role.rbac.authorization.k8s.io/ingress-nginx-admission unchanged
rolebinding.rbac.authorization.k8s.io/ingress-nginx-admission unchanged
serviceaccount/ingress-nginx-admission unchanged
```

### 4，查看 pods 的部署状态

- -n 指定命名空间查询
- -l 指定label名称查询

```java
[root@k8s-master deployment]# kubectl -n ingress-nginx get service
NAME                                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.108.212.237   <none>        80:31234/TCP,443:31235/TCP   16s
ingress-nginx-controller-admission   ClusterIP   10.97.160.200    <none>        443/TCP                      7m5s
```

第一条记录，将内部的 80 端口映射为当前宿主机的 31234，443 映射为 31235；

- ingress 服务的配置也是使用 yaml 文件进行管理
- [annotations](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/) 是 ingress 的主要配置项目，可以用来修改这些配置来修改 ingress 的行为。我们可以通过修改这些配置来实现灰度发布，跨域资源，甚至将 [www.abc.com](http://www.abc.com/) 重定向到 abc.com
- rules 是 ingress 配置路径转发规则的地方,当我们去访问 /front 时， ingress 就会帮我们调度到 front-service-v1 这个 service 上面
- path 可以是一个路径字符串，也可以是一个正则表达式
- backend 则是 k8s 的 service 服务， serviceName 是服务名称， servicePort 是服务端口
- backend 可以用来给 ingress 设置默认访问的 Service 服务。当请求不匹配 rules 中任何一条规则时，则会去走 backend 中的配置

### 5，创建 ingress 配置文件

此时，ingress 已经启动，编写配置文件 ingress.yaml；

```java
vi ingress.yaml
```

ingress.yaml 内容：

```java
apiVersion: extensions/v1beta1   api版本号
kind: Ingress										 资源类型
metadata:
  name: nginx-ingress            名称nginx入口
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    kubernetes.io/ingress.class: nginx
spec:
  rules:  转发规则
  - http:
      paths: 路径
       - path: /user
         backend:
          serviceName: service-user-v1
          servicePort: 80
       - path: /pay
         backend:
          serviceName: service-pay-v1
          servicePort: 80    
  backend:默认规则
     serviceName: service-user-v1
     servicePort: 80
```

### 6，根据配置文件创建 ingress

```java
[root@k8s-master deployment]# kubectl apply -f ./ingress.yaml
Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
ingress.extensions/nginx-ingress created
```

### 7，访问服务链接

```java
// 内网 ip
curl http://172.17.178.105:31234/user
curl http://172.17.178.106:31234/user
// 公网 ip
curl http://47.93.9.45:31234/user
curl http://39.105.58.35:31234/user
// 内网 ip
curl http://172.17.178.105:31234/pay
curl http://172.17.178.106:31234/pay
// 公网 ip
curl http://47.93.9.45:31234/pay
curl http://39.105.58.35:31234/pay
// 实际访问
[root@k8s-master deployment]# curl http://172.17.178.105:31234/user
user-v1
[root@k8s-master deployment]# curl http://172.17.178.106:31234/user
user-v1
[root@k8s-master deployment]# curl http://47.93.9.45:31234/user
user-v1
[root@k8s-master deployment]# curl http://39.105.58.35:31234/user
user-v1
// 备注：访问 /pay 会报 503，因为还没有 service-pay-v1
[root@k8s-master deployment]# curl http://172.17.178.105:31234/pay
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body>
<center><h1>503 Service Temporarily Unavailable</h1></center>
<hr><center>nginx/1.19.1</center>
</body>
</html>
```

备注：ingress.yaml 配置文件中的 service-pay-v1 服务此时还没有

### 8，创建 service-pay-v1 服务

复制一份 deployment-user-v1.yaml

```java
cp deployment-user-v1.yaml deployment-pay-v1.yaml
```

编辑deployment-pay-v1.yaml，就改 5 处 user-v1 改为 pay-v1，并修改使用镜像；

```java
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: pay-v1     资源名称 
spec:
  selector:
    matchLabels:
      app: pay-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值 
  replicas: 3       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: pay-v1Pod名称 
    spec:           描述Pod内的容器信息
      containers:
      - name: nginx 容器的名称
        image:      镜像 
        ports:
        - containerPort: 80容器内映射的端口
```

创建deployment：deployment 会创建一个 ReplicateSet 副本集，ReplicateSet 会再去创建 3 个 pod 副本；

生效配置

```java
[root@k8s-master deployment]# kubectl apply -f deployment-pay-v1.yaml
deployment.apps/pay-v1 configured
```

查看pods 信息

```java
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
mysql-g2zst                1/1     Running   52         42h
nginx-6799fc88d8-2wvl2     1/1     Running   0          42h
nginx-6799fc88d8-lkct4     1/1     Running   0          43h
nginx-6799fc88d8-pktqq     1/1     Running   0          42h
pay-v1-655587b6f5-lpft2    1/1     Running   0          62s
pay-v1-655587b6f5-pcnrp    1/1     Running   0          69s
pay-v1-655587b6f5-spj85    1/1     Running   0          63s
user-v1-5895c69847-649g5   1/1     Running   0          36h
user-v1-5895c69847-chrjk   1/1     Running   0          36h
user-v1-5895c69847-qnwg2   1/1     Running   0          36h
```

此时，3 个 pay-v1 已经成功运行了了

### 9，配置 pay 服务的 Service

拷贝service-user-v1.yaml 配置文件 为 service-pay-v1.yaml

备注：与实际的命名有偏差

```java
cp user-service-v1.yaml pay-service-v1.yaml
```

修改配置

```java
vi pay-service-v1.yaml
apiVersion: v1
kind: Service
metadata:
  name: service-pay-v1
spec:
  selector:
    app: pay-v1                      
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: NodePort
```

生效配置

```java
[root@k8s-master deployment]# kubectl apply -f pay-service-v1.yaml
service/service-pay-v1 created
```

查看服务

```java
kubectl get service
// 实际执行
[root@k8s-master deployment]# kubectl get service
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1       <none>        443/TCP        2d9h
nginx             NodePort    10.107.223.32   <none>        80:32117/TCP   43h
service-pay-v1    NodePort    10.106.98.218   <none>        80:30872/TCP   42s
service-user-v1   NodePort    10.104.13.40    <none>        80:31071/TCP   21h
```

pay的端口号是 30872

访问pay 服务：

```java
[root@k8s-master deployment]# curl http://172.17.178.106:30872
pay
```

访问ingress：

```java
// 内网 ip
curl http://172.17.178.105:31234/pay
curl http://172.17.178.106:31234/pay
// 公网 ip
curl http://47.93.9.45:31234/pay
curl http://39.105.58.35:31234/pay
[root@k8s-master deployment]# curl http://172.17.178.105:31234/pay
pay
[root@k8s-master deployment]# curl http://172.17.178.106:31234/pay
pay
[root@k8s-master deployment]# curl http://47.93.9.45:31234/pay
pay
[root@k8s-master deployment]# curl http://39.105.58.35:31234/pay
pay
```

### 10，查看 ingress 详情

```java
kubectl describe ingress
```

## 四，结尾

下一篇，灰度发布；
