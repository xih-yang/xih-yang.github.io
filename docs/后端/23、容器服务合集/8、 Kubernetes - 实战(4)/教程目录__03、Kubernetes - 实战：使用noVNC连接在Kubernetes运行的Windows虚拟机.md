# 03、Kubernetes - 实战：使用noVNC连接在Kubernetes运行的Windows虚拟机
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/3.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在文章[《二：在Kubernetes使用kubevirt运行管理Ubuntu/Windows桌面操作系统》](/zhuanlan/container/kubernetes/4/2.html)中，需要借助于virtctl才能连接到Windows的桌面，这样windows环境的使用者还需要额外具备kubernetes的权限，不是很合理。

这里介绍一种使用noVNC方案，通过web端口借助Kubernetes的Service来暴露服务，让windows使用者可以直接在浏览器访问windows桌面的方案。noVNC访问机器上vncserver提供的vnc服务，进行tcp到websocket的转化。noVNC 被普遍用在各大云计算、虚拟机控制面板中，比如 OpenStack的consol Dashboard。

## 二、在Windows安装noVNC

### 2.1 安装vncserver：ultravnc

reference：[http://www.uvnc.com/downloads/ultravnc.html](http://www.uvnc.com/downloads/ultravnc.html)

### 2.2 安装运行环境

> nodejs：https://nodejs.org/en/download/
>
> Websockify：https://nodejs.org/en/download/

安装nodejs modules

```java
npm install ws
npm install optimist
npm install mime-types
node_modules will be created at C:\Users\noVNC\
```

### 2.3 安装noVNC

下载：[http://github.com/kanaka/noVNC/zipball/master](http://github.com/kanaka/noVNC/zipball/master)

Install noVNC and websockify

```java
Unzip noVNC.zip to node_modules
Unzip websockify-master.zip to novnc
```

### 2.4 启动noVNC服务

```java
cd C:\Users\noVNC\node_modules\novnc\websockify-master\other\js
node websockify.js --web C:\Users\noVNC\node_modules\novnc 9000 0.0.0.0:5900
```

websocket在9000端口监听请求

### 2.5 连接noVNC

直接在web网页访问：http://192.168.56.102:9000/

## 三、使用noVNC暴露k8s上面的windows桌面

参考：[https://kubevirt.io/user-guide/docs/latest/creating-virtual-machines/interfaces-and-networks.html](https://kubevirt.io/user-guide/docs/latest/creating-virtual-machines/interfaces-and-networks.html)

### 3.1 部署虚拟机：vm-windows-noVNC.yaml

```java
metadata:
  name: windows
  namespace: vm
apiVersion: kubevirt.io/v1alpha2
kind: VirtualMachineInstance
spec:
  domain:
    resources:
      requests:
        memory: 8Gi
        cpu: 4
    devices:
      disks:
      - name: windowsdisk
        volumeName: windows
      interfaces:
      - name: default
        model: e1000 expose e1000 NIC to the guest
        bridge: {} connect through a bridge
        ports:
         - name: novnc
           port: 9000
  volumes:
    - name: windows
      persistentVolumeClaim:
        claimName: windows
  networks:
  - name: default
    pod: {}
```

### 3.2 定义服务

windows-novnc-service.yaml

```java
apiVersion: v1
kind: Service
metadata:
  name: windows
  namespace: vm
spec:
  type: NodePort
  ports:
    - port: 9000
      protocol: TCP
      nodePort: 19000
  selector:
    kubevirt.io: virt-launcher
  sessionAffinity: None
```

### 3.3 访问

可以通过nodeIP+nodePort进行访问

### 3.5 设置windows不休眠

**电源**

显示器

磁盘

显示
