# 模型ModelMap(ModelAndView)
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/51.html
- 分类：J2EE框架
- 分组：12、约定优于配置”的支持
ModelMap类其实就是一个豪华版的 Map，它使得你为视图展示需要所添加的对象都遵循一个显而易见的约定被命名。请看下面这个 Controller实现，并请注意，添加到ModelAndView中去的对象都没有显式地指定键名。

```java
public class DisplayShoppingCartController implements Controller { 
    public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) { 
        List cartItems = // 拿到一个CartItem对象的列表 
        User user = // 拿到当前购物的用户User 
        ModelAndView mav = new ModelAndView("displayShoppingCart"); <-- 逻辑视图名 
        mav.addObject(cartItems); <-- 啊哈，直接添加的对象，没有指定名称 
        mav.addObject(user); <-- 啊哈再来一次 
        return mav; 
    } 
} 
```

ModelAndView内部使用了一个ModelMap类，它是Map的一个实现，会自动为添加进来的对象生成一个键名。为添加对象生成名称的策略是，若添加对象是一个纯Java bean（a scalar object），比如User，那么使用对象类的短类名（short class name）来作为该对象的名称。下面是一些例子，展示了为添加到ModelMap实例中的纯Java对象所生成的名称：

- 添加一个x.y.User实例，为其生成的名称为user
- 添加一个x.y.Registration实例，为其生成的名称为registration
- 添加一个x.y.Foo实例，为其生成的名称为foo
- 添加一个java.util.HashMap实例，为其生成的名称为hashMap。这种情况下，显式地声明一个键名可能更好，因为hashMap的约定并非那么符合直觉
- 添加一个null值将导致程序抛出一个IllegalArgumentException参数非法异常。若你所添加的（多个）对象有可能为null值，那你也需要显式地指定它（们）的名字

**啥？键名不能自动变复数形式么？**

Spring Web MVC的约定优于配置支持尚不能支持自动复数转换。这意思是，你不能期望往ModelAndView中添加一个Person对象的List列表时，框架会自动为其生成一个名称people。

这个决定是经过许多争论后的结果，最终“最小惊喜原则”胜出并为大家所接受。

为集合Set或列表List生成键名所采取的策略，是先检查集合的元素类型、拿到第一个对象的短类名，然后在其后面添加List作为名称。添加数组对象也是同理，尽管对于数组我们就不需再检查数组内容了。下面给出的几个例子可以阐释一些东西，让集合的名称生成语义变得更加清晰：

- 添加一个带零个或多个x.y.User元素类型的数组x.y.User[]，为其生成的键名是userList
- 添加一个带零个或多个x.y.User元素类型的数组x.y.Foo[]，为其生成的键名是fooList
- 添加一个带零个或多个x.y.User元素类型的数组java.util.ArrayList，为其生成的键名是userList
- 添加一个带零个或多个x.y.Foo元素类型的数组java.util.HashSet，为其生成的键名是fooList
- 一个 *空的* java.util.ArrayList则根本不会被添加
