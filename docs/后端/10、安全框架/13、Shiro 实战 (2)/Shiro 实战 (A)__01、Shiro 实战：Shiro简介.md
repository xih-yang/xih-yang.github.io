# 01、Shiro 实战：Shiro简介
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/1.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
## 一、简介

在Web系统中我们经常要涉及到权限问题，例如不同角色的人登录系统，他操作的功能、按钮、菜单是各不相同的，这就是所谓的权限。Apache Shiro是Java的一个安全（权限）框架，Shiro可以完成认证、授权、加密、会话管理、Web集成、缓存等功能。适用于JavaSE和JavaEE。

关于安全框架，还有一个Spring Security框架，不过目前使用率比较高的还是Apache Shiro。

官网下载：http://shiro.apache.org/

登录上述网站，可以下载Shiro开发包与文档：

Shiro的基本功能点如下图所示：

Shiro的最主要的功能分别是Authentication、Authorization、Session Management、Cryptography、Web Support、Caching、Concurency、Testing、Run As、Remember Me。分别解释一下上面的主要功能：

**(1)Authentication**

即是“认证”功能，说白了登录。我们可以利用Shiro实现登录效果，通过Shiro帮我们完成密码匹配的工作。

**(2)Authorization**

即是“授权”功能，当我们点一个链接或按钮的时候，Shiro会帮我们判断操作者有没有权限访问该服务。

**(3)Session Management**

即是“会话管理”功能，在Web系统下(即JavaEE)环境下，是对Http的Session进行托管。而在JavaSE下是由Shiro单独提供一种Session机制。

**(4)Cryptography**

即是“加密”功能，我们可以很容易的使用Shiro为密码进行“加盐”加密。

**(5)Web Support**

对于Web进行支持。Shiro可以很容易的与JavaEE工程进行集成。

**(6)Concurency**

在多线程的情况下，来进行授权认证。例如在一个线程中开启另外一个线程，能把权限自动传播过去。

**(7)Caching**

Shiro的缓存模块，让系统的授权机制运行速度更快。

**(8)Run As**

让已经登录的用户，以另外一个用户的身份来操作当前的项目和系统。

**(9)Remember Me**

即“记住我”，是一个十分常见的功能，即是一次登录后，下次再次访问则不需要登录。

**(10)Testing**

Shiro提供测试支持。

## 二、Shiro架构

**(1)从外部看Shiro**

Shiro的架构从外部看如下图：

其中Application Code代表应用程序的代码，当一个用户去访问应用程序时，Shiro会生成一个该用户Subject对象，代表的是“current User”，即当前用户对象。而下面的Shiro SecurityManager是一个“大管家”的角色，它管理着Shiro的各个组件，而与Subject的所有交互都会委托给SecurityManager。其实Subject仅仅是一个“门面”，SecurityManager才是实际的执行者。

当我们需要访问一些安全数据的时候，需要使用到Realm，它相当于Shiro的一个DataSource。Shiro会从Realm中获取安全数据（如用户、角色、权限），就是说SecurityManager要验证用户身份，需要从Realm中获取相应的用户进行比较以确定用户身份是否合法；也需要从Realm中得到用户相应的角色、权限进行验证用户是否能进行操作。

**(2)从内部看Shiro**

Shiro的架构从内部看如下图：

最上层的是我们的各种语言编写的应用程序，而这些应用程序都是通过Subject与Shiro进行交互的，而Subject就是与整个SecurityManager打交道。

对于整个SecurityManager，包括以下组件：

**1、** Subject：代表任何与应用程序发送交互的用户；

**2、** SecurityManager：相当于SpringMVC的Dispatcher，是Shiro的心脏所有交互都会通过SecurityManager进行控制，它管理着所有Subject，且负责进行认证、授权、会话以及缓存的管理；

**3、** Authenticator：负责Subject认证，是一个拓展点，可以自定义实现可以使用认证策略（AuthenticationStrategy），即在什么情况下算用户认证通过了；

**4、** Authorizer：授权器，即访问控制器，用来决定主体是否有权进行相应的操作，即控制着用户能访问应用中的哪些功能；

**5、** Realm：安全实体数据源即是提供安全数据的源头，数据源可以是JDBC操作的数据库数据，也可以是缓存中的数据该实体由用户提供，一般在应用中都需要实现自己的Realm可以有一个或者多个Realm；

**6、** SessionManager：管理Session生命周期的组件Shiro不仅仅可以在Web环境，也可以在普通的JavaSE环境中；

**7、** CacheManager：缓存控制器，来管理如用户、角色、权限等信息的缓存由于这些数据基本上很少发生变动，所以存放在缓存中可以提供访问的性能；

**8、** Cryptography：密码模块Shiro提供了一些常见的加密组件用于密码的加密/解密；

以上就是关于Shiro的简介。
