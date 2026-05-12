# 28、Kubernetes 实战 - 之部署微服务项目实战
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/28.html
- 分类：容器服务
- 分组：教程目录
## 安装kuboard

```sh
kubectl apply -f https://kuboard.cn/install-script/kuboard.yaml
kubectl apply -f https://addons.kuboard.cn/metrics-server/0.3.7/metrics-server.yaml
# 如果您参考 www.kuboard.cn 提供的文档安装 Kuberenetes，可在第一个 Master 节点上执行此命令
echo $(kubectl -n kube-system get secret $(kubectl -n kube-system get secret | grep kuboard-user | awk '{print $1}') -o go-template='{
     {.data.token}}' | base64 -d)
# 访问
http://任意一个Worker节点的IP地址:32567/
```

## 安装mysql

**1、** 构建自定义mysql镜像：准备sql脚本，初始化数据库及数据结构，使用Dockerfile文件构建镜像，并推送到私服；

```sh
# 
vi Dockerfile
# 内容
FROM mysql:5.7.26
ADD d_general.sql /docker-entrypoint-initdb.d/d_general.sql
EXPOSE 3306
# 
docker build -t demo-mysql:1.0.0 .
```

**1、** 进入kurboard创建命名空间demo；

**2、** 进入命名空间，点击创建负载；

**3、** 填写控制器信息；

**4、** 填写容器信息；

**5、** 填写svc信息；

**6、** 保存应用，会自动创建，点击可查看状态及相关日志；

## 部署redis

同mysql，修改相关信息。。。
