# 7.2 EhCachePlugin
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/69.html
- 分类：ORM框架
- 分组：7 EhCachePlugin
EhCachePlugin是作为JFinal的Plugin而存在的，所以使用时需要在JFinalConfig中配置EhCachePlugin，以下是Plugin配置示例代码：

```java
public class DemoConfig extends JFinalConfig {
  public void configPlugin(Plugins me) {
    me.add(new EhCachePlugin());
  }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
