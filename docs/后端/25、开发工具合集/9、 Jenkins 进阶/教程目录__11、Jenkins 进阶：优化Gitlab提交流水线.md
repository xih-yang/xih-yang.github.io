# 11、Jenkins 进阶：优化Gitlab提交流水线
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/11.html
- 分类：开发工具
- 分组：教程目录
完整jenkinsfile 、sharelibrary 及jenkins配置见最后

### 一、gitlab push分支自动匹配

#### 1.添加Generic Webhook插件参数，获取本次提交的分支信息

#### 2.jenkinsfile添加判断，并切换到push的分支

#### 3.新建分支并提交测试

### 二、增加build描述信息

#### 1.新增webhook post参数

#### 2.修改jenkinsfile

#### 3. currentBuild.description参考

#### 4.验证

### 三、添加gitlba commit状态

#### 1.相关参考

https://docs.gitlab.com/ee/api/commits.html#commit-status #查看gitlab pipeline执行状态

#### 2.新增jenkisn sharelibrary

#### 3.修改jenkinsfile

```java
// 1.引入sharelibrary
def gitlab = new org.devops.gitlab()  
// 2.开始默认运行状态为running
if("${runOpts}" == "GitlabPush"){
    branchName = branch - "refs/heads/"
    currentBuild.description = "Trigger by ${userName} ${branch}"
    gitlab.ChangeCommitStatus(projectId,commitSha,"running")
}
       //3. 在post中，在对应状态下添加gitlab commit状态 ，以success为例
        success{
            script{
                println("成功")
                gitlab.ChangeCommitStatus(projectId,commitSha,"success")
            }
        }
```

#### 3.创建 gitlab token

#### 4.jenkins配置凭据，注意凭据名称和sharelibrary中保持一致

#### 6.新增webhook post参数

#### 7.验证配置

### 四、过滤新增分支特殊的push请求

有一些特殊的push请求如新建分支，这样也执行pipeline流水线显然不合适，所有需要过滤这一类特殊的push请求

https://github.com/jenkinsci/generic-webhook-trigger-plugin/tree/master/src/test/resources/org/jenkinsci/plugins/gwt/bdd/gitlab #官方示例

#### 1.新增webhook post参数

#### 2.添加过滤规则

```java
^push\s(?!0{40}).{40}\s(?!0{40}).{40}$
$object_kind $before $after
```

#### 3.自行测试新建分支是否会触发push请求执行流水线

### 五、添加构邮件通知

#### 1.安装邮件插件

#### 2.配置邮件插件

#### 3.修改jenkins管理员邮箱地址

#### 4.编写sharelibrary

#### 5.修改jenkinsfile

```java
def toemail = new org.devops.toemail()
     // 调用发送右键
        success{
            script{
                println("成功")
                gitlab.ChangeCommitStatus(projectId,commitSha,"success")
                toemail.Email("流水线成功",userEmail)
            }
        }
```

#### 6.设置gitlab用户邮箱地址

#### 7.添加webhook post参数

#### 8.验证

### 六、配置分支只有在commit成功时才能合并

即如果一个分支最后一次提交执行流水线的状态必须成功才能合并分支

### 七、相关jenkinsfile 、sharelibrary 及jenkins配置

#### 1.jenkinsfile(ci.jenkinsfile)

```java
#!groovy
@Library('jenkinslibrary@master') _
// shareLibrary 函数
def build = new org.devops.build()
def deploy = new org.devops.deploy()
def tools = new org.devops.tools()
def gitlab = new org.devops.gitlab()
def toemail = new org.devops.toemail()
// jenkins 配置参数
String srcUrl = "${env.srcUrl}"
String branchName = "${env.branchName}"
String buildType = "${env.buildType}"
String buildShell = "${env.buildShell}"
// 判断本次job是gitlab自动提交触发还是jenkins手动触发 branch是eneric Webhook Trigger 定义的参数，值$.ref是 refs/heads/ + 本次提交的分支,所以最后需要删除refs/heads/
// currentBuild是全局环境变量，流水线语法可以查看
if("${runOpts}" == "GitlabPush"){
    branchName = branch - "refs/heads/"
    currentBuild.description = "Trigger by ${userName} ${branch}"
    gitlab.ChangeCommitStatus(projectId,commitSha,"running")
}
pipeline {
    agent any
    stages {
        stage("CheckOut"){
            steps{
                script{
                    println("${branchName}")
                    tools.PrintMes("获取代码","green")
                    checkout scmGit(branches: [[name: "${branchName}"]], extensions: [], userRemoteConfigs: [[credentialsId: 'e7054d0e-275e-48ca-8188-e69da2faffb8', url: "${srcUrl}"]])
                }
            }
        }
        stage("Build"){
            steps{
                script {
                    tools.PrintMes("编译打包","blue")
                    build.Build(buildType,buildShell)
                }
            }
        }
    }
    post {
        always{
            script{
               println("一直执行")
            }
        }
        success{
            script{
                println("成功")
                gitlab.ChangeCommitStatus(projectId,commitSha,"success")
                toemail.Email("流水线成功",userEmail)
            }
        }
        aborted{
            script{
                println("取消")
                gitlab.ChangeCommitStatus(projectId,commitSha,"canceled")
            }
        }
        failure{
            script{
                println("失败")
                gitlab.ChangeCommitStatus(projectId,commitSha,"failed")
                toemail.Email("流水线失败",userEmail)
            }
        }
    }
}
```

#### 2.sharelibrary

**toemail.groovy**

```java
package org.devops
//定义邮件内容
def Email(status,emailUser){
    emailext body: """
            <!DOCTYPE html> 
            <html> 
            <head> 
            <meta charset="UTF-8"> 
            </head> 
            <body leftmargin="8" marginwidth="0" topmargin="8" marginheight="4" offset="0"> 
                <img src="https://www.xqual.com/documentation/continuous_integration/images/jenkins-logo.png">
                <table width="95%" cellpadding="0" cellspacing="0" style="font-size: 11pt; font-family: Tahoma, Arial, Helvetica, sans-serif">   
                    <tr> 
                        <td><br /> 
                            <b><font color="#0B610B">构建信息</font></b> 
                        </td> 
                    </tr> 
                    <tr> 
                        <td> 
                            <ul> 
                                <li>项目名称：${JOB_NAME}</li>         
                                <li>构建编号：${BUILD_ID}</li> 
                                <li>构建状态: ${status} </li>                         
                                <li>项目地址：<a href="${BUILD_URL}">${BUILD_URL}</a></li>    
                                <li>构建日志：<a href="${BUILD_URL}console">${BUILD_URL}console</a></li> 
                            </ul> 
                        </td> 
                    </tr> 
                    <tr>  
                </table> 
            </body> 
            </html>  """,
            subject: "Jenkins-${JOB_NAME}项目构建信息 ",
            to: emailUser
}
```

**gitlab.groovy**

```java
package org.devops
//封装HTTP请求
def HttpReq(reqType,reqUrl,reqBody){
    def gitServer = "http://192.168.1.128/api/v4"
    withCredentials([string(credentialsId: 'gitlab-token', variable: 'gitlabToken')]) {
      result = httpRequest customHeaders: [[maskValue: true, name: 'PRIVATE-TOKEN', value: "${gitlabToken}"]], 
                httpMode: reqType, 
                contentType: "APPLICATION_JSON",
                consoleLogResponseBody: true,
                ignoreSslErrors: true, 
                requestBody: reqBody,
                url: "${gitServer}/${reqUrl}"
                //quiet: true
    } 
    return result
}
//更改提交状态
def ChangeCommitStatus(projectId,commitSha,status){
    commitApi = "projects/${projectId}/statuses/${commitSha}?state=${status}"
    response = HttpReq('POST',commitApi,'')
    println(response)
    return response
}
```

### 3.jenkisn配置

流水线配置
