# 23、Docker 实战：Docker 部署 PHP 环境
- 来源：https://ddkk.com/zhuanlan/container/docker/2/23.html
- 分类：容器服务
- 分组：教程目录
PHP是当下最流行的 Web 服务器端开发语言，号称 **地球上最好的语言，没有之一**。Docker 部署 PHP 环境有两种方式： 通过 Dockerfile 构建 和 从 Docker 仓库拉取

我们以当前最新的版本 7.2.6 安装为例

## 1. 使用 docker pull php

这是最简单的方式，开箱即用

**1、** 使用**dockersearchphp**命令可以列出docker.io上所有的PHP有关的镜像；

```sh
[root@ddkk.com ~]# docker search php
NAME     DESCRIPTION                  OFFICIAL   
php      While designed for web...     [OK]   
...
```

```sh
有很多版本，我们选择官方的 php
```

**2、** 拉取最新的PHP标签:7.2.6-fpm-stretch；

```sh
[root@ddkk.com ~]# docker pull php:7.2.6-fpm-stretch
```

**3、** 稍等片刻，下载完成后，就可以在本地镜像列表里找到REPOSITORY为php,标签为7.2.6-fpm-stretch的镜像；

```sh
[root@ddkk.com ~]# docker images php
REPOSITORY TAG                IMAGE ID     ... SIZE
php        7.2.6-fpm-stretch  0a757334c1f6 ... 367.7 MB
```

## 2. 通过 Dockerfile 文件构建

使用Dockerfile 文件构建，我们可以实现定制，并且熟悉 PHP 的安装过程

**1、** 创建目录**php**,用于存放后面的相关东西；

```sh
[root@ddkk.com ~]# mkdir -p php/logs php/conf
```

```sh
<table> 
 <thead> 
  <tr> 
   <th align="left">文件</th> 
   <th align="left">说明</th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td align="left">logs</td> 
   <td align="left">该目录将映射为 phpops 容器的日志目录</td> 
  </tr> 
  <tr> 
   <td align="left">conf</td> 
   <td align="left">该目录里的配置文件将映射为 phpops 容器的配置文件</td> 
  </tr> 
 </tbody> 
</table>
```

**2、** 进入php目录，并创建以下几个文件；

```sh
\[root@ddkk.com ~\]\# cd php
如果你嫌复制太麻烦，可以直接去 [GitHub][] 上下载
```

1. docker-php-entrypoint

```sh
# !/bin/sh
# 移除第一行的 # ! 之间的空格
set -e
# first arg is -f or --some-option
if [ "${1#-}" != "$1" ]; then
    set -- php-fpm "$@"
fi
exec "$@"
```

1. docker-php-ext-configure

```sh
# !/bin/sh
# 移除第一行的 # ! 之间的空格
set -e
# prefer user supplied CFLAGS, but default to our PHP_CFLAGS
: ${CFLAGS:=$PHP_CFLAGS}
: ${CPPFLAGS:=$PHP_CPPFLAGS}
: ${LDFLAGS:=$PHP_LDFLAGS}
export CFLAGS CPPFLAGS LDFLAGS
srcExists=
if [ -d /usr/src/php ]; then
    srcExists=1
fi
docker-php-source extract
if [ -z "$srcExists" ]; then
    touch /usr/src/php/.docker-delete-me
fi
cd /usr/src/php/ext
usage() {
    echo "usage: $0 ext-name [configure flags]"
    echo "   ie: $0 gd --with-jpeg-dir=/usr/local/something"
    echo
    echo 'Possible values for ext-name:'
    find . \
            -mindepth 2 \
            -maxdepth 2 \
            -type f \
            -name 'config.m4' \
        | xargs -n1 dirname \
        | xargs -n1 basename \
        | sort \
        | xargs
    echo
    echo 'Some of the above modules are already compiled into PHP; please check'
    echo 'the output of "php -i" to see which modules are already loaded.'
}
ext="$1"
if [ -z "$ext" ] || [ ! -d "$ext" ]; then
    usage >&2
    exit 1
fi
shift
pm='unknown'
if [ -e /lib/apk/db/installed ]; then
    pm='apk'
fi
if [ "$pm" = 'apk' ]; then
    if \
        [ -n "$PHPIZE_DEPS" ] \
        && ! apk info --installed .phpize-deps > /dev/null \
        && ! apk info --installed .phpize-deps-configure > /dev/null \
    ; then
        apk add --no-cache --virtual .phpize-deps-configure $PHPIZE_DEPS
    fi
fi
if command -v dpkg-architecture > /dev/null; then
    gnuArch="$(dpkg-architecture --query DEB_BUILD_GNU_TYPE)"
    set -- --build="$gnuArch" "$@"
fi
cd "$ext"
phpize
./configure "$@"
```

1. docker-php-ext-enable

```sh
        # !/bin/sh
        # 移除第一行的 # ! 之间的空格
        set -e
        extDir="$(php -r 'echo ini_get("extension_dir");')"
        cd "$extDir"
        usage() {
            echo "usage: $0 [options] module-name [module-name ...]"
            echo "   ie: $0 gd mysqli"
            echo "       $0 pdo pdo_mysql"
            echo "       $0 --ini-name 0-apc.ini apcu apc"
            echo
            echo 'Possible values for module-name:'
            find -maxdepth 1 \
                    -type f \
                    -name '*.so' \
                    -exec basename '{}' ';' \
                | sort \
                | xargs
            echo
            echo 'Some of the above modules are already compiled into PHP; please check'
            echo 'the output of "php -i" to see which modules are already loaded.'
        }
        opts="$(getopt -o 'h?' --long 'help,ini-name:' -- "$@" || { usage >&2 && false; })"
        eval set -- "$opts"
        iniName=
        while true; do
            flag="$1"
            shift
            case "$flag" in
                --help|-h|'-?') usage && exit 0 ;;
                --ini-name) iniName="$1" && shift ;;
                --) break ;;
                *)
                    {
                        echo "error: unknown flag: $flag"
                        usage
                    } >&2
                    exit 1
                    ;;
            esac
        done
        modules=
        for module; do
            if [ -z "$module" ]; then
                continue
            fi
            if [ -f "$module.so" ] && ! [ -f "$module" ]; then
                # allow ".so" to be optional
                module="$module.so"
            fi
            if ! [ -f "$module" ]; then
                echo >&2 "error: '$module' does not exist"
                echo >&2
                usage >&2
                exit 1
            fi
            modules="$modules $module"
        done
        if [ -z "$modules" ]; then
            usage >&2
            exit 1
        fi
        pm='unknown'
        if [ -e /lib/apk/db/installed ]; then
            pm='apk'
        fi
        apkDel=
        if [ "$pm" = 'apk' ]; then
            if \
                [ -n "$PHPIZE_DEPS" ] \
                && ! apk info --installed .phpize-deps > /dev/null \
                && ! apk info --installed .phpize-deps-configure > /dev/null \
            ; then
                apk add --no-cache --virtual '.docker-php-ext-enable-deps' binutils
                apkDel='.docker-php-ext-enable-deps'
            fi
        fi
        for module in $modules; do
            if readelf --wide --syms "$module" | grep -q ' zend_extension_entry$'; then
                # https://wiki.php.net/internals/extensions#loading_zend_extensions
                absModule="$(readLink-f "$module")"
                line="zend_extension=$absModule"
            else
                line="extension=$module"
            fi
            ext="$(basename "$module")"
            ext="${ext%.*}"
            if php -r 'exit(extension_loaded("'"$ext"'") ? 0 : 1);'; then
                # this isn't perfect, but it's better than nothing
                # (for example, 'opcache.so' presents inside PHP as 'Zend OPcache', not 'opcache')
                echo >&2
                echo >&2 "warning: $ext ($module) is already loaded!"
                echo >&2
                continue
            fi
            ini="/usr/local/etc/php/conf.d/${iniName:-"docker-php-ext-$ext.ini"}"
            if ! grep -q "$line" "$ini" 2>/dev/null; then
                echo "$line" >> "$ini"
            fi
        done
        if [ "$pm" = 'apk' ] && [ -n "$apkDel" ]; then
            apk del $apkDel
        fi
```

1. docker-php-ext-install

```sh
# !/bin/sh
# 移除第一行的 # ! 之间的空格
set -e
# prefer user supplied CFLAGS, but default to our PHP_CFLAGS
: ${CFLAGS:=$PHP_CFLAGS}
: ${CPPFLAGS:=$PHP_CPPFLAGS}
: ${LDFLAGS:=$PHP_LDFLAGS}
export CFLAGS CPPFLAGS LDFLAGS
srcExists=
if [ -d /usr/src/php ]; then
    srcExists=1
fi
docker-php-source extract
if [ -z "$srcExists" ]; then
    touch /usr/src/php/.docker-delete-me
fi
cd /usr/src/php/ext
usage() {
    echo "usage: $0 [-jN] ext-name [ext-name ...]"
    echo "   ie: $0 gd mysqli"
    echo "       $0 pdo pdo_mysql"
    echo "       $0 -j5 gd mbstring mysqli pdo pdo_mysql shmop"
    echo
    echo 'if custom ./configure arguments are necessary, see docker-php-ext-configure'
    echo
    echo 'Possible values for ext-name:'
    find . \
            -mindepth 2 \
            -maxdepth 2 \
            -type f \
            -name 'config.m4' \
        | xargs -n1 dirname \
        | xargs -n1 basename \
        | sort \
        | xargs
    echo
    echo 'Some of the above modules are already compiled into PHP; please check'
    echo 'the output of "php -i" to see which modules are already loaded.'
}
opts="$(getopt -o 'h?j:' --long 'help,jobs:' -- "$@" || { usage >&2 && false; })"
eval set -- "$opts"
j=1
while true; do
    flag="$1"
    shift
    case "$flag" in
        --help|-h|'-?') usage && exit 0 ;;
        --jobs|-j) j="$1" && shift ;;
        --) break ;;
        *)
            {
                echo "error: unknown flag: $flag"
                usage
            } >&2
            exit 1
            ;;
    esac
done
exts=
for ext; do
    if [ -z "$ext" ]; then
        continue
    fi
    if [ ! -d "$ext" ]; then
        echo >&2 "error: $PWD/$ext does not exist"
        echo >&2
        usage >&2
        exit 1
    fi
    exts="$exts $ext"
done
if [ -z "$exts" ]; then
    usage >&2
    exit 1
fi
pm='unknown'
if [ -e /lib/apk/db/installed ]; then
    pm='apk'
fi
apkDel=
if [ "$pm" = 'apk' ]; then
    if [ -n "$PHPIZE_DEPS" ]; then
        if apk info --installed .phpize-deps-configure > /dev/null; then
            apkDel='.phpize-deps-configure'
        elif ! apk info --installed .phpize-deps > /dev/null; then
            apk add --no-cache --virtual .phpize-deps $PHPIZE_DEPS
            apkDel='.phpize-deps'
        fi
    fi
fi
popDir="$PWD"
for ext in $exts; do
    cd "$ext"
    [ -e Makefile ] || docker-php-ext-configure "$ext"
    make -j"$j"
    make -j"$j" install
    find modules \
        -maxdepth 1 \
        -name '*.so' \
        -exec basename '{}' ';' \
            | xargs -r docker-php-ext-enable
    make -j"$j" clean
    cd "$popDir"
done
if [ "$pm" = 'apk' ] && [ -n "$apkDel" ]; then
    apk del $apkDel
fi
if [ -e /usr/src/php/.docker-delete-me ]; then
    docker-php-source delete
fi
```

1. docker-php-source

```sh
# !/bin/sh
# 移除第一行的 # ! 之间的空格
set -e
dir=/usr/src/php
usage() {
    echo "usage: $0 COMMAND"
    echo
    echo "Manage php source tarball lifecycle."
    echo
    echo "Commands:"
    echo "   extract  extract php source tarball into directory $dir if not already done."
    echo "   delete   delete extracted php source located into $dir if not already done."
    echo
}
case "$1" in
    extract)
        mkdir -p "$dir"
        if [ ! -f "$dir/.docker-extracted" ]; then
            tar -Jxf /usr/src/php.tar.xz -C "$dir" --strip-components=1
            touch "$dir/.docker-extracted"
        fi
        ;;
    delete)
        rm -rf "$dir"
        ;;
    *)
        usage
        exit 1
        ;;
esac
```

**3、** 创建Dockerfile文件；

```sh
[root@ddkk.com php]# vi Dockerfile
```

```sh
FROM debian:jessie
# 编译和运行时依赖的工具
ENV PHPIZE_DEPS autoconf file g++ gcc libc-dev make pkg-config re2c
# 指定 php.ini目录
ENV PHP_INI_DIR /usr/local/etc/php
## 指定 PHP 版本和编译的选项
ENV PHP_EXTRA_CONFIGURE_ARGS --enable-fpm --with-fpm-user=www-data --with-fpm-group=www-data
ENV PHP_VERSION 7.2.6
ENV PHP_FILENAME php-7.2.6.tar.xz
# 安装依赖的库和环境
RUN apt-get update \
    && apt-get install -y $PHPIZE_DEPS ca-certificates curl libedit2 \
    libsqlite3-0 libxml2 --no-install-recommends \
    && rm -r /var/lib/apt/lists/*
RUN mkdir -p $PHP_INI_DIR/conf.d
RUN set -xe && buildDeps=" $PHP_EXTRA_BUILD_DEPS libcurl4-openssl-dev libedit-dev libsqlite3-dev libssl-dev libxml2-dev xz-utils " \
    && apt-get update && apt-get install -y $buildDeps --no-install-recommends && rm -rf /var/lib/apt/lists/* \
    && curl -fSL "http://php.net/get/$PHP_FILENAME/from/this/mirror" -o "$PHP_FILENAME" \
    && mkdir -p /usr/src/php \
    && tar -xf "$PHP_FILENAME" -C /usr/src/php --strip-components=1 \
    && rm "$PHP_FILENAME" \
    && cd /usr/src/php \
    && ./configure --with-config-file-path="$PHP_INI_DIR" \
        --with-config-file-scan-dir="$PHP_INI_DIR/conf.d" \
        $PHP_EXTRA_CONFIGURE_ARGS \
        --disable-cgi --enable-mysqlnd --enable-mbstring \
        --with-curl --with-libedit --with-openssl --with-zlib \
    && make -j"$(nproc)" \
    && make install \
    && { find /usr/local/bin /usr/local/sbin -type f -executable -exec strip --strip-all '{}' + || true; } \
    && make clean \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false -o APT::AutoRemove::SuggestsImportant=false $buildDeps
COPY docker-php-ext-* /usr/local/bin/
##<autogenerated>##
WORKDIR /var/www/html
RUN set -ex \
    && cd /usr/local/etc \
    && if [ -d php-fpm.d ]; then \
        sed 's!=NONE/!=!g' php-fpm.conf.default | tee php-fpm.conf > /dev/null; \
        cp php-fpm.d/www.conf.default php-fpm.d/www.conf; \
    else \
        mkdir php-fpm.d; \
        cp php-fpm.conf.default php-fpm.d/www.conf; \
        { \
            echo '[global]'; \
            echo 'include=etc/php-fpm.d/*.conf'; \
        } | tee php-fpm.conf; \
    fi \
    && { \
        echo '[global]'; \
        echo 'error_log = /proc/self/fd/2'; \
        echo; \
        echo '[www]'; \
        echo '; if we send this to /proc/self/fd/1, it never appears'; \
        echo 'access.log = /proc/self/fd/2'; \
        echo; \
        echo 'clear_env = no'; \
        echo; \
        echo '; Ensure worker stdout and stderr are sent to the main error log.'; \
        echo 'catch_workers_output = yes'; \
    } | tee php-fpm.d/docker.conf \
    && { \
        echo '[global]'; \
        echo 'daemonize = no'; \
        echo; \
        echo '[www]'; \
        echo 'listen = [::]:9000'; \
    } | tee php-fpm.d/zz-docker.conf
EXPOSE 9000
CMD ["php-fpm"]
```

**4、** 通过dockerbuild命令创建镜像my-php:7.2.6-fpm；

```sh
[root@ddkk.com php]# docker build -t my-php:7.2.6-fpm .
```

**5、** 稍等片刻，命令执行完成后，可以使用**dockerimages**命令显示刚刚创建的镜像；

```sh
[root@ddkk.com php]# docker images my-php
REPOSITORY   TAG                 IMAGE ID        ...  SIZE
```

## 运行 my-php 容器

先在当前目录下创建目录 www，然后在目录 www 中新建文件 i.php 内容如下

```sh
<?php 
phpinfo();
```

最后使用下面的命令运行容器

```sh
[root@ddkk.com php]# docker run -it -p 9000:9000 --name  php-fpm -v $pwd/www:/www -v $PWD/conf:/usr/local/etc/php -v $PWD/logs:/phplogs my-php:7.2.6-fpm bash
```

这会直接进入容器

参数说明

**1、** -p9000:9000；

```sh
将容器的 9000 端口映射到主机的 9000 端口
```

**2、** --namephp-fpm；

```sh
将容器命名为 php-fpm
```

**3、** -v `$` pwd/www:/www；

```sh
将主机中项目的目录 www 挂载到容器的 /www
```

**4、** -v `$` PWD/conf:/usr/local/etc/php；

```sh
将主机中当前目录下的 conf 目录挂载到容器的 /usr/local/etc/php
```

**5、** -v `$` PWD/logs:/phplogs；

```sh
将主机中当前目录下的 logs 目录挂载到容器的 /phplogs
```

然后使用下面的命令 CD 到 /www 目录，运行 php -s 0.0.0.0:9000 命令

```sh
root@bd90d7c7bbf9:/www# cd /www
root@bd90d7c7bbf9:/www# php -S 0.0.0.0:9000
```

通过浏览器访问 [http://localhost:9000/i.php](http://localhost:9000/i.php)，输出如下

如果要作为 php-fpm 运行，那么直接使用下面的命令

```sh
[root@ddkk.com php]# docker run -d -p 9000:9000 --name  php-fpm -v $pwd/www:/www -v $PWD/conf:/usr/local/etc/php -v $PWD/logs:/phplogs my-php:7.2.6-fpm
```

## 查看容器启动情况

```sh
[root@ddkk.com php]# docker ps -a
CONTAINER ID    IMAGE         COMMAND      ...    PORTS                    NAMES
00c5aa4c2f93    my-php:7.2.6-fpm   "php-fpm"    ...    0.0.0.0:9000->9000/tcp   myphp-fpm
```

## 查看容器的 IP

可以使用命令 docker inspect 查看容器的 IP

```sh
docker inspect --format '{{ .NetworkSettings.IPAddress }}' <container_id>
```

例如可以使用下面的命令查看刚刚创建的容器的 IP

```sh
[root@ddkk.com php]# docker inspect --format '{{ .NetworkSettings.IPAddress }}' c929419b17cf
172、17.0.2
```

## 使用 Nginx + PHP 实现 Web 服务

我们是通过 Nginx + PHP 实现 Web 服务，Nginx 配置文件的 fastcgi_pass 应该配置为 myphp-fpm 容器的 IP

```sh
fastcgi_pass  172.17.0.2:9000;
```
