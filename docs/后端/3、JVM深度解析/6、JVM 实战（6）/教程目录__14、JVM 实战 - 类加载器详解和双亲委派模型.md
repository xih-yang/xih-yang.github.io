# 14、JVM 实战 - 类加载器详解和双亲委派模型
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/14.html
- 分类：JVM 实战
- 分组：教程目录
### 类加载器

虚拟机设计团队把类加载阶段中“通过一个类的全限定名来获取描述此类的二进制字节流”这个动作放到Java虚拟机外部去实现，以便让应用程序自己决定如何去获取所需要的类。实现这个动作的模块称为“类加载器”。

### 类加载器分类

**启动（Bootstrap）类加载器**

启动类加载器主要加载的是JVM自身需要的类，这个类加载使用C++语言实现的，是虚拟机自身的一部分，它负责将 /lib路径下的核心类库或-Xbootclasspath参数指定的路径下的jar包加载到内存中，注意必由于虚拟机是按照文件名识别加载jar包的，如rt.jar，如果文件名不被虚拟机识别，即使把jar包丢到lib目录下也是没有作用的(出于安全考虑，Bootstrap启动类加载器只加载包名为java、javax、sun等开头的类)。

**扩展（Extension）类加载器**

扩展类加载器是指Sun公司(已被Oracle收购)实现的sun.misc.Launcher$ExtClassLoader类，由Java语言实现的，是Launcher的静态内部类，它负责加载/lib/ext目录下或者由系统变量-Djava.ext.dir指定位路径中的类库，开发者可以直接使用标准扩展类加载器。

```java
//ExtClassLoader类中获取路径的代码
private static File[] getExtDirs() {
     //加载<JAVA_HOME>/lib/ext目录中的类库
     String s = System.getProperty("java.ext.dirs");
     File[] dirs;
     if (s != null) {
         StringTokenizer st =
             new StringTokenizer(s, File.pathSeparator);
         int count = st.countTokens();
         dirs = new File[count];
         for (int i = 0; i < count; i++) {
             dirs[i] = new File(st.nextToken());
         }
     } else {
         dirs = new File[0];
     }
     return dirs;
 }
```

**系统（System）类加载器/应用程序类加载器**

指 Sun公司实现的sun.misc.Launcher`$`AppClassLoader。它负责加载系统类路径java -classpath或-D java.class.path 指定路径下的类库，也就是我们经常用到的classpath路径，开发者可以直接使用系统类加载器，一般情况下该类加载是程序中默认的类加载器，通过ClassLoader#getSystemClassLoader()方法可以获取到该类加载器。

自定义类加载器

```java
//该加载器可以加载与自己在同一路径下的Class文件  
public class MyClassLoader extends ClassLoader{  
    @Override  
    public Class<?> loadClass(String name) throws ClassNotFoundException{  
        try {    
            String fileName=name.substring(name.lastIndexOf(".")+1)+".class";  
            InputStream is=getClass().getResourceAsStream(fileName);    
            if(is==null){  
                //不在当前路径下的类，例如Object类（JavaBean的父类），采用委派模型加载  
                return super.loadClass(name);   
            }else{  
                //在当前路径下的类，例如JavaBean类，直接通过自己加载其Class文件  
                byte[] b=new byte[is.available()];  
                is.read(b);  
                return defineClass(name,b,0,b.length);     
            }  
        } catch (IOException e) {   
            throw new ClassNotFoundException();  
        }  
    }  
}  
```

### 类的唯一性

对于任意一个类，都需要由加载它的类加载器和类的全限定名一同确定其在Java虚拟机中的唯一性。

只有被同一个类加载器加载的类才可能会想等。相同的字节码被不同的类加载器加载的类不想等。

```java
public class ClassLoaderTest {
    public static void main(String[] args) throws Exception{
        ClassLoader myLoader=new MyClassLoader();
        Object classLoaderTest=myLoader.loadClass("com.loader.ClassLoaderTest").newInstance();
        System.out.println(classLoaderTest.getClass());
        System.out.println(classLoaderTest instanceof  ClassLoaderTest);
    }
}
```

```java
class com.loader.ClassLoaderTest
false
```

### 双亲委派模型

类加载器之间的层次关系，称为类加载器的双亲委派模型。双亲委派模型要求除了顶层的启动类加载器外，其余类加载器都应该有自己的父类加载器。注意，这里类加载器之间的父子关系一般不会以继承的关系实现，而是使用组合关系来复用父加载器的代码。

### 双亲委派工作原理

如果一个类加载器收到了类加载的请求，它首先不会自己去尝试加载这个类，而是把这个请求委派给父类加载器去完成，每一个层次的类加载器都是如此，因此所有的加载请求最终都应该首先传送到顶层的启动类加载器中，只有当父加载器反馈自己无法完成这个加载请求时，子加载器才会尝试自己去加载。 **如果最初发起的类加载的类加载器也无法完成加载请求时候，将会抛出ClassNotFound，而不再调用子类的加载器去加载请求。**

### 双亲委派源码

类加载器均是继承自java.lang.ClassLoader抽象类。首先，我们看一看java.lang.ClassLoader类的loadClass()方法：

```java
protected Class<?> loadClass(String name, boolean resolve)  
        throws ClassNotFoundException  
    {  
        synchronized (getClassLoadingLock(name)) {//对加载类的过程进行同步  
            // 首先，检查请求的类是否已经被加载过了  
            // First, check if the class has already been loaded  
            Class c = findLoadedClass(name);  
            if (c == null) {  
                long t0 = System.nanoTime();  
                try {  
                    if (parent != null) {  
                        c = parent.loadClass(name, false);//委派请求给父加载器  
                    } else {  
                        //父加载器为null，说明this为扩展类加载器的实例，父加载器为启动类加载器  
                        c = findBootstrapClassOrNull(name);  
                    }  
                } catch (ClassNotFoundException e) {  
                    // 如果父加载器抛出ClassNotFoundException  
                    // 说明父加载器无法完成加载请求  
                    // ClassNotFoundException thrown if class not found  
                    // from the non-null parent class loader  
                }  
                if (c == null) {  
                    // 如果父加载器无法加载  
                    // 调用本身的findClass方法来进行类加载  
                    // If still not found, then invoke findClass in order  
                    // to find the class.  
                    long t1 = System.nanoTime();  
                    c = findClass(name);  
                    // this is the defining class loader; record the stats  
                    sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);  
                    sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);  
                    sun.misc.PerfCounter.getFindClasses().increment();  
                }  
            }  
            if (resolve) {  
                resolveClass(c);  
            }  
            return c;  
        }  
    }  
```

```java
protected Class<?> loadClass(String name, boolean resolve)  
    throws ClassNotFoundException  
{  
..  
                if (parent != null) {//父加载器不为null,即父加载器为ClassLoader类型  
                    c = parent.loadClass(name, false);//委派请求给父加载器  
                } else {//父加载器为null，说明this为扩展类加载器的实例          
                    c = findBootstrapClassOrNull(name);//通过启动类加载器加载类  
                }  
..  
}  
```

```java
/**通过启动类加载器加载类 
 * Returns a class loaded by the bootstrap class loader; 
 * or return null if not found. 
 */  
private Class findBootstrapClassOrNull(String name)  
{  
    if (!checkName(name)) return null;  
    return findBootstrapClass(name);  
}  
```

```java
// return null if not found 启动类加载器通过本地方法加载类  
private native Class findBootstrapClass(String name);  
```

默认情况下，应用程序中的类由 应用程序类加载器 （ AppClassLoader ）加载。该加载器加载 系统类路径 下的类，因此一般也称为 系统类加载器 。

### 双亲委派优势

类加载器一起具备了一种带优先级的层次关系，越是基础的类，越被上层的类加载器锁加载，保证了java程序的稳定性。
