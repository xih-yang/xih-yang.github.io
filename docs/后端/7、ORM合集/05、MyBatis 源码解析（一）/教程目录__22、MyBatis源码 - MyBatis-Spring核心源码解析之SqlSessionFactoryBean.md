# 22、MyBatis源码 - MyBatis-Spring核心源码解析之SqlSessionFactoryBean
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/22.html
- 分类：ORM框架
- 分组：教程目录
### 前言

在之前使用了mybatis的文档中，我们需要手动创建SqlSessionFactory对象来获取SqlSession，然后通过SqlSession获取mapper代理对象，进行数据库操作。

```java
	// 根据xml配置文件（全局配置文件）创建一个SqlSessionFactory对象
	String resource = "mybatis-config.xml";
	InputStream inputStream = Resources.getResourceAsStream(resource);
	SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
	// 通过SqlSessionFactory获取SqlSession实例
	SqlSession sqlSession = sqlSessionFactory.openSession();
	UserMapper mapper = sqlSession.getMapper(UserMapper.class);
```

在上篇文档中，我们在使用MyBatis-Spring进行了简单的案例演示，将SqlSessionFactory和Mapper代理对象交给了spring去创建和管理，其中重要的一步是注入了SqlSessionFactory ，代码如下：

```java
	@Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
    	// 创建SqlSessionFactoryBean对象
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        // 设置数据源
        factoryBean.setDataSource(dataSource());
        // SqlSessionFactoryBean 对象获取SqlSessionFactory，并装载到IOC中
        return factoryBean.getObject();
    }
```

接下里我们分析下SqlSessionFactoryBean。

### SqlSessionFactoryBean实现的接口有哪些

SqlSessionFactoryBean实现了三个重要的Spring接口：

- FactoryBean``,
- InitializingBean
- ApplicationListener``

#### 1. FactoryBean

SqlSessionFactoryBean 实现了 Spring 的 FactoryBean 接口。 这意味着由 Spring 最终创建的 bean 并不是 SqlSessionFactoryBean 本身，而是工厂类（SqlSessionFactoryBean）的 getObject() 方法的返回结果。

这种情况下，Spring 将会在应用启动时为你创建 SqlSessionFactory，并使用 sqlSessionFactory 这个名字存储起来。

FactoryBean定义了三个方法，其源码如下：

```java
public interface FactoryBean<T> {
    String OBJECT_TYPE_ATTRIBUTE = "factoryBeanObjectType";
	// 获取泛型T的实例。用来创建Bean。当IoC容器通过getBean方法来创建FactoryBean的实例时实际获取的不是FactoryBean 本身，而是具体创建的T泛型实例。
    @Nullable
    T getObject() throws Exception;
	// 返回FactoryBean创建的bean类型。
    @Nullable
    Class<?> getObjectType();
	// 返回由FactoryBean创建的bean实例的作用域是singleton还是prototype。
    default boolean isSingleton() {
        return true;
    }
}
```

在使用Spring声明一个Bean后，比如下面声明了一个名为animal的Bean，那么Spring通过反射机制利用bean的class属性指定实现类来实例化bean ，然后存放在IOC中。

```java
    <!--注入属性时还可以使用 p 名称空间注入，可以简化基于 xml 配置方式-->
    <bean id="animal" class="org.pearl.spring.demo.pojo.Animal" p:age="18" p:name="使用P注入"/>
```

如果我们相对这个Bean进行属性配置，或者需要增强某些功能，采用以上的方式就比较麻烦了，这个时候我们可以声明当前类为FactoryBean的泛型，对这个Bean对象进行属性设置功能增强，再在getObject方法中获取这个Bean注入到IOC中。

#### 2. InitializingBean

InitializingBean从字面上理解是初始化Bean，该接口在容器为 bean 设置所有必要的属性后，让 bean 执行初始化工作。该InitializingBean接口指定了一个方法：

```java
void afterPropertiesSet() throws Exception;
```

#### 3. ApplicationListener

ApplicationListener是Spring事件机制的一部分，与抽象类ApplicationEvent类配合来完成ApplicationContext的事件机制。

如果容器中存在ApplicationListener的Bean，当ApplicationContext调用publishEvent方法时，对应的Bean会被触发。这一过程是典型的观察者模式的实现。

源码如下：

```java
@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
	/**
	 * Handle an application event.
	 * @param event the event to respond to
	 */
	void onApplicationEvent(E event);
}
```

### SqlSessionFactoryBean初始化源码分析

在简单了解了SqlSessionFactoryBean实现了三个接口后，接着来分析下，MyBatis-Spring是怎么通过SqlSessionFactoryBean注入SqlSessionFactory的。

首先是通过new的方式创建了SqlSessionFactoryBean对象，然后添加了一个数据源配置。

接着进入到getObject()方法，此时sqlSessionFactory属性为null，所以进入到afterPropertiesSet方法。

```java
    public SqlSessionFactory getObject() throws Exception {
        if (this.sqlSessionFactory == null) {
            this.afterPropertiesSet();
        }
        return this.sqlSessionFactory;
    }
```

afterPropertiesSet会校验dataSource、sqlSessionFactoryBuilder不为空，configuration及configLocation 属性是否为null。

```java
    public void afterPropertiesSet() throws Exception {
        Assert.notNull(this.dataSource, "Property 'dataSource' is required");
        Assert.notNull(this.sqlSessionFactoryBuilder, "Property 'sqlSessionFactoryBuilder' is required");
        Assert.state(this.configuration == null && this.configLocation == null || this.configuration == null || this.configLocation == null, "Property 'configuration' and 'configLocation' can not specified with together");
        this.sqlSessionFactory = this.buildSqlSessionFactory();
    }
```

校验通过后，进入到buildSqlSessionFactory方法，开始构建SqlSessionFactory并返回，该方法主要是读取SqlSessionFactoryBean相关的配置，解析为Configuration对象。

最终还是调用了build方法，通过配置创建DefaultSqlSessionFactory示例。

```java
   public SqlSessionFactory build(Configuration config) {
        return new DefaultSqlSessionFactory(config);
    }
```

最后getObject()方法，返回添加了配置的SqlSessionFactory对象，并注入到IOC中。

### 总结

SqlSessionFactoryBean实际还是调用的SqlSessionFactoryBuilder的bulider方法，返回了SqlSessionFactory对象并注入到IOC中。如果不通过SqlSessionFactoryBean来获取SqlSessionFactory，那么我们需要各种添加配置，代码会变得很臃肿。

而SqlSessionFactoryBean为我们设置了很多默认配置，我们只需要注入数据库连接信息，就可以了。
