# 15、Jenkins 进阶：SonarSQube API使用
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/15.html
- 分类：开发工具
- 分组：教程目录
**本章主要通过SonarSQube API在pipeline第一次执行时就指定自定义的质量配置和质量阈**

**API 文档：http://192.168.1.134:9000/web_api**

### 一、编写sonar API(sonarapi.groovy)

**注意替换代码中sonarserve的地址及认证凭据，凭据创建见上一章节**

```java
package org.devops
//封装HTTP
def HttpReq(reqType,reqUrl,reqBody){
    def sonarServer = "http://192.168.1.134:9000/api"
    result = httpRequest authentication: 'sonar-admin',
            httpMode: reqType, 
            contentType: "APPLICATION_JSON",
            consoleLogResponseBody: true,
            ignoreSslErrors: true, 
            requestBody: reqBody,
            url: "${sonarServer}/${reqUrl}"
            //quiet: true
    return result
}
//获取Sonar质量阈状态
def GetProjectStatus(projectName){
    // http://192.168.1.134:9000/api/project_branches/list?project=demo-maven-service
    // {"branches":[{"name":"main","isMain":true,"type":"BRANCH","status":{"qualityGateStatus":"OK"},"analysisDate":"2023-03-15T21:54:57+0800","excludedFromPurge":true}]}
    apiUrl = "project_branches/list?project=${projectName}"
    response = HttpReq("GET",apiUrl,'')
    response = readJSON text: """${response.content}"""
    result = response["branches"][0]["status"]["qualityGateStatus"]
    //println(response)
   return result
}
//获取Sonar质量阈状态(多分支)
def GetProjectStatus(projectName,branchName){
    apiUrl = "qualitygates/project_status?projectKey=${projectName}&branch=${branchName}"
    response = HttpReq("GET",apiUrl,'')
    response = readJSON text: """${response.content}"""
    result = response["projectStatus"]["status"]
    //println(response)
   return result
}
//搜索Sonar项目
def SerarchProject(projectName){
    apiUrl = "projects/search?projects=${projectName}"
    response = HttpReq("GET",apiUrl,'')
    response = readJSON text: """${response.content}"""
    result = response["paging"]["total"]
    if(result.toString() == "0"){
       return "false"
    } else {
       return "true"
    }
}
//创建Sonar项目
def CreateProject(projectName){
    apiUrl =  "projects/create?name=${projectName}&project=${projectName}"
    response = HttpReq("POST",apiUrl,'')
    println(response)
}
//配置项目质量规则
def ConfigQualityProfiles(projectName,lang,qpname){
    apiUrl = "qualityprofiles/add_project?language=${lang}&project=${projectName}&qualityProfile=${qpname}"
    response = HttpReq("POST",apiUrl,'')
    println(response)
}
//获取质量阈ID
def GetQualtyGateId(gateName){
    apiUrl= "qualitygates/show?name=${gateName}"
    response = HttpReq("GET",apiUrl,'')
    response = readJSON text: """${response.content}"""
    result = response["id"]
    return result
}
//配置项目质量阈
def ConfigQualityGates(projectName,gateName){
    gateId = GetQualtyGateId(gateName)
    apiUrl = "qualitygates/select?gateId=${gateId}&projectKey=${projectName}"
    response = HttpReq("POST",apiUrl,'')
    println(response)println(response)
}
```

### 二、jenkinsfile

**qpName为项目质量规则和质量阈的名称，请自行替换**

```java
#!groovy
@Library('jenkinslibrary@master') _
// shareLibrary 函数
def build = new org.devops.build()
def deploy = new org.devops.deploy()
def tools = new org.devops.tools()
def gitlab = new org.devops.gitlab()
def toemail = new org.devops.toemail()
def sonar = new org.devops.sonarqube()
def sonarapi = new org.devops.sonarapi()
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
        stage("QA"){
            steps {
                script{
                    tools.PrintMes("搜索项目","green")
                    result = sonarapi.SerarchProject("${JOB_NAME}")
                    println(result)
                    if (result == "false"){
                        println("${JOB_NAME}---项目不存在,准备创建项目---> ${JOB_NAME}！")
                        sonarapi.CreateProject("${JOB_NAME}")
                    } else {
                        println("${JOB_NAME}---项目已存在！")
                    }                    
                    tools.PrintMes("配置项目质量规则","green")
                    // qpName="${JOB_NAME}".split("-")[0]   //Sonar%20way Sonar/way
                    qpName="demo-java"
                    sonarapi.ConfigQualityProfiles("${JOB_NAME}","java",qpName)
                    tools.PrintMes("配置质量阈","green")
                    sonarapi.ConfigQualityGates("${JOB_NAME}",qpName)
                    tools.PrintMes("代码扫描","green")
                    sonar.SonarScan("test","${JOB_NAME}","${JOB_NAME}","src")
                    sleep 30
                    tools.PrintMes("获取扫描结果","green")
                    result = sonarapi.GetProjectStatus("${JOB_NAME}")
                    println(result)
                    if (result.toString() == "ERROR"){
                        toemail.Email("代码质量阈错误！请及时修复！",userEmail)
                        error " 代码质量阈错误！请及时修复！"
                    } else {
                        println(result)
                    }                    
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

### 三、验证

如果项目已存在请删除sonar项目后重新运行流水线查看
