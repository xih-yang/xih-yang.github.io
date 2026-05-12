# 22、Jenkins 进阶：Jenkins API实践
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/22.html
- 分类：开发工具
- 分组：教程目录
### 一、jenkins Python API

在线文档：https://python-jenkins.readthedocs.io/en/latest/

项目地址：https://pypi.org/project/python-jenkins/

#### 1.注意支持的Python版本

目前只支持到3.6

#### 2.简单示例

```java
pip3 install python-jenkins
import jenkins
server = jenkins.Jenkins('http://192.168.1.129:8080/jenkins', username='admin', password='123456',timeout=10) jenkins地址 用户 密码 连接超时，单位秒
user = server.get_whoami()     get_whoami 及get_version就是接口名称，其他接口名称可以通过文档查询，执行对应的操作即可
version = server.get_version()
print('Hello %s from Jenkins %s' % (user['fullName'], version))
```

### 二、jenkins REST API

#### 1.API简介

```java
本地文档：http://${jenkins_url}/api/
#job可以替换成其他jenkins 选项，如果视图 凭据，都有全局及单个,在对应的url后面加上/api即可
http://${jenkins_url}/job/${job_name}/api/  
http://192.168.1.129:8080/jenkins/manage/credentials/api/凭据
http://192.168.1.129:8080/jenkins/manage/credentials/store/system/domain/_/credential/nexus-admin/api/ 单个凭据
```

以下为常见的job API

#### 2.jenkins REST API共享库封装

创建API token

创建凭据

验证凭据是否有效

```java
pipeline {
    agent  any
    stages {
        //下载代码
        stage("GetCode"){ //阶段名称
            steps{  //步骤
                httpRequest authentication: 'jenkins-admin',
                httpMode: 'POST',
                responseHandle: 'NONE',
                url: 'http://192.168.1.129:8080/jenkins/job/pipeline-test02/disable' 将test02禁用
            }
        }
    }
}
```

确实被禁用了

#### 3.jenkins file + sharelibrary示例

sharelibrary

jenkinsapi.groovy(注意替换对应的 jenkins地址 凭据名称 及模板项目名称)

```java
package org.devops
//封装HTTP请求
def HttpReq(reqType,reqUrl,reqBody){
    def jenkinsServer = 'http://192.168.1.129:8080/jenkins/'
    result = httpRequest authentication: 'jenkins-admin',
                        httpMode: reqType,
                        consoleLogResponseBody: true,
                        ignoreSslErrors: true, 
                        requestBody: reqBody,
                        url: "${jenkinsServer}/${reqUrl}"
                        //quiet: true
}
//新建项目
def CreateProject(projectName){
    withCredentials([usernamePassword(credentialsId: 'jenkins-zeyang-admin', passwordVariable: 'password', usernameVariable: 'username')]) {
       // demo-project-manage 为示例pipeline项目，用于提供新项目配置模板
        sh """
           curl -u ${username}:${password} -X GET 'http://192.168.1.129:8080/jenkins/job/demo-project-manage/config.xml' -o config.xml
           ls -l 
           curl -u ${username}:${password} -X POST 'http://192.168.1.129:8080/jenkins//createItem?name=${projectName}' -H 'Content-Type:text/xml' --data-binary @config.xml
        """
    }
}
//禁用项目
def Project(projectName,option){
    println(projectName)
    println(option)
    options = [ "DisableProject": "disable",
                "EnableProject":"enable",
                "DeleteProject":"doDelete",
                "BuildProject":"build"]
    result = HttpReq('POST',"job/${projectName}/${options[option]}",'')
}
```

jenkins file

jenkinsapi.jenkinsfile

```java
@Library("jenkinslibrary@master") _
def jenkinsapi = new org.devops.jenkinsapi()
String projectName = "${env.projectName}"
String manageOpts = "${env.manageOpts}"
pipeline {
    agent { node {label "master"}}
    stages{
        stage("test"){
            steps{
                script{
                    if (manageOpts == "CreateProject"){
                        jenkinsapi.CreateProject(projectName)
                    } else {
                        jenkinsapi.Project(projectName,manageOpts)
                    }
                }
            }
        }
    }
}
```

创建模板pipeline项目

显示结果

测试

### 三、jenkins CoreAPI

就是java版API，文档链接：https://javadoc.jenkins.io/index-core.html

不会java,会的可以研究下
