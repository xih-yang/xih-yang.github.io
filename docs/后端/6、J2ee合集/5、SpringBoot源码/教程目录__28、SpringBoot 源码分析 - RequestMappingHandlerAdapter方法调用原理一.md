# 28、SpringBoot 源码分析 - RequestMappingHandlerAdapter方法调用原理一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/28.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## getDataBinderFactory获取数据绑定工厂

这个是什么东西，数据绑定，要干嘛呢，其实就是参数的绑定啦，一般的基本都能处理，比如我传个对象。

### 接受一个对象

### 接受多个对象

但是如果我想要传两个呢，当然你可以说可以封装成一个对象呀，是可以，我这里就想说，如果是两个会怎么样：

两个一起赋值了。

#### 解决办法

这个时候可以用到数据绑定，也就是说，我希望某个属性你给我绑定到某个对象的属性上，比如我这样把他们分开：

但是`springmvc`是不知道的：

那这个时候就需要告诉他，这些数据怎么跟我的方法参数绑定起来，就要用到`@InitBinder`啦，比如我定义两个方法来做绑定，`d.开头的都要给Dog类`，`c.开头的都要给Cat类`:

`InitBinder`属性里默认需要类型首字母小写，当然如果你方法参数有ModelAttribute注解，且里面有对应的名字，那`InitBinder`属性的名字只要一样即可：

下面这样也可以：

结果好了。

当然你说这个麻烦，封装成一个类就好了，那我们换一个，现在需要狗的生日：

我希望格式是`"yyyy|MM|dd"`我们来看看默认的：

异常了解析不了：

所以这个时候我们可以定义一个全局的日期转换增强器，指定我们的日期格式来做绑定：

```java
@ControllerAdvice
public class DateFormatAdvice {
    @InitBinder
    public void initBinderDateType(WebDataBinder webDataBinder){
        SimpleDateFormat simpleDateFormat=new SimpleDateFormat("yyyy|MM|dd");
        webDataBinder.registerCustomEditor(Date.class,new CustomDateEditor(simpleDateFormat,true));
    }
}
```

结果得到了日期，但是是`toString`的原因显示成这样：

光都写例子了，下篇我们来看看源码吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
