# 6.8 Shared Object扩展
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/64.html
- 分类：ORM框架
- 分组：6 Enjoy 模板引擎
通过使用addSharedObject方法，将某个具体对象添加为共享对象，可以全局进行使用，以下是代码示例：

```java
public void configEngine(Engine me) {
   me.addSharedObject("RESOURCE_HOST", "http://res.jfinal.com");
   me.addSharedObject("StrKit", new com.jfinal.kit.StrKit());
}
```

以上代码中的第二行，添加了一个名为RESOURCE_HOST的共享对象，而第三行代码添加了一个名为 StrKit 的共享对象，以下是在模板中的使用例子：

```xml
<img src="#(RESOURCE_HOST)/img/girl.jpg" />
#if(StrKit.isBlank(title))
   ...
#end
```

以上代码第一行中使用输出指令输出了RESOUCE_HOST这个共享变量，对于大型web应用系统，通过这种方式可以很方便地规划资源文件所在的服务器。以上第二行代码调用了名为 StrKit 这个共享变量的isBlank方法，使用方式符合开发者直觉。

注意：由于对象被全局共享，所以需要注意线程安全问题，尽量只共享常量以及无状态对象。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
