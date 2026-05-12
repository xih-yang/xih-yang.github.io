# 04、SpringMVC源码分析 - MultipartAutoConfiguration
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/4.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

MultipartAutoConfiguration为文件上传进行默认配置。

**1、** MultipartConfigElement：ServletWebServerApplicationContext将MultipartConfigElementbean与Servletbeans关联起来，MultipartConfigElement作为ServletAPI，用于配置如何处理文件上传；

**2、** StandardServletMultipartResolver：MultipartResolver接口的标准实现，基于Servlet3.0PartAPI，作为默认实现的springMVC文件上传解析器组件；

提示：以下是本篇文章正文内容，下面案例可供参考

## 一、MultipartAutoConfiguration

```java
@Configuration(proxyBeanMethods = false)
//类路径下存在类Servlet, StandardServletMultipartResolver, MultipartConfigElement
@ConditionalOnClass({
      Servlet.class, StandardServletMultipartResolver.class, MultipartConfigElement.class })
//文件上传开关，默认开启
@ConditionalOnProperty(prefix = "spring.servlet.multipart", name = "enabled", matchIfMissing = true)
//servlet web应用环境
@ConditionalOnWebApplication(type = Type.SERVLET)
//文件上传配置信息MultipartProperties
@EnableConfigurationProperties(MultipartProperties.class)
public class MultipartAutoConfiguration {
	private final MultipartProperties multipartProperties;
	public MultipartAutoConfiguration(MultipartProperties multipartProperties) {
		this.multipartProperties = multipartProperties;
	}
	//不存在MultipartConfigElement、CommonsMultipartResolver时创建MultipartConfigElement 
	@Bean
	@ConditionalOnMissingBean({
      MultipartConfigElement.class, CommonsMultipartResolver.class })
	public MultipartConfigElement multipartConfigElement() {
		return this.multipartProperties.createMultipartConfig();
	}
	//不存在时创建MultipartResolver
	@Bean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
	@ConditionalOnMissingBean(MultipartResolver.class)
	public StandardServletMultipartResolver multipartResolver() {
		StandardServletMultipartResolver multipartResolver = new StandardServletMultipartResolver();
		multipartResolver.setResolveLazily(this.multipartProperties.isResolveLazily());
		return multipartResolver;
	}
}
```

示例：pandas 是基于NumPy 的一种工具，该工具是为了解决数据分析任务而创建的。

## 二、MultipartProperties

```java
@ConfigurationProperties(prefix = "spring.servlet.multipart", ignoreUnknownFields = false)
public class MultipartProperties {
	/**
	 * Whether to enable support of multipart uploads.
	 */
	 //文件上传开关
	private boolean enabled = true;
	/**
	 * Intermediate location of uploaded files.
	 */
	 //文件上传中间路径
	private String location;
	/**
	 * Max file size.
	 */
	 //文件最大大小
	private DataSize maxFileSize = DataSize.ofMegabytes(1);
	/**
	 * Max request size.
	 */
	 //最大请求文件大小
	private DataSize maxRequestSize = DataSize.ofMegabytes(10);
	/**
	 * Threshold after which files are written to disk.
	 */
	 //阈值，超过后文件将被写入磁盘
	private DataSize fileSizeThreshold = DataSize.ofBytes(0);
	/**
	 * Whether to resolve the multipart request lazily at the time of file or parameter
	 * access.
	 */
	 //延迟解析
	private boolean resolveLazily = false;
	/**
	 * Create a new {@link MultipartConfigElement} using the properties.
	 * @return a new {@link MultipartConfigElement} configured using there properties
	 */
	 //根据默认或自定义配置项创建MultipartConfigElement 
	public MultipartConfigElement createMultipartConfig() {
		MultipartConfigFactory factory = new MultipartConfigFactory();
		PropertyMapper map = PropertyMapper.get().alwaysApplyingWhenNonNull();
		map.from(this.fileSizeThreshold).to(factory::setFileSizeThreshold);
		map.from(this.location).whenHasText().to(factory::setLocation);
		map.from(this.maxRequestSize).to(factory::setMaxRequestSize);
		map.from(this.maxFileSize).to(factory::setMaxFileSize);
		return factory.createMultipartConfig();
	}
}
```

常用配置如下

```java
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10485760000
spring.servlet.multipart.max-request-size=52428800000
spring.servlet.multipart.location=d:/tmp
```

## 三、 StandardServletMultipartResolver注册

在DispatcherServlet初始化策略过程中，第一步会初始化文件上传解析器

```java
private void initMultipartResolver(ApplicationContext context) {
		try {
			//从spring容器中获取multipartResolver 
			this.multipartResolver = context.getBean(MULTIPART_RESOLVER_BEAN_NAME, MultipartResolver.class);
			if (logger.isTraceEnabled()) {
				logger.trace("Detected " + this.multipartResolver);
			}
			else if (logger.isDebugEnabled()) {
				logger.debug("Detected " + this.multipartResolver.getClass().getSimpleName());
			}
		}
		catch (NoSuchBeanDefinitionException ex) {
			// Default is no multipart resolver.
			//不存在时赋值为null，不支持文件上传
			this.multipartResolver = null;
			if (logger.isTraceEnabled()) {
				logger.trace("No MultipartResolver '" + MULTIPART_RESOLVER_BEAN_NAME + "' declared");
			}
		}
	}	
```
