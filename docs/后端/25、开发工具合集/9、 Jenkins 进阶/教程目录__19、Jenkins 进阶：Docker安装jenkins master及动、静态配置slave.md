# 19、Jenkins 进阶：Docker安装jenkins master及动、静态配置slave
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/19.html
- 分类：开发工具
- 分组：教程目录
### 一、docker安装jenkins-master

```java
wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
um clean all  && yum makecache fast
yum install docker -y
docker pull jenkins/jenkins:2.375.1-lts-jdk11
mkdir /mnt/jenkins-data
chown -R 1000:1000 /mnt/jenkins-data/
docker run --name jenkins -itd  --privileged=true      -p 8081:8080    -p 50000:50000 -v /etc/localtime:/etc/localtime:ro   -v /mnt/jenkins-data:/var/jenkins_home jenkins/jenkins:2.375.1-lts-jdk11 基于JNLP的Jenkins slave通过TCP端口50000与Jenkins master进行通信
docker exec -it jenkins /bin/bash 
cat /var/jenkins_home/secrets/initialAdminPassword 39c5c724ff5341fb91e9ab793425ef54
```

http://192.168.1.131:8081/

其他按提示配置即可

### 二、添加docker slave节点(静态节点)

#### 1.首先我们在Jenkins的节点管理中，添加节点。输入节点的名称和类型

#### 2.配置节点信息：自定义目录 启动方式： java web

#### 3.获取JNLP方式运行slave所需要的秘钥信息。

#### 4.在slave节点安装docker及下载jenkisn slave镜像

```java
docker pull jenkins/jnlp-slave:latest-jdk11注意jdk版本，不可以比master的jdk版本低
docker run -itd  --privileged=true --name jenkins-slave01 -v /etc/localtime:/etc/localtime:ro jenkins/jnlp-slave:latest-jdk11 -url http://192.168.1.131:8081/ 70e0b0f5f1f43d5be91b3c98cfa457e2db8a1411498f493b8cff3aad48396705 build01  
docker logs jenkins-slave01
```

### 三、配置Jenkins动态slave

#### 1.salve配置

```java
vim  /usr/lib/systemd/system/docker.service
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock -H tcp://0.0.0.0:2376在最后添加-H tcp://0.0.0.0:2376 
systemctl daemon-reload
systemctl restart docker
curl -XGET http://127.0.0.1:2376/version确保有正确输出
docker pull fantito/jdk11-maven-git:latest下载测试容器，该容器jdk版本要和master端保持一致或者大于，运行用户建议使用root运行，否则会出现权限问题
```

#### 2.master安装插件

安装[Docker plugin插件](https://plugins.jenkins.io/docker-plugin)

#### 3.方式1： 使用CLoud

配置docker slave

配置docker template

测试pipeline

```java
pipeline {
    agent {
        label 'docker-build'
    }
    stages {
        stage('Hello') {
            steps {
                sh 'java -version'
                sh 'git version'
                sleep 50
            }
        }
    }
}
```

验证

#### 4.方式2： 直接调用

```java
dockerNode(dockerHost: 'tcp://192.168.1.133:2376', image: 'fantito/jdk11-maven-git:latest') {
    sh 'java -version'
    sh "sleep 5"
}
```
