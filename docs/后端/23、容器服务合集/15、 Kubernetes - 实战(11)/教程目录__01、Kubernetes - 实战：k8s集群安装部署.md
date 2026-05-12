# 01、Kubernetes - 实战：k8s集群安装部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/1.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是kubernetes

在Google内部，Borg系统运行管理着成千上万的容器应用，已经非常成熟，基于Borg系统的思想，Kubernetes对计算资源进行了更高层次的抽象，实现了服务高可用、高可靠，隐藏资源管理和错误处理，扩大集群的容量。Kubernetes用来管理成千上万的docker，其性能非常强大。由于名字复杂，开头是k，结尾是s，中间是八个字母，所以简称k8s。

设计架构如下：

Kubernetes设计理念和功能其实就是一个类似Linux的分层架构

## 2、安装

现在准备四台虚拟机，server1（172.25.11.1）、server2（172.25.11.2）、server3（172.25.11.3）、server4（172.25.11.4）都已经安装docker，server1中部署harbor仓库，server2做k8s集群的管理（注意k8s的管理端的这个虚拟机必须是cpu大于等于2），server3和server4做k8s集群的node。

docker已经搭建，这里不再赘述，详见以前博客[运维实操——docker容器（一）安装与镜像](https://blog.csdn.net/qq_40764171/article/details/118943318?spm=1001.2014.3001.5501).

因为前面已经搭建harbor，这里不再赘述，详见以前博客[运维实操——docker容器（四）搭建远程容器仓库harbor、漏洞扫描和内容信任](https://editor.csdn.net/md/?articleId=118996177).

### 1、配置环境

关闭所有节点的selinux和iptables防火墙，所有节点部署docker引擎。清空所有节点之前docker做过的实验产物，包括images、volumes、service、container、network、stack、swarm，保证纯净

server2、3、4删除之前machine的产物并重启

如果全部删除后，无法重启docker。如果报错信息显示是无法找到socket文件，可以如下修改`/usr/lib/systemd/system/docker.service`文件，让他找到socket文件。

server2、3、4禁用所有节点的swap分区，

server2、3、4注释掉/etc/fstab文件中的swap定义

server2、3、4设定docker cgroup driver为systemd，重启，docker info查看已修改

server2、3、4配置yum源，

### 2、安装

server2、3、4安装kubelet kubeadm kubectl，开启kubelet，设置开机自启

为了后续方便操作，server2执行ssh-genkey生成密钥，ssh-copy-id传输给server3和server4，免密操作

为了更好的管理，在harbor中创建k8s项目，设置公开，这样匿名用户才能拉取，专门放k8s的镜像

```java
kubeadm config print init-defaults	%查看默认配置信息
kubeadm config images list --image-repository registry.aliyuncs.com/google_containers	%列出所需镜像
kubeadm config images pull --image-repository registry.aliyuncs.com/google_containers	%拉取镜像
```

网上下载会很慢，而且容易无法连接，这里我提前把所需镜像放到server1的harbor仓库里，server2、3、4可以直接用仓库的，无需上网拉取。

server1导入镜像

可以看到有7个相关镜像，批量上传镜像到reg.westos.org/k8s

修改flannel网络组件的标签，并上传到reg.westos.org/library

### 3、初始化

`kubeadm init --pod-network-cidr=10.244.0.0/16 --image-repository reg.westos.org/k8s`

初始化k8s集群

初始化后，有提示操作，此处的操作需要复制粘贴保存起来，方便后续使用。

这里我们是root用户，所以选择按照提示配置环境变量，并写入.bash_profile中

```java
echo "source <(kubectl completion bash)" >> ~/.bashrc
%配置kubectl命令补齐功能，成功后，命令行输入kubectl 然后tab可以补出命令
```

查看节点状态，可以看到有两个没开，是因为没有安装flannel网络组件

### 4、安装flannel网络组件

下载flannel网络组件:https://github.com/coreos/flannel

```java
docker pull quay.io/coreos/flannel:v0.14.0		%从网上拉取flannel网络组件镜像
docker  tag   quay.io/coreos/flannel:v0.14.0  reg.westos.org/library/flannel:v0.14.0	%更改标签
docker push  reg.westos.org/library/flannel:v0.14.0			%上传镜像到harbor仓库
```

这里我已经提前放到仓库中

下载yml脚本https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

vimkube-flannel.yml 修改image路径为仓库路径

```java
---
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: psp.flannel.unprivileged
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: docker/default
    seccomp.security.alpha.kubernetes.io/defaultProfileName: docker/default
    apparmor.security.beta.kubernetes.io/allowedProfileNames: runtime/default
    apparmor.security.beta.kubernetes.io/defaultProfileName: runtime/default
spec:
  privileged: false
  volumes:
  - configMap
  - secret
  - emptyDir
  - hostPath
  allowedHostPaths:
  - pathPrefix: "/etc/cni/net.d"
  - pathPrefix: "/etc/kube-flannel"
  - pathPrefix: "/run/flannel"
  readOnlyRootFilesystem: false
  Users and groups
  runAsUser:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  Privilege Escalation
  allowPrivilegeEscalation: false
  defaultAllowPrivilegeEscalation: false
  Capabilities
  allowedCapabilities: ['NET_ADMIN', 'NET_RAW']
  defaultAddCapabilities: []
  requiredDropCapabilities: []
  Host namespaces
  hostPID: false
  hostIPC: false
  hostNetwork: true
  hostPorts:
  - min: 0
    max: 65535
  SELinux
  seLinux:
    SELinux is unused in CaaSP
    rule: 'RunAsAny'
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: flannel
rules:
- apiGroups: ['extensions']
  resources: ['podsecuritypolicies']
  verbs: ['use']
  resourceNames: ['psp.flannel.unprivileged']
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flannel
  namespace: kube-system
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-system
  labels:
    tier: node
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
      - operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
      - name: install-cni
        image: flannel:v0.14.0		%修改image路径为仓库路径
        command:
        - cp
        args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
containers:
      - name: kube-flannel
        image: flannel:v0.14.0		%修改image路径为仓库路径
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --kube-subnet-mgr
        resources:
          requests:
            cpu: "100m"
            memory: "50Mi"
          limits:
            cpu: "100m"
            memory: "50Mi"
        securityContext:
          privileged: false
          capabilities:
            add: ["NET_ADMIN", "NET_RAW"]
 env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: run
          mountPath: /run/flannel
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      volumes:
      - name: run
        hostPath:
          path: /run/flannel
      - name: cni
        hostPath:
          path: /etc/cni/net.d
      - name: flannel-cfg
        configMap:
          name: kube-flannel-cfg
```

启动组件，查看全部开启了

### 5、其他节点加入集群

server3加入到server2部署好的k8s集群中，使用的命令就是初始化后提示的信息

server4加入到server2部署好的k8s集群中，使用的命令就是初始化后提示的信息

在server2处，查看server3、server4确实已经加入集群。
