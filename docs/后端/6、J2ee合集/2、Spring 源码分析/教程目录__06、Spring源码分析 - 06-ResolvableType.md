# 06、Spring源码分析 - 06-ResolvableType
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/6.html
- 分类：J2EE框架
- 分组：教程目录
前两篇博客中很多地方都是用到了ResolvableType获取类型信息，这篇就来详细看看它。

ResolvableType封装了Java的Type，提供了getSuperType()方法访问父类型，getInterfaces()反回实现的接口，getGeneric()获取泛型参数，resolve()转化为Class对象。那么什么事Java的Type呢，可以看出Type有四个子接口，一个子类。每种类型代表啥意思可以参考这篇文章《[Java Type详解](https://blog.csdn.net/shenchaohao12321/article/details/80281826)》。下面看看ResolvableType具体实现。

ResolvableType的构造函数都是私有的，提供了四类实例化对象的静态方法:

- forField(Field)：获取指定字段的类型
- forMethodParameter(Method, int)：获取指定方法的指定形参的类型
- forMethodReturnType(Method)：获取指定方法的返回值的类型
- forClass(Class)：直接封装指定的类型

每个方法最终都会调用同一个构造方法

```java
static ResolvableType forType(
		@Nullable Type type, @Nullable TypeProvider typeProvider, @Nullable VariableResolver variableResolver);
```

先来看看forField()方法:

```java
public static ResolvableType forField(Field field) {
   Assert.notNull(field, "Field must not be null");
   return forType(null, new FieldTypeProvider(field), null);
}
```

首先将field封装成FieldTypeProvider，然后调用上述都会使用的forType()方法。FieldTypeProvider实现了TypeProvider接口，该接口有两个方法，对于FieldTypeProvider就是返回字段的类型，该对象表示此Field对象表示的字段的声明的类型，如果Type是参数化类型，则返回的Type对象必须准确反映源代码中使用的实际类型参数对象和该字段本身的Field对象。

```java
interface TypeProvider extends Serializable {
   @Nullable
   Type getType();
   @Nullable
   default Object getSource() {
      return null;
   }
}
```

```java
static class FieldTypeProvider implements TypeProvider {
   private final String fieldName;
   private final Class<?> declaringClass;
   private transient Field field;
   public FieldTypeProvider(Field field) {
      this.fieldName = field.getName();
      this.declaringClass = field.getDeclaringClass();
      this.field = field;
   }
   @Override
   public Type getType() {
      return this.field.getGenericType();
   }
   @Override
   public Object getSource() {
      return this.field;
   }
   private void readObject(ObjectInputStream inputStream) throws IOException, ClassNotFoundException {
      inputStream.defaultReadObject();
      try {
         this.field = this.declaringClass.getDeclaredField(this.fieldName);
      }
      catch (Throwable ex) {
         throw new IllegalStateException("Could not find original class structure", ex);
      }
   }
}
```

下面看一下都会用到的forType()方法。

```java
static ResolvableType forType(
      @Nullable Type type, @Nullable TypeProvider typeProvider, @Nullable VariableResolver variableResolver) {
   if (type == null && typeProvider != null) {
      type = SerializableTypeWrapper.forTypeProvider(typeProvider);
   }
   if (type == null) {
      return NONE;
   }
   // For simple Class references, build the wrapper right away -
   // no expensive resolution necessary, so not worth caching...
   if (type instanceof Class) {
      return new ResolvableType(type, typeProvider, variableResolver, (ResolvableType) null);
   }
   // Purge empty entries on access since we don't have a clean-up thread or the like.
   cache.purgeUnreferencedEntries();
   // Check the cache - we may have a ResolvableType which has been resolved before...
   ResolvableType resultType = new ResolvableType(type, typeProvider, variableResolver);
   ResolvableType cachedType = cache.get(resultType);
   if (cachedType == null) {
      cachedType = new ResolvableType(type, typeProvider, variableResolver, resultType.hash);
      cache.put(cachedType, cachedType);
   }
   resultType.resolved = cachedType.resolved;
   return resultType;
}
```

上面代码获取type时没有简单的调用typeProvider.getType()，而是使用SerializableTypeWrapper.forTypeProvider(typeProvider)包装了一个代理类，这么做的目的是为了type可以做做序列化并且缓存。

```java
static Type forTypeProvider(final TypeProvider provider) {
   Assert.notNull(provider, "Provider must not be null");
   Type providedType = provider.getType();
   if (providedType == null) {
      return null;
   }
   if (providedType instanceof Serializable) {
      return providedType;
   }
   Type cached = cache.get(providedType);
   if (cached != null) {
      return cached;
   }
   for (Class<?> type : SUPPORTED_SERIALIZABLE_TYPES) {
      if (type.isAssignableFrom(providedType.getClass())) {
         ClassLoader classLoader = provider.getClass().getClassLoader();
         Class<?>[] interfaces = new Class<?>[] {type, SerializableTypeProxy.class, Serializable.class};
         InvocationHandler handler = new TypeProxyInvocationHandler(provider);
         cached = (Type) Proxy.newProxyInstance(classLoader, interfaces, handler);
         cache.put(providedType, cached);
         return cached;
      }
   }
   throw new IllegalArgumentException("Unsupported Type class: " + providedType.getClass().getName());
}
```

TypeProxyInvocationHandler。

```java
public Object invoke(Object proxy, Method method, @Nullable Object[] args) throws Throwable {
   if (method.getName().equals("equals") && args != null) {
      Object other = args[0];
      // Unwrap proxies for speed
      if (other instanceof Type) {
         other = unwrap((Type) other);
      }
      return ObjectUtils.nullSafeEquals(this.provider.getType(), other);
   }
   else if (method.getName().equals("hashCode")) {
      return ObjectUtils.nullSafeHashCode(this.provider.getType());
   }
   else if (method.getName().equals("getTypeProvider")) {
      return this.provider;
   }
   if (Type.class == method.getReturnType() && args == null) {
      return forTypeProvider(new MethodInvokeTypeProvider(this.provider, method, -1));
   }
   else if (Type[].class == method.getReturnType() && args == null) {
      Type[] result = new Type[((Type[]) method.invoke(this.provider.getType())).length];
      for (int i = 0; i < result.length; i++) {
         result[i] = forTypeProvider(new MethodInvokeTypeProvider(this.provider, method, i));
      }
      return result;
   }
   try {
      return method.invoke(this.provider.getType(), args);
   }
   catch (InvocationTargetException ex) {
      throw ex.getTargetException();
   }
}
```

在结合ResolvableType的getType()方法看一下，如果type是代理对象则先调用getTypeProvider()方法得到TypeProvider在调用getType()方法获取到Type。

```java
public Type getType() {
   return SerializableTypeWrapper.unwrap(this.type);
}
```

```java
public static <T extends Type> T unwrap(T type) {
   Type unwrapped = type;
   while (unwrapped instanceof SerializableTypeProxy) {
      unwrapped = ((SerializableTypeProxy) type).getTypeProvider().getType();
   }
   return (unwrapped != null ? (T) unwrapped : type);
}
```

获取type先通过构造函数实例化一个resultType，这个resultType的resolved暂时是null。间接的通过使用相同的Type和TypeProvider作为参数使用另一构造函数实例化一个临时的对象，因为这个构造函数可以生成resolved，再将resolved赋值给 resultType。那为啥不直接使用后者实例化对象呢，因为后者需要一个hashcode，而前者可以生成hashcode。

生成hashCode。

```java
private int calculateHashCode() {
   int hashCode = ObjectUtils.nullSafeHashCode(this.type);
   if (this.typeProvider != null) {
      hashCode = 31 * hashCode + ObjectUtils.nullSafeHashCode(this.typeProvider.getType());
   }
   if (this.variableResolver != null) {
      hashCode = 31 * hashCode + ObjectUtils.nullSafeHashCode(this.variableResolver.getSource());
   }
   if (this.componentType != null) {
      hashCode = 31 * hashCode + ObjectUtils.nullSafeHashCode(this.componentType);
   }
   return hashCode;
}
```

生成resolved。

```java
private Class<?> resolveClass() {
   if (this.type == EmptyType.INSTANCE) {
      return null;
   }
   if (this.type instanceof Class) {
      return (Class<?>) this.type;
   }
   if (this.type instanceof GenericArrayType) {
      Class<?> resolvedComponent = getComponentType().resolve();
      return (resolvedComponent != null ? Array.newInstance(resolvedComponent, 0).getClass() : null);
   }
   return resolveType().resolve();
}
```

```java
ResolvableType resolveType() {
   if (this.type instanceof ParameterizedType) {
      return forType(((ParameterizedType) this.type).getRawType(), this.variableResolver);
   }
   if (this.type instanceof WildcardType) {
      Type resolved = resolveBounds(((WildcardType) this.type).getUpperBounds());
      if (resolved == null) {
         resolved = resolveBounds(((WildcardType) this.type).getLowerBounds());
      }
      return forType(resolved, this.variableResolver);
   }
   if (this.type instanceof TypeVariable) {
      TypeVariable<?> variable = (TypeVariable<?>) this.type;
      // Try default variable resolution
      if (this.variableResolver != null) {
         ResolvableType resolved = this.variableResolver.resolveVariable(variable);
         if (resolved != null) {
            return resolved;
         }
      }
      // Fallback to bounds
      return forType(resolveBounds(variable.getBounds()), this.variableResolver);
   }
   return NONE;
}
```

resolveClass()方法的目的就是将type转换成相关的Class对象，因为只有满足type instanceof Class才返回，否则继续调用forType()递归上面的代码。

ResolvableType还有一个as方法，功能是沿着继承链向上查找参数指定的ResolvableType。

```java
public ResolvableType as(Class<?> type) {
   if (this == NONE) {
      return NONE;
   }
   if (ObjectUtils.nullSafeEquals(resolve(), type)) {
      return this;
   }
   for (ResolvableType interfaceType : getInterfaces()) {
      ResolvableType interfaceAsType = interfaceType.as(type);
      if (interfaceAsType != NONE) {
         return interfaceAsType;
      }
   }
   return getSuperType().as(type);
}
```

下面看看文章开头提及的getSuperType()方法。

```java
public ResolvableType getSuperType() {
   Class<?> resolved = resolve();
   if (resolved == null || resolved.getGenericSuperclass() == null) {
      return NONE;
   }
   ResolvableType superType = this.superType;
   if (superType == null) {
      superType = forType(SerializableTypeWrapper.forGenericSuperclass(resolved), asVariableResolver());
      this.superType = superType;
   }
   return superType;
}
```

SerializableTypeWrapper.forGenericSuperclass(resolved)方法返回当前Class对象父类的可序列化的Type对象，asVariableResolver返回一个DefaultVariableResolver对象，它的resolveVariable()方法用于将TypeVariable转化成 ResolvableType对象，这个类会在isAssignableFrom()方法用到。

```java
private class DefaultVariableResolver implements VariableResolver {
   @Override
   @Nullable
   public ResolvableType resolveVariable(TypeVariable<?> variable) {
      return ResolvableType.this.resolveVariable(variable);
   }
   @Override
   public Object getSource() {
      return ResolvableType.this;
   }
}
```
