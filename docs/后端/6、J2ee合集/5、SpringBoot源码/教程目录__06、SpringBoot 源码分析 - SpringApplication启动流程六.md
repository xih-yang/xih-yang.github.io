# 06、SpringBoot 源码分析 - SpringApplication启动流程六
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/6.html
- 分类：J2EE框架
- 分组：教程目录
## 初始化基本流程

## SpringApplication的prepareEnvironment准备环境

```java
private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners,
			ApplicationArguments applicationArguments) {
		// Create and configure the environment
		ConfigurableEnvironment environment = getOrCreateEnvironment();//获取环境
		configureEnvironment(environment, applicationArguments.getSourceArgs());
		ConfigurationPropertySources.attach(environment);//ConfigurationPropertySources附加到环境一次
		listeners.environmentPrepared(environment);//广播环境准备好的事件
		bindToSpringApplication(environment);//绑定到SpringApplication
		if (!this.isCustomEnvironment) {
			environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
					deduceEnvironmentClass());//推断环境，如果不是这个类型，要进行切换
		}
		ConfigurationPropertySources.attach(environment);//又附加一次，主要是为了放最前面
		return environment;
	}
```

### SpringApplication的getOrCreateEnvironment创建环境

根据前面的`webApplicationType`判断要创建哪种环境。

```java
	private ConfigurableEnvironment getOrCreateEnvironment() {
		if (this.environment != null) {
			return this.environment;
		}
		switch (this.webApplicationType) {
		case SERVLET:
			return new StandardServletEnvironment();
		case REACTIVE:
			return new StandardReactiveWebEnvironment();
		default:
			return new StandardEnvironment();
		}
	}
```

### configureEnvironment配置环境

这里主要是配置了很多的类型转换器和格式转换器，另外两个跟换进属性相关

```java
	protected void configureEnvironment(ConfigurableEnvironment environment, String[] args) {
		if (this.addConversionService) {
			ConversionService conversionService = ApplicationConversionService.getSharedInstance();//配置转换器
			environment.setConversionService((ConfigurableConversionService) conversionService);//设置到环境中去
		}
		configurePropertySources(environment, args);//配置默认属性
		configureProfiles(environment, args);//配置代码添加的环境
	}
```

#### ApplicationConversionService的getSharedInstance配置转换器

这个里面有配置很多转换器，我就不多讲了，自己看就行了。

其他剩下的暂时不讲，因为比较复杂，很多都是一些属性的配置，比如会获取你的`spring.profiles.active`信息，而且是`ConfigFileApplicationListener`收到环境准备好的事件后做的事，当然还有其他的一些配置信息，我们还是先把主线弄明白再搞细节，不过这里配置完成会进行广播，这次的事件是`ApplicationEnvironmentPreparedEvent`：

## SpringApplication的printBanner打印banner

内部支持 `"gif", "jpg", "png"，"txt"`：

默认把资源放到`resources`下，名字为`banner.xxx`就可以了，自己可以去试试：

我们经常看到的默认的在这里面：

## createApplicationContext创建上下文

根据类型创建对应的上下文对象，默认全是注解

```java
	protected ConfigurableApplicationContext createApplicationContext() {
		Class<?> contextClass = this.applicationContextClass;
		if (contextClass == null) {
			try {
					switch (this.webApplicationType) {
				case SERVLET://AnnotationConfigServletWebServerApplicationContext
					contextClass = Class.forName(DEFAULT_SERVLET_WEB_CONTEXT_CLASS);
					break;
				case REACTIVE://AnnotationConfigReactiveWebServerApplicationContext
					contextClass = Class.forName(DEFAULT_REACTIVE_WEB_CONTEXT_CLASS);
					break;
				default://AnnotationConfigApplicationContext
					contextClass = Class.forName(DEFAULT_CONTEXT_CLASS);
				}
			}
			catch (ClassNotFoundException ex) {
				throw new IllegalStateException(
						"Unable create a default ApplicationContext, please specify an ApplicationContextClass", ex);
			}
		}
		return (ConfigurableApplicationContext) BeanUtils.instantiateClass(contextClass);
	}
```

准备环境这里比较复杂，可以写很多，这个还是细节的时候去看，先把脉络理完吧，后面讲上下文的准备，这个也很重要，准备完了就是`spring`的核心`refresh`了。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
