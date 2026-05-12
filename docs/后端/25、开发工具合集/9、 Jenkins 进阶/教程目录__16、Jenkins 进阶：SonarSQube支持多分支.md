# 16、Jenkins 进阶：SonarSQube支持多分支
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/16.html
- 分类：开发工具
- 分组：教程目录
**由于sonarqube开源版本不支持多分支管理，在扫描所有分支的时候都会指定同一个sonar项目，不便于我们查看**

### 一、下载开源插件

项目地址：https://github.com/mc1arke/sonarqube-community-branch-plugin

下载地址：https://github.com/mc1arke/sonarqube-community-branch-plugin/releases

```java
wget https://github.com/mc1arke/sonarqube-community-branch-plugin/releases/download/1.14.0/sonarqube-community-branch-plugin-1.14.0.jar
```

### 二、拷贝jar包到插件目录

```java
mv  sonarqube-community-branch-plugin-1.14.0.jar /usr/local/sonarqube/extensions/plugins/ /usr/local/sonarqube为sonarqube的安装目录，根据实际情况修改
```

### 三、修改sonarqube配置文件

```java
egrep 'sonar.ce.javaAdditionalOpts|sonar.web.javaAdditionalOpts' sonar.properties以下两项配置其他不变，修改1.14.0为你下载的版本
sonar.web.javaAdditionalOpts=-javaagent:./extensions/plugins/sonarqube-community-branch-plugin-1.14.0.jar=web
sonar.ce.javaAdditionalOpts=-javaagent:./extensions/plugins/sonarqube-community-branch-plugin-1.14.0.jar=ce
```

### 四、重启

```java
su - sonar
cd /usr/local/sonarqube/bin/linux-x86-64
./sonar.sh stop
./sonar.sh start
```

### 五、修改sonar扫描参数

**可能会出现变量无法被修改，需要强制赋值一下**

### 六、验证
