# 13、Jenkins 进阶：配置SonarScanner扫描Java项目
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/13.html
- 分类：开发工具
- 分组：教程目录
### 一、手动测试

注意此版本已经内置包含Java语言扫描插件，不再需要单独安装

#### 1.clone代码

```java
 git clone git@192.168.1.128:root/demo-maven-service.git demo-maven-service网上都有
```

#### 2.手动编译项目

```java
cd demo-maven-service/
mvn clean package
ll target/     sonarscanner 需要扫描target目录下classes目录下编译后的类
```

#### 3.配置SonarScanner

```java
cd /usr/local/sonar-scanner/conf
vim sonar-scanner.properties 
# sonar扫描的目录，.表示当前目录
sonar.sources=.
#登录saona的账号秘密
sonar.login=admin
sonar.password=123456
sonar.projectVersion=1.0
sonar.sourceEncoding=UTF-8
#sorar地址
sonar.host.url=http://192.168.1.134:9000
sonar.ws.timeout=30
```

#### 4.执行SonarScanner

```java
#sonar-scanner启动参数可以通过配置文件或者命令行指定，命令行优先级高于配置文 本行命令中sources配置会覆盖配置文件中定义的目录
sonar-scanner -Dsonar.projectKey=demo-maven-service \
  -Dsonar.projectName=demo-maven-service \
  -Dsonar.projectDescription='my first project!' \
  -Dsonar.links.homepage=http://www.baidu.com \
  -Dsonar.sources=src \
  -Dsonar.java.binaries=target/classes \
  -Dsonar.java.test.binaries=target/test-classes \
  -Dsonar.java.surefire.report=target/surefire-reports
```

#### 5.查看扫描结果

```java
#确保输出正常，包含此日志
INFO: ANALYSIS SUCCESSFUL, you can find the results at: http://192.168.1.134:9000/dashboard?id=demo-maven-service
```

访问扫描结束后输出的链接

### 二、SonarScanner集成之pipeline

社区版本存在的问题：项目所有的分支都在一个项目中，无法区分哪个版本对应哪个分支，如果一定要，只能每一个分支建立一个扫描项目，但是会生成太多太多的项目

#### 1.创建sharelibrary

```java
# sonarqube.groovy
package org.devops
//scan
def SonarScan(projectName,projectDesc,projectPath){
        def scannerHome = "/usr/local/sonar-scanner"
        // 使用时间作为版本号，sh语法可以参考流水线语法
        def sonarDate = sh  returnStdout: true, script: 'date  +%Y%m%d%H%M%S'
        sonarDate = sonarDate - "\n"
        sh """ 
            ${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=${projectName} \
            -Dsonar.projectName=${projectName} -Dsonar.projectVersion=${sonarDate}  \
            -Dsonar.projectDescription=${projectDesc} -Dsonar.links.homepage=http://www.baidu.com \
            -Dsonar.sources=${projectPath} -Dsonar.java.binaries=target/classes \
            -Dsonar.java.test.binaries=target/test-classes -Dsonar.java.surefire.report=target/surefire-reports 
        """
}
```

**sharelibrary中sh语法参考**

#### 2.编辑jenkinsfile

```java
#新增以下内容
def sonar = new org.devops.sonarqube()
# 在build后面新增QA 步骤
        stage("QA"){
            steps {
                script{
                    tools.PrintMes("代码扫描","green")
                    sonar.SonarScan("${JOB_NAME}","${JOB_NAME}","src")            
                }
            }
        }
```

#### 3.测试

提交任意push

### 三、SonarScanner集成之sonar插件

参考地址：https://docs.sonarqube.org/latest/analyzing-source-code/scanners/jenkins-extension-sonarqube/

#### 1.安装插件

#### 2.创建jenkins访问sonarqube的token

#### 3.jenkins创建访问sonarqube凭据

#### 4.配置sonarqube服务地址

Manage Jenkins > Configure System

#### 5.全局工具中配置sonarscanner(可选)

Manage Jenkins > Global Tool Configuration

#### 6.修改sharelibrary

#### 7.验证

### 四、多sonarqube服务

#### 1.Manage Jenkins > Configure System中添加其他sonarqube服务

略

#### 2.修改sharelibrary

#### 3.修改jenkinsfile

#### 4.验证

略

### 其他参考：

https://blog.csdn.net/tuzongxun/article/details/123806878

https://docs.sonarqube.org/latest/instance-administration/plugin-version-matrix/
