# 14、Tomcat 源码解析 - Tomcat applicationAnnotationsConfig
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/14.html
- 分类：服务器框架
- 分组：教程目录
这篇单独分析configureStart –> **applicationAnnotationsConfig**方法

```java
protected synchronized void configureStart() {
        // Called from StandardContext.start()
        if (log.isDebugEnabled()) {
            log.debug(sm.getString("contextConfig.start"));
        }
        if (log.isDebugEnabled()) {
            log.debug(sm.getString("contextConfig.xmlSettings",
                    context.getName(),
                    Boolean.valueOf(context.getXmlValidation()),
                    Boolean.valueOf(context.getXmlNamespaceAware())));
        }
        webConfig();
        if (!context.getIgnoreAnnotations()) {
//StandardContext配置的ignoreAnnotations 为false，执行方法
            applicationAnnotationsConfig();
        }
        if (ok) {
            validateSecurityRoles();
        }
        // Configure an authenticator if we need one
        if (ok) {
            authenticatorConfig();
        }
       ………………………….
}
```

**applicationAnnotationsConfig方法：**

**看源码发现**

**applicationAnnotationsConfig-------->WebAnnotationSet.loadApplicationAnnotations(context)-------****à****loadApplicationListenerAnnotations(context)|****loadApplicationFilterAnnotations(context)|****loadApplicationServletAnnotations(context)**

*1.**loadApplicationListenerAnnotations**方法**:*

```java
protected static void loadApplicationListenerAnnotations(Context context) {
//ApplicationListeners是web.xml里面配置的Listener
        String[] applicationListeners = context.findApplicationListeners();
        for (String className : applicationListeners) {
// org.apache.catalina.loader.WebappLoader(digester)加载的Listener
            Class<?> classClass = Introspection.loadClass(context, className);
            if (classClass == null) {
                continue;
            }
//classClass是在web.xml中配置的Listener 对象
            loadClassAnnotation(context, classClass);
            loadFieldsAnnotation(context, classClass);
            loadMethodsAnnotation(context, classClass);
        }
}
```

*2.loadApplicationFilterAnnotations**方法**:*

```java
protected static void loadApplicationFilterAnnotations(Context context) {
//跟loadApplicationListenerAnnotations方法类似，webXml配置的filter
        FilterDef[] filterDefs = context.findFilterDefs();
        for (FilterDef filterDef : filterDefs) {
// org.apache.catalina.loader.WebappLoader(digester)加载的filter
            Class<?> classClass = Introspection.loadClass(context,
                    filterDef.getFilterClass());
            if (classClass == null) {
                continue;
            }
//classClass是在web.xml中配置的filter 对象
            loadClassAnnotation(context, classClass);
            loadFieldsAnnotation(context, classClass);
            loadMethodsAnnotation(context, classClass);
        }
}
```

**3、***loadApplicationServletAnnotations**方法：*；

```java
protected static void loadApplicationServletAnnotations(Context context) {
//Wrapper是在webconfig方法  step9创建的默认是StandardWrapper，以后具体分析StandardWrapper
        Container[] children = context.findChildren();
        for (Container child : children) {
            if (child instanceof Wrapper) {
                Wrapper wrapper = (Wrapper) child;
                if (wrapper.getServletClass() == null) {
                    continue;
                }
//同样，是用org.apache.catalina.loader.WebappLoader(digester)加载的，是被Wrapper处理后的Servlet
                Class<?> classClass = Introspection.loadClass(context,
                        wrapper.getServletClass());
                if (classClass == null) {
                    continue;
                }
                loadClassAnnotation(context, classClass);
                loadFieldsAnnotation(context, classClass);
                loadMethodsAnnotation(context, classClass);
//最后会处理RunAs注解
                RunAs annotation = classClass.getAnnotation(RunAs.class);
                if (annotation != null) {
                    wrapper.setRunAs(annotation.value());
                }
            }
        }
```

**发现上面三个方法最后都会调用三个方法**

oadClassAnnotation、loadFieldsAnnotation和loadMethodsAnnotation

loadClassAnnotation方法:

读源码，loadClassAnnotation方法是读取类的各类Annotation，然后进行相应的处理。看到的Annotation有Resources 、 Resource 、EJB、WebServiceRef和DeclareRoles，但是就目前的源码来看，处理EJB和WebServiceRef的代码是注释掉的，上网查了注释里面的JSR，这里是连接https://en.wikipedia.org/wiki/JSR_250，将来可以去研究，现在只关注源码，最后处理Resource和DeclareRoles都会调用相应的方法，处理Resource的方法是addResource(Context context, Resource annotation,String defaultName, Class defaultType)，主要逻辑是通过annotation的type来分别实例化resource相关的类，最后都要context.getNamingResources().addEnvironment(resource)，调用这行代码，添加到StandardContext的NamingResoures中，而处理DeclareRoles的主要逻辑是读取DeclareRoles的value，然后循环context.addSecurityRole(String role)

添加到securityRoles中。

loadFieldsAnnotation方法：

读取classClass上字段的Annotation Resource，调用context.addResource方法，不同的是会有defaultName和defaultType，defaultName=classClass.getName+/+field.getName,defaultType=field.getType

loadMethodsAnnotation方法：

读取classClass方法上的Annotation Resource，调用context.addResource方法，不同的是会有defaultName和defaultType，defaultName=classClass.getName+/+方法名,defaultType是该方法第一个参数的type，但是该方法要满足下面的条件

```java
public static boolean isValidSetter(Method method) {
if (method.getName().startsWith("set")
        && method.getName().length() > 3
        && method.getParameterTypes().length == 1
        && method.getReturnType().getName().equals("void")) {
    return true;
}
return false;
```

**validateSecurityRoles****方法：**

```java
protected void validateSecurityRoles() {
//Constraints，webConfig 方法step9 处理得到
        SecurityConstraint constraints[] = context.findConstraints();
        for (int i = 0; i < constraints.length; i++) {
            String roles[] = constraints[i].findAuthRoles();
//处理<security-constraint>配置的role
            for (int j = 0; j < roles.length; j++) {
//如果<security-constraint>配置的role不等于*并且不在SecurityRoles中，调用context.addSecurityRole
                if (!"*".equals(roles[j]) &&
                    !context.findSecurityRole(roles[j])) {
                    log.warn(sm.getString("contextConfig.role.auth", roles[j]));
                    context.addSecurityRole(roles[j]);
                }
            }
        }
//处理<servlet>配置的role
        Container wrappers[] = context.findChildren();
        for (int i = 0; i < wrappers.length; i++) {
            Wrapper wrapper = (Wrapper) wrappers[i];
            String runAs = wrapper.getRunAs();
            if ((runAs != null) && !context.findSecurityRole(runAs)) {
                log.warn(sm.getString("contextConfig.role.runas", runAs));
                context.addSecurityRole(runAs);
            }
            String names[] = wrapper.findSecurityReferences();
            for (int j = 0; j < names.length; j++) {
                String link = wrapper.findSecurityReference(names[j]);
                if ((link != null) && !context.findSecurityRole(link)) {
                    log.warn(sm.getString("contextConfig.role.link", link));
                    context.addSecurityRole(link);
                }
            }
        }
}
```

**authenticatorConfig()****方法：**

```java
protected void authenticatorConfig() {
        LoginConfig loginConfig = context.getLoginConfig();
        SecurityConstraint constraints[] = context.findConstraints();
        if (context.getIgnoreAnnotations() &&
                (constraints == null || constraints.length ==0) &&
                !context.getPreemptiveAuthentication())  {
            return;
        } else {
//loginConfig是空，则默认使用new LoginConfig("NONE", null, null, null)
            if (loginConfig == null) {
                loginConfig = DUMMY_LOGIN_CONFIG;
                context.setLoginConfig(loginConfig);
            }
        }
//需要配置Authenticator，沒有配置就不会进行处理
        if (context.getAuthenticator() != null) {
            return;
        }
//必须给这个context配置realm，没配置则会报错
        if (context.getRealm() == null) {
            log.error(sm.getString("contextConfig.missingRealm"));
            ok = false;
            return;
        }
        /*
         * First check to see if there is a custom mapping for the login
         * method. If so, use it. Otherwise, check if there is a mapping in
         * org/apache/catalina/startup/Authenticators.properties.
         */
        Valve authenticator = null;
        if (customAuthenticators != null) {
            authenticator = (Valve) customAuthenticators.get(loginConfig.getAuthMethod());
        }
        if (authenticator == null) {
// authenticators static静态块中读取 org/apache/catalina/startup/Authenticators.properties文件得到的properties
            if (authenticators == null) {
                log.error(sm.getString("contextConfig.authenticatorResources"));
                ok = false;
                return;
            }
//通过该context的loginconfig配置的AuthMethod实例化类Authenticator
            String authenticatorName = 
authenticators.getProperty(loginConfig.getAuthMethod());
            if (authenticatorName == null) {
                log.error(sm.getString("contextConfig.authenticatorMissing",
                                 loginConfig.getAuthMethod()));
                ok = false;
                return;
            }
            try {
                Class<?> authenticatorClass = Class.forName(authenticatorName);
                authenticator = (Valve) authenticatorClass.newInstance();
            } catch (Throwable t) {
                ExceptionUtils.handleThrowable(t);
                log.error(sm.getString(
                                    "contextConfig.authenticatorInstantiate",
                                    authenticatorName),
                          t);
                ok = false;
            }
        }
//添加到valves中，可以看出这个authenticator在处理请求的时候发挥作用，请求处理后面分析
        if (authenticator != null) {
            Pipeline pipeline = context.getPipeline();
            if (pipeline != null) {
                pipeline.addValve(authenticator);
                if (log.isDebugEnabled()) {
                    log.debug(sm.getString(
                                    "contextConfig.authenticatorConfigured",
                                    loginConfig.getAuthMethod()));
                }
            }
        }
}
```

**到这里****ConfigureStart****方法我们粗略的执行逻辑已经分析完了，细节到处理到具体的时候再分析，其实查看源码后发现正确对于****Context****的正确顺序应该是****beforeinit->init->afterinit->beforestart->configurationstart->afterstart****，这么看来先看了****ConfigureStart****方法，因为其它事件处理逻辑简单，现在简单看下****ConfigContext****的****lifecycle****的其他事件触发**

**CONFIGURE_STOP_EVENT --****à****configureStop****方法主要是一些清理****code****，清理****configureStart****里面实例化的资源**

**AFTER_INIT_EVENT ----->init****方法****通过****Context****那篇分析的****contextRuleSet****和****NamingRuleSet****解析处理****Context**

**AFTER_DESTROY_EVENT---****à****destroy****方法****删除掉****workDir****下的****app,workDir=CatalinaBase\Work\Enginname\hostname\appname(****默认****)**

****

*1.**loadApplicationListenerAnnotations**方法**:*
