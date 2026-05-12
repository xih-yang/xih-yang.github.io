# 25、Kubernetes 实战 - 布署前端项（下）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/25.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了前端项目的部署：项目的创建和 jenkins 配置；

本篇，创建 Deployment、Service，完成前端项目的部署；

## 二，创建 Deployment

创建Deployment 配置文件：deployment-cicd-frontend.yaml

```java
[root@k8s-master cicd]# vi deployment-cicd-frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cicd-frontend
spec:
  selector:
    matchLabels:匹配标签名
      app: cicd-frontend
  replicas: 1
  template:模板
    metadata:
      labels:
        app: cicd-frontend对应selector-matchLabels名称
    spec:规格
      imagePullSecrets:拉取私服镜像所需要的信息
      - name: private-registry
      containers:容器
      - name: cicd-frontend
        image: 47.94.92.122:8082/cicd-frontend:20220112231457
```

生效配置：

```java
[root@k8s-master cicd]# kubectl apply -f deployment-cicd-frontend.yaml
deployment.apps/cicd-frontend created
```

查看pod：cicd-frontend 已完成 1 个副本的部署

```java
[root@k8s-master cicd]# kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
cicd-backend-98b5d4f57-ftrdk     1/1     Running   0          34h
cicd-frontend-77447bfdb4-bgt6t   1/1     Running   0          90s
cicd-mysql-745975859b-c4b6p      1/1     Running   4          34h
```

## 三，创建 Service

创建Service 配置文件：service-cicd-frontend.yaml

```java
[root@k8s-master cicd]# vi service-cicd-frontend.yaml
apiVersion: v1
kind: Service
metadata:
  name: service-cicd-frontend
spec:
  selector:
    app: cicd-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: NodePort
```

> 备注：
>
> 1，spec 下的 app，这里的 cicd-frontend 是需要和 Deployment 部署配置文件的名字一致；
>
> 2，port: 80，指前端构建 nginx 容器的端口号，集群内部服务之间项目访问的端口号是 80；
>
> 3，targetPort: 80：指容器内部启动之后，对外暴露的端口号是 80；

生效配置：

```java
[root@k8s-master cicd]# kubectl apply -f  service-cicd-frontend.yaml
service/service-cicd-frontend created
```

查看服务

```java
[root@k8s-master cicd]# kubectl get svc
NAME                    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
kubernetes              ClusterIP   10.96.0.1        <none>        443/TCP          21d
service-cicd-backend    NodePort    10.97.144.175    <none>        7001:30174/TCP   34h
service-cicd-frontend   NodePort    10.103.232.242   <none>        80:30339/TCP     2m21s
service-cicd-mysql      NodePort    10.108.224.96    <none>        8899:32154/TCP   5d13h
```

可以看到，service-cicd-frontend 对外部暴露的端口号是 30339

测试访问服务

查看host，部署在 k8s-node 节点上，使用内网 ip：172.17.178.106

```java
// 查看 host
[root@k8s-master cicd]# cat /etc/hosts
::1	localhost	localhost.localdomain	localhost6	localhost6.localdomain6
127.0.0.1	localhost	localhost.localdomain	localhost4	localhost4.localdomain4
172.17.178.106	k8s-node
172.17.178.105	k8s-master
172.17.178.105	k8s-master	k8s-master
```

curl 访问页面地址，返回 html 代码，说明部署成功且能够正常提供服务

```java
// 测试访问
[root@k8s-master cicd]# curl http://172.17.178.106:30339/
<!doctype html><html lang="en"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Web site created using create-react-app"/><link rel="apple-touch-icon" href="/logo192.png"/><link rel="manifest" href="/manifest.json"/><title>React App</title><link href="/static/css/2.de2ac02e.chunk.css" rel="stylesheet"><link href="/static/css/main.696dae51.chunk.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div><script>!function(e){function r(r){for(var n,f,l=r[0],i=r[1],a=r[2],c=0,s=[];c<l.length;c++)f=l[c],Object.prototype.hasOwnProperty.call(o,f)&&o[f]&&s.push(o[f][0]),o[f]=0;for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n]);for(p&&p(r);s.length;)s.shift()();return u.push.apply(u,a||[]),t()}function t(){for(var e,r=0;r<u.length;r++){for(var t=u[r],n=!0,l=1;l<t.length;l++){var i=t[l];0!==o[i]&&(n=!1)}n&&(u.splice(r--,1),e=f(f.s=t[0]))}return e}var n={},o={1:0},u=[];function f(r){if(n[r])return n[r].exports;var t=n[r]={i:r,l:!1,exports:{}};return e[r].call(t.exports,t,t.exports,f),t.l=!0,t.exports}f.m=e,f.c=n,f.d=function(e,r,t){f.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:t})},f.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},f.t=function(e,r){if(1&r&&(e=f(e)),8&r)return e;if(4&r&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(f.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&r&&"string"!=typeof e)for(var n in e)f.d(t,n,function(r){return e[r]}.bind(null,n));return t},f.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return f.d(r,"a",r),r},f.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},f.p="/";var l=this["webpackJsonpk8s-demo-frontend"]=this["webpackJsonpk8s-demo-frontend"]||[],i=l.push.bind(l);l.push=r,l=l.slice();for(var a=0;a<l.length;a++)r(l[a]);var p=i;t()}([])</script><script src="/static/js/2.d0218d5d.chunk.js"></script><script src="/static/js/main.035f5630.chunk.js"></script></body></html>
```

但是，由于阿里云服务器的防火墙，使用外网 ip，直接在浏览器访问：

http://47.93.9.45:30339 暂时还访问不了，需要配置安全组开放端口：

本篇，创建了前端项目的 Deployment、Service，完成了前端项目的部署和访问；

下一篇，集成 jenkins 与 k8s，实现提交代码自动触发构建部署；
