# 08、MyBatis 源码分析 - type 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/8.html
- 分类：ORM框架
- 分组：教程目录
> MyBatis 在设置预处理语句（PreparedStatement）中的参数或从结果集中取出一个值时， 都会用类型处理器将获取到的值以合适的方式转换成 Java 类型。—— Mybatis 官网

### 类 UML 图

注：由于 BaseTypeHandler 的实现类有很多，所以图中只展示了部分实现类。

可以看到，将包中的类转换为 UML 图以后，看上去就清晰很多。

### 类型处理器

从包名中可知这是和类型相关的包，根据官网的描述，我们可以知道 JDBC 类型和 Java 类型的相互转换就是这个包的主要作用。**因为在 Java 中有 String、Integer 等类型，而在数据库中有 char、varchar、tinyint 等类型，不同类型的的字段所需要的读写方式是不同的，因此需要对不同类型的字段采取相应的处理方式**。

#### TypeHandler

TypeHandler 是所有类型处理器都需要实现的接口。如果要自定义类型处理器的话，也是实现该接口。

```java
public interface TypeHandler<T> {
  // 向 PreparedStatement 中设置参数
  void setParameter(PreparedStatement ps, int i, T parameter, JdbcType jdbcType) throws SQLException;
  // 从结果集中获取结果
  T getResult(ResultSet rs, String columnName) throws SQLException;
  // 从结果集中获取结果
  T getResult(ResultSet rs, int columnIndex) throws SQLException;
  // 从结果集中获取结果
  T getResult(CallableStatement cs, int columnIndex) throws SQLException;
}
```

#### TypeReference

如果在遇到一个 TypeHandler 时，却不知道它到底是用来处理哪一种 Java 类型的处理器时，那么 TypeReference 的作用就出来了。它能判断出一个 TypeHandler 用来处理的目标类型。

```java
Type getSuperclassTypeParameter(Class<?> clazz) {
    Type genericSuperclass = clazz.getGenericSuperclass();
    if (genericSuperclass instanceof Class) {
      // 一直向上查找，直到找到 ParameterizedType
      if (TypeReference.class != genericSuperclass) {
        return getSuperclassTypeParameter(clazz.getSuperclass());
      }
      throw new TypeException("'" + getClass() + "' extends TypeReference but misses the type parameter. "
        + "Remove the extension or add a type parameter to it.");
    }
    Type rawType = ((ParameterizedType) genericSuperclass).getActualTypeArguments()[0];
    if (rawType instanceof ParameterizedType) {
      rawType = ((ParameterizedType) rawType).getRawType();
    }
    return rawType;
  }
```

由于TypeReference 类是 BaseTypeHandler 的父类，因此所有的类型处理器都继承了 TypeReference 的功能。所以都能通过 getSuperclassTypeParameter 得到处理器用来处理的目标类型。

#### BaseTypeHandler

BaseTypeHandler 是 TypeHandler 的基础实现，将每个方法的异常信息进行了封装，在调用 getResult 方法时抛出的都是 ResultMapExcetion，在调用 setParameter 方法时抛出的都是 TypeException，并且将 setParameter 做了基础实现，`parameter = null` 的情况。让子类实现 setNonNullParamter 方法。

### 类型注册表

为了避免在类型转换过程中，快速找到对应的类型处理器，所以就需要使用类型注册表类存储所有类型处理器，并记录它们的映射关系。在 type 包下有三个注册表：`TypeHandlerRegistry`、`SimpleTypeRegistry`、`TypeAliasRegistry`。

#### SimpleTypeRegistry

SimpleTypeRegistry 存储的是简单类型，而且实现也非常简单，通过一个 Set 来存储所有的简单类型，主要用来判断一个类是不是简单类型。

```java
public class SimpleTypeRegistry {
  private static final Set<Class<?>> SIMPLE_TYPE_SET = new HashSet<>();
  static {
    SIMPLE_TYPE_SET.add(String.class);
    SIMPLE_TYPE_SET.add(Byte.class);
    SIMPLE_TYPE_SET.add(Short.class);
    SIMPLE_TYPE_SET.add(Character.class);
    SIMPLE_TYPE_SET.add(Integer.class);
    SIMPLE_TYPE_SET.add(Long.class);
    SIMPLE_TYPE_SET.add(Float.class);
    SIMPLE_TYPE_SET.add(Double.class);
    SIMPLE_TYPE_SET.add(Boolean.class);
    SIMPLE_TYPE_SET.add(Date.class);
    SIMPLE_TYPE_SET.add(Class.class);
    SIMPLE_TYPE_SET.add(BigInteger.class);
    SIMPLE_TYPE_SET.add(BigDecimal.class);
  }
}
```

#### TypeAliasRegistry

TypeAliasRegistry 用来存储类型的别名。因为有了这个注册表，我们可以在很多需要书写类型的地方，改为书写它的别名，使代码看上去更直观更简洁。Mybatis 已经帮我们内置了常用类型的别名。

别名
映射的类型
别名
映射的类型

_byte
byte
double
Double

_long
long
float
Float

_short
short
boolean
Boolean

_int
_integer
int
date
Date

_double
double
decimal
BigDecimal

_float
float
bigdecimal
BigDecimal

_boolean
boolean
object
Object

string
String
map
Map

byte
Byte
hashmap
HashMap

long
Long
list
List

short
Short
arraylist
ArrayList

int
integer
Integer
collection
Collection

iterator
Iterator
…
…

`注`：这只是一部分，完整的可以去 TypeAliasRegistry 中看。

##### 类注册到别名表

下面的代码将类注册到了别名表中，保存在了 `typeAliases` 中。

```java
public void registerAlias(Class<?> type) {
    // 如果类上有 Alias 注解，就将其 value 作为别名
    // 如果没有注解，则将类名(不带包名称)的设置为别名
    String alias = type.getSimpleName();
    Alias aliasAnnotation = type.getAnnotation(Alias.class);
    if (aliasAnnotation != null) {
      alias = aliasAnnotation.value();
    }
    registerAlias(alias, type);
  }
  public void registerAlias(String alias, Class<?> value) {
    if (alias == null) {
      throw new TypeException("The parameter alias cannot be null");
    }
    // 将别名都转换为小写，所以别名都是忽略大小写的
    String key = alias.toLowerCase(Locale.ENGLISH);
    if (typeAliases.containsKey(key) && typeAliases.get(key) != null && !typeAliases.get(key).equals(value)) {
      throw new TypeException("The alias '" + alias + "' is already mapped to the value '" + typeAliases.get(key).getName() + "'.");
    }
    typeAliases.put(key, value);
  }
```

##### 从注册表中获取类

```java
public <T> Class<T> resolveAlias(String string) {
    try {
      if (string == null) {
        return null;
      }
      // 将传入的名称都变为了小写，所以是忽略大小写的，也就是传 user 或者 User 其实都可以找到对应的类
      String key = string.toLowerCase(Locale.ENGLISH);
      Class<T> value;
      if (typeAliases.containsKey(key)) {
        value = (Class<T>) typeAliases.get(key);
      } else {
        // 也可以通过传完整的类名来获取类型
        value = (Class<T>) Resources.classForName(string);
      }
      return value;
    } catch (ClassNotFoundException e) {
      // ...
    }
  }
```

#### TypeHandlerRegistry

TypeHandlerRegistry 是 type 包下最重要的类之一，它记录所有的 TypeHandler 以备使用。

##### 将 TypeHandler 注册到表中

由于注册的途径不同，所以在 TypeHandlerRegistry 中其实有在了很多方法，但是大部分的方法的作用都是适配器，即经过层层的适配，最后将注册的任务交给了最后的一个方法。

可以观察下图可以便于理解。

从图中我们可以知道，最底层的其实就是 `register(Type, JdbcType, TypeHandler)` 方法，所以我们只要重点关注这个方法就好了。

```java
  /**
   * 注册类型处理器到注册表中
   *
   * @param javaType Java 的类型
   * @param jdbcType Jdbc 的类型
   * @param handler  对应的类型处理器
   */
  private void register(Type javaType, JdbcType jdbcType, TypeHandler<?> handler) {
    if (javaType != null) {
      // 如果 JavaType 不为空，则可以进行注册，注册到 typeHandlerMap 中
      // Map<Type, Map<JdbcType, TypeHandler<?>>> 一个Java类型，可以转换到不同的 JDBC 类型，都由对应的类型处理器进行转换
      Map<JdbcType, TypeHandler<?>> map = typeHandlerMap.get(javaType);
      if (map == null || map == NULL_TYPE_HANDLER_MAP) {
        map = new HashMap<>();
      }
      map.put(jdbcType, handler);
      typeHandlerMap.put(javaType, map);
    }
    allTypeHandlersMap.put(handler.getClass(), handler);
  }
```

#### MappedTypes 和 MappedJdbcTypes

Mybatis 给我们内置了很多的 TypeHandler，但是在写业务代码的过程中，可能你还需要自定义 TypeHanlder，那么 `MappedTypes` 和 `MappedJdbcTypes` 的作用就来了。

MappedTypes 是用来标示这个 TypeHanlder 可以处理的 Java 类型，MappedJdbcTypes 是用来标示这个 TypeHanlder 可以用来处理的 Jdbc 类型。

例如：

```java
    // 用来处理 JdbcType.CHAR 和 JdbcType.VARCHAR 类型
   @MappedJdbcTypes({
     JdbcType.CHAR, JdbcType.VARCHAR})
   public class StringTrimmingTypeHandler implements TypeHandler<String> {
     // ...
   }
```

```java
    // 用来处理 String 类型的
   @MappedTypes(String.class)
   public class StringTrimmingTypeHandler implements TypeHandler<String> {
     // ...
   }
```
