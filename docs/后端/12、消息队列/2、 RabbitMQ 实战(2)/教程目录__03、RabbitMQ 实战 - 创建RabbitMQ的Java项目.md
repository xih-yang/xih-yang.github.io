# 03、RabbitMQ 实战 - 创建RabbitMQ的Java项目
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/3.html
- 分类：消息队列
- 分组：教程目录
**1、** 新建空项目；

**2、** 给项目起名称；

**3、** 创建空项目后为空项目创建Maven模块；

(1)新建模块

(2)选择Maven模块

(3)为模块创建名称

**4、** 给新建的项目设置JDK；

(1)打开项目结构

(2)把项目的JDK版本设置为JDK1.8

(3)把模块的JDK版本设置为JDK1.8

**5、** 为项目设置Maven依赖和Maven仓库；

(1)打开

设置

(2)搜索Maven，然后分别根据自己的情况配置Maven

**6、** 获取RabbitMQ客户端的依赖；

(1)进入maven中央仓库

[https://mvnrepository.com/](https://mvnrepository.com/)

(2)搜索RabbitMQ

(3)选择适当版本的RabbitMQ依赖（我这里相对新的，然后较多人使用的依赖，有时候不是越新越好，新版的有时候可能没有旧版的稳定）

(4)复制Maven依赖到pom.xml文件里

**7、** 获取ApachCommonsIO的依赖，后续会用到；

(1)搜索 IO

(2)选择适当版本的IO依赖

(3)复制Maven依赖到pom.xml文件里

**8、** 加载Maven下载依赖包；

**9、** 查看是否下载依赖成功，若依赖项里有依赖，则证明依赖包下载成功；

**10、** 新建目录；

效果图：
