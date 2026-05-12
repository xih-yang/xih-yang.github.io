# 14、Kubernetes 实战 - cordon暂停调度/uncordon恢复调度/drain驱逐
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/14.html
- 分类：容器服务
- 分组：教程目录
## 前言

如何让k8s集群某台node暂停调度?

如何恢复调度?

如果某台node需要维护,如果将pod从这台node中驱逐?

## cordon暂停调度

暂停node调度，使node不可用，使node不接收新的pod。

命令示例

```java
kubectl cordon node2
```

```java
[root@master ~]# kubectl get node
NAME     STATUS   ROLES    AGE    VERSION
master   Ready    master   4d6h   v1.17.4
node1    Ready    <none>   4d6h   v1.17.4
node2    Ready    <none>   4d6h   v1.17.4
[root@master ~]# kubectl cordon node2
node/node2 cordoned
[root@master ~]# kubectl get node
NAME     STATUS                     ROLES    AGE    VERSION
master   Ready                      master   4d6h   v1.17.4
node1    Ready                      <none>   4d6h   v1.17.4
node2    Ready,SchedulingDisabled   <none>   4d6h   v1.17.4
[root@master ~]# 
```

可以看到node2节点的状态变成了SchedulingDisabled

> 解释 :SchedulingDisabled 调度不可用

## uncordon恢复调度

取消node暂停调度状态，使node可以接收调度

命令示例

```java
kubectl uncordon node2
```

```java
[root@master ~]# kubectl get node
NAME     STATUS                     ROLES    AGE    VERSION
master   Ready                      master   4d6h   v1.17.4
node1    Ready                      <none>   4d6h   v1.17.4
node2    Ready,SchedulingDisabled   <none>   4d6h   v1.17.4
[root@master ~]# kubectl uncordon node2
node/node2 uncordoned
[root@master ~]# kubectl get node
NAME     STATUS   ROLES    AGE    VERSION
master   Ready    master   4d6h   v1.17.4
node1    Ready    <none>   4d6h   v1.17.4
node2    Ready    <none>   4d6h   v1.17.4
```

## drain驱逐

驱逐，把pod赶走

```java
#把pod从node1赶走
kubectl drain node1
```

```java
[root@master ~]# kubectl get node
NAME     STATUS   ROLES    AGE    VERSION
master   Ready    master   4d6h   v1.17.4
node1    Ready    <none>   4d6h   v1.17.4
node2    Ready    <none>   4d6h   v1.17.4
[root@master ~]# kubectl get pod -n dev -o wide
NAME                      READY   STATUS    RESTARTS   AGE     IP            NODE    NOMINATED NODE   READINESS GATES
nginx-64777cd554-dsvzn    1/1     Running   0          5m6s    10.244.1.35   node1   <none>           <none>
nginx2-56684bd57d-kgnd4   1/1     Running   0          4m45s   10.244.1.36   node1   <none>           <none>
nginx3-74c945c4c4-96dkf   1/1     Running   0          4m36s   10.244.1.37   node1   <none>           <none>
nginx4-d989c76f4-6dwkd    1/1     Running   0          2m35s   10.244.2.32   node2   <none>           <none>
nginx5-5794c9cd74-n8rl2   1/1     Running   0          2m28s   10.244.2.33   node2   <none>           <none>
[root@master ~]# kubectl drain node1
node/node1 cordoned
evicting pod "nginx-6867cdf567-jknt5"
evicting pod "nginx-64777cd554-dsvzn"
evicting pod "nginx2-56684bd57d-kgnd4"
evicting pod "nginx3-74c945c4c4-96dkf"
pod/nginx-6867cdf567-jknt5 evicted
pod/nginx2-56684bd57d-kgnd4 evicted
pod/nginx-64777cd554-dsvzn evicted
pod/nginx3-74c945c4c4-96dkf evicted
node/node1 evicted
[root@master ~]# kubectl get pod -n dev -o wide
NAME                      READY   STATUS    RESTARTS   AGE     IP            NODE    NOMINATED NODE   READINESS GATES
nginx-64777cd554-fgrf9    1/1     Running   0          7s      10.244.2.37   node2   <none>           <none>
nginx2-56684bd57d-mkcpt   1/1     Running   0          7s      10.244.2.36   node2   <none>           <none>
nginx3-74c945c4c4-5clvj   1/1     Running   0          7s      10.244.2.35   node2   <none>           <none>
nginx4-d989c76f4-6dwkd    1/1     Running   0          2m51s   10.244.2.32   node2   <none>           <none>
nginx5-5794c9cd74-n8rl2   1/1     Running   0          2m44s   10.244.2.33   node2   <none>           <none>
```

可以看到node1上的pod被驱逐到了其它node上(这里是node2)
