# 06、Jenkins 进阶：共享库方式集成构建工具
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/6.html
- 分类：开发工具
- 分组：教程目录
### 一、新建library文件 build.groovy

```java
package org.devops
// 构建类型
def Build(buildType,buildShell){
    // M3 ANT等值都是配置相关全局工具是定义的名称
    def buildTools = ["mvn":"M3","ant":"ANT","gradle":"GRADLE","npm":"NPM"]
    println("当前选择的构建类型为：${buildType}")
    buildHome = tool buildTools[buildType]
    sh "${buildHome}/bin/${buildType}  ${buildShell}"
}
```

### 2.新建一个jenkins CI文件

```java
#!groovy
@Library('jenkinslibrary@master') _
def build = new org.devops.build()
// buildType  buildShell 为选项参数名称
String buildType = "${env.buildType}"
String buildShell = "${env.buildShell}"
pipeline {
    agent any
    stages {
        stage("build"){
            steps{
                script {
                    println(buildType)
                    println(buildShell)
                    build.Build(buildType,buildShell)
                }
            }
        }
    }
}
```

### 3.配置pipeline

#### 3.1 新增选项参数

注意选项名称和值，需要和jenkinsfile及sharelibrary中保持一致

#### 3.2 指定jenkinsfile路径

#### 3.3 验证
