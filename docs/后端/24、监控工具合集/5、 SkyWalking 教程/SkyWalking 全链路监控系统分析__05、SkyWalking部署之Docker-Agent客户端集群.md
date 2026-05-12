# 05、SkyWalking部署之Docker-Agent客户端集群
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/5.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 一、项目中配置agent.config

## 1、添加配置文件

【说明】在resources中添加SkyWalking配置文件agent.config。

## 2、修改配置文件

【说明】修改agent.config的配置项agent.application_code的值为当前应用的名称。

【示例】：

agent.application_code=mall-dubbo

## 3、打包环境支持agent.config配置文件

### 3.1修改package.xml文件

如上图，添加：agent.config

### 3.2修改pom.xml文件

如上图，添加：*.config

## 二、Dockerfile重写

## 1、基础镜像

【说明】基础镜像选用ccr.ccs.tencentyun.com/eqxiu/jre8-agent5。

**1、** SkyWalkingagent支持；

【说明】：需要添加两项配置，具体请查看步骤如2.1、2.2。

### 2.1配置文件拷贝

如图所示，添加一项配置：

RUN\cp -f /app/config/agent.config /skywalking/agent/config

### 2.2环境变量设置

如图所示，添加一项配置：

ENVJAVA_OPTS="$JAVA_OPTS -javaagent:/skywalking/agent/skywalking-agent.jar"
