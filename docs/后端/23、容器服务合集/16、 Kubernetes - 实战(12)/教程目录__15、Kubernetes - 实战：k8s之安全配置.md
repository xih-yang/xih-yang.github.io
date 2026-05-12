# 15、Kubernetes - 实战：k8s之安全配置
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/15.html
- 分类：容器服务
- 分组：教程目录
在任何将资源或服务提供给有限使用者的系统上，认证和授权是两个必不可少的功能，前者用于身份鉴别，负责验证“来者是谁”，而后者则实现权限分派，负责鉴证“他有权做哪些事”。Kubernetes系统完全分离了身份验证和授权功能，将二者分别以多种不同的插件实现，而且，特有的准入控制机制，还能在“写”请求上辅助完成更为精细的操作验证及变异功能。

Kubernetes集群中所有资源的访问和变更都是通过Kubernetes API Server的REST API来实现的，所以集群安全的关键点就在于如何识别并认证客户端身份（Authentication），以及随后访问权限的授权（Authorization）这两个关键问题。

## 一、Kubernetes的访问控制介绍

## 1、apiserver的认证

APIServer作为Kubernetes集群系统的网关，是访问及管理资源对象的唯一入口，它默认监听TCP的6443端口，通过HTTPS协议暴露了一个RESTful风格的接口。所有需要访问集群资源的集群组件或客户端，包括kube-controller-manager、kube-scheduler、kubelet和kube-proxy等集群基础组件，CoreDNS等集群的附加组件，以及此前使用的kubectl命令等都必须要经此网关请求与集群进行通信。所有客户端均要经由API Server访问或改变集群状态以及完成数据存储，并且API Server会对每一次的访问请求进行合法性检验，包括用户身份鉴别、操作权限验证以及操作是否符合全局规范的约束等。所有检查均正常完成且对象配置信息合法性检验无误之后才能访问或存入数据到后端存储系统etcd中。

客户端认证操作由API Server配置的一到多个认证插件完成。收到请求后，API Server依次调用配置的认证插件来校验客户端身份，直到其中一个插件可以识别出请求者的身份为止。授权操作则由一到多个授权插件完成，这些插件负责确定通过认证的用户是否有权限执行发出的资源操作请求，该类操作包括创建、读取、删除或修改指定的对象等。随后，通过授权检测的用户请求修改相关的操作还要经由一到多个准入控制插件的遍历式检测，例如使用默认值补足要创建的目标资源对象中未定义的各字段、检查目标Namespace资源对象是否存在、检查请求创建的Pod对象是否违反系统资源限制等，而其中任何的检查失败都可能会导致写入操作失败。

Kubernetes对整个系统的认证，授权，访问控制做了精密的设置；对于Kubernetes集群来说，apiserver是整个就集群访问控制的唯一入口，在Kubernetes集群之上部署应用程序的时候，也可以通过宿主机的NodePort暴露的端口访问里面的程序，用户访问kubernetes集群需要经历如下认证过程：认证->授权->准入控制（adminationcontroller）

1）.认证(Authenticating)是对客户端的认证，通俗点就是用户名密码验证。认证通过，则客户端可以与Kubernetes集群进行交互。

2）.授权(Authorization)是对资源的授权，Kubernetes中的资源无非是容器，最终其实就是容器的计算，网络，存储资源，当一个请求经过认证后，需要访问某一个资源（比如创建一个pod），授权检查都会通过访问策略比较该请求上下文的属性，（比如用户，资源和Namespace），根据授权规则判定该资源（比如某namespace下的pod）是否是该客户可访问的。授权通过，则客户端可以对集群中授权的资源做增、删、改、查的操作。

3）.准入(Admission Control)机制是一种在改变资源的持久化之前（比如某些资源的创建或删除，修改等之前）的机制。不会拦截查询操作。

## 2、Kubernetes的用户账户及用户组

Kubernetes系统上的用户账户及用户组的实现机制与常规应用略有不同。Kubernetes集群将那些通过命令行工具kubectl、客户端库或者直接使用RESTful接口向API Server发起请求的客户端上的请求主体分为两个不同的类别：现实中的“人”和Pod对象，它们的用户身份分别对应用户账户（User Account，也称为普通用户）和服务账户（Service Account，简称SA）。

1）用户账户：其使用主体往往是“人”，一般由外部的用户管理系统存储和管理，Kubernetes本身并不维护这一类的任何用户账户信息，它们不会存储到API Server之上，仅仅用于检验用户是否有权限执行其所请求的操作。

2）服务账户：其使用主体是“应用程序”，专用于为Pod资源中的服务进程提供访问Kubernetes API时的身份标识（identity）；ServiceAccount资源通常要绑定到特定的名称空间，它们由API Server自动创建或通过API调用，由管理员手动创建，通常附带着一组访问API Server的认证凭据——Secret，可由同一名称的Pod应用访问API Server时使用。

3）用户账户通常用于复杂的业务逻辑管控，作用于系统全局，因而名称必须全局唯一。Kubernetes并不会存储由认证插件从客户端请求中提取的用户及所属的组信息，因而也就没有办法对普通用户进行身份认证，它们仅仅用于检验该操作主体是否有权限执行其所请求的操作。

4）服务账户则隶属于名称空间级别，仅用于实现某些特定操作任务，因此功能上要轻量得多。这两类账户都可以隶属于一个或多个用户组。

举例说明：

sa账号：访问pod资源中提供的服务的账号。如：登陆dashboard使用的账号。

user account：这个是登陆Kubernetes集群物理机器的账号。如：配置一个账号让其只能访问集群中namespace=dev下的资源。

用户组只是用户账户的逻辑集合，它本身没有执行系统操作的能力，但附加于组上的权限可由其内部的所有用户继承，以实现高效的授权管理机制。Kubernetes有以下几个内置用于特殊目的的组。

```java
▪system:unauthenticated：未能通过任何一个授权插件检验的账户的、所有未通过认证测试的用户统一隶属的用户组。
▪system:authenticated：认证成功后的用户自动加入的一个专用组，用于快捷引用所有正常通过认证的用户账户。
▪system:serviceaccounts：所有名称空间中的所有ServiceAccount对象。
▪system:serviceaccounts:<namespace>：特定名称空间内所有的ServiceAccount对象。
```

对API Server来说，来自客户端的请求要么与用户账户绑定，要么以某个服务账户的身份进行，要么被视为匿名请求。这意味着群集内部或外部的每个进程，包括由人类用户使用kubectl，以及各节点上运行的kubelet进程，再到控制平面的成员组件，必须在向API Server发出请求时进行身份验证，否则即被视为匿名用户。

## 3、认证、授权与准入控制基础知识

Kubernetes使用身份验证插件对API请求进行身份验证，它允许管理员自定义服务账户和用户账户要启用或禁用的插件，并支持各自同时启用多种认证机制。具体设定时，至少应该为服务账户和用户账户各自启用一个认证插件。如果启用了多种认证机制，账号认证过程由认证插件以串行方式进行，直到其中一种认证机制成功完成即结束。若认证失败，服务器则响应以401状态码，反之，请求者就会被Kubernetes识别为某个具体的用户（以其用户名进行标识），并且该连接上随后的操作都会以此用户身份进行。API Server对于接收到的每个访问请求会调用认证插件，尝试将以下属性与访问请求相关联。

```java
▪Username：用户名，例如kubernetes-admin等。
▪UID：用户的数字标签符，用于确保用户身份的唯一性。
▪Groups：用户所属的组，用于权限指派和继承。
▪Extra：键值数据类型的字符串，用于提供认证需要用到的额外信息。
```

### 3.1 Kubernetes的认证方式

Kubernetes支持的认证方式包括X.509数字证书、承载令牌（bearer token，也称为不记名令牌）、身份验证代理（authenticating proxy）和HTTP Basic认证等。其中所有的令牌认证机制通常被统称为“承载令牌认证”。

1）静态密码文件认证：将用户名和密码等信息以明文形式存储在CSV格式的文件中，由kube-apiserver在启动时通过--basic-auth-file选项予以加载，添加或删除用户都需要重启API Server；客户端通过在HTTP Basic认证（Authorization: Basic base64-encoded-username:password标头）方式中将用户名和密码编码后对该文件进行认证；不建议生产环境中使用。

说明：静态密码文件认证插件自Kubernetes v1.20版本中预以弃用，该插件的测试操作部分在v1.20及之后的版本上不可用，但在v1.19及之前的版本中，仍然可用。

2）静态令牌文件认证：即保存用于认证的令牌信息的静态文件，由kube-apiserver的命令行选项--token-auth-file加载，且API Sever进程启动后不可更改；HTTP协议的客户端能基于承载令牌（Authorization: Bearer 标头）对静态令牌文件进行身份验证，它将令牌编码后通过请求报文中的Authorization头部承载并传递给API Server即可；不建议生产环境中使用。

3）X509客户端证书认证：客户端在请求报文中携带X.509格式的数字证书用于认证，其认证过程类似于HTTPS协议通信模型；认证通过后，证书中的主体标识（Subject）将被识别为用户标识，其中的字段CN（Common Name）的值是用户名，字段O（Organization）的值是用户所属的组。例如/CN=ilinux/O=opmasters/O=admin中，用户名为ilinux，它属于opmasters和admin两个组；该认证方式可通过--client-ca-file=SOMEFILE选项启用。

4）引导令牌（Bootstrap Token）认证：一种动态管理承载令牌进行身份认证的方式，常用于简化组建新Kubernetes集群时将节点加入集群的认证过程，需要由kube-apiserver通过--experimental-bootstrap-token-auth选项启用；新的工作节点首次加入时，Master使用引导令牌确认节点身份的合法性之后自动为其签署数字证书以用于后续的安全通信，kubeadm初始化的集群也是这种认证方式；这些令牌作为Secrets存储在kube-system命名空间中，可以动态管理和创建它们，并由TokenCleaner控制器负责删除过期的引导令牌。

5）ServiceAccount令牌认证：该认证方式会由kube-apiserver程序自动启用，它同样使用签名的承载令牌来验证请求；该认证方式还支持通过可选项--service-account-key-file加载签署承载令牌的密钥文件，未指定时将使用API Server自己的TLS私钥；ServiceAccount通常由API Server自动创建，并通过ServiceAccount准入控制器将其注入Pod对象，包括ServiceAccount上的承载令牌，容器中的应用程序请求API Server的服务时以此完成身份认证。

6）OpenID Connect令牌认证：简称为OIDC，是OAuth 2协议的一种扩展，由Azure AD、Salesforce和Google Accounts等OAuth 2服务商所支持，协议的主要扩展是返回的附加字段，其中的访问令牌也称为ID令牌；它属于JSON Web令牌（JWT）类型，有服务器签名过的常用字段，例如email等；kube-apiserver启用这种认证功能的相关选项较多。

7）Webhook令牌认证：Webhook身份认证是用于验证承载令牌的钩子；HTTP协议的身份验证允许将服务器的URL注册为Webhook，并接收带有承载令牌的POST请求进行身份认证；客户端使用kubeconfig格式的配置文件，在文件中，users指的是API Server的Webhook，而clusters则指的是API Server。

8）代理认证：API Server支持从请求头部的值中识别用户，例如常用的X-Remote-User、X-Remote-Group和几个以X-Remote-Extra-开头的头部，它旨在与身份验证代理服务相结合，由该代理设置相应的请求头部；为了防止头欺骗，在检查请求标头之前，需要身份认证代理服务向API Server提供有效的客户端证书，以验证指定CA（由选项--requestheader-client-ca-file等进行指定）的代理服务是否合法。

9）那些未能被任何验证插件明确拒绝的请求中的用户即为匿名用户，该类用户会被冠以system:anonymous用户名，隶属于system:unauthenticated用户组。若API Server启用了除AlwaysAllow以外的认证机制，则匿名用户处于启用状态。但是，出于安全因素的考虑，建议管理员通过--anonymous-auth=false选项将其禁用。

```java
注意：API Server还允许用户通过模拟头部冒充另一个用户，这些请求可以以手动方式覆盖请求中用于身份验证的用户信息。例如，管理员可以使用此功能临时模拟其他用户来查看请求是否被拒绝，以进行授权策略调试。
```

除了身份信息，请求报文还需要提供操作方法及其目标对象，例如针对某Pod资源对象进行的创建、查看、修改或删除操作等：

```java
▪API：用于定义请求的目标是否为一个API资源。
▪Request path：请求的非资源型路径，例如/api或/healthz。
▪API group：要访问的API组，仅对资源型请求有效；默认为core API group。
▪Namespace：目标资源所属的名称空间，仅对隶属于名称空间类型的资源有效。
▪API request verb：API请求类的操作，即资源型请求（对资源执行的操作），包括get、list、create、update、patch、watch、proxy、redirect、delete和deletecollection等。
▪HTTP request verb：HTTP请求类的操作，即非资源型请求要执行的操作，如get、post、put和delete。
▪Resource：请求的目标资源的ID或名称。
▪Subresource：请求的子资源。
```

### 3.2 Kubernetes的授权

为了核验用户的操作许可，成功通过身份认证后的操作请求还需要转交给授权插件进行许可权限检查，以确保其拥有执行相应操作的许可。API Server主要支持使用4类内置的授权插件来定义用户的操作权限。

```java
▪Node：基于Pod资源的目标调度节点来实现对kubelet的访问控制。
▪ABAC：Attribute-based access control，基于属性的访问控制。
▪RBAC：Role-based access control，基于角色的访问控制。
▪Webhook：基于HTTP回调机制实现外部REST服务检查，确认用户授权的访问控制。
另外，还有AlwaysDeny和AlwaysAllow两个特殊的授权插件，其中AlwaysDeny（总是拒绝）仅用于测试，而AlwaysAllow（总是允许）则用于不期望进行授权检查时直接在授权检查阶段放行所有的操作请求。--authorization-mode选项用于定义API Server要启用的授权机制，多个选项值彼此间以逗号进行分隔。
```

### 3.3 Kubernetes的准入控制

准入控制器（admission controller）则用于在客户端请求经过身份验证和授权检查之后，将对象持久化存储到etcd之前拦截请求，从而实现在资源的创建、更新和删除操作期间强制执行对象的语义验证等功能，而读取资源信息的操作请求则不会经由准入控制器检查。API Server内置了许多准入控制器，常用的包含下面列出的几种。不过，其中的个别控制器仅在较新版本的Kubernetes中才被支持。

```java
AlwaysAdmit和AlwaysDeny：前者允许所有请求，后者则拒绝所有请求。
AlwaysPullImages：总是下载镜像，即每次创建Pod对象之前都要去下载镜像，常用于多租户环境中，以确保私有镜像仅能够由拥有权限的用户使用。
NamespaceLifecycle：拒绝在不存在的名称空间中创建资源，而删除名称空间则会级联删除其下的所有其他资源。
LimitRanger：可用资源范围界定，用于对设置了LimitRange的对象所发出的所有请求进行监控，以确保其资源请求不会超限。
ServiceAccount：用于实现服务账户管控机制的自动化，实现创建Pod对象时自动为其附加相关的Service Account对象。
PersistentVolumeLabel：为那些由云计算服务商提供的PV自动附加region或zone标签，以确保这些存储卷能正确关联且仅能关联到所属的region或zone。
DefaultStorageClass：监控所有创建PVC对象的请求，以保证那些没有附加任何专用StorageClass的请求会被自动设定一个默认值。
ResourceQuota：用于为名称空间设置可用资源上限，并确保当其中创建的任何设置了资源限额的对象时，不会超出名称空间的资源配额。
DefaultTolerationSeconds：如果Pod对象上不存在污点宽容期限，则为它们设置默认的宽容期，以宽容notready:NoExecute和unreachable:NoExecute类的污点5分钟时间。
ValidatingAdmissionWebhook：并行调用匹配当前请求的所有验证类的Webhook，任何一个校验失败，请求即失败。
MutatingAdmissionWebhook：串行调用匹配当前请求的所有变异类的Webhook，每个调用都可能会更改对象。
```

检查期间，仅那些顺利通过所有准入控制器检查的资源操作请求的结果才能保存到etcd中，而任何一个准入控制器的拒绝都将导致写入请求失败。

## 二、ServiceAccount及认证

Kubernetes原生的应用程序意味着专为运行于Kubernetes系统之上而开发的应用程序，这些程序托管运行在Kubernetes之上，能够直接与API Server进行交互，并进行资源状态的查询或更新，例如Flannel和CoreDNS等。API Server同样需要对这类来自Pod资源中的客户端程序进行身份验证，服务账户也是专用于这类场景的账号。ServiceAccount资源一般由用户身份信息及保存了认证信息的Secret对象组成。

## 1、ServiceAccount自动化

创建的每个Pod资源都自动关联了一个Secret存储卷，并由其容器挂载至/var/run/secrets/kubernetes.io/serviceaccount目录

```java
[root@k8s-master01 k8s-yaml]# kubectl describe pod test-pod
......
Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-btlhc (ro)
......
Volumes:
  default-token-btlhc:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-btlhc
    Optional:    false
......
```

容器的该挂载点目录中通常存在3个文件：ca.crt、namespace和token，其中，token文件保存了ServiceAccount的认证令牌，容器中的进程使用该账户认证到API Server，进而由认证插件完成用户认证并将其用户名传递给授权插件。

```java
[root@k8s-master01 k8s-yaml]# kubectl exec -it test-pod -- bash
[root@test-pod /]# ls /var/run/secrets/kubernetes.io/serviceaccount/
ca.crt  namespace  token
```

每个Pod对象只有一个服务账户，若创建Pod资源时未予明确指定，则ServiceAccount准入控制器会为其自动附加当前名称空间中默认的服务账户，其名称通常为default。下面的命令显示了default这个服务账户的详细信息。

```java
[root@k8s-master01 k8s-yaml]# kubectl describe serviceaccounts default -n default 
Name:                default
Namespace:           default
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   default-token-btlhc
Tokens:              default-token-btlhc
Events:              <none>
```

Kubernetes系统通过3个独立的组件间相互协作实现了上面描述的Pod对象服务账户的自动化过程：ServiceAccount准入控制器、令牌控制器和ServiceAccount控制器。ServiceAccount控制器负责为名称空间管理相应的资源对象，它需要确保每个名称空间中都存在一个名为default的服务账户对象。ServiceAccount准入控制器内置在API Server中，负责在创建或更新Pod时按需进行ServiceAccount资源对象相关信息的修改。

```java
▪若Pod没有显式定义使用的ServiceAccount对象，则将其设置为default。
▪若Pod显式引用了ServiceAccount，则负责检查被引用的对象是否存在，不存在时将拒绝Pod资源的创建请求。
▪若Pod中不包含ImagePullSecerts，则把ServiceAccount的ImagePullSecrets附加其上。
▪为带有访问API的令牌的Pod对象添加一个存储卷。
▪为Pod对象中的每个容器添加一个volumeMounts，将ServiceAccount的存储卷挂至/var/run/secrets/kubernetes.io/serviceaccount。
```

令牌控制器是控制平面组件Controller Manager中的一个专用控制器，它工作于异步模式，负责完成如下任务：

```java
▪监控ServiceAccount的创建操作，并为其添加用于访问API的Secret对象；
▪监控ServiceAccount的删除操作，并删除其相关的所有ServiceAccount令牌密钥；
▪监控Secret对象的添加操作，确保其引用的ServiceAccount存在，并在必要时为Secret对象添加认证令牌；
▪监控Secret对象的删除操作，以确保删除每个ServiceAccount对此Secret的引用。
```

需要注意的是，为确保完整性等，必须为kube-controller-manager使用--service-account-private-key-file选项指定一个私钥文件，用于对生成的ServiceAccount令牌进行签名，该私钥文件必须是PEM格式。同时，要使用--service-account-key-file为kube-apiserver指定与前面的私钥配对的公钥文件，实现在认证期间对认证令牌进行校验。

## 2、ServiceAccount基础应用

ServiceAccount是Kubernetes API上的一种资源类型，它属于名称空间级别，用于让Pod对象内部的应用程序在与API Server通信时完成身份认证。同样名为ServiceAccount的准入控制器实现了服务账户自动化，该准入控制器为每个名称空间都自动生成了一个名为default的默认资源对象。每个Pod对象可附加其所属名称空间中的一个ServiceAccount资源，且只能附加一个。不过，一个ServiceAccount资源可由其所属名称空间中的多个Pod对象共享使用。创建Pod资源时，用户可使用spec.serviceAccountName属性直接指定要使用的ServiceAccount对象，或者省略此字段而由准入控制器自动附加当前名称空间中默认的ServiceAccount，以确保每个Pod对象至少基于该服务账户有权限读取当前名称空间中其他资源对象的元数据信息。Kubernetes也支持用户按需创建ServiceAccount资源并将其指定到特定应用的Pod对象之上，结合集群启用的授权机制为该ServiceAccount资源赋予所需要的更多权限，从而构建出更加灵活的权限委派模型。

### 2.1 命令式ServiceAccount资源创建

kubectl create serviceaccount命令能够快速创建自定义的ServiceAccount资源，我们仅需要在命令后给出目标ServiceAccount资源的名称。

```java
[root@k8s-master01 ~]# kubectl create serviceaccount my-sa
serviceaccount/my-sa created
[root@k8s-master01 ~]# kubectl get sa my-sa 
NAME    SECRETS   AGE
my-sa   1         48s
```

Kubernetes会为创建的ServiceAccount资源自动生成并附加一个Secret对象，该对象以ServiceAccount资源名称为前缀,后面加token-随机数的方式。

```java
[root@k8s-master01 ~]# kubectl get secrets 
NAME                  TYPE                                  DATA   AGE
default-token-btlhc   kubernetes.io/service-account-token   3      15d
my-sa-token-5kw7c     kubernetes.io/service-account-token   3      95s
```

该Secret对象属于特殊的kubernetes.io/service-account-token类型，它包含ca.crt、namespace和token这3个数据项，它们分别包含Kubernetes Root CA证书、Secret对象所属的名称空间和访问API Server的token令牌。由Pod对象以Secret存储卷的方式将该类型的Secret对象挂载至/var/run/secrets/kubernetes.io/serviceaccount目录后，这3个数据项映射为同名的3个文件。

```java
[root@k8s-master01 ~]# kubectl get secrets my-sa-token-5kw7c -o yaml
apiVersion: v1
data:
  ca.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0......
  namespace: ZGVmYXVsdA==
  token: ZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNklqVkdSV......
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: my-sa
    kubernetes.io/service-account.uid: 07ce8903-29d5-456f-a0d4-5a7cf50c2527
  ......
  name: my-sa-token-5kw7c
  namespace: default
  resourceVersion: "2650574"
  uid: 9adfd7d5-1a3f-4cef-b8d5-2229f8cc3d8f
type: kubernetes.io/service-account-token
```

### 2.2 ServiceAccount资源清单

以资源规范形式创建Secret对象时，以类似如上命令结果的形式，为Secret对象使用资源注解kubernetes.io/service-account.name引用一个现存的ServiceAccount对象，并指定资源类型为特定的kubernetes.io/service-account-token，我们便可以将指定的ServiceAccount对象引用的Secret对象予以置换，该Secret对象同样会自动生成固定的3个数据项。

完善地创建ServiceAccount资源的方式是使用资源规范，该规范比较简单，它没有spec字段，而是将几个关键定义直接通过一级字段给出。

```java
apiVersion: v1               ServiceAccount所属的API群组及版本
kind: ServiceAccount         资源类型标识
metadata:
  name <string>              资源名称
  namespace <string>         ServiceAccount是名称空间级别的资源
automountServiceAccountToken <boolean>   是否让Pod自动挂载API令牌
secrets <[]Object>           以该SA运行的Pod要使用的Secret对象所组成的列表
  apiVersion <string>        引用的Secret对象所属的API群组及版本，可省略
  kind <string>              引用的资源类型，这里是指Secret，可省略
  name <string>              引用的Secret对象的名称，通常仅给出该字段即可
  namespace <string>         引用的Secret对象所属的名称空间
  uid  <string>              引用的Secret对象的标识符
imagePullSecrets <[]Object>  引用的用于下载Pod中容器镜像的Secret对象列表
  name <string>              docker-registry类型的Secret资源名称
```

serviceacceount实例

仅指定了资源名称，以及允许Pod对象将其自动挂载为存储卷，引用的Secret对象则交由系统自动生成。

```java
[root@k8s-master01 k8s-yaml]# vim sa-demo.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: namespace-admin
  namespace: default
automountServiceAccountToken: true
```

将配置清单中定义的default-ns-admin资源创建到集群上，ServiceAccount控制器会自动为其附加以该资源名称为前缀的Secret对象。随后，用户便可以在创建的Pod对象上引用该ServiceAccount对象，以借助权限管理机制实现自主控制Pod对象资源访问权限。

```java
[root@k8s-master01 k8s-yaml]# kubectl apply -f sa-demo.yaml 
serviceaccount/namespace-admin created
[root@k8s-master01 k8s-yaml]# kubectl get sa
NAME              SECRETS   AGE
default           1         15d
my-sa             1         15m
namespace-admin   1         74s
[root@k8s-master01 k8s-yaml]# kubectl get secrets 
NAME                          TYPE                                  DATA   AGE
default-token-btlhc           kubernetes.io/service-account-token   3      15d
my-sa-token-5kw7c             kubernetes.io/service-account-token   3      16m
namespace-admin-token-gqmrb   kubernetes.io/service-account-token   3      91s
```

另外，ServiceAccount资源还可以基于spec.imagePullSecret字段附带一个由下载镜像专用的Secret资源组成的列表，让Pod对象在创建容器时且从私有镜像仓库下载镜像文件之前完成身份认证。下面的示例定义了一个从本地私有镜像仓库Harbor下载镜像文件时的Secret对象信息的ServiceAccount。

```java
---
#定义harbor的账号密码在secret中
apiVersion: v1
kind: Secret
metadata:
  name: local-harbor-secret
type: Opaque
data:
  username: YWRtaW4=harbor的账号，使用base64加密
  password: MTIzNDU2harbor的密码，使用base64加密
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: eshop-sa
  namespace: eshop
imagePullSecrets:
- name: local-harbor-secret调用secret
```

其中，local-harbor-secret是docker-registry类型的Secret对象，包含目标Docker Registry的服务入口、用户名、密码及用户的电子邮件等信息，它必须要由用户提前手动创建。该Pod资源所在节点上的kubelet进程使用Secret对象中的令牌认证到目标Docker Registry，以下载运行容器所需要的镜像文件。

### 2.3 Pod资源上的服务账户

借助权限分配模型，按需应用“最小权限法则”将不同的资源操作权限配置给不同的账户，是有效降低安全风险的法则之一。有相当一部分Kubernetes原生应用程序依赖的权限都会大于从Pod默认ServiceAccount继承到的权限，且彼此间各有不同，为这类应用定制一个专用的ServiceAccount并授予所需的全部权限是主流的解决方案。

```java
[root@k8s-master01 k8s-yaml]# vim pod-with-sa.yml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-sa
  namespace: default
spec:
  containers:
  - name: adminbox
    image: ikubernetes/admin-toolbox:v1.0
    imagePullPolicy: IfNotPresent
  serviceAccountName: namespace-admin 调用前面创建的sa
```

该Pod资源创建完成后会以Secret存储卷的形式自动挂载serviceaccounts/default-ns-admin的Secret对象

```java
[root@k8s-master01 k8s-yaml]# kubectl apply -f pod-with-sa.yml 
pod/pod-with-sa created
[root@k8s-master01 k8s-yaml]# kubectl get pod
NAME          READY   STATUS    RESTARTS   AGE
pod-with-sa   1/1     Running   0          29s
[root@k8s-master01 k8s-yaml]# kubectl describe pod pod-with-sa 
Name:         pod-with-sa
Namespace:    default
......
Containers:
......
  Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from namespace-admin-token-gqmrb (ro)
......
Volumes:
  namespace-admin-token-gqmrb:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  namespace-admin-token-gqmrb
......
```

Secret对象默认的挂载路径是/var/run/secrets/kubernetes.io/serviceaccount。与API Server交互时，工作负载进程会使用该目录下的ca.crt证书文件验证API Server的服务器证书是否为自己信任的证书颁发机构（所在集群的kubernetes-ca）所签发；验证服务器身份成功通过后，工作负载向API Server请求操作namespace文件指定的名称空间中的资源时，会将token文件中的令牌以承载令牌的认证方式提交给API Server进行验证，权限校验则由授权插件完成。

可在pods/pod-with-sa的交互式接口中进行访问测试。

1）切换到pods/pod-with-sa的adminbox容器的Secret对象的挂载点为工作目录以便于加载所需要的文件：

```java
[root@k8s-master01 k8s-yaml]# kubectl exec -it pod-with-sa -- bash
[root@pod-with-sa /]$ ls /var/run/secrets/kubernetes.io/serviceaccount
ca.crt     namespace  token
```

2）在容器中使用curl命令向API Server发起访问请求，--cacert选项用于指定验证服务器端的CA证书，而-H选项用于自定义头部，它指定了使用的承载令牌；下面的命令使用了“命令引用”机制来加载token和namespace文件的内容，其结果显示容器进程使用指定的ServiceAccount进行身份认证成功。因为没有授权所有该sa账户没有该namespace下所有资源的操作权限。

```java
[root@pod-with-sa /]$ cd /var/run/secrets/kubernetes.io/serviceaccount/ 
[root@pod-with-sa /var/run/secrets/kubernetes.io/serviceaccount]$ curl --cacert ./ca.crt -H "Authorization: Bearer $(cat ./token)"               https://kubernetes/api/v1/namespaces/$(cat ./namespace)/
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {
  },
  "status": "Failure",
  "message": "namespaces \"default\" is forbidden: User \"system:serviceaccount:default:namespace-admin\" cannot get resource \"namespaces\" in API group \"\" in the namespace \"default\"",
  "reason": "Forbidden",
  "details": {
    "name": "default",
    "kind": "namespaces"
  },
  "code": 403
```

接下来，单独向serviceaccount/namespace-admin授予default名称空间的管理权限，pods/pod-with-sa中的进程便能借助该ServiceAccount的身份管理相应名称空间下的资源.

1）切换至kubectl管理终端运行如下资源创建命令：

```java
[root@k8s-master01 k8s-yaml]# kubectl create rolebinding namespace-admin-binding-admin --clusterrole=admin \
>      --serviceaccount=default:namespace-admin -n default
rolebinding.rbac.authorization.k8s.io/namespace-admin-binding-admin created
```

2）回到pods/pod-with-sa的adminbox容器中再次运行访问测试命令即可验证授权结果，如下命令表示namespace-admin用户已然有权限访问default名称空间。事实上，它拥有该名称空间中所有资源的CRUD权限。

```java
[root@k8s-master01 k8s-yaml]# kubectl exec -it pod-with-sa -- bash
[root@pod-with-sa /]$
[root@pod-with-sa /]$ cd /var/run/secrets/kubernetes.io/serviceaccount/ 
[root@pod-with-sa /var/run/secrets/kubernetes.io/serviceaccount]$ curl --cacert ./ca.crt -H "Authorization: Bearer $(cat ./token)"  https://kubernetes/api/v1/namespaces/$(cat ./namespace)/
{
  "kind": "Namespace",
  "apiVersion": "v1",
  "metadata": {
    "name": "default",
    "uid": "84b5b410-0c48-4163-a0cb-0af27a941b32",
    "resourceVersion": "195",
    "creationTimestamp": "2021-04-23T02:20:54Z",
    "managedFields": [
      {
        "manager": "kube-apiserver",
        "operation": "Update",
        "apiVersion": "v1",
        "time": "2021-04-23T02:20:54Z",
        "fieldsType": "FieldsV1",
        "fieldsV1": {"f:status":{"f:phase":{}}}
      }
    ]
  },
  "spec": {
    "finalizers": [
      "kubernetes"
    ]
  },
  "status": {
    "phase": "Active"
  }
}
#授权后可以正常访问该namespace下的资源
```

default名称空间引用了serviceaccounts/default资源中Pod的容器进程却不具有如上权限，因为它们并未获得相应的授权。事实上，kube-system名称空间中的许多应用都使用了专用的ServiceAccount资源，例如Flannel、CoreDNS、kube-proxy以及多种控制器等

## 三、X509数字证书认证

X509数字证书认证常用的方式有“单向认证”和“双向认证”。SSL / TLS最常见的应用场景是将X.509数字证书与服务器端关联，但客户端不使用证书。

单向认证是客户端能够验证服务端的身份，但服务端无法验证客户端的身份，至少不能通过SSL / TLS协议进行。之所以如此，是因为SSL / TLS安全性最初是为互联网应用开发，保护客户端是高优先级的需求，它可以让客户端确保目标服务器不会被冒名顶替。

双向认证的场景中，服务端与客户端需各自配备一套数字证书，并拥有信任的签证机构的证书列表。使用私有签证机构颁发的数字证书时，除了证书管理和分发，通常还要依赖用户手动将此私有签证机构的证书添加到信任的签证机构列表中。X509数字证书认证是Kubernetes默认使用的认证机制，采用双向认证模式。

## 1、Kubernetes的X509数字证书认证体系

构建安全基础通信环境的Kubernetes集群时，需要用到PKI基础设施以完成独立HTTPS安全通信及X509数字证书认证的场景有多种。API Server是整个Kubernetes集群的通信网关，controller-manager、scheduler、kubelet及kube-proxy等API Server的客户端均需要经由API Server与etcd通信，完成资源状态信息获取及更新等。同样出于安全通信的目的，Master的各组件（API Server、controller-manager和scheduler）需要基于SSL/TLS向外提供服务，而且与集群内部组件间通信时（主要是各节点上的kubelet和kube-proxy）还需要进行双向身份验证。

### 1.1 Kubernetes集群中的PKI设施与X509数字证书认证体系

Kubernetes集群中存在3个需要独立完成X509数字证书认证和HTTPS通信的体系：一是etcd集群成员、服务器及其客户端；二是API Server及其客户端，以及kubelet API及其客户端；三是Kubernetes认证代理体系中的服务器和客户端。这3个独立的体系各自需要一个独立证书颁发机构为体系内的服务器和客户端颁发证书，完成体系内的组件身份认证同时又彼此隔离。

kubernetes集群中的CA：

（1）etcd集群CA及相关的数字证书Kubernetes的API Server将集群的状态数据存储到集群存储服务etcd中，包括含有敏感数据的Secret资源对象。出于提升服务可用性、数据冗余及安全性等目的，生产环境通常应该配置有3、5或7个节点的etcd集群，集群内各节点间基于HTTPS协议进行通信，它们使用Peer类型的数字证书进行通信时的身份认证。而且，各etcd节点提供Server类型的数字证书与客户端建立安全连接，并验证其客户端Client类型的数字证书。Kubernetes集群各组件中，kube-apiserver是唯一一个可直接与集群存储通信的组件，它是etcd服务的客户端。

（2）Kubernetes集群CA及相关的数字证书

Kubernetes集群的其他各组件均需要通过kube-apiserver访问集群资源，同样出于安全性等目的，API Server也要借助HTTPS协议与其客户端通信，而X509双向数字证书认证仅是API Server支持的认证方式中的一种，客户端也可能会使用HTTP Basic或Bearer Token认证方式接入到API Server。

kubelet也通过HTTPS端点暴露了一组API，这些API提供了多个不同级别的敏感数据接口，并支持来自客户端的请求在节点和容器上执行不同级别的操作。默认情况下，匿名请求将自动隶属于system:unauthenticated用户组，其用户名为system:anonymous。不过，kubelet可使用--anonymous-auth=false选项拒绝匿名访问，并通过--client-ca-file选项指定CA方式验证客户端身份。kubelet可直接使用kubernetes-ca，同时应该为kube-apiserver使用--kubelet-client-certificate和--kubelet-client-key选项指定认证到kubelet的客户端证书与私钥。

（3）认证代理服务体系CA及相关的数字证书

APIServer支持将认证功能交由外部的其他认证服务代为完成，这些服务通过特定的响应头部返回身份验证的结果状态，API Server扩展服务就是认证代理的最常见应用场景之一。

除了API Server提供的核心API，Kubernetes还支持通过聚合层（aggregation layer）对其进行扩展。简单来说，聚合层允许管理员在群集中部署使用其他Kubernetes风格的API，例如service catalog或用户自定义的API Server等。聚合层本身打包在kube-apiserver程序中，并作为进程的一部分运行，但仅在管理员通过指定的APIService对象注册扩展资源之后，它才会代理转发相应的请求。而APIService则会由运行在Kubernetes集群上的Pod中的extention-apiserver实现。

创建一个APIService资源时，作为注册和发现过程的一部分，kube-aggregator控制器（位于kube-apiserver内部）将与extention-apiserver的HTTP2连接[1]，而后将经过身份验证的用户请求经由此连接代理到extention-apiserver上，于是，kube-aggregator被设置为执行RequestHeader客户端认证。不过，只有kube-apiserver在启动时使用了如下选项时，才能启用其内置的聚合层：

```java
▪--requestheader-client-ca-file=<path to aggregator CA cert>
▪--requestheader-allowed-names=front-proxy-client
▪--requestheader-extra-headers-prefix=X-Remote-Extra-
▪--requestheader-group-headers=X-Remote-Group
▪--requestheader-username-headers=X-Remote-User
▪--proxy-client-cert-file=<path to aggregator proxy cert>
▪--proxy-client-key-file=<path to aggregator proxy key>
```

proxy-client-cert-file和proxy-client-key-file包含kube-aggregator执行客户端证书身份验证的证书/密钥对，它使用requestheader-client-ca-file中指定的CA文件对聚合器证书进行签名。requestheader-allowed-names包含允许充当伪装前端代理的身份/名称列表（客户端证书中使用的CN），而requestheader-username-headers、requestheader-group-headers和requestheader-extraheaders-prefix携带一个HTTP头的列表，用于携带远程用户信息。

### 1.2 Kubernetes集群需要的数字证书

完整运行的Kubernetes系统需要为etcd、API Server及前端代理（front proxy）生成多个数字证书

另外，其他集群上运行的应用（Pod）同其客户端的通信经由不可信的网络传输时也可能需要用到TLS/SSL协议，例如Nginx Pod与其客户端间的通信，客户端来自于互联网时，此处通常需配置一个公信的服务端证书。

普通用户使用这种认证方式的前提是，它们各自拥有自己的数字证书，证书中的CN和O属性分别提供了准确的用户标识和用户组。API Server可接受或拒绝这些证书，评估标准在于证书是否由API Server信任的客户端证书CA（由选项--client-ca-file指定，默认为kubernetes-ca）所签发，但API Server自身并不了解这些证书，因此也不了解各个用户，它仅知道负责为各个客户端颁发证书的CA。因此，相较于静态密码文件认证和静态令牌文件认证来说，X509数字证书认证实现了用户管理与Kubernetes集群的分离，且有着更好的安全性。

X509数字证书认证因其可不依赖第三方服务、有着更好的安全性以及与API Server相分离等优势，成为Kubernetes系统内部默认使用的认证方式。但是，将X509数字证书用于普通用户认证的缺陷也是显而易见的，它主要表现在如下两个方面。

```java
▪证书的到期时间在颁发时设定，其生命周期往往很长（数月甚至数年），且事实上的身份验证功能也是在颁发时完成，若撤销用户的可用身份只能使用证书吊销功能完成。
▪现实使用中，证书通常由一些通用的签证机构签发，而API Server需要信任该CA；显然，获得该CA使用权限的用户便能够授予自己可认证到的Kubernetes的任意凭据或身份，因而集群管理员必须自行集中管理证书，管理员的工作量比较大。
```

对于大型组织来说，Kubernetes系统用户量大且变动频繁，静态密码文件和静态令牌文件认证方式动辄需要重启API Server，而X509认证中的证书维护开销较高且无法灵活变动凭据生效期限，因此这些认证方式都非理想选择。实践中，人们通常使用ID Token进行Kubernetes的普通用户身份认证，API Server的OpenID Connect令牌认证插件即用于该场景。

## 2、TLS Bootstrapping机制

TLSBootstrapping机制有什么用途呢？

新的工作节点接入Kubernetes集群时需要事先配置好相关的证书和私钥等以进行安全通信，管理员可以手动管理这些证书，也可以选择由kubelet自行生成私钥和自签证书。集群略具规模后，第一种方式无疑会为管理员带来不小的负担，但对于保障集群安全运行却又必不可少。第二种方式降低了管理员的工作量，却也损失了PKI本身具有的诸多优势。取而代之，Kubernetes采用了由kubelet自行生成私钥和证书签署请求，而后发送给集群上的证书签署进程（CA），由管理员审核后予以签署或直接由控制器进程自动统一签署。这种方式就是kubelet TLS Bootstrapping机制，它实现了前述第一种方式的功能，却基本不增加管理员工作量。

一旦开启TLS Bootstrapping功能，任何kubelet进程都可以向API Server发起验证请求并加入到集群中，包括那些非计划或非授权主机，这必将增大管理验证操作时的审核工作量。为此，API Server设计了可经由--enable-bootstrap-token-auth选项启用的Bootstrap Token（引导令牌）认证插件。该插件用于加强TLS Bootstrapping机制，仅那些通过Bootstrap Token认证的请求才可以使用TLS Bootstrapping发送证书签署请求给控制平面，并由相应的审批控制器（approval controller）完成证书签署和分发。

```java
说明：kubeadm启用了节点加入集群时的证书自动签署功能，因此加入过程在kubeadm join命令成功后即完成。
```

Kubelet会把签署后的证书及配对的私钥存储到--cert-dir选项指定的目录下，并以之生成kubeconfig格式的配置文件，该文件的保存路径以--kubeconfig选项指定，它保存有API Server的地址以及认证凭据。若指定的kubeocnfig配置文件不存在，kubelet会转而使用Bootstrap Token，从API Server自动请求完成TLS Bootstrapping过程。kube-controller-manager内部有一个用于证书颁发的控制循环，它采用了类似于cfssl签证器格式的自动签证器，颁发的所有证书默认具有一年有效期限。正常使用中的Kubernetes集群需要在证书过期之前完成更新，以免集群服务不可用。较新版本的kubeadm部署工具已经能够自动完成更新，如下第一条命令用于检测证书有效期限，在接近过期时间的情况下，即可使用第二条命令进行更新。

```java
~# kubeadm alpha certs check-expiration
~# kubeadm alpha certs renew all
```

Kubernetes 1.8之后的版本中使用的csrapproving审批控制器内置于kube-controller-manager，并且默认为启用状态。此审批控制器使用SubjectAccessview API确认给定的用户是否有权限请求CSR（证书签署请求），而后根据授权结果判定是否予以签署。不过，为了避免同其他审批器冲突，内置的审批器并不显式拒绝CSR，而只是忽略它们。

## 四、kubeconfig配置文件

基于无状态协议HTTP/HTTPS的API Server需要验证每次连接请求中的用户身份，因而kube-controller-manager、kube-scheduler和kube-proxy等各类客户端组件必须能自动完成身份认证信息的提交，但通过程序选项来提供这些信息会导致敏感信息泄露。另外，管理员还面临着使用kubectl工具分别接入不同集群时的认证及认证信息映射难题。为此，Kubernetes设计了一种称为kubeconfig的配置文件，它保存有接入一到多个Kubernetes集群的相关配置信息，并允许管理员按需在各配置间灵活切换。

客户端程序可通过默认路径、--kubeconfig选项或者KUBECONFIG环境变量自定义要加载的kubeconfig文件，从而能够在每次的访问请求中可认证到目标API Server。

## 1、kubeconfig文件格式

kubeconfig文件中，各集群的接入端点以列表形式定义在clusters配置段中，每个列表项代表一个Kubernetes集群，并拥有名称标识；各身份认证信息（credentials）定义在users配置段中，每个列表项代表一个能够认证到某Kubernetes集群的凭据。将身份凭据与集群分开定义以便复用，具体使用时还要以context（上下文）在二者之间按需建立映射关系，各context以列表形式定义在contexts配置段中，而当前使用的映射关系则定义在current-context配置段中。

使用kubeadm初始化Kubernetes集群过程中，在Master节点上生成的/etc/kubernetes/admin.conf文件就是一个kubeconfig格式的文件，它由kubeadm init命令自动生成，可由kubectl加载后接入当前集群的API Server。kubectl加载kubeconfig文件的默认路径为$HOME/.kube/config，在kubeadm init命令初始化集群过程中有一个步骤便是将/etc/kubernetes/admin.conf复制为该默认搜索路径上的文件。当然，我们也可以通过--kubeconfig选项或KUBECONFIG环境变量将其修改为其他路径。

kubectl config view命令能打印kubeconfig文件的内容，下面的命令结果显示了默认路径下的文件配置，包括集群列表、用户列表、上下文列表以及当前使用的上下文（current-context）等。

```java
[root@k8s-master01 ~]# kubectl config view 
apiVersion: v1
#k8s的集群列表
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://192.168.32.201:6443
  name: cluster1
#上下文列表
contexts:
- context:
    cluster: cluster1
    user: admin
  name: context-cluster1-admin
#当前上下文列表
current-context: context-cluster1-admin
#用户列表
kind: Config
preferences: {}
users:
- name: admin
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
```

用户也可以在kubeconfig配置文件中按需自定义相关的配置信息，以实现使用不同的用户账户接入集群等功能。kubeconfig是一个文本文件，尽管可以使用文本处理工具直接编辑它，但强烈建议用户使用kubectl config及其子命令进行该文件的设定，以便利用其他自动进行语法检测等额外功能。

kubectl config的常用子命令有如下几项:

```java
▪view：打印kubeconfig文件内容。
▪set-cluster：设定新的集群信息，以单独的列表项保存于clusters配置段。
▪set-credentials：设置认证凭据，保存为users配置段的一个列表项。
▪set-context：设置新的上下文信息，保存为contexts配置段的一个列表项。
▪use-context：设定current-context配置段，确定当前以哪个用户的身份接入到哪个集群之中。
▪delete-cluster：删除clusters中指定的列表项。
▪delete-context：删除contexts中指定的列表项。
▪get-clusters：获取clusters中定义的集群列表。
▪get-contexts：获取contexts中定义的上下文列表。
```

kubectl config命令的相关操作将针对加载的单个kubeconfig文件进行，它根据其优先级由高到低，依次搜索--kubeconfig选项指定的文件、KUBECONFIG环境变量指定的文件和默认的.HOME/.kube/config文件，以其中任何一种方式加载到配置文件后即可终止搜索过程。不过，kubectl config命令支持同时使用多个kubeconfig文件，以及将多个配置文件合并为一个。

## 2、自定义kubeconfig文件

一个完整kubeconfig配置的定义至少应该包括集群、身份凭据、上下文及当前上下文4项，但在保存有集群和身份凭据的现有kubeconfig文件基础上添加新的上下文时，可能只需要提供身份凭据而复用已有的集群定义，具体的操作步骤要按实际情况进行判定。

### 2.1 基于静态密码文件认证

例如，我们下面尝试创建一个新的kubeconfig文件，设定它使用此前定义的基于静态密码文件认证的ilinux用户接入到现有的Kubernetes集群，该集群API Server的网络端点为[https://192.168.32.248:6443](https://192.168.32.248:6443/)，相关的CA证书保存在Master节点上的/etc/kubernetes/pki/ca.crt文件中，而配置结果则使用--kubeconfig选项保存在当前用户主目录下的.kube/kube-dev.config文件中。

步骤1：添加集群配置，包括集群名称、API Server URL和信任的CA的证书；clusters配置段中的各列表项名称需要唯一。

kubeadm部署的k8s集群

```java
[root@k8s-master01 ~]# kubectl config set-cluster kube-dev --embed-certs=true \
--certificate-authority=/etc/kubernetes/pki/ca.crt  \
--server="https://192.168.32.248:6443"  \
--kubeconfig=$HOME/.kube/kube-dev.config
```

步骤2：添加身份凭据，使用静态密码文件认证的客户端提供用户名和密码即可。

```java
[root@k8s-master01 ~]# kubectl config set-credentials ilinux \
--username=ilinux --password=ilinux@123 \
--kubeconfig=$HOME/.kube/kube-dev.config
User "ilinux" set.
```

步骤3：以用户ilinux的身份凭据与kube-dev集群建立映射关系。

```java
[root@k8s-master01 ~]# kubectl config set-context ilinux@kube-dev \
--cluster=kube-dev --user=ilinux \
--kubeconfig=$HOME/.kube/kube-dev.config
Context "ilinux@kube-dev" created.
```

步骤4：设置当前上下文为ilinux@kube-dev

```java
[root@k8s-master01 ~]# kubectl config use-context ilinux@kube-dev --kubeconfig=$HOME/.kube/kube-dev.config
Switched to context "ilinux@cluster1".
```

步骤5：预览kube-dev.config文件，确认其配置信息。

```java
[root@k8s-master01 ~]#  kubectl config view --kubeconfig=$HOME/.kube/kube-dev.config
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://192.168.32.248:6443
  name: kube-dev
contexts:
- context:
    cluster: kube-dev
    user: ilinux
  name: ilinux@kube-dev
current-context: ilinux@kube-dev
kind: Config
preferences: {}
users:
- name: ilinux
  user:
    password: ilinux@123
    username: ilinux
```

步骤6：使用该kubeconfig中的当前上下文进行测试访问；该用户仅被授权了default名称空间的所有权限，因而不具有列出集群级别资源的权限，但能查看default名称空间的状态。

```java
[root@k8s-master01 ~]#kubectl get namespaces --kubeconfig=$HOME/.kube/kube-dev.config
Error from server (Forbidden): namespaces is forbidden: User "ilinux" cannot list resource "namespaces" in API group "" at the cluster scope
~$ kubectl get namespaces/default --kubeconfig=$HOME/.kube/kube-dev.config
NAME       STATUS     AGE
default    Active     3d
#有时需要重新拷贝admin.conf文件
#[root@k8s-master01 ~]#cp /etc/kubernetes/admin.conf /root/.kube/config
```

上面的第6步确认了自定义配置中的ilinux用户有效可用，它被API Server借助静态密码文件认证插件完成认证并标识为ilinux用户，从而拥有该用户的资源操作权限。为了进一步测试并了解kubeconfig的使用格式，下面把基于令牌文件认证的ik8s用户添加进同一个kubeconfig文件中。ik8s用户同ilinux用户位于同一集群上，因此，我们可省略添加集群的步骤而直接复用它。

步骤7：添加身份凭据，使用静态令牌文件认证的客户端认证时只需要提供静态令牌信息

```java
~$ TOKEN=$(sudo awk -F "," '$2=="ik8s"{print $1}' /etc/kubernetes/authfiles/token.csv)
~$ kubectl config set-credentials ik8s --token="$TOKEN" \
      --kubeconfig=$HOME/.kube/kube-dev.config
User "ik8s" set.
```

步骤8：为用户ik8s的身份凭据与kube-dev集群建立映射关系。

```java
~$ kubectl config set-context ik8s@kube-dev \
    --cluster=kube-dev --user=ik8s \
    --kubeconfig=$HOME/.kube/kube-dev.config
Context "ik8s@kube-dev" created.
```

步骤9：将当前上下文切换为ik8s@kube-dev。

```java
~$ kubectl config use-context ik8s@kube-dev --kubeconfig=$HOME/.kube/kube-dev.config
Switched to context "ik8s@kube-dev".
```

步骤10：预览kube-dev.config文件，确认ik8s用户相关的各项配置信息。

```java
$ kubectl config view --kubeconfig=$HOME/.kube/kube-dev.config
```

步骤11：依旧使用当前上下文发起集群访问测试，ik8s用户未获得任何授权，但它能够被系统识别为ik8s用户，这表示身份认证请求成功返回；我们这次使用kubectl的whoami插件进行测试：

```java
~ $ kubectl whoami --kubeconfig=$HOME/.kube/kube-dev.config
ik8s
```

```java
说明：事实上除了静态令牌，客户端认证到API Server的各种令牌都可以使用前面的这种方式添加到kubeconfig文件中，包括ServiceAccount令牌、OpenID Connnect令牌和Bootstrap令牌等。
```

当kubectl引用了拥有两个及以上context的kubeconfig文件时，可随时通过kubectl config use-context命令在不同上下文之间切换，它们可能使用不同的身份凭据接入相同的集群或不同的集群之上。如下命令结果表示当前加载的配置文件中共有两个context，而拥有星号标识的是当前使用的context，即current-context。

```java
~ kubectl config get-contexts --kubeconfig=HOME/.kube/kube-dev.config
CURRENT   NAME               CLUSTER    AUTHINFO   NAMESPACE
- ik8s@kube-dev      kube-dev   ik8s       
ilinux@kube-dev    kube-dev   ilinux
```

实践中，API Server支持的X509数字证书认证和OpenID Connect令牌认证才是客户端使用最多的认证方式.

### 2.2 X509数字证书身份凭据

kubeadm部署Kubernetes集群的过程中会自动生成多个kubeconfig文件，它们是默认位于/etc/kubernetes目录下以.conf为后缀名的文件，前缀名称代表了它的适用场景，其中的admin.conf中保存了以X509数字证书格式提供身份凭据的kubernetes-admin用户，该用户能够以管理员的身份对当前集群发起资源操作请求。

由kubeadm初始化的Kubernetes集群上，kube-apiserver默认信任的CA就是集群自己的kubernetes-ca，该CA的数字证书是Master节点之上的/etc/kubernetes/pki/ca.crt文件。于是，客户端按需生成证书签署请求，再由管理员通过kubernetes-ca为客户端签署证书，便可让客户端以其证书中的CN为用户名认证到API Server上。为了便于说明问题，下面将客户端生成私钥和证书签署请求，服务器签署该请求，以及客户端将证书配置为kubeconfig文件的步骤统一进行说明，所有操作都在Master节点上运行。

步骤1：以客户端的身份，生成目标用户账号mason的私钥及证书签署请求，保存在用户主目录下的.certs目录中。

①生成私钥文件，注意其权限应该为600以阻止其他用户读取。

```java
[root@k8s-master01 ~]# mkdir $HOME/.certs
[root@k8s-master01 ~]# (umask 077; openssl genrsa -out $HOME/.certs/mason.key 2048)
Generating RSA private key, 2048 bit long modulus
.............................................+++
...............................+++
e is 65537 (0x10001)
```

②创建证书签署请求，-subj选项中CN的值将被API Server识别为用户名，O的值将被识别为用户组。

```java
[root@k8s-master01 ~]# openssl req -new -key $HOME/.certs/mason.key \
     -out $HOME/.certs/mason.csr \
     -subj "/CN=mason/O=developers"
```

步骤2：以kubernetes-ca的身份签署ikubernetes的证书请求，这里直接读取相关的CSR文件，并将签署后的证书仍然保存在当前系统用户主目录下的.certs中。

①基于kubernetes-ca签署证书，并为其设置合理的生效时长，例如365天。

```java
[root@k8s-master01 ~]# openssl x509 -req -days 365 -CA /etc/kubernetes/pki/ca.crt \
 -CAkey /etc/kubernetes/pki/ca.key -CAcreateserial \
 -in $HOME/.certs/mason.csr -out $HOME/.certs/mason.crt
Signature ok
subject=/CN=mason/O=developers
Getting CA Private Key
```

②必要时，还可以验证生成的数字证书的相关信息（可选）

```java
[root@k8s-master01 ~]# openssl x509 -in $HOME/.certs/mason.crt -text -noout
```

步骤3：以ikubernetes的身份凭据生成kubeconfig配置，将其保存在kubectl默认搜索路径指向的$HOME/.kube/config文件中。另外，因指向当前集群的配置项已经存在，即位于clusters配置段中的kubernetes，这里直接复用该集群定义。

①根据X509数字证书及私钥创建身份凭据，列表项名称同目标用户名。

```java
[root@k8s-master01 ~]# kubectl config set-credentials mason --embed-certs=true \
       --client-certificate=$HOME/.certs/mason.crt \
       --client-key=$HOME/.certs/mason.key    
User "mason" set.
```

②配置context，以mason的身份凭据访问已定义的Kubernetes集群，该context的名称为mason@kubernetes。

```java
[root@k8s-master01 ~]# kubectl config set-context mason@kubernetes --cluster=kubernetes --user=mason
Context "mason@kubernetes" created.
```

③将当前上下文切换为mason@kubernetes，或直接在kubectl命令上使用“--context= 'mason@kubernetes'”以完成该用户的认证测试，下面的命令选择了以第二种方式进行认证，虽然提示权限错误，但mason用户已被API Server正确识别；

```java
[root@k8s-master01 ~]# kubectl get namespaces/default --context='mason@kubernetes'
Error from server (Forbidden): namespaces "default" is forbidden: User "mason" cannot get resource "namespaces" in API group "" in the namespace "default"
```

通过创建自定义的数字证书，实现了将mason用户认证到API Server，并将该用户的身份凭据保存至kubeconfig文件中。还没有给该用户授权。

## 3、多kubeconfig文件与合并

kubectl config一次仅能使用单个kubeconfig文件。事实上，若将两个文件路径以冒号分隔并赋值给KUBECONFIG环境变量，也能够让kubectl config一次加载多个文件信息，优先级由高到低为各文件自左而右的次序。下面两条命令的结果显示，左侧文件拥有较高的优先级，因而其配置的current-context成为默认使用的context。

```java
[root@k8s-master01 ~]# export KUBECONFIG="$HOME/.kube/config:$HOME/.kube/kube-dev.config"
[root@k8s-master01 ~]# kubectl config get-contexts
CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
          ilinux@kube-dev               kube-dev     ilinux             
*         kubernetes-admin@kubernetes   kubernetes   kubernetes-admin   
          mason@kubernetes              kubernetes   mason              
```

联合使用多个kubeconfig时，同样可以按需调整当前使用的context，其实现方式同使用单个kubeconfig文件并没有不同之处。

```java
[root@k8s-master01 ~]# kubectl config use-context mason@kubernetes
Switched to context "mason@kubernetes".
[root@k8s-master01 ~]# kubectl config get-contexts 
CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
          ilinux@kube-dev               kube-dev     ilinux             
          kubernetes-admin@kubernetes   kubernetes   kubernetes-admin   
*         mason@kubernetes              kubernetes   mason
```

kubectl config view命令会将多个配置文件的内容按给定的次序连接并输出，其风格类似于Linux系统的cat命令。但我们也能够在view命令中将加载的多个配置文件展平为单个配置文件的格式予以输出，并将结果保存在指定路径下便能将多个kubeconfig文件合并为一。例如，下面的命令便将KUBECONFIG环境变量中指定的两个kubeconfig文件合并成了单个配置文件。

```java
[root@k8s-master01 ~]#kubectl config view --merge --flatten  > $HOME/.kube/kube.config
```

此时，切换kubectl config加载新生成的kubeconfig配置文件，它便直接拥有了此前两个文件中定义的所有信息，且current-context亦遵循此前命令中的设定，即mason@kubernetes。

```java
[root@k8s-master01 ~]# KUBECONFIG="$HOME/.kube/kube.config"
[root@k8s-master01 ~]# kubectl config get-contexts
CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
          ilinux@kube-dev               kube-dev     ilinux             
          kubernetes-admin@kubernetes   kubernetes   kubernetes-admin   
*         mason@kubernetes              kubernetes   mason   
```

## 4、为指定用户配置apiserver访问认证

### 4.1 生成私钥和证书签署请求

①生成私钥文件，注意其权限应该为600以阻止其他用户读取。

```java
[root@k8s-master01 ~]# mkdir $HOME/.certs
[root@k8s-master01 ~]# (umask 077; openssl genrsa -out $HOME/.certs/mason.key 2048)
Generating RSA private key, 2048 bit long modulus
.............................................+++
...............................+++
e is 65537 (0x10001)
```

②创建证书签署请求，-subj选项中CN的值将被API Server识别为用户名，O的值将被识别为用户组。

```java
[root@k8s-master01 ~]# openssl req -new -key $HOME/.certs/mason.key \
     -out $HOME/.certs/mason.csr \
     -subj "/CN=mason/O=developers"
```

### 4.2 以kubernetes-ca的身份签署请求证书

基于kubernetes-ca签署证书，并为其设置合理的生效时长，例如365天。

```java
[root@k8s-master01 ~]# openssl x509 -req -days 365 -CA /etc/kubernetes/pki/ca.crt \
 -CAkey /etc/kubernetes/pki/ca.key -CAcreateserial \
 -in $HOME/.certs/mason.csr -out $HOME/.certs/mason.crt
Signature ok
subject=/CN=mason/O=developers
Getting CA Private Key
```

**4、** 3生成mason-kube.config；

以ikubernetes的身份凭据生成kubeconfig配置，将其保存在kubectl默认搜索路径指向的$HOME/.kube/mason-kube.config文件中。另外，因指向当前集群的配置项已经存在，即位于clusters配置段中的kubernetes，这里直接复用该集群定义。

①生成kubeconfig授权文件：

```java
[root@k8s-master01 ~]#kubectl config set-cluster kubernetes \
--certificate-authority=/etc/kubernetes/pki/ca.crt \
--embed-certs=true \
--server=https://192.168.32.248:6443 \
--kubeconfig=$HOME/.kube/mason-kube.config
```

②设置客户端认证

```java
[root@k8s-master01 ~]#kubectl config set-credentials mason \
--client-key=$HOME/.certs/mason.key \
--client-certificate=$HOME/.certs/mason.crt \
--embed-certs=true \
--kubeconfig=$HOME/.kube/mason-kube.config
```

③配置context，以mason的身份凭据访问已定义的Kubernetes集群，该context的名称为mason@kubernetes。

```java
[root@k8s-master01 ~]#kubectl config set-context mason@kubernetes \
--cluster=kubernetes \
--user=mason \
--kubeconfig=$HOME/.kube/mason-kube.config
```

④切换当前上下文

```java
[root@k8s-master01 ~]# kubectl config use-context mason@kubernetes --kubeconfig=$HOME/.kube/mason-kube.config
```

⑤直接在kubectl命令上使用“--context= 'mason@kubernetes'”以完成该用户的认证测试，下面的命令选择了以第二种方式进行认证，虽然提示权限错误，但mason用户已被API Server正确识别。

```java
[root@k8s-master01 .kube]# kubectl get ns --kubeconfig=$HOME/.kube/mason-kube.config
Error from server (Forbidden): namespaces is forbidden: User "mason" cannot list resource "namespaces" in API group "" at the cluster scope
```

## 五、基于角色的访问控制：RBAC

DAC（自主访问控制）、MAC（强制访问控制）、RBAC（基于角色的访问控制）和ABAC（基于属性的访问控制）这4种主流的权限管理模型中，Kubernetes支持使用后两种完成普通账户和服务账户的权限管理，另外支持的权限管理模型还有Node和Webhook两种。

RBAC是一种新型、灵活且使用广泛的访问控制机制，它将权限授予角色，通过让“用户”扮演一到多个“角色”完成灵活的权限管理，这有别于传统访问控制机制中将权限直接赋予使用者的方式。相对于Kubernetes支持的ABAC和Webhook等授权机制，RBAC具有如下优势：

```java
▪对集群中的资源和非资源型URL的权限实现了完整覆盖。
▪整个RBAC完全由少数几个API对象实现，而且与其他API对象一样可以用kubectl或API调用进行操作。
▪支持权限的运行时调整，无须重新启动API Server。
```

## 1、RBAC授权模型

RBAC是一种特定的权限管理模型，它把可以施加在“资源对象”上的“动作”称为“许可权限”，这些许可权限能够按需组合在一起构建出“角色”及其职能，并通过为“用户账户或组账户”分配一到多个角色完成权限委派。这些能够发出动作的用户在RBAC中也称为“主体”。

RBAC中用户、角色与权限之间的关系：

RBAC访问控制模型中，授权操作只能通过角色完成，主体只有在分配到角色之后才能行使权限，且仅限于从其绑定的各角色之上继承而来的权限。换句话说，用户的权限仅能够通过角色分配获得，未能得到显式角色委派的用户则不具有任何权限。

简单来说，RBAC就是一种访问控制模型，它以角色为中心界定“谁”（subject）能够“操作”（verb）哪个或哪类“对象”（object）。动作的发出者即“主体”，通常以“账号”为载体，在Kubernetes系统上，它可以是普通账户，也可以是服务账户。“动作”用于表明要执行的具体操作，包括创建、删除、修改和查看等行为，对于API Server来说，即PUT、POST、DELETE和GET等请求方法。而“对象”则是指管理操作能够施加的目标实体，对Kubernetes API来说主要指各类资源对象以及非资源型URL。API Server是RESTful风格的API，各类客户端由认证插件完成身份验证，而后通过HTTP协议的请求方法指定对目标对象的操作请求，并由授权插件进行授权检查，而操作的对象则是URL路径指定的REST资源。

Kubernetes系统上的普通账户或服务账户向API Server发起资源操作请求，并以相应HTTP方法承载，如下图所示，由运行在API Server之上的授权插件RBAC进行鉴权。

## 2、Role、RoleBinding、ClusterRole和ClusterRoleBinding

Kubernetes系统的RBAC授权插件将角色分为Role和ClusterRole两类，它们都是Kubernetes内置支持的API资源类型，其中Role作用于名称空间级别，用于承载名称空间内的资源权限集合，而ClusterRole则能够同时承载名称空间和集群级别的资源权限集合。Role无法承载集群级别的资源类型的操作权限，这类的资源包括集群级别的资源（例如Nodes）、非资源类型的端点（例如/healthz），以及作用于所有名称空间的资源（例如跨名称空间获取任何资源的权限）等。利用Role和ClusterRole两类角色进行赋权时，需要用到另外两种资源RoleBinding和ClusterRoleBinding，它们同样是由API Server内置支持的资源类型。RoleBinding用于将Role绑定到一个或一组用户之上，它隶属于且仅能作用于其所在的单个名称空间。RoleBinding可以引用同一名称中的Role，也可以引用集群级别的ClusterRole，但引用ClusterRole的许可权限会降级到仅能在RoleBinding所在的名称空间生效。而ClusterRoleBinding则用于将ClusterRole绑定到用户或组，它作用于集群全局，且仅能够引用ClusterRole。

全局作用范围的User2因通过A名称空间中的RoleBinding关联至Role-A上，因而它仅能在NamespaceA名称空间中发挥作用。名称空间B中的ServiceAccount1通过RoleBinding关联至集群级别的ClusterRole-M上，对该账户来说，ClusterRole-M上的操作权限也仅限于该名称空间。全局级别的用户User1通过ClusterRoleBindig关联到ClusterRole-M，因而，该用户将在集群级别行使该角色的权限。

Kubernetes集群用户大体规划为集群管理员、名称空间管理员和用户（通常为开发人员）3类。

```java
▪集群管理员可以创建、读取、更新和删除任何策略对象，能够创建命名空间并将其分配给名称空间管理员；此角色适用于在整个集群中管理所有租户或项目的管理员。
▪名称空间管理员可以管理其名称空间中的用户，此角色适用于特定单一租户或项目的管理员。
▪开发者用户可以创建、读取、更新和删除名称空间内的非策略对象，如Pod、Job和Ingress等，但只在它们有权访问的名称空间中拥有这些权限。
```

另外，有些特殊的应用程序可能还会需要一些比较特殊的权限集合，例如集群或名称空间级别的只读权限等，我们可以在必要时按需定义这些较为特别的角色。

### 2.1 、Role与ClusterRole

Role和ClusterRole是API Server内置的两种资源类型，它们在本质上都只是一组许可权限的集合。Role和ClusterRole的资源规范完全相同，该规范没有使用spec字段，而是直接使用rules字段嵌套授权规则列表。规则的基本要素是动作（verb）和相关的目标资源，后者支持指定一个或多个资源类型、特定资源类型下的单个或多个具体的资源，以及非资源类型的URL等。在Role和ClusterRole资源上定义的rules也称为PolicyRule，即策略规则，它可以内嵌的字段有如下几个。

```java
1）apiGroups <[]string>：目标资源的API群组名称，支持列表格式指定多个组，空值（""）表示核心群组。
2）resources <[]string>：规则应用的目标资源类型，例如pods、services、deployments和daemonsets等，未同时使用resourceNames字段时，表示指定类型下的所有资源。ResourceAll表示所有资源。
3）resourceNames <[]string>：可选字段，指定操作适用的具体目标资源名称。
4）nonResourceURLs <[]string>：用于定义用户有权限访问的网址列表，它并非名称空间级别的资源，因此只能应用于ClusterRole，Role支持此字段仅是为了格式上的兼容；该字段在一条规则中与resources和resourceNames互斥。
5）verbs <[]string>：可应用在此规则匹配到的所有资源类型的操作列表，可用选项有get、list、create、update、patch、watch、proxy、redirect、delete和deletecollection；此为必选字段。
```

下面的配置清单示例（pods-reader-rbac.yaml）在default名称空间中定义了一个名称为Role的资源，它设定了读取、列出及监视pods和services资源，以及pods/log子资源的许可权限。

```java
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pods-reader
rules:
- apiGroups: [""]   "" 表示核心API群组
  resources: ["pods", "services", "pods/log"]资源对象
  verbs: ["get", "list", "watch"]授权
```

绝大多数资源可通过其资源类型的名称引用，例如pods或services等，这些名称与它们在API endpoint中的形式相同。另外，有些资源类型支持子资源，例如Pod对象的/log，Node对象的/status等，它们在API Server上的URL形如下面的表示格式。

```java
/api/v1/namespaces/{namespace}/pods/{name}/log
```

RBAC角色引用这种类型的子资源时需要使用resource/subresource的格式，例如上面示例规则中的pods/log。另外，还可以通过直接给定资源名称（resourceName）来引用特定的资源，仅支持get、delete、update和patch等。

ClusterRole资源隶属于集群级别，它引用名称空间级别的资源意味着相关的操作权限能够在所有名称空间生效，同时，它也能够引用Role所不支持的集群级别的资源类型，例如nodes和persistentvolumes等。下面的清单示例（nodes-admin-rbac.yaml）定义了ClusterRole资源nodes-admin，它拥有管理集群节点信息的权限。ClusterRole不属于名称空间，所以其配置不能够使用metadata.namespace字段。

```java
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nodes-admin
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["*"]
```

将上面两个清单中分别定义的Role和ClusterRole资源创建到集群上，以便按需调用并验证其权限。

```java
[root@k8s-master01 apps]# kubectl apply -f pods-reader-rbac.yaml -f nodes-admin-rbac.yaml 
role.rbac.authorization.k8s.io/pods-reader created
clusterrole.rbac.authorization.k8s.io/nodes-admin created
```

Role或ClusterRole资源的详细描述能够以比较直观的方式打印相关的规则定义，由kubectl describe roles/pods-reader clusterroles/nodes-admin命令输出的规则定义。

```java
[root@k8s-master01 apps]# kubectl describe roles pods-reader
Name:         pods-reader
Labels:       <none>
Annotations:  <none>
PolicyRule:
  Resources  Non-Resource URLs  Resource Names  Verbs
  ---------  -----------------  --------------  -----
  pods/log   []                 []              [get list watch]
  pods       []                 []              [get list watch]
  service    []                 []              [get list watch]
[root@k8s-master01 apps]# kubectl describe clusterroles nodes-admin
Name:         nodes-admin
Labels:       <none>
Annotations:  <none>
PolicyRule:
  Resources  Non-Resource URLs  Resource Names  Verbs
  ---------  -----------------  --------------  -----
  nodes      []                 []              [*]
```

kubectl命令也分别提供了创建Role和ClusterRole资源的命令式命令，create role和create clusterrole，它们支持如下几个关键选项。

```java
▪--verb：指定可施加于目标资源的动作，支持以逗号分隔的列表值，也支持重复使用该选项分别指定不同的动作，例如--verb=get,list,watch，或者--verb=get --verb=list --verb=watch。
▪--resource：指定目标资源类型，使用格式类似于--verb选项。
▪--resource-name：指定目标资源，使用格式类似于--verb选项。
▪--non-resource-url：指定非资源类型的URL，使用格式类似于--verb选项，但仅适用于clusterrole资源。
```

例如，下面的第一条命令创建了dev名称空间，第二条命令在该名称空间创建了一个具有所有资源管理权限的roles/admin资源，第三条命令则创建了一个有PVC和PV资源管理权限的clusterroles/pv-admin资源。

```java
[root@k8s-master01 ~]# kubectl create namespace dev 
namespace/dev created
[root@k8s-master01 ~]# kubectl create role admin -n dev --resource="*.*" \
       --verb="get,list,watch,create,delete,deletecollection,patch,update"
role.rbac.authorization.k8s.io/admin created
[root@k8s-master01 ~]# kubectl create clusterrole pv-admin --verb="*" \
       --resource="persistentvolumeclaims,persistentvolumes"
clusterrole.rbac.authorization.k8s.io/pv-admin created
```

Role或ClusterRole对象本身并不能作为动作的执行主体，它们需要“绑定”到主体（例如User、Group或Service Account）之上完成赋权，而后由相应主体执行资源操作。

### 2.2 RoleBinding与ClusterRoleBinding

RoleBinding负责在名称空间级别向普通账户、服务账户或组分配Role或ClusterRole，而ClusterRoleBinding则只能用于在集群级别分配ClusterRole。但二者的配置规范格式完全相同，它们没有spec字段，直接使用subjects和roleRef两个嵌套的字段。其中，subjects的值是一个对象列表，用于给出要绑定的主体，而roleRef的值是单个对象，用于指定要绑定的Role或ClusterRole资源。

subjects字段的可嵌套字段如下:

```java
▪apiGroup <string>：要引用的主体所属的API群组，对于ServiceAccount类的主体来说默认为""，而User和Group类主体的默认值为"rbac.authorization.k8s.io"。
▪kind <string>：要引用的资源对象（主体）所属的类别，可用值为User、Group和ServiceAccount，必选字段。
▪name <string>：引用的主体的名称，必选字段。
▪namespace <string>：引用的主体所属的名称空间，对于非名称空间类型的主体，例如User和Group，其值必须为空，否则授权插件将返回错误信息。
```

roleRef的可嵌套字段如下:

```java
▪apiGroup <string>：引用的资源（Role或ClusterRole）所属的API群组，必选字段。
▪kind <string>：引用的资源所属的类别，可用值为Role或ClusterRole，必选字段。
▪name <string>：引用的资源（Role或ClusterRole）的名称。
```

需要注意的是，RoleBinding仅能够引用同一名称空间中的Role资源。

例如下面配置清单中的RoleBindings在dev名称空间中把admin角色分配给前面配置的用户mason，从而mason拥有了此角色之上的所有许可授权。

配置role角色admin

```java
[root@k8s-master01 ~]# kubectl create namespace dev 
namespace/dev created
[root@k8s-master01 ~]# kubectl create role admin -n dev --resource="*.*" \
       --verb="get,list,watch,create,delete,deletecollection,patch,update"
role.rbac.authorization.k8s.io/admin created
[root@k8s-master01 apps]# kubectl describe roles admin -n dev
Name:         admin
Labels:       <none>
Annotations:  <none>
PolicyRule:
  Resources  Non-Resource URLs  Resource Names  Verbs
  ---------  -----------------  --------------  -----
  *.*        []                 []              [get list watch create delete deletecollection patch update]
```

将role角色admin与普通用户mason绑定

```java
[root@k8s-master01 apps]# vim mason-rolebindings.yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: mason-admin
  namespace: dev
subjects:
- kind: User
  name: mason
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

在绑定role角色之前,mason用户无法在dev命名空间下创建pod

```java
[root@k8s-master01 apps]# kubectl run demoapp --image="ikubernetes/demoapp:v1.0" -n dev --kubeconfig=/root/.kube/mason-kube.config
Error from server (Forbidden): pods is forbidden: User "mason" cannot create resource "pods" in API group "" in the namespace "dev"
```

示例中的RoleBinding资源mason-admin创建到集群上，便能够以该用户的身份测试其继承而来的权限是否已然生效。下面以--config选项临时将用户切换为mason进行资源管理，测试命令及结果显示，mason已然具有dev名称空间下的资源操作权限。

```java
[root@k8s-master01 apps]# kubectl apply -f mason-rolebindings.yaml 
rolebinding.rbac.authorization.k8s.io/mason-admin created
[root@k8s-master01 apps]# kubectl run demoapp --image="ikubernetes/demoapp:v1.0" -n dev --kubeconfig=/root/.kube/mason-kube.config
pod/demoapp created
[root@k8s-master01 apps]# kubectl get pods -n dev --kubeconfig=/root/.kube/mason-kube.config
NAME      READY   STATUS    RESTARTS   AGE
demoapp   1/1     Running   0          11s
[root@k8s-master01 apps]# kubectl delete pods demoapp -n dev --kubeconfig=/root/.kube/mason-kube.config
pod "demoapp" deleted
```

RoleBinding也能够为主体分配集群角色，但它仅能赋予主体访问RoleBinding资源本身所在的名称空间之内的、由ClusterRole所持有的权限。例如，对于具有PVC和PV管理权限的clusterroles/pv-admin来说，在dev名称空间中使用RoleBinding将其分配给用户mason，意味着mason仅对dev名称空间下的PVC资源具有管理权限，它无法继承clusterroles/pv-admin除dev名称空间之外的其他名称空间中的PVC管理权限，更不能继承集群级别资源PV的任何权限。

一种高效分配权限的做法是，由集群管理员在集群范围预先定义好一组具有名称空间级别资源权限的ClusterRole资源，而后由RoleBinding分别在不同名称空间中引用它们，从而在多个名称空间向不同用户授予RoleBinding所有名称空间下的相同权限。

Role和RoleBinding是名称空间级别的资源，它们仅能用于完成单个名称空间内的访问控制，需要赋予某主体多个名称空间中的访问权限时就不得不在各名称空间分别进行。若需要完成集群全局的资源管理授权，或者希望资源操作能够针对Nodes、Namespaces和PersistentVolumes等集群级别的资源进行，或者针对/api、/apis、/healthz或/version等非资源型URL路径进行，就需要使用ClusterRoleBinding。

```java
说明;nonResourceURLs资源仅支持get访问权限。
```

下面的配置清单示例（rolebinding-and-clusterrolebinding-rbac.yaml）中，rolebinding/mason-pvc-admin资源位于dev名称空间，它使用RoleBinding为用户mason分配了pv-admin这一集群角色，而clusterrolebinding/ik8s-pv-admin隶属集群级别，它使用ClusterRoleBinding为ik8s分配了pv-admin这一集群。

```java
[root@k8s-master01 apps]#vim rolebinding-and-clusterrolebinding-rbac.yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: mason-pvc-admin
  namespace: dev
subjects:
- kind: User
  name: mason
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: pv-admin
  apiGroup: rbac.authorization.k8s.io
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ik8s-pv-admin
subjects:
- kind: User
  name: ik8s
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: pv-admin
  apiGroup: rbac.authorization.k8s.io
```

运行rolebinding-and-clusterrolebinding-rbac.yaml

```java
[root@k8s-master01 apps]# kubectl apply -f rolebinding-and-clusterrolebinding-rbac.yaml 
rolebinding.rbac.authorization.k8s.io/mason-pvc-admin created
clusterrolebinding.rbac.authorization.k8s.io/ik8s-pv-admin created
```

我们使用mason用户进行测试，它仅能访问dev名称空间下的名称空间级别的PVC资源，且无法通过RoleBinding从clusterroles/pv-admin继承指定名称空间之外的任何权限，如下面的命令及结果所示。

```java
[root@k8s-master01 apps]# kubectl get pvc -n dev --kubeconfig=/root/.kube/mason-kube.config
No resources found in dev namespace.
[root@k8s-master01 apps]# kubectl get pv -n dev --kubeconfig=/root/.kube/mason-kube.config
Error from server (Forbidden): persistentvolumes is forbidden: User "mason" cannot list resource "persistentvolumes" in API group "" at the cluster scope
[root@k8s-master01 apps]# kubectl get pv -n default --kubeconfig=/root/.kube/mason-kube.config
Error from server (Forbidden): persistentvolumes is forbidden: User "mason" cannot list resource "persistentvolumes" in API group "" at the cluster scope
[root@k8s-master01 apps]# kubectl get pvc -n default --kubeconfig=/root/.kube/mason-kube.config
Error from server (Forbidden): persistentvolumeclaims is forbidden: User "mason" cannot list resource "persistentvolumeclaims" in API group "" in the namespace "default"
```

使用ik8s用户进行测试，它通过ClusterRoleBinding从clusterroles/pv-admin继承了该集群角色的所有授权，如下面的命令及结果所示。

```java
[root@k8s-master01 apps]# kubectl get pvc -n default --context="ik8s@kube-dev"   
No resources found in default namespace.
[root@k8s-master01 apps]# kubectl get pvc -n dev --context="ik8s@kube-dev"    
No resources found in dev namespace.
[root@k8s-master01 apps]# kubectl get pv --context="ik8s@kube-dev"        
No resources found in default namespace.
```

kubectl也提供了分别创建RoleBinding和ClusterRoleBinding资源的命令式命令：create rolebinding和create clusterrolebinding，它们使用的选项基本相同，常用的选项如下。

```java
▪--role=""：绑定的角色，仅RoleBinding支持。
▪--clusterrole=""：绑定的集群角色，RoleBinding和ClusterRoleBinding均支持。
▪--group=[]：绑定的组，支持逗号分隔的列表格式。
▪--user=[]：绑定的普通账户，支持逗号分隔的列表格式。
▪--serviceaccount=[]：绑定的服务账户，支持逗号分隔的列表格式。
```

下面的命令为用户组kubeusers分配了集群角色nodes-admin，从而该组的所有用户均自动继承该角色上的所有许可权限。

```java
[root@k8s-master01 apps]#kubectl create clusterrolebinding kubeusers-nodes-admin \
      --clusterrole='nodes-admin' --group='kubeusers'
clusterrolebinding.rbac.authorization.k8s.io/kubeusers-nodes-admin created
```

## 3、聚合型ClusterRole

Kubernetes自1.9版本开始支持在ClusterRole的rules字段中嵌套aggregationRule字段来整合其他ClusterRole资源的规则，这种类型的ClusterRole对象的实际可用权限受控于控制器，具体许可授权由所有被标签选择器匹配到的ClusterRole的聚合授权规则合并生成。下面的配置清单中首先定义了两个拥有标签的集群角色global-resources-view和global-resources-edit，而后在第三个集群角色资源global-resources-admin上使用聚合规则的标签选择器来匹配前两个资源的标签，因此，集群角色global-resources-admin的权限将由匹配到的其他ClusterRole资源的规则列表自动聚合而成。

```java
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: global-resources-view
  labels:
    rbac.ilinux.io/aggregate-to-global-admin: "true"
rules:
- apiGroups: [""]
  resources: ["nodes", "namespaces", "persistentvolumes", "clusterroles"]
  verbs: ["get", "list", "watch"]
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
name: global-resources-edit
  labels:
    rbac.ilinux.io/aggregate-to-global-admin: "true"
rules:
- apiGroups: [""]
  resources: ["nodes", "namespaces", "persistentvolumes"]
  verbs: ["create", "delete", "deletecollection", "patch", "update"]
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: global-resources-admin
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.ilinux.io/aggregate-to-global-admin: "true"
rules: []  该规则列表为空，它将由控制器自动聚合生成
```

任何能够被示例中clusterrole/globa-resources-admin资源的标签选择器匹配到的Cluster-Role资源的相关规则将一同合并为它的授权规则，并且相关作用域内的任何ClusterRole资源的变动都将实时反馈到聚合资源之上。因而，聚合型ClusterRole的规则会随着标签选择器的匹配结果动态变化。

事实上，Kubernetes系统上面向用户的内置ClusterRole admin和edit也是聚合型的ClusterRole对象，因为这可以使得默认角色中包含自定义资源的相关规则，例如由CustomResourceDefinitions或Aggregated API服务器提供的规则等。

## 4、面向用户的内置ClusterRole

APIServer内置了一组默认的ClusterRole和ClusterRoleBinding资源预留给系统使用，其中大多数都以system:为前缀。另外有一些不以system:为前缀的默认的ClusterRole资源是为面向用户的需求而设计，包括集群管理员角色cluster-admin，以及专用于授予特定名称空间级别权限的集群角色admin、edit和view，如下图所示。掌握这些默认的内置ClusterRole资源有助于按需创建用户并分配相应权限。

内置的clusterroles/cluster-admin资源拥有管理集群所有资源的权限，而内置的clusterrolebindings/cluster-admn将该角色分配给了system:masters用户组，这意味着所有隶属于该组的用户都将自动具有集群的超级管理权限。kubeadm安装设置集群时，自动创建的配置文件/etc/kubernetes/admin.conf中定义的用户kubernetes-admin使用证书文件/etc/kubernetes/pki/apiserver-kubelet-client.crt向API Server进行验证。而该数字证书的Subject属性值为/O=system:masters，API Server会在成功验证该用户的身份之后将其识别为system: master用户组的成员。

```java
[root@k8s-master01 apps]# openssl x509 -in /etc/kubernetes/pki/apiserver-kubelet-client.crt  -noout -subject 
subject= /O=system:masters/CN=kube-apiserver-kubelet-client
```

为Kubernetes集群自定义超级管理员的方法至少有两种：一是将用户归入system:masters组，二是通过ClusterRoleBinding直接将用户绑定至内置的集群角色cluster-admin上。

在多租户、多项目或多环境等使用场景中，用户通常应该获得名称空间级别绝大多数资源的管理（admin）、只读（view）或编辑（edit）权限，可通过在指定的名称空间中创建RoleBinding资源引用内置的ClusterRole资源进行这类权限的快速授予。例如，在名称空间dev中创建一个RoleBinding资源，为ik8s用户分配集群角色admin，将使得该用户具有管理dev名称空间中除了名称空间本身及资源配额之外的所有资源的权限。

```java
[root@k8s-master01 apps]#kubectl create rolebinding ik8s-admin --clusterrole=admin --user=ik8s -n dev 
```

若仅需要授予编辑或只读权限，在创建RoleBinding时引用ClusterRole的edit或view便能实现。

面向用户的内置ClusterRole资源

APIServer默认创建的以system:为前缀的大多数ClusterRole和ClusterRoleBinding专为Kubernetes系统的基础架构而设计，修改这些资源可能会导致集群功能不正常。例如，若修改了为kubelet赋权的system:node将会导致kubelet无法正常工作。所有默认的ClusterRole和ClusterRoleBinding都打上了kubernetes.io/bootstrapping=rbac-defaults标签。

每次启动时，API Server都会自动为所有默认的ClusterRole重新赋予缺失的权限，同时为默认的ClusterRoleBinding绑定缺失的主体。这种机制给了集群从意外修改中自动恢复的能力，以及升级版本后自动将ClusterRole和ClusterRoleBinding升级到满足新版本需求的能力。

```java
说明：必要时，在默认的ClusterRole或ClusterRoleBinding上设置annnotation中的rbac.authorization.kubernetes.io/autoupdate属性的值为false，即可禁止这种自动恢复功能。
```

启用RBAC后，Kubernetes系统的各核心组件、附加组件，以及由controller-manager运行的核心控制器等，几乎都要依赖于合理的授权才能正常运行。因而，RBAC权限模型为这些组件内置了可获得最小化的资源访问授权的ClusterRole和ClusterRoleBinding，例如system:kube-sheduler、system:kube-controller-manager、system:node、system:node-proxier和system:kube-dns等，其中大多数组件都可以做到见名知义。

## 六、认证与权限应用案例：Dashboard

## 1、dashboard的介绍及部署

Kubernetes Dashboard项目为Kubernetes集群提供了一个基于Web的通用UI，支持集群管理、应用管理及应用排障等功能。Dashboard项目包含前端和后端两个组件。前端运行于客户端浏览器中，由TypeScript编写，它使用标准的HTTP方法将请求发送到后端并从后端获取业务数据；后端是使用Go语言编写的HTTP服务器，它负责接收前端的请求、将数据请求发送到适配的远程后端（例如Kubernetes API Server等）或实现业务逻辑等。

出于安全因素的考虑，Dashboard在其项目仓库中推荐的默认部署清单（recommended.yaml）中仅定义了运行自身所需要的最小权限，并且强制要求远程访问必须要基于HTTPS通信，否则应该通过kubectl proxy以代理方式进行。因而，若需要绕过kubectl proxy代理直接访问Dashboard，必须要为其HTTP服务进程提供用于建立HTTPS连接的服务器端证书。推荐的部署清单默认便会在内存中生成自签证书，并以之生成名为kubernetes-dashboard-certs的Secret对象，Dashboard Pod将从该Secret中加载证书（tls.crt）和私钥（tls.key）。若需要使用自定义的证书，则应该在执行如下部署命令之前先把准备好的证书与私钥文件分别以tls.crt和tls.key为键名，创建成kubernetes-dashboard名称空间下名为kubernetes-dashboard-certs的Secret对象，需要用到时，在Dashboard部署之前参考Secret对象的管理方式完成创建即可。下面的命令未自定义Secret，它直接使用Dashboard项目master分支中的配置清单完成应用部署：

[https://raw.githubusercontent.com/kubernetes/dashboard/v2.2.0/aio/deploy/recommended.yaml](https://raw.githubusercontent.com/kubernetes/dashboard/v2.2.0/aio/deploy/recommended.yaml)下载dashboard清单文件，手动修改service暴露nodeport的端口为30001

```java
# Copyright 2017 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
apiVersion: v1
kind: Namespace
metadata:
  name: kubernetes-dashboard
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
---
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  type: NodePort
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30001
  selector:
    k8s-app: kubernetes-dashboard
---
apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-certs
  namespace: kubernetes-dashboard
type: Opaque
---
apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-csrf
  namespace: kubernetes-dashboard
type: Opaque
data:
  csrf: ""
---
apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-key-holder
  namespace: kubernetes-dashboard
type: Opaque
---
kind: ConfigMap
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-settings
  namespace: kubernetes-dashboard
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
rules:
  Allow Dashboard to get, update and delete Dashboard exclusive secrets.
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["kubernetes-dashboard-key-holder", "kubernetes-dashboard-certs", "kubernetes-dashboard-csrf"]
    verbs: ["get", "update", "delete"]
    Allow Dashboard to get and update 'kubernetes-dashboard-settings' config map.
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["kubernetes-dashboard-settings"]
    verbs: ["get", "update"]
    Allow Dashboard to get metrics.
  - apiGroups: [""]
    resources: ["services"]
    resourceNames: ["heapster", "dashboard-metrics-scraper"]
    verbs: ["proxy"]
  - apiGroups: [""]
    resources: ["services/proxy"]
    resourceNames: ["heapster", "http:heapster:", "https:heapster:", "dashboard-metrics-scraper", "http:dashboard-metrics-scraper"]
    verbs: ["get"]
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
rules:
  Allow Metrics Scraper to get metrics from the Metrics server
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: kubernetes-dashboard
subjects:
  - kind: ServiceAccount
    name: kubernetes-dashboard
    namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kubernetes-dashboard
subjects:
  - kind: ServiceAccount
    name: kubernetes-dashboard
    namespace: kubernetes-dashboard
---
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: kubernetes-dashboard
  template:
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
    spec:
      containers:
        - name: kubernetes-dashboard
          image: kubernetesui/dashboard:v2.2.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8443
              protocol: TCP
          args:
            - --auto-generate-certificates
            - --namespace=kubernetes-dashboard
            Uncomment the following line to manually specify Kubernetes API server Host
            If not specified, Dashboard will attempt to auto discover the API server and connect
            to it. Uncomment only if the default does not work.
            - --apiserver-host=http://my-address:port
          volumeMounts:
            - name: kubernetes-dashboard-certs
              mountPath: /certs
              Create on-disk volume to store exec logs
            - mountPath: /tmp
              name: tmp-volume
          livenessProbe:
            httpGet:
              scheme: HTTPS
              path: /
              port: 8443
            initialDelaySeconds: 30
            timeoutSeconds: 30
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsUser: 1001
            runAsGroup: 2001
      volumes:
        - name: kubernetes-dashboard-certs
          secret:
            secretName: kubernetes-dashboard-certs
        - name: tmp-volume
          emptyDir: {}
      serviceAccountName: kubernetes-dashboard
      nodeSelector:
        "kubernetes.io/os": linux
      Comment the following tolerations if Dashboard must not be deployed on master
      tolerations:
        - key: node-role.kubernetes.io/master
          effect: NoSchedule
---
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: dashboard-metrics-scraper
  name: dashboard-metrics-scraper
  namespace: kubernetes-dashboard
spec:
  ports:
    - port: 8000
      targetPort: 8000
  selector:
    k8s-app: dashboard-metrics-scraper
---
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    k8s-app: dashboard-metrics-scraper
  name: dashboard-metrics-scraper
  namespace: kubernetes-dashboard
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: dashboard-metrics-scraper
  template:
    metadata:
      labels:
        k8s-app: dashboard-metrics-scraper
      annotations:
        seccomp.security.alpha.kubernetes.io/pod: 'runtime/default'
    spec:
      containers:
        - name: dashboard-metrics-scraper
          image: kubernetesui/metrics-scraper:v1.0.6
          ports:
            - containerPort: 8000
              protocol: TCP
          livenessProbe:
            httpGet:
              scheme: HTTP
              path: /
              port: 8000
            initialDelaySeconds: 30
            timeoutSeconds: 30
          volumeMounts:
          - mountPath: /tmp
            name: tmp-volume
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsUser: 1001
            runAsGroup: 2001
      serviceAccountName: kubernetes-dashboard
      nodeSelector:
        "kubernetes.io/os": linux
      Comment the following tolerations if Dashboard must not be deployed on master
      tolerations:
        - key: node-role.kubernetes.io/master
          effect: NoSchedule
      volumes:
        - name: tmp-volume
          emptyDir: {}
```

```java
[root@k8s-master01 apps]# kubectl apply -f dashboard.yaml 
namespace/kubernetes-dashboard created
serviceaccount/kubernetes-dashboard created
service/kubernetes-dashboard created
secret/kubernetes-dashboard-certs created
secret/kubernetes-dashboard-csrf created
secret/kubernetes-dashboard-key-holder created
configmap/kubernetes-dashboard-settings created
role.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrole.rbac.authorization.k8s.io/kubernetes-dashboard created
rolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created
[root@k8s-master01 apps]# kubectl get svc -A
NAMESPACE              NAME                        TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                  AGE
default                kubernetes                  ClusterIP   172.26.0.1       <none>        443/TCP                  2d2h
kube-system            kube-dns                    ClusterIP   172.26.0.10      <none>        53/UDP,53/TCP,9153/TCP   2d2h
kubernetes-dashboard   dashboard-metrics-scraper   ClusterIP   172.26.186.123   <none>        8000/TCP                 12s
kubernetes-dashboard   kubernetes-dashboard        NodePort    172.26.237.12    <none>        443:30001/TCP            12s
```

部署完成的Dashboard支持多种不同的访问方式，例如kubectl proxy、kubectl port-forward、节点端口、Ingress或API Server等，这里重点介绍节点端口。默认创建的Service对象（kubernetes-dashboard）类型为ClusterIP，它仅能在Pod客户端中访问，若需要在集群外使用浏览器访问Dashboard，可将该Service对象类型修改为NodePort后，通过节点端口进行访问。

Dashboard的默认登录页面，它支持直接通过目标Service Account的令牌加载身份凭据，或者以该令牌为身份凭据生成专用的kubeconfig文件，并通过指定的文件路径向Dashboard提交认证信息。访问[https://192.168.32.204:30001(](https://192.168.32.204:30001%28/)[https://nodeIP](https://nodeip/):端口)

Dashboard的资源访问权限继承自登录时的Service Account用户，我们可以向相关的Service Account分配特定的角色或集群角色完成Dashboard用户权限模型的构建。例如，为登录的用户授权集群级别管理权限时，可直接使用ClusterRoleBinding为Service Account分配内置的集群角色cluster-admin，而授权名称空间级别的管理权限时，可在目标名称空间上向Service Account分配内置的集群角色admin。当然，也可以直接自定义RBAC的角色或集群角色，以完成特殊需求的权限委派。

## 2、dashboard的认证与授权

### 2.1 使用token登录dashboard

Kubernetes Dashboard自身并不进行任何形式的身份验证和鉴权，它仅是把用户提交的身份凭据转发至后端的API Server完成验证，资源操作请求及权限检查同样会提交至后端的API Server进行。从某种意义上讲，Dashboard更像是用户访问Kubernetes的代理程序，发送给API Server的身份认证及资源操作请求都是由Dashboard应用程序完成，因而用户提交的身份凭据需要关联至某个Service Account。

集群全局的资源管理操作依赖于集群管理员权限，因而需要为专用于访问Dashboard的Service Account分配内置的cluster-admin集群角色。随后，将相应Service Account的令牌信息提交给Dashboard并认证到API Server，便可使得Dashboard继承了该账户的所有管理权限。

例如，下面在kubernetes-dashboard名称空间创建一个名为dashboard-admin的Service Account完成该目标。

```java
[root@k8s-master01 apps]# kubectl create serviceaccount admin-dashboard -n kubernetes-dashboard
serviceaccount/admin-dashboard created
[root@k8s-master01 apps]# kubectl create clusterrolebinding admin-dashboard --clusterrole=cluster-admin \
 --serviceaccount=kubernetes-dashboard:admin-dashboard
clusterrolebinding.rbac.authorization.k8s.io/admin-dashboard-clusterrolebinding created
```

配置清单

```java
---
#配置访问dashboard的sa 
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-dashboard
  namespace: kubernetes-dashboard
---
#把访问dashboaed的sa与clusterrole的cluster-admin绑定
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-dashboard
subjects:
- kind: ServiceAccount
  name: admin-dashboard
  namespace: kubernetes-dashboard
  apiGroup: ""  sa default "" ; user and group default rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

获取到服务账户kubernetes-dashboard:admin-dashboard关联的Secret对象中的令牌信息，提交给Dashboard即可完成认证。下面第一个命令检索到该服务账户的Secret对象名称并保存到变量中，第二个命令则从该Secret中获取经过Base64编码后的令牌信息，并打印出解码后的令牌信息。

```java
[root@k8s-master01 apps]# kubectl get secrets -n kubernetes-dashboard
NAME                               TYPE                                  DATA   AGE
admin-dashboard-token-jldx4        kubernetes.io/service-account-token   3      10m
default-token-gp58x                kubernetes.io/service-account-token   3      23m
kubernetes-dashboard-certs         Opaque                                0      23m
kubernetes-dashboard-csrf          Opaque                                1      23m
kubernetes-dashboard-key-holder    Opaque                                2      23m
kubernetes-dashboard-token-w9lgr   kubernetes.io/service-account-token   3      23m
[root@k8s-master01 apps]# kubectl describe secrets admin-dashboard-token-jldx4 -n kubernetes-dashboard
Name:         admin-dashboard-token-jldx4
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: admin-dashboard
              kubernetes.io/service-account.uid: 0fa14043-bae1-400b-b373-437b0b2155aa
Type:  kubernetes.io/service-account-token
Data
====
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IkQ2cXNJdXJONzB2MmY1UDdadlFQZkxGSjFwUEI2TW0wVnIwdkhZWi1vakkifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJhZG1pbi1kYXNoYm9hcmQtdG9rZW4tamxkeDQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiYWRtaW4tZGFzaGJvYXJkIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMGZhMTQwNDMtYmFlMS00MDBiLWIzNzMtNDM3YjBiMjE1NWFhIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmVybmV0ZXMtZGFzaGJvYXJkOmFkbWluLWRhc2hib2FyZCJ9.GLRbOy-sWiFhd6fuBxvHRH2Zd3nykDoBDCJAz1IIm98-swb9IdgYCcYv5T67lKPZDYZC28ZXj0XM8vKSg5GipjBmxoD_TQkDgHjDB38z2HNYjOaT_3oB7VnDVGGbSdPx9OvojPgPcmqYN0VStVnXm6jx09qg6MiE3BWhIe9krAE7yRFmBALuY33FDL0FOxXU0g0cWBzLAaJJblk8zIJBl_eggydYgYXNU0FDS6rd1nq4WNXqEX3QB_w6l3VhJiNX1ocvTYPnL07p_dKbjM317JIJKgu3VFL-23685N6rComDAYh-H9__CuS_gmx6jGkTZdAuZqlIxhgARmiFuWnPtg
ca.crt:     1066 bytes
```

将令牌信息复制到Dashboard的登录界面便可完成认证。

### 2.2 使用kubeconfig登录dashboard

每次访问Dashboard之前都要先通过如上命令获取相应的令牌是件相当烦琐的事情，更简便的办法是依该身份凭据创建出一个专用的kubeconfig文件并存储到客户端，随后登录时在浏览器中通过本地路径加载该kubeconfig文件即可完成认证，更加安全和便捷。

下面仅给出相关步骤，实现为服务账户kubernetes-dashboard:admin-user创建相关的配置文件

1）创建admin-user私钥及证书签发请求

```java
[root@k8s-master01 ~]#mkdir $HOME/.certs
[root@k8s-master01 ~]#(umask 077; openssl genrsa -out $HOME/.certs/admin-user.key 2048)
[root@k8s-master01 ~]# openssl req -new -key $HOME/.certs/admin-user.key \
     -out $HOME/.certs/admin-user.csr \
     -subj "/CN=admin-user/O=dashboard"
```

2)kubernetes-ca证书签发admin-user证书

```java
[root@k8s-master01 ~]#openssl x509 -req -days 365 -CA /etc/kubernetes/pki/ca.crt \
 -CAkey /etc/kubernetes/pki/ca.key -CAcreateserial \
 -in $HOME/.certs/admin-user.csr -out $HOME/.certs/admin-user.crt 
```

3）添加集群配置，包括集群名称、API Server URL和信任的CA的证书；clusters配置段中的各列表项名称需要唯一。

```java
[root@k8s-master01 ~]#kubectl config set-cluster kubernetes \
--certificate-authority=/etc/kubernetes/pki/ca.crt \
--embed-certs=true \
--server=https://192.168.32.248:6443 \
--kubeconfig=$HOME/.kube/admin-user.config
```

4)设置客户端认证

```java
[root@k8s-master01 ~]#kubectl config set-credentials admin-user \
--client-key=$HOME/.certs/admin-user.key \
--client-certificate=$HOME/.certs/admin-user.crt \
--embed-certs=true \
--kubeconfig=$HOME/.kube/admin-user.config
```

5)以用户admin-user的身份凭据与Kubernetes集群建立映射关系。配置上下文

```java
[root@k8s-master01 ~]#kubectl config set-context  admin-user@kubernetes \
--cluster=kubernetes \
--user=admin-user \
--kubeconfig=$HOME/.kube/admin-user.config
```

6)设置当前上下文为admin-user@kubernetes。

```java
[root@k8s-master01 ~]#kubectl config use-context admin-user@kubernetes --kubeconfig=$HOME/.kube/admin-user.config
```

7)创建serviceaccount账号为admin-user,并绑定cluser-admin的cluster-role

清单配置

```java
[root@k8s-master01 ~]#vim admin-dashboard.yaml
---
#配置访问dashboard的sa 
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
#把访问dashboaed的sa与clusterrole的cluster-admin绑定
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
  apiGroup: ""
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

8)获取token名称及token信息

```java
[root@k8s-master01 apps]# kubectl get secrets -n kubernetes-dashboard|grep admin-user
admin-user-token-v52gz             kubernetes.io/service-account-token   3      7m9s
[root@k8s-master01 apps]# kubectl describe secrets admin-user-token-v52gz -n kubernetes-dashboard 
Name:         admin-user-token-v52gz
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: admin-user
              kubernetes.io/service-account.uid: b2dde30c-b6a7-479a-ba25-8503291ce91e
Type:  kubernetes.io/service-account-token
Data
====
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IkQ2cXNJdXJONzB2MmY1UDdadlFQZkxGSjFwUEI2TW0wVnIwdkhZWi1vakkifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJhZG1pbi11c2VyLXRva2VuLXY1Mmd6Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFkbWluLXVzZXIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiJiMmRkZTMwYy1iNmE3LTQ3OWEtYmEyNS04NTAzMjkxY2U5MWUiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZXJuZXRlcy1kYXNoYm9hcmQ6YWRtaW4tdXNlciJ9.B0RPQ9mUue3GLt7xAfYD9nwKidGVEmaITNHVe-9o_IGkMZJHF3P0JFBSc6JagaTtqlzJCYzebqwqqYrI7o3XuQXRJ_LCQyQ9BuWkGOe27Wh95gaEgqR7oWH50iLT-ClWxOQOjPrchHfEeZV4XlCbk8NhphibZECKG7V6ExK4X0pBu0sc8Gb8bgVz-rvM69ipWncJgP7CmNcHh_-U4VYLEtMh1NkgMKOmf0nB61UF7lBLxLav1cKDNSJAowLSwJgKttNyOBS1Z5OQJDCwZbS2lN2A4PapfRisVGsOuxLt-ZePfr-RlhVWPvd02HXZjnw7VGzrc-yC8nAHzChQ3CQ1cw
ca.crt:     1066 bytes
```

9）将token信息写入/root/.kube/admin-user.config的最后面

```java
[root@k8s-master01 apps]# vim /root/.kube/admin-user.config
contexts:
- context:
    cluster: kubernetes
    user: admin-user
  name: admin-user@kubernetes
current-context: admin-user@kubernetes
kind: Config
preferences: {}
users:
- name: admin-user
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN1akND......
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcFFJQkFB......
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IkQ2cXNJdXJONzB2MmY1UDdadlFQZkxGSjFwUE......
```

将admin-user.config拷贝到其它电脑上，即可使用token登录dashboard

```java
说明：dashboard是使用serviceaccount账号。
```

### 2.3 配置用户只有个别权限的dashboard

若需要设定的用户仅具有某个名称空间的管理权限，或者仅拥有集群或名称空间级别的资源读取权限，都能够通过RBAC权限管理模型来实现。这类用户的设定过程与前述步骤中的关键不同之处仅在于角色分配步骤。例如，在名称空间kubernetes-dashboard中创建服务账户monitor-user，并通过ClusterRoleBinding为其分配默认的集群角色view，便可创建一个仅具有全局读取权限的Dashboard用户，所需步骤如下。

```java
[root@k8s-master01 apps]# kubectl create serviceaccount monitor -n kubernetes-dashboard
[root@k8s-master01 apps]# kubectl create clusterrolebinding monitor --clusterrole=view \
      --serviceaccount=kubernetes-dashboard:monitor
```

配置清单

```java
[root@k8s-master01 ~]#vim monitor-dashboard.yaml
---
#配置访问dashboard的sa 
apiVersion: v1
kind: ServiceAccount
metadata:
  name: monitor
  namespace: kubernetes-dashboard
---
#把访问dashboaed的sa与clusterrole的cluster-admin绑定
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: monitor
subjects:
- kind: ServiceAccount
  name: monitor
  namespace: kubernetes-dashboard
  apiGroup: ""
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

或者在名称空间dev中创建一个服务账户dev-ns-admin，并通过RoleBinding为其分配默认的集群角色admin，就能创建一个仅具有dev名称空间管理权限的Dashboard用户，所需要的步骤如下。

```java
[root@k8s-master01 apps]# kubectl create serviceaccount ns-admin -n dev
[root@k8s-master01 apps]# kubectl create rolebinding ns-admin --clusterrole=admin --serviceaccount=dev:ns-admin
```

配置清单

```java
[root@k8s-master01 ~]#vim monitor-dashboard.yaml
---
#配置访问dashboard的sa 
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ns-admin
  namespace: dev
---
#把访问dashboaed的sa与clusterrole的cluster-admin绑定
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ns-admin
subjects:
- kind: ServiceAccount
  name: ns-adminr
  namespace: dev
  apiGroup: ""
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

最后找出token并写入kubeconfig文件的最后即可。

## 七、准入控制器

APIServer中的准入控制器同样以插件形式存在，它们会拦截所有已完成认证的，且与资源创建、更新和删除操作相关的请求，以强制实现控制器中定义的功能，包括执行对象的语义验证和设置缺失字段的默认值等，具体功能取决于API Server启用的插件。目前，Kubernetes内置了30多个准入控制器。

## 1、准入控制器概述

准入控制器的相关代码必须要由管理员编译进kube-apiserver中才能使用，实现方式缺乏灵活性。于是，Kubernetes自1.7版本引入了Initializers和External Admission Webhooks来尝试突破此限制，而且自1.9版本起，External Admission Webhooks又被分为MutatingAdmissionWebhook和ValidatingAdmissionWebhook两种类型，分别用于在API中执行对象配置的“变异”和“验证”操作，前一种类型的控制器会“改动”和“验证”资源规范，而后一种类型仅“验证”资源规范是否合规。

在具体的代码实现上，一个准入控制器可以是验证型、变异型或兼具此两项功能。例如，LimitRanger准入控制器可以使用默认资源请求和限制（变异阶段）来扩展Pod，也能够校验有着显式资源需求定义的Pod是否超出LimitRange对象（验证阶段）的定义。而在具体运行时，准入控制也会根据准入控制器类型分阶段运行，第一个阶段串行运行各变异型控制器，第二阶段则串行运行各验证型控制器，如图所示。在此过程中，任何控制器拒绝请求都将导致整个请求被即刻拒绝，并将错误信息返回给客户端。

Kubernetes集群内置功能的某些方面实际上就是由准入控制器控制的，例如，删除名称空间并进入Terminating状态时，NamespaceLifecycle准入控制器将会阻止在该名称空间中创建任何新的资源对象。甚至于，必须启用准入控制器才能使用Kubernetes集群的某些更高级的安全功能，例如在整个命名空间上强制实施安全配置基线的Pod安全策略等。API Server默认便会启用部分准入控制器，它也支持通过--enable-admission-plugins选项显式指定要加载的准入控制器，使用--disable-admission-plugins选项显式指定要禁用的准入控制器。

```java
Kubernetes内置支持的所有准入控制器及其功能说明请参考官方文档中的说明，具体地址为https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/。
```

Kubernetes正是依赖LimitRange资源和相应的LimitRanger准入控制器、ResourceQuota资源和同名的准入控制器，以及PodSecurityPolicy资源和同名的准入控制器为多租户或多项目的集群环境提供了基础的安全策略框架。

## 2、LimitRange

尽管用户可以为容器或Pod资源指定资源需求及资源限制，但这并非强制性要求，那些未明确定义资源限制的容器应用很可能会因程序Bug或真实需求而吞掉本地工作节点上的所有可用计算资源。因此妥当的做法是，使用LimitRange资源在每个名称空间中限制每个容器的最小及最大计算资源用量，以及为未显式定义计算资源使用区间的容器设置默认的计算资源需求和计算资源限制。一旦在名称空间上定义了LimitRange对象，客户端创建或修改资源对象的操作必将受到LimitRange控制器的“验证”，任何违反LimitRange对象定义的资源最大用量的请求都将被直接拒绝。LimitRange支持在Pod级别与容器级别分别设置CPU和内存两种计算资源的可用范围，它们对应的资源范围限制类型分别为Pod和Container。一旦在名称空间上启用LimitRange，该名称空间中的Pod或容器的requests和limits的各项属性值必须在对应的可用资源范围内，否则将会被拒绝，这是验证型准入控制器的功能。以Pod级别的CPU资源为例，若某个LimitRange资源为其设定了[0.5,4]的区间，则相应名称空间下任何Pod资源的requests.cpu的属性值必须要大于等于500m，同时，limits.cpu的属性值也必须要小于等于4。而未显式指定request和limit属性的容器，将会从LimitRange资源上分别自动继承相应的默认设置，这是变异型准入控制器的功能。

LimitRange也支持在PersistentVolumeClaim资源级别设定存储空间的范围限制，它用于限制相应名称空间中创建的PVC对象请求使用的存储空间不能逾越指定的范围。未指定requests和limits属性的PVC规范，将在创建时自动继承LimitRange上配置的默认值。下面的资源清单（limitrange-demo.yaml）分别为dev名称空间中的Pod、Container和PersistentVolumeClaim资源定义了各自的资源范围，并为后两者指定了相应可用资源规范的limits和requests属性上的默认值。其中用到的各配置属性中，default用于定义limits的默认值，defaultRequest定义requests的默认值，min定义最小资源用量，而最大资源用量可以使用max给出固定值，也可以使用maxLimitRequestRatio设定最小用量的指定倍数，同时定义二者时，其意义要相符。

```java
[root@k8s-master01 apps]# vim limitrange-demo.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: resource-limits
  namespace: dev
spec:
  limits:
    - type: Pod
      max:
        cpu: "4" 
        memory: "4Gi" 
      min:
        cpu: "500m" 
        memory: "16Mi" 
    - type: Container
      max:
        cpu: "4" 
        memory: "1Gi" 
      min:
        cpu: "100m" 
        memory: "4Mi" 
      default:
        cpu: "2" 
        memory: "512Mi" 
      defaultRequest:
        cpu: "500m" 
        memory: "64Mi" 
      maxLimitRequestRatio:
        cpu: "4" 
    - type: PersistentVolumeClaim
      max:
        storage: "10Gi"
      min:
        storage: "1Gi"
      default:
        storage: "5Gi"
      defaultRequest:
        storage: "1Gi"
      maxLimitRequestRatio:
        storage: "5"
```

LimitRange仅在Container资源类型上可为CPU与内存设置default（limits属性的默认值）和defaultrequest（requests属性的默认值），Pod资源类型不支持。

LimitRange资源的详细描述会以非常直观、清晰的方式输出相关的资源限制及默认值的定义，将如上配置清单中的LimitRange资源resource-limits创建到集群上，而后便可使用describe命令查看：

```java
[root@k8s-master01 apps]# kubectl create ns dev
namespace/dev created
[root@k8s-master01 apps]# kubectl apply -f limitrange-demo.yaml 
limitrange/resource-limits created
[root@k8s-master01 apps]# kubectl get limitrange 
No resources found in default namespace.
[root@k8s-master01 apps]# kubectl get limitrange  -n dev
NAME              CREATED AT
resource-limits   2021-05-12T06:17:14Z
[root@k8s-master01 apps]# kubectl describe limitrange resource-limits -n dev
Name:                  resource-limits
Namespace:             dev
Type                   Resource  Min   Max   Default Request  Default Limit  Max Limit/Request Ratio
----                   --------  ---   ---   ---------------  -------------  -----------------------
Pod                    cpu       500m  4     -                -              -
Pod                    memory    16Mi  4Gi   -                -              -
Container              cpu       100m  4     500m             2              4
Container              memory    4Mi   1Gi   64Mi             512Mi          -
PersistentVolumeClaim  storage   1Gi   10Gi  1Gi              5Gi            5
```

LimitRange资源resource-limits的详细描述

通过在dev名称空间中创建Pod对象与PVC对象对各限制的边界和默认值的效果进行多维度测试。先创建一个仅包含一个容器且没有默认系统资源需求和限制的Pod对象：

```java
[root@k8s-master01 apps]# kubectl run testpod-1 --image="ikubernetes/demoapp:v1.0" -n dev
pod/testpod-1 created
```

Pod对象testpod-1资源规范中被自动添加了CPU和内存资源的requests和limits属性，它的值来自limitranges/resource-limits中的定义，如下面的命令及截取的结果片段所示。

```java
[root@k8s-master01 apps]# kubectl get pod testpod-1 -n dev -o yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    kubernetes.io/limit-ranger: 'LimitRanger plugin set: cpu, memory request for container
      testpod-1; cpu, memory limit for container testpod-1'
......
spec:
  containers:
  - image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    name: testpod-1
    resources:
      limits:
        cpu: "2"
        memory: 512Mi
      requests:
        cpu: 500m
        memory: 64Mi
......
```

没有给containers配置资源限制，则使用定义好的默认资源限制mincpu=0.5,minmen=64m;maxcpu=2,maxmem=512m。

若Pod对象设定的CPU或内存的requests属性值小于LimitRange中相应资源的下限，或limits属性值大于设定的相应资源的上限，就会触发LimitRanger准入控制器拒绝相关的请求。例如下面创建Pod的命令中，仅requests.memory一个属性值违反了limitrange/resource-limits中的定义，但请求同样会被拒绝。

```java
[root@k8s-master01 apps]# kubectl run testpod-2 --image="ikubernetes/demoapp:v1.0" -n dev \
>           --limits='cpu=2,memory=1Gi' --requests='cpu=1,memory=8Mi' 
Error from server (Forbidden): pods "testpod-2" is forbidden: minimum memory usage per Pod is 16Mi, but request is 8388608
#配置pod的内存最少为8m,我们设置的pod资源位16m~4G，小于最下值，pod创建失败。
```

在dev名称空间中创建的PVC对象的可用存储空间也将受到LimitRange资源中定义的限制。

需要注意的是，LimitRange生效于名称空间级别，它需要定义在每个名称空间之上；另外，定义的限制仅对该资源创建后的Pod和PVC资源创建请求有效，对之前已然存在的资源无效；再者，不建议在生效于同一名称空间的多个LimitRange资源上，对同一个计算资源限制进行分别定义，以免产生歧义或导致冲突。

## 3、ResourceQuota

尽管LimitRange资源能在名称空间上限制单个容器、Pod或PVC相关的系统资源用量，但用户依然可以创建出无数的资源对象，进而侵占集群上所有的可用系统资源。ResourceQuota资源能够定义名称空间级别的资源配额，从而在名称空间上限制聚合资源消耗的边界，它支持以资源类型来限制用户可在本地名称空间中创建的相关资源的对象数量，以及这些对象可消耗的计算资源总量等。而同名的ResourceQuota准入控制器负责观察传入的请求，并确保它没有违反相应名称空间中ResourceQuota资源定义的任何约束。ResourceQuota准入控制器属于“验证”类型的控制器，用户创建或更新资源的操作违反配额约束时将会被拒绝，API Server会响应以HTTP状态代码403 FORBIDDEN，并显示一条消息以提示违反的约束条件。ResourceQuota资源可限制名称空间中处于非终止状态的所有Pod对象的计算资源需求及计算资源限制总量。

```java
▪cpu或requests.cpu：CPU资源相关请求的总量限额。
▪memory或requests.cpu：内存资源相关请求的总量限额。
▪limits.cpu：CPU资源相关限制的总量限额。
▪limits.memory：内存资源相关限制的总量限额。
```

ResourceQuota资源还支持为本地名称空间中的PVC存储资源的需求总量和限制总量设置限额，它能够分别从名称空间中的全部PVC、隶属于特定存储类的PVC以及基于本地临时存储的PVC分别进行定义。

```java
▪requests.storage：所有PVC存储需求的总量限额。
▪persistentvolumeclaims：可以创建的PVC总数限额。
▪<storage-class-name>.storageclass.storage.k8s.io/requests.storage：特定存储类上可使用的所有PVC存储需求的总量限额。
▪<storage-class-name>.storageclass.storage.k8s.io/persistentvolumeclaims：特定存储类上可使用的PVC总数限额。
▪requests.ephemeral-storage：所有Pod可以使用的本地临时存储资源的requets总量。
▪limits.ephemeral-storage：所有Pod可用的本地临时存储资源的limits总量。
```

在v1.9版本之前的Kubernetes系统上，ResourceQuota仅支持在有限的几种资源集上设定对象计数配额，例如pods、services和configmaps等，而自v1.9版本起开始支持以count/.的格式对所有资源类型对象的计数配额，例如count/deployments.apps、count/deployments.extensions和count/services等。

下面的资源清单（resourcequota-demo.yaml）在dev名称空间中定义了一个ResourceQuota资源对象，它定义了计算资源与存储资源分别在requests和limits维度的限额，也定义了部署资源类型中的可用对象数量。

```java
[root@k8s-master01 apps]# vim resourcequota-demo.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: resourcequota-demo
  namespace: dev
spec:
  hard:
    pods: "5"
    count/services: "5"
    count/configmaps: "5"
    count/secrets: "5"
    count/cronjobs.batch: "2"
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "4"
    limits.memory: "8Gi"
    count/deployments.apps: "2"
    count/statefulsets.apps: "2"
    persistentvolumeclaims: "6"
    requests.storage: "20Gi"
    fast-rbd.storageclass.storage.k8s.io/requests.storage: "20Gi"
    fast-rbd.storageclass.storage.k8s.io/persistentvolumeclaims: "6"
```

与LimitRange不同的是，ResourceQuota会计入指定范围内，先前的资源对象对系统资源和资源对象的限额占用情况，因此将resourceqouta-demo创建到集群上之后，dev名称空间中现有的资源会立即分去限额内的一部分可用空间，这在ResourceQuota资源的详细描述中会有直观展示。

```java
[root@k8s-master01 apps]# kubectl apply -f resourcequota-demo.yaml 
resourcequota/resourcequota-demo created
[root@k8s-master01 apps]# kubectl describe resourcequotas/resourcequota-demo -n dev
Name:                                                        resourcequota-demo
Namespace:                                                   dev
Resource                                                     Used   Hard
--------                                                     ----   ----
count/configmaps                                             1      5
count/cronjobs.batch                                         0      2
count/deployments.apps                                       0      2
count/secrets                                                1      5
count/services                                               0      5
count/statefulsets.apps                                      0      2
fast-rbd.storageclass.storage.k8s.io/persistentvolumeclaims  0      6
fast-rbd.storageclass.storage.k8s.io/requests.storage        0      20Gi
limits.cpu                                                   2      4
limits.memory                                                512Mi  8Gi
persistentvolumeclaims                                       0      6
pods                                                         1      5
requests.cpu                                                 500m   2
requests.memory                                              64Mi   4Gi
requests.storage                                             0      20Gi
```

ResourceQuota资源详细描述示例

dev名称空间下的Pod资源限额已被先前的自主式Pod对象消耗了1/5，与此同时，计算资源请求和限制也各占用了一部分配额。随后，在dev名称空间中创建Pod资源时，requests.cpu、requests.memroy、limits.cpu、limits.memory和pods等任何一个限额的超出都将致使创建操作失败，如下面的命令及结果所示。

```java
[root@k8s-master01 apps]# kubectl run testpod-2 --image="ikubernetes/demoapp:v1.0" \
>       --requests="cpu=2,memory=1Gi" --limits="cpu=2,memory=1Gi" -n dev 
Error from server (Forbidden): pods "testpod-2" is forbidden: exceeded quota: resourcequota-demo, requested: requests.cpu=2, used: requests.cpu=500m, limited: requests.cpu=2
#cpu数超过最大的限制数量
```

每个ResourceQuota资源对象上还支持定义一组作用域，用于定义资源上的配额仅生效于这组作用域交集范围内的对象，目前适用范围包括Terminating、NotTerminating、BestEffort和NotBestEffort。

```java
▪Terminating：匹配.spec.activeDeadlineSeconds的属性值大于等于0的所有Pod对象。
▪NotTerminating：匹配.spec.activeDeadlineSeconds的属性值为空的所有Pod对象。
▪BestEffort：匹配所有位于BestEffort QoS类别的Pod对象。
▪NotBestEffort：匹配所有非BestEffort QoS类别的Pod对象。
```

另外，Kubernetes自v1.8版本起支持管理员设置不同的优先级类别（PriorityClass）创建Pod对象，而且自v1.11版本起还支持对每个PriorityClass对象分别设定资源限额。于是，管理员还可以在ResourceQuota资源上使用scopeSelector字段定义其生效的作用域，它支持基于Pod对象的优先级来控制Pod对系统资源的消耗。

## 4、PodSecurityPolicy

Pod和容器规范中允许用户使用securityContext字段定义安全相关的配置，但允许任何用户随意以特权模式运行容器或者使用任意的Linux内核能力等，显然存在着难以预料的安全风险。API Server提供了PodSecurityPolicy资源让管理员在集群全局定义或限定用户在Pod和容器上可用及禁用的安全配置，例如是否可使用特权容器和主机名称空间，可使用的主机网络端口范围、卷类型和Linux Capabilities等。因此，本质上来说，PodSecurityPolicy资源就是集群全局范围内定义的Pod资源可用的安全上下文策略。同名的PodSecurityPolicy准入控制器负责观察集群范围内的Pod资源的运行属性，并确保它没有违反PodSecurityPolicy资源定义的约束条件。

PSP准入控制器会根据显式定义的PSP资源中的安全策略判定允许何种Pod资源的创建操作，若无任何可用的安全策略，它将阻止创建任何Pod资源。新部署的Kubernetes集群默认并不会自动生成任何PSP资源，因而该准入控制器默认处于禁用状态。PSP资源的API接口（policy/v1beta1/podsecuritypolicy）独立于PSP准入控制器，因此管理员可以先定义好必要的Pod安全策略，再设置kube-apiserver启用PSP准入控制器。不当的Pod安全策略可能会产生难以预料的副作用，因此请确保添加的任何PSP对象都经过了充分测试。

PodSecurityPolicy是标准的API资源类型，它隶属于policy群组，在spec字段中嵌套多种安全规则来定义期望的目标，资源规范及简要的使用说明如下所示。

```java
apiVersion: policy/v1beta1   PSP资源所属的API群组及版本
kind: PodSecurityPolicy   资源类型标识
metadata:
  name <string>   资源名称
spec:  
  allowPrivilegeEscalation  <boolean> 是否允许权限升级
  allowedCSIDrivers <[]Object>       内联CSI驱动程序列表，必须在Pod规范中显式定义
  allowedCapabilities <[]string>      允许使用的内核能力列表，“*”表示all
  allowedFlexVolumes <[]Object>       允许使用的Flexvolume列表，空值表示all
  allowedHostPaths <[]Object>         允许使用的主机路径列表，空值表示all
  allowedProcMountTypes <[]string>    允许使用的ProcMountType列表，空值表示默认
  allowedUnsafeSysctls <[]string>     允许使用的非安全sysctl参数，空值表示不允许
  defaultAddCapabilities  <[]string>  默认添加到Pod对象的内核能力，可被drop
  defaultAllowPrivilegeEscalation <boolean> 是否默认允许内核权限升级
  forbiddenSysctls  <[]string>        禁止使用的sysctl参数，空表示不禁用
  fsGroup <Object>    允许在SecurityContext中使用的fsgroup，必选字段
    rule <string>     允许使用的FSGroup规则，支持RunAsAny和MustRunAs
    ranges <[]Object> 允许使用的组ID范围，需要与MustRunAs规则一同使用
      max  <integer>                  最大组ID号
      min  <integer>                  最小组ID号
  hostIPC <boolean>                   是否允许Pod使用hostIPC
  hostNetwork <boolean>               是否允许Pod使用hostNetwork
  hostPID <boolean>                   是否允许Pod使用hostPID
  hostPorts <[]Object>                允许Pod使用的主机端口暴露其服务的范围
 max  <integer>                    最大端口号，必选字段
    min  <integer>                    最小端口号，必选字段
  privileged  <boolean>               是否允许运行特权Pod
  readOnlyRootFilesystem  <boolean>   是否设定容器的根文件系统为“只读”
  requiredDropCapabilities <[]string> 必须要禁用的内核能力列表
  runAsGroup  <Object> 允许Pod在runAsGroup中使用的值列表，未定义表示不限制
  runAsUser <Object>   允许Pod在runAsUser中使用的值列表，必选字段
    rule <string>      支持RunAsAny、MustRunAs和MustRunAsNonRoot
    ranges <[]Object>  允许使用的组ID范围，需要跟MustRunAs规则一同使用
      max  <integer>                  最大组ID号
      min  <integer>                  最小组ID号
  runtimeClass <Object>               允许Pod使用的运行类，未定义表示不限制
    allowedRuntimeClassNames <[]string> 可使用的runtimeClass列表，“*”表示all
    defaultRuntimeClassName <string>  默认使用的runtimeClass
  seLinux <Object>                    允许Pod使用的selinux标签，必选字段
    rule <string> MustRunAs表示使用seLinuxOptions定义的值；RunAsAny表示可使用任意值
    seLinuxOptions  <Object>   自定义seLinux选项对象，与MustRunAs协作生效
  supplementalGroups  <Object> 允许Pod在SecurityContext中使用附加组，必选字段  
volumes <[]string>            允许Pod使用的存储卷插件列表，空表示禁用，“*”表示all
```

启用PSP准入控制器后要部署任何Pod对象，相关的User Account及Service Account必须全部获得了恰当的Pod安全策略授权。以常规用户的身份直接创建Pod对象时，PSP准入控制器将根据该账户被授权使用的Pod安全策略验证其凭据，若无任何安全策略约束该Pod对象的安全性，则创建操作将会被拒绝。基于控制器（例如Deployment）创建Pod对象时，PSP准入控制器会根据Pod对象的Service Account被授权使用的Pod安全策略验证其凭据，若不存在支持该Pod对象的安全性要求的安全策略，则Pod控制器资源自身能成功创建，但Pod对象不能。

然而，即便在启用了PSP准入控制器的情况下，PSP对象依然不会生效，管理员还需要借助授权插件（例如RBAC）将use权限授权给特定的Role或ClusterRole，再为相关的User Account或Service Account分配这些角色才能让PSP策略真正生效。下面简单说明为Kubernetes集群设定的能支撑集群自身运行的框架性的Pod安全策略，以及允许非管理员使用的Pod安全策略，而后启用PSP准入控制器中使这些策略生效的方法。

### 4.1 设置特权及受限的PSP对象

通常，system:masters组内的管理员账户、system:node组内的kubelet账户，以及kube-system名称空间中的所有服务账户需要拥有创建各类Pod对象的权限，包括创建特权Pod对象。因此，启用PSP准入控制器之前需要先创建一个特权PSP资源，并将该资源的使用权赋予各类管理员账户以确保Kubernetes集群的基础服务可以正常运行。一个示例性的特权PSP资源清单（psp-privileged.yaml）如下，它启用了几乎所有的安全配置。

```java
[root@k8s-master01 apps]# vim psp-privileged.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: privileged
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: '*'
spec:
  privileged: true
  allowPrivilegeEscalation: true
  allowedCapabilities: ['*']
  allowedUnsafeSysctls: ['*']
  volumes: ['*']
  hostNetwork: true
  hostPorts: 
  - min: 0
    max: 65535
  hostIPC: true
  hostPID: true
  runAsUser:
    rule: 'RunAsAny'
  runAsGroup:
    rule: 'RunAsAny'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

出于安全加强的需要，除了有特权需求的系统级应用程序及集群管理员账户之外，其他应用或普通账户默认不应该允许使用与安全上下文相关的任何配置。因而，系统内置的特殊组之外的其他普通账户或服务账户，绝大多数都不必使用安全配置，它们仅可使用受限的安全策略。下面的资源清单（psp-restrict.yaml）定义了一个完全受限的安全策略，它禁止了几乎所有的特权操作。

```java
[root@k8s-master01 apps]#vim psp-restrict.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: 'docker/default'
    apparmor.security.beta.kubernetes.io/allowedProfileNames: 'runtime/default'
    seccomp.security.alpha.kubernetes.io/defaultProfileName:  'docker/default'
    apparmor.security.beta.kubernetes.io/defaultProfileName:  'runtime/default'
spec:
  privileged: false
  allowPrivilegeEscalation: false
  allowedUnsafeSysctls: []
  requiredDropCapabilities:
    - ALL
  允许使用的核心存储卷类型
  volumes: ['configMap', 'emptyDir', 'projected', 'secret', 'secret', 
  'persistentVolumeClaim']
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      Forbid adding the root group.
    - min: 1
      max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      Forbid adding the root group.
      - min: 1
        max: 65535
  readOnlyRootFilesystem: false
```

将上面两个资源清单中定义的PSP资源提交并创建到集群之上，随后便可授权特定的Role或ClusterRole资源通过use调用它们。PSP资源创建完成后才能授权特定的Role或ClusterRole资源通过use进行调用。我们这里首先使用如下命令将上面配置清单中定义的资源创建到集群之上。

```java
[root@k8s-master01 apps]# kubectl apply -f psp-privileged.yaml -f psp-restrict.yaml
podsecuritypolicy.policy/privileged created
podsecuritypolicy.policy/restricted created
```

### 4.2 创建ClusterRole并完成账户绑定

启用PodSecurityPolicy准入控制器后，仅被授权使用PSP资源的账户才能够在该资源中定义的策略框架下行使账户权限范围内的资源管理操作。因此，这里还需要显式授予system:masters、system:nodes和system:serviceaccounts:kube-system组内的用户可以使用podsecuritypolicy/privileged资源，其他成功认证后的用户能够使用podsecuritypolicy/restricted资源。RBAC权限模型中，任何Subject都不能直接获得权限，它们需要借助分配到的角色获得权限。因此，下面先创建两个分别能使用podsecuritypolicy/privileged和podsecuritypolicy/restricted资源的ClusterRole。

下面的资源清单（clusterrole-with-psp.yaml）中创建了两个ClusterRole资源，授权psp-privileged可以使用名为privileged的安全策略，psp-restricted可以使用名为restricted的安全策略。

```java
[root@k8s-master01 apps]# clusterrole-with-psp.yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: psp-restricted
rules:
- apiGroups: ['policy']
  resources: ['podsecuritypolicies']
  verbs:  ['use']
  resourceNames:
  - restricted
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: psp-privileged
rules:
- apiGroups: ['policy']
  resources: ['podsecuritypolicies']
  verbs:  ['use']
  resourceNames:
  -  privileged
```

下面的资源清单（clusterrolebinding-with-psp.yaml）定义了两个ClusterRoleBinding对象：前一个为system:masters、system:node和system:serviceaccounts:kube-system组的账户分配集群角色psp-privileged，从而能够使用任何安全配置；后一个为system: authenticated组内的账户分配集群角色psp-restricted，以禁止它们在Pod和容器上使用任何安全配置。

```java
[root@k8s-master01 apps]#vim clusterrolebinding-with-psp.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: privileged-psp-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: psp-privileged
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:masters
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:node
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:serviceaccounts:kube-system
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: restricted-psp-user
roleRef:
  kind: ClusterRole
  name: psp-restricted
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: Group
  apiGroup: rbac.authorization.k8s.io
  name: system:authenticated
```

将上面两个资源清单中定义的ClusterRole和ClusterRoleBinding资源创建到集群上，即可为API Server启用PodSecurityPolicy准入控制器。

```java
[root@k8s-master01 apps]# kubectl apply -f clusterrole-with-psp.yaml -f clusterrolebinding-with-psp.yaml 
clusterrole.rbac.authorization.k8s.io/psp-restricted created
clusterrole.rbac.authorization.k8s.io/psp-privileged created
clusterrolebinding.rbac.authorization.k8s.io/privileged-psp-user created
clusterrolebinding.rbac.authorization.k8s.io/restricted-psp-user created
```

### 4.3 启用PSP准入控制器

APIServer的应用程kube-apiserver使用--enable-admission-plugins选项显式指定要加载的准入控制器列表，因此在该选项的列表中添加PodSecurityPolicy条目，并重启kube-apiserver程序便能启用PSP准入控制器。对于使用kubeadm部署的Kubernetes集群来说，编辑Master节点上的/etc/kubernetes/manifests/kube-apiserver.yaml配置清单，直接修改--enable-admission-plugins选项的值，并添加PodSecurityPolicy列表项即可，各列表项以逗号分隔。kubelet监控到/etc/kubernetes/manifests目录下的任何资源清单的改变时都会自动重建相关的Pod对象，因此编辑并保存kube-apiserver.yaml资源清单后，kubelet会通过重建相关的静态Pod而自动生效。

待kube-apiserver重启完成后，可通过监测API Server程序的运行状态及相关日志来判定PodSecurityPolicy准入控制器是否成功启用。以静态Pod运行kube-apiserver的日志同样可使用kubectl logs命令获取。如下面的命令及截取的结果所示，PodSecurityPolicy准入控制器已然成功加载。若Kubernetes的各系统类Pod资源运行状态正常，即表示安全策略已然成功启用。

```java
[root@k8s-master01 apps]# kubectl logs kube-apiserver-k8s-master01.ilinux.io -n kube-system
……
plugins.go:158] Loaded 13 mutating admission controller(s) successfully in the following order: NamespaceLifecycle,LimitRanger,…,PodSecurityPolicy,…
plugins.go:161] Loaded 11 validating admission controller(s) successfully in the following order: LimitRanger,ServiceAccount,PodSecurityPolicy,…
……
注意：
尽管PSP对已处于运行状态的Pod或容器没有影响，但对于正常运行中的Kubernetes集群来说，中途启用PodSecurityPolicy仍然可能会导致诸多难以预料的错误，尤其是没有事先为用到安全配置的Pod资源准备好可用的PSP资源时，这些Pod资源一旦重启便会因触发PSP策略而被阻止。
```

接下来，我们可通过能成功认证的普通账户测试其创建Pod资源时是否受限于restricted安全策略，以验证PodSecurityPolicy资源的生效状态。下面的命令尝试以dev名称空间的管理员mason用户创建一个使用了主机端口（hostPort）的Pod资源，但该操作被PodSecurityPolicy拒绝。

```java
[root@k8s-master01 apps]# kubectl run pod-with-hostport --image="ikubernetes/demoapp:v1.0" \
      --port=80 --hostport=32080 -n dev --context='mason@kubernetes'
Error from server (Forbidden): pods "pod-with-hostport" is forbidden: unable to validate against any pod security policy: [spec.containers[0].hostPort: Invalid value: 32080: Host port 32080 is not allowed to be used. Allowed ports: []]
```

因为mason用户由API Server成功认证后，将被自动归类到system:authenticated组和它所属的developers组中，但仅前一个组有权使用restricted安全策略。移除命令中的--hostport选项再次执行创建操作即可成功完成。另外，我们也可按此方式授权特定的用户拥有特定类型的Pod对象创建权限，但策略冲突时可能会导致意料不到的结果，因此将任何Pod安全策略应用到生产环境之前请务必做到充分测试。
