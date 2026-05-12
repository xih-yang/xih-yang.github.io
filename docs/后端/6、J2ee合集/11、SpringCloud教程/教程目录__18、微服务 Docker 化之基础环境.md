# 18、微服务 Docker 化之基础环境
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/18.html
- 分类：J2EE框架
- 分组：教程目录
## 1. 容器化

Docker 的横空出世，给了容器技术带来了质的飞跃，Docker 标准化了服务的基础设施，统一了应用的打包分发，部署以及操作系统相关类库等，解决了测试生产部署时环境差异的问题。对于运维来讲，由于镜像的不可变性，更容易进行服务部署和回滚操作。利用各种第三方容器管理平台，实现一键部署、动态伸缩等操作变的轻而易举。

## 2. 基础镜像选择

在操作系统的选择上，可选择传统的 CentOS 、 Ubuntu 或者更为轻量化的 Alpine 。比如 CentOS 或者 Ubuntu 的镜像都在 100MB 以上，压缩后也都有大几十 MB ，而轻量化的 Alpine 3.10 版本镜像大小约为 5.58MB ，而它压缩后更是仅有 2MB 大小左右。

Alpine 操作系统是一个面向安全的轻型 Linux 发行版。它不同于通常 Linux 发行版，Alpine 采用了 musl libc 和 busybox 以减小系统的体积和运行时资源消耗，但功能上比 busybox 又完善的多，因此得到开源社区越来越多的青睐。在保持瘦身的同时，Alpine 还提供了自己的包管理工具 apk 。

关于基础镜像的选择，一个是考虑镜像的大小，另一个是只提供最小的依赖包。关于第二点，不同的服务所需要的依赖包是不同的，这里不再展开讨论，如果仅从第一点考虑的话， Alpine 肯定是首选，镜像越小，远程推拉越快，消耗的资源也越小，更为的方便，我们这里采用 Alpine 作为基础镜像。

## 3. Dockerfile 编写

选择Alpine 有一个比较麻烦的地方是 Alpine 采用的是 musl libc 的 C 的标准库，而 Oracle 或者 OpenJDK 提供的版本主要是已 glibc 为主。所以我们考虑为 Alpine 加上 glibc ，然后添加 glibc 的 JDK 编译版本作为基础镜像。

### 3.1 Alpine + glibc

这里选择的版本是目前最新版 Alpine 3.10 版本，glibc 采用的是 Sgerrand 开源的 glibc 安装包（[https://github.com/sgerrand/alpine-pkg-glibc/](https://github.com/sgerrand/alpine-pkg-glibc/) ），版本为 2.30-r0 。具体代码如下：

代码清单：chapter17/dockerfiles/alpine-glibc/Dockerfile

```java
FROM alpine:3.10
MAINTAINER inwsy@hotmail.com
RUN apk add --no-cache ca-certificates curl openssl binutils xz tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && GLIBC_VER="2.30-r0" \
    && ALPINE_GLIBC_REPO="https://github.com/sgerrand/alpine-pkg-glibc/releases/download" \
    && curl -Ls ${ALPINE_GLIBC_REPO}/${GLIBC_VER}/glibc-${GLIBC_VER}.apk > /opt/${GLIBC_VER}.apk \
    && apk add --allow-untrusted /opt/${GLIBC_VER}.apk \
    && curl -Ls https://www.archlinux.org/packages/core/x86_64/gcc-libs/download > /opt/gcc-libs.tar.xz \
    && mkdir /opt/gcc \
    && tar -xf /opt/gcc-libs.tar.xz -C /opt/gcc \
    && mv /opt/gcc/usr/lib/libgcc* /opt/gcc/usr/lib/libstdc++* /usr/glibc-compat/lib \
    && strip /usr/glibc-compat/lib/libgcc_s.so.* /usr/glibc-compat/lib/libstdc++.so* \
    && curl -Ls https://www.archlinux.org/packages/core/x86_64/zlib/download > /opt/libz.tar.xz \
    && mkdir /opt/libz \
    && tar -xf /opt/libz.tar.xz -C /opt/libz \
    && mv /opt/libz/usr/lib/libz.so* /usr/glibc-compat/lib \
    && apk del binutils \
    && rm -rf /opt/${GLIBC_VER}.apk /opt/gcc /opt/gcc-libs.tar.xz /opt/libz /opt/libz.tar.xz /var/cache/apk/*
```

这里有几点需要注意的：

- 由于 Docker 是分层设计，而在 Dockerfile 中，每一条指令都拥有自己的 context ，而执行到下一条指令时，则会将下一层的构建层叠加到上一层，因此在安装类库的时候最好将命令写在同一个 RUN 指令中，减少分层，降低最后镜像的大小
- RUN 命令中安装了类库或者软件包，需要在同一个命令中删除 apk 的 cache ，这样才能有效删除 apk ，减小镜像大小。
- 基础镜像的标签不要使用 latest ，当镜像没有指定标签时，将默认使用 latest 标签。当镜像更新时， latest 标签会指向不同的镜像，这时构建镜像有可能失败。如果你的确需要使用最新版的基础镜像，可以使用 latest 标签，否则的话，最好指定确定的镜像标签。
- 这里笔者已经创建好了一个版本，上传到阿里云的镜像仓库上，有需要的读者可以直接 pull 这个镜像使用。

```java
docker pull registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:glibc-2.30-r0
```

### 3.2 Alpine + glibc + JDK8

对于JDK 的版本选择，有 Oracle 的 Hotspot JDK ，也有 OpenJDK 。这里我们在构建 JDK8 的时候采用 Oracle 的 server-jre-8u221 版本。而对于 JDK9 、 JDK10 以及 JDK11 我们采用 OpenJDK 来进行构建。

Oracle 的 JDK8 的镜像构建的 Dockerfile 如下：

代码清单：chapter17/dockerfiles/java8/Dockerfile

```java
FROM registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:glibc-2.30-r0
MAINTAINER inwsy@hotmail.com
ADD server-jre-8u221-linux-x64.tar.gz /opt/
RUN chmod +x /opt/jdk1.8.0_221
ENV JAVA_HOME=/opt/jdk1.8.0_221
ENV PATH="$JAVA_HOME/bin:${PATH}"
```

同样，此镜像作者已经上传阿里云镜像仓库，可以直接使用以下命令拉取：

```java
docker pull registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:8u221-jre
```

可以进行验证，命令如下：

```java
docker run --rm -it registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:8u221-jre java -version
```

执行结果如下：

```java
java version "1.8.0_221"
Java(TM) SE Runtime Environment (build 1.8.0_221-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.221-b11, mixed mode)
```

### 3.3 Alpine + glibc + OpenJDK9

OpenJDK9 的镜像构建的 Dockerfile 如下：

代码清单：chapter17/dockerfiles/java9/Dockerfile

```java
FROM registry.cn-shanghai.aliyuncs.com/weishiyao/alpine-3.10:glibc-2.30-r0
MAINTAINER inwsy@hotmail.com
RUN echo -e "https://mirror.tuna.tsinghua.edu.cn/alpine/v3.10/main\n\
https://mirror.tuna.tsinghua.edu.cn/alpine/v3.10/community" > /etc/apk/repositories
RUN apk --update add curl bash openjdk9-jre && \
      rm -rf /var/cache/apk/*
ENV JAVA_HOME /usr/lib/jvm/default-jvm
ENV PATH ${PATH}:${JAVA_HOME}/bin
```

OpenJDK 的 jre 这里笔者使用清华大学镜像站的镜像进行安装。

同样，此镜像作者已经上传阿里云镜像仓库，可以直接使用以下命令拉取：

```java
docker pull registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:openjdk9-jre-9.0.4
```

验证命令如下：

```java
docker run --rm -it registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:openjdk9-jre-9.0.4 java -version
```

执行结果如下：

```java
openjdk version "9.0.4"
OpenJDK Runtime Environment (build 9.0.4+12-alpine-r1)
OpenJDK 64-Bit Server VM (build 9.0.4+12-alpine-r1, mixed mode)
```

### 3.4 Alpine + glibc + OpenJDK10

OpenJDK10 的镜像构建的 Dockerfile 如下：

代码清单：chapter17/dockerfiles/java10/Dockerfile

```java
FROM registry.cn-shanghai.aliyuncs.com/weishiyao/alpine-3.10:glibc-2.30-r0
RUN echo -e "https://mirror.tuna.tsinghua.edu.cn/alpine/v3.10/main\n\
https://mirror.tuna.tsinghua.edu.cn/alpine/v3.10/community" > /etc/apk/repositories
RUN apk --update add curl bash openjdk10-jre && \
      rm -rf /var/cache/apk/*
ENV JAVA_HOME /usr/lib/jvm/default-jvm
ENV PATH ${PATH}:${JAVA_HOME}/bin
```

同样，此镜像作者已经上传阿里云镜像仓库，可以直接使用以下命令拉取：

```java
docker pull registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:openjdk10-jre-10.0.2
```

验证命令如下：

```java
docker run --rm -it registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:openjdk10-jre-10.0.2 java -version
```

执行结果如下：

```java
openjdk version "10.0.2" 2018-07-17
OpenJDK Runtime Environment (build 10.0.2+13-alpine-r0)
OpenJDK 64-Bit Server VM (build 10.0.2+13-alpine-r0, mixed mode)
```

### 3.5 Alpine + glibc + OpenJDK11

OpenJDK11 的镜像构建的 Dockerfile 如下：

代码清单：chapter17/dockerfiles/java11/Dockerfile

```java
FROM registry.cn-shanghai.aliyuncs.com/weishiyao/alpine-3.10:glibc-2.30-r0
MAINTAINER inwsy@hotmail.com
RUN echo -e "https://mirror.tuna.tsinghua.edu.cn/alpine/v3.10/main\n\
https://mirror.tuna.tsinghua.edu.cn/alpine/v3.10/community" > /etc/apk/repositories
RUN apk --update add curl bash openjdk11-jre && \
      rm -rf /var/cache/apk/*
ENV JAVA_HOME /usr/lib/jvm/default-jvm
ENV PATH ${PATH}:${JAVA_HOME}/bin
```

同样，此镜像作者已经上传阿里云镜像仓库，可以直接使用以下命令拉取：

```java
docker pull registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:openjdk11-jre-11.0.2
```

验证命令如下：

```java
docker run --rm -it registry.cn-shanghai.aliyuncs.com/springcloud-book/alpine3.10:openjdk11-jre-11.0.2 java -version
```

执行结果如下：

```java
openjdk version "11.0.4" 2019-07-16
OpenJDK Runtime Environment (build 11.0.4+4-alpine-r1)
OpenJDK 64-Bit Server VM (build 11.0.4+4-alpine-r1, mixed mode)
```

## 4. 实例代码

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter17)

[示例代码-Gitee](https://gitee.com/inwsy/SpringCloudLearning/tree/master/chapter17)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
