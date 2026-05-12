# 02、Tomcat 内核详解 - Servlet规范
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/2.html
- 分类：服务器框架
- 分组：教程目录
Java体系的Web服务器基本上都会遵守Servlet规范，该规范描述了HTTP请求以及响应处理过程相关的对象及其作用。Tomcat其实可以看成是一个Servlet容器，所以它需要遵守Servlet规范。

下面介绍Servlet规范主要的一些对象；

## 1.Servlet接口

Java Servlet API中提供了两个抽象类方便开发者实现Servlet类。分别是：

GenericServlet和HttpServlet：

GenericServlet定义了一个通用的、协议无关的Servlet，而HttpServlet则定义了一个HTTP的Servlet，这两个抽象类可以使Servlet类复用很多共性的功能；

一般来讲，在Servlet容器中，每个Servlet类只能对应一个Servlet对象，所有请求都由同一个Servlet对象处理，但是如果Servlet实现了SingleThreadModel接口则可能会在WEB容器总存在多个Servlet对象。对于WEB容器来讲，实现了SingleThreadModel接口意味着一个Servlet对象对应着一个线程，所以此时Servlet的成员变量不存在线程安全的问题；

Servlet的生命周期主要包括加载实例化、初始化、处理客户端请求、销毁。加载实例化主要由WEB容器完成，而其他三个阶段则对应Servlet的init、service和destroy方法。

Servlet对象被创建之后需要对其进行初始化操作，初始化的工作可以放在以ServletConfig类型为参数的ini方法中，ServletConfig为web.xml配置文件中配置的对应的初始化参数，由WEB容器完成web.xml配置读取并封装成ServletConfig对象。

当Servlet初始化完成之后，开始接受客户端的请求，这些请求被封装成ServletRequest对象和ServletResponse类型的响应对象，通过service方法处理请求并且响应客户端。当一个Servlet需要从WEB容器中移除的时候，就会调用对应的destroy方法以释放所有的资源，并且调用destroy方法之前需要保证所有正在执行的service方法的线程都完成执行；

## 2.ServletRequest接口

ServletRequest接口的实现类封装了客户端请求的所有信息；

如果使用HTTP协议通信则包括HTTP的请求行和请求头部。。HTTP对应的请求对象类型是HttpServletRequest类；

ServletRequest接口的对象只在Servlet的service方法或者过滤器的doFilter方法作用域内有效，除非启用了异步处理以调用ServletRequest接口对象的startAsync方法，此时request对象会一直有效，直到调用AsyncContext的complete方法。另外，WEB容器通常会由于性能原因而不销毁ServletRequest接口的对象，而是重复利用ServletRequest接口对象；

## 3.ServletContext接口

ServletContext接口定义了运行所有Servlet的WEB应用的视图。其提供的内容包括一下几个部分：

**1、** 某个WEB应用的Servlet全局存储空间，某Web应用对应的所有Servlet共有的各种资源和功能的访问；

**2、** 获取web应用的部署描述配置文件的方法；

**3、** 添加Servlet到ServletContext里面的方法，如addServlet；

**4、** 添加Filter到ServletContext里面的方法，如addFilter;；

**5、** 添加Listener到ServletContext里面的方法，例如addListener；

**6、** 全局的属性保存和获取的方法，例如setAttribute、getAttribute等；

**7、** 访问web应用静态内容的方法，例如，getResource和getResourceAsStream，以路径作为参数进行查询，以此参数要以/开头，相对于Web应用上下文的根或者相对于Web应用WEB-INF/lib目录下jar包的META-INF/resource；

## 4.ServletResponse接口

ServletResponse接口的对象封装了服务器需要返回客户端的所有信息，如果使用HTTP，则包含了HTTP的响应行、响应头部和响应体；

为了提高效率，一般ServletResponse接口对响应提供了输出缓存。其中，getBufferSize用于获取缓冲区的大小；setBufferSize用于设置缓冲区的大小；flushBuffer强制刷新缓存区；resetBuffer将清空缓冲区中的内容，但是不清空缓冲区的内容，同时清空头部信息和状态码；

ServletResponse接口的对象只在Servlet的service方法或者过滤器的doFilter方法作用域内有效，除非启用了异步处理以调用ServletResponse接口对象的startAsync方法，此时response对象会一直有效，直到调用AsyncContext的complete方法。另外，WEB容器通常会由于性能原因而不销毁ServletResponse接口的对象，而是重复利用ServletResponse接口对象；

## 5.Filter接口

Filter接口允许WEB容器对请求和响应做统一的处理。例如，统一改变HTTP请求内容和响应内容，它可以作用于某一个Servlet或者一组Servlet；

可以使用@WebFilter注解或部署描述文件定义过滤器，XML配置形式使用元素定义，包括、和子节点，并使用定义WEB应用的Servlet和其他静态资源通过过滤器；

## 6.会话

Servlet没有提出协议无关的会话规定。而是每个协议自己规定，HTTP对应的会话接口是HttpSession。Cookie是常用的会话跟踪机制，其中Cookie的标准名字必须为JSESSIONID。另外一种会话跟踪机制则是URL 重写，即在URL后面添加一个jsessionid参数，当支持Cookie和SSL会话的情况下，不应该使用URL重写作为会话跟踪机制；

HTTPSession对象必须限定在ServletContext级别，会话里面的属性不能在不同的ServletContext之间共享；

处于同一个ServletContext和相同的会话中的任意Servlet都可以使用会话中保存的对象。如果某些对象想要在保存到会话或者从会话中移除的时候得到通知，可以让某个对象实现HttpSessionBindingListener接口，里面的valueBound和valueUNbound分别会在对应的时刻触发；

分布式环境中，会话的所有请求在同一时间必须仅仅被一个JVM处理，分布式容器迁移会话的时候会通知实现了HttpSessionActivationListener接口的所有会话属性；

## 7.注解

在WEB应用中，使用了注解的类只有被放到WEB-INF/classes目录中或者WEB-INF/lib目录下的jar中，注解才会被WEB容器处理。web.xml配置文件的元素的metadata-complet默认为false，这表示WEB容器必须检查类的注解和WEB Fragement，否则忽略注解和WEB Fragment。

常用的几个注解如下：

**1、** @WebServlet：用于定义的Servlet，该注解的类必须继承HttpServlet；

**2、** @WebFilter：用于在Web项目中定义的Fileter，必须继承Filter；

**3、** @WebInitParam：用于指定传递到Filter或者Servlet的初始化参数，它是WebServlet和WebFilter注解的一个属性；

**4、** @WebListener：用于定义Web应用中的各种监听器，使用该注解的类必须实现以下接口中的一个：；

ServletContextListerer

ServletContextAttributeListener

ServletRequestListener

ServletRequestAttributeListener

HttpSessionListener

HttpSessionAttributeListener

HttpSessionIdListener

**1、** @MultipartConfig注解用于指定Servlet请求期望的是mime/multipart类型；

## 8.可插拔性

为了给开发人员提供更好的可拔插性和更少得配置，可以在一个库类或者框架jar包的META-INF目录中指定Web Fragment，即web-fragment.xml配置文件，它可以看成Web的逻辑分区。

部署期间，Web容器会扫描WEB-INF/lib目录下jar包的META-INF/web-fragment.xml，并根据配置文件生成对应的组件；

一个Web应用可能会有一个web.xml和若干个web-fragment.xml文件，Web容器加载的时候会涉及顺序问题。有两种方式定义它们加载的顺序：绝对顺序，web.xml中的元素用于描述加载资源的顺序：相对顺序，web-fragment.xml中的元素用于描述web-fragment.xml之间的顺序；

## 9.请求分发器

请求分发器负责把请求转发给另外一个Servlet处理，或者在响应中包含另外一个Servlet的输出，RequestDispatcher接口提供了此实现机制。用户可以通过ServletContext的getRequestDispatcher方法和getNamedDispatcher方法分别以路径或者Servlet名称作为参数获取对应的Servlet的RequestDispatcher

请求分发器有include和forward两个方法。include方法是将目标Servlet包含到当前的Servlet中，主控制权在当前Servlet上。forward方法是将当前Servlet的请求转移到目标Servlet上，主控制权在目标Servlet上，当前Servlet的执行终止；

## 10.Web应用

Web应用和ServletContext接口对象是一对一的关系，ServletContext对象提供一个Servlet和它的应用程序视图。Web应用可能包括Servlet、JSP、工具类、静态文件、客户端Java Applet等。

META-INF目录存放的项目的一些信息，以及其他根据具体目录存放的资源。一般WEB-INF目录下的文件都不能由容器直接提供给客户端访问，但是WEB-INF目录中的内容可以通过Servlet代码调用ServletContext的getResource和getResourceAsStream方法来访问，并可以使用RequestDispatcher调用公开这些内容；

部署容器中的每个Web应用程序的ClassLoader实例必须是一个单独的实例；

Web应用的部署描述符可以配置文件列表，如果调用response的sendError方法或则如果Servlet产生一个异常或者把错误传播给容器，容器需要按照Web应用部署文件中定义的错误页面列表，根据状态码或者异常视图返回一个匹配的错误页面。如果Web应用部署描述文件的error-page元素没有包含exception-type或者error-code子元素，则错误页面使用默认的错误页面；

【web应用加载顺序】

在Web应用程序开始处理客户端的请求之前，必须按照以下的步骤进行：

**1、** 实例化部署文件中元素标识的每个事件监听器的一个实例；

**2、** 对于已经实例化并且实现了ServletContextListener接口的监听器实例，调用contextInitialized()方法；

**3、** 实例化部署描述文件中的元素标识的每个过滤器的实例，并调用每个过滤器的init方法；

**4、** 根据load-on-startup元素值定义的顺序，包含元素的元素为每个Servlet实例化一个实例，并调用每个Servlet实例的init()方法；

对于不包含任何Servlet、Filter或者Listener的web应用，或使用注解声明的Web应用，可以不需要使用web.xml部署描述符；

## 11.Servlet映射

## 12.部署描述文件

所有的Servlet容器的Web应用程序部署描述文件需要支持以下类型的配置和部署信息：

ServletContext初始化参数；

Session配置；

Servlet声明；

Servlet映射；

应用程序生命周期监听器类；

过滤器定义和过滤器映射；

MIME类型映射；

欢迎文件列表；

错误页面；

语言环境和编码映射；

安全配置（包括login-config、security-constraint、security-constranint、security-role-ref和run-as）
