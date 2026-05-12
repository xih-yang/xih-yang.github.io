# 2、Hystrix 开发实践入门
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/2.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（A）
### 1、 pom.xml；

```xml
<dependency>
    <groupId>com.netflix.hystrix</groupId>
    <artifactId>hystrix-core</artifactId>
    <version>1.5.12</version>
</dependency>
```

### 2、 将商品服务接口进行command封装；

hystrix进行资源隔离其实就是提供了一个抽象，叫做command，也就是说，如果要把对某一个依赖服务的所有调用请求，全部隔离在同一份资源池内；对这个依赖服务的所有调用请求，全部走这个资源池内的资源，不会去用其他的资源了，这个就叫做资源隔离。

hystrix最基本的资源隔离的技术，线程池隔离技术；对某一个依赖服务，比如商品服务，所有的调用请求，全部隔离到一个线程池内，对商品服务的每次调用请求都封装在一个command里面；每个command（每次服务调用请求）都是使用线程池内的一个线程去执行的

所以哪怕是对这个依赖服务，也就是商品服务，如果一瞬间同时发起的调用量已经到了1000个请求了，但是如果线程池内就10个线程，那么最多就只会用这10个线程去执行；因此就不会出现因为对商品服务接口调用延迟，导致将tomcat内部所有的线程资源全部耗尽。

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {
    private Long productId;
　　private ProductService productService;
    public GetProductInfoCommand(Long productId,ProductService productService) {
        super(HystrixCommandGroupKey.Factory.asKey("GetProductInfoGroup"));
        this.productId = productId;
　　　　this.productService = productService;
    }
    @Override
    protected ProductInfo run() throws Exception {
        ProductInfo p = productService.findProductById(productId);return p;  
    }
}
```

```java
public class GetProductInfosCommand extends HystrixObservableCommand<ProductInfo> {
    private String[] productIds;
　　 prvivate ProductService productService;
    public GetProductInfosCommand(String[] productIds,ProductService productService) {
        super(HystrixCommandGroupKey.Factory.asKey("GetProductInfoGroup"));
        this.productIds = productIds;
　　　　　this.productService = productService;
    }
    @Override
    protected Observable<ProductInfo> construct() {
        return Observable.create(new Observable.OnSubscribe<ProductInfo>() {
            public void call(Subscriber<? super ProductInfo> observer) {
                try {
                    for(String productId : productIds) {
                        ProductInfo p = productService.findProductById(productId);
                        observer.onNext(p); 
                    }
                    observer.onCompleted();
                } catch (Exception e) {
                    observer.onError(e);  
                }
            }
        }).subscribeOn(Schedulers.io());
    }
}
```

### 3、 command接口；

HystrixCommand：发射单个操作结果

HystrixObservableCommand：发射多个操作结果

所谓“发射”，大家可以理解为 使用回调方法，发射多次，意味着可以多次调用回调方法，比如：

1、如果返回了一个List，我们又想把List里的每个对象都处理一下

2、再或者我们的实现里调用了多个服务，可以每个服务的结果都处理一下等。。。

关于这两个接口的区别，网络上几乎都是这个意思，如果想加深理解，下面是stack 的截图

```java
public class ObservableCommandHelloWorld extends HystrixObservableCommand<String> {
private final String name;
public ObservableCommandHelloWorld(String name) {
　　super(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"));
　　this.name = name;
}
@Override
protected Observable<String> construct() {
　　return Observable.create(new Observable.OnSubscribe<String>() {
　　@Override
　　public void call(Subscriber<? super String> observer) {
　　　　try {
　　　　　　　　observer.onNext("Hello " + name + "!");
　　　　　　　　observer.onNext("Hi " + name + "!");
　　　　　　　　observer.onCompleted();
　　　　　　} catch (Exception e) {
　　　　　　　　observer.onError(e);
　　　　　　　　}
　　　　　　}
　　　　} ).subscribeOn(Schedulers.io());
　　}
}
```

```java
@Autowired
private ProductService productService;
　　
@RequestMapping("/getProductInfo")
@ResponseBody
public String getProductInfo(Long productId) {
    HystrixCommand<ProductInfo> getProductInfoCommand = new GetProductInfoCommand(productId,productSerive);
    ProductInfo productInfo = getProductInfoCommand.execute();
    System.out.println(productInfo);  
    return "success";
}
/**
 * 一次性批量查询多条商品数据的请求
 */
@RequestMapping("/getProductInfos")
@ResponseBody
public String getProductInfos(String productIds) {
    HystrixObservableCommand<ProductInfo> getProductInfosCommand = 
            new GetProductInfosCommand(productIds.split(","),productService);  
    Observable<ProductInfo> observable = getProductInfosCommand.observe();
//   observable = getProductInfosCommand.toObservable(); // 还没有执行
    observable.subscribe(new Observer<ProductInfo>() { // 等到调用subscribe然后才会执行
        public void onCompleted() {
            System.out.println("获取完了所有的商品数据");
        }
        public void onError(Throwable e) {
            e.printStackTrace();
        }
        public void onNext(ProductInfo productInfo) {
            System.out.println(productInfo);  
        }
    });
    return "success";
}
```

### 4、 command的四种调用方式；

同步：new CommandHelloWorld("World").execute()，new ObservableCommandHelloWorld("World").toBlocking().toFuture().get()

如果你认为observable command只会返回一条数据，那么可以调用上面的模式，去同步执行，返回一条数据

异步：new CommandHelloWorld("World").queue()，new ObservableCommandHelloWorld("World").toBlocking().toFuture()

对command调用queue()，仅仅将command放入线程池的一个等待队列，就立即返回，拿到一个Future对象，后面可以做一些其他的事情，然后过一段时间对future调用get()方法获取数据

```java
Observable<String> fWorld = new CommandHelloWorld("World").observe();// 立即执行
fWorld.subscribe(new Observer<String>() {
　　@Override
　　public void onCompleted() {
　　}
　　@Override
　　public void onError(Throwable e) {
　　　　e.printStackTrace();
　　}
　　@Override
　　public void onNext(String v) {
　　　　System.out.println("onNext: " + v);
　　}
});
Observable<String> fWorld = new ObservableCommandHelloWorld("World").toObservable();//延迟执行，调用subscribe()时候再执行
fWorld.subscribe(new Observer<String>() {
　　@Override
　　public void onCompleted() {
　　}
　　@Override
　　public void onError(Throwable e) {
　　　　e.printStackTrace();
　　}
　　@Override
　　public void onNext(String v) {
　　　　System.out.println("onNext: " + v);
　　}
});
```
