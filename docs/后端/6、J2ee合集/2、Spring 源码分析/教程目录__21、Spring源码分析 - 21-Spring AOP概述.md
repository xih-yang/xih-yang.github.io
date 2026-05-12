# 21、Spring源码分析 - 21-Spring AOP概述
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/21.html
- 分类：J2EE框架
- 分组：教程目录
## 1、AOP概念

- Aspect: 切面是一个关注点的模块化，这个关注点可能是横切多个对象。在Spring AOP中切面是常规的类(基于xml配置)或者是带有@Aspect注解的类实现的。
- Join point: 连接点是程序执行的一个方法或者一个可处理的异常。在Spring AOP中,连接点总是代表执行方法。
- Advice: 通知是切面拦截到连接点之后所要采取的行动。通知类型分为 “环绕”, “前置” 和 “后置” 通知。Spring框架的一个通知作为一个拦截器，并且维护了一个拦截器链环绕连接点。
- Pointcut: 指匹配连接点的断言。通知与一个切入点表达式关联，并在满足这个切入的连接点上运行，例如：当执行某个特定的名称的方法。连接点和切点表达式相匹配是Spring AOP的核心概念，Spring默认使用AspectJ切点表达式语言。
- Introduction: 声明额外的方法或者某个类型的字段。Spring AOP允许你可以引入新的接口(以及相应的实现)到被通知的对象。
- Target object: 目标对象是被一个或者多个切面所通知的对象。也称为“被通知对象”。因为Spring AOP实现通过使用运行时代理,这个对象总是一个代理对象。
- AOP proxy: AOP代理是指AOP框架创建的对对象，用来实现切面约定（通知方法等功能）。在Spring中一个AOP代理是一个JDK动态代理或一个CGLIB代理。
- Weaving:指把切面连接到其他应用出程序类型或者对象上，并创建一个被通知的对象。这个过程可以在编译期(例如使用AspectJ 编译期)、加载期或者运行期完成。 Spring AOP像其他纯Java的AOP框架一样在运行时执行织入。

## 2、Advice通知

Spring AOP通过这个接口，为AOP切面增强的织入功能做了更多的细化和扩展，比如提供了更具体的通知类型，如BeforeAdvice、AfterAdvice、ThrowsAdvice等。作为SpringAOP定义的接口类，具体的切面增强可以通过这些接口集成到AOP框架中去发挥作用。

在BeforeAdvice的继承关系中，定义了为待增强的目标方法设置的前置增强接口MethodBeforeAdvice，使用这个前置接口需要实现一个回调函数。

```java
public interface MethodBeforeAdvice extends BeforeAdvice {
   void before(Method method, Object[] args, @Nullable Object target) throws Throwable;
}
```

作为回调函数，before方法的实现在Advice中被配置到目标方法后，会在调用目标方法时被回调。具体的调用参数有：Method对象，这个参数是目标方法的反射对象；Object[]对象数组，这个对象数组中包含目标方法的输人参数。

在Advice的实现体系中，Spring还提供了AfterAdvice这种通知类型，可以看到AfterReturningAdvice对AfterAdvice接口的扩展。在AfterReturningAdvice接口中定义了接口方法，如下所示：

```java
public interface AfterReturningAdvice extends AfterAdvice {
   void afterReturning(@Nullable Object returnValue, Method method, Object[] args, @Nullable Object target) throws Throwable;
}
```

afterReturning方法也是一个回调函数，AOP应用需要在这个接口实现中提供切面增强的具体设计，在这个Advice通知被正确配置以后，在目标方法调用结束并成功返回的时候，接口会被springAOP回调。对于回调参数，有目标方法的返回结果、反射对象以及调用参数（AOP把这些参数都封装在一个对象数组中传递进来）等。与前面分析BeforeAdvice—样。

对于ThrowsAdvice，并没有指定需要实现的接口方法，它在抛出异常时被回调，这个回调是AOP使用反射机制来完成的。

## 3、Pointcut切点

Pointcut（切点）决定Advice通知应该作用于哪个连接点，也就是说通过Pointcut来定义需要增强的方法的集合，这些集合的选取可以按照一定的规则来完成。在这种情况下，Pointcut通常意味着标识方法，例如，这些需要增强的地方可以由某个正则表达式进行标识，或根据某个方法名进行匹配等。

```java
public interface Pointcut {
   ClassFilter getClassFilter();
   MethodMatcher getMethodMatcher();
   Pointcut TRUE = TruePointcut.INSTANCE;
}
```

为了方便用户使用，springAOP提供了具体的切点供用户使用，切点在Spring AOP中的类继承体系如图所示。

在Pointcut的基本接口定义中可以看到，需要返回一个MethodMatcher。对于Point的匹配判断功能，具体是由这个返回的MethodMatcher来完成的，也就是说，由这个MethodMatcher来判断是否需要对当前方法调用进行增强，或者是否需要对当前调用方法应用配置好的Advice通知。在Pointcut的类继承关系中，以正则表达式切点JdkRegexpMethodPointcut的实现原理为例，来具体了解切点Pointcut的工作原理。JdkRegexpMethodPointcut类完成通过正则表达式对方法名进行匹配的功能。在JdkRegexpMethodPointcut的基类StaticMethodMatcherPointcut的实现中可以看到，设置MethodMatcher为StaticMethodMatcher，同时JdkRegexpMethodPointcut也是这个MethodMatcher的子类，它的类层次关系如下图所示。

可以看到，在Pointcut中，通过这样的类继承关系，MethodMatcher对象实际上是可以被配置成JdkRegexpMethodPointcut来完成方法的匹配判断的。在JdkRegexpMethodPomtcut中，可以看到一个matches方法，这个matches方法是MethodMatcher定义的接口方法。在JdkRegexpMethodPointcut的实现中，这个matches方法就是使用正则表达式来对方法名进行匹配的地方。关于在AOP框架中对matches方法的调用，会在后面的springAOP实现中详细介绍，这里只是先简单提一下，会在JdkDynamicAopProxy.invoke()方法中触发matches()方法的调用，这个invoke()方法就是Proxy对象进行代理回调的入口方法，这个invoke回调的实现是使用JDK动态代理完成AOP功能的一部分。

在JdkRegexpMethodPointcut中，通过JDK来实现正则表达式的匹配。

```java
@Override
protected boolean matches(String pattern, int patternIndex) {
   Matcher matcher = this.compiledPatterns[patternIndex].matcher(pattern);
   return matcher.matches();
}
```

在spnngAOP中，还提供了其他的MethodPointcut，比如通过方法名匹配进行Advice匹配的NameMatchMethodPointcut它的matches方法实现很简单，匹配的条件是方法名相同或者方法名相匹配，如下所示。

```java
public boolean matches(Method method, Class<?> targetClass) {
   for (String mappedName : this.mappedNames) {
      if (mappedName.equals(method.getName()) || isMatch(method.getName(), mappedName)) {
         return true;
      }
   }
   return false;
}
```

## 4、Advisor通知器

完成对目标方法的切面增强设计(Advice)和关注点的设计（Pointcut）以后，需要一个对象把它们结合起来，完成这个作用的就是Advisor（通知器）。通过Advisor，可以定义应该使用哪个通知并在哪个关注点使用它，也就是说通过Advisor，把Advice和Pointcut结合起来，这个结合为使用IoC容器配置AOP应用，或者说即开即用地使用AOP基础设施，提供了便利。在SpringAOP中，我们以一个Advisor的实现（DefaultPointcutAdvisor)为例，来了解Advisor的工作原理。

在DefaultPointcutAdvisor中，有两个属性，分别是advice和pointcut通过这两个属性，可以分别配置Advice和Pointcut，DefaultPointcutAdvisor的实现如下：

```java
public class DefaultPointcutAdvisor extends AbstractGenericPointcutAdvisor implements Serializable {
   private Pointcut pointcut = Pointcut.TRUE;
   public DefaultPointcutAdvisor() {
   }
   public DefaultPointcutAdvisor(Advice advice) {
      this(Pointcut.TRUE, advice);
   }
   public DefaultPointcutAdvisor(Pointcut pointcut, Advice advice) {
      this.pointcut = pointcut;
      setAdvice(advice);
   }
   public void setPointcut(@Nullable Pointcut pointcut) {
      this.pointcut = (pointcut != null ? pointcut : Pointcut.TRUE);
   }
   @Override
   public Pointcut getPointcut() {
      return this.pointcut;
   }
   @Override
   public String toString() {
      return getClass().getName() + ": pointcut [" + getPointcut() + "]; advice [" + getAdvice() + "]";
   }
}
```

在DefauItPointcutAdvisor中，pointcut默认被设置为Pointcut.True，TruePointcut的methodMatcher实现中，使用TrueMethodMatcher作为方法匹配器。这个方法匹配器对任何的方法匹配都要求返回true的结果，也就是说对任何方法名的匹配要求，它都会返回匹配成功的结果。

```java
final class TruePointcut implements Pointcut, Serializable {
   public static final TruePointcut INSTANCE = new TruePointcut();
   private TruePointcut() {
   }
   @Override
   public ClassFilter getClassFilter() {
      return ClassFilter.TRUE;
   }
   @Override
   public MethodMatcher getMethodMatcher() {
      return MethodMatcher.TRUE;
   }
   private Object readResolve() {
      return INSTANCE;
   }
   @Override
   public String toString() {
      return "Pointcut.TRUE";
   }
}
final class TrueMethodMatcher implements MethodMatcher, Serializable {
   public static final TrueMethodMatcher INSTANCE = new TrueMethodMatcher();
   private TrueMethodMatcher() {
   }
   @Override
   public boolean isRuntime() {
      return false;
   }
   @Override
   public boolean matches(Method method, Class<?> targetClass) {
      return true;
   }
   @Override
   public boolean matches(Method method, Class<?> targetClass, Object... args) {
      // Should never be invoked as isRuntime returns false.
      throw new UnsupportedOperationException();
   }
   @Override
   public String toString() {
      return "MethodMatcher.TRUE";
   }
   private Object readResolve() {
      return INSTANCE;
   }
}
```
