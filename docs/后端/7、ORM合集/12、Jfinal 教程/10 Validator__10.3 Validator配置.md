# 10.3 Validator配置
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/84.html
- 分类：ORM框架
- 分组：10 Validator
Validator配置方式与拦截器完全一样，见如下代码：

```java
public class UserController extends Controller {
    @Before(LoginValidator.class)   // 配置方式与拦截器完全一样
    public void login() {
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
