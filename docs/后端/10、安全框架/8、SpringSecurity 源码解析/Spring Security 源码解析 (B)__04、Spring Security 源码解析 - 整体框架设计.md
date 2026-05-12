# 04、Spring Security 源码解析 - 整体框架设计
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/4.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 一、一句话概括框架原理

> 整个框架的核心就是构建一个名字为 springSecurityFilterChain 的过滤器Bean，它的类型是 FilterChainProxy 。

## 二、何处开始读源码？

### 思考

> 我们知道，程序入口类会自动扫描当前包及其子包下所有的Bean，并进行实例化，那么 在引入一个新的框架，框架中一些定义好的Bean如何注入我们的Spring容器中呢？ ，这些包并不能被入口类扫描中。

> 其实无非就是通过 @Import 引入相关的类。一般在使用 Spring Security 框架时，我们会自定义一个配置类，配置类加上 @EnableWebSecurity 注解，重新启动程序，一个使用了安全框架的项目就起来了，在无任何自定义配置情况下 Spring Security 默认配置了一个登录过滤器链。

> 加个 @EnableWebSecurity 注解就可以，怎么做到的？

### 瞅瞅

- 点击自定义配置类上添加的 @EnableWebSecurity

```java
@Retention(value = java.lang.annotation.RetentionPolicy.RUNTIME)
@Target(value = {
      java.lang.annotation.ElementType.TYPE })
@Documented
@Import({
      WebSecurityConfiguration.class,
		SpringWebMvcImportSelector.class })
@EnableGlobalAuthentication
@Configuration
public @interface EnableWebSecurity {
	/**
	 * Controls debugging support for Spring Security. Default is false.
	 * @return if true, enables debug support with Spring Security
	 */
	boolean debug() default false;
}
```

- 重点关注 @Import 导入的类 WebSecurityConfiguration ，会发现类中定义了很多Bean
- 其中就有我们的核心过滤器springSecurityFilterChain

```java
@Configuration
public class WebSecurityConfiguration implements ImportAware, BeanClassLoaderAware {
	...
	/**
	 * Creates the Spring Security Filter Chain
	 * @return
	 * @throws Exception
	 */
	@Bean(name = AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME)
	public Filter springSecurityFilterChain() throws Exception {
		boolean hasConfigurers = webSecurityConfigurers != null
				&& !webSecurityConfigurers.isEmpty();
		if (!hasConfigurers) {
			WebSecurityConfigurerAdapter adapter = objectObjectPostProcessor
					.postProcess(new WebSecurityConfigurerAdapter() {
					});
			webSecurity.apply(adapter);
		}
		return webSecurity.build();
	}
	...
}
```

> 找到创建核心过滤器的地方，是不是迫不及待想开始读了？咱们先不急，先来了解整个框架的接口设计，以及各个类的职能。

## 三、框架接口设计

> 整个框架主要由 建造者 和 配置器 构成，在服务启动时就是 通过配置器对建造者进行配置 ，配置完成再由建造者创建出核心过滤器。

### 建造者

- UML图（方法、属性等自行打开Idea查看，全部打开太占位置没法截图就截了简单的类关系）

> 涉及到创建 springSecurityFilterChain 的建造者是 HttpSecurity 和 WebSecurity ，接下来文章介绍，AuthenticationManagerBuilder 先放放，后面讲解如何认证授权时详细介绍。

### 配置器

- UML类图

> 一般我们会使用底层的两个配置器 WebSecurityConfigurerAdapter 和 AbstractHttpConfigurer ，后续文章详细介绍。

## 四、总结

- WebSecurity 和 HttpSecurity 都是 建造者
- WebSecurity 的构建目标是 FilterChainProxy 对象，即核心过滤器 springSecurityFilterChain
- HttpSecurity 的构建目标只是 FilterChainProxy 对象中一组 SecurityFilterChain 的一个
- 配置器 是通过 HttpSecurity 配置进 建造者 中用于构建 SecurityFilterChain
