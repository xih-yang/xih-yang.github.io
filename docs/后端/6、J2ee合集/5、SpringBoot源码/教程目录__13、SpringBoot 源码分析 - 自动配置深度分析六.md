# 13、SpringBoot 源码分析 - 自动配置深度分析六
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/13.html
- 分类：J2EE框架
- 分组：教程目录
## refresh和自动配置大致流程

## AutoConfigurationImportSelector的fireAutoConfigurationImportEvents通知自动配置导入事件

其实就是获取所有的`AutoConfigurationImportListener`类型的监听器。然后广播`AutoConfigurationImportEvent`事件，具体他们收到后怎么做的自己可以去看，不多说了。

```java
	private void fireAutoConfigurationImportEvents(List<String> configurations, Set<String> exclusions) {
		List<AutoConfigurationImportListener> listeners = getAutoConfigurationImportListeners();
		if (!listeners.isEmpty()) {
			AutoConfigurationImportEvent event = new AutoConfigurationImportEvent(this, configurations, exclusions);
			for (AutoConfigurationImportListener listener : listeners) {
				invokeAwareMethods(listener);
				listener.onAutoConfigurationImportEvent(event);
			}
		}
	}
```

最后把配置类名字结合和排除集合封装成`AutoConfigurationEntry`返回。继续`DeferredImportSelectorGrouping`的处理。

## AutoConfigurationGroup的selectImports封装成Entry返回

这里又一次的进行了排除，我猜估计是为了防止自定义的接受`AutoConfigurationImportEvent`事件的监听器又添加了什么要排除的，貌似是个扩展点啊。最后用流式编程生成`List`返回。

```java
@Override
		public Iterable<Entry> selectImports() {
			if (this.autoConfigurationEntries.isEmpty()) {
				return Collections.emptyList();
			}
			Set<String> allExclusions = this.autoConfigurationEntries.stream()
					.map(AutoConfigurationEntry::getExclusions).flatMap(Collection::stream).collect(Collectors.toSet());
			Set<String> processedConfigurations = this.autoConfigurationEntries.stream()
					.map(AutoConfigurationEntry::getConfigurations).flatMap(Collection::stream)
					.collect(Collectors.toCollection(LinkedHashSet::new));
			processedConfigurations.removeAll(allExclusions);//又排除了一次，可能前的一些处理会带来重复的
			//封装成Entry的list返回
			return sortAutoConfigurations(processedConfigurations, getAutoConfigurationMetadata()).stream()
					.map((importClassName) -> new Entry(this.entries.get(importClassName), importClassName))
					.collect(Collectors.toList());
		}
```

然后就是迭代每一个自动配置类，进行`processImports`递归调用：

至此自动配置类的解析完成了，后面的`bean`定义加载就不说了，以前`spring`源码讲过的，可以去看看这篇[文章](https://blog.csdn.net/wangwei19871103/article/details/105256504)。

前面说过要搞个自定义的自动配置的，我们试试吧。

## MyAutoConfiguration自动配置类

```java
@Configuration(proxyBeanMethods = false)
@Configuration
public class MyAutoConfiguration {
    public MyAutoConfiguration(){
        System.out.println("MyAutoConfiguration");
    }
}
```

### 创建META-INF文件夹和文件spring.factories

内容就你自定义自动配置类全限定名：

然后看结果：

结果成功：

你觉得没那么简单，这个配置类能用不？你还可以加点料稍微测试下：

结果也会如你所愿：

是不是很简单啊，其实只要你懂原理，这些都是很简单的东西，真的就只是模仿`spring`的那些配置类好了，当然你要根据自己的业务和需求来，但是原理是一样的，虽然是花了不少时间弄明白这个，但是这个是一本万利的，你懂原理，除了问题好解决，比你百度一大堆，靠猜靠试效率多了，所以我还是建议看源码，懂原理是上上策，这是一种投资。好了不瞎`BB`了，下次我们来自己写一个自己的`starter`吧。真的很感叹`spring`的强大，如果要是能精通源码，绝对让你锦上添花啊，加油，共勉吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
