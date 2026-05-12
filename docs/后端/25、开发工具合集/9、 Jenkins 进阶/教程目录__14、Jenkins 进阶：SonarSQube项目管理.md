# 14、Jenkins 进阶：SonarSQube项目管理
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/14.html
- 分类：开发工具
- 分组：教程目录
### 一、创建质量配置及关联项目

#### 1.新建一个java代码质量配置

#### 2.为配置添加规则

**确认有4条规则了**

**为项目更换扫描配置**

### 二、创建质量阈关联项目

#### 1.创建质量阈

#### 2.管理项目

#### 3.添加指标

### 三、SonarSQube集成到pipeline

#### 1.创建API访问凭证

#### 2.创建sharelibrary

```java
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
```

#### 3.修改jenkinsfile，新增以下内容

```java
def sonarapi = new org.devops.sonarapi()
                    sleep 3
                    tools.PrintMes("获取扫描结果","green")
                    result = sonarapi.GetProjectStatus("${JOB_NAME}")
                    println(result)
                    if (result.toString() == "ERROR"){
                        toemail.Email("代码质量阈错误！请及时修复！",userEmail)
                        error " 代码质量阈错误！请及时修复！"
                    } else {
                        println(result)
                    } 
```

#### 4.安装插件

#### 5.验证

参考文档：

https://docs.sonarqube.org/latest/analyzing-source-code/analysis-parameters/

https://docs.sonarqube.org/latest/analyzing-source-code/languages/java/
