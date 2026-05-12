# 25、SpringBoot 源码分析 - RequestMappingHandlerMapping的初始化三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/25.html
- 分类：J2EE框架
- 分组：教程目录
## 简单流程图

## MappingRegistry的一些映射

`url`可能是一对多的，如果是多个的话，在获取处理的时候会进行比较，如果一样的话就会报异常，说不知道用哪个，这个后面会说，这里要提一下，比如：

### urlLookup一键多值的url和RequestMappingInfo映射

`url`和`RequestMappingInfo`就变成了一对多了。

### nameLookup名字和HandlerMethod映射

还有名字映射，默认是提取类名大写字母然后+#+方法名，但是可能会映射多个，因为不同类的大写字母可能相同啊，方法可以相同啊：

### mappingLookup的RequestMappingInfo和HandlerMethod映射

### registry的RequestMappingInfo和MappingRegistration映射

最后都会封装成`MappingRegistration`放进`registry`里。：

有了这些映射，那么`RequestMappingHandlerMapping`在进行处理器获取的时候就方便了。

## RequestMappingHandlerMapping的updateConsumesCondition

这个用于更新接受数据的条件，如果设置了`consumes`，比如下面的传入数据条件是json格式，但是`@RequestBody`的`required =false`，这样他就会设置`consumes` 的`required`也为`false`，默认是`true`的，也就是不强制了：

```java
    @RequestMapping(value = "/body1",consumes = MediaType.APPLICATION_JSON_VALUE)
    public String body1(@RequestBody(required = false) String body) {
        System.out.println("body1:"+body);
        return "user";
    }
```

通过这个，可以对条件的必须行进行更新，这东西可能不太常用了，反正提一下：

## 不用@Controller也可以是处理器

其实这里是或的关系，所以只要有`RequestMapping`注解，只要能放进容器里,有`@Component`就够了，就可以加载到，就可以处理请求。

至此`RequestMappingHandlerMapping`的一些初始化设置讲完了，这样我们再回去分析是怎么获得映射的就很容易理解了。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
