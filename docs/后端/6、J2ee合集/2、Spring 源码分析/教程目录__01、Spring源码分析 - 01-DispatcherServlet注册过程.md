# 01、Spring源码分析 - 01-DispatcherServlet注册过程
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/1.html
- 分类：J2EE框架
- 分组：教程目录
传统的Servlet注册是配置在/WEB-INF/web.xml下，在容器启动的时候注册Servlet。Servlet3规范为我们又提供了一种更加方便的注册方法。容器启动的时候扫描jar包，找到jar包下一个文件路径为下面这个的文件。

```java
META-INF/services/javax.servlet.ServletContainerInitializer
```

该文件的内容必须是一个实现了javax.servlet.ServletContainerInitializer接口的实现类，该接口下有一个方法会自动被调用。

```java
public void onStartup(@Nullable Set<Class<?>> webAppInitializerClasses, ServletContext servletContext)
			throws ServletException 
```

其中第一个参数是一个Set，当该实现类上有注解@HandlesTypes，注解的value属性是一个Class[]，这个数组及其子类(或实现类)会被注入到webAppInitializerClasses参数中。

下面我们看看Spring是如何利用这种方式完成DispatcherServlet的注册。

在spring-web模块下，META-INF/services/javax.servlet.ServletContainerInitializer文件中的内容为:

```java
org.springframework.web.SpringServletContainerInitializer
```

该类实现了ServletContainerInitializer接口，并标有@HandlesTypes注解。

```java
@HandlesTypes(WebApplicationInitializer.class)
public class SpringServletContainerInitializer implements ServletContainerInitializer {
   @Override
   public void onStartup(@Nullable Set<Class<?>> webAppInitializerClasses, ServletContext servletContext)
         throws ServletException {
      List<WebApplicationInitializer> initializers = new LinkedList<>();
      if (webAppInitializerClasses != null) {
         for (Class<?> waiClass : webAppInitializerClasses) {
            // Be defensive: Some servlet containers provide us with invalid classes,
            // no matter what @HandlesTypes says...
            if (!waiClass.isInterface() && !Modifier.isAbstract(waiClass.getModifiers()) &&
                  WebApplicationInitializer.class.isAssignableFrom(waiClass)) {
               try {
                  initializers.add((WebApplicationInitializer)
                        ReflectionUtils.accessibleConstructor(waiClass).newInstance());
               }
               catch (Throwable ex) {
                  throw new ServletException("Failed to instantiate WebApplicationInitializer class", ex);
               }
            }
         }
      }
      if (initializers.isEmpty()) {
         servletContext.log("No Spring WebApplicationInitializer types detected on classpath");
         return;
      }
      servletContext.log(initializers.size() + " Spring WebApplicationInitializers detected on classpath");
      AnnotationAwareOrderComparator.sort(initializers);
      for (WebApplicationInitializer initializer : initializers) {
         initializer.onStartup(servletContext);
      }
   }
}
```

onStartup方法会将WebApplicationInitializer的实现类实例放到List中排序，依次调用onStartup()方法。Spring为我们提供了一个WebApplicationInitializer的抽象实现类AbstractAnnotationConfigDispatcherServletInitializer，通常我们只需要继承此类来完成DispatcherServlet与spring context的注册。

AbstractAnnotationConfigDispatcherServletInitializer的父类AbstractDispatcherServletInitializer覆盖了onStartup()方法，

```java
public void onStartup(ServletContext servletContext) throws ServletException {
   super.onStartup(servletContext);
   registerDispatcherServlet(servletContext);
}
```

首先调用父类的方法完成root WebApplicationContext的初始化，然后调用registerDispatcherServlet()方法完成DispatcherServlet的注册。

```java
protected void registerDispatcherServlet(ServletContext servletContext) {
   String servletName = getServletName();
   Assert.hasLength(servletName, "getServletName() must not return empty or null");
   WebApplicationContext servletAppContext = createServletApplicationContext();
   Assert.notNull(servletAppContext,
         "createServletApplicationContext() did not return an application " +
         "context for servlet [" + servletName + "]");
   FrameworkServlet dispatcherServlet = createDispatcherServlet(servletAppContext);
   dispatcherServlet.setContextInitializers(getServletApplicationContextInitializers());
   ServletRegistration.Dynamic registration = servletContext.addServlet(servletName, dispatcherServlet);
   Assert.notNull(registration,
         "Failed to register servlet with name '" + servletName + "'." +
         "Check if there is another servlet registered under the same name.");
   registration.setLoadOnStartup(1);
   registration.addMapping(getServletMappings());
   registration.setAsyncSupported(isAsyncSupported());
   Filter[] filters = getServletFilters();
   if (!ObjectUtils.isEmpty(filters)) {
      for (Filter filter : filters) {
         registerServletFilter(servletContext, filter);
      }
   }
   customizeRegistration(registration);
}
```

暂时只关注Servlet的注册，Spring容器相关的以后介绍，createDispatcherServlet()方法创建了一个DispatcherServlet实例，然后通过servletContext.addServlet()方法完成DispatcherServlet的注册。

```java
protected FrameworkServlet createDispatcherServlet(WebApplicationContext servletAppContext) {
   return new DispatcherServlet(servletAppContext);
}
```

以上就是DispatcherServlet的注册过程。
