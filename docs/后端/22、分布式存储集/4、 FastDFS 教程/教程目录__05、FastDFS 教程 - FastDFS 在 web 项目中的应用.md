# 05、FastDFS 教程 - FastDFS 在 web 项目中的应用
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/2/5.html
- 分类：分布式存储
- 分组：教程目录
## 前言

本篇文章我们主要介绍 FastDFS 在 web 项目中的应用，通过完成 一个 P2P 项目合同管理的例子，在 WEB 项目中实现对文件的**上传、下载和删除**操作。

我们做这个项目的主要目标是 ：

- **实现对 pdf 文件上传、下载、删除**
- **熟练使用 Springboot + thymeleaf**

## 一、数据库环境搭建

**A、创建数据库 fastdfs**

**B、在该库下创建 creditor_info 表**

```java
CREATE TABLE creditor_info (
	id int(11) NOT NULL AUTO_INCREMENT COMMENT '主键',
	realName varchar(35) DEFAULT NULL COMMENT '债权借款人姓名',
	idCard varchar(18) DEFAULT NULL COMMENT '债权借款人身份证',
	address varchar(150) DEFAULT NULL COMMENT '债权借款人地址',
	gender int(1) DEFAULT NULL COMMENT '1男2女',
	phone varchar(11) DEFAULT NULL COMMENT '债权借款人电话',
	money decimal(10,2) DEFAULT NULL COMMENT '债权借款人借款金额',
	groupName varchar(10) DEFAULT NULL COMMENT '债权合同所在组',
	remoteFilePath varchar(150) DEFAULT NULL COMMENT '债权合同所在路径',
	 PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

## 二、开发环境搭建

**A、创建 SpringBoot 项目 fastdfs-web，添加 Web 和 Thymeleaf 依赖**

**B、在 pom.xml 文件中添加 Mybatis 依赖及 MySQL 依赖**

```java
!-- 加载mybatis整合springboot -->
<dependency>
   <groupId>org.mybatis.spring.boot</groupId>
   <artifactId>mybatis-spring-boot-starter</artifactId>
   <!--在springboot的父工程中没有指定版本，我们需要手动指定-->
   <version>1.3.2</version>
</dependency>
<!-- MySQL的jdbc驱动包 -->
<dependency>
   <groupId>mysql</groupId>
   <!--在springboot的父工程中指定了版本，我们就不需要手动指定了-->
   <artifactId>mysql-connector-java</artifactId>
</dependency>
```

**C、在pom.xml文件中添加resources，指定编译的位置**

```java
<resources>
   <resource>
      <directory>src/main/java</directory>
      <includes>
         <include>**/*.xml</include>
      </includes>
   </resource>
   <resource>
      <directory>src/main/resources</directory>
      <includes>
         <include>**/*.*</include>
      </includes>
   </resource>
   <!--如果存在jsp，需要指定jsp文件编译的位置-->
</resources>
```

**D、在 SpringBoot 主配置文件 application.properties 中添加数据库配置信息**

```java
#数据库的连接配置信息
spring.datasource.username=root
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://192.168.160.133:3306/fastdfs?useUnicode=true&characterEncoding=utf8&useSSL=false
```

**E、创建相关的包和类**

创建controller，model，mapper，service 包，及其子包 impl。

创建CreditorInfoController 类、CreditorInfoService 接口、创建 CreditorInfoServiceImpl 实现类。

**F、实体类**

```java
package com.fancy.fastdfsweb.mapper;
public class CreditorInfo {
    private Integer id;
    private String realName;
    private String idCart;
    private String address;
    private Integer gender;
    private String phone;
    private Double money;
    private String groupName;
    private String remoteFilePath;
    public CreditorInfo() {
    }
    public CreditorInfo(Integer id, String realName, String idCart, String address, Integer gender, String phone, Double money, String groupName, String remoteFilePath) {
        this.id = id;
        this.realName = realName;
        this.idCart = idCart;
        this.address = address;
        this.gender = gender;
        this.phone = phone;
        this.money = money;
        this.groupName = groupName;
        this.remoteFilePath = remoteFilePath;
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getRealName() {
        return realName;
    }
    public void setRealName(String realName) {
        this.realName = realName;
    }
    public String getIdCart() {
        return idCart;
    }
    public void setIdCart(String idCart) {
        this.idCart = idCart;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    public Integer getGender() {
        return gender;
    }
    public void setGender(Integer gender) {
        this.gender = gender;
    }
    public String getPhone() {
        return phone;
    }
    public void setPhone(String phone) {
        this.phone = phone;
    }
    public Double getMoney() {
        return money;
    }
    public void setMoney(Double money) {
        this.money = money;
    }
    public String getGroupName() {
        return groupName;
    }
    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }
    public String getRemoteFilePath() {
        return remoteFilePath;
    }
    public void setRemoteFilePath(String remoteFilePath) {
        this.remoteFilePath = remoteFilePath;
    }
}
```

## 三、功能设计

### 1. 展示所有债权信息

**A、在 CreditorInfoController 类中创建 index 方法，将 CreditorInfoService 注入到 controller 中**

```java
@Autowired
private CreditorInfoService creditorInfoService;
@GetMapping("/fastdfs/index")
public String index(Model model) {
    List<CreditorInfo> creditorInfoList = creditorInfoService.getAllCreditorInfo();
    model.addAttribute("creditorInfoList", creditorInfoList);
    //模板页面, 不是 jsp
    return "index";
}
```

**B、在 CreditorInfoService 中提供 getAllCreditorInfo 方法**

```java
package com.fancy.fastdfsweb.service;
import com.fancy.fastdfsweb.model.CreditorInfo;
import java.util.List;
public interface CreditorInfoService {
    List<CreditorInfo> getAllCreditorInfo();
}
```

**C、在 CreditorInfoServiceImpl 中对 getAllCreditorInfo 方法进行实现**

```java
package com.fancy.fastdfsweb.service.impl;
import com.fancy.fastdfsweb.model.CreditorInfo;
import com.fancy.fastdfsweb.service.CreditorInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class CreditorInfoServiceImpl implements CreditorInfoService {
    @Autowired
    private CreditorMapper creditorInfoMapper;
    @Override
    public List<CreditorInfo> getAllCreditorInfo() {
        return creditorInfoMapper.selectAllCreditorInfo();
    }
}
```

**D、在 CreditorMapper 接口中定义 selectAllCreditorInfo 方法**

```java
package com.fancy.fastdfsweb.mapper;
import com.fancy.fastdfsweb.model.CreditorInfo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
@Mapper
public interface CreditorMapper {
     List<CreditorInfo> selectAllCreditorInfo();
}
```

**E、在 IDEA 中安装 free Mybatis 插件**

插件可以通过点击 Mapper 接口中的方法，进入到 `.xml` 文件

**F、定义 mapper 映射文件相关 SQL 语句**

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.fancy.fastdfsweb.mapper.CreditorMapper">
    <select id="selectAllCreditorInfo" resultType="com.fancy.fastdfsweb.model.CreditorInfo">
        select * from  creditor_info;
    </select>
</mapper>
```

**G、展示页面的设计**

在项目的 templates 目录下创建 index.html，初步展示出数据库中数据

```java
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="utf-8">
    <title>债权合同管理</title>
    <link rel="stylesheet" th:href="@{/css/bootstrap.min.css}">
    <script th:src="@{/js/jquery-3.6.0.min.js}"></script>
    <script th:src="@{/js/bootstrap.min.js}"></script>
</head>
<body style="margin: 50px">
	<table class="table table-striped">
	    <caption>债权合同信息列表</caption>
	    <thead>
	    <tr>
	        <th>序号</th>
	        <th>债权借款人姓名</th>
	        <th>债权借款人身份证</th>
	        <th>债权借款人住址</th>
	        <th>债权借款人手机号</th>
	        <th>债权借款人性别</th>
	        <th>债权借款人借款金额</th>
	    </tr>
	    </thead>
	    <tbody>
	    <tr th:each="creditorInfo:${creditorInfoList}">
	        <td th:text="${creditorInfoStat.count}"></td>
	        <td th:text="${creditorInfo.realName}"></td>
	        <td th:text="${creditorInfo.idCard}"></td>
	        <td th:text="${creditorInfo.address}"></td>
	        <td th:text="${creditorInfo.phone}"></td>
	        <td th:text="${creditorInfo.gender == 1 ?'男':'女'}"></td>
	        <td th:text="${creditorInfo.money}"></td>
	    </tr>
	    </tbody>
	</table>
</body>
</html>
```

`` 在 html 标签上加上 Thymeleaf 的命名空间

**H、向数据库中加几条数据**

**I、启动项目，访问 http://localhost:8080/fastdfs/index 查看效果**

### 2. 为某一个债权合同上传文件

**A、在 index.html 中添加操作列**

```java
<th>合同管理</th>
```

```java
 <td>
    <a th:href="@{
      '/fastdfs/toUpload?id=' + ${creditorInfo.id}}">上传</a>
 </td>
```

**B、在 CreditorController 中添加跳转到上传页面的方法 toUpload**

```java
@GetMapping("/fastdfs/toUpload")
public String toUpload(Model model, @RequestParam("id") Integer id) {
    model.addAttribute("id", id);
    return "upload";
}
```

**C、在 templates 下创建 upload.html 页面**

```java
!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="utf-8">
    <title>债权合同上传</title>
    <link rel="stylesheet" th:href="@{/css/bootstrap.min.css}">
    <script th:src="@{/js/jquery-3.6.0.min.js}"></script>
    <script th:src="@{/js/bootstrap.min.js}"></script>
</head>
<body>
    <form th:action="@{/fastdfs/upload}" class="form-inline" role="form" method="post" enctype="multipart/form-data">
        <div class="form-group">
            <label class="sr-only" for="fileName">文件输入</label>
            <input type="file" id="fileName" name="fileName">
        </div>
        <input type="hidden" name="id" th:value="${id}">
        <button type="submit" class="btn btn-default">提交</button>
    </form>
</body>
</html>
```

☹文件上传必须是 post 请求

☹enctype 必须为 multipart/form-data， 该属性规定在发送到服务器之前应该如何对表单数据进行编码。

☹合同的 id 通过隐藏域传递

**D、在 pom.xml 文件中加入 FastDFS 客户端的 jar 包依赖**

```java
<dependency>
	<groupId>net.oschina.zcx7878</groupId>
	<artifactId>fastdfs-client-java</artifactId>
	<version>1.27.0.0</version>
</dependency>
```

**E、将 FastDFS 客户端的配置文件 fast_client.conf 拷贝到 resources 目录下**

**F、将原来我们封装的 FastDFS 类拷贝到 fastdfs 包下，修改其中的 file_upload 方法，定义一些参数**

```java
public static String[] fileUpload(byte[] fileBytes, String fileExt){
    String[] uploadArray = null;
    try {
        //1. 获取StorageClient对象
        StorageClient storageClient = getStorageClient();
        //2.上传文件  第一个参数：本地文件路径 第二个参数：上传文件的后缀 第三个参数：文件信息
        uploadArray = storageClient.upload_file(fileBytes,fileExt,null);
    } catch (IOException e) {
        e.printStackTrace();
    } catch (MyException e) {
        e.printStackTrace();
    } finally {
        closeFastDFS();
    }
    return uploadArray;
}
```

**G、在 CreditorController 中添加处理上传文件的方法**

```java
@PostMapping("/fastdfs/upload")
@ResponseBody
public String upload(@RequestParam("id") Integer id, @RequestParam("fileName")MultipartFile file) {
    // 原来文件上传是将文件写到本地或者远程服务器的某个目录下
    // 现在的文件上传是将文件上传到 fastdfs 文件服务器上
    // 1表示上传失败  0表示成功
    int result = 1;
    //abc.txt -->txt
    String fileExt = file.getOriginalFilename().substring(file.getOriginalFilename().indexOf(".") + 1);
    try {
        String[] uploadArray = FastDFSUtil.fileUpload(file.getBytes(), fileExt);
        if (uploadArray != null && uploadArray.length == 2) {
            // 文件上传到fastDFS成功  ,将合同文件路径更新到债权记录中
            CreditorInfo creditorInfo = new CreditorInfo();
            creditorInfo.setId(id);
            creditorInfo.setGroupName(uploadArray[0]);
            creditorInfo.setRemoteFilePath(uploadArray[1]);
            int updateRow = creditorInfoService.updateCreditorInfo(creditorInfo);
            if (updateRow > 0) {
                result = 0;
            }
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    return "<script>window.parent.uploadOK('" + result + ")</script>";
}
```

**H、在 CreditorInfoService 中添加 updateCreditorInfo 方法**

```java
int updateCreditorInfo(CreditorInfo creditorInfo);
```

**I、在 CreditorInfoServiceImpl 中添加 updateCreditorInfo 方法实现**

```java
@Override
public int updateCreditorInfo(CreditorInfo creditorInfo) {
    return creditorInfoMapper.updateCreditorInfo(creditorInfo);
}
```

**J、在 CreditorMapper 中定义方法 updateCreditorInfoById**

```java
int updateCreditorInfo(CreditorInfo creditorInfo);
```

**K、定义 mapper 中插入语句**

```java
<update id="updateCreditorInfo" parameterType="com.fancy.fastdfsweb.model.CreditorInfo">
    update  creditor_info set groupName ={groupName} , remoteFilePath ={remoteFilePath} where id ={id};
</update>
```

**L、在 upload.html 做一个类似 ajax 的页面不刷新效果**

在upload.html 页面中加一个 iframe。

将upload.html 页面中的 form 中的 target 设置为 iframe 的 name。

在iframe 的父页面中，写一个函数，处理上传结果。

```java
 <iframe name="uploadFrame" style="display: none;"></iframe>
 <script type="text/javascript" th:inline="javascript">
     function uploadOK(result){
         if(result == 0){
             //文件上传成功
             alert("文件上传成功");
             var contextPath = [[${
      request.getContextPath()}]];
             window.location.href = contextPath + "/fastdfs/index";
         }else{
             alert("文件上传失败");
         }
     }
 </script>
```

**M、如果上传文件超出了 1M，需要在 application.properties 中配置 SpringBoot 上传文件的最大限制**

### 3. 下载某一个债权合同

**A、修改 index.html 页面，下载加连接，并做判断**

```java
<span th:if="${creditorInfo.getGroupName() ne null && creditorInfo.getRemoteFilePath() ne null }">
   <a th:href="@{
      '/fastdfs/download?id=' + ${creditorInfo.id}}">下载</a>
</span>
```

**B、在 CreditorController 中，完成下载的请求**

☹ResponseEntity 通常用于返回文件流。

☹@ResponseBody 可以直接返回Json结果。

☹ResponseEntity 不仅可以返回 json 结果，还可以定义返回的 HttpHeaders 和 HttpStatus。

☹ResponseEntity 的优先级高于 @ResponseBody，在不是 @ResponseEntity 的情况下才去检查有没有 @ResponseBody 注解。如果响应类型是ResponseEntity 可以不写 @ResponseBody 注解，写了也没有关系。

```java
@GetMapping("/fastdfs/download")
public ResponseEntity<byte[]> download(@RequestParam("id") Integer id) {
    CreditorInfo creditorInfo = creditorInfoService.getAllCreditorInfo(id);
    String extName = creditorInfo.getRemoteFilePath().substring(creditorInfo.getRemoteFilePath().indexOf("."));
    byte[] fileBytes = FastDFSUtil.fileDownload(creditorInfo.getGroupName(), creditorInfo.getRemoteFilePath());
    HttpHeaders httpHeaders = new HttpHeaders();
    httpHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);//流类型
    httpHeaders.setContentDispositionFormData("attachment", System.currentTimeMillis() + extName);
    ResponseEntity<byte[]> responseEntity = new ResponseEntity<byte[]>(fileBytes, httpHeaders, HttpStatus.OK);
    return responseEntity;
}
```

**C、在 CreditorService 接口中添加 getCreditorInfoById 的方法**

```java
CreditorInfo getCreditorInfoById(Integer id);
```

**D、在 CreditorServiceImpl 中添加 getCreditorInfoById 方法的实现**

```java
@Override
public CreditorInfo getCreditorInfoById(Integer id) {
    return creditorInfoMapper.selectCreditorInfoById();
}
```

**E、定义 mapper 类及其配置文件 selectCreditorInfoById 方法**

**F、修改 FastDFS 类中 fileDown 方法的实现，传递参数**

```java
public static byte[] fileDownload(String groupName, String remoteFilePath){
    byte[] fileBytes = null;
    try {
        //1. 获取StorageClient对象
        StorageClient storageClient = getStorageClient();
        //2.下载文件 返回0表示成功，其它均表示失败
        fileBytes = storageClient.download_file(groupName, remoteFilePath);
    } catch (IOException e) {
        e.printStackTrace();
    } catch (MyException e) {
        e.printStackTrace();
    } finally {
        closeFastDFS();
    }
    return  fileBytes;
}
```

### 4. 删除某一个债权合同，使用 ajax 实现异步删除

**A、在 index.html 页面为删除加超链接**

```java
<a th:href="@{
      'javascript:deleteFile(' + ${creditorInfo.id} + ')'}">删除</a>
```

此超链接与删除放在同一个span中

**B、index.html 页面提供 js 方法，并发送 ajax 请求，对响应结果进行处理**

```java
<script type="text/javascript" th:inline="javascript">
    function deleteFile(id) {
        var contextPath = [[${
      request.getContextPath()}]];
        $.ajax({
            url:contextPath + "/fastdfs/fileDelete",
            type:"post",
            data:{
                "id" : id
            },
            success:function(responseMsg) {
                if (responseMsg == 0) {
                    alert("删除成功");
                    window.location.reload();
                } else {
                    alert("删除失败");
                }
            }
        });
    }
</script>
```

**C、在 CreditorController 中处理删除请求**

> 注意：删除 FastDFS 和清除数据库，所以我们将这些业务都放在 service 中进行事务的处理

```java
@RequestMapping("/fastdfs/fileDelete") 
@ResponseBody
public  String fileDelete(@RequestParam("id") Integer id) {
    int result = 1;
    try {
        result = creditorInfoService.deleteContract(id);
    } catch (Exception e) {
        e.printStackTrace();
    }
    return String.valueOf(result);
}
```

**D、在 CreditorService 接口中加删除合同的方法 deleteContract**

> 因为目前提供的方法，如果 group 和 remoteFilePath 为空就不更新，所以我们需要自己提供。

**E、在 CreditorServiceImpl 类中对 deleteContract 方法进行实现**

```java
@Override
@Transactional //加上该注解控制事务
public int deleteContract(Integer id) {
    int result = 1;
    //根据债权id获取债权信息
    CreditorInfo creditorInfo = creditorInfoMapper.selectCreditorInfoById(id);
    //注意：事务控制的数据库，所以我们先对数据库进行更新, 在操作FastDFS, 如果操作FastDFS失败了，那么对数据库的操作回滚
    int updateRow = creditorInfoMapper.updateContractById(id);
    if (updateRow > 0) {
        // 如果数据库更新, 那么删除 FastDFS 的文件
        if (updateRow > 0) {
            int num = FastDFSUtil.fileDelete(creditorInfo.getGroupName(), creditorInfo.getRemoteFilePath());
            if (num == 0) {
                result = 0;
            } else {
                throw new RuntimeException("FastDFS 文件删除失败");
            }
        }
    }
    return result;
}
```

**F、在 CreditorMapper 类中添加更新的方法**

```java
int updateContractById(Integer id);
```

**G、在 CreditorMapper.xml 中添加更新的方法**

```java
<update id="updateContractById" parameterType="java.lang.Integer">
    update creditor_info set  groupName = NULL, remoteFilePath = NULL where id ={id, jdbcType=INTEGER}
</update>
```

**H、修改 FastDFS 类中的 fileDelete 方法，提供参数**

```java
public static int fileDelete(String groupName, String remoteFilePath){
    int num = 1;
    try {
        //1. 获取StorageClient对象
        StorageClient storageClient = getStorageClient();
        //2.删除文件 返回0表示成功，其它均表示失败
        num = storageClient.delete_file(groupName, remoteFilePath);
    } catch (IOException e) {
        e.printStackTrace();
    } catch (MyException e) {
        e.printStackTrace();
    } finally {
        closeFastDFS();
    }
    return num;
}
```

**I、在 Application 类上开启事务支持**

然后在浏览器中进行测试即可

如果想要美化弹窗，推荐使用 弹层组件 layer，官网 ：[https://www.layui.com/](https://www.layui.com/)
