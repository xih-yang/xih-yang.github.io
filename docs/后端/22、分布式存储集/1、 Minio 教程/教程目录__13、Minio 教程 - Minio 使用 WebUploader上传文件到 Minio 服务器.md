# 13、Minio 教程 - Minio 使用 WebUploader上传文件到 Minio 服务器
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/13.html
- 分类：分布式存储
- 分组：教程目录
### 前言

在之前介绍了Minio常用功能，以及如何使用JAVA SDK集成Minio，但是没有涉及到前端应该怎么做，接下来介绍如何使用Web组件集成Minio进行文件处理。

### WebUploader（摘自官网）

#### 1. 简介

[WebUploader](http://fex.baidu.com/webuploader/)是由Baidu WebFE(FEX)团队开发的一个简单的以HTML5为主，FLASH为辅的现代文件上传组件。在现代的浏览器里面能充分发挥HTML5的优势，同时又不摒弃主流IE浏览器，沿用原来的FLASH运行时，兼容IE6+，iOS 6+, android 4+。两套运行时，同样的调用方式，可供用户任意选用。

采用大文件分片并发上传，极大的提高了文件上传效率。

#### 2. 特性

#### 分片、并发

分片与并发结合，将一个大文件分割成多块，并发上传，极大地提高大文件的上传速度。

当网络问题导致传输错误时，只需要重传出错分片，而不是整个文件。另外分片传输能够更加实时的跟踪上传进度。

#### 预览、压缩

支持常用图片格式jpg,jpeg,gif,bmp,png预览与压缩，节省网络数据传输。

解析jpeg中的meta信息，对于各种orientation做了正确的处理，同时压缩后上传保留图片的所有原始meta数据。

#### 多途径添加文件

支持文件多选，类型过滤，拖拽(文件&文件夹)，图片粘贴功能。

粘贴功能主要体现在当有图片数据在剪切板中时（截屏工具如QQ(Ctrl + ALT + A), 网页中右击图片点击复制），Ctrl + V便可添加此图片文件。

#### HTML5 & FLASH

兼容主流浏览器，接口一致，实现了两套运行时支持，用户无需关心内部用了什么内核。

同时Flash部分没有做任何UI相关的工作，方便不关心flash的用户扩展和自定义业务需求。

#### MD5秒传

当文件体积大、量比较多时，支持上传前做文件md5值验证，一致则可直接跳过。

如果服务端与前端统一修改算法，取段md5，可大大提升验证性能，耗时在20ms左右。

#### 易扩展、可拆分

采用可拆分机制, 将各个功能独立成了小组件，可自由搭配。

采用AMD规范组织代码，清晰明了，方便高级玩家扩展。

### 案例1 调用文件服务上传单个文件到Minio\

接下来参考WebUploader官方文档，完成一个最简单的功能：点击选择文件，选择文件后点击上传，请求文件服务将文件传输到Minio服务器中。

#### 1. 基础环境搭建

在[上篇文档](https://blog.csdn.net/qq_43437874/article/details/120920171)基础上引入thymeleaf。

```java
        <!--thymeleaf-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
```

添加thymelea相关配置

```java
spring:
  application:
    name: spring-boot-minio
  servlet:
    multipart:
      multipart请求数据最大值
      max-request-size: 1024MB
      multipart请求 文件最大值
      max-file-size: 1024MB
  mvc:
    servlet:
      load-on-startup: 1
    static-path-pattern: /static/**
  resources:
    static-locations: classpath:/static/
  thymeleaf:
    cache: false
```

#### 2. 引入Uploader

首先在[GitHub](https://github.com/fex-team/webuploader/releases)下载，下载包中包含以下文件：

```java
├── Uploader.swf                      // SWF文件，当使用Flash运行时需要引入。
├── webuploader.js                    // 完全版本。
├── webuploader.min.js                // min版本
├── webuploader.flashonly.js          // 只有Flash实现的版本。
├── webuploader.flashonly.min.js      // min版本
├── webuploader.html5only.js          // 只有Html5实现的版本。
├── webuploader.html5only.min.js      // min版本
├── webuploader.withoutimage.js       // 去除图片处理的版本，包括HTML5和FLASH.
└── webuploader.withoutimage.min.js   // min版本
```

将文件放入到工程resources/static目录下：

#### 3. 创建页面和接口

提供一个上传文件及页面访问接口：

```java
@Controller
@RequestMapping("/minio")
public class FileController {
    @Autowired
    MinioTemplate minioTemplate;
    @PostMapping("/upload")
    @ResponseBody
    public Object upload(MultipartFile file, String bucketName) throws IOException {
        return minioTemplate.putObject(file.getInputStream(), bucketName, file.getOriginalFilename());
    }
    @GetMapping("file2")
    public String file() {
        return "file2";
    }
}
```

添加文件上传页面file2.html，使用WebUploader主要有以下重要的几个步骤：

**1、** Html部分，创建dom结构，包含存放文件信息的容器、选择按钮和上传按钮三个部分；

**2、** 初始化WebUploader，指定上传文件RUL、选择文件按钮等；

**3、** 提交上传，调用Uploader执行上传任务；

**4、** 上传结果处理；

```java
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<!--引入CSS-->
<link rel="stylesheet" type="text/css" href="/static/webuploader.css" th:href="@{/static/webuploader.css}"/>
<!--引入JS-->
<script src="https://s3.pstatp.com/cdn/expire-1-M/jquery/3.3.1/jquery.min.js"></script>
<script type="text/javascript" src="/static/webuploader.js" th:src="@{/static/webuploader.js}"></script>
<style>
</style>
<body>
<!--首先准备dom结构，包含存放文件信息的容器、选择按钮和上传按钮三个部分。-->
<div id="upload-container">
</div>
<!--用来存放文件信息-->
<div id="list">
</div>
<button id="picker" >点击选择文件</button>
<input type='button' id='uploadFile' onclick='uploadFile()' value='开始上传'>
</body>
<script>
    // 初始化Web Uploader
    const uploader = WebUploader.create({
        server: '/minio/upload',// 文件接收服务端。
        pick: '#picker',// 选择文件的按钮。可选。内部根据当前运行是创建，可能是input元素，也可能是flash. 这里是div的id
        method: 'POST', // 文件上传方式，POST或者GET，默认Post
        resize: false// 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
    });
    // 当有文件被添加进队列的时候,展示添加的文件信息
    uploader.on( 'fileQueued', function( file ) {
        $('#list').append( '<div id="' + file.id + '" class="item">' +
            '<h4 class="info">' + file.name + '</h4>' +
            '<p class="state">等待上传...</p>' +
            '</div>' );
    });
    //上传文件
    function uploadFile(){
        const filesLength = uploader.getFiles().length;
        let files = uploader.getFiles();
        console.log(files);
        const formData = {
       };
        if (filesLength > 0) {
            uploader.options.formData = formData;
            uploader.upload();
        } else {
            alert("请选择文件！");
        }
    };
    // 成功uploadSuccess事件
    uploader.on( 'uploadSuccess', function( file ) {
        $( '#'+file.id ).find('p.state').text('已上传');
    });
    // 上传失败uploadError事件
    uploader.on( 'uploadError', function( file ) {
        $( '#'+file.id ).find('p.state').text('上传出错');
    });
</script>
</html>
```

#### 4. 测试

首先访问/minio/file2，可以看到一个很简单的上传页面

然后选择文件，发现在文件信息的div中，显示了当前等待上传的文件。

点击开始上传，发现上传状态变成了已上传。

最后登录我们的minio控制台，发现文件成功上传到此位置，文件名变了是因为之前我们采用了UUID生成随机文件名（防止重复）。

### 案例2 直接调用Minio服务上传单个文件

在案例1中，我们使用WebUploader组件，调用文件服务，文件服务再上传到Minio，性能较差，我们可以直接采用JS SDK集成Minio Client，但是容易暴露Minio的用户密码。

面对以上问题，我们可以采用前端调用文件服务，告诉后台我需要上传一个文件，文件服务返回一个签名的认证信息，前端再携带签名数据，就可以直接上传文件到Minio，这种中转的方式，既解决了性能也解决了安全问题。

#### 1. 添加接口

添加一个获取签名数据的接口，minioTemplate上篇文档中已提供该功能。

```java
    @GetMapping("getPresignedPostFormData")
    @ResponseBody
    public Map<String,String> getPresignedPostFormData(String bucketName,String fileName){
        return minioTemplate.getPresignedPostFormData(bucketName, fileName);
    }
```

#### 2. 改造页面

首先访问文件服务，请求到上传文件的签名数据，然后携带签名数据直接将文件上传到Minio。

```java
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<!--引入CSS-->
<link rel="stylesheet" type="text/css" href="/static/webuploader.css" th:href="@{/static/webuploader.css}"/>
<!--引入JS-->
<script src="https://s3.pstatp.com/cdn/expire-1-M/jquery/3.3.1/jquery.min.js"></script>
<script type="text/javascript" src="/static/webuploader.js" th:src="@{/static/webuploader.js}"></script>
<style>
</style>
<body>
<!--首先准备dom结构，包含存放文件信息的容器、选择按钮和上传按钮三个部分。-->
<div id="upload-container">
</div>
<!--用来存放文件信息-->
<div id="list">
</div>
<button id="picker">点击选择文件</button>
<input type='button' id='uploadFile' onclick='uploadFile()' value='开始上传'>
</body>
<script>
    // 初始化Web Uploader
    const uploader = WebUploader.create({
        server: 'http://localhost:9000/pearl-buckent',// 文件接收服务端。
        pick: '#picker',// 选择文件的按钮。可选。内部根据当前运行是创建，可能是input元素，也可能是flash. 这里是div的id
        method: 'POST', // 文件上传方式，POST或者GET，默认Post
        resize: false// 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
    });
    // 当有文件被添加进队列的时候,展示添加的文件信息
    uploader.on('fileQueued', function (file) {
        $('#list').append('<div id="' + file.id + '" class="item">' +
            '<h4 class="info">' + file.name + '</h4>' +
            '<p class="state">等待上传...</p>' +
            '</div>');
    });
    //上传文件
    function uploadFile() {
        const filesLength = uploader.getFiles().length;
        if (filesLength > 0) {
            // 1. 获取上传文件信息
            let files = uploader.getFiles();
            console.log(files);
            //设置异步
            $.ajaxSettings.async = false;
            let presignedPostFormData = {
       }
            // 2. 循环待上传文件信息
            for (let index = 0; index < files.length; index++) {
                // 3. Get 请求签名数据
                let data = {
       "fileName": files[index].name, "bucketName": "pearl-buckent"};  // 请求参数：文件名称，存储桶名
                console.log(files[index].name);
                $.ajax({
                    type: "GET",
                    url: "/minio/getPresignedPostFormData",
                    data: data,
                    dataType: "json",
                    success: function (res) {
                        presignedPostFormData = res; // 签名数据
                        console.log("获取签名：" + res)
                    },
                });
                // 4. 调用签名信息，直接上传到Minio
                presignedPostFormData.key = files[index].name; // 设置key参数的值为文件名
                const PostFormMap = new Map(Object.entries(presignedPostFormData)); // 专为Map
                PostFormMap.set("Content-Type", "image/png"); // 设置Content-Type参数
                uploader.options.formData = Object.fromEntries(PostFormMap.entries()); // 将请求参数绑定到uploader
                uploader.upload(); // 执行上传操作
            }
        } else {
            alert("请选择文件！");
        }
    }
    // 成功uploadSuccess事件
    uploader.on('uploadSuccess', function (file) {
        $('#' + file.id).find('p.state').text('已上传');
    });
    // 上传失败uploadError事件
    uploader.on('uploadError', function (file) {
        $('#' + file.id).find('p.state').text('上传出错');
    });
</script>
</html>
```

#### 3. 测试

选择一个文件直接上传，可以看到直接请求到了Minio服务器，并携带了相关签名数据。

登录Minio控制台，可以看到当前上传的文件。
