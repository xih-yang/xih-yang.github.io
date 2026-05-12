# 4.7 Routes 级别拦截器
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/39.html
- 分类：ORM框架
- 分组：4 AOP
Routes级别拦截器是指在Routes中添加的拦截器，如下是示例：

```java
/**
 * 后端路由
 */
public class AdminRoutes extends Routes {
  public void config() {
     // 此处配置 Routes 级别的拦截器，可配置多个
     addInterceptor(new AdminAuthInterceptor());
     add("/admin", IndexAdminController.class, "/index");
     add("/admin/project", ProjectAdminController.class, "/project");
     add("/admin/share", ShareAdminController.class, "/share");
  }
}
```

在上例中，AdminAuthInterceptor 将拦截IndexAdminController、ProjectAdminController、ShareAdminController 中所有的 action 方法。

Routes 拦截器在功能上通过一行代码，同时为多个 Controller 配置好相同的拦截器，减少了代码冗余。Routes 级别拦截器将在 Class 级别拦截器之前被调用。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
