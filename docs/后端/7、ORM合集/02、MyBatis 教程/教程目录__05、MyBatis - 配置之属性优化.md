# 05、MyBatis - 配置之属性优化
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/5.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是配置之属性优化

在解答这个问题之前我们应该先明白MyBatis的配置有哪些？

官方文档中文网：[配置_MyBatis中文网](https://mybatis.net.cn/configuration.html#environments)。

我们还是直接看官方文档中给出的内容：

MyBatis 的配置文件包含了会深深影响 MyBatis 行为的设置和属性信息。 配置文档的顶层结构如下：

**configuration（配置）**

**　　properties（属性）**

**　　settings（设置）**

**　　typeAliases（类型别名）**

**　　typeHandlers（类型处理器）**

**　　objectFactory（对象工厂）**

**　　plugins（插件）**

**　　environments（环境配置）**

**　　　　environment（环境变量）**

**　　　　　　transactionManager（事务管理器）**

**　　　　　　dataSource（数据源）**

**　　databaseIdProvider（数据库厂商标识）**

**　　mappers（映射器）**

ok，看到上面的配置结构，我们会发现有一些是我们接触过的，没错，就是environments（环境配置）和mappers（映射器）。我们在建立第一个MyBatis程序的时候，就在mybatis-config.xml配置文件中对它们进行了配置，当时他们是这样的：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://localhost:3306/MyBaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8"/>
        <property name="username" value="root"/>
        <property name="password" value="123456"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="com/jms/dao/UserMapper.xml"/>
  </mappers>
</configuration>
```

既然如此，我们在对属性进行优化之前，先了解environments（环境配置）的一些内容。

**环境配置（environments）**

**MyBatis 可以配置成适应多种环境，这种机制有助于将 SQL 映射应用于多种数据库之中， 现实情况下有多种理由需要这么做。例如，开发、测试和生产环境需要有不同的配置；或者想在具有相同 Schema 的多个生产数据库中使用相同的 SQL 映射。还有许多类似的使用场景。**

**不过要记住：尽管可以配置多个环境，但每个 SqlSessionFactory 实例只能选择一种环境。**

这是官方文档的内容，其中说可以配置多种环境，也就是说...可以有多个，我们通过default="..."选择其中一个，就像下面的例子：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://localhost:3306/MyBaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8"/>
        <property name="username" value="root"/>
        <property name="password" value="123456"/>
      </dataSource>
    </environment>
     <environment id="test">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://localhost:3306/MyBaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8"/>
        <property name="username" value="root"/>
        <property name="password" value="123456"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="com/jms/dao/UserMapper.xml"/>
  </mappers>
</configuration>
```

这里我配置了两个环境，一个id为development，还有一个id为test，但是由于default="development"，所以我选择的是id为development的环境。

OK，明白了default和id所代表的含义，我们接下来看事务管理器，还是先看官方给出的文档：

**事务管理器（transactionManager）**

**在MyBatis 中有两种类型的事务管理器（也就是 type="[JDBC|MANAGED]"）：**

**JDBC – 这个配置直接使用了 JDBC 的提交和回滚设施，它依赖从数据源获得的连接来管理事务作用域。**

**MANAGED – 这个配置几乎没做什么。它从不提交或回滚一个连接，而是让容器来管理事务的整个生命周期（比如 JEE 应用服务器的上下文）。 默认情况下它会关闭连接。然而一些容器并不希望连接被关闭，因此需要将 closeConnection 属性设置为 false 来阻止默认的关闭行为。**

**提示：如果你正在使用 Spring + MyBatis，则没有必要配置事务管理器，因为 Spring 模块会使用自带的管理器来覆盖前面的配置。**

所以说，事务管理器其实有JDBC和MANAGED两种，但是我们一般都会选择JDBC。

数据源：

**数据源（dataSource）**

**dataSource 元素使用标准的 JDBC 数据源接口来配置 JDBC 连接对象的资源。**

**大多数 MyBatis 应用程序会按示例中的例子来配置数据源。虽然数据源配置是可选的，但如果要启用延迟加载特性，就必须配置数据源。**

**有三种内建的数据源类型（也就是 type="[UNPOOLED|POOLED|JNDI]"）：**

**UNPOOLED– 这个数据源的实现会每次请求时打开和关闭连接。虽然有点慢，但对那些数据库连接可用性要求不高的简单应用程序来说，是一个很好的选择。 性能表现则依赖于使用的数据库，对某些数据库来说，使用连接池并不重要，这个配置就很适合这种情形。UNPOOLED 类型的数据源仅仅需要配置以下 5 种属性：**

**driver – 这是 JDBC 驱动的 Java 类全限定名（并不是 JDBC 驱动中可能包含的数据源类）。**

**url – 这是数据库的 JDBC URL 地址。**

**username – 登录数据库的用户名。**

**password – 登录数据库的密码。**

**defaultTransactionIsolationLevel – 默认的连接事务隔离级别。**

**defaultNetworkTimeout – 等待数据库操作完成的默认网络超时时间（单位：毫秒）。查看 java.sql.Connection#setNetworkTimeout() 的 API 文档以获取更多信息。**

**作为可选项，你也可以传递属性给数据库驱动。只需在属性名加上“driver.”前缀即可，例如：**

**driver.encoding=UTF8**

**这将通过 DriverManager.getConnection(url, driverProperties) 方法传递值为 UTF8 的 encoding 属性给数据库驱动。**

**POOLED– 这种数据源的实现利用“池”的概念将 JDBC 连接对象组织起来，避免了创建新的连接实例时所必需的初始化和认证时间。 这种处理方式很流行，能使并发 Web 应用快速响应请求。**

**除了上述提到 UNPOOLED 下的属性外，还有更多属性用来配置 POOLED 的数据源：**

**poolMaximumActiveConnections – 在任意时间可存在的活动（正在使用）连接数量，默认值：10**

**poolMaximumIdleConnections – 任意时间可能存在的空闲连接数。**

**poolMaximumCheckoutTime – 在被强制返回之前，池中连接被检出（checked out）时间，默认值：20000 毫秒（即 20 秒）**

**poolTimeToWait – 这是一个底层设置，如果获取连接花费了相当长的时间，连接池会打印状态日志并重新尝试获取一个连接（避免在误配置的情况下一直失败且不打印日志），默认值：20000 毫秒（即 20 秒）。**

**poolMaximumLocalBadConnectionTolerance – 这是一个关于坏连接容忍度的底层设置， 作用于每一个尝试从缓存池获取连接的线程。 如果这个线程获取到的是一个坏的连接，那么这个数据源允许这个线程尝试重新获取一个新的连接，但是这个重新尝试的次数不应该超过 poolMaximumIdleConnections 与 poolMaximumLocalBadConnectionTolerance 之和。 默认值：3（新增于 3.4.5）**

**poolPingQuery – 发送到数据库的侦测查询，用来检验连接是否正常工作并准备接受请求。默认是“NO PING QUERY SET”，这会导致多数数据库驱动出错时返回恰当的错误消息。**

**poolPingEnabled – 是否启用侦测查询。若开启，需要设置 poolPingQuery 属性为一个可执行的 SQL 语句（最好是一个速度非常快的 SQL 语句），默认值：false。**

**poolPingConnectionsNotUsedFor – 配置 poolPingQuery 的频率。可以被设置为和数据库连接超时时间一样，来避免不必要的侦测，默认值：0（即所有连接每一时刻都被侦测 — 当然仅当 poolPingEnabled 为 true 时适用）。**

**JNDI – 这个数据源实现是为了能在如 EJB 或应用服务器这类容器中使用，容器可以集中或在外部配置数据源，然后放置一个 JNDI 上下文的数据源引用。这种数据源配置只需要两个属性：**

**initial_context – 这个属性用来在 InitialContext 中寻找上下文（即，initialContext.lookup(initial_context)）。这是个可选属性，如果忽略，那么将会直接从 InitialContext 中寻找 data_source 属性。**

**data_source – 这是引用数据源实例位置的上下文路径。提供了 initial_context 配置时会在其返回的上下文中进行查找，没有提供时则直接在 InitialContext 中查找。**

**和其他数据源配置类似，可以通过添加前缀“env.”直接把属性传递给 InitialContext。比如：**

**env.encoding=UTF8**

**这就会在 InitialContext 实例化时往它的构造方法传递值为 UTF8 的 encoding 属性。**

看了以上文档，我们主要要了解事务管理器的默认是JDBC，数据源默认的是POOLED。

接下来就只剩下环境配置中标签的内容了，很明显，这就是属性标签，对于配置文件，官方给出的默认的格式是这样的：

```xml
<property name="driver" value="${driver}"/>
<property name="url" value="${url}"/>
<property name="username" value="${username}"/>
<property name="password" value="${password}"/>
```

那么我们怎么样才能和官方这种默认的格式匹配起来呢，现在我们就需要对属性进行优化了。

**属性（properties）**

**这些属性可以在外部进行配置，并可以进行动态替换。你既可以在典型的 Java 属性文件中配置这些属性，也可以在 properties 元素的子元素中设置。**

**例如：**

```xml
<properties resource="org/mybatis/example/config.properties">
  <property name="username" value="dev_user"/>
  <property name="password" value="F2Fa3!33TYyg"/>
</properties>
```

官方文档中是这样说明的，我们将属性在外部配置或在properties的子元素中设置就是对属性的优化。

## 二、怎么进行属性的优化

**1、** 在java属性文件中配置；

1、首先建立一个属性文件db.properties，其中的内容如下：

driver=com.mysql.jdbc.Driver

url=jdbc:mysql://localhost:3306/MyBaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8

username=root

password=123456

2、修改mybatis-config.xml配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <properties resource="db.properties">
  </properties>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
         <property name="url" value="${url}"/>
         <property name="username" value="${username}"/>
          <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="com/jms/dao/UserMapper.xml"/>
  </mappers>
</configuration>
```

我们通过对db.properties文件进行了引用，在这种配置下我们去测试是完全可以的。

2、直接在元素的子元素中进行设置

我现在先把db.properties文件中的username和password两项删掉，再去将元素内容修改为以下样式：

```xml
<properties resource="db.properties">
    <property name="username" value="root"/>
    <property name="password" value="123456"/>
</properties>
```

此时我们去测试依旧没有问题。

以上就是对属性的优化，那么问题来了，既可以直接在环境配置中赋值，又可以通过properties文件和元素的子元素堆属性进行配置，当其中有重复的属性配置时，该使用哪一个配置呢？

官方在文档中作出了以下规定：

**如果一个属性在不只一个地方进行了配置，那么，MyBatis 将按照下面的顺序来加载：**

**首先读取在 properties 元素体内指定的属性。**

**然后根据 properties 元素中的 resource 属性读取类路径下属性文件，或根据 url 属性指定的路径读取属性文件，并覆盖之前读取过的同名属性。**

**最后读取作为方法参数传递的属性，并覆盖之前读取过的同名属性。**

**因此，通过方法参数传递的属性具有最高优先级，resource/url 属性中指定的配置文件次之，最低优先级的则是 properties 元素中指定的属性。**
