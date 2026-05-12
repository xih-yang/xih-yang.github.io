# 17、JMeter 实战 - 目录结构
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/17.html
- 分类：开发工具
- 分组：教程目录
首先得了解一下这些东西，以后才能快速的找到某些配置文件进行修改（举个例子，改配置只是其中之一）

## 一、bin目录

examples:　　　　　　　 目录中有CSV样例

jmeter.bat 　　　　　　　windows的启动文件

jmeter.log 　　　　　　　jmeter运行日志文件

jmeter.sh 　　　　　　　 linux的启动文件

jmeter.properties 　　 系统配置文件

jmeter-server.bat windows分布式测试要用到的服务器配置

jmeters-server linux分布式测试要用的服务器配置

其中系统配置文件中的SSL设置重点关注如下几个：

# 指定HTTPS协议层

https.default.protocol=TLS

# 指定SSL版本

https.default.protocol=SSLv3

# 设置启动的协议

https.socket.protocols=SSLv2Hello SSLv3 TLSv1

# 缓存控制，控制SSL是否可以在多个迭代中重用

https.use.cached.ssl.context=true

## 二、docs目录

接口文档目录。例C:\apache-jmeter-3.0\docs\api下的index.html

## 三、extras目录

扩展插件目录。提供了对Ant的支持，可以使用Ant来实现自动化测试，例如批量脚本执行，产生html格式的报表，测试运行时，可以把测试数据记录下来，jmeter会

自动生成一个.jtl文件，将该文件放到extras目录下，运行"ant -Dtest=文件名 report"，就可以生成测试统计报表。

## 四、lib目录

所用到的插件目录，里面均为jar包。jmeter会自动在jmeter_HOME/lib和ext目录下寻找需要的类，lib下存放JMeter所依赖的外部jar，

如：httpclient.jar、httpcore.jar、httpmime.jar等等。

其中lib\ext目录下存放有Jmeter依赖的核心jar包，ApacheJMeter_core.jar、ApacheJMeter_java.jar在写client端需要引用，JMeter插件包也在此目录下。

lib\junit下存放junit测试脚本.

## 五、Licenses目录

jmeter证书目录

## 六、Printable_docs目录

用户使用手册，例C:\apache-jmeter-3.0\printable_docs下的index.html
