# 主题解析器
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/35.html
- 分类：J2EE框架
- 分组：9、主题 themes
上一小节，我们讲了如何定义主题，定义之后，你要决定使用哪个主题。DispatcherServlet会查找一个名称为themeResolver的bean以确定使用哪个ThemeResolver的实现。主题解析器的工作原理与地区解析器LocaleResolver的工作原理大同小异。它会检测，对于一个请求来说，应该使用哪个主题，同时它也可以修改一个请求所应应用的主题。Spring提供了下列的这些主题解析器：

**表21.5. ThemeResolver接口的实现**

类名
描述

FixedThemeResolver
选择一个固定的主题，这是通过设置defaultThemeName这个属性值实现的

SessionThemeResolver
请求相关的主题保存在用户的HTTP会话（session）中。对于每个会话来说，它只需要被设置一次，但它不能在会话之间保存

CookieThemeResolver
选中的主题被保存在客户端的cookie中

Spring也提供了一个主题更改拦截器ThemeChangeInterceptor，以支持主题的更换。这很容易做到，只需要在请求中携带一个简单的请求参数即可。
