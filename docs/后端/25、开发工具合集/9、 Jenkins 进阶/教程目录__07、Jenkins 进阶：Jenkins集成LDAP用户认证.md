# 07、Jenkins 进阶：Jenkins集成LDAP用户认证
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/7.html
- 分类：开发工具
- 分组：教程目录
## 一、.部署LDAP

这里使用容器部署，手动部署参考：[https://www.cnblogs.com/panwenbin-logs/p/16101045.html](https://www.cnblogs.com/panwenbin-logs/p/16101045.html)

```java
1.安装docker
wget -P /etc/yum.repos.d/  https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum clean all  && yum makecache fast
yum install docker-ce -y
systemctl start docker && systemctl enable docker
docker -v
2.下载镜像
docker pull osixia/openldap
docker pull osixia/phpldapadmin
3.运行镜像
docker run \
    -d \
    -p 389:389 \
    -p 636:636 \
    -v /usr/local/ldap:/usr/local/ldap \
    -v /data/openldap/ldap:/var/lib/ldap \
    -v /data/openldap/slapd.d:/etc/ldap/slapd.d \
    --env LDAP_ORGANISATION="devops" \
    --env LDAP_DOMAIN="devops.com" \
    --env LDAP_ADMIN_PASSWORD="123456" \
    --name openldap \
    --hostname openldap-host\
    --network bridge \
    osixia/openldap
参数解释：
    -v /data/openldap/ldap:/var/lib/ldap：将数据持久化到本地
    其中 -p 389:389 TCP/IP访问端口，-p 636:636 SSL连接端口。
    –name your_ldap 自行设置容器名称
    –network bridge 连接默认的bridge网络（docker0）
    –hostname openldap-host 设置容器主机名称为 openldap-host
    –env LDAP_ORGANISATION=“company” 配置LDAP组织名称
    –env LDAP_DOMAIN=“company.com” 配置LDAP域名
    –env LDAP_ADMIN_PASSWORD=“123456” 配置LDAP密码
docker run -d  -p 80:80 --privileged --name  ldapadmin --env PHPLDAPADMIN_HTTPS=false --env PHPLDAPADMIN_LDAP_HOSTS=192.168.1.129 --detach osixia/phpldapadmin
参数解释：
    –privileged 特权模式启动(使用该参数，container内的root拥有真正的root权限。否则，container内的root只是外部的一个普通用户权限。)
    –env PHPLDAPADMIN_HTTPS=false 禁用HTTPS
    –env PHPLDAPADMIN_LDAP_HOSTS =172.17.148.238 配置openLDAP的IP或者域名，我的openLDAP是在服务器172.17.148.238启动。
    -p 此处设置访问端口为80，可自行更改访问端口号
docker ps检查是否运行正常
```

### 2.访问

http://192.168.1.129 #所在服务器IP，注意用户名

### 3.解决报错

解决方法：

```java
docker exec -it 661334ab40f3 /bin/bash 进入LDAP容器，非admin
cd /etc/ldap/
echo """dn: dc=jenkins,dc=com
o: jenkins
objectclass: dcObject
objectclass: organization""" > base.ldif
ldapadd -f base.ldif -x -D cn=admin,dc=devops,dc=com -W输入admin的密码 123456　
```

重新登录，问题解决

## 二、创建jenkins测试用户

### 1.创建jenkins OU

选择Organisational unit 组织单元

输入OU名称jenkins，创建

确认提交

查看结果

### 2.创建jenkins测试用户

选择OU->选择新建子条目

选择默认模板

选择inetorgperson,并继续

设置CN SN(用户名称，保持一致即可)及密码

提交，并确认

检查结果

### 3.创建访问DN ，步骤同上

## 三、jenkins集成LDAP

### 1. 安装LDAP插件

### 2.设置匿名用户可以访问，避免LDAP配置有问题无法登录

### 3.配置jenkins使用LDAP

保存，注销使用jenkins-user01测试用户登录
