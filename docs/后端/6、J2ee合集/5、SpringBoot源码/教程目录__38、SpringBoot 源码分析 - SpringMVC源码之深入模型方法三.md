# 38、SpringBoot 源码分析 - SpringMVC源码之深入模型方法三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/38.html
- 分类：J2EE框架
- 分组：教程目录
## 数据转换convertIfNecessary

一路调用内部最后到这里：

最后抛异常了：

这里明显会转换错误，我故意的，如果是数字的话肯定是没问题的。

这下次我改改：

有了：

## 请求参数不存在的情况createAttribute

前面分析的都是请求参数存在了，如果不存在呢，其实就是用构造方法创建一个对象。

```java
	protected Object createAttribute(String attributeName, MethodParameter parameter,
			WebDataBinderFactory binderFactory, NativeWebRequest webRequest) throws Exception {
		MethodParameter nestedParameter = parameter.nestedIfOptional();
		Class<?> clazz = nestedParameter.getNestedParameterType();
		Constructor<?> ctor = BeanUtils.findPrimaryConstructor(clazz);
		if (ctor == null) {
			Constructor<?>[] ctors = clazz.getConstructors();
			if (ctors.length == 1) {
				ctor = ctors[0];
			}
			else {
				try {
					ctor = clazz.getDeclaredConstructor();
				}
				catch (NoSuchMethodException ex) {
					throw new IllegalStateException("No primary or default constructor found for " + clazz, ex);
				}
			}
		}
		Object attribute = constructAttribute(ctor, attributeName, parameter, binderFactory, webRequest);
		if (parameter != nestedParameter) {
			attribute = Optional.of(attribute);
		}
		return attribute;
	}
```

我们尝试让请求参数不存在，这次没有`name1`了：

但是有异常了，因为我们需要int类型，这个基本类型，没有默认构造方法，那我们改成`Integer`看看：

改成`Integer`：

也一样：

因为他们都要找默认构造函数，是不存在的。所以要么有这个请求参数，要么改成其他类型，比如`String`比较好。比如我改成`Dog`吧，至少有默认构造函数，可以实例化出来。

好了，参数值获取和创建先说到这里，如果请求参数中没有对应参数的话，就会创建一个对象，等待后面的数据绑定，下篇说数据绑定。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
