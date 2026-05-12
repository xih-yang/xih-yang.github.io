# 28、Docker 实战：Docker 安装 MongoDB
- 来源：https://ddkk.com/zhuanlan/container/docker/2/28.html
- 分类：容器服务
- 分组：教程目录
MongoDB 是当下最流行的 NoSQL 数据库之一，Docker 安装 apache 的方式有两种

如果你是 Docker 初学者，如果你以后长期使用 mongodb ，我们建议你两种方法都试一试，为什么呢？

原因很简单，第一种方法，简单快捷，第二种方法，就是尝试自己编译安装

## 1. docker pull mongodb

如果想以最简单的方式安装 MongoDB, 可以直接使用 docker pull mongo 命令

流程如下

**1、** 查找DockerHub上的mongodb镜像；

```sh
[root@ddkk.com ~]# docker search mongodb
NAME    ...    OFFICIAL  ...
mongo   ...    [OK]      ...
mongo-express  [OK]      ...
```

```sh
列表很多，我们推荐你使用 OFFICIAL = OK 的那两条
1.  mongo 是官方数据库
2.  mongo-express 是官方使用 Node.js 开发的 MongoDB 管理后台
```

**2、** 拉取官方最新的MongoDB镜像；

```sh
[root@ddkk.com ~]# docker pull mongo
Using default tag: latest
...
```

**3、** 稍等片刻，下载完成后就可以在本地镜像列表里看到mongo的镜像了；

```sh
[root@ddkk.com apache]# docker images mongodb
REPOSITORY  TAG       IMAGE ID        CREATED        SIZE
mongo       latest    f93ff881751f    5 days ago     367.6 MB
```

## 2. 通过 Dockerfile 文件构建

如果你是运维工程师，我们推荐你使用 Dockerfile 文件构建 mongodb 镜像

因为可以加深对安装 mongodb 的理解

现在，我们一步一步使用 Dockerfile 文件构建 mongodb 镜像吧

**1、** 创建目录mongo用于存放后面的相关东西；

```sh
    [root@ddkk.com ~]#  mkdir -p  ~/mongo/db
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
   <td align="left">mongo</td> 
   <td align="left">该目录存放 <code>Dockerfile</code> 文件和 <code>db</code> 数据库目录</td> 
  </tr> 
  <tr> 
   <td align="left">mongo/db</td> 
   <td align="left">该目录将映射为 mongodb 容器的数据库目录</td> 
  </tr> 
 </tbody> 
</table>
```

**2、** 进入创建的mongo目录，创建docker-entrypoint.sh脚本用于管理MongoDB数据库；

```sh
[root@ddkk.com ~]# cd mongo
[root@ddkk.com mongo] touch docker-entrypoint.sh
[root@ddkk.com mongo] chmod +x docker-entrypoint.sh
[root@ddkk.com mongo] vi docker-entrypoint.sh
```

```sh
然后输入以下内容
```

```sh
# !/bin/bash
# 注意去掉上一行 # ! 之间的空格
set -Eeuo pipefail
if [ "${1:0:1}" = '-' ]; then
    set -- mongod "$@"
fi
originalArgOne="$1"
# allow the container to be started with --user
# all mongo* commands should be dropped to the correct user
if [[ "$originalArgOne" == mongo* ]] && [ "$(id -u)" = '0' ]; then
    if [ "$originalArgOne" = 'mongod' ]; then
        chown -R mongodb /data/configdb /data/db
    fi
    # make sure we can write to stdout and stderr as "mongodb"
    # (for our "initdb" code later; see "--logpath" below)
    chown --dereference mongodb "/proc/$$/fd/1" "/proc/$$/fd/2" || :
    # ignore errors thanks to https://github.com/docker-library/mongo/issues/149
    exec gosu mongodb "$BASH_SOURCE" "$@"
fi
# you should use numactl to start your mongod instances, including the config servers, mongos instances, and any clients.
# https://docs.mongodb.com/manual/administration/production-notes/#configuring-numa-on-linux
if [[ "$originalArgOne" == mongo* ]]; then
    numa='numactl --interleave=all'
    if $numa true &> /dev/null; then
        set -- $numa "$@"
    fi
fi
# usage: file_env VAR [DEFAULT]
#    ie: file_env 'XYZ_DB_PASSWORD' 'example'
# (will allow for "$XYZ_DB_PASSWORD_FILE" to fill in the value of
#  "$XYZ_DB_PASSWORD" from a file, especially for Docker's secrets feature)
file_env() {
    local var="$1"
    local fileVar="${var}_FILE"
    local def="${2:-}"
    if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
        echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
        exit 1
    fi
    local val="$def"
    if [ "${!var:-}" ]; then
        val="${!var}"
    elif [ "${!fileVar:-}" ]; then
        val="$(< "${!fileVar}")"
    fi
    export "$var"="$val"
    unset "$fileVar"
}
# see https://github.com/docker-library/mongo/issues/147 (mongod is picky about duplicated arguments)
_mongod_hack_have_arg() {
    local checkArg="$1"; shift
    local arg
    for arg; do
        case "$arg" in
            "$checkArg"|"$checkArg"=*)
                return 0
                ;;
        esac
    done
    return 1
}
# _mongod_hack_get_arg_val '--some-arg' "$@"
_mongod_hack_get_arg_val() {
    local checkArg="$1"; shift
    while [ "$#" -gt 0 ]; do
        local arg="$1"; shift
        case "$arg" in
            "$checkArg")
                echo "$1"
                return 0
                ;;
            "$checkArg"=*)
                echo "${arg#$checkArg=}"
                return 0
                ;;
        esac
    done
    return 1
}
declare -a mongodHackedArgs
# _mongod_hack_ensure_arg '--some-arg' "$@"
# set -- "${mongodHackedArgs[@]}"
_mongod_hack_ensure_arg() {
    local ensureArg="$1"; shift
    mongodHackedArgs=( "$@" )
    if ! _mongod_hack_have_arg "$ensureArg" "$@"; then
        mongodHackedArgs+=( "$ensureArg" )
    fi
}
# _mongod_hack_ensure_no_arg '--some-unwanted-arg' "$@"
# set -- "${mongodHackedArgs[@]}"
_mongod_hack_ensure_no_arg() {
    local ensureNoArg="$1"; shift
    mongodHackedArgs=()
    while [ "$#" -gt 0 ]; do
        local arg="$1"; shift
        if [ "$arg" = "$ensureNoArg" ]; then
            continue
        fi
        mongodHackedArgs+=( "$arg" )
    done
}
# _mongod_hack_ensure_no_arg '--some-unwanted-arg' "$@"
# set -- "${mongodHackedArgs[@]}"
_mongod_hack_ensure_no_arg_val() {
    local ensureNoArg="$1"; shift
    mongodHackedArgs=()
    while [ "$#" -gt 0 ]; do
        local arg="$1"; shift
        case "$arg" in
            "$ensureNoArg")
                shift # also skip the value
                continue
                ;;
            "$ensureNoArg"=*)
                # value is already included
                continue
                ;;
        esac
        mongodHackedArgs+=( "$arg" )
    done
}
# _mongod_hack_ensure_arg_val '--some-arg' 'some-val' "$@"
# set -- "${mongodHackedArgs[@]}"
_mongod_hack_ensure_arg_val() {
    local ensureArg="$1"; shift
    local ensureVal="$1"; shift
    _mongod_hack_ensure_no_arg_val "$ensureArg" "$@"
    mongodHackedArgs+=( "$ensureArg" "$ensureVal" )
}
# _js_escape 'some "string" value'
_js_escape() {
    jq --null-input --arg 'str' "$1" '$str'
}
jsonConfigFile="${TMPDIR:-/tmp}/docker-entrypoint-config.json"
tempConfigFile="${TMPDIR:-/tmp}/docker-entrypoint-temp-config.json"
_parse_config() {
    if [ -s "$tempConfigFile" ]; then
        return 0
    fi
    local configPath
    if configPath="$(_mongod_hack_get_arg_val --config "$@")"; then
        # if --config is specified, parse it into a JSON file so we can remove a few problematic keys (especially SSL-related keys)
        # see https://docs.mongodb.com/manual/reference/configuration-options/
        mongo --norc --nodb --quiet --eval "load('/js-yaml.js'); printjson(jsyaml.load(cat($(_js_escape "$configPath"))))" > "$jsonConfigFile"
        jq 'del(.systemLog, .processManagement, .net, .security)' "$jsonConfigFile" > "$tempConfigFile"
        return 0
    fi
    return 1
}
dbPath=
_dbPath() {
    if [ -n "$dbPath" ]; then
        echo "$dbPath"
        return
    fi
    if ! dbPath="$(_mongod_hack_get_arg_val --dbpath "$@")"; then
        if _parse_config "$@"; then
            dbPath="$(jq '.storage.dbPath' "$jsonConfigFile")"
        fi
    fi
    : "${dbPath:=/data/db}"
    echo "$dbPath"
}
if [ "$originalArgOne" = 'mongod' ]; then
    file_env 'MONGO_INITDB_ROOT_USERNAME'
    file_env 'MONGO_INITDB_ROOT_PASSWORD'
    # pre-check a few factors to see if it's even worth bothering with initdb
    shouldPerformInitdb=
    if [ "$MONGO_INITDB_ROOT_USERNAME" ] && [ "$MONGO_INITDB_ROOT_PASSWORD" ]; then
        # if we have a username/password, let's set "--auth"
        _mongod_hack_ensure_arg '--auth' "$@"
        set -- "${mongodHackedArgs[@]}"
        shouldPerformInitdb='true'
    elif [ "$MONGO_INITDB_ROOT_USERNAME" ] || [ "$MONGO_INITDB_ROOT_PASSWORD" ]; then
        cat >&2 <<-'EOF'
            error: missing 'MONGO_INITDB_ROOT_USERNAME' or 'MONGO_INITDB_ROOT_PASSWORD'
                   both must be specified for a user to be created
        EOF
        exit 1
    fi
if [ -z "$shouldPerformInitdb" ]; then
    # if we've got any /docker-entrypoint-initdb.d/* files to parse later, we should initdb
    for f in /docker-entrypoint-initdb.d/*; do
        case "$f" in
            *.sh|*.js) # this should match the set of files we check for below
                shouldPerformInitdb="$f"
                break
                ;;
        esac
    done
fi
# check for a few known paths (to determine whether we've already initialized and should thus skip our initdb scripts)
if [ -n "$shouldPerformInitdb" ]; then
    dbPath="$(_dbPath "$@")"
    for path in \
        "$dbPath/WiredTiger" \
        "$dbPath/journal" \
        "$dbPath/local.0" \
        "$dbPath/storage.bson" \
    ; do
        if [ -e "$path" ]; then
            shouldPerformInitdb=
            break
        fi
    done
fi
if [ -n "$shouldPerformInitdb" ]; then
    mongodHackedArgs=( "$@" )
    if _parse_config "$@"; then
        _mongod_hack_ensure_arg_val --config "$tempConfigFile" "${mongodHackedArgs[@]}"
    fi
    _mongod_hack_ensure_arg_val --bind_ip 127.0.0.1 "${mongodHackedArgs[@]}"
    _mongod_hack_ensure_arg_val --port 27017 "${mongodHackedArgs[@]}"
    _mongod_hack_ensure_no_arg --bind_ip_all "${mongodHackedArgs[@]}"
        # remove "--auth" and "--replSet" for our initial startup (see https://docs.mongodb.com/manual/tutorial/enable-authentication/#start-mongodb-without-access-control)
        # https://github.com/docker-library/mongo/issues/211
        _mongod_hack_ensure_no_arg --auth "${mongodHackedArgs[@]}"
        if [ "$MONGO_INITDB_ROOT_USERNAME" ] && [ "$MONGO_INITDB_ROOT_PASSWORD" ]; then
            _mongod_hack_ensure_no_arg_val --replSet "${mongodHackedArgs[@]}"
        fi
        sslMode="$(_mongod_hack_have_arg '--sslPEMKeyFile' "$@" && echo 'allowSSL' || echo 'disabled')" # "BadValue: need sslPEMKeyFile when SSL is enabled" vs "BadValue: need to enable SSL via the sslMode flag when using SSL configuration parameters"
        _mongod_hack_ensure_arg_val --sslMode "$sslMode" "${mongodHackedArgs[@]}"
        if stat "/proc/$$/fd/1" > /dev/null && [ -w "/proc/$$/fd/1" ]; then
            # https://github.com/mongodb/mongo/blob/38c0eb538d0fd390c6cb9ce9ae9894153f6e8ef5/src/mongo/db/initialize_server_global_state.cpp#L237-L251
            # https://github.com/docker-library/mongo/issues/164#issuecomment-293965668
            _mongod_hack_ensure_arg_val --logpath "/proc/$$/fd/1" "${mongodHackedArgs[@]}"
        else
            initdbLogPath="$(_dbPath "$@")/docker-initdb.log"
            echo >&2 "warning: initdb logs cannot write to '/proc/$$/fd/1', so they are in '$initdbLogPath' instead"
            _mongod_hack_ensure_arg_val --logpath "$initdbLogPath" "${mongodHackedArgs[@]}"
        fi
        _mongod_hack_ensure_arg --logappend "${mongodHackedArgs[@]}"
        pidfile="${TMPDIR:-/tmp}/docker-entrypoint-temp-mongod.pid"
        rm -f "$pidfile"
        _mongod_hack_ensure_arg_val --pidfilepath "$pidfile" "${mongodHackedArgs[@]}"
        "${mongodHackedArgs[@]}" --fork
        mongo=( mongo --host 127.0.0.1 --port 27017 --quiet )
        # check to see that our "mongod" actually did start up (catches "--help", "--version", MongoDB 3.2 being silly, slow prealloc, etc)
        # https://jira.mongodb.org/browse/SERVER-16292
        tries=30
        while true; do
            if ! { [ -s "$pidfile" ] && ps "$(< "$pidfile")" &> /dev/null; }; then
                # bail ASAP if "mongod" isn't even running
                echo >&2
                echo >&2 "error: $originalArgOne does not appear to have stayed running -- perhaps it had an error?"
                echo >&2
                exit 1
            fi
            if "${mongo[@]}" 'admin' --eval 'quit(0)' &> /dev/null; then
                # success!
                break
            fi
            (( tries-- ))
            if [ "$tries" -le 0 ]; then
                echo >&2
                echo >&2 "error: $originalArgOne does not appear to have accepted connections quickly enough -- perhaps it had an error?"
                echo >&2
                exit 1
            fi
            sleep 1
        done
        if [ "$MONGO_INITDB_ROOT_USERNAME" ] && [ "$MONGO_INITDB_ROOT_PASSWORD" ]; then
            rootAuthDatabase='admin'
            "${mongo[@]}" "$rootAuthDatabase" <<-EOJS
                db.createUser({
                    user: $(_js_escape "$MONGO_INITDB_ROOT_USERNAME"),
                    pwd: $(_js_escape "$MONGO_INITDB_ROOT_PASSWORD"),
                    roles: [ { role: 'root', db: $(_js_escape "$rootAuthDatabase") } ]
                })
            EOJS
        fi
        export MONGO_INITDB_DATABASE="${MONGO_INITDB_DATABASE:-test}"
        echo
        for f in /docker-entrypoint-initdb.d/*; do
            case "$f" in
                *.sh) echo "$0: running $f"; . "$f" ;;
                *.js) echo "$0: running $f"; "${mongo[@]}" "$MONGO_INITDB_DATABASE" "$f"; echo ;;
                *)    echo "$0: ignoring $f" ;;
            esac
            echo
        done
        "$@" --pidfilepath="$pidfile" --shutdown
        rm -f "$pidfile"
        echo
        echo 'MongoDB init process complete; ready for start up.'
        echo
    fi
    # MongoDB 3.6+ defaults to localhost-only binding
    haveBindIp=
    if _mongod_hack_have_arg --bind_ip "$@" || _mongod_hack_have_arg --bind_ip_all "$@"; then
        haveBindIp=1
    elif _parse_config "$@" && jq --exit-status '.net.bindIp // .net.bindIpAll' "$jsonConfigFile" > /dev/null; then
        haveBindIp=1
    fi
    if [ -z "$haveBindIp" ]; then
        # so if no "--bind_ip" is specified, let's add "--bind_ip_all"
        set -- "$@" --bind_ip_all
    fi
    unset "${!MONGO_INITDB_@}"
fi
rm -f "$jsonConfigFile" "$tempConfigFile"
exec "$@"
```

**3、** 在mongo目录下创建Dockerfile；

```sh
[root@ddkk.com mongo]# vi Dockerfile
```

```sh
然后输入以下内容
```

```sh
    FROM debian:jessie-slim
    # add our user and group first to make sure their IDs get assigned consistently, regardless of whatever dependencies get added
    RUN groupadd -r mongodb && useradd -r -g mongodb mongodb
    RUN apt-get update \
        && apt-get install -y --no-install-recommends \
            ca-certificates \
            jq \
            numactl \
        && rm -rf /var/lib/apt/lists/*
    # grab gosu for easy step-down from root (https://github.com/tianon/gosu/releases)
    ENV GOSU_VERSION 1.10
    # grab "js-yaml" for parsing mongod's YAML config files (https://github.com/nodeca/js-yaml/releases)
    ENV JSYAML_VERSION 3.10.0
    RUN set -ex; \
        \
        apt-get update; \
        apt-get install -y --no-install-recommends \
            wget \
        ; \
        rm -rf /var/lib/apt/lists/*; \
        \
        dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
        wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
        wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
        export GNUPGHOME="$(mktemp -d)"; \
        gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
        gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
        rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc; \
        chmod +x /usr/local/bin/gosu; \
        gosu nobody true; \
        \
        wget -O /js-yaml.js "https://github.com/nodeca/js-yaml/raw/${JSYAML_VERSION}/dist/js-yaml.js"; \
    # TODO some sort of download verification here
        \
        apt-get purge -y --auto-remove wget
    RUN mkdir /docker-entrypoint-initdb.d
    ENV GPG_KEYS \
    # pub   rsa4096 2017-11-15 [SC] [expires: 2019-11-15]
    #       BD8C 80D9 C729 D005 24E0  68E0 3DAB 7171 3396 F72B
    # uid           [ unknown] MongoDB 3.8 Release Signing Key <packaging@mongodb.com>
        BD8C80D9C729D00524E068E03DAB71713396F72B
    # https://docs.mongodb.com/manual/tutorial/verify-mongodb-packages/#download-then-import-the-key-file
    RUN set -ex; \
        export GNUPGHOME="$(mktemp -d)"; \
        for key in $GPG_KEYS; do \
            gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
        done; \
        gpg --export $GPG_KEYS > /etc/apt/trusted.gpg.d/mongodb.gpg; \
        rm -r "$GNUPGHOME"; \
        apt-key list
    # Allow build-time overrides (eg. to build image with MongoDB Enterprise version)
    # Options for MONGO_PACKAGE: mongodb-org OR mongodb-enterprise
    # Options for MONGO_REPO: repo.mongodb.org OR repo.mongodb.com
    # Example: docker build --build-arg MONGO_PACKAGE=mongodb-enterprise --build-arg MONGO_REPO=repo.mongodb.com .
    ARG MONGO_PACKAGE=mongodb-org-unstable
    ARG MONGO_REPO=repo.mongodb.org
    ENV MONGO_PACKAGE=${MONGO_PACKAGE} MONGO_REPO=${MONGO_REPO}
    ENV MONGO_MAJOR 3.7
    ENV MONGO_VERSION 3.7.9
    RUN echo "deb http://$MONGO_REPO/apt/debian jessie/${MONGO_PACKAGE%-unstable}/$MONGO_MAJOR main" | tee "/etc/apt/sources.list.d/${MONGO_PACKAGE%-unstable}.list"
    RUN set -x \
        && apt-get update \
        && apt-get install -y \
            ${MONGO_PACKAGE}=$MONGO_VERSION \
            ${MONGO_PACKAGE}-server=$MONGO_VERSION \
            ${MONGO_PACKAGE}-shell=$MONGO_VERSION \
            ${MONGO_PACKAGE}-mongos=$MONGO_VERSION \
            ${MONGO_PACKAGE}-tools=$MONGO_VERSION \
        && rm -rf /var/lib/apt/lists/* \
        && rm -rf /var/lib/mongodb \
        && mv /etc/mongod.conf /etc/mongod.conf.orig
    RUN mkdir -p /data/db /data/configdb \
        && chown -R mongodb:mongodb /data/db /data/configdb
    VOLUME /data/db /data/configdb
    COPY docker-entrypoint.sh /usr/local/bin/
    ENTRYPOINT ["docker-entrypoint.sh"]
    EXPOSE 27017
    CMD ["mongod"]
```

```sh
这些内容，基本都是官方给的 [Dockerfile][]
```

**4、** 通过Dockerfile创建一个镜像ms-mongodb，你可以替换成你自己的名字；

```sh
[root@ddkk.com mongo]#  docker build -t ms-mongo:3.7 .
```

**5、** 稍等片刻，创建完成后，可以在本地的镜像列表里查找到刚刚创建的镜像；

```sh
[root@ddkk.com mongo]# docker images  mongo:3.7
REPOSITORY   TAG   IMAGE ID      CREATED     SIZE
ms-mongo     3.7  f0f3e4beccef  11 days ago 323 MB
```

```sh
> 这次自己编译的竟然比官方镜像小....
```

> GitHub 下载加速
> 从GitHub 下载文件非常慢，因为下载链接指向了 Amazon 的服务器
>
> 下载地址是 http://github-cloud.s3.amazonaws.com/，从国内访问 Amazon 非常慢，所以总是下载失败，解决方法时更改 hosts 文件，使该域名指向香港的服务器
>
> 219.76.4.4 github-cloud.s3.amazonaws.com

## 运行 ms-mongo:3.7 容器

可以使用下面的命令运行我们刚刚创建的 ms-mongo:3.7 镜像

```sh
[root@ddkk.com mongo]# docker run -d -p 27017:27017 -v $PWD/db:/data/db ms-mongo:3.7
dbe5d334e0063332633fe78fcc031c26851cbb1c5d589d50414e7bd37471671d
```

参数说明:

**1、** -p27017:27017；

```sh
将容器的 27017 端口映射到主机的 27017 端口
```

**2、** -v `$` PWD/db:/data/db；

```sh
将主机中当前目录下的 db 挂载到容器的 /data/db，作为 mongo 数据存储目录
```

## 查看容器启动情况

```sh
[root@ddkk.com mongo]# docker ps -a 
CONTAINER ID  IMAGE          COMMAND                  ...
dbe5d334e006  ms-mongo:3.7   "docker-entrypoint.sh"   ...
```

## 查看容器的 IP

可以使用命令 docker inspect 查看容器的 IP

```sh
docker inspect --format '{{ .NetworkSettings.IPAddress }}' <container_id>
```

例如可以使用下面的命令查看刚刚创建的容器的 IP

```sh
[root@ddkk.com mongo] docker inspect --format '{{ .NetworkSettings.IPAddress }}' dbe5d334e006
172、17.0.2
```

## 连接到 mongo 镜像

可以使用 mongo 镜像执行 mongo 命令连接到刚启动的容器, 主机 IP 为 172.17.0.2

```sh
[root@ddkk.com mongo]# docker run -it ms-mongo:3.7 mongo --host 172.17.0.2
MongoDB shell version v3.6.5
connecting to: mongodb://172.17.0.2:27017/
MongoDB server version: 3.6.5
Welcome to the MongoDB shell.
For interactive help, type "help".
For more comprehensive documentation, see
    http://docs.mongodb.org/
Questions? Try the support group
    http://groups.google.com/group/mongodb-user
2018-05-18T14:01:20.078+0000 I STORAGE  [main] In File::open(), ::open for '/home/mongodb/.mongorc.js' failed with No such file or directory
Server has startup warnings: 
2018-05-18T13:59:12.821+0000 I CONTROL  [initandlisten] 
2018-05-18T13:59:12.821+0000 I CONTROL  [initandlisten] ** WARNING: Access control is not enabled for the database.
2018-05-18T13:59:12.821+0000 I CONTROL  [initandlisten] **          Read and write access to data and configuration is unrestricted.
2018-05-18T13:59:12.821+0000 I CONTROL  [initandlisten]
```
