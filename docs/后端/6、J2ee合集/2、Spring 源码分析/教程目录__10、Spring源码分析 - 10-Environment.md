# 10、Spring源码分析 - 10-Environment
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/10.html
- 分类：J2EE框架
- 分组：教程目录
Environment扩展了PropertyResolver接口，定义了代表当前应用程序所处的运行环境的方法。

```java
public interface Environment extends PropertyResolver {
   String[] getActiveProfiles();//显示激活的运行环境
   String[] getDefaultProfiles();//默认的运行环境
   boolean acceptsProfiles(String... profiles);//有一个存在返回true
}
```

ConfigurableEnvironment定义了可以设置profiles并提供PropertySource的方法。

```java
public interface ConfigurableEnvironment extends Environment, ConfigurablePropertyResolver {
   void setActiveProfiles(String... profiles);
   void addActiveProfile(String profile);
   void setDefaultProfiles(String... profiles);
   MutablePropertySources getPropertySources();
   Map<String, Object> getSystemEnvironment();
   Map<String, Object> getSystemProperties();
   void merge(ConfigurableEnvironment parent);
}
```

AbstractEnvironment作为实现了ConfigurableEnvironment的基类，封装了接口所有方法的实现。

```java
private final Set<String> activeProfiles = new LinkedHashSet<>();
private final Set<String> defaultProfiles = new LinkedHashSet<>(getReservedDefaultProfiles());
//数据源
private final MutablePropertySources propertySources = new MutablePropertySources(this.logger);
//ConfigurablePropertyResolver接口方法都委托此对象完成
private final ConfigurablePropertyResolver propertyResolver = new PropertySourcesPropertyResolver(this.propertySources);
```

构造函数中调用了customizePropertySources()完成初始化，这个方法需要子类覆盖填充propertySources。

```java
public AbstractEnvironment() {
	customizePropertySources(this.propertySources);
	if (logger.isDebugEnabled()) {
		logger.debug("Initialized " + getClass().getSimpleName() + " with PropertySources " + this.propertySources);
	}
}
```

StandardEnvironment中添加了一个name=systemProperties的MapPropertySource和name=systemEnvironment的SystemEnvironmentPropertySource，分别提供对系统属性和环境变量的访问。

```java
public class StandardEnvironment extends AbstractEnvironment {
   public static final String SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME = "systemEnvironment";
   public static final String SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME = "systemProperties";
   @Override
   protected void customizePropertySources(MutablePropertySources propertySources) {
      propertySources.addLast(new MapPropertySource(SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME, getSystemProperties()));
      propertySources.addLast(new SystemEnvironmentPropertySource(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, getSystemEnvironment()));
   }
}
```

StandardServletEnvironment中添加了两个站位的StubPropertySource分别代表提供访问ServletConfig和ServletContext。当调用initPropertySources()方法的时候会用参数传过来的servletContext和servletConfig替换掉站位StubPropertySource。

```java
public class StandardServletEnvironment extends StandardEnvironment implements ConfigurableWebEnvironment {
   public static final String SERVLET_CONTEXT_PROPERTY_SOURCE_NAME = "servletContextInitParams";
   public static final String SERVLET_CONFIG_PROPERTY_SOURCE_NAME = "servletConfigInitParams";
   public static final String JNDI_PROPERTY_SOURCE_NAME = "jndiProperties";
   @Override
   protected void customizePropertySources(MutablePropertySources propertySources) {
      propertySources.addLast(new StubPropertySource(SERVLET_CONFIG_PROPERTY_SOURCE_NAME));
      propertySources.addLast(new StubPropertySource(SERVLET_CONTEXT_PROPERTY_SOURCE_NAME));
      if (JndiLocatorDelegate.isDefaultJndiEnvironmentAvailable()) {
         propertySources.addLast(new JndiPropertySource(JNDI_PROPERTY_SOURCE_NAME));
      }
      super.customizePropertySources(propertySources);
   }
   @Override
   public void initPropertySources(@Nullable ServletContext servletContext, @Nullable ServletConfig servletConfig) {
      WebApplicationContextUtils.initServletPropertySources(getPropertySources(), servletContext, servletConfig);
   }
}
```
