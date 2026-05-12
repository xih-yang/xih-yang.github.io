# 08、SpringBoot 源码分析 - 自动配置深度分析一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/8.html
- 分类：J2EE框架
- 分组：教程目录
## refresh和自动配置大致流程

## 如何自动配置

我们看下这段代码，红色框是什么放入的注册类，其实这就是我们要注册的配置类，自动装配跟他有关：

为什么呢，因为他头上有注解`SpringBootApplication`：

所以其实你只要传一个头上有这个注解的类就可以了，不一定要是`main`方法的类。

## SpringBootApplication注解

那为什么就有这个注解就能自动配置呢，我们来看看这个注解，其他你可以不管，但是`EnableAutoConfiguration`你得看：

首先这个是一个配置类，可以被解析，因为有`SpringBootConfiguration`注解，被`Configuration`注解了：

这样我们的`SpringBootApplication`就类似于我们经常配置的`java`配置类。有了这个前提，我们就可以先看这个配置类的解析过程，其实就是`ConfigurationClassPostProcessor`的解析处理，解析流程我以前的`spring`源码文章都讲过，其中`processImports`的处理也特别讲过，会先递归获取所有`import`进来的类，然后按不同类型进行判断处理，重点就是这里啦，我们先来看下`EnableAutoConfiguration`注解是不是有`import`呢。

### EnableAutoConfiguration注解

有个`AutoConfigurationImportSelector`被import，其实还有一个在AutoConfigurationPackage注解里，暂时不说，重点是`AutoConfigurationImportSelector`。

#### AutoConfigurationImportSelector自动配置导入选择器

看下他的结构，左边不用管，就是为了回调拿到一些属性，好对容器操作，主要是右边，我们前面`spring`的文章讲过ImportSelector的原理，想看的朋友可以看下这篇[文章](https://blog.csdn.net/wangwei19871103/article/details/105255669)，有这个基础对下面的理解比较好，因为这里还有个`DeferredImportSelector`，他会在`ConfigurationClassParser`解析方法的最后来处理。

可以看到，他被处理的时候：

`DeferredImportSelectorHandler`就是专门来处理这些`DeferredImportSelector`的。

#### DeferredImportSelectorHandler的handle

首先会封装一个持有器`DeferredImportSelectorHolder` ，如果`deferredImportSelectors`为空，表示在被`DeferredImportSelectorGroupingHandler`处理中，`DeferredImportSelectorGroupingHandler`又是什么呢，其实我们要处理的`DeferredImportSelectorHolder`会根据`Group`进行分组，来区分不同的`ImportSelector`，比如我们这个自动装配的`AutoConfigurationImportSelector`，是属于`AutoConfigurationGroup`类型的，分组处理方便，到时候只需要遍历所有组中的`ImportSelector`统一处理即可。因为处理的方式是迭代器循环，所以不能添加，只能直接处理，当然如果不为空，表示没有在处理，可以添加到`deferredImportSelectors`集合里。

```java
		public void handle(ConfigurationClass configClass, DeferredImportSelector importSelector) {
			DeferredImportSelectorHolder holder = new DeferredImportSelectorHolder(configClass, importSelector);
			if (this.deferredImportSelectors == null) {
     //直接处理
				DeferredImportSelectorGroupingHandler handler = new DeferredImportSelectorGroupingHandler();
				handler.register(holder);
				handler.processGroupImports();
			}
			else {
				this.deferredImportSelectors.add(holder);//添加
			}
		}
```

#### DeferredImportSelectorGroupingHandler的register注册DeferredImportSelectorHolder

可以看到组处理器里面会有一个`groupings` 映射，就是来存放`Group`类别和`DeferredImportSelectorGrouping`映射的，同一个`Group`类别里面可以很多个`DeferredImportSelectorGrouping`，因为`DeferredImportSelectorGrouping`里面有集合。

```java
		//自动装配类型和组映射
		private final Map<Object, DeferredImportSelectorGrouping> groupings = new LinkedHashMap<>();
		//注解属性和配置类的映射
		private final Map<AnnotationMetadata, ConfigurationClass> configurationClasses = new HashMap<>();
		//注册分组
		public void register(DeferredImportSelectorHolder deferredImport) {
			Class<? extends Group> group = deferredImport.getImportSelector().getImportGroup();
			DeferredImportSelectorGrouping grouping = this.groupings.computeIfAbsent(
					(group != null ? group : deferredImport),
					key -> new DeferredImportSelectorGrouping(createGroup(group)));//创建组
			grouping.add(deferredImport);//创建一个组，并加入DeferredImportSelectorHolder
			this.configurationClasses.put(deferredImport.getConfigurationClass().getMetadata(),
					deferredImport.getConfigurationClass());//将注解属性和ConfigurationClass映射
		}
```

#### DeferredImportSelectorGrouping

这里就是同一个组的会添加进`deferredImports`集合。

其实是比较绕的，绕了几层，我画个图看了清晰：

后面将注册后怎么处理`processGroupImports`。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
