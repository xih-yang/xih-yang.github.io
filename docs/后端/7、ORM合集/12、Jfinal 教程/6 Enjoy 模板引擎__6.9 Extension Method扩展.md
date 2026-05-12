# 6.9 Extension Method扩展
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/65.html
- 分类：ORM框架
- 分组：6 Enjoy 模板引擎
Extension Method 用于对已存在的类在其外部添加扩展方法，该功能类似于ruby语言中的mixin特性。

JFinal Template Engine 默认已经为String、Integer、Long、Float、Double、Short、Byte 这七个基本的 java 类型，添加了toInt()、toLong()、toFloat()、toDouble()、toBoolean()、toShort()、toByte() 七个extension method。以下是使用示例：

```sh
#set(age = "18")
#if(age.toInt() >= 18)
   join to the party
#end
```

上例第一行代码中的age为String类型，由于String被添加了toInt()扩展方法，所以调用其toInt()方法后便可与后面的Integer型的值18进行比较运算。

Extension Method特性有两大应用场景，第一个应用场景是为java类库中的现存类进行功能性扩展，下面给出一个为Integer添加扩展方法的例子：

```java
public class MyIntegerExt {
  public Integer square(Integer self) {
    return self * self;
  }
  public Double power(Integer self, Double exponent) {
    return Math.pow(self, exponent);
  }
  public Boolean isOdd(Integer self) {
    return self % 2 != 0;
  }
}
```

如上面代码所示，由于是对Integer进行扩展，所以上述三个扩展方法中的第一个参数必须是Integer类型，以便调用该方法时让这个参数承载调用者自身。其它参数可以是任意类型，例如上述power方法中的exponent参数。扩展方法至少要有一个参数。以下代码是对上述扩展方法进行配置：

```java
Engine.addExtensionMethod(Integer.class, MyIntegerExt.class);
```

上述代码第一个参数Integer是被扩展的类，第二个参数MyIntegerExt是扩展类，通过上面简单的两步，即可在模板中使用：

```sh
#set(num = 123)
#(num.square())
#(num.power(10D))
#(num.isOdd())
```

上述代码第二、三、四行调用了MyIntegerExt中的三个扩展方法，分别实现了对123的求平方、求10次方、判断是否为奇数的功能。

如上例所示，extension method可以在类自身以外的地方对其功能进行扩展，在模板中使用时的书写也变得非常方便。

Extension Method 的另一个重要的应用场景，是将不确定类型变得确定，例如Controller.keepPara()方法会将所有参数当成String的类型来keep住，所以表单中的Integer类型在keepPara()后变成了String型，引发模板中的类型不正确异常，以下是解决方案：

```xml
<select name="type">
  #for(x : list)
    <option value="#(x.type)" #if(x.type == type.toInt()) selected #end />
  #end
</select>
```

假定type为Integer类型，上面的 select域在表单提交后，如果在后端使用了keepPara()，那么再次渲染该模板时type会变为String类型，从而引发类型不正确异常，通过type.toInt()即可解决。当然，你也可以使用keepPara(Integer.class, “type”) 进行解决。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
