# 36、SpringBoot 源码分析 - SpringMVC源码之深入模型方法一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/36.html
- 分类：J2EE框架
- 分组：教程目录
## 模型方法是什么

就是我们用`ModelAttribute`注解的方法，比如：

### 模型方法返回值作为属性放进了模型内

先获得返回值，获取属性名字，就是`ModelAttribute`注解里的名字，如果没有就是返回值类型名字的首字母小写当做名字，这个好像前面讲过，都是这个规则。

我这里设置了名字`@ModelAttribute("name")`。

### 模型方法参数中的Model其实就是模型容器里的BindingAwareModelMap

如果我们的模型方法里有`Model`参数的话，参数解析器`ModelMethodProcessor`就会返回模型容器里的模型`BindingAwareModelMap`对象，他是`Model`接口的实现扩展类的子类。

就是我们前面说过的，模型方法返回值放入的模型，也就是说模型方法参数中的模型都是同一个，都是模型容器里的`BindingAwareModelMap`。

### 模型方法中的@ModelAttribute(“xx”)属性可以直接在模型里获取

如果你的模型方法里有`ModelAttribute`注解的属性，并且能跟模型中的属性对的上名字，那么就会被`ModelAttributeMethodProcessor`参数解析器解析，直接从模型属性里获取。比如我这个方法，有参数`@ModelAttribute("name") String aaa`，而我前面已经有模型方法返回`name`属性了，那这里刚好可以用上：

```java
    @ModelAttribute
    public void shareFun(Model model, @RequestHeader("Accept-Language") String Accept_Language,@ModelAttribute("name") String aaa) {
        model.addAttribute("first", "1");
        System.out.println("shareFun:" + Accept_Language);
        System.out.println("aaa:" + aaa);
    }
```

#### ModelAttributeMethodProcessor解析模型里属性存在的情况

#### 模型属性不存在情况

不存在先从请求的参数里拿，包括`uri`和表单里的，比如我这里需要`name1`，但是类型是`int`，为了演示属性的类型转换问题：

请求`uri`带参数：

于是我们可以猜他会不会拿到：

拿到了，但是是字符串类型的，而参数有可能不是字符串类型，比如我这里是`int`类型的，所以需要转换：

里面就开始创建数据绑定器，开始绑定了：

下篇我们继续。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
