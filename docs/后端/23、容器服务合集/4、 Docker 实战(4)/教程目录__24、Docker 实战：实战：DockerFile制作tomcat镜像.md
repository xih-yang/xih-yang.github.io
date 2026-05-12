# 24、Docker 实战：实战：DockerFile制作tomcat镜像
- 来源：https://ddkk.com/zhuanlan/container/docker/4/24.html
- 分类：容器服务
- 分组：教程目录
### 实战：DockerFile制作tomcat镜像

**step-1 准备镜像文件 tomcat压缩包，jdk压缩包！**

**step-2 编写dockerfile文件，官方命名Dockerfile，build会自动寻找这个文件，就不需要-f指定了**

```java
[root@ddkk.com tomcat]# vim Dockerfile 
FROM centos
MAINTAINER gelaotou<893450389@qq.com>
COPY readme.text /usr/local/readme.txt
ADD apache-tomcat-9.0.22.tar.gz /usr/local/
ADD jdk-8u301-linux-x64.tar.gz /usr/local/
RUN yum -y install vim
ENV MYPATH /usr/local
WORKDIR $MYPATH
ENV JAVA_HOME /usr/local/jdk1.8.0_301
ENV CLASSPATH $JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
ENV CATALINA_HOME /usr/local/apache-tomcat-9.0.22
ENV CATALINA_BASH /usr/local/apache-tomcat-9.0.22
ENV PATH $PATH:$JAVA_HOME/bin:$CATALINA_HOME/lib:$CATALINA_HOME/bin
EXPOSE 8080
CMD /usr/local/apache-tomcat-9.0.22/bin/startup.sh && tail -F /usr/local/apache-tomcat-9.0.22/bin/logs/catalina.out 
```

**step-3 构建镜像**

```java
[root@ddkk.com tomcat]# docker build -t diytomcat .
```

**step-4 启动镜像**

```java
[root@ddkk.com tomcat]# docker run -d -p 9090:8080 --name gelaotoutomcat -v /home/gelaotou/build/tomcat/test:/usr/local/apache-tomcat-9.0.22/webapps/test -v /home/gelaotou/build/tomcat/tomcatlogs:/usr/local/apache-tomcat-9.0.22/logs diytomcat
```

**step-5 访问镜像**

[root@ddkk.com tomcat]# curl localhost:9090

**step-6 发布项目（由于做了卷挂载，我们直接在本地编写项目就可以发布）**
