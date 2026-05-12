# 75、Docker 实战：Docker常见仓库Node.js
- 来源：https://ddkk.com/zhuanlan/container/docker/1/75.html
- 分类：容器服务
- 分组：教程目录
## Node.js

### 基本信息

[Node.js](https://en.wikipedia.org/wiki/Node.js)是基于 JavaScript 的可扩展服务端和网络软件开发平台。 该仓库提供了 Node.js 0.8 ~ 0.11 各个版本的镜像。

### 使用方法

在项目中创建一个 Dockerfile。

```sh
FROM node:0.10-onbuild
# replace this with your application's default port
EXPOSE 8888
```

然后创建镜像，并启动容器

```sh
$ sudo docker build -t my-nodejs-app
$ sudo docker run -it --rm --name my-running-app my-nodejs-app
```

也可以直接运行一个简单容器。

```sh
$ sudo docker run -it --rm --name my-running-script -v "$(pwd)":/usr/src/myapp -w /usr/src/myapp node:0.10 node your-daemon-or-script.js
```

### Dockerfile

- [0.8 版本][0.8]
- [0.10 版本][0.10]
- [0.11 版本][0.11]
