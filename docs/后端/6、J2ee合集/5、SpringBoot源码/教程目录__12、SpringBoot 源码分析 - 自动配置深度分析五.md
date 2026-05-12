# 12、SpringBoot 源码分析 - 自动配置深度分析五
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/12.html
- 分类：J2EE框架
- 分组：教程目录
## refresh和自动配置大致流程

## OnClassCondition的createOutcomesResolver创建结果解析器

创建一个结果解析器对象，然后把起始索引和终止索引传进去，然后封装到`ThreadedOutcomesResolver`里。

```java
	private OutcomesResolver createOutcomesResolver(String[] autoConfigurationClasses, int start, int end,
			AutoConfigurationMetadata autoConfigurationMetadata) {
		OutcomesResolver outcomesResolver = new StandardOutcomesResolver(autoConfigurationClasses, start, end,
				autoConfigurationMetadata, getBeanClassLoader());
		try {
			return new ThreadedOutcomesResolver(outcomesResolver);
		}
		catch (AccessControlException ex) {
			return outcomesResolver;
		}
	}
```

这个里面就会开个子线程，然后再线程里面进行结果解析。

### StandardOutcomesResolver的resolveOutcomes解析结果

```java
		@Override
		public ConditionOutcome[] resolveOutcomes() {
			return getOutcomes(this.autoConfigurationClasses, this.start, this.end, this.autoConfigurationMetadata);
		}
```

就是遍历，然后获取对应条件的类名，这里就是我前面说的从`META-INF/spring-autoconfigure-metadata.properties`加载进来的，进行加载检查。

```java
	private ConditionOutcome[] getOutcomes(String[] autoConfigurationClasses, int start, int end,
				AutoConfigurationMetadata autoConfigurationMetadata) {
			ConditionOutcome[] outcomes = new ConditionOutcome[end - start];
			for (int i = start; i < end; i++) {
				String autoConfigurationClass = autoConfigurationClasses[i];
				if (autoConfigurationClass != null) {
					String candidates = autoConfigurationMetadata.get(autoConfigurationClass, "ConditionalOnClass");
					if (candidates != null) {
						outcomes[i - start] = getOutcome(candidates);
					}
				}
			}
			return outcomes;
		}
```

#### StandardOutcomesResolver的getOutcome

如果有逗号的，说明有好几个，所以就循环尝试。

```java
	private ConditionOutcome getOutcome(String candidates) {
			try {
				if (!candidates.contains(",")) {
					return getOutcome(candidates, this.beanClassLoader);
				}
				for (String candidate : StringUtils.commaDelimitedListToStringArray(candidates)) {
					ConditionOutcome outcome = getOutcome(candidate, this.beanClassLoader);
					if (outcome != null) {
						return outcome;
					}
				}
			}
			catch (Exception ex) {
				// We'll get another chance later
			}
			return null;
		}
```

根据条件类型匹配，能匹配其实返回的是`null`，匹配不到才会相关信息对象。

```java
		private ConditionOutcome getOutcome(String className, ClassLoader classLoader) {
			if (ClassNameFilter.MISSING.matches(className, classLoader)) {
				return ConditionOutcome.noMatch(ConditionMessage.forCondition(ConditionalOnClass.class)
						.didNotFind("required class").items(Style.QUOTE, className));
			}
			return null;
		}
```

#### ClassNameFilter的MISSING判断是否没有

是个枚举，判断要加载的类是否存在。

```java
		MISSING {
			@Override
			public boolean matches(String className, ClassLoader classLoader) {
				return !isPresent(className, classLoader);
			}
		};
```

最终是这里：

如果不存在就会有这样的信息对象：

### ThreadedOutcomesResolver的resolveOutcomes让线程join

如果子线程没解析完，主线程解析完后，会调用到这里，还是会然子线程完成了，把结果返回才继续的。

### 解析后的结果

是不是觉得很奇怪，前面索引少了几个，其实不是，只有没满足条件的才会放一个信息对象，满足条件的是`null`，所以没显示出来。

这个只是`OnClassCondition`一个条件过滤器，还有其他两个，原理一样的，只是内部判断可能比较复杂，这个自己研究研究吧。最终会生成一个是否匹配的数组，刚好`true`的地方就是前面`null`而没显示的地方：

最终全部过滤后只剩下`23`个满足条件的：

其他的下次说吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
