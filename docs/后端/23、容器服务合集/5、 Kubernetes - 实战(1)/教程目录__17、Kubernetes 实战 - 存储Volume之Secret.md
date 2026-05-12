# 17、Kubernetes 实战 - 存储Volume之Secret
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/17.html
- 分类：容器服务
- 分组：教程目录
## 概述

Secret可让您存储和管理敏感信息，例如密码，OAuth令牌和ssh密钥。与逐字记录在机密信息中相比，将机密信息存储在机密信息中更安全，更灵活。

## 类型

创建密钥时，可以使用 资源type字段Secret或某些等效的kubectl命令行标志（如果有）来指定其类型。

类型
说明

Opaque
任意用户定义的数据

kubernetes.io/service-account-token
服务帐户令牌

kubernetes.io/dockercfg
序列化~/.dockercfg文件

kubernetes.io/dockerconfigjson
序列化~/.docker/config.json文件

kubernetes.io/basic-auth
基本身份验证凭证

kubernetes.io/ssh-auth
SSH身份验证的凭据

kubernetes.io/tls
TLS客户端或服务器的数据

bootstrap.kubernetes.io/token
引导令牌数据

## 创建

**1、** 通过字面值创建；

```sh
# 创建一个名为literral-secret的secret，username为admin，password为123456
kubectl create secret generic literral-secret --from-literal=username=admin --from-literal=password=123456
```

**1、** 通过自定义文件创键，键为文件名，值为文件内容，一个文件对应一条键值对数据；

```sh
echo -n admin > ./username
echo -n admin123 > ./password
kubectl create secret generic file-secret --from-file=./username --from-file=./password
```

**1、** 通过env文件创建，文件内容以键值对形式存放；

```sh
cat << EOF > env.txt
username=admin
password=admin123
EOF
kubectl create secret generic env-secret --from-env-file=env.txt
```

**1、** 使用yml文件创建；

```sh
# Base64编码admin123456，因为通过yml必须使用Base64对数据进行加密，实际只能说是编码....
echo -n 'admin123456' | base64
# 编码后的字符串
YWRtaW4xMjM0NTY=
vim mysql-secret.yaml
# 内容
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
data:
  password: YWRtaW4xMjM0NTY=
# 
kubectl create -f mysql-secret.yaml
```

## 查看

```sh
# 查看所有
kubectl get secret -n default
# 根据名字查看
kubectl get secret mysql-secret 
# yaml格式展示完整信息
kubectl get secret mysql-secret -o yaml
```

## 编辑

```sh
# yaml文件修改
vim mysql-secret.yaml 
kubectl apply -f mysql-secret.yaml
# 在线修改
kubectl edit secret mysql-secret 
```

## 删除

```sh
# 根据yaml文件删除
kubectl delete -f mysql-secret.yaml
# 根据名字删除
kubectl delete secret mysecret
# 删除所有
kubectl delete secret --all
```

## 案例

部署mysql，配置root密码从Secret中获取

**1、** 先按照创建5步骤创建一个secret；

**2、** 创建mysqlPod；

```sh
vim mysql-pod.yaml 
# 内容
apiVersion: v1
kind: Pod
metadata:
 labels:
  app: mysql
 name: mysql
spec:
   restartPolicy: Never
   containers:
   - name: mysql-001
     image: daocloud.io/library/mysql:5.7.4
     imagePullPolicy: IfNotPresent
     ports:
     - containerPort: 3306
       name: mysql-port
     env:
     - name: MYSQL_ROOT_PASSWORD
       valueFrom:
        secretKeyRef:
         name: mysql-secret
         key: password
# 
kubectl create -f mysql-pod.yaml 
```

**1、** 验证；

```sh
# 进入容器
kubectl exec -it mysql /bin/bash
# 使用secret配置的密码登录
mysql -uroot -padmin123456
```
