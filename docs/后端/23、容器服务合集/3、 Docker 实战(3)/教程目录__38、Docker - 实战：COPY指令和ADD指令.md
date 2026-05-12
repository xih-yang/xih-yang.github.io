# 38、Docker - 实战：COPY指令和ADD指令
- 来源：https://ddkk.com/zhuanlan/container/docker/3/38.html
- 分类：容器服务
- 分组：教程目录
`COPY` 和 `ADD` 都是 `Dockerfile` 中的指令，有着类似的作用。它们允许我们将文件从特定位置复制到 Docker 镜像中。

## 1、COPY指令

### （1）COPY指令说明

`COPY` 指令从 `` 复制新的文件或目录，并将它们添加到 Docker 容器文件系统的 `` 的路径下。

### （2）COPY指令格式

`COPY` 有两种格式：（和 `RUN` 指令一样）

- COPY [--chown=``:``] ``... ``
- COPY [--chown=``:``] ["``",... "``"]（包含空格的路径使用这种格式）

> 翻译一下：
>
>
> COPY [--chown=:] ...
> COPY [--chown=:] ["",... ""]

### （3）COPY指令使用

`COPY` 指令将从构建上下文目录中 `` 的文件或目录，复制到新的一层的镜像内的 `` 位置。

比如：

```java
COPY package.json /usr/src/app/
```

**1、**``：可以是多个，甚至可以是通配符，其通配符规则要满足Go的`filepath.Match`规则，；

如下：

```java
COPY hom* /mydir/
COPY hom?.txt /mydir/
```

**2、**``：可以是容器内的绝对路径，也可以是相对于工作目录的相对路径（工作目录可以用`WORKDIR`指令来指定）；

目标路径不需要事先创建，如果目录不存在，会在复制文件前先行创建缺失目录。

此外，还需要注意一点，使用 `COPY` 指令，**源文件**的各种元数据都会保留。比如读、写、执行权限、文件变更时间等。这个特性对于镜像定制很有用，特别是构建相关文件都在使用 Git 进行管理的时候。

### （4）其他

在使用该指令的时候还可以加上 `--chown=:` 选项，来改变文件的所属用户及所属组。

```java
COPY --chown=55:mygroup files* /mydir/
COPY --chown=bin files* /mydir/
COPY --chown=1 files* /mydir/
COPY --chown=10:11 files* /mydir/
```

## 2、ADD指令

`ADD` 指令和 `COPY` 指令的格式和性质基本一致，但是在 `COPY` 基础上增加了一些功能。

### （1）ADD指令说明

`ADD`指令有一些额外的功能 ：

- ADD指令可以让你使用 URL 作为 `` 参数。当遇到 URL 时候，可以通过 URL 下载文件并且复制到 ``（容器中目标路径）。
- ADD的另一个特性是自动解压文件的能力。如果 `` 参数是一个可识别压缩格式（tar, gzip, bzip2…）的**本地文件**（*注：无法实现同时下载并解压*），就会被解压到指定容器文件系统的路径 `` 下。

即：`ADD`指令是将本地文件复制到容器中，也支持通过 URL 进行复制，但效率通常很低（不推荐使用）。

### （2）ADD指令格式

`ADD` 有两种格式：

- ADD [--chown=``:``] ``... ``
- ADD [--chown=``:``] ["``",... "``"]（包含空格的路径使用这种格式）

### （3）ADD指令使用

`ADD` 的最佳用途是将本地压缩包文件自动提取到镜像中：

如下情况，自动解压缩的功能非常有用，比如官方镜像 `ubuntu` 中：

```java
FROM scratch
ADD ubuntu-xenial-core-cloudimg-amd64-root.tar.gz /
...
```

> 提示：但在某些情况下，如果我们真的是希望复制个压缩文件进去，而不解压缩，这时就不可以使用 ADD 命令了。

### （4）不推荐使用ADD指令下载文件的原因

由于镜像的体积很重要，所以强烈建议不要使用 `ADD` 从远程 URL 获取文件，下载文件我们应该使用 `curl` 或 `wget` 来代替。

因为如果下载的是个压缩包，需要解压缩，还需要额外的一层 `RUN` 指令进行解压缩。所以不如直接使用 `RUN` 指令，然后使用 `wget` 或者 `curl` 工具下载，处理权限、解压缩、然后清理无用文件更合理。

因此，这个功能其实并不实用，而且不推荐使用。

示例：

我们应该避免以下操作：（Dockerfile文件）

```java
ADD http://example.com/big.tar.xz /usr/src/things/
RUN tar -xJf /usr/src/things/big.tar.xz -C /usr/src/things \  解压
    && make -C /usr/src/things all \    编译
    && rm -f /usr/src/things/big.tar.xz 删除
```

这个压缩包解压后，`rm` 命令处于独立的镜像层。

我们可以这样做：

```java
RUN mkdir -p /usr/src/things \
    && curl -SL http://example.com/big.tar.xz \
        | tar -xJC /usr/src/things \
    && make -C /usr/src/things all
```

`curl` 会下载这个压缩包并通过管道传给 `tar` 命令进行解压，这样也就不会在文件系统中留下这个压缩文件了。

对于不需要自动解压的文件或目录，应该始终使用 `COPY`。

**最后，认准一个原则：总是使用 COPY（除非我们明确需要 ADD）。**

### （5）其他

在使用该指令的时候还可以加上 `--chown=:` 选项来改变文件的所属用户及所属组。

```java
ADD --chown=55:mygroup files* /mydir/
ADD --chown=bin files* /mydir/
ADD --chown=1 files* /mydir/
ADD --chown=10:11 files* /mydir/
```

## 3、总结：

在Docker 官方的 `Dockerfile 最佳实践文档`中要求，尽可能的使用 `COPY`，因为 `COPY` 的语义很明确，就是复制文件而已，而 `ADD`则包含了更复杂的功能，其行为也不一定很清晰。最适合使用 `ADD` 的场合，就是所提及的需要自动解压缩的场景。

另外需要注意的是，`ADD` 指令会令镜像构建缓存失效，从而可能会令镜像构建变得比较缓慢。

因此在`COPY` 和 `ADD` 指令中选择的时候，可以遵循这样的原则，所有的文件复制均使用 `COPY` 指令，仅在需要自动解压缩的场景使用 `ADD`指令。

> 参考：
>
>
> https://www.kancloud.cn/spirit-ling/docker-study/1413262
> https://jpanj.com/2019/dockerfile-add-vs-copy/
