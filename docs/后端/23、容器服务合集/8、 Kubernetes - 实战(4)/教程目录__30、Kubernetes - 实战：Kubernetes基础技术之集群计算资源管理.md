# 30、Kubernetes - 实战：Kubernetes基础技术之集群计算资源管理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/30.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在Kubernetes环境中，CPU和内存是最主要的计算资源，Kubernetes建立了完善的机制来定义、分配、调度和控制这两类资源的使用。Kubernetes实际上只是一个资源的调度者，真正的资源管控还是要翻译成容器运行时的参数，最终由操作系统Kernel的CPU和内存资源管理器执行：

## 二、Kubernetes的资源定义和管控

**2.1 资源的计量单位**

在Kubernetes中1个CPU相当于1个vCPU核心的算力，记为1000m(m为milicores，代表1vCPU的千分之一核心算力)，request里面的2、1、0.5、、0.1、100m分别代表可以占用当前系统2个、1个、0.5个、0.1个、0.1个vCPU等量的CPU资源。

内存可以使用KB、MB、GB等单位计量。并且由于Kubernetes节点默认会关闭SWAP的功能，所以这里定义的内存基本上是RSS+page cache的总和，RSS是堆、栈以及从内存直接分配的空间，page cache是内存中用于缓存磁盘块的部分。

**2.2 资源的定义和调度**

Kubernetes对于资源的定义包含requests和limits两个方面：

```java
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

如果POD有多个容器，则整个POD的requests和limits值是各个容器的requests和limits的累加。

requests和limits这两个标记本身的作用以及分别对于CPU和内存的含义都是不一样的；对于CPU而言：

- requests的作用有两个，一是保证POD中容器可使用的最小CPU资源需求，二是用于Kubernetes的scheduler进行节点的选择和POD的调度；requests属于“准预留”的资源，这部分资源是系统直接从总资源里面扣除并记账给该POD的，但是如果该POD中容器没有使用到requests的CPU量，多余的CPU资源是可以给其它POD使用的，但是如果POD中容器真的需要这么多CPU资源的时候，系统会从其它低优先级的POD中回收CPU资源来保证POD的requests用量
- limits的作用也有两个，一是给予POD中容器高于requests的一定幅度的可用CPU资源，客观上实现了系统CPU资源的超卖，二是在节点CPU资源紧缺的时候进行管控，包括CPU throtting

而对于内存而言：

- requests的作用有两个，一是保证POD中容器可使用的最小资源需求，二是为Kubernetes进行POD调度提供依据并实施资源的“准预留”，三是在系统内存压力的时候，oom score打分和管控操作提供参考
- limits的作用也有两个，一是给予POD中容器高于requests的一定幅度的可用内存资源，客观上实现了系统内存资源的超卖，二是在POD内存使用超出或者节点内存压力的时候，启动OOM killer进行管控

**2.3 资源等级和管控**

在Kubernetes里面，将资源分成不同的QoS类别，并且通过POD里面的资源定义来区分POD对于平台提供的资源保障的SLA等级：

- Guaranteed，POD中每个容器都为CPU和内存设置了相同的requests和limits，这类POD具有最高优先级
- Burstable，至少有一个容器设置了CPU或内存的requests属性，但不满足Guaranteed类别要求的POD，它们具有中等优先级
- BestEffort，未为任何一个容器设置requests和limits属性的POD，它们的优先级为最低级别

在部署了Kubernetes的系统里面，CPU QoS对应的cgroup路径如下：

```java
ls /sys/fs/cgroup/cpu/kubepods.slice
......
drwxr-xr-x 56 root root 0 8月   6 18:05 kubepods-besteffort.slice
drwxr-xr-x 52 root root 0 8月  17 10:16 kubepods-burstable.slice
drwxr-xr-x  4 root root 0 4月   8 18:11 kubepods-pod54222000_7981_11ea_bd09_fa163ebda1b8.slice
drwxr-xr-x  4 root root 0 12月 30 2019 kubepods-pod822f54ed_2178_11ea_9434_fa163ebda1b8.slice
drwxr-xr-x  4 root root 0 12月 30 2019 kubepods-pod84b045b2_2178_11ea_9434_fa163ebda1b8.slice
drwxr-xr-x  4 root root 0 12月 30 2019 kubepods-pod85398a8a_2178_11ea_9434_fa163ebda1b8.slice
drwxr-xr-x  4 root root 0 12月 30 2019 kubepods-podd84e1b25_2242_11ea_9434_fa163ebda1b8.slice
drwxr-xr-x  4 root root 0 1月  15 2020 kubepods-podf8de6f99_3770_11ea_9434_fa163ebda1b8.slice
......
```

而kubepods-besteffort.slice和kubepods-burstable.slice两个目录下又有很多Kubernetes调度到本节点的Burstable和BestEffort的POD，而在例如目录kubepods-pod54222000_7981_11ea_bd09_fa163ebda1b8.slice下面存放的是Guaranteed的POD，它里面的CPU资源定义如下：

```java
[root@k8s-node-01 kubepods-pod54222000_7981_11ea_bd09_fa163ebda1b8.slice]# cat cpu.cfs_period_us
100000
[root@k8s-node-01 kubepods-pod54222000_7981_11ea_bd09_fa163ebda1b8.slice]# cat cpu.cfs_quota_us
100000
```

针对不同的优先级的业务，在资源紧张或者超出的时候会有不同的处理策略；同时，针对CPU和内存两类不同类型的资源，一种是可压缩的，一种是不可压缩的，所以资源的分配和调控策略也会有很大区别。CPU资源紧缺时，如果节点处于超卖状态，则会根据各自的requests配置，按比例分配CPU时间片，而内存资源紧缺时需要内核的oom killer进行管控，Kubernetes负责为OOM killer提供管控依据：

- BestEfford类容器由于没有要求系统供任何级别的资源保证，将最先被终止；但是在资源不紧张时，它们能尽可能多地占用资源，实现资源的复用和部署密度的提高
- 如果BestEfford类容器都已经终止，Burstable中等优先级的的POD将被终止
- Guaranteed类容器拥有最高优先级，只有在内存资源使用超出limits的时候或者节点OOM时得分最高，才会被终止；OOM得分主要根据QoS类和容器的requests内存占机器总内存比来计算：

OOM得分越高，该进程的优先级越低，越容易被终止；根据公式，Burstable优先级的POD中，requests内存申请越多，越容易在OOM的时候被终止。

## 三、Docker的资源定义和管控

**3.1 Docker对于CPU和内存的资源定义**

如文章[《二十九：Kubernetes基础技术之容器关键技术实践》](/zhuanlan/container/kubernetes/4/29.html)所说的，Docker通过Linux Kernel的cgroups进行资源的管控，与之相应的是Docker支持的资源定义方式，比如CPU资源的常用定义方式如下：

- 设定CPU shares (--cpu-shares)，通过share的比例来限制，比如一个容器定义share为512，另一个容器定义share为1024，则它们占用的CPU分别为33%和66%；docker run --rm -it --cpu-shares=512 nginx bash
- 设定CPU核心数 (--cpus)，--cpus 参数可以限定容器能使用的 CPU 核数，docker run --rm -it --cpus=2 nginx
- 绑定CPU核心 (--cpuset-cpus)，docker run --rm -it --cpuset-cpus=0,1 nginx bash
- 设定period和quota(--cpu-period和--cpu-quota)，表示在cpu-period的周期内可以使用的cpu-quota数，真正能使用的 CPU 核数就是 cpu-quota / cpu-period；Docker默认period是100000，单位是微秒，也就是100毫秒，如果将cpu-quota设置为50000，表明在每100毫秒的时间段内，可以使用50毫秒的CPU时间，或者等量与0.5个核心的CPU资源；如果在一个时间间隔内以及占用了50毫秒，在这100毫秒时间间隔段内，这个容器进程就无法继续运行，一直到下一个时间周期

这里的--cpu-shares存储在cgroup的cpu.shares文件，--cpu-period和--cpu-quota存储在cpu.cfs_period_us和cpu.cfs_quota_us文件。另外，在Docker中支持的常用的内存设置方式是-m或者--memory：docker run --rm -it --memory=512m --cpus=2 nginx，这个信息会被存储到cgroup文件memory.limit_in_bytes中

**3.2 Kubernetes的资源定义映射到Docker资源定义**

对于如下的资源定义：

```java
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

Kubernetes的POD资源定义文件中：

- spec.containers[].resources.requests.cpu会被转成docker run的--cpu-shares参数
- spec.containers[].resources.limits.cpu会被转化成--cpu-quota参数(--cpu-period一般默认100毫秒，而--cpu-quota的最小值是1毫秒)，转化方法是CPU limits先转化成milicores然后在乘以100，比如如果是CPU是2，则先变成2000m在乘以100即200000，这里就是500x100=50000
- spec.containers[].resources.limits.memory会被转成docker run的--memory参数

spec.containers[].resources.requests.memory在docker run里面没有对应的参数，它的作用还是在于在OOM的时候，为OOM score的计算提供参考，同QoS等级的容器，requests越大越容易被OOM kill。一般而言，系统对于CPU或者内存资源超过requests或者limits时候可以采取的措施无非是terminate、evict或者throtting，比较权威的解释可以参考[Kubernetets如下一段描述](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#how-pods-with-resource-limits-are-run)：

> If a Container exceeds its memory limit, it might be terminated. If it is restartable, the kubelet will restart it, as with any other type of runtime failure.
>
> If a Container exceeds its memory request, it is likely that its Pod will be evicted whenever the node runs out of memory.
>
> AContainer might or might not be allowed to exceed its CPU limit for extended periods of time. However, it will not be killed for excessive CPU usage.

**3.3 Kubernetes的资源定义和cgroup**

部署下述一个POD资源：

```java
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  labels:
    app: busybox
spec:
  containers:
  - image: busybox
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
    name: busybox
  restartPolicy: Always
```

根据这个方式启动了一个Burstable的容器，它应该等同于运行如下命令：

```java
docker run --rm -dt --cpu-shares=250 --cpu-quota=50000 --memory=128m busybox sleep 3600
```

通过docker inspect查看到的相关信息如下：

> [root@k8s-node-04 ~]# docker inspect d6bf12e8da95 -f { {.HostConfig.CpuShares}}
>
> 256
>
> [root@k8s-node-04 ~]# docker inspect d6bf12e8da95 -f { {.HostConfig.CpuQuota}}
>
> 50000
>
> [root@k8s-node-04 ~]# docker inspect d6bf12e8da95 -f { {.HostConfig.CpuPeriod}}
>
> 100000
>
> [root@k8s-node-04 ~]# docker inspect d6bf12e8da95 -f { {.HostConfig.Memory}}
>
> 134217728

可以看到容器对应的cgroup如下：

```java
docker inspect d6bf12e8da95 -f {
    {.HostConfig.CgroupParent}} 
kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice
```

所以去如下路径查看cgroup里面对应的信息：

```java
#CPU request and limit in cgroup
[root@k8s-node-04 ~]# cd /sys/fs/cgroup/cpu/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice
[root@k8s-node-04 kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice]# cat cpu.shares
256
[root@k8s-node-04 kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice]# cat cpu.cfs_quota_us
50000
[root@k8s-node-04 kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice]# cat cpu.cfs_period_us
100000
#memory limit in cgroup
[root@k8s-node-04 kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice]# cd /sys/fs/cgroup/memory/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice
[root@k8s-node-04 kubepods-burstable-pod12ea792a_e1c3_11ea_a4ca_fa163ebda1b8.slice]# cat memory.limit_in_bytes 
134217728
```

## 四、Kubernetes节点的资源管控

Kubernetes除了对POD进行计算资源管控，也支持借助于cgroups机制对于节点和节点上的Kubernetes服务进程和其它系统进程进行资源管控。在节点启动kubelet的时候，可以为系统进程、kubelet进程预留资源，所以最后节点可以给Kubernetes分配业务POD的资源量可以计算如下：

> Node Allocatable Resource = Node Capacity - kube-reserved - system-reserved - eviction-threshold

```java
      Node Capacity
---------------------------
|     kube-reserved       |
|-------------------------|
|     system-reserved     |
|-------------------------|
|    eviction-threshold   |
|-------------------------|
|                         |
|      allocatable        |
|   (available for pods)  |
|                         |
|                         |
---------------------------
```

这里面的预留资源和阈值都是可以在kubelet启动的时候可以设置的，包括：

- --cgroup-driver，默认为cgroupfs，另一可选项为systemd，kubelet需要与容器runtime的cgroup-driver保持一致
- --kube-reserved，用于配置为kube组件如kubelet、kube-proxy等预留资源
- --system-reserved，用于配置为system进程预留资源
- --kube-reserved-cgroup和--system-reserved-cgroup是定义进行预留资源管控的cgroups
- --eviction-hard，用来配置kubelet eviction的阈值，现在只支持memory和ephemeral-storage两种不可压缩资源，对应MemoryPressure和DiskPressure两种状态

在阿里云托管的Kubernetes节点上，可以看到如下一些启动信息：

> root 5763 1 4 2019 ? 13-07:33:51 /usr/bin/kubelet --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf --pod-manifest-path=/etc/kubernetes/manifests --allow-privileged=true --network-plugin=cni --cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin --cluster-dns=172.72.14.1 --pod-infra-container-image=registry-vpc.cn-shanghai.aliyuncs.com/acs/pause-amd64:3.0 --enable-controller-attach-detach=false --enable-load-reader --cluster-domain=cluster.local --cloud-provider=external --hostname-override=cn-shanghai.172.72.14.25 --provider-id=cn-shanghai.i-xxxxxxxxxxx --authorization-mode=Webhook --client-ca-file=/etc/kubernetes/pki/ca.crt --system-reserved=memory=300Mi--kube-reserved=memory=400Mi--eviction-hard=imagefs.available<15%,memory.available<300Mi,nodefs.available<10%,nodefs.inodesFree<5%--cgroup-driver=systemd --anonymous-auth=false --rotate-certificates=true --cert-dir=/var/lib/kubelet/pki
