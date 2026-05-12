# 11、Spring Boot 3.x 特性-配置元数据
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/11.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot jar包含元数据文件，提供所有支持的配置属性的详细信息。

这些文件让IDE开发人员在配置`application.properties` 或 `application.yml` 时提供上下文帮助和“`code completion`”。

大部分元数据文件是在编译时通过处理所有带有`@ConfigurationProperties`注解的项自动生成的。然而，可以为极端用例或更高级的用例手工编写部分元数据。

## 一、元数据格式化

配置元数据文件位于`META-INF/spring-configuration-metadata.json`下的`jar`文件中。

它们使用`JSON`格式，项目分类在“`groups`”或“`properties`”下，附加值提示分类在“`hints`”下，如下所示:

```java
{
     "groups": [
    {
        "name": "server",
        "type": "org.springframework.boot.autoconfigure.web.ServerProperties",
        "sourceType": "org.springframework.boot.autoconfigure.web.ServerProperties"
    },
    {
        "name": "spring.jpa.hibernate",
        "type": "org.springframework.boot.autoconfigure.orm.jpa.JpaProperties$Hibernate",
        "sourceType": "org.springframework.boot.autoconfigure.orm.jpa.JpaProperties",
        "sourceMethod": "getHibernate()"
    }
    ...
],"properties": [
    {
        "name": "server.port",
        "type": "java.lang.Integer",
        "sourceType": "org.springframework.boot.autoconfigure.web.ServerProperties"
    },
    {
        "name": "server.address",
        "type": "java.net.InetAddress",
        "sourceType": "org.springframework.boot.autoconfigure.web.ServerProperties"
    },
    {
          "name": "spring.jpa.hibernate.ddl-auto",
          "type": "java.lang.String",
          "description": "DDL mode. This is actually a shortcut for the \"hibernate.hbm2ddl.auto\" property.",
          "sourceType": "org.springframework.boot.autoconfigure.orm.jpa.JpaProperties$Hibernate"
    }
    ...
],"hints": [
    {
        "name": "spring.jpa.hibernate.ddl-auto",
        "values": [
            {
                "value": "none",
                "description": "Disable DDL handling."
            },
            {
                "value": "validate",
                "description": "Validate the schema, make no changes to the database."
            },
            {
                "value": "update",
                "description": "Update the schema if necessary."
            },
            {
                "value": "create",
                "description": "Create the schema and destroy previous data."
            },
            {
                "value": "create-drop",
                "description": "Create and then destroy the schema at the end of the session."
            }
        ]
    }
]}
```

每个“`property`”都是用户用给定值指定的配置项。例如,server.port和 server.address,可以在你的`application.properties/application.yaml`中指定。

```java
server.port=9090
server.address=127.0.0.1
```

“`groups`”是更高级别的项，它们本身不指定值，而是为属性提供上下文分组。例如`server.port 和 server.address`属性归属于 `server`组。并不是要求每个“`property`”都有一个“`groups`”。

最后，“`hints`”是用于帮助用户配置给定属性的附加信息。例如，当开发人员配置`spring.jpa.hibernate.ddl-auto`属性时，工具可以使用这些提示为`none`、`validate`、`update`、`create`和`create-drop`值提供一些自动完成帮助。

## 二、元数据提示

为了改善用户体验并进一步帮助用户配置给定的属性，你可以提供额外的元数据:

**1、** 描述属性的潜在值列表；

**2、** 关联提供者，将定义良好的语义附加到属性，以便工具可以根据项目的上下文发现潜在值的列表；

### Value 提示

每个提示的`name`属性引用一个属性的名称。在前面展示的初始示例中，我们为`spring.jpa.hibernate.ddl-auto`属性提供了5个值:`none`、`validate`、`update`、`create`和`create-drop`。每个值也可以有一个描述。

如果属性的类型是`Map`，则可以为键和值提供提示(但不能为`Map`本身提供提示)。特殊的`.keys`和`.values`后缀必须分别指向键和值。

假设一个my.contexts `Map`,将 `String` 映射成`Integer`,如下例子:

```java
@ConfigurationProperties("my")
public class MyProperties {
    private Map<String, Integer> contexts;
    // getters/setters ...
}
```

假设`Map`中的`key`为`sample1` 和 `sample2`,为了为键提供额外的内容帮助，你可以将以下JSON添加到模块的手动元数据中(添加额外元数据):

```java
{
     "hints": [
    {
        "name": "my.contexts.keys",
        "values": [
            {
                "value": "sample1"
            },
            {
                "value": "sample2"
            }
        ]
    }
]}
```

### Value 提供程序

提供程序是将语义附加到属性的强大方法。在本节中，我们定义了官方的提供程序，你可以使用它们来进行自己的提示。但是，你最喜欢的IDE可能实现其中一些，也可能一个也不实现。

通俗一点就是属性配置值的来源。

#### Any

特殊的any provider值允许提供任何附加值。如果支持的话，应该应用基于属性类型的常规值验证。如果你有一个值列表，并且任何额外的值仍应视为有效，则通常使用此提供程序。

例如:

```java
@ConfigurationProperties(prefix = "my.messaging")
public class MyMessagingProperties {
    /**
     * Addresses List
     */
    private List<String> addresses = new ArrayList<>(Arrays.asList("a", "b"));
    }
```

`my.messaging.addresses` 属性默认值列表是 “`a`”,“`b`”。如果输入其它值IDEA会提示如下。

如果允许其它任意值，那么可以在添加额外元数据提供程序。

```java
"hints": [
    {
      "name": "my.messaging.addresses",
      "values": [
        {
          "value": "a"
        },
        {
          "value": "b"
        }
      ],
      "providers": [
        {
          "name": "any"
        }
      ]
    }]
```

#### Class Reference

`class-reference`提供程序自动完成项目中可用的类。

```java
  "hints": [
    {
      "name": "server.servlet.jsp.class-name",
      "providers": [
        {
          "name": "class-reference",
          "parameters": {
            "target": "jakarta.servlet.http.HttpServlet"
          }
        }
      ]
    }
```

`target`：类的完全限定名

`concrete`: 指定是否只将具体类视为有效的候选类。默认`true`。

#### Handle As

`handle-as`提供程序允许你将属性的类型替换为更高级的类型。当属性具有java.lang.String类型时，通常会发生这种情况，因为你不希望你的配置类依赖于可能不在类路径中的类。

```java
 "hints": [
    {
      "name": "my.local",
      "providers": [
        {
          "name": "handle-as",
          "parameters": {
            "target": "org.springframework.core.io.Resource"
          }
        }
      ]
    }]
```

`Handle As` 支持的参数:

参数
类型
描述

target
String (Class)
java.lang.Enum java.nio.charset.Charset java.util.Locale org.springframework.util.MimeType org.springframework.core.io.Resource

#### Spring Bean Reference

`spring-bean-reference`提供程序自动完成在当前项目的配置中定义的bean。

下面的元数据片段对应于标准的`spring.jmx.serve`r属性，它定义了要使用的`MBeanServer` bean的名称:

```java
{
     "hints": [
    {
        "name": "spring.jmx.server",
        "providers": [
            {
                "name": "spring-bean-reference",
                "parameters": {
                    "target": "javax.management.MBeanServer"
                }
            }
        ]
    }
]}
```

#### Spring Profile Name

`Spring -profile-name`提供程序自动完成在当前项目的配置中定义的Spring配置文件。下面的元数据片段对应于标准的`spring .profiles.active`属性，它定义了要启用的Spring配置文件的名称:

```java
{
     "hints": [
    {
        "name": "spring.profiles.active",
        "providers": [
            {
                "name": "spring-profile-name"
            }
        ]
    }
]}
```

## 三、生成自己的元数据

通过使用spring-boot-configuration-processor jar，可以很容易地从带有@ConfigurationProperties注释的项生成自己的配置元数据文件。jar包含一个Java注释处理器，在编译项目时调用它。

### 配置注解处理器

要使用处理器，需要包含对`spring-boot-configuration-processor`的依赖。对于Maven，应该将依赖项声明为可选的，如下面的示例所示:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-configuration-processor</artifactId>
    <optional>true</optional>
</dependency>
```

### 元数据自动生成

处理程序会选择带有`@ConfigurationProperties`注解的类和方法。

如果类有一个参数化构造函数，则每个构造函数参数创建一个"property"，除非构造函数带有`@Autowired`注释。如果类有一个带有@ConstructorBinding显式注释的构造函数，则为该构造函数的每个构造函数参数创建一个"property"。否则，通过对集合和映射类型进行特殊处理的标准`getter`和`setter`来发现属性(即使只有`getter`也能检测到)。注解处理器还支持使用`@Data`、`@Value`、`@Getter`和`@Setter` lombok注释。考虑以下例子:

```java
@ConfigurationProperties(prefix = "my.server")
public class MyServerProperties {
    /**
     * Name of the server.
     */
    private String name;
    /**
     * IP address to listen to.
     */
    private String ip = "127.0.0.1";
    /**
     * Port to listener to.
     */
    private int port = 9797;
    // getters/setters ...
}
```

这将公开三个属性，其中`my.server.name`没有默认值，`my.server.ip`和`my.server.port`分别默认为“`127.0.0.1`”和`9797`。字段上的`Javadoc`用于填充`description`属性。例如，`my.server.ip`的描述是“IP address to listen to”。

接下来编译项目，在`target`目录会生成`META-INF/spring-configuration-metadata.json`。

元数据内容:

属性配置文件提示:

### 嵌套属性

注解处理器自动将内部类视为嵌套属性。如下例子:

```java
@ConfigurationProperties(prefix = "my.server")
public class MyServerProperties {
    private String name;
    private Host host;
    // getters/setters ...
    public static class Host {
        private String ip;
        private int port;
        // getters/setters ...
    }
}
```

上面的示例为`my.server.name`, `my.server.host.ip`, 和 `my.server.host.port` 属性生成元数据信息。

可以在字段上使用`@NestedConfigurationProperty`注释，以指示应该将常规(非内部)类视为嵌套类。

### 添加额外的元数据

Spring Boot的配置文件处理是相当灵活的，通常情况下，可能存在没有绑定到`@ConfigurationProperties` bean的属性。你可能还需要调优现有键的一些属性。为了支持这种情况并让你提供定制的“提示”，注解处理器自动地合并来自`META-INF/additional-spring-configuration-metadata.json`到主元数据文件。

`additional-spring-configuration-metadata.json`文件与常规的`spring-configuration-metadata.json`完全相同。附加属性文件是可选的。如果没有任何其他属性，就不要添加该文件。

考虑以下例子:

```java
@ConfigurationProperties(prefix = "my.messaging")
public class MyMessagingProperties {
    private List<String> addresses = new ArrayList<>(Arrays.asList("a", "b"));
    private ContainerType containerType = ContainerType.SIMPLE;
    // getters/setters ...
    public enum ContainerType {
        SIMPLE, DIRECT
    }
}
```

注解处理器无法自动检测`Enums`和`Collections`的默认值。

这种情况下可以使用手动添加元数据。

```java
{
     "properties": [
    {
        "name": "my.messaging.addresses",
        "defaultValue": ["a", "b"]
    },
    {
        "name": "my.messaging.container-type",
        "defaultValue": "simple"
    }
]}
```

## 总结

本文主要介绍了Spring Boot元数据的概念以及作用，然后怎样创建自己的元数据，这为后面自定义Starter打下基础。

\
