# 31、Kubernetes - 实战：Kubernetes基础技术之CPU资源的调度和管理(CFS)
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/31.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在使用Kubernetes的过程中，我们看到过这样一个告警信息：

> [K8S]告警主题: CPUThrottlingHigh
>
> 告警级别: warning
>
> 告警类型: CPUThrottlingHigh
>
> 故障实例:
>
> 告警详情: 27% throttling of CPU in namespace kube-system for container kube-proxy in pod kube-proxy-9pj9j.
>
> 触发时间: 2020-05-08 17:34:17

这个告警信息说明kube-proxy容器被throttling了，然而查看该容器的资源使用历史信息，发现该容器以及容器所在的节点的CPU资源使用率都不高：

告警期间容器所在节点CPU使用率

告警期间kube-proxy的资源使用率

经过我们的分析，发现该告警实际上是和Kubernetes对于CPU资源的限制和管控机制有关。Kubernetes依赖于容器的runtime进行CPU资源的调度，而容器runtime以Docker为例，是借助于cgroup和CFS调度机制进行资源管控。本文基于这个告警案例，首先分析了CFS的基本原理，然后对于Kubernetes借助CFS进行CPU资源的调度和管控方法进行了介绍，最后使用一个例子来分析CFS的一些调度特性来解释这个告警的root cause和解决方案。

## 二、CFS基本原理

**2.1 基本原理**

Linux在2.6.23之后开始引入CFS逐步替代O1调度器作为新的进程调度器，正如它名字所描述的，[CFS(Completely Fair Scheduler)调度器](https://www.kernel.org/doc/Documentation/scheduler/sched-design-CFS.txt)追求的是对所有进程的全面公平，实际上它的做法就是在一个特定的调度周期内，保证所有待调度的进程都能被执行一遍，主要和当前已经占用的CPU时间经权重除权之后的值(vruntime，见下面公式)来决定本轮调度周期内所能占用的CPU时间，vruntime越少，本轮能占用的CPU时间越多；总体而言，CFS就是通过保证各个进程vruntime的大小尽量一致来达到公平调度的效果：

> 进程的运行时间计算公式为:
>
> 进程运行时间 = 调度周期 * 进程权重 / 所有进程权重之和

> vruntime = 进程运行时间 * NICE_0_LOAD / 进程权重 = (调度周期 * 进程权重 / 所有进程总权重) * NICE_0_LOAD / 进程权重 = 调度周期 * NICE_0_LOAD / 所有进程总权重

通过上面两个公式，可以看到vruntime不是进程实际占用CPU的时间，而是剔除权重影响之后的CPU时间，这样所有进程在被调度决策的时候的依据是一致的，而实际占用CPU时间是经进程优先级权重放大的。这种方式使得系统的调度粒度更小来，更加适合高负载和多交互的场景。

**2.2 Kernel配置**

在kernel文件系统中，可以通过调整如下几个参数来改变CFS的一些行为：

- /proc/sys/kernel/sched_min_granularity_ns，表示进程最少运行时间，防止频繁的切换，对于交互系统
- /proc/sys/kernel/sched_nr_migrate，在多CPU情况下进行负载均衡时，一次最多移动多少个进程到另一个CPU上
- /proc/sys/kernel/sched_wakeup_granularity_ns，表示进程被唤醒后至少应该运行的时间，这个数值越小，那么发生抢占的概率也就越高
- /proc/sys/kernel/sched_latency_ns，表示一个运行队列所有进程运行一次的时间长度(正常情况下的队列调度周期，P)
- sched_nr_latency，这个参数是内核内部参数，无法直接设置，是通过sched_latency_ns/sched_min_granularity_ns这个公式计算出来的；在实际运行中，如果队列排队进程数 nr_running >`sched\_nr\_latency，则调度周期就不是sched\_latency\_ns，而是P = sched\_min\_granularity\_ns \* nr\_running，如果 nr\_running` cat /sys/fs/cgroup/cpu/kubepods/pod5326d6f4-789d-11ea-b093-fa163e23cb69/69336c973f9f414c3f9fdfbd90200b7083b35f4d54ce302a4f5fc330f2889846/cpu.stat
>
> nr_periods 14001693
>
> nr_throttled 2160435
>
> throttled_time 570069950532853

**3.2 本文开头问题的原因分析**

根据3.1描述的原理，很容易理解本文开通的告警信息的出现，是由于在某些特定的CFS重分配周期内，kube-proxy的CPU占用率超过了给它分配的limits，而参看kube-proxy daemonset的配置，确实它的limits配置只有200ms，这就意味着在默认的100ms的CFS重调度周期内，它只能占用20ms，所以在特定繁忙场景会有问题：

```java
cat cpu.shares 
204
cat cpu.cfs_period_us 
100000
cat cpu.cfs_quota_us 
20000
```

注：这里cpu.shares的计算方法如下：200x1024/1000~=204

而这个问题的解决方案就是将CPU limits提高。

Zalando公司有一个分享[《Optimizing Kubernetes Resource Requests/Limits for Cost-Efficiency and Latency / Henning Jacobs》](https://www.youtube.com/watch?v=eBChCFD9hfs)很好的讲述了CPU资源管理的问题，可以参考，这个演讲的[PPT在这里](https://www.slideshare.net/try_except_/optimizing-kubernetes-resource-requestslimits-for-costefficiency-and-latency-highload?from_action=save)可以找到。

更具体问题分析和讨论还可以参考如下文章：

- [CPUThrottlingHigh false positives #108](https://github.com/kubernetes-monitoring/kubernetes-mixin/issues/108)
- [CFS quotas can lead to unnecessary throttling #67577](https://github.com/kubernetes/kubernetes/issues/67577)
- [CFS Bandwidth Control](https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt)
- [Overly aggressive CFS](https://gist.github.com/bobrik/2030ff040fad360327a5fab7a09c4ff1)

其中《[Overly aggressive CFS](https://gist.github.com/bobrik/2030ff040fad360327a5fab7a09c4ff1)》里面还有几个小实验可以帮助大家更好的认识到CFS进行CPU资源管控的特点：
