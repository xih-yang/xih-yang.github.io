# 47、SpringBoot 源码分析 - @Value原理详解
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/47.html
- 分类：J2EE框架
- 分组：教程目录
## @Value(“xxxx”)

这个应该基本都用过，直接在属性上用的多，其实方法上也可以用，这个相对简单，先说这个，来个例子，我在`name`属性上用了，然后在`applyName`方法上也用了，先不管那到底结果是怎么样呢：

结果就是属性上的先被赋值，`name`是`111`：

然后又进行方法注入赋值，改成了`222`：

## QualifierAnnotationAutowireCandidateResolver的getSuggestedValue

其实原理就是用了`@Value`注解的属性和方法都会被`AutowiredAnnotationBeanPostProcessor`处理进行注入，在注入的过程中，会有一个获取建议值的方法：

其实内部就是先获取属性上的注解属性值，如果不存在就从方法上获取。

内部就是提取注解属性值：

所以第一次先是属性，因为属性上有注解，可以获得属性，所以直接返回了，第二次轮到方法了，只能从方法上的注解获取，然后把前面的`111`替换成`222`了。可能有人问了，为什么就是属性先处理，不是方法呢，如果方法先处理不就不一样了。是的，但是一般总是先属性初始化，然后方法吧，而且注入处理里已经明确这个顺序了，`AutowiredAnnotationBeanPostProcessor`的`buildAutowiringMetadata`中已经明确是先处理属性，然后方法：

## @Value("${xxx.xx}")

当然如果是这种的话，就不一样了，因为内部会判断是否有`${`前缀，一般的没有就直接返回不处理了，有的话他还会进行解析：

最终会到`PropertySourcesPropertyResolver`的`getProperty`中，遍历所有的环境变量属性源，查找有没有配置中有这个属性的，有的话就会赋值，具体细节就不多说了：

这个是在`populateBean`阶段进行的，但是如果是被`ConfigurationProperties`注解的，在初始化之前还会被绑定数据，所以这个数据还会被改，至于`@ConfigurationProperties`相关原理下篇说吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
