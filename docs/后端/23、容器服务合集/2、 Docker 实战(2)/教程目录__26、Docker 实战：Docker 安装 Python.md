# 26、Docker 实战：Docker 安装 Python
- 来源：https://ddkk.com/zhuanlan/container/docker/2/26.html
- 分类：容器服务
- 分组：教程目录
Python 是一门解释型、面向对象、动态数据类型的高级程序设计语言，入门简单易学习，Docker 安装 Python 有两种方法

我们以当前最新的版本 3.6.5 安装为例

## 1. docker pull python:3.6.5

这种方法非常适合只需要使用 Python 的开发者

**1、** 查找DockerHub上的python镜像；

```sh
[root@ddkk.com ~]# docker search python
NAME     DESCRIPTION                                  OFFICIAL   
python   Python is an interpreted, interactive...     [OK]       
django   Django is a free web application ...         [OK]       
pypy     PyPy is a fast, compliant ...                [OK]
...
```

```sh
有很多版本，我们选择官方最新的版本 python
```

**2、** 拉取官方的镜像,标签为3.6.5；

```sh
[root@ddkk.com ~]# docker pull python:3.6.5
3.6.5: Pulling from library/python
```

3、 稍等片刻，下载完成后，就可以在本地镜像列表里看到 REPOSITORY 为 python,标签为 3.6.6 的镜像 [root@ddkk.com ~]# docker images python REPOSITORY TAG IMAGE ID CREATED SIZE python 3.6.5 29d2f3226daf 3 weeks ago 911.6 MB

```sh
一个 python 900m，我能说啥，这差不多是 10 倍的大小啊
```

**4、** 通过Dockerfile文件构建；

使用Dockerfile 文件构建的好处就是自己可以定制安装 Python 镜像

**1、** 创建目录python用户存放后面相关的东西；

```sh
[root@ddkk.com ~]# mkdir -p ~/python/myapp
```

```sh
<table> 
 <thead> 
  <tr> 
   <th align="left">目录</th> 
   <th align="left">说明</th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td align="left">python</td> 
   <td align="left">用户存放 <code>Dockerfile</code> 文件和 <code>myapp</code> 应用程序代码</td> 
  </tr> 
  <tr> 
   <td align="left">myapp</td> 
   <td align="left">这个目录将映射为 python 容器配置的应用目录</td> 
  </tr> 
 </tbody> 
</table>
```

**2、** 进入创建的python目录，创建Dockerfile；

```sh
[root@ddkk.com ~]# cd python
[root@ddkk.com python]# vi Dockerfile
```

```sh
然后复制粘贴以下内容
```

```sh
FROM buildpack-deps:jessie
# 删除旧的 python
RUN apt-get purge -y python.*
# 使用 UTF-8 编码
ENV LANG C.UTF-8
ENV PYTHON_VERSION 3.6.5
# if this is called "PIP_VERSION", pip explodes with "ValueError: invalid truth value '<VERSION>'"
ENV PYTHON_PIP_VERSION 10.0.1
RUN set -ex \
        && curl -fSL "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz" -o python.tar.xz \
        && mkdir -p /usr/src/python \
        && tar -xJC /usr/src/python --strip-components=1 -f python.tar.xz \
        && rm python.tar.xz \
        \
        && cd /usr/src/python \
        && ./configure --enable-shared --enable-unicode=ucs4 \
        && make -j$(nproc) \
        && make install \
        && ldconfig \
        && pip3 install --no-cache-dir --upgrade --ignore-installed pip==$PYTHON_PIP_VERSION \
        && find /usr/local -depth \
                \( \
                    \( -type d -a -name test -o -name tests \) \
                    -o \
                    \( -type f -a -name '*.pyc' -o -name '*.pyo' \) \
                \) -exec rm -rf '{}' + \
        && rm -rf /usr/src/python ~/.cache
# make some useful symlinks that are expected to exist
RUN cd /usr/local/bin \
        && ln -s easy_install-3.5 easy_install \
        && ln -s idle3 idle \
        && ln -s pydoc3 pydoc \
        && ln -s python3 python \
        && ln -s python3-config python-config
CMD ["python3"]
```

**3、** 通过Dockerfile创建一个镜像my-python:3.6.5；

```sh
[root@ddkk.com python]# docker build -t my-python:3.6.5 .
```

**4、** 稍等片刻，就能在本地的镜像列表里查找到刚刚创建的镜像；

```sh
[root@ddkk.com python] docker images my-python
REPOSITORY   TAG    IMAGE ID      CREATED      SIZE
my-python    3.6.5  b2057b57ffad  11 days ago  682 MB
```

## 使用 Python 镜像

在~/python/myapp 目录下新建一个文件 hello.py 然后输入以下内容

```sh
#!/usr/bin/python3
print("Hello, DDKK.COM 弟弟快看，程序员编程资料站!");
```

然后使用 docker run 命令运行我们刚刚创建的 hello.py 文件

```sh
[root@ddkk.com python]# docker run  -v $PWD/myapp:/usr/src/myapp  -w /usr/src/myapp python:3.6.5 python3 hello.py
Hello, DDKK.COM 弟弟快看，程序员编程资料站
```

命令说明：

**1、** -v `$` PWD/myapp:/usr/src/myapp；

```sh
将主机中当前目录下的 myapp 挂载到容器的 /usr/src/myapp
```

**2、** -w/usr/src/myapp；

```sh
指定容器的 /usr/src/myapp 目录为工作目录
```

**3、** python3hello.py；

```sh
使用容器的 python3 命令来执行工作目录中的 hello.py 文件
```
