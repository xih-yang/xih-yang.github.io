# 18、Docker 实战：Docker commit 更新镜像
- 来源：https://ddkk.com/zhuanlan/container/docker/2/18.html
- 分类：容器服务
- 分组：教程目录
有时候从远程拉取的镜像并不能百分百满足我们的需求，比如我们想使用 Python 3.6.5 运行 Flask 程序

可能，我们翻遍 Docker Hub 也找不到既装了 Python 3.6.5 又装了 Flask 的镜像

那还有其它方法吗？

有的，那就是我们从 python:3.6.5 这个官方镜像开始，装好 Flask，然后再保存为一个新的镜像

## 拉取 Python 3.6.5 官方镜像

我们先从远程拉取一个 python:3.6.5 的镜像

```sh
[root@ddkk.com ~]# docker pull python:3.6.5
3、6.5: Pulling from library/python
cc1a78bfd46b: Pull complete 
6861473222a6: Pull complete 
7e0b9c3b5ae0: Pull complete 
3ec98735f56f: Pull complete 
9b311b87a021: Pull complete 
048165938570: Pull complete 
1ca3d78efb22: Pull complete 
0f6c8999c3b7: Pull complete 
5a85410f5000: Pull complete 
Digest: sha256:b1d2ddc6ab464da30ef5b0ea415c716e3652bd9ebfdd70e7bb56925950a63e98
Status: Downloaded newer image for python:3.6.5
```

## 以交互式运行 python:3.6.5 镜像创建一个容器

先使用docker run 以交互式运行 python:3.6.5 镜像

```sh
[root@ddkk.com ]# docker run --name python_365_flask -it python:3.6.5 /bin/bash
root@455bba3c41d4:/# 
```

## 安装最新版 flask

在交互式容器里运行 pip install flask 安装 flask

```sh
root@455bba3c41d4:/# pip install flask
Collecting flask
  Downloading https://files.pythonhosted.org/packages/7f/e7/08578774ed4536d3242b14dacb4696386634607af824ea997202cd0edb4b/Flask-1.0.2-py2.py3-none-any.whl (91kB)
    100% |████████████████████████████████| 92kB 51kB/s 
Collecting itsdangerous>=0.24 (from flask)
  Downloading https://files.pythonhosted.org/packages/dc/b4/a60bcdba945c00f6d608d8975131ab3f25b22f2bcfe1dab221165194b2d4/itsdangerous-0.24.tar.gz (46kB)
    100% |████████████████████████████████| 51kB 70kB/s 
Collecting Werkzeug>=0.14 (from flask)
  Downloading https://files.pythonhosted.org/packages/20/c4/12e3e56473e52375aa29c4764e70d1b8f3efa6682bef8d0aae04fe335243/Werkzeug-0.14.1-py2.py3-none-any.whl (322kB)
    100% |████████████████████████████████| 327kB 72kB/s 
Collecting click>=5.1 (from flask)
  Downloading https://files.pythonhosted.org/packages/34/c1/8806f99713ddb993c5366c362b2f908f18269f8d792aff1abfd700775a77/click-6.7-py2.py3-none-any.whl (71kB)
    100% |████████████████████████████████| 71kB 83kB/s 
Collecting Jinja2>=2.10 (from flask)
  Downloading https://files.pythonhosted.org/packages/7f/ff/ae64bacdfc95f27a016a7bed8e8686763ba4d277a78ca76f32659220a731/Jinja2-2.10-py2.py3-none-any.whl (126kB)
    100% |████████████████████████████████| 133kB 139kB/s 
Collecting MarkupSafe>=0.23 (from Jinja2>=2.10->flask)
  Downloading https://files.pythonhosted.org/packages/4d/de/32d741db316d8fdb7680822dd37001ef7a448255de9699ab4bfcbdf4172b/MarkupSafe-1.0.tar.gz
Building wheels for collected packages: itsdangerous, MarkupSafe
  Running setup.py bdist_wheel for itsdangerous ... done
  Stored in directory: /root/.cache/pip/wheels/2c/4a/61/5599631c1554768c6290b08c02c72d7317910374ca602ff1e5
  Running setup.py bdist_wheel for MarkupSafe ... done
  Stored in directory: /root/.cache/pip/wheels/33/56/20/ebe49a5c612fffe1c5a632146b16596f9e64676768661e4e46
Successfully built itsdangerous MarkupSafe
Installing collected packages: itsdangerous, Werkzeug, click, MarkupSafe, Jinja2, flask
Successfully installed Jinja2-2.10 MarkupSafe-1.0 Werkzeug-0.14.1 click-6.7 flask-1.0.2 itsdangerous-0.24
```

这样，我们就得到了一个 python:3.6.5 又装有最新版本 flask 的容器

## 更新镜像

接下来，我们可以根据这个容器来创建一个镜像

创建方法就是使用 docker commit 命令

先退出交互式容器

```sh
root@455bba3c41d4:/# exit
[root@ddkk.com ~]# 
```

然后使用下面的命令提交一个容器的副本，也就是创建一个新的容器

```sh
[root@ddkk.com ~]# docker commit -m="python 3.6.5 + flask 1.0.2" -a="souyunku" python_365_flask  souyunku/py365flask102
sha256:aaf108c1dbdc75eff9be9d9333c957b94efa096f978f8ff6b48e456eebe5ff2f
```

参数
说明

-m:** 提交的描述信息

-a:** 指定镜像作者

python_365_flask
容器名，也可以使用容器 id 代替

souyunku/py365flask102
指定要创建的目标镜像名

## 查看创建的新的镜像

接下来我们就能在 docker images 本地镜像列表里看到我们创建的镜像 souyunku/py365flask102

```sh
[root@ddkk.com]# docker images
REPOSITORY         TAG     IMAGE ID      CREATED              SIZE
souyunku/py365flask102 latest  aaf108c1dbdc  About a minute ago   922MB
python             3.6.5   29d2f3226daf  3 weeks ago          912MB
nginx              latest  ae513a47849c  4 weeks ago          109MB
ubuntu             latest  452a96d81c30  4 weeks ago          79.6MB
ubuntu             17.10   e4422b8da209  4 weeks ago          99.2MB
hello-world        latest  e38bc07ac18e  7 weeks ago          1.85kB
jcdemo/flaskapp    latest  084bae02af1b  4 months ago         98.9MB
ubuntu             17.04   fe1cc5b91830  5 months ago         95.6MB
ubuntu             16.10   7d3f705d307c  10 months ago        107MB
```

## 运行新的镜像

现在，我们就可以使用新的镜像 souyunku/py365flask102 来启动一个容器

```sh
[root@ddkk.com ~]# docker run -it souyunku/py365flask102
root@28725e20460b:/# pip freeze list
click==6.7
Flask==1.0.2
itsdangerous==0.24
Jinja2==2.10
MarkupSafe==1.0
Werkzeug==0.14.1
root@28725e20460b:/# 
```

可以看到，新的镜像里，flask 已经安装好了
