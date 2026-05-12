# 25、Spring Boot 3.x Data(七)-Spring Data JDBC开发指南
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/25.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Java世界中用于关系数据库的主要持久性API当然是JPA，它有自己的Spring Data模块。为什么会有另一个?

JPA做了很多事情来帮助开发人员。此外，它还可以跟踪实体的变化。 它为你做了懒加载加载。它允许你将广泛的对象构造映射到同样广泛的数据库设计。

这非常好，让很多事情变得很简单。只需看一看基本的JPA教程。但是，为什么JPA要做某件事情，这常常让人感到困惑。此外，使用JPA，概念上非常简单的事情变得相当困难。

通过包含以下设计决策，Spring Data JDBC的目标是在概念上更简单:

- 如果加载一个实体，就会运行SQL语句。完成此操作后，你将拥有一个完全加载的实体。没有懒加载加载或缓存完成。
- 如果你保存了一个实体，它就会被保存。如果你不这样做，它就不会。没有肮脏的跟踪，也没有会话。
- 有一个如何将实体映射到表的简单模型。它可能只适用于相当简单的情况。如果你不喜欢这样，你可以编写自己的策略。Spring Data JDBC只提供非常有限的支持来定制带有注解的策略。

## 一、DDD和关系型数据库

所有Spring Data模块的灵感都来自于领域驱动设计中的“Repository”、“聚合”和“聚合根”概念。 这些对于Spring Data JDBC可能更为重要， 因为在某种程度上，它们与使用关系数据库时的正常实践相反。

聚合是一组实体，保证对其进行的原子性更改之间保持一致。一个经典的例子是带有`OrderItems`的`Order`。 `Order`上的属性(例如，`numberOfItems`与`OrderItems`的实际数量一致)在进行更改时保持一致。

跨聚合的引用不保证在任何时候都是一致的。它们最终会保持一致。

每个聚合恰好有一个聚合根，它是聚合的实体之一。聚合只通过聚合根上的方法进行操作。这些是前面提到的原子变化。

`Repository`是对持久性存储的抽象，它看起来像某种类型的所有聚合的集合。 对于Spring Data来说，这意味着你希望每个聚合根有一个`Repository`。此外，对于Spring Data JDBC，这意味着从聚合根可达的所有实体都被认为是该聚合根的一部分。 Spring Data JDBC假设聚合只有有一个外键指向存储该聚合的非根实体的表，并且没有其他实体指向非根实体。

> 在当前实现中，从聚合根引用的实体被Spring Data JDBC删除并重新创建。

你可以使用符合你的数据库工作和设计风格的实现来覆盖存储库方法。

## 二、快速开始

### 1.数据准备

```java
DROP TABLE IF EXISTS blog;
CREATE TABLE blog (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  content varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  title varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

### 2.新建Spring Boot项目引入依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jdbc</artifactId>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
```

### 3.创建聚合对象

```java
public class Blog {
    @Id
    private Integer id;
    private String title;
    private String content;
    //get set
    }
```

### 4.创建Repository

```java
public interface BlogRepository extends CrudRepository<Blog,Integer> {
}
```

### 5.配置激活

> Spring Data JDBC存储库支持可以通过Java配置通过注释激活，如下示例所示:

```java
//@EnableJdbcRepositories创建来自Repository的接口实现                          
class ApplicationConfig extends AbstractJdbcConfiguration
{
      //AbstractJdbcConfiguration提供Spring Data JDBC所需的各种缺省bean             
    //创建Spring Data JDBC用于访问数据库的NamedParameterJdbcOperations。
    @Bean
    NamedParameterJdbcOperations namedParameterJdbcOperations(DataSource dataSource) {
        return new NamedParameterJdbcTemplate(dataSource);
    }
    // Spring Data JDBC利用了Spring JDBC提供的事务管理。
    @Bean
    TransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    } } 
```

这个配置可以通过使用Spring Boot进一步简化。使用Spring Boot,一旦`spring-boot-starter-data-jdbc`包含在依赖项中，只需要配置数据源。其他一切都由Spring Boot自动完成。

**数据源配置：**

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
logging:
  level:
    org.springframework.jdbc.core.NamedParameterJdbcTemplate: DEBUG
```

### 6.测试

```java
@Bean
public CommandLineRunner testBlog(BlogRepository blogRepository) {
    return args -> {
        Blog blog = new Blog();
        blog.setTitle("jdbc教程");
        blog.setContent("jdbc内容");
        logger.info("保存聚合blog");
        Blog dbBlog = blogRepository.save(blog);
        logger.info("blog:" + blogRepository.findById(dbBlog.getId()).toString());
    };
}
```

## 三、持久化实体

可以使用CrudRepository.save(…)方法来保存一个聚合。 如果聚合是新的，这将导致插入聚合根。然后是所有直接或间接引用的实体的插入。

如果聚合根不是新的，所有被引用的实体将被删除，聚合根将被更新，所有被引用的实体将再次被插入。请注意，一个实例是否是新实例是该实例状态的一部分。(`聚合根引用的实体先删除后插入`)。

> 这种方法有一些明显的缺点。如果实际更改的引用实体很少，那么删除和插入是浪费时间的。虽然这个过程可以而且很可能会得到改进，但是Spring Data JDBC所能提供的东西有一定的局限性。它不知道聚合的前一个状态。任何更新过程总是需要获取它在数据库中找到的任何东西并确保它将它转换成传递给保存方法的实体的状态。

### 对象映射原理

Spring Data对象映射的核心职责是创建领域对象的实例，并将原生数据库结构映射到这些实例上。这意味着我们需要两个基本步骤:

**1、** 使用一个公开的构造函数创建实例；

**2、** 实例属性的填充；

#### 对象创建

Spring Data会自动尝试检测一个持久化实体的构造函数，该构造函数用于实例化该类型的对象。解析算法的工作原理如下:

**1、** 如果只有有一个带@PersistenceCreator注释的静态工厂方法，那么就使用它；

**2、** 如果只有有一个构造函数，则使用它；

**3、** 如果有多个构造函数，并且只有一个带有@PersistenceCreator注释，那么就使用它；

**4、** 如果存在无参数构造函数，则使用它其他构造函数将被忽略；

内部实现机制:

为了避免反射的开销，Spring Data对象创建使用默认情况下在运行时生成的工厂类，该工厂类将直接调用域类构造函数。例如，对于这个示例类型:

```java
class Person {
  Person(String firstname, String lastname) {
      … }
}
```

将在运行时创建一个与此语义等价的工厂类:

```java
class PersonObjectInstantiator implements ObjectInstantiator {
  Object newInstance(Object... args) {
    return new Person((String) args[0], (String) args[1]);
  }
}
```

这样大约10%的性能提升。为了让实体类有资格进行这样的优化，它需要遵守一组约束:

- 它不能是私有类
- 它不能是一个非静态内部类
- 它不能是CGLib代理类
- Spring Data使用的构造函数不能是私有的

#### 属性值填充

一旦创建了实体的实例，Spring Data就会填充该类的所有剩余持久属性。除非已经被实体的构造函数填充(即通过其构造函数参数列表消耗)，否则`identifier`属性将首先被填充，以便解析循环对象引用。在此之后，构造函数尚未填充的所有非瞬态属性都将在实体实例上设置。为此，我们使用以下算法:

**1、** 如果属性是不可变的，但是暴露了一个`with…`方法(见下文)，我们使用`with…`方法来创建一个具有新属性值的新实体实例；

**2、** 如果定义了属性访问(即通过`getter`和`setter`进行访问)，则调用`setter`方法；

**3、** 如果属性是可变的，则直接设置字段；

**4、** 如果属性是不可变的，则使用持久化操作(参见对象创建)使用的构造函数来创建实例的副本；

**5、** 默认情况下，我们直接设置字段值；

属性填充内部原理：

与对象构造中的优化类似，也使用Spring Data运行时生成的访问器类来与实体实例交互。

```java
class Person {
  private final Long id;
  private String firstname;
  //使用属性访问
  private @AccessType(Type.PROPERTY) String lastname;
  Person() {
    this.id = null;
  }
  Person(Long id, String firstname, String lastname) {
    // Field assignments
  }
  Person withId(Long id) {
    return new Person(id, this.firstname, this.lastame);
  }
  void setLastname(String lastname) {
    this.lastname = lastname;
  }
}
```

运行时生成的属性访问器：

```java
class PersonPropertyAccessor implements PersistentPropertyAccessor {
  //默认情况下，Spring Data使用字段访问来读写属性值。根据私有字段的可见性规则，MethodHandles用于与字段交互。
  private static final MethodHandle firstname;              
  //PropertyAccessor持有底层对象的一个可变实例。也就是说，允许对其他不可变的属性进行突变。
  private Person person;                                    
  public void setProperty(PersistentProperty property, Object value) {
    String name = property.getName();
    if ("firstname".equals(name)) {
      firstname.invoke(person, (String) value);             
    } else if ("id".equals(name)) {
    //这个类公开了一个withId(…)方法，用于设置标识符，例如，当一个实例被插入到数据存储中并且标识符已经生成时。调用withId(…)将创建一个新的Person对象。所有后续的突变都将在新实例中发生，而不影响前一个实例。
      this.person = person.withId((Long) value);            
    } else if ("lastname".equals(name)) {
    // 使用属性访问允许直接方法调用，而无需使用方法句柄。
      this.person.setLastname((String) value);              
    }
  }
}
```

这带来了大约25%的性能提升。为了让实体类有资格进行这样的优化，它需要遵守一组约束:

**1、** 字段类型必须在java包下或不能位于默认值中；

**2、** 字段类型和构造函数必须是公开的(`public`)的；

**3、** 字段类型是内部类的必须是静态的(`static`)；

**4、** 使用的`JavaRuntime`必须允许在原始类加载器中声明类`Java9`和更新版本会有一些限制；

默认情况下，Spring Data尝试使用生成的属性访问器，如果检测到限制，则返回到基于反射的访问器。

考虑以下例子：

```java
class Person {
  /**
   id属性是final，但在构造函数中被设置为空。 这个类公开了一个withId(…)方法，用于设置标识符，例如，当一个实例被插入到数据存储中并且id已经生成时。 在创建新的Person实例时，原始的Person实例保持不变。
  **/
  private final @Id Long id;    
  //firstname和lastname属性是普通的不可变属性，通过getter公开。                                            
  private final String firstname, lastname;                                 
  private final LocalDate birthday;
  //age属性是不可变的，但派生自birthday属性。
  private final int age;                                                    
  //comment属性是可变的，通过直接设置它的字段来填充。
  private String comment;                     
  // remark属性是可变的，可以通过直接设置注释字段或调用setter方法来填充                              
  private @AccessType(Type.PROPERTY) String remarks;                        
  static Person of(String firstname, String lastname, LocalDate birthday) {
    return new Person(null, firstname, lastname, birthday,
      Period.between(birthday, LocalDate.now()).getYears());
  }
  /**
  *该类公开用于创建对象的工厂方法和构造函数。 这里的核心思想是使用工厂方法而不是其他构造函数，以避免通过@PersistenceCreator消除构造函数的歧义。 相反，属性的默认值是在工厂方法中处理的。 如果你希望Spring Data使用工厂方法进行对象实例化，请使用@PersistenceCreator对其进行注释。
  **/
  Person(Long id, String firstname, String lastname, LocalDate birthday, int age) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.birthday = birthday;
    this.age = age;
  }
  Person withId(Long id) {
    return new Person(id, this.firstname, this.lastname, this.birthday, this.age);
  }
  void setRemarks(String remarks) {
    this.remarks = remarks;
  }
}
```

**建议：**

**1、** 尝试坚持使用不可变对象；

**2、** 提供一个全参数构造函数；

**3、** 使用工厂方法而不是重载构造函数来避免`@PersistenceCreator`；

**4、** 请确保遵守允许使用生成的实例化器和属性访问器类的约束；

**5、** 用于生成的`id`，仍然使用`final`字段与全参数持久化构造函数(首选)或`with...`方法；

**6、** 使用Lombok来避免样板代码(`@AllArgsConstructor`)；

#### 属性覆盖

Java允许灵活地设计领域类，其中子类可以定义一个属性，该属性已经在其超类中声明了相同的名称。考虑下面的例子:

```java
public class SuperType {
   private CharSequence field;
   public SuperType(CharSequence field) {
      this.field = field;
   }
   public CharSequence getField() {
      return this.field;
   }
   public void setField(CharSequence field) {
      this.field = field;
   }
}
public class SubType extends SuperType {
   private String field;
   public SubType(String field) {
      super(field);
      this.field = field;
   }
   @Override
   public String getField() {
      return this.field;
   }
   public void setField(String field) {
      this.field = field;
      // optional
      super.setField(field);
   }
}
```

这两个类都使用可赋值类型定义字段。但是`SubType`会遮蔽`SuperType.field`。根据类的设计，使用构造函数可能是设置`SuperType.field`的唯一默认方法。或者，在`setter`中调用`super.setField(…)`可以在`SuperType`中设置字段。所有这些机制都会在某种程度上产生冲突，因为属性具有相同的名称，但可能代表两个不同的值。如果类型不可赋值，Spring Data将跳过超类型属性。也就是说，被重写属性的类型必须可分配给其要注册为重写的超类型属性类型，否则超类型属性被认为是瞬态的。我们通常建议使用不同的属性名。

Spring Data模块通常支持包含不同值的重写属性。从编程模型的角度来看，需要考虑以下几点:

**1、** 应该持久化哪个属性(默认为所有声明的属性)你可以通过使用`@Transient`注解这些属性来排除它们；

**2、** 如何表示数据存储中的属性?对于不同的值使用相同的`field/column`通常会破坏数据因此应该使用显式`field/column`注解至少一个属性；

**3、** 不能使用`@AccessType(PROPERTY)`，因为如果不对`setter`实现做出任何进一步的假设，通常无法设置超级属性；

### 实体中支持的类型

目前支持以下类型的属性:

**1、** 所有原始类型及其装箱类型（int、float、Integer、Float等）；

**2、** Enums映射的名称；

**3、** String；

**4、** java.util.Date,java.time.LocalDate,java.time.LocalDateTime,andjava.time.LocalTime；

**5、** 如果你的数据库支持，上述类型的数组和集合可以映射到数组类型的列；

**6、** 你的数据库驱动程序接受的任何内容；

**7、** 对其他实体的引用它们被认为是一对一的关系或嵌入式类型一对一关系实体具有id属性是可选的被引用实体的表应该有一个与引用实体的`表同名的附加列`你可以通过实现`NamingStrategy.getReverseColumnName(PersistentPropertyPathExtensionpath)`来更改此名称嵌入式实体不需要`id`如果存在一个，它将被忽略；

**8、** Set被认为是一对多的关系被引用实体的表应该有一个与引用实体的表同名的附加列你可以通过实现`NamingStrategy.getReverseColumnName(PersistentPropertyPathExtensionpath)`来更改此名称；

**9、**`Map`被认为是一对多关系被引用实体的表应该有两个额外的列：一个与引用`实体的表命名相同的外键`，另一个具有相同的名称和一个附加的`_key后缀作为映射键`你可以通过分别实现`NamingStrategy.getReverseColumnName(PersistentPropertyPathExtensionpath)和NamingStrategy.getKeyColumn(RelationalPersistentPropertyproperty)`来更改此行为或者，你可以使用`@MappedCollection(idColumn="your_column_name",keyColumn="your_key_column_name")`注解属性；

**10、**`List`等价于`Map`；

引用实体的处理是有限的。这是基于上述聚合根的思想。如果你引用另一个实体，则根据定义，该实体是你的聚合的一部分。因此，如果你删除引用，则先前引用的实体将被删除。这也意味着引用是 `1-1` 或 `1-n`，但不是 `n-1` 或 `n-m`。

如果你有 `n-1` 或 `n-m` 个引用，根据定义，你将处理两个单独的聚合。它们之间的引用可以编码为简单的 `id` 值，这些值与 Spring Data JDBC 正确映射。对这些进行编码的更好方法是使它们成为 `AggregateReference` 的实例。 `AggregateReference` 是 `id` 值的包装器，它将该值标记为对不同聚合的引用。此外，该聚合的类型被编码在类型参数中。

```java
class Person {
	@Id long id;
	AggregateReference<Person, Long> bestFriend;
}
// ...
Person p1, p2 = // some initialization
p1.bestFriend = AggregateReference.to(p2.id);
```

### 自定义表名

当`NamingStrategy`与你的数据库表名不匹配时，你可以使用`@Table`注解自定义名称。该注解的元素值提供了自定义表名。下面的例子将`MyEntity`类映射到数据库中的`CUSTOM_TABLE_NAME`表:

```java
@Table("CUSTOM_TABLE_NAME")
class MyEntity {
    @Id
    Integer id;
    String name;
}
```

### 自定义列名

当`NamingStrategy`与你的数据库列名不匹配时，你可以使用`@Column`注解自定义名称。该注解的元素值提供了自定义列名。下面的例子将`MyEntity`类的`name`属性映射到数据库中的`CUSTOM_COLUMN_NAME`列:

```java
class MyEntity {
    @Id
    Integer id;
    @Column("CUSTOM_COLUMN_NAME")
    String name;
}
```

`@MappedCollection` 注解可用于引用类型（一对一关系）或 `Set`、`Lists` 和 `Maps`（一对多关系）。注解的 `idColumn` 元素为引用另一个表中的 `id` 列的外键列提供自定义名称。在以下示例中，`MySubEntity` 类的对应表有一个 `NAME` 列，以及出于关系原因的 `MyEntity id` 的 `CUSTOM_MY_ENTITY_ID_COLUMN_NAME` 列：

```java
class MyEntity {
    @Id
    Integer id;
    @MappedCollection(idColumn = "CUSTOM_MY_ENTITY_ID_COLUMN_NAME")
    Set<MySubEntity> subEntities;
}
//此表需要字段 CUSTOM_MY_ENTITY_ID_COLUMN_NAME
class MySubEntity {
    String name;
}
```

在使用列表和映射时，必须有一个附加列，用于表示数据集在列表中的位置或映射中的实体的键值。这个额外的列名可以通过`@MappedCollection`注解的`keyColumn`元素来定制:

```java
class MyEntity {
    @Id
    Integer id;
    @MappedCollection(idColumn = "CUSTOM_COLUMN_NAME", keyColumn = "CUSTOM_KEY_COLUMN_NAME")
    List<MySubEntity> name;
}
//需要额外提供2个字段 CUSTOM_COLUMN_NAME  CUSTOM_KEY_COLUMN_NAME
class MySubEntity {
    String name;
}
```

### 嵌入式实体

嵌入式实体用于在你的 java 数据模型中具有值对象，即使你的数据库中只有一个表。在下面的示例中，你会看到，`MyEntity` 使用 `@Embedded` 注释进行映射。这样做的结果是，在数据库中需要一个具有两列 `id` 和 `name`（来自 `EmbeddedEntity` 类）的表 `my_entity`。

但是，如果结果集中`name`列实际上为`null`，则根据`@Embedded`的`onEmpty`将整个属性embeddedEntity设置为`null`，当所有嵌套属性都为`null`时，它会将对象清空。

与此行为相反，`USE_EMPTY` 尝试使用默认构造函数或从结果集中接受可为空参数值的构造函数来创建新实例。

```java
class MyEntity {
    @Id
    Integer id;
    //如果名称为空，则为空嵌入实体。
//使用 USE_EMPTY 以 name 属性的潜在 null 值实例化 embeddedEntity。
    @Embedded(onEmpty = USE_NULL) 
    EmbeddedEntity embeddedEntity;
}
class EmbeddedEntity {
    String name;
}
```

如果你需要在一个实体中多次使用一个值对象，可以使用`@Embedded(prefix=xxxx)`注解的可选前缀元素来实现。该元素表示一个前缀，并在嵌入对象的每个列名的前面。

> 使用 @Embedded(onEmpty = USE_NULL) 和 @Embedded(onEmpty = USE_EMPTY) 的快捷方式 @Embedded.Nullable 和 @Embedded.Empty 来减少冗长并同时相应地设置 JSR-305 @javax.annotation.Nonnull。

```java
@Id
Integer id;
//@Embedded(onEmpty = USE_NULL)快捷方式
@Embedded.Nullable 
EmbeddedEntity embeddedEntity; } 
```

包含集合或映射的嵌入式实体将始终被视为非空的，因为它们至少包含空集合或映射。这样的实体将永远不会为空，即使使用`@Embedded(onEmpty = USE_NULL)`。

### 实体状态检测策略

下表描述了 Spring Data 提供的用于检测实体是否为`new`的策略：

属性
描述

@Id-属性 检查 (默认)
默认情况下，Spring Data 检查给定实体的identifier属性。如果在原始类型的情况下标识符属性为 null 或 0，则假定实体是新的。否则，假定它不是新的。

@Version-属性检查
如果使用 @Version 注解的属性存在且为 null，或者在原始类型 0 的版本属性的情况下，实体被认为是新的。如果版本属性存在但具有不同的值，则该实体被认为不是新的。如果不存在版本属性，则 Spring Data 回退到对identifier属性的检查。

实现Persistable
如果一个实体实现了 Persistable，Spring Data 将新的检测委托给实体的 isNew(…) 方法。注意：如果你使用 AccessType.PROPERTY，Persistable 的属性将被检测并持久化。为避免这种情况，请使用@Transient。

提供自定义 EntityInformation 实现
你可以通过创建模块特定存储库工厂的子类并覆盖 getEntityInformation(...) 方法来自定义存储库基础实现中使用的 EntityInformation 抽象。然后，你必须将模块特定存储库工厂的自定义实现注册为 Spring bean。请注意，这应该很少需要。

### ID生成

Spring Data JDBC 使用 `ID` 来识别实体。实体的 `ID` 必须使用 Spring Data 的 `@Id` 注解。

当你的数据库具有 `ID` 列的`自动增量列`时，生成的值会在将其插入数据库后在实体中设置。

一个重要的约束是，在保存实体后，该实体不能再是新的。请注意，实体是否是新实体是实体状态的一部分。对于自动增量列，这会自动发生，因为 `ID` 是由 Spring Data 使用 `ID` 列中的值设置的。如果你不使用自动增量列，则可以使用 `BeforeConvert` 侦听器，该侦听器设置实体的 `ID`。

### 乐观锁机制

Spring Data JDBC 通过在聚合根上用 `@Version` 注解的`数字属性`支持`乐观锁`。每当 Spring Data JDBC 保存具有此类版本属性的聚合时，会发生两件事：聚合根的更新语句将包含 `where` 子句，检查存储在数据库中的版本是否实际未更改。如果不是这种情况，将抛出 `OptimisticLockingFailureException`。此外，实体和数据库中的版本属性都会增加，因此并发操作会注意到更改并在适用的情况下抛出 `OptimisticLockingFailureException`，如上所述。

这个过程也适用于插入新的聚合，其中 `null` 或 `0` 版本表示一个新实例，然后增加的实例将实例标记为不再是新的，这使得这个在对象构造期间生成 `id` 的非常有利，例如当使用 `UUID`。

在删除期间，版本检查也适用，但不增加版本。

## 四、生命周期事件

Spring Data JDBC 触发事件，这些事件被发布到应用程序上下文中的任何匹配的 `ApplicationListener bean`。例如，在保存聚合之前调用以下侦听器：

```java
@Bean
ApplicationListener<BeforeSaveEvent<Object>> loggingSaves() {
	return event -> {
		Object entity = event.getEntity();
		LOG.info("{} is getting saved.", entity);
	};
}
```

如果你只想处理特定域类型的事件，你可以从 `AbstractRelationalEventListener` 派生你的侦听器并覆盖一个或多个 `onXXX` 方法，其中 `XXX` 代表事件类型。回调方法只会被与域类型及其子类型相关的事件调用，因此你不需要进一步转换。

```java
class PersonLoadListener extends AbstractRelationalEventListener<Person> {
	@Override
	protected void onAfterLoad(AfterLoadEvent<Person> personLoad) {
		LOG.info(personLoad.getEntity());
	}
}
```

下表描述了可用的事件：

事件
何时发布

BeforeDeleteEvent
在聚合根被删除之前

AfterDeleteEvent
在聚合根被删除之后

BeforeConvertEvent
在聚合根被转换为执行 SQL 语句的计划之前，但在决定聚合是否是新的之后，即是否按顺序进行更新或插入。如果你想以编程方式设置 id，这是正确的事件。

BeforeSaveEvent
在保存聚合根之前（即插入或更新，但在决定是否插入或更新之后）。

AfterSaveEvent
在保存聚合根之后（即插入或更新）。

AfterLoadEvent
在从数据库 ResultSet 创建聚合根并设置其所有属性之后。注意：这已被弃用。改用 AfterConvert

AfterConvertEvent
在从数据库 ResultSet 创建聚合根并设置其所有属性之后。

> 生命周期事件依赖于 ApplicationEventMulticaster，在 SimpleApplicationEventMulticaster 的情况下，可以使用 TaskExecutor 进行配置，因此不能保证何时处理 Event。

## 五、 Entity Callbacks

Spring Data基础设施提供了钩子，用于在调用某些方法之前和之后修改实体。这些所谓的`EntityCallback`实例提供了一种方便的方式，以回调风格检查和修改实体。

`EntityCallback` 看起来很像专门的 `ApplicationListener`。一些 Spring Data 模块发布允许修改给定实体的存储特定事件（例如 `BeforeSaveEvent`）。在某些情况下，例如在使用不可变类型时，这些事件可能会导致麻烦。此外，事件发布依赖于 `ApplicationEventMulticaster`。如果使用异步 `TaskExecutor` 对其进行配置，则可能会导致不可预知的结果，因为事件处理可以分叉到线程上。

实体回调提供具有同步和响应式`API`的集成点，以保证在处理链内定义良好的检查点上有序执行，返回可能修改的实体或响应式包装器类型。实体回调通常由`API`类型分隔。这种分离意味着同步`API`只考虑同步实体回调，而响应性实现只考虑响应性实体回调。

> 在Spring Data Commons 2.2中引入了实体回调API。这是应用实体修改的推荐方式。现有的特定于存储的ApplicationEvents仍然在调用可能注册的EntityCallback实例之前发布。

### 实现 Entity Callbacks

`EntityCallback`通过它的泛型类型参数直接与它的域类型关联。每个Spring Data模块通常附带一组预定义的涵盖实体生命周期的`EntityCallback`接口。

```java
@FunctionalInterface
public interface BeforeSaveCallback<T> extends EntityCallback<T> {
	/**
	 * Entity callback method invoked before a domain object is saved.
	 * Can return either the same or a modified instance.
	 *
	 * @return the domain object to be persisted.
	 */
	T onBeforeSave(T entity <2>, String collection <3>); 
}
```

**1、** 在保存实体之前要调用的`BeforeSaveCallback`特定方法；

**2、** 返回一个可能修改过的实例；

**3、** 在持久化之前的实体；

```java
class DefaultingEntityCallback implements BeforeSaveCallback<Person>, Ordered {
     //回调实现 根据实际情况
	@Override
	public Object onBeforeSave(Person entity, String collection) {
		if(collection == "user") {
		    return // ...
		}
		return // ...
	}
   // 如果同一域类型存在多个实体回调，则可能对实体回调进行排序。顺序遵循最低优先级。
	@Override
	public int getOrder() {
		return 100;                                                                  
	}
}
```

### 注册Entity Callbacks

EntityCallback bean 由存储特定实现绑定，以防它们在 `ApplicationContext` 中注册。大多数模板 API 已经实现 `ApplicationContextAware`，因此可以访问 `ApplicationContext`。

下面的例子解释了一个有效的实体回调注册集合:

```java
@Order(1)  //注解排序                                                         
@Component
class First implements BeforeSaveCallback<Person> {
	@Override
	public Person onBeforeSave(Person person) {
		return // ...
	}
}
@Component
class DefaultingEntityCallback implements BeforeSaveCallback<Person>,
                                                           Ordered {
      //实现ordered接口排序
	@Override
	public Object onBeforeSave(Person entity, String collection) {
		// ...
	}
	@Override
	public int getOrder() {
		return 100;                                                  
	}
}
@Configuration
public class EntityCallbackConfiguration {
/**
*beforeavecallback使用lambda表达式。默认为无序，最后调用。请注意，由lambda表达式实现的回调不会公开类型信息，因此用不可分配的实体调用这些信息会影响回调吞吐量。使用类或枚举为回调bean启用类型过滤。
**/
    @Bean
    BeforeSaveCallback<Person> unorderedLambdaReceiverCallback() {
        return (BeforeSaveCallback<Person>) it -> // ...
    }
}
//在一个实现类中组合多个实体回调接口。
@Component
class UserCallbacks implements BeforeConvertCallback<User>,
                                        BeforeSaveCallback<User> {
	@Override
	public Person onBeforeConvert(User user) {
		return // ...
	}
	@Override
	public Person onBeforeSave(User user) {
		return // ...
	}
}
```

### 可用的EntityCallback

EntityCallback
什么时候发布

BeforeDeleteCallback
在聚合根被删除之前

AfterDeleteCallback
在聚合根被删除之后

BeforeConvertCallback
在聚合根被转换为执行SQL语句的计划之前，但在决定聚合是新的还是新的之后，即，如果更新或插入是有序的。如果你想以编程方式设置id，这是正确的回调。

BeforeSaveCallback
在保存聚合根之前(即插入或更新，但在决定是否插入或更新它之后)。

AfterSaveCallback
在保存聚合根(即插入或更新)之后。

AfterLoadCallback
从数据库中创建一个聚合根后，ResultSet和它的所有属性都得到设置。这已被弃用，请使用AfterConvertCallback

AfterConvertCallback
从数据库中创建一个聚合根后，ResultSet和它的所有属性都得到设置

## 自定义类型转换

Spring Data JDBC允许注册自定义转换器，以影响在数据库中映射值的方式。目前，转换器仅应用于属性级。

### 注册Spring Converter写属性

下面的例子展示了一个`Converter`的实现，它可以将`Boolean`对象转换为`String`值:

```java
import org.springframework.core.convert.converter.Converter;
@WritingConverter
public class BooleanToStringConverter implements Converter<Boolean, String> {
    @Override
    public String convert(Boolean source) {
        return source != null && source ? "T" : "F";
    }
}
```

注意:`Boolean`和`String`都是简单类型，因此Spring Data需要提示这个转换器应该应用于读还是写。通过使用`@WritingConverter`注解这个转换器，指示Spring Data将每个Boolean属性写入数据库中的`String`。

### 通过转换器读取属性

下面的例子展示了一个`Converter`的实现，它可以将字符串转换为布尔值:

```java
@ReadingConverter
public class StringToBooleanConverter implements Converter<String, Boolean> {
    @Override
    public Boolean convert(String source) {
        return source != null && source.equalsIgnoreCase("T") ? Boolean.TRUE : Boolean.FALSE;
    }
}
```

通过使用`@ReadingConverter` 注解这个转换器，Spring Data将数据库中的每个`String`值转换为一个`Boolean`属性。

### 用JdbcConverter注册Spring converter

```java
class MyJdbcConfiguration extends AbstractJdbcConfiguration {
    // …
	@Override
    protected List<?> userConverters() {
		return Arrays.asList(new BooleanToStringConverter(), new StringToBooleanConverter());
	}
}
```

### JdbcValue

值转换使用`JdbcValue`来丰富`java.sql.Types`类型转换为`JDBC`操作。如果需要指定特定于`jdbc`的类型而不是使用类型派生，则注册自定义写转换器。 这个转换器应该将值转换为`JdbcValue`，它有一个字段用于值和实际的`JDBCType`。

下面是一个Spring Converter实现的例子，它将一个字符串转换为一个自定义的`Email`值对象:

```java
@ReadingConverter
public class EmailReadConverter implements Converter<String, Email> {
  public Email convert(String source) {
    return Email.valueOf(source);
  }
}
```

如果你编写的`Converter`的源类型和目标类型都是原生类型(`Converter`)，则无法确定应该将其视为读转换器还是写转换器。将转换器实例注册为两种类型可能会导致不想要的结果。例如，`Converter`是不明确的，尽管在编写时尝试将所有`String`实例转换为`Long`实例可能没有意义。

为了让你强制基础架构只以一种方式注册转换器，我们提供了`@ReadingConverter`和`@WritingConverter`注释，用于转换器实现。

转换器必须进行显式注册，因为不会从类路径或容器扫描中获取实例，以避免对转换服务进行不必要的注册，以及这种注册产生的副作用。转换器在`CustomConversions`中注册，作为允许根据源和目标类型注册和查询已注册转换器的中心工具。

`CustomConversions`提供了一组预定义的转换器注册:

`JSR-310 Converters` 用于`java.time`、`java.util.Date`和`String`类型之间的转换。

### Converter歧义

通常，我们检查`Converter`实现，看看它们转换的`源类型`和`目标类型`。根据其中一种类型是否是底层数据访问`API`可以数据库本地处理的类型，我们将转换器实例注册为读或写转换器。下面的例子展示了一个写转换器和一个读转换器(注意区别在于转换器上限定符的顺序):

```java
//  写入转换器，因为只有目标类型是数据库可以本地处理的类型@WritingConverter
class MyConverter implements Converter<Person, String> {
      … }
// 读取转换器，因为只有源类型是可以本地处理的 @ReadingConverter
class MyConverter implements Converter<String, Person> {
      … }
```

## 六、日志

Spring Data JDBC本身几乎不做日志记录。相反，`JdbcTemplate`发出`SQL`语句的机制提供了日志记录。因此，如果你想检查哪些`SQL`语句正在运行，激活`Spring`的`NamedParameterJdbcTemplate`或`MyBatis`的日志记录。

```java
logging:
  level:
    org.springframework.jdbc.core.JdbcTemplate: DEBUG
```

## 七、 事物

默认情况下，`CrudRepository`实例的方法是事务性的。对于读取操作，事务配置`readOnly`标志设置为`true`。所有其他事务都配置了普通的`@Transactional`注释，以便应用默认的事务配置。

用于`CRUD`的自定义事务配置：

```java
interface UserRepository extends CrudRepository<User, Long> {
  @Override
  @Transactional(timeout = 10)
  List<User> findAll();
  // Further query method declarations
}
```

前面的代码导致`findAll()`方法运行超时时间为`10`秒，并且没有`readOnly`标志。

改变事务行为的另一种方法是使用通常覆盖多个`Repository`的`facade`或服务实现。其目的是为非`crud`操作定义事务边界。下面的例子展示了如何创建这样的`facade`:

```java
@Service
public class UserManagementImpl implements UserManagement {
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  UserManagementImpl(UserRepository userRepository,
    RoleRepository roleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }
  @Transactional
  public void addRoleToAllUsers(String roleName) {
    Role role = roleRepository.findByName(roleName);
    for (User user : userRepository.findAll()) {
      user.addRole(role);
      userRepository.save(user);
    }
}
```

上面的示例导致在事务中运行对`addRoleToAllUsers(…)`的调用。`Repository`的事务配置被忽略，因为外部事务配置决定了要使用的实际`Repository`。请注意，你必须显式激活``或使用`@EnableTransactionManagement`来获得基于注解的配置，以便`facade`工作。注意，前面的示例假设使用组件扫描。

### 事物Query方法

要让你的`Query`方法具有事务性，请在定义的`Repository`接口中使用`@Transactional`，如下面的示例所示:

```java
@Transactional(readOnly = true)
interface UserRepository extends CrudRepository<User, Long> {
  List<User> findByLastname(String lastname);
  @Modifying
  @Transactional
  @Query("delete from User u where u.active = false")
  void deleteInactiveUsers();
}
```

通常，你希望`readOnly`标志设置为`true`，因为大多数查询方法只读取数据。与此相反，`deleteInactiveUsers()`使用`@Modifying`注解并覆盖事务配置。因此，该方法的`readOnly`标志设置为`false`。

> 强烈建议将查询方法设置为事务性的。为了填充实体，这些方法可能执行多个查询。在没有公共事务的情况下，Spring Data JDBC在不同的连接中执行查询。这可能会给连接池带来过多的压力，甚至可能在多个方法请求一个新的连接时导致死锁。

## 八、 审计

Spring Data提供了复杂的支持，以透明地跟踪谁创建或更改了一个实体，以及更改发生的时间。要从该功能中获益，必须为实体类配备审计元数据，这些元数据可以使用注解或实现接口来定义。此外，必须通过`Annotation`配置或`XML`配置启用审计，以注册所需的基础设施组件。

> 只跟踪创建和修改日期的应用程序不需要指定AuditorAware。

### 基于注解的审计元数据

Spring Data提供`@CreatedBy`和`@LastModifiedBy`来捕获创建或修改实体的用户，同时提供`@CreatedDate`和`@LastModifiedDate`来捕获更改发生的时间。

```java
class Customer {
  @CreatedBy
  private User user;
  @CreatedDate
  private Instant createdDate;
  // … further properties omitted
}
```

正如你所看到的，可以根据希望捕获的信息有选择地应用注解。指示何时进行更改的注解可以用`JDK8`日期和时间类型、`long`、`Long`和遗留Java `Date`和`Calendar`的属性。

审计元数据不一定需要驻留在根级实体中，但可以添加到嵌入的实体中(取决于使用的实际存储)，如下面的代码片段所示:

```java
class Customer {
  private AuditMetadata auditingMetadata;
  // … further properties omitted
}
class AuditMetadata {
  @CreatedBy
  private User user;
  @CreatedDate
  private Instant createdDate;
}
```

### 基于接口的审计元数据

如果不想使用注解来定义审计元数据，可以让实体类实现`Auditable`接口。它为所有审计属性公开`setter`方法。

#### AuditorAware

如果你使用`@CreatedBy`或`@LastModifiedBy`，审计基础结构需要以某种方式了解当前主体。为此，提供了一个`AuditorAware SPI`接口，你必须实现该接口来告诉基础架构当前与应用程序交互的用户或系统是谁。泛型类型`T`定义了带有`@CreatedBy`或`@LastModifiedBy`注解的属性必须是什么类型。

下面的例子展示了使用Spring Security的`Authentication`对象的接口实现:

```java
class SpringSecurityAuditorAware implements AuditorAware<User> {
  @Override
  public Optional<User> getCurrentAuditor() {
    return Optional.ofNullable(SecurityContextHolder.getContext())
            .map(SecurityContext::getAuthentication)
            .filter(Authentication::isAuthenticated)
            .map(Authentication::getPrincipal)
            .map(User.class::cast);
  }
}
```

#### ReactiveAuditorAware

当使用响应式基础架构时，你可能想要利用上下文信息来提供`@CreatedBy`或`@LastModifiedBy`信息。提供了一个`ReactiveAuditorAware SPI`接口，你必须实现该接口来告诉基础架构当前与应用程序交互的用户或系统是谁。泛型类型`T`定义了带有`@CreatedBy`或`@LastModifiedBy`注解的属性必须是什么类型。

```java
class SpringSecurityAuditorAware implements ReactiveAuditorAware<User> {
  @Override
  public Mono<User> getCurrentAuditor() {
    return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getPrincipal)
                .map(User.class::cast);
  }
}
```

### JDBC 审计

为了激活审计，添加`@EnableJdbcAuditing`到你的配置中，如下所示:

```java
@Configuration
@EnableJdbcAuditing
class Config {
  @Bean
  AuditorAware<AuditableUser> auditorProvider() {
    return new AuditorAwareImpl();
  }
}
```

如果你将`AuditorAware`类型的`bean`公开给`ApplicationContext`，审计基础设施将自动获取它并使用它来确定要在域类型上设置的当前用户。如果你在`ApplicationContext`中注册了多个实现，你可以通过显式设置`@EnableJdbcAuditing`的`auditorAwareRef`属性来选择一个要使用的实现。

## 九、 JDBC锁

Spring Data JDBC支持对派生查询方法的锁定。要在`Repository`中启用对给定派生查询方法的锁定，可以使用`@Lock`对其进行注解。`LockMode`类型的必需值提供了两个值:一个是悲观者的`read`，它保证你正在读的数据不会被修改;另一个是悲观者的`write`，它会获得一个修改数据的锁。有些数据库没有做这种区分。在这种情况下，两种模式都相当于悲观写。

```java
interface UserRepository extends CrudRepository<User, Long> {
  @Lock(LockMode.PESSIMISTIC_READ)
  List<User> findByLastname(String lastname);
}
```

正如你在上面看到的，`findByLastname(String lastname)`方法将使用悲观读锁执行。如果你使用的是`MySQL`方言数据库，这将导致如下查询:

```java
Select * from user u where u.lastname = lastname LOCK IN SHARE MODE
```

除了`LockMode.PESSIMISTIC_READ`还有 `LockMode.PESSIMISTIC_WRITE`。
