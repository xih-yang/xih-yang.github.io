# 21、SpringBoot 源码分析 - DispatcherServlet初始化三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/21.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图，方便查看

## initHandlerAdapters

这个跟上`initHandlerMappings`一样，所以就不啰嗦了，至于这些类哪里来的，还是在`WebMvcAutoConfiguration`或者其子类`WebMvcConfigurationSupport`中，自己可以看看。

## initHandlerExceptionResolvers

这个也一样：

只是`DefaultErrorAttributes`是从`ErrorMvcAutoConfiguration`来的：

## initRequestToViewNameTranslator

这个是要从默认里找的：

## initViewResolvers

这个找了`5`个，只是其中`ThymeleafViewResolver`是第三方`Thymeleaf`的自动配置类`ThymeleafAutoConfiguration`中的`ThymeleafWebMvcConfiguration`中的，他也是实现`ViewResolver`接口的。

## initFlashMapManager

这个也是默认的：

至此`DispatcherServlet`的初始化基本完成，接下去就开始讲核心的处理啦。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
