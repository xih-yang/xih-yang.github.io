# 19、Kubernetes - 实战：资源监控 Dashboard v2.0.0 部署与使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/19.html
- 分类：容器服务
- 分组：教程目录
一、Dashboard的介绍与部署

Dashboard可以给用户提供一个可视化的 Web 界面来查看当前集群的各种信息。用户可以用 Kubernetes Dashboard 部署容器化的应用、监控应用的状态、执行故障排查任务以及管理 Kubernetes 各种资源。

下载部署文件：

```java
[root@server1 limit]# wget https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml
```

修改部署文件，更改镜像源地址：

```java
[root@server1 limit]# vim recommended.yaml 
```

需要的镜像:kubernetesui/metrics-scraper:v1.0.4,kubernetesui/dashboard:v2.0.0,可以先下载放到私有仓库。

应用部署文件：

```java
[root@server1 limit]# kubectl apply -f recommended.yaml 
namespace/kubernetes-dashboard created
serviceaccount/kubernetes-dashboard created
service/kubernetes-dashboard created
secret/kubernetes-dashboard-certs created
secret/kubernetes-dashboard-csrf created
secret/kubernetes-dashboard-key-holder created
configmap/kubernetes-dashboard-settings created
role.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrole.rbac.authorization.k8s.io/kubernetes-dashboard created
rolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created
```

查看状态：

```java
[root@server1 limit]# kubectl get svc -n kubernetes-dashboard 
NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
dashboard-metrics-scraper   ClusterIP   10.105.95.150   <none>        8000/TCP   84s
kubernetes-dashboard        ClusterIP   10.99.200.200   <none>        443/TCP    85s
[root@server1 limit]# kubectl describe svc kubernetes-dashboard -n kubernetes-dashboard 
Name:              kubernetes-dashboard
Namespace:         kubernetes-dashboard
Labels:            k8s-app=kubernetes-dashboard
Annotations:       Selector:  k8s-app=kubernetes-dashboard
Type:              ClusterIP
IP:                10.99.200.200
Port:              <unset>  443/TCP
TargetPort:        8443/TCP
Endpoints:         10.244.0.53:8443
Session Affinity:  None
Events:            <none>
```

可以看出service的类型是ClusterIP只能在集群内部访问，我们需要将类型修改为NodePort以便外部访问：

```java
[root@server1 limit]# kubectl edit svc kubernetes-dashboard -n kubernetes-dashboard
service/kubernetes-dashboard edited
```

更改后再次查看状态：

```java
[root@server1 limit]# kubectl describe svc kubernetes-dashboard -n kubernetes-dashboard Name:                     kubernetes-dashboard
Namespace:                kubernetes-dashboard
Labels:                   k8s-app=kubernetes-dashboard
Annotations:              Selector:  k8s-app=kubernetes-dashboard
Type:                     NodePort
IP:                       10.110.242.11
Port:                     <unset>  443/TCP
TargetPort:               8443/TCP
NodePort:                 <unset>  30273/TCP
Endpoints:                10.244.0.53:8443
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

查看这个service的端口：

```java
[root@server1 limit]# kubectl get pod -o wide -n kubernetes-dashboard
NAME                                         READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
dashboard-metrics-scraper-6b4884c9d5-qmmhd   1/1     Running   0          38s   10.244.0.54   server1   <none>           <none>
kubernetes-dashboard-7b544877d5-gm5lx        1/1     Running   0          39s   10.244.0.53   server1   <none>
[root@server1 limit]# kubectl get svc -o wide -n kubernetes-dashboard
NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE     SELECTOR
dashboard-metrics-scraper   ClusterIP   10.108.81.73    <none>        8000/TCP        3m28s   k8s-app=dashboard-metrics-scraper
kubernetes-dashboard        NodePort    10.110.242.11   <none>        443:30273/TCP   3m29s   k8s-app=kubernetes-dashboard
```

可以看出pod运行在server1上，端口为30273.

在物理机浏览器访问 ：

```java
 https://172.25.63.1:30273
```

陆dashboard需要认证，需要获取dashboard pod的token，查看用于登陆的token：

```java
[root@server1 limit]# kubectl -n kubernetes-dashboard get secrets 
NAME                               TYPE                                  DATA   AGE
default-token-k9fbp                kubernetes.io/service-account-token   3      5m16s
kubernetes-dashboard-certs         Opaque                                0      5m15s
kubernetes-dashboard-csrf          Opaque                                1      5m15s
kubernetes-dashboard-key-holder    Opaque                                2      5m15s
kubernetes-dashboard-token-stw28   kubernetes.io/service-account-token   3      5m16s
[root@server1 limit]# kubectl -n kubernetes-dashboard describe secrets kubernetes-dashboard-token-stw28
Name:         kubernetes-dashboard-token-stw28
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: kubernetes-dashboard
              kubernetes.io/service-account.uid: 8bf16bb6-55d0-44ae-a5c6-a1dd561757f7
Type:  kubernetes.io/service-account-token
Data
====
ca.crt:     1025 bytes
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6Ilp5SmtWcG42LUZiMGhaR3Rac3dUT01HQ0RkdFpvaE00ZkNGNnJuend6dmMifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJrdWJlcm5ldGVzLWRhc2hib2FyZC10b2tlbi1zdHcyOCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50Lm5hbWUiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjhiZjE2YmI2LTU1ZDAtNDRhZS1hNWM2LWExZGQ1NjE3NTdmNyIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDprdWJlcm5ldGVzLWRhc2hib2FyZDprdWJlcm5ldGVzLWRhc2hib2FyZCJ9.d4I9DsC5YV3DC1fG5CtetJB6hUeS2rRAtTXH2W8TvBvhXUe8Ybpvp9kzaBaD2P_G7XC6uDHFiPBVfwQzAuRS5cEVZlV6lVzrDRp20KaFW9IUSOyvj8XPtA99Smbughdc06K9_rLcsaraga02og2tyGXgkdjoSJKlEIVoeFh_ZAkoUJlOkm_p2G5MuW-kM80sqKd1hl0bAXi1vWHdKqgSsS_QONOOFfTM3SQmoReI_3VNPNdppmi58T-C4QxL_lRlFYLOn5IglZLHxG-pl_EqFKEhKNggahIOiuXl5KAz31_jZDK3i1R2VHZO7Vr4yZMMUMn9gH6017isxIwbJUOEiQ
```

将token复制进去登陆：

登陆进去后发现没有信息显示：

默认dashboard对集群没有操作权限，需要授权，由于该namespace下面已经有service account了，我们直接进行授权即可：

```java
[root@server1 limit]# kubectl -n kubernetes-dashboard get sa
NAME                   SECRETS   AGE
default                1         8m20s
kubernetes-dashboard   1         8m20s
[root@server1 limit]# vim dashboard-rbac.yaml
[root@server1 limit]# cat dashboard-rbac.yaml 
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin			#绑定的是内置的权限最大的集群角色cluster-admin
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
[root@server1 limit]# kubectl apply -f dashboard-rbac.yaml 
clusterrolebinding.rbac.authorization.k8s.io/admin-user created
```

应用后在查看网页端：
