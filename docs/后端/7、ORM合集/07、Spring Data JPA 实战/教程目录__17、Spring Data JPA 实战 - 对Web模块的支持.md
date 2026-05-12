# 17、Spring Data JPA 实战 - 对Web模块的支持
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/17.html
- 分类：ORM框架
- 分组：教程目录
Spring-Data还提供了Web模块的支持，这要求Web组件Spring-MVC的jar包位于classpath下。通常通过使用@EnableSpringDataWebSupport注解来启用继承支持。

SpringDataWebAutoConfiguration上已经添加了@EnableSpringDataWebSupport注解，我们不需要再额外配置。

一、EnableSpringDataWebSupport会为我们注册几个组件：

1、DomainClassConverter：可以直接让我们在Spring-MVC控制器的方法参数列表中使用实体类型，而无需通过Repository手动查找实例（需要Repository实现CrudRepository才有资格被发现可以进行转换）。

**1、** 1、Controller：；

```java
/**
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@RestController
@RequestMapping("/user")
public class UserController {
    /**
     * 这里会直接调用User对应的Repository来进行findById查询。
     *  需要Repository实现CrudRepository才有资格被发现可以进行转换
     */
    @GetMapping("/{id}")
    public User findUserById(@PathVariable("id")User user){
        return user;
    }
}
```

**1、** 2、单元测试：；

```java
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {
    @Resource
    private MockMvc mockMvc;
    @Test
    void findUserById() throws Exception {
        String result = this.mockMvc.perform(get("/user/47"))
                .andDo(print())
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        System.out.println(result);
    }
}
```

2、HandlerMethodArgumentResolvers:还为我们注册了PageableHandlerMethodArgumentResolver和SortHandlerMethodArgumentResolver让Pageable和Sort可以作为控制层方法参数。

**2、** 1、Pageable或Sort作为控制层方法参数；

参数page：当前页，默认为0；参数size：每页大小，默认20；参数sort：排序方向，如果不同的方向使用多个sort参数。

```java
/**
 * 参数page：默认为0。
 * 参数size：默认为20。
 * 参数sort：排序按property,property(,ASC|DESC)的方式来填写，默认为升序，如果想要属性有不同的排序方向，要用多个sort参数
 */
@GetMapping
public Page<User> listUser(Pageable pageable){
    System.out.println("page：" + pageable.getPageNumber());
    System.out.println("size：" + pageable.getPageSize());
    System.out.println("sort：" + pageable.getSort());
    return userRepository.findAll(pageable);
}
@GetMapping("/sort")
public String sort(Sort sort){
    System.out.println("sort：" + sort);
    return "sort";
}
```

```java
@Test
void listUser1() throws Exception {
    String result = this.mockMvc.perform(get("/user"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
    System.out.println(result);
}
@Test
void listUser2() throws Exception {
    String result = this.mockMvc.perform(get("/user")
            .param("page","2").param("size","2").param("sort","username,asc")
            .param("sort","age,desc"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
    System.out.println(result);
}
```

**2、** 2、如果有多个分页或排序时（多个表），用@Qualifier来解决，请求参数要以${qualifier}_开头；

```java
@GetMapping("/multi/pageable")
public String multiPageable(@Qualifier("user") Pageable userPageable, @Qualifier("book") Pageable bookPageable){
    System.out.println("userPageable page：" + userPageable.getPageNumber());
    System.out.println("userPageable size：" + userPageable.getPageSize());
    System.out.println("userPageable sort：" + userPageable.getSort());
    System.out.println("bookPageable page：" + bookPageable.getPageNumber());
    System.out.println("bookPageable size：" + bookPageable.getPageSize());
    System.out.println("bookPageable sort：" + bookPageable.getSort());
    return "test";
}
```

```java
@Test
void multiPageable() throws Exception {
     this.mockMvc.perform(get("/user/multi/pageable")
            .param("user_page","2").param("user_size","2").param("user_sort","username,asc").param("user_sort","age,desc")
            .param("book_page","20").param("book_size","20").param("book_sort","bookName").param("book_sort","price,desc"))
            .andExpect(status().isOk());
}
```

二、使用@PageableDefault自定义pageable

我们也可以通过@PageableDefault来自定义默认值

```java
/**
 * 使用@PageableDefault自定义pageable
 */
@GetMapping("pageable/default")
public String pageableDefault(@PageableDefault(page = 2,size = 20,sort = {"username","age"},direction = Sort.Direction.DESC) Pageable pageable){
    System.out.println("page：" + pageable.getPageNumber());
    System.out.println("size：" + pageable.getPageSize());
    System.out.println("sort：" + pageable.getSort());
    return "PageableDefault";
}
```

```java
@Test
void pageableDefault() throws Exception {
    this.mockMvc.perform(get("/user/pageable/default"))
            .andExpect(status().isOk());
}
```

三、properties中的属性配置

Spring-Data还为我们提供了一些定制化配置，可以修改常见的是否将1作为第一页，默认是0，定制参数的名字，和每页最大数量等。

```java
#是否将1为第一页
spring.data.web.pageable.one-indexed-parameters=true
#pageable默认每页大小
spring.data.web.pageable.default-page-size=10
#每页大小最大值
spring.data.web.pageable.max-page-size=100
#当前页参数名
spring.data.web.pageable.page-parameter=pageIndex
#每页大小参数名
spring.data.web.pageable.size-parameter=pageSize
#排序参数名
spring.data.web.sort.sort-parameter=pageSort
#page和size参数的前缀，不会影响sort的参数名称
spring.data.web.pageable.prefix=pre
#多参数时分隔符
spring.data.web.pageable.qualifier-delimiter=-
```

源码地址：https://github.com/caofanqi/study-spring-data-jpa
