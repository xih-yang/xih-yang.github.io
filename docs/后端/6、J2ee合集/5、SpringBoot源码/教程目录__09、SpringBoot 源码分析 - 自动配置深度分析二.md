# 09、SpringBoot 源码分析 - 自动配置深度分析二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/9.html
- 分类：J2EE框架
- 分组：教程目录
## refresh和自动配置大致流程

### DeferredImportSelectorHandler的process处理

前面说道这里：

其实第一次进去的时候是放进集合里的：

因为这个`deferredImportSelectors`成员变量初始化的时候就创建了:

放进去之后就执行其他，最后都解析完到这里，就是前面说的`DeferredImportSelector`类型的会等其他解析完，最后处理：

这里就是处理逻辑，其实就是创建`DeferredImportSelectorGroupingHandler`，然后把前面放进去的`DeferredImportSelectorHolder`都拿出来，都注册到里面去，就是前面讲的分组注册，最后处理，处理完之后还要创建`deferredImportSelectors`，这里就是避免迭代器在迭代的时候还要新的元素添加进来，会出问题。

```java
	public void process() {
			List<DeferredImportSelectorHolder> deferredImports = this.deferredImportSelectors;
			this.deferredImportSelectors = null;//设置为空，如果有新的就会直接注册处理
			try {
				if (deferredImports != null) {
     //如果有存在DeferredImportSelector
					DeferredImportSelectorGroupingHandler handler = new DeferredImportSelectorGroupingHandler();
					deferredImports.sort(DEFERRED_IMPORT_COMPARATOR);
					deferredImports.forEach(handler::register);//迭代注册到DeferredImportSelectorGroupingHandler
					handler.processGroupImports();//处理
				}
			}
			finally {
				this.deferredImportSelectors = new ArrayList<>();//处理完了再创建
			}
		}
```

#### processGroupImports处理

为什么要这么分组，这里就体现出来了，看他怎么处理的，遍历所有的`ImportSelector`组，获取所有`import`的实体`Entry`，其实这个时候已经把要自动配置的类找到了，然后迭代去进行递归`processImports`处理。

```java
public void processGroupImports() {
			for (DeferredImportSelectorGrouping grouping : this.groupings.values()) {
				Predicate<String> exclusionFilter = grouping.getCandidateFilter();
				grouping.getImports().forEach(entry -> {
     //每一个自动配置类都要进行processImports处理
					ConfigurationClass configurationClass = this.configurationClasses.get(entry.getMetadata());
					try {
						processImports(configurationClass, asSourceClass(configurationClass, exclusionFilter),
								Collections.singleton(asSourceClass(entry.getImportClassName(), exclusionFilter)),
								exclusionFilter, false);
					}
					catch (BeanDefinitionStoreException ex) {
						throw ex;
					}
					catch (Throwable ex) {
						throw new BeanDefinitionStoreException(
								"Failed to process import candidates for configuration class [" +
										configurationClass.getMetadata().getClassName() + "]", ex);
					}
				});
			}
		}
```

##### DeferredImportSelectorGrouping的处理getImports

这里要开始处理了，其实是要组`group`对象来处理对应的`DeferredImportSelector`集合，最后在返回`Iterable`实体迭代器，就是已经把自动配置的类名集合封装成迭代器了。

```java
		public Iterable<Group.Entry> getImports() {
			for (DeferredImportSelectorHolder deferredImport : this.deferredImports) {
				this.group.process(deferredImport.getConfigurationClass().getMetadata(),
						deferredImport.getImportSelector());
			}
			return this.group.selectImports();
		}
```

##### AutoConfigurationGroup的处理getImports

其实这里关键的是`AutoConfigurationImportSelector`的`getAutoConfigurationEntry`获取`AutoConfigurationEntry`，这里面封装着自动配置类名字集合，后面只是放到对应的映射里，方便用。

```java
	@Override
		public void process(AnnotationMetadata annotationMetadata, DeferredImportSelector deferredImportSelector) {
			...
			AutoConfigurationEntry autoConfigurationEntry = ((AutoConfigurationImportSelector) deferredImportSelector)
					.getAutoConfigurationEntry(getAutoConfigurationMetadata(), annotationMetadata);//获取自动装配实体
			this.autoConfigurationEntries.add(autoConfigurationEntry);
			for (String importClassName : autoConfigurationEntry.getConfigurations()) {
				this.entries.putIfAbsent(importClassName, annotationMetadata);
			}//建立配置类名和注解属性的映射
		}
```

接下去我们主要要看`AutoConfigurationImportSelector`这个类啦。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
