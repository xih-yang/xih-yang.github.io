# 05、Kubernetes - 实战：创建 ConfigMap/Secret 对象、分别使用环境变量Env和 Volume 配置ConfigMap/Secret 对象
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/5.html
- 分类：容器服务
- 分组：教程目录
应用程序有很多类别的配置信息，但从数据安全的角度来看可以分成两类：

- 一类是明文配置，也就是不保密，可以任意查询修改，比如服务端口、运行参数、文件路径等等。
- 一类则是机密配置，由于涉及敏感信息需要保密，不能随便查看，比如密码、密钥、证书等等。

这两类配置信息本质上都是字符串，只是由于安全性的原因，在存放和使用方面有些差异，所以 `Kubernetes` 也就定义了两个 `API` 对象，

- ConfigMap 用来保存明文配置；
- Secret 用来保存秘密配置；

```java
wohu@dev:~$ kubectl api-resources  | grep configmap
configmaps                        cm           v1                                     true         ConfigMap
wohu@dev:~$ kubectl api-resources  | grep secret
secrets                                        v1                                     true         Secret
wohu@dev:~$
```

## 1. 创建 ConfigMap 对象

可以用命令 `kubectl create` 来创建一个它的 `YAML` 样板。注意，它有简写名字 `cm`，所以命令行里没必要写出它的全称：

```java
export out="--dry-run=client -o yaml"        定义Shell变量
kubectl create cm info $out
```

得到的样板文件大概是这个样子：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: info
```

`ConfigMap` 的 `YAML` 和之前我们学过的 `Pod`、`Job` 不一样，除了熟悉的 `apiVersion`、`kind`、`metadata`，居然就没有其他的了，最重要的字段 `spec`哪里去了？这是因为 `ConfigMap` 存储的是配置数据，是静态的字符串，并不是容器，所以它们就不需要用 `spec`字段来说明运行时的“规格”。

既然`ConfigMap` 要存储数据，我们就需要用另一个含义更明确的字段 `data`。要生成带有 `data`字段的 `YAML` 样板，你需要在 `kubectl create` 后面多加一个参数 `--from-literal` ，表示从字面值生成一些数据：

```java
kubectl create cm info --from-literal=k=v $out
```

**注意，因为在 ConfigMap 里的数据都是 Key-Value 结构，所以 --from-literal 参数需要使用 k=v 的形式。**

把`YAML` 样板文件修改一下，再多增添一些 `Key-Value`，就得到了一个比较完整的 `ConfigMap` 对象：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: info
data:
  count: '10'
  debug: 'on'
  path: '/etc/systemd'
  greeting: |
    say hello to kubernetes.
```

注意`ConfigMap` 要求必须是字符串，所以最好用 `引号` 引起来，避免解释成数字导致错误。

现在就可以使用 `kubectl apply` 把这个 `YAML` 交给 `Kubernetes`，让它创建 `ConfigMap` 对象了：

```java
kubectl apply -f cm.yml
```

创建成功后，我们还是可以用 `kubectl get`、`kubectl describe` 来查看 `ConfigMap` 的状态：

```java
kubectl get cm
kubectl describe cm info
```

执行结果：

可以看到，现在 `ConfigMap` 的 `Key-Value` 信息就已经存入了 `etcd` 数据库，后续就可以被其他 `API` 对象使用。

## 2. 创建 Secret 对象

`Kubernetes` 里 `Secret` 对象又细分出很多类，比如：

- 访问私有镜像仓库的认证信息
- 身份识别的凭证信息
- HTTPS 通信的证书和私钥
- 一般的机密信息（格式由用户自行解释）

前几种我们现在暂时用不到，所以就只使用最后一种，创建 `YAML` 样板的命令是 `kubectl create secret generic` ，同样，也要使用参数 `--from-literal` 给出 `Key-Value` 值：

```java
kubectl create secret generic user --from-literal=name=root $out
```

得到的`Secret` 对象大概是这个样子：

```java
apiVersion: v1
kind: Secret
metadata:
  name: user
data:
  name: cm9vdA==
```

这里的`name`值是一串“乱码”，而不是刚才在命令行里写的明文 `root`。这串“乱码”就是 `Secret` 与 `ConfigMap` 的不同之处，不让用户直接看到原始数据，起到一定的保密作用。不过它的手法非常简单，只是做了 `Base64` 编码，根本算不上真正的加密，所以我们完全可以绕开 `kubectl`，自己用 `Linux` 小工具 `base64`来对数据编码，然后写入 `YAML` 文件，比如：

```java
wohu@dev:~/k8s$ echo -n "root" | base64
cm9vdA==
wohu@dev:~/k8s$ echo -n "123456" | base64
MTIzNDU2
wohu@dev:~/k8s$
```

要注意这条命令里的 `echo` ，必须要加参数 `-n` 去掉字符串里隐含的换行符，否则 `Base64` 编码出来的字符串就是错误的。

我们再来重新编辑 `Secret` 的 `YAML`，为它添加两个新的数据，方式可以是参数 `--from-literal` 自动编码，也可以是自己手动编码：

```java
apiVersion: v1
kind: Secret
metadata:
  name: user
data:
  name: cm9vdA==  root
  pwd: MTIzNDU2   123456
  db: bXlzcWw=    mysql
```

接下来的创建和查看对象操作和 `ConfigMap` 是一样的，使用 `kubectl apply`、`kubectl get`、`kubectl describe`：

```java
kubectl apply  -f secret.yml
kubectl get secret
kubectl describe secret user
```

这样一个存储敏感信息的 `Secret` 对象也就创建好了，而且因为它是保密的，使用 `kubectl describe` 不能直接看到内容，只能看到数据的大小，你可以和 `ConfigMap` 对比一下。

## 3. 用环境变量使用 ConfigMap/Secret

在前面讲 `Pod` 的时候，说过描述容器的字段 `containers`里有一个 `env`，它定义了 `Pod` 里容器能够看到的环境变量。

```java
spec:
  containers:
  - image: busybox:latest
    name: busy
    imagePullPolicy: IfNotPresent
    env:
      - name: os
        value: "ubuntu"
      - name: debug
        value: "on"
    command:
      - /bin/echo
    args:
      - "$(os), $(debug)"
```

当时我们只使用了简单的 `value`，把环境变量的值写“死”在了 `YAML` 里，实际上它还可以使用另一个 `valueFrom`字段，从 `ConfigMap` 或者 `Secret` 对象里获取值，这样就实现了把配置信息以环境变量的形式注入进 `Pod`，也就是配置与应用的解耦。

由于`valueFrom`字段在 `YAML` 里的嵌套层次比较深，初次使用最好看一下 `kubectl explain` 对它的说明：

```java
kubectl explain pod.spec.containers.env.valueFrom
```

结果如下：

```java
$ kubectl explain pod.spec.containers.env.valueFrom
KIND:     Pod
VERSION:  v1
RESOURCE: valueFrom <Object>
DESCRIPTION:
     Source for the environment variable's value. Cannot be used if value is not
     empty.
     EnvVarSource represents a source for the value of an EnvVar.
FIELDS:
   configMapKeyRef      <Object>
     Selects a key of a ConfigMap.
   fieldRef     <Object>
     Selects a field of the pod: supports metadata.name, metadata.namespace,
     metadata.labels['`<KEY>`'], metadata.annotations['`<KEY>`'], spec.nodeName,
     spec.serviceAccountName, status.hostIP, status.podIP, status.podIPs.
   resourceFieldRef     <Object>
     Selects a resource of the container: only resources limits and requests
     (limits.cpu, limits.memory, limits.ephemeral-storage, requests.cpu,
     requests.memory and requests.ephemeral-storage) are currently supported.
   secretKeyRef <Object>
     Selects a key of a secret in the pod's namespace
wohu@dev:~/k8s$
```

`valueFrom`字段指定了环境变量值的来源，可以是 `configMapKeyRef`或者 `secretKeyRef`，然后你要再进一步指定应用的 `ConfigMap/Secret` 的 `name`和它里面的 `key`，要当心的是这个 `name`字段是 `API` 对象的名字，而不是 `Key-Value` 的名字。

整体示例：

```java
apiVersion: v1
kind: Pod
metadata:
  name: env-pod
spec:
  containers:
  - env:
      - name: COUNT
        valueFrom:
          configMapKeyRef:
            name: info
            key: count
      - name: GREETING
        valueFrom:
          configMapKeyRef:
            name: info
            key: greeting
      - name: USERNAME
        valueFrom:
          secretKeyRef:
            name: user
            key: name
      - name: PASSWORD
        valueFrom:
          secretKeyRef:
            name: user
            key: pwd
    image: busybox
    name: busy
    imagePullPolicy: IfNotPresent
    command: ["/bin/sleep", "300"]
```

这个`Pod` 的名字是 `env-pod`，镜像是 `busybox`，执行命令 `sleep` 睡眠 300 秒，我们可以在这段时间里使用命令 `kubectl exec` 进入 `Pod` 观察环境变量。

`env`字段，里面定义了 4 个环境变量，`COUNT`、`GREETING`、`USERNAME`、`PASSWORD`。

对于明文配置数据， `COUNT`、`GREETING` 引用的是 `ConfigMap` 对象，所以使用字段`configMapKeyRef`，里面的 `name`是 `ConfigMap` 对象的名字，也就是之前我们创建的`info`，而 `key`字段分别是`info`对象里的 `count` 和 `greeting`。

同样的对于机密配置数据， `USERNAME`、`PASSWORD` 引用的是 `Secret` 对象，要使用字段`secretKeyRef`，再用 `name`指定 `Secret` 对象的名字 `user`，用 `key`字段应用它里面的 `name` 和 `pwd` 。

引用关系如下：

图片来源：[https://time.geekbang.org/column/article/533395](https://time.geekbang.org/column/article/533395)

从这张图你就应该能够比较清楚地看出 `Pod` 与 `ConfigMap`、`Secret` 的“松耦合”关系，它们不是直接嵌套包含，而是使用 `KeyRef`字段间接引用对象，这样，同一段配置信息就可以在不同的对象之间共享。

弄清楚了环境变量的注入方式之后，让我们用 `kubectl apply` 创建 `Pod`，再用 `kubectl exec` 进入 `Pod`，验证环境变量是否生效：

```java
kubectl apply -f env-pod.yml
kubectl exec -it env-pod -- sh
echo $COUNT
echo $GREETING
echo $USERNAME $PASSWORD
```

## 4. 用 Volume 使用 ConfigMap/Secret

`Kubernetes` 为 `Pod` 定义了一个`Volume`的概念，可以翻译成是“存储卷”。如果把 `Pod` 理解成是一个虚拟机，那么 `Volume` 就相当于是虚拟机里的磁盘。

我们可以为 `Pod`“挂载（`mount`）”多个 `Volume`，里面存放供 `Pod` 访问的数据，这种方式有点类似 `docker run -v`，虽然用法复杂了一些，但功能也相应强大一些。

在`Pod` 里挂载 `Volume` 很容易，只需要在 `spec`里增加一个 `volumes`字段，然后再定义卷的名字和引用的 `ConfigMap/Secret` 就可以了。要注意的是 `Volume` 属于 `Pod`，不属于容器，所以它和字段`containers`是同级的，都属于`spec`。

下面让我们来定义两个 `Volume`，分别引用 `ConfigMap` 和 `Secret`，名字是 `cm-vol` 和 `sec-vol`：

```java
spec:
  volumes:
  - name: cm-vol
    configMap:
      name: info
  - name: sec-vol
    secret:
      secretName: user
```

有了`Volume` 的定义之后，就可以在容器里挂载了，这要用到 `volumeMounts` 字段，正如它的字面含义，可以把定义好的 `Volume` 挂载到容器里的某个路径下，所以需要在里面用 `mountPath` ，`name` 明确地指定挂载路径和 `Volume` 的名字。

```java
  containers:
  - volumeMounts:
    - mountPath: /tmp/cm-items
      name: cm-vol
    - mountPath: /tmp/sec-items
      name: sec-vol
```

把`volumes` 和 `volumeMounts` 字段都写好之后，配置信息就可以加载成文件了。它们的引用关系如下图：

图片来源：[https://time.geekbang.org/column/article/533395](https://time.geekbang.org/column/article/533395)

可以看到，挂载 `Volume` 的方式和环境变量又不太相同。环境变量是直接引用了 `ConfigMap/Secret`，而 `Volume` 又多加了一个环节，需要先用 `Volume` 引用 `ConfigMap/Secret`，然后在容器里挂载 `Volume`。

这种方式的好处在于：以 `Volume` 的概念统一抽象了所有的存储，不仅现在支持 `ConfigMap/Secret`，以后还能够支持临时卷、持久卷、动态卷、快照卷等许多形式的存储，扩展性非常好。

`Pod` 的完整 `YAML` 如下，然后使用 `kubectl apply` 创建它：

```java
apiVersion: v1
kind: Pod
metadata:
  name: vol-pod
spec:
  volumes:
  - name: cm-vol
    configMap:
      name: info
  - name: sec-vol
    secret:
      secretName: user
  containers:
  - volumeMounts:
    - mountPath: /tmp/cm-items
      name: cm-vol
    - mountPath: /tmp/sec-items
      name: sec-vol
    image: busybox
    name: busy
    imagePullPolicy: IfNotPresent
    command: ["/bin/sleep", "300"]
```

创建之后，我们还是用 `kubectl exec` 进入 `Pod`，看看配置信息被加载成了什么形式：

```java
kubectl apply -f vol-pod.yml
kubectl get pod
kubectl exec -it vol-pod -- sh
```

可以看到，`ConfigMap` 和 `Secret` 都变成了目录的形式，而它们里面的 `Key-Value` 变成了一个个的文件，而文件名就是 `Key`。

因为这种形式上的差异，以 `Volume` 的方式来使用 `ConfigMap/Secret`，就和环境变量不太一样。环境变量用法简单，更适合存放简短的字符串，而 `Volume` 更适合存放大数据量的配置文件，在 `Pod` 里加载成文件后让应用直接读取使用。

## 5. 总结

- ConfigMap 记录了一些 Key-Value 格式的字符串数据，描述字段是 data ，不是 spec。
- Secret 与 ConfigMap 很类似，也使用 data 保存字符串数据，但它要求数据必须是 Base64 编码，起到一定的保密效果。
- 在 Pod 的 env.valueFrom 字段中可以引用 ConfigMap 和 Secret，把它们变成应用可以访问的环境变量。
- 在 Pod 的 spec.volumes 字段中可以引用 ConfigMap 和 Secret，把它们变成存储卷，然后在spec.containers.volumeMounts 字段中加载成文件的形式。
- ConfigMap 和 Secret 对存储数据的大小是有限制的，限制为 1MiB（[https://kubernetes.io/zh-cn/docs/concepts/configuration/configmap/#motivation](https://kubernetes.io/zh-cn/docs/concepts/configuration/configmap/#motivation)），但小数据用环境变量比较适合，大数据应该用存储卷，可根据具体场景灵活应用。

如果已经存在了一些配置文件，我们可以使用参数 `--from-file` 从文件自动创建出 `ConfigMap` 或 `Secret`。

`Secret` 对象默认只会以 `Base64` 编码的形式存储在 `etcd` 里，而 `Base64` 不是加密算法，所以它通常并不是 `secret` ，不过可以认为 `Kubernetes` 启用加密功能，实现真正的安全。

可以在`volumes.configMap.items` 字段里用 `key path` 为 `ConfigMap` 里的每个 `key-value` 精确地指定加载的路径名，也就是给文件改名，因为加载 `volome` 的文件名就是 `ConfigMap` 、`secret` 的 `key` 名，有的时候就不合适，可以用这种方式来改名。

## 6. 其它

**1、** 说一说你对`ConfigMap`和`Secret`这两个对象的理解，它们有什么异同点？；

相同点：

都可以用来把配置数据和服务程序分离

都是一种用于存储的 `API` 对象

都以键值对 `k-v` 的方式存储数据

都可以作为数据卷挂载在其他 `API` 对象上使用

都不适合存储大数据，每个 `ConfigMap /Secret` 最多支持存储1MB的数据，毕竟对内存有消耗

不同点：

`ConfigMap` 一般存储非机密信息

`Secret` 用于存储机密信息，默认是 `Base64` 编码方式对 `value` 字符进行处理。

`Secret` 保存在 `etcd` 中内容是未经过加密的，对于 `Secret` 资源的权限要做好控制，可以通过 `RBAC` 规则来限制或者是使用其他加密方式

**2、** 如果我们修改了ConfigMap/Secret的YAML，然后使用kubectlapply命令更新对象，那么Pod里关联的信息是否会同步更新呢？你可以自己验证看看；

如果`ConfigMap` 是作为环境变量方式使用的，那数据不会被自动更新。 想要更新这些数据需要重新启动 `Pod`。

环境变量是 `pod` 启动时注入的，所以不会改，重启 `Pod` 才会生效，`volume` 的方式会改，两种方式不一样。

> 只有通过目录挂载的configmap才具备热更新能力，其余通过环境变量，通过subPath挂载的文件都不能动态更新。 并且有一个延迟。一般就是kubelet的定时更新频率。ConfigMap 作为子路径挂载不会实时更新，另外作为 Env 也无法实时更新，需要重启 Pod。实时更新还依赖业务程序，业务需要能感知到配置变更并自动载入。

**1、** 使用ConfigMap数据定义容器环境变量：[官网链接](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data)；

**2、** 将ConfigMap中的所有键值对配置为容器环境变量：[官网链接](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-pod-configmap/#configure-all-key-value-pairs-in-a-configmap-as-container-environment-variables)；

**3、** 在Pod命令中使用ConfigMap定义的环境变量：[官网链接](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-pod-configmap/#use-configmap-defined-environment-variables-in-pod-commands)；

使用kubectl create configmap 创建 ConfigMap：[官网链接](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-pod-configmap/#create-a-configmap-using-kubectl-create-configmap)
