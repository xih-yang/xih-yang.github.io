# 45、SpringBoot 源码分析 - SpringMVC源码之异常处理二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/45.html
- 分类：J2EE框架
- 分组：教程目录
## 基本处理流程图

## 继续抛异常

继续上篇的，异常没法被异常解析器处理，继续抛出：

拦截器处理完后继续抛出：

`FrameworkServlet`封装成嵌套的`NestedServletException`继续抛：

不过下面会打印信息：

内部会打印：

一路抛到`org.apache.catalina.core.StandardWrapperValve`的`invoke`，输出异常信息，用`exception`方法处理响应设置：

设置响应状设置错误状态`errorState=1`。

然后继续执行：

最后到这里找到默认的报错页面：

然后一通属性请求和响应设置之后到这里：

内部然后进行转发到`/err`.

然后请求又进来，要分发了，这个请求最后被`BasicErrorController`的`errorHtml`方法处理，所以可以看到视图名字是`error`啦：

最后是`StaticView`来渲染：

是一堆拼起来的信息：

渲染出来的页面就是我们熟悉的：

好了异常处理页面原理大致了解了，其实默认不处理是会在`tomcat`进行转发/err，最后到上层由一个叫`BasicErrorController`的处理器处理，最后渲染`/error`视图，当然这个是`StaticView`字符串拼起来的。

下篇看能不能做一些定制，比如错误页面，或者自己处理错误等等。至于说静态页面视图`/error`哪来的，其实`tomcat`服务器创建的时候添加的，看左边堆栈信息：

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
