# 08、MyBatis源码 - MyBatis之映射器注解
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/8.html
- 分类：ORM框架
- 分组：教程目录
### 映射器注解

设计初期的 MyBatis 是一个 XML 驱动的框架。配置信息是基于 XML 的，映射语句也是定义在 XML 中的。而在 MyBatis 3 中，我们提供了其它的配置方式。MyBatis 3 构建在全面且强大的基于 Java 语言的配置 API 之上。它是 XML 和注解配置的基础。注解提供了一种简单且低成本的方式来实现简单的映射语句。

不幸的是，Java 注解的表达能力和灵活性十分有限。尽管我们花了很多时间在调查、设计和试验上，但最强大的 MyBatis 映射并不能用注解来构建——我们真没开玩笑。而 C# 属性就没有这些限制，因此 MyBatis.NET 的配置会比 XML 有更大的选择余地。虽说如此，基于 Java 注解的配置还是有它的好处的。

#### 注解说明

注解如下表所示：

注解
使用对象
XML 等价形式
描述

@CacheNamespace
类

为给定的命名空间（比如类）配置缓存。属性：implemetation、eviction、flushInterval、size、readWrite、blocking、properties。

@Property
N/A

指定参数值或占位符（placeholder）（该占位符能被 mybatis-config.xml 内的配置属性替换）。属性：name、value。（仅在 MyBatis 3.4.2 以上可用）

@CacheNamespaceRef
类

引用另外一个命名空间的缓存以供使用。注意，即使共享相同的全限定类名，在 XML 映射文件中声明的缓存仍被识别为一个独立的命名空间。属性：value、name。如果你使用了这个注解，你应设置 value 或者 name 属性的其中一个。value 属性用于指定能够表示该命名空间的 Java 类型（命名空间名就是该 Java 类型的全限定类名），name 属性（这个属性仅在 MyBatis 3.4.2 以上可用）则直接指定了命名空间的名字。

@ConstructorArgs
方法

收集一组结果以传递给一个结果对象的构造方法。属性：value，它是一个 Arg 数组。

@Arg
N/A

ConstructorArgs 集合的一部分，代表一个构造方法参数。属性：id、column、javaType、jdbcType、typeHandler、select、resultMap。id 属性和 XML 元素 相似，它是一个布尔值，表示该属性是否用于唯一标识和比较对象。从版本 3.5.4 开始，该注解变为可重复注解。

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

在列和属性或字段之间的单个结果映射。属性：id、column、javaType、jdbcType、typeHandler、one、many。id 属性和 XML 元素 相似，它是一个布尔值，表示该属性是否用于唯一标识和比较对象。one 属性是一个关联，和 类似，而 many 属性则是集合关联，和 类似。这样命名是为了避免产生名称冲突。

@One
N/A

复杂类型的单个属性映射。属性： select，指定可加载合适类型实例的映射语句（也就是映射器方法）全限定名； fetchType，指定在该映射中覆盖全局配置参数 lazyLoadingEnabled； resultMap(available since 3.5.5), which is the fully qualified name of a result map that map to a single container object from select result； columnPrefix(available since 3.5.5), which is column prefix for grouping select columns at nested result map. 提示 注解 API 不支持联合映射。这是由于 Java 注解不允许产生循环引用。

@Many
N/A

复杂类型的集合属性映射。属性： select，指定可加载合适类型实例集合的映射语句（也就是映射器方法）全限定名； fetchType，指定在该映射中覆盖全局配置参数 lazyLoadingEnabled resultMap(available since 3.5.5), which is the fully qualified name of a result map that map to collection object from select result； columnPrefix(available since 3.5.5), which is column prefix for grouping select columns at nested result map. 提示 注解 API 不支持联合映射。这是由于 Java 注解不允许产生循环引用。

@MapKey
方法

供返回值为 Map 的方法使用的注解。它使用对象的某个属性作为 key，将对象 List 转化为 Map。属性：value，指定作为 Map 的 key 值的对象属性名。

@Options
方法
映射语句的属性
该注解允许你指定大部分开关和配置选项，它们通常在映射语句上作为属性出现。与在注解上提供大量的属性相比，Options 注解提供了一致、清晰的方式来指定选项。属性：useCache=true、flushCache=FlushCachePolicy.DEFAULT、resultSetType=DEFAULT、statementType=PREPARED、fetchSize=-1、timeout=-1、useGeneratedKeys=false、keyProperty=""、keyColumn=""、resultSets="", databaseId=""。注意，Java 注解无法指定 null 值。因此，一旦你使用了 Options 注解，你的语句就会被上述属性的默认值所影响。要注意避免默认值带来的非预期行为。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis use the Options with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.注意：keyColumn 属性只在某些数据库中有效（如 Oracle、PostgreSQL 等）。要了解更多关于 keyColumn 和 keyProperty 可选值信息，请查看“insert, update 和 delete”一节。

@Insert @Update@Delete@Select
方法

每个注解分别代表将会被执行的 SQL 语句。它们用字符串数组（或单个字符串）作为参数。如果传递的是字符串数组，字符串数组会被连接成单个完整的字符串，每个字符串之间加入一个空格。这有效地避免了用 Java 代码构建 SQL 语句时产生的“丢失空格”问题。当然，你也可以提前手动连接好字符串。属性：value，指定用来组成单个 SQL 语句的字符串数组。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis use a statement with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.

@InsertProvider@UpdateProvider@DeleteProvider@SelectProvider
方法

允许构建动态 SQL。这些备选的 SQL 注解允许你指定返回 SQL 语句的类和方法，以供运行时执行。（从 MyBatis 3.4.6 开始，可以使用 CharSequence 代替 String 来作为返回类型）。当执行映射语句时，MyBatis 会实例化注解指定的类，并调用注解指定的方法。你可以通过 ProviderContext 传递映射方法接收到的参数、“Mapper interface type” 和 “Mapper method”（仅在 MyBatis 3.4.5 以上支持）作为参数。（MyBatis 3.4 以上支持传入多个参数） 属性：value、type、method、databaseId。 value and type 属性用于指定类名 (The type attribute is alias for value, you must be specify either one. But both attributes can be omit when specify the defaultSqlProviderType as global configuration)。 method 用于指定该类的方法名（从版本 3.5.1 开始，可以省略 method 属性，MyBatis 将会使用 ProviderMethodResolver 接口解析方法的具体实现。如果解析失败，MyBatis 将会使用名为 provideSql 的降级实现）。提示 接下来的“SQL 语句构建器”一章将会讨论该话题，以帮助你以更清晰、更便于阅读的方式构建动态 SQL。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis will use a provider method with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.

@Param
参数
N/A
如果你的映射方法接受多个参数，就可以使用这个注解自定义每个参数的名字。否则在默认情况下，除 RowBounds 以外的参数会以 “param” 加参数位置被命名。例如{param1},{param2}。如果使用了 @Param(“person”)，参数就会被命名为{person}。

@SelectKey
方法

这个注解的功能与  标签完全一致。该注解只能在 @Insert 或 @InsertProvider 或 @Update 或 @UpdateProvider 标注的方法上使用，否则将会被忽略。如果标注了 @SelectKey 注解，MyBatis 将会忽略掉由 @Options 注解所设置的生成主键或设置（configuration）属性。属性：statement 以字符串数组形式指定将会被执行的 SQL 语句，keyProperty 指定作为参数传入的对象对应属性的名称，该属性将会更新成新的值，before 可以指定为 true 或 false 以指明 SQL 语句应被在插入语句的之前还是之后执行。resultType 则指定 keyProperty 的 Java 类型。statementType 则用于选择语句类型，可以选择 STATEMENT、PREPARED 或 CALLABLE 之一，它们分别对应于 Statement、PreparedStatement 和 CallableStatement。默认值是 PREPARED。 The databaseId(Available since 3.5.5), in case there is a configured DatabaseIdProvider, the MyBatis will use a statement with no databaseId attribute or with a databaseId that matches the current one. If found with and without the databaseId the latter will be discarded.

@ResultMap
方法
N/A
这个注解为 @Select 或者 @SelectProvider 注解指定 XML 映射中 元素的 id。这使得注解的 select 可以复用已在 XML 中定义的 ResultMap。如果标注的 select 注解中存在 @Results 或者 @ConstructorArgs 注解，这两个注解将被此注解覆盖。

@ResultType
方法
N/A
在使用了结果处理器的情况下，需要使用此注解。由于此时的返回类型为 void，所以 Mybatis 需要有一种方法来判断每一行返回的对象类型。如果在 XML 有对应的结果映射，请使用 @ResultMap 注解。如果结果类型在 XML 的 元素中指定了，就不需要使用其它注解了。否则就需要使用此注解。比如，如果一个标注了 @Select 的方法想要使用结果处理器，那么它的返回类型必须是 void，并且必须使用这个注解（或者 @ResultMap）。这个注解仅在方法返回类型是 void 的情况下生效。

@Flush
方法
N/A
如果使用了这个注解，定义在 Mapper 接口中的方法就能够调用 SqlSession#flushStatements() 方法。（Mybatis 3.3 以上可用）

#### 使用案例

这个例子展示了如何使用 @SelectKey 注解来在插入前读取数据库序列的值：

```java
@Insert("insert into table3 (id, name) values(#{nameId},{name})")
@SelectKey(statement="call next value for TestSequence", keyProperty="nameId", before=true, resultType=int.class)
int insertTable3(Name name);
```

这个例子展示了如何使用 @SelectKey 注解来在插入后读取数据库自增列的值：

```java
@Insert("insert into table2 (name) values(#{name})")
@SelectKey(statement="call identity()", keyProperty="nameId", before=false, resultType=int.class)
int insertTable2(Name name);
```

这个例子展示了如何使用 @Flush 注解来调用 SqlSession#flushStatements()：

```java
@Flush
List<BatchResult> flush();
```

这些例子展示了如何通过指定 @Result 的 id 属性来命名结果集：

```java
@Results(id = "userResult", value = {
  @Result(property = "id", column = "uid", id = true),
  @Result(property = "firstName", column = "first_name"),
  @Result(property = "lastName", column = "last_name")
})
@Select("select * from users where id ={id}")
User getUserById(Integer id);
@Results(id = "companyResults")
@ConstructorArgs({
  @Arg(column = "cid", javaType = Integer.class, id = true),
  @Arg(column = "name", javaType = String.class)
})
@Select("select * from company where id ={id}")
Company getCompanyById(Integer id);
```

这个例子展示了如何使用单个参数的 @SqlProvider 注解：

```java
@SelectProvider(type = UserSqlBuilder.class, method = "buildGetUsersByName")
List<User> getUsersByName(String name);
class UserSqlBuilder {
  public static String buildGetUsersByName(final String name) {
    return new SQL(){
     {
      SELECT("*");
      FROM("users");
      if (name != null) {
        WHERE("name like{value} || '%'");
      }
      ORDER_BY("id");
    }}.toString();
  }
}
```

这个例子展示了如何使用多个参数的 @SqlProvider 注解：

```java
@SelectProvider(type = UserSqlBuilder.class, method = "buildGetUsersByName")
List<User> getUsersByName(
    @Param("name") String name, @Param("orderByColumn") String orderByColumn);
class UserSqlBuilder {
  // 如果不使用 @Param，就应该定义与 mapper 方法相同的参数
  public static String buildGetUsersByName(
      final String name, final String orderByColumn) {
    return new SQL(){
     {
      SELECT("*");
      FROM("users");
      WHERE("name like{name} || '%'");
      ORDER_BY(orderByColumn);
    }}.toString();
  }
  // 如果使用 @Param，就可以只定义需要使用的参数
  public static String buildGetUsersByName(@Param("orderByColumn") final String orderByColumn) {
    return new SQL(){
     {
      SELECT("*");
      FROM("users");
      WHERE("name like{name} || '%'");
      ORDER_BY(orderByColumn);
    }}.toString();
  }
}
```

此示例显示使用全局配置（自 3.5.6 起可用）将 sql 提供程序类共享给所有映射器方法的用法：

```java
Configuration configuration = new Configuration();
configuration.setDefaultSqlProviderType(TemplateFilePathProvider.class); // 指定一个 sql 提供程序类以在所有映射器方法上共享
// ...
```

```java
 // 可以省略 sql 提供程序注释上的类型/值属性
 // 如果省略，MyBatis 将应用 defaultSqlProviderType 上指定的类。
public interface UserMapper {
  @SelectProvider // Same with @SelectProvider(TemplateFilePathProvider.class)
  User findUser(int id);
  @InsertProvider // Same with @InsertProvider(TemplateFilePathProvider.class)
  void createUser(User user);
  @UpdateProvider // Same with @UpdateProvider(TemplateFilePathProvider.class)
  void updateUser(User user);
  @DeleteProvider // Same with @DeleteProvider(TemplateFilePathProvider.class)
  void deleteUser(int id);
}
```

以下例子展示了 ProviderMethodResolver（3.5.1 后可用）的默认实现使用方法：

```java
@SelectProvider(UserSqlProvider.class)
List<User> getUsersByName(String name);
// 在你的 provider 类中实现 ProviderMethodResolver 接口
class UserSqlProvider implements ProviderMethodResolver {
  // 默认实现中，会将映射器方法的调用解析到实现的同名方法上
  public static String getUsersByName(final String name) {
    return new SQL(){
     {
      SELECT("*");
      FROM("users");
      if (name != null) {
        WHERE("name like{value} || '%'");
      }
      ORDER_BY("id");
    }}.toString();
  }
}
```

此示例显示了语句注释上的 databaseId 属性的用法（自 3.5.5 起可用）：

```java
@Select(value = "SELECT SYS_GUID() FROM dual", databaseId = "oracle") // Use this statement if DatabaseIdProvider provide "oracle"
@Select(value = "SELECT uuid_generate_v4()", databaseId = "postgres") // Use this statement if DatabaseIdProvider provide "postgres"
@Select("SELECT RANDOM_UUID()") // Use this statement if the DatabaseIdProvider not configured or not matches databaseId
String generateId();
```
