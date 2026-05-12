# 13、Tomcat 源码解析 - Tomcat configureStart
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/13.html
- 分类：服务器框架
- 分组：教程目录
这篇单独分析configureStart –>webconfig方法,下面是configureStart的代码

```java
protected synchronized void configureStart() {
        // Called from StandardContext.start()
        if (log.isDebugEnabled()) {
            log.debug(sm.getString("contextConfig.start"));
        }
        if (log.isDebugEnabled()) {
            log.debug(sm.getString("contextConfig.xmlSettings",
                    context.getName(),
                    Boolean.valueOf(context.getXmlValidation()),
                    Boolean.valueOf(context.getXmlNamespaceAware())));
        }
        webConfig();
        if (!context.getIgnoreAnnotations()) {
            applicationAnnotationsConfig();
        }
        if (ok) {
            validateSecurityRoles();
        }
        // Configure an authenticator if we need one
        if (ok) {
            authenticatorConfig();
        }
       ………………………….
}
```

**WebConfig****方法：**

```java
protected void webConfig() {
//创建WebXmlParser解析web.xml配置文件，实例化WebXml类 start
//goto 解析WebXmlParser
        WebXmlParser webXmlParser = new WebXmlParser(context.getXmlNamespaceAware(),
                context.getXmlValidation(), context.getXmlBlockExternal());
//goto分析解析WebXmlFragment
        Set<WebXml> defaults = new HashSet<>();
        defaults.add(getDefaultWebXmlFragment(webXmlParser));
//goto分析解析ContextWebXml
        WebXml webXml = createWebXml();
        InputSource contextWebXml = getContextWebXmlSource();
        if (!webXmlParser.parseWebXml(contextWebXml, webXml, false)) {
            ok = false;
        }
//创建WebXmlParser解析web.xml配置文件，实例化WebXml类 End
        ServletContext sContext = context.getServletContext();
        // Ordering is important here
        // Step 1. Identify all the JARs packaged with the application and those
        // provided by the container. If any of the application JARs have a
        // web-fragment.xml it will be parsed at this point. web-fragment.xml
        // files are ignored for container provided JARs.
//goto分析step1
        Map<String,WebXml> fragments = processJarsForWebFragments(webXml, webXmlParser);
        // Step 2. Order the fragments.
//goto分析step2
        Set<WebXml> orderedFragments = null;
        orderedFragments =
                WebXml.orderWebFragments(webXml, fragments, sContext);
        // Step 3. Look for ServletContainerInitializer implementations
//goto分析step3
        if (ok) {
            processServletContainerInitializers();
        }
        if  (!webXml.isMetadataComplete() || typeInitializerMap.size() > 0) {
            // Step 4. Process /WEB-INF/classes for annotations and
            // @HandlesTypes matches
//goto分析step4
            Map<String,JavaClassCacheEntry> javaClassCache = new HashMap<>();
            if (ok) {
                WebResource[] webResources =
                        context.getResources().listResources("/WEB-INF/classes");
                for (WebResource webResource : webResources) {
                    // Skip the META-INF directory from any JARs that have been
                    // expanded in to WEB-INF/classes (sometimes IDEs do this).
                    if ("META-INF".equals(webResource.getName())) {
                        continue;
                    }
                    processAnnotationsWebResource(webResource, webXml,
                            webXml.isMetadataComplete(), javaClassCache);
                }
            }
            // Step 5. Process JARs for annotations and
            // @HandlesTypes matches - only need to process those fragments we
            // are going to use (remember orderedFragments includes any
            // container fragments)
            if (ok) {
                processAnnotations(
                        orderedFragments, webXml.isMetadataComplete(), javaClassCache);
            }
            // Cache, if used, is no longer required so clear it
            javaClassCache.clear();
        }
        if (!webXml.isMetadataComplete()) {
//goto 分析step6~9
            // Step 6. Merge web-fragment.xml files into the main web.xml
            // file.
            if (ok) {
                ok = webXml.merge(orderedFragments);
            }
            // Step 7. Apply global defaults
            // Have to merge defaults before JSP conversion since defaults
            // provide JSP servlet definition.
            webXml.merge(defaults);
            // Step 8. Convert explicitly mentioned jsps to servlets
            if (ok) {
                convertJsps(webXml);
            }
            // Step 9. Apply merged web.xml to Context
            if (ok) {
                configureContext(webXml);
            }
        } else {
            webXml.merge(defaults);
            convertJsps(webXml);
            configureContext(webXml);
        }
        if (context.getLogEffectiveWebXml()) {
            log.info("web.xml:\n" + webXml.toXml());
        }
        // Always need to look for static resources
        // Step 10. Look for static resources packaged in JARs
//goto分析step10
        if (ok) {
            // Spec does not define an order.
            // Use ordered JARs followed by remaining JARs
            Set<WebXml> resourceJars = new LinkedHashSet<>();
            for (WebXml fragment : orderedFragments) {
                resourceJars.add(fragment);
            }
            for (WebXml fragment : fragments.values()) {
                if (!resourceJars.contains(fragment)) {
                    resourceJars.add(fragment);
                }
            }
            processResourceJARs(resourceJars);
            // See also StandardContext.resourcesStart() for
            // WEB-INF/classes/META-INF/resources configuration
        }
        // Step 11. Apply the ServletContainerInitializer config to the
        // context
//goto分析step11
        if (ok) {
            for (Map.Entry<ServletContainerInitializer,
                    Set<Class<?>>> entry :
                        initializerClassMap.entrySet()) {
                if (entry.getValue().isEmpty()) {
                    context.addServletContainerInitializer(
                            entry.getKey(), null);
                } else {
                    context.addServletContainerInitializer(
                            entry.getKey(), entry.getValue());
                }
            }
        }
}
```

**1. 解析WebXmlParser：WebXmlParser解析填充webxml对象分析，先看WebXmlParser代码，看源码可以发现是同样是通过Digester来解析webxml的配置，下面是WebXmlParser的构造方法，可以方法跟web解析相关的rule是WebRuleSet，现在来看WebRuleSet的addRuleInstances**

```java
public WebXmlParser(boolean namespaceAware, boolean validation,
            boolean blockExternal) {
//创建web-app的Digester
        webRuleSet = new WebRuleSet(false);
        webDigester = DigesterFactory.newDigester(validation,
                namespaceAware, webRuleSet, blockExternal);
        webDigester.getParser();
//创建web-fragment的Digester
        webFragmentRuleSet = new WebRuleSet(true);
        webFragmentDigester = DigesterFactory.newDigester(validation,
                namespaceAware, webFragmentRuleSet, blockExternal);
        webFragmentDigester.getParser();
}
    //WebXml会作为根对象push进Digester类
WebRuleSet的addRuleInstances方法：
public void addRuleInstances(Digester digester) {
// SetPublicIdRule 的作用是解析到web-app或者web-fragment的时候，调用WebXml的SetPublicIdRule方法，传入Digester解析得到的publicId
        digester.addRule(fullPrefix,
                new SetPublicIdRule("setPublicId"));
// IgnoreAnnotationsRule 调用WebXml对象的setMetadataComplete，web-app标签metadata-complete的属性值作为参数
        digester.addRule(fullPrefix,
                new IgnoreAnnotationsRule());
// VersionRule调用WebXml对象的setVersion，web-app标签version属性值作为参数
        digester.addRule(fullPrefix,
                new VersionRule());
// AbsoluteOrderingRule，实例化WebXml类的absoluteOrdering 属性，什么作用后面可以看到
        digester.addRule(fullPrefix + "/absolute-ordering", absoluteOrdering);
//打印log的一个rule，如果不是fragment，则会打警告的log
        digester.addRule(fullPrefix + "/ordering", relativeOrdering);
        if (fragment) {
//解析到web-fragment/name的时候，调用WebXml的setName方法，传入name标签的body text(<name>xxxs</name>)
            digester.addRule(fullPrefix + "/name", name);
//解析到web-fragment/ ordering/after/name的時候，调用WebXml的addAfterOrdering，传入标签的body text
            digester.addCallMethod(fullPrefix + "/ordering/after/name",
                                   "addAfterOrdering", 0);
            digester.addCallMethod(fullPrefix + "/ordering/after/others",
                                   "addAfterOrderingOthers");
            digester.addCallMethod(fullPrefix + "/ordering/before/name",
                                   "addBeforeOrdering", 0);
            digester.addCallMethod(fullPrefix + "/ordering/before/others",
                                   "addBeforeOrderingOthers");
//以上同解析web-fragment/ ordering/after/name标签
        } else {
            //解析到web-xml/absolute-ordering/name,调用WebXml的addAbsoluteOrdering方法，传入标签的body text
            digester.addCallMethod(fullPrefix + "/absolute-ordering/name",
                                   "addAbsoluteOrdering", 0);
//解析到web-xml/absolute-ordering/ others,调用WebXml的addAbsoluteOrderingOthers方法，传入标签的body text
            digester.addCallMethod(fullPrefix + "/absolute-ordering/others",
                                   "addAbsoluteOrderingOthers");
//解析到web-xml/ deny-uncovered-http-methods，SetDenyUncoveredHttpMethodsRule rule调用WebXml的setDenyUncoveredHttpMethods方法，设置为true
            digester.addRule(fullPrefix + "/deny-uncovered-http-methods",
                    new SetDenyUncoveredHttpMethodsRule());
        }
//解析到web-xml(web-fragement下同)/ context-param结束标签，调用WebXml的addContextParam方法，传入之前push进的param
        digester.addCallMethod(fullPrefix + "/ context-param ",
                               "addContextParam", 2);
//解析到xx/context-param/param-name，push进digester的parameters，作为之前方法的第一个参数
        digester.addCallParam(fullPrefix + "/context-param/param-name", 0);
//解析到xx/context-param/ param-value，push进digester的parameters，作为之前方法的第二个参数
        digester.addCallParam(fullPrefix + "/context-param/param-value", 1);
//解析到xx/display-name，调用WebXml方法setDisplayName，传入标签的body text
        digester.addCallMethod(fullPrefix + "/display-name",
                               "setDisplayName", 0);
//解析到xx/ distributable，SetDistributableRule rule 调用WebXml的setDistributable，设置true
        digester.addRule(fullPrefix + "/distributable",
                         new SetDistributableRule ());
//这个是有关ejb的rule，分析ejb的时候，重点分析
        configureNamingRules(digester);
//解析到xx/ error-page，创建对象org.apache.tomcat.util.descriptor.web.ErrorPage
        digester.addObjectCreate(fullPrefix + "/error-page",
                            "org.apache.tomcat.util.descriptor.web.ErrorPage");
//解析到xx/ error-page，调用WebXml的addErrorPage，传入之前ObjectCreateRule创建的对象
        digester.addSetNext(fullPrefix + "/error-page",
                            "addErrorPage",
                            "org.apache.tomcat.util.descriptor.web.ErrorPage");
//解析到xx/error-page/error-code，调用ErrorPage的setErrorCode，传入body text
        digester.addCallMethod(fullPrefix + "/error-page/error-code",
                               "setErrorCode", 0);
//解析到xx/error-page/ exception-type，调用ErrorPage的setExceptionType，传入body text
        digester.addCallMethod(fullPrefix + "/error-page/exception-type",
                               "setExceptionType", 0);
//解析到xx/error-page/ location，调用ErrorPage的setLocation，传入body text
        digester.addCallMethod(fullPrefix + "/error-page/location",
                               "setLocation", 0);
//解析到xx/ filter，创建对象org.apache.tomcat.util.descriptor.web.FilterDef
        digester.addObjectCreate(fullPrefix + "/filter",
                             "org.apache.tomcat.util.descriptor.web.FilterDef");
//解析到xx/ filter，调用WebXml的addFilter，传入之前创建的FilterDef对象
        digester.addSetNext(fullPrefix + "/filter",
                            "addFilter",
                            "org.apache.tomcat.util.descriptor.web.FilterDef");
//解析到xx/ filter/ description，调用FilterDef的setDescription方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/description",
                               "setDescription", 0);
//解析到xx/ filter/ display-name，调用FilterDef的setDisplayName方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/display-name",
                               "setDisplayName", 0);
//解析到xx/ filter/filter-class，调用FilterDef的setFilterClass方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/filter-class",
                               "setFilterClass", 0);
//解析到xx/ filter/ filter-name，调用FilterDef的setFilterName方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/filter-name",
                               "setFilterName", 0);
//解析到xx/ filter/ icon/large-icon，调用FilterDef的setLargeIcon方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/icon/large-icon",
                               "setLargeIcon", 0);
//解析到xx/ filter/ icon/ small-icon，调用FilterDef的setSmallIcon方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/icon/small-icon",
                               "setSmallIcon", 0);
//解析到xx/ filter/ async-supported，调用FilterDef的setAsyncSupported方法，传入body text
        digester.addCallMethod(fullPrefix + "/filter/async-supported",
                "setAsyncSupported", 0);
//解析到xx/filter/init-param結束标签，调用FilterDef的addInitParameter方法，传入之前push的parameters里的参数
        digester.addCallMethod(fullPrefix + "/filter/init-param",
                               "addInitParameter", 2);
//解析到xx/filter/init-param/param-name，push进digester的parameters，作为addInitParameter的第一个参数
        digester.addCallParam(fullPrefix + "/filter/init-param/param-name",
                              0);
//解析到xx/filter/init-param/param-value，push进digester的parameters，作为addInitParameter的第二个参数
        digester.addCallParam(fullPrefix + "/filter/init-param/param-value",
                              1);
//解析到xx/filter-mapping，创建对象org.apache.tomcat.util.descriptor.web.FilterMap
        digester.addObjectCreate(fullPrefix + "/filter-mapping",
                       "org.apache.tomcat.util.descriptor.web.FilterMap");
//解析到xx/ filter-mapping，调用WebXml的addFilterMapping，传入之前创建的对象FilterMap
        digester.addSetNext(fullPrefix + "/filter-mapping",
                                 "addFilterMapping",
               "org.apache.tomcat.util.descriptor.web.FilterMap");
//解析到xx/filter-mapping/filter-name，调用FilterMap的setFilterName，传入这个标签的body text
        digester.addCallMethod(fullPrefix + "/filter-mapping/filter-name",
                               "setFilterName", 0);
//解析到xx/filter-mapping/ servlet-name，调用FilterMap的addServletName，传入这个标签的body text
        digester.addCallMethod(fullPrefix + "/filter-mapping/servlet-name",
                               "addServletName", 0);
//解析到xx/filter-mapping/ url-pattern，调用FilterMap的addURLPattern，传入这个标签的body text
        digester.addCallMethod(fullPrefix + "/filter-mapping/url-pattern",
                               "addURLPattern", 0);
//解析到xx/filter-mapping/ dispatcher，调用FilterMap的setDispatcher，传入这个标签的body text
        digester.addCallMethod(fullPrefix + "/filter-mapping/dispatcher",
                               "setDispatcher", 0);
//解析到xx/listener/listener-class，调用WebXml的addListener方法，传入标签的body text
         digester.addCallMethod(fullPrefix + "/listener/listener-class",
                                "addListener", 0);
//解析到xx/ jsp-config，SetJspConfig rule判断是否是只配置一个jsp-config
        digester.addRule(fullPrefix + "/jsp-config",
                         jspConfig);
//解析到xx/ jsp-config/jsp-property-group，创建对象org.apache.tomcat.util.descriptor.web.JspPropertyGroup
        digester.addObjectCreate(fullPrefix + "/jsp-config/jsp-property-group",
                  "org.apache.tomcat.util.descriptor.web.JspPropertyGroup");
//解析到xx/jsp-config/jsp-property-group，调用WebXml的addJspPropertyGroup，传入之前创建的对象JspPropertyGroup
        digester.addSetNext(fullPrefix + "/jsp-config/jsp-property-group",
                            "addJspPropertyGroup",
                  "org.apache.tomcat.util.descriptor.web.JspPropertyGroup");
//解析到xx/jsp-config/ jsp-property-group/deferred-syntax-allowed-as-literal，调用JspPropertyGroup的setDeferredSyntax方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/deferred-syntax-allowed-as-literal",
                               "setDeferredSyntax", 0);
//解析到xx/jsp-config/ jsp-property-group/ el-ignored，调用JspPropertyGroup的setElIgnored方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/el-ignored",
                               "setElIgnored", 0);
//解析到xx/jsp-config/ jsp-property-group/include-coda，调用JspPropertyGroup的addIncludeCoda方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/include-coda",
                               "addIncludeCoda", 0);
//解析到xx/jsp-config/ jsp-property-group/include- prelude，调用JspPropertyGroup的addIncludePrelude方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/include-prelude",
                               "addIncludePrelude", 0);
//解析到xx/jsp-config/ jsp-property-group/is-xml，调用JspPropertyGroup的setIsXml方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/is-xml",
                               "setIsXml", 0);
//解析到xx/jsp-config/ jsp-property-group/page-encoding，调用JspPropertyGroup的setPageEncoding方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/page-encoding",
                               "setPageEncoding", 0);
//解析到xx/jsp-config/ jsp-property-group/scripting-invalid，调用JspPropertyGroup的setScriptingInvalid方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/scripting-invalid",
                               "setScriptingInvalid", 0);
//解析到xx/jsp-config/ jsp-property-group/ trim-directive-whitespaces，调用JspPropertyGroup的setTrimWhitespace方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/trim-directive-whitespaces",
                               "setTrimWhitespace", 0);
//解析到xx/jsp-config/ jsp-property-group/url-pattern，调用JspPropertyGroup的addUrlPattern方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/url-pattern",
                               "addUrlPattern", 0);
//解析到xx/jsp-config/ jsp-property-group/ default-content-type，调用JspPropertyGroup的setDefaultContentType方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/default-content-type",
                               "setDefaultContentType", 0);
//解析到xx/jsp-config/ jsp-property-group/ buffer，调用JspPropertyGroup的setBuffer方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/buffer",
                               "setBuffer", 0);
//解析到xx/jsp-config/ jsp-property-group/ error-on-undeclared-namespace，调用JspPropertyGroup的setErrorOnUndeclaredNamespace方法，传入body text
        digester.addCallMethod(fullPrefix + "/jsp-config/jsp-property-group/error-on-undeclared-namespace",
                               "setErrorOnUndeclaredNamespace", 0);
//解析到xx/ login-config，SetLoginConfig rule 判断是否只有个login-config配置
        digester.addRule(fullPrefix + "/login-config",
                         loginConfig);
//解析到xx/ login-config，创建对象org.apache.tomcat.util.descriptor.web.LoginConfig
        digester.addObjectCreate(fullPrefix + "/login-config",
                          "org.apache.tomcat.util.descriptor.web.LoginConfig");
//解析到xx/ login-config，调用WebXml的setLoginConfig方法，传入之前创建的对象LoginConfig
        digester.addSetNext(fullPrefix + "/login-config",
                            "setLoginConfig",
                        "org.apache.tomcat.util.descriptor.web.LoginConfig");
//解析到xx/ login-config/ auth-method，调用对象LoginConfig的setAuthMethod，传入标签的body text
        digester.addCallMethod(fullPrefix + "/login-config/auth-method",
                               "setAuthMethod", 0);
//解析到xx/ login-config/ realm-name，调用对象LoginConfig的setRealmName，传入标签的body text
        digester.addCallMethod(fullPrefix + "/login-config/realm-name",
                               "setRealmName", 0);
//解析到xx/ login-config/ form-login-config/form-error-page，调用对象LoginConfig的setErrorPage，传入标签的body text
        digester.addCallMethod(fullPrefix + "/login-config/form-login-config/form-error-page",
                               "setErrorPage", 0);
//解析到xx/ login-config/ form-login-config/ form-login-page，调用对象LoginConfig的setLoginPage，传入标签的body text
        digester.addCallMethod(fullPrefix + "/login-config/form-login-config/form-login-page",
                               "setLoginPage", 0);
//解析到xx/ mime-mapping結束标签，调用WebXml的addMimeMapping，传入参数digester的parameters
        digester.addCallMethod(fullPrefix + "/mime-mapping",
                               "addMimeMapping", 2);
//解析到xx/ mime-mapping/ extension，push进digester的paramters（body text），作为第一个参数
        digester.addCallParam(fullPrefix + "/mime-mapping/extension", 0);
//解析到xx/ mime-mapping/ mime-type，push进digester的paramters（body text），作为第二个参数
        digester.addCallParam(fullPrefix + "/mime-mapping/mime-type", 1);
//解析到xx/ security-constraint，创建对象org.apache.tomcat.util.descriptor.web.SecurityConstraint
        digester.addObjectCreate(fullPrefix + "/security-constraint",
                 "org.apache.tomcat.util.descriptor.web.SecurityConstraint");
//解析到xx/ security-constraint，调用WebXml的addSecurityConstraint，传入对象SecurityConstraint
        digester.addSetNext(fullPrefix + "/security-constraint",
                            "addSecurityConstraint",
                     "org.apache.tomcat.util.descriptor.web.SecurityConstraint");
//解析到xx/ security-constraint/auth-constraint，SetAuthConstraintRule rule 调用SecurityConstraint的setAuthConstraint方法，设置true
        digester.addRule(fullPrefix + "/security-constraint/auth-constraint",
                         new SetAuthConstraintRule());
//解析到xx/ security-constraint/ auth-constraint/role-name，调用SecurityConstraint的addAuthRole方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-constraint/auth-constraint/role-name",
                               "addAuthRole", 0);
//解析到xx/ security-constraint/ display-name，调用SecurityConstraint的setDisplayName方法，传入标签的body text
   digester.addCallMethod(fullPrefix + "/security-constraint/display-name",
                               "setDisplayName", 0);
//解析到xx/ security-constraint/ user-data-constraint/transport-guarantee，调用SecurityConstraint的setUserConstraint方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-constraint/user-data-constraint/transport-guarantee",
                               "setUserConstraint", 0);
//解析到xx/ security-constraint/ web-resource-collection，创建对象org.apache.tomcat.util.descriptor.web.SecurityCollection
        digester.addObjectCreate(fullPrefix + "/security-constraint/web-resource-collection",
                "org.apache.tomcat.util.descriptor.web.SecurityCollection");
//解析到xx/ security-constraint/ web-resource-collection，调用SecurityConstraint的addCollection，传入之前创建的对象SecurityCollection
        digester.addSetNext(fullPrefix + "/security-constraint/web-resource-collection",
                            "addCollection",
                "org.apache.tomcat.util.descriptor.web.SecurityCollection");
//解析到xx/ security-constraint/ web-resource-collection/http-method，调用SecurityCollection的addMethod，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-constraint/web-resource-collection/http-method",
                               "addMethod", 0);
//解析到xx/ security-constraint/ web-resource-collection/ http-method-omission，调用SecurityCollection的addOmittedMethod，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-constraint/web-resource-collection/http-method-omission",
                               "addOmittedMethod", 0);
//解析到xx/ security-constraint/ web-resource-collection/url-pattern，调用SecurityCollection的addPattern，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-constraint/web-resource-collection/url-pattern",
                               "addPattern", 0);
//解析到xx/ security-constraint/ web-resource-collection/ web-resource-name，调用SecurityCollection的setName，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-constraint/web-resource-collection/web-resource-name",
                               "setName", 0);
//解析到xx/security-role/role-name，调用WebXml的addSecurityRole，传入标签的body text
        digester.addCallMethod(fullPrefix + "/security-role/role-name",
                               "addSecurityRole", 0);
//解析到xx/servlet，ServletDefCreateRule rule push进Digester对象org.apache.tomcat.util.descriptor.web. ServletDef
        digester.addRule(fullPrefix + "/servlet",
                         new ServletDefCreateRule());
//解析到xx/servlet,调用WebXml的addServlet，传入之前创建的对象ServletDef
        digester.addSetNext(fullPrefix + "/servlet",
                            "addServlet",
                      "org.apache.tomcat.util.descriptor.web.ServletDef");
//解析到xx/servlet/init-param结束标签，调用ServletDef的addInitParameter，参数是之前push进digester的parameters
        digester.addCallMethod(fullPrefix + "/servlet/init-param",
                               "addInitParameter", 2);
//解析到xx/servlet/init-param/param-name，push进digester的parameters，作为第一个参数
        digester.addCallParam(fullPrefix + "/servlet/init-param/param-name",
                              0);
//解析到xx/servlet/init-param/param-name，push进digester的parameters，作为第二个参数
        digester.addCallParam(fullPrefix + "/servlet/init-param/param-value",
                              1);
//解析到xx/servlet/ jsp-file标签，调用ServletDef的setJspFile，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/jsp-file",
                               "setJspFile", 0);
//解析到xx/servlet/ load-on-startup标签，调用ServletDef的setLoadOnStartup，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/load-on-startup",
                               "setLoadOnStartup", 0);
//解析到xx/servlet/ run-as/role-name标签，调用ServletDef的setRunAs，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/run-as/role-name",
                               "setRunAs", 0);
//解析到xx/servlet/ security-role-ref，创建对象org.apache.tomcat.util.descriptor.web.SecurityRoleRef
        digester.addObjectCreate(fullPrefix + "/servlet/security-role-ref",
                     "org.apache.tomcat.util.descriptor.web.SecurityRoleRef");
//解析到xx/servlet/ security-role-ref，调用ServletDef的addSecurityRoleRef，传入对象SecurityRoleRef
        digester.addSetNext(fullPrefix + "/servlet/security-role-ref",
                            "addSecurityRoleRef",
                       "org.apache.tomcat.util.descriptor.web.SecurityRoleRef");
//解析到xx/servlet/ security-role-ref/role-link，调用SecurityRoleRef的setLink，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/security-role-ref/role-link",
                               "setLink", 0);
//解析到xx/servlet/ security-role-ref/ role-name，调用SecurityRoleRef的setName，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/security-role-ref/role-name",
                               "setName", 0);
//解析到xx/servlet/servlet-class，调用ServletDef的setServletClass，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/servlet-class",
                              "setServletClass", 0);
//解析到xx/servlet/ servlet-name，调用ServletDef的setServletName，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/servlet-name",
                              "setServletName", 0);
//解析到xx/servlet/ multipart-config，创建org.apache.tomcat.util.descriptor.web.MultipartDef对象
        digester.addObjectCreate(fullPrefix + "/servlet/multipart-config",
                       "org.apache.tomcat.util.descriptor.web.MultipartDef");
//解析到xx/servlet/ multipart-config，调用ServletDef的setMultipartDef，传入之前创建的对象MultipartDef
        digester.addSetNext(fullPrefix + "/servlet/multipart-config",
                            "setMultipartDef",
                         "org.apache.tomcat.util.descriptor.web.MultipartDef");
//解析到xx/servlet/ multipart-config/location，调用MultipartDef的setLocation方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/multipart-config/location",
                               "setLocation", 0);
//解析到xx/servlet/ multipart-config/ max-file-size，调用MultipartDef的setMaxFileSize方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/multipart-config/max-file-size",
                               "setMaxFileSize", 0);
//解析到xx/servlet/ multipart-config/ max-request-size，调用MultipartDef的setMaxRequestSize方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/multipart-config/max-request-size",
                               "setMaxRequestSize", 0);
//解析到xx/servlet/ multipart-config/ file-size-threshold，调用MultipartDef的setFileSizeThreshold方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/multipart-config/file-size-threshold",
                               "setFileSizeThreshold", 0);
//解析到xx/servlet/async-supported，调用ServletDef的setAsyncSupported方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/async-supported",
                               "setAsyncSupported", 0);
//解析到xx/ servlet/enabled，调用ServletDef的setEnabled方法，传入标签的body text
        digester.addCallMethod(fullPrefix + "/servlet/enabled",
                               "setEnabled", 0);
//解析到xx/servlet-mapping结束标签，调用WebXml的方法addServletMapping，传入之前push 进digester的parameters，CallMethodMultiRule的第三个参数0是parameters里的param index，这个param是ArrayList
        digester.addRule(fullPrefix + "/servlet-mapping",
                               new CallMethodMultiRule("addServletMapping", 2, 0));
//解析到xx/servlet-mapping/servlet-name，push进digester的parameters，参数是servlet-name标签的body text
        digester.addCallParam(fullPrefix + "/servlet-mapping/servlet-name", 1);
//解析到xx/ servlet-mapping/url-pattern，push进digester的parameters，push进的param是ArrayList，参数0是push进parameters的参数的index
        digester.addRule(fullPrefix + "/servlet-mapping/url-pattern", new CallParamMultiRule(0));
//解析到xx/session-config，SetSessionConfig rule，判断是否只有1次配置，只能配置一个
        digester.addRule(fullPrefix + "/session-config ", sessionConfig);
//解析到xx/session-config，创建对象org.apache.tomcat.util.descriptor.web.SessionConfig
        digester.addObjectCreate(fullPrefix + "/session-config",
                        "org.apache.tomcat.util.descriptor.web.SessionConfig");
//解析到xx/session-config，调用WebXml的setSessionConfig，传入参数SessionConfig
        digester.addSetNext(fullPrefix + "/session-config", "setSessionConfig",
                        "org.apache.tomcat.util.descriptor.web.SessionConfig");
//解析到xx/session-config/ session-timeout，调用SessionConfig的setSessionTimeout，参数是标签的body text
        digester.addCallMethod(fullPrefix + "/session-config/session-timeout",
                               "setSessionTimeout", 0);
//解析到xx/ session-config/cookie-config/name，调用SessionConfig的setCookieName，参数是标签的body text
        digester.addCallMethod(fullPrefix + "/session-config/cookie-config/name",
                               "setCookieName", 0);
//解析到xx/ session-config/cookie-config/ domain，调用SessionConfig的setCookieDomain，参数是标签的body text
        digester.addCallMethod(fullPrefix + "/session-config/cookie-config/domain", "setCookieDomain", 0);
//解析到xx/ session-config/cookie-config/ path，调用SessionConfig的setCookiePath，参数是标签的body text
        digester.addCallMethod(fullPrefix + "/session-config/cookie-config/path",
                               "setCookiePath", 0);
  //解析到xx/ session-config/cookie-config/ comment，调用SessionConfig的setCookieComment，参数是标签的body text      
digester.addCallMethod(fullPrefix + "/session-config/cookie-config/comment",
                               "setCookieComment", 0);
//解析到xx/ session-config/cookie-config/ http-only，调用SessionConfig的setCookieHttpOnly，参数是标签的body text      
        digester.addCallMethod(fullPrefix + "/session-config/cookie-config/http-only",
                               "setCookieHttpOnly", 0);
//解析到xx/ session-config/cookie-config/ secure，调用SessionConfig的setCookieSecure，参数是标签的body text   
        digester.addCallMethod(fullPrefix + "/session-config/cookie-config/secure",
                               "setCookieSecure", 0);
//解析到xx/ session-config/cookie-config/ max-age，调用SessionConfig的setCookieMaxAge，参数是标签的body text   
        digester.addCallMethod(fullPrefix + "/session-config/cookie-config/max-age",
                               "setCookieMaxAge", 0);
//解析到xx/ session-config/cookie-config/ tracking-mode，调用SessionConfig的addSessionTrackingMode，参数是标签的body text   
        digester.addCallMethod(fullPrefix + "/session-config/tracking-mode",
                               "addSessionTrackingMode", 0);
        // Taglibs pre Servlet 2.4
//解析到xx/taglib，TaglibLocationRule rule参数false表示是pre  Servlet 2.4， 2.4之前version的，WebXml必须有publicID
        digester.addRule(fullPrefix + "/taglib", new TaglibLocationRule(false));
//解析到xx/taglib结束标签，调用WebXml的addTaglib方法，传入参数是之前push进的parameters
        digester.addCallMethod(fullPrefix + "/taglib",
                               "addTaglib", 2);
//解析到xx/taglib/taglib-location，push进digester的parameters，参数是标签的body text，参数index是1
        digester.addCallParam(fullPrefix + "/taglib/taglib-location", 1);
//解析到xx/taglib/ taglib-uri，push进digester的parameters，参数是标签的body text，参数index是0
        digester.addCallParam(fullPrefix + "/taglib/taglib-uri", 0);
        // Taglibs Servlet 2.4 onwards
//解析到xx/jsp-config/taglib，TaglibLocationRule rule参数true，表示是2.4或者later的version，WebXml不能用public
        digester.addRule(fullPrefix + "/jsp-config/taglib", new TaglibLocationRule(true));
//解析到xx//jsp-config/taglib结束标签，调用WebXml的addTaglib方法，传入之前push进digester的参数
        digester.addCallMethod(fullPrefix + "/jsp-config/taglib",
                "addTaglib", 2);
//解析到xx/jsp-config/taglib/taglib-location，push进digester的parameters，作为第二个参数（标签的body text）
        digester.addCallParam(fullPrefix + "/jsp-config/taglib/taglib-location", 1);
//解析到xx/jsp-config/taglib/ taglib-uri，push进digester的parameters，作为第一个参数（标签的body text）
        digester.addCallParam(fullPrefix + "/jsp-config/taglib/taglib-uri", 0);
//解析到xx/ welcome-file-list/welcome-file的時候，调用WebXml的addWelcomeFile方法，参数是标签的body text
        digester.addCallMethod(fullPrefix + "/welcome-file-list/welcome-file",
                               "addWelcomeFile", 0);
//解析到xx/locale-encoding-mapping-list/locale-encoding-mapping结束标签，调用WebXml的addLocaleEncodingMapping，传入之前push进digester的paramters
        digester.addCallMethod(fullPrefix + "/locale-encoding-mapping-list/locale-encoding-mapping",
                              "addLocaleEncodingMapping", 2);
//解析到xx/locale-encoding-mapping-list/locale-encoding-mapping/locale，push进digester的parameters，作为第一个参数(body text)
        digester.addCallParam(fullPrefix + "/locale-encoding-mapping-list/locale-encoding-mapping/locale", 0);
//解析到xx/locale-encoding-mapping-list/ locale-encoding-mapping/encoding，push进digester的parameters，作为第二个参数(body text)
        digester.addCallParam(fullPrefix + "/locale-encoding-mapping-list/locale-encoding-mapping/encoding", 1);
//解析到xx/post-construct结束标签，LifecycleCallbackRule rule 不能有重复的class，调用WebXml的addPostConstructMethods，传入之前push进digester的parameters
        digester.addRule(fullPrefix + "/post-construct",
                new LifecycleCallbackRule("addPostConstructMethods", 2, true));
//解析到xx/ post-construct/lifecycle-callback-class，push进digester的paramters，做为第一个参数(body text)
        digester.addCallParam(fullPrefix + "/post-construct/lifecycle-callback-class", 0);
//解析到xx/post-construct/ lifecycle-callback-method，push进digester的paramters，做为第二个参数(body text)
        digester.addCallParam(fullPrefix + "/post-construct/lifecycle-callback-method", 1);
//解析到xx/pre-destroy结束标签，LifecycleCallbackRule rule 不能有重复的class，调用WebXml的addPreDestroyMethods，传入之前push进digester的parameters
        digester.addRule(fullPrefix + "/pre-destroy",
                new LifecycleCallbackRule("addPreDestroyMethods", 2, false));
//解析到xx/pre-destroy/lifecycle-callback-class，push进digester的paramters，做为第一个参数(body text)
        digester.addCallParam(fullPrefix + "/pre-destroy/lifecycle-callback-class", 0);
//解析到xx/pre-destroy/ lifecycle-callback-method，push进digester的paramters，做为第二个参数(body text)
        digester.addCallParam(fullPrefix + "/pre-destroy/lifecycle-callback-method", 1);
}
```

**2、****分析解析****WebXmlFragment****：**；

**代码片段**

**Set defaults = new HashSet<>();**

**defaults.add(getDefaultWebXmlFragment(webXmlParser));**

**这段代码执行完后，****defaults****里面有****DefaultWebXml****（****conf/web.xml or host****的****web.xml.default****）**

**方法****getDefaultWebXmlFragment(WebXmlParser webXmlParser)****：**

```java
private WebXml getDefaultWebXmlFragment(WebXmlParser webXmlParser) {
//获得container，默认应该是StandardHost
        Host host = (Host) context.getParent();
//通过host来获得cache到的DefaultWebXml实例对象
        DefaultWebXmlCacheEntry entry = hostWebXmlCache.get(host);
//获得CatalianBase/config/Web.xml的InputSource
        InputSource globalWebXml = getGlobalWebXmlSource();
//获得CatalianBase/config/engine/hostname/web.xml.default的InputSource
        InputSource hostWebXml = getHostWebXmlSource();
        long globalTimeStamp = 0;
        long hostTimeStamp = 0;
//设置global和host的webxml文件LastModified
        if (globalWebXml != null) {
            URLConnection uc = null;
            try {
                URL url = new URL(globalWebXml.getSystemId());
                uc = url.openConnection();
                globalTimeStamp = uc.getLastModified();
            } catch (IOException e) {
                globalTimeStamp = -1;
            } finally {
                if (uc != null) {
                    try {
                        uc.getInputStream().close();
                    } catch (IOException e) {
                        ExceptionUtils.handleThrowable(e);
                        globalTimeStamp = -1;
                    }
                }
            }
        }
        if (hostWebXml != null) {
            URLConnection uc = null;
            try {
                URL url = new URL(hostWebXml.getSystemId());
                uc = url.openConnection();
                hostTimeStamp = uc.getLastModified();
            } catch (IOException e) {
                hostTimeStamp = -1;
            } finally {
                if (uc != null) {
                    try {
                        uc.getInputStream().close();
                    } catch (IOException e) {
                        ExceptionUtils.handleThrowable(e);
                        hostTimeStamp = -1;
                    }
                }
            }
        }
//获取缓存的DefaultWebXml
        if (entry != null && entry.getGlobalTimeStamp() == globalTimeStamp &&
                entry.getHostTimeStamp() == hostTimeStamp) {
            InputSourceUtil.close(globalWebXml);
            InputSourceUtil.close(hostWebXml);
            return entry.getWebXml();
        }
        synchronized (host.getPipeline()) {
            entry = hostWebXmlCache.get(host);
            if (entry != null && entry.getGlobalTimeStamp() == globalTimeStamp &&
                    entry.getHostTimeStamp() == hostTimeStamp) {
                return entry.getWebXml();
            }
//创建WebXml
            WebXml webXmlDefaultFragment = createWebXml();
//设置为true，表示每个app的xml可以覆盖defaultwebxml相同的项
            webXmlDefaultFragment.setOverridable(true);
//设置Distributable为true，否则每个app就不会合并defaultwebxml
            webXmlDefaultFragment.setDistributable(true);
//设置false，当merge defaultwebxml的时候，app未定义welcomefile文件时，才会合并默认的welcomefiles
            webXmlDefaultFragment.setAlwaysAddWelcomeFiles(false);
            if (globalWebXml == null) {
                log.info(sm.getString("contextConfig.defaultMissing"));
            } else {
//用1分析的WebRuleSet rule，将globalWebXml 作为source，digester解析得到处理后的webXmlDefaultFragment（WebXml对象）
                if (!webXmlParser.parseWebXml(
                        globalWebXml, webXmlDefaultFragment, false)) {
                    ok = false;
                }
            }
//替换当前的welcomefiles，当merge webxml到webXmlDefaultFragment时
            webXmlDefaultFragment.setReplaceWelcomeFiles(true);
//将hostWebXml作为source，digester解析得到处理后的webXmlDefaultFragment
            if (!webXmlParser.parseWebXml(
                    hostWebXml, webXmlDefaultFragment, false)) {
                ok = false;
            }
            if (globalTimeStamp != -1 && hostTimeStamp != -1) {
//设置Cache
                entry = new DefaultWebXmlCacheEntry(webXmlDefaultFragment,
                        globalTimeStamp, hostTimeStamp);
                hostWebXmlCache.put(host, entry);
            }
            return webXmlDefaultFragment;
        }
}
```

**3、****分析解析****ContextWebXml**；

代码片段：

// 实例化一个全新的 WebXml ，不同于上面的 defaultwebxml

WebXml webXml = createWebXml();

// 获得 context webxml 的 inputsource 准备用 digester 来解析得到 webxml

InputSource contextWebXml = getContextWebXmlSource();

//digester 解析获得前面创建的 WebXml

if (!webXmlParser.parseWebXml(contextWebXml, webXml, false)) {

ok = false;

}

**getContextWebXmlSource()****方法：**

```java
    protected InputSource getContextWebXmlSource() {
        InputStream stream = null;
        InputSource source = null;
        URL url = null;
        String altDDName = null;
            // ServletContext会单独分析，现在只要知道它是一个app的上下文环境
        ServletContext servletContext = context.getServletContext();
        try {
            if (servletContext != null) {
                altDDName = (String)servletContext.getAttribute(Globals.ALT_DD_ATTR);
                if (altDDName != null) {
// 有org.apache.catalina.deploy.alt_dd对应的value作为source
                    try {
                        stream = new FileInputStream(altDDName);
                        url = new File(altDDName).toURI().toURL();
                    } catch (FileNotFoundException e) {
                        log.error(sm.getString("contextConfig.altDDNotFound",
                                               altDDName));
                    } catch (MalformedURLException e) {
                        log.error(sm.getString("contextConfig.applicationUrl"));
                    }
                }
                else {
//没有org.apache.catalina.deploy.alt_dd对应的value，则使用……/WEB-INF/web.xml作为source
 stream = servletContext.getResourceAsStream
                        (Constants.ApplicationWebXml);
                    try {
                        url = servletContext.getResource(
                                Constants.ApplicationWebXml);
                    } catch (MalformedURLException e) {
                        log.error(sm.getString("contextConfig.applicationUrl"));
                    }
                }
            }
            if (stream == null || url == null) {
                if (log.isDebugEnabled()) {
                    log.debug(sm.getString("contextConfig.applicationMissing") + " " + context);
                }
            } else {
                source = new InputSource(url.toExternalForm());
                source.setByteStream(stream);
            }
        }
………………….
        return source;
}
```

**4、****分析****step1**；

**代码片段：**

**Map fragments = processJarsForWebFragments(webXml, webXmlParser);**

```java
processJarsForWebFragments方法：
protected Map<String,WebXml> processJarsForWebFragments(WebXml application, WebXmlParser webXmlParser) {
//获得JarScanner默认是StandardJarScanner
        JarScanner jarScanner = context.getJarScanner();
        boolean delegate = false;
        if (context instanceof StandardContext) {
            delegate = ((StandardContext) context).getDelegate();
        }
        boolean parseRequired = true;
        Set<String> absoluteOrder = application.getAbsoluteOrdering();
        if (absoluteOrder != null && absoluteOrder.isEmpty() &&
                !context.getXmlValidation()) {
            parseRequired = false;
        }
//StandardJarScanner扫描开始
        FragmentJarScannerCallback callback =
                new FragmentJarScannerCallback(webXmlParser, delegate, parseRequired);
        jarScanner.scan(JarScanType.PLUGGABILITY,
                context.getServletContext(), callback);
        if (!callback.isOk()) {
            ok = false;
        }
        return callback.getFragments();
}
```

**StandardJarScanner****类****scan****方法：**

a. 扫描 app 的 WEB-INF/lib 下的 jar 包，解析 jar 包里面的 META-INF/web-fragment.xml ， FragmentJarScannerCallback scan 解析 fragments.put(fragment.getName(),fragment)

b. 扫描 app 的 /WEB-INF/classes 下的 META-INF ，如果不为空，调用 callback 的 scanWebInfClasses

c. 扫描 context 的 classloader 以及 classloader 继承链上的 classloader 的 searchpath 上的 jar 包，解析 jar 包里面的 META-INF/web-　　fragment.xml ， FragmentJarScannerCallback scan 解析 fragments.put(fragment.getName(),fragment)

**5.分析step2**

代码片段：

Set orderedFragments = null;

orderedFragments =

WebXml.orderWebFragments(webXml, fragments, sContext);

对 WebXml 进行排序

**6.分析step3**

代码片段：

if (ok) {

processServletContainerInitializers();

}

processServletContainerInitializers 方法：

```java
protected void processServletContainerInitializers() {
        List<ServletContainerInitializer> detectedScis;
        try {
//app的classloader加载xxx/META-INF/services/ ServletContainerInitializer资源，读取资源里面的ServletContainerInitializer配置，以#分割，然后classloader反射实例化ServletContainerInitializer(detectedScis)
// WebappServiceLoader类load方法
            WebappServiceLoader<ServletContainerInitializer> loader = new WebappServiceLoader<>(context);
            detectedScis = loader.load(ServletContainerInitializer.class);
        } catch (IOException e) {
            log.error(sm.getString(
                    "contextConfig.servletContainerInitializerFail",
                    context.getName()),
                e);
            ok = false;
            return;
        }
        for (ServletContainerInitializer sci : detectedScis) {
//填充initializerClassMap
            initializerClassMap.put(sci, new HashSet<Class<?>>());
            HandlesTypes ht;
            try {
//获得sci的HandlesTypes annotation
                ht = sci.getClass().getAnnotation(HandlesTypes.class);
            } catch (Exception e) {
                if (log.isDebugEnabled()) {
                    log.info(sm.getString("contextConfig.sci.debug",
                            sci.getClass().getName()),
                            e);
                } else {
                    log.info(sm.getString("contextConfig.sci.info",
                            sci.getClass().getName()));
                }
                continue;
            }
            if (ht == null) {
                continue;
            }
// HandlesTypes annotation配置的class[]
            Class<?>[] types = ht.value();
            if (types == null) {
                continue;
            }
//填充typeInitializerMap，key是class[]里面配置的type,value是ServletContainerInitializer对象
            for (Class<?> type : types) {
                if (type.isAnnotation()) {
                    handlesTypesAnnotations = true;
                } else {
                    handlesTypesNonAnnotations = true;
                }
                Set<ServletContainerInitializer> scis =
                        typeInitializerMap.get(type);
                if (scis == null) {
                    scis = new HashSet<>();
                    typeInitializerMap.put(type, scis);
                }
                scis.add(sci);
            }
        }
}
```

**WebappServiceLoader****类****load****方法**

```java
public List<T> load(Class<T> serviceType) throws IOException {
        String configFile = SERVICES + serviceType.getName();
        LinkedHashSet<String> applicationServicesFound = new LinkedHashSet<>();
        LinkedHashSet<String> containerServicesFound = new LinkedHashSet<>();
        ClassLoader loader = servletContext.getClassLoader();
        @SuppressWarnings("unchecked")
        List<String> orderedLibs =
                (List<String>) servletContext.getAttribute(ServletContext.ORDERED_LIBS);
        if (orderedLibs != null) {
//如果配置了javax.servlet.context.orderedLibs key的value，迭代实例化applicationServicesFound，source是/WEB-INF/lib下的jar包里面的META-INF/services/ ServletContainerInitializer
            for (String lib : orderedLibs) {
                URL jarUrl = servletContext.getResource(LIB + lib);
                if (jarUrl == null) {
                    // should not happen, just ignore
                    continue;
                }
                String base = jarUrl.toExternalForm();
                URL url;
                if (base.endsWith("/")) {
                    url = new URL(base + configFile);
                } else {
                    url = JarFactory.getJarEntryURL(jarUrl, configFile);
                }
                try {
                    parseConfigFile(applicationServicesFound, url);
                } catch (FileNotFoundException e) {
                    // no provider file found, this is OK
                }
            }
            loader = context.getParentClassLoader();
        }
//实例化containerServicesFound，source是META-INF/services/ ServletContainerInitializer
        Enumeration<URL> resources;
        if (loader == null) {
            resources = ClassLoader.getSystemResources(configFile);
        } else {
            resources = loader.getResources(configFile);
        }
        while (resources.hasMoreElements()) {
            parseConfigFile(containerServicesFound, resources.nextElement());
        }
//filter
        if (containerSciFilterPattern != null) {
            Iterator<String> iter = containerServicesFound.iterator();
            while (iter.hasNext()) {
                if (containerSciFilterPattern.matcher(iter.next()).find()) {
                    iter.remove();
                }
            }
        }
        containerServicesFound.addAll(applicationServicesFound);
        if (containerServicesFound.isEmpty()) {
            return Collections.emptyList();
        }
//通过containerServicesFound读取到的ServletContainerInitializer配置信息，来实例化ServletContainerInitializer
        return loadServices(serviceType, containerServicesFound);
    }
```

**7、****分析****step4**；

**代码片段：**

```java
if (!webXml.isMetadataComplete() || typeInitializerMap.size() > 0) {
//webXml 的 metadataComplete flase 或者配置了 ServletContainerInitializer 相关的信息
Map<String,JavaClassCacheEntry> javaClassCache = new HashMap<>();
if (ok) {
WebResource[] webResources =
context.getResources().listResources("/WEB-INF/classes");
for (WebResource webResource : webResources) {
// 循环迭代处理 /WEB-INF/classes 下的资源
if ("META-INF".equals(webResource.getName())) {
// 不处理 META-INF
continue;
}
processAnnotationsWebResource(webResource, webXml,
webXml.isMetadataComplete(), javaClassCache);
}
}
```

**processAnnotationsWebResource****方法：**

```java
protected void processAnnotationsWebResource(WebResource webResource,
            WebXml fragment, boolean handlesTypesOnly,
            Map<String,JavaClassCacheEntry> javaClassCache) {
        if (webResource.isDirectory()) {
//如果webResource是目录，将递归调用processAnnotationsWebResource
            WebResource[] webResources =
              webResource.getWebResourceRoot().listResources(
                            webResource.getWebappPath());
           ………………..
                for (WebResource r : webResources) {
                    processAnnotationsWebResource(r, fragment, handlesTypesOnly, javaClassCache);
                }
            }
        } else if (webResource.isFile() &&
                webResource.getName().endsWith(".class")) {
//如果是file并且是class文件，调用processAnnotationsStream
            try (InputStream is = webResource.getInputStream()) {
                processAnnotationsStream(is, fragment, handlesTypesOnly, javaClassCache);
            } catch (IOException e) {
                log.error(sm.getString("contextConfig.inputStreamWebResource",
                        webResource.getWebappPath()),e);
            } catch (ClassFormatException e) {
                log.error(sm.getString("contextConfig.inputStreamWebResource",
                        webResource.getWebappPath()),e);
            }
        }
    }
看processAnnotationsStream源码片段
protected void processAnnotationsStream(InputStream is, WebXml fragment,
            boolean handlesTypesOnly, Map<String,JavaClassCacheEntry> javaClassCache)
            throws ClassFormatException, IOException {
…………..
            String className = clazz.getClassName();
            for (AnnotationEntry ae : annotationsEntries) {
   String type = ae.getAnnotationType();
if ("Ljavax/servlet/annotation/WebServlet;".equals(type)) {
                    processAnnotationWebServlet(className, ae, fragment);
}else if ("Ljavax/servlet/annotation/WebFilter;".equals(type)) {
     processAnnotationWebFilter(className, ae, fragment);
}else if ("Ljavax/servlet/annotation/WebListener;".equals(type)) {
                    fragment.addListener(className);
     } else {
                    // Unknown annotation - ignore
                }
            }
        }
    }
```

**最后会根据注解不同，调用不同的方法**

WebServlet-------------- à processAnnotationWebServlet

WebFilter---------------- à processAnnotationWebFilter

WebListener------------ à fragment.addListener

processAnnotationWebServlet 方法：

解析 WebServlet 注解相关信息，创建 ServletDef 对象，将相关属性设置进 ServletDef ，最后 add 进 webXml 的 servletDefs 相关代码片段

```java
for (ElementValuePair evp : evps) {
String name = evp.getNameString();
if ("value".equals(name) || "urlPatterns".equals(name)) {
if (urlPatternsSet) {
throw new IllegalArgumentException(sm.getString(
"contextConfig.urlPatternValue", "WebServlet", className));
}
urlPatternsSet = true;
urlPatterns = processAnnotationsStringArray(evp.getValue());
} else if ("description".equals(name)) {
if (servletDef.getDescription() == null) {
servletDef.setDescription(evp.getValue().stringifyValue());
}
} else if ("displayName".equals(name)) {
if (servletDef.getDisplayName() == null) {
servletDef.setDisplayName(evp.getValue().stringifyValue());
}
} else if ("largeIcon".equals(name)) {
if (servletDef.getLargeIcon() == null) {
servletDef.setLargeIcon(evp.getValue().stringifyValue());
}
} else if ("smallIcon".equals(name)) {
if (servletDef.getSmallIcon() == null) {
servletDef.setSmallIcon(evp.getValue().stringifyValue());
}
} else if ("asyncSupported".equals(name)) {
if (servletDef.getAsyncSupported() == null) {
servletDef.setAsyncSupported(evp.getValue()
.stringifyValue());
}
} else if ("loadOnStartup".equals(name)) {
…………….
} else if ("initParams".equals(name)) {
………………
}
}
}
```

最后会根据注解不同，调用不同的方法

WebServlet--------------à processAnnotationWebServlet

WebFilter----------------à processAnnotationWebFilter

WebListener------------à fragment.addListener

processAnnotationWebServlet 方法：

解析WebServlet注解相关信息，创建ServletDef对象，将相关属性设置进ServletDef，最后add进webXml的servletDefs 相关代码片段

```java
for (ElementValuePair evp : evps) {
            String name = evp.getNameString();
            if ("value".equals(name) || "urlPatterns".equals(name)) {
                if (urlPatternsSet) {
                    throw new IllegalArgumentException(sm.getString(
                            "contextConfig.urlPatternValue", "WebServlet", className));
                }
                urlPatternsSet = true;
                urlPatterns = processAnnotationsStringArray(evp.getValue());
            } else if ("description".equals(name)) {
                if (servletDef.getDescription() == null) {
                    servletDef.setDescription(evp.getValue().stringifyValue());
                }
            } else if ("displayName".equals(name)) {
                if (servletDef.getDisplayName() == null) {
                    servletDef.setDisplayName(evp.getValue().stringifyValue());
                }
            } else if ("largeIcon".equals(name)) {
                if (servletDef.getLargeIcon() == null) {
                    servletDef.setLargeIcon(evp.getValue().stringifyValue());
                }
            } else if ("smallIcon".equals(name)) {
                if (servletDef.getSmallIcon() == null) {
                    servletDef.setSmallIcon(evp.getValue().stringifyValue());
                }
            } else if ("asyncSupported".equals(name)) {
                if (servletDef.getAsyncSupported() == null) {
                    servletDef.setAsyncSupported(evp.getValue()
                            .stringifyValue());
                }
            } else if ("loadOnStartup".equals(name)) {
              …………….
            } else if ("initParams".equals(name)) {
                ………………
        }
}
}
```

processAnnotationWebFilter方法：

跟processAnnotationWebServlet方法类似，不过是filterDef

调用fragment.addListener方法：

WebXml的addListener方法

```java
public void addListener(String className) {
    listeners.add(className);
}
```

1. 分析step5

代码片段：

```java
if  (!webXml.isMetadataComplete() || typeInitializerMap.size() > 0) {
//st ep4……
//step5跟step4类似，都是要解析class上的注解，@WebServlet，@WebFilter，@WebListener，不同于step4，step5解析的是step1步骤下解析的webfragment
if (ok) {
processAnnotations(
        orderedFragments, webXml.isMetadataComplete(), javaClassCache);
}
// Cache, if used, is no longer required so clear it
javaClassCache.clear();
}
```

9.分析step6~9

代码片段：

```java
if (!webXml.isMetadataComplete()) {
// Step 6. Merge web-fragment.xml files into the main web.xml
// file.
//将前面分析的主webxml与step1解析得到的webxml merge，具体逻辑可以以后再看
if (ok) {
    ok = webXml.merge(orderedFragments);
}
// Step 7. Apply global defaults
// Have to merge defaults before JSP conversion since defaults
// provide JSP servlet definition
//将前面分析的主webxml与前面分析的defaults webxml，具体逻辑可以以后再看.
webXml.merge(defaults);
// Step 8. Convert explicitly mentioned jsps to servlets
if (ok) {
//主要是设置org.apache.jasper.servlet.JspServlet的ServletDef
    convertJsps(webXml);
}
// Step 9. Apply merged web.xml to Context
if (ok) {
//将webXml存储的某些配置信息传递给当前的StandardContext
    configureContext(webXml);
}
} else {
webXml.merge(defaults);
convertJsps(webXml);
configureContext(webXml);
}
```

10.分析step10

代码片段：

```java
if (ok) {
//解析WEB-INF/classes/META-INF/下的静态资源，以后可以分析，静态分析跟WebResourceRoot和WebResource类有关
// Spec does not define an order.
// Use ordered JARs followed by remaining JARs
Set<WebXml> resourceJars = new LinkedHashSet<>();
for (WebXml fragment : orderedFragments) {
    resourceJars.add(fragment);
}
for (WebXml fragment : fragments.values()) {
    if (!resourceJars.contains(fragment)) {
        resourceJars.add(fragment);
    }
}
processResourceJARs(resourceJars);
// See also StandardContext.resourcesStart() for
// WEB-INF/classes/META-INF/resources configuration
}
```

11.分析step11

代码片段：将webxml的ServletContainerInitializer同步进context，initializerClassMap是在checkHandlesTypes方法填充，xxx/WEB-INF/classes下的资源

```java
if (ok) {
for (Map.Entry<ServletContainerInitializer,
        Set<Class<?>>> entry :
            initializerClassMap.entrySet()) {
    if (entry.getValue().isEmpty()) {
        context.addServletContainerInitializer(
                entry.getKey(), null);
    } else {
        context.addServletContainerInitializer(
                entry.getKey(), entry.getValue());
    }
}
}
```

总结：这个是初步的分析，随着以后整个流程的走通，再去分析最后涉及到的细节，ConfigureStart方法是在beforeStart之后和start之前触发， StandardContext的startInternal方法就可以用到ConfigureStart方法中解析得到的信息，webconfig方法，就如它的名字，读取tomcat的webxml的配置，将defaultweb(config/webxml)或者host默认的webxml合并到当前app的主webxml，读取META-INF和 WEB-INF下的配置，比如ServletContainerInitializer，注解@WebServlet，@WebFilter，@WebListener等信息来填充WebXml（ServletDef，FilterDef etc.），最后将WebXml的信息设置给当前的StandardContext以供后面使用
