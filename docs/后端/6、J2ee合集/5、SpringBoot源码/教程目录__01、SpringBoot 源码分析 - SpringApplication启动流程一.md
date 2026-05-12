# 01、SpringBoot 源码分析 - SpringApplication启动流程一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/1.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

前面分析了`spring`的源码，就是为了分析`Spring Boot`做铺垫，`Spring Boot`之所以能那么强大，扩展性那么好，底层还是依赖`spring`，他的注解，他的处理器，他的监听器，可以有无数的扩展，废话不多说，当然还是老习惯，这次要分析`Spring Boot 2.2.6.RELEASE`版本的，要搞懂`Spring Boot`的原理，得先从他的初始化开始，然后层层深入，各个击破。其实很多人说看源码比较累，这个不可否认，又是英语，又是代码，又不知道作者想表达什么，只能边看边猜边调试，这也是个学习的过程啊，一个锻炼你学习能力的过程，一开始是很难，但是事件久了你看到别人的源码，你自己就能猜到他可能要做点什么，是怎么做的，这些是你不看源码不可能有的反应，这个就跟小时候为什么经常看小说的人写作都比不看的人要厉害，我是深有体会的。我看到有人说我们不需要看源码，只要会用就好了，那我想说，你不明白原理，你能用的好么，然后又有人会反驳，你开车不用理解车的原理吧，你照样可以开的溜，我想说是的，开车的时候我是个消费者，但是我们程序员写代码的时候是生成者，角色定位要清楚，你写的东西，你自己都不了解，出了问题找别人？`4S`店给修`BUG`么，还不是自己得来，你不看源码，你都不知道内部机制是怎么样，你就用上了，关键你肯定用不好啊。`Spring Boot`够简单了吧，跟开车一样，基本不需要什么经验吧，但是我可以说稍微报个错，你根本不知道要怎么办，因为不了解原理，然后你可能就百度啊，猜啊，这不浪费时间么，源码里面都写的很明明白白的，说句不好听的，`3`年经验，可能就是百度，`CRUD`，写业务逻辑了`3`年，表面上好像自己踩过很多坑，解决了很多问题，其实很多可能就是源码里，你不熟悉，导致你用不好，问题就多，其实你花一个月看源码，里面都有你要的答案和可能暴露的问题。

当然我只是这么说说，如果你觉得源码不重要，也没关系，你能用的好也行，但是这个貌似不符合客观规律，或许我的认知有局限吧，但是我还是认为源码很重要，或许你不能成为框架的设计者，但是你可以通过源码去跟他们交流，去体会，去学习，终有一天也可以有机会封神，我想大神门也不可能一开始脑子里什么设计模式，架构全都在了，就写出框架了，他们也是模仿，尝试，修改，创新，成神的吧。从投资的角度讲，我觉得看源码属于长线投资，比如`spring`源码，你搞懂`70%`，基本其他的源码问题都不大了，我就是在`netty`的源码上看`spring`的，虽然`spring`相对复杂，但是很多东西还是通的，其实你会发现`netty`的处理器，就是`spring`的`aop`思想的一种映射。`spring`的反应式的`web`框架我没看过，但是我猜应该跟`netty`的`IO`模型应该有很大相似之处，异步事件通知，`IO`多路复用。看过`netty`你会觉得他把性能压榨到爆了要，连一个轮询算法也要用位操作优化，里面能用位操作的基本都用上了，位图的一系列位操作更是经典，`jemalloc`改进版的内存分配算法提升了多处理器的性能，最大程度的避免了线程之间的竞争，还有各种池化缓存，改进版`ThredLocal`，`selectKeys`等等，基本都是为了提高性能，内存的使用优化也非常棒。而`spring`则在另一个可扩展的维度上登峰造极了，你可以任意扩展，甚至可以把它内部的处理器全替换了，自己来实现解析，来掌管`bean`的生命周期。`Spring Boot`又更加进了一步，使用更加简单，约定大于配置。

好了，不瞎扯了，研究源码的目的其实是为了更好的使用，和更好的扩展，当然是为了实际项目服务，解决问题，不是为了看而看，只有真正了解了原理，你才可以用的得心应手，出了问题也不怕，万变不离其宗。

## 初始化基本流程

## SpringApplication.run

我们从最简单的例子开始，就这些东西，我们看看`SpringApplication.run`到底做了什么事。

内部还有`run`：

这次是关键：

### SpringApplication构造方法

首先创建一个集合存放我们传进去的类，然后推断应用程序的类型，是`SERVLET`，还是`REACTIVE`，然后获取很多`jar`包下的`META-INF/spring.factories`中的`org.springframework.context.ApplicationContextInitializer`属性的值和`org.springframework.context.ApplicationListener`属性的值，其实他们是接口，他们的值就是其实就是实现类，也就是说要获取这些接口的实现类，来做一些初始化工作，当然里面会做一些筛选，去重。然后推断出`main`方法的类，他用了一种很巧妙的方式，抛出一个异常，然后再方法栈里找有`main`方法的那个类，具体的细节后面会说。

```java
	public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
		this.resourceLoader = resourceLoader;
		Assert.notNull(primarySources, "PrimarySources must not be null");
		this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
		this.webApplicationType = WebApplicationType.deduceFromClasspath();
		setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
		setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
		this.mainApplicationClass = deduceMainApplicationClass();
	}
```

### WebApplicationType的deduceFromClasspath推断Web应用程序类型

要对照这些类看：

这个逻辑我就不讲了，就是排他的，要么`REACTIVE`，要么`SERVLET`，要么就普通的。具体是根据`Class.forName`反射的，而且如果一次不行，还会进行内部类的反射，否没有的话才捕获异常，返回`false`。可以看到如果同时有`REACTIVE`和`SERVLET`的相关类，会判定是`SERVLET`。

```java
static WebApplicationType deduceFromClasspath() {
		if (ClassUtils.isPresent(WEBFLUX_INDICATOR_CLASS, null) && !ClassUtils.isPresent(WEBMVC_INDICATOR_CLASS, null)
				&& !ClassUtils.isPresent(JERSEY_INDICATOR_CLASS, null)) {
			return WebApplicationType.REACTIVE;
		}
		for (String className : SERVLET_INDICATOR_CLASSES) {
			if (!ClassUtils.isPresent(className, null)) {
				return WebApplicationType.NONE;
			}
		}
		return WebApplicationType.SERVLET;
	}
```

#### ClassUtils的isPresent是否存在类型

`5.2.5`的版本这个类有更新，来看下怎么判断有没有某个类型：

```java
	public static boolean isPresent(String className, @Nullable ClassLoader classLoader) {
		try {
			forName(className, classLoader);
			return true;
		}
		catch (IllegalAccessError err) {
			throw new IllegalStateException("Readability mismatch in inheritance hierarchy of class [" +
					className + "]: " + err.getMessage(), err);
		}
		catch (Throwable ex) {
			// Typically ClassNotFoundException or NoClassDefFoundError...
			return false;//没有就返回false
		}
	}
```

#### ClassUtils的forName

留下了主要的代码，`Class.forName`了两次，一次是一般类，一次是内部类，都没有就抛异常。

```java
public static Class<?> forName(String name, @Nullable ClassLoader classLoader)
			throws ClassNotFoundException, LinkageError {
		...
		ClassLoader clToUse = classLoader;
		if (clToUse == null) {
			clToUse = getDefaultClassLoader();
		}
		try {
			return Class.forName(name, false, clToUse);
		}
		catch (ClassNotFoundException ex) {
			int lastDotIndex = name.lastIndexOf(PACKAGE_SEPARATOR);
			if (lastDotIndex != -1) {
				String innerClassName =
						name.substring(0, lastDotIndex) + INNER_CLASS_SEPARATOR + name.substring(lastDotIndex + 1);
				try {
					return Class.forName(innerClassName, false, clToUse);
				}
				catch (ClassNotFoundException ex2) {
					// Swallow - let original exception get through
				}
			}
			throw ex;
		}
	}
```

啰嗦的有点多，不好意思了，下次补上。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵，部分图片来自网络，侵删。
