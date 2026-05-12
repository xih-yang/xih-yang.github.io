# 02、SpringBoot 源码分析 - SpringApplication启动流程二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/2.html
- 分类：J2EE框架
- 分组：教程目录
## 初始化基本流程

## setInitializers设置初始化器

我们来看看这一句话做了什么：

```java
setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
```

### getSpringFactoriesInstances获取Spring工厂实例

好像是获取某个类型的集合，类型就是`ApplicationContextInitializer`，兴趣加载一堆名字，然后创建实例，然后排序返回，我们看看具体怎么做的：

```java
	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type) {
		return getSpringFactoriesInstances(type, new Class<?>[] {
     });
	}
	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
		ClassLoader classLoader = getClassLoader();//获取系统加载器，就是线程上下文加载器
		// Use names and ensure unique to protect against duplicates
		Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));//获取type实现类的名字集合
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}
```

### SpringFactoriesLoader的loadFactoryNames

其实这里就是最开始说的，去加载`jar`包下的`META-INF/spring.factories`加载相应属性的值，这里就是`org.springframework.context.ApplicationContextInitialize`属性。

```java
	public static List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader) {
		String factoryTypeName = factoryType.getName();//获取类的全限定名，org.springframework.context.ApplicationContextInitialize
		return loadSpringFactories(classLoader).getOrDefault(factoryTypeName, Collections.emptyList());//获取org.springframework.context.ApplicationContextInitialize的值的数组
	}
```

#### loadSpringFactories加载META-INF/spring.factories

先从缓存里取一个`MultiValueMap`，这个是一个一对多的映射集合，比如说一个接口，对应多个实现啦。然后获取所有依赖的`jar`包下的`META-INF/spring.factories`的`url`，再去加载相应的数据，然后把值用逗号分隔符分开，然后把值去空格后和键一起都放入`MultiValueMap`中，顺便放入缓存里。

```java
public static final String FACTORIES_RESOURCE_LOCATION = "META-INF/spring.factories";
private static Map<String, List<String>> loadSpringFactories(@Nullable ClassLoader classLoader) {
		MultiValueMap<String, String> result = cache.get(classLoader);
		if (result != null) {
			return result;
		}
		try {
     //获取URL路径
			Enumeration<URL> urls = (classLoader != null ?
					classLoader.getResources(FACTORIES_RESOURCE_LOCATION) ://META-INF/spring.factories
					ClassLoader.getSystemResources(FACTORIES_RESOURCE_LOCATION));
			result = new LinkedMultiValueMap<>();
			while (urls.hasMoreElements()) {
     //变量URL，获取配置属性，加到result里
				URL url = urls.nextElement();
				UrlResource resource = new UrlResource(url);
				Properties properties = PropertiesLoaderUtils.loadProperties(resource);
				for (Map.Entry<?, ?> entry : properties.entrySet()) {
					String factoryTypeName = ((String) entry.getKey()).trim();
					for (String factoryImplementationName : StringUtils.commaDelimitedListToStringArray((String) entry.getValue())) {
     //值用逗号分割负分开，都放入result中
						result.add(factoryTypeName, factoryImplementationName.trim());
					}
				}
			}
			cache.put(classLoader, result);
			return result;
		}
		catch (IOException ex) {
			throw new IllegalArgumentException("Unable to load factories from location [" +
					FACTORIES_RESOURCE_LOCATION + "]", ex);
		}
	}
```

##### PropertiesLoaderUtils的loadProperties加载资源文件

内部关键的我贴一下，获取输入流，获取资源名字，处理的是`xml`的或者其他的类型。

```java
	private static final String XML_FILE_EXTENSION = ".xml";
public static void fillProperties(Properties props, Resource resource) throws IOException {
		InputStream is = resource.getInputStream();
		try {
			String filename = resource.getFilename();
			if (filename != null && filename.endsWith(XML_FILE_EXTENSION)) {
				props.loadFromXML(is);
			}
			else {
				props.load(is);
			}
		}
		finally {
			is.close();
		}
	}
```

从`org/springframework/boot/spring-boot/2.2.6.RELEASE/spring-boot-2.2.6.RELEASE.jar!/META-INF/spring.factories`里

解析出这些，其实就是键值对，有些值是多个，用逗号分割的：

最后你会看到那么多：

#### SpringApplication的createSpringFactoriesInstances创建相关类型的实例

进行反射创建实例并返回。

```java
	private <T> List<T> createSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes,
			ClassLoader classLoader, Object[] args, Set<String> names) {
		List<T> instances = new ArrayList<>(names.size());
		for (String name : names) {
			try {
     //进行反射实例化
				Class<?> instanceClass = ClassUtils.forName(name, classLoader);
				Assert.isAssignable(type, instanceClass);//判断instanceClass是type的类型或者子类
				Constructor<?> constructor = instanceClass.getDeclaredConstructor(parameterTypes);
				T instance = (T) BeanUtils.instantiateClass(constructor, args);//实例化
				instances.add(instance);
			}
			catch (Throwable ex) {
				throw new IllegalArgumentException("Cannot instantiate " + type + " : " + name, ex);
			}
		}
		return instances;
	}
```

#### AnnotationAwareOrderComparator的sort根据优先级排序

初始化可能有优先顺序的，所以要进行排序，如果没有实现`Ordered`接口的一律优先级最低的，内部是这样排序的，`PriorityOrdered`优先，然后是`Ordered`：

```java
	private int doCompare(@Nullable Object o1, @Nullable Object o2, @Nullable OrderSourceProvider sourceProvider) {
		boolean p1 = (o1 instanceof PriorityOrdered);
		boolean p2 = (o2 instanceof PriorityOrdered);
		if (p1 && !p2) {
			return -1;
		}
		else if (p2 && !p1) {
			return 1;
		}
		int i1 = getOrder(o1, sourceProvider);
		int i2 = getOrder(o2, sourceProvider);
		return Integer.compare(i1, i2);
	}
```

排序前：

排序后：

其实如果你自己写的想早点初始化，就可以实现`PriorityOrdered`或者`Ordered`，返回小点的值就好啦。

### SpringApplication的setInitializers

最后把他们放进`ArrayList`里，后面肯定会有用，后面再讲吧。

```java
	public void setInitializers(Collection<? extends ApplicationContextInitializer<?>> initializers) {
		this.initializers = new ArrayList<>(initializers);
	}
```

至此设置初始化器讲完了，下次继续。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
