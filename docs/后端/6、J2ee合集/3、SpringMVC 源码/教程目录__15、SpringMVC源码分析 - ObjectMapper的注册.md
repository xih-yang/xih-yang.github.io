# 15、SpringMVC源码分析 - ObjectMapper的注册
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/15.html
- 分类：J2EE框架
- 分组：教程目录
## 一、JacksonObjectMapperConfiguration

创建@Bean ObjectMapper ，通过Jackson2ObjectMapperBuilder

```java
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(Jackson2ObjectMapperBuilder.class)
	static class JacksonObjectMapperConfiguration {
		@Bean
		@Primary
		@ConditionalOnMissingBean
		ObjectMapper jacksonObjectMapper(Jackson2ObjectMapperBuilder builder) {
			return builder.createXmlMapper(false).build();
		}
	}
```

## 二、JacksonObjectMapperBuilderConfiguration

创建@Bean Jackson2ObjectMapperBuilder，通过Jackson2ObjectMapperBuilderCustomizer实现定制化

```java
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(Jackson2ObjectMapperBuilder.class)
	static class JacksonObjectMapperBuilderConfiguration {
		@Bean
		@Scope("prototype")
		@ConditionalOnMissingBean
		Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder(ApplicationContext applicationContext,
				List<Jackson2ObjectMapperBuilderCustomizer> customizers) {
			Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
			builder.applicationContext(applicationContext);
			//实现定制化
			customize(builder, customizers);
			return builder;
		}
		private void customize(Jackson2ObjectMapperBuilder builder,
				List<Jackson2ObjectMapperBuilderCustomizer> customizers) {
			for (Jackson2ObjectMapperBuilderCustomizer customizer : customizers) {
				//调用Jackson2ObjectMapperBuilderCustomizer 的customize()
				customizer.customize(builder);
			}
		}
	}
```

## 三、Jackson2ObjectMapperBuilderCustomizerConfiguration

创建@Bean StandardJackson2ObjectMapperBuilderCustomizer

注入参数 JacksonProperties

```java
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(Jackson2ObjectMapperBuilder.class)
	@EnableConfigurationProperties(JacksonProperties.class)
	static class Jackson2ObjectMapperBuilderCustomizerConfiguration {
		@Bean
		StandardJackson2ObjectMapperBuilderCustomizer standardJacksonObjectMapperBuilderCustomizer(
				ApplicationContext applicationContext, JacksonProperties jacksonProperties) {
			return new StandardJackson2ObjectMapperBuilderCustomizer(applicationContext, jacksonProperties);
		}
```

}

## 四、StandardJackson2ObjectMapperBuilderCustomizer

实现了Jackson2ObjectMapperBuilderCustomizer，并通过配置文件配置JacksonProperties 的属性来实现定制化

```java
static final class StandardJackson2ObjectMapperBuilderCustomizer
				implements Jackson2ObjectMapperBuilderCustomizer, Ordered {
			private final ApplicationContext applicationContext;
			private final JacksonProperties jacksonProperties;
			StandardJackson2ObjectMapperBuilderCustomizer(ApplicationContext applicationContext,
					JacksonProperties jacksonProperties) {
				this.applicationContext = applicationContext;
				this.jacksonProperties = jacksonProperties;
			}
			@Override
			public int getOrder() {
				return 0;
			}
			@Override
			//定制化的方法
			public void customize(Jackson2ObjectMapperBuilder builder) {
				if (this.jacksonProperties.getDefaultPropertyInclusion() != null) {
					builder.serializationInclusion(this.jacksonProperties.getDefaultPropertyInclusion());
				}
				if (this.jacksonProperties.getTimeZone() != null) {
					builder.timeZone(this.jacksonProperties.getTimeZone());
				}
				configureFeatures(builder, FEATURE_DEFAULTS);
				configureVisibility(builder, this.jacksonProperties.getVisibility());
				configureFeatures(builder, this.jacksonProperties.getDeserialization());
				configureFeatures(builder, this.jacksonProperties.getSerialization());
				configureFeatures(builder, this.jacksonProperties.getMapper());
				configureFeatures(builder, this.jacksonProperties.getParser());
				configureFeatures(builder, this.jacksonProperties.getGenerator());
				configureDateFormat(builder);
				configurePropertyNamingStrategy(builder);
				configureModules(builder);
				configureLocale(builder);
			}
			......
}
```

## 总结

可以通过实现Jackson2ObjectMapperBuilderCustomizer来定制化ObjectMapper 。
