# 18、Jenkins 进阶：nexus制品获取及晋级
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/18.html
- 分类：开发工具
- 分组：教程目录
## 一、制品获取

### 1.安装及配置插件

**配置插件(jenkins项目中)**

### 2.选择对应的制品

### 3.修改jenkins file

```java
// 新增以下代码
String artifactUrl = "${env.artifactUrl}"
// 下载制品，当前需要制品匿名用户可访问，后续可以通过shell或者ansible salt分发到应用服务器
sh " wget ${artifactUrl} && ls "
// 使用指定用户
// sh " wget --user=admin --password=Qwer@123 ${artifactUrl} && ls "
//使用指定用户并隐藏用户名及密码
/* vim ~/.wgetrc
user=admin
password=Qwer@123
chmod 600 ~/.wgetrc
*/
```

## 二、制品晋级

### 1.新建releases仓库

### 2.编写jekinsfile及sharelibrary

nexus.groovy

```java
def NexusUpload(){
    //use nexus plugin
    nexusArtifactUploader artifacts: [[artifactId: "${pomArtifact}", 
                                        classifier: '', 
                                        file: "${filePath}", 
                                        type: "${pomPackaging}"]], 
                            credentialsId: 'nexus-admin', 
                            groupId: "${pomGroupId}", 
                            nexusUrl: '192.168.1.134:8081', 
                            nexusVersion: 'nexus3', 
                            protocol: 'http', 
                            repository: "${repoName}", 
                            version: "${pomVersion}"
}
//制品晋级
def ArtifactUpdate(updateType,artifactUrl){
    //晋级策略
    if ("${updateType}" == "snapshot -> release"){
        println("snapshot -> release")
        //下载原始制品，如果仓库没有允许匿名用户访问，需要给wget配置认证信息，具体方法上面有
        sh "  rm -fr updates && mkdir updates && cd updates && wget ${artifactUrl} && ls -l "
        //获取artifactID 
        artifactUrl = artifactUrl -  "http://192.168.1.134:8081/repository/maven-hosted/"
        artifactUrl = artifactUrl.split("/").toList()
        println(artifactUrl.size())
        env.jarName = artifactUrl[-1] 
        env.pomVersion = artifactUrl[-2].replace("SNAPSHOT","RELEASE")
        env.pomArtifact = artifactUrl[-3]
        pomPackaging = artifactUrl[-1]
        pomPackaging = pomPackaging.split("\\.").toList()[-1]
        env.pomPackaging = pomPackaging[-1]
        env.pomGroupId = artifactUrl[0..-4].join(".")
        println("${pomGroupId}##${pomArtifact}##${pomVersion}##${pomPackaging}")
        env.newJarName = "${pomArtifact}-${pomVersion}.${pomPackaging}"
        //更改名称
        sh " cd updates && mv ${jarName} ${newJarName} "
        //上传制品
        env.repoName = "maven-releases"
        env.filePath = "updates/${newJarName}"
        NexusUpload()
    }
}
```

**update.jenkinsfile**

```java
#!groovy
@Library("jenkinslibrary@master") _
def nexus = new org.devops.nexus()
String updateType = "${env.updateType}"
String artifactUrl = "${env.artifactUrl}"
pipeline{
    agent any
    stages{
        stage("UpdateArtifact"){
            steps{
                script{
                   nexus.ArtifactUpdate(updateType,artifactUrl)
                }
            }
        }
    }
}
```

### 3.新建jenkins pipeline

可以直接拷贝demo-maven-service

**执行界面**

### 4.执行结果
