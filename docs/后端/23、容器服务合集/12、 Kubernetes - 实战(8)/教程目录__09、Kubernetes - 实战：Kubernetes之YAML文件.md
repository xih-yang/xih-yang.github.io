# 09、Kubernetes - 实战：Kubernetes之YAML文件
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/9.html
- 分类：容器服务
- 分组：教程目录
## 一、YAML文件常用指令

### 1.1配置文件说明：

```java
• 定义配置时，指定最新稳定版API（当前为v1）。
• 配置文件应该存储在集群之外的版本控制仓库中。如果需要，可以快速回滚配置、重新创建和恢复。
• 应该使用YAML格式编写配置文件，而不是JSON。尽管这些格式都可以使用，但YAML对用户更加友好。
• 可以将相关对象组合成单个文件，通常会更容易管理。
• 不要没必要的指定默认值，简单和最小配置减少错误。
• 在注释中说明一个对象描述更好维护。
• YAML是一种标记语言很直观的数据序列化格式，可读性高。类似于XML数据描述语言，语法比XML简单的很多。
• YAML数据结构通过缩进来表示，连续的项目通过减号来表示，键值对用冒号分隔，数组用中括号括起来，hash用花括号括起来。
```

### 1.2 YAML文件格式注意事项

```java
• 1. 不支持制表符tab键缩进，需要使用空格缩进
• 2. 通常开头缩进2个空格
• 3. 字符后缩进1个空格，
• 4. “---” 表示YAML格式，一个文件的开始
• 5. “#”注释
```

### 1.3 YAML文件介绍

```java
apiVersion: v1    指定api的版本
kind: Pod    指定需要创建的资源对象（Pod、Deployment、StatsfulSate、Service、Ingress...）
metadata:    元数据
  name: "MYAPP"     指定对象名称
  namespace: default    指定命名空间
  labels:    指定标签
    app: "MYAPP"
  annotations:    指定注解
    app: "string"
spec:    描述资源相关信息
  containers:    pod中的容器列表，可以有多个容器
  - name: MYAPP    容器名称
    image: "debian-slim:latest"    容器镜像
    imagesPullPolicy: [Always|Never|IfNotPresent]    获取镜像策略，默认是Always
    command: [string]   容器启动命令列表
    args: [string]   容器启动参数列表
    workingDir: string    容器的工作目录
    resources:
      limits:
        cpu: 200m
        memory: 500Mi
      requests:
        cpu: 100m
        memory: 200Mi
    env:
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: MYAPP
          key: DB_HOST
    ports:
    - name: http
      containerPort:  80
      hostPort:  int    容器所在主机监听的端口
      protocol: string    TCP和UDP,默认是TCP
    volumeMounts:
    - name: localtime
      mountPath: /etc/localtime
  volumes:
    - name: localtime
      hostPath:
        path: /usr/share/zoneinfo/Asia/Shanghai
  restartPolicy: Always
  nodeSelector: object    节点选择
  hostNetwork: false    是否使用主机网络模式，弃用Docker网桥，默认否
---
apiVersion: v1 【必须】版本号
kind: Pod 【必选】Pod
metadata: 【必选-Object】元数据
  name: String 【必选】 Pod的名称
  namespace: String 【必选】 Pod所属的命名空间
  labels: 【List】 自定义标签列表
   - name: String
  annotations: 【List】 自定义注解列表
   - name: String
spec: 【必选-Object】 Pod中容器的详细定义
  containers: 【必选-List】 Pod中容器的详细定义
  - name: String 【必选】 容器的名称
    image: String 【必选】 容器的镜像名称
    imagePullPolicy: [Always | Never | IfNotPresent] 【String】 每次都尝试重新拉取镜像 | 仅使用本地镜像 | 如果本地有镜像则使用，没有则拉取
    command: [String] 【List】 容器的启动命令列表，如果不指定，则使用镜像打包时使用的启动命令
    args: [String] 【List】 容器的启动命令参数列表
    workingDir: String 容器的工作目录
    volumeMounts: 【List】 挂载到容器内部的存储卷配置
    - name: String 引用Pod定义的共享存储卷的名称，需使用volumes[]部分定义的共享存储卷名称
      mountPath: Sting 存储卷在容器内mount的绝对路径，应少于512个字符
      readOnly: Boolean 是否为只读模式，默认为读写模式
    ports: 【List】 容器需要暴露的端口号列表
    - name: String  端口的名称
      containerPort: Int 容器需要监听的端口号
      hostPort: Int 容器所在主机需要监听的端口号，默认与containerPort相同。设置hostPort时，同一台宿主机将无法启动该容器的第二份副本
      protocol: String 端口协议，支持TCP和UDP，默认值为TCP
    env: 【List】 容器运行前需设置的环境变量列表
    - name: String 环境变量的名称
      value: String 环境变量的值
    resources: 【Object】 资源限制和资源请求的设置
      limits: 【Object】 资源限制的设置
        cpu: String CPU限制，单位为core数，将用于docker run --cpu-shares参数
        memory: String 内存限制，单位可以为MB，GB等，将用于docker run --memory参数
      requests: 【Object】 资源限制的设置
        cpu: String cpu请求，单位为core数，容器启动的初始可用数量
        memory: String 内存请求，单位可以为MB，GB等，容器启动的初始可用数量
    livenessProbe: 【Object】 对Pod内各容器健康检查的设置，当探测无响应几次之后，系统将自动重启该容器。可以设置的方法包括：exec、httpGet和tcpSocket。对一个容器只需要设置一种健康检查的方法
      exec: 【Object】 对Pod内各容器健康检查的设置，exec方式
        command: [String] exec方式需要指定的命令或者脚本
      httpGet: 【Object】 对Pod内各容器健康检查的设置，HTTGet方式。需要指定path、port
        path: String
        port: Number
        host: String
        scheme: String
        httpHeaders:
        - name: String
          value: String
      tcpSocket: 【Object】 对Pod内各容器健康检查的设置，tcpSocket方式
        port: Number
      initialDelaySeconds: Number 容器启动完成后首次探测的时间，单位为s
      timeoutSeconds: Number  对容器健康检查的探测等待响应的超时时间设置，单位为s，默认值为1s。若超过该超时时间设置，则将认为该容器不健康，会重启该容器。
      periodSeconds: Number 对容器健康检查的定期探测时间设置，单位为s，默认10s探测一次
      successThreshold: 0
      failureThreshold: 0
    securityContext:
      privileged: Boolean
  restartPolicy: [Always | Never | OnFailure] Pod的重启策略 一旦终止运行，都将重启 | 终止后kubelet将报告给master，不会重启 | 只有Pod以非零退出码终止时，kubelet才会重启该容器。如果容器正常终止（退出码为0），则不会重启。
  nodeSelector: object 设置Node的Label，以key:value格式指定，Pod将被调度到具有这些Label的Node上
  imagePullSecrets: 【Object】 pull镜像时使用的Secret名称，以name:secretkey格式指定
  - name: String
  hostNetwork: Boolean 是否使用主机网络模式，默认值为false。设置为true表示容器使用宿主机网络，不再使用docker网桥，该Pod将无法在同一台宿主机上启动第二个副本
  volumes: 【List】 在该Pod上定义的共享存储卷列表
  - name: String 共享存储卷的名称，volume的类型有很多emptyDir，hostPath，secret，nfs，glusterfs，cephfs，configMap
    emptyDir: {} 【Object】 类型为emptyDir的存储卷，表示与Pod同生命周期的一个临时目录，其值为一个空对象：emptyDir: {}
    hostPath: 【Object】 类型为hostPath的存储卷，表示挂载Pod所在宿主机的目录
      path: String Pod所在主机的目录，将被用于容器中mount的目录
    secret: 【Object】类型为secret的存储卷，表示挂载集群预定义的secret对象到容器内部
      secretName: String
      items:
      - key: String
        path: String
    configMap: 【Object】 类型为configMap的存储卷，表示挂载集群预定义的configMap对象到容器内部
      name: String
      items:
      - key: String
        path: String
```
