# 2.1 概述
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/12.html
- 分类：ORM框架
- 分组：2 JFinalConfig
基于JFinal的web项目需要创建一个继承自JFinalConfig类的子类，该类用于对整个web项目进行配置。

JFinalConfig子类需要实现六个抽象方法，如下所示：

```java
public class DemoConfig extends JFinalConfig {
    public void configConstant(Constants me) {}
    public void configRoute(Routes me) {}
    public void configEngine(Engine me) {}
    public void configPlugin(Plugins me) {}
    public void configInterceptor(Interceptors me) {}
    public void configHandler(Handlers me) {}
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
