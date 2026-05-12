# 02、SpringMVC源码分析 - DispatcherServletAutoConfiguration
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/2.html
- 分类：J2EE框架
- 分组：教程目录
## DispatcherServletAutoConfiguration

配置类中包含了四个内部类：

1、DispatcherServletConfiguration：用于注册DispatcherServlet和MultipartResolver

2、DispatcherServletRegistrationConfiguration ：用于注册DispatcherServletRegistrationBean

3、DefaultDispatcherServletCondition ：DispatcherServletConfiguration配置类的前置条件

4、DispatcherServletRegistrationCondition ：DispatcherServletRegistrationConfiguration配置类的前置条件

代码如下：

```java
//自动配置顺序
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE)
//配置类
@Configuration(proxyBeanMethods = false)
//servlet的web应用环境
@ConditionalOnWebApplication(type = Type.SERVLET)
//类路径下要有DispatcherServlet
@ConditionalOnClass(DispatcherServlet.class)
//在ServletWebServerFactoryAutoConfiguration之后自动配置
@AutoConfigureAfter(ServletWebServerFactoryAutoConfiguration.class)
public class DispatcherServletAutoConfiguration {
	/**
	 * The bean name for a DispatcherServlet that will be mapped to the root URL "/".
	 */
	public static final String DEFAULT_DISPATCHER_SERVLET_BEAN_NAME = "dispatcherServlet";
	/**
	 * The bean name for a ServletRegistrationBean for the DispatcherServlet "/".
	 */
	public static final String DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME = "dispatcherServletRegistration";
	@Configuration(proxyBeanMethods = false)
	//类实例化的条件DefaultDispatcherServletCondition
	@Conditional(DefaultDispatcherServletCondition.class)
	@ConditionalOnClass(ServletRegistration.class)
	//WebMvcProperties保存了前缀为spring.mvc的参数
	@EnableConfigurationProperties(WebMvcProperties.class)
	protected static class DispatcherServletConfiguration {
		//springmvc 的核心控制器 DispatcherServlet
		@Bean(name = DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)
		public DispatcherServlet dispatcherServlet(WebMvcProperties webMvcProperties) {
			//创建DispatcherServlet，从WebMvcProperties中获取一些自定义属性
			DispatcherServlet dispatcherServlet = new DispatcherServlet();
			dispatcherServlet.setDispatchOptionsRequest(webMvcProperties.isDispatchOptionsRequest());
			dispatcherServlet.setDispatchTraceRequest(webMvcProperties.isDispatchTraceRequest());
			dispatcherServlet.setThrowExceptionIfNoHandlerFound(webMvcProperties.isThrowExceptionIfNoHandlerFound());
			dispatcherServlet.setPublishEvents(webMvcProperties.isPublishRequestHandledEvents());
			dispatcherServlet.setEnableLoggingRequestDetails(webMvcProperties.isLogRequestDetails());
			return dispatcherServlet;
		}
		@Bean
		//MultipartResolver 在类路径下存在
		@ConditionalOnBean(MultipartResolver.class)
		//MultipartResolver bean 不存在时
		@ConditionalOnMissingBean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
		public MultipartResolver multipartResolver(MultipartResolver resolver) {
			// Detect if the user has created a MultipartResolver but named it incorrectly
			return resolver;
		}
	}
	//配置类
	@Configuration(proxyBeanMethods = false)
	//前置条件DispatcherServletRegistrationCondition
	@Conditional(DispatcherServletRegistrationCondition.class)
	//ServletRegistration在类路径下存在
	@ConditionalOnClass(ServletRegistration.class)
	@EnableConfigurationProperties(WebMvcProperties.class)
	//导入配置类DispatcherServletConfiguration
	@Import(DispatcherServletConfiguration.class)
	//创建DispatcherServletRegistrationBean，注册DispatcherServlet
	protected static class DispatcherServletRegistrationConfiguration {
		@Bean(name = DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME)
		@ConditionalOnBean(value = DispatcherServlet.class, name = DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)
		public DispatcherServletRegistrationBean dispatcherServletRegistration(DispatcherServlet dispatcherServlet,
				WebMvcProperties webMvcProperties, ObjectProvider<MultipartConfigElement> multipartConfig) {
			DispatcherServletRegistrationBean registration = new DispatcherServletRegistrationBean(dispatcherServlet,
					webMvcProperties.getServlet().getPath());
			registration.setName(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME);
			registration.setLoadOnStartup(webMvcProperties.getServlet().getLoadOnStartup());
			multipartConfig.ifAvailable(registration::setMultipartConfig);
			return registration;
		}
	}
	//DefaultDispatcherServletCondition 用于校验环境中是否存在DispatcherServlet，不存在时返回true，自动配置DispatcherServlet
	@Order(Ordered.LOWEST_PRECEDENCE - 10)
	private static class DefaultDispatcherServletCondition extends SpringBootCondition {
		@Override
		public ConditionOutcome getMatchOutcome(ConditionContext context, AnnotatedTypeMetadata metadata) {
			ConditionMessage.Builder message = ConditionMessage.forCondition("Default DispatcherServlet");
			ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
			//通过类型查找dispatchServlet
			List<String> dispatchServletBeans = Arrays
					.asList(beanFactory.getBeanNamesForType(DispatcherServlet.class, false, false));
			if (dispatchServletBeans.contains(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)) {
				return ConditionOutcome
						.noMatch(message.found("dispatcher servlet bean").items(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME));
			}
			//通过名字查找dispatchServlet
			if (beanFactory.containsBean(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)) {
				return ConditionOutcome.noMatch(
						message.found("non dispatcher servlet bean").items(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME));
			}
			if (dispatchServletBeans.isEmpty()) {
				return ConditionOutcome.match(message.didNotFind("dispatcher servlet beans").atAll());
			}
			return ConditionOutcome.match(message.found("dispatcher servlet bean", "dispatcher servlet beans")
					.items(Style.QUOTE, dispatchServletBeans)
					.append("and none is named " + DEFAULT_DISPATCHER_SERVLET_BEAN_NAME));
		}
	}
	//DispatcherServletRegistrationCondition 用于校验环境中是否存在DispatcherServletRegistrationBean，不存在时返回true，自动配置DispatcherServletRegistrationBean
	@Order(Ordered.LOWEST_PRECEDENCE - 10)
	private static class DispatcherServletRegistrationCondition extends SpringBootCondition {
		@Override
		public ConditionOutcome getMatchOutcome(ConditionContext context, AnnotatedTypeMetadata metadata) {
			ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
			//检查dispatcherServlet是否存在
			ConditionOutcome outcome = checkDefaultDispatcherName(beanFactory);
			if (!outcome.isMatch()) {
				return outcome;
			}
			//检查dispatcherServletRegistration是否存在
			return checkServletRegistration(beanFactory);
		}
		private ConditionOutcome checkDefaultDispatcherName(ConfigurableListableBeanFactory beanFactory) {
			boolean containsDispatcherBean = beanFactory.containsBean(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME);
			if (!containsDispatcherBean) {
				return ConditionOutcome.match();
			}
			List<String> servlets = Arrays
					.asList(beanFactory.getBeanNamesForType(DispatcherServlet.class, false, false));
			if (!servlets.contains(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)) {
				return ConditionOutcome.noMatch(
						startMessage().found("non dispatcher servlet").items(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME));
			}
			return ConditionOutcome.match();
		}
		private ConditionOutcome checkServletRegistration(ConfigurableListableBeanFactory beanFactory) {
			ConditionMessage.Builder message = startMessage();
			List<String> registrations = Arrays
					.asList(beanFactory.getBeanNamesForType(ServletRegistrationBean.class, false, false));
			boolean containsDispatcherRegistrationBean = beanFactory
					.containsBean(DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME);
			if (registrations.isEmpty()) {
				if (containsDispatcherRegistrationBean) {
					return ConditionOutcome.noMatch(message.found("non servlet registration bean")
							.items(DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME));
				}
				return ConditionOutcome.match(message.didNotFind("servlet registration bean").atAll());
			}
			if (registrations.contains(DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME)) {
				return ConditionOutcome.noMatch(message.found("servlet registration bean")
						.items(DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME));
			}
			if (containsDispatcherRegistrationBean) {
				return ConditionOutcome.noMatch(message.found("non servlet registration bean")
						.items(DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME));
			}
			return ConditionOutcome.match(message.found("servlet registration beans").items(Style.QUOTE, registrations)
					.append("and none is named " + DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME));
		}
		private ConditionMessage.Builder startMessage() {
			return ConditionMessage.forCondition("DispatcherServlet Registration");
		}
	}
}
```
