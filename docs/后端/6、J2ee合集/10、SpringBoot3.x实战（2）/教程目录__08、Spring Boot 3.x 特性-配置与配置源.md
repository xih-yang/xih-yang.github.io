# 08、Spring Boot 3.x 特性-配置与配置源
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/8.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
### 1.外部化配置

Spring Boot支持外部化配置，这样就可以在不同的环境中使用相同的应用程序代码。你可以使用各种外部配置源，包括`Java属性文件`、`YAML文件`、`环境变量`和`命令行参数`。

属性值可以通过使用`@Value`注释直接注入到`bean`中，可以通过Spring的`Environment`抽象访问，也可以通过`@ConfigurationProperties`绑定到结构化对象。

Spring Boot使用了一个非常特殊的`PropertySource`顺序，其目的是允许合理地重写值。属性优先级按以下顺序(**排序后的项覆盖前面的项**)

**1、** 默认配置,(`SpringApplication.setDefaultProperties`设置的属性)；

**2、**`@PropertySource`注解配置在`@Configuration`类上,但是需要注意，在刷新应用程序上下文之前，这样的属性源不会添加到`Environment`中这对于配置某些属性(如`logging.*spring.main.*`)已经太迟了，这些属性需要在刷新开始之前被读取；

**3、** 配置数据,比如`application.properties`配置文件；

**4、**`RandomValuePropertySource`，它的属性只有`random.*`；

**5、** 操作系统环境变量；

**6、** Java系统属性(`System.getProperties()`)；

**7、** 来自`java:comp/env`的`JNDI`属性；

**8、**`ServletContext`初始化参数；

**9、**`ServletConfig`初始化参数；

**10、**`SPRING_APPLICATION_JSON`属性(嵌入在环境变量或系统属性中的内联`JSON`)；

**11、** 命令行参数；

**12、** 测试上的`properties`属性,仅在`@SpringBootTest`和用于测试应用程序特定部分的测试注解有效；

**13、** 测试上的`@TestPropertySource`注解；

**14、** 在`$HOME/.config/spring-boot`目录的`devtools`全局设置属性,当`devtools`处于激活状态时；

**配置文件优先级顺序如下：**

**1、** 打包在jar中的应用配置(`application.properties`和`application.yml`)；

**2、** 打包在jar中的特定应用配置(`application-{profile}.properties`和`application-{profile}.yml`)；

**3、** 打包的jar之外的应用配置(`application.properties`和`application.yml`)；

**4、** 打包的jar之外的特定应用配置(`application-{profile}.properties`和`application-{profile}.yml`)；

**5、** 建议在整个应用程序中使用一种格式如果配置文件的位置同时包含`properties`和`yml`格式，则`properties`优先；

### 2.访问命令行属性

默认情况下,`SpringApplication`会转换任意的命令行参数(参数以`--`开始,例如 `--server.port=8080`)为属性并添加到`Spring Environment`。 如前所述，命令行属性总是优先于基于文件的属性源。如果不希望将命令行属性添加到`Environment`中，可以使用`SpringApplication.setAddCommandLineProperties(false)`禁用它们。

### 3.JSON应用程序属性

环境变量和系统属性通常有一些限制，这意味着某些属性名称不能使用。为了帮助实现这一点，Spring Boot允许将一个属性块编码成一个`JSON`结构。

当应用程序启动时，任何`spring.application.json`或`SPRING_APPLICATION_JSON`属性都将被解析并添加到`Environment`中。

例如，`SPRING_APPLICATION_JSON`属性可以作为环境变量在UN*X shell的命令行中提供:

```java
$SPRING_APPLICATION_JSON='{"my":{"name":"test"}}' 
java -jar myapp.jar
```

在前面的示例中，在`Spring Environment`中以`my.name=test`结束。

同样的`JSON`也可以作为系统属性提供

```java
$ java -Dspring.application.json='{"my":{"name":"test"}}' -jar myapp.jar
```

还可以使用命令行参数来提供`JSON`:

```java
$ java -jar myapp.jar --spring.application.json='{"my":{"name":"test"}}'
```

如果你正在部署到一个典型的`Application Server`，您还可以使用`JNDI`变量命名

`java:comp/env/spring.application.json`。

> 虽然JSON中的空值将被添加到生成的属性源中，但PropertySourcesPropertyResolver将空属性视为缺失值。这意味着JSON不能用空值覆盖来自优先级低的属性源的属性。

### 4.外部应用程序属性

当应用启动时 Spring Boot会自动查找和加载`application.properties` 和 `application.yaml`配置文件,从以下目录：

**1、** classpath；

a. classpath 根目录

b. classpath `/config`包

**2、** 当前目录；

a.当前目录

b.当前目录的`/config`子目录

c. `/config`子目录的直接子目录

该列表按优先级排序(**较低项的值覆盖较高项的值**)。加载文件中的文档将作`PropertySources`添加到`Spring Environment`环境中。

如果不喜欢`application`作为配置文件名，可以通过指定`spring.config.name`环境属性切换到另一个文件名。例如, 查找 `myproject.properties` 和 `myproject.yaml` 文件, 可以按照如下运行程序:

```java
java -jar myproject.jar --spring.config.name=myproject
```

还可以通过使用`spring.config.location`属性来引用配置一个位置。此属性接受一个或多个要检查的位置使用逗号分隔列表。

```java
$ java -jar myproject.jar --spring.config.location=\
    optional:classpath:/default.properties,\
    optional:classpath:/override.properties
```

> 使用前缀optional:如果路径可选并且不介意不存在
>
> spring.config.name, spring.config.location, 和 spring.config.additional-location很早就被用来确定哪些文件必须被加载。它们必须定义为环境属性(通常是OS环境变量、系统属性或命令行参数)

如果`spring.config.location`包含目录(而不是文件)，它们应该以`/`结尾。在运行时，它们将被附加上从`spring.config.name`中生成的名称，然后才被加载。在`spring.config.location`中指定的文件被直接导入。

> 如果spring.config.location设置成classpath:myconfig.properties,如果找到合适的,classpath:myconfig-

.properties文件也会被加载。

在大多数情况下,每个设置的spring.config.location项,都会引用一个文件或目录,位置按照定义的顺序处理，**后面的位置可以覆盖前面的位置的值**。

如果你有一个复杂的location设置，并且使用 profile-specific 配置文件。你可能需要提供更多的提示，以便Spring Boot知道应该如何对它们进行分组。位置组是所有位置的集合它们是同一级别。例如你可能希望对所有`classpath`位置进行分组，然后对所有外部位置进行单独分组。位置组中的项应分隔符应用使用`;`。[具体的详解](https://editor.csdn.net/md?articleId=124357102#Profile_127)

使用`spring.config.location`配置的位置替换默认位置。例如`spring.config.location`配置成`optional:classpath:/custom-config/,optional:file:./custom-config/`,则完整的配置路径集合如下:

```java
optional:classpath:custom-config/
optional:file:./custom-config/
```

如果需要添加加额外的位置，而不是替换默认的,可以使用`spring.config.additional-location`配置，从其他位置加载的属性可以覆盖默认位置中的属性。例如`spring.config.additional-location`配置成`optional:classpath:/custom-config/,optional:file:./custom-config/`，整个完整的应用程序配置路径集合如下:

```java
optional:classpath:/;optional:classpath:/config/
optional:file:./;optional:file:./config/;optional:file:./config/*/
optional:classpath:custom-config/
optional:file:./custom-config/
```

这种搜索顺序允许你在一个配置文件中指定默认值，然后有选择地在另一个配置文件中覆盖这些值。可以在`application.properties`(或`spring.config.name`指定文件名)中为应用程序提供默认值。然后可以在运行时使用位于某个定制位置的不同文件重写这些默认值。

#### 可选的路径

默认情况下，当配置数据路径不存在时,Spring Boot抛出异`ConfigDataLocationNotFoundException`应用将无法启动。

如果你想指定一个配置文件路径，如果可以允许不存在，你可以使用`optional:`前缀。你可以使用前缀和`spring.config.location` 和 `spring.config.additional-location`一起使用,以及`spring.config.import`。例如`spring.config.import`的值为`optional:file:./myconfig.propertie`,就算这个文件不存在应用也可以启动。

如果你想忽略所有的`ConfigDataLocationNotFoundExceptions`异常,让应用程序总是能启动。可以使用`spring.config.on-not-found`属性,使用`SpringApplication.setDefaultProperties()`方法或者系统/环境变量设置这个值为`ignore`。

#### 通配符路径

如果配置文件路径最后一个路径段包含 *,被认为是一个通配路径。在加载配置时，将展开通配符，以便同时检查直接子目录。通配符位置在`Kubernetes`等环境中特别有用，因为有多个配置属性源。

例如，如果你有一些`Redis`配置和一些`MySQL`配置，你可能想把这两个配置分开，同时要求它们都出现在`application.properties`中。这可能导致两个独立的`application.properties`文件,比如`/config/redis/application.properties` 和 `/config/mysql/application.properties`。在这种情况下，使用`config/*/`的通配符位置，可以同时处理两个文件。

默认情况下，Spring Boot在默认搜索路径包含`config/*/`。这意味着将搜索jar之外`/config`目录的所有子目录。你可以使用`spring.config.location` 和 `spring.config.additional-location`配置通配符。

> 通配符位置必须只包含一个*，如果搜索路径是目录，则以*/结尾;如果搜索位置是文件，则以*/结尾。带有通配符的路径根据文件名的绝对路径按字母顺序排序。
>
> 通配符位置仅适用于外部目录。不能在classpath路径中使用通配符。

#### Profile特定文件

和`application`属性文件一样,Spring Boot也会尝试使用命名约定`application-{profile}`来加载特定配置文件的文件。例如，如果你的应用程序激活一个名为`prod`的配置文件并使用`YAML`文件，那么`application.yml`和`application-prod.yml`文件将会被加载。

Profile特定属性文件与`application.properties`加载目录相同,profile特定文件总是会覆盖非特定文件,如果配置了多个profile特定文件，这是一种last-win策略。例如如果配置文件`prod,live`是由`spring.profiles.active`属性指定的，在`application-prod.properties`的值会被`application-live.properties`值覆盖。(`字母靠前的优先级高?`)

> last-win策略适用于配置路径组,一个spring.config.location为classpath:/cfg/,classpath:/ext/，它和classpath:/cfg/;classpath:/ext/没有相同的覆盖规则。(分隔符一个为 ,一个为;)

> 例如,继续上面的 prod,live例子,配置文件如下:

```java
/cfg
 application-live.properties
 /ext
 application-live.properties
  application-prod.properties
```

> 有一个spring.config.location为classpath:/cfg/,classpath:/ext/，会先处理所有的/cfg文件,然后处理/ext文件。

```java
/cfg/application-live.properties
/ext/application-prod.properties
/ext/application-live.properties
```

> 有一个spring.config.location为classpath:/cfg/;classpath:/ext/(中间用;隔开)，此时处理/cfg和/ext具有相同的优先级

```java
/ext/application-prod.properties
/cfg/application-live.properties
/ext/application-live.properties
```

如果没有激活profiles，那么`Environment`有一组默认概要文件(默认情况下，`[default]`)。换句话说，如果没有显式激活配置文件，则会考虑`application-default`的属性。

属性文件只加载一次。如果已经直接导入了一个profile属性文件，那么它不会二次重复导入。

#### 导入附加数据

应用程序属性可以使用`spring.config.import`属性从其他路径进一步导入配置数据,导入的文件内容插入到声明导入的文档下面的附加文档。例如,在classpath `application.properties`文件有如下内容:

```java
spring.application.name=myapp
spring.config.import=optional:file:./dev.properties
```

这将触发在当前目录中导入一个dev.properties文件(如果存在这样的文件)。来自导入的`dev.properties`的值将优先于触发导入的文件。在上面的例子中，`dev.properties`可以将`spring.application.name`重新定义为一个不同的值。

无论声明多少次，导入都只会被导入一次。在`properties/yaml`文件中的单个文档中定义导入的顺序无关紧要。例如，下面两个例子产生了相同的结果:

```java
spring.config.import=my.properties
my.property=value
my.property=value
spring.config.import=my.properties
```

在上述两个示例中，来自`my.properties`文件内容将优先于触发其导入的文件。

可以在单个`spring.config.import`键下指定几个位置。位置将按照定义的顺序处理，后面的导入优先。

> 1.在适当的时候还可以导入Profile文件，例如上面的例子导入my.properties文件以及符合条件的my-.properties文件
>
> 2.Spring Boot包含了可扩展的API，允许支持各种不同的位置地址。默认情况下，您可以导入Java properties、YAML和“配置树”。 第三方jar可以提供对其他技术的支持(不要求文件必须是本地的)。例如，可以想象配置数据来自外部存储，如Consul、Apache ZooKeeper或Netflix Archaius。 如果想支持自己的路径，请参阅org.springframework.boot.context.config包中的ConfigDataLocationResolver和ConfigDataLoader类。

#### 导入无扩展名文件

一些云平台不能向卷挂载的文件添加文件扩展名。要导入这些无扩展文件，需要给Spring Boot一个提示，以便它知道如何加载它们。可以通过在方括号中放置扩展提示来实现。

例如，假设有`一个/etc/config/myconfig`文件，希望以`yaml`的形式导入它。您可以从`application.properties`导入它。使用以下属性:

`spring.config.import=file:/etc/config/myconfig[.yaml]`

#### 使用配置树

当在云平台(如`Kubernetes`)上运行应用程序时，你经常需要读取平台提供的配置值。出于这种目的使用环境变量并不罕见，但这可能有缺点，特别是在值应该是保密的情况下。

作为环境变量的替代方案，许多云平台现在都允许将配置映射到挂载的数据卷中。例如，`Kubernetes`可以卷挂载[ConfigMaps](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#populate-a-volume-with-data-stored-in-a-configmap)和[Secrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod)。

可以使用如下2中卷挂载模式:

**1、** 单个文件包含一组完整的属性(通常编写为`YAML`)；

**2、** 多个文件被写入到一个目录树中，文件名成为“`key`”，内容成为“`value`”；

对于第一种情况，你可以像上面描述的那样直接使用`spring.config.import`导入`YAML`或`Properties`文件。对于第二种情况，您需要使用`configtree:`前缀，以便Spring Boot知道它需要将文件作为属性公开。

例如`Kubernetes`已经安装了以下卷:

```java
etc/
  config/
    myapp/
      username
      password
```

用户名文件的内容将是一个配置值，而密码文件的内容将是一个秘密。 要导入这些属性，可以将以下内容添加到`application.properties` 或者 `application.yaml`文件中:

```java
spring.config.import=optional:configtree:/etc/config/
```

然后可以从`Environment`中访问或注入`myapp.username` 和 `myapp.password`。也可以`spring.config.import` 直接导入 `optional:configtree:/etc/config/myapp`,这样可以直接使用属性 `username`和`password`。

如果你有多个配置树要从同一个父文件夹导入，你可以使用通配符快捷方式。任何以`/*/`结尾的`configtree:`位置将导入所有直接子节点作为配置树。

例如:

```java
etc/
  config/
    dbconfig/
      db/
        username
        password
    mqconfig/
      mq/
        username
        password
```

你可以使用 `configtree:/etc/config/*/`作为导入路径。

```java
spring.config.import=optional:configtree:/etc/config/*/
```

然后就可以读取`db.username`, `db.password`, `mq.username` 和 `mq.password` 属性。

> 使用通配符加载的目录按字母顺序排序。如果需要不同的顺序，那么应该将每个位置作为单独的导入列出

配置树也可以用于`Docker`的`secrets`。当一个`Docker`群服务被授予访问一个`secrets`的权限时，这个`secrets`就会被装载到容器中。例如有一个名称`db.password`的`secrets`,挂载在`/run/secrets/`位置,你可以在Spring环境下使用`db.password`属性,配置如下:

```java
spring.config.import=optional:configtree:/run/secrets/
```

#### 属性占位符

在`application.properties`和`application.yml`配置属性值,使用时会通过现有的`Environment`进行过滤。因此，可以引用以前定义的值(例如从系统属性或环境变量)。标准的`${name}`属性占位符语法可以在值的任何位置使用，属性占位符还可以使用:指定一个默认值`(${name:default}`)

```java
app.name=MyApp
app.description=${app.name} is a Spring Boot application written by ${username:Unknown}
```

#### 使用多文档文件

Spring Boot允许将单个物理文件分割成多个逻辑文档，每个逻辑文档都独立添加。文件按从上到下的顺序处理。后面的文档可以覆盖前面文档中定义的属性。

在application.yml中，使用标准YAML多文档语法,—表示一个文档的结束和下一个文档的开始。

例如:

```java
spring:
  application:
    name: "MyApp"
---
spring:
  application:
    name: "MyCloudApp"
  config:
    activate:
      on-cloud-platform: "kubernetes"
```

在application.properties文件中使用#—标记文档的分割:

```java
spring.application.name=MyApp
#---
spring.application.name=MyCloudApp
spring.config.activate.on-cloud-platform=kubernetes
```

> 属性文件分隔符不能有任何前导空格，并且必须恰好有三个连字符。分隔符前后的行不能是注释。
>
> 多文档属性文件经常与激活属性(如spring.config.activate.on-profile)一起使用。有关详细信息，请参阅下一节。

多文档属性文件不能通过使用@PropertySource或@TestPropertySource注解加载。

#### 激活属性

有时只在满足特定条件时激活一组给定的属性是很有用的。例如，您可能拥有只有在特定配置文件处于活动状态时才相关的属性。

可以使用spring.config.activate.*激活一个属性文档。

有如下激活属性可用:

属性
描述

on-profile
必须匹配文档才能激活的配置文件表达式。

on-cloud-platform
必须检测到的CloudPlatform才能使文档处于活动状态。

例如，以下说明第二个文档只有在Kubernetes上运行时才处于活动状态，并且只有当“prod”或“staging”配置文件处于活动状态时才处于活动状态:

```java
myprop:
  "always-set"
---
spring:
  config:
    activate:
      on-cloud-platform: "kubernetes"
      on-profile: "prod | staging"
myotherprop: "sometimes-set"
```

### 使用YAML

YAML是JSON的超集，因此是一种用于指定分层配置数据的方便格式。只要你的类路径上有SnakeYAML库，SpringApplication类就会自动支持YAML作为属性的替代。

> 如果你使用“Starter”，SnakeYAML是由spring-boot-starter自动提供的

#### YAML映射到属性

需要将YAML文档从层次格式转换为可与Spring Environment一起使用的扁平结构。例如，以下YAML文档:

```java
environments:
  dev:
    url: "https://dev.example.com"
    name: "Developer Setup"
  prod:
    url: "https://another.example.com"
    name: "My Cool App"
```

为了从Environment中访问这些属性，它们将被平置如下:

```java
environments.dev.url=https://dev.example.com
environments.dev.name=Developer Setup
environments.prod.url=https://another.example.com
environments.prod.name=My Cool App
```

同样，YAML列表也需要扁平化。它们被表示为带有[index]解引用器的属性键。例如，以下YAML:

```java
my:
 servers:
 - "dev.example.com"
 - "another.example.com"
```

前面的例子将被转换成以下属性:

```java
my.servers[0]=dev.example.com
my.servers[1]=another.example.com
```

> 1./使用[index]符号的属性可以使用Spring Boot的Binder类绑定到Java List或Set对象。有关详细信息，请参阅下面的类型安全的配置属性一节。
>
> 2.YAML文件不能通过使用@PropertySource或@TestPropertySource注释加载。在这种情况下，你需要以这种方式加载值，那就需要使用properties文件。

#### 直接加载YAML

Spring Framework提供了两个方便的类，可以用来加载YAML文档。YamlPropertiesFactoryBean将YAML作为Properties加载,YamlMapFactoryBean将YAML作为Map加载。

如果你想要加载YAML作为Spring PropertySource，你也可以使用YamlPropertySourceLoader类。

### 配置随机值

RandomValuePropertySource用于注入随机值(例如密钥或者测试用例)，它可以生成integer,long,uuid，或者strings类型数据,如下例子:

```java
my:
  secret: "${random.value}"
  number: "${random.int}"
  bignumber: "${random.long}"
  uuid: "${random.uuid}"
  number-less-than-ten: "${random.int(10)}"
  number-in-range: "${random.int[1024,65536]}"
```

`random.int*`语法是:`OPEN value(,max) CLOSE`,`OPEN` 和`CLOSE`可以为任意字符,`value,max`为整型,如果提供了`max`，则`value`为最小值，`max`为最大值(不包含最大值)。

### 配置系统环境属性

Spring Boot支持为环境属性设置前缀。如果系统环境由具有不同配置需求的多个Spring Boot应用程序共享，这将非常有用。系统环境属性的前缀可以直接在`SpringApplication`上设置。

```java
application.setEnvironmentPrefix(String environmentPrefix)
```

例如如果将前缀设置为input，则一个属性例如`remote.timeout`也将在系统环境中被解析为`input.remote.timeout`。
