# 04、Jenkins 进阶：Jenkins常用pipline DSL方法
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/4.html
- 分类：开发工具
- 分组：教程目录
### 一、Json数据格式化(readJSON)

```java
# 建议使用
def response = readJSON text: "${scanResult}"
println(scanResult)
//以下为原生方法。不建议使用
import groovy.json.*
@NonCPS
def GetJson(text){
    def prettyJson = JsonOutput.prettyPrint(text)
    new JsonSlurperClassic().parseText(prettyJson)
}　
```

### 二、加密使用凭据

**语法帮助**

****

**示例：**

****

**生成流水线语法**

****

**简单调用**

****

****

### 三、checkout

```java
/ /Git
checkout([$class: 'GitSCM', branches: [[name: "brnachName"]]，
                   doGenerateSubmoduleConfigurations: false,
                   extensions: []，submoduleCfg:[]，
                   userRemoteConfigs: [[credentialsId: "${credentialsId} "，
                   url: "${srcUrl}"]]])
//Svn
checkout([$class: 'SubversionSCM', additionalCredentials: []，
                   filterChangelog: false，ignoreDirPropChanges: false,
                   locations: [[credentialsId: "$ {credentialsId}",
                   depthOption: 'infinity'， ignoreExternalsOption: true,
                   remote: "$ {svnUrl}"]]，workspaceUpdater: [$class:
' CheckoutUpdater']]　
```

**语法参考：**

****

### 四、生成HTML报告(publishHTML)

**安装插件：publish html report**

```java
publishHTML([allowMissing: false,
                alwaysLinkToLastBuild: false,
		keepAll: true,
		reportDir: './report/',
		reportFiles: "a.html，b. html"，
		reportName: 'InterfaceTestReport',
		reportTitles: 'HTML'])
```

**参数讲解**

```java
reportDir，就是你项目中保存html文件的地方，这里写'./report/'是一个相对路径写法，默认从你项目根路面开始
reportFiles，报告名称,这个地方可以同时写多个html文件，逗号隔开。
reportName，这个参数写的字符串会在Jenkins构建Job页面显示的菜单名称，后面会看到这个名称，这个名称可以随意修改　
```

**参考：[https://www.jb51.net/article/240961.htm](https://www.jb51.net/article/240961.htm)　　**

### 五、用户交互-input

```java
def result = input message: '选择xxxxx '，
	ok: '提交'，
	parameters: [extendedChoice(description: 'xxxxx',
				    descriptionPropertyValue: '',
				    multiSelectDelimiter: ',',
				    name: 'failePositiveCases',
				    quoteValue: false,
				    saveJSONParameterToFile: false,
				    type: 'PT_CHECKBOX',
				    value: "1,2,3",
				    visibleItemCount: 99)]
println (result)
```

****

### 六、获取构建用户-BuildUser

**安装 [build user vars](https://plugins.jenkins.io/build-user-vars-plugin)[Version](https://plugins.jenkins.io/build-user-vars-plugin)插件**

```java
wrap([$class: 'BuildUser']){        
　　　　　echo "full name is $BUILD_USER"
        echo "user id is $BUILD_USER_ID"
        echo "user email is $BUILD_USER_EMAIL"
}　
```

### 七、发送HTTP请求=httpRequest

**需要安装插件**

****

```java
ApiUrl = "http://xxxxxx/api/project_branches/list?project=$ {projectName}"
Result = httpRequest authentication: 'xxxxxxxxx ',
	     quiet: true,
	     contentType: 'APPLICATION_JSON',
	     url: "${ApiUrl}"　　
```

**有语法帮助**

****

### 八、邮件通知-email

```java
emailext body: """
<! DOCTYPE html><html>
<head>
<meta charset="UTF-8"></head>
<body leftmargin="8" marginwidth="O" topmargin="8" marginheight="4" offset="O">
	<table width="95%" cellpadding="o" cellspacing="" style="font-size: 11pt; font-family: Tahom
		<tr>
			<td><br />
			<b><font color="#0B610B"">构建信息</font></b></td>
		</tr>
		<tr>
			<td>
				<ul>
					<li>项目名称:$J0B_NAME}</li><li>构建编号:${BUILD_ID</li><li>构建状态:$istatus} </li>
					<li>项目地址:<a href="${BUILD_URL]">${BUILD_URL]</ a></li>
					<li>构建日志:<a href="${BUILD_uRL}console">${BUILD_uRL}console</a></li>
				</ul>
			</td>
		</tr>
		<tr>
	</table>
</body>
/html>"…",
subject: "Jenkins-$iJOB_NAME}项目构建信息",
to: emailUser　
```

### 九、清理空间

****
