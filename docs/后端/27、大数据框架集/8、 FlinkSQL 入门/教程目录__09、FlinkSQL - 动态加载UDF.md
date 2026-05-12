# 09、FlinkSQL - 动态加载UDF
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/9.html
- 分类：大数据框架
- 分组：教程目录
本文首发自https://www.cnblogs.com/slankka/ 转载请注明出处。

本文的主要内容是介绍如何动态加载Flink作业的UDF。

## Classloader

加载UDF一定是classLoader做的，而作业启动的过程中，App ClassLoader的具体实现类为：

```java
static class AppClassLoader extends URLClassLoader
```

而URLClassLoader 看名字是支持URL的。

## 实际情况

已知在Flink的启动参数`-C`中加入Flink的UDF可以成功执行作业提交过程。

```java
static final Option CLASSPATH_OPTION =
            new Option(
                    "C",
                    "classpath",
                    true,
                    "Adds a URL to each user code "
                            + "classloader  on all nodes in the cluster. The paths must specify a protocol (e.g. file://) and be "
                            + "accessible on all nodes (e.g. by means of a NFS share). You can use this option multiple "
                            + "times for specifying more than one URL. The protocol must be supported by the "
                            + "{@link java.net.URLClassLoader}.");
```

但是Flink(1.13以前)会报错：

```java
Caused by: org.apache.flink.table.api.ValidationException: SQL validation failed. Can't resolve udf class com.slankka.flink.udf.PlusTwoFunc
	at org.apache.flink.table.planner.calcite.FlinkPlannerImpl.org$apache$flink$table$planner$calcite$FlinkPlannerImpl$$validate(FlinkPlannerImpl.scala:152)
	at org.apache.flink.table.planner.calcite.FlinkPlannerImpl.validate(FlinkPlannerImpl.scala:111)
	at org.apache.flink.table.planner.operations.SqlToOperationConverter.convert(SqlToOperationConverter.java:189)
	at org.apache.flink.table.planner.operations.SqlToOperationConverter.convertSqlInsert(SqlToOperationConverter.java:564)
	at org.apache.flink.table.planner.operations.SqlToOperationConverter.convert(SqlToOperationConverter.java:248)
	at org.apache.flink.table.planner.delegation.ParserImpl.parse(ParserImpl.java:77)
	at org.apache.flink.table.api.internal.TableEnvironmentImpl.sqlUpdate(TableEnvironmentImpl.java:733)
	at com.slankka.rtc.flinkplatform.sql.SqlJob.lambda$start$0(SqlJob.java:123)
	at java.lang.Iterable.forEach(Iterable.java:75)
	at com.slankka.rtc.flinkplatform.sql.SqlJob.start(SqlJob.java:116)
	at com.slankka.rtc.flinkplatform.sql.SqlJobDriver.main(SqlJobDriver.java:14)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at org.apache.flink.client.program.PackagedProgram.callMainMethod(PackagedProgram.java:349)
	... 11 more
Caused by: java.lang.RuntimeException: Can't resolve udf class com.slankka.flink.udf.PlusTwoFunc
	at org.apache.flink.table.catalog.CatalogFunctionImpl.isGeneric(CatalogFunctionImpl.java:77)
	at org.apache.flink.table.catalog.hive.factories.HiveFunctionDefinitionFactory.createFunctionDefinition(HiveFunctionDefinitionFactory.java:63)
	at org.apache.flink.table.catalog.FunctionCatalog.resolvePreciseFunctionReference(FunctionCatalog.java:570)
	at org.apache.flink.table.catalog.FunctionCatalog.lambda$resolveAmbiguousFunctionReference$2(FunctionCatalog.java:614)
	at java.util.Optional.orElseGet(Optional.java:267)
	at org.apache.flink.table.catalog.FunctionCatalog.resolveAmbiguousFunctionReference(FunctionCatalog.java:614)
	at org.apache.flink.table.catalog.FunctionCatalog.lookupFunction(FunctionCatalog.java:361)
	at org.apache.flink.table.planner.catalog.FunctionCatalogOperatorTable.lookupOperatorOverloads(FunctionCatalogOperatorTable.java:97)
	at org.apache.calcite.sql.util.ChainedSqlOperatorTable.lookupOperatorOverloads(ChainedSqlOperatorTable.java:67)
	at org.apache.calcite.sql.validate.SqlValidatorImpl.performUnconditionalRewrites(SqlValidatorImpl.java:1260)
	at org.apache.calcite.sql.validate.SqlValidatorImpl.performUnconditionalRewrites(SqlValidatorImpl.java:1275)
	at org.apache.calcite.sql.validate.SqlValidatorImpl.performUnconditionalRewrites(SqlValidatorImpl.java:1245)
	at org.apache.calcite.sql.validate.SqlValidatorImpl.validateScopedExpression(SqlValidatorImpl.java:1009)
	at org.apache.calcite.sql.validate.SqlValidatorImpl.validate(SqlValidatorImpl.java:724)
	at org.apache.flink.table.planner.calcite.FlinkPlannerImpl.org$apache$flink$table$planner$calcite$FlinkPlannerImpl$$validate(FlinkPlannerImpl.scala:147)
	... 26 more
Caused by: java.lang.ClassNotFoundException: com.slankka.flink.udf.PlusTwoFunc
	at java.net.URLClassLoader.findClass(URLClassLoader.java:381)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
	at java.lang.Class.forName0(Native Method)
	at java.lang.Class.forName(Class.java:264)
	at org.apache.flink.table.catalog.CatalogFunctionImpl.isGeneric(CatalogFunctionImpl.java:72)
	... 40 more
```

这个调用链非常清楚，提交作业的程序是：

```java
private final URLClassLoader userCodeClassLoader;
org.apache.flink.client.program.PackagedProgram#callMainMethod
```

这里已经进入作业的main函数了。使用的类加载器是：`UserCodeClassLoader`

```java
this.extractedTempLibraries =
                this.jarFile == null
                        ? Collections.emptyList()
                        : extractContainedLibraries(this.jarFile);
this.userCodeClassLoader =
                ClientUtils.buildUserCodeClassLoader(
                        getJobJarAndDependencies(),
                        classpaths,
                        getClass().getClassLoader(),
                        configuration);
```

再看UserCodeClassLoader的构建过程：

**实际上已经加载了-C参数指定的JAR了**

```java
public static URLClassLoader buildUserCodeClassLoader(
            List<URL> jars, List<URL> classpaths, ClassLoader parent, Configuration configuration) {
        URL[] urls = new URL[jars.size() + classpaths.size()];
        for (int i = 0; i < jars.size(); i++) {
            urls[i] = jars.get(i);
        }
        for (int i = 0; i < classpaths.size(); i++) {
            urls[i + jars.size()] = classpaths.get(i);
        }
        final String[] alwaysParentFirstLoaderPatterns =
                CoreOptions.getParentFirstLoaderPatterns(configuration);
        final String classLoaderResolveOrder =
                configuration.getString(CoreOptions.CLASSLOADER_RESOLVE_ORDER);
        FlinkUserCodeClassLoaders.ResolveOrder resolveOrder =
                FlinkUserCodeClassLoaders.ResolveOrder.fromString(classLoaderResolveOrder);
        final boolean checkClassloaderLeak =
                configuration.getBoolean(CoreOptions.CHECK_LEAKED_CLASSLOADER);
        return FlinkUserCodeClassLoaders.create(
                resolveOrder,
                urls,
                parent,
                alwaysParentFirstLoaderPatterns,
                NOOP_EXCEPTION_HANDLER,
                checkClassloaderLeak);
    }
```

但不知为何，仍旧出现上述错误。

## 临时解决方案

**可以自行编译CatalogFunctionImpl.java** 适用于Flink-1.13以下所有版本

```java
	@Override
	public boolean isGeneric() {
		if (functionLanguage == FunctionLanguage.PYTHON) {
			return true;
		}
		try {
			ClassLoader cl = Thread.currentThread().getContextClassLoader();
			Class c = Class.forName(className, true, cl);
			if (UserDefinedFunction.class.isAssignableFrom(c)) {
				return true;
			}
		} catch (ClassNotFoundException e) {
			throw new RuntimeException(String.format("Can't resolve udf class %s", className), e);
		}
		return false;
	}
```

**在Flink作业的main函数的开头自行加载UDF** Flink-1.13 以前有此问题。

```java
//动态加载Jar
  public static void loadJar(List<URL> jarUrl) {
    //从URLClassLoader类加载器中获取类的addURL方法
    Method method = null;
    try {
      method = URLClassLoader.class.getDeclaredMethod("addURL", URL.class);
    } catch (NoSuchMethodException | SecurityException ignore) {
    }
    // 获取方法的访问权限
    assert method != null;
    boolean accessible = method.isAccessible();
    try {
      //修改访问权限为可写
      if (!accessible) {
        method.setAccessible(true);
      }
      // 获取系统类加载器
      URLClassLoader classLoader = (URLClassLoader) ClassLoader.getSystemClassLoader();
      //jar路径加入到系统url路径里
      for (URL jar : jarUrl) {
        method.invoke(classLoader, jar);
      }
    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      method.setAccessible(accessible);
    }
  }
```

## 新解决方案

[[Flink-20606]](https://github.com/apache/flink/pull/14392/commits) Flink-1.13 已经修复此问题。
