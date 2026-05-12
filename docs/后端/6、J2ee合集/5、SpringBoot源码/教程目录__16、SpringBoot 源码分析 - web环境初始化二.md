# 16、SpringBoot 源码分析 - web环境初始化二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/16.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图，方便查看

## TomcatServletWebServerFactory实例化过程

### 实例化

`bean`生命周期，首先是实例化：

### 初始化之前处理

实例化完成后，进行初始化之前，有处理器要处理，就是我们前面注册的`WebServerFactoryCustomizerBeanPostProcessor`：

#### WebServerFactoryCustomizerBeanPostProcessor的postProcessBeforeInitialization

这个里面有个`lambda`表达式的操作，其实就是先`getCustomizers()`获取所有的`WebServerFactoryCustomizer`集合，然后`invoke`调用每一个的`customize`方法做定制化，我们来看看具体的怎么做的。

```java
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		if (bean instanceof WebServerFactory) {
			postProcessBeforeInitialization((WebServerFactory) bean);
		}
		return bean;
	}
	private void postProcessBeforeInitialization(WebServerFactory webServerFactory) {
		LambdaSafe.callbacks(WebServerFactoryCustomizer.class, getCustomizers(), webServerFactory)
				.withLogger(WebServerFactoryCustomizerBeanPostProcessor.class)
				.invoke((customizer) -> customizer.customize(webServerFactory));
	}
```

#### getCustomizers

如果不存在这些定制化器，就进行获取，然后排序，变成不可变集合返回。

```java
	private Collection<WebServerFactoryCustomizer<?>> getCustomizers() {
		if (this.customizers == null) {
			// Look up does not include the parent context
			this.customizers = new ArrayList<>(getWebServerFactoryCustomizerBeans());
			this.customizers.sort(AnnotationAwareOrderComparator.INSTANCE);
			this.customizers = Collections.unmodifiableList(this.customizers);
		}
		return this.customizers;
	}
```

##### getWebServerFactoryCustomizerBeans

从容器里获取`WebServerFactoryCustomizer`类型的集合返回。

```java
	private Collection<WebServerFactoryCustomizer<?>> getWebServerFactoryCustomizerBeans() {
		return (Collection) this.beanFactory.getBeansOfType(WebServerFactoryCustomizer.class, false, false).values();
	}
```

我们来看看这些都在哪里：

接下去我们看他们定制化了什么。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
