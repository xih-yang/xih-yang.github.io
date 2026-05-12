# 50、SpringBoot 源码分析 - ConfigFileApplicationListener配置文件加载原理一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/50.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图

## 配置文件加载原理

我们最常用的就是`application.yml`配置文件，里面有各种配置信息，然后我们可以将他们和我们的配置属性类绑定，然后使用，有关配置文件属性绑定到配置属性类的原理，可以看这篇[文章](https://blog.csdn.net/wangwei19871103/article/details/105718933)。本篇想讲下配置文件是什么时候加载进来的原理。

## ConfigFileApplicationListener

他属于自动配置里的一个监听器，初始化的时候会进行加载，自动配置原理就不多说了。

### 何时加载配置文件

其实是在环境准备好的时候，会有一个`ApplicationEnvironmentPreparedEvent`事件通知，而`ConfigFileApplicationListener`就是接受这个通知的，这个里面就是有加载配置文件相关的处理：

#### ConfigFileApplicationListener的onApplicationEnvironmentPreparedEvent

其实内部就这么一个方法，他获取了所有的环境相关的处理器EnvironmentPostProcessor，然后将自己添加进去，最后排序再逐个遍历执行`postProcessEnvironment`方法。

```java
	private void onApplicationEnvironmentPreparedEvent(ApplicationEnvironmentPreparedEvent event) {
		List<EnvironmentPostProcessor> postProcessors = loadPostProcessors();
		postProcessors.add(this);
		AnnotationAwareOrderComparator.sort(postProcessors);
		for (EnvironmentPostProcessor postProcessor : postProcessors) {
			postProcessor.postProcessEnvironment(event.getEnvironment(), event.getSpringApplication());
		}
	}
```

##### loadPostProcessors

就是用`SpringFactoriesLoader`去加载`EnvironmentPostProcessor`类型的处理器，做个不需要多说了吧，做个时候已经有缓存了，直接获取反射创建实例就可以了。

```java
	List<EnvironmentPostProcessor> loadPostProcessors() {
		return SpringFactoriesLoader.loadFactories(EnvironmentPostProcessor.class, getClass().getClassLoader());
	}
```

##### EnvironmentPostProcessor处理器

遍历的就是这些处理器，其中重点是`ConfigFileApplicationListener`自身。

###### postProcessEnvironment#

添加属性源，首先会添加一个`RandomValuePropertySource`到属性源里，做个就是一个随机属性。

```java
	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		addPropertySources(environment, application.getResourceLoader());
	}
	protected void addPropertySources(ConfigurableEnvironment environment, ResourceLoader resourceLoader) {
		RandomValuePropertySource.addToEnvironment(environment);
		new Loader(environment, resourceLoader).load();
	}
```

###### ConfigFileApplicationListener的Loader#

重要的是这个加载器，要为加载文件做准备啦，环境属性源，属性解析器，属性加载器都准备好了：

下面就是核心的`load`方法了，看起来好像没多少东西，其实东西还挺多，下篇继续：

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
