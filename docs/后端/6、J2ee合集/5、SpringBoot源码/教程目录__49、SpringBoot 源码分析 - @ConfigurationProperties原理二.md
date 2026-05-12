# 49、SpringBoot 源码分析 - @ConfigurationProperties原理二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/49.html
- 分类：J2EE框架
- 分组：教程目录
## 简单流程

## ConfigurationPropertiesBindingPostProcessor的postProcessBeforeInitialization初始化之前处理

这里就是配置属性绑定的入口了，其实就是个扩展处理器。

### ConfigurationPropertiesBean的get

其实没做什么，就是将实例的一些信息封装成一个`ConfigurationPropertiesBean`对象，方便后面处理，比如获取工厂方法，然后将名字，实例，注解，绑定对象，封装到`ConfigurationPropertiesBean`中，这里要注意的就是`ConfigurationPropertiesBean`中的`bindMethod`绑定方法是`JAVA_BEAN`的枚举类型，也就是一般用`set`方法绑定。

### ConfigurationPropertiesBean的get

然后就是用前面注册过的`ConfigurationPropertiesBinder`来进行绑定。

获得一个`IgnoreTopLevelConverterNotFoundBindHandler`类型的处理器对象来绑定：

然后期间最主要的方法就是从已经加载好的配置文件属性源中去获得要匹配的属性，遍历所有的挨个匹配。:

最终会调用到`JavaBeanBinder`的`BeanProperty`的`setValue`方法，也就是反射调用方法，传入参数，参数是一个`lambda`表达式返回的，内部还是比较深的，不多啰嗦了，具体可以自己看看源码：

配置属性的主要思想还是在初始化之前把配置文件中的属性给绑定到对应的配置属性对象上，用的`set`方法反射，如果没有这个方法，会报异常的。有人可能会问为什么要在属性注入后的处理方法改，不是前面呢，因为他是调用反射方法，得有实例对象呀，而且你都配置在外面了，如果还被内部的注入设置给覆盖了，那这个配置不是很鸡肋么，直接写内部代码里得了，但是这样就缺少灵活性啦，我们可是要动态配置的呀。好了，其他的一些细节可以自己慢慢看。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
