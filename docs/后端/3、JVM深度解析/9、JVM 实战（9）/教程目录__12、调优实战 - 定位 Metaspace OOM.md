# 12、调优实战 - 定位 Metaspace OOM
- 来源：https://ddkk.com/zhuanlan/java/jvm/9/12.html
- 分类：JVM 实战
- 分组：教程目录
## 1. Metaspace区是怎么发生OOM的

在jvm中，用来控制Metaspace区域内存大小的参数一般有两个：

- -XX:MetaspaceSize：Metaspace初始大小；
- -XX:MaxMetaspaceSize：Metaspace最大大小；

也就是说，对应一个jvm来说，Metaspace区域的大小是固定的，比如设置为：`-XX:MetaspaceSize=512M -XX:MaxMetaspaceSize=512M`

那如果在应用执行的时候，不断的加载类，使得Metaspace区域被很多类放满了，会发生什么情况呢？

我们前面说过，在发生 Full GC的时候，会带着一起回收Metaspace区域的垃圾对象的；所以一旦Metaspace区域满了，此时它也会触发 Full GC，然后尝试回收自己里面的垃圾对象。

这里就有一个问题，Metaspace区域中的类（klass，class文件在jvm里的运行时数据结构），怎么判断它是否为垃圾对象呢？在这里它的判断条件要比Java堆中的实例对象严格很多：

- 该类的所有实例对象都已经被回收（Java堆中不存在它的任何实例）；
- 加载该类的ClassLoader都已经被回收；
- 该类对应的 java.lang.Class对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法；

所以当Metaspace满了的时候，就算执行了Full GC，也未必能够回收掉很多它里面的类；当不能回收很多类的时候，jvm还在继续加载类到Metaspace中，那它也没有地方来存这些类了，也就只有发生OOM了。

## 2. 什么情况会发生Metaspace的OOM

其实对于日常的项目运行情况来说，Metaspace区域是很少发生OOM的；如果发生了OOM，一般都是以下两个原因：

- 在上线系统的时候，使用默认参数，没有指定Metaspace区域的大小，导致Metaspace区域只有默认的20M左右；这对于稍微大一点的系统，本身自己就有很多类，还有依赖的一些第三方框架等也有很多类，20M左右的Metaspace很容易就被填满了；
- **这里再介绍一个查看jvm中默认参数大小的命令**：`java -XX:+PrintFlagsFinal -version | grep MetaspaceSize`
- 应对这种情况，正常的应用部署上线都需要设置Metaspace大小；小一点的应用设置为 256M，大一点的应用设置为512M，一般都够用了；
- 在系统代码中用到了一些cglib等技术**动态的生成了一些类**，如果代码中没有控制好，导致生成的类过多，很容易就把Metaspace填满；
- 应对这种情况，如果代码中有需要动态生成类，就需要好好检查代码了，注意生成的数量和回收；如果遇到了这种oom也需要再次回来检查代码；

## 3. 模拟 Metaspace OOM

这里先简略介绍一下动态生成类：

我们平常的类，都是自己写出来的后缀为“.java”的代码文件，里面包含了一些 静态变量、实例变量、方法和业务逻辑；

我们自己都能写出来这些类，那肯定也有办法在系统运行的时候，通过程序来动态生成一些这样的类；

一般生成这样的类有两种方式：

- 一是通过接口或者目标类，使用动态代理的方式生成代理类；（JDK动态代理、CGLIB动态代理）
- 二是通过操作字节码，直接动态生成类；（使用一些第三方框架，如：Groovy脚本、Aviator脚本、com.itranswarp.compiler包等）

具体的实现就不详细介绍了，需要的可以单独去学习这方面的知识。

这里就通过CGLIB动态代理技术来生成类，模拟 Metaspace OOM的场景：

```java
/**
 *
 * 元数据区内存溢出
 *
 * jvm options:
 * -XX:MetaspaceSize=10m -XX:MaxMetaspaceSize=10m -XX:+UseParNewGC -XX:+UseConcMarkSweepGC
 * -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=hprof/metadata-oom
 */
public class MetaspaceOomDemo {
	public static void main(String[] args) {
		cglibCreate();
	}
	public static void cglibCreate() {
		int count = 0;
		while (true) {
			Enhancer enhancer = new Enhancer();
			enhancer.setSuperclass(Test.class);
			// 这里有个缓存设置
			enhancer.setUseCache(false);
			enhancer.setCallback((MethodInterceptor)(o, method, objects, methodProxy) -> methodProxy.invokeSuper(o, objects));
			Test testProxy = (Test)enhancer.create();
			System.out.println("当前创建了 " + (++count) + "个代理类");
		}
	}
	static class Test {
	}
}
```

上面注释里面的jvm参数，重点就是设置Metaspace的大小和 开启oom时打印堆dump的开关。

如果不了解CGLIB的话，就先把Enhancer当做一个实现动态生成代理类的API，这里我们有一个静态内部类Test；

`enhancer.setSuperclass(Test.class);`：通过 Enhancer生成的类是Test的子类；

`Test testProxy = (Test)enhancer.create();`：生成 Test的动态代理类；

又由于是在一个while(true)的死循环里面，一直生成Test的动态代理类，所以应该很快就会把Metaspace区域填满。

执行代码：

果然看到控制台打印出了OOM，且是 Metaspace区域的OOM；意思就是在创建了511个动态代理类之后，10M的Metaspace区域被填满了，并且无法回收，再继续生成类的时候就会发生OOM。

## 4. Metaspace OOM 的定位及解决

这里是通过一段代码来模拟Metaspace区域的OOM，其实跟线上环境出现的情况其实也差不多，那出现这种 Metaspace区域的OOM了我们又该怎么解决呢。

在jvm参数中，我们打开了OOM时打印堆dump日志的开关，所以在发生OOM时，肯定会同时生成一份崩溃日志；

有了这个，那我们还是使用前面介绍过的MAT来分析问题：

**1、** 首先还是查看Overview中的LeakSuspects，因为这里会给出泄漏疑点：![ ][nbsp1]；

看到了一个叫 AppClassLoader的 classloader，占据了532.82 KB (39.01%)；看见了这么大的这种classloader，有直觉的肯定都猜到了是动态生成类的时候导致的；
**2、** 再点上面的Details进去看看：；

这里又看到了AppClassLoader下面有一些 `com.bgy.jvm.optimize.MetaspaceOomDemo$Test$$EnhancerByCGLIB$$dc2f0932_434` 类；
**3、** 为了确认，我们再看看dominator_tree中：![ ][nbsp3]；

这下可以非常确认了，这里面有几百个 EnhancerByCGLIB$$dc2f0932_434 类；

再看见前面的熟悉的你的项目的包名，那你也应该知道了这个问题就是你项目代码导致的；剩下的事情，也就是去排除你项目中的代码问题了。
