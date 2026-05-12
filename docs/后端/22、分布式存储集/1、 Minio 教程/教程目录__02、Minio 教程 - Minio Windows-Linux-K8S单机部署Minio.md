# 02、Minio 教程 - Minio Windows/Linux/K8S单机部署Minio
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/2.html
- 分类：分布式存储
- 分组：教程目录
### 下载

[国内下载地址](http://dl.minio.org.cn/server/minio/release/)

根据系统下载安装包

### Windows

**1、** 下载安装包；

**2、** 在minio.exe目录打开cmd；

**3、** 配置参数并启动；

```java
# 设置用户名
set MINIO_ACCESS_KEY=admin
# 设置密码（8位）
set MINIO_SECRET_KEY=admin123
# 指定启动端口(未指定默认9000)及存储位置
minio.exe  server  --address 0.0.0.0:9999 D:/data
```

**1、** 登录地址IP+9999，输入用户名及密码，搭建完成；

### Linux

**1、** 下载安装包，因为我用的是华为云鲲鹏Centos7服务器，所以下载的ARM64版本；

**2、** 创建相关目录；

```java
# 创建文件存储目录
mkdir -p /data/minio
# 创建程序存放目录，并上传minio至此目录
mkdir -p /usr/local/minio
cd /usr/local/minio
# 修改可读权限
chmod +x minio 
# 设置用户名
export  MINIO_ACCESS_KEY=admin
# 设置密码
export  MINIO_SECRET_KEY=admin123
```

**1、** 启动并访问首页；

```java
# 启动，此处只是演示，实际使用需nohup或注册为服务启动
./minio server --address 0.0.0.0:9998 /data/minio
```

### Docker

```java
docker run -p 9999:9000 -e "MINIO_ACCESS_KEY=admin" -e "MINIO_SECRET_KEY=admin123" -v /data/minio:/data -d minio/minio server /data
```

### Docker compose

```java
version: '3'
services:
   minio:
    container_name: minio
    hostname: minio
    image: "minio/minio:latest"
    volumes:
      - /data/minio:/data
    ports:
      - "9999:9000"
    environment:
      MINIO_ACCESS_KEY: admin
      MINIO_SECRET_KEY: admin123
      TZ: Asia/Shanghai
    command: server /data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
```

### K8S

**要点**：使用yml文件配置资源，使用PVC存储minio文件

**1、** 在节点192.168.58.103创建NFS；

```java
# 安装nfs-utils rpcbind
yum install nfs-utils nfs-common rpcbind 
# 创建目录
mkdir -p /data/minio
chmod 666 /data/minio/
chown nfsnobaby /data/minio/
# 添加访问策略
vi /etc/exports
# 输入内容
/data/minio  *(rw,no_root_squash,no_all_squash,sync)
# 启动
systemctl start rpcbind
systemctl start nfs
# 查看
showmount -e
```

**1、** 创建PV（master执行）；

```java
# vim minio-pv.yaml 
# 添加
apiVersion: v1
kind: PersistentVolume
metadata:
    name: pv-minio
spec:
    capacity:
      storage: 2Gi
    accessModes:
      - ReadWriteMany
    persistentVolumeReclaimPolicy: Recycle
    nfs:
      path: /data/minio
      server: 192.168.58.103
# 创建
kubectl create -f minio-pv.yaml 
# 查看
kubectl get pv -o wide
```

**1、** 创建PVC（master执行）；

```java
# 
vim minio-pvc.yaml 
# 内容
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-minio
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
# 查看
kubectl get pvc -o wide 
```

**1、** 创建pod及service（master执行）；

```java
# 
vim minio.yaml 
# 添加
apiVersion: v1
kind: Service
metadata:
  name: minio-svc
  labels:
    app: minio
spec:
  type: NodePort
  ports:
  - name: minio-port
    protocol: TCP
    port: 9000
    nodePort: 32600
    targetPort: 9000
  selector:
    app: minio
---
apiVersion: v1
kind: Pod
metadata:
  name: minio
  labels:
    app: minio
spec:
  containers:
  - name: minio
    env:
    - name: MINIO_ACCESS_KEY
      value: "admin"
    - name: MINIO_SECRET_KEY
      value: "admin123"
    image: minio/minio:latest
    args:
    - server
    - /data
    ports:
    - name: minio
      containerPort: 9000
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
     claimName: pvc-minio
# 创建
kubectl apply  -f minio.yaml 
# 查看pod 
kubectl get pods -o wide
# 查看service
kubectl get svc -o wide 
```

**1、****验证**:因为service采用的是NodePort，所以需要输入minio所在node的IP+32600访问；

**文件存放**：页面上传一个文件，进入nfs所在服务器，然后发现文件已被存放在PVC中
