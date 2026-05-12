# 09、Spring源码分析 - 09-PropertySourcesPropertyResolver
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/9.html
- 分类：J2EE框架
- 分组：教程目录
PropertySourcesPropertyResolver用来将PropertySource的占位符文本解析，PropertyResolver是 Environment的顶层接口，主要提供属性检索和解析带占位符的文本。

```java
public interface PropertyResolver {
   boolean containsProperty(String key);
   @Nullable
   String getProperty(String key);
   String getProperty(String key, String defaultValue);
   @Nullable
   <T> T getProperty(String key, Class<T> targetType);
   <T> T getProperty(String key, Class<T> targetType, T defaultValue);
   String getRequiredProperty(String key) throws IllegalStateException;
   <T> T getRequiredProperty(String key, Class<T> targetType) throws IllegalStateException;
   String resolvePlaceholders(String text);
   String resolveRequiredPlaceholders(String text) throws IllegalArgumentException;
}
```

ConfigurablePropertyResolver定了解析占位符的一些配置方法。

```java
public interface ConfigurablePropertyResolver extends PropertyResolver {
   ConfigurableConversionService getConversionService();
   void setConversionService(ConfigurableConversionService conversionService);
   void setPlaceholderPrefix(String placeholderPrefix);
   void setPlaceholderSuffix(String placeholderSuffix);
   void setValueSeparator(@Nullable String valueSeparator);
   void setIgnoreUnresolvableNestedPlaceholders(boolean ignoreUnresolvableNestedPlaceholders);
   void setRequiredProperties(String... requiredProperties);
   void validateRequiredProperties() throws MissingRequiredPropertiesException;
}
```

AbstractPropertyResolver封装了解析占位符的具体实现，而PropertySourcesPropertyResolver主要是负责提供数据源。AbstractPropertyResolver中有两个成员变量都是PropertyPlaceholderHelper对象，区别在于构造参数不同。

```java
public PropertyPlaceholderHelper(String placeholderPrefix, String placeholderSuffix,
      @Nullable String valueSeparator, boolean ignoreUnresolvablePlaceholders) {
   Assert.notNull(placeholderPrefix, "'placeholderPrefix' must not be null");
   Assert.notNull(placeholderSuffix, "'placeholderSuffix' must not be null");
   this.placeholderPrefix = placeholderPrefix;
   this.placeholderSuffix = placeholderSuffix;
   String simplePrefixForSuffix = wellKnownSimplePrefixes.get(this.placeholderSuffix);
   if (simplePrefixForSuffix != null && this.placeholderPrefix.endsWith(simplePrefixForSuffix)) {
      this.simplePrefix = simplePrefixForSuffix;
   }
   else {
      this.simplePrefix = this.placeholderPrefix;
   }
   this.valueSeparator = valueSeparator;
   this.ignoreUnresolvablePlaceholders = ignoreUnresolvablePlaceholders;
}
```

placeholderPrefix和placeholderSuffix是从AbstractPropertyResolver传过来的${和}，代表占位符的边界符号。valueSeparator也是传过来的默认值分隔符“:”。ignoreUnresolvablePlaceholders是否忽略占位符中不存在的数据源，false会抛出IllegalArgumentException。

replacePlaceholders()方法用来将value中占位符替换为从Properties或PlaceholderResolver取得的值。

```java
public String replacePlaceholders(String value, final Properties properties) {
   Assert.notNull(properties, "'properties' must not be null");
   return replacePlaceholders(value, properties::getProperty);
}
public String replacePlaceholders(String value, PlaceholderResolver placeholderResolver) {
   Assert.notNull(value, "'value' must not be null");
   return parseStringValue(value, placeholderResolver, new HashSet<>());
}
```

PlaceholderResolver是一个接口定了一个方法，入参为占位符参数名，出参为占位符代表的值。这个对象由PropertySourcesPropertyResolver传入，具体后面再说。具体的解析占位符就是通过parseStringValue()方法了：

```java
protected String parseStringValue( String value, PlaceholderResolver placeholderResolver, Set<String> visitedPlaceholders) {
   StringBuilder result = new StringBuilder(value);
   int startIndex = value.indexOf(this.placeholderPrefix);
   while (startIndex != -1) {
      int endIndex = findPlaceholderEndIndex(result, startIndex);
      if (endIndex != -1) {
         String placeholder = result.substring(startIndex + this.placeholderPrefix.length(), endIndex);
         String originalPlaceholder = placeholder;
         if (!visitedPlaceholders.add(originalPlaceholder)) {
            throw new IllegalArgumentException(
                  "Circular placeholder reference '" + originalPlaceholder + "' in property definitions");
         }
         // Recursive invocation, parsing placeholders contained in the placeholder key.
         placeholder = parseStringValue(placeholder, placeholderResolver, visitedPlaceholders);
         // Now obtain the value for the fully resolved key...
         String propVal = placeholderResolver.resolvePlaceholder(placeholder);
         if (propVal == null && this.valueSeparator != null) {
            int separatorIndex = placeholder.indexOf(this.valueSeparator);
            if (separatorIndex != -1) {
               String actualPlaceholder = placeholder.substring(0, separatorIndex);
               String defaultValue = placeholder.substring(separatorIndex + this.valueSeparator.length());
               propVal = placeholderResolver.resolvePlaceholder(actualPlaceholder);
               if (propVal == null) {
                  propVal = defaultValue;
               }
            }
         }
         if (propVal != null) {
            // Recursive invocation, parsing placeholders contained in the
            // previously resolved placeholder value.
            propVal = parseStringValue(propVal, placeholderResolver, visitedPlaceholders);
            result.replace(startIndex, endIndex + this.placeholderSuffix.length(), propVal);
            if (logger.isTraceEnabled()) {
               logger.trace("Resolved placeholder '" + placeholder + "'");
            }
            startIndex = result.indexOf(this.placeholderPrefix, startIndex + propVal.length());
         }
         else if (this.ignoreUnresolvablePlaceholders) {
            // Proceed with unprocessed value.
            startIndex = result.indexOf(this.placeholderPrefix, endIndex + this.placeholderSuffix.length());
         }
         else {
            throw new IllegalArgumentException("Could not resolve placeholder '" + placeholder + "'" + " in value \"" + value + "\"");
         }
         visitedPlaceholders.remove(originalPlaceholder);
      }
      else {
         startIndex = -1;
      }
   }
   return result.toString();
}
```

这是一个递归的解析过程，遇到${开头就会查找最后一个}符号，将最外层占位符内的内容作为新的value再次传入 parseStringValue()方法中，这样最深层次也就是最先返回的就是最里层的占位符名字。调用placeholderResolver将占位符名字转换成它代表的值。如果值为null，则考虑使用默认值(valueSeparator后的内容)赋值给propVal。由于placeholderResolver转换过的值有可能还会包含占位符所以在此调用parseStringValue()方法将带有占位符的propVal传入返回真正的值,用propVal替换占位符。如果propVal==null，判断是否允许忽略不能解析的占位符，如果可以重置startIndex继续解析同一层次的占位符。否则抛出异常。这个函数的返回值就是它上一层次的占位符解析值。

需要注意的一点是：判断嵌套的占位符是依据simplePrefix。

```java
private int findPlaceholderEndIndex(CharSequence buf, int startIndex) {
   int index = startIndex + this.placeholderPrefix.length();
   int withinNestedPlaceholder = 0;
   while (index < buf.length()) {
      if (StringUtils.substringMatch(buf, index, this.placeholderSuffix)) {
         if (withinNestedPlaceholder > 0) {
            withinNestedPlaceholder--;
            index = index + this.placeholderSuffix.length();
         }
         else {
            return index;
         }
      }
      else if (StringUtils.substringMatch(buf, index, this.simplePrefix)) {
         withinNestedPlaceholder++;
         index = index + this.simplePrefix.length();
      }
      else {
         index++;
      }
   }
   return -1;
}
```

AbstractPropertyResolver解析占位符的方法就是委托了PropertyPlaceholderHelper对象的replacePlaceholders()方法，placeholderResolver参数由抽象方法getPropertyAsRawString()定义，子类给出具体实现。

```java
@Override
public String resolvePlaceholders(String text) {
   if (this.nonStrictHelper == null) {
      this.nonStrictHelper = createPlaceholderHelper(true);
   }
   return doResolvePlaceholders(text, this.nonStrictHelper);
}
@Override
public String resolveRequiredPlaceholders(String text) throws IllegalArgumentException {
   if (this.strictHelper == null) {
      this.strictHelper = createPlaceholderHelper(false);
   }
   return doResolvePlaceholders(text, this.strictHelper);
}
private String doResolvePlaceholders(String text, PropertyPlaceholderHelper helper) {
   return helper.replacePlaceholders(text, this::getPropertyAsRawString);
}
@Nullable
protected abstract String getPropertyAsRawString(String key);
```

getProperty()方法也是子类给出的具体实现，下面看一下PropertySourcesPropertyResolver。

构造方法会传入一个PropertySources对象作为数据源。

```java
public PropertySourcesPropertyResolver(@Nullable PropertySources propertySources) {
   this.propertySources = propertySources;
}
```

PropertyPlaceholderHelper需要的PlaceholderResolver函数方法。

```java
@Override
@Nullable
protected String getPropertyAsRawString(String key) {
   return getProperty(key, String.class, false);
}
```

可以看出核心方法就是getProperty()，这里resolveNestedPlaceholders传入的是false，因为占位符解析是交给了PropertyPlaceholderHelper对象，不需要PropertySourcesPropertyResolver再次使用父类的resolveNestedPlaceholders再次解析占位符。

```java
@Nullable
protected <T> T getProperty(String key, Class<T> targetValueType, boolean resolveNestedPlaceholders) {
   if (this.propertySources != null) {
      for (PropertySource<?> propertySource : this.propertySources) {
         if (logger.isTraceEnabled()) {
            logger.trace("Searching for key '" + key + "' in PropertySource '" +
                  propertySource.getName() + "'");
         }
         Object value = propertySource.getProperty(key);
         if (value != null) {
            if (resolveNestedPlaceholders && value instanceof String) {
               value = resolveNestedPlaceholders((String) value);
            }
            logKeyFound(key, propertySource, value);
            return convertValueIfNecessary(value, targetValueType);
         }
      }
   }
   if (logger.isDebugEnabled()) {
      logger.debug("Could not find key '" + key + "' in any property source");
   }
   return null;
}
```

而直接调用getProperty()方法就需要 resolveNestedPlaceholders=true了。

```java
@Override
@Nullable
public String getProperty(String key) {
   return getProperty(key, String.class, true);
}
@Override
@Nullable
public <T> T getProperty(String key, Class<T> targetValueType) {
   return getProperty(key, targetValueType, true);
}
```
