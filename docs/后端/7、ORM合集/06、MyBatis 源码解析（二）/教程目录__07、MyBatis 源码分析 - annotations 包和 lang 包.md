# 07、MyBatis 源码分析 - annotations 包和 lang 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/7.html
- 分类：ORM框架
- 分组：教程目录
> 不幸的是，Java 注解的表达能力和灵活性十分有限。尽管我们花了很多时间在调查、设计和试验上，但最强大的 MyBatis 映射并不能用注解来构建——我们真没开玩笑。而 C# 属性就没有这些限制，因此 MyBatis.NET 的配置会比 XML 有更大的选择余地。虽说如此，基于 Java 注解的配置还是有它的好处的。—— Mybatis 官网

由于annotations 包中的注解，其实大都在 XML 中的有等价形式，并且灵活性比 XML 方式较差，所只要理清楚等价关系，其实这个包就算解释清楚了。如果连 XML 中的配置都理解不清楚的话，那么可以去 [Mybatis 官网](https://mybatis.org/mybatis-3/zh/sqlmap-xml.html)，将实例都看一遍。

### annotations 包

这块内容，其实 Mybatis 官网已经写的很完善了，所以我就将表格直接 copy 过来了。

但是官网中还有代码实例，所以如果有些地方不是很清楚的话，可以去 [Mybatis 官网](https://mybatis.org/mybatis-3/zh/java-api.html) 查看。

注解
使用对象
XML 等价形式
描述

@CacheNamespace
类

为给定的命名空间（比如类）配置缓存。属性：implemetation、eviction、flushInterval、size、readWrite、blocking、properties。@Property

@CacheNamespaceRef
类

引用另外一个命名空间的缓存以供使用。注意，即使共享相同的全限定类名，在 XML 映射文件中声明的缓存仍被识别为一个独立的命名空间。属性：value、name。如果你使用了这个注解，你应设置 value 或者 name 属性的其中一个。value 属性用于指定能够表示该命名空间的 Java 类型（命名空间名就是该 Java 类型的全限定类名），name 属性（这个属性仅在 MyBatis 3.4.2 以上可用）则直接指定了命名空间的名字。

@ConstructorArgs
方法

收集一组结果以传递给一个结果对象的构造方法。属性：value，它是一个 Arg 数组。

@Arg
N/A
*
 *
ConstructorArgs 集合的一部分，代表一个构造方法参数。属性：id、column、javaType、jdbcType、typeHandler、select、resultMap。id 属性和 XML 元素  相似，它是一个布尔值，表示该属性是否用于唯一标识和比较对象。从版本 3.5.4 开始，该注解变为可重复注解。

@TypeDiscriminator
方法

决定使用何种结果映射的一组取值（case）。属性：column、javaType、jdbcType、typeHandler、cases。cases 属性是一个 Case 的数组。

@Case
N/A

表示某个值的一个取值以及该取值对应的映射。属性：value、type、results。results 属性是一个 Results 的数组，因此这个注解实际上和 ResultMap 很相似，由下面的 Results 注解指定。

@Results
方法

一组结果映射，指定了对某个特定结果列，映射到某个属性或字段的方式。属性：value、id。value 属性是一个 Result 注解的数组。而 id 属性则是结果映射的名称。从版本 3.5.4 开始，该注解变为可重复注解。

@Result
N/A
*
 *
在列和属性或字段之间的单个结果映射。属性：id、column、javaType、jdbcType、typeHandler、one、many。id 属性和 XML 元素  相似，它是一个布尔值，表示该属性是否用于唯一标识和比较对象。one 属性是一个关联，和  类似，而 many 属性则是集合关联，和  类似。这样命名是为了避免产生名称冲突。

@One
N/A

复杂类型的单个属性映射。属性： select，指定可加载合适类型实例的映射语句（也就是映射器方法）全限定名； fetchType，指定在该映射中覆盖全局配置参数 lazyLoadingEnabled； resultMap(available since 3.5.5), which is the fully qualified name of a result map that map to a single container object from select result； columnPrefix(available since 3.5.5), which is column prefix for grouping select columns at nested result map. 提示 注解 API 不支持联合映射。这是由于 Java 注解不允许产生循环引用。

@Many
N/A

复杂类型的集合属性映射。属性： select，指定可加载合适类型实例集合的映射语句（也就是映射器方法）全限定名； fetchType，指定在该映射中覆盖全局配置参数 lazyLoadingEnabledresultMap(available since 3.5.5), which is the fully qualified name of a result map that map to collection object from select result； columnPrefix(available since 3.5.5), which is column prefix for grouping select columns at nested result map. 提示：注解 API 不支持联合映射。这是由于 Java 注解不允许产生循环引用。

@MapKey
方法

供返回值为 Map 的方法使用的注解。它使用对象的某个属性作为 key，将对象 List 转化为 Map。属性：value，指定作为 Map 的 key 值的对象属性名。

@Options
方法
映射语句的属性
该注解允许你指定大部分开关和配置选项，它们通常在映射语句上作为属性出现。与在注解上提供大量的属性相比，Options 注解提供了一致、清晰的方式来指定选项。属性：useCache=true、flushCache=FlushCachePolicy.DEFAULT、resultSetType=DEFAULT、statementType=PREPARED、fetchSize=-1、timeout=-1、useGeneratedKeys=false、keyProperty=""、keyColumn=""、resultSets="", databaseId=""。注意，Java 注解无法指定 null 值。因此，一旦你使用了 Options 注解，你的语句就会被上述属性的默认值所影响。要注意避免默认值带来的非预期行为。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis use the Options with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.
注意：keyColumn 属性只在某些数据库中有效（如 Oracle、PostgreSQL 等）。要了解更多关于 keyColumn 和 keyProperty 可选值信息，请查看“insert, update 和 delete”一节。

* @Insert
 * @Update
 * @Delete
 * @Select
方法

 *
 *
 *
每个注解分别代表将会被执行的 SQL 语句。它们用字符串数组（或单个字符串）作为参数。如果传递的是字符串数组，字符串数组会被连接成单个完整的字符串，每个字符串之间加入一个空格。这有效地避免了用 Java 代码构建 SQL 语句时产生的“丢失空格”问题。当然，你也可以提前手动连接好字符串。属性：value，指定用来组成单个 SQL 语句的字符串数组。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis use a statement with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.

* @InsertProvider
 * @UpdateProvider
 * @DeleteProvider
 * @SelectProvider
方法

 *
 *
 *
允许构建动态 SQL。这些备选的 SQL 注解允许你指定返回 SQL 语句的类和方法，以供运行时执行。（从 MyBatis 3.4.6 开始，可以使用 CharSequence 代替 String 来作为返回类型）。当执行映射语句时，MyBatis 会实例化注解指定的类，并调用注解指定的方法。你可以通过 ProviderContext 传递映射方法接收到的参数、“Mapper interface type” 和 “Mapper method”（仅在 MyBatis 3.4.5 以上支持）作为参数。（MyBatis 3.4 以上支持传入多个参数） 属性：value、type、method、databaseId。 value and type 属性用于指定类名 (The type attribute is alias for value, you must be specify either one. But both attributes can be omit when specify the defaultSqlProviderType as global configuration)。 method 用于指定该类的方法名（从版本 3.5.1 开始，可以省略 method 属性，MyBatis 将会使用 ProviderMethodResolver 接口解析方法的具体实现。如果解析失败，MyBatis 将会使用名为 provideSql 的降级实现）。提示 接下来的“SQL 语句构建器”一章将会讨论该话题，以帮助你以更清晰、更便于阅读的方式构建动态 SQL。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis will use a provider method with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.

@Param
参数
N/A
如果你的映射方法接受多个参数，就可以使用这个注解自定义每个参数的名字。否则在默认情况下，除 RowBounds 以外的参数会以 “param” 加参数位置被命名。例如 #{param1}, #{param2}。如果使用了 @Param("person")，参数就会被命名为 #{person}。

@SelectKey
方法

这个注解的功能与  标签完全一致。该注解只能在 @Insert 或 @InsertProvider 或 @Update 或 @UpdateProvider 标注的方法上使用，否则将会被忽略。如果标注了 @SelectKey 注解，MyBatis 将会忽略掉由 @Options 注解所设置的生成主键或设置（configuration）属性。属性：statement 以字符串数组形式指定将会被执行的 SQL 语句，keyProperty 指定作为参数传入的对象对应属性的名称，该属性将会更新成新的值，before 可以指定为 true 或 false 以指明 SQL 语句应被在插入语句的之前还是之后执行。resultType 则指定 keyProperty 的 Java 类型。statementType 则用于选择语句类型，可以选择 STATEMENT、PREPARED 或 CALLABLE 之一，它们分别对应于 Statement、PreparedStatement 和 CallableStatement。默认值是 PREPARED。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis will use a statement with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.

@ResultMap
方法
N/A
这个注解为 @Select 或者 @SelectProvider 注解指定 XML 映射中  元素的 id。这使得注解的 select 可以复用已在 XML 中定义的 ResultMap。如果标注的 select 注解中存在 @Results 或者 @ConstructorArgs 注解，这两个注解将被此注解覆盖。

@ResultType
方法
N/A
在使用了结果处理器的情况下，需要使用此注解。由于此时的返回类型为 void，所以 Mybatis 需要有一种方法来判断每一行返回的对象类型。如果在 XML 有对应的结果映射，请使用 @ResultMap 注解。如果结果类型在 XML 的  元素中指定了，就不需要使用其它注解了。否则就需要使用此注解。比如，如果一个标注了 @Select 的方法想要使用结果处理器，那么它的返回类型必须是 void，并且必须使用这个注解（或者 @ResultMap）。这个注解仅在方法返回类型是 void 的情况下生效。

@Flush
方法
N/A
如果使用了这个注解，定义在 Mapper 接口中的方法就能够调用 SqlSession#flushStatements() 方法。（Mybatis 3.3 以上可用）

### lang 包

这个包，在网上查不到任何资料，并且在 Mybatis 源码中也没有找到相应的使用，所以写者也不清楚作用是什么，如果你清楚的话，请在评论区告诉我，谢谢啦。

***参考文献***

**1、** [Mybatis官方网站][Mybatis3]；
