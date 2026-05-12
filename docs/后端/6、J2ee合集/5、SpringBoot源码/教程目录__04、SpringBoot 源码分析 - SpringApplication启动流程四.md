# 04、SpringBoot 源码分析 - SpringApplication启动流程四
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/4.html
- 分类：J2EE框架
- 分组：教程目录
## 初始化基本流程

## SimpleApplicationEventMulticaster的multicastEvent广播事件

其实这个就是观察者模式，发布订阅模式，或者说事件驱动模式，如果看过netty就知道他里面的处理器的方法就是事件驱动模式，有兴趣的话可以看下我的[netty](https://blog.csdn.net/wangwei19871103/category_9681495.html)哈哈。废话不多说，我们继续，这里会先进行事件类型解析，解析成`ResolvableType`类型。

```java
	@Override
	public void multicastEvent(ApplicationEvent event) {
		multicastEvent(event, resolveDefaultEventType(event));
	}
```

### resolveDefaultEventType获取ResolvableType实例

```java
	private ResolvableType resolveDefaultEventType(ApplicationEvent event) {
		return ResolvableType.forInstance(event);
	}
```

#### ResolvableType的forInstance创建ResolvableType实例

如果是`ResolvableTypeProvider`类型就会获取类型实例返回，否则会创建一个`ResolvableType` 对象，将事件类型封装进去。

```java
	public static ResolvableType forInstance(Object instance) {
		Assert.notNull(instance, "Instance must not be null");
		if (instance instanceof ResolvableTypeProvider) {
			ResolvableType type = ((ResolvableTypeProvider) instance).getResolvableType();
			if (type != null) {
				return type;
			}
		}
		return ResolvableType.forClass(instance.getClass());
	}
	public static ResolvableType forClass(@Nullable Class<?> clazz) {
		return new ResolvableType(clazz);//创建一个，把clazz封装进去
	}
```

### 开始广播

获取所有监听器，如果没有执行器就直接调用，有的话会开线程调用，最终都是`invokeListener`。

```java
	public void multicastEvent(final ApplicationEvent event, @Nullable ResolvableType eventType) {
		ResolvableType type = (eventType != null ? eventType : resolveDefaultEventType(event));//检查类型，不是就创建一个
		Executor executor = getTaskExecutor();
		for (ApplicationListener<?> listener : getApplicationListeners(event, type)) {
			if (executor != null) {
				executor.execute(() -> invokeListener(listener, event));
			}
			else {
				invokeListener(listener, event);
			}
		}
	}
```

#### AbstractApplicationEventMulticaster的getApplicationListeners获取所有支持该事件的监听器

现在有个启动事件，但是不一定所有监听器都要支持该事件，如果不支持表示对此事件不关心，那就不需要通知给他了，所以这里就是为了找出支持该事件的监听器集合，找出来之后还会给事件和监听器集合做映射，放入缓存中。

```java
protected Collection<ApplicationListener<?>> getApplicationListeners(
			ApplicationEvent event, ResolvableType eventType) {
		Object source = event.getSource();//获取事件源，就是事件是谁触发的
		Class<?> sourceType = (source != null ? source.getClass() : null);//事件源类型
		ListenerCacheKey cacheKey = new ListenerCacheKey(eventType, sourceType);//封装事件类型和事件源类型
		// 从缓存中获取
		ListenerRetriever retriever = this.retrieverCache.get(cacheKey);//获取监听器检索其
		if (retriever != null) {
			return retriever.getApplicationListeners();//有就直接返回对应的监听器集合
		}
		//可以用缓存的情况
		if (this.beanClassLoader == null ||
				(ClassUtils.isCacheSafe(event.getClass(), this.beanClassLoader) &&
						(sourceType == null || ClassUtils.isCacheSafe(sourceType, this.beanClassLoader)))) {
			// Fully synchronized building and caching of a ListenerRetriever
			synchronized (this.retrievalMutex) {
				retriever = this.retrieverCache.get(cacheKey);
				if (retriever != null) {
     //双重检测
					return retriever.getApplicationListeners();
				}
				retriever = new ListenerRetriever(true);
				Collection<ApplicationListener<?>> listeners =//获取支持该事件的监听器集合，并放入retriever中
						retrieveApplicationListeners(eventType, sourceType, retriever);
				this.retrieverCache.put(cacheKey, retriever);//将事件和监听器集合映射
				return listeners;
			}
		}
		else {
     //不用缓存的情况，每次都取一遍
			// No ListenerRetriever caching -> no synchronization necessary
			return retrieveApplicationListeners(eventType, sourceType, null);
		}
	}
```

#### ListenerRetriever

这个其实就是存监听器的，但是只是对某些事件支持的监听器集合，可以是实例，也可以是`bean`的名字。

##### getApplicationListeners直接获取监听器集合

直接获取就是将`bean`名字的集合里的`bean`都实例化，然后跟监听器合并，去重，最后返回。

```java
	public Collection<ApplicationListener<?>> getApplicationListeners() {
			List<ApplicationListener<?>> allListeners = new ArrayList<>(//尝试将两个合起来
					this.applicationListeners.size() + this.applicationListenerBeans.size());
			allListeners.addAll(this.applicationListeners);
			if (!this.applicationListenerBeans.isEmpty()) {
				BeanFactory beanFactory = getBeanFactory();
				for (String listenerBeanName : this.applicationListenerBeans) {
     //实例化bean并加入进去
					try {
     //直接获取
						ApplicationListener<?> listener = beanFactory.getBean(listenerBeanName, ApplicationListener.class);
						if (this.preFiltered || !allListeners.contains(listener)) {
							allListeners.add(listener);//去重后添加进去
						}
					}
					catch (NoSuchBeanDefinitionException ex) {
					}
				}
			}
			if (!this.preFiltered || !this.applicationListenerBeans.isEmpty()) {
				AnnotationAwareOrderComparator.sort(allListeners);
			}
			return allListeners;
		}
```

#### AbstractApplicationEventMulticaster的retrieveApplicationListeners

这个就是根据监听器是否支持该事件，进行监听器的筛选，最后把支持的监听器集合返回。其实还会涉及到`bean`名字的集合，支持该事件的会直接获取，然后放进不同的集合里，最后都会讲所有支持的监听器全部返回。这里会把监听器集合也放在`ListenerRetriever`里，以便于做事件类型和监听器集合的映射缓存。

```java
private Collection<ApplicationListener<?>> retrieveApplicationListeners(
			ResolvableType eventType, @Nullable Class<?> sourceType, @Nullable ListenerRetriever retriever) {
		List<ApplicationListener<?>> allListeners = new ArrayList<>();
		Set<ApplicationListener<?>> listeners;
		Set<String> listenerBeans;
		synchronized (this.retrievalMutex) {
     //获取SimpleApplicationEventMulticaster添加监听器的时候就加入进去的监听器集合
			listeners = new LinkedHashSet<>(this.defaultRetriever.applicationListeners);
			listenerBeans = new LinkedHashSet<>(this.defaultRetriever.applicationListenerBeans);
		}
		for (ApplicationListener<?> listener : listeners) {
     //遍历所有的监听器，看监听器是否支持该事件
			if (supportsEvent(listener, eventType, sourceType)) {
				if (retriever != null) {
					retriever.applicationListeners.add(listener);//支持就添加进去
				}
				allListeners.add(listener);//也添加到allListeners里
			}
		}
		if (!listenerBeans.isEmpty()) {
     //如果有监听的bean的话，也要加进去
			ConfigurableBeanFactory beanFactory = getBeanFactory();
			for (String listenerBeanName : listenerBeans) {
				try {
					if (supportsEvent(beanFactory, listenerBeanName, eventType)) {
     //支持该事件的直接获取
						ApplicationListener<?> listener =
								beanFactory.getBean(listenerBeanName, ApplicationListener.class);
						if (!allListeners.contains(listener) && supportsEvent(listener, eventType, sourceType)) {
							if (retriever != null) {
								if (beanFactory.isSingleton(listenerBeanName)) {
									retriever.applicationListeners.add(listener);
								}
								else {
									retriever.applicationListenerBeans.add(listenerBeanName);
								}
							}
							allListeners.add(listener);
						}
					}
					else {
     //不支持就删除
						Object listener = beanFactory.getSingleton(listenerBeanName);
						if (retriever != null) {
							retriever.applicationListeners.remove(listener);
						}
						allListeners.remove(listener);
					}
				}
				catch (NoSuchBeanDefinitionException ex) {
				}
			}
		}
		AnnotationAwareOrderComparator.sort(allListeners);
		if (retriever != null && retriever.applicationListenerBeans.isEmpty()) {
			retriever.applicationListeners.clear();
			retriever.applicationListeners.addAll(allListeners);//添加一遍，防止漏了
		}
		return allListeners;
	}
```

还有个是否支持该事件没讲，后面讲吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
