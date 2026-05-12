# 05、Jenkins 进阶：Maven、Ant、Gradl、Node构建工具集成
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/5.html
- 分类：开发工具
- 分组：教程目录
### 一、jienkins集成Maven

**环境要求**

```java
安装jenkins Ant  Gradle  NodeJS  Maven四个插件
```

#### 1.安装Maven

```java
下载地址：https://maven.apache.org/download.cgi
wget --no-check-certificate  https://dlcdn.apache.org/maven/maven-3/3.9.0/binaries/apache-maven-3.9.0-bin.tar.gz
tar xf apache-maven-3.9.0-bin.tar.gz -C /usr/local/
cd /usr/local/
ln -sv apache-maven-3.9.0 maven3.9
vim /etc/profile.d/maven.sh
export MAVEN_HOME=/usr/local/maven3.9
export PATH=$PATH:$MAVEN_HOME/bin
. /etc/profile.d/maven.sh
mvn -v
#打开Maven配置文件"sertting.xml"，在"<mirros></mirros>"标签内增加一个mirror子标签，并增加以下配置信息
vim /usr/local/mvn3/conf/settings.xml
    <mirror>
    　　<id>nexus-aliyun</id>
    　　<mirrorOf>central</mirrorOf>
    　　<name>Nexus aliyun</name>
    　　<url>https://maven.aliyun.com/repository/public</url>
    </mirror>
```

#### 2.jenkins配置Maven

#### 3.验证

编写jenkisnfile，保存并构建

查看输出

### 4.常见使用方式

新增构建化参数

pipline调用

```java
String buildshell = "${env.buildshell}"
node {
stage ("build"){
    mavenHome = tool 'M3'
    sh "${mavenHome}/bin/mvn ${buildshell}"
}
}
```

根据选择执行对应的打包命令

### 二、jenkins集成Ant

#### 1.安装Ant

```java
下载地址：https://ant.apache.org/bindownload.cgi
wget --no-check-certificate https://dlcdn.apache.org//ant/binaries/apache-ant-1.9.16-bin.tar.gz
tar xf apache-ant-1.9.16-bin.tar.gz -C /usr/local/
cd /usr/local/
ln -sv apache-ant-1.9.16 ant1.9
vim /etc/profile.d/ant.sh
export ANT_HOME=/usr/local/ant1.9
export PATH=$PATH:$MAVEN_HOME/bin:$ANT_HOME/bin
. /etc/profile.d/ant.sh
ant -version
```

#### 2.jenkins配置Ant

系统管理->全局工具配置

#### 3.验证

```java
node {
stage ("build"){
    antHome = tool 'ANT'
    sh "${antHome}/bin/ant -version"
}
}
```

### 三、jenkins集成Gradle

#### 1.安装Gradle

```java
下载地址：https://gradle.org/releases/  
wget https://downloads.gradle.org/distributions/gradle-6.9.3-bin.zip
unzip gradle-6.9.3-bin.zip -d /usr/local/
cd /usr/local
ln -sv gradle-6.9.3 gradle6.9
vim /etc/profile.d/gradle.sh
export GRADLE_HOME=/usr/local/gradle6.9
export PATH=$PATH:$GRADLE_HOME/bin
. /etc/profile.d/gradle.sh
gradle -v
```

#### 2.jenkins配置Gradle

#### 3.验证

编写jenkinsfile

```java
node {
stage ("gradlebuild"){
    gradleHome = tool 'GRADLE'
    sh "${gradleHome}/bin/gradle -v"
}
}
```

### 四、jenkins集成Npm

#### 1.安装npm

```java
下载地址：https://nodejs.org/download/release/
#wget https://nodejs.org/download/release/v16.9.1/node-v16.9.1-linux-x64.tar.gz
wget --no-check-certificate https://npm.taobao.org/mirrors/node/v16.9.1/node-v16.9.1-linux-x64.tar.gz
tar xf node-v16.9.1-linux-x64.tar.gz -C /usr/local/
cd /usr/local/
ln -sv node-v16.9.1-linux-x64 node16
vim ~/.bash_profile
export PATH=/usr/local/node16/bin/:$PATH
 . ~/.bash_profile
node -v
npm install npm@7.21.1 -g需要安装和node对应版本的npm，对应关系参考：https://nodejs.org/zh-cn/download/releases/
npm -v
npm config set registry https://registry.npm.taobao.org
npm config list
ln -s /usr/local/node16/bin/node /usr/bin/node   jenkins去调用node的时后，默认node位置在/usr/bin/node
```

#### 2.jenkins配置npm

#### 3.jenkinsfile调用

```java
node {
stage ("npmbuild"){
       npmHome = tool 'NPM'
       sh "${npmHome}/bin/npm -v"
}    
}
```
