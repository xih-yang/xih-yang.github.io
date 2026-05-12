# 17、Spring源码分析 - 17-RequiredAnnotationBeanPostProcessor
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/17.html
- 分类：J2EE框架
- 分组：教程目录
**@Required** 注释应用于 bean 属性的 setter 方法，它表明受影响的 bean 属性在配置时必须放在 XML 配置文件中，否则容器就会抛出一个 BeanInitializationException 异常。

RequiredAnnotationBeanPostProcessor就是用来解析@Required的，当一个bean实例经过SmartInstantiationAwareBeanPostProcessor的postProcessPropertyValues()方法时，检测bean中属性对应的setter方法被标记@Required但是用于赋值的PropertyValues对象不包含此属性就会抛出异常。如果不想对某个bean进行检测，可以将此bean的bean definition的org.springframework.beans.factory.annotation.RequiredAnnotationBeanPostProcessor.skipRequiredCheck属性设置为false。此属性默认在ConfigurationClassBeanDefinitionReader#loadBeanDefinitionsForBeanMethod()方法中设置为true的。

```java
@Override
public PropertyValues postProcessPropertyValues(
      PropertyValues pvs, PropertyDescriptor[] pds, Object bean, String beanName) throws BeansException {
   if (!this.validatedBeanNames.contains(beanName)) {
      if (!shouldSkip(this.beanFactory, beanName)) {
         List<String> invalidProperties = new ArrayList<>();
         for (PropertyDescriptor pd : pds) {
            if (isRequiredProperty(pd) && !pvs.contains(pd.getName())) {
               invalidProperties.add(pd.getName());
            }
         }
         if (!invalidProperties.isEmpty()) {
            throw new BeanInitializationException(buildExceptionMessage(invalidProperties, beanName));
         }
      }
      this.validatedBeanNames.add(beanName);
   }
   return pvs;
}
```

```java
protected boolean shouldSkip(@Nullable ConfigurableListableBeanFactory beanFactory, String beanName) {
   if (beanFactory == null || !beanFactory.containsBeanDefinition(beanName)) {
      return false;
   }
   BeanDefinition beanDefinition = beanFactory.getBeanDefinition(beanName);
   if (beanDefinition.getFactoryBeanName() != null) {
      return true;
   }
   Object value = beanDefinition.getAttribute(SKIP_REQUIRED_CHECK_ATTRIBUTE);
   return (value != null && (Boolean.TRUE.equals(value) || Boolean.valueOf(value.toString())));
}
```

```java
protected boolean isRequiredProperty(PropertyDescriptor propertyDescriptor) {
   Method setter = propertyDescriptor.getWriteMethod();
   return (setter != null && AnnotationUtils.getAnnotation(setter, getRequiredAnnotationType()) != null);
}
```

```java
private String buildExceptionMessage(List<String> invalidProperties, String beanName) {
   int size = invalidProperties.size();
   StringBuilder sb = new StringBuilder();
   sb.append(size == 1 ? "Property" : "Properties");
   for (int i = 0; i < size; i++) {
      String propertyName = invalidProperties.get(i);
      if (i > 0) {
         if (i == (size - 1)) {
            sb.append(" and");
         }
         else {
            sb.append(",");
         }
      }
      sb.append(" '").append(propertyName).append("'");
   }
   sb.append(size == 1 ? " is" : " are");
   sb.append(" required for bean '").append(beanName).append("'");
   return sb.toString();
}
```
