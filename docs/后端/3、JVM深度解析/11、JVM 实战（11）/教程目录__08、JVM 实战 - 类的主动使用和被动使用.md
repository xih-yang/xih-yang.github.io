# 08、JVM 实战 - 类的主动使用和被动使用
- 来源：https://ddkk.com/zhuanlan/java/jvm/11/8.html
- 分类：JVM 实战
- 分组：教程目录
JVM中表示两个class对象是否为同一个类存在两个必要条件:

**1、** 类的完整类名必须一致，包括包名；

**2、** 加载这个类的ClassLoader(指ClassLoader实例对象)必须相同；

（换句话说，在JVM中，即使这两个类对象(class对象)来源同一个Class文件，被同一个虚拟机所加载，但只要加载它们的ClassLoader实例对象不同，那么这两个类对象也是不相等的。）

Java程序对类的使用方式分为:主动使用和被动使用。

主动使用，又分为七种情况:

**1、** 创建类的实例；

**2、** 访问某个类或接口的静态变量，或者对该静态变量赋值；

**3、** 调用类的静态方法；

**4、** 反射(比如:Class.forName(“com.atguigu.Test”))；

**5、** 初始化一个类的子类；

**6、** Java虛拟机启动时被标明为启动类的类；

**7、** JDK7开始提供的动态语言支持:；

java.lang.invoke . MethodHandle实例的解析结果REF_getStatic、 REF_putStatic、 REF_invokeStatic句柄对应的类没有初始化，则初始化

除了以上七种情况，其他使用Java类的方式都被看作是对类的被动使用，都不会导致类的初始化。
