# 10、Kubernetes 实战 - 使用开源项目io.fabric8之docker-maven-plugin插件打包Docker镜像至私服
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/10.html
- 分类：容器服务
- 分组：教程目录
## 前言

随着容器化部署方式的流行，各IT公司大部分已经完成了云原生架构实现，如何将项目工程打包成镜像并运行？国外已有众多基于Maven插件实现的打包方案，本文已实测并实现了几种常见的打包方式，比如谷歌公司的jib、spotify等插件，实际使用中，总出现与实际项目不太契合等各种问题，继续搜索实测后，发现了一个开源 打包插件，功能强大且使用简单，但国内相关资料甚少，所以鄙人记录之，望能帮助到需要的小伙伴~

## 插件介绍

基网地址：https://github.com/fabric8io/docker-maven-plugin

官方文档地址：https://dmp.fabric8.io/

**插件特征:**

支持多种配置打包镜像的方法，例如Dockerfile文件或自定义语法

支持远程Docker守护程序，无需本地安装docker环境

## 实现案例

**1、** 准备一个基于springboot的demo；

**2、** 编写Dockerfile文件，放在工程根目录下；

```sh
# 基础镜像
FROM  192.168.58.173/library/openjdk:8-jdk-alpine
# 作者信息
MAINTAINER td
# 创建工作目录
RUN mkdir -p /deploy/app
# 切换工作目录
WORKDIR /deploy/app
# 容器开放端口
EXPOSE 8080
# 添加jar包
ADD ./target/demo-kubenetes-2.3.0.jar ./demo-kubenetes-2.3.0.jar
# 容器启动执行命令
ENTRYPOINT ["java", "-jar", "demo-kubenetes-2.3.0.jar"]
```

**1、** Maven引入插件并配置相关信息；

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <configuration>
                <skipTests>true</skipTests>
            </configuration>
        </plugin>
        <plugin>
            <groupId>io.fabric8</groupId>
            <artifactId>docker-maven-plugin</artifactId>
            <version>0.33.0</version>
            <!--全局配置-->
            <configuration>
                <!--配置远程docker守护进程url-->
                <dockerHost>http://192.168.58.173:2375</dockerHost>
                <!--认证配置,用于私有registry认证-->
                <authConfig>
                    <username>admin</username>
                    <password>Harbor12345</password>
                </authConfig>
                <!--镜像相关配置,支持多镜像-->
                <images>
                    <!-- 单个镜像配置 -->
                    <image>
                        <!--镜像名(含版本号)-->
                        <name>library/${project.name}:${project.version}</name>
                        <!--registry地址,用于推送,拉取镜像-->
                        <registry>192.168.58.173</registry>
                        <!--镜像build相关配置-->
                        <build>
                            <!--使用dockerFile文件-->
                            <dockerFile>${project.basedir}/Dockerfile</dockerFile>
                        </build>
                    </image>
                </images>
            </configuration>
        </plugin>
    </plugins>
</build>
```

**1、** 打包并推送镜像；

**命令**： mvn clean package docker:build & mvn docker:push

**2、** 运行镜像；

**运行命令**：

```sh
docker run -it --name my-demo -p 8888:8080 192.168.58.173/library/demo-kubenetes:2.3.0 
```
