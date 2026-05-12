# Spring内置对多路上传的支持
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/37.html
- 分类：J2EE框架
- 分组：10、Spring的multipart（文件上传）支持
Spring内置对多路上传的支持，专门用于处理web应用中的文件上传。你可以通过注册一个可插拔的MultipartResolver对象来启用对文件多路上传的支持。该接口在定义于org.springframework.web.multipart包下。Spring为[一般的文件上传](http://jakarta.apache.org/commons/fileupload)提供了MultipartResolver接口的一个实现，为Servlet 3.0多路请求的转换提供了另一个实现。

默认情况下，Spring的多路上传支持是不开启的，因为有些开发者希望由自己来处理多路请求。如果想启用Spring的多路上传支持，你需要在web应用的上下文中添加一个多路传输解析器。每个进来的请求，解析器都会检查是不是一个多部分请求。若发现请求是完整的，则请求按正常流程被处理；如果发现请求是一个多路请求，则你在上下文中注册的MultipartResolver解析器会被用来处理该请求。之后，请求中的多路上传属性就与其他属性一样被正常对待了。【最后一句翻的不好，multipart翻译成多路还是多部分还在斟酌中。望阅读者注意此处。】
