# 20、Docker 实战：Docker build 构建镜像
- 来源：https://ddkk.com/zhuanlan/container/docker/2/20.html
- 分类：容器服务
- 分组：教程目录
在上一章节中我们学习了 Dockerfile 的语法结构，那么我们就很轻松很容易的就能创建一个 Python 3.6.5 和 Flask 1.0.2 的镜像

```sh
FROM python:3.6.5
RUN pip install flask
```

我们将这些代码保存到当前目录下的 flask_365_102 目录中的文件 Dockerfile 中

```sh
[root@ddkk.com ~]# mkdir flask_365_102
[root@ddkk.com ~]# cd flask_365_102
[root@ddkk.com flask_365_102] vi Dockerfile
```

然后我们就可以使用 **docker build** 命令， 从零开始来创建一个新的镜像

```sh
[root@ddkk.com flask_365_102]# docker build -t souyunku/flask_365_102 .
Sending build context to Docker daemon  2.048kB
Step 1/2 : FROM python:3.6.5
 ---> 29d2f3226daf
Step 2/2 : RUN pip install flask
 ---> Running in efaa520b0e38
Collecting flask
  Downloading https://files.pythonhosted.org/packages/7f/e7/08578774ed4536d3242b14dacb4696386634607af824ea997202cd0edb4b/Flask-1.0.2-py2.py3-none-any.whl (91kB)
Collecting itsdangerous>=0.24 (from flask)
  Downloading https://files.pythonhosted.org/packages/dc/b4/a60bcdba945c00f6d608d8975131ab3f25b22f2bcfe1dab221165194b2d4/itsdangerous-0.24.tar.gz (46kB)
Collecting Jinja2>=2.10 (from flask)
  Downloading https://files.pythonhosted.org/packages/7f/ff/ae64bacdfc95f27a016a7bed8e8686763ba4d277a78ca76f32659220a731/Jinja2-2.10-py2.py3-none-any.whl (126kB)
Collecting Werkzeug>=0.14 (from flask)
  Downloading https://files.pythonhosted.org/packages/20/c4/12e3e56473e52375aa29c4764e70d1b8f3efa6682bef8d0aae04fe335243/Werkzeug-0.14.1-py2.py3-none-any.whl (322kB)
Collecting click>=5.1 (from flask)
  Downloading https://files.pythonhosted.org/packages/34/c1/8806f99713ddb993c5366c362b2f908f18269f8d792aff1abfd700775a77/click-6.7-py2.py3-none-any.whl (71kB)
Collecting MarkupSafe>=0.23 (from Jinja2>=2.10->flask)
  Downloading https://files.pythonhosted.org/packages/4d/de/32d741db316d8fdb7680822dd37001ef7a448255de9699ab4bfcbdf4172b/MarkupSafe-1.0.tar.gz
Building wheels for collected packages: itsdangerous, MarkupSafe
  Running setup.py bdist_wheel for itsdangerous: started
  Running setup.py bdist_wheel for itsdangerous: finished with status 'done'
  Stored in directory: /root/.cache/pip/wheels/2c/4a/61/5599631c1554768c6290b08c02c72d7317910374ca602ff1e5
  Running setup.py bdist_wheel for MarkupSafe: started
  Running setup.py bdist_wheel for MarkupSafe: finished with status 'done'
  Stored in directory: /root/.cache/pip/wheels/33/56/20/ebe49a5c612fffe1c5a632146b16596f9e64676768661e4e46
Successfully built itsdangerous MarkupSafe
Installing collected packages: itsdangerous, MarkupSafe, Jinja2, Werkzeug, click, flask
Successfully installed Jinja2-2.10 MarkupSafe-1.0 Werkzeug-0.14.1 click-6.7 flask-1.0.2 itsdangerous-0.24
Removing intermediate container efaa520b0e38
 ---> 083eecd092af
Successfully built 083eecd092af
Successfully tagged souyunku/flask_365_102:latest
```

参数
说明

-t
指定要创建的目标镜像名

.
Dockerfile 文件所在目录，可以指定 Dockerfile 的绝对路径

然后我们就可以使用 docker images 查看创建的镜像已经在列表中存在

```sh
REPOSITORY           TAG     IMAGE ID      CREATED        SIZE
souyunku/flask_365_102   latest  083eecd092af  27 seconds ago 922MB
souyunku/py365flask102   latest  aaf108c1dbdc  4 hours ago    922MB
python               3.6.5   29d2f3226daf  3 weeks ago    912MB
nginx                latest  ae513a47849c  4 weeks ago    109MB
ubuntu               latest  452a96d81c30  4 weeks ago    79.6MB
ubuntu               17.10   e4422b8da209  4 weeks ago    99.2MB
hello-world          latest  e38bc07ac18e  7 weeks ago    1.85kB
jcdemo/flaskapp      latest  084bae02af1b  4 months ago   98.9MB
ubuntu               17.04   fe1cc5b91830  5 months ago   95.6MB
ubuntu               16.10   7d3f705d307c  10 months ago  107MB
```

我们可以使用新的镜像来创建容器

```sh
[root@ddkk.com flask_365_102]# docker run -t -i souyunku/flask_365_102 python -c "import flask;print(flask.__version__)"
1.0、2
```
