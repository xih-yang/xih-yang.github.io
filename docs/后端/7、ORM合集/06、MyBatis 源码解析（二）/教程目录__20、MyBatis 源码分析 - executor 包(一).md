# 20、MyBatis 源码分析 - executor 包(一)
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/20.html
- 分类：ORM框架
- 分组：教程目录
executor

- keygen —— 主键生成，包含三种生成策略 Jdbc3KeyGenerator、NoKeyGenerator、SelectKeyGenerator
- loader —— 实现懒加载，底层是通过代理类实现的懒加载，MyBatis 中生成代理类的框架有两套 cglib 和 javassist。
- parameter —— 参数处理，设置 PreparedStatement 和 CallableStatement 中参数。
- result —— 结果处理，将单个的结果封装到 List、Map、Cursor 中，分别对应 DefaultResultHandler、DefaultMapResultHandler 和 DefaultCursor。
- resultset —— 结果集处理， 处理结果映射中的嵌套映射等逻辑、根据映射关系，生成结果对象、根据数据库查询记录对结果对象的属性进行赋值。
- statement —— 不同语句声明处理
- Executor —— 执行器相关内容

有了这个大体的结构，我们接下来就会按照这个顺序对 executor 包进行分析。

### 主键生成和自动回填

在使用MyBatis 的过程中，有一个特别好用的功能就是主键生成和自动回填。我们可以自己生成主键的值，也可以依赖于数据库的自增主键，然后 MyBatis 将自动生成好的主键回填到对象中。

#### KeyGenerator

首先来看看 `KeyGenerator`，其中有两个抽象方法，分别在 SQL 执行前后调用一次。例如你想要自动回填的话，就需要在 SQL 执行后调用，因为要从结果中获取数据库生成好的主键信息；如果你想要插入自己生成的主键值，就需要在 SQL 执行前将主键的值填充到对象中。

```java
public interface KeyGenerator {
  // 执行 SQL 之前调用
  void processBefore(Executor executor, MappedStatement ms, Statement stmt, Object parameter);
  // 执行完 SQL 之后调用
  void processAfter(Executor executor, MappedStatement ms, Statement stmt, Object parameter);
}
```

#### NoKeyGenerator

由于只有在执行 insert 和 update 语句的时候才有可能会需要主键的生成或者回填，在执行 select 时并不需要。所以就有了 `NoKeyGenerator` 这个空实现，即没有做任何操作。

这样在执行语句的时候就不需要关心当前是什么类型的语句，都可以调用 `KeyGenerator` 中的方法。

#### SelectKeyGenerator

有些数据库是不支持自增主键的，我们就需要用到 `SelectKeyGenerator`，可以通过执行 SQL 得到可用的最小主键ID。

##### 如何启用 SelectKeyGenerator

要启用`SelectKeyGenerator` 只需要在 insert 或 update 语句中声明 `selectKey`。

```java
  <insert id="insert">
    -- selectKey 等同于 select，也会被构建为一个 MappedStatement
    -- 只是很多在 select 中可设置的属性，在 selectKey 构建过程中被赋予了默认值
    <selectKey order="BEFORE" keyProperty="id" keyColumn="id" resultType="long">
      SELECT MAX(id) + 1 AS id FROM user
    </selectKey>
    INSERT INTO user(id, name, age, email, birthday)
    VALUES (#{id},{user.name},{user.age},{user.email},{user.birthday})
  </insert>
```

selectKey 中属性解析描述如下：

属性
描述

keyProperty
selectKey 语句结果应该被设置到的目标属性。如果生成列不止一个，可以用逗号分隔多个属性名称。

keyColumn
返回结果集中生成列属性的列名。如果生成列不止一个，可以用逗号分隔多个属性名称

resultType
结果的类型。通常 MyBatis 可以推断出来，但是为了更加准确，写上也不会有什么问题。MyBatis 允许将任何简单类型用作主键的类型，包括字符串。如果生成列不止一个，则可以使用包含期望属性的 Object 或 Map。

order
可以设置为 BEFORE 或 AFTER。如果设置为 BEFORE，那么它首先会生成主键，设置 keyProperty 再执行插入语句。如果设置为 AFTER，那么先执行插入语句，然后是 selectKey 中的语句 - 这和 Oracle 数据库的行为相似，在插入语句内部可能有嵌入索引调用。

statementType
和前面一样，MyBatis 支持 STATEMENT，PREPARED 和 CALLABLE 类型的映射语句，分别代表 Statement, PreparedStatement 和 CallableStatement 类型。

##### 源码分析

可以发现不管是调用 `processBefore` 还是 `processAfter` 调用都是 `processGeneratedKeys` 方法。方法的整体步骤也不复杂，总共可分为三个步骤。

**1、** 创建执行一个新的执行器；

**2、** 执行sql语句；

**3、** 将结果回填到入参对象中；

不管是回填多个属性还是回填单个属性，其实思路上都是差不多的，所以在这里就不再讲解了，有兴趣的同学可以直接查看源码。

```java
public class SelectKeyGenerator implements KeyGenerator {
  @Override
  public void processBefore(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
    if (executeBefore) {
      processGeneratedKeys(executor, ms, parameter);
    }
  }
  @Override
  public void processAfter(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
    if (!executeBefore) {
      processGeneratedKeys(executor, ms, parameter);
    }
  }
  private void processGeneratedKeys(Executor executor, MappedStatement ms, Object parameter) {
    if (parameter != null && keyStatement != null && keyStatement.getKeyProperties() != null) {
      String[] keyProperties = keyStatement.getKeyProperties();
      final Configuration configuration = ms.getConfiguration();
      final MetaObject metaParam = configuration.newMetaObject(parameter);
      // 1. 创建执行一个新的执行器
      Executor keyExecutor = configuration.newExecutor(executor.getTransaction(), ExecutorType.SIMPLE);
      // 2. 执行 sql 语句
      List<Object> values = keyExecutor.query(keyStatement, parameter, RowBounds.DEFAULT, Executor.NO_RESULT_HANDLER);
      // 3. 将结果回填到入参对象中
      if (values.size() == 0) {
     // 如果没有返回值
        throw new ExecutorException("SelectKey returned no data.");
      } else if (values.size() > 1) {
     // 如果返回值超过一个
        throw new ExecutorException("SelectKey returned more than one value.");
      } else {
        MetaObject metaResult = configuration.newMetaObject(values.get(0));
        if (keyProperties.length == 1) {
          if (metaResult.hasGetter(keyProperties[0])) {
            // 查询结果对象能找到需要提取的属性
            setValue(metaParam, keyProperties[0], metaResult.getValue(keyProperties[0]));
          } else {
            // 如果查询结果对象没有对应的属性，可能查询结果对象本身就是值
            setValue(metaParam, keyProperties[0], values.get(0));
          }
        } else {
          // 如果有多个值需要回填
          handleMultipleProperties(keyProperties, metaParam, metaResult);
        }
      }
    }
  }
  private void setValue(MetaObject metaParam, String property, Object value) {
    if (metaParam.hasSetter(property)) {
      metaParam.setValue(property, value);
    } else {
      throw new ExecutorException("...");
    }
  }
}
```

#### Jdbc3KeyGenerator

在使用MySQL 这种有主键自增特性的数据库时，我们一般会依赖于数据库表的主键自增为我们创建主键。但是有时候我们不光想要将记录插入到数据库就结束了，可能还想要知道插入记录的ID是多少。因为我们紧接着插入另一条记录的时候可能会用到这个ID，来做关联。

在这个时候我们就想要谁能不能帮我们将插入到数据库中记录的ID回填到我们传入的对象中。例如本来的对象是 `User{id=null,name="张三",age=13}`，当执行完插入语句后就变为了 `User{id=null,name="张三",age13}`。而这个工作就可以由 `Jdbc3KeyGenerator` 来完成。

同样的，要开启主键的自动回填也是需要进行配置的。不对相对于 `SelectKeyGenerator` 要简单很多。

##### 启用 Jdbc3KeyGenerator 的两种方式

**方式一**

**1、** 设置全局配置，`insert`语句默认使用`Jdbc3KeyGenerator`；

```java
-- mybatis-config.xml
<settings>
  <setting name="useGeneratedKeys" value="true"/>
</settings>
```

**2、** 为`insert`语句设置`keyProperty`属性值，即要回填到入参对象中的哪个属性；

```xml
<insert id="insert" keyProperty="id">
  INSERT INTO user(name, age, email, birthday)
  VALUES (#{user.name},{user.age},{user.email},{user.birthday})
</insert>
```

**方式二**

**1、** 设置指定语句开启主键自动回填，并且设置要回填的属性名称；

```java
-- XXXMapper.xml
<insert id="insert" useGeneratedKeys="true" keyProperty="id">
  INSERT INTO user(name, age, email, birthday)
  VALUES (#{user.name},{user.age},{user.email},{user.birthday})
</insert>
```

优先级：XXXMapper.xml > mybatis-config.xml

##### 源码分析

由于回填操作是更加自动化的，所以在代码书写上考虑各种情况，所以是比较复杂的。其中还涉及到了之前的知识点，大家可以翻到之前的文章看看。

```java
public class Jdbc3KeyGenerator implements KeyGenerator {
  @Override
  public void processBefore(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
    // 由于自增的主键是在数据库插入结束后生成，所以再插入前不需要做任何处理
  }
  @Override
  public void processAfter(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
    // 在插入记录后执行主键回填
    processBatch(ms, stmt, parameter);
  }
  public void processBatch(MappedStatement ms, Statement stmt, Object parameter) {
    // 得到 key 属性名称列表
    final String[] keyProperties = ms.getKeyProperties();
    if (keyProperties == null || keyProperties.length == 0) {
      return;
    }
    // 得到数据库生成主键的结果，同样是存在 ResultSet 中
    ResultSet rs = stmt.getGeneratedKeys()
    final ResultSetMetaData rsmd = rs.getMetaData();
    final Configuration configuration = ms.getConfiguration();
    if (rsmd.getColumnCount() < keyProperties.length) {
      // 查询得到的结果列数比待回填属性要少的时候不做任何处理
      // 即，要么所有属性都回填，要么都不回填
    } else {
      // 进行值的回填
      assignKeys(configuration, rs, rsmd, keyProperties, parameter);
    }
  }
  private void assignKeys(Configuration configuration, ResultSet rs, ResultSetMetaData rsmd, String[] keyProperties,
      Object parameter) throws SQLException {
    /*
      这里的判断逻辑，有点涉及到前面的知识，但是在这里不会再回顾前面的知识。
      如果忘记了，大家可以先去看看之前的文章，涉及的知识点是 reflection 包(二) 中的 ParamNameResolver 类的。
      这里根据不同的情况调用了三个方法，但是我只会讲解方法3，因为方法3的大体步骤更加清晰，方法1和方法2的大体步骤虽然也一致，但是在某一步的处理上可能特别复杂，如果有兴趣的小伙伴可以去看源码学习。
     */
    if (parameter instanceof ParamMap || parameter instanceof StrictMap) {
      // 方法1：有多个入参，或者只有一个入参但是声明了 @Param 注解
      assignKeysToParamMap(configuration, rs, rsmd, keyProperties, (Map<String, ?>) parameter);
    } else if (parameter instanceof ArrayList && !((ArrayList<?>) parameter).isEmpty()
        && ((ArrayList<?>) parameter).get(0) instanceof ParamMap) {
      // 方法2：有多个入参，或者只有一个带 @Param 注解的入参，在批量操作的情况下
      assignKeysToParamMapList(configuration, rs, rsmd, keyProperties, (ArrayList<ParamMap<?>>) parameter);
    } else {
      // 方法3：只有一个入参，并且没有声明 @Param 注解的情况
      assignKeysToParam(configuration, rs, rsmd, keyProperties, parameter);
    }
  }
  // 方法3：将键值分配给参数
  private void assignKeysToParam(Configuration configuration, ResultSet rs, ResultSetMetaData rsmd,
      String[] keyProperties, Object parameter) throws SQLException {
    Collection<?> params = collectionize(parameter);
    // 没有入参不需要回填
    if (params.isEmpty()) {
      return;
    }
    // 1. 先为每个待回填属性创建一个回填器
    List<KeyAssigner> assignerList = new ArrayList<>();
    for (int i = 0; i < keyProperties.length; i++) {
      assignerList.add(new KeyAssigner(configuration, rsmd, i + 1, null, keyProperties[i]));
    }
    // 2. 遍历结果集，利用回填器回填属性值
    Iterator<?> iterator = params.iterator();
    while (rs.next()) {
      if (!iterator.hasNext()) {
     // 如果 ResultSet 中的记录数比入参对象数量还要多
        throw new ExecutorException(String.format(MSG_TOO_MANY_KEYS, params.size()));
      }
      // 为得到入参对象，并为其中的 key 回填值
      Object param = iterator.next();
      assignerList.forEach(x -> x.assign(rs, param));
    }
  }
  // 回填器
  private class KeyAssigner {
    // MyBatis 的全局配置
    private final Configuration configuration;
    // 数据库返回结果的描述信息
    private final ResultSetMetaData rsmd;
    // 类型处理器的注册表
    private final TypeHandlerRegistry typeHandlerRegistry;
    // 属性对应列的位置
    private final int columnPosition;
    // ParamMap 中的参数名称
    private final String paramName;
    // 参数对象中属性名称
    private final String propertyName;
    // 类型处理器
    private TypeHandler<?> typeHandler;
    // ...
    // 执行回填的方法
    protected void assign(ResultSet rs, Object param) {
      // 1. 如果需要，要先拆封一层
      if (paramName != null) {
        // 如果设置了 paramName 说明请求参数是 ParamMap 类型
        // 由于 ParamMap 是 MyBatis 包装的一层，所以要 "拆开" 得到实际需要回填的入参
        param = ((ParamMap<?>) param).get(paramName);
      }
      MetaObject metaParam = configuration.newMetaObject(param);
      // 2. 得到类型处理器
      if (typeHandler == null) {
        if (metaParam.hasSetter(propertyName)) {
          Class<?> propertyType = metaParam.getSetterType(propertyName);
          typeHandler = typeHandlerRegistry.getTypeHandler(propertyType,
              JdbcType.forCode(rsmd.getColumnType(columnPosition)));
        } else {
          throw new ExecutorException("...");
        }
      }
      if (typeHandler == null) {
        // 类型处理器不存在，则不进行回填
      } else {
        // 3. 利用类型处理器得到正确类型的值
        Object value = typeHandler.getResult(rs, columnPosition);
        // 4. 回填值
        metaParam.setValue(propertyName, value);
      }
    }
  }
}
```

### 懒加载

**什么是懒加载？**

懒加载就是在获取属性值的时候才去加载该属性的值，加载的过程可以是去数据库中查询。

**为什么需要懒加载**

例如需求如下：我们只需要找到满足 “age == 18” 用户的任务。可以看到会把每个用户的任务都查询出来，如果用户很多的话，那么势必要查询很多次用户的任务，但是实际上我们可能并不需要每个用户的任务。

```java
List<User> users = userMapper.selectList();
for (User user : users) {
  if (user.getAge() == 18) {
    System.out.println(user.getTasks());
  }
}
```

```java
-- UserMapper.xml
  <resultMap id="userResultMap" type="User">
    <id property="id" column="xid" />
    <result property="name" column="name" />
    <result property="age" column="age" />
    <result property="email" column="email" />
    <result property="birthday" column="birthday" />
    <collection property="tasks" ofType="Task" javaType="java.util.ArrayList" column="{userId=id}" select="selectTaskByUserId"/>
  </resultMap>
  <select id="selectTaskByUserId">
    SELECT * FROM task WHERE user_id ={userId}
  </select>
  <select id="selectList" resultMap="userResultMap">
    SELECT * FROM user
  </select>
```

**如何开启懒加载**

**1、** 全局配置开启懒加载；

```java
  <settings>
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 可选 -->
    <setting name="aggressiveLazyLoading" value="true"/>
    <setting name="lazyLoadTriggerMethods" value="equals,clone,hashCode,toString"/>
  </settings>
```

其实设置了 `lazyLoadingEnabled` 就已经开启了懒加载，但是还有两个可选的配置如下：

`aggressiveLazyLoading`：激进懒加载

- true：对对象任一属性的读或写操作都会触发该对象所有懒加载属性的加载。
- false：对对象某一懒加载属性的读操作会触发该属性的加载。

`lazyLoadTriggerMethods`：执行指定方法前触发所有属性的懒加载方法，如果是非激进懒加载的情况下，在调用 `equals` 方法是如果不先进行加载的话，则可能会导致执行效果不符合预期。所以 MyBatis 就可以让用户配置，在执行哪些方法时，就会像开启了激进懒加载一样，加载所有的属性。

- 默认值为 equals,clone,hashCode,toString，如果用户也自定义了类似的方法，必须要保证所有属性加载完成才能进行执行，那么就需要添加在后面。

#### 懒加载框架

MyBatis 懒加载效果如下图所示：

可以看出懒加载实现底层原理就是通过动态代理，而这里的懒加载框架本质上指的是动态代理实现框架。在 MyBatis 有有种实现动态代理的框架，分别是 `javassist`、`cglib`。默认使用的是 `javassist` 框架。（如果对动态代理不了解的小伙伴可以先百度了解一下再接着往后学习）

接下来看看类图：

可以发现，涉及的类还是挺多的，但是 `cglib` 和 `javassist` 涉及的类都是类似的，只是实现的具体细节上存在差异，所以我们只会重点分析默认使用的 `javassist`。

#### javassist

##### ProxyFactory

代理工厂用于生成代理对象的，`javassit` 或 `cglib` 实现这个接口，通过动态代理实现属性的懒加载。

```java
public interface ProxyFactory {
  /**
   * 构造方法
   *
   * @param target              被代理对象
   * @param lazyLoader          存储了所有要懒加载的属性信息
   * @param configuration       MyBatis 全局配置信息
   * @param objectFactory       对象工厂
   * @param constructorArgTypes 构造器参数类型
   * @param constructorArgs     构造器参数
   * @return 代理对象
   */
  Object createProxy(Object target, ResultLoaderMap lazyLoader, Configuration configuration,
    ObjectFactory objectFactory, List<Class<?>> constructorArgTypes, List<Object> constructorArgs);
}
```

##### JavassistProxyFactory

实现了`ProxyFactory` 接口，利用 `javassist` 框架实现动态代理。

```java
  // finalize 方法名称
  private static final String FINALIZE_METHOD = "finalize";
  // writeReplace 方法名称
  private static final String WRITE_REPLACE_METHOD = "writeReplace";
  public JavassistProxyFactory() {
    try {
      Resources.classForName("javassist.util.proxy.ProxyFactory");
    } catch (Throwable e) {
      throw new IllegalStateException();
    }
  }
  // 构建代理对象
  @Override
  public Object createProxy(Object target, ResultLoaderMap lazyLoader, Configuration configuration, ObjectFactory objectFactory, List<Class<?>> constructorArgTypes, List<Object> constructorArgs) {
    return EnhancedResultObjectProxyImpl.createProxy(target, lazyLoader, configuration, objectFactory, constructorArgTypes, constructorArgs);
  }
  // 构建反序列化代理对象（反序列化对象生成代理对象时使用）
  public Object createDeserializationProxy(Object target, Map<String, ResultLoaderMap.LoadPair> unloadedProperties, ObjectFactory objectFactory, List<Class<?>> constructorArgTypes, List<Object> constructorArgs) {
    return EnhancedDeserializationProxyImpl.createProxy(target, unloadedProperties, objectFactory, constructorArgTypes, constructorArgs);
  }
  // 利用 javassist 创建代理对象
  static Object crateProxy(Class<?> type, MethodHandler callback, List<Class<?>> constructorArgTypes, List<Object> constructorArgs) {
    ProxyFactory enhancer = new ProxyFactory();
    // 1. 设置被代理的类
    enhancer.setSuperclass(type);
    // 2. 确保类有 writeReplace 方法(在反序列化的时候会用到 writeReplace 方法)
    try {
      type.getDeclaredMethod(WRITE_REPLACE_METHOD);
    } catch (NoSuchMethodException e) {
      enhancer.setInterfaces(new Class[] {
      WriteReplaceInterface.class });
    } catch (SecurityException e) {
      // nothing to do here
    }
    // 3. 构造对象代理对象
    Object enhanced;
    Class<?>[] typesArray = constructorArgTypes.toArray(new Class[constructorArgTypes.size()]);
    Object[] valuesArray = constructorArgs.toArray(new Object[constructorArgs.size()]);
    try {
      enhanced = enhancer.create(typesArray, valuesArray);
    } catch (Exception e) {
      throw new ExecutorException(...);
    }
    ((Proxy) enhanced).setHandler(callback);
    return enhanced;
  }
```

`JavassistProxyFactory` 自身并没有创建代理对象，而是交给了 `EnhancedResultObjectProxyImpl` 和 `EnhancedDeserializationProxyImpl` 去创建的。在不同的时候调用不同的构建代理对象的方法，这个在后面就会提到，但是具体调用 `javassist` 创建代理对象是在 `JavassistProxyFactory` 中写好的，不同的只是 `MethodHandler` 的具体处理逻辑(对应 JDK 动态代理中的 `InvocationHandler`，对应 CGLIB 中的 `MethodInterceptor`)。

###### EnhancedResultObjectProxyImpl#

是`JavassistProxyFactory` 的内部类，实现了 `MethodHandler` 接口，实现了属性能懒加载的地方。

```java
  private static class EnhancedResultObjectProxyImpl implements MethodHandler {
    // 被代理类
    private final Class<?> type;
    // 要懒加载的属性
    private final ResultLoaderMap lazyLoader;
    // 是否是激进懒加载
    private final boolean aggressive;
    // 能够触发全局懒加载的方法为 "equals"、"clone"、"hashCode"、"toString"
    private final Set<String> lazyLoadTriggerMethods;
    // 对象工厂
    private final ObjectFactory objectFactory;
    // 被代理类构造函数的参数类型列表
    private final List<Class<?>> constructorArgTypes;
    // 被代理类构造函数的参数列表
    private final List<Object> constructorArgs;
    // Constructor...
    public static Object createProxy(Object target, ResultLoaderMap lazyLoader, Configuration configuration, ObjectFactory objectFactory, List<Class<?>> constructorArgTypes, List<Object> constructorArgs) {
      final Class<?> type = target.getClass();
      EnhancedResultObjectProxyImpl callback = new EnhancedResultObjectProxyImpl(type, lazyLoader, configuration, objectFactory, constructorArgTypes, constructorArgs);
      Object enhanced = crateProxy(type, callback, constructorArgTypes, constructorArgs);
      // 拷贝原对象已有的属性值
      PropertyCopier.copyBeanProperties(type, target, enhanced);
      return enhanced;
    }
    @Override
    public Object invoke(Object enhanced, Method method, Method methodProxy, Object[] args) throws Throwable {
      final String methodName = method.getName();
      try {
        synchronized (lazyLoader) {
     // 同步锁防止未加载属性的并发加载
          if (WRITE_REPLACE_METHOD.equals(methodName)) {
     // 如果是序列化方法
            // 由于是序列化，构造出要序列化的对象
            Object original;
            if (constructorArgTypes.isEmpty()) {
              original = objectFactory.create(type);
            } else {
              original = objectFactory.create(type, constructorArgTypes, constructorArgs);
            }
            PropertyCopier.copyBeanProperties(type, enhanced, original);
            // 如果存在未加载的属性，也需要同步记录下来，否则返回原对象即可
            if (lazyLoader.size() > 0) {
              return new JavassistSerialStateHolder(original, lazyLoader.getProperties(), objectFactory, constructorArgTypes, constructorArgs);
            } else {
              return original;
            }
          } else {
            if (lazyLoader.size() > 0 && !FINALIZE_METHOD.equals(methodName)) {
     // 如果还存在未加载的属性并且调用的方法不是 finalize 方法
              if (aggressive || lazyLoadTriggerMethods.contains(methodName)) {
                // 开启了激进懒加载或者是需要在所有属性都加载完毕情况下才能执行的方法例如 toString() 时加载所有的属性
                lazyLoader.loadAll();
              } else if (PropertyNamer.isSetter(methodName)) {
                // 如果调用的 set 方法的话，对应属性就不需要懒加载了，避免造成覆盖
                final String property = PropertyNamer.methodToProperty(methodName);
                lazyLoader.remove(property);
              } else if (PropertyNamer.isGetter(methodName)) {
                // 如果调用的是 get 方法，并且当前属性需要懒加载，则先进行加载
                final String property = PropertyNamer.methodToProperty(methodName);
                if (lazyLoader.hasLoader(property)) {
                  // 加载对应属性的值
                  lazyLoader.load(property);
                }
              }
            }
          }
        }
        return methodProxy.invoke(enhanced, args);
      } catch (Throwable t) {
        throw ExceptionUtil.unwrapThrowable(t);
      }
    }
  }
```

在这段代码中最关键的部分就在于 `invoke` 方法中的逻辑，它表明了在什么时候才需要触发属性的懒加载。并且可以看到如果执行的序列化方法的时候有一个特殊处理，即如果是序列化方法，为了保证经历了序列化和反序列化这个过程后代理类依然具有属性懒加载功能，实际上返回的不是被代理对象，而是一个持有了被代理对象和未加载属性信息的类。

###### 扩展知识(一)：Serializable 和 Externalizable#

在Java 中要表明一个类是可序列化的，则必须实现 `Serializable` 接口或 `Externalizable` 接口，而且 `Externalizable` 是 `Serializable` 接口的子接口。

**1、writeExternal 方法和 readExternal 方法**

> 这两个方法是 Externalizable 接口中声明的抽象方法。

- void writeExternal(ObjectOutput out)：该方法在目标对象序列化时调用。方法中可以调用 DataOutput（输入参数 ObjectOutput的父类）方法来保存其基本值，或调用ObjectOutput的 writeObject方法来保存对象、字符串和数组。
- void readExternal（ObjectInput in）：该方法在目标对象反序列化时调用。方法中调用DataInput（输入参数 ObjectInput的父类）方法来恢复其基础类型，或调用 readObject方法来恢复对象、字符串和数组。需要注意的是，readExternal 方法读取数据时，必须与 writeExternal方法写入数据时的顺序和类型一致。

**2.、writeReplace方法和 readResolve方法**

> 在进行序列化和反序列化的目标类（可以继承 Serializable 接口，也可以继承Externalizable接口）中，还可以定义两个方法：writeReplace方法和readResolve方法。

- writeReplace：如果一个类中定义了该方法，则对该类的对象进行序列化操作前会先调用该方法。最终该方法返回的对象将被序列化。
- readResolve：如果一个类中定义了该方法，则对该类的对象进行反序列化操作后会调用该方法。最终该方法返回的对象将作为反序列化的结果。

**3、序列化方法和反序列化方法的执行顺序**

> 既然我们知道了 writeExternal、readExternal、writeReplace、readResolve 这四个在序列化和反序列化中涉及到的方法，那么这四个方法的执行顺序如何呢？

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-4wwSZGV2-1629685110348)(media/16264031686350/16293928678554.jpeg)]

小结：`writeReplace` 方法和 `readResolve` 方法实际上为对象的序列化和反序列化提供了一种“偷梁换柱”的能力：无论实际对象如何，***在序列化时都以 writeReplace 方法的返回值为准；无论序列化数据如何，在反序列化时都以 readResolve方法的返回值为准。***

###### JavassistSerialStateHolder#

在序列化的时候，这个类持有了原对象(实际上想要序列化的对象)和对象中未加载的属性等其他关键属性。然后它还负责在反序列化的时候重新为这个原对象生成代理类。***但是实际上想要在经历了反序列化之后还能实现属性的懒加载还需要设做一些配置，要不然在获取未加载属性的时候是会抛出异常的***。不过在这里并不探讨那么深。

```java
class JavassistSerialStateHolder extends AbstractSerialStateHolder {
  @Override
  public final void writeExternal(final ObjectOutput out) throws IOException {
    boolean firstRound = false;
    final ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ObjectOutputStream os = stream.get();
    if (os == null) {
      os = new ObjectOutputStream(baos);
      firstRound = true;
      stream.set(os);
    }
    os.writeObject(this.userBean);
    os.writeObject(this.unloadedProperties);
    os.writeObject(this.objectFactory);
    os.writeObject(this.constructorArgTypes);
    os.writeObject(this.constructorArgs);
    final byte[] bytes = baos.toByteArray();
    out.writeObject(bytes);
    if (firstRound) {
      stream.remove();
    }
  }
  @Override
  public final void readExternal(final ObjectInput in) throws IOException, ClassNotFoundException {
    final Object data = in.readObject();
    if (data.getClass().isArray()) {
      this.userBeanBytes = (byte[]) data;
    } else {
      this.userBean = data;
    }
  }
  @SuppressWarnings("unchecked")
  protected final Object readResolve() throws ObjectStreamException {
    // 不是第一次运行，直接输出已经解析好的被代理对象
    if (this.userBean != null && this.userBeanBytes.length == 0) {
     // 不需要反序列化，则直接返回
      return this.userBean;
    }
    SerialFilterChecker.check();
    // 第一次运行，反序列化输出
    ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(this.userBeanBytes));
    this.userBean = in.readObject();
    this.unloadedProperties = (Map<String, ResultLoaderMap.LoadPair>) in.readObject();
    this.objectFactory = (ObjectFactory) in.readObject();
    this.constructorArgTypes = (Class<?>[]) in.readObject();
    this.constructorArgs = (Object[]) in.readObject();
    final Map<String, ResultLoaderMap.LoadPair> arrayProps = new HashMap<>(this.unloadedProperties);
    final List<Class<?>> arrayTypes = Arrays.asList(this.constructorArgTypes);
    final List<Object> arrayValues = Arrays.asList(this.constructorArgs);
    return this.createDeserializationProxy(userBean, arrayProps, objectFactory, arrayTypes, arrayValues);
  }
  /**
   * 构建反序列化代理
   *
   * @param target              被代理对象
   * @param unloadedProperties  未懒加载的属性
   * @param objectFactory       对象工厂
   * @param constructorArgTypes 构造方法参数类型列表
   * @param constructorArgs     构造方法参数列表
   * @return 代理对象
   */
  @Override
  protected Object createDeserializationProxy(Object target,
    Map<String, ResultLoaderMap.LoadPair> unloadedProperties, ObjectFactory objectFactory,
    List<Class<?>> constructorArgTypes, List<Object> constructorArgs) {
    return new JavassistProxyFactory()
      .createDeserializationProxy(target, unloadedProperties, objectFactory, constructorArgTypes,
        constructorArgs);
  }
}
```

###### EnhancedDeserializationProxyImpl#

这是对象在经历了反序列化后重新生成代理对象的类。同样也实现了 `MethodHandler` 接口，所以同样只需要关注 `invoke` 方法。其实细心观察过的同学可以发现，大部分的逻辑都和 `EnhancedResultObjectProxyImpl` 类似，但是这里存在的一个很大的问题，那就是没有能够触发全局懒加载的功能了，所以二级缓存是默认关闭的，就算开启了二级缓存也尽量只读，而不是可读写。

```java
  public final Object invoke(Object enhanced, Method method, Object[] args) throws Throwable {
    final String methodName = method.getName();
    try {
      if (WRITE_REPLACE_METHOD.equals(methodName)) {
     // 如果是序列化方法
        final Object original;
        if (constructorArgTypes.isEmpty()) {
          original = objectFactory.create(type);
        } else {
          original = objectFactory.create(type, constructorArgTypes, constructorArgs);
        }
        PropertyCopier.copyBeanProperties(type, enhanced, original);
        return this.newSerialStateHolder(original, unloadedProperties, objectFactory, constructorArgTypes, constructorArgs);
      } else {
        synchronized (this.reloadingPropertyLock) {
     // 同步锁防止属性的并发加载
          // 不是 finalize 方法并且名称是以 set 或 get 开头并且当前没有正在加载的属性
          if (!FINALIZE_METHOD.equals(methodName) && PropertyNamer.isProperty(methodName) && !reloadingProperty) {
            final String property = PropertyNamer.methodToProperty(methodName);
            final String propertyKey = property.toUpperCase(Locale.ENGLISH);
            // 如果是未加载的属性，则进行加载
            if (unloadedProperties.containsKey(propertyKey)) {
              final ResultLoaderMap.LoadPair loadPair = unloadedProperties.remove(propertyKey);
              if (loadPair != null) {
                try {
                  reloadingProperty = true;
                  loadPair.load(enhanced);
                } finally {
                  reloadingProperty = false;
                }
              } else {
                throw new ExecutorException("");
              }
            }
          }
          return enhanced;
        }
      }
    } catch (Throwable t) {
      throw ExceptionUtil.unwrapThrowable(t);
    }
  }
```

小结：
`EnhancedResultObjectProxyImpl`：对象在经历未经历序列化的代理类。

`EnhancedDeserializationProxyImpl`：对象在经历了序列化之后的代理类。

`JavassistSerialStateHolder`：扮演了两种代理类转换的桥梁。

#### CGLIB

通过`CGLIB` 实现的动态代理和 `javassist` 是类似的，它们所涉及的类都是完全一致的，所以在这里不重复进行讲解了，大家可以对照着 `javassist` 的看应该就能明白了。

#### 懒加载的执行

在对象的两个代理类中，我们只看到了懒加载的触发逻辑，但是我们并没有看到实际上是如何执行的，因为具体的处理逻辑是交给其他的类来进行的，将任务的触发和执行分离是一种常见且优美工程编码。

而懒加载的执行涉及了以下类：

`ResultLoaderMap`：记录了一个对象所有未加载的属性。

`LoadPair`：具体执行属性的懒加载。

##### ResultLoaderMap

利用`Map` 保存了所有未加载的属性，所以也包含了未加载属性的新增、删除和加载方法。可以看出 `ResultLoaderMap` 的作用就是管理所有的加载器。

```java
public class ResultLoaderMap {
  /**
   * 保存所有未加载的属性
   * key -> 属性名称，value -> 加载属性值需要的信息
   */
  private final Map<String, LoadPair> loaderMap = new HashMap<>();
  // 新增属性加载器
  public void addLoader(String property, MetaObject metaResultObject, ResultLoader resultLoader) {
    String upperFirst = getUppercaseFirstProperty(property);
    if (!upperFirst.equalsIgnoreCase(property) && loaderMap.containsKey(upperFirst)) {
      throw new ExecutorException("");
    }
    loaderMap.put(upperFirst, new LoadPair(property, metaResultObject, resultLoader));
  }
  // 触发属性加载器加载
  public boolean load(String property) throws SQLException {
    // 先从未加载列表中移除
    LoadPair pair = loaderMap.remove(property.toUpperCase(Locale.ENGLISH));
    if (pair != null) {
     // 如果属性确实没有被加载，则进行加载
      pair.load();
      return true;
    }
    return false;
  }
  // 删除属性加载器
  public void remove(String property) {
    loaderMap.remove(property.toUpperCase(Locale.ENGLISH));
  }
  // 加载所有未加载的属性
  public void loadAll() throws SQLException {
    final Set<String> methodNameSet = loaderMap.keySet();
    String[] methodNames = methodNameSet.toArray(new String[methodNameSet.size()]);
    for (String methodName : methodNames) {
      load(methodName);
    }
  }
}
```

##### LoadPair

`LoadPair` 存储了加载一个属性值需要的所有信息，但是属性值的获取，也就是 SQL 语句的执行和属性的赋值都是交由其他类来完成的。

- MetaObject：属性的赋值。(之前的问题已经提到了)
- ResultLoader：属性值的获取。(马上就会提到了)

```java
public static class LoadPair implements Serializable {
    // 返回 MyBatis 配置信息的工厂方法的名称(序列化后才需要使用到)
    private static final String FACTORY_METHOD = "getConfiguration";
    // 用于校验对象是否经过序列化，因为使用了 transient 所以序列化会忽略这个字段，所以如果是反序列化生成的话，这个字段为 null
    private final transient Object serializationCheck = new Object();
    // 需要被加载属性值的对象的元对象。
    // 由于经过序列化和反序列化后 metaResultObject 中的内容可能已经失效了，所以需要重新创建
    private transient MetaObject metaResultObject;
    // 加载未读属性的结果加载器。
    // 由于经过序列化和反序列化后 resultLoader 中的内容可能已经失效了，所以需要重新创建
    private transient ResultLoader resultLoader;
    // 用于日志记录
    private transient Log log;
    // 配置工厂类，可以用来获得数据库连接。
    private Class<?> configurationFactory;
    // 未读属性的名称。
    private String property;
    // 加载属性值，需要执行的 SQL 语句的 ID。
    private String mappedStatement;
    // sql语句的参数。
    private Serializable mappedParameter;
    // 属性加载
    // 未经过序列化：不需要传 userObject
    // 序列化之后：需要传递 userObject，因为序列化之后有些关键的属性需要重新获取
    public void load(final Object userObject) throws SQLException {
      if (this.metaResultObject == null || this.resultLoader == null) {
     // 输出结果对象的封装或者输出结果加载器不存在
        if (this.mappedParameter == null) {
     // 如果 mappedParameter 不存在，那么 SQL 语句也不存在
          throw new ExecutorException("");
        }
        final Configuration config = this.getConfiguration();
        // 得到要执行的 SQL 语句
        final MappedStatement ms = config.getMappedStatement(this.mappedStatement);
        if (ms == null) {
          throw new ExecutorException("");
        }
        // 由于没有 metaResultObject 或 resultLoader 就会用 userObject 重新创建这两个
        this.metaResultObject = config.newMetaObject(userObject);
        this.resultLoader = new ResultLoader(config, new ClosedExecutor(), ms, this.mappedParameter,
                metaResultObject.getSetterType(this.property), null, null);
      }
      // 如果当前的 LoadPair 是序列化后生成的，我们需要使用一个新的执行器，而不是原来的执行器
      // 因为当前很可能是在一个新线程中，而执行器并不是线程安全的，为了保证安全所以必须用新的执行器
      if (this.serializationCheck == null) {
        final ResultLoader old = this.resultLoader;
        this.resultLoader = new ResultLoader(old.configuration, new ClosedExecutor(), old.mappedStatement,
                old.parameterObject, old.targetType, old.cacheKey, old.boundSql);
      }
      // 这里就是真正执行懒加载的地方，并且设置值
      this.metaResultObject.setValue(property, this.resultLoader.loadResult());
    }
}
```

##### ResultLoader

```java
public class ResultLoader {
  // MyBatis 全局配置信息
  protected final Configuration configuration;
  // 执行器
  protected final Executor executor;
  // 映射语句
  protected final MappedStatement mappedStatement;
  // 请求参数对象
  protected final Object parameterObject;
  // 目标类型
  protected final Class<?> targetType;
  // 对象工厂
  protected final ObjectFactory objectFactory;
  // 缓存 key
  protected final CacheKey cacheKey;
  // sql 语句
  protected final BoundSql boundSql;
  // 结果提取器
  protected final ResultExtractor resultExtractor;
  // 创建者线程ID
  protected final long creatorThreadId;
  // 结果
  protected Object resultObject;
  // 执行语句得到结果
  public Object loadResult() throws SQLException {
    // 查询结果，但是返回的是一个列表，可能不能直接赋值
    List<Object> list = selectList();
    // 从列表中提取我们想要的内容
    resultObject = resultExtractor.extractObjectFromList(list, targetType);
    return resultObject;
  }
  private <E> List<E> selectList() throws SQLException {
    Executor localExecutor = executor;
    // 如果不是创建 ResultLoader 时候的线程，或者执行器已经被关闭了，那么就需要创建一个新的执行器
    if (Thread.currentThread().getId() != this.creatorThreadId || localExecutor.isClosed()) {
      localExecutor = newExecutor();
    }
    try {
      return localExecutor.query(mappedStatement, parameterObject, RowBounds.DEFAULT, Executor.NO_RESULT_HANDLER, cacheKey, boundSql);
    } finally {
      // 如果是新创建的执行器，在使用结束后需要进行关闭
      if (localExecutor != executor) {
        localExecutor.close(false);
      }
    }
  }
}
```

##### ResultExtractor

类型提取器，也可以理解为类型转换器，将查询出来的数据，转换为目标类型。

```java
public class ResultExtractor {
  // 从结果列表中提取出对象，其实就是将查询结果适配到目标类型中
  public Object extractObjectFromList(List<Object> list, Class<?> targetType) {
    Object value = null;
    if (targetType != null && targetType.isAssignableFrom(list.getClass())) {
     // 如果 list 可以直接赋值给目标类型
      value = list;
    } else if (targetType != null && objectFactory.isCollection(targetType)) {
     // 如果目标类型是集合
      value = objectFactory.create(targetType);
      MetaObject metaObject = configuration.newMetaObject(value);
      metaObject.addAll(list);
    } else if (targetType != null && targetType.isArray()) {
     // 如果目标类型是数组
      Class<?> arrayComponentType = targetType.getComponentType();
      Object array = Array.newInstance(arrayComponentType, list.size());
      if (arrayComponentType.isPrimitive()) {
        for (int i = 0; i < list.size(); i++) {
          Array.set(array, i, list.get(i));
        }
        value = array;
      } else {
        value = list.toArray((Object[])array);
      }
    } else {
     // 其他情况
      if (list != null && list.size() > 1) {
     // 如果有多条记录，但是目标类型只能存储一条记录，所以抛出异常
        throw new ExecutorException("");
      } else if (list != null && list.size() == 1) {
     // 只有一条查询结果
        value = list.get(0);
      }
    }
    return value;
  }
}
```

### 请求参数处理

这里提到的请求参数处理，就是对 MyBatis SQL 语句中 ‘#{}’ 占位符的值进行设置，实际上就是对预处理表达式中的 ‘?’ 占位符进行设置，只不过一个是 MyBatis 中的表示方式，一个是 PrepareStament 中的表示方法，但是最终 MyBatis 中的表示方式也是会转换为 PrepareStament 中的表示方法，关于转换的细节在 scripting 包下的 DynamicSqlSource 类中，如果忘了的小伙伴可以到之前的文章中去看看。

#### 占位符填充

占位符填充本质上就是 `ParameterHandler` 最终目标。在之前分析 scripting 包的时候其实已经分析过它的默认实现类，但是在这里为了保证阅读的连贯性，所以这里再讲解一遍。

```java
public class DefaultParameterHandler implements ParameterHandler {
  // 类型处理器注册表
  private final TypeHandlerRegistry typeHandlerRegistry;
  // 映射语句用于存储数据库操作节点的信息
  private final MappedStatement mappedStatement;
  // 参数对象
  private final Object parameterObject;
  // BoundSql对象（包含SQL语句、参数、实参信息）
  private final BoundSql boundSql;
  // 全局配置信息
  private final Configuration configuration;
  /**
   * 为 PreparedStatement 语句设置语句中变量的值
   * @param ps 预定义语句
   */
  @Override
  public void setParameters(PreparedStatement ps) {
    // 从 BoundSql 中得到请求参数映射列表
    List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
    if (parameterMappings != null) {
      for (int i = 0; i < parameterMappings.size(); i++) {
        ParameterMapping parameterMapping = parameterMappings.get(i);
        // 只处理 ParameterMode.IN 和 ParameterMode.INOUT 的参数
        // ParameterMode.OUT 会在 CallableStatementHandler 中单独处理
        if (parameterMapping.getMode() != ParameterMode.OUT) {
          Object value;
          // 取出属性名称
          String propertyName = parameterMapping.getProperty();
          if (boundSql.hasAdditionalParameter(propertyName)) {
            // 从附加参数中获取属性值，附加参数有如下两个来源
            // 1. 动态SQL中生成的参数，<foreach> 中声明的{index} 或者{item}
            // 2. 通过 <bind> 直接添加的参数
            value = boundSql.getAdditionalParameter(propertyName);
          } else if (parameterObject == null) {
            value = null;
          } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
            // 参数对象有指定的 typeHandler，则参数值就是对象本身
            value = parameterObject;
          } else {
            // 参数对象是复杂类型，取出参数对象的该属性值
            MetaObject metaObject = configuration.newMetaObject(parameterObject);
            value = metaObject.getValue(propertyName);
          }
          // 确定该参数的处理器
          TypeHandler typeHandler = parameterMapping.getTypeHandler();
          JdbcType jdbcType = parameterMapping.getJdbcType();
          if (value == null && jdbcType == null) {
            jdbcType = configuration.getJdbcTypeForNull();
          }
          // 此方法最终根据参数类型，调用java.sql.PreparedStatement类中的参数赋值方法，对SQL语句中的参数赋值
          typeHandler.setParameter(ps, i + 1, value, jdbcType);
        }
      }
    }
  }
}
```

#### 自动填充

`ParameterHandler` 能实现的功能远远不止于占位符填充，如果有了解过 `MyBatis-Plus` 源码的话，在 `MyBatis-Plus` 中的自动填充就是通过扩展 `ParameterHandler` 实现的。

自动填充就是我们可以自动的为请求对象中的字段填充值，一般我们会填充 **创建时间**、**修改时间**、**创建人**、**修改人**等类似的信息。

**参考文献**

**1、** 《通用源码阅读指导书：Mybatis源码阅读详解》——易哥；
