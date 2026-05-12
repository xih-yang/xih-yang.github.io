# Session解析器SessionLocaleResolver
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/30.html
- 分类：J2EE框架
- 分组：8、地区信息
SessionLocaleResolver允许你从session中取得可能与用户请求相关联的地区Locale和时区TimeZone信息。与CookieLocaleResolver不同，这种存取策略仅将Servlet容器的HttpSession中相关的地区信息存取到本地。因此，这些设置仅会为该会话（session）临时保存，session结束后，这些设置就会失效。

不过请注意，该解析器与其他外部session管理机制，比如Spring的Session项目等，并没有直接联系。该SessionLocaleResolver仅会简单地从与当前请求HttpServletRequest相关的HttpSession对象中，取出对应的属性，并修改其值，仅此而已。
