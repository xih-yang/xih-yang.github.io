# 18、SpringMVC源码分析 - @ModelAttribute的使用及原理
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/18.html
- 分类：J2EE框架
- 分组：教程目录
## 一、使用

1、给ModelMap添加属性

可以通过给方法参数Model添加属性，也可以通过方法上注解@ModelAttribute来指定model的属性名称，返回值会作为属性值，下面方法执行后，在springmvc中ModelMap就会存在两个model。

在Controller中定义方法：

```java
	//指定返回值属性为user1
	@ModelAttribute("user1")
    public User getUser1(Model model) {
    	//给model添加属性userId
        model.addAttribute("userId", 10);
        User user = new User();
        user.setId(1);
        return user;
    }
```

2、使用ModelMap中的model

在方法参数上加上@ModelAttribute注解，并值指定名称

```java
	@GetMapping(value = "/modelAttribute/test", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity modelAttributeTest(Model model, @ModelAttribute(name = "user1") User user1, @ModelAttribute(name = "user2") User user2) throws BaseException {
        ResponseEntity responseEntity = new ResponseEntity();
        System.out.println("userId: " + model.getAttribute("userId"));
        System.out.println("user1: " + user1);
        System.out.println("user2: " + user2);
        return responseEntity;
    }
```

结果

```java
userId: 10
user1: User(id=1, username=null, password=null, role=null, email=null, phone=188, realName=null, unit=null)
user2: User(id=2, username=null, password=null, role=null, email=null, phone=188, realName=null, unit=null)
```

3、全局的ModelAttribute

```java
@RestControllerAdvice
public class ControllerAdviceTest {
    @ModelAttribute("user2")
    public User getUser() {
        User user = new User();
        user.setId(2);
        return user;
    }
}
```

## 二、@ModelAttribute方法解析

1、查找@ModelAttribute方法

在RequestMappingHandlerAdapter调用invokeHandlerMethod( )方法中，会组装ModelFactory

```java
ModelFactory  modelFactory = getModelFactory(handlerMethod, binderFactory);
```

```java
	private ModelFactory getModelFactory(HandlerMethod handlerMethod, WebDataBinderFactory binderFactory) {
		SessionAttributesHandler sessionAttrHandler = getSessionAttributesHandler(handlerMethod);
		Class<?> handlerType = handlerMethod.getBeanType();
		Set<Method> methods = this.modelAttributeCache.get(handlerType);
		if (methods == null) {
			//查找controller中标识有@ModelAttribute注解，并且没有@RequestMapping注解的方法
			methods = MethodIntrospector.selectMethods(handlerType, MODEL_ATTRIBUTE_METHODS);
			this.modelAttributeCache.put(handlerType, methods);
		}
		List<InvocableHandlerMethod> attrMethods = new ArrayList<>();
		// Global methods first
		//从@ControllerAdvice类中查找全局的@ModelAttribute注解方法
		this.modelAttributeAdviceCache.forEach((controllerAdviceBean, methodSet) -> {
			if (controllerAdviceBean.isApplicableToBeanType(handlerType)) {
				Object bean = controllerAdviceBean.resolveBean();
				for (Method method : methodSet) {
					attrMethods.add(createModelAttributeMethod(binderFactory, bean, method));
				}
			}
		});
		for (Method method : methods) {
			Object bean = handlerMethod.getBean();
			attrMethods.add(createModelAttributeMethod(binderFactory, bean, method));
		}
		return new ModelFactory(attrMethods, binderFactory, sessionAttrHandler);
	}
```

2、调用@ModelAttribute方法

同样在RequestMappingHandlerAdapter调用invokeHandlerMethod( )方法中

```java
modelFactory.initModel(webRequest, mavContainer, invocableMethod);
```

```java
public void initModel(NativeWebRequest request, ModelAndViewContainer container, HandlerMethod handlerMethod)
			throws Exception {
		//@SessionAttributes 标识的一些属性名
		Map<String, ?> sessionAttributes = this.sessionAttributesHandler.retrieveAttributes(request);
		//将sessionAttributes合并到modelMap中
		container.mergeAttributes(sessionAttributes);
		//调用@ModelAttribute方法
		invokeModelAttributeMethods(request, container);
		//从sessionAttributesHandler查找属性
		for (String name : findSessionAttributeArguments(handlerMethod)) {
			//ModelMap中不包含该属性时，从sessionAttributesHandler获取
			if (!container.containsAttribute(name)) {
				Object value = this.sessionAttributesHandler.retrieveAttribute(request, name);
				if (value == null) {
					throw new HttpSessionRequiredException("Expected session attribute '" + name + "'", name);
				}
				container.addAttribute(name, value);
			}
		}
	}
```

```java
private void invokeModelAttributeMethods(NativeWebRequest request, ModelAndViewContainer container)
			throws Exception {
		while (!this.modelMethods.isEmpty()) {
			InvocableHandlerMethod modelMethod = getNextModelMethod(container).getHandlerMethod();
			ModelAttribute ann = modelMethod.getMethodAnnotation(ModelAttribute.class);
			Assert.state(ann != null, "No ModelAttribute annotation");
			if (container.containsAttribute(ann.name())) {
				if (!ann.binding()) {
					container.setBindingDisabled(ann.name());
				}
				continue;
			}
			//调用方法
			Object returnValue = modelMethod.invokeForRequest(request, container);
			if (modelMethod.isVoid()) {
				if (StringUtils.hasText(ann.value())) {
					if (logger.isDebugEnabled()) {
						logger.debug("Name in @ModelAttribute is ignored because method returns void: " +
								modelMethod.getShortLogMessage());
					}
				}
				continue;
			}
			//参数名
			String returnValueName = getNameForReturnValue(returnValue, modelMethod.getReturnType());
			if (!ann.binding()) {
				container.setBindingDisabled(returnValueName);
			}
			if (!container.containsAttribute(returnValueName)) {
				//添加到ModelMap中
				container.addAttribute(returnValueName, returnValue);
			}
		}
	}
```

## 二、@ModelAttribute参数解析

在ModelAttributeMethodProcessor类中

```java
public final Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		Assert.state(mavContainer != null, "ModelAttributeMethodProcessor requires ModelAndViewContainer");
		Assert.state(binderFactory != null, "ModelAttributeMethodProcessor requires WebDataBinderFactory");
		//参数名
		String name = ModelFactory.getNameForParameter(parameter);
		ModelAttribute ann = parameter.getParameterAnnotation(ModelAttribute.class);
		if (ann != null) {
			mavContainer.setBinding(name, ann.binding());
		}
		Object attribute = null;
		BindingResult bindingResult = null;
		if (mavContainer.containsAttribute(name)) {
			//从ModelMap中获取参数值
			attribute = mavContainer.getModel().get(name);
		}
		else {
			// Create attribute instance
			try {
				attribute = createAttribute(name, parameter, binderFactory, webRequest);
			}
			catch (BindException ex) {
				if (isBindExceptionRequired(parameter)) {
					// No BindingResult parameter -> fail with BindException
					throw ex;
				}
				// Otherwise, expose null/empty value and associated BindingResult
				if (parameter.getParameterType() == Optional.class) {
					attribute = Optional.empty();
				}
				else {
					attribute = ex.getTarget();
				}
				bindingResult = ex.getBindingResult();
			}
		}
		if (bindingResult == null) {
			// Bean property binding and validation;
			// skipped in case of binding failure on construction.
			//创建绑定器
			WebDataBinder binder = binderFactory.createBinder(webRequest, attribute, name);
			if (binder.getTarget() != null) {
				if (!mavContainer.isBindingDisabled(name)) {
					bindRequestParameters(binder, webRequest);
				}
				//参数校验
				validateIfApplicable(binder, parameter);
				if (binder.getBindingResult().hasErrors() && isBindExceptionRequired(binder, parameter)) {
					throw new BindException(binder.getBindingResult());
				}
			}
			// Value type adaptation, also covering java.util.Optional
			//参数类型不一致时进行转换
			if (!parameter.getParameterType().isInstance(attribute)) {
				attribute = binder.convertIfNecessary(binder.getTarget(), parameter.getParameterType(), parameter);
			}
			bindingResult = binder.getBindingResult();
		}
		// Add resolved attribute and BindingResult at the end of the model
		Map<String, Object> bindingResultModel = bindingResult.getModel();
		mavContainer.removeAttributes(bindingResultModel);
		mavContainer.addAllAttributes(bindingResultModel);
		return attribute;
	}
```
