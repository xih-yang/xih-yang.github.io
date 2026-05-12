# 40、Spring源码分析 - 40-Spring Validation参数校验的使用与原理
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/40.html
- 分类：J2EE框架
- 分组：教程目录
## 1、什么是Bean Validation

JSR-303（JSR是Java Specification Requests的缩写，意思是Java 规范提案） 是JAVA EE 6 中的一项子规范，叫做Bean Validation，Hibernate Validator 是 Bean Validation 的参考实现。Hibernate Validator 提供了 JSR 303 规范中所有内置 constraint 的实现，除此之外还有一些附加的 constraint。

Bean Validate规定的Constraint

meta-data
comment
version

@Null
对象，为空
Bean Validation 1.0

@NotNull
对象，不为空
Bean Validation 1.0

@AssertTrue
布尔，为True
Bean Validation 1.0

@AssertFalse
布尔，为False
Bean Validation 1.0

@Min(value)
数字，最小为value
Bean Validation 1.0

@Max(value)
数字，最大为value
Bean Validation 1.0

@DecimalMin(value)
数字，最小为value
Bean Validation 1.0

@DecimalMax(value)
数字，最大为value
Bean Validation 1.0

@Size(max, min)
min自定义注解中指定了这个注解真正的验证者类。

### 2.3.2、编写真正的校验者类

```java
public class CannotHaveBlankValidator implements <1> ConstraintValidator<CannotHaveBlank, String> {
    @Override
    public void initialize(CannotHaveBlank constraintAnnotation) {
    }
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context <2>) {
        //null时不进行校验
        if (value != null && value.contains(" ")) {
            <3>
            //获取默认提示信息
            String defaultConstraintMessageTemplate = context.getDefaultConstraintMessageTemplate();
            System.out.println("default message :" + defaultConstraintMessageTemplate);
            //禁用默认提示信息
            context.disableDefaultConstraintViolation();
            //设置提示语
            context.buildConstraintViolationWithTemplate("can not contains blank").addConstraintViolation();
            return false;
        }
        return true;
    }
}
```

所有的验证者都需要实现ConstraintValidator接口，它的接口也很形象，包含一个初始化事件方法，和一个判断是否合法的方法。

```java
public interface ConstraintValidator<A extends Annotation, T> {
    void initialize(A constraintAnnotation);
    boolean isValid(T value, ConstraintValidatorContext context);
}
```

ConstraintValidatorContext 这个上下文包含了认证中所有的信息，我们可以利用这个上下文实现获取默认错误提示信息，禁用错误提示信息，改写错误提示信息等操作。

一些典型校验操作，或许可以对你产生启示作用。

值得注意的一点是，自定义注解可以用在METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER之上，ConstraintValidator的第二个泛型参数T，是需要被校验的类型。

## 3、Spring Validation

Spring框架为开发者提供了也提供了Validator接口，可用于验证对象。注意Spring Validation的Validator与Bean Validation 的Validator接口是两个接口。Spring的Validator通过使用Errors对象来工作，以便在验证时，验证器可以向Errors对象报告验证失败。

Spring 3开始为其验证支持引入了几项增强功能。 首先，完全支持JSR-303 Bean Validation API。 其次，当以编程方式使用时，Spring的DataBinder可以验证对象以及绑定它们。 第三，Spring MVC支持声明性地验证@Controller输入。

## 3.1、Validator接口

该接口完全脱离任何基础设施或上下文; 也就是说，它不会仅仅验证Web层，数据访问层或任何层中的对象。 因此，它适用于应用程序的任何层。

```java
public interface Validator {
   //此Validator可以验证提供的clazz的实例吗？
   boolean supports(Class<?> clazz);
   //验证提供的目标对象，该对象必须是supports(Class)方法返回true的。
   //提供的错误实例可用于报告任何结果验证错误。
   void validate(Object target, Errors errors);
}
```

## 3.2、使用LocalValidatorFactoryBean编程式校验

Spring对validation全面支持JSR-303、JSR-349的标准，并且封装了LocalValidatorFactoryBean作为validator的实现。这个类同时实现了Spring Validation和Bean Validation的Validator接口，代替上述的从工厂方法中获取的hibernate validator。

```java
public static class ValidPerson {
   @NotNull
   private String name;
   @Valid
   private ValidAddress address = new ValidAddress();
   @Valid
   private List<ValidAddress> addressList = new LinkedList<>();
   @Valid
   private Set<ValidAddress> addressSet = new LinkedHashSet<>();
}
public static class ValidAddress {
   @NotNull
   private String street;
}
```

@javax.validation.Valid标记用于验证级联的属性，方法参数或方法返回类型。在验证属性，方法参数或方法返回类型时，将验证在对象及其属性上定义的约束。此行为以递归方式应用。

```java
@Test
public void testSimpleValidation() {
   LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
   validator.afterPropertiesSet();
   ValidPerson person = new ValidPerson();
   //这里使用的是Bean Validation而不是Spring Validation的接口
   Set<ConstraintViolation<ValidPerson>> result = validator.validate(person);
   assertEquals(2, result.size());
   for (ConstraintViolation<ValidPerson> cv : result) {
      String path = cv.getPropertyPath().toString();
      if ("name".equals(path) || "address.street".equals(path)) {
         assertTrue(cv.getConstraintDescriptor().getAnnotation() instanceof NotNull);
      }
      else {
         fail("Invalid constraint violation with path '" + path + "'");
      }
   }
}
```

## 3.3、LocalValidatorFactoryBean源码分析

### 3.3.1、类结构图

## 3.3.2、JSR-303 Validator转化Spring Validator

SpringValidatorAdapter获取JSR-303 javax.validator.Validator并将其公开为Spring org.springframework.validation.Validator同时还公开原始JSR-303 Validator接口本身的适配器。

在SpringValidatorAdapter构造方法可以传入一个javax.validation.Validator赋值给变量targetValidator，当实现javax.validator.Validator接口方法时直接调用targetValidator的同名方法，而实现org.springframework.validation.Validator接口方法也会通过targetValidator对象间接实现功能，如下方法：

```java
@Override
public void validate(Object target, Errors errors) {
   if (this.targetValidator != null) {
      processConstraintViolations(this.targetValidator.validate(target), errors);
   }
}
```

processConstraintViolations方法处理给定的JSR-303 ConstraintViolations，向提供的Spring Errors对象添加相应的错误。

```java
protected void processConstraintViolations(Set<ConstraintViolation<Object>> violations, Errors errors) {
   for (ConstraintViolation<Object> violation : violations) {
      String field = determineField(violation);
      FieldError fieldError = errors.getFieldError(field);
      if (fieldError == null || !fieldError.isBindingFailure()) {
         try {
            ConstraintDescriptor<?> cd = violation.getConstraintDescriptor();
            String errorCode = determineErrorCode(cd);
            Object[] errorArgs = getArgumentsForConstraint(errors.getObjectName(), field, cd);
            if (errors instanceof BindingResult) {
               // Can do custom FieldError registration with invalid value from ConstraintViolation,
               // as necessary for Hibernate Validator compatibility (non-indexed set path in field)
               BindingResult bindingResult = (BindingResult) errors;
               String nestedField = bindingResult.getNestedPath() + field;
               if ("".equals(nestedField)) {
                  String[] errorCodes = bindingResult.resolveMessageCodes(errorCode);
                  bindingResult.addError(new ObjectError(
                        errors.getObjectName(), errorCodes, errorArgs, violation.getMessage()));
               }
               else {
                  Object rejectedValue = getRejectedValue(field, violation, bindingResult);
                  String[] errorCodes = bindingResult.resolveMessageCodes(errorCode, field);
                  bindingResult.addError(new FieldError(
                        errors.getObjectName(), nestedField, rejectedValue, false,
                        errorCodes, errorArgs, violation.getMessage()));
               }
            }
            else {
               // got no BindingResult - can only do standard rejectValue call
               // with automatic extraction of the current field value
               errors.rejectValue(field, errorCode, errorArgs, violation.getMessage());
            }
         }
         catch (NotReadablePropertyException ex) {
            throw new IllegalStateException("JSR-303 validated property '" + field +
                  "' does not have a corresponding accessor for Spring data binding - " +
                  "check your DataBinder's configuration (bean property versus direct field access)", ex);
         }
      }
   }
}
```

### 3.3.3、LocalValidatorFactoryBean

虽然LocalValidatorFactoryBean继承了SpringValidatorAdapter，但是没有继承它带参的构造方法，默认targetValidator变量为空，对targetValidator变量赋值的操作放在了afterPropertiesSet()方法中。

上图是afterPropertiesSet()方法最后三行，上面都是对configuration的配置。

## 3.4、Spring MVC使用Validator

默认情况下，如果类路径上存在Bean Validation（例如，Hibernate Validator），则LocalValidatorFactoryBean将注册为全局Validator，以便与控制器方法参数一起使用@Valid和@Validated。

### 3.4.1、校验参数实体

创建需要被校验的实体类

```java
public class Foo {
    @NotBlank
    private String name;
    @Min(18)
    private Integer age;
    @Pattern(regexp = "^1(3|4|5|7|8)\\d{9}$",message = "手机号码格式错误")
    @NotBlank(message = "手机号码不能为空")
    private String phone;
    @Email(message = "邮箱格式错误")
    private String email;
    //... getter setter
}
```

在@Controller中校验数据

springmvc为我们提供了自动封装表单参数的功能，一个添加了参数校验的典型controller如下所示。

```java
@Controller
public class FooController {
    @RequestMapping("/foo")
    public String foo(@Validated Foo foo <1>, BindingResult bindingResult <2>) {
        if(bindingResult.hasErrors()){
            for (FieldError fieldError : bindingResult.getFieldErrors()) {
                //...
            }
            return "fail";
        }
        return "success";
    }
}
```

值得注意的地方：

参数Foo前需要加上@Validated注解，表明需要spring对其进行校验，而校验的信息会存放到其后的BindingResult中。注意，必须相邻，如果有多个参数需要校验，形式可以如下。foo(@Validated Foo foo, BindingResult fooBindingResult ，@Validated Bar bar, BindingResult barBindingResult);即一个校验类对应一个校验结果。

校验结果会被自动填充，在controller中可以根据业务逻辑来决定具体的操作，如跳转到错误页面。

### 3.4.2、基于方法校验

```java
@RestController
@Validated <1>
public class BarController {
    @RequestMapping("/bar")
    public @NotBlank <2> String bar(@Min(18) Integer age <3>) {
        System.out.println("age : " + age);
        return "";
    }
    @ExceptionHandler(ConstraintViolationException.class)
    public Map handleConstraintViolationException(ConstraintViolationException cve){
        Set<ConstraintViolation<?>> cves = cve.getConstraintViolations();<4>
        for (ConstraintViolation<?> constraintViolation : cves) {
            System.out.println(constraintViolation.getMessage());
        }
        Map map = new HashMap();
        map.put("errorCode",500);
        return map;
    }
}
```

为类添加@Validated注解

 校验方法的返回值和入参

添加一个异常处理器，可以获得没有通过校验的属性相关信息

### 3.4.3、分组校验

如果同一个类，在不同的使用场景下有不同的校验规则，那么可以使用分组校验。未成年人是不能喝酒的，而在其他场景下我们不做特殊的限制，这个需求如何体现同一个实体，不同的校验规则呢？

改写注解，添加分组：

```java
Class Foo{
    @Min(value = 18,groups = {Adult.class})
    private Integer age;
    public interface Adult{}
    public interface Minor{}
}
```

这样表明，只有在Adult分组下，18岁的限制才会起作用。

Controller层改写：

```java
@RequestMapping("/drink")
public String drink(@Validated({Foo.Adult.class}) Foo foo, BindingResult bindingResult) {
    if(bindingResult.hasErrors()){
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            //...
        }
        return "fail";
    }
    return "success";
}
@RequestMapping("/live")
public String live(@Validated Foo foo, BindingResult bindingResult) {
    if(bindingResult.hasErrors()){
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            //...
        }
        return "fail";
    }
    return "success";
}
```

drink方法限定需要进行Adult校验，而live方法则不做限制。

## 3.5、Spring MVC注解原理解析

在[《Spring MVC参数值的绑定》](/zhuanlan/j2ee/spring/7/36.html)中分析过，Spring MVC @Controller方法参数会使用HandlerMethodArgumentResolver进行HttpServletRequest参数到实体类的装换也就是参数绑定的过程，其中有一个HandlerMethodArgumentResolver就是ModelAttributeMethodProcessor，解析@ModelAttribute带注释的方法参数，并处理来自@ModelAttribute注释方法的返回值。创建后，通过数据绑定到Servlet请求参数来填充属性。 如果参数使用@javax.validation.Valid或Spring自己的@org.springframework.validation.annotation.Validated注释，则可以应用验证。

从这段文档描述可以知道ModelAttributeMethodProcessor除了可以完成Servlet请求参数填充实体类对象的属性，如果实体对象被@javax.validation.Valid或@org.springframework.validation.annotation.Validated注释，还会对其进行数据校验。

### 3.5.1、校验原理

什么类型的参数会校验@Validated？来看ModelAttributeMethodProcessor的supportsParameter方法就知道了。

```java
@Override
public boolean supportsParameter(MethodParameter parameter) {
   return (parameter.hasParameterAnnotation(ModelAttribute.class) ||
         (this.annotationNotRequired && !BeanUtils.isSimpleProperty(parameter.getParameterType())));
}
```

annotationNotRequired是ModelAttributeMethodProcessor的构造参数，在RequestMappingHandlerAdapter中annotationNotRequired参数是true和false的ModelAttributeMethodProcessor（ServletModelAttributeMethodProcessor继承于ModelAttributeMethodProcessor）都有。

我们看ModelAttributeMethodProcessor的resolveArgument方法。此方法中一部分是参数绑定的过程不是我们分析的重点，下面看参数校验的部分。

```java
WebDataBinder binder = binderFactory.createBinder(webRequest, attribute, name);
if (binder.getTarget() != null) {
   if (!mavContainer.isBindingDisabled(name)) {
      bindRequestParameters(binder, webRequest);
   }
   validateIfApplicable(binder, parameter);
   if (binder.getBindingResult().hasErrors() && isBindExceptionRequired(binder, parameter)) {
      throw new BindException(binder.getBindingResult());
   }
}
// Value type adaptation, also covering java.util.Optional
if (!parameter.getParameterType().isInstance(attribute)) {
   attribute = binder.convertIfNecessary(binder.getTarget(), parameter.getParameterType(), parameter);
}
bindingResult = binder.getBindingResult();
```

上述代码首先通过binderFactory创建一个WebDataBinder对象将webRequest的参数值绑定到attribute上，然后调用validateIfApplicable方法，参数校验的过程就发生在这个方法中。

```java
protected void validateIfApplicable(WebDataBinder binder, MethodParameter parameter) {
   for (Annotation ann : parameter.getParameterAnnotations()) {
      //检查@javax.validation.Valid，Spring的@Validated以及名称以“Valid”开头的自定义注释。
      Object[] validationHints = determineValidationHints(ann);
      if (validationHints != null) {
         //这里使用DataBinder完成属性校验
         binder.validate(validationHints);
         break;
      }
   }
}
@Nullable
private Object[] determineValidationHints(Annotation ann) {
   Validated validatedAnn = AnnotationUtils.getAnnotation(ann, Validated.class);
   if (validatedAnn != null || ann.annotationType().getSimpleName().startsWith("Valid")) {
      Object hints = (validatedAnn != null ? validatedAnn.value() : AnnotationUtils.getValue(ann));
      if (hints == null) {
         return new Object[0];
      }
      return (hints instanceof Object[] ? (Object[]) hints : new Object[] {hints});
   }
   return null;
}
```

我们可以看到validateIfApplicable方法内部使用DataBinder的validate方法完成校验。

```java
public void validate() {
   Object target = getTarget();
   Assert.state(target != null, "No target to validate");
   BindingResult bindingResult = getBindingResult();
   // Call each validator with the same binding result
   for (Validator validator : getValidators()) {
      validator.validate(target, bindingResult);
   }
}
```

这个方法调用getValidators()获取DataBinder内所有的Validator对实体参数进行校验，校验错误信息存放到BindingResult中。

### 3.5.2、Validator的注册

那么下面有一个疑问，DataBinder的Validator是何时被注入的。在[《Spring MVC设计原理》](/zhuanlan/j2ee/spring/7/35.html)介绍过，RequestMappingHandlerAdapter处理请求时构建创建DataBinder的ServletRequestDataBinderFactory对象的构造参数传入了一个WebBindingInitializer对象，在创建DataBinder的时候会使用WebBindingInitializer来初始化这个DataBinder。

下面是WebBindingInitializer接口的实现ConfigurableWebBindingInitializer，使用自身持有的Validator设置到DataBinder上。

那么上面的问题就转移到了Spring MVC何时实例化的WebBindingInitializer？

在[《Spring MVC设计原理》](/zhuanlan/j2ee/spring/7/35.html)介绍过，在开启注解@EnableWebMvc后，为Spring容器注册了一个bean——DelegatingWebMvcConfiguration，它继承于WebMvcConfigurationSupport，内部定义了一个@Bean方法来向Spring注册RequestMappingHandlerAdapter。

getConfigurableWebBindingInitializer方法就是创建上面说的ConfigurableWebBindingInitializer对象的。

mvcValidator()方法返回一个Validator实例，这个实例是OptionalValidatorFactoryBean。

OptionalValidatorFactoryBean继承于LocalValidatorFactoryBean。

## 参考

[https://www.jianshu.com/p/2a495bf5504e](https://www.jianshu.com/p/2a495bf5504e)

[https://blog.csdn.net/u013815546/article/details/77248003](https://blog.csdn.net/u013815546/article/details/77248003)
