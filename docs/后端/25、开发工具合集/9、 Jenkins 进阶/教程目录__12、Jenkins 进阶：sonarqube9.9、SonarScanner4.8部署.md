# 12、Jenkins 进阶：sonarqube9.9、SonarScanner4.8部署
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/12.html
- 分类：开发工具
- 分组：教程目录
### 一、安装java依赖

要求参考：https://docs.sonarqube.org/latest/requirements/prerequisites-and-overview/

#### 1.内核参数调整并重启

```java
vim  /etc/sysctl.d/sonarqube.conf
vm.max_map_count=262144
fs.file-max=65536
sysctl -p 
vim /etc/security/limits.conf
* hard nofile 65536
* soft nofile 65536
reboot
```

#### 2.安装java 17环境

**具体java版本参考实际安装的版本要求**

```java
tar xf jdk-17.0.6_linux-x64_bin.tar.gz -C /usr/local/
cd /usr/local/
ln -sv  jdk-17.0.6 java17
vim /etc/profile.d/java.sh
export JAVA_HOME=/usr/local/java17
export CLASSPATH=$JAVA_HOME/lib/tools.jar
export PATH=$JAVA_HOME/bin:$PATH 
. /etc/profile.d/java.sh
java -version
echo $JAVA_HOME
```

### 二、安装配置PostgreSQL 14数据库

#### 1.安装PostgreSQL

```java
yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
yum install -y postgresql14-server
echo 'export PGSETUP_INITDB_OPTIONS="-E UTF-8 --locale=zh_CN.UTF-8"' > /etc/profile.d/postgresql.sh
. /etc/profile.d/postgresql.sh
/usr/pgsql-14/bin/postgresql-14-setup initdb
systemctl enable postgresql-14
systemctl start postgresql-14
```

#### 2.配置sonar数据库相关配置

```java
su - postgres
psql -U postgres
alter user postgres with password '123456';
create database sonar; 
create user sonar;
alter user sonar with password '123456'; 
alter role sonar createdb;
alter role sonar superuser;
alter role sonar createrole;
alter database sonar owner to sonar;
postgres=# \l 查看数据库
                                     数据库列表
   名称    |  拥有者  | 字元编码 |  校对规则   |    Ctype    |       存取权限        
-----------+----------+----------+-------------+-------------+-----------------------
 postgres  | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | 
 sonar     | sonar    | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | 
 template0 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
(4 行记录)
postgres=# \du 查看用户
                             角色列表
 角色名称 |                    属性                    | 成员属于 
----------+--------------------------------------------+----------
 postgres | 超级用户, 建立角色, 建立 DB, 复制, 绕过RLS | {}
 sonar    | 超级用户, 建立角色, 建立 DB                | {}
postgres=# \q
```

#### 3.设置远程访问

```java
vim /var/lib/pgsql/14/data/postgresql.conf
listen_address = '*'
vim /var/lib/pgsql/14/data/pg_hba.conf
host    all             all             0.0.0.0/0               trust
systemctl restart postgresql-14
```

### 三、安装sonarqube

#### 1.下载社区版

**目前最新为9.9，其他版本下载：[https://www.sonarsource.com/products/sonarqube/downloads/historical-downloads/](https://www.sonarsource.com/products/sonarqube/downloads/historical-downloads/)**

#### 2.配置sonarqube

```java
unzip sonarqube-9.9.0.65466.zip -d /usr/local/
cd /usr/local/
ln -sv sonarqube-9.9.0.65466 sonarqube
cd sonarqube/conf/
vim sonar.properties 其他选项参考官方文档自行修改
#删除 ?currentSchema=my_schema，使用默认的public schema
sonar.jdbc.username=sonar
sonar.jdbc.password=123456
sonar.jdbc.url=jdbc:postgresql://192.168.1.134:5432/sonar 
sonar.web.host=0.0.0.0
sonar.web.port=9000
#添加全局环境变量
vim /etc/profile.d/sonarqube.sh
export SONAR_HOME=/usr/local/sonarqube
. /etc/profile.d/sonarqube.sh
chown -R sonar:sonar /usr/local/sonarqube-9.9.0.65466/
su - sonar
cd /usr/local/sonarqube/bin/linux-x86-64
./sonar.sh start
```

#### 3.访问web

http://192.168.1.134:9000/ 默认账户和密码admin/admin

#### 4.sonarqube排错方法

```java
在sonarqube安装目录下，相关启动及访问日志都写在logs目录下，如有问题查看对应日志文件
```

### 四、优化

#### 设置中文页面

**如果状态为 install pending,重启服务即可**

### 五、安装SonarScanner

**注意是在jenkins上安装，jdk版本最低11**

参考：[https://docs.sonarqube.org/latest/analyzing-source-code/scanners/sonarscanner/](https://docs.sonarqube.org/latest/analyzing-source-code/scanners/sonarscanner/)

#### 1.下载SonarScanner

#### 2.安装

```java
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
unzip sonar-scanner-cli-4.8.0.2856-linux.zip -d /usr/local/
cd /usr/local/
ln -sv sonar-scanner-4.8.0.2856-linux/ sonar-scanner
vim ~/.bash_profile 添加命令到path路径中
PATH=/usr/local/sonar-scanner/bin:/usr/local/node16/bin/:$PATH:$HOME/bin
. ~/.bash_profile
```

#### 3.验证

```java
sonar-scanner -h
INFO: 
INFO: usage: sonar-scanner [options]
INFO: 
INFO: Options:
INFO:  -D,--define <arg>     Define property
INFO:  -h,--help             Display help information
INFO:  -v,--version          Display version information
INFO:  -X,--debug            Produce execution debug output
```
