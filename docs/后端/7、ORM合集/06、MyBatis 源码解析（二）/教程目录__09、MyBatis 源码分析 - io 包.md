# 09、MyBatis 源码分析 - io 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/9.html
- 分类：ORM框架
- 分组：教程目录
> 经过前面几个包的分析，我们已经渐渐开始步入正轨了，希望大家可以坚持下去。如果能认认真真的把源码分析清楚的话，我相信你一定会有所收获的。努力是不会辜负你的。

I/O 即 Input/Output，也就是输入输出包，它负责完成 Mybatis 中所有的输入/输出相关的操作。

输入/输出的话，第一个能想到的就是对磁盘文件的读写。在 Mybatis 中，与磁盘文件的交互主要是对 xml 配置文件的读取操作。除了对磁盘的读写，还有对内存中类文件的操作。

### io 包 UML 图

### ClassLoaderWrapper 和 Resources

通过观察 UML 图，可以知道 `Resources` 依赖于 `ClassLoaderWrapper`，所以我们首先学习 `ClassLoaderWrapper`。

#### ClassLoaderWrapper

在学习一个类的时候，如果发现类中的方法很多，一定不会感到害怕，而且也不要硬着头皮一个一个去看，最好找一个作图工具，然后把类中的方法调用给理出来，这样看上去就会清晰很多了。现在我们需要重点关注的方法只有三个了。

具体的源码就不在这里讲解了，但是它们的底层都是借助的 ClassLoader 的类加载能力。

#### Resources

Resources 使用的是代理模式，也就是说，它的所有方法都是通过代理类来实现的，即都是使用的 ClassLoaderWrapper。其中的 API 没有什么需要重点关注的，所以这里就不再详细讲解了。

### ResolveUtil 和 VFS 及其实现类

由于ResolveUtil 和 VFS 有依赖关系，所以我们首先需要关注的是 VFS及其实现类。

#### VFS 及其实现类

VFS(Virtual File System)，虚拟文件系统。我们知道磁盘文件系统分为很多种，如 FAT、VFAT、NFS、NTFS等，不同文件系统的读取操作各不相同。而 VFS 的作用就是将各个磁盘文件系统的差异屏蔽了起来，提供了统一的操作接口。使得上层的软件能够用单一的方式来跟底层不同的文件系统交互。

VFS 采用的是单例模式，它有一个内部类 VFSHolder 持有了 VFS 的唯一实例。为什么设计了 VFSHolder 是因为可以按需加载，如果加载 VFS 时，并不会加载 VFSHolder，只有在第一次调用 VFS.getInstance() 时，才会去加载 VFSHolder，然后生成 VFS 的实例。

VFS 有两个内置的实现类 DefaultVFS 和 JBoss6VFS，而 DefaultVFS 是保底方案也就是说，如果其他的 VFS 实现类都无效的话，那么就会使用 DefaultVFS。

##### VFS 及其实现类

我们现在先关注 VFS 所有对外提供的方法，因为知道了 VFS 的作用我们才能更好的去学习。VFS 对外提供的方法如下图：

- getInstantce()：获取 VFS 的实例
- addImplClass()：将用户自定义的 VFS 实现注册到表中
- abstract isValid()：当前 VFS 实现类在当前环境是否有效
- abstract list(String)：递归列出所有资源的完整资源路径

VFS 的子类，只需要实现两个抽象方法 isValid、list。具体的实现就不在这里叙述了，因为涉及的内容比较底层。

##### VFSHolder

```java
private static class VFSHolder {
    // 只有在类加载的时候才会初始化
    static final VFS INSTANCE = createVFS();
    @SuppressWarnings("unchecked")
    static VFS createVFS() {
      // 保证用户自定义的 VFS 在前，Mybatis 内置的 VFS 实现类在后
      List<Class<? extends VFS>> impls = new ArrayList<>();
      impls.addAll(USER_IMPLEMENTATIONS);
      impls.addAll(Arrays.asList((Class<? extends VFS>[]) IMPLEMENTATIONS));
      // 从列表中找到第一个有效的 VFS 实现类
      VFS vfs = null;
      for (int i = 0; vfs == null || !vfs.isValid(); i++) {
        Class<? extends VFS> impl = impls.get(i);
        try {
          vfs = impl.getDeclaredConstructor().newInstance();
        } catch (InstantiationException | IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
          log.error("Failed to instantiate " + impl, e);
          return null;
        }
      }
      return vfs;
    }
  }
```

#### ResolveUtil

ResolveUtil 作为一个工具类，主要用于遍历某一个路径下所有的文件，并且找到符合条件的文件，这是两个功能 `遍历`、`筛选`。我们知道 ResolveUtil 是依赖于 VFS 的，`遍历` 功能即使由它来提供的，这也是代理模式的一种体现（由此可见设计模式在源码到处都是有所体现的）。而 `筛选` 功能则是由它的内部类 `Test` 来实现的只有符合 `Test.matches()` 方法的才能被留下来。

**ResolveUtil 的关键方法**

- findImplementations(Class`` parent, String... packageNames)：找到指定包路径下所有实现或继承了指定类的类列表
- findAnnotated(Class`` annotation, String... packageNames)：找到指定包路径下所有包含指定注解的类列表
- find(Test test, String packageName)：找到指定包路径下所有符合条件的类列表，如果用户自定义了 Test 的实现类，那么就可以使用这个方法。
