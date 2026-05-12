# 18、Kubernetes - 实战：使用 ConfigMap、Pod搭建 MariaDB+Nginx+WordPress
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/18.html
- 分类：容器服务
- 分组：教程目录
## 1. 网站基本架构

`WordPress`、`MariaDB` 这两个应用被封装成了 `Pod`（由于它们都是在线业务，所以 `Job/CronJob` 在这里派不上用场），运行所需的环境变量也都被改写成 `ConfigMap`，统一用“声明式”来管理，

## 2. 使用（cm+pod）部署 MariDB

`MariaDB` 需要 4 个环境变量，比如数据库名、用户名、密码等，在 `Docker` 里我们是在命令行里使用参数 `--env`，而在 `Kubernetes` 里我们就应该使用 `ConfigMap`，为此需要定义一个 `maria-cm` 对象：

```java
# maria-cm.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: maria-cm
data:
  DATABASE: 'db'
  USER: 'wp'
  PASSWORD: '123'
  ROOT_PASSWORD: '123'
```

然后我们定义 `Pod` 对象 `maria-pod`，把配置信息注入 `Pod`，让 `MariaDB` 运行时从环境变量读取这些信息：

```java
# mariadb-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: maria-pod
  labels:
    app: wordpress
    role: database
spec:
  containers:
  - image: mariadb:10
    name: maria
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 3306
    envFrom:
    - prefix: 'MARIADB_'
      configMapRef:
        name: maria-cm
```

定义`mariadb-pod.yml`的时候，有一个 `prefix: 'MARIADB_'`， 是把 `configMap`中的变量名字前面加上这个前缀作为 `pod`中的变量名称， 即：`pod`中的变量名称 = `'MARIADB_' + configMap`中的变量名称。这是因为 `MariaDB`要求环境变量必须这么命名。

注意这里我们使用了一个新的字段 `envFrom`，这是因为 `ConfigMap` 里的信息比较多，如果用 `env.valueFrom` 一个个地写会非常麻烦，容易出错，而 `envFrom` 可以一次性地把 `ConfigMap` 里的字段全导入进 `Pod`，并且能够指定变量名的前缀（即这里的 `MARIADB_`），非常方便。

使用`kubectl apply` 创建这个对象之后，可以用 `kubectl get pod` 查看它的状态，如果想要获取 `IP` 地址需要加上参数 `-o wide` ：

现在数据库就成功地在 `Kubernetes` 集群里跑起来了，IP 地址是“10.10.1.95”，注意这个地址和 `Docker` 的不同，是 `Kubernetes` 里的私有网段。

## 3. 使用（cm+pod）部署 WordPress

编排`WordPress` 对象，还是先用 `ConfigMap` 定义它的环境变量：

```java
# wp-cm.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wp-cm
data:
  HOST: '10.10.1.95'
  USER: 'wp'
  PASSWORD: '123'
  NAME: 'db'
```

在这个`ConfigMap` 里要注意的是 `HOST`字段，它必须是 `MariaDB Pod` 的 `IP` 地址，如果不写正确 `WordPress` 会无法正常连接数据库。

然后我们再编写 `WordPress` 的 `YAML` 文件，为了简化环境变量的设置同样使用了 `envFrom`：

```java
# wp-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: wp-pod
  labels:
    app: wordpress
    role: website
spec:
  containers:
  - image: wordpress:5
    name: wp-pod
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 80
    envFrom:
    - prefix: 'WORDPRESS_DB_'
      configMapRef:
        name: wp-cm
```

接着还是用 `kubectl apply` 创建对象，`kubectl get pod` 查看它的状态：

## 4. 设置端口转发，在集群外可见

为`WordPress Pod` 映射端口号，让它在集群外可见。

因为`Pod` 都是运行在 `Kubernetes` 内部的私有网段里的，外界无法直接访问，想要对外暴露服务，需要使用一个专门的 `kubectl port-forward` 命令，它专门负责把本机的端口映射到在目标对象的端口号，有点类似 `Docker` 的参数 `-p`，经常用于 `Kubernetes` 的临时调试和测试。

下面我就把本地的“8080”映射到 `WordPress Pod` 的“80”，`kubectl` 会把这个端口的所有数据都转发给集群内部的 `Pod`：

```java
kubectl port-forward wp-pod 8080:80 &
```

注意在命令的末尾我使用了一个 `&` 符号，让端口转发工作在后台进行，这样就不会阻碍我们后续的操作。如果想关闭端口转发，需要敲命令 `fg` ，它会把后台的任务带回到前台，然后就可以简单地用“Ctrl + C”来停止转发了。

## 5. 部署 Nginx

创建反向代理的 `Nginx`，让我们的网站对外提供服务。

这是因为 `WordPress` 网站使用了 `URL` 重定向，直接使用“8080”会导致跳转故障，所以为了让网站正常工作，我们还应该在 `Kubernetes` 之外启动 `Nginx` 反向代理，保证外界看到的仍然是“80”端口号。

`Nginx` 的配置文件目标地址变成了“127.0.0.1:8080”，它就是我们在第三步里用 `kubectl port-forward` 命令创建的本地地址：

```java
# nginx.conf
server {
  listen 80;
  default_type text/html;
  location / {
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_pass http://127.0.0.1:8080;
  }
}
```

然后我们用 `docker run -v` 命令加载这个配置文件，以容器的方式启动这个 `Nginx` 代理：

```java
docker run -d --name nginx --rm \
    --net=host \
    -v ./nginx.conf:/etc/nginx/conf.d/default.conf \
    nginx:alpine
```

有了`Nginx` 的反向代理之后，我们就可以打开浏览器，输入本机的“127.0.0.1”或者是虚拟机的 IP 地址，看到 WordPress 的界面：

> YAML 对于纯数字的字面值会默认转化为数字类型，而 ConfigMap/Secret 只接受字符串类型，所以就有必要在为纯数字加上引号来转换成字符串。

> 监听 80 端口需要 root 权限，所以 kubectl port-forward 用的是 8080 （大于系统保留的 1024 端口号）
