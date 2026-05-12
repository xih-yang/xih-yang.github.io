# 01、Tomcat8 源码解析 - 源码环境搭建
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/1.html
- 分类：服务器框架
- 分组：教程目录
为什么要学习Tomcat源码？学习源码的目的是什么？

学习Tomcat源码属于理论学习，实践使用属于技能练习，长时间使用和处理使用问题属于经验积累。

**1、** 掌握Tomcat原理理论；

可以进行调优：在各种场景下，合理的配置使用Tomcat，最大限度的发挥Tomcat的性能。

可以解决问题：根据原理来解决使用过程中遇到的疑难杂症。

**2、** 代码学习；

学习大神们如何写简洁、高效、优雅的代码；

学习大神们如何设计代码，比如设计模式；

## 一、环境信息

TOMCAT版本：apache-tomcat-8.5.54-src.zip

JDK版本：jdk1.8.0_171

ANT版本：apache-ant-1.10.7-bin.zip

IDE:eclipse Oxygen.3a Release (4.7.3a)

操作系统：win7_X64

## 二、搭建步骤

**1、** 下载tomcat、jdk、ant、eclipse,官网下载即可(略).；

**2、** 解压安装配置JDK(略).；

**3、** 解压eclipse(略).；

**4、** 安装ant,tomcat默认使用ant构建，有些博客说是tomcat和ant是同一个人开发的有关；

1、解压安装

我的安装目录是：D:\apache-ant-1.10.7

2、配置环境变量

```java
ANT_HOME
D:\apache-ant-1.10.7
```

path后面追加

```java
;%ANT_HOME%/bin
```

3、打开CMD验证是否成功

```java
C:\Users\Administrator>ant -version
Apache Ant(TM) version 1.10.7 compiled on September 1 2019
```

**5、** 构建tomcat源码；

1、解压tomcat源码

我的解压目录是：E:\srcs\apache-tomcat-8.5.54-src

2、进入解压目录，新建一个build.properties文件和目录tomcat-build-libs，添加如下内容：

```java
# basepath是下载的jar包的路径
base.path=E:/srcs/apache-tomcat-8.5.54-src/tomcat-build-libs
compile.source=1.8
compile.target=1.8
compile.debug=true
```

3、使用ant下载依赖包

打开cmd,进入E:\srcs\apache-tomcat-8.5.54-src，输入ant,在tomcat-build-libs目录中下载依赖包,最后出现BUILD SUCCSSFUL即可。

```java
E:\srcs\apache-tomcat-8.5.54-src>ant
...
BUILD SUCCESSFUL
Total time: 1 minute 46 seconds
```

4、转换eclipse工程

(4.1)生成ide-eclipse

```java
E:\srcs\apache-tomcat-8.5.54-src>ant -p
```

(4.2)源码目录下生成了.classpath 和.project文件

```java
E:\srcs\apache-tomcat-8.5.54-src>ant ide-eclipse
```

下载所有依赖包：

**6、** 导入eclipse；

(6.1)方式一：打开eclipse，File->import->General->existing Projects into workspace,找到源码录入，然后finish即可。

(6.2)方式二：方式一导入会引入很多没用的文件，可以换一种方式：

新建java project工程，删掉src目录，然后File->import->General->File System导入如下目录

**7、** 解决工程报错；

1、添加JUnit4单元测试。

2、添加依赖:

对于方式一 添加ANT_HOME和TOMCAT_LIBS_BASE这两个变量：在.classpath文件里配置了依赖

对于方式二：直接到ant目录和tomcat-build-libs目录拷贝依赖jar包，然后直接build path：

**3、** 缺少CookieFilter；

/tomcat8.5/test/util/TestCookieFilter.java报错,缺少CookieFilter.java依赖

新建类CookieFilter.java来解决：

```java
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package util;
import java.util.Locale;
import java.util.StringTokenizer;
/**
 * Processes a cookie header and attempts to obfuscate any cookie values that
 * represent session IDs from other web applications. Since session cookie names
 * are configurable, as are session ID lengths, this filter is not expected to
 * be 100% effective.
 *
 * It is required that the examples web application is removed in security
 * conscious environments as documented in the Security How-To. This filter is
 * intended to reduce the impact of failing to follow that advice. A failure by
 * this filter to obfuscate a session ID or similar value is not a security
 * vulnerability. In such instances the vulnerability is the failure to remove
 * the examples web application.
 */
public class CookieFilter {
    private static final String OBFUSCATED = "[obfuscated]";
    private CookieFilter() {
        // Hide default constructor
    }
    public static String filter(String cookieHeader, String sessionId) {
        StringBuilder sb = new StringBuilder(cookieHeader.length());
        // Cookie name value pairs are ';' separated.
        // Session IDs don't use ; in the value so don't worry about quoted
        // values that contain ;
        StringTokenizer st = new StringTokenizer(cookieHeader, ";");
        boolean first = true;
        while (st.hasMoreTokens()) {
            if (first) {
                first = false;
            } else {
                sb.append(';');
            }
            sb.append(filterNameValuePair(st.nextToken(), sessionId));
        }
        return sb.toString();
    }
    private static String filterNameValuePair(String input, String sessionId) {
        int i = input.indexOf('=');
        if (i == -1) {
            return input;
        }
        String name = input.substring(0, i);
        String value = input.substring(i + 1, input.length());
        return name + "=" + filter(name, value, sessionId);
    }
    public static String filter(String cookieName, String cookieValue, String sessionId) {
        if (cookieName.toLowerCase(Locale.ENGLISH).contains("jsessionid") &&
                (sessionId == null || !cookieValue.contains(sessionId))) {
            cookieValue = OBFUSCATED;
        }
        return cookieValue;
    }
}
```

View Code

**8、** 启动；

java/org/apache/catalina/startup/Bootstrap.java 里面有main函数，启动这个类即可。

问题：控制台打印乱码。

原因：在java中, 读取文件的默认格式是iso8859-1, 而我们中文存储的时候一般是UTF-8. 所以导致读出来的是乱码

解决：修改两个类

1)org.apache.tomcat.util.res.StringManager类中的getString(final String key, final Object... args)方法

```java
public String getString(final String key, final Object... args) {
        String value = getString(key);
        if (value == null) {
            value = key;
        }
        //解决乱码
        try {
            value = new String(value.getBytes("ISO-8859-1"), "UTF-8");
        }catch(Exception e){
            e.printStackTrace();
        }
        MessageFormat mf = new MessageFormat(value);
        mf.setLocale(locale);
        return mf.format(args, new StringBuffer(), null).toString();
    }
```

2)org.apache.jasper.compiler.Localizer类的getMessage(String errCode)方法

```java
public static String getMessage(String errCode) {
        String errMsg = errCode;
        try {
            if (bundle != null) {
                errMsg = bundle.getString(errCode);
            }
        } catch (MissingResourceException e) {
        }
        //解决乱码
        try {
            errMsg = new String(errMsg.getBytes("ISO-8859-1"), "UTF-8");
        }catch(Exception e){
            e.printStackTrace();
        }
        return errMsg;
    }
```

改完重启：
