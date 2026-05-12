# 10、SpringBoot 源码分析 - 自动配置深度分析三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/10.html
- 分类：J2EE框架
- 分组：教程目录
## refresh和自动配置大致流程

## AutoConfigurationImportSelector的getAutoConfigurationEntry获取自动配置实体(重点)

前面讲了那么多，都是为了这里啊，不然直接上来都不知道是怎么来的，我们来看看这个干了什么，别看就那么点，其实里面很复杂，简单的说就是从我们初始化加载的所有的`jar`包下的`META-INF/spring.factories`属性中找到`org.springframework.boot.autoconfigure.EnableAutoConfiguration`属性，其实这个时候以及有缓存啦，前面初始化的时候已经全加载过了。然后进行去重，再获取要排除的名字，检查排除的类的合理性，然后排除，再进行条件类过滤，因为可能有些配置类缺少某些类就不能用了，触发自动装配导入事件，最后封装成`AutoConfigurationEntry`返回。

```java
protected AutoConfigurationEntry getAutoConfigurationEntry(AutoConfigurationMetadata autoConfigurationMetadata,
			AnnotationMetadata annotationMetadata) {
		if (!isEnabled(annotationMetadata)) {
			return EMPTY_ENTRY;
		}
		AnnotationAttributes attributes = getAttributes(annotationMetadata);
		List<String> configurations = getCandidateConfigurations(annotationMetadata, attributes);//获取自动装配类
		configurations = removeDuplicates(configurations);//去重
		Set<String> exclusions = getExclusions(annotationMetadata, attributes);//获取要排除的
		checkExcludedClasses(configurations, exclusions);//检查要排除的
		configurations.removeAll(exclusions);//排除
		configurations = filter(configurations, autoConfigurationMetadata);//过滤
		fireAutoConfigurationImportEvents(configurations, exclusions);//触发导入事件
		return new AutoConfigurationEntry(configurations, exclusions);
	}
```

主要自动配置类都在这里，当然我们可以自定义，后面我们会自定义一个：

### AutoConfigurationImportSelector的getCandidateConfigurations获取EnableAutoConfiguration类型的名字集合

这个代码我们前面很熟悉啊，就不多说了，从缓存中加载对应`EnableAutoConfiguration`类型的类名字，最终加载了`124`个，好多啊，没关系，后面过滤就没那么多了。

### AutoConfigurationImportSelector的removeDuplicates去重

这个很巧妙，放进`Set`里又拿出来放进`List`里：

```java
	protected final <T> List<T> removeDuplicates(List<T> list) {
		return new ArrayList<>(new LinkedHashSet<>(list));
	}
```

### AutoConfigurationImportSelector的getExclusions获取要排除的

其实就是从注解属性的`exclude`和`excludeName`获取，当然还有个环境配置属性`spring.autoconfigure.exclude`也可以，就是说可以在`yml`或者`propertise`里配啦，其他就不多说了。

### AutoConfigurationImportSelector的checkExcludedClasses检查要排除的

其实就是看下要排除的在不在自动配置集合里，有不在的就报异常，可能要排除的并不是自动配置的类，表示无效排除：

```java
	private void checkExcludedClasses(List<String> configurations, Set<String> exclusions) {
		List<String> invalidExcludes = new ArrayList<>(exclusions.size());
		for (String exclusion : exclusions) {
			if (ClassUtils.isPresent(exclusion, getClass().getClassLoader()) && !configurations.contains(exclusion)) {
				invalidExcludes.add(exclusion);//不在自动配置类里，还要排除的，属于无效排除，要抛异常
			}
		}
		if (!invalidExcludes.isEmpty()) {
			handleInvalidExcludes(invalidExcludes);
		}
	}
	protected void handleInvalidExcludes(List<String> invalidExcludes) {
		StringBuilder message = new StringBuilder();
		for (String exclude : invalidExcludes) {
			message.append("\t- ").append(exclude).append(String.format("%n"));
		}
		throw new IllegalStateException(String.format(
				"The following classes could not be excluded because they are not auto-configuration classes:%n%s",
				message));
	}
```

### AutoConfigurationImportSelector的filter过滤

这里会获取过滤器，其实就是`OnClassCondition`，`OnWebApplicationCondition`，`OnBeanCondition`这几个条件，他会去配置类的注解上查找相应的条件类是否存在，不存在就会被过滤掉，过滤的时候可能会开启线程，帮助一起处理，因为配置类数量多。如果多核的话，会用启动一个线程去分担一半数量的检查，会判断条件类是否能加载到，不能就被过滤掉了，如果用多个线程可能效果不太好，`spring`团队应该做过实验，`2`个最好。

具体的细节下次说。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
