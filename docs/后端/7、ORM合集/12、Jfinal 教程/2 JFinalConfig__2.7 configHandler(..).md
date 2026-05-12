# 2.7 configHandler(..)
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/18.html
- 分类：ORM框架
- 分组：2 JFinalConfig
此方法用来配置JFinal的Handler，如下代码配置了名为ResourceHandler的处理器，Handler可以接管所有web请求，并对应用拥有完全的控制权，可以很方便地实现更高层的功能性扩展。

```java
public void configHandler(Handlers me) {
    me.add(new ResourceHandler());
}
```

具体用法可以参考 jfinal 源码中给出的几个功能的官方实现：[https://gitee.com/jfinal/jfinal/tree/master/src/main/java/com/jfinal/ext/handler](https://gitee.com/jfinal/jfinal/tree/master/src/main/java/com/jfinal/ext/handler)

注意：Handler 是全局共享的，所以要注意其中声明的属性的线程安全问题

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
