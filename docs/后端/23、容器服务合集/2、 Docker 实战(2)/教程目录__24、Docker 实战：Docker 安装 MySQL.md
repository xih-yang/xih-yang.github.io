# 24、Docker 实战：Docker 安装 MySQL
- 来源：https://ddkk.com/zhuanlan/container/docker/2/24.html
- 分类：容器服务
- 分组：教程目录
MySQL 是当下最流行的可免费使用的关系型数据库系统，Docker 安装 MySQL 有两种方法

我们以当前最新的版本 8.0.11 安装为例

## 1. docker pull mysql

这种方法非常适合只需要使用 MySQL 的开发者

**1、** 查找DockerHub上的mysql镜像；

```sh
[root@ddkk.com ~]# docker search mysql
NAME     DESCRIPTION                  OFFICIAL   
mysql    widely used, open-source...  [OK]       
mariadb  MariaDB is a ...             [OK]     
...
```

```sh
有很多版本，我们选择官方的 mysql
```

**2、** 拉取官方的镜像,标签为8.0.11；

```sh
[root@ddkk.com ~]# docker pull mysql:8.0.11
8.0.11: Pulling from library/mysql
```

**3、** 稍等片刻，就能在本地镜像列表里看到8.0.11了；

```sh
[root@ddkk.com ~]# docker images mysql
REPOSITORY    TAG      IMAGE ID       CREATED      SIZE
mysql         8.0.11   a8a59477268d   3 weeks ago  444.8 MB
```

## 2. 通过 Dockerfile 构建 MySQL

这种方式类似于自己编译安装，既可以不污染环境，又能学习如何编译安装 MySQL

**1、** 先创建目录mysql,用于存放后面的相关东西；

```sh
    [root@ddkk.com ~]# mkdir -p ~/mysql/data ~/mysql/logs ~/mysql/conf
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
   <td align="left">data</td> 
   <td align="left">该目录将映射为 mysql 容器配置的数据文件存放路径</td> 
  </tr> 
  <tr> 
   <td align="left">logs</td> 
   <td align="left">该目录将映射为 mysql 容器的日志目录</td> 
  </tr> 
  <tr> 
   <td align="left">conf</td> 
   <td align="left">该目录里的配置文件将映射为 mysql 容器的配置文件</td> 
  </tr> 
 </tbody> 
</table>
```

**2、** 进入创建的mysql目录，创建conf/my.cnf文件；

```sh
[root@ddkk.com ~] cd mysql
[root@ddkk.com mysql] vi conf/my.cnf
```

```sh
然后输入以下内容
```

```sh
[mysqld]
pid-file        = /var/run/mysqld/mysqld.pid
socket          = /var/run/mysqld/mysqld.sock
datadir         = /var/lib/mysql
secure-file-priv= NULL
symbolic-links=0
# Custom config should go here
!includedir /etc/mysql/conf.d/
```

**3、** 创建docker-entrypoint.sh文件；

```sh
[root@ddkk.com mysql]# touch docker-entrypoint.sh
[root@ddkk.com mysql]# chmod +x docker-entrypoint.sh
[root@ddkk.com mysql]# vi docker-entrypoint.sh
```

```sh
然后复制以下内容
```

```sh
# !/bin/bash
# 删除第一行 # ! 之间的空格
set -eo pipefail
shopt -s nullglob
# if command starts with an option, prepend mysqld
if [ "${1:0:1}" = '-' ]; then
    set -- mysqld "$@"
fi
# skip setup if they want an option that stops mysqld
wantHelp=
for arg; do
    case "$arg" in
        -'?'|--help|--print-defaults|-V|--version)
            wantHelp=1
            break
            ;;
    esac
done
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
# usage: process_init_file FILENAME MYSQLCOMMAND...
#    ie: process_init_file foo.sh mysql -uroot
# (process a single initializer file, based on its extension. we define this
# function here, so that initializer scripts (*.sh) can use the same logic,
# potentially recursively, or override the logic used in subsequent calls)
process_init_file() {
    local f="$1"; shift
    local mysql=( "$@" )
    case "$f" in
        *.sh)     echo "$0: running $f"; . "$f" ;;
        *.sql)    echo "$0: running $f"; "${mysql[@]}" < "$f"; echo ;;
        *.sql.gz) echo "$0: running $f"; gunzip -c "$f" | "${mysql[@]}"; echo ;;
        *)        echo "$0: ignoring $f" ;;
    esac
    echo
}
_check_config() {
    toRun=( "$@" --verbose --help )
    if ! errors="$("${toRun[@]}" 2>&1 >/dev/null)"; then
        cat >&2 <<-EOM
            ERROR: mysqld failed while attempting to check config
            command was: "${toRun[*]}"
            $errors
        EOM
        exit 1
    fi
}
# Fetch value from server config
# We use mysqld --verbose --help instead of my_print_defaults because the
# latter only show values present in config files, and not server defaults
_get_config() {
    local conf="$1"; shift
    "$@" --verbose --help --log-bin-index="$(mktemp -u)" 2>/dev/null \
        | awk '$1 == "'"$conf"'" && /^[^ \t]/ { sub(/^[^ \t]+[ \t]+/, ""); print; exit }'
    # match "datadir      /some/path with/spaces in/it here" but not "--xyz=abc\n     datadir (xyz)"
}
# allow the container to be started with --user
if [ "$1" = 'mysqld' -a -z "$wantHelp" -a "$(id -u)" = '0' ]; then
    _check_config "$@"
    DATADIR="$(_get_config 'datadir' "$@")"
    mkdir -p "$DATADIR"
    chown -R mysql:mysql "$DATADIR"
    exec gosu mysql "$BASH_SOURCE" "$@"
fi
if [ "$1" = 'mysqld' -a -z "$wantHelp" ]; then
    # still need to check config, container may have started with --user
    _check_config "$@"
    # Get config
    DATADIR="$(_get_config 'datadir' "$@")"
    if [ ! -d "$DATADIR/mysql" ]; then
        file_env 'MYSQL_ROOT_PASSWORD'
        if [ -z "$MYSQL_ROOT_PASSWORD" -a -z "$MYSQL_ALLOW_EMPTY_PASSWORD" -a -z "$MYSQL_RANDOM_ROOT_PASSWORD" ]; then
            echo >&2 'error: database is uninitialized and password option is not specified '
            echo >&2 '  You need to specify one of MYSQL_ROOT_PASSWORD, MYSQL_ALLOW_EMPTY_PASSWORD and MYSQL_RANDOM_ROOT_PASSWORD'
            exit 1
        fi
        mkdir -p "$DATADIR"
        echo 'Initializing database'
        "$@" --initialize-insecure
        echo 'Database initialized'
        if command -v mysql_ssl_rsa_setup > /dev/null && [ ! -e "$DATADIR/server-key.pem" ]; then
            # https://github.com/mysql/mysql-server/blob/23032807537d8dd8ee4ec1c4d40f0633cd4e12f9/packaging/deb-in/extra/mysql-systemd-start#L81-L84
            echo 'Initializing certificates'
            mysql_ssl_rsa_setup --datadir="$DATADIR"
            echo 'Certificates initialized'
        fi
        SOCKET="$(_get_config 'socket' "$@")"
        "$@" --skip-networking --socket="${SOCKET}" &
        pid="$!"
        mysql=( mysql --protocol=socket -uroot -hlocalhost --socket="${SOCKET}" )
        for i in {30..0}; do
            if echo 'SELECT 1' | "${mysql[@]}" &> /dev/null; then
                break
            fi
            echo 'MySQL init process in progress...'
            sleep 1
        done
        if [ "$i" = 0 ]; then
            echo >&2 'MySQL init process failed.'
            exit 1
        fi
        if [ -z "$MYSQL_INITDB_SKIP_TZINFO" ]; then
            # sed is for https://bugs.mysql.com/bug.php?id=20545
            mysql_tzinfo_to_sql /usr/share/zoneinfo | sed 's/Local time zone must be set--see zic manual page/FCTY/' | "${mysql[@]}" mysql
        fi
        if [ ! -z "$MYSQL_RANDOM_ROOT_PASSWORD" ]; then
            export MYSQL_ROOT_PASSWORD="$(pwgen -1 32)"
            echo "GENERATED ROOT PASSWORD: $MYSQL_ROOT_PASSWORD"
        fi
        rootCreate=
        # default root to listen for connections from anywhere
        file_env 'MYSQL_ROOT_HOST' '%'
        if [ ! -z "$MYSQL_ROOT_HOST" -a "$MYSQL_ROOT_HOST" != 'localhost' ]; then
            # no, we don't care if read finds a terminating character in this heredoc
            # https://unix.stackexchange.com/questions/265149/why-is-set-o-errexit-breaking-this-read-heredoc-expression/265151#265151
            read -r -d '' rootCreate <<-EOSQL || true
                CREATE USER 'root'@'${MYSQL_ROOT_HOST}' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}' ;
                GRANT ALL ON *.* TO 'root'@'${MYSQL_ROOT_HOST}' WITH GRANT OPTION ;
            EOSQL
        fi
        "${mysql[@]}" <<-EOSQL
            -- What's done in this file shouldn't be replicated
            --  or products like mysql-fabric won't work
            SET @@SESSION.SQL_LOG_BIN=0;
            ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}' ;
            GRANT ALL ON *.* TO 'root'@'localhost' WITH GRANT OPTION ;
            ${rootCreate}
            DROP DATABASE IF EXISTS test ;
            FLUSH PRIVILEGES ;
        EOSQL
        if [ ! -z "$MYSQL_ROOT_PASSWORD" ]; then
            mysql+=( -p"${MYSQL_ROOT_PASSWORD}" )
        fi
        file_env 'MYSQL_DATABASE'
        if [ "$MYSQL_DATABASE" ]; then
            echo "CREATE DATABASE IF NOT EXISTS \$MYSQL_DATABASE\ ;" | "${mysql[@]}"
            mysql+=( "$MYSQL_DATABASE" )
        fi
        file_env 'MYSQL_USER'
        file_env 'MYSQL_PASSWORD'
        if [ "$MYSQL_USER" -a "$MYSQL_PASSWORD" ]; then
            echo "CREATE USER '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD' ;" | "${mysql[@]}"
            if [ "$MYSQL_DATABASE" ]; then
                echo "GRANT ALL ON \$MYSQL_DATABASE\.* TO '$MYSQL_USER'@'%' ;" | "${mysql[@]}"
            fi
            echo 'FLUSH PRIVILEGES ;' | "${mysql[@]}"
        fi
        echo
        for f in /docker-entrypoint-initdb.d/*; do
            process_init_file "$f" "${mysql[@]}"
        done
        if [ ! -z "$MYSQL_ONETIME_PASSWORD" ]; then
            "${mysql[@]}" <<-EOSQL
                ALTER USER 'root'@'%' PASSWORD EXPIRE;
            EOSQL
        fi
        if ! kill -s TERM "$pid" || ! wait "$pid"; then
            echo >&2 'MySQL init process failed.'
            exit 1
        fi
        echo
        echo 'MySQL init process done. Ready for start up.'
        echo
    fi
fi
exec "$@"
```

**4、** 创建Dockerfile；

```sh
[root@ddkk.com ~]# vi Dockerfile
```

```sh
然后输入以下内容
```

```sh
FROM debian:stretch-slim
# add our user and group first to make sure their IDs get assigned consistently, regardless of whatever dependencies get added
RUN groupadd -r mysql && useradd -r -g mysql mysql
RUN apt-get update && apt-get install -y --no-install-recommends gnupg dirmngr && rm -rf /var/lib/apt/lists/*
# add gosu for easy step-down from root
ENV GOSU_VERSION 1.7
RUN set -x \
    && apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/* \
    && wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
    && chmod +x /usr/local/bin/gosu \
    && gosu nobody true \
    && apt-get purge -y --auto-remove ca-certificates wget
RUN mkdir /docker-entrypoint-initdb.d
RUN apt-get update && apt-get install -y --no-install-recommends \
# for MYSQL_RANDOM_ROOT_PASSWORD
        pwgen \
# for mysql_ssl_rsa_setup
        openssl \
# FATAL ERROR: please install the following Perl modules before executing /usr/local/mysql/scripts/mysql_install_db:
# File::Basename
# File::Copy
# Sys::Hostname
# Data::Dumper
    perl \
&& rm -rf /var/lib/apt/lists/*
ENV MYSQL_MAJOR 8.0
ENV MYSQL_VERSION 8.0.11-1debian9
RUN echo "deb http://repo.mysql.com/apt/debian/ stretch mysql-${MYSQL_MAJOR}" > /etc/apt/sources.list.d/mysql.list
# the "/var/lib/mysql" stuff here is because the mysql-server postinst doesn't have an explicit way to disable the mysql_install_db codepath besides having a database already "configured" (ie, stuff in /var/lib/mysql/mysql)
# also, we set debconf keys to make APT a little quieter
RUN { \
        echo mysql-community-server mysql-community-server/data-dir select ''; \
        echo mysql-community-server mysql-community-server/root-pass password ''; \
        echo mysql-community-server mysql-community-server/re-root-pass password ''; \
        echo mysql-community-server mysql-community-server/remove-test-db select false; \
    } | debconf-set-selections \
    && apt-get update && apt-get install -y mysql-community-client-core="${MYSQL_VERSION}" mysql-community-server-core="${MYSQL_VERSION}" --allow-unauthenticated && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/lib/mysql && mkdir -p /var/lib/mysql /var/run/mysqld \
    && chown -R mysql:mysql /var/lib/mysql /var/run/mysqld \
# ensure that /var/run/mysqld (used for socket and lock files) is writable regardless of the UID our mysqld instance ends up having at runtime
    && chmod 777 /var/run/mysqld
VOLUME /var/lib/mysql
# Config files
COPY conf/ /etc/mysql/
COPY docker-entrypoint.sh /usr/local/bin/
RUN ln -s usr/local/bin/docker-entrypoint.sh /entrypoint.sh # backwards compat
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 3306
CMD ["mysqld"]
```

**5、** 通过Dockerfile创建镜像my-mysql:8.0.11；

```sh
[root@ddkk.com mysql]# docker build -t my-mysql:8.0.11 .
```

**6、** 稍等片刻，创建完成后，可以在本地的镜像列表里查找到刚刚创建的镜像；

```sh
[root@ddkk.com ~]# docker images my-mysql
REPOSITORY    TAG      IMAGE ID       CREATED      SIZE
my-mysql      8.0.11   e730da928e07   11 days ago  444 MB
```

## 运行 mysql 镜像

可以使用下面的命令运行 mysql 容器

```sh
[root@ddkk.com mysql]# docker run -p 3306:3306 --name mysql -v $PWD/logs:/logs -v $PWD/data:/mysql_data -e MYSQL_ROOT_PASSWORD=123456 -d mysql:8.0.11
4d53f278d7e1273c4b503e98d46cbb571fe0b496a141467ebf7dae9ee57baf59
```

参数说明

**1、** -p3306:3306；

```sh
将容器的 3306 端口映射到主机的 3306 端口
```

**2、** -v `$` PWD/logs:/logs；

```sh
将主机当前目录下的 logs 目录挂载到容器的 /logs
```

**3、** -v `$` PWD/data:/mysql_data；

```sh
将主机当前目录下的 data 目录挂载到容器的 /mysql_data
```

**4、** -eMYSQL_ROOT_PASSWORD=123456初始化root用户的密码；

如果你想要定制 my.cnf 可以使用下面的参数挂载 my.cnf 文件

```sh
-v $PWD/conf/my.cnf:/etc/mysql/my.cnf
```

## 查看容器启动情况

```sh
[root@ddkk.com mysql] docker ps -a
CONTAINER ID    IMAGE         COMMAND                  ...
839d8e8585e8    my-mysql:8.0.11  "docker-entrypoint.sh"   ...
```
