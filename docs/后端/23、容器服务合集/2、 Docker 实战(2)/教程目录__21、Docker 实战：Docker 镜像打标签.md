# 21、Docker 实战：Docker 镜像打标签
- 来源：https://ddkk.com/zhuanlan/container/docker/2/21.html
- 分类：容器服务
- 分组：教程目录
前面一章节中，我们使用 docker build 创建了一个 souyunku/flask_365_102 的镜像

但是，我们创建的镜像的标签都是 latest

```sh
REPOSITORY         TAG    IMAGE ID     CREATED        SIZE
souyunku/flask_365_102 latest 083eecd092af 27 seconds ago 922MB
```

如果我们可以将标签设置为 365_102 那该多好

## 设置镜像标签

我们可以使用 docker tag 命令，为镜像添加一个新的标签

```sh
[root@ddkk.com flask_365_102]# docker tag 083eecd092af souyunku/my-flask:365-102
```

参数
说明

083eecd092af
镜像 ID

souyunku
用户名称

my-flask:365-102
镜像源名(repository name)和新的标签名

使用docker images 命令可以看到，ID 为 083eecd092af 的镜像多一个标签

```sh
[root@ddkk.com flask_365_102]# docker images
REPOSITORY           TAG                 IMAGE ID            CREATED             SIZE
souyunku/my-flask        365-102             083eecd092af        13 minutes ago      922MB
souyunku/flask_365_102   latest              083eecd092af        13 minutes ago      922MB
souyunku/py365flask102   latest              aaf108c1dbdc        4 hours ago         922MB
python               3.6.5               29d2f3226daf        3 weeks ago         912MB
nginx                latest              ae513a47849c        4 weeks ago         109MB
ubuntu               latest              452a96d81c30        4 weeks ago         79.6MB
ubuntu               17.10               e4422b8da209        4 weeks ago         99.2MB
hello-world          latest              e38bc07ac18e        7 weeks ago         1.85kB
jcdemo/flaskapp      latest              084bae02af1b        4 months ago        98.9MB
ubuntu               17.04               fe1cc5b91830        5 months ago        95.6MB
ubuntu               16.10               7d3f705d307c        10 months ago       107MB
```
