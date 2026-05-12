# 14、SpringCloud Alibaba 之 SkyWalking 服务，端点，实例；IDEA配置；告警
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/14.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、SkyWalking 服务，端点，实例

1、服务(Service) ：表示对请求提供相同行为的一系列或一组工作负载，在使用Agent时，可以定义服务的名字，我们可以看到 Spring Boot 应用服务为 "springboot-2-hello"，就是我们在环境变量 SW_AGENT_NAME 中所定义的；

2、服务实例(Service Instance) ：上述的一组工作负载中的每一个工作负载称为一个实例， 一个服务实例实际就是操作系统上的一个真实进程；

这里我们可以看到 Spring Boot 应用的服务为 {agent_name}-pid:{pid}@{hostname}，由 Agent 自动生成；

3、端点(Endpoint) ：对于特定服务所接收的请求路径, 如HTTP的URI路径和gRPC服务的类名 + 方法签名；

我们可以看到 Spring Boot 应用的一个端点，为API接口 /index

## 二、IDEA中使用SkyWalking

**1、** application.properties配置文件；

```bash
server.port=8081
server.servlet.context-path=/springboot-2-hello
spring.mvc.view.prefix=/
spring.mvc.view.suffix=.jsp
```

**2、** controller测试类；

```java
@Controller
public class MyController {
    @RequestMapping("/hellospringboot")
    @ResponseBody
    public String helloSpringBoot(){
        return "欢迎使用SpringBoot框架";
    }
}
```

**3、** 在运行的程序配置jvm参数和环境变量参数；

VMoptions：**-javaagent:D:\SoftDevelopMentTools\SkyWalking\apache-skywalking-java-agent-8.8.0\skywalking-agent\skywalking-agent.jar**

注：Windows下安装 agent 的路径

Environment Variables：**SW_AGENT_COLLECTOR_BACKEND_SERVICES=192.168.133.129:11800;SW_AGENT_NAME=springboot-2-hello-idea**

注：Linux远程服务器的IP地址

**4、** 可看到本地运行springboot项目控制台输出；

```bash
DEBUG 2022-07-26 15:10:57:088 main AgentPackagePath : The beacon class location is jar:file:/D:/SoftDevelopMentTools/SkyWalking/apache-skywalking-java-agent-8.8.0/skywalking-agent/skywalking-agent.jar!/org/apache/skywalking/apm/agent/core/boot/AgentPackagePath.class. 
INFO 2022-07-26 15:10:57:090 main SnifferConfigInitializer : Config file found in D:\SoftDevelopMentTools\SkyWalking\apache-skywalking-java-agent-8.8.0\skywalking-agent\config\agent.config. 
```

**5、** 输入访问；

## 三、SkyWalking告警通知

skywalking告警的核心由一组规则驱动，这些规则定义在

/xx/apache-skywalking-apm-bin/config/alarm-settings.yml 文件

告警规则的定义分为三部分：

**1、告警规则**：它们定义了应该如何触发度量警报，应该考虑什么条件

**2、网络钩子(Webhook}**：当警告触发时，哪些服务终端需要被通知

**3、gRPC钩子**：远程gRPC方法的主机和端口，告警触发后调用

为了方便，skywalking发行版中提供了默认的alarm-setting.yml文件，包括一些规则，每个规则有英文注释，可以根据注释得知每个规则的作用；

如service_resp_time_rule 规则：

service_resp_time_rule:

metrics-name: service_resp_time

op: ">"

threshold: 1000

period: 10

count: 3

silence-period: 5

message: Response time of service {name} is more than 1000ms in 3 minutes of last 10 minutes.

该规则表示服务{name}的响应时间在最近10分钟的3分钟内超过1000ms；

只有我们的服务请求符合alarm-setting.yml文件中的某一条规则就会触发告警；

### Webhook回调通知

SkyWalking告警Webhook回调要求接收方是一个Web容器（如Tomcat服务），告警的消息会通过HTTP请求进行发送, 请求方法为POST, Content-Type为application/json, JSON格式基于

List的集合

```java
package org.apache.skywalking.oap.server.core.alarm;
import lombok.Getter;
import lombok.Setter;
import org.apache.skywalking.oap.server.core.analysis.manual.searchtag.Tag;
import java.util.List;
/**
 * Alarm message represents the details of each alarm.
 */
@Setter
@Getter
public class AlarmMessage {
    private int scopeId;
    private String scope;
    private String name;
    private String id0;
    private String id1;
    private String ruleName;
    private String alarmMessage;
    private List<Tag> tags;
    private long startTime;
    private transient int period;
    private transient boolean onlyAsCondition;
}
```

**1、** scopeId：所有可用的Scope请查阅；

org.apache.skywalking.oap.server.core.source.DefaultScopeDefine

**2、** name：目标Scope的实体名称；

**3、** id0：Scope实体的ID；

**4、** id1：未使用；

**5、** ruleName：在alarm-settings.yml中配置的规则名；

**6、** alarmMessage：报警消息内容；

**7、** startTime：告警时间,位于当前时间与UTC1970/1/1之间；

### 告警应用

**1、** /xx/apache-skywalking-apm-bin/config/alarm-settings.yml文件配置告警规则；

该规则表示服务{name}的响应时间在最近10分钟的3分钟内超过1000ms

**2、配置Webhook回调通知！！！**

```bash
webhooks:
   - http:10.10.67.27:8081/notify
#  - http://127.0.0.1/notify/
#  - http://127.0.0.1/go-wechat/
```

输出到本地 IP 下的 notify接口

**3、** 编写controller测试类，notify接口对应上述Webhook回调通知webhooks:；

-http:10.10.67.27:8081/notify

```java
@Controller
public class MyController {
    @RequestMapping("/hellospringboot")
    @ResponseBody
    public String helloSpringBoot(){
        return "欢迎使用SpringBoot框架";
    }
    @RequestMapping("/timeout")
    public @ResponseBody String timeout(){
        try{
            Thread.sleep(2000L);
        }catch (InterruptedException e){
            e.printStackTrace();
        }
        return "timeout";
    }
    @RequestMapping("/notify")
    public void notify(@RequestBody Object object){
        //给技术负责人发送警告短信、邮件等通知
        System.out.println(object.toString());
    }
}
```

**4、** IDEA中配置使用SkyWalking；

-javaagent:D:\SoftDevelopMentTools\SkyWalking\apache-skywalking-java-agent-8.8.0\skywalking-agent\skywalking-agent.jar

SW_AGENT_COLLECTOR_BACKEND_SERVICES=192.168.133.129:11800;SW_AGENT_NAME=springboot-1-hello-idea

**5、** 启动运行，浏览器输入访问；

**6、** SkyWalking-UI查看告警；

IDEA控制台输出告警信息
