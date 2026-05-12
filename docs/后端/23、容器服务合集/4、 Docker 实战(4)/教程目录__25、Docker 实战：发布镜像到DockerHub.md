# 25、Docker 实战：发布镜像到DockerHub
- 来源：https://ddkk.com/zhuanlan/container/docker/4/25.html
- 分类：容器服务
- 分组：教程目录
```java
# step-1 注册账号
https://hub.docker.com/
# step-2 在服务器尚提交我们的镜像
[root@ddkk.com WEB-INF]# docker login --help
Usage: docker login [OPTIONS] [SERVER]
Log in to a Docker registry.
If no server is specified, the default is defined by the daemon.
Options:
-p, --password string   Password
--password-stdin    Take the password from stdin
-u, --username string   Username
[root@ddkk.com WEB-INF]# docker login -u gelaotou
Password:
WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store
Login Succeeded
```

```java
# step-3 在服务器尚提交我们的镜像
[root@ddkk.com WEB-INF]# docker push diytomcat
Using default tag: latest
The push refers to repository [docker.io/library/diytomcat]
7eac4b6854fa: Preparing
3dd2e24e54bc: Preparing
fc06d55fbf5f: Preparing
denied: requested access to the resource is denied
#提交报错处理，因为没有版本号
[root@ddkk.com WEB-INF]# docker tag c18dbee63b6a  gelaotou/diytomcat:1.0
[root@ddkk.com WEB-INF]# docker push gelaotou/diytomcat:1.0
The push refers to repository [docker.io/gelaotou/diytomcat]
7eac4b6854fa: Pushed
3dd2e24e54bc: Pushed
fc06d55fbf5f: Pushed
3f2369e46cc3: Pushed
2653d992f4ef: Pushed
1.0: digest: sha256:60c0b82f8bbab61933658c71ea44f27905fc76308c351ba91908223be0764b90 size: 1373
```
