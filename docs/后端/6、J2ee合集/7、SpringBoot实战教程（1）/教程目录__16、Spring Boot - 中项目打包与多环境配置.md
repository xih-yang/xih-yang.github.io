# 16、Spring Boot - 中项目打包与多环境配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/16.html
- 分类：J2EE框架
- 分组：教程目录
## 1.Spring Boot 项目打包

### 1.Spring Boot 的打包插件

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

### 2.项目打包方式

### 3.运行命令

注意：需要正确的配置环境变量。

运行命令：java -jar 项目的名称

## 2.Spring Boot 的多环境配置

- 语法结构：application-{profile}.properties/yml
- profile：代表某个配置环境的标识

**示例：**

- application-dev.properties/yml 开发环境
- application-test.properties/yml 测试环境
- application-prod.properties/yml 生产环境

### 1.Windows 环境下启动方式（黑窗口中）

java -jar xxx.jar --spring.profiles.active={profile}

### 2.在 Linux 环境下启动方式

#### 1.安装上传下载工具

- 安装命令：yum install lrzsz -y
- 上传命令：rz
- 下载命令：sz 下载文件名

#### 2.启动脚本的使用

- 修改脚本文件中的参数值
- 将启动脚本文件上传到 Linux 中
- 分配执行权限：chmod 777
- 通过脚本启动命令：server.sh start
- 通过脚本关闭命令：server.sh stop

**脚本文件：**

```java
#!/bin/bash
cd dirname $0
CUR_SHELL_DIR=pwd
CUR_SHELL_NAME=basename ${
     BASH_SOURCE}
JAR_NAME="项目名称"
JAR_PATH=$CUR_SHELL_DIR/$JAR_NAME
#JAVA_MEM_OPTS=" -server -Xms1024m -Xmx1024m -XX:PermSize=128m"
JAVA_MEM_OPTS=""
#如果是多环境配置需要在该选项中指定profile
SPRING_PROFILES_ACTIV="-Dspring.profiles.active=配置文件profile名称"
#如果没有多环境配置将 SPRING_PROFILES_ACTIV注释掉，将SPRING_PROFILES_ACTIV=""释放开
#SPRING_PROFILES_ACTIV=""
LOG_DIR=$CUR_SHELL_DIR/logs
LOG_PATH=$LOG_DIR/${
     JAR_NAME%..log
echo_help()
{
    echo -e "syntax: sh $CUR_SHELL_NAME start|stop"
}
if [ -z $1 ];then
    echo_help
    exit 1
fi
if [ ! -d "$LOG_DIR" ];then
    mkdir "$LOG_DIR"
fi
if [ ! -f "$LOG_PATH" ];then
    touch "$LOG_DIR"
fi
if [ "$1" == "start" ];then
    check server
    PIDS=ps --no-heading -C java -f --width 1000 | grep $JAR_NAME | awk '{print $2}'
    if [ -n "$PIDS" ]; then
        echo -e "ERROR: The $JAR_NAME already started and the PID is ${PIDS}."
        exit 1
    fi
    echo "Starting the $JAR_NAME..."
    start
    nohup java $JAVA_MEM_OPTS -jar $SPRING_PROFILES_ACTIV $JAR_PATH >> $LOG_PATH 2>&1 &
    COUNT=0
    while [ $COUNT -lt 1 ]; do
        sleep 1
        COUNT=ps  --no-heading -C java -f --width 1000 | grep "$JAR_NAME" | awk '{print $2}' | wc -l
        if [ $COUNT -gt 0 ]; then
            break
        fi
    done
    PIDS=ps  --no-heading -C java -f --width 1000 | grep "$JAR_NAME" | awk '{print $2}'
    echo "${JAR_NAME} Started and the PID is ${PIDS}."
    echo "You can check the log file in ${LOG_PATH} for details."
elif [ "$1" == "stop" ];then
    PIDS=ps --no-heading -C java -f --width 1000 | grep $JAR_NAME | awk '{print $2}'
    if [ -z "$PIDS" ]; then
        echo "ERROR:The $JAR_NAME does not started!"
        exit 1
    fi
    echo -e "Stopping the $JAR_NAME..."
    for PID in $PIDS; do
        kill $PID > /dev/null 2>&1
    done
    COUNT=0
    while [ $COUNT -lt 1 ]; do
        sleep 1
        COUNT=1
        for PID in $PIDS ; do
            PID_EXIST=ps --no-heading -p $PID
            if [ -n "$PID_EXIST" ]; then
                COUNT=0
                break
            fi
        done
    done
    echo -e "${JAR_NAME} Stopped and the PID is ${PIDS}."
else
    echo_help
    exit 1
fi
```
