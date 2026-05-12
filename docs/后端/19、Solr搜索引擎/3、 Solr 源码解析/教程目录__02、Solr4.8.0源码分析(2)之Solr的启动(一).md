# 02、Solr4.8.0源码分析(2)之Solr的启动(一)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/2.html
- 分类：搜索引擎
- 分组：教程目录
上文写到Solr的启动过程是在SolrDispatchFilter的init()里实现，当Tomcat启动时候会自动调用init();

Solr的启动主要在 this.cores = createCoreContainer();语句中实现。

```java
/**
  *初始化，当tomcat启动时候开始初始化，其中主要调用createCoreContainer来实现Solr的初始化
  */
public void init(FilterConfig config) throws ServletException
  {
    log.info("SolrDispatchFilter.init()");
    try {
      // web.xml configuration
      this.pathPrefix = config.getInitParameter( "path-prefix" );
      this.cores = createCoreContainer();
      log.info("user.dir=" + System.getProperty("user.dir"));
    }
    catch( Throwable t ) {
      // catch this so our filter still works
      log.error( "Could not start Solr. Check solr/home property and the logs");
      SolrCore.log( t );
      if (t instanceof Error) {
        throw (Error) t;
      }
    }
    log.info("SolrDispatchFilter.init() done");
  }
```

Solr的启动过程主要包括：

**1、** 获取SolrHome：分别先后通过JNDI，Systemproperty，defaultdirectory三种方式尝试获取；

**2、** 实例化启动过程中使用的类加载器SolrResourceLoader；

**3、** 加载solrhome下的solr.xml文件，封装为ConfigSolr；

**4、** 实例化一个CoreContainer,通过CoreContainer来加载cores；

**5、** 遍历SolrHome，当寻找到含有core.properties的文件夹，则作为一个core；

**6、** 多线程加载cores；

**7、** 加载每个core时先加载solrconfig.xml封装为SolrConfig；

**8、** 再加载schema.xml封装为IndexSchema；

**9、** 最后实例化SolrCore；

以下是createCoreContainer()实现代码，该函数就包含了以上的启动过程。

```java
/**
* Override this to change CoreContainer initialization
* @return a CoreContainer to hold this server's cores
*/
protected CoreContainer createCoreContainer() {
SolrResourceLoader loader = new SolrResourceLoader(SolrResourceLoader.locateSolrHome()); 
        ConfigSolr config = loadConfigSolr(loader);
        CoreContainer cores = new CoreContainer(loader, config);
        cores.load();
    return cores;
}
```

**1、** 获取SolrHome信息；

Solr通过三种方式来获取SolrHome,分别是JNDI,System property,以及当前路径。

JNDI的java:comp/env/solr/home的获取，主要通过在tomcat/conf/Catalina/localhost目录下新建solr.xml。Tomcat启动的时候就会该目录下自动获取 SolrHome的信息.

System property的SolrHome获取是直接在tomcat启动脚本catalina.sh中加入set JAVA_OPTS -Dsolr.solr.home=/Users/rcf/workspace/java/solr 。

最后的获取SolrHome的方式就是在当前目录下查找。

```java
/**
 * Determines the solrhome from the environment.
 * Tries JNDI (java:comp/env/solr/home) then system property (solr.solr.home);
 * if both fail, defaults to solr/
 * @return the instance directory name
 */
/**
 * Finds the solrhome based on looking up the value in one of three places:
 * <ol>
 *  <li>JNDI: via java:comp/env/solr/home</li>
 *  <li>The system property solr.solr.home</li>
 *  <li>Look in the current working directory for a solr/ directory</li> 
 * </ol>
 *
 * The return value is normalized.  Normalization essentially means it ends in a trailing slash.
 * @return A normalized solrhome
 * @seenormalizeDir(String)
 */
public static String locateSolrHome() {
  String home = null;
  // Try JNDI
  try {
    Context c = new InitialContext();
    home = (String)c.lookup("java:comp/env/"+project+"/home");
    log.info("Using JNDI solr.home: "+home );
  } catch (NoInitialContextException e) {
    log.info("JNDI not configured for "+project+" (NoInitialContextEx)");
  } catch (NamingException e) {
    log.info("No /"+project+"/home in JNDI");
  } catch( RuntimeException ex ) {
    log.warn("Odd RuntimeException while testing for JNDI: " + ex.getMessage());
  } 
  // Now try system property
  if( home == null ) {
    String prop = project + ".solr.home";
    home = System.getProperty(prop);
    if( home != null ) {
      log.info("using system property "+prop+": " + home );
    }
  }
  // if all else fails, try 
  if( home == null ) {
    home = project + '/';
    log.info(project + " home defaulted to '" + home + "' (could not find system property or JNDI)");
  }
  return normalizeDir( home );
}
```

```xml
<Context docBase="/Users/rcf/workspace/java/tomcat/apache-tomcat-8.0.9/webapps/solr.war" debug="0" crossContext="true" > 
    <Environment name="solr/home" type="java.lang.String" value="/Users/rcf/workspace/java/solr" override="true" />
</Context>  
```

获取完SolrHome后,就会实例化SolrResourceLoader。因为传进去的parent是null，所以parents是ContextClassLoader，并且加载了SolrHome/lib/下的文件.

```java
/**
 * <p>
 * This loader will delegate to the context classloader when possible,
 * otherwise it will attempt to resolve resources using any jar files
 * found in the "lib/" directory in the specified instance directory.
 * </p>
 *
 * @param instanceDir - base directory for this resource loader, if null locateSolrHome() will be used.
 * @seelocateSolrHome
 */
public SolrResourceLoader( String instanceDir, ClassLoader parent, Properties coreProperties )
{
  if( instanceDir == null ) {
    this.instanceDir = SolrResourceLoader.locateSolrHome();
    log.info("new SolrResourceLoader for deduced Solr Home: '{}'", 
             this.instanceDir);
  } else{
    this.instanceDir = normalizeDir(instanceDir);
    log.info("new SolrResourceLoader for directory: '{}'",
             this.instanceDir);
  }
  this.classLoader = createClassLoader(null, parent);
  addToClassLoader("./lib/", null, true);
  reloadLuceneSPI();
  this.coreProperties = coreProperties;
}
```

```java
 /**
  * Convenience method for getting a new ClassLoader using all files found
  * in the specified lib directory.
  */
 static URLClassLoader createClassLoader(final File libDir, ClassLoader parent) {
   if ( null == parent ) {
     parent = Thread.currentThread().getContextClassLoader();
   }
   return replaceClassLoader(URLClassLoader.newInstance(new URL[0], parent),
1                            libDir, null);
1}
```

```java
/**
 * Adds every file/dir found in the baseDir which passes the specified Filter
 * to the ClassLoader used by this ResourceLoader.  This method <b>MUST</b>
 * only be called prior to using this ResourceLoader to get any resources, otherwise
 * it's behavior will be non-deterministic. You also have to {link @reloadLuceneSPI}
 * before using this ResourceLoader.
 * 
 * <p>This method will quietly ignore missing or non-directory <code>baseDir</code>
 *  folder. 
 *
 * @param baseDir base directory whose children (either jars or directories of
 *                classes) will be in the classpath, will be resolved relative
 *                the instance dir.
 * @param filter The filter files must satisfy, if null all files will be accepted.
 * @param quiet  Be quiet if baseDir does not point to a directory or if no file is 
 *               left after applying the filter. 
 */
void addToClassLoader(final String baseDir, final FileFilter filter, boolean quiet) {
  File base = FileUtils.resolvePath(new File(getInstanceDir()), baseDir);
  if (base != null && base.exists() && base.isDirectory()) {
    File[] files = base.listFiles(filter);
    if (files == null || files.length == 0) {
      if (!quiet) {
        log.warn("No files added to classloader from lib: "
                 + baseDir + " (resolved as: " + base.getAbsolutePath() + ").");
      }
    } else {
      this.classLoader = replaceClassLoader(classLoader, base, filter);
    }
  } else {
    if (!quiet) {
      log.warn("Can't find (or read) directory to add to classloader: "
          + baseDir + " (resolved as: " + base.getAbsolutePath() + ").");
    }
  }
}
```
