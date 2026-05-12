# 使用@ResponseStatus注解业务异常
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/46.html
- 分类：J2EE框架
- 分组：11、异常处理
业务异常可以使用@ResponseStatus来注解。当异常被抛出时，ResponseStatusExceptionResolver会设置相应的响应状态码。DispatcherServlet会默认注册一个ResponseStatusExceptionResolver以供使用。
