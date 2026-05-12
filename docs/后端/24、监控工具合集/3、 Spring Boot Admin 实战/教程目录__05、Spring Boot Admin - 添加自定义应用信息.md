# 05、Spring Boot Admin - 添加自定义应用信息
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/5.html
- 分类：监控工具
- 分组：教程目录
## 前言

在使用Spring Boot Admin时，有一栏信息展示列表，可以自定义当前服务信息。

## 思路

该信息是由spring-boot-starter-actuator提供，通过访问**actuator/info**端点访问获取，而这些信息又是从编译文件META-INF/build-info.properties、git.properties或者其他途经中获取。

现在我需要查看服务中文名、构建时间、版本等信息，只需要构建一个build-info.properties文件即可完成。

## 步骤

**1、** 添加帮助插件用于生成构建时间，因为pom提供的时区无法修改，添加build-info用于生成build-info.properties文件，[帮助插件官方文档地址](http://www.mojohaus.org/build-helper-maven-plugin/usage.html)；

```xml
<properties>
    <maven.build.timestamp.format>yyyy-MM-dd HH:mm</maven.build.timestamp.format>
</properties>
<build>
    <plugins>
        <!--时间构建插件-->
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>build-helper-maven-plugin</artifactId>
            <version>3.2.0</version>
            <executions>
                <execution>
                    <id>local-timestamp-property</id>
                    <phase>validate</phase>
                    <goals>
                        <goal>timestamp-property</goal>
                    </goals>
                    <configuration>
                        <name>local.build.timestamp</name>
                        <pattern>${maven.build.timestamp.format}</pattern>
                        <timeZone>Asia/Shanghai</timeZone>
                        <timeSource>build</timeSource>
                    </configuration>
                </execution>
            </executions>
        </plugin>
        <!-- -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <executions>
                <!--添加构建信息-->
                <execution>
                    <goals>
                        <goal>build-info</goal>
                    </goals>
                    <configuration>
                        <!--自定义/actuator/info信息-->
                        <additionalProperties>
                            <name>后台监控服务</name>
                            <encoding.source>UTF-8</encoding.source>
                            <encoding.reporting>UTF-8</encoding.reporting>
                            <java.source>${maven.compiler.source}</java.source>
                            <java.target>${maven.compiler.target}</java.target>
                            <time>构建时间:${local.build.timestamp}</time>
                        </additionalProperties>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

**1、** package项目，查看build-info.properties文件：

**2、** 启动项目，访问首页，配置生效；
