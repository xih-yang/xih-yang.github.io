# 48、SpringBoot 源码分析 - @ConfigurationProperties原理一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/48.html
- 分类：J2EE框架
- 分组：教程目录
## 简单流程

## @ConfigurationProperties

这个是把一个类设置成配置属性，但是要绑定启用，得有个条件，就是得有`@EnableConfigurationProperties`注解，里面放入要启动的类。

## 例子

还是前面的例子，这次就加了`ConfigurationProperties`注解。

然后找了个能注册到容器的配置类，加上`EnableConfigurationProperties`注解，写上启动的类。这里要注意EnableConfigurationProperties只要挂在能注册到容器的类就可以，没有规定是哪个类，只要里面加上你的配置属性类就可以，比如我这里是`MyProperties.class`。

然后可能加上依赖，否则可能没提示：

然后在配置文件`application.properties`里配置：

接着上篇的值的话，`name`应该是`222`，但是我们现在来看，要被覆盖了：

原来还能被覆盖，在实例初始化之前`applyBeanPostProcessorsBeforeInitialization`里被覆盖的，那肯定是有个处理器给处理了，是的，就是`ConfigurationPropertiesBindingPostProcessor`。下面就简单说下原理吧。

## @EnableConfigurationProperties

关键是这个注解的`import`的`EnableConfigurationPropertiesRegistrar`。

这个已经讲过好几遍了，在解析的时候会被创建放入一个集合里，然后在加载`bean`定义的时候执行`registerBeanDefinitions`。

### EnableConfigurationPropertiesRegistrar的registerInfrastructureBeans注册基础bean

首先进行注册基础的`bean`，用来处理的：

### ConfigurationPropertiesBindingPostProcessor的register

内部把自己注册进去了，而且不会重复，这个就是用来处理绑定属性的。

#### ConfigurationPropertiesBinder的register

还注册了配置属性绑定器，作用就是讲配置文件读取的属性帮定到配置属性。

### ConfigurationPropertiesBeanRegistrar

然后创建`ConfigurationPropertiesBeanRegistrar`对象，将当前配置类上`EnableConfigurationProperties`注解的所有配置属性类注册到容器中。

然后获取他们的`ConfigurationProperties`注解的属性前缀，如果有的话就拼接`beanName`，否则就用全限定类名。

当然这个是第一步，先注册进容器，因为`ConfigurationPropertiesBindingPostProcessor`会在初始化之前的处理方法中去处理他们，让他们绑定上配置文件中的属性，具体怎么绑定的下篇说吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
