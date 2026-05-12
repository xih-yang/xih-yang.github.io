# 01、Solr4.8.0源码分析(1)之Solr的Servlet
- 来源：https://ddkk.com/zhuanlan/search/solr/1/1.html
- 分类：搜索引擎
- 分组：教程目录
Solr是作为一个Servlet运行在Tomcat里面的，可以查看Solr的web.xml。

## 1.web.xml配置

由web.xml可以看出，基本上所有Solr的操作都是在SolrDispatchFilter中实现的。当输入http://localhost:8080/solr/前缀的URL就会触发SolrDispatchFilter.

```xml
<filter>
  <filter-name>SolrRequestFilter</filter-name>
  <filter-class>org.apache.solr.servlet.SolrDispatchFilter</filter-class>
  <init-param>
    <param-name>path-prefix</param-name>
    <param-value>/xxx</param-value>
  </init-param>
</filter>
<filter-mapping>
  <filter-name>SolrRequestFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
<servlet>
  <servlet-name>RedirectOldAdminUI</servlet-name>
  <servlet-class>org.apache.solr.servlet.RedirectServlet</servlet-class>
  <init-param>
    <param-name>destination</param-name>
    <param-value>${context}/#/</param-value>
  </init-param>
</servlet>
<servlet-mapping>
  <servlet-name>RedirectOldAdminUI</servlet-name>
  <url-pattern>/admin/</url-pattern>
</servlet-mapping>
```

## 2. SolrDispatchFilter的实现

SolrDispatchFilter继承了Filter，实现主要分为三个接口：init，dofilter，destory。其中init和destory分别在tomcat的启动和关闭时候进行。

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
  /**
   * filter接口的具体实现，这里主要实现了主要的Solr功能
   */
  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
    doFilter(request, response, chain, false);
  }
  /**
   * 关闭Solr
   */
  @Override
  public void destroy() {
    if (cores != null) {
      cores.shutdown();
      cores = null;
    }    
  }
}
```

## 3.Servlet的实现

通过查看web.xml以及源码可以看到，虽然Solr继承并实现了Servlet接口，但是Solr的主要操作却是主要集中在dofilter里面。以RedictServlet为例，它主要实现了http的重定向功能。从web.xml配置中可以看到，当url为solr/admin时候就会重定向为solr/#/

```java
/**
 * A Simple redirection servlet to help us deprecate old UI elements
 */
public class RedirectServlet extends BaseSolrServlet {
  static final String CONTEXT_KEY = "${context}";
  String destination;
  int code = HttpServletResponse.SC_MOVED_PERMANENTLY;
  @Override
  public void init(ServletConfig config) throws ServletException {
    super.init(config);
    destination = config.getInitParameter("destination");
    if(destination==null) {
      throw new ServletException("RedirectServlet missing destination configuration");
    }
    if( "false".equals(config.getInitParameter("permanent") )) {
      code = HttpServletResponse.SC_MOVED_TEMPORARILY;
    }
        // 获取重定向的url 解析init-param 获取destination值
    // Replace the context key
    if(destination.startsWith(CONTEXT_KEY)) {
      destination = config.getServletContext().getContextPath()
          +destination.substring(CONTEXT_KEY.length());
    }
  }
  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse res)
          throws ServletException,IOException {
    res.setStatus(code);
    res.setHeader("Location", destination);
  }
}
```
