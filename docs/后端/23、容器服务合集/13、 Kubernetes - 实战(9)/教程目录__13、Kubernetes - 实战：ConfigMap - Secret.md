# 13、Kubernetes - 实战：ConfigMap - Secret
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/13.html
- 分类：容器服务
- 分组：教程目录
## ConfigMap

前面的资源对象并不能满足日常工作中的所有需求，一个最重要的需求就是应用的配置管理，特别是可变配置。

比如，在开发过程中程序需要配置 MySQL 或者 Redis 的连接地址。如果是以前的部署方式，此时想要修改这些信息，就需要修改代码的配置，然后重新打包部署。如果使用 ConfigMap，它能够向容器中注入配置信息，不仅可以是单个配置，也可以是整个配置文件。后面只需要修改 ConfigMap 的配置就能实现应用的配置更新。

## ConfigMap 资源清单

ConfigMap 资源清单示例：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: cm-demo
data:
  serviceName: "demo-service"
  listenPort: "8080"
  config: |
    mysql.ip="192.168.2.1"
    mysql.port="3306"
    redis.ip="192.168.2.2"
    redis.port="6379"
```

在这个配置清单中，前两项是单个属性配置，config 字段中的可以看成是一个配置文件，其中的 `|` 的作用在于，保留下面属性的换行符和每行相对于第一行的缩进，多余的缩进和行尾的空白都会被删除。

使用示例：

```java
config: |
  第一行
    第二行
      第三行
  第四行
```

转换成JSON 格式就是：

```java
{"config": "第一行\n  第二行\n    第三行\n第四行"}
```

如果将`|` 换成 `>`，表示折叠的意思，只有空白和才会被识别成换行，原来的换行符则会被识别成空格：

```java
config: >
  第一行
  第二行
  第三行
  第五行
```

转换成JSON 格式就是：

```java
{"config": "第一行 第二行 第三行\n第五行"}
```

还可以使用竖线和加号或者减号进行配合使用，`+` 表示保留文字块末尾的换行，`-` 表示删除字符串末尾的换行。

```java
config: |
  "hello"
# Json 格式：{"config": "hello\n"}  
config: |-
  "hello"
# Json 格式：{"config": "hello"}  
config: |+
  "hello"
# Json 格式：{"config": "hello\n\n"}
# 有几个换行则加几个
```

## 创建 ConfigMap

创建ConfigMap 的命令：

```java
# 通过指定目录创建 ConfigMap
kubectl create configmap cm-demo --from-file=/path/dir
# 通过指定文件创建 ConfigMap，可以是多个文件
kubectl create configmap cm-demo --from-file=key1=/path/dir/file1.txt --from-file=key2=/path/dir/file2.txt
# 直接指定键值创建 ConfigMap
kubectl create configmap cm-demo --from-literal=key1=value1 --from-literal=key2=value2
```

准备一个目录 `/cm/config/`，下面准备两个文件 `mysql.conf` 和 `redis.conf`：

```java
# mysql.conf 内容
host="192.168.2.1"
port="3306"
# redis.conf 内容
host="192.168.2.2"
port="6379"
```

测试创建：

```java
# 直接通过整个目录创建，默认的 Key 就是文件名
kubectl create configmap cm-demo1 --from-file=/cm/config
# 指定文件创建，可以指定对于的 Key
kubectl create configmap cm-demo2 --from-file=mysqlConfig=/cm/config/mysql.conf --from-file=redisConfig=/cm/config/redis.conf
# 指定 K/V 直接创建
kubectl create configmap cm-demo3 --from-literal=k1=v1 --from-literal=k2=v2
```

## 使用 ConfigMap（环境变量）

在ConfigMap 创建成功之后，有以下方法在 Pod 中使用它：

- 设置环境变量的值
- 在容器中设置命令行参数
- 在数据卷中挂载配置文件

使用环境变量示例：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-cm-demo1
spec:
  containers:
  - name: c-cm-demo1
    image: busybox:latest
    command: [/bin/sh, -c, "env"]
    将每个配置文件单独给一个环境变量
    env:
      - name: MYSQL_CONFIG
        valueFrom:
          configMapKeyRef:
            name: cm-demo1
            key: mysql.conf
      - name: REDIS_CONFIG
        valueFrom:
          configMapKeyRef:
            name: cm-demo1
            key: redis.conf
    直接导入整个 ConfigMap 到环境变量中
    envFrom:
      - configMapRef:
          name: cm-demo
```

通过查看创建 Pod 之后输出的日志，可以看到设置的环境变量为：

```java
# cm-demo 的 mysql.conf Key
MYSQL_CONFIG=host="192.168.2.1"
port="3306"
# cm-demo 的 redis.conf Key
REDIS_CONFIG=host="192.168.2.2"
port="6379"
# cm-demo 的配置生成了三个环境变量
config=mysql.ip="192.168.2.1"
mysql.port="3306"
redis.ip="192.168.2.2"
redis.port="6379"
serviceName=demo-service
listenPort=8080
```

## 使用 ConfigMap（容器运行参数）

作为容器的运行参数示例：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-cm-demo2
spec:
  containers:
  - name: c-cm-demo2
    image: busybox:latest
    command: [/bin/sh, -c, "echo ${ENV_V1}-${ENV_V2}"]
    env:
      - name: ENV_V1
        valueFrom:
          configMapKeyRef:
            name: cm-demo3
            key: k1
      - name: ENV_V2
        valueFrom:
          configMapKeyRef:
            name: cm-demo3
            key: k2
```

## 使用 ConfigMap（数据卷挂载）

以数据卷的方式挂载到 Pod 中使用：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-cm-demo3
spec:
  volumes:
    - name: v-cm-demo
      configMap:
        name: cm-demo1
        items:
          - key: mysql.conf
            path: path/to/msyql.conf
  containers:
  - name: c-cm-demo3
    image: busybox:latest
    command: [/bin/sh, -c, "ls -lh /opt/config/ && cat /opt/config/mysql.conf"]
    volumeMounts:
      - name: v-cm-demo
        mountPath: /opt/config/
```

此时ConfigMap 中的 Key 就能够变成文件名，然后挂载到指定的目录下。当然，也可以自己指定挂载的文件：

```java
...
      configMap:
        name: cm-demo1
        items:
          - key: mysql.conf
            path: /opt/config/mysql.conf
...
```

当使用数据卷的方式挂载到 Pod 中，此时更新 ConfigMap，挂载的数据也是会跟着热更新的。这意味着以配置文件名称作为 Key 名称，然后使用 volume 挂载的方式是最适合开发场景的。

> 只有通过 Kubernetes API 创建的 Pod 才能使用 ConfigMap，其他方式创建的（比如静态 Pod）不能使用，同时 ConfigMap 文件大小限制为 1MB（ETCD 的要求）。

## Secret

ConfigMap 一般用于存储非安全的配置信息，原因在于 ConfigMap 使用的是明文的方式存储。这用来保存密码等对象显然是不合理的。此时就需要另外一个对象帮忙完成，那就是 Secret。

Secret 主要包含了以下几种类型：

**1、**`Opaque`：base64编码的Secret，主要用来存储密码，密钥等但数据可以通过`base64-d`解码得到，加密性很弱；

**2、**`kubernetes.io/dockercfg`：`~/dockercfg`文件的序列化形式；

**3、**`kubernetes.io/dockerconfigjson`：用来存储私有dockerregistry的认证信息，`~/.docker/config.json`文件的序列号形式；

**4、**`kubernetes.io/service-account-token`：ServiceAccount在创建时，Kubernetes会默认创建一个对应的Secret对象，Pod如果使用ServiceAccount，对应的Secret会自动的挂载到Pod的`/run/secret/kubernetes.io/serviceaccount`中；

**5、**`kubernetes.io/ssh-auth`：用于SSH身份认证的凭据；

**6、**`kubernetes.io/basic-auth`：用于基本身份认证的凭据；

**7、**`bootstrap.kubernetes.io/token`：用于节点接入集群校验的Secret；

上面是Secret 对象内置的几种类型，通过 Secret 的 type 字段设置，也可以定义自己的 Secret 类型。如果 type 字段为空，则使用默认的 `Opaque` 类型。

## Opaque

Secret 资源包含 2 个键值对：

- data：用于存储 base64 编码的任意数。
- stringData：为了方便 secret 使用未编码的字符串。

比如，新建一个 username 为 admin，password 为 admin123 的 Secret 对象。

先对username 和 password 进行 base64 编码：

```java
echo -n admin | base64
echo -n admin123 | base64
```

如图所示：

创建Secret 资源清单：

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret-demo
type: Opaque
data:
  username: YWRtaW4=
  password: YWRtaW4xMjM=
```

应用之后查看：

```java
kubectl describe secrets secret-demo
```

如图所示：

可以看到 data 中的数据没有被显示出来，如果想要获取到数据可以以 yaml 当时显示：

```java
kubectl get secrets secret-demo -o yaml
```

如图所示：

在某些时候，也可能不想手动编码，此时就可以将数据放到 stringData 中，那么在创建或者更新的 Secret 的时候就能自动对其进行编码，比如一个复杂点的场景：

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret-demo1
type: Opaque
stringData:
  mysql.yaml: |
    host: 192.168.2.1
    port: 3306
    username: root
    password: root123
```

此时看到整个数据的配置就是加密的状态：

解密查看：

创建好Secret 对象后，有两种方式来使用它：

- 环境变量的方式
- Volume 挂载的方式

## 使用 Secret（环境变量）

通过环境变量的方式使用 Secret：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-secret-demo1
spec:
  containers:
  - name: c-secret-demo
    image: busybox:latest
    command: ["/bin/sh", "-c", "env"]
    env:
      - name: USERNAME
        valueFrom:
          secretKeyRef:
            name: secret-demo
            key: username
      - name: PASSWORD
        valueFrom:
          secretKeyRef:
            name: secret-demo
            key: password
```

运行之后通过日志可以看到：

```java
USERNAME=admin
PASSWORD=admin123
```

变量是以明文的方式注入到环境变量中的。

## 使用 Secret（数据卷挂载）

通过数据卷挂载的方式使用 Secret：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-secret-demo2
spec:
  volumes:
    - name: v-secret-demo
      secret:
        secretName: secret-demo1
  containers:
  - name: c-secret-demo2
    image: busybox:latest
    command: ["/bin/sh", "-c", "cat /opt/secret/mysql.yaml"]
    volumeMounts:
      - name: v-secret-demo
        mountPath: /opt/secret/
```

使用方法和 ConfigMap 是类似的，也可以通过 `items` 指定挂载到指定的文件。

## kubernetes.io/dockerconfigjson

直接创建 docker registry 认证的 secret：

```java
kubectl create secret docker-registry secret-docker-registry --docker-server="hub.docker.com" --docker-username="dylan" --docker-password="123456" --docker-email="1214966109@qq.com"
```

除此之外，也可以通过指定文件的方式创建镜像仓库认证信息：

```java
kubectl create secret generic secret-docker-registry --from-file=.dockerconfigjson=/root/.docker/config.json --type=kubernetes.io/dockerconfigjson
```

如图所示：

可以通过 base64 解码：

此时如果需要拉取私有仓库的镜像要用到认证的，就可以直接使用这个Secret：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-secret-demo2
spec:
  containers:
  - name: c-secret-demo2
    image: hub.docker.com/imageDemo:v1.0
  imagePullSecrets:
    - name: secret-docker-registry
```

特别注意：

> ImagePullSecrets 与 Secrets 不同，因为 Secrets 可以挂载到 Pod 中，但是 ImagePullSecrets 只能由 Kubelet 访问。

除了该方法设置 ImagePullSecrets 的方式访问私有仓库获取镜像以外，还可以通过 ServiceAccount 中设置 ImagePullSecrets 然后自动为使用了该 SA 的 Pod 注入配置信息。

## kubernetes.io/basic-auth

该类型用来存放用于基本身份认证所需的凭据信息，使用这种 Secret 类型时，Secret 的 data（或 stringData）字段中一般会包含以下两个键：

- username：用于身份认证的用户名。
- password：用于身份认证的密码或令牌。

可以和创建 Opaque 一样通过 data 字段或者 stringData 字段定义。

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret-demo3
type: kubernetes.io/basic-auth
stringData:
  username: admin
  password: admin123
```

提供基本身份认证类型的 Secret 仅仅是出于用户方便性考虑，也可以使用 Opaque 类型来保存用于基本身份认证的凭据，不过使用内置的 Secret 类型的有助于对凭据格式进行统一处理。

## kubernetes.io/ssh-auth

该类型用来存放 SSH 身份认证中所需要的凭据，使用这种 Secret 类型时，Secret 的 data（或 stringData）字段中一般会提供一个 `ssh-privatekey` 键值对，作为要使用的 SSH 凭据。

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret-demo4
type: kubernetes.io/ssh-auth
data:
  ssh-privatekey: |
          MIIEpQIBAAKCAQEAulqb...
```

同样提供 SSH 身份认证类型的 Secret 也仅仅是出于用户方便性考虑，也可以使用 Opaque 类型来保存用于 SSH 身份认证的凭据，只是使用内置的 Secret 类型的有助于对凭据格式进行统一处理。

## kubernetes.io/tls

该类型用来存放证书及其相关密钥。该类型主要提供给 Ingress 资源，用以校验 TLS 链接，使用此类型的 Secret 时，Secret 的 data （或 stringData）字段必须包含 `tls.key` 和 `tls.crt` 主键。

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret-demo4
type: kubernetes.io/tls
data:
  tls.crt: |
        MIIC2DCCAcCgAwIBAgIBATANBgkqh ...
  tls.key: |
        MIIEpgIBAAKCAQEA7yn3bRHQ5FHMQ ...
```

提供TLS 类型的 Secret 仅仅是出于用户方便性考虑，也可以使用 Opaque 类型来保存用于 TLS 服务器与/或客户端的凭据。只是使用内置的 Secret 类型的有助于对凭据格式进行统一化处理。

当使用kubectl 来创建 TLS Secret 时，可以通过命令指定证书来直接创建更为方便：

```java
kubectl create secret tls secret-demo4 --cert=/path/cert --key=/path/key
```

需要注意的是用于 `--cert` 的公钥证书必须是 `.PEM` 编码的 （Base64 编码的 DER 格式），且与 `--key` 所给定的私钥匹配，私钥必须是通常所说的 PEM 私钥格式，且未加密。

对这两个文件而言，PEM 格式数据的第一行和最后一行（`--------BEGIN CERTIFICATE-----` 和 `-------END CERTIFICATE----`）都不会包含在其中。

## kubernetes.io/service-account-token

`ServiceAccount` 是 Pod 和集群 apiserver 通讯的访问凭证。`kubernetes.io/service-account-token` 这种类型就是主要给 ServiceAccount 使用。ServiceAccount 在创建时会默认创建对应的 Secret。

查看任意一个 Pod：

```java
kubectl get pod pod-secret-demo1 -o yaml
```

可以看到：

- 当创建 Pod 的时候，如果没有指定 ServiceAccount，Pod 则会使用默认名称空间中名称为 default 的 ServiceAccount。
- volumes 字段中有一个 projected 类型的 volume 被挂载到了 /var/run/secrets/kubernetes.io/serviceaccount，该类型的 volume 可以同时挂载多个来源的数据。默认挂载了 configMap，downwardAPI，serviceAccountToken。

更多信息由于需要等到学习了 ServiceAccount 的时候才能搞得清除。

## 补充说明

如果某个容器已经在通过环境变量使用某 Secret，对该 Secret 的更新不会被容器马上看见，除非容器被重启，当然也可以使用一些第三方的解决方案在 Secret 发生变化时触发容器重启。

在Kubernetes v1.21 版本提供了不可变的 Secret 和 ConfigMap 的可选配置 `stable`，对于大量使用 Secret 或 ConfigMap 的集群时，禁止变更具有以下好处：

- 可以防止意外更新导致应用程序中断。
- 通过将 Secret 标记为不可变来关闭 kube-apiserver 对其的 watch 操作，从而显著降低 kube-apiserver 的负载，提升集群性能。

配置方法：

```java
apiVersion: v1
kind: Secret
metadata:
  ...
data:
  ...
immutable: true  标记为不可变
```

一旦Secret 或 ConfigMap 被标记为不可更改，撤销此操作或更改 data 字段的内容都是不允许的，只能删除并重新创建这个 Secret。现有的 Pod 将继续使用已删除 Secret 的挂载点，所以也需要重新引用的 Pod。

## Secret vs ConfigMap

相同点：

- k/v 形式
- 属于特定的命名空间
- 可以导出到环境变量
- 可以通过目录/文件形式挂载
- 通过 volume 挂载的配置信息均可热更新

不同点：

- Secret 可以被 ServerAccount 关联。
- Secret 可以存储 docker register 的鉴权信息，用在 ImagePullSecret 参数中，用于拉取私有仓库的镜像。
- Secret 支持 Base64 加密。
- Secret 有多种分类，而 ConfigMap 不区分类型。

> 同样 Secret 文件大小限制为 1MB（ETCD 的要求），Secret 虽然采用 Base64 编码，但还是可以很方便解码获取到原始信息，所以对于非常重要的数据还是需要慎重考虑，可以考虑使用 Vault 来进行加密管理。
