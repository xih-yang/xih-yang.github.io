# 07、Kubernetes - 实战：搭建企业级私有仓库Harbor
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/7.html
- 分类：容器服务
- 分组：教程目录
## 搭建企业级私有仓库Harbor

**安装需求**

python版本 >= 2.7

Docker引擎版本 >= 1.10

docker-compose版本 >= 1.6.0

**安装环境**

## 一、Python安装

```java
yum -y install python3
```

## 二、Docker上章节中已经安装，不再赘述

## 三、docker-compose安装

```java
curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-uname -s-uname -m -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## 四、Harbor安装

```java
## 因为docker 默认不允许http 方式推送镜像，所以要修改docker配置文件,添加以下行，每个k8s节点都要做
vim /etc/docker/daemon.json
...
{
"insecure-registries": ["https://hub.vfancloud.com"]
}
...
## 每个节点的hosts文件也必须添加此解析，包括你将要访问的windows主机
vim /etc/hosts
...
192.168.152.252 hub.vfancloud.com
...
## 下载harbor，curl和wget都太慢，直接迅雷下的，然后上传到服务器
curl -L https://github.com/goharbor/harbor/releases/download/v1.10.2/harbor-offline-installer-v1.10.2.tgz -o /usr/local/harbor-offline-installer-v1.10.2.tgz
## 解压，编辑配置文件
tar xvf harbor-offline-installer-v1.10.2.tgz
cd harbor/
vim harbor.yml
...
hostname: hub.vfancloud.com 域名
http: 协议及端口，若开启了https，则将http自动转发至https
  port: 80
https:
  port: 443
  The path of cert and key files for nginx
  certificate: /data/cert/server.crt 证书位置
  private_key: /data/cert/server.key 私钥位置
database:数据库密码，可以修改
  password: root123
harbor_admin_password: Harbor12345 harbor的admin密码
...
—————————————— 生成局域网证书 ————————————————— 
[root@kubenode2 ~]# mkdir -p /data/cert
[root@kubenode2 ~]# cd /data/cert/
# 生成私钥
[root@kubenode2 cert]# openssl genrsa -des3 -out server.key 2048
Generating RSA private key, 2048 bit long modulus (2 primes)
.....................................+++++
...........................+++++
e is 65537 (0x010001)
Enter pass phrase for server.key: 填写密码
Verifying - Enter pass phrase for server.key: 确认密码
# 创建csr证书请求
[root@kubenode2 cert]# openssl req -new -key server.key -out server.csr
Enter pass phrase for server.key:
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:CN
State or Province Name (full name) []:BJ
Locality Name (eg, city) [Default City]:BJ
Organization Name (eg, company) [Default Company Ltd]:vfancloud
Organizational Unit Name (eg, section) []:vfancloud
Common Name (eg, your name or your server's hostname) []:hub.vfancloud.com
Email Address []:vfan8991@163.com
Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
# 去除私钥的连接密码，harbor是以Nginx当前端，若不去掉密码，则会请求https失败
[root@kubenode2 cert]# cp server.key server.key.org
[root@kubenode2 cert]# openssl rsa -in server.key.org -out server.key
Enter pass phrase for server.key.org:  输入私钥密码
writing RSA key  去除成功
# 证书签名
[root@kubenode2 cert]# openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
Signature ok
subject=C = CN, ST = BJ, L = BJ, O = vfancloud, OU = vfancloud, CN = hub.vfancloud.com, emailAddress = vfan8991@163.com
Getting Private key 签名成功
# 赋予执行权限
[root@kubenode2 cert]# chmod +x ./*
————————————————— 证书生成完毕 —————————————————
[root@kubenode2 harbor]# ./install.sh
✔ ----Harbor has been installed and started successfully.----
[root@kubenode2 harbor]# docker ps 
CONTAINER ID        IMAGE                                 COMMAND                  CREATED             STATUS                             PORTS                                         NAMES
1dcd38feb29d        goharbor/nginx-photon:v1.10.2         "nginx -g 'daemon of…"   34 seconds ago      Up 32 seconds (healthy)            0.0.0.0:80->8080/tcp, 0.0.0.0:443->8443/tcp   nginx
063509e49573        goharbor/harbor-jobservice:v1.10.2    "/harbor/harbor_jobs…"   34 seconds ago      Up 32 seconds (healthy)                                                          harbor-jobservice
1c37e61f9479        goharbor/harbor-core:v1.10.2          "/harbor/harbor_core"    35 seconds ago      Up 28 seconds (health: starting)                                                 harbor-core
cf7e7bd46982        goharbor/registry-photon:v1.10.2      "/home/harbor/entryp…"   39 seconds ago      Up 35 seconds (healthy)            5000/tcp                                      registry
977f5ca9214a        goharbor/redis-photon:v1.10.2         "redis-server /etc/r…"   39 seconds ago      Up 35 seconds (healthy)            6379/tcp                                      redis
86fdcb7b988b        goharbor/harbor-registryctl:v1.10.2   "/home/harbor/start.…"   39 seconds ago      Up 35 seconds (healthy)                                                          registryctl
8fc55f981c54        goharbor/harbor-db:v1.10.2            "/docker-entrypoint.…"   39 seconds ago      Up 35 seconds (healthy)            5432/tcp                                      harbor-db
10057d8629a0        goharbor/harbor-portal:v1.10.2        "nginx -g 'daemon of…"   39 seconds ago      Up 35 seconds (healthy)            8080/tcp                                      harbor-portal
8485731461d8        goharbor/harbor-log:v1.10.2           "/bin/sh -c /usr/loc…"   40 seconds ago      Up 38 seconds (healthy)            127.0.0.1:1514->10514/tcp                     harbor-log
```

**测试访问Harbor**

**1、** 浏览器输入：[https://hub.vfancloud.com/](https://hub.vfancloud.com/)；

**2、** 登录，账号为admin，密码为harbor.yml中的harbor_admin_password的值；

**3、** 可以自己创建一些用户，或者上传一些镜像等；

**新建Pod测试**

```java
## 首先docker login登录仓库
```

[root@Centos8 rbac]# docker login hub.vfancloud.com

Username: admin

Password:

```java
## 启动一个deployment
[root@Centos8 ~]# kubectl run nginx-deployment --image=hub.vfancloud.com/test/myapp:v1 --port=443 --replicas=1
kubectl run --generator=deployment/apps.v1 is DEPRECATED and will be removed in a future version. Use kubectl run --generator=run-pod/v1 or kubectl create instead.
deployment.apps/nginx-deployment created
## 查看deployment
[root@Centos8 ~]# kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   1/1     1            1           8s
## 新建一个deployment会自动创建一个rs
[root@Centos8 ~]# kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-5bc446d899   1         1         1       74s
## 再来查看pod
[root@Centos8 ~]# kubectl get pod -o wide 
NAME                                READY   STATUS    RESTARTS   AGE   IP           NODE          NOMINATED NODE   READINESS GATES
nginx-deployment-5bc446d899-ndd57   1/1     Running   0          81s   10.244.3.6   testcentos7   <none>           <none>
## 测试访问
[root@Centos8 ~]# curl 10.244.3.6
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@Centos8 ~]# curl 10.244.3.6/hostname.html
nginx-deployment-5bc446d899-ndd57
## 添加副本数
[root@Centos8 ~]# kubectl scale --replicas=3 deployment/nginx-deployment
deployment.extensions/nginx-deployment scaled
[root@Centos8 ~]# kubectl get pod -o wide
NAME                                READY   STATUS              RESTARTS   AGE     IP           NODE          NOMINATED NODE   READINESS GATES
nginx-deployment-5bc446d899-jsgvf   1/1     Running             0          37s     10.244.3.7   testcentos7   <none>           <none>
nginx-deployment-5bc446d899-lbsfp   0/1     ContainerCreating   0          7m32s   <none>       kubenode2     <none>           <none>
nginx-deployment-5bc446d899-v2lrx   0/1     ContainerCreating   0          37s     <none>       kubenode2     <none>           <none>
## 创建svc，实现自动的负载均衡
[root@Centos8 ~]# kubectl expose deployment nginx-deployment --port=20000 --target-port=80
service/nginx-deployment exposed
[root@Centos8 ~]# kubectl get svc 
NAME               TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)     AGE
kubernetes         ClusterIP   10.96.0.1      <none>        443/TCP     4d17h
nginx-deployment   ClusterIP   10.96.14.172   <none>        20000/TCP   7s
[root@Centos8 ~]# curl 10.96.14.172:20000/hostname.html
nginx-deployment-78d674b868-mqkqf
[root@Centos8 ~]# curl 10.96.14.172:20000/hostname.html
nginx-deployment-78d674b868-8jdhl
[root@Centos8 ~]# curl 10.96.14.172:20000/hostname.html
nginx-deployment-78d674b868-jcd42
## 可以使用ipvsadm -Ln来查看当前负载的ip地址
[root@Centos8 ~]# ipvsadm -Ln
TCP  10.96.14.172:20000 rr
  -> 10.244.3.12:80               Masq    1      0          4         
  -> 10.244.3.13:80               Masq    1      0          4         
  -> 10.244.3.14:80               Masq    1      0          4 
```

**测试外网访问**

```java
##修改svc TYPE，实现可以外网访问
[root@Centos8 ~]# kubectl edit svc nginx-deployment 
service/nginx-deployment edited
[root@Centos8 ~]# grep type /tmp/kubectl-edit-1h3zf.yaml
type: NodePort  修改此行
## 查看TYPE 已经修改为nodeport
[root@Centos8 ~]# kubectl get svc
NAME               TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)           AGE
kubernetes         ClusterIP   10.96.0.1     <none>        443/TCP           3d17h
nginx-deployment   NodePort    10.97.134.6   <none>        30000:31568/TCP   16m
## 修改完毕后，进入外网进行测试访问，还是访问不到，后来得知为iptables规则问题
## 将 FORWARD 链放行即可
[root@Centos8 ~]# iptables -P FORWARD ACCEPT
## 测试访问
[root@Centos8 ~]# curl 192.168.152.53:31540
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```
