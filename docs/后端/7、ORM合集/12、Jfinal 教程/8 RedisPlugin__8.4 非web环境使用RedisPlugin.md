# 8.4 非web环境使用RedisPlugin
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/77.html
- 分类：ORM框架
- 分组：8 RedisPlugin
RedisPlugin也可以在非web环境下使用，只需引入jfinal.jar然后多调用一下redisPlugin.start()即可，以下是代码示例：

```java
public class RedisTest {
  public static void main(String[] args) {
    RedisPlugin rp = new RedisPlugin("myRedis", "localhost");
    // 与web下唯一区别是需要这里调用一次start()方法
    rp.start();
    Redis.use().set("key", "value");
    Redis.use().get("key");
  }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
