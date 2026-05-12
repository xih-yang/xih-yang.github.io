# 08、Spring源码分析 - 08-DataBinder
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/8.html
- 分类：J2EE框架
- 分组：教程目录
DataBinder实现了TypeConverter和PropertyEditorRegistry接口提供了类型转换功能，并且可以对目标对象字段做[Validation](/zhuanlan/j2ee/spring/7/40.html)。

DataBinder有个重要的成员变量bindingResult是AbstractPropertyBindingResult类，我们先分析他的用处。

Errors接口定义了存储与展示关于数据绑定和validation到指定对象的错误信息，AbstractErrors是一个抽象实现。对于错误信息存储的四个方法:

```java
@Override
public void reject(String errorCode) {
   reject(errorCode, null, null);
}
@Override
public void reject(String errorCode, String defaultMessage) {
   reject(errorCode, null, defaultMessage);
}
@Override
public void rejectValue(@Nullable String field, String errorCode) {
   rejectValue(field, errorCode, null, null);
}
@Override
public void rejectValue(@Nullable String field, String errorCode, String defaultMessage) {
   rejectValue(field, errorCode, null, defaultMessage);
}
```

reject()和rejectValue()最终的实现方法被定义在了子类AbstractBindingResult，reject()方法用于为指定对象注册一个全局的错误信息，rejectValue()方法用于为一个对象的指定字段注册一个错误消息。

同样获取错误信息的方法也是给出了基本实现，最终的实现还是定义在了子类中。

```java
@Override
@Nullable
public ObjectError getGlobalError() {
   List<ObjectError> globalErrors = getGlobalErrors();
   return (!globalErrors.isEmpty() ? globalErrors.get(0) : null);
}
@Override
public boolean hasFieldErrors() {
   return (getFieldErrorCount() > 0);
}
@Override
public int getFieldErrorCount() {
   return getFieldErrors().size();
}
@Override
@Nullable
public FieldError getFieldError() {
   List<FieldError> fieldErrors = getFieldErrors();
   return (!fieldErrors.isEmpty() ? fieldErrors.get(0) : null);
}
@Override
public boolean hasFieldErrors(String field) {
   return (getFieldErrorCount(field) > 0);
}
@Override
public int getFieldErrorCount(String field) {
   return getFieldErrors(field).size();
}
@Override
public List<FieldError> getFieldErrors(String field) {
   List<FieldError> fieldErrors = getFieldErrors();
   List<FieldError> result = new LinkedList<>();
   String fixedField = fixedField(field);
   for (FieldError error : fieldErrors) {
      if (isMatchingFieldError(fixedField, error)) {
         result.add(error);
      }
   }
   return Collections.unmodifiableList(result);
}
@Override
@Nullable
public FieldError getFieldError(String field) {
   List<FieldError> fieldErrors = getFieldErrors(field);
   return (!fieldErrors.isEmpty() ? fieldErrors.get(0) : null);
}
@Override
@Nullable
public Class<?> getFieldType(String field) {
   Object value = getFieldValue(field);
   return (value != null ? value.getClass() : null);
}
```

BindingResult接口扩展了Errors接口，额外定义了一些与数据绑定结果相关的方法，下面就看一看BindingResult与AbstractErrors共同的子类AbstractBindingResult。

主要成员变量:

```java
private final String objectName;//为绑定对象起个名字，会作用于错误码和getModel()
private MessageCodesResolver messageCodesResolver = new DefaultMessageCodesResolver();//用于处理错误码，看下面解释
private final List<ObjectError> errors = new LinkedList<>();//存储数据绑定校验出现的错误
private final Map<String, Class<?>> fieldTypes = new HashMap<>(0);//字段名与字段类型
private final Map<String, Object> fieldValues = new HashMap<>(0);//字段名与字段值
private final Set<String> suppressedFields = new HashSet<>();//存储数据绑定不被允许的字段
```

reject()方法内部会将ObjectError或FieldError对象添加到成员变量errors中，这两个对象需要一个String[] codes，messageCodesResolver就是将reject方法参数errorCode转换为codes的作用。看一下他的文档描述。

下面是注册错误消息的实现：

```java
@Override
public void reject(String errorCode, @Nullable Object[] errorArgs, @Nullable String defaultMessage) {
   addError(new ObjectError(getObjectName(), resolveMessageCodes(errorCode), errorArgs, defaultMessage));
}
@Override
public void rejectValue(@Nullable String field, String errorCode, @Nullable Object[] errorArgs,@Nullable String defaultMessage) {
   if ("".equals(getNestedPath()) && !StringUtils.hasLength(field)) {
      // We're at the top of the nested object hierarchy,
      // so the present level is not a field but rather the top object.
      // The best we can do is register a global error here...
      reject(errorCode, errorArgs, defaultMessage);
      return;
   }
   String fixedField = fixedField(field);
   Object newVal = getActualFieldValue(fixedField);
   FieldError fe = new FieldError(getObjectName(), fixedField, newVal, false, resolveMessageCodes(errorCode, field), errorArgs, defaultMessage);
   addError(fe);
}
@Override
public void addError(ObjectError error) {
   this.errors.add(error);
}
```

对于全局错误使用ObjectError，对于字段错误使用FieldError多了字段名字与字段值。

获取错误信息：

```java
@Override
public List<ObjectError> getGlobalErrors() {
   List<ObjectError> result = new LinkedList<>();
   for (ObjectError objectError : this.errors) {
      if (!(objectError instanceof FieldError)) {
         result.add(objectError);
      }
   }
   return Collections.unmodifiableList(result);
}
@Override
@Nullable
public ObjectError getGlobalError() {
   for (ObjectError objectError : this.errors) {
      if (!(objectError instanceof FieldError)) {
         return objectError;
      }
   }
   return null;
}
@Override
public List<FieldError> getFieldErrors() {
   List<FieldError> result = new LinkedList<>();
   for (ObjectError objectError : this.errors) {
      if (objectError instanceof FieldError) {
         result.add((FieldError) objectError);
      }
   }
   return Collections.unmodifiableList(result);
}
@Override
@Nullable
public FieldError getFieldError() {
   for (ObjectError objectError : this.errors) {
      if (objectError instanceof FieldError) {
         return (FieldError) objectError;
      }
   }
   return null;
}
@Override
public List<FieldError> getFieldErrors(String field) {
   List<FieldError> result = new LinkedList<>();
   String fixedField = fixedField(field);
   for (ObjectError objectError : this.errors) {
      if (objectError instanceof FieldError && isMatchingFieldError(fixedField, (FieldError) objectError)) {
         result.add((FieldError) objectError);
      }
   }
   return Collections.unmodifiableList(result);
}
@Override
@Nullable
public FieldError getFieldError(String field) {
   String fixedField = fixedField(field);
   for (ObjectError objectError : this.errors) {
      if (objectError instanceof FieldError) {
         FieldError fieldError = (FieldError) objectError;
         if (isMatchingFieldError(fixedField, fieldError)) {
            return fieldError;
         }
      }
   }
   return null;
}
```

isMatchingFieldError()方法支持*号匹配。

```java
protected boolean isMatchingFieldError(String field, FieldError fieldError) {
   if (field.equals(fieldError.getField())) {
      return true;
   }
   // Optimization: use charAt and regionMatches instead of endsWith and startsWith (SPR-11304)
   int endIndex = field.length() - 1;
   return (endIndex >= 0 && field.charAt(endIndex) == '*' &&
         (endIndex == 0 || field.regionMatches(0, fieldError.getField(), 0, endIndex)));
}
```

```java
@Override
@Nullable
public Object getFieldValue(String field) {
   FieldError fieldError = getFieldError(field);
   // Use rejected value in case of error, current field value otherwise.
   if (fieldError != null) {
      Object value = fieldError.getRejectedValue();
      // Do not apply formatting on binding failures like type mismatches.
      return (fieldError.isBindingFailure() ? value : formatFieldValue(field, value));
   }
   else if (getTarget() != null) {
      Object value = getActualFieldValue(fixedField(field));
      return formatFieldValue(field, value);
   }
   else {
      return this.fieldValues.get(field);
   }
}
@Override
@Nullable
public Class<?> getFieldType(@Nullable String field) {
   if (getTarget() != null) {
      Object value = getActualFieldValue(fixedField(field));
      if (value != null) {
         return value.getClass();
      }
   }
   return this.fieldTypes.get(field);
}
@Override
@Nullable
public Object getRawFieldValue(String field) {
   return (getTarget() != null ? getActualFieldValue(fixedField(field)) : null);
}
```

上面方法中会用到子类实现方法getActualFieldValue(),formatFieldValue()。看一下在AbstractPropertyBindingResult中的实现：

```java
@Override
@Nullable
public Class<?> getFieldType(@Nullable String field) {
   return (getTarget() != null ? getPropertyAccessor().getPropertyType(fixedField(field)) :
         super.getFieldType(field));
}
@Override
@Nullable
protected Object getActualFieldValue(String field) {
   return getPropertyAccessor().getPropertyValue(field);
}
@Override
protected Object formatFieldValue(String field, @Nullable Object value) {
   String fixedField = fixedField(field);
   // Try custom editor...
   PropertyEditor customEditor = getCustomEditor(fixedField);
   if (customEditor != null) {
      customEditor.setValue(value);
      String textValue = customEditor.getAsText();
      // If the PropertyEditor returned null, there is no appropriate
      // text representation for this value: only use it if non-null.
      if (textValue != null) {
         return textValue;
      }
   }
   if (this.conversionService != null) {
      // Try custom converter...
      TypeDescriptor fieldDesc = getPropertyAccessor().getPropertyTypeDescriptor(fixedField);
      TypeDescriptor strDesc = TypeDescriptor.valueOf(String.class);
      if (fieldDesc != null && this.conversionService.canConvert(fieldDesc, strDesc)) {
         return this.conversionService.convert(value, fieldDesc, strDesc);
      }
   }
   return value;
}
```

getPropertyAccessor()方法是一个抽象方法，由子类实现，看下在 BeanPropertyBindingResult中的实现：

```java
@Override
public final ConfigurablePropertyAccessor getPropertyAccessor() {
   if (this.beanWrapper == null) {
      this.beanWrapper = createBeanWrapper();
      this.beanWrapper.setExtractOldValueForEditor(true);
      this.beanWrapper.setAutoGrowNestedPaths(this.autoGrowNestedPaths);
      this.beanWrapper.setAutoGrowCollectionLimit(this.autoGrowCollectionLimit);
   }
   return this.beanWrapper;
}
protected BeanWrapper createBeanWrapper() {
   if (this.target == null) {
      throw new IllegalStateException("Cannot access properties on null bean instance '" + getObjectName() + "'");
   }
   return PropertyAccessorFactory.forBeanPropertyAccess(this.target);
}
```

BeanPropertyBindingResult，Errors和BindingResult接口的默认实现，用于注册和评估JavaBean对象上的绑定错误。执行标准JavaBean属性访问，也支持嵌套属性。 通常，应用程序代码将与Errors接口或BindingResult接口一起使用。DataBinder通过getBindingResult()方法返回其BindingResult。

```java
public class BeanPropertyBindingResult extends AbstractPropertyBindingResult implements Serializable {
   @Nullable
   private final Object target;
   //是否“自动创建”包含空值的嵌套路径的实例
   private final boolean autoGrowNestedPaths;
   //是否限制数组和集合自动增长
   private final int autoGrowCollectionLimit;
   @Nullable
   private transient BeanWrapper beanWrapper;
   public BeanPropertyBindingResult(@Nullable Object target, String objectName) {
      this(target, objectName, true, Integer.MAX_VALUE);
   }
   public BeanPropertyBindingResult(@Nullable Object target, String objectName, boolean autoGrowNestedPaths, int autoGrowCollectionLimit) {
      super(objectName);
      this.target = target;
      this.autoGrowNestedPaths = autoGrowNestedPaths;
      this.autoGrowCollectionLimit = autoGrowCollectionLimit;
   }
   @Override
   @Nullable
   public final Object getTarget() {
      return this.target;
   }
   @Override
   public final ConfigurablePropertyAccessor getPropertyAccessor() {
      if (this.beanWrapper == null) {
         this.beanWrapper = createBeanWrapper();
         this.beanWrapper.setExtractOldValueForEditor(true);
         this.beanWrapper.setAutoGrowNestedPaths(this.autoGrowNestedPaths);
         this.beanWrapper.setAutoGrowCollectionLimit(this.autoGrowCollectionLimit);
      }
      return this.beanWrapper;
   }
   protected BeanWrapper createBeanWrapper() {
      if (this.target == null) {
         throw new IllegalStateException("Cannot access properties on null bean instance '" + getObjectName() + "'");
      }
      return PropertyAccessorFactory.forBeanPropertyAccess(this.target);
   }
}
```

我们已经知道了BindingResult的体系机构了，下面正式说一下DataBinder了。

```java
@Nullable
private final Object target;//需要数据绑定的对象
private final String objectName;//给对象起得名字默认target
@Nullable
private AbstractPropertyBindingResult bindingResult;//数据绑定后的结果
@Nullable
private SimpleTypeConverter typeConverter;//当target!=null时不会用到
private boolean ignoreUnknownFields = true;//忽略target不存在的属性，作用于PropertyAccessor的setPropertyValues()方法
private boolean ignoreInvalidFields = false;//忽略target不能访问的属性
private boolean autoGrowNestedPaths = true;//当嵌套属性为空时，是否可以实例化该属性
private int autoGrowCollectionLimit = DEFAULT_AUTO_GROW_COLLECTION_LIMIT;//对于集合类型容量的最大值
@Nullable
private String[] allowedFields;//允许数据绑定的资源
@Nullable
private String[] disallowedFields;//不允许的
@Nullable
private String[] requiredFields;//数据绑定必须存在的字段
@Nullable
private ConversionService conversionService;//为getPropertyAccessor().setConversionService(conversionService);
@Nullable
private MessageCodesResolver messageCodesResolver;//同bindingResult的
private BindingErrorProcessor bindingErrorProcessor = new DefaultBindingErrorProcessor();
private final List<Validator> validators = new ArrayList<>();//自定义数据校验器
```

BindingErrorProcessor接口定义了两个方法，用于处理不能存在的属性和将PropertyAccessException转换成一个FieldError。

```java
public class DefaultBindingErrorProcessor implements BindingErrorProcessor {
   public static final String MISSING_FIELD_ERROR_CODE = "required";
   @Override
   public void processMissingFieldError(String missingField, BindingResult bindingResult) {
      // Create field error with code "required".
      String fixedField = bindingResult.getNestedPath() + missingField;
      String[] codes = bindingResult.resolveMessageCodes(MISSING_FIELD_ERROR_CODE, missingField);
      Object[] arguments = getArgumentsForBindError(bindingResult.getObjectName(), fixedField);
      FieldError error = new FieldError(bindingResult.getObjectName(), fixedField, "", true,
            codes, arguments, "Field '" + fixedField + "' is required");
      bindingResult.addError(error);
   }
   @Override
   public void processPropertyAccessException(PropertyAccessException ex, BindingResult bindingResult) {
      // Create field error with the exceptions's code, e.g. "typeMismatch".
      String field = ex.getPropertyName();
      Assert.state(field != null, "No field in exception");
      String[] codes = bindingResult.resolveMessageCodes(ex.getErrorCode(), field);
      Object[] arguments = getArgumentsForBindError(bindingResult.getObjectName(), field);
      Object rejectedValue = ex.getValue();
      if (ObjectUtils.isArray(rejectedValue)) {
         rejectedValue = StringUtils.arrayToCommaDelimitedString(ObjectUtils.toObjectArray(rejectedValue));
      }
      FieldError error = new FieldError(bindingResult.getObjectName(), field, rejectedValue, true,
            codes, arguments, ex.getLocalizedMessage());
      error.wrap(ex);
      bindingResult.addError(error);
   }
   protected Object[] getArgumentsForBindError(String objectName, String field) {
      String[] codes = new String[] {objectName + Errors.NESTED_PATH_SEPARATOR + field, field};
      return new Object[] {new DefaultMessageSourceResolvable(codes, field)};
   }
}
```

**DataBinder**实现了PropertyEditorRegistry接口需要实现接口的方法，采用了代理的方式，bindingResult是BeanPropertyBindingResult的实例，内部会持有一个BeanWrapperImpl，PropertyEditorRegistry接口的实现都是委托了BeanWrapperImpl。

```java
@Override
public void registerCustomEditor(Class<?> requiredType, PropertyEditor propertyEditor) {
   getPropertyEditorRegistry().registerCustomEditor(requiredType, propertyEditor);
}
protected PropertyEditorRegistry getPropertyEditorRegistry() {
   if (getTarget() != null) {
      return getInternalBindingResult().getPropertyAccessor();
   }
   else {
      return getSimpleTypeConverter();
   }
}
protected AbstractPropertyBindingResult getInternalBindingResult() {
   if (this.bindingResult == null) {
      initBeanPropertyAccess();
   }
   return this.bindingResult;
}
public void initBeanPropertyAccess() {
   Assert.state(this.bindingResult == null,"DataBinder is already initialized - call initBeanPropertyAccess before other configuration methods");
   this.bindingResult = createBeanPropertyBindingResult();
}
protected AbstractPropertyBindingResult createBeanPropertyBindingResult() {
   BeanPropertyBindingResult result = new BeanPropertyBindingResult(getTarget(),getObjectName(), isAutoGrowNestedPaths(), getAutoGrowCollectionLimit());
   if (this.conversionService != null) {
      result.initConversion(this.conversionService);
   }
   if (this.messageCodesResolver != null) {
      result.setMessageCodesResolver(this.messageCodesResolver);
   }
   return result;
}
```

bind()是数据绑定对象的核心方法：将给定的属性值绑定到此绑定程序的目标。此调用可以创建字段错误，表示基本绑定错误，如必填字段（代码“required”），或值和bean属性之间的类型不匹配（代码“typeMismatch”）。请注意，给定的PropertyValues应该是一次性实例：为了提高效率，如果它实现了MutablePropertyValues接口，它将被修改为只包含允许的字段; 否则，将为此目的创建内部可变副本。 如果您希望原始实例在任何情况下保持不变，请传递PropertyValues的副本。

```java
public void bind(PropertyValues pvs) {
   MutablePropertyValues mpvs = (pvs instanceof MutablePropertyValues) ?
         (MutablePropertyValues) pvs : new MutablePropertyValues(pvs);
   doBind(mpvs);
}
protected void doBind(MutablePropertyValues mpvs) {
   checkAllowedFields(mpvs);
   checkRequiredFields(mpvs);
   applyPropertyValues(mpvs);
}
```

checkAllowedFields()方法不被允许的字段将移除，加入到bindingResult的suppressedFields中，这样就不会对该字段赋值并且记录下来，allowed和disallowed分别是通过setAllowedFields()和setDisallowedFields()方法设置的，默认null。

```java
protected void checkAllowedFields(MutablePropertyValues mpvs) {
   PropertyValue[] pvs = mpvs.getPropertyValues();
   for (PropertyValue pv : pvs) {
      String field = PropertyAccessorUtils.canonicalPropertyName(pv.getName());
      if (!isAllowed(field)) {
         mpvs.removePropertyValue(pv);
         getBindingResult().recordSuppressedField(field);
         if (logger.isDebugEnabled()) {
            logger.debug("Field [" + field + "] has been removed from PropertyValues " +
                  "and will not be bound, because it has not been found in the list of allowed fields");
         }
      }
   }
}
protected boolean isAllowed(String field) {
   String[] allowed = getAllowedFields();
   String[] disallowed = getDisallowedFields();
   return ((ObjectUtils.isEmpty(allowed) || PatternMatchUtils.simpleMatch(allowed, field)) &&
         (ObjectUtils.isEmpty(disallowed) || !PatternMatchUtils.simpleMatch(disallowed, field)));
}
```

checkRequiredFields()方法检查必须的字段是否存在或者可以访问，不满足则加入resultBinding中一个errorCode为required的FieldError对象。

```java
protected void checkRequiredFields(MutablePropertyValues mpvs) {
   String[] requiredFields = getRequiredFields();
   if (!ObjectUtils.isEmpty(requiredFields)) {
      Map<String, PropertyValue> propertyValues = new HashMap<>();
      PropertyValue[] pvs = mpvs.getPropertyValues();
      for (PropertyValue pv : pvs) {
         String canonicalName = PropertyAccessorUtils.canonicalPropertyName(pv.getName());
         propertyValues.put(canonicalName, pv);
      }
      for (String field : requiredFields) {
         PropertyValue pv = propertyValues.get(field);
         boolean empty = (pv == null || pv.getValue() == null);
         if (!empty) {
            if (pv.getValue() instanceof String) {
               empty = !StringUtils.hasText((String) pv.getValue());
            }
            else if (pv.getValue() instanceof String[]) {
               String[] values = (String[]) pv.getValue();
               empty = (values.length == 0 || !StringUtils.hasText(values[0]));
            }
         }
         if (empty) {
            // Use bind error processor to create FieldError.
            getBindingErrorProcessor().processMissingFieldError(field, getInternalBindingResult());
            // Remove property from property values to bind:
            // It has already caused a field error with a rejected value.
            if (pv != null) {
               mpvs.removePropertyValue(pv);
               propertyValues.remove(field);
            }
         }
      }
   }
}
```

applyPropertyValues()方法使用resultBinding对象内的BeanWraperImpl对象完成属性的赋值操作，这个上篇讲过。

```java
protected void applyPropertyValues(MutablePropertyValues mpvs) {
   try {
      // Bind request parameters onto target object.
      getPropertyAccessor().setPropertyValues(mpvs, isIgnoreUnknownFields(), isIgnoreInvalidFields());
   }
   catch (PropertyBatchUpdateException ex) {
      // Use bind error processor to create FieldErrors.
      for (PropertyAccessException pae : ex.getPropertyAccessExceptions()) {
         getBindingErrorProcessor().processPropertyAccessException(pae, getInternalBindingResult());
      }
   }
}
```

需要注意的是，在PropertyAccessor的setPropertyValues()方法实现中AbstractPropertyAccessor给出了一个模板方法的实现：

```java
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
```

setPropertyValue()方法运行的过程中可能会抛出各种PropertyAccessException，每种具体PropertyAccessException子类都有一个errorCode。抛出的这些异常会集中放入PropertyBatchUpdateException中打包发出。这是DataBinder的applyPropertyValues方法内会捕获这个异常，使用BindingErrorProcessor处理这些异常，转换为FieldError对象存储。

对象完成数据绑定后可以调用getBindingResult()方法，查看数据绑定后的各种数据。

**WebDataBinder**是一个特殊的DataBinder，用于从Web请求参数到JavaBean对象的数据绑定。 专为Web环境而设计，但不依赖于Servlet API; 作为更具体的DataBinder变体的基类，例如ServletRequestDataBinder。包括对字段标记的支持，这些标记解决了HTML复选框和选择选项的常见问题：检测到字段是表单的一部分，但由于它是空的，因此未生成请求参数。

字段标记允许检测该状态并相应地重置相应的bean属性。 对于不存在的参数，默认值可以指定除空后的字段的值。在doBind()方法中加入了两个检查方法用于处理参数带前缀“!”和“_”。

```java
@Override
protected void doBind(MutablePropertyValues mpvs) {
   checkFieldDefaults(mpvs);//_
   checkFieldMarkers(mpvs);//!
   super.doBind(mpvs);
}
//检查给定属性的字段默认值，即对于以字段默认前缀开头的字段。
//字段默认值的存在表示如果该字段不存在则应使用指定的默认值。
protected void checkFieldDefaults(MutablePropertyValues mpvs) {
   String fieldDefaultPrefix = getFieldDefaultPrefix();
   if (fieldDefaultPrefix != null) {
      PropertyValue[] pvArray = mpvs.getPropertyValues();
      for (PropertyValue pv : pvArray) {
         if (pv.getName().startsWith(fieldDefaultPrefix)) {
            String field = pv.getName().substring(fieldDefaultPrefix.length());
            if (getPropertyAccessor().isWritableProperty(field) && !mpvs.contains(field)) {
               mpvs.add(field, pv.getValue());
            }
            mpvs.removePropertyValue(pv);
         }
      }
   }
}
//检查字段标记的给定属性值，即对于以字段标记前缀开头的字段。
//字段标记的存在表明指定的字段存在于表单中。 如果属性值不包含相应的字段值，则该字段将被视为空，并将被适当地重置。
protected void checkFieldMarkers(MutablePropertyValues mpvs) {
   String fieldMarkerPrefix = getFieldMarkerPrefix();
   if (fieldMarkerPrefix != null) {
      PropertyValue[] pvArray = mpvs.getPropertyValues();
      for (PropertyValue pv : pvArray) {
         if (pv.getName().startsWith(fieldMarkerPrefix)) {
            String field = pv.getName().substring(fieldMarkerPrefix.length());
            if (getPropertyAccessor().isWritableProperty(field) && !mpvs.contains(field)) {
               Class<?> fieldType = getPropertyAccessor().getPropertyType(field);
               mpvs.add(field, getEmptyValue(field, fieldType));
            }
            mpvs.removePropertyValue(pv);
         }
      }
   }
}
@Nullable
protected Object getEmptyValue(String field, @Nullable Class<?> fieldType) {
   return (fieldType != null ? getEmptyValue(fieldType) : null);
}
@Nullable
public Object getEmptyValue(Class<?> fieldType) {
   try {
      if (boolean.class == fieldType || Boolean.class == fieldType) {
         // Special handling of boolean property.
         return Boolean.FALSE;
      }
      else if (fieldType.isArray()) {
         // Special handling of array property.
         return Array.newInstance(fieldType.getComponentType(), 0);
      }
      else if (Collection.class.isAssignableFrom(fieldType)) {
         return CollectionFactory.createCollection(fieldType, 0);
      }
      else if (Map.class.isAssignableFrom(fieldType)) {
         return CollectionFactory.createMap(fieldType, 0);
      }
   }
   catch (IllegalArgumentException ex) {
      if (logger.isDebugEnabled()) {
         logger.debug("Failed to create default value - falling back to null: " + ex.getMessage());
      }
   }
   // Default value: null.
   return null;
}
```

**ServletRequestDataBinder**特殊的DataBinder，用于执行从servlet请求参数到JavaBeans的数据绑定，包括对multipart文件的支持。请参阅DataBinder / WebDataBinder超类以获取自定义选项，其中包括指定允许/必需字段以及注册自定义属性编辑器。也可用于自定义Web控制器中的手动数据绑定：例如，在普通的Controller实现中或在MultiActionController处理程序方法中。 只需为每个绑定过程实例化一个ServletRequestDataBinder，并使用当前的ServletRequest作为参数调用bind()方法。bind()方法将参数ServletRequest转换成 MutablePropertyValues再由父类做数据绑定，用于将Http Request请求属性绑定到相应的对象上。

```java
//将给定请求的参数绑定到此绑定程序的目标，并在多部分请求的情况下绑定多部分文件。
此调用可以创建字段错误，表示基本绑定错误，如必填字段（代码“required”），或值和bean属性之间的类型不匹配（代码“typeMismatch”）。
//Multipart文件通过其参数名称绑定，就像普通的HTTP参数一样：即“uploadedFile”到“uploadedFile”bean属性，调用“setUploadedFile”setter方法。
//Multipart文件的目标属性的类型可以是MultipartFile，byte[]或String。 后两者接收上传文件的内容; 在这些情况下，所有元数据（如原始文件名，内容类型等）都将丢失。
public void bind(ServletRequest request) {
   MutablePropertyValues mpvs = new ServletRequestParameterPropertyValues(request);
   MultipartRequest multipartRequest = WebUtils.getNativeRequest(request, MultipartRequest.class);
   if (multipartRequest != null) {
      bindMultipart(multipartRequest.getMultiFileMap(), mpvs);
   }
   addBindValues(mpvs, request);
   doBind(mpvs);
}
```

具体测试请看org.springframework.web.bind.ServletRequestDataBinderTests。

**ExtendedServletRequestDataBinder**是ServletRequestDataBinder的子类，它将URI模板变量添加到用于数据绑定的值。

```java
public class ExtendedServletRequestDataBinder extends ServletRequestDataBinder {
   public ExtendedServletRequestDataBinder(@Nullable Object target) {
      super(target);
   }
   public ExtendedServletRequestDataBinder(@Nullable Object target, String objectName) {
      super(target, objectName);
   }
   //将URI变量合并到属性值中以用于数据绑定。
   @Override
   @SuppressWarnings("unchecked")
   protected void addBindValues(MutablePropertyValues mpvs, ServletRequest request) {
      String attr = HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE;
      Map<String, String> uriVars = (Map<String, String>) request.getAttribute(attr);
      if (uriVars != null) {
         uriVars.forEach((name, value) -> {
            if (mpvs.contains(name)) {
               if (logger.isWarnEnabled()) {
                  logger.warn("Skipping URI variable '" + name +
                        "' because request contains bind value with same name.");
               }
            }
            else {
               mpvs.addPropertyValue(name, value);
            }
         });
      }
   }
}
```

Spring提供了一系列工厂类来创建对应的WebDataBinder对象：

顶级接口定义了创建一个WebDataBinder的方法。

```java
public interface WebDataBinderFactory {
   //为给定对象创建{@link WebDataBinder}。target可以为null如果为简单类型创建
   WebDataBinder createBinder(NativeWebRequest webRequest, @Nullable Object target, String objectName) throws Exception;
}
```

```java
//创建一个WebRequestDataBinder实例并使用WebBindingInitializer对其进行初始化。
public class DefaultDataBinderFactory implements WebDataBinderFactory {
   @Nullable
   private final WebBindingInitializer initializer;
   public DefaultDataBinderFactory(@Nullable WebBindingInitializer initializer) {
      this.initializer = initializer;
   }
   //为给定的目标对象创建一个新的WebDataBinder，并通过WebBindingInitializer对其进行初始化
   @Override
   @SuppressWarnings("deprecation")
   public final WebDataBinder createBinder(
         NativeWebRequest webRequest, @Nullable Object target, String objectName) throws Exception {
      WebDataBinder dataBinder = createBinderInstance(target, objectName, webRequest);
      if (this.initializer != null) {
         this.initializer.initBinder(dataBinder, webRequest);
      }
      initBinder(dataBinder, webRequest);
      return dataBinder;
   }
   //扩展点以创建WebDataBinder实例。默认情况下是WebRequestDataBinder
   protected WebDataBinder createBinderInstance(
         @Nullable Object target, String objectName, NativeWebRequest webRequest) throws Exception {
      return new WebRequestDataBinder(target, objectName);
   }
   //扩展点通过WebBindingInitializer在“全局”初始化之后进一步初始化创建的数据绑定器实例（例如，使用@InitBinder方法
   protected void initBinder(WebDataBinder dataBinder, NativeWebRequest webRequest)
         throws Exception {
   }
}
```

```java
//通过@InitBinder方法向WebDataBinder添加初始化操作
public class InitBinderDataBinderFactory extends DefaultDataBinderFactory {
   private final List<InvocableHandlerMethod> binderMethods;
   //InvocableHandlerMethod就是@InitBinder方法的一个简单封装
   public InitBinderDataBinderFactory(@Nullable List<InvocableHandlerMethod> binderMethods,
         @Nullable WebBindingInitializer initializer) {
      super(initializer);
      this.binderMethods = (binderMethods != null ? binderMethods : Collections.emptyList());
   }
   //使用@InitBinder方法初始化WebDataBinder。
   //如果@InitBinder注释指定了属性名称，则只有在名称包含目标对象名称时才会调用它。
   @Override
   public void initBinder(WebDataBinder dataBinder, NativeWebRequest request) throws Exception {
      for (InvocableHandlerMethod binderMethod : this.binderMethods) {
         if (isBinderMethodApplicable(binderMethod, dataBinder)) {
            Object returnValue = binderMethod.invokeForRequest(request, null, dataBinder);
            if (returnValue != null) {
               throw new IllegalStateException(
                     "@InitBinder methods must not return a value (should be void): " + binderMethod);
            }
         }
      }
   }
   //确定是否应使用给定的@InitBinder方法初始化给定的WebDataBinder实例。 默认情况下，我们检查注释值中的指定属性名称（如果有）。
   protected boolean isBinderMethodApplicable(HandlerMethod initBinderMethod, WebDataBinder dataBinder) {
      InitBinder ann = initBinderMethod.getMethodAnnotation(InitBinder.class);
      Assert.state(ann != null, "No InitBinder annotation");
      String[] names = ann.value();
      return (ObjectUtils.isEmpty(names) || ObjectUtils.containsElement(names, dataBinder.getObjectName()));
   }
}
```

```java
public class ServletRequestDataBinderFactory extends InitBinderDataBinderFactory {
   public ServletRequestDataBinderFactory(@Nullable List<InvocableHandlerMethod> binderMethods,
         @Nullable WebBindingInitializer initializer) {
      super(binderMethods, initializer);
   }
   //返回ExtendedServletRequestDataBinder
   @Override
   protected ServletRequestDataBinder createBinderInstance(
         @Nullable Object target, String objectName, NativeWebRequest request) throws Exception  {
      return new ExtendedServletRequestDataBinder(target, objectName);
   }
}
```

关于WebDataBinderFactory的使用参考[《Spring MVC设计原理》](/zhuanlan/j2ee/spring/7/35.html)。
