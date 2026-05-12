# 08、Kubernetes 实战 - Spring Boot使用jib打包Docker镜像至私服
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/8.html
- 分类：容器服务
- 分组：教程目录
## 准备工作

**1、** 一个springboot项目，并提供一个可访问接口；

**2、** 安装镜像私服Harbor；

**3、**[jib插件开源地址](https://github.com/GoogleContainerTools/jib)；

## 集成步骤

**1、** 推送JDK8基础镜像至私服；

```sh
# 拉取镜像
docker pull openjdk:8-jdk-alpine
# 私服标签
docker tag openjdk:8-jdk-alpine  192.168.58.173/library/openjdk:8-jdk-alpine
# 推送至私服
docker push 192.168.58.173/library/openjdk:8-jdk-alpine
```

**2、** pom文件添加jib插件；

```xml
<build>
        <plugin>
            <groupId>com.google.cloud.tools</groupId>
            <artifactId>jib-maven-plugin</artifactId>
            <version>2.3.0</version>
            <configuration>
                <!--基础镜像，来自dockerhub,如果是私服，需要加上鉴权信息，和to下的auth节点相同-->
                <from>
                    <image>192.168.58.173/library/openjdk:8-jdk-alpine</image>
                    <auth>
                        <username>admin</username>
                        <password>Harbor12345</password>
                    </auth>
                </from>
                <!--容器相关设置-->
                <container>
                    <!--创建时间-->
                    <creationTime>${maven.build.timestamp}</creationTime>
                    <!--放置应用程序内容的容器上的根目录-->
                    <appRoot>/deploy/service/${project.artifactId}</appRoot>
                    <!--容器在运行时公开的端口-->
                    <ports>8080</ports>
                    <!--容器中的工作目录-->
                    <workingDirectory>/deploy/service/${project.artifactId}</workingDirectory>
                </container>
                <!--构建后的镜像名称以及私服地址、鉴权信息-->
                <to>
                    <image>192.168.58.173/library/${project.name}:${project.version}</image>
                    <auth>
                        <username>admin</username>
                        <password>Harbor12345</password>
                    </auth>
                </to>
                <!--允许非https-->
                <allowInsecureRegistries>true</allowInsecureRegistries>
            </configuration>
            <!--将jib与mvn构建的生命周期绑定 mvn package自动构造镜像-->
            <!--打包及推送命令 mvn  -DsendCredentialsOverHttp=true clean package-->
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>build</goal>
                        </goals>
                    </execution>
                </executions>
        </plugin>
    </plugins>
</build>
```

**1、** 输入命令推送镜像；

```sh
# maven命令
mvn  -DsendCredentialsOverHttp=true clean package
```

**1、** 查看Harbor,推动成功；

**2、** 运行上传的镜像；

```sh
# 运行
docker run -it --name my-demo -p 8888:8080 192.168.58.173/library/demo-kubenetes:1.1.10 
```
