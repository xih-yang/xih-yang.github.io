# 10、Dubbo 2.7 源码解析 - Dubbo的AOP源码解析、Dubbo的动态编译Compile源码解析
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/10.html
- 分类：J2EE框架
- 分组：教程目录
## 1. Dubbo 的 AOP 源码解析

Dubbo 的 AOP 是对 SPI 扩展类进行增强的方式，而 Wrapper 机制就是对 SPI 扩展类的增强。不同 SPI 的不同 Wrapper，其增强的功能不同。为了方便大家的理解，我们就以前面在学习“Wrapper 机制”时写的代码 15-wrapper 为例进行源码解析，来查看扩展类是如何被包装起来的。

### 1.1 找到 AOP 源码

15-wrapper中配置文件内容：

META-INF/dubbo/internal/com.abc.spi.Order

```java
alipay=com.abc.spi.extension.AlipayOrder
wechat=com.abc.spi.extension.WeChatOrder
wrapper=com.abc.spi.extension.OrderWrapper
wrapper2=com.abc.spi.extension.OrderWrapper2
```

15-wrapper中我们写的测试类：

```java
public class WrapperTest {
    public static void main(String[] args) {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Order adaptiveExtension = loader.getAdaptiveExtension();
        URL url = URL.valueOf("xxx://localhost/ooo");
        System.out.println(adaptiveExtension.pay(url));
    }
}
```

我们跟adaptiveExtension.pay方法，在这个例子中Order接口我们没有实现它的Adaptive类，所以这个adaptiveExtension是动态生成的：

```java
public class Order$Adaptive implements Order {
    public String pay(org.apache.dubbo.common.URL arg0)  {
        if (arg0 == null) throw new IllegalArgumentException("url == null");
        org.apache.dubbo.common.URL url = arg0;
        String extName = url.getParameter("order", "alipay");
        if(extName == null) throw new IllegalStateException("Failed to get extension (com.abc.spi.Order) name from url (" + url.toString() + ") use keys([order])");
        Order extension = (Order) ExtensionLoader.getExtensionLoader(Order.class).getExtension(extName);
        return extension.pay(arg0);
    }
    public String way()  {
        throw new UnsupportedOperationException("The method public abstract java.lang.String com.abc.spi.Order.way() of interface com.abc.spi.Order is not adaptive method!");
    }
}
```

我们接着跟ExtensionLoader.getExtensionLoader(Order.class).getExtension(extName)的getExtension方法，此时因为URL中没有order参数，所以extName是alipay：

> 断点：

```java
public T getExtension(String name) {
	//此时name是alipay
    if (StringUtils.isEmpty(name)) {
        throw new IllegalArgumentException("Extension name == null");
    }
    if ("true".equals(name)) {
        return getDefaultExtension();
    }
    final Holder<Object> holder = getOrCreateHolder(name);
    Object instance = holder.get();
    if (instance == null) {
        synchronized (holder) {
            instance = holder.get();
            if (instance == null) {
                // 创建、setter及wrapper指定名称的扩展类实例
                instance = createExtension(name);
                holder.set(instance);
            }
        }
    }
    return (T) instance;
}
```

可以看到这边代码都是之前跟过的，继续跟createExtension：

```java
private T createExtension(String name) {
    // getExtensionClasses() 获取到当前type的所有扩展类(不包含adaptive与wrapper)
    // 获取指定功能性扩展名所对应的扩展类
    Class<?> clazz = getExtensionClasses().get(name);  // 此时Class就是AlipayOrder类
    if (clazz == null) {
        throw findException(name);
    }
    try {
        T instance = (T) EXTENSION_INSTANCES.get(clazz);
        if (instance == null) {
            // 创建这个类的实例
            EXTENSION_INSTANCES.putIfAbsent(clazz, clazz.newInstance());
            instance = (T) EXTENSION_INSTANCES.get(clazz);
        }
        // 调用instance的setter，完成初始化
        injectExtension(instance);
        // 从缓存获取当前SPI接口的所有wrapper
        Set<Class<?>> wrapperClasses = cachedWrapperClasses;
        if (CollectionUtils.isNotEmpty(wrapperClasses)) {
            // 遍历所有wrapper，逐层包装instance
            for (Class<?> wrapperClass : wrapperClasses) {
	            //调用wrapperClass的带参构造创建实例，并通过构造传入了扩展类(装饰模式)
	            //创建完成后调用wrapperClass实例的set方法进行注入完成初始化
                instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
            }
        }
        //在我们的例子中
        //最终返回的instance是OrderWrapper，其封装了OrderWrapper2，
        //而OrderWrapper2封装了真正的扩展类AlipayOrder
        return instance;
    } catch (Throwable t) {
        throw new IllegalStateException("Extension instance (name: " + name + ", class: " +
                type + ") couldn't be instantiated: " + t.getMessage(), t);
    }
}
```

> 断点：

### 1.2 调用执行

逐级返回，直至 Order$Adaptive 类，看下pay执行顺序：

进入OrderWrapper的pay方法：

进入OrderWrapper2的pay方法：

进入AlipayOrder的pay方法：

最终结果：

## 2. Dubbo 的动态编译 Compile 源码解析

Dubbo 支持的动态编译器有两种：JavassistCompile 与 JdkCompiler。在 Dubbo 框架中，只要是动态编译，使用的都是默认的 JavassistCompiler，而编译器 JdkCompiler 仅是让用户可以进行自由选择使用的。所以我们在这里只分析 JavassistCompile 编译器。

### 2.1 Javassist 简介

Javassist 是一个开源的分析、编辑和创建 Java 字节码的类库。一般情况下，对字节码文件进行修改是需要使用虚拟机指令的。而使用 Javassist，可以直接使用 java 编码的形式，而不需要了解虚拟机指令，就能动态改变类的结构，或者动态生成类。

### 2.2 手工实现 Javassist 动态编译 17-javassist

#### (1) 创建工程

创建一个 Maven 的 Java 工程。

#### (2) 导入依赖

仅需要一个 Javassist 依赖。

```java
<dependencies>
	<!-- javassist 依赖 -->
	<dependency>
		<groupId>org.javassist</groupId>
		<artifactId>javassist</artifactId>
		<version>3.26.0-GA</version>
	</dependency>
</dependencies>
```

#### (3) 定义 JavassistCompiler

```java
public class JavassistCompiler {
    public static void main(String[] args) throws Exception {
        // 获取CtClass实例的工具类实例
        ClassPool pool = ClassPool.getDefault();
        // CtClass，Class Type Class
        CtClass ctClass = genericClass(pool);
        invokeInstance(ctClass);
    }
    private static CtClass genericClass(ClassPool pool) throws Exception {
        // 通过pool生成一个public的com.abc.Person类的字节码类
        CtClass ctClass = pool.makeClass("com.abc.Person");
        // 添加private String name属性
        CtField nameField = new CtField(pool.getCtClass("java.lang.String"), "name", ctClass);
        nameField.setModifiers(Modifier.PRIVATE);
        ctClass.addField(nameField);
        // 添加private int age属性
        CtField ageField = new CtField(pool.getCtClass("int"), "age", ctClass);
        ageField.setModifiers(Modifier.PRIVATE);
        ctClass.addField(ageField);
        // 添加无参构造器
        CtConstructor ctConstructor = new CtConstructor(new CtClass[] {
     }, ctClass);
        // 纯字符串，放入构造中
        String body = "{\nname=\"zhangsan\";\nage=23;\n}";
        ctConstructor.setBody(body);
        ctClass.addConstructor(ctConstructor);
        // 添加getter与setter
        ctClass.addMethod(CtNewMethod.getter("getName", nameField));
        ctClass.addMethod(CtNewMethod.setter("setName", nameField));
        ctClass.addMethod(CtNewMethod.getter("getAge", ageField));
        ctClass.addMethod(CtNewMethod.setter("setAge", ageField));
        // 添加personInfo业务方法
        CtMethod ctMethod = new CtMethod(CtClass.voidType, "personInfo", new CtClass[] {
     }, ctClass);
        ctMethod.setModifiers(Modifier.PUBLIC);
        // 拼接方法的内容
        StringBuffer sb = new StringBuffer();
        sb.append("{\nSystem.out.println(\"name=\"+name);\n")
          .append("System.out.println(\"age=\"+age);\n}");
        ctMethod.setBody(sb.toString());
        ctClass.addMethod(ctMethod);
        // 把生成的字节码文件写入到d盘
        byte[] bytes = ctClass.toBytecode();
        File file = new File("d:/Person.class");
        FileOutputStream fos = new FileOutputStream(file);
        fos.write(bytes);
        fos.close();
        return ctClass;
    }
    private static void invokeInstance(CtClass ctClass)
            throws Exception {
        //获取类
        Class<?> clazz = ctClass.toClass();
        Object obj = clazz.newInstance();
        obj.getClass().getMethod("personInfo", new Class[] {
     }).invoke(obj, new Object[] {
     });
    }
}
```

运行结果：

生成的字节码文件对于的java内容是这样的：

```java
public class Person {
    private String name;
    private int age;
    public Person() {
        name = "zhangsan";
        age = 23;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public int getAge() {
        return age;
    }
    public void setAge(int age) {
        this.age = age;
    }
    // 业务方法
    public void personInfo() {
        System.out.println("name = " + name);
        System.out.println("age = " + age);
    }
}
```

### 2.3 解析 Dubbo 的动态编译

下面以获取 Protocol 接口的 adaptive 扩展类实例为例进行解析。

```java
public class ServiceConfig<T> extends AbstractServiceConfig {
	...
    private static final Protocol protocol = ExtensionLoader
                    // 加载并缓存了Protocol接口的所有扩展类(四类)
                    .getExtensionLoader(Protocol.class)
                    .getAdaptiveExtension();
	...
}
```

很多都是跟过的：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getAdaptiveExtension
public T getAdaptiveExtension() {
    // 双重检测锁
    Object instance = cachedAdaptiveInstance.get();
    if (instance == null) {
        if (createAdaptiveInstanceError == null) {
            synchronized (cachedAdaptiveInstance) {
                instance = cachedAdaptiveInstance.get();
                if (instance == null) {
                    try {
                        // 创建Adaptive类实例
                        instance = createAdaptiveExtension();
                        cachedAdaptiveInstance.set(instance);
                    } catch (Throwable t) {
                        createAdaptiveInstanceError = t;
                        throw new IllegalStateException("Failed to create adaptive instance: " + t.toString(), t);
                    }
                }
            }
        } else {
            throw new IllegalStateException("Failed to create adaptive instance: " + createAdaptiveInstanceError.toString(), createAdaptiveInstanceError);
        }
    }
    return (T) instance;
}
//org.apache.dubbo.common.extension.ExtensionLoader#createAdaptiveExtension
private T createAdaptiveExtension() {
    try {
        // getAdaptiveExtensionClass() 获取到当前type的adaptive类
        // injectExtension() 参数中的实例，仅仅就是从配置文件中读取到的类创建的一个实例，
        // 没有进行初始化。这个方法就是调用该实例的setter完成注入(初始化)
        return injectExtension((T) getAdaptiveExtensionClass().newInstance());
    } catch (Exception e) {
        throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
    }
}
```

关键是getAdaptiveExtensionClass方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getAdaptiveExtensionClass
private Class<?> getAdaptiveExtensionClass() {
    // 读取并缓存配置文件中所有的类(普通扩展类、adpative类、wrapper类、activate类)
    getExtensionClasses();
    // 若显式定义了adaptive类，则返回
    if (cachedAdaptiveClass != null) {
        return cachedAdaptiveClass;
    }
    // 没有显式定义adaptive类，则创建一个adaptive类
    return cachedAdaptiveClass = createAdaptiveExtensionClass();
}
```

因为Protocol.class是没有显式定义AdaptiveClass，所以cachedAdaptiveClass 肯定是空的，走createAdaptiveExtensionClass方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#createAdaptiveExtensionClass
private Class<?> createAdaptiveExtensionClass() {
	//AdaptiveClassCodeGenerator构造传入了接口Class以及默认的扩展名
    String code = new AdaptiveClassCodeGenerator(type, cachedDefaultName).generate();
    ClassLoader classLoader = findClassLoader();
    org.apache.dubbo.common.compiler.Compiler compiler = ExtensionLoader
            .getExtensionLoader(org.apache.dubbo.common.compiler.Compiler.class)
            .getAdaptiveExtension();
    // 调用compiler的adaptive实例的compile()
    return compiler.compile(code, classLoader);
}
```

该方法有两个流程：

- 根据SPI接口和默认扩展名，在内存中生成java文件内容
- 将java文件内容编译生成Class

#### (1) 根据SPI接口和默认扩展名，在内存中生成java文件内容

主要看org.apache.dubbo.common.extension.AdaptiveClassCodeGenerator#generate方法：

```java
//org.apache.dubbo.common.extension.AdaptiveClassCodeGenerator#generate
public String generate() {
    // no need to generate adaptive class since there's no adaptive method found.
    // 判断当前type接口中是否存在Adaptive方法
    if (!hasAdaptiveMethod()) {
        throw new IllegalStateException("No adaptive method exist on extension " + type.getName() + ", refuse to create the adaptive class!");
    }
    StringBuilder code = new StringBuilder();
    code.append(generatePackageInfo());
    code.append(generateImports());
    code.append(generateClassDeclaration());
    Method[] methods = type.getMethods();
    for (Method method : methods) {
        code.append(generateMethod(method));
    }
    code.append("}");
    if (logger.isDebugEnabled()) {
        logger.debug(code.toString());
    }
    return code.toString();
}
```

判断当前type接口中是否存在Adaptive方法：

```java
//org.apache.dubbo.common.extension.AdaptiveClassCodeGenerator#hasAdaptiveMethod
private boolean hasAdaptiveMethod() {
    return Arrays.stream(type.getMethods())  // 流中的每个元素都是当前type的方法
            // 只要有一个匹配成功，则马上结束并返回true
            .anyMatch(m -> m.isAnnotationPresent(Adaptive.class));
}
```

`可以看出，要动态编译生成Adaptive类，则至少要有一个Adaptive方法。`

整个方法都是按照字符串拼接方式，一步一步最终拼接成完整的java文件，我们只关注一个点，方法的处理，看generateMethod方法：

```java
//org.apache.dubbo.common.extension.AdaptiveClassCodeGenerator#generateMethod
private String generateMethod(Method method) {
    String methodReturnType = method.getReturnType().getCanonicalName();
    String methodName = method.getName();
    //主要关注方法体
    String methodContent = generateMethodContent(method);
    String methodArgs = generateMethodArguments(method);
    String methodThrows = generateMethodThrows(method);
    return String.format(CODE_METHOD_DECLARATION, methodReturnType, methodName, methodArgs, methodThrows, methodContent);
}
//org.apache.dubbo.common.extension.AdaptiveClassCodeGenerator#generateMethodContent
private String generateMethodContent(Method method) {
    Adaptive adaptiveAnnotation = method.getAnnotation(Adaptive.class);
    StringBuilder code = new StringBuilder(512);
    if (adaptiveAnnotation == null) {
    	// 这里可以看到，如果方法上没有@Adaptive标记，会生成抛异常的代码内容
    	// 表示不支持该操作
        return generateUnsupported(method);
    } else {
        int urlTypeIndex = getUrlTypeIndex(method);
        // found parameter in URL type
        // 下面这两段代码是要找方法中的URL类型的参数
        // 如果找不到是会抛异常的
        // 所以Adaptive方法要求就是，方法中的参数必须 
        // 包含 URL 类型的参数，或参数可以获取到 URL 类型的值。
        if (urlTypeIndex != -1) {
            // Null Point check
            code.append(generateUrlNullCheck(urlTypeIndex));
        } else {
            // did not find parameter in URL type
            code.append(generateUrlAssignmentIndirectly(method));
        }
		//获取@Adaptive注解对象的value属性
		//如果没有配置，默认取简单类名全小写
		//例如：com.abc.spi.Order  ->  order
		//value就是作为从URL中获取extName 的key
        String[] value = getMethodAdaptiveValue(adaptiveAnnotation);
		//判断方法参数中是否有org.apache.dubbo.rpc.Invocation类型的参数
        boolean hasInvocation = hasInvocationArgument(method);
        code.append(generateInvocationArgumentNullCheck(method));
        code.append(generateExtNameAssignment(value, hasInvocation));
        // check extName == null?
        code.append(generateExtNameNullCheck(value));
        code.append(generateExtensionAssignment());
        // return statement
        code.append(generateReturnAndInvocation(method));
    }
    return code.toString();
}
```

重点关注generateExtNameAssignment方法，这个方法是获取extName 的关键：

```java
private String generateExtNameAssignment(String[] value, boolean hasInvocation) {
    // TODO: refactor it
    String getNameCode = null;
    for (int i = value.length - 1; i >= 0; --i) {
        if (i == value.length - 1) {
        	//判断是否有默认的defaultExtName
            if (null != defaultExtName) {
                if (!"protocol".equals(value[i])) {
                	//是否有Invocation类型的参数
                    if (hasInvocation) {
                        getNameCode = String.format("url.getMethodParameter(methodName, \"%s\", \"%s\")", value[i], defaultExtName);
                    } else {
                        getNameCode = String.format("url.getParameter(\"%s\", \"%s\")", value[i], defaultExtName);
                    }
                } else {
                    getNameCode = String.format("( url.getProtocol() == null ? \"%s\" : url.getProtocol() )", defaultExtName);
                }
            } else {
                if (!"protocol".equals(value[i])) {
                    if (hasInvocation) {
                        getNameCode = String.format("url.getMethodParameter(methodName, \"%s\", \"%s\")", value[i], defaultExtName);
                    } else {
                        getNameCode = String.format("url.getParameter(\"%s\")", value[i]);
                    }
                } else {
                    getNameCode = "url.getProtocol()";
                }
            }
        } else {
            if (!"protocol".equals(value[i])) {
                if (hasInvocation) {
                    getNameCode = String.format("url.getMethodParameter(methodName, \"%s\", \"%s\")", value[i], defaultExtName);
                } else {
                    getNameCode = String.format("url.getParameter(\"%s\", %s)", value[i], getNameCode);
                }
            } else {
                getNameCode = String.format("url.getProtocol() == null ? (%s) : url.getProtocol()", getNameCode);
            }
        }
    }
    return String.format(CODE_EXT_NAME_ASSIGNMENT, getNameCode);
}
```

这段代码看上去比较乱，总体结论就是，从URL类型的参数获取extName有三种方式

- url.getProtocol() 直接根据协议获取extName
- url.getParameter() 根据Url类型的参数获取extName（key就是@Adaptive的value指定的，没有指定就是简单类名全小写）
- url.getMethodParameter() 从本方法的参数中获取（key就是@Adaptive的value指定的，没有指定就是简单类名全小写）

以上每种方式如果根据key获取为空，如果defaultExtName不为空，则用defaultExtName。

其他方法就不看了，我们退出org.apache.dubbo.common.extension.AdaptiveClassCodeGenerator#generate方法回到createAdaptiveExtensionClass，此时查看 code 的值，其为一个字符串，其内容就是动态生成的 Adaptive 扩展类。在其上右击，选择 copy value 即可复制该字符串的内容。

#### (2) 将java文件内容编译生成Class

```java
private Class<?> createAdaptiveExtensionClass() {
    String code = new AdaptiveClassCodeGenerator(type, cachedDefaultName).generate();
    ClassLoader classLoader = findClassLoader();
    org.apache.dubbo.common.compiler.Compiler compiler = ExtensionLoader
            .getExtensionLoader(org.apache.dubbo.common.compiler.Compiler.class)
            .getAdaptiveExtension();
    // 调用compiler的adaptive实例的compile()
    return compiler.compile(code, classLoader);
}
```

动态生成 Adaptive 代码后，就可以对其进行编译了，继续看Compiler的adaptive实例的compile()方法：

```java
@Adaptive
public class AdaptiveCompiler implements Compiler {
    private static volatile String DEFAULT_COMPILER;
    public static void setDefaultCompiler(String compiler) {
        DEFAULT_COMPILER = compiler;
    }
    @Override
    public Class<?> compile(String code, ClassLoader classLoader) {
        Compiler compiler;
        ExtensionLoader<Compiler> loader = ExtensionLoader.getExtensionLoader(Compiler.class);
        // 获取用户指定的扩展名
        String name = DEFAULT_COMPILER; // copy reference
        // 若用户指定了扩展名，则获取用户指定的compiler，否则获取默认的compiler
        if (name != null && name.length() > 0) {
            compiler = loader.getExtension(name);
        } else {
            // 默认的compiler，即javassistCompiler
            compiler = loader.getDefaultExtension();
        }
        // 调用javassistCompiler的compile()
        return compiler.compile(code, classLoader);
    }
}
```

默认会走JavassistCompiler，看javassistCompiler的compile()方法，先会走其父类的抽象方法：

```java
public abstract class AbstractCompiler implements Compiler {
    private static final Pattern PACKAGE_PATTERN = Pattern.compile("package\\s+([$_a-zA-Z][$_a-zA-Z0-9\\.]*);");
    private static final Pattern CLASS_PATTERN = Pattern.compile("class\\s+([$_a-zA-Z][$_a-zA-Z0-9]*)\\s+");
    @Override
    public Class<?> compile(String code, ClassLoader classLoader) {
        code = code.trim();
        // 从java代码code中找到package
        Matcher matcher = PACKAGE_PATTERN.matcher(code);
        String pkg;
        if (matcher.find()) {
            pkg = matcher.group(1);
        } else {
            pkg = "";
        }
        // 从java代码code中找到class类名
        matcher = CLASS_PATTERN.matcher(code);
        String cls;
        if (matcher.find()) {
            cls = matcher.group(1);
        } else {
            throw new IllegalArgumentException("No such class name in " + code);
        }
        // 用找到的package与class拼接为全限定性类名
        String className = pkg != null && pkg.length() > 0 ? pkg + "." + cls : cls;
        try {
            // 将指定名称的类加载到内存
            // 如果没有会报错
            // 这里会先尝试本地加载类，加载失败报错了以后才会动态编译生成Class
            return Class.forName(className, true, org.apache.dubbo.common.utils.ClassUtils.getCallerClassLoader(getClass()));
        } catch (ClassNotFoundException e) {
            if (!code.endsWith("}")) {
                throw new IllegalStateException("The java code not endsWith \"}\", code: \n" + code + "\n");
            }
            try {
                // 调用javassistCompiler的doCompile()方法进行编译
                return doCompile(className, code);
            } catch (RuntimeException t) {
                throw t;
            } catch (Throwable t) {
                throw new IllegalStateException("Failed to compile class, cause: " + t.getMessage() + ", class: " + className + ", code: \n" + code + "\n, stack: " + ClassUtils.toString(t));
            }
        }
    }
    protected abstract Class<?> doCompile(String name, String source) throws Throwable;
}
```

> 这个抽象类会先尝试本地加载类，加载失败报错了以后才会动态编译生成Class
>
> 这就是为什么我们之前把动态生成的Adaptive类的内容拷贝出来放入文件以后，程序能够正常跑
>
> 并且可以在这个类中断点的原因
>
> 我们后期分析源码的时候，会经常拷贝动态生成的自适应类出来，方便断点，原理就是这个！

现在我们看javassistCompiler的doCompile()方法：

```java
public class JavassistCompiler extends AbstractCompiler {
    private static final Pattern IMPORT_PATTERN = Pattern.compile("import\\s+([\\w\\.\\*]+);\n");
    private static final Pattern EXTENDS_PATTERN = Pattern.compile("\\s+extends\\s+([\\w\\.]+)[^\\{]*\\{\n");
    private static final Pattern IMPLEMENTS_PATTERN = Pattern.compile("\\s+implements\\s+([\\w\\.]+)\\s*\\{\n");
    private static final Pattern METHODS_PATTERN = Pattern.compile("\n(private|public|protected)\\s+");
    private static final Pattern FIELD_PATTERN = Pattern.compile("[^\n]+=[^\n]+;");
    @Override
    public Class<?> doCompile(String name, String source) throws Throwable {
        // 创建一个CtClassBuilder，封装了javassist(建造者模式)
        CtClassBuilder builder = new CtClassBuilder();
        // 初始化ctClassBuilder
        builder.setClassName(name);
        // process imported classes
        Matcher matcher = IMPORT_PATTERN.matcher(source);
        while (matcher.find()) {
            builder.addImports(matcher.group(1).trim());
        }
        // process extended super class
        matcher = EXTENDS_PATTERN.matcher(source);
        if (matcher.find()) {
            builder.setSuperClassName(matcher.group(1).trim());
        }
        // process implemented interfaces
        matcher = IMPLEMENTS_PATTERN.matcher(source);
        if (matcher.find()) {
            String[] ifaces = matcher.group(1).trim().split("\\,");
            Arrays.stream(ifaces).forEach(i -> builder.addInterface(i.trim()));
        }
        // process constructors, fields, methods
        String body = source.substring(source.indexOf('{') + 1, source.length() - 1);
        String[] methods = METHODS_PATTERN.split(body);
        String className = ClassUtils.getSimpleClassName(name);
        Arrays.stream(methods).map(String::trim).filter(m -> !m.isEmpty()).forEach(method -> {
            if (method.startsWith(className)) {
                builder.addConstructor("public " + method);
            } else if (FIELD_PATTERN.matcher(method).matches()) {
                builder.addField("private " + method);
            } else {
                builder.addMethod("public " + method);
            }
        });
        // compile
        ClassLoader classLoader = org.apache.dubbo.common.utils.ClassUtils.getCallerClassLoader(getClass());
        // 通过ctClassBuilder构建出一个CtClass，即编译的实现
        CtClass cls = builder.build(classLoader);
        return cls.toClass(classLoader, JavassistCompiler.class.getProtectionDomain());
    }
}
```

这个方法就不细究了。
