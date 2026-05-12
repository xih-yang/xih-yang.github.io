# 07、Kubernetes - 实战：Ingress服务加密、认证、地址重写
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/7.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是ingress？

以前一个service一个虚拟ip，但是随着服务数量的增加，ip是不够用的，所以就产生了ingress服务，它可以代理不同后端 Service ，这样很多的service在一个ingress下，只需要一个ip即可。ingres在客户和服务之间增加一层，进而实现负载均衡服务。如图所示

Ingress由两部分组成：Ingress controller和Ingress服务。Ingress Controller 会根据你定义的 Ingress 对象，提供对应的代理能力。业界常用的各种反向代理项目，比如 Nginx、HAProxy等，都已经为Kubernetes 专门维护了对应的 Ingress Controller。

## 2、ingress安装

首先在仓库新建项目ingress-nginx

下载官方镜像并上传到仓库方便使用

官网下载ingress-nginx部署所需资源清单deploy.yaml文件，修改镜像地址为本地harbor仓库

应用该文件，创建一个新的ns叫ingress-nginx

查看ingress-nginx的所有信息，可以看到产生了两个ingress-nginx-admission和一个ingress-nginx-controller

查看服务暴露端口是31399

访问测试成功

## 3、一个ingress控制多个service

添加svc服务，编辑svc.yaml文件，应用该文件，创建两个服务，myapp-svc和nginx-svc

编辑deployment.yaml文件，应用该文件，创建两个标签是myapp的pod和两个标签是nginx的pod。分别作为myapp-svc和nginx-svc的后端。

修改ingress-nginx-controller这个服务的类型为LoadBalancer

查看ingress-nginx-controller这个svc变为LoadBalancer

编写ingress.yaml文件

```java
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-myapp
spec:
  rules:
  - host: www1.westos.org		%www1.westos.org对应myapp-svc这个服务，该服务对应镜像myapp:v1版本
    http:
      paths:
      - path: /
        backend:
          serviceName: myapp-svc
          servicePort: 80
---
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-nginx
spec:
  rules:
  - host: www2.westos.org		%www2.westos.org对应nginx-svc这个服务，该服务对应镜像myapp:v2版本
    http:
      paths:
      - path: /
        backend:
          serviceName: nginx-svc
          servicePort: 80
```

应用ingress.yaml文件，查看生成了两个ingress

ingress-nginx-controller的外部ip是172.25.11.10

真机中中添加地址解析，www1.westos.org和www2.westos.org都对应暴露的外部ip172.25.11.10

真机测试访问www1.westos.org时看到的是v1版本，www2.westos.org时看到的是v2版本

所以整体思路就是，客户可以通过不同的域名（www1.westos.org和www2.westos.org）访问到ingress，ingress再根据标签的不同（myapp和nginx）负载均衡，对应到不同的服务（myapp-svc和nginx-svc），不同的服务再连接到不同的pod，看到的东西就不同。这样只有一个ingress的ip，不会浪费ip的资源。

## 4、ingress TLS 配置

之前的设置不够安全，我想用安全的访问443端口。

创建证书和密钥

创建secret，并查看

编辑ingress文件，

```java
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-myapp
spec:
  tls:
  - hosts:
    - www1.westos.org
    secretName: tls-secret		%使用secret中的tls-secret进行安全访问
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myapp-svc
          servicePort: 80
```

创建ingress，查看ingress信息已配置好TLS

测试，www1.westos.org被重定向为https://www1.westos.org

加入-k参数，成功访问加密网址

## 5、ingress认证

首先安装httpd-tools认证生成插件

创建认证用户和密钥，导入到k8s中的secret

修改ingress.yaml文件

```java
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-myapp
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth			%添加认证模块
    nginx.ingress.kubernetes.io/auth-realm: 'Authentication Required - lyb'
spec:
  tls:
  - hosts:
    - www1.westos.org
    secretName: tls-secret
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myapp-svc
          servicePort: 80
```

创建ingress，添加认证。查看详细信息，认证模块已添加

登陆网页测试，访问www1.westos.org，会自动跳转到https://www1.westos.org，输入认证信息才能进入

## 6、ingress地址重写

我们想把默认的发布页地址重写为一个特定的网页，如何实现呢？

编辑ingress.yaml文件

```java
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-myapp
  annotations:
    nginx.ingress.kubernetes.io/app-root: /hostname.html	%根目录重新定向到hostname.html
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: 'Authentication Required - lyb'
spec:
  tls:
  - hosts:
    - www1.westos.org
    secretName: tls-secret
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myapp-svc
          servicePort: 80
```

进入myapp镜像中的容器

可以查看，/hostname.html就是/etc/hostname的别名，二者就是一个东西，ingress.yaml文件中写/hostname.html，就等于写/etc/hostname，用来查看主机名

创建ingress

测试，访问www1.westos.org自动地址重写为www1.westos.org/hostname.html，改变了默认发布目录

现在既有TLS也有地址重写，那么谁先触发呢？

答案是先地址重写，再TLS安全访问

比如公司更新了地址，从www1.westos.org/westos/变为www1.westos.org，如果全部跟着更改，太累了，有什么好的办法吗？

修改ingress.yaml文件

```java
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-myapp
  annotations:
   nginx.ingress.kubernetes.io/app-root: /hostname.html
    nginx.ingress.kubernetes.io/rewrite-target: /$2		%抓取第二列输入内容
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: 'Authentication Required - lyb'
spec:
  tls:
  - hosts:
    - www1.westos.org
    secretName: tls-secret
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /westos(/|$)(.*)		%自动抓取westos后的内容，即忽略westos
        backend:
          serviceName: myapp-svc
          servicePort: 80
```

应用ingress后，测试，访问`www1.westos.org/westos/`自动跳转到`www1.westos.org`；访问`www1.westos.org/westos/hostname.html`自动跳转到`www1.westos.org/hostname.html`，忽略westos
