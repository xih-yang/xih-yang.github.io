# 09、Kubernetes - 实战：k8s之Configmap和Secret
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/9.html
- 分类：容器服务
- 分组：教程目录
## 一、容器化应用配置

应用程序是可执行程序文件，它含有指令列表，CPU通过执行这些指令完成代码运行。例如，Linux工程师最常用的命令之一cat对应于/usr/bin/cat程序文件，该文件含有按特定目的组织的机器指令列表，用于在屏幕上显示指定文件的内容。大多数应用程序的行为都可以支持命令行选项及参数、环境变量或配置文件这一类的“配置工件”来按需定制，以灵活满足不同的使用需求。实践中，人们通常都不会以默认的配置参数运行应用程序，而是需要根据特定的环境或具体目标定制其运行特性，复杂的服务类应用程序尤其如此，例如Nginx、Tomcat或Envoy等，而且通过配置文件定义其配置通常是服务类应用首选甚至是唯一的途径。

## 1、容器化应用配置的常见方式

容器镜像一般由多个只读层叠加组成，构建完成后无法进行修改，另一方面，“黑盒化”运行的容器使用隔离的专用文件系统，那么，如何为容器化应用提供配置信息呢？传统实践中，通常有这么几种途径。

```java
▪启动容器时直接向应用程序传递参数。
▪将定义好的配置文件硬编码（嵌入）于镜像文件中。
▪通过环境变量传递配置数据。
▪基于存储卷传送配置文件。
```

### 1)命令行参数

Dockerfile中的ENTRYPOINT和CMD指令用于指定容器启动时要运行的程序及其相关的参数。其中，CMD指令以列表形式指定要运行的程序及其相关的参数，若同时存在ENTRYPOINT指令，则CMD指令中的列表所有元素均被视作由ENTRYPOINT指定程序的命令行参数。另外，在基于某镜像创建容器时，可以通过向ENTRYPOINT中的程序传递额外的自定义参数，甚至还可以修改要运行的应用程序本向。例如，使用docker run命令创建并启动容器的格式为：

```java
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

其中的[COMMAND]即为自定义运行的程序，[ARG]则是传递给程序的参数。若定义相关的镜像文件时使用了ENTRYPOINT指令，则[COMMAND]和[ARG]都会被当作命令行参数传递给ENTRYPOINT指令中指定的程序，除非为docker run命令额外使用--entrypoint选项覆盖ENTRYPOINT指令而指定运行其他程序。

在Kubernetes系统上创建Pod资源时，也能够向容器化应用传递命令行参数，甚至指定运行其他应用程序，相关的字段分别为pods.spec.containers[].command和pods.spec.containers[].args。

### 2)将配置文件嵌入镜像文件

所谓将配置文件嵌入镜像文件，是指用户在Dockerfile中使用COPY指令把定义好的配置文件复制到镜像文件系统上的目标位置，或者使用RUN指令调用sed或echo一类的命令修改配置文件，从而达到为容器化应用提供自定义配置文件之目的。这种方式的优势在于简单易用，用户无须任何额外的设定就能启动符合需求的容器。但配置文件相关的任何额外的修改需求都不得不通过重新构建镜像文件来实现，路径长且效率低。

### 3)通过环境变量向容器注入配置信息

通过环境变量为镜像提供配置信息是最常见的容器应用配置方式之一，例如使用MySQL官方提供的镜像文件启动MySQL容器时使用的MYSQL_ROOT_PASSWORD环境变量，它用于为MySQL服务器的root用户设置登录密码。在基于此类镜像启动容器时，通过docker run命令的-e选项向环境变量传值即能实现应用配置，命令的使用格式为docker run -e SETTING1=foo -e SETTING2=bar ... 。非云原生的应用程序容器化时通常会借助entrypoint启动脚本以在启动时获取到这些环境变量，并在启动容器应用之前，通过sed或echo等一类命令将变量值替换到配置文件中。一般说来，容器的entrypoint启动脚本应该为这些环境变量提供默认值，以便在用户未为环境变量传值时也能基于此类必需环境变量的镜像启动容器。使用环境变量这种配置方式的优势在于配置信息的动态化供给，不过有些应用程序的配置也可能会复杂到难以通过键值格式的环境变量完成。我们也可以让容器的entrypoint启动脚本通过网络中的键值存储系统获取配置参数，常用的该类存储系统有Consul或etcd等，它们能够支持多级嵌套的数据结构，因而能够提供较之环境变量更为复杂的配置信息。不过，这种方式为容器化应用引入了额外的依赖条件。Kubernetes系统支持在为Pod资源配置容器时使用spec.containers.env为容器的环境变量传值从而完成应用的配置。

### 4）通过存储卷向容器注入配置信息

Docker存储卷能够将宿主机之上的任何文件或目录映射进容器文件系统上，因此，可以事先将配置文件放置于宿主机之上的某特定路径中，而后在启动容器时进行加载。这种方式灵活易用，但也依赖于用户事先将配置数据提供在宿主机上的特定路径。而且在多主机模型中，若容器存在被调度至任一主机运行的可能性时，用户还需要将配置共享在任一宿主机以确保容器能正确获取到它们。Kubernetes系统把配置信息保存于标准的API资源ConfigMap和Secret中，Pod资源可通过抽象化的同名存储卷插件将相关的资源对象关联为存储卷，而后引用该存储卷上的数据赋值给环境变量，或者由容器直接挂载作为配置文件使用。ConfigMap和Secret资源是Kubernetes系统上配置Pod中容器应用最常用的方式。

## 2、容器环境变量

在运行时配置Docker容器中应用程序的第二种方式是在容器启动时向其传递环境变量。Docker原生的应用程序应该使用很小的配置文件，并且每一项参数都可由环境变量或命令行选项覆盖，从而能够在运行时完成任意的按需配置。然而，目前只有极少一部分应用程序是为容器环境原生设计，毕竟为容器原生重构应用程序工程浩大，且旷日持久。好在有利用容器启动脚本为应用程序预设运行环境的方法可用，通行的做法是在制作Docker镜像时，为ENTRYPOINT指令定义一个脚本，它能够在启动容器时将环境变量替换至应用程序的配置文件中，而后由此脚本启动相应的应用程序。基于这类镜像运行容器时，即可通过向环境变量传值的方式来配置应用程序。在Kubernetes中使用此类镜像启动容器时，也可以在Pod资源或pod模板资源的中定义，通过为容器配置段使用env参数来定义使用的环境变量列表。事实上，即便容器中的应用本身不处理环境变量，也一样可以向容器传递环境变量，只不过它不被使用罢了。通过环境变量配置容器化应用时，需要在容器配置段中嵌套使用env字段，它的值是一个由环境变量构建的列表。每个环境变量通常由name和value（或valueFrom）字段构成。

```java
▪name <string>：环境变量的名称，必选字段。
▪value <string>：环境变量的值，通过$(VAR_NAME)引用，逃逸格式为$$(VAR_NAME)默认值为空。
▪valueFrom <Object>：环境变量值的引用源，例如当前Pod资源的名称、名称空间、标签等，不能与非空值的value字段同时使用，即环境变量的值要么源于value字段，要么源于valueFrom字段，二者不可同时提供数据。
valueFrom字段可引用的值有多种来源，包括当前Pod资源的属性值，容器相关的系统资源配置、ConfigMap对象中的Key以及Secret对象中的Key，它们分别要使用不同的嵌套字段进行定义。
　　▪fieldRef <Object>：当前Pod资源的指定字段，目前支持使用的字段包括metadata.name、metadata.namespace、metadata.labels、metadata.annotations、spec.nodeName、spec.serviceAccountName、status.hostIP和status.podIP等。
　　▪configMapKeyRef <Object>：ConfigMap对象中的特定Key。
　　▪secretKeyRef <Object>：Secret对象中的特定Key。
　　▪resourceFieldRef <Object>：当前容器的特定系统资源的最小值（配额）或最大值（限额），目前支持的引用包括limits.cpu、limits.memory、limits.ephemeral-storage、requests.cpu、requests.memory和requests.ephemeral-storage。
```

下面是定义在资源清单文件env-demo.yaml中的Pod资源，它配置容器通过环境变量引用当前Pod资源及其所在的节点的相关属性值。fieldRef字段的值是一个对象，它一般由apiVersion（创建当前Pod资源的API版本）或fieldPath嵌套字段所定义。事实上讲述的downwardAPI的一种应用示例。

```java
apiVersion: v1
kind: Pod
metadata:
  name: env-demo
  labels:
    purpose: demonstrate-environment-variables
spec:
  containers:
  - name: env-demo-container
    image: busybox
    command: ["httpd"]
    args: ["-f"]
    env:
    - name: HEELO_WORLD
      value: just a demo
    - name: MY_NODE_NAME
      valueFrom:
        fieldRef:
          fieldPath: spec.nodeName
    - name: MY_NODE_IP
      valueFrom:
        fieldRef:
          fieldPath: status.hostIP
    - name: MY_POD_NAMESPACE
      valueFrom:
        fieldRef:
          fieldPath: metadata.namespace
  restartPolicy: OnFailure
```

创建上面资源清单中定义的Pod对象env-demo，而后打印它的环境变量列表，命令及其结果如下。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f env-demo.yaml 
pod/env-demo created
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec -it env-demo -- sh/ env
......
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=env-demo
HEELO_WORLD=just a demo
MY_NODE_NAME=k8s-node03
MY_NODE_IP=172.168.32.212
MY_POD_NAMESPACE=default
......
```

容器的启动脚本或应用程序调用或处理这些环境变量，即可实现容器化应用的配置。相较于命令行参数的方式来说，使用环境变量的配置方式清晰、易懂，尤其对首次使用相关容器的用户来说能快速了解容器的配置方式。不过，这两种配置方式有着一个共同的缺陷：无法在容器应用运行过程中更新环境变量从而达到更新应用的目的。这通常意味着用户不得不为production、development和stage等不同的环境分别配置Pod资源。

## 二、ConfigMap资源

ConfigMap资源用于在运行时将配置文件、命令行参数、环境变量、端口号以及其他配置工件绑定至Pod的容器和系统组件。Kubernetes借助于ConfigMap对象实现了将配置文件从容器镜像中解耦，从而增强了工作负载的可移植性，使配置更易于更改和管理，并防止将配置数据硬编码到Pod配置清单中。但ConfigMap资源用于存储和共享非敏感、未加密的配置信息，若要在集群中使用敏感信息，则必须使用Secret资源。简单来说，一个ConfigMap对象就是一系列配置数据的集合，这些数据可注入到Pod的容器当中为容器应用所使用，注入的途径有直接挂载存储卷和传递为环境变量两种。ConfigMap支持存储诸如单个属性一类的细粒度的信息，也可用于存储粗粒度的信息，例如将整个配置文件保存在ConfigMap对象之中。

## 1、创建ConfigMap对象

ConfigMap是Kubernetes标准的API资源类型，它隶属名称空间级别，支持命令式命令、命令式对象配置及声明式对象配置3种管理接口。命令式命令的创建操作可通过kubectl create configmap进行，它支持基于目录、文件或字面量（literal）值获取配置数据完成ConfigMap对象的创建。该命令的语法格式如下所示。

```java
kubectl create configmap <map-name> <data-source> -n <namespace>
```

命令中的就是可以通过直接给定的键值、文件或目录（内部的一到多个文件）来获取的配置数据来源，但无论是哪一种数据供给方式，配置数据都要转换为键值类型，其中的键由用户在命令行给出或是文件类型数据源的文件名，且仅能由字母、数字、连接号和点号组成，而值则是字面量值或文件数据源的内容。

### (1)字面量值数据源

为kubectl create configmap命令使用--from-literal选项可在命令行直接给出键值对来创建ConfigMap对象，重复使用此选项则可以一次传递多个键值对。命令格式如下：

```java
kubectl create configmap configmap_name --from-literal=key-1=value-1 …
```

例如，下面的命令创建demoapp-config时传递了两个键值对，一个是demoapp.host= 0.0.0.0，一个是demoapp.port=8080。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create configmap demo-config --from-literal=demoapp.host="0.0.0.0" --from-literal=demoapp.port="8080" -n default
configmap/demo-config created
root@k8s-master01:/apps/k8s-yaml/configmap## kubectl get configmap demo-config -o yaml
apiVersion: v1
data:
  demoapp.host: 0.0.0.0
  demoapp.port: "8080"
kind: ConfigMap
metadata:
  creationTimestamp: "2021-07-06T10:11:50Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:demoapp.host: {}
        f:demoapp.port: {}
    manager: kubectl-create
    operation: Update
    time: "2021-07-06T10:11:50Z"
  name: demo-config
  namespace: default
  resourceVersion: "7531093"
  uid: da82ac80-4db0-458a-83bf-8095e72a675e
```

显然，若要基于配置清单创建ConfigMap资源时，仅需要指定apiVersion、kind、metadata和data这4个字段，以类似上面的格式定义出相应的资源即可。

### (2)文件数据源

ConfigMap资源也可用于为应用程序提供大段配置，这些大段配置通常保存于一到多个文本编码的文件中，可由kubectl create configmap命令通过--from-file选项一次加载一个配置文件的内容为指定键的值，多个文件的加载可重复使用--from-file选项完成。命令格式如下，省略键名时，将默认使用指定的目标文件的基名。

```java
kubectl create configmap <configmap_name> --from-file[=<key-name>]=<path-to-file>
```

例如，下面的命令可以把事先准备好的Nginx配置文件模板保存于ConfigMap对象nginx-confs中，其中一个直接使用myserver.conf文件名作为键名，而另一个myserver-status.cfg对应的键名则自定义为status.cfg。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create configmap nginx-confs --from-file=./nginx-conf.d/myserver.conf --from-file=status.cfg=./nginx-conf.d/myserver-status.cfg --namespace='default'
```

可以从nginx-confs对象的配置清单来了解各键名及其相应的键值。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get configmap nginx-confs -o yaml
apiVersion: v1
data:
  status.cfg: |                “|”是键名及多行键值的分割符，多行键值要进行固定缩进
    location /nginx-status {   该缩进范围内的文本块即为多行键值
        stub_status on;
        access_log off;
    }
  myserver.conf: |
    server {
        listen 8080;
        server_name www.ik8s.io;
        include /etc/nginx/conf.d/myserver-*.cfg;
        location / {
            root /usr/share/nginx/html;
        }
    }
kind: ConfigMap
……
```

通过这种方式创建的ConfigMap资源可以直接以键值形式收纳应用程序的完整配置信息，各个文件的内容以键值的形式保存于专用的键名称之下。当需要配置清单保留ConfigMap资源的定义，而键数据又较为复杂时，也需要以类似上面命令输出结果中的格式，将配置文件内容直接定义在配置清单当中。

### (3)目录数据源

对于配置文件较多且又无须自定义键名称的场景，可以直接在kubectl create configmap命令的--from-file选项上附加一个目录路径就能将该目录下的所有文件创建于同一ConfigMap资源中，各文件名为即为键名。命令格式如下。

```java
kubectl create configmap <configmap_name> --from-file=<path-to-directory>
```

下面的命令把nginx-conf.d目录下的所有文件都保存于nginx-config-files对象中，从命令格式也不难揣测出，我们无法再为各文件内容自定义其键名称。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create configmap nginx-config-files --from-file=./nginx-conf.d/
```

此目录中包含myserver.conf、status.cfg和gzip.cfg这3个配置文件，它们会被分别存储为3个键值数据，如下面的命令及其结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl describe configmap nginx-config-files
Name:         nginx-config-files
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
myserver-gzip.cfg:      键值数据1，describe命令的输出中键和值使用“----”分割符
----
gzip on;
……
myserver.conf:          键值数据2
----
server {
    ……
}
myserver-status.cfg:    键值数据3
----
location /nginx-status {
    stub_status on;
    access_log off;
}
Events:  <none>
```

注意，describe命令和get -o yaml命令都可显示由文件创建而成的键与值，但二者使用的键和值之间的分隔符不同。另外需要说明的是，基于字面量值和基于文件创建的方式也可以混合使用。例如下面的命令创建demoapp-confs对象时，使用--from-file选项加载demoapp-conf.d目录下的所有文件（共有envoy.yaml和eds.conf两个），又同时使用了两次--from-literal选项分别以字面量值的方式定义了两个键值数据。

```java
kubectl create configmap demoapp-confs --from-file=./demoapp-conf.d/ --from-literal=demoapp.host='0.0.0.0' --from-literal=demoapp.port='8080'
```

该对象共有4个数据条目，它们分别是来自于demoapp-conf.d目录下的envoy.yaml和eds.conf，以及命令行直接给出的demoapp.host和demoapp.port，这可以从下面命令的结果中得以验证。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get configmaps/demoapp-confs
NAME           DATA    AGE
demoapp-confs   4      12s
```

### (4)ConfigMap资源配置清单

基于配置文件创建ConfigMap资源时，它所使用的字段包括通常的apiVersion、kind和metadata字段，以及用于存储数据的关键字段data。例如下面的示例所示。

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-demo
  namespace: default
data:
  host: 0.0.0.0
  port: '10080'
  app.config: |
    threads = 4
    connections = 1024
```

若键值来自文件内容，使用配置文件创建ConfigMap资源的便捷性远不如直接通过命令行进行创建，因此我们可先使用命令行加载文件或目录的方式进行创建，在创建完成后使用get -o yaml命令获取到相关信息后进行编辑留存。

## 2、 通过环境变量引用ConfigMap键值

Pod资源配置清单中，除了使用value字段直接给定变量值之外，容器环境变量的赋值还支持通过在valueFrom字段中嵌套configMapKeyRef来引用ConfigMap对象的键值，它的具体使用格式如下。

```java
env:
- name: <string>  要赋值的环境变量名
  valueFrom:      定义变量值引用
    configMapKeyRef: 变量值来自ConfigMap对象的每个指定键的值
      name: <string> ConfigMap对象名称
      key: <string>  键名称  
      optional: <boolean>指定的ConfigMap对象或者指定的键名称是否为可选
```

这种方式赋值的环境变量的使用方式与直接赋值的环境变量并无区别，它们都可用于容器的启动脚本或直接传递给容器应用等。下面是保存于配置文件configmaps-env-demo.yaml的资源定义示例，它包含了两个资源，彼此间使用“---”相分隔。第一个资源是名为demoapp-config的ConfigMap对象，它包含了两个键值数据；第二个资源是名为configmaps-env-demo的Pod对象，它在环境变量PORT和HOST中分别引用了demoapp-config对象中的demoapp.port和demoapp.host的键的值。

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: demoapp-config
  namespace: default
data:
  demoapp.port: '8080'
  demoapp.host: '0.0.0.0'
---
apiVersion: v1
kind: Pod
metadata:
  name: configmaps-env-demo
  namespace: default
spec:
  containers:
  - name: demoapp
    image: ikubernetes/demoapp:v1.0
    env:
    - name: PORT
      valueFrom:
        configMapKeyRef:
          name: demoapp-config
          key: demoapp.port
          optional: false
    - name: HOST
      valueFrom:
        configMapKeyRef:
          name: demoapp-config
          key: demoapp.host
          optional: true
```

demoapp支持通过环境变量HOST和PORT为其指定监听的地址与端口。将上面配置文件中的资源创建完成后，我们便可以来验证Pod资源监听的端口等配置信息是否为demoapp-config对象中定义的内容，如下面的命令及结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f configmaps-env-demo.yaml 
configmap/demoapp-config created
pod/configmaps-env-demo created
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec configmaps-env-demo -- netstat -tnl
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       
tcp        0      0 0.0.0.0:8080            0.0.0.0:*               LISTEN
```

需要注意的是，被引用的ConfigMap资源必须事先存在，否则将无法在Pod对象中启动引用了ConfigMap对象的容器，但未引用或不存在ConfigMap资源的容器将不受影响。另外，ConfigMap是名称空间级别的资源，它必须与引用它的Pod资源在同一空间内。

```java
提示：在容器清单中的command或args字段中引用环境变量要使用$(VAR_NAME)的格式。
```

若ConfigMap资源中存在较多的键值数据，而且其大部分甚至是全部键值数据都需要由容器进行引用时，为容器逐一配置相应的环境变量将是一件颇为劳心费神之事，而且极易出错。对此，Pod资源支持在容器中使用envFrom字段直接将ConfigMap资源中的所有键值一次性地导入。

```java
envFrom: 
- prefix <string>        为引用的ConfigMap对象中的所有变量添加一个前缀名
  configMapRef:          定义引用的ConfigMap对象
    name <string>        ConfigMap对象的名称
    optional <boolean>   该ConfigMap对象是否为可选
```

envFrom字段值是对象列表，用于同时从多个ConfigMap对象导入键值数据。为了避免从多个ConfigMap引用键值数据时产生键名冲突，可以为每个引用中将被导入的键使用prefix字段指定一个特定的前缀，例如HTCFG_一类的字符串，于是ConfigMap对象中的PORT键名将成为容器中名为HTCFG_PORT的变量。

```java
注意：如果键名中使用了连字符“-”，转换为变量名的过程会自动将其替换为下划线“_”。
```

例如，把上面示例中的配置清单转为如下形式的定义（configmap-envfrom-demo.yaml配置文件）后，引用ConfigMap进行配置的效果并无不同。

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: demoapp-config-for-envfrom
  namespace: default
data: 
  PORT: "8080"
  HOST: 0.0.0.0
---
apiVersion: v1
kind: Pod
metadata:
  name: configmaps-envfrom-demo
  namespace: default
spec:
  containers:
  - image: ikubernetes/demoapp:v1.0
    name: demoapp
    envFrom:
    - configMapRef:
        name: demoapp-config-for-envfrom
        optional: false
```

由envFrom从ConfigMap对象一次性引入环境变量时无法自定义每个环境变量的名称，因此，ConfigMap对象中的键名称必须要与容器中的应用程序引用的变量名保持一致。待Pod资源创建完成后，可通过查看其环境变量验证其导入的结果。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f configmap-envfrom-demo.yaml 
configmap/demoapp-config-envfrom created
pod/configmaps-envfrom-demo created
```

由envFrom从ConfigMap对象一次性引入环境变量时无法自定义每个环境变量的名称，因此，ConfigMap对象中的键名称必须要与容器中的应用程序引用的变量名保持一致。待Pod资源创建完成后，可通过查看其环境变量验证其导入的结果。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec configmaps-envfrom-demo -- printenv | egrep '^(PORT|HOST)\b'
HOST=0.0.0.0
PORT=8080
```

从ConfigMap对象导入环境变量时若省略了可选的prefix字段，各变量名将直接引用ConfigMap资源中的键名。若不存在键名冲突的可能性，例如从单个ConfigMap对象导入变量或在ConfigMap对象中定义键名时已添加了特定前缀时，省略前缀的定义既不会导致键名冲突，又能保持变量的简洁。

## 3、ConfigMap存储卷

使用环境变量导入ConfigMap对象中来源于较长的内容文件的键值会导致占据过多的内存空间，而考虑此类数据通常用于为容器应用提供配置文件，将其内容直接以文件格式进行引用是为了更好地选择。Pod资源的configMap存储卷插件专用于以存储卷形式引用ConfigMap对象，其键值数据是容器中的ConfigMap存储卷挂载点路径或直接指向的配置文件。

### 1）挂载整个存储卷

基于ConfigMap存储卷插件关联至Pod资源上的ConfigMap对象可由内部的容器挂载为一个目录，该ConfigMap对象的每个键名将转为容器挂载点路径下的一个文件名，键值则映射为相应文件的内容。显然，挂载点路径应该以容器加载配置文件的目录为其名称，每个键名也应该有意设计为对应容器应用加载的配置文件名称。在Pod资源上以存储卷方式引用ConfigMap对象的方法非常简单，仅需要指明存储卷名称及要引用的ConfigMap对象名称即可。下面是在配置文件configmaps-volume-demo.yaml中定义的Pod资源，它引用了前面创建的ConfigMap对象nginx-config-files，并由nginx-server容器挂载至Nginx加载配置文件模块的目录/etc/nginx/conf.d之下。

```java
apiVersion: v1
kind: Pod
metadata:
  name: configmaps-volume-demo
  namespace: default
spec:
  containers:
  - image: nginx:alpine
    name: nginx-server
    volumeMounts:
    - name: ngxconfs
      mountPath: /etc/nginx/conf.d/
      readOnly: true
  volumes:
  - name: ngxconfs
    configMap:
      name: nginx-config-files
      optional: false
```

此Pod资源引用的nginx-config-files中包含3个配置文件，其中myserver.conf定义了一个虚拟主机[www.ik8s.io](https://www.cnblogs.com/yaokaka/p/www.ik8s.io)，并通过include指令包含/etc/nginx/conf.d/目录下以myserver-为前缀、以.cfg为后缀的所有配置文件，例如在nginx-config-files中包含的myserver-status.cfg和myserver-gzip.cfg，如图所示。

创建此Pod资源后，在Kubernetes集群中的某节点直接向Pod IP的8080端口发起访问请求，即可验证由nginx-config-files资源提供的配置信息是否生效，例如通过/nginx-status访问其内置的stub status。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# POD_IP=$(kubectl get pods configmaps-volume-demo -o go-template={{.status.podIP}})
root@k8s-master01:/apps/k8s-yaml/configmap# curl http://${POD_IP}:8080/nginx-status
Active connections: 1
server accepts handled requests
 1 1 1
Reading: 0 Writing: 1 Waiting: 0
```

当然，我们也可以直接于Pod资源configmaps-volume-demo之上的相应容器中执行命令来确认文件是否存在于挂载点目录中：

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec configmaps-volume-demo -- ls /etc/nginx/conf.d/
myserver-gzip.cfg
myserver-status.cfg
myserver.conf
```

我们还可以在容器中运行其他命令来进一步测试由ConfigMap对象提供的配置信息是否已生效，以示例中的Nginx为例，我们可运行如下的配置测试与打印命令进行配置信息的生效确认。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec  configmaps-volume-demo -- nginx -T
……
# configuration file /etc/nginx/conf.d/myserver.conf:
server {
    listen 8080;
    server_name www.ik8s.io;
    ……
}
# configuration file /etc/nginx/conf.d/myserver-gzip.cfg:
……
# configuration file /etc/nginx/conf.d/myserver-status.cfg:
……
```

由上面两个命令的结果可见，nginx-config-files中的3个文件都被添加到了容器中，并且实现了由容器应用Nginx加载并生效。

### 2) 挂载存储卷中的部分键值

有些应用场景中，用户很可能期望仅向容器中的挂载点暴露Pod资源关联的ConfigMap对象上的部署键值，这在通过一个ConfigMap对象为单个Pod资源中的多个容器分别提供配置时尤其常见。例如前面曾创建了一个名为demoapp-confs的ConfigMap对象，它包含有4个键值，其中的envoy.yaml和eds.conf可为envoy代理提供配置文件，而demoapp.port能够为demoapp（通过环境变量）定义监听的端口。下面配置清单示例定义的Pod资源中定义了两个容器，envoy和demoapp，demoapp-confs为envoy容器提供两个配置文件，为demoapp容器提供了一个配置参数。

```java
apiVersion: v1
kind: Pod
metadata:
  name: configmaps-volume-demo2
  namespace: default
spec:
  containers:
  - name: proxy
    image: envoyproxy/envoy-alpine:v1.14.1
    volumeMounts:
    - name: appconfs
      mountPath: /etc/envoy
      readOnly: true
  - name: demo
    image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    env:
    - name: PORT
      valueFrom:
        configMapKeyRef:
          name: demoapp-confs
          key: demoapp.port
          optional: false
  volumes:
  - name: appconfs
    configMap:    存储卷插件类型
      name: demoapp-confs
      items:      要暴露的键值数据
      - key: envoy.yaml
        path: envoy.yaml
        mode: 0644
      - key: lds.conf
        path: lds.conf
        mode: 0644
      optional: false
```

configMap卷插件中的items字段的值是一个对象列表，可嵌套使用3个字段来组合指定要引用的特定键。

```java
▪key <string>：要引用的键名称，必选字段。
▪path <string>：对应的键在挂载点目录中映射的文件名称，它可不同于键名称，必选字段。
▪mode <integer>：文件的权限模型，可用范围为0～0777。
```

上面的配置示例（configmap-volume-demo2.yaml）中，把envoy.yaml和eds.conf两个键名分别映射为/etc/envoy目录下的两个与键同名的文件，且均使用0644的权限。

### 3)独立挂载存储卷中的单个键值

前面的两种方式中，无论是装载ConfigMap对象中的所有还是部分文件，挂载点目录下原有的文件都会被隐藏。对于期望将ConfigMap对象提供的配置文件补充在挂载点目录下的需求来说，这种方式显然难以如愿。以Nginx应用为例，基于nginx:alpine启动的容器的/etc/nginx/conf.d目录中原本就存在一些文件（例如default.conf等），有时候我们需要把nginx-config-files这个ConfigMap对象中的全部或部分文件装载进此目录中而不影响其原有的文件。事实上，此种需求可以通过在容器上的volumeMounts字段中使用subPath字段来解决，该字段用于支持从存储卷挂载单个文件或单个目录而非整个存储卷。例如，下面的示例就单独挂载了两个文件在/etc/nginx/conf.d目录中，但保留了目录下原有的文件。

```java
apiVersion: v1
kind: Pod
metadata:
  name: configmaps-volume-demo3
  namespace: default
spec:
  containers:
  - image: nginx:alpine
    name: nginx-server
    volumeMounts:
    - name: ngxconfs
      mountPath: /etc/nginx/conf.d/myserver.conf
      subPath: myserver.conf
      readOnly: true
    - name: ngxconfs
      mountPath: /etc/nginx/conf.d/myserver-gzip.cfg
      subPath: myserver-gzip.cfg
      readOnly: true
  volumes:
  - name: ngxconfs
    configMap:
      name: nginx-config-files
```

接下来也可将该Pod资源创建于集群上，验证myserver主机的配置，正常情况下，它应该启动了页面压缩功能，但因未装载myserver-status.cfg配置而不支持内置的status页面。

## 4、容器应用重载新配置

相较于环境变量来说，使用ConfigMap资源为容器应用提供配置的优势之一在于支持容器应用动态更新其配置：用户直接更新ConfigMap对象，而后由相关Pod对象的容器应用重载其配置文件即可。挂载有ConfigMap存储卷的容器上，挂载点目录中的文件都是符号链接，它们指向了挂载点目录中名为..data隐藏属性的子目录，而..data自身也是一个符号链接，它指向了名字形如..2020_05_15_03_34_10.435155001这样的以挂载操作时的时间戳命名的临时隐藏目录，该目录才是存储卷的真正挂载点。例如，查看Pod对象configmaps-volume-demo的容器中的挂载点目录下的文件列表，它将显示出类似如下结果。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec -it configmaps-volume-demo -- ls -lA /etc/nginx/conf.d
total 0
drwxr-xr-x   2 root   root   79 Apr 14 03:34 ..2020_05_15_03_34_10.435155001
lrwxrwxrwx   1 root   root   31 Apr 14 03:34 ..data -> ..2020_05_15_03_34_10.435155001
lrwxrwxrwx   1 root   root   24 Apr 14 03:34 myserver-gzip.cfg -> ..data/myserver-gzip.cfg
lrwxrwxrwx   1 root   root   26 Apr 14 03:34 myserver-status.cfg -> ..data/myserver-status.cfg
lrwxrwxrwx   1 root   root   20 Apr 14 03:34 myserver.conf -> ..data/myserver.conf
```

这种两级符号链接设定的好处在于，当引用的ConfigMap对象中的数据发生改变时，它将被重新挂载至一个以当前时间戳命名的新的临时目录下，而后将..data指向这个新的挂载点便达到了同时更新存储卷上所有文件数据的目的。例如，使用kubectl edit cm命令直接在ConfigMap对象nginx-config-files中的myserver-status.cfg配置段增加“allow 127.0.0.0/8;”和“deny all;”两行，稍等片刻之后再次查看configmap-volume-demo中容器挂载点目录中的文件列表，结果是其挂载点已经指向新的位置，例如下面的命令及其结果所示。

```java
[root@k8s-master01 configmap_sevret]#  kubectl edit configmaps/nginx-config-files -n default
……
data:
  ……
  myserver-status.cfg: |
    location /nginx-status {
        stub_status on;
        access_log off;
        allow 127.0.0.0/8;
        deny all;
    }
……
root@k8s-master01:/apps/k8s-yaml/configmap#  kubectl exec -it configmaps-volume-demo -- ls -lA /etc/nginx/conf.d
total 0
drwxr-xr-x   2 root   root   79 Apr 14 03:45 ..2020_05_15_03_45_25.239510550
lrwxrwxrwx   1 root   root   31 Apr 14 03:45 ..data -> ..2020_05_15_03_45_25.239510550
lrwxrwxrwx   1 root   root   24 Apr 14 03:34 myserver-gzip.cfg -> ..data/myserver-gzip.cfg
lrwxrwxrwx   1 root   root   26 Apr 14 03:34 myserver-status.cfg -> ..data/myserver-status.cfg
lrwxrwxrwx   1 root   root   20 Apr 14 03:34 myserver.conf -> ..data/myserver.conf
```

ConfigMap对象中的数据更新同步至应用容器后并不能直接触发生效新配置，还需要在容器上执行应用重载操作。例如Nginx可通过其nginx -s reload命令完成配置文件重载，如下面的命令所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec configmaps-volume-demo -- nginx -s reload
2020/05/15 03:52:50 [notice] 32#32: signal process started
```

新增的两行配置信息对/nginx-status这个URL施加了访问控制机制，它仅允许来自本地回环接口上的访问请求，因而此容器之外访问/nginx-status页面的请求将会被拒绝。对于不支持配置文件重载操作的容器应用来说，仅那些在ConfigMap对象更新后创建的Pod资源中的容器会应用到新配置，因此手动重启旧有的容器之前会存在配置不一致的问题。即使对于支持重载操作的应用来说，由于新的配置信息并非同步推送进所有容器中，而且在各容器中进行的手动重载操作也未必能同时进行，因此在更新时，短时间内仍然会存在配置不一致的现象。还有，以单个文件形式独立挂载ConfigMap存储卷中的容器并未采用两级链接的方式进行文件映射，因此存储卷无法确保所有挂载的文件可以被同时更新至容器中。为了确保配置信息的一致性，目前这种类型的挂载不支持文件更新操作。有些云原生应用支持配置更新时的自动重载功能，例如Envoy支持基于XDS协议订阅文件系统上的配置文件，并在该类配置文件更新时间戳发生变动时自动重载配置。然而，采用联合挂载多层叠加且进行写时复制的容器隔离文件系统来说，这种时间戳的更新未必能够触发内核中的通知机制，也就难以触发应用程序的自动重载功能。总结起来，在Pod资源中调用ConfigMap对象时要注意以下几个问题。

```java
▪以存储卷方式引用的ConfigMap对象必须先于Pod对象存在，除非在Pod对象中把它们统统标记为optional，否则将会导致Pod无法正常启动；同样，即使ConfigMap对象存在，但引用的键名不存在时，也会导致同样的错误。
▪以环境变量方式引用的ConfigMap对象的键不存在时会被忽略，Pod对象可以正常启动，但错误引用的信息会以InvalidVariableNames事件记录于日志中。
▪ConfigMap对象是名称空间级的资源，能够引用它的Pod对象必须位于同一名称空间。
▪Kubelet仅支持那些由API Server管理的Pod资源来引用ConfigMap对象，因而那些由kubelet在节点上通过--manifest-url或--config选项加载配置清单创建的静态Pod，以及由用户直接通过kubelet的RESTful API创建的Pod对象。
ConfigMap无法替代配置文件，它仅在Kubernetes系统上代表对应用程序配置文件的引用，我们可以将它类比为在Linux主机上表示/etc目录及内部文件的一种方法。
```

ConfigMap无法替代配置文件，它仅在Kubernetes系统上代表对应用程序配置文件的引用，我们可以将它类比为在Linux主机上表示/etc目录及内部文件的一种方法。

## 三、Sercet资源

出于增强可移植性的需求，我们应该从容器镜像中解耦的不仅有配置数据，还有默认口令（例如Redis或MySQL服务的访问口令）、用于SSL通信时的数字证书和私钥、用于认证的令牌和ssh key等，但这些敏感数据不宜存储于ConfigMap资源中，而是要使用另一种称为Secret的资源类型。将敏感数据存储在Secret中比明文存储在ConfigMap或Pod配置清单中更加安全。借助Secret，我们可以控制敏感数据的使用方式，并降低将数据暴露给未经授权用户的风险。Secret对象存储数据的机制及使用方式都类似于ConfigMap对象，它们以键值方式存储数据，在Pod资源中通过环境变量或存储卷进行数据访问。不同的地方在于，Secret对象仅会被分发至调用了该对象的Pod资源所在的工作节点，且仅支持由节点将其临时存储于内存中。另外，Secret对象的数据存储及打印格式为Base64编码的字符串而非明文字符，用户在创建Secret对象时需要事先手动完成数据的格式转换。但在容器中以环境变量或存储卷的方式访问时，它们会被自动解码为明文数据。

```java
注意：Base64编码并非加密机制，其编码的数据可使用base64 --decode一类的命令进行解码。
```

Secret对象以非加密格式存储于etcd中，管理员必须精心管控对etcd服务的访问以确保敏感数据的机密性，包括借助于TLS协议确保etcd集群节点间以及API Server间的加密通信和双向身份认证等。此外还要精心组织Kubernetes API Server服务的访问认证和授权，因为拥有创建Pod资源的用户都可以使用Secret资源并能够通过Pod对象中的容器访问其数据。目前，Secret资源主要有两种用途：一是作为存储卷注入Pod对象上，供容器应用程序使用；二是用于kubelet为Pod里的容器拉取镜像时向私有仓库提供认证信息。不过，后面使用ServiceAccount资源自建的Secret对象是一种更安全的方式。

## 1、创建Secret资源

类似于Config Map资源，创建Secret对象时也支持使用诸如字面量值、文件或目录等数据源，而根据其存储格式及用途的不同，Secret对象还会划分为如下3种类别。

```java
▪generic：基于本地文件、目录或字面量值创建的Secret，一般用来存储密码、密钥、信息、证书等数据。
▪docker-registry：用于认证到Docker Registry的Secret，以使用私有容器镜像。
▪tls：基于指定的公钥/私钥对创建TLS Secret，专用于TLS通信中；指定公钥和私钥必须事先存在，公钥证书必须采用PEM编码，且应该与指定的私钥相匹配。
```

这些类别也体现在kubectl create secret generic|docker-registry|tls命令之中，每个类别代表一个子命令，并分别有着各自专用的命令行选项。

### 1）通用Secret

通用类型的Secret资源用于保存除用于TLS通信之外的证书和私钥，以及专用于认证到Docker注册表服务之外的敏感信息，包括访问服务的用户名和口令、SSH密钥、OAuth令牌、CephX协议的认证密钥等。使用Secret为容器中运行的服务提供用于认证的用户名和口令是一种较为常见的应用场景，以MySQL或PostgreSQL代表的开源关系型数据库系统的镜像就支持通过环境变量来设置管理员用户的默认密码。此类Secret对象可以直接使用kubectl create secret generic  --from-literal=key=value命令，以给定的字面量值直接进行创建，通常用户名要使用username为键名，而密码则要使用password为键名。例如下面的命令，以root/iLinux分别为用户名和密码创建了一个名为mysql-root-authn的Secret对象：

```java
$ kubectl create secret generic mysql-root-authn --from-literal=username=root --from-literal=password=iLinux
```

由下面获取Secret对象资源规范的命令及其输出结果可以看出：未指定类型时，以generic子命令创建的Secret对象是Opaque类型，其键值数据会以Base64编码格式保存和打印。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create secret generic mysql-root-auth --from-literal=username=root --from-literal=passwd=iLinux
secret/mysql-root-auth created
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secrets 
NAME                  TYPE                                  DATA   AGE
default-token-9qx6x   kubernetes.io/service-account-token   3      44d
mysql-root-auth       Opaque                                2      6s
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secrets mysql-root-auth -o yaml
apiVersion: v1
data:
  passwd: aUxpbnV4
  username: cm9vdA==
kind: Secret
metadata:
  ......
    time: "2021-07-06T12:50:20Z"
  name: mysql-root-auth
  namespace: default
  resourceVersion: "7554065"
  uid: e0cf14e7-1f25-4415-9626-5eb69708643b
type: Opaque
```

但Kubernetes系统Secret对象的Base64编码数据并非加密格式，许多相关的工具程序可轻松完成解码，例如将上面命令结果中的password字段的值可交由下面所示的Base64命令进行解码。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# echo aUxpbnV4 | base64 -d
iLinux
```

将用户名和密码用于Basic认证时，需要在创建命令中额外使用--type选项明确定义Secret对象的类型，该选项值固定为"kubernetes.io/basic-auth"，并要求用户名和密码各自的键名必须为username和password，如下面Secret对象的创建和显示命令结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create secret generic web-basic-authn --from-literal=username=ops --from-literal=password=iK8S --type="kubernetes.io/basic-auth"
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secrets/mysql-ops-authn
NAME                         TYPE            DATA   AGE
web-basic-authn   kubernetes.io/basic-auth   2      1m
```

有些应用场景仅需要在Secret中保存密钥信息即可，用户名能够以明文的形式由客户端直接提供而无须保存于Secret对象中。例如，在Pod或PV资源上使用的RBD存储卷插件以CephX协议认证到Ceph存储集群时，使用内嵌的user字段指定用户名，以secretRef字段引用保存有密钥的Secret对象，且创建该类型的Secret对象需要明确指定类型为kubernetes.io/rbd，如下面的命令所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create secret generic ceph-kube-secret --type="kubernetes.io/rbd" --from-literal=key='AQB9+4teoywxFxAAr2d63xPmV3Yl/E2ohfgOxA=='
#AQB9+4teoywxFxAAr2d63xPmV3Yl/E2ohfgOxA==为base64编码后的结果
```

对于文件中的敏感数据，可以在命令上使用--from-file选项以直接将该文件作为数据源，例如创建用于SSH认证的Secret对象时就可以直接从认证的私钥文件加载认证信息，其键名需要使用ssh-privatekey，而类型标识为kubernetes.io/ssh-auth。下面的命令先创建出一对用于测试的认证密钥，而后将其私钥创建为Secret对象。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# ssh-keygen -t rsa -P "" -f  ${HOME}/.ssh/id_rsa
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create secret generic ssh-key-secret --from-file=ssh-privatekey=${HOME}/.ssh/id_rsa --type="kubernetes.io/ssh-auth"
```

Kubernetes系统上还有一种专用于保存ServiceAccount认证令牌的Secret对象，它存储有Kubernetes集群的私有CA的证书（ca.crt）以及当前Service账号的名称空间和认证令牌。该类资源以kubernetes.io/service-account-token为类型标识，并附加专用资源注解kubernetes.io/service-account.name和kubernetes.io/service-account.uid来指定所属的ServiceAccount账号名称及ID信息。kube-system名称空间中默认存在许多该类型的Secret对象，下面的第一个命令先获取到以node-controller开头的Secret资源（ServiceAccount/node-controller资源的专用Secret）的名称，而后第二个命令以YAML格式打印该资源的详细规范。下面命令用于打印kube-system名称空间下的Secret/node-controller资源对象的信息。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secrets -n kube-system | awk '/^node-controller/{print $1}'
node-controller-token-rmbnl
root@k8s-master01:/apps/k8s-yaml/configmap# secret_name=$(kubectl get secrets -n kube-system | awk '/^node-controller/{print $1}')
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secrets $secret_name -o yaml -n kube-system
apiVersion: v1
data:
  ca.crt:......
  namespace: a3ViZS1zeXN0ZW0=
  token:......
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: node-controller
    kubernetes.io/service-account.uid: 0de8feef-7e8d-4315-ad0a-95be7ba9c259
  name: node-controller-token-rmbnl
  namespace: kube-system
  ......
  type: kubernetes.io/service-account-token
```

还有一种专用于Kubernetes集群自动引导（bootstrap）过程的Secret类型，最早由kubeam引入，类型标识为bootstrap.kubernetes.io/token，它需要由auth-extra-groups、description、token-id和token-secret等专用键名来指定所需的数据。由kubeadm部署的集群上，会在kube-system名称空间中默认生成一个以bootstrap-token为前缀的该类Secret对象。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# bs_name=$(kubectl get secrets -n kube-system | awk '/^bootstrap-token/{print $1}')
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secret $bs_name -o yaml -n kube-system
apiVersion: v1
data:
  auth-extra-groups: ……
  description: ……
  token-id: ZG5hY3Y3
  token-secret: YjE1MjAzcm55ODV2ZW5kdw==
  usage-bootstrap-authentication: dHJ1ZQ==
  usage-bootstrap-signing: dHJ1ZQ==
kind: Secret
metadata:
  name: bootstrap-token-dnacv7
  namespace: kube-system
  ……
type: bootstrap.kubernetes.io/token
```

以配置清单创建以上各种类型的通用Secret对象，除Opaque外，都需要使用type字段明确指定类型，并在data字段中嵌套使用符合要求的字段指定所需要数据。

### 2) TLS Secret

为TLS通信场景提供专用数字证书和私钥信息的Secret对象有其专用的TLS子命令，以及专用的选项--cert和--key。例如，为运行于Pod中的Nginx应用创建SSL虚拟主机之时，需要事先通过Secret对象向相应容器注入服务证书和配对的私钥信息，以供nginx进程加载使用。出于测试的目的，我们先使用类似如下命令生成私钥和自签证书。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# openssl rand -writerand $HOME/.rnd
root@k8s-master01:/apps/k8s-yaml/configmap# (umask 077; openssl genrsa -out nginx.key 2048)
root@k8s-master01:/apps/k8s-yaml/configmap# openssl req -new -x509 -key nginx.key -out nginx.crt -subj /C=CN/ST=Beijing/L=Beijing/O=DevOps/CN=www.ilinux.io
```

而后即可使用如下命令将这两个文件创建为secret对象。需要注意的是，无论用户提供的证书和私钥文件使用什么名称，它们一律会分别转换为以tls.key（私钥）和tls.crt（证书）为其键名。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create secret tls nginx-ssl-secret --key=./nginx.key --cert=./nginx.crt
secret "nginx-ssl-secret" created
```

该类型的Secret对象的类型标识符为kubernetes.io/tls，例如下面命令结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secret nginx-ssl -o yaml
apiVersion: v1
data:
  tls.crt: ……
  tls.key: ……
kind: Secret
metadata:
  name: nginx-ssl-secret
  namespace: default
  ……
type: kubernetes.io/tls
```

### 3)Docker Registry Secret

当Pod配置清单中定义容器时指定要使用的镜像来自私有仓库时，需要先认证到目标Registry以下载指定的镜像，pod.spec.imagePullSecrets字段指定认证Registry时使用的、保存有相关认证信息的Secret对象，以辅助kubelet从需要认证的私有镜像仓库获取镜像。该字段的值是一个列表对象，它支持指定多个不同的Secret对象以认证到不同的Resgistry，这在多容器Pod中尤为有用。创建这种专用于认证到镜像Registry的Secret对象有其专用的docker-registry子命令。通常，认证到Registry的过程需要向kubelet提供Registry服务器地址、用户名和密码，以及用户的E-mail信息，因此docker-registry子命令需要同时使用以下4个选项。

```java
▪--docker-server：Docker Registry服务器的地址，默认为https://index.docker.io/v1/。
▪--docker-user：请求Registry服务时使用的用户名。
▪--docker-password：请求访问Registry服务的用户密码。
▪--docker-email：请求访问Registry服务的用户E-mail。
```

这4个选项指定的内容分别对应使用docker login命令进行交互式认证时所使用的认证信息，下面的命令创建了名为local-registry的docker-registry Secret对象。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create secret docker-registry local-registry --docker-username=Ops --docker-password=Opspass --docker-email=ops@ilinux.io
```

该类secret对象打印的类型信息为kubernetes.io/dockerconfigjson，如下面的命令结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secrets local-registry
NAME             TYPE               DATA    AGE
local-registry   kubernetes.io/dockerconfigjson   1         7s
```

另外，创建docker-registry Secret对象时依赖的认证信息也可使用--from-file选项从dockercfg配置文件（例如~/.dockercfg）或JSON格式的Docker配置文件（例如~/.docker/config.json）中加载，但前者的类型标识为kubernetes.io/dockercfg，后者的类型则与前面使用字面量值的创建方式相同。在Pod资源上使用docker-registry Secret对象的方法有两种。一种方法是使用spec.imagePullSecrets字段直接引用；另一种是将docker-registry Secret对象添加到某特定的ServiceAccount对象之上，而后配置Pod资源通过spec. serviceAccountName来引用该服务账号。第二种方法的实现我们放在ServiceAccount资源的相关话题中进行介绍，这里先以下面的示例说明第一种方法的用法。

```java
apiVersion: v1
kind: Pod
metadata:
  name: secret-imagepull-demo
  namespace: default
spec:
  imagePullSecrets:
  - name: local-registry
  containers:
  - image: registry.ilinux.io/dev/myimage
    name: demoapp
```

上面的配置清单仅是一个示例，付诸运行时，需要由读者将引用的Secret对象中的内容及清单资源的镜像等修改为实际可用的信息。当运行的多数容器镜像均来自私有仓库时，为每个Pod资源在imagePullSecrets显式定义一或多个引用的Secret对象实在不是一个好主意，我们应该将docker-registry Secret对象的引用定义在一个特定的ServiceAccount之上，而后由各相关的Pod资源进行引用才是更好的选择。

### 4)、Secret资源清单

Secret资源是标准的Kubernetes API资源类型之一，但它仅是存储于API Server上的数据定义，无须区别期望状态与现实状态，无须使用spec和status字段。除了apiVersion、kind和metadata字段，它可用的其他字段如下。

```java
▪data <map[string]string>：key:value格式的数据，通常是敏感信息，数据格式需是以Base64格式编码的字符串，因此需要用户事先完成编码。另外，不同类型的Secret资源要求使用的嵌套字段（键名）也不尽相同，甚至ServiceAccount专用类型的Secret对象还要求使用专用的注解信息。
▪stringData <map[string]string>：以明文格式（非Base64编码）定义的键值数据。无须用户事先对数据进行Base64编码，而是在创建为Secret对象时自动进行编码并保存于data字段中。stringData字段中的明文不会被API Server输出，但使用kubectl apply命令进行创建的Secret对象，其注解信息可能会直接输出这些信息。
▪type <string>：仅为了便于编程处理Secret数据而提供的类型标识。
```

下面是保存于配置文件secrets-demo.yaml中的Secret资源定义示例，它使用stringData提供了明文格式的键–值数据，从而免去了事先手动编码的麻烦。

```java
apiVersion: v1
kind: Secret
metadata:
  name: secrets-demo
stringData:
  username: redis
  password: redisp@ss
type: Opaque
```

为保存于配置清单文件中的敏感信息创建Secret对象时，用户需要先将敏感信息读出并转换为Base64编码格式，再将其创建为清单文件，过程烦琐，反而不如命令式创建来得便捷。不过，如果存在多次创建或者重构之需，将其保存为配置清单也是情势所需。

## 2、使用Secret资源

类似于Pod资源使用ConfigMap对象的方式，Secret对象可以注入为容器环境变量，也能够通过Secret卷插件定义为存储卷并由容器挂载使用。但是，容器应用通常会在发生错误时将所有环境变量保存于日志信息中，甚至有些应用在启动时会将运行环境打印到日志中。另外，容器应用调用第三方程序为子进程时，这些子进程能够继承并使用父进程的所有环境变量。这都有可能导致敏感信息泄露，因而通常仅在必要的情况下才使用环境变量引用Secret对象中的数据。

### 1）环境变量

Pod资源以环境变量方式消费Secret对象也存在两种途径：

①一对一地将指定键的值传递给指定的环境变量；

②将Secret对象上的全部键名和键值一次性全部映射为容器的环境变量。前者在容器上使用env.valueFrom字段进行定义，而后者则直接使用envFrom字段，如下面给出的详细配置格式所示。

```java
containers:
- name: …
  image: …
  env:
  - name: <string>           变量名，其值来自某Secret对象上的指定键的值
    valueFrom:               键值引用
      secretKeyRef:       
        name: <string>       引用的Secret对象的名称，需要与该Pod位于同一名称空间
        key: <string>        引用的Secret对象上的键，其值将传递给环境变量
        optional: <boolean>  是否为可选引用
  envFrom:                   整体引用指定的Secret对象的全部键名和键值
  - prefix: <string>         将所有键名引用为环境变量时统一添加的前缀
    secretRef:        
      name: <string>         引用的Secret对象名称
      optional: <boolean>    是否为可选引用
```

下面Pod资源配置清单（secrets-env-demo.yaml）示例中，容器mariadb运行时初始化root用户的密码，引用自此前创建的Secret对象mysql-root-authn中的password键的值。

```java
apiVersion: v1
kind: Pod
metadata:
  name: secrets-env-demo
  namespace: default
spec:
  containers:
  - name: mariadb
    image: mariadb
    imagePullPolicy: IfNotPresent
    env:
    - name: MYSQL_ROOT_PASSWORD
      valueFrom:
        secretKeyRef:
          name: mysql-root-authn
          key: password
```

mariadb的镜像并不支持从某个文件中加载管理员root用户的初始密码，这里也就只能使用环境变量赋值的方式来引用Secret对象中的敏感数据。下面完成测试步骤，首先将清单中的Pod对象创建在集群上：

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f secrets-env-demo.yaml 
pod/secrets-env-demo created
```

而后使用保存在mysql-root-authn对象中的password字段的值iLinux作为密码进行数据库访问，如下面命令所示。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec -it secrets-env-demo -- mysql -uroot -piLinux
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 8
Server version: 10.4.12-MariaDB-1:10.4.12+maria~bionic mariadb.org binary distribution
Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]>
```

命令结果表明使用MySQL客户端工具以root用户和iLinux密码认证到容器mariadb的操作成功完成，经由环境变量向容器传递Secret对象中保存的敏感信息得以顺利实现。

### 2) Secret存储卷

Pod资源上的Secret存储卷插件的使用方式同ConfigMap存储卷插件非常相似，除了其类型及引用标识要替换为secret及secretName之外，几乎完全类似于ConfigMap存储卷，包括支持使用挂载整个存储卷、只挂载存储卷中指定键值以及独立挂载存储卷中的键等使用方式。下面是定义在配置清单文件secrets-volume-demo.yaml中的Secret资源使用示例，它将nginx-ssl-secret对象关联为Pod对象上名为nginxcert的存储卷，而后由容器ngxservrer挂载至/etc/nginx/certs目录下。

```java
apiVersion: v1
kind: Pod
metadata:
  name: secrets-volume-demo
  namespace: default
spec:
  containers:
  - image: nginx:alpine
    name: ngxserver
    volumeMounts:
    - name: nginxcerts
      mountPath: /etc/nginx/certs/
      readOnly: true
    - name: nginxconfs
      mountPath: /etc/nginx/conf.d/
      readOnly: true
  volumes:
  - name: nginxcerts
    secret:
      secretName: nginx-ssl-secret
  - name: nginxconfs
    configMap:
      name: nginx-sslvhosts-confs
      optional: false
```

ConfigMap对象nginx-sslvhosts-confs中存储有证书文件tls.cert和私钥文件tls.key，这些文件是可调用容器通过挂载nginx-ssl-secret在/etc/nginx/certs/目录下生成的，并根据证书与私钥文件定义了一个SSL类型的虚拟主机。并且，所有发往80端口的流量都会被重定向至SSL虚拟主机。其中的关键配置部分如下所示。

```java
server {
    listen 443 ssl;
    server_name www.ik8s.io;
    ssl_certificate /etc/nginx/certs/tls.crt; 
    ssl_certificate_key /etc/nginx/certs/tls.key;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; 
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE; 
    ssl_prefer_server_ciphers on;
    location / {
        root /usr/share/nginx/html;
    }
}
server {
    listen 80;
    server_name www.ilinux.io; 
    return 301 https://$host$request_uri; 
}
```

我们知道，由Pod资源引用的所有ConfigMap和Secret对象必须事先存在，除非它们被显式标记为optional: true。因此，在创建该Pod对象之前，我们需要事先生成其引用的ConfigMap对象nginx-sslvhosts-confs，相关的所有配置文件保存在nginx-ssl-conf.d/目录下，因而直接运行如下命令即可完成创建。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl create configmap nginx-sslvhosts-confs --from-file=./nginx-ssl-conf.d/
```

而后，将上面资源清单文件中定义的Pod资源创建于集群之上，待其正常启动后可查看容器挂载点目录中的文件，以确认其挂载是否成功完成，或直接向Pod中的Nginx服务发起访问请求进行验证。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f secrets-volume-demo.yaml 
pod/secrets-volume-demo created
```

而后，使用openssl s_cleint命令向该Pod对象的IP地址发起TLS访问请求，确认其证书是否为前面自签生成的测试证书。

```java
root@k8s-master01:/apps/k8s-yaml/configmap# podIP=$(kubectl get pods secrets-volume-demo -o jsonpath={.status.podIP})
root@k8s-master01:/apps/k8s-yaml/configmap# openssl s_client -connect $podIP:443 -state
```

不过，这里的测试请求使用了IP地址而非证书中的主体名称[www.ilinux.io](https://www.cnblogs.com/yaokaka/p/www.ilinux.io)，因而证书的验证会失败，但我们只需关注证书内容即可，尤其是证书链中显示的信息。若能成功证明响应中的证书来自nginx-ssl-secret对象中保存的自签证书，也就意味着通过存储卷方式向容器提供敏感信息的操作成功了。

## 四、应用Downward API存储卷配置信息

除了通过ConfigMap和Secret对象向容器注入配置信息之外，应用程序有时候还需要基于所运行的外在系统环境信息设定自身的运行特性。例如nginx进程可根据节点的CPU核心数量自动设定要启动的worker进程数，JVM虚拟机可根据节点内存资源自动设定其堆内存大小等。这种功能有点类似于编程中的反射机制，它旨在让对象加载与自身相关的重要环境信息并据此做出运行决策。Kubernetes的Downward API支持通过环境变量与文件（downwardAPI卷插件）将Pod及节点环境相关的部分元数据和状态数据注入容器中，它们的使用方式同ConfigMaps和Secrets类似，用于完成将外部信息传递给Pod中容器的应用程序。然而，Downward API并不会将所有可用的元数据统统注入容器中，而是由用户在配置Pod对象自行选择需要注入容器中的元数据。可选择注入的信息包括Pod对象的IP、主机名、标签、注解、UID、请求的CPU与内存资源量及其限额，甚至是Pod所在的节点名称和节点IP等。Downward API的数据注入方式如图所示。

但是与ConfigMap和Secret这两个标准的API资源类型不同的是，Downward API自身便是一种附属于API Server之上API，在Pod资源的定义中可直接进行引用而无须事先进行任何资源定义。

## 1、环境变量式元数据注入

类似于ConfigMap或Secret资源，容器能够在环境变量valueFrom字段中嵌套fieldRef或resourceFieldRef字段来引用其所属Pod对象的元数据信息。不过，通常只有常量类型的属性才能够通过环境变量注入容器中，毕竟进程启动完成后无法再向其告知变量值的变动，于是环境变量也就不支持中途的更新操作。在容器规范中，可在环境变量中配置valueFrom字段内嵌fieldRef字段引用的信息包括如下这些。

```java
▪metadata.name：Pod对象的名称。
▪metadata.namespace：Pod对象隶属的名称空间。
▪metadata.uid：Pod对象的UID。
▪metadata.labels['<KEY>']：Pod对象标签中的指定键的值，例如metadata.labels['mylabel']，仅Kubernetes 1.9及之后的版本才支持。
▪metadata.annotations['<KEY>']：Pod对象注解信息中的指定键的值，仅Kubernetes 1.9及之后的版本才支持。
```

容器上的计算资源需求和资源限制相关的信息，以及临时存储资源需求和资源限制相关的信息可通过容器规范中的resourceFieldRef字段引用，相关字段包括requests.cpu、limits.cpu、requests.memory和limits.memory等。另外，可通过环境变量引用的信息有如下几个。

```java
▪status.podIP：Pod对象的IP地址。
▪spec.serviceAccountName：Pod对象使用的ServiceAccount资源名称。
▪spec.nodeName：节点名称。
▪status.hostIP：节点IP地址。
```

另外，还可以通过resourceFieldRef字段引用当前容器的资源请求及资源限额的定义，因此它们包括requests.cpu、requests.memory、requests.ephemeral-storage、limits.cpu、limits.memory和limits.ephemeral-storage这6项。

下面的资源配置清单示例（downwardAPI-env.yaml）中定义的Pod对象通过环境变量向容器demoapp中注入了Pod对象的名称、隶属的名称空间、标签app的值以及容器自身的CPU资源限额和内存资源请求等信息。

```java
apiVersion: v1
kind: Pod
metadata:
  name: downwardapi-env-demo
  labels:
    app: demoapp
spec:
  containers:
    - name: demoapp
      image: ikubernetes/demoapp:v1.0
      command: [ "/bin/sh", "-c", "env" ]
      resources:
        requests:
          memory: "32Mi"
          cpu: "250m"
        limits:
          memory: "64Mi"
          cpu: "500m"
      env:
        - name: THIS_POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: THIS_POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: THIS_APP_LABEL
          valueFrom:
            fieldRef:
              fieldPath: metadata.labels['app']
        - name: THIS_CPU_LIMIT
          valueFrom:
            resourceFieldRef:
              resource: limits.cpu
        - name: THIS_MEM_REQUEST
          valueFrom:
            resourceFieldRef:
              resource: requests.memory
              divisor: 1Mi
  restartPolicy: Never
```

该Pod对象创建并启动后向控制台打印所有的环境变量即终止运行，它仅用于测试通过环境变量注入信息到容器的使用效果。我们先根据下面的命令创建出配置清单中定义的Pod资源Pod/downwardapi-env-demo。

```java
~$ kubectl apply -f downwardapi-env-demo.yaml
pod/downwardapi-env-demo created
```

等该Pod对象的状态转为Completed之后即可通过控制台日志获取注入的环境变量，如下面的命令及结果所示。

```java
~$ kubectl logs downwardapi-env-demo | grep "^THIS_"
THIS_CPU_LIMIT=1
THIS_APP_LABEL=demoapp
THIS_MEM_REQUEST=32
THIS_POD_NAME=downwardapi-env-demo
THIS_POD_NAMESPACE=default
```

示例最后一个环境变量的定义中还额外指定了一个divisor字段，它用于为引用的值指定一个除数，以对引用的数据进行单位换算。CPU资源的divisor字段默认值为1，它表示为1个核心，相除的结果不足1个单位时则向上圆整（例如0.25向上圆整的结果为1），它的另一个可用单位为1m，即表示1个微核心。内存资源的divisor字段默认值也是1，不过它意指1个字节，此时32MiB的内存资源则要换算为33554432予以输出。其他可用的单位还有1KiB、1MiB、1GiB等，于是在将divisor字段的值设置为1MiB时，32MiB的内存资源换算的结果即为32。

```java
注意：未给容器定义资源请求及资源限额时，通过downwardAPI引用的值则默认为节点的可分配CPU及内存资源量。
```

## 2) 存储卷式元数据注入

downwardAPI存储卷能够以文件方式向容器中注入元数据，将配置的字段数据映射为文件并可通过容器中的挂载点访问。事实上，6.4.1节中通过环境变量方式注入的元数据信息也都可以使用存储卷方式进行信息暴露，但除此之外，我们还能够在downwardAPI存储卷中使用fieldRef引用下面两个数据源。

```java
▪metadata.labels：Pod对象的所有标签信息，每行一个，格式为label-key="escaped-label-value"。
▪metadata.annotations：Pod对象的所有注解信息，每行一个，格式为annotation-key="escaped-annotation-value"。
```

下面的资源配置清单示例（downwardapi-volumes-demo.yaml）中定义的Pod资源通过downwardAPI存储卷向容器demoapp中注入了Pod对象隶属的名称空间、标签、注解以及容器自身的CPU资源限额和内存资源请求等信息。存储卷在容器中的挂载点为/etc/podinfo目录，因而注入的每一项信息均会映射为此路径下的一个文件。

```java
kind: Pod
apiVersion: v1
name: downwardapi-volume-demo
metadata:
  labels:
    zone: zone1
    rack: rack100
    app: demoapp
  annotations:
    region: ease-cn
spec:
  containers:
    - name: demoapp
      image: ikubernetes/demoapp:v1.0
      resources:
        requests:
          memory: "32Mi"
          cpu: "250m"
        limits:
          memory: "64Mi"
          cpu: "500m"
      volumeMounts:
      - name: podinfo
        mountPath: /etc/podinfo
        readOnly: false
  volumes:
  - name: podinfo
    downwardAPI:
      defaultMode: 420
      items:
      - fieldRef:
          fieldPath: metadata.namespace
        path: pod_namespace
      - fieldRef:
          fieldPath: metadata.labels
        path: pod_labels
      - fieldRef:
          fieldPath: metadata.annotations
          path: pod_annotations
      - resourceFieldRef:
          containerName: demoapp
          resource: limits.cpu
        path: "cpu_limit"
      - resourceFieldRef:
          containerName: demoapp
          resource: requests.memory
          divisor: "1Mi"
        path: "mem_request"
```

创建资源配置清单中定义的Pod对象后即可测试访问由downwardAPI存储卷映射的文件pod_namespace、pod_labels、pod_annotations、limits_cpu和mem_request等。

```java
~$ kubectl apply -f downwardapi-volume-demo.yaml 
pod/downwardapi-volume-demo created
```

待Pod对象正常运行后即可测试访问上述的映射文件，例如访问/etc/podinfo/pod_labels文件以查看Pod对象的标签列表：

```java
~$ kubectl exec downwardapi-volume-demo -- cat /etc/podinfo/pod_labels             
app="demoapp"
rack="rack100"
zone="zone1"
```

如命令结果所示，Pod对象的标签信息每行一个地映射于自定义的路径/etc/podinfo/pod_labels文件中，类似地，注解信息也以这种方式进行处理。如前面的章节所述，标签和注解支持运行时修改，其改动的结果也会实时映射进downwardAPI生成的文件中。例如，为downwardapi-volume-demo对象添加新的标签：

```java
~$ kubectl label pods/downwardapi-volume-demo release="Canary"
pod/downwardapi-volume-demo labeled
```

而后再次查看容器内的pod_labels文件的内容，由如下的命令结果可知新的标签已经能够通过相关的文件获取到。

```java
~$ kubectl exec downwardapi-volume-demo -- cat /etc/podinfo/pod_labels
app="demoapp"
rack="rack100"
release="Canary"
zone="zone1"
```

downwardAPI存储卷为Kubernetes上运行容器化应用提供了获取外部环境信息的有效途径，这对那些非云原生应用在不进行代码重构的前提下获取环境信息，以进行自身配置等操作时尤为有用。事实上，5.6节中Longhorn存储系统在其Longhorn Manager相关的资源清单中就使用了downwardAPI。

## 总结

ConfigMap和Secret是Kubernetes系统上两种特殊类型的存储卷，ConfigMap对象用于为容器中的应用提供配置数据以定制程序的行为，不过敏感的配置信息，例如密钥、证书等通常由Secret对象来进行配置。它们将相应的配置信息保存于对象中，而后在Pod资源上以存储卷的形式将其挂载并获取相关的配置，以实现配置与镜像文件的解耦。

## 1、ConfigMap

创建ConfigMap后，数据实际会存储在K8s中Etcd，然后通过创建Pod时引用该数据。应用场景：应用程序配置Pod使用configmap数据有两种方式：•变量注入•数据卷挂载

实验测试：在configmap中定义变量abc=123,cde=456,编写一个index.html的文件内容为 ni hao configmap!!!。

要求把变量abc=123,cde=456注入如到容器中，index.html以数据卷的方式挂载进容器中。

ConfigMap的yml文件编写

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap-demo
data:
 定义变量
  abc: "123"
  cde: "456"
 定义文件
  index.html: |
    ni hao configmap!!!
```

编写deployment和service的yml文件，其中会调用configmap

```java
---
#定义一个deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: web-nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-nginx
  template:
    metadata:
      labels:
        app: web-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.18.0
        ports:
        - containerPort: 80
       定义变量注入
        env:
       定义ABCD变量
        - name: ABCD
         变量的值来至与configmap-demo中定义的值
          valueFrom:
            configMapKeyRef:
              name: configmap-demo
              key: abc
        - name: CDEF
          valueFrom:
            configMapKeyRef:
              name: configmap-demo
              key: cde
       使用数据卷挂载
        volumeMounts:
        - name: nginx-config
          mountPath: "/usr/share/nginx/html/"
          readOnly: true
     定义数据挂载卷
      volumes:
      - name: nginx-config
        configMap:
          name: configmap-demo
          items:
          - key: "index.html"
            path: "index.html" 
---
#定义一个service
apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web-nginx
spec:
  type: NodePort 服务类型
  ports:
  - port: 80 Service端口
    protocol: TCP 协议
    targetPort: 80 容器端口
  selector:
    app: web-nginx 指定关联Pod的标签，与前面deployment定义的标签一致
```

运行yml文件

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f configmap-deployment.yml 
deployment.apps/nginx-deployment configured
service/web-service configured
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f configmap.yml 
configmap/configmap-demo configured
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get pod,svc,deployment -o wide
NAME                                    READY   STATUS    RESTARTS   AGE   IP              NODE         NOMINATED NODE   READINESS GATES
pod/nginx-deployment-5fd47c7d85-qqn7w   1/1     Running   0          12m   10.244.58.234   k8s-node02   <none>           <none>
pod/nginx-deployment-5fd47c7d85-wctwc   1/1     Running   0          12m   10.244.85.223   k8s-node01   <none>           <none>
NAME                  TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE     SELECTOR
service/kubernetes    ClusterIP   10.96.0.1       <none>        443/TCP        4d18h   <none>
service/web-service   NodePort    10.102.162.93   <none>        80:32294/TCP   16m     app=web-nginx
NAME                               READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES   SELECTOR
deployment.apps/nginx-deployment   2/2     2            2           16m   nginx        nginx    app=web-nginx
```

测试

```java
在外网访问
[root@harbor ~]# curl 192.168.32.204:32294
ni hao configmap!!!
#可以发现configmap中定义index.html已经以数据卷的形式挂载成功。
进入容器测试变量
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec -it pod/nginx-deployment-5fd47c7d85-qqn7w  -- bash
root@nginx-deployment-5fd47c7d85-qqn7w:/# echo $ABCD
123
root@nginx-deployment-5fd47c7d85-qqn7w:/# echo $CDEF
456
root@nginx-deployment-5fd47c7d85-qqn7w:/# cat /usr/share/nginx/html/index.html 
ni hao configmap!!!
#变量也注入成功
```

## 2、Secret

Secret资源的功能类似于ConfigMap，但它专用于存放敏感数据，例如密码、数字证书、私钥、令牌和SSH key等。

Secret对象存储数据的方式及使用方式类似于ConfigMap对象，以键值方式存储数据，在Pod资源中通过环境变量或存储卷进行数据访问。不同的是，Secret对象仅会被分发至调用了此对象的Pod资源所在的工作节点，且只能由节点将其存储于内存中。另外，Secret对象的数据的存储及打印格式为Base64编码的字符串，因此用户在创建Secret对象时也要提供此种编码格式的数据。不过，在容器中以环境变量或存储卷的方式访问时，它们会被自动解码为明文格式。

需要注意的是，在Master节点上，Secret对象以非加密的格式存储于etcd中，因此管理员必须加以精心管控以确保敏感数据的机密性，必须确保etcd集群节点间以及与API Server的安全通信，etcd服务的访问授权，还包括用户访问API Server时的授权，因为拥有创建Pod资源的用户都可以使用Secret资源并能够通过Pod中的容器访问其数据。Secret对象主要有两种用途，一是作为存储卷注入到Pod上由容器应用程序所使用，二是用于kubelet为Pod里的容器拉取镜像时向私有仓库提供认证信息。不过，后面使用ServiceAccount资源自建的Secret对象是一种更具安全性的方式。

简单理解为：

与ConfigMap类似，区别在于Secret主要存储敏感数据，所有的数据要经过base64编码。应用场景：凭据kubectl create secret 支持三种数据类型：•docker-registry（kubernetes.io/dockerconfigjson）：存储镜像仓库认证信息•generic（Opaque）：存储密码、密钥等•tls（kubernetes.io/tls）：存储TLS证书

secret的配置

Pod使用Secret数据与ConfigMap方式一样。•变量注入•数据卷挂载

第一步：将用户名密码进行编码

```java
root@k8s-master01:/apps/k8s-yaml/configmap# echo -n 'admin' | base64
YWRtaW4=
root@k8s-master01:/apps/k8s-yaml/configmap# echo -n '123456' | base64
MTIzNDU2
```

第二步：将编码后值放到Secret

```java
apiVersion: v1
kind: Secret
metadata:
  name: db-user-pass
type: Opaque
data:
  username: YWRtaW4=
  password: MTIzNDU2
```

第三步：定义pod yml文件

```java
---
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: web-nginx
spec:
  containers:
  - name: nginx
    image: nginx
    ports:
    - containerPort: 80
   变量注入
    env:
    - name: USER
      valueFrom:
        secretKeyRef:
          name: db-user-pass
          key: username
    - name: PASS
      valueFrom:
        secretKeyRef:
          name: db-user-pass
          key: password
   挂载卷注入
    volumeMounts:
    - name: config
      mountPath: "/mnt"
      readOnly: true
 定义挂载卷
  volumes:
  - name: config
    secret:
      secretName: db-user-pass
      items:
      - key: username
        path: username
      - key: password
        path: password
```

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f secret.yml 
secret/db-user-pass created
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl apply -f secret-pod.yml 
pod/nginx-pod created
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get secret -o wide
NAME                  TYPE                                  DATA   AGE
db-user-pass          Opaque                                2      44m
default-token-4zscw   kubernetes.io/service-account-token   3      4d20h
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl get pod -o wide
NAME        READY   STATUS    RESTARTS   AGE   IP              NODE         NOMINATED NODE   READINESS GATES
nginx-pod   1/1     Running   0          34s   10.244.85.225   k8s-node01   <none>           <none>
```

进入pod容器测试

```java
root@k8s-master01:/apps/k8s-yaml/configmap# kubectl exec -it nginx-pod -- bash
root@nginx-pod:/# echo $USER
admin
root@nginx-pod:/# echo $PASS
123456                        
root@nginx-pod:/# cat /mnt/password 
123456
root@nginx-pod:/# cat /mnt/username 
admin
root@nginx-pod:/# 
#变量和文件注入完成
```
