# 15、Shiro SSL
- 来源：https://ddkk.com/zhuanlan/security/shiro/1/15.html
- 分类：安全框架
- 分组：教程目录
## SSL

对于SSL 的支持，Shiro 只是判断当前 url 是否需要 SSL 登录，如果需要自动重定向到 https 进行访问。

**首先生成数字证书，生成证书到 D:\localhost.keystore**

使用JDK 的 keytool 命令，生成证书（包含证书 / 公钥 / 私钥）到 D:\localhost.keystore：

```java
keytool -genkey -keystore "D:\localhost.keystore" -alias localhost -keyalg RSA
输入密钥库口令:
再次输入新口令:
您的名字与姓氏是什么?
  [Unknown]:  localhost
您的组织单位名称是什么?
  [Unknown]:  sishuok.com
您的组织名称是什么?
  [Unknown]:  sishuok.com
您所在的城市或区域名称是什么?
  [Unknown]:  beijing
您所在的省/市/自治区名称是什么?
  [Unknown]:  beijing
该单位的双字母国家/地区代码是什么?
  [Unknown]:  cn
CN=localhost, OU=sishuok.com, O=sishuok.com, L=beijing, ST=beijing, C=cn是否正确
?
  [否]:  y
输入 <localhost> 的密钥口令
        (如果和密钥库口令相同, 按回车):
再次输入新口令:
```

通过如上步骤，生成证书到 D:\ localhost.keystore；

**然后设置 tomcat 下的 server.xml**

此处使用了 apache-tomcat-7.0.40 版本，打开 conf/server.xml，找到：

```java
<!--
<Connector port="8443" protocol="HTTP/1.1" SSLEnabled="true"
       maxThreads="150" scheme="https" secure="true"
       clientAuth="false" sslProtocol="TLS" />
\--> 
```

替换为

```java
<Connector port="8443" protocol="HTTP/1.1" SSLEnabled="true"
       maxThreads="150" scheme="https" secure="true"
       clientAuth="false" sslProtocol="TLS" 
       keystoreFile="D:\localhost.keystore" keystorePass="123456"/> 
```

keystorePass 就是生成 keystore 时设置的密码。

**添加 SSL 到配置文件（spring-shiro-web.xml）**

此处使用了和十三章一样的代码：

```java
<bean id="sslFilter" class="org.apache.shiro.web.filter.authz.SslFilter">
    <property name="port" value="8443"/>
</bean>
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    ……
    <property name="filters">
        <util:map>
            <entry key="authc" value-ref="formAuthenticationFilter"/>
            <entry key="ssl" value-ref="sslFilter"/>
        </util:map>
    </property>
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = ssl,authc
            /logout = logout
            /authenticated.jsp = authc
            /** = user
        </value>
    </property>
</bean> 
```

SslFilter 默认端口是 443，此处使用了 8443；“/login.jsp = ssl,authc” 表示访问登录页面时需要走 SSL。

**测试**

最后把shiro-example-chapter14 打成 war 包（mvn:package），放到 tomcat 下的 webapps 中，启动服务器测试，如访问 localhost:9080/chapter14/，会自动跳转到 [https://localhost:8443/chapter14/login.jsp](https://localhost:8443/chapter14/login.jsp)。

如果使用 Maven Jetty 插件，可以直接如下插件配置：

```java
<plugin>
   <groupId>org.mortbay.jetty</groupId>
   <artifactId>jetty-maven-plugin</artifactId>
   <version>8.1.8.v20121106</version>
   <configuration>
     <webAppConfig>
       <contextPath>/${project.build.finalName}</contextPath>
     </webAppConfig>
     <connectors>
     <connector implementation="org.eclipse.jetty.server.nio.SelectChannelConnector">
       <port>8080</port>
     </connector>
     <connector implementation="org.eclipse.jetty.server.ssl.SslSocketConnector">
       <port>8443</port>
       <keystore>${project.basedir}/localhost.keystore</keystore>
       <password>123456</password>
       <keyPassword>123456</keyPassword>
     </connector>
     </connectors>
   </configuration>
</plugin>
```
