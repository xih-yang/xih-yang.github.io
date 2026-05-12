# 07、Spring源码分析 - 07-BeanWrapper
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/7.html
- 分类：J2EE框架
- 分组：教程目录
beans包里一个非常重要的类是BeanWrapper接口和它的相应实现(BeanWrapperImpl)。BeanWrapper提供了设置和获取属性值(单独或批量)、获取属性描述符以及查询属性以确定它们是可读还是可写的功能。BeanWrapper还提供对嵌套属性的支持，能够不受嵌套深度的限制启用子属性的属性设置。然后，BeanWrapper提供了无需目标类代码的支持就能够添加标准JavaBeans的PropertyChangeListeners和VetoableChangeListeners的能力。最后然而并非最不重要的是，BeanWrapper提供了对索引属性设置的支持。BeanWrapper通常不会被应用程序的代码直接使用，而是由DataBinder和BeanFactory使用。

BeanWrapper的名字已经部分暗示了它的工作方式：它包装一个bean以对其执行操作，比如设置和获取属性。

#### 设置并获取基本和嵌套属性

使用**setPropertyValue(s)**和**getPropertyValue(s)**可以设置并获取属性，两者都带有几个重载方法。在Spring自带的java文档中对它们有更详细的描述。重要的是要知道对象属性指示的几个约定。几个例子：

表达式
说明

name
表示属性name与方法getName()或isName()和setName()相对应

account.name
表示属性account的嵌套属性name与方法getAccount().setName()或getAccount().getName()相对应

account[2]
表示索引属性account的第三个元素。索引属性可以是array、list或其他自然排序的集合

account[COMPANYNAME]
表示映射属性account被键COMPANYNAME索引到的映射项的值

BeanWrapperImpl继承关系。

BeanWrapperImpl实现了诸多接口，下面从上往下依次接受这些接口以及实现类。

PropertyEditorRegistry提供了属性编辑器注册与查找的方法，属性编辑器相关请看这里《[属性编辑器PropertyEditor](https://blog.csdn.net/shenchaohao12321/article/details/80295371)》。

```java
public interface PropertyEditorRegistry {
   void registerCustomEditor(Class<?> requiredType, PropertyEditor propertyEditor);
   void registerCustomEditor(@Nullable Class<?> requiredType, @Nullable String propertyPath, PropertyEditor propertyEditor);
   @Nullable
   PropertyEditor findCustomEditor(@Nullable Class<?> requiredType, @Nullable String propertyPath);
}
```

Spring还定义了一个接口用于为PropertyEditorRegistry批量注册属性编辑器。

```java
public interface PropertyEditorRegistrar {
   void registerCustomEditors(PropertyEditorRegistry registry);
}
```

对于在Spring ApplicationContext中批量注册属性编辑器可是使用CustomEditorConfigurer。

```java
@Override
public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
   if (this.propertyEditorRegistrars != null) {
      for (PropertyEditorRegistrar propertyEditorRegistrar : this.propertyEditorRegistrars) {
         beanFactory.addPropertyEditorRegistrar(propertyEditorRegistrar);
      }
   }
   if (this.customEditors != null) {
      this.customEditors.forEach(beanFactory::registerCustomEditor);
   }
}
```

下面是ResourceEditorRegistrar批量注册属性编辑器的实现。

```java
public class ResourceEditorRegistrar implements PropertyEditorRegistrar {
   private final PropertyResolver propertyResolver;
   private final ResourceLoader resourceLoader;
   public ResourceEditorRegistrar(ResourceLoader resourceLoader, PropertyResolver propertyResolver) {
      this.resourceLoader = resourceLoader;
      this.propertyResolver = propertyResolver;
   }
   @Override
   public void registerCustomEditors(PropertyEditorRegistry registry) {
      ResourceEditor baseEditor = new ResourceEditor(this.resourceLoader, this.propertyResolver);
      doRegisterEditor(registry, Resource.class, baseEditor);
      doRegisterEditor(registry, ContextResource.class, baseEditor);
      doRegisterEditor(registry, InputStream.class, new InputStreamEditor(baseEditor));
      doRegisterEditor(registry, InputSource.class, new InputSourceEditor(baseEditor));
      doRegisterEditor(registry, File.class, new FileEditor(baseEditor));
      doRegisterEditor(registry, Path.class, new PathEditor(baseEditor));
      doRegisterEditor(registry, Reader.class, new ReaderEditor(baseEditor));
      doRegisterEditor(registry, URL.class, new URLEditor(baseEditor));
      ClassLoader classLoader = this.resourceLoader.getClassLoader();
      doRegisterEditor(registry, URI.class, new URIEditor(classLoader));
      doRegisterEditor(registry, Class.class, new ClassEditor(classLoader));
      doRegisterEditor(registry, Class[].class, new ClassArrayEditor(classLoader));
      if (this.resourceLoader instanceof ResourcePatternResolver) {
         doRegisterEditor(registry, Resource[].class,
               new ResourceArrayPropertyEditor((ResourcePatternResolver) this.resourceLoader, this.propertyResolver));
      }
   }
   private void doRegisterEditor(PropertyEditorRegistry registry, Class<?> requiredType, PropertyEditor editor) {
      if (registry instanceof PropertyEditorRegistrySupport) {
         ((PropertyEditorRegistrySupport) registry).overrideDefaultEditor(requiredType, editor);
      }
      else {
         registry.registerCustomEditor(requiredType, editor);
      }
   }
}
```

PropertyEditorRegistry实现类有两个分支一个是PropertyEditorRegistrySupport和DataBinder。DataBinder以后再介绍。

PropertyEditorRegistrySupport主要成员变量。

```java
@Nullable
private ConversionService conversionService;//可以注入，通过getConversionService()方法获取。
private boolean defaultEditorsActive = false;//为true，getDefaultEditor()方法才会注册默认提供的属性编辑器。
private boolean configValueEditorsActive = false;//为true会为String[].class，short[].class，int[].class，long[].class注册一个StringArrayPropertyEditor
@Nullable
private Map<Class<?>, PropertyEditor> defaultEditors;//默认属性编辑器的容器
@Nullable
private Map<Class<?>, PropertyEditor> overriddenDefaultEditors;//用于覆盖默认属性编辑器
@Nullable
private Map<Class<?>, PropertyEditor> customEditors;//自定义属性编辑器
@Nullable
private Map<String, CustomEditorHolder> customEditorsForPath;//带path的
```

PropertyEditorRegistrySupport提供了PropertyEditorRegistry的默认实现，并且getDefaultEditor()方法会注册一批Spring提供的属性编辑器。在PropertyEditorRegistrySupport这个分支的集成体系下，TypeConverterSupport的convertIfNecessary()方法会调用到getDefaultEditor()方法，这个稍后再讲。

```java
public PropertyEditor getDefaultEditor(Class<?> requiredType) {
   if (!this.defaultEditorsActive) {
      return null;
   }
   if (this.overriddenDefaultEditors != null) {
      PropertyEditor editor = this.overriddenDefaultEditors.get(requiredType);
      if (editor != null) {
         return editor;
      }
   }
   if (this.defaultEditors == null) {
      createDefaultEditors();//注册默认提供了属性编辑器
   }
   return this.defaultEditors.get(requiredType);
}
```

```java
private void createDefaultEditors() {
   this.defaultEditors = new HashMap<>(64);
   // Simple editors, without parameterization capabilities.
   // The JDK does not contain a default editor for any of these target types.
   this.defaultEditors.put(Charset.class, new CharsetEditor());
   this.defaultEditors.put(Class.class, new ClassEditor());
   this.defaultEditors.put(Class[].class, new ClassArrayEditor());
   this.defaultEditors.put(Currency.class, new CurrencyEditor());
   this.defaultEditors.put(File.class, new FileEditor());
   this.defaultEditors.put(InputStream.class, new InputStreamEditor());
   this.defaultEditors.put(InputSource.class, new InputSourceEditor());
   this.defaultEditors.put(Locale.class, new LocaleEditor());
   this.defaultEditors.put(Path.class, new PathEditor());
   this.defaultEditors.put(Pattern.class, new PatternEditor());
   this.defaultEditors.put(Properties.class, new PropertiesEditor());
   this.defaultEditors.put(Reader.class, new ReaderEditor());
   this.defaultEditors.put(Resource[].class, new ResourceArrayPropertyEditor());
   this.defaultEditors.put(TimeZone.class, new TimeZoneEditor());
   this.defaultEditors.put(URI.class, new URIEditor());
   this.defaultEditors.put(URL.class, new URLEditor());
   this.defaultEditors.put(UUID.class, new UUIDEditor());
   this.defaultEditors.put(ZoneId.class, new ZoneIdEditor());
   // Default instances of collection editors.
   // Can be overridden by registering custom instances of those as custom editors.
   this.defaultEditors.put(Collection.class, new CustomCollectionEditor(Collection.class));
   this.defaultEditors.put(Set.class, new CustomCollectionEditor(Set.class));
   this.defaultEditors.put(SortedSet.class, new CustomCollectionEditor(SortedSet.class));
   this.defaultEditors.put(List.class, new CustomCollectionEditor(List.class));
   this.defaultEditors.put(SortedMap.class, new CustomMapEditor(SortedMap.class));
   // Default editors for primitive arrays.
   this.defaultEditors.put(byte[].class, new ByteArrayPropertyEditor());
   this.defaultEditors.put(char[].class, new CharArrayPropertyEditor());
   // The JDK does not contain a default editor for char!
   this.defaultEditors.put(char.class, new CharacterEditor(false));
   this.defaultEditors.put(Character.class, new CharacterEditor(true));
   // Spring's CustomBooleanEditor accepts more flag values than the JDK's default editor.
   this.defaultEditors.put(boolean.class, new CustomBooleanEditor(false));
   this.defaultEditors.put(Boolean.class, new CustomBooleanEditor(true));
   // The JDK does not contain default editors for number wrapper types!
   // Override JDK primitive number editors with our own CustomNumberEditor.
   this.defaultEditors.put(byte.class, new CustomNumberEditor(Byte.class, false));
   this.defaultEditors.put(Byte.class, new CustomNumberEditor(Byte.class, true));
   this.defaultEditors.put(short.class, new CustomNumberEditor(Short.class, false));
   this.defaultEditors.put(Short.class, new CustomNumberEditor(Short.class, true));
   this.defaultEditors.put(int.class, new CustomNumberEditor(Integer.class, false));
   this.defaultEditors.put(Integer.class, new CustomNumberEditor(Integer.class, true));
   this.defaultEditors.put(long.class, new CustomNumberEditor(Long.class, false));
   this.defaultEditors.put(Long.class, new CustomNumberEditor(Long.class, true));
   this.defaultEditors.put(float.class, new CustomNumberEditor(Float.class, false));
   this.defaultEditors.put(Float.class, new CustomNumberEditor(Float.class, true));
   this.defaultEditors.put(double.class, new CustomNumberEditor(Double.class, false));
   this.defaultEditors.put(Double.class, new CustomNumberEditor(Double.class, true));
   this.defaultEditors.put(BigDecimal.class, new CustomNumberEditor(BigDecimal.class, true));
   this.defaultEditors.put(BigInteger.class, new CustomNumberEditor(BigInteger.class, true));
   // Only register config value editors if explicitly requested.
   if (this.configValueEditorsActive) {
      StringArrayPropertyEditor sae = new StringArrayPropertyEditor();
      this.defaultEditors.put(String[].class, sae);
      this.defaultEditors.put(short[].class, sae);
      this.defaultEditors.put(int[].class, sae);
      this.defaultEditors.put(long[].class, sae);
   }
}
```

如果上面默认类型没有我们需要的，可以调用registerCustomEditor()方法为我们的类型注册属性编辑器。

```java
@Override
public void registerCustomEditor(Class<?> requiredType, PropertyEditor propertyEditor) {
   registerCustomEditor(requiredType, null, propertyEditor);
}
@Override
public void registerCustomEditor(@Nullable Class<?> requiredType, @Nullable String propertyPath, PropertyEditor propertyEditor) {
   if (requiredType == null && propertyPath == null) {
      throw new IllegalArgumentException("Either requiredType or propertyPath is required");
   }
   if (propertyPath != null) {
      if (this.customEditorsForPath == null) {
         this.customEditorsForPath = new LinkedHashMap<>(16);
      }
      this.customEditorsForPath.put(propertyPath, new CustomEditorHolder(propertyEditor, requiredType));
   }
   else {
      if (this.customEditors == null) {
         this.customEditors = new LinkedHashMap<>(16);
      }
      this.customEditors.put(requiredType, propertyEditor);
      this.customEditorCache = null;
   }
}
```

如果默认注册的属性编辑器不能满足我们的需求，可以使用overrideDefaultEditor()方法。因为getDefaultEditor()方法优先从overriddenDefaultEditors查找。

```java
public void overrideDefaultEditor(Class<?> requiredType, PropertyEditor propertyEditor) {
   if (this.overriddenDefaultEditors == null) {
      this.overriddenDefaultEditors = new HashMap<>();
   }
   this.overriddenDefaultEditors.put(requiredType, propertyEditor);
}
```

查找属性编辑器的过程，如果传入的是带path的，会先尝试从customEditorsForPath中查找，如果不存在则试图去掉path中的“[...]”在试图从customEditorsForPath查找。如果requiredType==null，调用getPropertyType()返回一个Class对象，默认返回null子类可覆盖。不能从path得到属性编辑器，则再从customEditors查找。

```java
@Override
@Nullable
public PropertyEditor findCustomEditor(@Nullable Class<?> requiredType, @Nullable String propertyPath) {
   Class<?> requiredTypeToUse = requiredType;
   if (propertyPath != null) {
      if (this.customEditorsForPath != null) {
         // Check property-specific editor first.
         PropertyEditor editor = getCustomEditor(propertyPath, requiredType);
         if (editor == null) {
            List<String> strippedPaths = new LinkedList<>();
            addStrippedPropertyPaths(strippedPaths, "", propertyPath);
            for (Iterator<String> it = strippedPaths.iterator(); it.hasNext() && editor == null;) {
               String strippedPath = it.next();
               editor = getCustomEditor(strippedPath, requiredType);
            }
         }
         if (editor != null) {
            return editor;
         }
      }
      if (requiredType == null) {
         requiredTypeToUse = getPropertyType(propertyPath);
      }
   }
   // No property-specific editor -> check type-specific editor.
   return getCustomEditor(requiredTypeToUse);
}
```

```java
private void addStrippedPropertyPaths(List<String> strippedPaths, String nestedPath, String propertyPath) {
   int startIndex = propertyPath.indexOf(PropertyAccessor.PROPERTY_KEY_PREFIX_CHAR);//[
   if (startIndex != -1) {
      int endIndex = propertyPath.indexOf(PropertyAccessor.PROPERTY_KEY_SUFFIX_CHAR);//]
      if (endIndex != -1) {
         String prefix = propertyPath.substring(0, startIndex);
         String key = propertyPath.substring(startIndex, endIndex + 1);
         String suffix = propertyPath.substring(endIndex + 1, propertyPath.length());
         // Strip the first key.
         strippedPaths.add(nestedPath + prefix + suffix);
         // Search for further keys to strip, with the first key stripped.
         addStrippedPropertyPaths(strippedPaths, nestedPath + prefix, suffix);
         // Search for further keys to strip, with the first key not stripped.
         addStrippedPropertyPaths(strippedPaths, nestedPath + prefix + key, suffix);
      }
   }
}
```

根据propertyName从customEditorsForPath中推断出bean的Class。

```java
protected Class<?> guessPropertyTypeFromEditors(String propertyName) {
   if (this.customEditorsForPath != null) {
      CustomEditorHolder editorHolder = this.customEditorsForPath.get(propertyName);
      if (editorHolder == null) {
         List<String> strippedPaths = new LinkedList<>();
         addStrippedPropertyPaths(strippedPaths, "", propertyName);
         for (Iterator<String> it = strippedPaths.iterator(); it.hasNext() && editorHolder == null;) {
            String strippedName = it.next();
            editorHolder = this.customEditorsForPath.get(strippedName);
         }
      }
      if (editorHolder != null) {
         return editorHolder.getRegisteredType();
      }
   }
   return null;
}
```

上面提到**TypeConverterSupport**的convertIfNecessary()方法会触发getDefaultEditor()方法完成默认属性编辑器的注册，这个类实现了TypeConverter接口，convertIfNecessary()方法就定义在这个接口。

```java
public interface TypeConverter {
   @Nullable
   <T> T convertIfNecessary(@Nullable Object value, @Nullable Class<T> requiredType) throws TypeMismatchException;
   @Nullable
   <T> T convertIfNecessary(@Nullable Object value, @Nullable Class<T> requiredType, @Nullable MethodParameter methodParam) throws TypeMismatchException;
   @Nullable
   <T> T convertIfNecessary(@Nullable Object value, @Nullable Class<T> requiredType, @Nullable Field field) throws TypeMismatchException;
}
```

```java
public abstract class TypeConverterSupport extends PropertyEditorRegistrySupport implements TypeConverter {
   @Nullable
   TypeConverterDelegate typeConverterDelegate;
   @Override
   @Nullable
   public <T> T convertIfNecessary(@Nullable Object value, @Nullable Class<T> requiredType) throws TypeMismatchException {
      return doConvert(value, requiredType, null, null);
   }
   @Override
   @Nullable
   public <T> T convertIfNecessary(@Nullable Object value, @Nullable Class<T> requiredType, @Nullable MethodParameter methodParam)
         throws TypeMismatchException {
      return doConvert(value, requiredType, methodParam, null);
   }
   @Override
   @Nullable
   public <T> T convertIfNecessary(@Nullable Object value, @Nullable Class<T> requiredType, @Nullable Field field)
         throws TypeMismatchException {
      return doConvert(value, requiredType, null, field);
   }
   @Nullable
   private <T> T doConvert(@Nullable Object value,@Nullable Class<T> requiredType,
         @Nullable MethodParameter methodParam, @Nullable Field field) throws TypeMismatchException {
      Assert.state(this.typeConverterDelegate != null, "No TypeConverterDelegate");
      try {
         if (field != null) {
            return this.typeConverterDelegate.convertIfNecessary(value, requiredType, field);
         }
         else {
            return this.typeConverterDelegate.convertIfNecessary(value, requiredType, methodParam);
         }
      }
      catch (ConverterNotFoundException | IllegalStateException ex) {
         throw new ConversionNotSupportedException(value, requiredType, ex);
      }
      catch (ConversionException | IllegalArgumentException ex) {
         throw new TypeMismatchException(value, requiredType, ex);
      }
   }
}
```

三个convertIfNecessary()接口方法都是调用doConvert()方法，内部又是委托了TypeConverterDelegate对象，TypeConverterSupport是一个抽象类，需要其子类实例化typeConverterDelegate成员变量。这正的转化都是通过typeConverterDelegate的convertIfNecessary()方法完成的。

TypeConverterDelegate通过构造方法持有一个PropertyEditorRegistrySupport一个引用，核心方法是:

```java
@Nullable
public <T> T convertIfNecessary(@Nullable String propertyName, @Nullable Object oldValue, @Nullable Object newValue,
      @Nullable Class<T> requiredType, @Nullable TypeDescriptor typeDescriptor) throws IllegalArgumentException {
   // Custom editor for this type?
   PropertyEditor editor = this.propertyEditorRegistry.findCustomEditor(requiredType, propertyName);
   ConversionFailedException conversionAttemptEx = null;
   // No custom editor but custom ConversionService specified?
   ConversionService conversionService = this.propertyEditorRegistry.getConversionService();
   if (editor == null && conversionService != null && newValue != null && typeDescriptor != null) {
      TypeDescriptor sourceTypeDesc = TypeDescriptor.forObject(newValue);
      if (conversionService.canConvert(sourceTypeDesc, typeDescriptor)) {
         try {
            return (T) conversionService.convert(newValue, sourceTypeDesc, typeDescriptor);
         }
         catch (ConversionFailedException ex) {
            // fallback to default conversion logic below
            conversionAttemptEx = ex;
         }
      }
   }
   Object convertedValue = newValue;
   // Value not of required type?
   if (editor != null || (requiredType != null && !ClassUtils.isAssignableValue(requiredType, convertedValue))) {
      if (typeDescriptor != null && requiredType != null && Collection.class.isAssignableFrom(requiredType) &&
            convertedValue instanceof String) {
         TypeDescriptor elementTypeDesc = typeDescriptor.getElementTypeDescriptor();
         if (elementTypeDesc != null) {
            Class<?> elementType = elementTypeDesc.getType();
            if (Class.class == elementType || Enum.class.isAssignableFrom(elementType)) {
               convertedValue = StringUtils.commaDelimitedListToStringArray((String) convertedValue);//目标是集合类型支持逗号分隔
            }
         }
      }
      if (editor == null) {
         editor = findDefaultEditor(requiredType);//在这完成的默认属性编辑器的注册
      }
      convertedValue = doConvertValue(oldValue, convertedValue, requiredType, editor);
   }
   boolean standardConversion = false;
   if (requiredType != null) {
      // Try to apply some standard type conversion rules if appropriate.
      if (convertedValue != null) {
         if (Object.class == requiredType) {
            return (T) convertedValue;
         }
         else if (requiredType.isArray()) {
            // Array required -> apply appropriate conversion of elements.
            if (convertedValue instanceof String && Enum.class.isAssignableFrom(requiredType.getComponentType())) {
               convertedValue = StringUtils.commaDelimitedListToStringArray((String) convertedValue);
            }
            return (T) convertToTypedArray(convertedValue, propertyName, requiredType.getComponentType());
         }
         else if (convertedValue instanceof Collection) {
            // Convert elements to target type, if determined.
            convertedValue = convertToTypedCollection(
                  (Collection<?>) convertedValue, propertyName, requiredType, typeDescriptor);
            standardConversion = true;
         }
         else if (convertedValue instanceof Map) {
            // Convert keys and values to respective target type, if determined.
            convertedValue = convertToTypedMap(
                  (Map<?, ?>) convertedValue, propertyName, requiredType, typeDescriptor);
            standardConversion = true;
         }
         if (convertedValue.getClass().isArray() && Array.getLength(convertedValue) == 1) {
            convertedValue = Array.get(convertedValue, 0);
            standardConversion = true;
         }
         if (String.class == requiredType && ClassUtils.isPrimitiveOrWrapper(convertedValue.getClass())) {
            // We can stringify any primitive value...
            return (T) convertedValue.toString();
         }
         else if (convertedValue instanceof String && !requiredType.isInstance(convertedValue)) {
            if (conversionAttemptEx == null && !requiredType.isInterface() && !requiredType.isEnum()) {
               try {
                  Constructor<T> strCtor = requiredType.getConstructor(String.class);
                  return BeanUtils.instantiateClass(strCtor, convertedValue);
               }
               catch (NoSuchMethodException ex) {
                  // proceed with field lookup
                  if (logger.isTraceEnabled()) {
                     logger.trace("No String constructor found on type [" + requiredType.getName() + "]", ex);
                  }
               }
               catch (Exception ex) {
                  if (logger.isDebugEnabled()) {
                     logger.debug("Construction via String failed for type [" + requiredType.getName() + "]", ex);
                  }
               }
            }
            String trimmedValue = ((String) convertedValue).trim();
            if (requiredType.isEnum() && "".equals(trimmedValue)) {
               // It's an empty enum identifier: reset the enum value to null.
               return null;
            }
            convertedValue = attemptToConvertStringToEnum(requiredType, trimmedValue, convertedValue);
            standardConversion = true;
         }
         else if (convertedValue instanceof Number && Number.class.isAssignableFrom(requiredType)) {
            convertedValue = NumberUtils.convertNumberToTargetClass(
                  (Number) convertedValue, (Class<Number>) requiredType);
            standardConversion = true;
         }
      }
      else {
         // convertedValue == null
         if (requiredType == Optional.class) {
            convertedValue = Optional.empty();
         }
      }
      if (!ClassUtils.isAssignableValue(requiredType, convertedValue)) {
         if (conversionAttemptEx != null) {
            // Original exception from former ConversionService call above...
            throw conversionAttemptEx;
         }
         else if (conversionService != null && typeDescriptor != null) {
            // ConversionService not tried before, probably custom editor found
            // but editor couldn't produce the required type...
            TypeDescriptor sourceTypeDesc = TypeDescriptor.forObject(newValue);
            if (conversionService.canConvert(sourceTypeDesc, typeDescriptor)) {
               return (T) conversionService.convert(newValue, sourceTypeDesc, typeDescriptor);
            }
         }
         // Definitely doesn't match: throw IllegalArgumentException/IllegalStateException
         StringBuilder msg = new StringBuilder();
         msg.append("Cannot convert value of type '").append(ClassUtils.getDescriptiveType(newValue));
         msg.append("' to required type '").append(ClassUtils.getQualifiedName(requiredType)).append("'");
         if (propertyName != null) {
            msg.append(" for property '").append(propertyName).append("'");
         }
         if (editor != null) {
            msg.append(": PropertyEditor [").append(editor.getClass().getName()).append(
                  "] returned inappropriate value of type '").append(
                  ClassUtils.getDescriptiveType(convertedValue)).append("'");
            throw new IllegalArgumentException(msg.toString());
         }
         else {
            msg.append(": no matching editors or conversion strategy found");
            throw new IllegalStateException(msg.toString());
         }
      }
   }
   if (conversionAttemptEx != null) {
      if (editor == null && !standardConversion && requiredType != null && Object.class != requiredType) {
         throw conversionAttemptEx;
      }
      logger.debug("Original ConversionService attempt failed - ignored since " +
            "PropertyEditor based conversion eventually succeeded", conversionAttemptEx);
   }
   return (T) convertedValue;
}
```

首先从propertyEditorRegistry得到属性编辑器editor，如果editor==null并且propertyEditorRegistry含有ConversionService对象，则尝试使用ConversionService完成属性值转换。如果editor==null，findDefaultEditor()方法中调用propertyEditorRegistry.getDefaultEditor(requiredType)注册默认属性编辑器并从默认的属性编辑器查找requiredType对应的返回。doConvertValue()方法使用requiredType对应的一个默认的属性编辑器进行属性转换(针对convertedValue是String或String[])。后面是针对数组集合或Map的转换，不再一一查看了。

**PropertyAccessor**接口定义了对象属性读写相关的方法：

```java
public interface PropertyAccessor {
   String NESTED_PROPERTY_SEPARATOR = ".";
   char NESTED_PROPERTY_SEPARATOR_CHAR = '.';
   String PROPERTY_KEY_PREFIX = "[";
   char PROPERTY_KEY_PREFIX_CHAR = '[';
   String PROPERTY_KEY_SUFFIX = "]";
   char PROPERTY_KEY_SUFFIX_CHAR = ']';
   boolean isReadableProperty(String propertyName);
   boolean isWritableProperty(String propertyName);
   @Nullable
   Class<?> getPropertyType(String propertyName) throws BeansException;
   @Nullable
   TypeDescriptor getPropertyTypeDescriptor(String propertyName) throws BeansException;
   @Nullable
   Object getPropertyValue(String propertyName) throws BeansException;
   void setPropertyValue(String propertyName, @Nullable Object value) throws BeansException;
   void setPropertyValue(PropertyValue pv) throws BeansException;
   void setPropertyValues(Map<?, ?> map) throws BeansException;
   void setPropertyValues(PropertyValues pvs) throws BeansException;
   void setPropertyValues(PropertyValues pvs, boolean ignoreUnknown) throws BeansException;
   void setPropertyValues(PropertyValues pvs, boolean ignoreUnknown, boolean ignoreInvalid) throws BeansException;
}
```

ConfigurablePropertyAccessor又扩展了PropertyAccessor。

```java
public interface ConfigurablePropertyAccessor extends PropertyAccessor, PropertyEditorRegistry, TypeConverter {
   void setConversionService(@Nullable ConversionService conversionService);
   @Nullable
   ConversionService getConversionService();
   void setExtractOldValueForEditor(boolean extractOldValueForEditor);
   boolean isExtractOldValueForEditor();
   void setAutoGrowNestedPaths(boolean autoGrowNestedPaths);//对一个为null的属性设置值是是否实例化这个属性
   boolean isAutoGrowNestedPaths();
}
```

AbstractPropertyAccessor中主要处理了ignoreUnknown与ignoreInvalid，其读写属性值交给抽象方法getPropertyValue()和setPropertyValue()由子类完成具体的实现。

```java
public abstract class AbstractPropertyAccessor extends TypeConverterSupport implements ConfigurablePropertyAccessor {
   private boolean extractOldValueForEditor = false;
   private boolean autoGrowNestedPaths = false;
   @Override
   public void setExtractOldValueForEditor(boolean extractOldValueForEditor) {
      this.extractOldValueForEditor = extractOldValueForEditor;
   }
   @Override
   public boolean isExtractOldValueForEditor() {
      return this.extractOldValueForEditor;
   }
   @Override
   public void setAutoGrowNestedPaths(boolean autoGrowNestedPaths) {
      this.autoGrowNestedPaths = autoGrowNestedPaths;
   }
   @Override
   public boolean isAutoGrowNestedPaths() {
      return this.autoGrowNestedPaths;
   }
   @Override
   public void setPropertyValue(PropertyValue pv) throws BeansException {
      setPropertyValue(pv.getName(), pv.getValue());
   }
   @Override
   public void setPropertyValues(Map<?, ?> map) throws BeansException {
      setPropertyValues(new MutablePropertyValues(map));
   }
   @Override
   public void setPropertyValues(PropertyValues pvs) throws BeansException {
      setPropertyValues(pvs, false, false);
   }
   @Override
   public void setPropertyValues(PropertyValues pvs, boolean ignoreUnknown) throws BeansException {
      setPropertyValues(pvs, ignoreUnknown, false);
   }
   @Override
   public void setPropertyValues(PropertyValues pvs, boolean ignoreUnknown, boolean ignoreInvalid)
         throws BeansException {
      List<PropertyAccessException> propertyAccessExceptions = null;
      List<PropertyValue> propertyValues = (pvs instanceof MutablePropertyValues ?
            ((MutablePropertyValues) pvs).getPropertyValueList() : Arrays.asList(pvs.getPropertyValues()));
      for (PropertyValue pv : propertyValues) {
         try {
            // This method may throw any BeansException, which won't be caught
            // here, if there is a critical failure such as no matching field.
            // We can attempt to deal only with less serious exceptions.
            setPropertyValue(pv);
         }
         catch (NotWritablePropertyException ex) {
            if (!ignoreUnknown) {
               throw ex;
            }
            // Otherwise, just ignore it and continue...
         }
         catch (NullValueInNestedPathException ex) {
            if (!ignoreInvalid) {
               throw ex;
            }
            // Otherwise, just ignore it and continue...
         }
         catch (PropertyAccessException ex) {
            if (propertyAccessExceptions == null) {
               propertyAccessExceptions = new LinkedList<>();
            }
            propertyAccessExceptions.add(ex);
         }
      }
      // If we encountered individual exceptions, throw the composite exception.
      if (propertyAccessExceptions != null) {
         PropertyAccessException[] paeArray =
               propertyAccessExceptions.toArray(new PropertyAccessException[propertyAccessExceptions.size()]);
         throw new PropertyBatchUpdateException(paeArray);
      }
   }
   // Redefined with public visibility.
   @Override
   @Nullable
   public Class<?> getPropertyType(String propertyPath) {
      return null;
   }
   @Override
   @Nullable
   public abstract Object getPropertyValue(String propertyName) throws BeansException;
   @Override
   public abstract void setPropertyValue(String propertyName, @Nullable Object value) throws BeansException;
}
```

AbstractNestablePropertyAccessor实现了读取写入的具体实现，它有四个重要的成员变量：

```java
@Nullable
Object wrappedObject;//当前属性所代表的对象
private String nestedPath = "";//当前属性所在父对象的路径
@Nullable
Object rootObject;//父对象
/** Map with cached nested Accessors: nested path -> Accessor instance */
@Nullable
private Map<String, AbstractNestablePropertyAccessor> nestedPropertyAccessors;//当前对象的属性路径与该属性PropertyAccessor的映射缓存
```

```java
@Override
public void setPropertyValue(String propertyName, @Nullable Object value) throws BeansException {
   AbstractNestablePropertyAccessor nestedPa;
   try {
      nestedPa = getPropertyAccessorForPropertyPath(propertyName);
   }
   catch (NotReadablePropertyException ex) {
      throw new NotWritablePropertyException(getRootClass(), this.nestedPath + propertyName,
            "Nested property in path '" + propertyName + "' does not exist", ex);
   }
   PropertyTokenHolder tokens = getPropertyNameTokens(getFinalPath(nestedPa, propertyName));
   nestedPa.setPropertyValue(tokens, new PropertyValue(propertyName, value));
}
```

对于设置属性值：

**1、** 首先找到该propertyName对应的AbstractNestablePropertyAccessor；

```java
protected AbstractNestablePropertyAccessor getPropertyAccessorForPropertyPath(String propertyPath) {
   int pos = PropertyAccessorUtils.getFirstNestedPropertySeparatorIndex(propertyPath);
   // Handle nested properties recursively.
   if (pos > -1) {
      String nestedProperty = propertyPath.substring(0, pos);
      String nestedPath = propertyPath.substring(pos + 1);
      AbstractNestablePropertyAccessor nestedPa = getNestedPropertyAccessor(nestedProperty);
      return nestedPa.getPropertyAccessorForPropertyPath(nestedPath);
   }
   else {
      return this;
   }
}
```

**1、** 1根据第一个非中括号内逗号，找到当前nestedPa的顶层属性；

**1、** 1.1如果pos==-1，则说明propertyPath是一个非嵌套属性，直接返回当前对象；

**1、** 1.2如果pos>-1则代表propertyPath是一个嵌套属性这时候需要沿着根对象一层一层向下找，直到当前层的propertyPath又是一个非嵌套属性；

```java
private AbstractNestablePropertyAccessor getNestedPropertyAccessor(String nestedProperty) {
   if (this.nestedPropertyAccessors == null) {
      this.nestedPropertyAccessors = new HashMap<>();
   }
   // Get value of bean property.
   PropertyTokenHolder tokens = getPropertyNameTokens(nestedProperty);
   String canonicalName = tokens.canonicalName;
   Object value = getPropertyValue(tokens);
   if (value == null || (value instanceof Optional && !((Optional) value).isPresent())) {
      if (isAutoGrowNestedPaths()) {
         value = setDefaultValue(tokens);
      }
      else {
         throw new NullValueInNestedPathException(getRootClass(), this.nestedPath + canonicalName);
      }
   }
   // Lookup cached sub-PropertyAccessor, create new one if not found.
   AbstractNestablePropertyAccessor nestedPa = this.nestedPropertyAccessors.get(canonicalName);
   if (nestedPa == null || nestedPa.getWrappedInstance() != ObjectUtils.unwrapOptional(value)) {
      if (logger.isTraceEnabled()) {
         logger.trace("Creating new nested " + getClass().getSimpleName() + " for property '" + canonicalName + "'");
      }
      nestedPa = newNestedPropertyAccessor(value, this.nestedPath + canonicalName + NESTED_PROPERTY_SEPARATOR);
      // Inherit all type-specific PropertyEditors.
      copyDefaultEditorsTo(nestedPa);
      copyCustomEditorsTo(nestedPa, canonicalName);
      this.nestedPropertyAccessors.put(canonicalName, nestedPa);
   }
   else {
      if (logger.isTraceEnabled()) {
         logger.trace("Using cached nested property accessor for property '" + canonicalName + "'");
      }
   }
   return nestedPa;
}
```

**1、** 1.2.1将nestedProperty转换为PropertyTokenHolder；

```java
private PropertyTokenHolder getPropertyNameTokens(String propertyName) {
   String actualName = null;
   List<String> keys = new ArrayList<>(2);
   int searchIndex = 0;
   while (searchIndex != -1) {
      int keyStart = propertyName.indexOf(PROPERTY_KEY_PREFIX, searchIndex);
      searchIndex = -1;
      if (keyStart != -1) {
         int keyEnd = propertyName.indexOf(PROPERTY_KEY_SUFFIX, keyStart + PROPERTY_KEY_PREFIX.length());
         if (keyEnd != -1) {
            if (actualName == null) {
               actualName = propertyName.substring(0, keyStart);
            }
            String key = propertyName.substring(keyStart + PROPERTY_KEY_PREFIX.length(), keyEnd);
            if (key.length() > 1 && (key.startsWith("'") && key.endsWith("'")) ||
                  (key.startsWith("\"") && key.endsWith("\""))) {
               key = key.substring(1, key.length() - 1);
            }
            keys.add(key);
            searchIndex = keyEnd + PROPERTY_KEY_SUFFIX.length();
         }
      }
   }
   PropertyTokenHolder tokens = new PropertyTokenHolder(actualName != null ? actualName : propertyName);
   if (!keys.isEmpty()) {
      tokens.canonicalName += PROPERTY_KEY_PREFIX +
            StringUtils.collectionToDelimitedString(keys, PROPERTY_KEY_SUFFIX + PROPERTY_KEY_PREFIX) +
            PROPERTY_KEY_SUFFIX;
      tokens.keys = StringUtils.toStringArray(keys);
   }
   return tokens;
}
```

**1、** 1.2.2读取当前嵌套属性的值；

```java
protected Object getPropertyValue(PropertyTokenHolder tokens) throws BeansException {
   String propertyName = tokens.canonicalName;
   String actualName = tokens.actualName;
   PropertyHandler ph = getLocalPropertyHandler(actualName);
   if (ph == null || !ph.isReadable()) {
      throw new NotReadablePropertyException(getRootClass(), this.nestedPath + propertyName);
   }
   try {
      Object value = ph.getValue();
      if (tokens.keys != null) {
         if (value == null) {
            if (isAutoGrowNestedPaths()) {
               value = setDefaultValue(new PropertyTokenHolder(tokens.actualName));
            }
            else {
               throw new NullValueInNestedPathException(getRootClass(), this.nestedPath + propertyName,
                     "Cannot access indexed value of property referenced in indexed " +
                           "property path '" + propertyName + "': returned null");
            }
         }
         String indexedPropertyName = tokens.actualName;
         // apply indexes and map keys
         for (int i = 0; i < tokens.keys.length; i++) {
            String key = tokens.keys[i];
            if (value == null) {
               throw new NullValueInNestedPathException(getRootClass(), this.nestedPath + propertyName,
                     "Cannot access indexed value of property referenced in indexed " +
                           "property path '" + propertyName + "': returned null");
            }
            else if (value.getClass().isArray()) {
               int index = Integer.parseInt(key);
               value = growArrayIfNecessary(value, index, indexedPropertyName);
               value = Array.get(value, index);
            }
            else if (value instanceof List) {
               int index = Integer.parseInt(key);
               List<Object> list = (List<Object>) value;
               growCollectionIfNecessary(list, index, indexedPropertyName, ph, i + 1);
               value = list.get(index);
            }
            else if (value instanceof Set) {
               // Apply index to Iterator in case of a Set.
               Set<Object> set = (Set<Object>) value;
               int index = Integer.parseInt(key);
               if (index < 0 || index >= set.size()) {
                  throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
                        "Cannot get element with index " + index + " from Set of size " +
                              set.size() + ", accessed using property path '" + propertyName + "'");
               }
               Iterator<Object> it = set.iterator();
               for (int j = 0; it.hasNext(); j++) {
                  Object elem = it.next();
                  if (j == index) {
                     value = elem;
                     break;
                  }
               }
            }
            else if (value instanceof Map) {
               Map<Object, Object> map = (Map<Object, Object>) value;
               Class<?> mapKeyType = ph.getResolvableType().getNested(i + 1).asMap().resolveGeneric(0);
               // IMPORTANT: Do not pass full property name in here - property editors
               // must not kick in for map keys but rather only for map values.
               TypeDescriptor typeDescriptor = TypeDescriptor.valueOf(mapKeyType);
               Object convertedMapKey = convertIfNecessary(null, null, key, mapKeyType, typeDescriptor);
               value = map.get(convertedMapKey);
            }
            else {
               throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
                     "Property referenced in indexed property path '" + propertyName +
                           "' is neither an array nor a List nor a Set nor a Map; returned value was [" + value + "]");
            }
            indexedPropertyName += PROPERTY_KEY_PREFIX + key + PROPERTY_KEY_SUFFIX;
         }
      }
      return value;
   }
   catch (IndexOutOfBoundsException ex) {
      throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
            "Index of out of bounds in property path '" + propertyName + "'", ex);
   }
   catch (NumberFormatException ex) {
      throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
            "Invalid index in property path '" + propertyName + "'", ex);
   }
   catch (TypeMismatchException ex) {
      throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
            "Invalid index in property path '" + propertyName + "'", ex);
   }
   catch (InvocationTargetException ex) {
      throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
            "Getter for property '" + actualName + "' threw exception", ex);
   }
   catch (Exception ex) {
      throw new InvalidPropertyException(getRootClass(), this.nestedPath + propertyName,
            "Illegal attempt to get property '" + actualName + "' threw exception", ex);
   }
}
```

**1、** 1.2.2.1通过当前属性简单名称得到一个PropertyHandler，该handler持有该属性描述符，通过属性描述符调用getter和setter方法实现对属性值的读写；

```java
protected BeanPropertyHandler getLocalPropertyHandler(String propertyName) {
   PropertyDescriptor pd = getCachedIntrospectionResults().getPropertyDescriptor(propertyName);
   if (pd != null) {
      return new BeanPropertyHandler(pd);
   }
   return null;
}
```

**1、** 1.2.3通过PropertyHandler获取当前属性值如果当前属性非集合或数组(“包含[]”)直接返回属性值，否则需要判断值是否为null，如果是null并且setAutoGrowNestedPaths(true)，构造一个默认值赋值给当前属性；

```java
private Object setDefaultValue(PropertyTokenHolder tokens) {
   pv = createDefaultPropertyValue(tokens);
   setPropertyValue(tokens, pv);
   Object defaultValue = getPropertyValue(tokens);
   Assert.state(defaultValue != null, "Default value must not be null");
   return defaultValue;
}
```

**1、** 1.2.3.1创建一个PropertyValue用于setPropertyValue()赋值；

```java
private PropertyValue createDefaultPropertyValue(PropertyTokenHolder tokens) {
   TypeDescriptor desc = getPropertyTypeDescriptor(tokens.canonicalName);
   if (desc == null) {
      throw new NullValueInNestedPathException(getRootClass(), this.nestedPath + tokens.canonicalName,
            "Could not determine property type for auto-growing a default value");
   }
   Object defaultValue = newValue(desc.getType(), desc, tokens.canonicalName);
   return new PropertyValue(tokens.canonicalName, defaultValue);
}
```

**1、** 1.2.3.1.1得到当前属性的TypeDescriptor，内部通过子类的PropertyHandler取得；

```java
public TypeDescriptor getPropertyTypeDescriptor(String propertyName) throws BeansException {
   try {
      AbstractNestablePropertyAccessor nestedPa = getPropertyAccessorForPropertyPath(propertyName);
      String finalPath = getFinalPath(nestedPa, propertyName);
      PropertyTokenHolder tokens = getPropertyNameTokens(finalPath);
      PropertyHandler ph = nestedPa.getLocalPropertyHandler(tokens.actualName);
      if (ph != null) {
         if (tokens.keys != null) {
            if (ph.isReadable() || ph.isWritable()) {
               return ph.nested(tokens.keys.length);
            }
         }
         else {
            if (ph.isReadable() || ph.isWritable()) {
               return ph.toTypeDescriptor();
            }
         }
      }
   }
   catch (InvalidPropertyException ex) {
      // Consider as not determinable.
   }
   return null;
}
```

**1、** 1.2.3.1.2为这个属性生成一个默认的值，具体默认值规则看下面代码，其中数组最多支持二维的；

```java
private Object newValue(Class<?> type, @Nullable TypeDescriptor desc, String name) {
   try {
      if (type.isArray()) {
         Class<?> componentType = type.getComponentType();
         // TODO - only handles 2-dimensional arrays
         if (componentType.isArray()) {
            Object array = Array.newInstance(componentType, 1);
            Array.set(array, 0, Array.newInstance(componentType.getComponentType(), 0));
            return array;
         }
         else {
            return Array.newInstance(componentType, 0);
         }
      }
      else if (Collection.class.isAssignableFrom(type)) {
         TypeDescriptor elementDesc = (desc != null ? desc.getElementTypeDescriptor() : null);
         return CollectionFactory.createCollection(type, (elementDesc != null ? elementDesc.getType() : null), 16);
      }
      else if (Map.class.isAssignableFrom(type)) {
         TypeDescriptor keyDesc = (desc != null ? desc.getMapKeyTypeDescriptor() : null);
         return CollectionFactory.createMap(type, (keyDesc != null ? keyDesc.getType() : null), 16);
      }
      else {
         Constructor<?> ctor = type.getDeclaredConstructor();
         if (Modifier.isPrivate(ctor.getModifiers())) {
            throw new IllegalAccessException("Auto-growing not allowed with private constructor: " + ctor);
         }
         return BeanUtils.instantiateClass(ctor);
      }
   }
   catch (Throwable ex) {
      throw new NullValueInNestedPathException(getRootClass(), this.nestedPath + name,
            "Could not instantiate property type [" + type.getName() + "] to auto-grow nested property path", ex);
   }
}
```

**1、** 1.2.3.2设置默认值，分两种情况；

```java
protected void setPropertyValue(PropertyTokenHolder tokens, PropertyValue pv) throws BeansException {
   if (tokens.keys != null) {
      processKeyedProperty(tokens, pv);//使用父类的typeConverterDelegate的convertIfNessary（）方法完成对数组，集合，Map的转换
   }
   else {
      processLocalProperty(tokens, pv);//普通java对象的转换
   }
}
```

**1、** 1.2.3.3读取默认值返回ObjectdefaultValue=getPropertyValue(tokens);；

**1、** 1.2.4用当前属性值及当前propertyPath创建当前属性的属性访问器；

```java
protected BeanWrapperImpl newNestedPropertyAccessor(Object object, String nestedPath) {
   return new BeanWrapperImpl(object, nestedPath, this);
}
```

**1、** 1.2.5复制根对象的默认属性编辑器和自定义编辑器；

```java
copyDefaultEditorsTo(nestedPa);
copyCustomEditorsTo(nestedPa, canonicalName);
```

**2、** 分解属性路径为PropertyTokenHolder上述过程的递归一直找到nestedPath；

**3、** 调用该属性propertyName对应的AbstractNestablePropertyAccessor的另一个setPropertyValue()方法完成对属性赋值，上面已经分析过；

最后说一下BeanWrapperImpl实现了BeanWrapper接口，提供了获取属性描述符的方法。

```java
@Override
public PropertyDescriptor[] getPropertyDescriptors() {
   return getCachedIntrospectionResults().getPropertyDescriptors();
}
@Override
public PropertyDescriptor getPropertyDescriptor(String propertyName) throws InvalidPropertyException {
   BeanWrapperImpl nestedBw = (BeanWrapperImpl) getPropertyAccessorForPropertyPath(propertyName);
   String finalPath = getFinalPath(nestedBw, propertyName);
   PropertyDescriptor pd = nestedBw.getCachedIntrospectionResults().getPropertyDescriptor(finalPath);
   if (pd == null) {
      throw new InvalidPropertyException(getRootClass(), getNestedPath() + propertyName,
            "No property '" + propertyName + "' found");
   }
   return pd;
}
PropertyDescriptor getPropertyDescriptor(String name) {
   PropertyDescriptor pd = this.propertyDescriptorCache.get(name);
   if (pd == null && StringUtils.hasLength(name)) {
      // Same lenient fallback checking as in Property...
      pd = this.propertyDescriptorCache.get(StringUtils.uncapitalize(name));
      if (pd == null) {
         pd = this.propertyDescriptorCache.get(StringUtils.capitalize(name));
      }
   }
   return (pd == null || pd instanceof GenericTypeAwarePropertyDescriptor ? pd :
         buildGenericTypeAwarePropertyDescriptor(getBeanClass(), pd));
}
PropertyDescriptor[] getPropertyDescriptors() {
   PropertyDescriptor[] pds = new PropertyDescriptor[this.propertyDescriptorCache.size()];
   int i = 0;
   for (PropertyDescriptor pd : this.propertyDescriptorCache.values()) {
      pds[i] = (pd instanceof GenericTypeAwarePropertyDescriptor ? pd :
            buildGenericTypeAwarePropertyDescriptor(getBeanClass(), pd));
      i++;
   }
   return pds;
}
```

还有一个就是上文提到的BeanPropertyHandler

```java
protected BeanPropertyHandler getLocalPropertyHandler(String propertyName) {
   PropertyDescriptor pd = getCachedIntrospectionResults().getPropertyDescriptor(propertyName);
   if (pd != null) {
      return new BeanPropertyHandler(pd);
   }
   return null;
}
```

BeanPropertyHandler持有了属性描述符，获取属性的getter和setter方法可以对属性完成读取和设置。

```java
private class BeanPropertyHandler extends PropertyHandler {
      private final PropertyDescriptor pd;
      public BeanPropertyHandler(PropertyDescriptor pd) {
         super(pd.getPropertyType(), pd.getReadMethod() != null, pd.getWriteMethod() != null);
         this.pd = pd;
      }
      @Override
      public ResolvableType getResolvableType() {
         return ResolvableType.forMethodReturnType(this.pd.getReadMethod());
      }
      @Override
      public TypeDescriptor toTypeDescriptor() {
         return new TypeDescriptor(property(this.pd));
      }
      @Override
      @Nullable
      public TypeDescriptor nested(int level) {
         return TypeDescriptor.nested(property(pd), level);
      }
      @Override
      @Nullable
      public Object getValue() throws Exception {
         final Method readMethod = this.pd.getReadMethod();
         if (System.getSecurityManager() != null) {
            AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
               ReflectionUtils.makeAccessible(readMethod);
               return null;
            });
            try {
               return AccessController.doPrivileged((PrivilegedExceptionAction<Object>) () ->
                     readMethod.invoke(getWrappedInstance(), (Object[]) null), acc);
            }
            catch (PrivilegedActionException pae) {
               throw pae.getException();
            }
         }
         else {
            ReflectionUtils.makeAccessible(readMethod);
            return readMethod.invoke(getWrappedInstance(), (Object[]) null);
         }
      }
      @Override
      public void setValue(final @Nullable Object value) throws Exception {
         final Method writeMethod = (this.pd instanceof GenericTypeAwarePropertyDescriptor ?
               ((GenericTypeAwarePropertyDescriptor) this.pd).getWriteMethodForActualAccess() :
               this.pd.getWriteMethod());
         if (System.getSecurityManager() != null) {
            AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
               ReflectionUtils.makeAccessible(writeMethod);
               return null;
            });
            try {
               AccessController.doPrivileged((PrivilegedExceptionAction<Object>) () ->
                     writeMethod.invoke(getWrappedInstance(), value), acc);
            }
            catch (PrivilegedActionException ex) {
               throw ex.getException();
            }
         }
         else {
            ReflectionUtils.makeAccessible(writeMethod);
            writeMethod.invoke(getWrappedInstance(), value);
         }
      }
   }
}
```
