# 20、Jenkins 进阶：docker in docker运行pipeline
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/20.html
- 分类：开发工具
- 分组：教程目录
### 一、配置JenkinsMaster挂载Docker

```java
docker run --name jenkins -itd  --privileged=true      -p 8081:8080    -p 50000:50000 -v /etc/localtime:/etc/localtime:ro  -v /var/run/docker.sock:/var/run/docker.sock  -v /bin/docker:/usr/bin/docker -v /mnt/jenkins-data:/var/jenkins_home jenkins/jenkins:2.375.1-lts-jdk11 挂载宿主机docker
解决权限问题/以root用户运行
grep docker /etc/group获取docker组ID
docker exec -it -u root jenkins bash
groupadd docker -g 996 和宿主机保持一致
gpasswd -a jenkins docker
newgrp docker
docker ps
```

二、docker in docker使用示例

**1、** pipeline；

```java
pipeline {
    agent {
        docker { 
            image 'maven:3.6.3-jdk-8' 
            args '-v $HOME/.m2:/root/.m2'
        }
    }
    stages {
        stage('Build') {
            steps {
                sh 'mvn -v'
            }
        }
    }
}
```

**2、** stage；

```java
pipeline {
    agent none
    stages {
        stage('ServiceBuild') {
            agent {
                docker { 
                    image 'maven:3.6.3-jdk-8' 
                    args '-v $HOME/.m2:/root/.m2'
                }
            }
            steps {
                sh 'mvn -v  && sleep 15'
            }
        }
        stage('WebBuild') {
            agent {
                docker { 
                    image 'node:7-alpine' 
                    args '-v $HOME/.npm:/root/.npm'
                }
            }
            steps {
                sh 'node -v  && sleep 15'
            }
        }
    }
}
```

三、前端pipeline示例

**1、** 初始化前端项目；

```java
ZeyangdeMacBook-Pro:demo zeyang$ vue-init webpack test   实际应该从git拉取
? Project name test
? Project description A Vue.js project
? Author adminuser <2560350642@qq.com>
? Vue build standalone
? Install vue-router? Yes
? Use ESLint to lint your code? No
? Set up unit tests No
? Setup e2e tests with Nightwatch? No
? Should we run npm install for you after the project has been created? (recom
mended) npm
ZeyangdeMacBook-Pro:~ zeyang$ cp -r demo/* jenkins/workspace/test/
ZeyangdeMacBook-Pro:~ zeyang$ cd jenkins/workspace/test
ZeyangdeMacBook-Pro:test zeyang$ ls
README.md        index.html        package.json
build            node_modules        src
config            package-lock.json    static
```

**2、** 编写jenkinsfile(声明式)；

```java
pipeline {
    agent none
    stages {
        stage('WebBuild') {
            agent {
                docker { 
                    image 'node:10.19.0-alpine' 
                    args '-u 0:0 -v /var/jenkins_home/.npm:/root/.npm' 此处/var/jenkins_home/.npm为 jenkins docker自己的目录
                }
            }
            steps {
                sh """
                    id 
                    ls /root/.npm
                   npm config set unsafe-perm=true
                    npm config list
                    npm config set cache  /root/.npm
                   npm config set registry https://registry.npm.taobao.org
                    npm config list
                    ls 
                    cd demo && npm install  --unsafe-perm=true && npm run build  && ls -l dist/ && sleep 15 
                """
            }
        }
    }
}
```

**3、** script(脚本式)；

```java
pipeline {
   agent {node {label "master"}}
    stages {
        stage('WebBuild') {
            steps {
                script {
                    docker.image('node:10.19.0-alpine').inside('-u 0:0 -v /var/jenkins_home/.npm:/root/.npm') {
                        sh """
                            id 
                            ls /root/.npm
                            ls /root/ -a
                            npm config set unsafe-perm=true
                            npm config list
                            npm config set cache  /root/.npm
                           npm config set registry https://registry.npm.taobao.org
                            npm config list
                            ls 
                            cd demo && npm install  --unsafe-perm=true && npm run build  && ls -l dist/ && sleep 15 
                        """
                    }
                }
            }
        }
    }
}
```

四、注意事项

```java
1. npm构建权限问题：使用root用户构建。设置容器运行用户 -u 0:0
2. npm打包慢问题： 
   2.1 挂载缓存卷 -v /var/jenkins_home/.npm:/root/.npm
   2.2 设置淘宝源 npm config set registry https://registry.npm.taobao.org
```

### 五、镜像清理(HARBOR)

会全部清理，注意测试环境验证生产谨慎使用

```java
#!groovy
@Library('jenkinslibrary@master') _
def tools = new org.devops.tools()
String registryName = "${env.registryName}"
String serviceName = "${env.serviceName}"
String tagName = "${env.tagName}"
def harborProjects = []
currentBuild.description = "Trigger by ${serviceName} ${tagName}"
pipeline {
    agent { node { label "build"} }
    stages{
        stage("GetHarborTags"){
            steps{
                timeout(time:5, unit:"MINUTES"){
                    script{
                        tools.PrintMes("获取Harbor仓库中的项目信息","green")
                        println(serviceName)
                        try {
                            response = httpRequest authentication: 'harbor-admin,
                                                   url: "https://registry.demo.com/api/repositories/${registryName}/${serviceName}/tags",
                                                   ignoreSslErrors: true
                            //println(response.content)
                            response = readJSON text: """${response.content}"""
                        } catch(e){
                            response = ['name':'']
                            println(e)
                            println("Harbor镜像不存在此标签！")
                        }
                        /*println(tagName)
                        for (tagname in response){
                            //println(response)
                            harborProjects << tagname['name']
                        }
                        println(harborProjects)*/
                    }
                }
            }
        }
        stage("DeleteHarborTags"){
            steps{
                timeout(time:20, unit:"MINUTES"){
                    script{
                        tools.PrintMes("总共找到 ${harborProjects.size()} 个标签","green")
                        sumImageNum = harborProjects.size()
　　　　　　　　　　　　　　//这里循环删除，注意验证，生产谨慎使用
                        for (tag in harborProjects){
                            sumImageNum -= 1
                            tools.PrintMes(" ${sumImageNum}  Delete Tags ---> ${registryName} --> ${serviceName} --> ${tag} ","green")
                            httpRequest httpMode: 'DELETE',
                                       authentication: 'c016027e-0573-4246-93cf-f4a55b08a86a',
                                       url: "https://registry.demo.com/api/repositories/${registryName}/${serviceName}/tags/${tag}",
                                       ignoreSslErrors: true
                            sleep 1
                        }
                    }
                }
            }
        }
    }
    post {
        always{
            script{
                cleanWs notFailBuild: true 
            }
        }
    }
}
```
