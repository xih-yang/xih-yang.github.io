# 3.4 get - getPara 系列方法
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/24.html
- 分类：ORM框架
- 分组：3 Controller
Controller提供了getPara系列方法用来从请求中获取参数。getPara系列方法分为两种类型。第一种类型为第一个形参为String的getPara系列方法。该系列方法是对HttpServletRequest.getParameter(String name)的封装，这类方法都是转调了HttpServletRequest.getParameter(String name)。

第二种类型为第一个形参为int或无形参的getPara系列方法。该系列方法是去获取urlPara中所带的参数值。getParaMap与getParaNames分别对应HttpServletRequest的getParameterMap与getParameterNames。

**记忆技巧：第一个参数为String类型的将获取表单或者url中问号挂参的域值。第一个参数为int或无参数的将获取urlPara中的参数值。**

getPara使用例子：

**jfinal 3.6 重要更新**：jfinal 3.6 针对 getPara 系以及 getParaToXxx 系统方法添加了更简短的替代方法，以下是部分使用示例：

```java
// 替代 getPara 的 get 用法
String title = get("title");
// 替代 getParaToInt 的 getInt 用法
Integer age = getInt("age");
// 替代 setAttr 的 set 用法
set("article", article);
```

**jfinal 3.5 重要更新**：jfinal 3.5 版本新增了 getRawData() 方法，可以很方便地从 http 请求 body 中获取 String 型的数据，通常这类数据是 json 或 XML 数据，例如：

```java
String json = getRawData();
User user = FastJson.getJson().parse(json, User.class);
```

以上代码通过 getRawData() 获取到了客户端传过来的 String 型的 json 数据库。 getRawData() 方法可以在一次请求交互中多次反复调用，不会抛出异常。

这里要注意一个问题：通过 forwardAction(...) 转发到另一个 action 时，getRawData() 无法获取到数据，此时需要使用 setAttr("rawData", getRawData()) 将数据传递给 forward 到的目标 action，然后在目标 action 通过 getAttr("rawData") 获取。一般这种情况很少见。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
