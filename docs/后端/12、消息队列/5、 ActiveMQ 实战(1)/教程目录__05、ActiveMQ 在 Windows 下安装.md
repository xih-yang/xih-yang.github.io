# 05、ActiveMQ 在 Windows 下安装
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/5.html
- 分类：消息队列
- 分组：教程目录
## 1、安装 ActiveMQ

安装 ActiveMQ

### 1、下载地址

Apache Active MQ的官网 ：[ActiveMQ](http://activemq.apache.org/)

下载地址： [Redirecting…](http://activemq.apache.org/activemq-5159-release.html)

### 2、解压，解压后文件目录：

## 2、使用 ActiveMQ

使用 ActiveMQ

### 1、启动

### 2、 进入的页面

启动完成之后，在浏览器中输入下面的网址：http://localhost:8161/admin

**用户名和密码如下：**

admin/admin

apache-activemq-5.15.2\conf这个目录，找到jetty-realm.properties文件（该文件保存着用户名和密码信息），如下图所示：

端口号等的配置在apache-activemq-5.15.2\conf下的jetty.xml文件中

### 3、创建队列

访问**Queues**菜单，输入队列名，点击创建按钮，创建队列；

### 4、设置

在操作列点击**Send To**操作项，发送消息到**FIRST_QUEUE**队列。如下图所示，发送了一条消息到first_queue队列，消息过期时间为**300000毫秒**，即5分钟。

### 5、发送完成

消息发送完成后，自动跳转到队列列表页面，显示存在队列first_queue，待处理消息1条，入列消息1条，出列消息0条。

### 6、查看消息

点击列表中的Browse操作项，查看first_queue队列中的消息列表。可以看到于2022-01-06 16:35:15:245 CST发送了一条持久化的消息。

### 7、停止运行activemq

只需要在dos下按下ctrl+c即可

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
