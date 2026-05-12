# 01、Jenkins 进阶：流水线基础语法
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/1.html
- 分类：开发工具
- 分组：教程目录
## 一、Pipeline概念

### 1 node/agent(节点)

节点是一个机器，可以是Jenkins的master节点也可以是slave节点。通过node指定当前job运行的机器（这个是脚本式语法）。

```java
参数:
. any 在任何可用的节点上执行pipeline。
. none 没有指定agent的时候默认。
. label 在指定标签上的节点上运行Pipeline。
```

node允许额外都选项

```java
这两种是—样的
agent { node { label 'labelname' }}
agent { label  'labelname '}
```

### 2 stage(阶段)

stage定义了在整个流水线的执行任务的概念性的不同的阶段。例如： GetCode、Build、Test、Deploy、CodeScan每个阶段。

```java
声明式pipeline： 定义stages->stage。
pipeline{
agent any
stages{
    stage("GetCode"){
        //steps  
    }
    stage("build"){
       //step
    }  
}
}
脚本式Pipeline: 直接使用stage。
node("slave"){
stage("GetCode"){
    //
}  
stage("build"){
    //
}
}
```

### 3 step(步骤)

step是每个阶段中要执行的每个步骤。例如： 在执行GetCode的时候需要判断用户提供的参数srcType的值是Git还是svn。

```java
pipeline{
agent any
stages{
    stage("GetCode"){
        steps{ 
            sh "ls "    //step
        }        
    }    
}
}
脚本式Pipeline： 不需要step关键字。
node("slave"){
stage("GetCode"){
    //step
    if("${srcType}" == "Git"){
        //用git方式代码检出
    } else if ("${srcType}" == "SVN"){
        //用svn方式代码检出
    } else {
        error "srcType is not in [Git|SVN]"
    }
}
}
```

### 4.post

`post` 部分定义一个或多个[steps](https://www.jenkins.io/zh/doc/book/pipeline/syntax/#declarative-steps) ，这些阶段根据流水线或阶段的完成情况而 运行(取决于流水线中 `post` 部分的位置). `post` 支持以下 [post-condition](https://www.jenkins.io/zh/doc/book/pipeline/syntax/#post-conditions) 块中的其中之一: `always`, `changed`, `failure`, `success`, `unstable`, 和 `aborted`。这些条件块允许在 `post` 部分的步骤的执行取决于流水线或阶段的完成状态。

```java
Conditions
always
无论构建结果如何都会去执行
changed
流水线或阶段的完成状态与它之前的运行不同时执行
failure
流水线失败后执行
success
流水线成功后执行
unstable
流水线构建不稳定时执行, 通常由于测试失败,代码违规等造成。
aborted
流水线取消后执行
```

示例：

```java
pipeline {
    agent any
    stages {
        stage('Example') {
            steps {
                echo 'Hello World'
            }
        }
    }
    post { 
        always { 
            echo 'I will always say Hello again!'
        }
    }
}
```

### 5.指令

**5、** 1environment环境变量；

定义流水线环境变量，可以定义在全局变量或者步骤中的局部变量。这取决于 environment 指令在流水线内的位置。

该指令支持一个特殊的助手方法 `credentials()` ，该方法可用于在Jenkins环境中通过标识符访问预定义的凭证。对于类型为 "Secret Text"的凭证, `credentials()` 将确保指定的环境变量包含秘密文本内容。对于类型为 "SStandard username and password"的凭证, 指定的环境变量指定为 `username:password` ，并且两个额外的环境变量将被自动定义 :分别为 `MYVARNAME_USR` 和 `MYVARNAME_PSW`

示例

```java
agent any
//全局变量
environment { 
    activeEnv = 'dev'
}
stages {
    stage('Example') {
        //局部变量
        environment { 
            AN_ACCESS_KEY = credentials('my-prefined-secret-text') 
        }
        steps {
            sh 'printenv'
        }
    }
}
```

**5、** 2options运行选项；

`options` 指令允许从流水线内部配置特定于流水线的选项。 流水线提供了许多这样的选项, 比如 `buildDiscarder`,但也可以由插件提供, 比如 `timestamps`.

##### 可用选项

```java
buildDiscarder
为最近的流水线运行的特定数量保存组件和控制台输出。例如: options { buildDiscarder(logRotator(numToKeepStr: '1')) }
disableConcurrentBuilds
不允许同时执行流水线。 可被用来防止同时访问共享资源等。 例如: options { disableConcurrentBuilds() }
overrideIndexTriggers
允许覆盖分支索引触发器的默认处理。 如果分支索引触发器在多分支或组织标签中禁用, options { overrideIndexTriggers(true) } 将只允许它们用于促工作。否则, options { overrideIndexTriggers(false) } 只会禁用改作业的分支索引触发器。
skipDefaultCheckout
在agent 指令中，跳过从源代码控制中检出代码的默认情况。例如: options { skipDefaultCheckout() }
skipStagesAfterUnstable
一旦构建状态变得UNSTABLE，跳过该阶段。例如: options { skipStagesAfterUnstable() }
checkoutToSubdirectory
在工作空间的子目录中自动地执行源代码控制检出。例如: options { checkoutToSubdirectory('foo') }
timeout
设置流水线运行的超时时间, 在此之后，Jenkins将中止流水线。例如: options { timeout(time: 1, unit: 'HOURS') }
retry
在失败时, 重新尝试整个流水线的指定次数。 For example: options { retry(3) }
timestamps
预谋所有由流水线生成的控制台输出，与该流水线发出的时间一致。 例如: options { timestamps() }　
```

示例

```java
pipeline {
    agent any
    options {
        timeout(time: 1, unit: 'HOURS') 
    }
    stages {
        stage('Example') {
            steps {
                echo 'Hello World'
            }
        }
    }
}
```

#### 5.3 parameters参数

`parameters` 指令提供了一个用户在触发流水线时应该提供的参数列表。这些用户指定参数的值可通过 `params` 对象提供给流水线步骤

##### 可用options

```java
string
字符串类型的参数，例如：parameters { string(name: 'DEPLOY_ENV', defaultValue: 'staging', description: '') }
text
一个文本参数，可以包含多行，例如：parameters { text(name: 'DEPLOY_TEXT', defaultValue: 'One\nTwo\nThree\n', description: '') }
booleanParam
布尔参数，例如：parameters { booleanParam(name: 'DEBUG_BUILD', defaultValue: true, description: '') }
choice
一个选择参数，例如：parameters { choice(name: 'CHOICES', choices: ['one', 'two', 'three'], description: '') }
password
密码参数，例如：parameters { password(name: 'PASSWORD', defaultValue: 'SECRET', description: 'A secret password') }
```

示例

```java
pipeline {
    agent any
    parameters {
        string(name: 'PERSON', defaultValue: 'Mr Jenkins', description: 'Who should I say hello to?')
        text(name: 'BIOGRAPHY', defaultValue: '', description: 'Enter some information about the person')
        booleanParam(name: 'TOGGLE', defaultValue: true, description: 'Toggle this value')
        choice(name: 'CHOICE', choices: ['One', 'Two', 'Three'], description: 'Pick something')
        password(name: 'PASSWORD', defaultValue: 'SECRET', description: 'Enter a password')
    }
    stages {
        stage('Example') {
            steps {
                echo "Hello ${params.PERSON}"
                echo "Biography: ${params.BIOGRAPHY}"
                echo "Toggle: ${params.TOGGLE}"
                echo "Choice: ${params.CHOICE}"
                echo "Password: ${params.PASSWORD}"
            }
        }
    }
}
```

#### 5.4 triggers触发器

`triggers` 指令定义了流水线被重新触发的自动化方法。对于集成了源（ 比如 GitHub 或 BitBucket）的流水线, 可能不需要 `triggers` ，因为基于 web 的集成很肯能已经存在。 当前可用的触发器是 `cron`, `pollSCM` 和 `upstream`。

```java
cron
接收 cron 样式的字符串来定义要重新触发流水线的常规间隔 ,比如: triggers { cron('H */4 * * 1-5') }
pollSCM
接收 cron 样式的字符串来定义一个固定的间隔，在这个间隔中，Jenkins 会检查新的源代码更新。如果存在更改, 流水线就会被重新触发。例如: triggers { pollSCM('H */4 * * 1-5') }
upstream
接受逗号分隔的工作字符串和阈值。 当字符串中的任何作业以最小阈值结束时，流水线被重新触发。例如: triggers { upstream(upstreamProjects: 'job1,job2', threshold: hudson.model.Result.SUCCESS) }
```

示例

```java
pipeline {
    agent any
    triggers {
        cron('H */4 * * 1-5')
    }
    stages {
        stage('Example') {
            steps {
                echo 'Hello World'
            }
        }
    }
}
```

#### 5.5 tools构建工具

构建工具maven、ant、gradle,获取通过自动安装或手动放置工具的环境变量。工具的名称必须在系统设置->全局工具配置中定义。

##### 支持工具

```java
maven
jdk
gradle
```

##### 示例

```java
pipeline {
    agent any
    tools {
        maven 'apache-maven-3.0.1' 
    }
    stages {
        stage('Example') {
            steps {
                sh 'mvn --version'
            }
        }
    }
}
```

#### 5.6 input交互输入

input用户在执行各个阶段的时候，由人工确认是否继续进行。

```java
message呈现给用户的提示信息。
id可选,默认为stage名称。
ok默认表单上的ok文本。
submitter可选的,以逗号分隔的用户列表或允许提交的外部组名。默认允许任何用户submitterParameter环境变量的可选名称。如果存在,用submitter名称设置。
parameters提示提交者提供的一个可选的参数列表。　
```

示例

```java
agent any
stages {
    stage('Example') {
        input {
            message "Should we continue?"
            ok "Yes, we should."
            submitter "alice,bob"
            parameters {
                string(name: 'PERSON', defaultValue: 'Mr Jenkins', description: 'Who should I say hello to?')
            }
        }
        steps {
            echo "Hello, ${PERSON}, nice to meet you."
        }
    }
}　
```

参数解释

```java
* message 呈现给用户的提示信息。
* id 可选，默认为stage名称。
* ok 默认表单上的ok文本。
* submitter 可选的,以逗号分隔的用户列表或允许提交的外部组名。默认允许任何用户。
* submitterParameter 环境变量的可选名称。如果存在，用submitter 名称设置。
* parameters 提示提交者提供的一个可选的参数列表。
```

#### 5.7　when

when 指令允许流水线根据给定的条件决定是否应该执行阶段。 when 指令必须包含至少一个条件。 如果 `when` 指令包含多个条件, 所有的子条件必须返回True，阶段才能执行。

##### 内置条件

```java
branch
当正在构建的分支与模式给定的分支匹配时，执行这个阶段, 例如: when { branch 'master' }。注意，这只适用于多分支流水线。
environment
当指定的环境变量是给定的值时，执行这个步骤, 例如: when { environment name: 'DEPLOY_TO', value: 'production' }
expression
当指定的Groovy表达式评估为true时，执行这个阶段, 例如: when { expression { return params.DEBUG_BUILD } }
not
当嵌套条件是错误时，执行这个阶段,必须包含一个条件，例如: when { not { branch 'master' } }
allOf
当所有的嵌套条件都正确时，执行这个阶段,必须包含至少一个条件，例如: when { allOf { branch 'master'; environment name: 'DEPLOY_TO', value: 'production' } }
anyOf
当至少有一个嵌套条件为真时，执行这个阶段,必须包含至少一个条件，例如: when { anyOf { branch 'master'; branch 'staging' } }
在进入 stage 的 agent 前评估 when
默认情况下, 如果定义了某个阶段的代理，在进入该stage 的 agent 后该 stage 的 when 条件将会被评估。但是, 可以通过在 when 块中指定 beforeAgent 选项来更改此选项。 如果 beforeAgent 被设置为 true, 那么就会首先对 when 条件进行评估 , 并且只有在 when 条件验证为真时才会进入 agent 。示　
```

示例1

```java
pipeline {
    agent any
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                branch 'production'
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}
```

示例2

```java
pipeline {
    agent any
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                branch 'production'
                environment name: 'DEPLOY_TO', value: 'production'
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}　
```

示例3

```java
pipeline {
    agent any
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                allOf {
                    branch 'production'
                    environment name: 'DEPLOY_TO', value: 'production'
                }
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}
```

示例4

```java
pipeline {
    agent any
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                branch 'production'
                anyOf {
                    environment name: 'DEPLOY_TO', value: 'production'
                    environment name: 'DEPLOY_TO', value: 'staging'
                }
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}
```

示例5

```java
pipeline {
    agent any
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                expression { BRANCH_NAME ==~ /(production|staging)/ }
                anyOf {
                    environment name: 'DEPLOY_TO', value: 'production'
                    environment name: 'DEPLOY_TO', value: 'staging'
                }
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}
```

示例6

```java
pipeline {
    agent none
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            agent {
                label "some-label"
            }
            when {
                beforeAgent true
                branch 'production'
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}
```

#### 5.8 parallel并行

声明式流水线的阶段可以在他们内部声明多隔嵌套阶段, 它们将并行执行。 注意，一个阶段必须只有一个 steps 或 parallel的阶段。 嵌套阶段本身不能包含 进一步的 parallel 阶段, 但是其他的阶段的行为与任何其他 stageparallel 的阶段不能包含 agent 或 tools阶段, 因为他们没有相关 steps。

另外,通过添加 `failFast true` 到包含 `parallel`的 `stage` 中， 当其中一个进程失败时，你可以强制所有的 `parallel` 阶段都被终止

示例

```java
pipeline {
    agent any
    stages {
        stage('Non-Parallel Stage') {
            steps {
                echo 'This stage will be executed first.'
            }
        }
        stage('Parallel Stage') {
            when {
                branch 'master'
            }
            failFast true
            parallel {
                stage('Branch A') {
                    agent {
                        label "for-branch-a"
                    }
                    steps {
                        echo "On Branch A"
                    }
                }
                stage('Branch B') {
                    agent {
                        label "for-branch-b"
                    }
                    steps {
                        echo "On Branch B"
                    }
                }
            }
        }
    }
}
```

#### 5.9 script

`script` 步骤需要 [[scripted-pipeline]](https://www.jenkins.io/zh/doc/book/pipeline/syntax/#scripted-pipeline)块并在声明式流水线中执行。 对于大多数用例来说,应该声明式流水线中的“脚本”步骤是不必要的， 但是它可以提供一个有用的"逃生出口"。 复杂性的 `script` 块应该被转移到 [共享库](https://www.jenkins.io/zh/doc/book/pipeline/syntax/#shared-libraries#) 。

示例

```java
pipeline {
    agent any
    stages {
        stage('Example') {
            steps {
                echo 'Hello World'
                script {
                    def browsers = ['chrome', 'firefox']
                    for (int i = 0; i < browsers.size(); ++i) {
                        echo "Testing the ${browsers[i]} browser"
                    }
                }
            }
        }
    }
}　
```

参考：[https://www.jenkins.io/doc/book/pipeline/syntax/](https://www.jenkins.io/doc/book/pipeline/syntax/)
