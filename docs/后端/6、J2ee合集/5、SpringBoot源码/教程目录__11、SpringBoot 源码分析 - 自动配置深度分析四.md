# 11、SpringBoot 源码分析 - 自动配置深度分析四
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/11.html
- 分类：J2EE框架
- 分组：教程目录
## refresh和自动配置大致流程

## AutoConfigurationGroup的getAutoConfigurationMetadata加载自动配置元数据

差点把这个细节忘记了，不好意思啊，这个要说下，不然后面说到怎么进行条件过滤的会不知道数据怎么来匹配的。

```java
	private AutoConfigurationMetadata getAutoConfigurationMetadata() {
			if (this.autoConfigurationMetadata == null) {
				this.autoConfigurationMetadata = AutoConfigurationMetadataLoader.loadMetadata(this.beanClassLoader);
			}
			return this.autoConfigurationMetadata;
		}
```

原来还有一个加载的文件`META-INF/spring-autoconfigure-metadata.properties`：

这里加载的就是自动配置类上的条件类，也就是说过滤的时候会判断这些类是否存在或者不存在才能加载。

比如说`JdbcTemplateAutoConfiguration`，上面的`ConditionalOnClass`注解表示需要有这两个类才能加载。

这个信息就配置在`META-INF/spring-autoconfigure-metadata.properties`里，其实是为了方便后面的加载判断，直接写全限定名方便尝试加载：

```java
org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration.ConditionalOnClass=javax.sql.DataSource,org.springframework.jdbc.core.JdbcTemplate
```

还有比如`ConditionalOnSingleCandidate`注解：

```java
org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration.ConditionalOnSingleCandidate=javax.sql.DataSource
```

所以总共属性有`486`个，超过配置类个数，每个都有过滤条件，可能还有好几个条件。

好了，这里铺垫好了，就可以继续讲过滤了。

## FilteringSpringBootCondition的match过滤器匹配

过滤器有三个：

每一个都会去匹配那么多配置类，所以他开了线程，看这个红色框的方法。

### OnClassCondition的getOutcomes

如果是多核的话，就开启一个线程处理。

#### OnClassCondition的getOutcomes

这里就是会开一个子线程去检查一半的量，最后在进行合并，这里不用担心主线程会先执行完可能出问题，因为里面用了`join`，会等待子线程做完为止再继续执行。

```java
	private ConditionOutcome[] resolveOutcomesThreaded(String[] autoConfigurationClasses,
			AutoConfigurationMetadata autoConfigurationMetadata) {
		int split = autoConfigurationClasses.length / 2;//分一半
		OutcomesResolver firstHalfResolver = createOutcomesResolver(autoConfigurationClasses, 0, split,
				autoConfigurationMetadata);//开启一个线程，做一半的匹配
		OutcomesResolver secondHalfResolver = new StandardOutcomesResolver(autoConfigurationClasses, split,
				autoConfigurationClasses.length, autoConfigurationMetadata, getBeanClassLoader());
		ConditionOutcome[] secondHalf = secondHalfResolver.resolveOutcomes();//先主线程检查
		ConditionOutcome[] firstHalf = firstHalfResolver.resolveOutcomes();//让新建线程检查完再继续
		ConditionOutcome[] outcomes = new ConditionOutcome[autoConfigurationClasses.length];
		System.arraycopy(firstHalf, 0, outcomes, 0, firstHalf.length);
		System.arraycopy(secondHalf, 0, outcomes, split, secondHalf.length);
		return outcomes;//最后汇总到这里返回
	}
```

具体的细节下次说吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
