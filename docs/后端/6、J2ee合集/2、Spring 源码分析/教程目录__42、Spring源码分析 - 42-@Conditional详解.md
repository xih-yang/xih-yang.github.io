# 42、Spring源码分析 - 42-@Conditional详解
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/42.html
- 分类：J2EE框架
- 分组：教程目录
## 1、@Conditional简介

@Conditional注解指示组件仅在所有指定条件匹配时才有资格注册。@Conditional注解的value属性就是条件匹配Class对象，具体说是Condition接口实例数组。

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Conditional {
   //必须匹配的所有条件才能注册组件
   Class<? extends Condition>[] value();
}
```

@Conditional注释可以以下任何方式使用：

- 作为任何直接或间接用@Component注释的类的类型级注释，包括@Configuration类
- 作为一个元注释，用于编写自定义构造型注释
- 作为任何@Bean方法的方法级注释

如果@Configuration类标记为@Conditional，则与该类关联的所有@Bean方法、@Import注释和@ComponentScan注释都将受这些条件的约束。

下面在看一下接口Condition的定义。

```java
@FunctionalInterface
public interface Condition {
   //确定条件是否匹配。
   boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata);
}
```

## 2、原理分析

在SpringFramework中@Conditional注释背后的处理器是ConditionEvaluator，通过跟踪源码发现共有三处使用了到了ConditionEvaluator：

- ConfigurationClassBeanDefinitionReader.loadBeanDefinitionsForBeanMethod(BeanMethod) 解析@Bean方法
- ConfigurationClassParser.processConfigurationClass(ConfigurationClass) 解析@Configuration类
- ConfigurationClassParser.doProcessConfigurationClass(ConfigurationClass, SourceClass) 中解析被@ComponentScan注解的类

这三处使用ConditionEvaluator的原理一样，ConditionEvaluator的shouldSkip()方法返回一个boolean值，true代表跳过被注解组件的注册或解析，下面就是第二种的实现。

shouldSkip方法第二个参数是一个枚举类ConfigurationPhase，代表当前调用的阶段，该类共有两个值

- PARSE_CONFIGURATION：代表解析配置类阶段，也就是将配置类转换为ConfigurationClass阶段
- REGISTER_BEAN：代表配置类注册为bean阶段，也就是将配置类是否需要在将其注册到IOC容器阶段

具体作用看ConditionEvaluator的实现，如下：

```java
public boolean shouldSkip(@Nullable AnnotatedTypeMetadata metadata, @Nullable ConfigurationPhase phase) {
   //如果配置类没有被@Conditional注解标注，则不能跳过，需要解析
   if (metadata == null || !metadata.isAnnotated(Conditional.class.getName())) {
      return false;
   }
   //若没有明确传递当前调用阶段，则根据配置类元信息分析当前应处于哪个阶段
   if (phase == null) {
      //如果元数据是AnnotationMetadata的实例，并且是通过注解方式作为候选配置类的
      //则判定当前阶段为解析配置类阶段
      if (metadata instanceof AnnotationMetadata &&
            ConfigurationClassUtils.isConfigurationCandidate((AnnotationMetadata) metadata)) {
         return shouldSkip(metadata, ConfigurationPhase.PARSE_CONFIGURATION);
      }
      //否则判定为将ConfigurationClass转换为BeanDefinition阶段
      return shouldSkip(metadata, ConfigurationPhase.REGISTER_BEAN);
   }
   List<Condition> conditions = new ArrayList<>();
   for (String[] conditionClasses : getConditionClasses(metadata)) {
      for (String conditionClass : conditionClasses) {
         Condition condition = getCondition(conditionClass, this.context.getClassLoader());
         conditions.add(condition);
      }
   }
   AnnotationAwareOrderComparator.sort(conditions);
   for (Condition condition : conditions) {
      ConfigurationPhase requiredPhase = null;
      if (condition instanceof ConfigurationCondition) {
         requiredPhase = ((ConfigurationCondition) condition).getConfigurationPhase();
      }
      //只有Condition的requiredPhase与当前调用阶段一致，matches方法才生效，否则所有配置类都解析
      //有一个condition返回false就跳过类的解析或注册
      if ((requiredPhase == null || requiredPhase == phase) && !condition.matches(this.context, metadata)) {
         return true;
      }
   }
   return false;
}
```
