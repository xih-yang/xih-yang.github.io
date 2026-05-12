# 37、SpringBoot 源码分析 - SpringMVC源码之深入模型方法二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/37.html
- 分类：J2EE框架
- 分组：教程目录
## createAttributeFromRequestValue

上篇说道，我们从请求参数里获得了属性值，但是是`String`类型的，而我们的参数需要是`int`的，所以这里会有一个绑定和转换的过程，我们来看看是怎么做的。

### 数据绑定器初始化

在创建数据绑定器`WebDataBinder`后，会进行初始化，也就是让数据绑定工厂的所有绑定方法来执行一遍，因为绑定方法那么多，不知道哪个是可以绑定上的，所以要遍历执行，先看能不能满足条件，满足条件的话就执行绑定方法，所以这里如果有很多的话，也不太会有太大的性能问题，因为可能只有一个能绑定上，甚至没有，只是会判断绑定的条件是否符合`isBinderMethodApplicable`。

#### 参数如何符合绑定方法呢

其实就是获取绑定方法上的`InitBinder`的注解属性值，其实就是参数`ModelAttribute`注解的属性名字符串数组，如果没有写名字，就是空字符串数组。如果`InitBinder`没写属性名，那就表示无条件符合，就会执行绑定方法，如果写了属性名，那会判断参数的属性名是否存在其中，存在才算满足。

遍历每一个属性名，进行比较，只要有满足的就可以了：

什么样的可以被无条件通过呢，就是一些全局的绑定方法，比如日期转换，好像这个方法老执行，是不是耗性能啊，其实不是，你看这个方法是有参数传进来的，是绑定到这个参数上，也就是数据绑定器上的：

## 数据转换

绑定器初始化完成后要进行数据的转换啦，先把属性值类型和参数类型封装成`TypeDescriptor`，然后判断是否可以转换，最后尝试转换。

### 如何判断是否可转换

当然是尝试获得转换器啦：

#### getConverter

还是老套路，先缓存，然后遍历，找到后方缓存，没找到就放`NoOpConverter`对象，表示这个类型不能转换。

```java
	@Nullable
	protected GenericConverter getConverter(TypeDescriptor sourceType, TypeDescriptor targetType) {
		ConverterCacheKey key = new ConverterCacheKey(sourceType, targetType);
		GenericConverter converter = this.converterCache.get(key);//缓存中取
		if (converter != null) {
			return (converter != NO_MATCH ? converter : null);
		}
		converter = this.converters.find(sourceType, targetType);//遍历所有的转换器取
		if (converter == null) {
			converter = getDefaultConverter(sourceType, targetType);
		}
		if (converter != null) {
			this.converterCache.put(key, converter);//放入缓存
			return converter;
		}
		this.converterCache.put(key, NO_MATCH);
		return null;
	}
```

#### GenericConversionService的find从所有转换器中寻找

具体他会获取两个类型的所有父类，依次封装成`ConvertiblePair`对象，然后进行转换器获取，因为转换器是个映射，键就是`ConvertiblePair`对象。这里按照层级归类的，先进行子类判断，最后再到父类。

```java
@Nullable
		public GenericConverter find(TypeDescriptor sourceType, TypeDescriptor targetType) {
			// Search the full type hierarchy
			List<Class<?>> sourceCandidates = getClassHierarchy(sourceType.getType());
			List<Class<?>> targetCandidates = getClassHierarchy(targetType.getType());
			for (Class<?> sourceCandidate : sourceCandidates) {
				for (Class<?> targetCandidate : targetCandidates) {
					ConvertiblePair convertiblePair = new ConvertiblePair(sourceCandidate, targetCandidate);
					GenericConverter converter = getRegisteredConverter(sourceType, targetType, convertiblePair);
					if (converter != null) {
						return converter;
					}
				}
			}
			return null;
		}
```

##### getRegisteredConverter

关键就是这里啦，converters是初始化的时候就创建的，而且把转换器都放进去了，是个`Map`映射。所以知道为什么前面要封装成`ConvertersForPair`对象了吧，为了这里快速获取。获取`ConvertersForPair`之后在从里面获取对应的转换器，如果获取不到就从全局里获取。

转换器找到了，我们下篇说说怎么转换吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
