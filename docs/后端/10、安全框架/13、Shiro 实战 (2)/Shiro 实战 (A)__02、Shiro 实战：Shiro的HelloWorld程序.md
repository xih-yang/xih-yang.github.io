# 02、Shiro 实战：Shiro的HelloWorld程序
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/2.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
下面来分析一个Shiro的HelloWorld程序。这段程序不是我们自己写的，而是Shiro给我们提供的一个样例代码。通过这段代码我们可以看到Shiro的大致结构。

首先通过http://shiro.apache.org/download.html下载Shiro的jar包:

目前Shiro的最新版本为1.3.2版本，其中包括shiro-all、shiro-core、shiro-web、shiro-aspectj、shiro-cas、shiro-ehcache、shiro-hazelcast、shiro-guice、shiro-quartz、 shiro-spring、 shiro-tools-hasher这11个jar包。

将上述jar下载完毕解压后看到的大致文件结构如下：

测试工程还需要log4j-1.2.17.jar、slf4j-api-1.7.5.jar以及slf4j-log4j12-1.7.5.jar三个jar包，是用来管理日志信息打印的。

下面在MyEclipse中新建一个名为“Shiro1”的Java工程：

新建一个lib文件夹，加入shiro-all-1.3.2.jar、log4j-1.2.17.jar、slf4j-api-1.7.5.jar以及slf4j-log4j12-1.7.5.jar四个jar包，并加载到类路径下：

Shiro为我们提供的样例程序托管在GitHub下，地址为https://github.com/apache/shiro.git，

我们可以克隆到本地Git或者直接下载：

这里先选择直接下载。下载完毕后的工程目录如下：

我们需要的样例程序在“shiro-master\samples”下，名称为“quickstart”：

我们将“quickstart”下的“src\main\resources”下的配置文件加入到测试工程“Shiro1”的src下，将“src\main\java”下的Quickstart.java加入创建的“com.test.shiro.helloWorld”包下：

如果看到java文件上面有打叉，是因为没有写包路径，打开文件添加包路径：

下面我们来分块剖析Quickstart.java的样例代码(main方法中)，在重要的地方我将原版的注释翻译了一下：

**(1)创建SecurityManager部分**

```java
//下面是创建一个SecurityManager最简单的方式，使用了ini文件(shiro.ini)中配置的
//realms, users, roles 以及 permissions。我们使用了工程的模式，加载ini文件中
//的配置，进而创建出了一个SecurityManager实例。
Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro.ini");
SecurityManager securityManager = factory.getInstance();
```

上面所指的Shiro.ini文件就是之前我们加入到测试工程的文件，其中核心的配置数据如下：

```java
[users]
root = secret, admin
guest = guest, guest
presidentskroob = 12345, president
lonestarr = vespa, goodguy, schwartz
[roles]
admin = *
schwartz = lightsaber:*
goodguy = winnebago:drive:eagle5
```

上面配置了root用户、guest用户、presidentskroob用户、lonestarr用户的密码以及角色，下面配置了admin以及schwartz和goodguy这三个角色的权限信息。

上面创建SecurityManager的方式以及ini的配置，仅作为测试样例的参考，在开发中不可能使用这种方式进行开发，这里大家仅作为了解即可。

**(2)securityManager的一些设置**

//对于这个简单的例子，我们使SecurityManager在Java虚拟机中变可访问的“单例”，

//但大部分应用都不这么做。这里为了体验快速工程，才使用这种最小开销的方式。

SecurityUtils.setSecurityManager(securityManager);

上面就是一个单例设置，日常开发中也很少这么做，这里仅作了解即可。

**(3)使用Shiro的核心API**

**1、** 获取当前用户的Subject；

```java
//获取当前的Subject
Subject currentUser = SecurityUtils.getSubject();
```

上面的代码就是使用SecurityUtils的getSubject获取当前用户的Subject。上一此我们说到在Shiro中与SecurityManager打交道的就是Subject。

**2、** 使用Session；

```java
//测试使用Session(即便不是Web或EJB容器下)
Session session = currentUser.getSession();//调用Subject的getSession方法
session.setAttribute("someKey", "aValue");//存入Key-Value对象
String value = (String) session.getAttribute("someKey");
if (value.equals("aValue")) {
    log.info("Retrieved the correct value! [" + value + "]");
}
```

上面的代码通过调用Subject的getSession方法获取session对象来使用。

**3、** 进行认证(登录)；

```java
//测试当前用户是否已经被认证(即是否已经登录)
if (!currentUser.isAuthenticated()) {
   //将用户名与密码封装为UsernamePasswordToken对象
    UsernamePasswordToken token = new UsernamePasswordToken("lonestarr", "vespa");
    token.setRememberMe(true);//记录用户
    try {
        currentUser.login(token);//调用Subject的login方法执行登录
    } catch (UnknownAccountException uae) {
        log.info("There is no user with username of " + token.getPrincipal());
    } catch (IncorrectCredentialsException ice) {
        log.info("Password for account " + token.getPrincipal() + " was incorrect!");
    } catch (LockedAccountException lae) {
        log.info("The account for username " + token.getPrincipal() + " is locked.  " +
                "Please contact your administrator to unlock it.");
    }
    // ... catch more exceptions here (maybe custom ones specific to your application?
    catch (AuthenticationException ae) {
        //unexpected condition?  error?
    }
}
```

上面的代码去校验用户是否被认证，如果没有被认证，则会将用户的账号密码封装为。UsernamePasswordToken对象，并传入Subject的login方法执行登录。如果账号密码正确，则通过认证并登录成功，如果账户没有，则会抛出UnknownAccountException异常；如果账户存在但密码错误，则会抛出IncorrectCredentialsException异常；如果用户被锁定，则会抛出LockedAccountException 异常；最后的AuthenticationException是上面所有异常的父类，在不清楚会发生何种异常时，可以直接抛出该类异常。

**4、** 进行角色判定；

```java
//测试用户是否有某一个角色
if (currentUser.hasRole("schwartz")) {
    log.info("May the Schwartz be with you!");
} else {
    log.info("Hello, mere mortal.");
}
```

通过Subject的hasRole方法来判定该用户是否含有指定的橘色。对于该样例，ini文件中配置的lonestarr用户是有“schwartz”这个角色的，所以控制台会输出“May the Schwartz be with you!”。

**5、** 进行权限判定；

```java
//测试用户是否具备某个行为
if (currentUser.isPermitted("lightsaber:wield")) {
    log.info("You may use a lightsaber ring.  Use it wisely.");
} else {
    log.info("Sorry, lightsaber rings are for schwartz masters only.");
}
//a (very powerful) Instance Level permission:
if (currentUser.isPermitted("winnebago:drive:eagle5")) {
    log.info("You are permitted to 'drive' the winnebago with license plate (id) 'eagle5'.  " +
            "Here are the keys - have fun!");
} else {
    log.info("Sorry, you aren't allowed to drive the 'eagle5' winnebago!");
}
```

一般在系统的权限设置中，一个用户对应一个或多个角色，而一个角色下又会拥有许多个权限，来指定该角色的行为范围。这里使用Subject的isPermitted方法来判定用户是否具备某个类型下的某些行为权限。在该样例中，第一个判断就是判定用户在lightsaber类型下是否拥有wield行为权限，而在上面的ini配置文件中我们可以看到，该用户的“schwartz”角色的权限指定为“schwartz = lightsaber:*”，即是对于lightsaber类型可以执行所有行为，所以这里的wield行为是可以通过的。

后面的"winnebago:drive:eagle5"更为具体，即是“类型:行为:实例”，指可以对某类型的谋实例做某事。换一个更好理解的配置，如“user:delete:zhangsan”，即在user模块下可以对zhangsan来进行delete操作。

**6、** 用户登出(注销)；

```java
//执行登出(注销)
currentUser.logout();
```

使用Subject的logout方法来执行登出操作，一般在应用中来使用户退出系统。

上面就是整个Shiro的测试样例代码的讲解。在上面的代码中，只有登录和登出的写法使我们可以在项目中直接使用的，而权限判定等一般在项目中使用声明(注解、配置)的方式来进行判定，不会使用样例程序的硬编码方式判定。

最后，执行以下main方法，观察控制台打印的日志信息(这里只列出INFO级别的日志，也就是mian中自主打印的日志)，大家自己可以思考一下为什么是打印该结果：

```java
2022-10-14 12:55:23,466 INFO [com.test.shiro.helloWorld.Quickstart] - Retrieved the correct value! [aValue] 
2022-10-14 12:55:23,469 INFO [com.test.shiro.helloWorld.Quickstart] - User [lonestarr] logged in successfully. 
2022-10-14 12:55:23,469 INFO [com.test.shiro.helloWorld.Quickstart] - May the Schwartz be with you! 
2022-10-14 12:55:23,470 INFO [com.test.shiro.helloWorld.Quickstart] - You may use a lightsaber ring.  Use it wisely. 
2022-10-14 12:55:23,470 INFO [com.test.shiro.helloWorld.Quickstart] - You are permitted to 'drive' the winnebago with license plate (id) 'eagle5'.  Here are the keys - have fun!
```
