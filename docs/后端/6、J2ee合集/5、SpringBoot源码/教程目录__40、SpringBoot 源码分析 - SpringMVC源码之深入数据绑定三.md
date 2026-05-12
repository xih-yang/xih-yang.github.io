# 40、SpringBoot 源码分析 - SpringMVC源码之深入数据绑定三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/40.html
- 分类：J2EE框架
- 分组：教程目录
## 验证请求参数跟类方法匹配

我把`Dog`类方法的一些属性名改了：

继续按方法的名字去掉前缀发送：

结果可以：

那我把方法名字改下，后面都加`1`：

结果这两个参数没绑定：

## 结论

参数绑定跟方法的匹配，而且需要有`set`方法。比如`setBirth`，参数名字可以是`Birth`或者`birth`。

`CachedIntrospectionResults`构造方法里会进行设置。

判断可不可写的时候会获取：

获取到之后会进行封装，封装成`BeanPropertyHandler`：

是否可读可写就是看有没有读方法和写方法：

所以说这里属性是否可被绑定是跟属性`set`方法名字相关的，有兴趣的朋友可以调试下，里面还是比较深的。

## 绑定

参数名字修改完后就是这个样子，已经没有`d.`前缀了，其他的一些检查我就不说了，自己可以去看，我们接下去看怎么绑定到对象上的：

### applyPropertyValues

就是遍历参数，然后设置：

最后到`AbstractNestablePropertyAccessor`的`processLocalProperty`方法：

获取值，然后转换，最后赋值。

```java
private void processLocalProperty(PropertyTokenHolder tokens, PropertyValue pv) {
		PropertyHandler ph = getLocalPropertyHandler(tokens.actualName);
		...
		Object oldValue = null;
		try {
			Object originalValue = pv.getValue();//获取参数值
			Object valueToApply = originalValue;
			if (!Boolean.FALSE.equals(pv.conversionNecessary)) {
				if (pv.isConverted()) {
					valueToApply = pv.getConvertedValue();
				}
				else {
					if (isExtractOldValueForEditor() && ph.isReadable()) {
						...
							oldValue = ph.getValue();
						...
					//进行类型转换
					valueToApply = convertForProperty(
							tokens.canonicalName, oldValue, originalValue, ph.toTypeDescriptor());
				}
				pv.getOriginalPropertyValue().conversionNecessary = (valueToApply != originalValue);
			}
			ph.setValue(valueToApply);//设置值
		}
```

最终还是调用反射`set`方法，传入参数：

看调用栈：

其实里面涉及了很多东西，太深入讲不完，又枯燥，现在知道是怎么绑定的就好了，简单的说就是**按照set方法名字进行请求参数的匹配，然后反射调用set方法传入参数来设置属性**。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
