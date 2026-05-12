# 定义主题
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/34.html
- 分类：J2EE框架
- 分组：9、主题 themes
要在你的应用中使用主题，你必须实现一个org.springframework.ui.context.ThemeSource接口。WebApplicationContext接口继承了ThemeSource接口，但主要的工作它还是委托给接口具体的实现来完成。默认的实现是org.springframework.ui.context.support.ResourceBundleThemeSource，它会从classpath的根路径下去加载配置文件。如果需要定制ThemeSource的实现，或要配置ResourceBundleThemeSource的基本前缀名（base name prefix），你可以在应用上下文（application context）下注册一个名字为保留名themeSource的bean，web应用的上下文会自动检测名字为themeSource的bean并使用它。

使用的是ResourceBundleThemeSource时，一个主题可以定义在一个简单的配置文件中。该配置文件会列出所有组成了该主题的资源。下面是个例子：

```java
    styleSheet=/themes/cool/style.css 
    background=/themes/cool/img/coolBg.jpg 
```

属性的键（key）是主题元素在视图代码中被引用的名字。对于JSP视图来说，一般通过spring:theme这个定制化的标签（tag）来做，它与spring:message标签很相似。以下的JSP代码即使用了上段代码片段中定义的主题，用以定制整体的皮肤：

```xml
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%> 
<html> 
    <head> 
        <Linkrel="stylesheet" href="<spring:theme code=''styleSheet''/>" type="text/css"/> 
    </head> 
    <body style="background=<spring:theme code=''background''/>"> 
        ... 
    </body> 
</html> 
```

默认情况下ResourceBundleThemeSource使用的基本名前缀（base name prefix）是空值。也即是说，配置文件是从根classpath路径下加载的。因此，你需要把主题的定义文件cool.properties放在classpath的根路径目录下，比如，/WEB-INF/classes。ResourceBundleThemeSource采用了Java的标准资源bundle加载机制，完全支持国际化主题。比如，你可以创建一个/WEB-INF/classes/cool_nl.properties配置文件，并在其中引用一副有荷兰文的背景图片。
