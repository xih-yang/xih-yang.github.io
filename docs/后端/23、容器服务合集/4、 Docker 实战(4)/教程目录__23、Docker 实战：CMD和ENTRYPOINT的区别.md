# 23、Docker 实战：CMD和ENTRYPOINT的区别
- 来源：https://ddkk.com/zhuanlan/container/docker/4/23.html
- 分类：容器服务
- 分组：教程目录
### CMD和ENTRYPOINT的区别

```java
CMD           指定这个容器启动的时候要运行的命令，只有最后一个会生效，可被替代
ENTRYPOINT    指定这个容器启动的时候要运行的命令，可以追加命令
```

**测试CMD**

```java
# 编写 dockerfile文件
[root@ddkk.com dockerfile]# vim DockerFile-cmd
FROM centos
CMD ["ls","-a"]
# 构建镜像
[root@ddkk.com dockerfile]# docker build -f DockerFile-cmd -t cmdtest .
[root@ddkk.com dockerfile]# docker images
REPOSITORY            TAG       IMAGE ID       CREATED          SIZE
cmdtest               latest    3160b7785cc7   15 seconds ago   209MB
# 运行镜像
[root@ddkk.com dockerfile]# docker run 3160b7785cc7
.
..
.dockerenv
bin
dev
etc
home
lib
lib64
lost+found
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
# 想追加一个命令 -l 即ls -al
[root@ddkk.com dockerfile]# docker run 3160b7785cc7 -l
docker: Error response from daemon: OCI runtime create failed: container_linux.go:380: starting container process caused: exec: "-l": executable file not found in $PATH: unknown.
# cmd的情况下，-l会替代CMD ["ls","-a"]命令，-l不是命令所以报错
```

**测试ENTRYPOINT**

```java
[root@ddkk.com dockerfile]# vim DockerFile-ENTRYPOINT
FROM centos
ENTRYPONIT ["ls","-a"]
[root@ddkk.com dockerfile]# docker build -f DockerFile-ENTRYPOINT -t entrypoint-test .
Sending build context to Docker daemon  4.096kB
Step 1/2 : FROM centos
 ---> 300e315adb2f
Step 2/2 : ENTRYPOINT ["ls","-a"]
 ---> Running in 4b061853bebd
Removing intermediate container 4b061853bebd
 ---> 6ef0aa48e5e2
Successfully built 6ef0aa48e5e2
Successfully tagged entrypoint-test:latest
[root@ddkk.com dockerfile]# docker images
REPOSITORY            TAG       IMAGE ID       CREATED          SIZE
entrypoint-test       latest    6ef0aa48e5e2   11 seconds ago   209MB
[root@ddkk.com dockerfile]# docker run 6ef0aa48e5e2
.
..
.dockerenv
bin
dev
etc
home
lib
lib64
lost+found
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
# 我们的追加命令，是直接拼在我们的ENTRYPOINT命令的后面
[root@ddkk.com dockerfile]# docker run 6ef0aa48e5e2 -l
total 0
drwxr-xr-x.   1 root root   6 Aug 30 07:04 .
drwxr-xr-x.   1 root root   6 Aug 30 07:04 ..
-rwxr-xr-x.   1 root root   0 Aug 30 07:04 .dockerenv
lrwxrwxrwx.   1 root root   7 Nov  3  2020 bin -> usr/bin
drwxr-xr-x.   5 root root 340 Aug 30 07:04 dev
drwxr-xr-x.   1 root root  66 Aug 30 07:04 etc
drwxr-xr-x.   2 root root   6 Nov  3  2020 home
lrwxrwxrwx.   1 root root   7 Nov  3  2020 lib -> usr/lib
lrwxrwxrwx.   1 root root   9 Nov  3  2020 lib64 -> usr/lib64
drwx------.   2 root root   6 Dec  4  2020 lost+found
drwxr-xr-x.   2 root root   6 Nov  3  2020 media
drwxr-xr-x.   2 root root   6 Nov  3  2020 mnt
drwxr-xr-x.   2 root root   6 Nov  3  2020 opt
dr-xr-xr-x. 255 root root   0 Aug 30 07:04 proc
dr-xr-x---.   2 root root 162 Dec  4  2020 root
drwxr-xr-x.  11 root root 163 Dec  4  2020 run
lrwxrwxrwx.   1 root root   8 Nov  3  2020 sbin -> usr/sbin
drwxr-xr-x.   2 root root   6 Nov  3  2020 srv
dr-xr-xr-x.  13 root root   0 Aug 24 13:01 sys
drwxrwxrwt.   7 root root 145 Dec  4  2020 tmp
drwxr-xr-x.  12 root root 144 Dec  4  2020 usr
drwxr-xr-x.  20 root root 262 Dec  4  2020 var
```
