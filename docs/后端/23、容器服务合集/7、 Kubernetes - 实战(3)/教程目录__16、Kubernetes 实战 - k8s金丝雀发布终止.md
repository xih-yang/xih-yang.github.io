# 16、Kubernetes 实战 - k8s金丝雀发布终止
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/16.html
- 分类：容器服务
- 分组：教程目录
## 金丝雀发布的问题

金丝雀发布是什么，这里就不说了。我们肯定知道了金丝雀发布之后，有一个疑问，金丝雀发布后，中止，然后继续再完全发布。

但是，此时发现了bug，怎么终止这次发布行动呢？

我在网上找了许久，并没有找到如何取终止丝雀发布的内容。于是，靠自己摸索，记录这篇文章，补上如何终止金丝雀发布的操作。

如何你还不知道或者不会金丝雀发布，建议先去学习相关知识。

## 金丝雀发布

执行金丝雀发布

```java
kubectl set image deploy pc-deployment nginx=nginx:1.17.4 -n dev && kubectl rollout pause deployment pc-deployment -n dev
```

查看图，我们发现

窗口1(上)：执行金丝雀发布，发现history新增了一个版本4

窗口2(左下)：版本更新显示新增了一个pod，3个副本等待升级。

窗口3(右下)：新的rs里面包含了1个新版本的pod，旧版本的rs依然存在3个pod，此时处于金丝雀发布中止状态。

## 终止金丝雀发布

前面我们已经执行了金丝雀发布，已经产生了一个新版本的pod，等待完全发布了。

如果此时我们发现新版本的镜像存在问题。如何才能终止这次发布呢？让版本回退到发布前的状态。

新版本的id为4，这里回退到发布前的版本是3

```java
#恢复发布发布并undo
kubectl rollout resume deploy pc-deployment -n dev && kubectl rollout undo deploy pc-deployment --to-revision=3 -n dev
```

上面这条指令，单独的来看是恢复继续完成发布，然后undo回退到3。很显然是继续把坑做大，然后再从坑里退出来。但是实际呢，实践是检验真理的唯一标准，我们执行这条命令。

**观察执行结果**

- 版本3消失了，出现了版本5，说明它是恢复到了之前的版本。
- 很显然resume&&undo之后，新的pod的数量只是从1变成了0，旧版本的pod数量恢复到了3，并且依然用的旧的rs。这说明了resume&&undo并不会继续将新镜像扩大化发布，而是维持为1，直到最后旧版本恢复完成后，删除了新版本的pod。
