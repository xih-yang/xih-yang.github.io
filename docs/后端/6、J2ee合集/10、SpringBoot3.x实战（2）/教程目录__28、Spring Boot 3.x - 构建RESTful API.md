# 28、Spring Boot 3.x - 构建RESTful API
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/28.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
## 一、什么是REST

`REST`（英文：Representational State Transfer，简称REST）描述了一个架构样式的网络系统，比如 web 应用程序。它首次出现在 2000 年 Roy Fielding 的博士论文中，Roy Fielding是 `HTTP` 规范的主要编写者之一。在目前主流的三种Web服务交互方案中，`REST`相比于`SOAP`（Simple Object Access protocol，简单对象访问协议）以及`XML-RPC`更加简单明了，无论是对`URL`的处理还是对`Payload`的编码，`REST`都倾向于用更加简单轻量的方法设计和实现。值得注意的是REST并没有一个明确的标准，而更像是一种设计的风格。

`REST` 指的是一组架构约束条件和原则。满足这些约束条件和原则的应用程序或设计就是 `RESTful`。

## 二、RESTful API设计原则

**1、****通信协议**；

> API通信协议使用HTTPS协议

**2、****部署域名**；

> API部署到专有域名下: https://api.example.com 或者 https://example.com/api/

**3、****API版本**；

> API版本号放入URLhttps://api.example.com/v1

**4、****面向资源**；

> 在RESTful架构中，每个URI代表一种资源（resource），所以URI中不能有动词，只能有名词，而且所用的名词往往与数据库的表名对应。一般来说，数据库中的表都是同种记录的"集合"（collection），所以API中的名词也应该使用复数。
>
> https://api.example.com/v1/zoos
>
> https://api.example.com/v1/animals
>
> https://api.example.com/v1/employees

**1、****HTTP动词操作资源**；

> GET（SELECT）：从服务器取出资源（一项或多项）。
>
> POST（CREATE）：在服务器新建一个资源。
>
> PUT（UPDATE）：在服务器更新资源（客户端提供改变后的完整资源）。
>
> PATCH（UPDATE）：在服务器更新资源（客户端提供改变的属性）。
>
> DELETE（DELETE）：从服务器删除资源。

两个不常用的HTTP动词

> HEAD：获取资源的元数据。
>
> OPTIONS：获取信息，关于资源的哪些属性是客户端可以改变的。

例子

> GET /zoos：列出所有动物园
>
> POST /zoos：新建一个动物园
>
> GET /zoos/ID：获取某个指定动物园的信息
>
> PUT /zoos/ID：更新某个指定动物园的信息（提供该动物园的全部信息）
>
> PATCH /zoos/ID：更新某个指定动物园的信息（提供该动物园的部分信息）
>
> DELETE /zoos/ID：删除某个动物园
>
> GET /zoos/ID/animals：列出某个指定动物园的所有动物
>
> DELETE /zoos/ID/animals/ID：删除某个指定动物园的指定动物

**1、****条件过滤**；

> ?limit=10：指定返回记录的数量
>
> ?offset=10：指定返回记录的开始位置。
>
> ?page=2&per_page=100：指定第几页，以及每页的记录数。
>
> ?sortby=name&order=asc：指定返回结果按照哪个属性排序，以及排序顺序。
>
> ?animal_type_id=1：指定筛选条件

**7、****状态码**；

> 200 OK - [GET]：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。
>
> 201 CREATED - [POST/PUT/PATCH]：用户新建或修改数据成功。
>
> 202 Accepted - []：表示一个请求已经进入后台排队（异步任务）
>
> 204 NO CONTENT - [DELETE]：用户删除数据成功。
>
> 400 INVALID REQUEST - [POST/PUT/PATCH]：用户发出的请求有错误，服务器没有进行新建或修改数据的操作，该操作是幂等的。
>
> 401 Unauthorized - []：表示用户没有权限（令牌、用户名、密码错误）。
>
> 403 Forbidden - [] 表示用户得到授权（与401错误相对），但是访问是被禁止的。
>
> 404 NOT FOUND - []：用户发出的请求针对的是不存在的记录，服务器没有进行操作，该操作是幂等的。
>
> 406 Not Acceptable - [GET]：用户请求的格式不可得（比如用户请求JSON格式，但是只有XML格式）。
>
> 410 Gone -[GET]：用户请求的资源被永久删除，且不会再得到的。
>
> 422 Unprocesable entity - [POST/PUT/PATCH] 当创建一个对象时，发生一个验证错误。
>
> 500 INTERNAL SERVER ERROR - [*]：服务器发生错误，用户将无法判断发出的请求是否成功。

**1、****错误处理**；

如果状态码是4xx，就应该向用户返回出错信息。一般来说，返回的信息中将error作为键名，出错信息作为键值即可。

> {
>
> error: “Invalid API key”
>
> }

**1、****返回结果**；

> GET /collection：返回资源对象的列表（数组）
>
> GET /collection/resource：返回单个资源对象
>
> POST /collection：返回新生成的资源对象
>
> PUT /collection/resource：返回完整的资源对象
>
> PATCH /collection/resource：返回完整的资源对象
>
> DELETE /collection/resource：返回一个空文档

## 三、Spring Boot 3构建 RESTful API

完整代码：[代码](https://download.csdn.net/download/renpeng301/85320415)

本节使用`Spring Boot 3+Spring data jpa+mysql+lombok+mapstruct`构建`Restful Api`。实现`动物园`和`动物`之间的CRUD接口。

**整个项目架构设计如下：**

### 1.新建项目导入依赖库

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.0.0-M2</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-restful-api</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>spring-boot-restful-api</name>
    <description>spring-boot-restful-api</description>
    <properties>
        <java.version>17</java.version>
        <org.mapstruct.version>1.4.2.Final</org.mapstruct.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${org.mapstruct.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>17</source> <!-- depending on your project -->
                    <target>17</target> <!-- depending on your project -->
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${org.mapstruct.version}</version>
                        </path>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${lombok.version}</version>
                        </path>
                        <dependency>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok-mapstruct-binding</artifactId>
                            <version>0.2.0</version>
                        </dependency>
                        <!-- other annotation processors -->
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
    <repositories>
        <repository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
</project>
```

### 2.表结构设计

数据库结构使用`Entity`自动生成表结构。

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
  jpa:
    hibernate:
      ddl-auto: update
debug: true
```

**实体设计：**

```java
@Entity
@Data
@NoArgsConstructor
public class Zoo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String address;
    private String telephone;
    @OneToMany(cascade = ALL, mappedBy = "zoo")
    private Set<Animal> animals;
}
```

```java
@Entity
@Data
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private Integer age;
    @ManyToOne
    @JoinColumn(name = "ZOO_ID", nullable = false)
    private Zoo zoo;
}
```

### 3.接口设计

本次需要实现的接口如下：

接口
描述
返回

GET /zoos
查询动物园列表
List

GET /zoos/{id}
查询指定动物园详情
ZooResponse

POST /zoos
新增动物园
ZooResponse

DELETE /zoos/{id}
删除指定动物园
void

PUT /zoos/{id}
更新指定动物园信息（全部属性）
ZooResponse

PATCH /zoos/{id}
更新指定动物园信息（部分属性）
ZooResponse

POST /zoos/{zooId}/animals
指定动物园新增动物
ZooResponse

GET /zoos/{zooId}/animals
查询指定动物园动物列表
List

GET /animals/{id}
查询指定动物详细信息
AnimalResponse

GET /animals
获取所有的动物列表
List

**接口响应对象:**

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZooResponse implements Serializable {
    private Integer id;
    private String name;
    private String address;
    private String telephone;
}
```

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnimalResponse implements Serializable {
    private Integer id;
    private String name;
    private Integer age;
}
```

**接口请求对象：**

```java
@Data
@NoArgsConstructor
public class AnimalRequest implements Serializable {
    @NotEmpty(message = "animal name not empty")
    @Size(max = 100)
    private String name;
    @NotEmpty
    @Min(value = 1)
    private Integer age;
}
```

```java
@Data
@NoArgsConstructor
public class ZooRequest implements Serializable {
    @NotEmpty(message = "zoo name not empty")
    @Size(max = 32)
    private String name;
    @NotEmpty
    @Size(max = 255)
    private String address;
    @NotEmpty
    @Size(max = 20)
    private String telephone;
}
```

### 4.对象转换&Repository &Service

#### 1.对象转化

对象转换使用了`mapstruct`工具，下面自定义需要转换的对象映射关系，工具会自动实现接口。

```java
@Mapper
public interface ZooConverter {
    ZooConverter INSTANCE = Mappers.getMapper(ZooConverter.class);
    Zoo requestToEntity(ZooRequest zooRequest);
    List<ZooResponse> entityToResponse(List<Zoo> zoos);
    ZooResponse entityToResponse(Zoo zoo);
}
```

#### 2.Repository接口实现

为了数据转换方便，直接继承`ListCrudRepository`。

```java
@Transactional(readOnly = true)
public interface AnimalRepository extends ListCrudRepository<Animal, Integer> {
    List<Animal> findAnimalByZooIdIs(Integer zooId);
}
@Transactional(readOnly = true)
public interface ZooRepository extends ListCrudRepository<Zoo, Integer> {
}
```

#### 3.Service实现

接口定义，在`controller`注入调用。

```java
**AnimalService.java**
public interface AnimalService {
    AnimalResponse create(Integer zooId, AnimalRequest animalRequest) throws NoRecordFoundException;
    AnimalResponse detail(Integer id) throws NoRecordFoundException;
    List<AnimalResponse> list();
    List<AnimalResponse> listZooAnimals(Integer zooId);
}
**ZooService.java**
public interface ZooService {
    ZooResponse create(ZooRequest zooRequest);
    ZooResponse update(Integer id, ZooRequest zooRequest) throws NoRecordFoundException;
    ZooResponse updateTelephone(Integer id, String telephone) throws NoRecordFoundException;
    ZooResponse detail(Integer id) throws NoRecordFoundException;
    List<ZooResponse> list();
    void delete(Integer id) throws NoRecordFoundException;
```

```java
@Service("zooService")
public class ZooServiceImpl implements ZooService {
    private ZooRepository zooRepository;
    private AnimalRepository animalRepository;
    public ZooServiceImpl(ZooRepository zooRepository, AnimalRepository animalRepository) {
        this.zooRepository = zooRepository;
        this.animalRepository = animalRepository;
    }
    @Transactional
    @Override
    public ZooResponse create(ZooRequest zooRequest) {
        Zoo zoo = ZooConverter.INSTANCE.requestToEntity(zooRequest);
        zooRepository.save(zoo);
        return ZooConverter.INSTANCE.entityToResponse(zoo);
    }
    @Override
    public ZooResponse update(Integer id, ZooRequest zooRequest) throws NoRecordFoundException {
        if (zooRepository.findById(id).isPresent()) {
            Zoo zoo = ZooConverter.INSTANCE.requestToEntity(zooRequest);
            zoo.setId(id);
            return ZooConverter.INSTANCE.entityToResponse(zoo);
        } else {
            throw new NoRecordFoundException("no record found id=" + id + " for zoo");
        }
    }
    @Override
    public ZooResponse updateTelephone(Integer id, String telephone) throws NoRecordFoundException {
        Optional<Zoo> optionalZoo = zooRepository.findById(id);
        if (optionalZoo.isPresent()) {
            Zoo zoo = optionalZoo.get();
            zoo.setTelephone(telephone);
            zooRepository.save(zoo);
            return ZooConverter.INSTANCE.entityToResponse(zoo);
        } else {
            throw new NoRecordFoundException("no record found id=" + id + " for zoo");
        }
    }
    @Override
    public ZooResponse detail(Integer id) throws NoRecordFoundException {
        Optional<Zoo> optionalZoo = zooRepository.findById(id);
        if (optionalZoo.isPresent()) {
            return ZooConverter.INSTANCE.entityToResponse(optionalZoo.get());
        } else {
            throw new NoRecordFoundException("no record found id=" + id + " for zoo");
        }
    }
    @Override
    public List<ZooResponse> list() {
        List<Zoo> zoos = zooRepository.findAll();
        return ZooConverter.INSTANCE.entityToResponse(zoos);
    }
    @Transactional
    @Override
    public void delete(Integer id) throws NoRecordFoundException {
        Optional<Zoo> zoo = zooRepository.findById(id);
        if (zoo.isPresent()) {
            zooRepository.deleteById(id);
        } else {
            throw new NoRecordFoundException("no record found id=" + id + " for zoo");
        }
    }
}
@Service("animalService")
public class AnimalServiceImpl implements AnimalService {
    private ZooRepository zooRepository;
    private AnimalRepository animalRepository;
    public AnimalServiceImpl(ZooRepository zooRepository, AnimalRepository animalRepository) {
        this.zooRepository = zooRepository;
        this.animalRepository = animalRepository;
    }
    @Override
    public AnimalResponse create(Integer zooId, AnimalRequest animalRequest) throws NoRecordFoundException {
        Optional<Zoo> optionalZoo = zooRepository.findById(zooId);
        if (optionalZoo.isEmpty()) {
            throw new NoRecordFoundException("no record found id=" + zooId + " for zoo");
        }
        Zoo zoo = optionalZoo.get();
        Animal animal = AnimalConverter.INSTANCE.requestToEntity(animalRequest);
        animal.setZoo(zoo);
        animalRepository.save(animal);
        return AnimalConverter.INSTANCE.entityToResponse(animal);
    }
    @Override
    public AnimalResponse detail(Integer id) throws NoRecordFoundException {
        Optional<Animal> optionalAnimal = animalRepository.findById(id);
        if (optionalAnimal.isPresent()) {
            return AnimalConverter.INSTANCE.entityToResponse(optionalAnimal.get());
        } else {
            throw new NoRecordFoundException("no record found id=" + id + " for animal");
        }
    }
    @Override
    public List<AnimalResponse> list() {
        return AnimalConverter.INSTANCE.entityToResponse(animalRepository.findAll());
    }
    @Override
    public List<AnimalResponse> listZooAnimals(Integer zooId) {
        List<Animal> animals = animalRepository.findAnimalByZooIdIs(zooId);
        return AnimalConverter.INSTANCE.entityToResponse(animals);
    }
}
```

`service`中`repository`注入，使用构造函数的方式，这个是`Spring`推荐的方式。`service`方法中业务异常直接抛出，上层统一处理，这样可以方便的格式化错误信息的输出。

### 5.controller

`controller`非常薄的一层，没有过多的业务逻辑处理，主要是参数校验，调用`service`方法。然后统一的异常处理返回统一格式。

```java
@RestController
@RequestMapping("/zoos")
public class ZooController {
    private ZooService zooService;
    private AnimalService animalService;
    public ZooController(ZooService zooService, AnimalService animalService) {
        this.zooService = zooService;
        this.animalService = animalService;
    }
    /**
     * 查询所有动物园
     *
     * @return ZooResponse
     */
    @GetMapping()
    public ResponseEntity<List<ZooResponse>> list() {
        return ResponseEntity.ok(zooService.list());
    }
    /**
     * 获取动物园详情
     *
     * @param id 动物园id
     * @return ZooResponse
     */
    @SneakyThrows
    @GetMapping(value = "/{id}")
    public ResponseEntity<ZooResponse> detail(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(zooService.detail(id));
    }
    /**
     * 新增一个动物园
     *
     * @param zooRequest 动物园信息
     * @return ZooResponse
     */
    @PostMapping
    public ResponseEntity<ZooResponse> create(@RequestBody @Validated ZooRequest zooRequest) {
        return ResponseEntity.ok(zooService.create(zooRequest));
    }
    /**
     * 删除指定动物园
     *
     * @param id 动物园id
     */
    @SneakyThrows
    @DeleteMapping(value = "/{id}")
    public void delete(@PathVariable("id") Integer id) {
        zooService.delete(id);
    }
    /**
     * 更新动物园信息，整个对象信息
     *
     * @param id         动物园id
     * @param zooRequest 动物园全部信息
     * @return ZooResponse
     */
    @SneakyThrows
    @PutMapping(value = "/{id}")
    public ResponseEntity<ZooResponse> update(@PathVariable("id") Integer id, @RequestBody @Validated ZooRequest zooRequest) {
        return ResponseEntity.ok(zooService.update(id, zooRequest));
    }
    /**
     * 更新动物园信息，部分对象信息
     *
     * @param id        动物园id
     * @param telephone 手机号
     * @return ZooResponse
     */
    @SneakyThrows
    @PatchMapping(value = "/{id}")
    public ResponseEntity<ZooResponse> updatePart(@PathVariable("id") Integer id, @RequestParam(value = "telephone", required = true) String telephone) {
        return ResponseEntity.ok(zooService.updateTelephone(id, telephone));
    }
    /**
     * 指定动物园新增动物
     *
     * @param zooId 动物园id
     * @return 动物信息
     */
    @SneakyThrows
    @PostMapping(value = "/{zooId}/animals")
    public ResponseEntity<AnimalResponse> createAnimal(@PathVariable("zooId") Integer zooId, @RequestBody AnimalRequest animalRequest) {
        return ResponseEntity.ok(animalService.create(zooId, animalRequest));
    }
    /**
     * 查询指定动物园下所有动物
     *
     * @param zooId 动物园id
     * @return
     */
    @GetMapping(value = "/{zooId}/animals")
    public ResponseEntity<List<AnimalResponse>> listAnimals(@PathVariable("zooId") Integer zooId) {
        return ResponseEntity.ok(animalService.listZooAnimals(zooId));
    }
}
```

`@SneakyThrows`这个是`lombak`的注解，消去异常处理的模版代码。

`@RequestBody @Validated ZooRequest` 接受客户端json格式数据，并且校验数据是否合法。使用的是`jakarta.validation`。

```java
public class ZooRequest implements Serializable {
    @NotEmpty(message = "zoo name not empty")
    @Size(max = 32)
    private String name;
    @NotEmpty
    @Size(max = 255)
    private String address;
    @NotEmpty
    @Size(max = 20)
    private String telephone;
}
```

#### 测试&异常统一处理

接口在正常的响应下返回业务数据，没问题。如果在异常的情况下。需要包装成统一的返回格式。

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResult implements Serializable {
    /**
     * 业务错误码
     */
    private Integer code;
    //错误信息
    private String error;
    /**
     * 错误信息的具体描述
     */
    private Object detail;
}
```

**统一异常处理**

```java
@ControllerAdvice(basePackages = "com.example.springbootrestfulapi.controller")
public class ControllerExceptionAdvice extends ResponseEntityExceptionHandler {
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers, HttpStatus status, WebRequest webRequest) {
        return super.handleExceptionInternal(ex, body, headers, status, webRequest);
    }
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatus status, WebRequest request) {
        Map<String, Object> detail = new HashMap<>();
        ex.getFieldErrors().forEach(fieldError -> {
            detail.put(fieldError.getField(), fieldError.getDefaultMessage());
        });
        return new ResponseEntity<>(new ErrorResult(status.value(), ex.getBody().getDetail(), detail), status);
    }
    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers, HttpStatus status, WebRequest request) {
        return new ResponseEntity<>(new ErrorResult(status.value(), ex.getErrorCode(), ex.getMessage()), status);
    }
    @ExceptionHandler(NoRecordFoundException.class)
    protected ResponseEntity<Object> handlerNoRecordFound(NoRecordFoundException ex) {
        return new ResponseEntity<>(new ErrorResult(HttpStatus.NOT_FOUND.value(), ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }
}
```

`ResponseEntityExceptionHandler`默认实现了常用的异常处理。但是它输出的格式 是spring默认的。如果需要自定义格式，需要继承它然后重新输出内容。如上面例子所示。

## 总结

以上就是根据`restful`规范设计的简单`api`。随着接口越来越多，调用方怎样能一目了然的了解怎样使用你提供的接口，那么接口文档非常重要，下一节我们再讲。

完整代码：[代码](https://download.csdn.net/download/renpeng301/85320415)
